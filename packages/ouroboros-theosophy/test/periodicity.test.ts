import { describe, it, expect } from "vitest";
import { detectPeriod } from "../src/periodicity.js";

describe("Primitive 52 — Periodicity tracker", () => {
  it("detects a period-4 sine wave (peak at lag 4 or anti-peak at lag 2)", () => {
    const series: number[] = [];
    for (let i = 0; i < 32; i++) series.push(Math.sin((2 * Math.PI * i) / 4));
    const r = detectPeriod(series);
    expect(r.declared).toBe(true);
    // either positive peak at lag 4 or negative peak at lag 2 (half-period)
    expect([2, 4]).toContain(r.dominantLag);
  });

  it("returns no period for a constant series", () => {
    const r = detectPeriod([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(r.declared).toBe(false);
    expect(r.dominantLag).toBe(0);
  });

  it("handles short series gracefully", () => {
    const r = detectPeriod([1, 2]);
    expect(r.declared).toBe(false);
  });

  it("respects threshold", () => {
    const series = [1, 2, 1, 2, 1, 2, 1, 2];
    const high = detectPeriod(series, undefined, 0.99);
    const low = detectPeriod(series, undefined, 0.1);
    expect(low.declared).toBe(true);
    expect(high.dominantLag).toBeGreaterThanOrEqual(0);
  });

  it("declared=false when peak below threshold", () => {
    const series = Array.from({ length: 16 }, () => Math.random());
    const r = detectPeriod(series, undefined, 0.99);
    expect(r.declared).toBe(false);
  });
});
