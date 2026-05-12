import { describe, expect, it } from "vitest";
import { residualAxis, residualFit } from "../src/residual-fit.ts";

/**
 * Deterministic pseudo-Gaussian generator for tests — Box–Muller from a
 * deterministic LCG. We avoid Math.random so tests are reproducible.
 */
function* lcg(seed: number): Generator<number> {
  let s = seed | 0;
  while (true) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    yield (s + 1) / 0x80000000;
  }
}

function gaussianSamples(n: number, seed = 42): number[] {
  const g = lcg(seed);
  const out: number[] = [];
  while (out.length < n) {
    const u1 = g.next().value as number;
    const u2 = g.next().value as number;
    const r = Math.sqrt(-2 * Math.log(u1));
    out.push(r * Math.cos(2 * Math.PI * u2));
    if (out.length < n) out.push(r * Math.sin(2 * Math.PI * u2));
  }
  return out;
}

describe("Gauß residual fit (Primitive 20)", () => {
  it("returns INSUFFICIENT for n < 8", () => {
    const r = residualFit([1, 2, 3]);
    expect(r.verdict).toBe("INSUFFICIENT");
    expect(residualAxis(r)).toBe(1);
  });

  it("recognises clean Gaussian residuals as GAUSSIAN", () => {
    const xs = gaussianSamples(400, 123);
    const r = residualFit(xs);
    expect(r.verdict).toBe("GAUSSIAN");
    expect(Math.abs(r.skewness)).toBeLessThan(0.5);
    expect(Math.abs(r.excessKurtosis)).toBeLessThan(0.7);
  });

  it("flags a uniform distribution as NON_GAUSSIAN", () => {
    const g = lcg(7);
    const xs: number[] = [];
    for (let i = 0; i < 400; i++) xs.push((g.next().value as number) - 0.5);
    const r = residualFit(xs);
    expect(r.verdict).toBe("NON_GAUSSIAN");
    expect(r.excessKurtosis).toBeLessThan(-0.3); // platykurtic
  });

  it("flags a heavily-skewed distribution as NON_GAUSSIAN (mean-corrected)", () => {
    const g = lcg(11);
    const raw: number[] = [];
    for (let i = 0; i < 400; i++) {
      const u = g.next().value as number;
      raw.push(-Math.log(u)); // Exponential(1), skewed right, mean ~1
    }
    // Subtract sample mean so the DRIFTING_MEAN gate doesn't fire first;
    // skewness/kurtosis are mean-invariant.
    const meanRaw = raw.reduce((a, b) => a + b, 0) / raw.length;
    const xs = raw.map((r) => r - meanRaw);
    const r = residualFit(xs);
    expect(r.verdict).toBe("NON_GAUSSIAN");
    expect(r.skewness).toBeGreaterThan(1.0);
  });

  it("flags a drifting mean as DRIFTING_MEAN", () => {
    const xs = gaussianSamples(400, 5).map((x) => x + 2.0); // mean ~2, σ ~1
    const r = residualFit(xs);
    expect(r.verdict).toBe("DRIFTING_MEAN");
    expect(residualAxis(r)).toBe(0);
  });

  it("residualAxis is in [0, 1]", () => {
    const r = residualFit(gaussianSamples(200, 3));
    const v = residualAxis(r);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("residualAxis approaches 1 for clean Gaussian residuals", () => {
    const r = residualFit(gaussianSamples(800, 999));
    expect(residualAxis(r)).toBeGreaterThan(0.5);
  });

  it("residualAxis approaches 0 for highly non-Gaussian residuals", () => {
    const g = lcg(31);
    const xs: number[] = [];
    for (let i = 0; i < 400; i++) xs.push((g.next().value as number) - 0.5);
    const r = residualFit(xs);
    // platykurtic uniform; check axis is small
    expect(residualAxis(r)).toBeLessThan(0.5);
  });

  it("rejects non-finite residuals", () => {
    const xs = gaussianSamples(20, 1);
    xs[0] = Number.NaN;
    expect(() => residualFit(xs)).toThrow();
  });

  it("reports stats fields with expected shape", () => {
    const xs = gaussianSamples(64, 17);
    const r = residualFit(xs);
    expect(typeof r.mean).toBe("number");
    expect(typeof r.sampleVariance).toBe("number");
    expect(typeof r.skewness).toBe("number");
    expect(typeof r.excessKurtosis).toBe("number");
    expect(typeof r.jarqueBera).toBe("number");
    expect(r.n).toBe(64);
  });
});
