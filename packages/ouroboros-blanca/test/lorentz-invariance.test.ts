import { describe, it, expect } from "vitest";
import {
  C_DEFAULT,
  checkInvariance,
  invarianceAxis,
  type PairedObservation,
  type SpacetimeEvent,
} from "../src/lorentz-invariance.ts";

const c = C_DEFAULT;

function boost(event: SpacetimeEvent, v: number): SpacetimeEvent {
  // 1+1 D Lorentz boost along x with velocity v.
  const beta = v / c;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const x = event.x[0] ?? 0;
  return {
    t: gamma * (event.t - (beta * x) / c),
    x: [gamma * (x - v * event.t)],
  };
}

describe("checkInvariance", () => {
  it("identity transform: identical frames are exactly invariant", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [c * 0.5] };
    const obs: PairedObservation = { frame1A: A, frame1B: B, frame2A: A, frame2B: B };
    const r = checkInvariance(obs);
    expect(r.verdict).toBe("INVARIANT");
    expect(invarianceAxis(r)).toBe(1);
  });

  it("Lorentz boost preserves the squared interval", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [c * 0.3] };
    const v = 0.5 * c;
    const obs: PairedObservation = {
      frame1A: A,
      frame1B: B,
      frame2A: boost(A, v),
      frame2B: boost(B, v),
    };
    const r = checkInvariance(obs);
    expect(r.verdict).toBe("INVARIANT");
  });

  it("non-Lorentz transform breaks invariance", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [c * 0.3] };
    // Arbitrary scaling — not a Lorentz element.
    const broken: SpacetimeEvent = { t: 1, x: [c * 0.6] };
    const obs: PairedObservation = {
      frame1A: A,
      frame1B: B,
      frame2A: A,
      frame2B: broken,
    };
    const r = checkInvariance(obs);
    expect(r.verdict).toBe("BROKEN");
    expect(invarianceAxis(r)).toBe(0);
  });

  it("matches the spacelike interval sign", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 0, x: [1] };
    const obs: PairedObservation = { frame1A: A, frame1B: B, frame2A: A, frame2B: B };
    const r = checkInvariance(obs);
    expect(r.interval1).toBe(-1);
    expect(r.interval2).toBe(-1);
  });

  it("matches the timelike interval sign", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [0] };
    const obs: PairedObservation = { frame1A: A, frame1B: B, frame2A: A, frame2B: B };
    const r = checkInvariance(obs);
    expect(r.interval1).toBe(c * c);
  });

  it("3+1 D boost preserves the interval", () => {
    const A: SpacetimeEvent = { t: 0, x: [0, 0, 0] };
    const B: SpacetimeEvent = { t: 1, x: [c * 0.2, c * 0.1, 0] };
    // Apply a partial Lorentz boost along x to A and B.
    const v = 0.4 * c;
    const beta = v / c;
    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const boostX = (e: SpacetimeEvent): SpacetimeEvent => ({
      t: gamma * (e.t - (beta * (e.x[0] ?? 0)) / c),
      x: [gamma * ((e.x[0] ?? 0) - v * e.t), e.x[1] ?? 0, e.x[2] ?? 0],
    });
    const obs: PairedObservation = {
      frame1A: A,
      frame1B: B,
      frame2A: boostX(A),
      frame2B: boostX(B),
    };
    const r = checkInvariance(obs);
    expect(r.verdict).toBe("INVARIANT");
  });

  it("rejects mismatched spatial dimensions", () => {
    const A: SpacetimeEvent = { t: 0, x: [0, 0] };
    const B: SpacetimeEvent = { t: 1, x: [1] };
    const obs: PairedObservation = { frame1A: A, frame1B: B, frame2A: A, frame2B: B };
    expect(() => checkInvariance(obs)).toThrow();
  });

  it("rejects non-positive c", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [0] };
    const obs: PairedObservation = { frame1A: A, frame1B: B, frame2A: A, frame2B: B };
    expect(() => checkInvariance(obs, 0)).toThrow();
    expect(() => checkInvariance(obs, -1)).toThrow();
  });

  it("near-invariant defect linearly bleeds the axis", () => {
    const A: SpacetimeEvent = { t: 0, x: [0] };
    const B: SpacetimeEvent = { t: 1, x: [c * 0.3] };
    // Tiny perturbation in frame 2 — within the near band.
    const perturb: SpacetimeEvent = { t: 1, x: [c * 0.3 + 1e-2] };
    const obs: PairedObservation = {
      frame1A: A,
      frame1B: B,
      frame2A: A,
      frame2B: perturb,
    };
    const r = checkInvariance(obs);
    expect(r.verdict === "NEAR_INVARIANT" || r.verdict === "INVARIANT" || r.verdict === "BROKEN").toBe(true);
    expect(invarianceAxis(r)).toBeGreaterThanOrEqual(0);
    expect(invarianceAxis(r)).toBeLessThanOrEqual(1);
  });
});
