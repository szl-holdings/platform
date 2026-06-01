import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  verify,
  fuseSensors,
  scoreDefenders,
  simulateDefence,
  type SentraVerifyInput,
  type SensorObservation,
  type DefenderReading,
} from "../src/index.js";
import type { LutarAxes9 } from "@workspace/ouroboros-invariant";
import { lutarInvariant9, verifyLutarBoundN } from "@workspace/ouroboros-invariant";

// ---- helpers --------------------------------------------------------------
const cleanAxes = (v = 0.9): Omit<LutarAxes9, "gaussClosure"> => ({
  cleanliness: v,
  horizon: v,
  resonance: v,
  frustum: v,
  invariance: v,
  moralGrounding: v,
  ontologicalGrounding: v,
  measurabilityHonesty: v,
});

const noisyAxes = (): Omit<LutarAxes9, "gaussClosure"> => cleanAxes(0.1);

const event = (sev = 0.5) => ({
  id: "evt-2026-05-11-test",
  severity: sev,
  timestamp: 1_700_000_000,
});

// Three sensors voting on one threat-state scalar; perfectly consistent.
const cleanSensors: SensorObservation[] = [
  { id: "siem", weights: [1], value: 0.5, sigma: 1 },
  { id: "edr",  weights: [1], value: 0.5, sigma: 1 },
  { id: "waf",  weights: [1], value: 0.5, sigma: 1 },
];

// One outlier sensor 6σ from the rest
const tamperedSensors: SensorObservation[] = [
  { id: "siem", weights: [1], value: 0.5, sigma: 1 },
  { id: "edr",  weights: [1], value: 0.5, sigma: 1 },
  { id: "waf",  weights: [1], value: 100, sigma: 1 }, // outlier
];

const coherentDefenders: DefenderReading[] = [
  { id: "edr-east", phase: 1.5 },
  { id: "edr-west", phase: 1.51 },
  { id: "waf-1",    phase: 1.49 },
  { id: "siem",     phase: 1.5 },
];

const scatteredDefenders: DefenderReading[] = [
  { id: "edr-east", phase: 0.1 },
  { id: "edr-west", phase: 2.5 },
  { id: "waf-1",    phase: 4.7 },
  { id: "siem",     phase: 6.0 },
];

// ---- Gauss fusion ---------------------------------------------------------

describe("sentra.fuseSensors — Gauss multi-sensor fusion", () => {
  it("clean unanimous sensors → fusionAxis ≈ 1, verdict ACCEPT", () => {
    const r = fuseSensors(cleanSensors);
    expect(r.fusionAxis).toBeGreaterThan(0.99);
    expect(r.chiSqPerDof).toBeLessThan(0.01);
    expect(r.verdict).toBe("ACCEPT");
    expect(r.state[0]).toBeCloseTo(0.5, 6);
  });

  it("one tampered sensor → verdict REJECT_FUSION_DIVERGENT", () => {
    const r = fuseSensors(tamperedSensors);
    expect(r.verdict).toBe("REJECT_FUSION_DIVERGENT");
    expect(r.worstSensorId).toBe("waf");
    expect(r.chiSqPerDof).toBeGreaterThan(5);
  });

  it("rejects mismatched weight shapes", () => {
    expect(() =>
      fuseSensors([
        { id: "a", weights: [1, 0], value: 1 },
        { id: "b", weights: [1],    value: 1 },
      ]),
    ).toThrow();
  });

  it("rejects empty bundle", () => {
    expect(() => fuseSensors([])).toThrow();
  });

  it("rejects non-positive sigma", () => {
    expect(() =>
      fuseSensors([
        { id: "a", weights: [1], value: 1, sigma: 0 },
        { id: "b", weights: [1], value: 1, sigma: 1 },
      ]),
    ).toThrow();
  });
});

// ---- Kuramoto defender ---------------------------------------------------

describe("sentra Kuramoto defender", () => {
  it("aligned defenders score r ≈ 1, COHERENT", () => {
    const s = scoreDefenders(coherentDefenders);
    expect(s.r).toBeGreaterThan(0.99);
    expect(s.verdict).toBe("COHERENT");
    expect(s.n).toBe(4);
  });

  it("scattered defenders score r < 0.85, MIXING or INCOHERENT", () => {
    const s = scoreDefenders(scatteredDefenders);
    expect(s.r).toBeLessThan(0.85);
    expect(["MIXING", "INCOHERENT"]).toContain(s.verdict);
  });

  it("simulateDefence converges from a coherent start", () => {
    const sim = simulateDefence(
      coherentDefenders,
      { phase: Math.PI, intensity: 0.4 },
      { nSteps: 80, dt: 0.1, couplingK: 1.5 },
    );
    expect(sim.converged).toBe(true);
    expect(sim.rTrace[sim.rTrace.length - 1]!).toBeGreaterThanOrEqual(0.85);
  });

  it("counter-orientation drives mean phase away from attacker", () => {
    // Defenders start at phase 0; attacker at 0; counter-orient targets π.
    const start: DefenderReading[] = [
      { id: "a", phase: 0 }, { id: "b", phase: 0.05 },
      { id: "c", phase: -0.05 }, { id: "d", phase: 0.0 },
    ];
    const sim = simulateDefence(
      start,
      { phase: 0, intensity: 0.6 },
      { nSteps: 100, dt: 0.1, couplingK: 1.5, counterOrient: true },
    );
    const finalGap = sim.gapTrace[sim.gapTrace.length - 1]!;
    const initGap = sim.gapTrace[0]!;
    expect(finalGap).toBeGreaterThan(initGap);
  });

  it("empty defender list → r=0, n=0", () => {
    const s = scoreDefenders([]);
    expect(s.r).toBe(0);
    expect(s.n).toBe(0);
  });
});

// ---- spine integration ----------------------------------------------------

describe("sentra.verify — spine integration", () => {
  const buildInput = (
    sensors: SensorObservation[],
    axes: Omit<LutarAxes9, "gaussClosure"> = cleanAxes(),
    sev = 0.5,
  ): SentraVerifyInput => ({
    event: event(sev),
    sensors,
    defenders: coherentDefenders,
    axes,
  });

  it("ACCEPTS clean sensors + clean axes", () => {
    const out = verify(buildInput(cleanSensors));
    expect(out.receipt.verdict).toBe("ACCEPTED");
    expect(out.admitted).toBe(true);
    expect(out.fusion.verdict).toBe("ACCEPT");
    expect(out.receipt.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("REFUSES when fusion is divergent (Λ-gate collapses via gaussClosure ← 1/(1+χ²/dof))", () => {
    const out = verify(buildInput(tamperedSensors));
    // Tampered sensors → χ²/dof ≫ 1 → fusionAxis → ~0 → gaussClosure axis ≈ 0
    // → Λ-gate fires before Bekenstein. Either refusal is a correct refusal of
    // a sensor-poisoned event; we assert the refusal + the fusion verdict.
    expect(["REFUSED_LAMBDA_GATE", "REFUSED_BEKENSTEIN_OVERFLOW"]).toContain(
      out.receipt.verdict,
    );
    expect(out.fusion.verdict).toBe("REJECT_FUSION_DIVERGENT");
    expect(out.admitted).toBe(false);
  });

  it("REFUSES at Λ-gate when axes are noisy", () => {
    const out = verify(buildInput(cleanSensors, noisyAxes()));
    expect(out.receipt.verdict).toBe("REFUSED_LAMBDA_GATE");
  });

  it("REFUSES on bare claim (severity out of range)", () => {
    const out = verify(buildInput(cleanSensors, cleanAxes(), Number.NaN));
    expect(out.receipt.verdict).toBe("REFUSED_FLUXIONS_BARE_CLAIM");
  });

  it("Λ₉ bound holds for accepted requests", () => {
    const out = verify(buildInput(cleanSensors));
    expect(verifyLutarBoundN(out.lutar)).toBe(true);
    expect(out.lutar.invariant).toBeGreaterThanOrEqual(out.lutar.bound.lower);
    expect(out.lutar.invariant).toBeLessThanOrEqual(out.lutar.bound.upper);
  });

  it("identical inputs produce identical receipt digests (deterministic)", () => {
    const a = verify(buildInput(cleanSensors));
    const b = verify(buildInput(cleanSensors));
    expect(a.receipt.receiptDigest).toBe(b.receipt.receiptDigest);
  });

  it("gaussClosure axis is fed from fusion goodness-of-fit", () => {
    const out = verify(buildInput(cleanSensors));
    // sentra populates the missing axis from fusion
    expect(out.lutar.axisValues.gaussClosure).toBeCloseTo(out.fusion.fusionAxis, 9);
  });
});

// ---- property tests on Lutar Λ₉ axioms (Sentra surface) ------------------

describe("sentra Λ₉ axioms — fast-check property tests", () => {
  it("A1 monotone in each axis (n=200)", () => {
    fc.assert(
      fc.property(
        fc.record({
          cleanliness: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          horizon: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          resonance: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          frustum: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          gaussClosure: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          invariance: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          moralGrounding: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          ontologicalGrounding: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
          measurabilityHonesty: fc.double({ min: 0.01, max: 0.5, noNaN: true }),
        }),
        fc.double({ min: 0, max: 0.4, noNaN: true }),
        (axes, delta) => {
          const r1 = lutarInvariant9(axes).invariant;
          const bumped: LutarAxes9 = {
            cleanliness: Math.min(1, axes.cleanliness + delta),
            horizon: Math.min(1, axes.horizon + delta),
            resonance: Math.min(1, axes.resonance + delta),
            frustum: Math.min(1, axes.frustum + delta),
            gaussClosure: Math.min(1, axes.gaussClosure + delta),
            invariance: Math.min(1, axes.invariance + delta),
            moralGrounding: Math.min(1, axes.moralGrounding + delta),
            ontologicalGrounding: Math.min(1, axes.ontologicalGrounding + delta),
            measurabilityHonesty: Math.min(1, axes.measurabilityHonesty + delta),
          };
          const r2 = lutarInvariant9(bumped).invariant;
          return r2 + 1e-9 >= r1;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("A2 homogeneous degree-1 — Λ(λ·x) = λ·Λ(x) (n=200)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.05, max: 0.9, noNaN: true }),
        fc.double({ min: 0.1, max: 1.0, noNaN: true }),
        (v, scale) => {
          const a: LutarAxes9 = { ...cleanAxes(v), gaussClosure: v };
          const b: LutarAxes9 = { ...cleanAxes(v * scale), gaussClosure: v * scale };
          const r1 = lutarInvariant9(a).invariant;
          const r2 = lutarInvariant9(b).invariant;
          return Math.abs(r2 - scale * r1) < 1e-6;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("A4 bounded by min/max (n=200)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.01, max: 0.99, noNaN: true }), {
          minLength: 9, maxLength: 9,
        }),
        (vals) => {
          const axes: LutarAxes9 = {
            cleanliness: vals[0]!, horizon: vals[1]!, resonance: vals[2]!,
            frustum: vals[3]!, gaussClosure: vals[4]!, invariance: vals[5]!,
            moralGrounding: vals[6]!, ontologicalGrounding: vals[7]!,
            measurabilityHonesty: vals[8]!,
          };
          const r = lutarInvariant9(axes);
          const mn = Math.min(...vals);
          const mx = Math.max(...vals);
          return r.invariant >= mn - 1e-9 && r.invariant <= mx + 1e-9;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("fusion: random sensors with identical observations always converge", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 10, noNaN: true }),
        fc.integer({ min: 3, max: 8 }),
        (value, count) => {
          const obs: SensorObservation[] = Array.from({ length: count }, (_, i) => ({
            id: `s-${i}`, weights: [1], value, sigma: 1,
          }));
          const r = fuseSensors(obs);
          return Math.abs(r.state[0]! - value) < 1e-9 && r.verdict === "ACCEPT";
        },
      ),
      { numRuns: 200 },
    );
  });
});
