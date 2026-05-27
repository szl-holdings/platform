/**
 * Memnet associative recall over the Reliquary catalog.
 *
 * A lightweight, dependency-free re-expression of the memnet
 * "store + recall by similarity" loop. We don't ship a vector store; instead
 * the recall score is a weighted blend of:
 *
 *   - lexicalScore   (Jaccard over normalised tokens of label + description
 *                     + selected metadata tags)
 *   - temporalScore  (exp-decay over (now - createdAt) with τ ≈ 30 days)
 *   - outcomeScore   (metadata.outcome === 'success'  → 1.0
 *                     metadata.outcome === 'mixed'    → 0.6
 *                     metadata.outcome === 'failure'  → 0.2
 *                     otherwise                       → 0.5)
 *
 *   recall = 0.55·lexical + 0.25·temporal + 0.20·outcome
 *
 * Returns top-k entries ordered by recall, plus a per-entry rationale that
 * downstream A11oy surfaces (TodaysBrief, ApprovalQueue) can render as a
 * "why this memory" hint.
 *
 * Source: docs/research/agi-stack-synthesis-2026.md §5 (memnet).
 */
import { db, reliquaryCatalogTable } from '@szl-holdings/db';
import { desc, eq, and } from 'drizzle-orm';

export interface MemnetRecallParams {
  query: string;
  artifactType?: string;
  limit?: number;
  /** ISO-millis epoch override for deterministic tests. */
  now?: number;
}

export interface MemnetRecallHit {
  contentHash: string;
  label: string;
  artifactType: string;
  createdAt: string;
  recallScore: number;
  lexicalScore: number;
  temporalScore: number;
  outcomeScore: number;
  rationale: string;
  metadata: Record<string, unknown>;
}

const TAU_MS = 30 * 24 * 60 * 60 * 1000;
const W_LEX = 0.55;
const W_TIME = 0.25;
const W_OUTCOME = 0.20;
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
  'was', 'were', 'be', 'with', 'by', 'as', 'at', 'this', 'that', 'it', 'from',
]);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function outcomeScore(metadata: Record<string, unknown>): number {
  const o = typeof metadata.outcome === 'string' ? metadata.outcome.toLowerCase() : '';
  if (o === 'success' || o === 'approved') return 1.0;
  if (o === 'mixed' || o === 'partial') return 0.6;
  if (o === 'failure' || o === 'denied') return 0.2;
  return 0.5;
}

function buildRationale(h: { lexicalScore: number; temporalScore: number; outcomeScore: number }): string {
  const parts: string[] = [];
  if (h.lexicalScore > 0.4) parts.push(`strong topical overlap (${(h.lexicalScore * 100).toFixed(0)}%)`);
  else if (h.lexicalScore > 0.15) parts.push(`partial topical overlap (${(h.lexicalScore * 100).toFixed(0)}%)`);
  if (h.temporalScore > 0.6) parts.push('recent');
  else if (h.temporalScore < 0.2) parts.push('older context');
  if (h.outcomeScore >= 0.9) parts.push('prior success');
  else if (h.outcomeScore <= 0.3) parts.push('prior failure — read carefully');
  return parts.length === 0 ? 'baseline associative match' : parts.join(' · ');
}

export async function memnetRecall(params: MemnetRecallParams): Promise<{
  hits: MemnetRecallHit[];
  rankSignature: string;
  weights: { lexical: number; temporal: number; outcome: number };
}> {
  const limit = Math.max(1, Math.min(params.limit ?? 8, 50));
  const now = params.now ?? Date.now();
  const queryTokens = tokens(params.query ?? '');

  const baseQuery = db
    .select({
      contentHash: reliquaryCatalogTable.contentHash,
      label: reliquaryCatalogTable.label,
      artifactType: reliquaryCatalogTable.artifactType,
      createdAt: reliquaryCatalogTable.createdAt,
      metadata: reliquaryCatalogTable.metadata,
      description: reliquaryCatalogTable.description,
    })
    .from(reliquaryCatalogTable)
    .orderBy(desc(reliquaryCatalogTable.createdAt))
    .limit(500);

  let rows: Array<{
    contentHash: unknown;
    label: unknown;
    artifactType: unknown;
    createdAt: unknown;
    metadata: unknown;
    description: unknown;
  }> = [];
  try {
    rows = await (params.artifactType
      ? baseQuery.where(and(eq(reliquaryCatalogTable.artifactType, params.artifactType)))
      : baseQuery);
  } catch (e) {
    const parts: string[] = [];
    let cur: unknown = e;
    for (let i = 0; i < 5 && cur; i++) {
      if (cur instanceof Error) {
        parts.push(cur.message);
        cur = (cur as { cause?: unknown }).cause;
      } else {
        parts.push(String(cur));
        break;
      }
    }
    const msg = parts.join(' :: ');
    if (/relation .* does not exist|no such table|undefined_table/i.test(msg)) {
      rows = [];
    } else {
      throw e;
    }
  }

  const hits: MemnetRecallHit[] = rows.map((r) => {
    const meta = (r.metadata as Record<string, unknown> | null) ?? {};
    const tagList = Array.isArray(meta.tags) ? meta.tags.filter((t): t is string => typeof t === 'string') : [];
    const corpus = [r.label, r.description ?? '', ...tagList].join(' ');
    const lex = jaccard(queryTokens, tokens(corpus));
    const createdMs = new Date(r.createdAt as unknown as string).getTime();
    const ageMs = Math.max(0, now - createdMs);
    const tScore = Math.exp(-ageMs / TAU_MS);
    const oScore = outcomeScore(meta);
    const recall = W_LEX * lex + W_TIME * tScore + W_OUTCOME * oScore;
    return {
      contentHash: r.contentHash as string,
      label: r.label as string,
      artifactType: r.artifactType as string,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(createdMs).toISOString(),
      recallScore: Number(recall.toFixed(4)),
      lexicalScore: Number(lex.toFixed(4)),
      temporalScore: Number(tScore.toFixed(4)),
      outcomeScore: oScore,
      rationale: buildRationale({ lexicalScore: lex, temporalScore: tScore, outcomeScore: oScore }),
      metadata: meta,
    };
  });

  hits.sort((a, b) => b.recallScore - a.recallScore);
  const top = hits.slice(0, limit);
  const sig = top.map((h) => `${h.contentHash.slice(0, 8)}:${h.recallScore}`).join('|');
  return {
    hits: top,
    rankSignature: sig,
    weights: { lexical: W_LEX, temporal: W_TIME, outcome: W_OUTCOME },
  };
}

export const MEMNET_RECALL_VERSION = '0.1.0' as const;
