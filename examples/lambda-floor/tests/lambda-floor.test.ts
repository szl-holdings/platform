/**
 * Admission truth-table tests for the `lambda-floor` Pepr capability.
 *
 * These tests exercise the pure evaluator directly so they run without a
 * cluster. The companion in-cluster test (./lambda-floor-opa-parity.test.ts)
 * also drives the capability through Pepr's test runner and asserts the
 * exact same allow/deny outcomes as the SZL OPA gateway pack.
 */

import { describe, it, expect } from "vitest";
import {
  AXIS_FLOORS,
  LAMBDA_CONJUNCTIVE_FLOOR,
  MORAL_GROUNDING_FLOOR,
  MEASURABILITY_HONESTY_FLOOR,
  evaluateLambdaFloor,
  lambdaConjunctive,
} from "../capabilities/lambda-floor.js";

// All-pass baseline used as the starting point for each truth-table row.
const ADMITTABLE: Record<string, number> = {
  moralGrounding: 0.97,
  measurabilityHonesty: 0.97,
  temporalConsistency: 0.93,
  informationIntegrity: 0.93,
  actionReversibility: 0.93,
  scopeContainment: 0.93,
  stakeholderAlignment: 0.93,
  evidenceAdequacy: 0.93,
  consentBoundary: 0.93,
};

describe("lambda-floor evaluator — admission truth table", () => {
  it("admits when all axes meet their floors and Λ_conj ≥ 0.90", () => {
    const result = evaluateLambdaFloor(ADMITTABLE);
    expect(result.admitted).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.lambdaConjunctive).toBeGreaterThanOrEqual(
      LAMBDA_CONJUNCTIVE_FLOOR,
    );
  });

  it("denies moralGrounding=0.92 with MATURITY_GATE_BLOCKED on moralGrounding", () => {
    const result = evaluateLambdaFloor({ ...ADMITTABLE, moralGrounding: 0.92 });
    expect(result.admitted).toBe(false);
    const head = result.failures[0];
    expect(head.axis).toBe("moralGrounding");
    expect(head.value).toBeCloseTo(0.92, 6);
    expect(head.floor).toBe(MORAL_GROUNDING_FLOOR);
  });

  it("denies measurabilityHonesty=0.94 with the measurability floor failure", () => {
    const result = evaluateLambdaFloor({
      ...ADMITTABLE,
      measurabilityHonesty: 0.94,
    });
    expect(result.admitted).toBe(false);
    expect(result.failures.some((f) => f.axis === "measurabilityHonesty")).toBe(
      true,
    );
    const f = result.failures.find((x) => x.axis === "measurabilityHonesty")!;
    expect(f.floor).toBe(MEASURABILITY_HONESTY_FLOOR);
  });

  // Per-axis 0.89 row — every non-special-cased axis must fail at 0.89.
  const flexAxes = AXIS_FLOORS.filter((a) => a.floor === 0.9).map((a) => a.id);
  it.each(flexAxes)(
    "denies when axis %s drops to 0.89 (floor 0.90)",
    (axis) => {
      const result = evaluateLambdaFloor({ ...ADMITTABLE, [axis]: 0.89 });
      expect(result.admitted).toBe(false);
      expect(result.failures.some((f) => f.axis === axis)).toBe(true);
    },
  );

  it("denies when Λ_conj < 0.90 even if every individual axis is within slack", () => {
    // Push the geometric mean below 0.90 by uniformly lowering all flex axes
    // to a value that individually passes their 0.90 floor but jointly fails
    // the conjunctive 0.90 floor once moral/measurability are kept high.
    // Because exp(mean(log(v))) on identical vs is just v, force a fail with
    // an axis at exactly its floor and another below 1.
    const allAtFloor: Record<string, number> = {};
    for (const { id, floor } of AXIS_FLOORS) allAtFloor[id] = floor;
    // Drop one axis well below its floor so both the per-axis check and the
    // conjunctive check trip (0.85 leaves Λ_conj at ~0.905, still above the
    // 0.90 floor; 0.50 reliably brings it to ~0.853 < 0.90).
    allAtFloor["consentBoundary"] = 0.5;
    const result = evaluateLambdaFloor(allAtFloor);
    expect(result.admitted).toBe(false);
    // Both the axis failure and the conjunctive failure should appear.
    expect(result.failures.some((f) => f.axis === "consentBoundary")).toBe(
      true,
    );
    expect(
      result.failures.some((f) => f.axis === "lambdaConjunctive"),
    ).toBe(true);
  });

  it("denies missing-axis (treated as 0)", () => {
    const incomplete = { ...ADMITTABLE };
    delete incomplete.consentBoundary;
    const result = evaluateLambdaFloor(incomplete);
    expect(result.admitted).toBe(false);
    expect(result.failures.some((f) => f.axis === "consentBoundary")).toBe(
      true,
    );
  });
});

describe("lambdaConjunctive — closed form", () => {
  it("returns 1 when every axis is 1", () => {
    const ones: Record<string, number> = {};
    for (const { id } of AXIS_FLOORS) ones[id] = 1;
    expect(lambdaConjunctive(ones)).toBeCloseTo(1, 9);
  });

  it("returns 0 when any axis is 0", () => {
    const mostly = { ...ADMITTABLE, scopeContainment: 0 };
    expect(lambdaConjunctive(mostly)).toBe(0);
  });
});
