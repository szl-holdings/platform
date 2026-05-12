import { describe, it, expect } from "vitest";
import { evaluateDividedLine, ontologicalGrounding } from "../src/divided-line.js";

const stamp = (over: Partial<Parameters<typeof evaluateDividedLine>[0]> = {}) => ({
  claimId: "c1",
  declaredTier: "DIANOIA" as const,
  hypothesisIds: ["h1"],
  raisedHypothesisIds: [],
  synopticWitnessHash: null,
  ...over,
});

describe("Primitive 29 — Divided Line", () => {
  it("admits EIKASIA without hypotheses", () => {
    const r = evaluateDividedLine(stamp({ declaredTier: "EIKASIA", hypothesisIds: [] }));
    expect(r.admittedTier).toBe("EIKASIA");
    expect(r.groundingScore).toBe(0.0);
    expect(r.verdict).toBe("ADMIT_AT_EIKASIA");
  });

  it("admits PISTIS without hypotheses", () => {
    const r = evaluateDividedLine(stamp({ declaredTier: "PISTIS", hypothesisIds: [] }));
    expect(r.admittedTier).toBe("PISTIS");
    expect(r.groundingScore).toBeCloseTo(0.33);
  });

  it("demotes DIANOIA when no hypotheses declared", () => {
    const r = evaluateDividedLine(stamp({ hypothesisIds: [] }));
    expect(r.verdict).toBe("DEMOTE_NO_HYPOTHESES");
    expect(r.admittedTier).toBe("PISTIS");
  });

  it("admits DIANOIA when hypotheses present", () => {
    const r = evaluateDividedLine(stamp({ declaredTier: "DIANOIA" }));
    expect(r.admittedTier).toBe("DIANOIA");
    expect(r.groundingScore).toBeCloseTo(0.66);
  });

  it("demotes NOESIS to DIANOIA when hypotheses unraised", () => {
    const r = evaluateDividedLine(stamp({ declaredTier: "NOESIS" }));
    expect(r.verdict).toBe("DEMOTE_UNRAISED_HYPOTHESES");
    expect(r.admittedTier).toBe("DIANOIA");
  });

  it("demotes NOESIS without synoptic witness", () => {
    const r = evaluateDividedLine(
      stamp({ declaredTier: "NOESIS", raisedHypothesisIds: ["h1"] }),
    );
    expect(r.verdict).toBe("DEMOTE_NO_WITNESS");
    expect(r.admittedTier).toBe("DIANOIA");
  });

  it("admits NOESIS only with raised hypotheses + witness", () => {
    const r = evaluateDividedLine(
      stamp({
        declaredTier: "NOESIS",
        raisedHypothesisIds: ["h1"],
        synopticWitnessHash: "deadbeef",
      }),
    );
    expect(r.admittedTier).toBe("NOESIS");
    expect(r.groundingScore).toBe(1.0);
    expect(r.verdict).toBe("ADMIT_AT_NOESIS");
  });

  it("aggregates ontological grounding by mean", () => {
    const a = evaluateDividedLine(stamp({ declaredTier: "EIKASIA", hypothesisIds: [] }));
    const b = evaluateDividedLine(
      stamp({
        declaredTier: "NOESIS",
        raisedHypothesisIds: ["h1"],
        synopticWitnessHash: "h",
      }),
    );
    expect(ontologicalGrounding([a, b])).toBeCloseTo(0.5, 5);
    expect(ontologicalGrounding([])).toBe(0);
  });
});
