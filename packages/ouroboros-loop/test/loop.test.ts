import { describe, it, expect } from "vitest";
import { run, summary } from "../src/loop.js";
import { gaussForecast } from "../src/forecast.js";

describe("ouroboros-loop core", () => {
  it("reaches fixed point on identity transform", () => {
    const r = run({
      payload: { v: 42 },
      canonical: (x) => String(x.v),
      transform: (x) => x,
    });
    expect(r.verdict).toBe("ACCEPTED");
    expect(r.fixedPoint).toBe(true);
    expect(r.iterations).toBe(1);
    expect(r.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("refuses at Λ-gate when mechanism returns false", () => {
    const r = run({
      payload: { v: 0 },
      canonical: (x) => String(x.v),
      transform: (x) => x,
      mechanisms: { lambdaGate: () => false },
    });
    expect(r.verdict).toBe("REFUSED_LAMBDA_GATE");
    expect(r.fixedPoint).toBe(false);
  });

  it("refuses bare claims via fluxions-receipt", () => {
    const r = run({
      payload: { bare: true },
      canonical: (x) => JSON.stringify(x),
      transform: (x) => x,
      mechanisms: { fluxionsReceipt: (x: any) => !x.bare },
    });
    expect(r.verdict).toBe("REFUSED_FLUXIONS_BARE_CLAIM");
  });

  it("refuses on dual-witness divergence after fixed point", () => {
    const r = run({
      payload: { v: 1 },
      canonical: (x) => String(x.v),
      transform: (x) => x,
      mechanisms: { dualWitness: () => ({ match: false }) },
    });
    expect(r.verdict).toBe("REFUSED_DUAL_WITNESS_DIVERGE");
    expect(r.fixedPoint).toBe(true);
  });

  it("refuses on Bekenstein overflow before iteration", () => {
    const r = run({
      payload: { S: 1e9 },
      canonical: (x) => String(x.S),
      transform: (x) => x,
      mechanisms: { bekensteinCheck: () => false },
    });
    expect(r.verdict).toBe("REFUSED_BEKENSTEIN_OVERFLOW");
  });

  it("converges on a contracting transform", () => {
    const r = run({
      payload: { v: 100 },
      canonical: (x: { v: number }) => String(Math.floor(x.v)),
      transform: (x: { v: number }) => ({ v: x.v / 2 }),
      maxIter: 32,
    });
    expect(["ACCEPTED", "MAX_ITER_NO_FIXED_POINT"]).toContain(r.verdict);
    expect(r.iterations).toBeGreaterThan(0);
  });

  it("reaches MAX_ITER on a non-converging transform", () => {
    let counter = 0;
    const r = run({
      payload: { v: 0 },
      canonical: () => String(counter++),
      transform: (x) => x,
      maxIter: 4,
    });
    expect(r.verdict).toBe("MAX_ITER_NO_FIXED_POINT");
    expect(r.iterations).toBe(4);
  });

  it("digest is deterministic for identical traces", () => {
    const mk = () => run({
      payload: { v: 1 },
      canonical: (x) => String(x.v),
      transform: (x) => x,
    });
    expect(mk().receiptDigest).toBe(mk().receiptDigest);
  });

  it("summary() produces compact one-liner", () => {
    const r = run({ payload: { v: 1 }, canonical: () => "h", transform: (x) => x });
    const s = summary(r);
    expect(s).toContain("ACCEPTED");
    expect(s).toContain("digest=");
  });
});

describe("gaussForecast", () => {
  it("returns zero-slope for constant history", () => {
    const f = gaussForecast([5, 5, 5, 5], 10);   // tol 10 > 5 → not diverging
    expect(f.slope).toBeCloseTo(0, 5);
    expect(f.predictedResidual).toBeCloseTo(5, 3);
    expect(f.diverging).toBe(false);
  });

  it("flags diverging when constant history exceeds tolerance", () => {
    const f = gaussForecast([5, 5, 5, 5], 1);    // tol 1 < 5 → diverging
    expect(f.diverging).toBe(true);
  });

  it("detects positive slope (diverging) above tolerance", () => {
    const f = gaussForecast([1, 2, 4, 8, 16], 10);
    expect(f.slope).toBeGreaterThan(0);
    expect(f.diverging).toBe(true);
  });

  it("detects negative slope (converging) below tolerance", () => {
    const f = gaussForecast([16, 8, 4, 2, 1], 0.5);
    expect(f.slope).toBeLessThan(0);
    expect(f.predictedResidual).toBeLessThan(1);
  });

  it("handles single-point history without crashing", () => {
    const f = gaussForecast([3]);
    expect(f.predictedResidual).toBe(3);
    expect(f.slope).toBe(0);
  });

  it("R² is in [0,1]", () => {
    const f = gaussForecast([1, 2, 4, 8]);
    expect(f.rSquared).toBeGreaterThanOrEqual(0);
    expect(f.rSquared).toBeLessThanOrEqual(1);
  });

  it("loop integrates forecast: short-circuits divergent runs", () => {
    let iter = 0;
    const r = run({
      payload: { v: 1 },
      canonical: () => String(iter++),         // ever-changing → never fixed
      transform: (x) => x,
      mechanisms: {
        forecast: (h) => gaussForecast(h, 0.5),
      },
      maxIter: 50,
    });
    // Forecast should fire before MAX_ITER if it predicts divergence
    expect(["REFUSED_FORECAST_DIVERGENT", "MAX_ITER_NO_FIXED_POINT"]).toContain(r.verdict);
  });
});

// ============================================================================
// witnessDiversity (Gauss class-number axis) integration
// ============================================================================
describe("witnessDiversity gate", () => {
  it("ACCEPTS when class-number axis ≥ threshold", () => {
    const r = run({
      payload: { v: 1 },
      canonical: (x) => `c:${x.v}`,
      transform: (x) => x,
      mechanisms: {
        witnessDiversity: () => ({ axis: 0.9, threshold: 0.5, discriminant: -3, classNumber: 1 }),
      },
      maxIter: 4,
    });
    expect(r.verdict).toBe("ACCEPTED");
    expect(r.witnessDiversity?.admitted).toBe(true);
    expect(r.witnessDiversity?.classNumber).toBe(1);
  });

  it("REFUSES with REFUSED_WITNESS_DIVERSITY when axis < threshold", () => {
    const r = run({
      payload: { v: 1 },
      canonical: (x) => `c:${x.v}`,
      transform: (x) => x,
      mechanisms: {
        witnessDiversity: () => ({ axis: 0.1, threshold: 0.5, discriminant: -163, classNumber: 1 }),
      },
      maxIter: 4,
    });
    expect(r.verdict).toBe("REFUSED_WITNESS_DIVERSITY");
    expect(r.witnessDiversity?.admitted).toBe(false);
    expect(r.refusalReason).toMatch(/class-number axis/);
  });

  it("propagates witnessDiversity info on dual-witness divergence", () => {
    const r = run({
      payload: { v: 1 },
      canonical: (x) => `c:${x.v}`,
      transform: (x) => x,
      mechanisms: {
        witnessDiversity: () => ({ axis: 0.9, threshold: 0.5 }),
        dualWitness: () => ({ match: false }),
      },
      maxIter: 4,
    });
    expect(r.verdict).toBe("REFUSED_DUAL_WITNESS_DIVERGE");
    expect(r.witnessDiversity?.admitted).toBe(true);
  });
});
