import { describe, it, expect } from "vitest";
import {
  buildMask,
  checkDependency,
} from "../src/sparse-attention-mask.js";

describe("primitive 67 — sparse-attention mask", () => {
  it("builds a mask from declared subset", () => {
    const m = buildMask({
      claimId: "c1",
      available: ["r1", "r2", "r3", "r4"],
      attended: ["r1", "r3"],
      rationale: "only r1 and r3 are relevant",
    });
    expect(m.attended.size).toBe(2);
    expect(m.totalAvailable).toBe(4);
  });

  it("refuses attended outside available", () => {
    expect(() =>
      buildMask({
        claimId: "c1",
        available: ["r1"],
        attended: ["r1", "ghost"],
        rationale: "",
      })
    ).toThrow(/not in available/);
  });

  it("checkDependency passes when all deps inside mask", () => {
    const m = buildMask({
      claimId: "c1",
      available: ["r1", "r2", "r3"],
      attended: ["r1", "r2"],
      rationale: "",
    });
    const d = checkDependency(m, ["r1", "r2"]);
    expect(d.ok).toBe(true);
    expect(d.outsideMask).toEqual([]);
  });

  it("checkDependency fails when dep outside mask", () => {
    const m = buildMask({
      claimId: "c1",
      available: ["r1", "r2", "r3"],
      attended: ["r1"],
      rationale: "",
    });
    const d = checkDependency(m, ["r1", "r3"]);
    expect(d.ok).toBe(false);
    expect(d.outsideMask).toEqual(["r3"]);
    expect(d.rationale).toMatch(/dependency violated/);
  });

  it("computes sparsity correctly", () => {
    const m = buildMask({
      claimId: "c1",
      available: ["r1", "r2", "r3", "r4"],
      attended: ["r1"],
      rationale: "",
    });
    const d = checkDependency(m, ["r1"]);
    expect(d.sparsity).toBeCloseTo(0.75);
  });
});
