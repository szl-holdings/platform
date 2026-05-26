/**
 * NPMR Cosmology (Thesis v11) — operational module.
 *
 * v11 is an additive *documentary* layer on top of v10. It does NOT
 * introduce a new physical L-term and does NOT extend the Lutar family
 * (the v9 chain remains the closed family on the 5-simplex; v10 is the
 * audit closure operator over that chain).
 *
 * What v11 contributes operationally is a single dimensionless coupling
 * coefficient — κ₁₁ — that quantifies how transparently an idea
 * propagates across the equator of the five-stratum cross-section
 * described in `docs/thesis/v11-npmr.md` §3 (AUO / LCS / NPMR_N₁ /
 * PMR / PMR sub-surface).
 *
 * κ₁₁ is built from three observable primitives — drawn from the
 * standardgalactic `01 — How Ideas Work` synthesis cited in the
 * canonical doc — and computed from inputs the operator supplies. No
 * defaults pretend to be measurements; the only defaults are the
 * advisory healthy-band edges, which are explicitly labelled as
 * convention, not empirical claim.
 *
 * Author: Stephen Lutar / SZL Consulting Ltd
 */

// ---------------------------------------------------------------------------
// Five-stratum cross-section (v11-npmr.md §3.2)
// ---------------------------------------------------------------------------

export interface NpmrStratum {
  /** Position from outermost (0 = AUO) to innermost (4 = PMR sub-surface). */
  index: 0 | 1 | 2 | 3 | 4;
  /** Three-name correspondence: Campbell / Andean / Operational. */
  names: {
    campbell: string;
    andean: string;
    operational: string;
  };
  /** One-line role of the stratum in the cosmology. */
  role: string;
}

export const NPMR_STRATA: readonly NpmrStratum[] = Object.freeze([
  {
    index: 0,
    names: {
      campbell: "AUO — Absolute Unbounded Oneness",
      andean: "Hanan Pacha (upper world)",
      operational: "ungoverned substrate",
    },
    role: "Pre-distinction field; the codex's hermetic 'One Thing'.",
  },
  {
    index: 1,
    names: {
      campbell: "LCS — Larger Consciousness System",
      andean: "Kay Pacha-as-totality (the lived world held whole)",
      operational: "shared semantic space",
    },
    role: "First differentiated layer; the medium ideas travel through.",
  },
  {
    index: 2,
    names: {
      campbell: "NPMR_N₁ — Non-Physical MR, branch 1",
      andean: "the realm Amaru ascends from",
      operational: "policy-as-written (intent)",
    },
    role: "Upper face of the equator — where ideas are declared.",
  },
  {
    index: 3,
    names: {
      campbell: "PMR — Physical Matter Reality",
      andean: "Kay Pacha (this world)",
      operational: "policy-as-enforced (production)",
    },
    role: "Lower face of the equator — where ideas land or fail to.",
  },
  {
    index: 4,
    names: {
      campbell: "PMR sub-surface — entropic floor",
      andean: "Uku Pacha (inner/lower world)",
      operational: "audit trail / receipts",
    },
    role: "Where what was enforced is recorded and reviewed.",
  },
] as const);

/** Edges that idea-propagation primitives ride. */
export const NPMR_EDGES: readonly { from: number; to: number; primitive: string }[] =
  Object.freeze([
    { from: 2, to: 3, primitive: "partial-match carrier" },
    { from: 3, to: 4, primitive: "loss as coupling" },
    { from: 1, to: 2, primitive: "uptake-surface > channel" },
  ] as const);

export interface NpmrCrossSection {
  schemaVersion: "v11-npmr/1";
  strata: readonly NpmrStratum[];
  edges: readonly { from: number; to: number; primitive: string }[];
  equator: { upper: number; lower: number; note: string };
  source: string;
}

export function crossSection(): NpmrCrossSection {
  return {
    schemaVersion: "v11-npmr/1",
    strata: NPMR_STRATA,
    edges: NPMR_EDGES,
    equator: {
      upper: 2,
      lower: 3,
      note:
        "Amaru is the ouroboros laid along the N₁↔PMR equator: " +
        "the strait where intent becomes enforcement.",
    },
    source: "docs/thesis/v11-npmr.md §3",
  };
}

// ---------------------------------------------------------------------------
// κ₁₁ — Coupling Coefficient across the equator (v11-npmr.md §5)
// ---------------------------------------------------------------------------

/**
 * Inputs are pure operator-supplied observations. No defaults pose as
 * measurements; only the advisory band edges are conventional.
 */
export interface Kappa11Input {
  /**
   * Carrier fidelity input (NPMR_N₁ → PMR). The set of policy/intent
   * identifiers declared (`written`) and the set actually enforced in
   * production (`enforced`). Fidelity = |enforced ∩ written| / |written|.
   */
  carrier: {
    written: readonly string[];
    enforced: readonly string[];
  };
  /**
   * Uptake-surface > channel input (LCS → N₁). Channel width is what
   * the sender broadcasts; uptake-surface width is what the receiver
   * can actually accept. Ratio is capped at 1 (a wider surface than
   * channel doesn't make the channel itself any wider).
   */
  uptake: {
    channelWidth: number; // > 0, same units as surfaceWidth
    surfaceWidth: number; // ≥ 0
  };
  /**
   * Loss-as-coupling input (PMR → sub-surface). A non-empty sample of
   * per-event loss magnitudes from the audit trail. Coherence is
   * 1 / (1 + CV²), CV = stddev/mean — bounded to [0, 1], where 1 is
   * a perfectly coherent loss channel (low relative dispersion) and
   * values near 0 indicate noise dominates signal.
   */
  loss: {
    samples: readonly number[]; // each ≥ 0, mean > 0
  };
  /**
   * Optional advisory band. Defaults are convention, NOT measurement:
   * a κ below `lower` suggests the strata have collapsed (governance
   * is invisible); a κ above `upper` suggests the equator is opaque
   * (governance is unenforced). Operators should calibrate to their
   * own baseline.
   */
  healthyBand?: { lower: number; upper: number };
}

export interface Kappa11Result {
  kappa11: number;
  components: {
    carrierFidelity: number;
    uptakeRatio: number;
    lossCoherence: number;
  };
  healthyBand: { lower: number; upper: number };
  bandVerdict: "below_band" | "in_band" | "above_band";
  interpretation: string;
  formula: string;
  source: string;
}

/**
 * Advisory band — labelled conventions, not measurements. Operators are
 * expected to override with project-specific calibration.
 */
export const DEFAULT_KAPPA11_BAND = Object.freeze({ lower: 0.1, upper: 0.6 });

const KAPPA11_FORMULA =
  "κ₁₁ = 1 − carrierFidelity · uptakeRatio · lossCoherence; " +
  "carrierFidelity = |enforced ∩ written| / |written|; " +
  "uptakeRatio = min(1, surfaceWidth / channelWidth); " +
  "lossCoherence = 1 / (1 + (σ/μ)²)";

function ensure(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

export function computeKappa11(input: Kappa11Input): Kappa11Result {
  ensure(
    Array.isArray(input.carrier?.written) && input.carrier.written.length > 0,
    "carrier.written must be a non-empty array of policy ids",
  );
  ensure(
    Array.isArray(input.carrier?.enforced),
    "carrier.enforced must be an array of policy ids",
  );
  ensure(
    Number.isFinite(input.uptake?.channelWidth) && input.uptake.channelWidth > 0,
    "uptake.channelWidth must be a positive finite number",
  );
  ensure(
    Number.isFinite(input.uptake?.surfaceWidth) && input.uptake.surfaceWidth >= 0,
    "uptake.surfaceWidth must be a non-negative finite number",
  );
  ensure(
    Array.isArray(input.loss?.samples) && input.loss.samples.length > 0,
    "loss.samples must be a non-empty array",
  );
  ensure(
    input.loss.samples.every((s) => Number.isFinite(s) && s >= 0),
    "loss.samples must be non-negative finite numbers",
  );

  // Carrier fidelity.
  const written = new Set(input.carrier.written);
  const enforced = new Set(input.carrier.enforced);
  let hit = 0;
  for (const w of written) if (enforced.has(w)) hit += 1;
  const carrierFidelity = hit / written.size;

  // Uptake ratio (cap at 1 — a wider surface doesn't widen the channel).
  const uptakeRatio = Math.min(
    1,
    input.uptake.surfaceWidth / input.uptake.channelWidth,
  );

  // Loss coherence.
  const n = input.loss.samples.length;
  const mean = input.loss.samples.reduce((a, b) => a + b, 0) / n;
  ensure(mean > 0, "loss.samples mean must be > 0 to compute coherence");
  const variance =
    input.loss.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const cv2 = variance / (mean * mean);
  const lossCoherence = 1 / (1 + cv2);

  const product = carrierFidelity * uptakeRatio * lossCoherence;
  const kappa11 = 1 - product;

  const band = input.healthyBand ?? DEFAULT_KAPPA11_BAND;
  ensure(
    Number.isFinite(band.lower) &&
      Number.isFinite(band.upper) &&
      band.lower >= 0 &&
      band.upper <= 1 &&
      band.lower < band.upper,
    "healthyBand must satisfy 0 ≤ lower < upper ≤ 1",
  );

  let bandVerdict: Kappa11Result["bandVerdict"];
  let interpretation: string;
  if (kappa11 < band.lower) {
    bandVerdict = "below_band";
    interpretation =
      "κ₁₁ below band — N₁ and PMR have effectively collapsed; " +
      "governance is invisible (everything written is enforced with no friction). " +
      "Likely cause: audit/policy boundary missing or trivially satisfied.";
  } else if (kappa11 > band.upper) {
    bandVerdict = "above_band";
    interpretation =
      "κ₁₁ above band — the equator is opaque; ideas do not land. " +
      "Policy-as-written is decoupled from policy-as-enforced. " +
      "Likely cause: policy drift, missing enforcement, or noise-dominated loss channel.";
  } else {
    bandVerdict = "in_band";
    interpretation =
      "κ₁₁ within healthy band — the equator is permeable but not collapsed. " +
      "Ideas propagate with the productive friction the v11 cosmology predicts.";
  }

  return {
    kappa11,
    components: { carrierFidelity, uptakeRatio, lossCoherence },
    healthyBand: { lower: band.lower, upper: band.upper },
    bandVerdict,
    interpretation,
    formula: KAPPA11_FORMULA,
    source: "docs/thesis/v11-npmr.md §5 (κ₁₁ coupling coefficient)",
  };
}
