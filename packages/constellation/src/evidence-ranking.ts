/**
 * Evidence Ranking — score and sort evidence attached to graph edges.
 *
 * Ranking factors:
 *  1. Confidence score (0–1) from the evidence record.
 *  2. Recency: more-recently recorded evidence ranks higher.
 *  3. Source priority: API and agent-derived evidence outranks manual entry.
 */

export interface EvidenceItem {
  id: string;
  edgeId: string;
  evidenceType: string;
  confidence: number;
  recordedAt: string;
  sourceType?: string;
  payload?: Record<string, unknown>;
}

export interface RankedEvidence extends EvidenceItem {
  score: number;
  rank: number;
}

const SOURCE_PRIORITY: Record<string, number> = {
  api: 1.0,
  agent: 0.95,
  feed: 0.9,
  import: 0.8,
  webhook: 0.85,
  system: 0.75,
  manual: 0.6,
  seed: 0.5,
};

const RECENCY_HALF_LIFE_DAYS = 30;

/**
 * Compute a recency weight in [0, 1] that decays with time.
 * The weight is 1.0 at `now` and 0.5 at RECENCY_HALF_LIFE_DAYS.
 */
function recencyWeight(recordedAt: string, now = Date.now()): number {
  const ageMs = now - new Date(recordedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return 0.5 ** (ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Rank a list of evidence items. Returns them sorted best-first with a
 * composite `score` and 1-based `rank` attached to each.
 */
export function rankEvidence(
  evidence: EvidenceItem[],
  weights = { confidence: 0.5, recency: 0.3, source: 0.2 },
  now = Date.now(),
): RankedEvidence[] {
  const scored = evidence.map((e) => {
    const sourcePriority = SOURCE_PRIORITY[e.sourceType ?? 'system'] ?? 0.7;
    const recency = recencyWeight(e.recordedAt, now);
    const score =
      weights.confidence * e.confidence +
      weights.recency * recency +
      weights.source * sourcePriority;

    return { ...e, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((e, idx) => ({ ...e, rank: idx + 1 }));
}

/**
 * Return the single best piece of evidence from a list, or null if empty.
 */
export function topEvidence(evidence: EvidenceItem[], now = Date.now()): RankedEvidence | null {
  const ranked = rankEvidence(evidence, undefined, now);
  return ranked[0] ?? null;
}
