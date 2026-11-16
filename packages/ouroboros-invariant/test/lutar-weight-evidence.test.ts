import { describe, expect, it } from "vitest";
import {
  defaultWeights,
  defaultWeights5,
  inspectableWeight,
  lutarInvariant,
  lutarInvariant5,
  weightsAreExact,
  weightsAreExact5,
} from "../src/lutar-invariant.ts";

const axes = { cleanliness: 0.2, horizon: 0.4, resonance: 0.6, frustum: 0.8 };
describe("Inspectable weights bind their terms to the executed exponent", () => {
  it.each([0, -1, 0.5, NaN, Infinity])("rejects a mismatched four-axis exponent %s", (value) => {
    const weights = { ...defaultWeights(), cleanliness: { terms: [4], value } };
    expect(weightsAreExact(weights)).toBe(false);
    expect(() => lutarInvariant(axes, weights)).toThrow(/weight-sum constraint/);
  });

  it.each([0, -1, 0.5, NaN, Infinity])("rejects a mismatched fifth-axis exponent %s", (value) => {
    const weights = { ...defaultWeights5(), gaussClosure: { terms: [5], value } };
    expect(weightsAreExact5(weights)).toBe(false);
    expect(() => lutarInvariant5({ ...axes, gaussClosure: 0.3 }, weights)).toThrow(/weight-sum constraint/);
  });

  it.each([[8, 8], [], [0], [-4], [4.5], [Number.MAX_SAFE_INTEGER + 1]])(
    "rejects malformed or non-distinct terms %j", (...terms) => {
      const weights = { ...defaultWeights(), cleanliness: { terms, value: 0.25 } };
      expect(weightsAreExact(weights)).toBe(false);
    }
  );

  it("accepts a valid asymmetric rational witness and keeps its bounds", () => {
    const weights = {
      cleanliness: inspectableWeight(1, 2),
      horizon: inspectableWeight(1, 3),
      resonance: inspectableWeight(1, 12),
      frustum: inspectableWeight(1, 12),
    };
    expect(weightsAreExact(weights)).toBe(true);
    const report = lutarInvariant(axes, weights);
    expect(report.invariant).toBeGreaterThanOrEqual(report.proof.bound.lower);
    expect(report.invariant).toBeLessThanOrEqual(report.proof.bound.upper);
  });
});
