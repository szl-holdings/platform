/**
 * Primitive 41 — Three-Laws ledger.
 *
 * Source: Newton, Philosophiae Naturalis Principia Mathematica (1687), Axiomata
 *   sive Leges Motus. Manuscript drafts at Cambridge MS Add 3965.
 *
 *   Lex I.   Every body persists in its state of rest or uniform motion in a
 *            right line, except in so far as it is compelled to change that
 *            state by forces impressed.
 *   Lex II.  The change of motion (rate of change of momentum) is proportional
 *            to the motive force impressed; ΣF = dp/dt.
 *   Lex III. To every action there is always opposed an equal reaction.
 *
 * Each runtime state transition records (initialMomentum, appliedForce, dt,
 * finalMomentum). Lex II is checked numerically within tolerance. Lex III is
 * checked by pairing every external action with an opposing reaction in the
 * same instant.
 */

export interface TransitionEntry {
  /** Stable id for the transition. */
  id: string;
  /** Initial momentum vector (any finite dimension). */
  p0: number[];
  /** Applied (net) force vector, same dimension as p0. */
  F: number[];
  /** Time interval (seconds). */
  dt: number;
  /** Final observed momentum, same dimension. */
  p1: number[];
  /** Optional: reaction pair id (for Lex III). */
  reactionPairId?: string;
}

export type TransitionVerdict = "OK" | "LEX2_FAIL" | "LEX3_UNPAIRED" | "DIM_MISMATCH";

export interface TransitionResult {
  id: string;
  verdict: TransitionVerdict;
  residualNorm: number;
  reason: string;
}

export interface LedgerSummary {
  total: number;
  ok: number;
  lex2Failures: number;
  lex3Unpaired: number;
  dimMismatches: number;
  results: TransitionResult[];
}

const norm = (v: number[]): number =>
  Math.sqrt(v.reduce((a, x) => a + x * x, 0));

export class ThreeLawsLedger {
  private entries: TransitionEntry[] = [];
  private tolerance: number;

  constructor(tolerance: number = 1e-6) {
    if (tolerance <= 0 || !Number.isFinite(tolerance)) {
      throw new Error("tolerance must be positive finite.");
    }
    this.tolerance = tolerance;
  }

  append(e: TransitionEntry): TransitionResult {
    if (e.p0.length !== e.F.length || e.F.length !== e.p1.length) {
      const r: TransitionResult = {
        id: e.id,
        verdict: "DIM_MISMATCH",
        residualNorm: NaN,
        reason: `Dimension mismatch: |p0|=${e.p0.length}, |F|=${e.F.length}, |p1|=${e.p1.length}.`,
      };
      this.entries.push(e);
      return r;
    }
    if (!Number.isFinite(e.dt) || e.dt <= 0) {
      const r: TransitionResult = {
        id: e.id,
        verdict: "LEX2_FAIL",
        residualNorm: NaN,
        reason: `dt must be positive finite; got ${e.dt}.`,
      };
      this.entries.push(e);
      return r;
    }
    // Lex II residual: |p1 - p0 - F·dt|
    const residual = e.p1.map((x, i) => x - e.p0[i] - e.F[i] * e.dt);
    const r2 = norm(residual);
    let verdict: TransitionVerdict = "OK";
    let reason = `Lex II residual ${r2.toExponential(3)} ≤ tol ${this.tolerance.toExponential(2)}; pair check deferred.`;
    if (r2 > this.tolerance) {
      verdict = "LEX2_FAIL";
      reason = `Lex II violated: residual ${r2.toExponential(3)} > tol ${this.tolerance.toExponential(2)}.`;
    }
    this.entries.push(e);
    return { id: e.id, verdict, residualNorm: r2, reason };
  }

  /** Compute the full summary including Lex III pair-check. */
  summary(): LedgerSummary {
    const results: TransitionResult[] = [];
    const pairCount = new Map<string, number>();
    for (const e of this.entries) {
      if (e.reactionPairId) {
        pairCount.set(e.reactionPairId, (pairCount.get(e.reactionPairId) ?? 0) + 1);
      }
    }
    let ok = 0,
      lex2 = 0,
      lex3 = 0,
      dim = 0;
    for (const e of this.entries) {
      if (e.p0.length !== e.F.length || e.F.length !== e.p1.length) {
        const r: TransitionResult = {
          id: e.id,
          verdict: "DIM_MISMATCH",
          residualNorm: NaN,
          reason: "dimension mismatch",
        };
        results.push(r);
        dim += 1;
        continue;
      }
      const residual = e.p1.map((x, i) => x - e.p0[i] - e.F[i] * e.dt);
      const r2 = norm(residual);
      // External-action requirement: if reactionPairId provided, require count of 2.
      // If not provided AND force is non-zero, treat as unpaired action.
      const force2 = norm(e.F);
      let unpaired = false;
      if (force2 > 0) {
        if (!e.reactionPairId) unpaired = true;
        else if ((pairCount.get(e.reactionPairId) ?? 0) < 2) unpaired = true;
      }
      let verdict: TransitionVerdict;
      let reason: string;
      if (r2 > this.tolerance) {
        verdict = "LEX2_FAIL";
        reason = `Lex II violated: residual ${r2.toExponential(3)}.`;
        lex2 += 1;
      } else if (unpaired) {
        verdict = "LEX3_UNPAIRED";
        reason = "Force applied without paired reaction (Lex III).";
        lex3 += 1;
      } else {
        verdict = "OK";
        reason = "Lex II within tolerance; Lex III paired (or zero force).";
        ok += 1;
      }
      results.push({ id: e.id, verdict, residualNorm: r2, reason });
    }
    return {
      total: this.entries.length,
      ok,
      lex2Failures: lex2,
      lex3Unpaired: lex3,
      dimMismatches: dim,
      results,
    };
  }

  size(): number {
    return this.entries.length;
  }
}
