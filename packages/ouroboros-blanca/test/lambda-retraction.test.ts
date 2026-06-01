import { describe, it, expect } from "vitest";
import {
  applyRetraction,
  lambdaRetractionAxis,
  recordRetraction,
  validateCommitment,
  type FalsifiabilityCommitment,
} from "../src/lambda-retraction.ts";

const LAMBDA: FalsifiabilityCommitment = {
  constantName: "cosmologicalConstant",
  constantValue: 1.1e-52,
  witnessName: "hubbleRedshift",
  retractionThreshold: 0.05,
  publicLogRef: "log://ouroboros/retractions/lambda",
};

describe("validateCommitment", () => {
  it("accepts a fully-specified commitment", () => {
    expect(validateCommitment(LAMBDA)).toBe(true);
  });

  it("rejects empty constant name", () => {
    expect(validateCommitment({ ...LAMBDA, constantName: "" })).toBe(false);
  });

  it("rejects empty witness name", () => {
    expect(validateCommitment({ ...LAMBDA, witnessName: "  " })).toBe(false);
  });

  it("rejects empty public log ref", () => {
    expect(validateCommitment({ ...LAMBDA, publicLogRef: "" })).toBe(false);
  });

  it("rejects non-finite or non-positive threshold", () => {
    expect(validateCommitment({ ...LAMBDA, retractionThreshold: 0 })).toBe(false);
    expect(validateCommitment({ ...LAMBDA, retractionThreshold: -1 })).toBe(false);
    expect(validateCommitment({ ...LAMBDA, retractionThreshold: NaN })).toBe(false);
  });
});

describe("applyRetraction", () => {
  it("HOLDING when signal is well below threshold", () => {
    const r = applyRetraction(LAMBDA, 0.01);
    expect(r.verdict).toBe("HOLDING");
    expect(r.retracted).toBe(false);
    expect(lambdaRetractionAxis(r)).toBe(1);
  });

  it("MARGINAL when signal is in the upper 20% band", () => {
    const r = applyRetraction(LAMBDA, 0.045);
    expect(r.verdict).toBe("MARGINAL");
    const axis = lambdaRetractionAxis(r);
    expect(axis).toBeGreaterThan(0);
    expect(axis).toBeLessThan(1);
  });

  it("RETRACTED when signal meets or exceeds threshold", () => {
    const r = applyRetraction(LAMBDA, 0.06);
    expect(r.verdict).toBe("RETRACTED");
    expect(r.retracted).toBe(true);
    expect(lambdaRetractionAxis(r)).toBe(0);
  });

  it("INADMISSIBLE when commitment is incomplete", () => {
    const broken = { ...LAMBDA, witnessName: "" };
    const r = applyRetraction(broken, 0.001);
    expect(r.verdict).toBe("INADMISSIBLE");
    expect(lambdaRetractionAxis(r)).toBe(0);
  });

  it("rejects non-finite observed signal", () => {
    expect(() => applyRetraction(LAMBDA, NaN)).toThrow();
    expect(() => applyRetraction(LAMBDA, Infinity)).toThrow();
  });

  it("axis is monotonic in margin within the marginal band", () => {
    const a = applyRetraction(LAMBDA, 0.041);
    const b = applyRetraction(LAMBDA, 0.048);
    expect(lambdaRetractionAxis(a)).toBeGreaterThan(lambdaRetractionAxis(b));
  });

  it("treats negative signal magnitudes the same as positive", () => {
    const positive = applyRetraction(LAMBDA, 0.06);
    const negative = applyRetraction(LAMBDA, -0.06);
    expect(positive.verdict).toBe(negative.verdict);
  });
});

describe("recordRetraction", () => {
  it("produces a public log entry with all required fields", () => {
    const r = applyRetraction(LAMBDA, 0.07);
    const entry = recordRetraction(r, 1_700_000_000, "Hubble redshift exceeds tolerance");
    expect(entry.timestamp).toBe(1_700_000_000);
    expect(entry.publicLogRef).toBe(LAMBDA.publicLogRef);
    expect(entry.retracted).toBe(true);
    expect(entry.reason).toMatch(/Hubble/);
  });

  it("rejects negative or non-finite timestamp", () => {
    const r = applyRetraction(LAMBDA, 0.07);
    expect(() => recordRetraction(r, -1, "x")).toThrow();
    expect(() => recordRetraction(r, NaN, "x")).toThrow();
  });

  it("records both retracted and non-retracted reports", () => {
    const holding = applyRetraction(LAMBDA, 0.01);
    const entry = recordRetraction(holding, 0, "no signal");
    expect(entry.retracted).toBe(false);
  });
});
