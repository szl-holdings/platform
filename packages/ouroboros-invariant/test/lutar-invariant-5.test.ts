import { describe, expect, it } from "vitest";
import {
  defaultWeights5,
  inspectableWeight,
  lutarInvariant5,
  type LutarWeights5,
  verifyLutarBound5,
  weightsAreExact5,
} from "../src/lutar-invariant.ts";

describe("Lutar Invariant v2 — 5-axis with Gauß closure", () => {
  const axes = (c: number, h: number, r: number, f: number, g: number) => ({
    cleanliness: c,
    horizon: h,
    resonance: r,
    frustum: f,
    gaussClosure: g,
  });

  it("default weights are Egyptian-exact and each equal 1/5", () => {
    const w = defaultWeights5();
    expect(weightsAreExact5(w)).toBe(true);
    expect(w.cleanliness.value).toBeCloseTo(0.2, 12);
    expect(w.gaussClosure.terms).toEqual([5]);
  });

  it("zero on the new axis pins Λ₅ to 0", () => {
    const r = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0));
    expect(r.invariant).toBe(0);
  });

  it("all axes = 1 gives Λ₅ = 1", () => {
    const r = lutarInvariant5(axes(1, 1, 1, 1, 1));
    expect(r.invariant).toBeCloseTo(1, 12);
  });

  it("symmetric axes recover the geometric mean", () => {
    const r = lutarInvariant5(axes(0.5, 0.5, 0.5, 0.5, 0.5));
    expect(r.invariant).toBeCloseTo(0.5, 12);
  });

  it("realistic axes: thesis values + new G ≈ 0.9 give Λ₅ ≈ 0.886", () => {
    const r = lutarInvariant5(axes(0.88, 0.85, 0.88, 0.93, 0.9));
    expect(r.invariant).toBeGreaterThan(0.87);
    expect(r.invariant).toBeLessThan(0.9);
  });

  it("monotonic in the new axis", () => {
    const lo = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.5)).invariant;
    const hi = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.99)).invariant;
    expect(hi).toBeGreaterThan(lo);
  });

  it("bound theorem holds: min ≤ Λ₅ ≤ max ≤ 1", () => {
    for (const aa of [
      axes(0.5, 0.6, 0.7, 0.8, 0.9),
      axes(0.99, 0.1, 0.99, 0.99, 0.99),
      axes(0.4, 0.4, 0.4, 0.4, 0.4),
    ]) {
      const r = lutarInvariant5(aa);
      expect(verifyLutarBound5(r)).toBe(true);
    }
  });

  it("rejects out-of-range axes", () => {
    expect(() => lutarInvariant5(axes(1.1, 0.9, 0.9, 0.9, 0.9))).toThrow();
    expect(() => lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, -0.1))).toThrow();
    expect(() => lutarInvariant5(axes(NaN, 0.9, 0.9, 0.9, 0.9))).toThrow();
  });

  it("custom weights summing to 1 exactly are accepted (Rhind 2/n compatible)", () => {
    // 1/3 + 1/4 + 1/6 + 1/6 + 1/12 = ? 4/12 + 3/12 + 2/12 + 2/12 + 1/12 = 12/12 = 1
    const weights: LutarWeights5 = {
      cleanliness: inspectableWeight(1, 3),
      horizon: inspectableWeight(1, 4),
      resonance: inspectableWeight(1, 6),
      frustum: inspectableWeight(1, 6),
      gaussClosure: inspectableWeight(1, 12),
    };
    expect(weightsAreExact5(weights)).toBe(true);
    const r = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.9), weights);
    expect(r.invariant).toBeCloseTo(0.9, 9);
  });

  it("rejects non-exact weights", () => {
    // 1/4 four times + 1/8 = 9/8, not 1.
    const bad: LutarWeights5 = {
      cleanliness: inspectableWeight(1, 4),
      horizon: inspectableWeight(1, 4),
      resonance: inspectableWeight(1, 4),
      frustum: inspectableWeight(1, 4),
      gaussClosure: inspectableWeight(1, 8),
    };
    expect(() => lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.9), bad)).toThrow();
  });

  it("formula string includes G^(1/5)", () => {
    const r = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.9));
    expect(r.proof.formula).toContain("G^(1/5)");
  });

  it("downward bound: Λ₅ ≤ Λ when adding a worse axis", () => {
    // The 4-axis Λ ≈ 0.9; if we add a 0.5 G axis, Λ₅ should drop below 0.9.
    const r = lutarInvariant5(axes(0.9, 0.9, 0.9, 0.9, 0.5));
    expect(r.invariant).toBeLessThan(0.9);
  });
});
