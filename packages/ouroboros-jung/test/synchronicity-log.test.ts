import { describe, it, expect } from "vitest";
import { SynchronicityLog } from "../src/synchronicity-log.js";

describe("Primitive 48 — Synchronicity log", () => {
  it("records a co-occurrence with computed expectedJoint", () => {
    const log = new SynchronicityLog();
    const r = log.observe({
      eventA: "A",
      eventB: "B",
      pA: 0.1,
      pB: 0.2,
      observedAt: "2026-05-01",
    });
    expect(r.expectedJoint).toBeCloseTo(0.02, 12);
  });

  it("never claims causation", () => {
    const log = new SynchronicityLog();
    const r = log.observe({
      eventA: "A",
      eventB: "B",
      pA: 0.5,
      pB: 0.5,
      observedAt: "t",
    });
    expect(r.causalClaim).toBe(false);
  });

  it("rejects non-probability marginals", () => {
    const log = new SynchronicityLog();
    expect(() =>
      log.observe({ eventA: "A", eventB: "B", pA: 0, pB: 0.5, observedAt: "t" }),
    ).toThrow();
    expect(() =>
      log.observe({ eventA: "A", eventB: "B", pA: 1.5, pB: 0.5, observedAt: "t" }),
    ).toThrow();
  });

  it("surpriseIndex grows for rarer joint events", () => {
    const log = new SynchronicityLog();
    const a = log.observe({
      eventA: "A",
      eventB: "B",
      pA: 0.5,
      pB: 0.5,
      observedAt: "t",
    });
    const b = log.observe({
      eventA: "A",
      eventB: "B",
      pA: 0.01,
      pB: 0.01,
      observedAt: "t",
    });
    expect(b.surpriseIndex).toBeGreaterThan(a.surpriseIndex);
  });

  it("count tracks records", () => {
    const log = new SynchronicityLog();
    log.observe({ eventA: "A", eventB: "B", pA: 0.5, pB: 0.5, observedAt: "t" });
    log.observe({ eventA: "C", eventB: "D", pA: 0.5, pB: 0.5, observedAt: "t" });
    expect(log.count()).toBe(2);
  });
});
