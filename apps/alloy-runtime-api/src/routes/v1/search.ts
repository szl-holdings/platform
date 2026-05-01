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
import { buildBM25Doc, runBM25Query } from '../../bm25.js';
import { runStore } from '../../store.js';

/**
 * Shared search-lane callable — builds BM25 docs from a raw corpus and runs
 * the keyword query. Exported so the evals lane can exercise the exact same
 * retrieval path over its fixture corpus rather than calling the BM25
 * primitives directly.
 */
export function buildAndSearchCorpus(
  corpus: Array<{ id: string; parts: string[]; metadata: Record<string, unknown> }>,
  query: string,
  topK: number,
  minScore = 0,
): Array<{ id: string; score: number; metadata: Record<string, unknown> }> {
  const docs = corpus.map(({ id, parts, metadata }) => buildBM25Doc(id, parts.filter(Boolean), metadata));
  return runBM25Query(docs, query, topK, minScore);
}

const router: IRouter = Router();

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
  const docs = runs.map((run) => {
    const parts: string[] = [
      run.runId,
      run.state ?? '',
      ...(Array.isArray(run.steps)
        ? run.steps
            .map((s) => [String(s.name ?? ''), String(s.state ?? '')])
            .flat()
        : []),
    ];
    // Include any string-valued metadata fields for richer matching
    const meta = run as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === 'string' && v.length < 500) parts.push(`${k}: ${v}`);
    }
    return buildBM25Doc(run.runId, parts.filter(Boolean), {
      runId: run.runId,
      status: run.state,
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

  // 4. BM25 scoring via shared helper
  const minScore = scoreThreshold ?? 0;
  const scored = runBM25Query(candidates, query, topK, minScore);

  const hits = scored.map(({ id, score, metadata }) => {
    const keywordScore = Math.round(score * 1000) / 1000;
    const statusPart = metadata['status'] ? ` — status: ${String(metadata['status'])}` : '';
    const textSnippet = `run: ${String(metadata['runId'] ?? id)}${statusPart}`;
    return {
      // AEF SearchHit required fields
      chunkId: id,
      sourceId: id,
      text: textSnippet,
      keywordScore,
      fusedScore: keywordScore,
      finalScore: keywordScore,
      boostApplied: false,
      metadata,
      // Provenance fields
      traceId,
      retrievalPath: [...KEYWORD_RETRIEVAL_PATH],
      sourceType: 'workflow_run',
    };
  });

  const processingMs = Date.now() - t0;

  // 5. AEF HybridSearchResponse envelope
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
