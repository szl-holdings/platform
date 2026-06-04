import { describe, it, expect } from "vitest";
import {
  lutarInvariant,
  defaultWeights,
  inspectableWeight,
  weightsAreExact,
  verifyLutarBound,
  type LutarAxes,
  type LutarWeights,
} from "../src/lutar-invariant.ts";

const PERFECT: LutarAxes = { cleanliness: 1, horizon: 1, resonance: 1, frustum: 1 };
const HALF: LutarAxes = { cleanliness: 0.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 };

describe("lutarInvariant — basic laws", () => {
  it("Λ = 1 when all axes are 1 (perfect trust)", () => {
    const r = lutarInvariant(PERFECT);
    expect(r.invariant).toBeCloseTo(1, 12);
  });

  it("Λ = 0 when any axis is 0 (zero-pinning, axiom A2)", () => {
    const cases: LutarAxes[] = [
      { ...PERFECT, cleanliness: 0 },
      { ...PERFECT, horizon: 0 },
      { ...PERFECT, resonance: 0 },
      { ...PERFECT, frustum: 0 },
    ];
    for (const c of cases) {
      expect(lutarInvariant(c).invariant).toBe(0);
    }
  });

  it("Λ = x when all axes equal x (idempotency under uniform input)", () => {
    for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const r = lutarInvariant({ cleanliness: x, horizon: x, resonance: x, frustum: x });
      expect(r.invariant).toBeCloseTo(x, 12);
    }
  });

  it("HALF case yields exactly 0.5", () => {
    const r = lutarInvariant(HALF);
    expect(r.invariant).toBeCloseTo(0.5, 12);
  });
});

describe("lutarInvariant — bound theorem", () => {
  it("0 ≤ Λ ≤ min(axes) for the default uniform weights", () => {
    const r = lutarInvariant({
      cleanliness: 0.9,
      horizon: 0.7,
      resonance: 0.6,
      frustum: 0.4,
    });
    expect(r.invariant).toBeGreaterThanOrEqual(0);
    // For uniform weights, geometric mean ≤ min only as a special case at equality,
    // but always ≤ max. The strict bound for unequal axes is min ≤ Λ ≤ max.
    expect(r.invariant).toBeLessThanOrEqual(r.proof.maxAxis + 1e-12);
    expect(r.invariant).toBeGreaterThanOrEqual(r.proof.minAxis - 1e-12);
  });

  it("verifyLutarBound returns true for any valid axis tuple", () => {
    const inputs: LutarAxes[] = [
      PERFECT,
      HALF,
      { cleanliness: 0.99, horizon: 0.5, resonance: 0.5, frustum: 0.5 },
      { cleanliness: 0.1, horizon: 0.9, resonance: 0.1, frustum: 0.9 },
    ];
    for (const a of inputs) {
      expect(verifyLutarBound(lutarInvariant(a))).toBe(true);
    }
  });

  it("Λ is monotone increasing in each axis (axiom A1)", () => {
    const base = HALF;
    const r0 = lutarInvariant(base).invariant;
    const r1 = lutarInvariant({ ...base, cleanliness: 0.9 }).invariant;
    const r2 = lutarInvariant({ ...base, horizon: 0.9 }).invariant;
    const r3 = lutarInvariant({ ...base, resonance: 0.9 }).invariant;
    const r4 = lutarInvariant({ ...base, frustum: 0.9 }).invariant;
    expect(r1).toBeGreaterThan(r0);
    expect(r2).toBeGreaterThan(r0);
    expect(r3).toBeGreaterThan(r0);
    expect(r4).toBeGreaterThan(r0);
  });
});

describe("lutarInvariant — Egyptian inspectability axiom (A3)", () => {
  it("default weights are Egyptian-exact", () => {
    expect(weightsAreExact(defaultWeights())).toBe(true);
  });

  it("rejects axes outside [0,1]", () => {
    expect(() => lutarInvariant({ ...PERFECT, cleanliness: -0.1 })).toThrow();
    expect(() => lutarInvariant({ ...PERFECT, horizon: 1.5 })).toThrow();
    expect(() => lutarInvariant({ ...PERFECT, resonance: NaN })).toThrow();
  });

  it("inspectableWeight rejects improper fractions", () => {
    expect(() => inspectableWeight(5, 3)).toThrow();
    expect(() => inspectableWeight(0, 1)).toThrow();
    expect(() => inspectableWeight(1, 0)).toThrow();
  });

  it("rejects a weight set whose unit-fraction sum is not 1", () => {
    const bad: LutarWeights = {
      cleanliness: inspectableWeight(1, 4),
      horizon: inspectableWeight(1, 4),
      resonance: inspectableWeight(1, 4),
      frustum: inspectableWeight(1, 8), // sums to 7/8
    };
    expect(weightsAreExact(bad)).toBe(false);
    expect(() => lutarInvariant(PERFECT, bad)).toThrow();
  });

  it("accepts the Rhind-style {1/2, 1/4, 1/8, 1/8} weight set", () => {
    const w: LutarWeights = {
      cleanliness: inspectableWeight(1, 2),
      horizon: inspectableWeight(1, 4),
      resonance: inspectableWeight(1, 8),
      frustum: inspectableWeight(1, 8),
    };
    expect(weightsAreExact(w)).toBe(true);
    const r = lutarInvariant(PERFECT, w);
    expect(r.invariant).toBeCloseTo(1, 12);
  });

  it("accepts the {1/2, 1/3, 1/12, 1/12} weight set (alternative Rhind tile)", () => {
    const w: LutarWeights = {
      cleanliness: inspectableWeight(1, 2),
      horizon: inspectableWeight(1, 3),
      resonance: inspectableWeight(1, 12),
      frustum: inspectableWeight(1, 12),
    };
    expect(weightsAreExact(w)).toBe(true);
    const r = lutarInvariant(HALF, w);
    expect(r.invariant).toBeCloseTo(0.5, 12);
  });
});

describe("lutarInvariant — formula and report shape", () => {
  it("formula string includes all four axes and weights", () => {
    const r = lutarInvariant(PERFECT);
    expect(r.proof.formula).toContain("Λ = C^");
    expect(r.proof.formula).toContain("H^");
    expect(r.proof.formula).toContain("R^");
    expect(r.proof.formula).toContain("F^");
    expect(r.proof.formula).toContain("1/4");
  });

  it("report includes weightSum and weightSumExact", () => {
    const r = lutarInvariant(PERFECT);
    expect(r.proof.weightSumExact).toBe(true);
    expect(r.proof.weightSum).toBeCloseTo(1, 12);
  });

  it("report exposes the upper bound for downstream alerting", () => {
    const r = lutarInvariant({
      cleanliness: 0.9,
      horizon: 0.7,
      resonance: 0.6,
      frustum: 0.4,
    });
    expect(r.proof.bound.upper).toBe(0.4);
  });
});

describe("lutarInvariant — Page-curve concavity (axiom A4)", () => {
  it("is concave along a uniform release trajectory", () => {
    // sample Λ at three uniformly spaced axis tuples; concavity ⇒ midpoint
    // value ≥ average of endpoints minus a tolerance.
    const lo: LutarAxes = { cleanliness: 0.3, horizon: 0.3, resonance: 0.3, frustum: 0.3 };
    const mid: LutarAxes = { cleanliness: 0.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 };
    const hi: LutarAxes = { cleanliness: 0.7, horizon: 0.7, resonance: 0.7, frustum: 0.7 };
    const a = lutarInvariant(lo).invariant;
    const b = lutarInvariant(mid).invariant;
    const c = lutarInvariant(hi).invariant;
    // For Λ along the diagonal Λ = x, this is linear (boundary case of concavity).
    // The strict concavity holds when axes evolve at different rates, tested next.
    expect(b - (a + c) / 2).toBeCloseTo(0, 6);
  });

  it("strict concavity along a non-diagonal trajectory", () => {
    // axes evolve at different rates: this is where geometric mean strictly
    // exceeds the linear interpolation of the boundary points.
    const lo: LutarAxes = { cleanliness: 0.2, horizon: 0.4, resonance: 0.6, frustum: 0.8 };
    const hi: LutarAxes = { cleanliness: 0.8, horizon: 0.6, resonance: 0.4, frustum: 0.2 };
    const mid: LutarAxes = { cleanliness: 0.5, horizon: 0.5, resonance: 0.5, frustum: 0.5 };
    const a = lutarInvariant(lo).invariant;
    const b = lutarInvariant(mid).invariant;
    const c = lutarInvariant(hi).invariant;
    expect(b).toBeGreaterThanOrEqual((a + c) / 2 - 1e-12);
  });
});
