import { describe, it, expect } from "vitest";
import {
  lutarInvariant6,
  lutarInvariant7,
  lutarInvariant8,
  lutarInvariant9,
  verifyLutarBoundN,
} from "../src/lutar-invariant-9.js";

const fullAxes6 = {
  cleanliness: 0.95,
  horizon: 0.9,
  resonance: 0.85,
  frustum: 0.8,
  gaussClosure: 0.9,
  invariance: 0.92,
};
const fullAxes7 = { ...fullAxes6, moralGrounding: 0.7 };
const fullAxes8 = { ...fullAxes7, ontologicalGrounding: 0.66 };
const fullAxes9 = { ...fullAxes8, measurabilityHonesty: 1.0 };

describe("Lutar Invariant — Λ₆ through Λ₉", () => {
  it("Λ₆ computes a value within [min, max] of axes (AM-GM bound)", () => {
    const r = lutarInvariant6(fullAxes6);
    const vals = Object.values(fullAxes6);
    expect(r.weightSumExact).toBe(true);
    expect(r.invariant).toBeGreaterThanOrEqual(Math.min(...vals) - 1e-9);
    expect(r.invariant).toBeLessThanOrEqual(Math.max(...vals) + 1e-9);
    expect(r.formula).toContain("Λ₆");
  });

  it("Λ₇ admits the M axis from Oppenheimer ledger", () => {
    const r = lutarInvariant7(fullAxes7);
    expect(r.axesUsed).toContain("moralGrounding");
    expect(r.formula).toContain("M");
    expect(verifyLutarBoundN(r)).toBe(true);
  });

  it("Λ₈ admits the B axis from Socrates divided line", () => {
    const r = lutarInvariant8(fullAxes8);
    expect(r.axesUsed).toContain("ontologicalGrounding");
    expect(r.formula).toContain("B");
  });

  it("Λ₉ admits the N axis from Lara non-measurability honesty", () => {
    const r = lutarInvariant9(fullAxes9);
    expect(r.axesUsed).toContain("measurabilityHonesty");
    expect(r.formula).toContain("N");
    expect(r.weight).toBeCloseTo(1 / 9, 5);
  });

  it("zero on any axis pins invariant to 0", () => {
    const r = lutarInvariant9({ ...fullAxes9, measurabilityHonesty: 0 });
    expect(r.invariant).toBe(0);
  });

  it("monotone: raising any axis raises Λ", () => {
    const lo = lutarInvariant9({ ...fullAxes9, frustum: 0.5 });
    const hi = lutarInvariant9({ ...fullAxes9, frustum: 0.9 });
    expect(hi.invariant).toBeGreaterThan(lo.invariant);
  });

  it("rejects out-of-range axes", () => {
    expect(() =>
      lutarInvariant6({ ...fullAxes6, cleanliness: 1.5 }),
    ).toThrow();
  });

  it("verifyLutarBoundN holds across forms", () => {
    expect(verifyLutarBoundN(lutarInvariant6(fullAxes6))).toBe(true);
    expect(verifyLutarBoundN(lutarInvariant7(fullAxes7))).toBe(true);
    expect(verifyLutarBoundN(lutarInvariant8(fullAxes8))).toBe(true);
    expect(verifyLutarBoundN(lutarInvariant9(fullAxes9))).toBe(true);
  });

  it("all-ones gives Λ = 1", () => {
    const ones = {
      cleanliness: 1,
      horizon: 1,
      resonance: 1,
      frustum: 1,
      gaussClosure: 1,
      invariance: 1,
      moralGrounding: 1,
      ontologicalGrounding: 1,
      measurabilityHonesty: 1,
    };
    expect(lutarInvariant9(ones).invariant).toBeCloseTo(1, 9);
  });

  it("Λ₉ honours AM-GM: min ≤ Λ ≤ max", () => {
    const r9 = lutarInvariant9(fullAxes9);
    const vals = Object.values(fullAxes9);
    expect(r9.invariant).toBeGreaterThanOrEqual(Math.min(...vals) - 1e-9);
    expect(r9.invariant).toBeLessThanOrEqual(Math.max(...vals) + 1e-9);
  });
});
