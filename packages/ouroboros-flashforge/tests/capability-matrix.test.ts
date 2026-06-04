import { describe, it, expect } from "vitest";
import { buildMatrix, coverage, admits } from "../src/capability-matrix.js";

describe("primitive 61 — capability matrix", () => {
  it("builds a matrix from cells", () => {
    const m = buildMatrix([
      { op: "attention", target: "SM75", admits: true, rationale: "Turing OK" },
      { op: "attention", target: "SM90", admits: true, rationale: "Hopper OK" },
      { op: "fp4-gemm", target: "SM75", admits: false, rationale: "no FP4" },
      { op: "fp4-gemm", target: "SM90", admits: false, rationale: "no FP4" },
      { op: "fp4-gemm", target: "SM100", admits: true, rationale: "Blackwell" },
    ]);
    expect(m.ops).toEqual(["attention", "fp4-gemm"]);
    expect(m.targets).toEqual(["SM100", "SM75", "SM90"]);
  });

  it("rejects empty input", () => {
    expect(() => buildMatrix([])).toThrow(/at least 1/);
  });

  it("rejects conflicting verdicts for same cell", () => {
    expect(() =>
      buildMatrix([
        { op: "x", target: "T", admits: true, rationale: "yes" },
        { op: "x", target: "T", admits: false, rationale: "no" },
      ])
    ).toThrow(/conflicting/);
  });

  it("computes coverage with unspecified gaps", () => {
    const m = buildMatrix([
      { op: "a", target: "T1", admits: true, rationale: "" },
      { op: "a", target: "T2", admits: false, rationale: "" },
      { op: "b", target: "T1", admits: true, rationale: "" },
      // (b, T2) missing on purpose
    ]);
    const c = coverage(m);
    expect(c.totalCells).toBe(4);
    expect(c.admitted).toBe(2);
    expect(c.refused).toBe(1);
    expect(c.unspecified).toEqual([{ op: "b", target: "T2" }]);
    expect(c.coverage).toBe(0.5);
  });

  it("admits() refuses undeclared cells", () => {
    const m = buildMatrix([
      { op: "a", target: "T", admits: true, rationale: "" },
    ]);
    expect(admits(m, "a", "T")).toBe(true);
    expect(() => admits(m, "a", "Z")).toThrow(/no capability cell/);
  });

  it("computes full coverage when matrix complete", () => {
    const m = buildMatrix([
      { op: "x", target: "T1", admits: true, rationale: "" },
      { op: "x", target: "T2", admits: true, rationale: "" },
    ]);
    const c = coverage(m);
    expect(c.coverage).toBe(1);
    expect(c.unspecified.length).toBe(0);
    expect(c.rationale).toMatch(/fully specified/);
  });
});
