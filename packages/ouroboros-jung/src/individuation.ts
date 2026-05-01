/**
 * Primitive 46 — Individuation ledger
 *
 * Jung's individuation: the sequence of stages by which a self
 * becomes whole. Operationalised as a monotone-progress ledger:
 * stages are ordered, every advance carries a witness, and
 * regressions are logged honestly rather than hidden.
 */

export const INDIVIDUATION_STAGES = [
  "persona",
  "shadow-encounter",
  "anima-animus",
  "self-recognition",
  "wholeness",
] as const;

export type IndividuationStage = typeof INDIVIDUATION_STAGES[number];

export interface IndividuationEvent {
  stage: IndividuationStage;
  witness: string;
  timestamp: string;
}

export interface IndividuationReport {
  stagesReached: IndividuationStage[];
  monotone: boolean;     // never regressed
  regressions: { from: IndividuationStage; to: IndividuationStage }[];
  highest: IndividuationStage | null;
}

function rank(s: IndividuationStage): number {
  return INDIVIDUATION_STAGES.indexOf(s);
}

export function summariseIndividuation(
  events: IndividuationEvent[],
): IndividuationReport {
  const stagesReached: IndividuationStage[] = [];
  const regressions: IndividuationReport["regressions"] = [];
  let highestRank = -1;
  let highest: IndividuationStage | null = null;

  for (const ev of events) {
    if (!ev.witness || ev.witness.trim() === "") {
      throw new Error(`stage ${ev.stage} requires a non-empty witness`);
    }
    const r = rank(ev.stage);
    stagesReached.push(ev.stage);
    if (r >= highestRank) {
      highestRank = r;
      highest = ev.stage;
    } else {
      regressions.push({ from: highest!, to: ev.stage });
    }
  }
  return {
    stagesReached,
    monotone: regressions.length === 0,
    regressions,
    highest,
  };
}
