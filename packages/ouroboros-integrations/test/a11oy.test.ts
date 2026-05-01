import { describe, it, expect } from "vitest";
import { reconcileHandoff, auditFleetHandoffs } from "../src/a11oy.ts";

describe("A11oy reconcileHandoff", () => {
  it("PROCEEDS when all three agents agree", () => {
    const v = reconcileHandoff({
      handoffId: "h1",
      fromAgent: "claude",
      toAgent: "gpt5",
      observerAgent: "perplexity",
      fromLeaves: ["a", "b"],
      toLeaves: ["a", "b"],
      observerLeaves: ["a", "b"],
      timestamp: 1,
    });
    expect(v.action).toBe("PROCEED");
    expect(v.verdict).toBe("RECONCILED");
  });

  it("QUARANTINES when one agent has a missing leaf", () => {
    const v = reconcileHandoff({
      handoffId: "h2",
      fromAgent: "claude",
      toAgent: "gpt5",
      observerAgent: "perplexity",
      fromLeaves: ["a", "b", "c"],
      toLeaves: ["a", "b"],
      observerLeaves: ["a", "b", "c"],
      timestamp: 2,
    });
    expect(v.action).toBe("QUARANTINE");
    expect(v.verdict).toBe("DIVERGENT");
  });

  it("includes the MMP-14 formula in the verdict", () => {
    const v = reconcileHandoff({
      handoffId: "h3",
      fromAgent: "a",
      toAgent: "b",
      observerAgent: "c",
      fromLeaves: ["x"],
      toLeaves: ["x"],
      observerLeaves: ["x"],
      timestamp: 3,
    });
    expect(v.formula).toContain("V_T = (1/3)");
  });
});

describe("A11oy auditFleetHandoffs", () => {
  it("computes aggregate fleet stats", () => {
    const events = [
      {
        handoffId: "h1",
        fromAgent: "a",
        toAgent: "b",
        observerAgent: "c",
        fromLeaves: ["x"],
        toLeaves: ["x"],
        observerLeaves: ["x"],
        timestamp: 1,
      },
      {
        handoffId: "h2",
        fromAgent: "a",
        toAgent: "b",
        observerAgent: "c",
        fromLeaves: ["x", "y"],
        toLeaves: ["x"],
        observerLeaves: ["x"],
        timestamp: 2,
      },
    ];
    const { stats } = auditFleetHandoffs(events);
    expect(stats.total).toBe(2);
    expect(stats.reconciled).toBe(1);
    expect(stats.divergent).toBe(1);
    expect(stats.reconciliationRate).toBe(0.5);
  });

  it("returns 0 reconciliation rate for empty input", () => {
    const { stats } = auditFleetHandoffs([]);
    expect(stats.total).toBe(0);
    expect(stats.reconciliationRate).toBe(0);
  });
});
