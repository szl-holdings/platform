import { describe, expect, it } from "vitest";
import {
  classifyCoherence,
  decoherenceWindowLength,
  orderParameter,
  runKuramoto,
  stepKuramoto,
  wrap,
} from "../src/kuramoto.js";

describe("wrap", () => {
  it("wraps phases into [0, 2π)", () => {
    expect(wrap(0)).toBeCloseTo(0, 10);
    expect(wrap(Math.PI)).toBeCloseTo(Math.PI, 10);
    expect(wrap(3 * Math.PI)).toBeCloseTo(Math.PI, 10);
    expect(wrap(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 10);
  });
});

describe("orderParameter", () => {
  it("r = 1 for perfectly phase-locked oscillators", () => {
    const oscillators = Array.from({ length: 10 }, () => ({
      phase: 0,
      omega: 1,
    }));
    const { r } = orderParameter(oscillators);
    expect(r).toBeCloseTo(1, 10);
  });

  it("r ≈ 0 for uniformly-distributed phases", () => {
    const N = 32;
    const oscillators = Array.from({ length: N }, (_, i) => ({
      phase: (2 * Math.PI * i) / N,
      omega: 1,
    }));
    const { r } = orderParameter(oscillators);
    expect(r).toBeLessThan(0.01);
  });

  it("returns 0 on empty input", () => {
    const { r, psi } = orderParameter([]);
    expect(r).toBe(0);
    expect(psi).toBe(0);
  });
});

describe("stepKuramoto / runKuramoto", () => {
  it("synchronizes with high coupling K", () => {
    // 16 oscillators, identical natural frequency, scattered phases.
    const oscillators = Array.from({ length: 16 }, (_, i) => ({
      phase: (2 * Math.PI * i) / 16,
      omega: 1,
    }));
    const { state, rTrace } = runKuramoto(
      { oscillators, couplingK: 4 },
      400,
      0.05,
    );
    const finalR = orderParameter(state.oscillators).r;
    expect(finalR).toBeGreaterThan(0.95);
    // Trace should be monotonically increasing on average from start to finish.
    const earlyMean =
      rTrace.slice(0, 50).reduce((a, x) => a + x, 0) / 50;
    const lateMean =
      rTrace.slice(-50).reduce((a, x) => a + x, 0) / 50;
    expect(lateMean).toBeGreaterThan(earlyMean);
  });

  it("does not synchronize with K = 0", () => {
    const oscillators = Array.from({ length: 16 }, (_, i) => ({
      phase: (2 * Math.PI * i) / 16,
      omega: 1 + 0.5 * Math.sin(i),
    }));
    const { state } = runKuramoto(
      { oscillators, couplingK: 0 },
      200,
      0.05,
    );
    const finalR = orderParameter(state.oscillators).r;
    expect(finalR).toBeLessThan(0.5);
  });

  it("step preserves oscillator count", () => {
    const oscillators = [
      { phase: 0, omega: 1 },
      { phase: 1, omega: 1 },
      { phase: 2, omega: 1 },
    ];
    const next = stepKuramoto({ oscillators, couplingK: 1 });
    expect(next.oscillators.length).toBe(3);
  });
});

describe("classifyCoherence", () => {
  it("COHERENT for r >= 0.85", () => {
    expect(classifyCoherence(0.9)).toBe("COHERENT");
  });

  it("MIXING for 0.4 <= r < 0.85", () => {
    expect(classifyCoherence(0.6)).toBe("MIXING");
  });

  it("INCOHERENT for r < 0.4", () => {
    expect(classifyCoherence(0.2)).toBe("INCOHERENT");
  });
});

describe("decoherenceWindowLength", () => {
  it("returns longest run below threshold", () => {
    const trace = [0.9, 0.2, 0.1, 0.3, 0.8, 0.1, 0.1, 0.1, 0.1, 0.9];
    expect(decoherenceWindowLength(trace, 0.4)).toBe(4);
  });

  it("returns 0 if no decoherence", () => {
    expect(decoherenceWindowLength([0.9, 0.95, 0.92, 0.99], 0.4)).toBe(0);
  });
});
