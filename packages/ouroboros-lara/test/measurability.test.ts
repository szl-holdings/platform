import { describe, it, expect } from "vitest";
import { assessMeasurability, ReconstructionTrial } from "../src/measurability.js";

const trial = (succeeded: boolean): ReconstructionTrial => ({
  m: 4,
  M: 32,
  epsilonAtM: 0.05,
  observedDeviation: succeeded ? 0.02 : 0.2,
  correlation: 0.3,
  succeeded,
});

describe("Primitive 35 — Measurability assertion", () => {
  it("returns UNDETERMINED with no trials", () => {
    const r = assessMeasurability({ candidatePolynomialId: "P", trials: [] });
    expect(r.verdict).toBe("UNDETERMINED");
    expect(r.successRate).toBe(0);
  });

  it("returns MEASURABLE when success rate ≥ 0.5", () => {
    const trials = [trial(true), trial(true), trial(true), trial(false)];
    const r = assessMeasurability({ candidatePolynomialId: "P", trials });
    expect(r.verdict).toBe("MEASURABLE");
    expect(r.successRate).toBeCloseTo(0.75);
  });

  it("returns NON_MEASURABLE when rate < 0.5 and trials ≥ minTrials", () => {
    const trials = Array.from({ length: 8 }, (_, i) => trial(i < 2));
    const r = assessMeasurability({ candidatePolynomialId: "P", trials });
    expect(r.verdict).toBe("NON_MEASURABLE");
    expect(r.successRate).toBeCloseTo(0.25);
  });

  it("returns UNDETERMINED when rate < 0.5 but trials < minTrials", () => {
    const trials = [trial(false), trial(false), trial(false)];
    const r = assessMeasurability({
      candidatePolynomialId: "P",
      trials,
      minTrials: 8,
    });
    expect(r.verdict).toBe("UNDETERMINED");
  });

  it("respects custom requiredSuccessRate", () => {
    const trials = Array.from({ length: 10 }, (_, i) => trial(i < 7));
    const strict = assessMeasurability({
      candidatePolynomialId: "P",
      trials,
      requiredSuccessRate: 0.8,
    });
    expect(strict.verdict).toBe("NON_MEASURABLE");
    const lenient = assessMeasurability({
      candidatePolynomialId: "P",
      trials,
      requiredSuccessRate: 0.5,
    });
    expect(lenient.verdict).toBe("MEASURABLE");
  });

  it("preserves candidatePolynomialId in the result", () => {
    const r = assessMeasurability({
      candidatePolynomialId: "Q-quintic-7",
      trials: [trial(true)],
    });
    expect(r.candidatePolynomialId).toBe("Q-quintic-7");
  });
});
