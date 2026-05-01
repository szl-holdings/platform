import { describe, it, expect } from "vitest";
import { checkSfumato } from "../src/sfumato.js";

describe("Primitive 60 — Sfumato gradient continuity", () => {
  it("continuous when all steps within tolerance", () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({
      position: i,
      value: i * 0.01,
    }));
    const r = checkSfumato(samples, 0.05);
    expect(r.continuous).toBe(true);
    expect(r.discontinuityIndex).toBe(-1);
  });

  it("flags discontinuity when a step exceeds tolerance", () => {
    const samples = [
      { position: 0, value: 0 },
      { position: 1, value: 0.01 },
      { position: 2, value: 0.5 }, // jump
      { position: 3, value: 0.51 },
    ];
    const r = checkSfumato(samples, 0.05);
    expect(r.continuous).toBe(false);
    expect(r.discontinuityIndex).toBe(2);
  });

  it("totalVariation is sum of absolute step sizes", () => {
    const samples = [
      { position: 0, value: 0 },
      { position: 1, value: 0.1 },
      { position: 2, value: 0 },
    ];
    const r = checkSfumato(samples, 0.5);
    expect(r.totalVariation).toBeCloseTo(0.2, 9);
  });

  it("requires ≥ 2 samples", () => {
    expect(() => checkSfumato([{ position: 0, value: 0 }])).toThrow();
  });

  it("orders samples by position before measuring", () => {
    const samples = [
      { position: 2, value: 0.1 },
      { position: 0, value: 0 },
      { position: 1, value: 0.05 },
    ];
    const r = checkSfumato(samples, 0.1);
    expect(r.continuous).toBe(true);
  });
});
