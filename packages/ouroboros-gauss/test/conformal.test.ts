import { describe, expect, it } from "vitest";
import {
  checkConformal,
  conformalAxis,
  estimateJacobian,
} from "../src/conformal.ts";

describe("Gauß conformal projection check (Primitive 18)", () => {
  it("identifies a pure rotation as CONFORMAL with scale 1", () => {
    const theta = Math.PI / 7;
    const J = {
      dudx: Math.cos(theta),
      dudy: -Math.sin(theta),
      dvdx: Math.sin(theta),
      dvdy: Math.cos(theta),
    };
    const r = checkConformal(J);
    expect(r.verdict).toBe("CONFORMAL");
    expect(r.scaleFactor).toBeCloseTo(1, 12);
    expect(r.conformalDefect).toBeLessThan(1e-9);
  });

  it("identifies a uniform scaling as CONFORMAL", () => {
    const J = { dudx: 3, dudy: 0, dvdx: 0, dvdy: 3 };
    const r = checkConformal(J);
    expect(r.verdict).toBe("CONFORMAL");
    expect(r.scaleFactor).toBeCloseTo(3, 12);
  });

  it("identifies a similarity (rotation × scale) as CONFORMAL", () => {
    const theta = 0.4;
    const k = 2.5;
    const J = {
      dudx: k * Math.cos(theta),
      dudy: -k * Math.sin(theta),
      dvdx: k * Math.sin(theta),
      dvdy: k * Math.cos(theta),
    };
    const r = checkConformal(J);
    expect(r.verdict).toBe("CONFORMAL");
    expect(r.scaleFactor).toBeCloseTo(k, 12);
  });

  it("flags a non-uniform scaling as NON_CONFORMAL", () => {
    const J = { dudx: 2, dudy: 0, dvdx: 0, dvdy: 1 };
    const r = checkConformal(J);
    expect(r.verdict).toBe("NON_CONFORMAL");
    expect(r.conformalDefect).toBeGreaterThan(0.05);
  });

  it("flags a shear as NON_CONFORMAL", () => {
    const J = { dudx: 1, dudy: 1, dvdx: 0, dvdy: 1 };
    const r = checkConformal(J);
    expect(r.verdict).toBe("NON_CONFORMAL");
  });

  it("flags a reflection (det J < 0) — still conformal in unsigned sense", () => {
    // Anti-conformal map: u = x, v = -y. Cauchy–Riemann second equation fails.
    const J = { dudx: 1, dudy: 0, dvdx: 0, dvdy: -1 };
    const r = checkConformal(J);
    // CR1 = 1 − (−1) = 2, big defect — should land NON_CONFORMAL.
    expect(r.verdict).toBe("NON_CONFORMAL");
    expect(r.determinant).toBe(-1);
  });

  it("returns DEGENERATE for a zero Jacobian", () => {
    const J = { dudx: 0, dudy: 0, dvdx: 0, dvdy: 0 };
    const r = checkConformal(J);
    expect(r.verdict).toBe("DEGENERATE");
    expect(conformalAxis(r)).toBe(0);
  });

  it("rejects non-finite entries", () => {
    expect(() =>
      checkConformal({ dudx: NaN, dudy: 0, dvdx: 0, dvdy: 1 }),
    ).toThrow();
  });

  it("conformalAxis returns ~1 for CONFORMAL", () => {
    const J = { dudx: 2, dudy: 0, dvdx: 0, dvdy: 2 };
    expect(conformalAxis(checkConformal(J))).toBeCloseTo(1, 9);
  });

  it("conformalAxis returns 0 for DEGENERATE", () => {
    expect(
      conformalAxis(checkConformal({ dudx: 0, dudy: 0, dvdx: 0, dvdy: 0 })),
    ).toBe(0);
  });

  it("estimateJacobian recovers the Jacobian of an analytic map", () => {
    // f(z) = z² → u = x²−y², v = 2xy.
    // J at (1, 1) = [[2, -2], [2, 2]].
    const J = estimateJacobian(
      (x, y) => [x * x - y * y, 2 * x * y],
      1,
      1,
      1e-4,
    );
    expect(J.dudx).toBeCloseTo(2, 6);
    expect(J.dudy).toBeCloseTo(-2, 6);
    expect(J.dvdx).toBeCloseTo(2, 6);
    expect(J.dvdy).toBeCloseTo(2, 6);
  });

  it("estimated Jacobian of f(z)=z² is conformal everywhere except origin", () => {
    const J = estimateJacobian((x, y) => [x * x - y * y, 2 * x * y], 0.7, 0.3, 1e-5);
    expect(checkConformal(J).verdict).toBe("CONFORMAL");
  });

  it("estimateJacobian rejects bad h", () => {
    expect(() => estimateJacobian((x, y) => [x, y], 0, 0, 0)).toThrow();
    expect(() => estimateJacobian((x, y) => [x, y], 0, 0, -1)).toThrow();
  });
});
