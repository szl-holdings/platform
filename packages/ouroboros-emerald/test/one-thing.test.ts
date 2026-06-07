import { describe, it, expect } from "vitest";
import { checkOneThing } from "../src/one-thing.js";

describe("Primitive 38 — One-Thing identity", () => {
  it("preserved when origin matches and conserved equal", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 100, transformations: [] },
      { originId: "X", conserved: 100, transformations: ["t1"] },
    );
    expect(r.preserved).toBe(true);
  });

  it("violated when origin differs", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 100, transformations: [] },
      { originId: "Y", conserved: 100, transformations: [] },
    );
    expect(r.preserved).toBe(false);
    expect(r.rationale).toContain("origin mismatch");
  });

  it("violated when conserved drifts beyond tolerance", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 100, transformations: [] },
      { originId: "X", conserved: 90, transformations: [] },
    );
    expect(r.preserved).toBe(false);
  });

  it("preserved within tolerance band", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 100, transformations: [] },
      { originId: "X", conserved: 100 + 1e-12, transformations: [] },
    );
    expect(r.preserved).toBe(true);
  });

  it("driftRel computed correctly", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 200, transformations: [] },
      { originId: "X", conserved: 198, transformations: [] },
    );
    expect(r.driftRel).toBeCloseTo(0.01, 6);
  });

  it("rationale set on success", () => {
    const r = checkOneThing(
      { originId: "X", conserved: 5, transformations: [] },
      { originId: "X", conserved: 5, transformations: [] },
    );
    expect(r.rationale).toContain("preserved");
  });
});
