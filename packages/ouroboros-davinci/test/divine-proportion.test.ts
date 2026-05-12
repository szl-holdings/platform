import { describe, it, expect } from "vitest";
import { PHI, verifyPhi, ratioFromPair } from "../src/divine-proportion.js";

describe("Primitive 59 — Divine-proportion ledger", () => {
  it("PHI equals (1+√5)/2", () => {
    expect(PHI).toBeCloseTo(1.6180339887, 9);
  });

  it("exact verdict at φ", () => {
    expect(verifyPhi(PHI).verdict).toBe("exact");
  });

  it("approximate verdict for nearby ratios", () => {
    expect(verifyPhi(1.6).verdict).toBe("approximate");
  });

  it("none verdict for far ratios", () => {
    expect(verifyPhi(2.0).verdict).toBe("none");
  });

  it("ratioFromPair computes a/b", () => {
    expect(ratioFromPair(8, 5)).toBeCloseTo(1.6, 9);
  });

  it("ratioFromPair throws on zero denominator", () => {
    expect(() => ratioFromPair(1, 0)).toThrow();
  });

  it("rationale tags approximate so it cannot be cited as exact", () => {
    const r = verifyPhi(1.62);
    expect(r.verdict).toBe("approximate");
    expect(r.rationale).toContain("not be cited as exact");
  });
});
