import { describe, expect, it } from "vitest";
import {
  computeImpedance,
  impedanceVerdict,
  reflectionCoefficient,
} from "../src/impedance.js";

describe("computeImpedance", () => {
  it("Z = √(L/C) where L = boundary² and C = state", () => {
    const r = computeImpedance({ boundaryCardinality: 4, stateCardinality: 4 });
    // L = 16, C = 4, Z = 2
    expect(r.impedance).toBeCloseTo(2, 10);
  });

  it("scales with boundary cardinality", () => {
    const r1 = computeImpedance({ boundaryCardinality: 2, stateCardinality: 4 });
    const r2 = computeImpedance({ boundaryCardinality: 4, stateCardinality: 4 });
    // Z scales linearly with boundary (L = b², C constant → Z = b/√C).
    expect(r2.impedance).toBeCloseTo(2 * r1.impedance, 10);
  });

  it("clamps state cardinality to >= 1", () => {
    const r = computeImpedance({ boundaryCardinality: 4, stateCardinality: 0 });
    expect(r.C).toBe(1);
    expect(r.impedance).toBeCloseTo(4, 10);
  });
});

describe("reflectionCoefficient", () => {
  it("Γ = 0 for matched impedances", () => {
    const z = computeImpedance({ boundaryCardinality: 4, stateCardinality: 4 });
    const r = reflectionCoefficient(z, z);
    expect(r.gamma).toBeCloseTo(0, 10);
    expect(r.efficiency).toBeCloseTo(1, 10);
    expect(r.vswr).toBeCloseTo(1, 10);
  });

  it("|Γ| > 0 for mismatched impedances", () => {
    const a = computeImpedance({ boundaryCardinality: 2, stateCardinality: 4 });
    const b = computeImpedance({ boundaryCardinality: 8, stateCardinality: 4 });
    const r = reflectionCoefficient(a, b);
    expect(r.magnitude).toBeGreaterThan(0);
    expect(r.efficiency).toBeLessThan(1);
  });

  it("efficiency = 1 - |Γ|²", () => {
    const a = computeImpedance({ boundaryCardinality: 2, stateCardinality: 8 });
    const b = computeImpedance({ boundaryCardinality: 8, stateCardinality: 8 });
    const r = reflectionCoefficient(a, b);
    expect(r.efficiency).toBeCloseTo(1 - r.magnitude * r.magnitude, 10);
  });

  it("symmetric in |Γ|", () => {
    const a = computeImpedance({ boundaryCardinality: 2, stateCardinality: 4 });
    const b = computeImpedance({ boundaryCardinality: 8, stateCardinality: 4 });
    expect(reflectionCoefficient(a, b).magnitude).toBeCloseTo(
      reflectionCoefficient(b, a).magnitude,
      10,
    );
  });
});

describe("impedanceVerdict", () => {
  it("MATCHED below warn threshold", () => {
    const refl = { gamma: 0.05, magnitude: 0.05, efficiency: 0.9975, vswr: 1.1 };
    expect(impedanceVerdict(refl)).toBe("MATCHED");
  });

  it("WARN at moderate mismatch", () => {
    const refl = { gamma: 0.3, magnitude: 0.3, efficiency: 0.91, vswr: 1.86 };
    expect(impedanceVerdict(refl)).toBe("WARN");
  });

  it("DENY at severe mismatch", () => {
    const refl = { gamma: 0.7, magnitude: 0.7, efficiency: 0.51, vswr: 5.67 };
    expect(impedanceVerdict(refl)).toBe("DENY");
  });
});
