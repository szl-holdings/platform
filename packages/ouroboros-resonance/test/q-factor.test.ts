import { describe, expect, it } from "vitest";
import { QFactorHistory, computeQFactor } from "../src/q-factor.js";

describe("computeQFactor", () => {
  it("HEALTHY when Q is in band", () => {
    const r = computeQFactor({ workUseful: 10, residualEntropyBits: 4 });
    expect(r.Q).toBeCloseTo(2.5, 10);
    expect(r.verdict).toBe("HEALTHY");
  });

  it("DEGRADED when work_lost dominates", () => {
    const r = computeQFactor({ workUseful: 1, residualEntropyBits: 10 });
    expect(r.Q).toBeCloseTo(0.1, 10);
    expect(r.verdict).toBe("DEGRADED");
  });

  it("OVER_BUDGET when Q is suspiciously high", () => {
    const r = computeQFactor({ workUseful: 100, residualEntropyBits: 0.01 });
    expect(r.verdict).toBe("OVER_BUDGET");
  });

  it("includes retry and orphan work in losses", () => {
    const r = computeQFactor(
      {
        workUseful: 10,
        residualEntropyBits: 1,
        retryWork: 2,
        orphanWork: 1,
      },
      { retryCost: 1, orphanCost: 1 },
    );
    // workLost = 1 + 2 + 1 = 4; Q = 10/4 = 2.5
    expect(r.workLost).toBeCloseTo(4, 10);
    expect(r.Q).toBeCloseTo(2.5, 10);
  });

  it("handles zero-loss without dividing by zero", () => {
    const r = computeQFactor({ workUseful: 5, residualEntropyBits: 0 });
    expect(Number.isFinite(r.Q)).toBe(true);
    expect(r.Q).toBeGreaterThan(0);
  });
});

describe("QFactorHistory", () => {
  it("computes mean", () => {
    const h = new QFactorHistory();
    h.add(1, 2);
    h.add(2, 4);
    h.add(3, 6);
    expect(h.mean()).toBeCloseTo(4, 10);
  });

  it("returns 0 drift on empty / small histories", () => {
    const h = new QFactorHistory();
    expect(h.drift()).toBe(0);
    h.add(1, 5);
    expect(h.drift()).toBe(0);
  });

  it("detects positive drift (Q rising over time)", () => {
    const h = new QFactorHistory();
    [1, 2, 3, 4].forEach((Q, i) => h.add(i, Q));
    [5, 6, 7, 8].forEach((Q, i) => h.add(i + 4, Q));
    // early mean = 2.5, late mean = 6.5 → drift = 1.6
    expect(h.drift()).toBeCloseTo(1.6, 10);
  });

  it("detects negative drift (Q decaying)", () => {
    const h = new QFactorHistory();
    [10, 10, 10, 10, 5, 5, 5, 5].forEach((Q, i) => h.add(i, Q));
    expect(h.drift()).toBeLessThan(-0.4);
  });
});
