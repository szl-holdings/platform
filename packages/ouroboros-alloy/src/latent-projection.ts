/**
 * Primitive 69 — Latent projection (multi-matrix factorization)
 *
 * Inspired by DeepSeek's MLA (Multi-Latent Attention) and Step3's MFA
 * (Multi-Matrix Factorization Attention): instead of materializing
 * full key/value matrices, project them into compressed latent
 * subspaces. Lifted: compress a high-dimensional claim into a low-
 * rank latent fingerprint with an explicit reconstruction error
 * bound. Two claims that share the same latent fingerprint within the
 * declared error tolerance can be treated as equivalent for the
 * purpose of caching, deduplication, or quorum.
 */

export interface ClaimVector {
  claimId: string;
  values: number[];
}

export interface LatentFingerprint {
  claimId: string;
  latent: number[]; // length k < values.length
  reconstructionError: number; // L2 between original and reconstruction
  rationale: string;
}

/**
 * Project a vector into a k-dimensional latent space using a
 * deterministic seeded basis (no randomness): the first k canonical
 * basis vectors. This is intentionally simple — we are NOT shipping
 * a learned projection; we are shipping the discipline that requires
 * one to be receipted.
 */
export function project(
  v: ClaimVector,
  k: number
): LatentFingerprint {
  if (k < 1) throw new Error("latent dim k must be >= 1");
  if (k > v.values.length) {
    throw new Error(`k ${k} exceeds vector length ${v.values.length}`);
  }
  const latent = v.values.slice(0, k);
  // reconstruction = pad with zeros to original length
  const recon = [...latent, ...new Array(v.values.length - k).fill(0)];
  let sse = 0;
  for (let i = 0; i < v.values.length; i++) {
    const d = v.values[i] - recon[i];
    sse += d * d;
  }
  const err = Math.sqrt(sse);
  return {
    claimId: v.claimId,
    latent,
    reconstructionError: err,
    rationale: `projected ${v.values.length}D → ${k}D, L2 error ${err.toFixed(4)}`,
  };
}

export interface EquivalenceCheck {
  a: string;
  b: string;
  cosine: number;
  equivalent: boolean;
  tolerance: number;
  rationale: string;
}

export function equivalent(
  a: LatentFingerprint,
  b: LatentFingerprint,
  tolerance: number
): EquivalenceCheck {
  if (a.latent.length !== b.latent.length) {
    throw new Error("fingerprint dims differ");
  }
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.latent.length; i++) {
    dot += a.latent[i] * b.latent[i];
    na += a.latent[i] * a.latent[i];
    nb += b.latent[i] * b.latent[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  const cosine = denom === 0 ? 0 : dot / denom;
  const eq = 1 - cosine <= tolerance;
  return {
    a: a.claimId,
    b: b.claimId,
    cosine,
    equivalent: eq,
    tolerance,
    rationale: eq
      ? `fingerprints equivalent: 1-cos ${(1 - cosine).toFixed(4)} <= tol ${tolerance}`
      : `fingerprints differ: 1-cos ${(1 - cosine).toFixed(4)} > tol ${tolerance}`,
  };
}
