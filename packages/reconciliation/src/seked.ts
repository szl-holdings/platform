/**
 * Seked Slope Audit — Primitive 12.
 *
 * Source: Rhind Mathematical Papyrus problems 56–60 (c. 1650 BCE).
 *
 * The seked is the Egyptian inverse-slope: horizontal palms per royal
 * cubit of vertical rise. One royal cubit = 7 palms.
 *
 *   seked = 7 · Δx / Δy
 *
 * Why this is useful for runtime: conventional slope dy/dx diverges to ∞
 * at vertical asymptotes (saturation points), which breaks alerting. The
 * seked is bounded (one cubit always = 7 palms, finite) and integer-friendly.
 * Useful when monitoring rate-of-change near saturation.
 */

const PALMS_PER_CUBIT = 7;

export interface SekedReading {
  readonly seked: number;
  readonly palms: number;
  readonly cubits: number;
  readonly verdict: "STABLE" | "RISING" | "SATURATING" | "VERTICAL";
}

/**
 * Compute the seked given a horizontal change Δx and a vertical change Δy.
 * Both arguments must be non-negative; rises are reported as positive seked.
 */
export function computeSeked(dx: number, dy: number): SekedReading {
  if (dy < 0 || dx < 0) {
    throw new Error("seked: dx and dy must both be non-negative");
  }
  if (dy === 0) {
    return {
      seked: Number.POSITIVE_INFINITY,
      palms: PALMS_PER_CUBIT,
      cubits: 0,
      verdict: "VERTICAL",
    };
  }
  const seked = (PALMS_PER_CUBIT * dx) / dy;
  let verdict: SekedReading["verdict"];
  if (seked >= 7) verdict = "STABLE";
  else if (seked >= 5) verdict = "RISING";
  else if (seked > 0) verdict = "SATURATING";
  else verdict = "VERTICAL";
  return { seked, palms: seked, cubits: 1, verdict };
}

/**
 * The Great Pyramid of Giza had a seked of approximately 5½ palms
 * (≈ 51.84° gradient). This constant is exposed for unit-test smoke
 * checks and historical reference.
 */
export const GREAT_PYRAMID_SEKED = 5.5;

/**
 * Compute the slope angle in degrees from a seked value. Inverse operation.
 */
export function sekedToDegrees(seked: number): number {
  if (!isFinite(seked) || seked <= 0) return 90;
  const radians = Math.atan(PALMS_PER_CUBIT / seked);
  return (radians * 180) / Math.PI;
}

/**
 * A rolling seked auditor. Useful for monitoring rate-of-change of any
 * runtime metric near saturation: byte-rate, error-rate, alert-rate.
 *
 * Records (dx, dy) samples and reports the latest seked plus drift.
 */
export class SekedAuditor {
  private readonly samples: { dx: number; dy: number }[] = [];
  constructor(private readonly windowSize: number = 32) {}

  record(dx: number, dy: number): SekedReading {
    this.samples.push({ dx, dy });
    if (this.samples.length > this.windowSize) this.samples.shift();
    return computeSeked(dx, dy);
  }

  windowSeked(): SekedReading {
    if (this.samples.length === 0) {
      return computeSeked(0, 0);
    }
    const dx = this.samples.reduce((a, s) => a + s.dx, 0);
    const dy = this.samples.reduce((a, s) => a + s.dy, 0);
    return computeSeked(dx, dy);
  }

  count(): number {
    return this.samples.length;
  }
}
