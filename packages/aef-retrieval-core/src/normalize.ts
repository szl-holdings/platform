import type { BoostedHit } from "./boost.js";
import type { FusedHit } from "./fusion.js";

export interface NormalizedHit extends BoostedHit {
  normalizedScore: number;
}

export function normalizeScores(hits: BoostedHit[]): NormalizedHit[] {
  if (hits.length === 0) return [];

  const scores = hits.map((h) => h.boostedScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore;

  return hits.map((h) => ({
    ...h,
    normalizedScore:
      range === 0 ? 1.0 : (h.boostedScore - minScore) / range,
  }));
}

export function normalizeFusedScores(hits: FusedHit[]): Array<FusedHit & { normalizedScore: number }> {
  if (hits.length === 0) return [];

  const scores = hits.map((h) => h.fusedScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore;

  return hits.map((h) => ({
    ...h,
    normalizedScore:
      range === 0 ? 1.0 : (h.fusedScore - minScore) / range,
  }));
}
