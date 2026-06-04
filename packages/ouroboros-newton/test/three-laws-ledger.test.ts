import { describe, it, expect } from "vitest";
import { ThreeLawsLedger } from "../src/three-laws-ledger.js";

describe("Primitive 41 — Three-Laws ledger", () => {
  it("OK on Lex II: p1 = p0 + F·dt", () => {
    const l = new ThreeLawsLedger();
    const r = l.append({
      id: "t1",
      p0: [0, 0, 0],
      F: [1, 0, 0],
      dt: 2,
      p1: [2, 0, 0],
      reactionPairId: "R",
    });
    expect(r.verdict).toBe("OK");
  });

  it("LEX2_FAIL when momentum doesn't match", () => {
    const l = new ThreeLawsLedger();
    const r = l.append({
      id: "t2",
      p0: [0],
      F: [1],
      dt: 1,
      p1: [10],
    });
    expect(r.verdict).toBe("LEX2_FAIL");
  });

  it("DIM_MISMATCH when vectors differ in length", () => {
    const l = new ThreeLawsLedger();
    const r = l.append({
      id: "t3",
      p0: [0, 0],
      F: [1],
      dt: 1,
      p1: [1, 0],
    });
    expect(r.verdict).toBe("DIM_MISMATCH");
  });

  it("LEX3_UNPAIRED when force applied but no reaction pair", () => {
    const l = new ThreeLawsLedger();
    l.append({ id: "a", p0: [0], F: [2], dt: 1, p1: [2] });
    const s = l.summary();
    expect(s.lex3Unpaired).toBe(1);
  });

  it("OK when paired action+reaction both present", () => {
    const l = new ThreeLawsLedger();
    l.append({ id: "a", p0: [0], F: [2], dt: 1, p1: [2], reactionPairId: "P" });
    l.append({ id: "b", p0: [0], F: [-2], dt: 1, p1: [-2], reactionPairId: "P" });
    const s = l.summary();
    expect(s.ok).toBe(2);
    expect(s.lex3Unpaired).toBe(0);
  });

  it("zero force does not require pair", () => {
    const l = new ThreeLawsLedger();
    l.append({ id: "a", p0: [5], F: [0], dt: 1, p1: [5] });
    const s = l.summary();
    expect(s.ok).toBe(1);
    expect(s.lex3Unpaired).toBe(0);
  });

  it("rejects non-positive dt", () => {
    const l = new ThreeLawsLedger();
    const r = l.append({ id: "z", p0: [0], F: [1], dt: 0, p1: [0] });
    expect(r.verdict).toBe("LEX2_FAIL");
  });

  it("rejects non-positive tolerance", () => {
    expect(() => new ThreeLawsLedger(0)).toThrow();
    expect(() => new ThreeLawsLedger(-1)).toThrow();
  });
});
