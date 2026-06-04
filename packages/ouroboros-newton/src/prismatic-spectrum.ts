/**
 * Primitive 43 — Prismatic spectrum decomposition.
 *
 * Source: Newton, Opticks (1704), Book I, Part I, Experiment 6 — the
 *   experimentum crucis. White light is a heterogeneous mixture; a prism
 *   does not modify rays, it merely separates them; recombination
 *   reproduces white light. Drafts at MS Add 3970.
 *
 * Computable form: every composite output must be decomposable into named
 * components and recombinable to within ε of the original. Reject outputs
 * whose recombination diverges.
 */

export interface SpectrumChannel {
  name: string;
  amplitude: number;
}

export interface SpectrumInput {
  artifactId: string;
  /** Composite signal (e.g., concatenated feature vector). */
  composite: number[];
  /** Decomposition basis: each row is a channel vector of same length as composite. */
  basis: SpectrumChannel[];
  basisVectors: number[][]; // length(basisVectors) == basis.length, each same length as composite
  /** Recombination tolerance (sum-of-squares). Default 1e-6. */
  tolerance?: number;
}

export type SpectrumVerdict =
  | "DECOMPOSED"
  | "RECOMBINATION_FAIL"
  | "BASIS_DIM_MISMATCH"
  | "BASIS_INCOMPLETE";

export interface SpectrumResult {
  artifactId: string;
  verdict: SpectrumVerdict;
  channels: SpectrumChannel[];
  recombinationError: number;
  reason: string;
}

export function decomposeSpectrum(input: SpectrumInput): SpectrumResult {
  const tol = input.tolerance ?? 1e-6;
  if (input.basis.length !== input.basisVectors.length) {
    return {
      artifactId: input.artifactId,
      verdict: "BASIS_DIM_MISMATCH",
      channels: [],
      recombinationError: NaN,
      reason: "basis and basisVectors length mismatch.",
    };
  }
  for (const v of input.basisVectors) {
    if (v.length !== input.composite.length) {
      return {
        artifactId: input.artifactId,
        verdict: "BASIS_DIM_MISMATCH",
        channels: [],
        recombinationError: NaN,
        reason: "basisVector length must equal composite length.",
      };
    }
  }
  // Project: amplitude_i = <composite, basisVector_i> / <basisVector_i, basisVector_i>
  const channels: SpectrumChannel[] = [];
  const reconstructed = new Array(input.composite.length).fill(0);
  for (let i = 0; i < input.basis.length; i++) {
    const v = input.basisVectors[i];
    let dot = 0,
      norm2 = 0;
    for (let k = 0; k < v.length; k++) {
      dot += v[k] * input.composite[k];
      norm2 += v[k] * v[k];
    }
    if (norm2 === 0) {
      return {
        artifactId: input.artifactId,
        verdict: "BASIS_INCOMPLETE",
        channels: [],
        recombinationError: NaN,
        reason: `Zero-norm basis vector for channel ${input.basis[i].name}.`,
      };
    }
    const amp = dot / norm2;
    channels.push({ name: input.basis[i].name, amplitude: amp });
    for (let k = 0; k < v.length; k++) reconstructed[k] += amp * v[k];
  }
  let err = 0;
  for (let k = 0; k < input.composite.length; k++) {
    const d = input.composite[k] - reconstructed[k];
    err += d * d;
  }
  err = Math.sqrt(err);
  if (err > tol) {
    return {
      artifactId: input.artifactId,
      verdict: "RECOMBINATION_FAIL",
      channels,
      recombinationError: err,
      reason: `Basis incomplete: recombination error ${err.toExponential(3)} > tol ${tol.toExponential(2)}.`,
    };
  }
  return {
    artifactId: input.artifactId,
    verdict: "DECOMPOSED",
    channels,
    recombinationError: err,
    reason: "Composite decomposed and recombined within tolerance (Newton experimentum crucis).",
  };
}
