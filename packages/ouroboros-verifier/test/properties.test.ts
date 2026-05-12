import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeMerkleRoot, sha256 } from "../../ouroboros-anchor/src/index.ts";
import {
  computeImpedance,
  reflectionCoefficient,
  computeQFactor,
  orderParameter,
} from "../../ouroboros-resonance/src/index.ts";

describe("verifier — anchor properties", () => {
  it("Merkle root is deterministic across orderings of identical leaves", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 16 }), (leaves) => {
        const r1 = computeMerkleRoot(leaves);
        const r2 = computeMerkleRoot([...leaves]);
        return r1 === r2;
      })
    );
  });

  it("sha256 is 64 hex chars for any input", () => {
    fc.assert(fc.property(fc.string(), (s) => /^[0-9a-f]{64}$/.test(sha256(s))));
  });

  it("Merkle root changes when a leaf is appended", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 8 }),
        fc.string({ minLength: 1 }),
        (leaves, extra) => {
          const r1 = computeMerkleRoot(leaves);
          const r2 = computeMerkleRoot([...leaves, extra]);
          return r1 !== r2;
        }
      )
    );
  });
});

describe("verifier — resonance properties", () => {
  it("|Γ| is in [0,1] for any valid impedance pair", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (b1, s1, b2, s2) => {
          const z1 = computeImpedance({ boundaryCardinality: b1, stateCardinality: s1 });
          const z2 = computeImpedance({ boundaryCardinality: b2, stateCardinality: s2 });
          const r = reflectionCoefficient(z1, z2);
          return r.magnitude >= 0 && r.magnitude <= 1;
        }
      )
    );
  });

  it("Q-factor is non-negative for non-negative inputs", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(1e6), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(1e6), noNaN: true }),
        (useful, residual) => {
          const q = computeQFactor({ workUseful: useful, residualEntropyBits: residual });
          return q.Q >= 0;
        }
      )
    );
  });

  it("Kuramoto order parameter is in [0,1]", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(-12.5), max: Math.fround(12.5), noNaN: true }), {
          minLength: 2,
          maxLength: 64,
        }),
        (phases) => {
          const oscs = phases.map((p, i) => ({ id: `o${i}`, phase: p, naturalFrequency: 1 }));
          const { r } = orderParameter(oscs);
          return r >= 0 && r <= 1.0000001;
        }
      )
    );
  });

  it("computeImpedance returns positive Z for positive inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (b, s) => {
          const z = computeImpedance({ boundaryCardinality: b, stateCardinality: s });
          return z.impedance > 0;
        }
      )
    );
  });
});

describe("verifier — invariant smoke tests", () => {
  it("matched impedance gives near-zero reflection", () => {
    const z = computeImpedance({ boundaryCardinality: 10, stateCardinality: 5 });
    const r = reflectionCoefficient(z, z);
    expect(r.magnitude).toBeLessThan(0.001);
  });
  it("identical phases give r near 1", () => {
    const oscs = [0, 0, 0, 0].map((p, i) => ({ id: `o${i}`, phase: p, naturalFrequency: 1 }));
    const { r } = orderParameter(oscs);
    expect(r).toBeGreaterThan(0.99);
  });
});
