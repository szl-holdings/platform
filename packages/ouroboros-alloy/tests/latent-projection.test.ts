import { describe, it, expect } from "vitest";
import { project, equivalent } from "../src/latent-projection.js";

describe("primitive 69 — latent projection", () => {
  it("projects to lower dim and reports reconstruction error", () => {
    const fp = project({ claimId: "c1", values: [1, 2, 3, 4] }, 2);
    expect(fp.latent).toEqual([1, 2]);
    // dropped dims [3,4] — error sqrt(9 + 16) = 5
    expect(fp.reconstructionError).toBeCloseTo(5);
  });

  it("zero error when k equals input length", () => {
    const fp = project({ claimId: "c", values: [1, 2, 3] }, 3);
    expect(fp.reconstructionError).toBe(0);
  });

  it("rejects k > input length", () => {
    expect(() => project({ claimId: "c", values: [1, 2] }, 5)).toThrow(
      /exceeds vector length/
    );
  });

  it("rejects k < 1", () => {
    expect(() => project({ claimId: "c", values: [1] }, 0)).toThrow(
      /must be >= 1/
    );
  });

  it("equivalent() detects near-identical fingerprints", () => {
    const a = project({ claimId: "a", values: [1, 0, 0, 0] }, 2);
    const b = project({ claimId: "b", values: [1, 0.001, 0, 0] }, 2);
    const e = equivalent(a, b, 0.01);
    expect(e.equivalent).toBe(true);
  });

  it("equivalent() rejects orthogonal fingerprints", () => {
    const a = project({ claimId: "a", values: [1, 0, 0, 0] }, 2);
    const b = project({ claimId: "b", values: [0, 1, 0, 0] }, 2);
    const e = equivalent(a, b, 0.01);
    expect(e.equivalent).toBe(false);
    expect(e.cosine).toBeCloseTo(0);
  });

  it("equivalent() refuses dim mismatch", () => {
    const a = project({ claimId: "a", values: [1, 2, 3] }, 2);
    const b = project({ claimId: "b", values: [1, 2, 3] }, 3);
    expect(() => equivalent(a, b, 0.01)).toThrow(/dims differ/);
  });
});
