/**
 * Primitive 39 — Solve-et-Coagula gate
 *
 * Hermetic instruction: "separate the earth from the fire,
 * the subtle from the gross." Both phases must be logged:
 * (1) solve — decomposition into named parts
 * (2) coagula — recombination into a whole
 * If either phase is missing, the operation is rejected.
 * If the recombined whole disagrees with the original beyond
 * tolerance, an honest residue is logged.
 */

export interface SolveCoagulaInput {
  whole: number;
  parts: number[];           // result of solve
  recombined: number;        // result of coagula
}

export interface SolveCoagulaReceipt {
  partsSum: number;
  solveResidue: number;       // whole - sum(parts)
  coagulaResidue: number;     // recombined - whole
  tolerance: number;
  bothPhasesPresent: boolean;
  closes: boolean;
  rationale: string;
}

export function runSolveCoagula(
  input: SolveCoagulaInput,
  tolerance = 1e-9,
): SolveCoagulaReceipt {
  const bothPhasesPresent = input.parts.length > 0;
  const partsSum = input.parts.reduce((a, b) => a + b, 0);
  const solveResidue = input.whole - partsSum;
  const coagulaResidue = input.recombined - input.whole;
  const closes =
    bothPhasesPresent &&
    Math.abs(solveResidue) <= tolerance &&
    Math.abs(coagulaResidue) <= tolerance;
  const rationale = !bothPhasesPresent
    ? "rejected: solve phase missing (no parts logged)"
    : closes
    ? "solve and coagula both close within tolerance"
    : "honest residue logged: separation or recombination did not close";
  return {
    partsSum,
    solveResidue,
    coagulaResidue,
    tolerance,
    bothPhasesPresent,
    closes,
    rationale,
  };
}
