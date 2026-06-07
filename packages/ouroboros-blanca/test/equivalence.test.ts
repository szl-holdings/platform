import { describe, it, expect } from "vitest";
import {
  checkEquivalence,
  equivalenceAxis,
  type EquivalenceObservation,
} from "../src/equivalence.ts";

describe("checkEquivalence", () => {
  it("frame artifact: bias dominates with negligible tidal", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 9.8,
      tidalDelta: 1e-5,
      window: 5,
    };
    const r = checkEquivalence(obs);
    expect(r.verdict).toBe("FRAME_ARTIFACT");
    expect(equivalenceAxis(r)).toBe(1);
  });

  it("real field detected when tidal exceeds the field threshold", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 1,
      tidalDelta: 0.2,
      window: 5,
    };
    const r = checkEquivalence(obs);
    expect(r.verdict).toBe("FIELD_DETECTED");
    expect(equivalenceAxis(r)).toBe(0);
  });

  it("indistinguishable in the middle band", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 1,
      tidalDelta: 0.05,
      window: 5,
    };
    const r = checkEquivalence(obs);
    expect(r.verdict).toBe("INDISTINGUISHABLE");
    const axis = equivalenceAxis(r);
    expect(axis).toBeGreaterThan(0);
    expect(axis).toBeLessThan(1);
  });

  it("window exceeded ⇒ verdict and axis go to zero", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 1,
      tidalDelta: 0.001,
      window: 120,
    };
    const r = checkEquivalence(obs);
    expect(r.verdict).toBe("WINDOW_EXCEEDED");
    expect(equivalenceAxis(r)).toBe(0);
  });

  it("zero mean and zero tidal: ratio is zero, treated as frame artifact", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 0,
      tidalDelta: 0,
      window: 1,
    };
    const r = checkEquivalence(obs);
    expect(r.tidalRatio).toBe(0);
    expect(r.verdict).toBe("FRAME_ARTIFACT");
  });

  it("zero mean with nonzero tidal ⇒ infinite ratio ⇒ field detected", () => {
    const obs: EquivalenceObservation = {
      meanAcceleration: 0,
      tidalDelta: 0.1,
      window: 1,
    };
    const r = checkEquivalence(obs);
    expect(r.tidalRatio).toBe(Number.POSITIVE_INFINITY);
    expect(r.verdict).toBe("FIELD_DETECTED");
  });

  it("rejects non-finite observation", () => {
    expect(() => checkEquivalence({ meanAcceleration: NaN, tidalDelta: 0, window: 1 })).toThrow();
    expect(() => checkEquivalence({ meanAcceleration: 1, tidalDelta: 0, window: 0 })).toThrow();
    expect(() => checkEquivalence({ meanAcceleration: 1, tidalDelta: -1, window: 1 })).toThrow();
  });

  it("axis is monotonic in tidalRatio across the indistinguishable band", () => {
    const a = checkEquivalence({ meanAcceleration: 1, tidalDelta: 0.02, window: 5 });
    const b = checkEquivalence({ meanAcceleration: 1, tidalDelta: 0.06, window: 5 });
    expect(equivalenceAxis(a)).toBeGreaterThan(equivalenceAxis(b));
  });

  it("deferralCeiling reports the configured maxWindow", () => {
    const r = checkEquivalence({ meanAcceleration: 1, tidalDelta: 0, window: 1 });
    expect(r.deferralCeiling).toBe(60);
  });

  it("custom thresholds shift the verdict bands", () => {
    const r = checkEquivalence(
      { meanAcceleration: 1, tidalDelta: 0.05, window: 1 },
      { fieldThreshold: 0.04, frameThreshold: 0.001, maxWindow: 60 },
    );
    expect(r.verdict).toBe("FIELD_DETECTED");
  });
});
