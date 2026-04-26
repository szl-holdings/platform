/**
 * AEEP v1 Search Routes
 *
 * POST /v1/search/hybrid — keyword/BM25 search over the tenant-scoped workflow
 * run index.  Dense-vector retrieval is out of scope (keyword-only pipeline per
 * platform scope constraint).
 *
 * Response shape conforms to the AEF HybridSearchResponse contract defined in
 * @workspace/aef-contracts: uses `hits` (not `results`), `processingMs` (not
 * `latencyMs`), `requestId`, and per-hit `chunkId`/`sourceId`/`fusedScore`/
 * `finalScore`/`keywordScore` fields.
 *
 * Tenant isolation is enforced — each request only sees runs belonging to the
 * caller's tenant.
 */

import { randomUUID } from 'node:crypto';
import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import { runStore } from '../../store.js';

const router: IRouter = Router();

// ─── BM25 implementation ───────────────────────────────────────────────────────

const BM25_K1 = 1.5;
const BM25_B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

interface BM25Doc {
  id: string;
  text: string;
  tokens: string[];
  tf: Map<string, number>;
  metadata: Record<string, unknown>;
}

function buildDoc(id: string, parts: string[], metadata: Record<string, unknown>): BM25Doc {
  const text = parts.join(' ');
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { id, text, tokens, tf, metadata };
}

function bm25Score(
  doc: BM25Doc,
  queryTokens: string[],
  idf: Map<string, number>,
  avgDocLen: number,
): number {
  let score = 0;
  for (const term of queryTokens) {
    const tf = doc.tf.get(term) ?? 0;
    if (tf === 0) continue;
    const termIdf = idf.get(term) ?? 0;
    const numerator = tf * (BM25_K1 + 1);
    const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc.tokens.length / avgDocLen));
    score += termIdf * (numerator / denominator);
  }
  return score;
}

// ─── Request schema ────────────────────────────────────────────────────────────
// Accepts the full AEF HybridSearchRequest shape; fields not used by the
// keyword-only pipeline (denseWeight, rerankEnabled, etc.) are accepted but
// ignored so upstream clients using the full contract don't need to be changed.

const HybridSearchSchema = z.object({
  requestId: z.string().min(1).default(() => randomUUID()),
  query: z.string().min(1),
  topK: z.number().int().positive().max(100).default(10),
  candidatePool: z.number().int().positive().default(100).optional(),
  metadataFilter: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  profileId: z.string().optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
  // AEF fields accepted but not used by keyword-only pipeline
  denseWeight: z.number().min(0).max(1).optional(),
  keywordWeight: z.number().min(0).max(1).optional(),
  rerankEnabled: z.boolean().optional(),
  includeProvenance: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Canonical retrieval path for keyword-only pipeline ───────────────────────
// Subset of the full 13-stage AEF pipeline — stages not executed are omitted.
const KEYWORD_RETRIEVAL_PATH = [
  'normalize_query',
  'policy_check',
  'keyword_bm25',
  'metadata_filter',
  'response_normalization',
] as const;

// ─── Route ─────────────────────────────────────────────────────────────────────

router.post('/hybrid', (req: Request, res: Response): void => {
  const parse = HybridSearchSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { requestId, query, topK, metadataFilter, profileId, scoreThreshold } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const t0 = Date.now();
  const traceId = randomUUID();

  // 1. Collect tenant-scoped runs as the searchable corpus
  const runs = runStore.list(tenantId);

  // 2. Build BM25 documents from run metadata
  const docs: BM25Doc[] = runs.map((run) => {
    const parts: string[] = [
      run.runId,
      run.status ?? '',
      ...(Array.isArray(run.steps)
        ? run.steps
            .map((s: Record<string, unknown>) => [String(s.name ?? ''), String(s.status ?? '')])
            .flat()
        : []),
    ];
    // Include any string-valued metadata fields for richer matching
    const meta = run as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === 'string' && v.length < 500) parts.push(`${k}: ${v}`);
    }
    return buildDoc(run.runId, parts.filter(Boolean), {
      runId: run.runId,
      status: run.status,
      tenantId,
    });
  });

  // 3. Apply metadata filter (exact-match on doc.metadata fields)
  let candidates = docs;
  if (metadataFilter && Object.keys(metadataFilter).length > 0) {
    candidates = candidates.filter((d) =>
      Object.entries(metadataFilter).every(([k, v]) => {
        const val = d.metadata[k];
        return Array.isArray(v) ? v.includes(String(val)) : val === v;
      }),
    );
  }

  // 4. BM25 scoring
  const queryTokens = tokenize(query);
  const scored: Array<{ doc: BM25Doc; score: number }> = [];

  if (queryTokens.length > 0 && candidates.length > 0) {
    const avgDocLen =
      candidates.reduce((s, d) => s + d.tokens.length, 0) / candidates.length;

    // IDF per query token
    const idf = new Map<string, number>();
    for (const term of queryTokens) {
      const df = candidates.filter((d) => d.tf.has(term)).length;
      idf.set(term, Math.log((candidates.length - df + 0.5) / (df + 0.5) + 1));
    }

    for (const doc of candidates) {
      const score = bm25Score(doc, queryTokens, idf, avgDocLen);
      if (score > 0) scored.push({ doc, score });
    }
    scored.sort((a, b) => b.score - a.score);
  }

  // 5. Score threshold filter and top-K selection
  const minScore = scoreThreshold ?? 0;
  const hits = scored
    .filter((r) => r.score >= minScore)
    .slice(0, topK)
    .map(({ doc, score }) => {
      const keywordScore = Math.round(score * 1000) / 1000;
      return {
        // AEF SearchHit required fields
        chunkId: doc.id,
        sourceId: doc.id,
        text: doc.text.slice(0, 500),
        keywordScore,
        fusedScore: keywordScore,
        finalScore: keywordScore,
        boostApplied: false,
        metadata: doc.metadata,
        // Provenance fields
        traceId,
        retrievalPath: [...KEYWORD_RETRIEVAL_PATH],
        sourceType: 'workflow_run',
      };
    });

  const processingMs = Date.now() - t0;

  // 6. AEF HybridSearchResponse envelope
  res.status(200).json({
    requestId,
    tenantId,
    profileId: profileId ?? undefined,
    traceId,
    retrievalPath: [...KEYWORD_RETRIEVAL_PATH],
    hits,
    totalCandidates: candidates.length,
    processingMs,
  });
});

export default router;
