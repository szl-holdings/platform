import { describe, expect, it } from "vitest";
import {
  AlertRuleRegistry,
  SINUSOID_RMS_TO_PEAK,
  seriesStats,
} from "../src/peak-rms.js";

describe("seriesStats", () => {
  it("returns zeros for empty input", () => {
    const s = seriesStats([]);
    expect(s.count).toBe(0);
    expect(s.mean).toBe(0);
    expect(s.rms).toBe(0);
    expect(s.peak).toBe(0);
  });

  it("rms / peak ≈ 0.7071 for a sinusoid", () => {
    const N = 2000;
    const xs = Array.from({ length: N }, (_, i) =>
      Math.sin((2 * Math.PI * i) / N),
    );
    const s = seriesStats(xs);
    // For a sinusoid with amplitude 1: peak = 1, rms = 1/√2 ≈ 0.7071.
    expect(s.rms).toBeCloseTo(SINUSOID_RMS_TO_PEAK, 2);
    expect(s.peak).toBeCloseTo(1, 2);
  });

  it("computes mean correctly for centered series", () => {
    expect(seriesStats([-1, 0, 1]).mean).toBeCloseTo(0, 10);
  });

  it("crest factor is high for spiky data", () => {
    const xs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 100];
    const s = seriesStats(xs);
    expect(s.crestFactor).toBeGreaterThan(3);
  });
});

describe("AlertRuleRegistry", () => {
  it("rejects safety rule with mean aggregator", () => {
    const reg = new AlertRuleRegistry();
    expect(() =>
      reg.register({
        id: "page_curve.dirty",
        invariantClass: "safety",
        aggregator: "mean",
        threshold: 0,
        direction: "above",
      }),
    ).toThrow(/cannot use mean aggregator/);
  });

  it("accepts safety rule with peak aggregator", () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      id: "page_curve.dirty",
      invariantClass: "safety",
      aggregator: "peak",
      threshold: 0.05,
      direction: "above",
    });
    expect(reg.size()).toBe(1);
  });

  it("accepts throughput rule with mean aggregator", () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      id: "loops.per_second",
      invariantClass: "throughput",
      aggregator: "mean",
      threshold: 1,
      direction: "below",
    });
    expect(reg.size()).toBe(1);
  });

  it("evaluates above-threshold correctly", () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      id: "spike",
      invariantClass: "safety",
      aggregator: "peak",
      threshold: 5,
      direction: "above",
    });
    expect(reg.evaluate("spike", [1, 2, 6, 1])).toBe(true);
    expect(reg.evaluate("spike", [1, 2, 3, 1])).toBe(false);
  });

  it("evaluates below-threshold correctly", () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      id: "drought",
      invariantClass: "throughput",
      aggregator: "mean",
      threshold: 1,
      direction: "below",
    });
    expect(reg.evaluate("drought", [0.1, 0.2, 0.3])).toBe(true);
    expect(reg.evaluate("drought", [2, 3, 4])).toBe(false);
  });

  it("rejects duplicate rule ids", () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      id: "x",
      invariantClass: "safety",
      aggregator: "peak",
      threshold: 1,
      direction: "above",
    });
    expect(() =>
      reg.register({
        id: "x",
        invariantClass: "safety",
        aggregator: "peak",
        threshold: 2,
        direction: "above",
      }),
    ).toThrow(/duplicate/);
  });
});
