import { describe, it, expect } from "vitest";
import {
  computeKappa11,
  crossSection,
  DEFAULT_KAPPA11_BAND,
  NPMR_STRATA,
  NPMR_EDGES,
} from "../src/npmr-cosmology.ts";

describe("NPMR cross-section (v11-npmr.md §3.2)", () => {
  it("exposes five strata in outermost→innermost order", () => {
    expect(NPMR_STRATA).toHaveLength(5);
    NPMR_STRATA.forEach((s, i) => expect(s.index).toBe(i));
  });

  it("each stratum carries three-name correspondence", () => {
    for (const s of NPMR_STRATA) {
      expect(s.names.campbell).toMatch(/\S/);
      expect(s.names.andean).toMatch(/\S/);
      expect(s.names.operational).toMatch(/\S/);
    }
  });

  it("crossSection() returns a stable schema version", () => {
    expect(crossSection().schemaVersion).toBe("v11-npmr/1");
    expect(crossSection().equator).toEqual({
      upper: 2,
      lower: 3,
      note: expect.stringContaining("Amaru"),
    });
  });

  it("three idea-propagation primitives ride distinct edges", () => {
    expect(NPMR_EDGES).toHaveLength(3);
    const primitives = NPMR_EDGES.map((e) => e.primitive).sort();
    expect(primitives).toEqual([
      "loss as coupling",
      "partial-match carrier",
      "uptake-surface > channel",
    ]);
  });
});

describe("κ₁₁ — Coupling Coefficient (v11-npmr.md §5)", () => {
  const ideal = {
    carrier: { written: ["P1", "P2", "P3"], enforced: ["P1", "P2", "P3"] },
    uptake: { channelWidth: 10, surfaceWidth: 10 },
    loss: { samples: [1, 1, 1, 1] }, // CV = 0 → coherence = 1
  };

  it("κ₁₁ = 0 when carrier, uptake, and loss-coherence are all perfect", () => {
    const r = computeKappa11(ideal);
    expect(r.components.carrierFidelity).toBe(1);
    expect(r.components.uptakeRatio).toBe(1);
    expect(r.components.lossCoherence).toBe(1);
    expect(r.kappa11).toBe(0);
    expect(r.bandVerdict).toBe("below_band");
  });

  it("κ₁₁ = 1 when nothing written gets enforced", () => {
    const r = computeKappa11({ ...ideal, carrier: { written: ["A", "B"], enforced: [] } });
    expect(r.components.carrierFidelity).toBe(0);
    expect(r.kappa11).toBe(1);
    expect(r.bandVerdict).toBe("above_band");
  });

  it("uptakeRatio caps at 1 when surface > channel", () => {
    const r = computeKappa11({ ...ideal, uptake: { channelWidth: 5, surfaceWidth: 50 } });
    expect(r.components.uptakeRatio).toBe(1);
  });

  it("κ₁₁ ∈ [0,1] across a spread of inputs", () => {
    const cases = [
      { ...ideal, carrier: { written: ["A", "B", "C", "D"], enforced: ["A", "B"] } },
      { ...ideal, uptake: { channelWidth: 10, surfaceWidth: 2 } },
      { ...ideal, loss: { samples: [1, 10, 100, 1000] } },
    ];
    for (const c of cases) {
      const r = computeKappa11(c);
      expect(r.kappa11).toBeGreaterThanOrEqual(0);
      expect(r.kappa11).toBeLessThanOrEqual(1);
    }
  });

  it("lossCoherence = 1/(1+CV²) — variance pushes coherence down", () => {
    const low = computeKappa11({ ...ideal, loss: { samples: [10, 10, 10] } });
    const high = computeKappa11({ ...ideal, loss: { samples: [1, 10, 100] } });
    expect(low.components.lossCoherence).toBeGreaterThan(high.components.lossCoherence);
  });

  it("band verdict honours operator-supplied band", () => {
    const r = computeKappa11({
      carrier: { written: ["A", "B"], enforced: ["A"] }, // fidelity 0.5
      uptake: { channelWidth: 1, surfaceWidth: 1 }, // ratio 1
      loss: { samples: [1, 1, 1] }, // coherence 1
      healthyBand: { lower: 0.4, upper: 0.6 },
    });
    expect(r.kappa11).toBeCloseTo(0.5, 10);
    expect(r.bandVerdict).toBe("in_band");
  });

  it("invalid inputs raise descriptive errors", () => {
    expect(() => computeKappa11({ ...ideal, carrier: { written: [], enforced: [] } } as never))
      .toThrow(/non-empty/);
    expect(() => computeKappa11({ ...ideal, uptake: { channelWidth: 0, surfaceWidth: 1 } }))
      .toThrow(/positive/);
    expect(() => computeKappa11({ ...ideal, loss: { samples: [] } }))
      .toThrow(/non-empty/);
    expect(() => computeKappa11({ ...ideal, loss: { samples: [0, 0, 0] } }))
      .toThrow(/mean must be > 0/);
    expect(() => computeKappa11({ ...ideal, healthyBand: { lower: 0.7, upper: 0.3 } }))
      .toThrow(/healthyBand/);
  });

  it("default band is conventional, not measured", () => {
    expect(DEFAULT_KAPPA11_BAND).toEqual({ lower: 0.1, upper: 0.6 });
  });

  it("result advertises formula and source for reviewer audit", () => {
    const r = computeKappa11(ideal);
    expect(r.formula).toContain("κ₁₁");
    expect(r.source).toContain("v11-npmr.md");
  });
});
