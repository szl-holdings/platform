import { describe, it, expect } from "vitest";
import { gowersNorm } from "../src/gowers-norm.js";

const constOnes = (G: number): Array<[number, number]> =>
  Array.from({ length: G }, () => [1, 0] as [number, number]);

describe("Primitive 33 — Gowers norm gate", () => {
  it("flags constant function as STRUCTURED with norm 1", () => {
    const G = 8; // F_2^3
    const r = gowersNorm({
      domain: { p: 2, n: 3 },
      k: 2,
      values: constOnes(G),
    });
    expect(r.exact).toBe(true);
    expect(r.verdict).toBe("STRUCTURED");
    expect(r.norm).toBeCloseTo(1, 5);
  });

  it("flags a phase function e(linear) as STRUCTURED at U^2", () => {
    const p = 2;
    const n = 4;
    const G = 1 << n;
    // P(x) = x_0 (linear), values = e(P(x)/2) = (-1)^{x_0}
    const values: Array<[number, number]> = [];
    for (let i = 0; i < G; i++) {
      const x0 = i & 1;
      values.push([x0 === 0 ? 1 : -1, 0]);
    }
    const r = gowersNorm({ domain: { p, n }, k: 1, values });
    expect(r.verdict).toBe("STRUCTURED");
    expect(r.norm).toBeCloseTo(1, 5);
  });

  it("flags zero function as UNIFORM (norm 0)", () => {
    const G = 8;
    const zeros: Array<[number, number]> = Array.from({ length: G }, () => [0, 0]);
    const r = gowersNorm({ domain: { p: 2, n: 3 }, k: 2, values: zeros });
    expect(r.norm).toBe(0);
    expect(r.verdict).toBe("UNIFORM");
  });

  it("rejects mismatched value length", () => {
    expect(() =>
      gowersNorm({
        domain: { p: 2, n: 3 },
        k: 2,
        values: constOnes(7),
      }),
    ).toThrow();
  });

  it("falls back to ESTIMATED when domain too large", () => {
    const G = 1 << 13; // 8192, > maxExactDomain default 4096
    const values: Array<[number, number]> = Array.from({ length: G }, () => [0.5, 0]);
    const r = gowersNorm({
      domain: { p: 2, n: 13 },
      k: 2,
      values,
      maxExactDomain: 4096,
    });
    expect(r.verdict).toBe("ESTIMATED");
    expect(r.exact).toBe(false);
  });

  it("rejects k < 1", () => {
    expect(() =>
      gowersNorm({ domain: { p: 2, n: 3 }, k: 0, values: constOnes(8) }),
    ).toThrow();
  });
});
