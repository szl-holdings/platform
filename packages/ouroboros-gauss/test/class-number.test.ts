import { describe, expect, it } from "vitest";
import { classNumber, classNumberAxis } from "../src/class-number.ts";

describe("Gauß form class number h(d) (Primitive 19)", () => {
  it.each([
    // Canonical Gauß / Heegner numbers — h(d) = 1 (imaginary quadratic)
    [-3, 1],
    [-4, 1],
    [-7, 1],
    [-8, 1],
    [-11, 1],
    [-19, 1],
    [-43, 1],
    [-67, 1],
    [-163, 1], // Heegner, the largest |d| with h = 1
  ])("h(%i) = %i (Heegner / class-one)", (d, expected) => {
    expect(classNumber(d).classNumber).toBe(expected);
  });

  it.each([
    [-15, 2],
    [-20, 2],
    [-24, 2],
    [-23, 3],
    [-31, 3],
    [-71, 7],
    [-47, 5],
  ])("h(%i) = %i (canonical class-number table)", (d, expected) => {
    expect(classNumber(d).classNumber).toBe(expected);
  });

  it("returns the principal form (1, 0, |d|/4) for d ≡ 0 (mod 4)", () => {
    const r = classNumber(-20);
    expect(r.reducedForms).toContainEqual([1, 0, 5]);
  });

  it("returns the principal form (1, 1, (1−d)/4) for d ≡ 1 (mod 4)", () => {
    const r = classNumber(-23);
    expect(r.reducedForms).toContainEqual([1, 1, 6]);
  });

  it("rejects positive discriminants", () => {
    expect(() => classNumber(5)).toThrow();
    expect(() => classNumber(0)).toThrow();
  });

  it("rejects discriminants not ≡ 0 or 1 (mod 4)", () => {
    expect(() => classNumber(-2)).toThrow();
    expect(() => classNumber(-5)).toThrow(); // -5 ≡ 3 (mod 4)
  });

  it("rejects non-integers", () => {
    expect(() => classNumber(-4.5)).toThrow();
  });

  it("rejects very large |d| out of supported range", () => {
    expect(() => classNumber(-1e10)).toThrow();
  });

  it("classNumberAxis = 1 when h = 1", () => {
    expect(classNumberAxis(classNumber(-163))).toBe(1);
  });

  it("classNumberAxis decays as h grows", () => {
    const a1 = classNumberAxis(classNumber(-15));  // h=2
    const a2 = classNumberAxis(classNumber(-71));  // h=7
    expect(a1).toBeGreaterThan(a2);
  });

  it("classNumberAxis stays in [0, 1]", () => {
    const a = classNumberAxis(classNumber(-71), 2);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it("classNumberAxis rejects bad ceiling", () => {
    expect(() => classNumberAxis(classNumber(-3), 0)).toThrow();
  });
});
