import { describe, it, expect } from "vitest";
import { lambdaScore, lambdaVerdict, compositeLambda } from "../src/lambda.js";

describe("lambdaScore — closed-form geometric mean", () => {
  it("returns 1 for empty axis set", () => {
    expect(lambdaScore({})).toBe(1);
  });

  it("returns 0 if any axis is 0 — single zero collapses Λ", () => {
    expect(lambdaScore({ a: 0.99, b: 0.99, c: 0 })).toBe(0);
  });

  it("returns 0 for negative or non-finite values", () => {
    expect(lambdaScore({ a: -0.1 })).toBe(0);
    expect(lambdaScore({ a: NaN })).toBe(0);
    expect(lambdaScore({ a: Infinity })).toBe(0);
  });

  it("equals the value itself for a single axis", () => {
    expect(lambdaScore({ a: 0.7 })).toBeCloseTo(0.7, 10);
  });

  it("equals geometric mean for two equal axes", () => {
    expect(lambdaScore({ a: 0.5, b: 0.5 })).toBeCloseTo(0.5, 10);
  });

  it("clamps values >1 to 1 — overconfidence not rewarded", () => {
    const v = lambdaScore({ a: 0.5, b: 1 });
    expect(v).toBeCloseTo(Math.sqrt(0.5), 10);
  });

  it("is deterministic — same input → same output forever", () => {
    const a = lambdaScore({ x: 0.3, y: 0.4, z: 0.5 });
    const b = lambdaScore({ x: 0.3, y: 0.4, z: 0.5 });
    expect(a).toBe(b);
  });
});

describe("lambdaVerdict — three-band thresholding", () => {
  it("PROCEED above 0.85", () => {
    expect(lambdaVerdict(0.86)).toBe("PROCEED");
    expect(lambdaVerdict(0.99)).toBe("PROCEED");
  });
  it("QUARANTINE between 0.5 and 0.85", () => {
    expect(lambdaVerdict(0.5)).toBe("QUARANTINE");
    expect(lambdaVerdict(0.84)).toBe("QUARANTINE");
  });
  it("ABORT below 0.5", () => {
    expect(lambdaVerdict(0.49)).toBe("ABORT");
    expect(lambdaVerdict(0)).toBe("ABORT");
  });
  it("respects custom thresholds", () => {
    expect(lambdaVerdict(0.7, { proceed: 0.9, quarantine: 0.6 })).toBe("QUARANTINE");
    expect(lambdaVerdict(0.95, { proceed: 0.9, quarantine: 0.6 })).toBe("PROCEED");
  });
});

describe("compositeLambda", () => {
  it("returns 1 for no rails", () => {
    expect(compositeLambda([])).toBe(1);
  });
  it("collapses to 0 if any rail is 0", () => {
    expect(compositeLambda([{ lambda: 0.9 }, { lambda: 0 }])).toBe(0);
  });
  it("is the geometric mean of rail Λs", () => {
    expect(compositeLambda([{ lambda: 0.5 }, { lambda: 0.5 }])).toBeCloseTo(0.5, 10);
  });
});
