/**
 * Noise-model divergence witness.
 *
 * Re-expression of the *noise-learning* primitive from Chamberland et
 * al. (arXiv:2604.12841 §4): decoding weights can be inferred from
 * experimentally accessible syndrome statistics WITHOUT an explicit
 * circuit-level noise model. We absorb the discipline: a system that
 * depends on declared weights MUST also maintain a learned shadow
 * estimated from live data, and refuse to act on the declared model
 * when the two diverge beyond a fixed threshold.
 *
 * The divergence metric is **Jensen-Shannon divergence** over a
 * normalised discrete distribution on the union of supports.
 * Jensen-Shannon is:
 *   - symmetric (either direction can be informative — a caller cannot
 *     hide drift by picking the favourable side),
 *   - bounded in [0, ln 2] (gives stable threshold semantics — a
 *     tolerance of 0.05 is always a meaningful fraction of the worst
 *     case, no matter how disjoint the supports are),
 *   - zero-safe (does not blow up to NaN/Inf when one distribution has
 *     mass at a key the other does not — KL would).
 *
 * The legacy name `symmetricKL` is preserved as an alias so existing
 * callers don't break, but it dispatches to JSD now. JSD is the
 * direction-agnostic divergence the architect review called for.
 */

import {
  digestBody,
  makeRef,
  type IsingReceiptRef,
} from "./receipts.js";

export interface NoiseModelSnapshot {
  /** Non-negative weights keyed by failure-mode name. */
  readonly weights: Record<string, number>;
  /** Wall-clock the snapshot was taken. */
  readonly timestampMs: number;
}

/** Normalise a non-negative weight map into a probability distribution. */
function normalise(weights: Record<string, number>): Record<string, number> {
  let total = 0;
  for (const v of Object.values(weights)) {
    if (!Number.isFinite(v)) {
      throw new Error("noise-model: weights must be finite");
    }
    if (v < 0) {
      throw new Error("noise-model: weights must be non-negative");
    }
    total += v;
  }
  if (total <= 0) {
    throw new Error("noise-model: weights sum must be > 0");
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(weights)) {
    out[k] = v / total;
  }
  return out;
}

/** p·log(p/q) with the convention 0·log(0/anything) = 0. */
function klTerm(p: number, q: number): number {
  if (p === 0) return 0;
  // q > 0 is guaranteed by construction in JSD (m = (p+q)/2, and we only
  // call klTerm with q = m, so q = 0 ⇒ p = 0 which we've already handled).
  return p * Math.log(p / q);
}

/**
 * Jensen-Shannon divergence in nats, bounded in [0, ln 2].
 *
 *   JSD(p, q) = ½·KL(p ‖ m) + ½·KL(q ‖ m), where m = (p+q)/2
 *
 * Symmetric and zero-safe by construction: m is non-zero wherever
 * either p or q is non-zero, so KL(·‖m) never sees a zero denominator.
 */
export function jensenShannonDivergence(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const pa = normalise(a);
  const pb = normalise(b);
  const keys = new Set<string>([...Object.keys(pa), ...Object.keys(pb)]);
  let klPM = 0;
  let klQM = 0;
  for (const k of keys) {
    const p = pa[k] ?? 0;
    const q = pb[k] ?? 0;
    const m = (p + q) / 2;
    klPM += klTerm(p, m);
    klQM += klTerm(q, m);
  }
  const jsd = 0.5 * klPM + 0.5 * klQM;
  // Numerical floor: JSD is non-negative; clamp any tiny negative drift.
  return jsd < 0 ? 0 : jsd;
}

/**
 * Legacy alias preserved for callers that imported `symmetricKL`.
 * Dispatches to `jensenShannonDivergence`, which is symmetric AND
 * zero-safe — the original symmetric-KL implementation was neither
 * (it floored missing mass to ε, which silently inflated divergence
 * and could go non-finite on adversarial inputs).
 */
export const symmetricKL = jensenShannonDivergence;

export interface NoiseDivergenceWitness {
  readonly learnedRef: IsingReceiptRef;
  readonly declaredRef: IsingReceiptRef;
  readonly divergenceRef: IsingReceiptRef | null;
  /** Jensen-Shannon divergence in nats, bounded in [0, ln 2]. */
  readonly jsd: number;
  /**
   * @deprecated Field name retained for callers that destructured the
   * pre-Jensen-Shannon witness. Always equal to `jsd`. New code should
   * read `jsd`.
   */
  readonly klSym: number;
  readonly tolerance: number;
  readonly aligned: boolean;
}

/**
 * Compose learned + declared snapshots into a divergence witness.
 *
 * The receipt classes shipped are always:
 *   - `ising.noise.learned.v1` (the snapshot)
 *   - `ising.noise.declared.v1` (the snapshot)
 *   - `ising.noise.divergence.v1` (iff klSym > tolerance)
 *
 * No "aligned.v1" receipt is emitted in the green path — alignment is
 * the *absence* of a divergence receipt, mirroring the
 * `escalation.required.v1` discipline in the pre-decoder.
 */
export function composeNoiseDivergence(args: {
  learned: NoiseModelSnapshot;
  declared: NoiseModelSnapshot;
  /** Maximum acceptable Jensen-Shannon divergence (nats). Must be > 0. */
  tolerance: number;
}): NoiseDivergenceWitness {
  const { learned, declared, tolerance } = args;
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error("composeNoiseDivergence: tolerance must be > 0");
  }

  const learnedBody = {
    weights: learned.weights,
    timestampMs: learned.timestampMs,
  };
  const declaredBody = {
    weights: declared.weights,
    timestampMs: declared.timestampMs,
  };
  const learnedRef = makeRef("ising.noise.learned.v1", learnedBody);
  const declaredRef = makeRef("ising.noise.declared.v1", declaredBody);

  const jsd = jensenShannonDivergence(learned.weights, declared.weights);

  if (jsd <= tolerance) {
    return {
      learnedRef,
      declaredRef,
      divergenceRef: null,
      jsd,
      klSym: jsd,
      tolerance,
      aligned: true,
    };
  }

  const divergenceBody = {
    learnedDigest: digestBody(learnedBody),
    declaredDigest: digestBody(declaredBody),
    jsd,
    tolerance,
  };
  const divergenceRef = makeRef(
    "ising.noise.divergence.v1",
    divergenceBody,
  );

  return {
    learnedRef,
    declaredRef,
    divergenceRef,
    jsd,
    klSym: jsd,
    tolerance,
    aligned: false,
  };
}

/**
 * Hard-asserting wrapper for callers that want to refuse to proceed
 * on a stale declared model. Throws when divergence exceeds tolerance.
 * Returns the witness on the green path so the ref can be embedded
 * in the downstream action receipt.
 */
export function assertNoiseModelAligned(
  learned: NoiseModelSnapshot,
  declared: NoiseModelSnapshot,
  tolerance: number,
): NoiseDivergenceWitness {
  const witness = composeNoiseDivergence({ learned, declared, tolerance });
  if (!witness.aligned) {
    throw new Error(
      `assertNoiseModelAligned: JSD=${witness.jsd.toFixed(
        4,
      )} > tolerance=${tolerance} — refusing to act on declared noise model`,
    );
  }
  return witness;
}
