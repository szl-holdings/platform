import { describe, it, expect } from "vitest";
import { runElenchus } from "../src/elenchus.js";

describe("Primitive 31 — Elenchus", () => {
  it("WITHSTOOD when claim derivable and no contradiction", () => {
    const r = runElenchus({
      claimId: "Q",
      hypothesisIds: ["H"],
      propositions: [
        { id: "Q", text: "the claim" },
        { id: "H", text: "hypothesis" },
      ],
      inferences: [{ fromIds: ["H"], toId: "Q", hypothesisIds: ["H"] }],
    });
    expect(r.verdict).toBe("WITHSTOOD");
    expect(r.reachedIds).toContain("Q");
  });

  it("REFUTED when contradiction reachable", () => {
    const r = runElenchus({
      claimId: "Q",
      hypothesisIds: ["H"],
      propositions: [
        { id: "P", text: "p" },
        { id: "NP", text: "not p", negationOf: "P" },
        { id: "H", text: "h" },
        { id: "Q", text: "q" },
      ],
      inferences: [
        { fromIds: ["H"], toId: "P", hypothesisIds: ["H"] },
        { fromIds: ["H"], toId: "NP", hypothesisIds: ["H"] },
      ],
    });
    expect(r.verdict).toBe("REFUTED");
    expect(r.contradictionPair).toEqual(["NP", "P"]);
  });

  it("APORIA when claim unreachable and no contradiction", () => {
    const r = runElenchus({
      claimId: "Q",
      hypothesisIds: ["H"],
      propositions: [
        { id: "Q", text: "q" },
        { id: "H", text: "h" },
      ],
      inferences: [],
    });
    expect(r.verdict).toBe("APORIA");
  });

  it("APORIA when claim id absent from propositions", () => {
    const r = runElenchus({
      claimId: "missing",
      hypothesisIds: ["H"],
      propositions: [{ id: "H", text: "h" }],
      inferences: [],
    });
    expect(r.verdict).toBe("APORIA");
    expect(r.reason).toContain("absent");
  });

  it("does not advance inferences requiring missing hypotheses", () => {
    const r = runElenchus({
      claimId: "Q",
      hypothesisIds: [],
      propositions: [
        { id: "Q", text: "q" },
        { id: "H", text: "h" },
      ],
      inferences: [{ fromIds: ["H"], toId: "Q", hypothesisIds: ["H"] }],
    });
    expect(r.verdict).toBe("APORIA");
    expect(r.reachedIds).not.toContain("Q");
  });

  it("respects maxSteps cap (no runaway)", () => {
    const r = runElenchus({
      claimId: "Q",
      hypothesisIds: ["H"],
      propositions: [
        { id: "H", text: "h" },
        { id: "Q", text: "q" },
      ],
      inferences: [{ fromIds: ["H"], toId: "Q", hypothesisIds: ["H"] }],
      maxSteps: 1,
    });
    expect(r.steps).toBeLessThanOrEqual(1);
    expect(r.verdict).toBe("WITHSTOOD");
  });
});
