import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { verify, scoreFleetSync, sekedToPhase } from "../src/index.js";
import { type LutarAxes9, lutarInvariant9, verifyLutarBoundN } from "@workspace/ouroboros-invariant";
import { computeSeked } from "@workspace/reconciliation";

// ---- helpers --------------------------------------------------------------
const cleanAxes = (v = 0.9): LutarAxes9 => ({
  cleanliness: v, horizon: v, resonance: v, frustum: v,
  gaussClosure: v, invariance: v, moralGrounding: v,
  ontologicalGrounding: v, measurabilityHonesty: v,
});

const noisyAxes = (): LutarAxes9 => cleanAxes(0.1);

const sample = (dx = 10, dy = 5) => ({
  metricId: "amaru-cpu",
  horizontal: dx,
  vertical: dy,
  timestamp: 1_700_000_000,
});

// ---- core verify ----------------------------------------------------------

describe("amaru.verify — spine integration", () => {
  it("ACCEPTS clean axes + finite sample", () => {
    const out = verify({ sample: sample(), axes: cleanAxes() });
    expect(out.receipt.verdict).toBe("ACCEPTED");
    expect(out.lutar.invariant).toBeGreaterThan(0.5);
    expect(out.signal).not.toBeNull();
    expect(out.receipt.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("REFUSES at Λ-gate when axes are noisy", () => {
    const out = verify({ sample: sample(), axes: noisyAxes() });
    expect(out.receipt.verdict).toBe("REFUSED_LAMBDA_GATE");
    expect(out.signal).toBeNull();
  });

  it("REFUSES on bare claim (non-finite sample)", () => {
    const out = verify({
      sample: { ...sample(), horizontal: Number.NaN },
      axes: cleanAxes(),
    });
    expect(out.receipt.verdict).toBe("REFUSED_FLUXIONS_BARE_CLAIM");
  });

  it("Λ₉ bound holds for accepted requests", () => {
    const out = verify({ sample: sample(), axes: cleanAxes() });
    expect(verifyLutarBoundN(out.lutar)).toBe(true);
    expect(out.lutar.invariant).toBeGreaterThanOrEqual(out.lutar.bound.lower);
    expect(out.lutar.invariant).toBeLessThanOrEqual(out.lutar.bound.upper);
  });

  it("identical inputs produce identical receipt digests (deterministic)", () => {
    const a = verify({ sample: sample(), axes: cleanAxes(0.9) });
    const b = verify({ sample: sample(), axes: cleanAxes(0.9) });
    expect(a.receipt.receiptDigest).toBe(b.receipt.receiptDigest);
  });
});

// ---- Kuramoto fleet sync --------------------------------------------------

describe("amaru kuramoto-sync fleet detector", () => {
  it("scores a perfectly aligned fleet as COHERENT", () => {
    const sk = computeSeked(10, 10);
    const m = new Map([
      ["cpu", sk], ["mem", sk], ["net", sk], ["disk", sk],
    ]);
    const out = scoreFleetSync(m);
    expect(out.r).toBeGreaterThan(0.99);
    expect(out.verdict).toBe("COHERENT");
  });

  it("scores a scattered fleet as INCOHERENT", () => {
    const m = new Map([
      ["a", computeSeked(1, 100)],   // ~89°
      ["b", computeSeked(100, 1)],   // ~0.6°
      ["c", computeSeked(50, 50)],   // 45°
      ["d", computeSeked(1, 1000)],  // ~89.9°
    ]);
    const out = scoreFleetSync(m);
    expect(out.r).toBeLessThan(0.85);
    expect(["MIXING", "INCOHERENT"]).toContain(out.verdict);
  });

  it("phase conversion from seked is in [0, 2π]", () => {
    const phase = sekedToPhase(computeSeked(7, 5));
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThanOrEqual(2 * Math.PI);
  });

  it("empty fleet returns r=0", () => {
    const out = scoreFleetSync(new Map());
    expect(out.r).toBe(0);
  });
});

// ---- property tests on Lutar Λ₉ axioms -----------------------------------

describe("amaru Λ₉ axioms — fast-check property tests", () => {
  // A1: monotone — if every axis weakly increases, Λ weakly increases
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
          // weakly increasing
          return r2 + 1e-9 >= r1;
        },
      ),
      { numRuns: 200 },
    );
  });

  // A2: homogeneous (degree-1) — Λ(λ·x) = λ·Λ(x)
  it("A2 homogeneous degree-1 (n=200)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.05, max: 0.9, noNaN: true }),
        fc.double({ min: 0.1, max: 1.0, noNaN: true }),
        (v, scale) => {
          const r1 = lutarInvariant9(cleanAxes(v)).invariant;
          const r2 = lutarInvariant9(cleanAxes(v * scale)).invariant;
          return Math.abs(r2 - scale * r1) < 1e-6;
        },
      ),
      { numRuns: 200 },
    );
  });

  // A4: bounded — min(axes) ≤ Λ ≤ max(axes)
  it("A4 bounded by min/max (n=200)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.01, max: 0.99, noNaN: true }), { minLength: 9, maxLength: 9 }),
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
});
