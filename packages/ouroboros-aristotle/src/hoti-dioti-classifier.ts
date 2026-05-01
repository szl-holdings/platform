/**
 * Primitive 86 — Hoti / dioti proof classifier (τὸ ὅτι / τὸ διότι)
 *
 * Posterior Analytics I.13, 78a23–b3: the planet example. From "the
 * planets do not twinkle" we can conclude "they are near," but the
 * proof runs effect → cause and yields only the bare fact (hoti).
 * Reversing the middle term — "near things do not twinkle, planets
 * are near, therefore planets do not twinkle" — yields the reason-why
 * (dioti) and counts as scientific knowledge proper.
 *
 * The classifier inspects a syllogism (M, B, A) and checks whether
 * the middle term M is on the cause-side or the effect-side of the
 * causal relation between B and A.
 */

export interface Syllogism {
  conclusionPredicate: string; // A
  conclusionSubject: string;   // B
  middleTerm: string;          // M
  /** Adjacency list of the causal graph: cause → effect */
  causalGraph: Record<string, string[]>;
}

export type ProofGrade = "dioti" | "hoti" | "no-link";

export interface ProofClassification {
  grade: ProofGrade;
  reason: string;
}

function reaches(graph: Record<string, string[]>, from: string, to: string, seen = new Set<string>()): boolean {
  if (from === to) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  for (const next of graph[from] ?? []) {
    if (reaches(graph, next, to, seen)) return true;
  }
  return false;
}

export function hotiDiotiClassifier(syl: Syllogism): ProofClassification {
  const { conclusionPredicate: A, conclusionSubject: B, middleTerm: M, causalGraph: g } = syl;
  // dioti: M causes A (M → ... → A) AND B has M
  const mCausesA = reaches(g, M, A);
  const aCausesM = reaches(g, A, M);

  if (mCausesA && !aCausesM) {
    return { grade: "dioti", reason: "middle term is the cause; proof gives the reason-why" };
  }
  if (aCausesM && !mCausesA) {
    return { grade: "hoti", reason: "middle term is downstream of conclusion; proof gives only the fact" };
  }
  if (!mCausesA && !aCausesM) {
    return { grade: "no-link", reason: "no causal path between middle term and conclusion predicate" };
  }
  // Cycle: both directions reach. Treat as no-link conservatively.
  return { grade: "no-link", reason: "causal graph cycles between middle term and conclusion" };
}
