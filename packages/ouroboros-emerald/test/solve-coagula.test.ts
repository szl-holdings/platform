import { describe, it, expect } from "vitest";
import { runSolveCoagula } from "../src/solve-coagula.js";

describe("Primitive 39 — Solve-et-Coagula gate", () => {
  it("closes when both phases balance", () => {
    const r = runSolveCoagula({
      whole: 10,
      parts: [3, 3, 4],
      recombined: 10,
    });
    expect(r.closes).toBe(true);
    expect(r.solveResidue).toBeCloseTo(0, 12);
    expect(r.coagulaResidue).toBeCloseTo(0, 12);
  });

  it("rejects when solve phase missing", () => {
    const r = runSolveCoagula({
      whole: 10,
      parts: [],
      recombined: 10,
    });
    expect(r.closes).toBe(false);
    expect(r.bothPhasesPresent).toBe(false);
    expect(r.rationale).toContain("missing");
  });

  it("logs honest residue when solve does not close", () => {
    const r = runSolveCoagula({
      whole: 10,
      parts: [3, 3, 3],
      recombined: 10,
    });
    expect(r.closes).toBe(false);
    expect(r.solveResidue).toBeCloseTo(1, 9);
  });

  it("logs honest residue when coagula does not close", () => {
    const r = runSolveCoagula({
      whole: 10,
      parts: [5, 5],
      recombined: 11,
    });
    expect(r.closes).toBe(false);
    expect(r.coagulaResidue).toBeCloseTo(1, 9);
  });

  it("partsSum equals sum of parts", () => {
    const r = runSolveCoagula({
      whole: 6,
      parts: [1, 2, 3],
      recombined: 6,
    });
    expect(r.partsSum).toBe(6);
  });
});
