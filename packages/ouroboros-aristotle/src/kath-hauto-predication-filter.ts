/**
 * Primitive 85 — Kath' hauto predication filter (καθ' αὑτό)
 *
 * Posterior Analytics I.4, 73a34–b16: a scientific demonstration's
 * premises must connect predicate to subject either:
 *   per-se-1: A is in the essential definition of B
 *   per-se-2: B is in the essential definition of A (A disjunctively
 *             co-extensive with B's genus)
 *   per-se-accidens (kath' hauto sumbebêkos): A follows necessarily
 *             from B's per-se properties within the genus
 *
 * Merely accidental predication (kata sumbebêkos — "the man is pale")
 * cannot appear as a proof premise.
 */

export type PerSeKind = "per-se-1" | "per-se-2" | "per-se-accidens" | "accidental";

export interface PredicationStep {
  predicate: string;
  subject: string;
  /** What the asserter claims the predication kind to be */
  declaredKind: PerSeKind;
  /** Definitions the verifier can check against */
  subjectEssentialDefinition?: string[];
  predicateEssentialDefinition?: string[];
  /** When declaredKind === "per-se-accidens", a necessity witness within the genus */
  necessityWitness?: string;
}

export interface PredicationResult {
  ok: boolean;
  kind: PerSeKind;
  reason: string;
}

export function kathHautoFilter(step: PredicationStep): PredicationResult {
  const subjEss = step.subjectEssentialDefinition ?? [];
  const predEss = step.predicateEssentialDefinition ?? [];

  // Verify per-se-1: predicate appears in subject's essence
  if (subjEss.includes(step.predicate)) {
    return { ok: true, kind: "per-se-1", reason: "predicate is in subject's essential definition" };
  }
  // Verify per-se-2: subject appears in predicate's essence
  if (predEss.includes(step.subject)) {
    return { ok: true, kind: "per-se-2", reason: "subject is in predicate's essential definition" };
  }
  // Verify per-se-accidens
  if (step.declaredKind === "per-se-accidens") {
    if (step.necessityWitness && step.necessityWitness.length > 0) {
      return { ok: true, kind: "per-se-accidens", reason: "necessity witness supplied" };
    }
    return {
      ok: false,
      kind: "accidental",
      reason: "per-se-accidens declared but no necessity witness — falls back to accidental",
    };
  }
  return {
    ok: false,
    kind: "accidental",
    reason: "predication is merely accidental (kata sumbebêkos) — not admissible as proof premise",
  };
}
