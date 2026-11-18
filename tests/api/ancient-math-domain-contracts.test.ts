// SPDX-License-Identifier: Apache-2.0
// Source-only modeled mathematics; historical sources do not establish
// production readiness, proof closure, or physical unification.
import { describe, expect, it } from "vitest";
import {
  adaptiveWeights,
  incaCequeHuacasPerDay,
  incaHuacasPerCeque,
  lutarOmega,
  lutarV1,
  lutarV2,
  lutarV3,
  lutarV4,
  lutarV5,
  lutarV6,
  lutarV7,
  mayaCalendarRound,
  rhindCircleArea,
} from "../../packages/ouroboros-integrations/src/lutar-formulas";
import type {
  LutarV1Input,
  LutarV2Input,
  LutarV4Input,
  LutarV6Input,
} from "../../packages/ouroboros-integrations/src/lutar-formulas";

const v1: LutarV1Input = { E: 2, M: 1e-16, I: 1e20, T: 300 };
const v2: LutarV2Input = {
  ...v1, R: 0.2, Chi: 0.3, Psi: 0.4, Phi: 2,
};
const v4: LutarV4Input = {
  ...v1, R: 0.2, Chi: 0.3, Psi: 0.4,
  W: 2, Phi_IIT: 0.1, N_Noether: 3,
};
const v6: LutarV6Input = {
  ...v4, aeon_n: 0, Omega_n: 1,
  twistor_Z: [1, 0, 0, 0], bekenstein_area_m2: 1,
};

describe("ancient-inspired runtime formula domain contracts", () => {
  it("v1 requires actual E/M/I/T rather than unrelated confidence fields", () => {
    expect(lutarV1(v1).value).toBeCloseTo(
      Object.values(lutarV1(v1).terms).reduce((a, b) => a + b, 0),
      9,
    );
    expect(() => lutarV1({ ...v1, E: undefined } as unknown as LutarV1Input))
      .toThrow(/E must be finite/);
    expect(() => lutarV1({ ...v1, M: Infinity })).toThrow(/M must be finite/);
    expect(() => lutarV1({ ...v1, I: Number.NaN })).toThrow(/I must be finite/);
    expect(() => lutarV1({ ...v1, M: 1e308 })).toThrow(/overflow/);
  });

  it("v2 accepts only finite numeric inputs and integer winding", () => {
    const a = lutarV2(v2);
    const b = lutarV2({ ...v2, Phi: v2.Phi + 1 });
    expect(b.value - a.value).toBeCloseTo(1, 9);
    expect(() => lutarV2({ ...v2, Phi: 0.5 })).toThrow(/integer/);
    expect(() => lutarV2({ ...v2, R: Infinity })).toThrow(/R must be finite/);
    expect(() => lutarV2({ ...v2, eta: Number.NaN })).toThrow(/eta must be finite/);
  });

  it("v3 separates exact Inka ratio from modeled Egyptian seked", () => {
    const a = lutarV3({ ...v2, seked: 5.5 });
    const b = lutarV3({ ...v2, seked: 5.5, iota: 2 });
    expect(b.value - a.value).toBeCloseTo(8, 9);
    expect(a.terms["iota*Q_I"]).toBe(8);
    expect(() => lutarV3({ ...v2, seked: Number.NaN })).toThrow(/seked must be finite/);
  });

  it("v4 validates winding, IIT nonnegativity and Noether count independently", () => {
    expect(lutarV4(v4).closureSatisfied).toBe(true);
    expect(() => lutarV4({ ...v4, W: 2.1 })).toThrow(/winding must be integer/);
    expect(() => lutarV4({ ...v4, Phi_IIT: -1 })).toThrow(/non-negative/);
    expect(() => lutarV4({ ...v4, N_Noether: -1 })).toThrow(/non-negative integer/);
    expect(() => lutarV4({ ...v4, kappa: Infinity })).toThrow(/kappa must be finite/);
  });

  it("v5 modeled civilizational constants are explicit coefficients, not empirical proofs", () => {
    const a = lutarV5(v4);
    const b = lutarV5({ ...v4, theta_IC: 2 });
    expect(b.value - a.value).toBeCloseTo(64, 9);
    expect(() => lutarV5({ ...v4, theta_GT: NaN })).toThrow(/theta_GT must be finite/);
  });

  it("v6 refuses malformed clock, geometry, and boundedness inputs", () => {
    const a = lutarV6(v6);
    const b = lutarV6({ ...v6, Omega_n: 2 });
    expect(b.value).toBeCloseTo(4 * a.value, 8);
    expect(() => lutarV6({ ...v6, aeon_n: -1 })).toThrow(/aeon_n must be non-negative/);
    expect(() => lutarV6({ ...v6, Omega_n: Infinity })).toThrow(/Omega_n must be finite/);
    expect(() => lutarV6({ ...v6, Omega_n: 0 })).toThrow(/Omega_n must be > 0/);
    expect(() => lutarV6({ ...v6, twistor_Z: [1, 2] as unknown as [number, number, number, number] }))
      .toThrow(/twistor_Z/);
    expect(() => lutarV6({ ...v6, twistor_Z: [1, NaN, 0, 0] }))
      .toThrow(/twistor_Z/);
    expect(() => lutarV6({ ...v6, bekenstein_area_m2: -1 }))
      .toThrow(/area or enforcement/);
    expect(() => lutarV6({ ...v6, enforce_bekenstein: "yes" as unknown as boolean }))
      .toThrow(/area or enforcement/);
  });

  it("v7 returns finite modeled outputs and rejects unbounded coupling", () => {
    const answer = lutarV7(v6);
    expect(answer.L_values).toHaveLength(6);
    expect(answer.value).toBeCloseTo(answer.L_Omega * answer.unificationStrength, 8);
    expect(answer.unificationStrength).toBeGreaterThanOrEqual(0);
    expect(answer.unificationStrength).toBeLessThanOrEqual(1);
    expect(() => lutarV7({ ...v6, huftCoupling: Infinity })).toThrow(/huftCoupling/);
  });

  it("Omega rejects NaN weights, missing axes and non-convex weighting", () => {
    const L_values: [number, number, number, number, number, number] =
      [1, 2, 3, 4, 5, 6];
    expect(lutarOmega({ L_values }).value).toBeCloseTo(3.5, 9);
    expect(() => lutarOmega({ L_values: [1, 2, 3, 4, 5] as unknown as typeof L_values }))
      .toThrow(/exactly 6 entries/);
    expect(() => lutarOmega({ L_values: [...L_values.slice(0, 5), NaN] as typeof L_values }))
      .toThrow(/finite/);
    expect(() => lutarOmega({
      L_values, weights: [1, 0, 0, 0, 0, NaN],
    })).toThrow(/finite/);
    expect(() => lutarOmega({
      L_values, weights: [1, 1, 0, 0, 0, 0],
    })).toThrow(/sum to 1/);
  });

  it("stable softmax keeps large finite H from producing Infinity/Infinity", () => {
    for (const H of [-1000, -1, 0, 1, 1000]) {
      const weights = adaptiveWeights(H);
      expect(weights).toHaveLength(6);
      expect(weights.every((w) => Number.isFinite(w) && w >= 0)).toBe(true);
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    }
    expect(() => adaptiveWeights(Number.NaN)).toThrow(/H must be finite/);
    expect(() => adaptiveWeights(Number.POSITIVE_INFINITY)).toThrow(/H must be finite/);
    expect(() => adaptiveWeights(1e308)).toThrow(/exponent overflow/);
  });

  it("explicit Inka dimensions and Egyptian area identity", () => {
    expect(incaHuacasPerCeque()).toBe(328 / 41);
    expect(incaCequeHuacasPerDay()).toBeCloseTo(328 / 365.24, 12);
    expect(incaHuacasPerCeque()).not.toBe(incaCequeHuacasPerDay());
    expect(rhindCircleArea(9)).toBe(64);
    expect(rhindCircleArea(18)).toBe(256);
  });

  it("Maya Calendar Round is the exact least common multiple", () => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = 365 * 260 / gcd(365, 260);
    expect(lcm).toBe(18980);
    expect(mayaCalendarRound()).toBe(lcm);
    expect(lcm / 365).toBe(52);
    expect(lcm / 260).toBe(73);
  });
});
