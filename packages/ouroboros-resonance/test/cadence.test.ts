import { describe, expect, it } from "vitest";
import {
  beatFrequency,
  checkCadenceMatch,
  measureCadence,
  predictedResonantFrequency,
} from "../src/cadence.js";

describe("measureCadence", () => {
  it("returns 0 frequency for fewer than 2 events", () => {
    expect(measureCadence([]).frequency).toBe(0);
    expect(measureCadence([{ tick: 5 }]).frequency).toBe(0);
  });

  it("computes frequency = 1 / median interval", () => {
    const events = [{ tick: 0 }, { tick: 5 }, { tick: 10 }, { tick: 15 }];
    const r = measureCadence(events);
    expect(r.frequency).toBeCloseTo(0.2, 10);
    expect(r.samples).toBe(3);
  });

  it("is robust to outliers (median, not mean)", () => {
    // Three intervals of 5, one outlier of 1000.
    const events = [{ tick: 0 }, { tick: 5 }, { tick: 10 }, { tick: 15 }, { tick: 1015 }];
    const r = measureCadence(events);
    // Median interval is 5; mean would be ~252.
    expect(r.frequency).toBeCloseTo(0.2, 10);
    // Jitter (std/mean) is huge.
    expect(r.jitter).toBeGreaterThan(1);
  });

  it("low jitter for uniform intervals", () => {
    const events = Array.from({ length: 20 }, (_, i) => ({ tick: i * 4 }));
    const r = measureCadence(events);
    expect(r.jitter).toBeLessThan(0.01);
  });
});

describe("checkCadenceMatch", () => {
  it("matches when frequencies are within tolerance", () => {
    const a = { frequency: 1.0, samples: 10, jitter: 0 };
    const b = { frequency: 1.04, samples: 10, jitter: 0 };
    const r = checkCadenceMatch(a, b, { tolerance: 0.05 });
    expect(r.matched).toBe(true);
    expect(r.fractionalDifference).toBeCloseTo(0.04 / 1.04, 8);
  });

  it("rejects when fractional diff exceeds tolerance", () => {
    const a = { frequency: 4.0, samples: 10, jitter: 0 };
    const b = { frequency: 0.3, samples: 10, jitter: 0 };
    expect(checkCadenceMatch(a, b).matched).toBe(false);
  });

  it("rejects when either frequency is zero", () => {
    const zero = { frequency: 0, samples: 0, jitter: 0 };
    const ok = { frequency: 1, samples: 10, jitter: 0 };
    expect(checkCadenceMatch(zero, ok).matched).toBe(false);
    expect(checkCadenceMatch(ok, zero).matched).toBe(false);
  });
});

describe("predictedResonantFrequency", () => {
  it("returns 1/(2π√(LC))", () => {
    const f = predictedResonantFrequency(1, 1);
    expect(f).toBeCloseTo(1 / (2 * Math.PI), 10);
  });

  it("scales as 1/√L for fixed C", () => {
    const f1 = predictedResonantFrequency(1, 1);
    const f4 = predictedResonantFrequency(4, 1);
    expect(f4).toBeCloseTo(f1 / 2, 10);
  });

  it("returns 0 for invalid input", () => {
    expect(predictedResonantFrequency(0, 1)).toBe(0);
    expect(predictedResonantFrequency(1, -1)).toBe(0);
  });
});

describe("beatFrequency", () => {
  it("returns absolute difference", () => {
    expect(beatFrequency(60, 59)).toBe(1);
    expect(beatFrequency(0.3, 0.31)).toBeCloseTo(0.01, 10);
  });
});
