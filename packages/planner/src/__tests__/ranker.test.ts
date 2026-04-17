import { describe, it, expect } from "vitest";
import { createPlan, rankFallbacks, InMemoryPlanStore } from "../index.js";

describe("rankFallbacks (decision-engine)", () => {
  it("assigns sequential rank starting at 1 and surfaces a fallbackPriority score", async () => {
    const { primary, fallbacks } = await createPlan(
      "Cut maritime fuel cost",
      { fallbackCount: 3 },
      { store: new InMemoryPlanStore() },
    );

    expect(fallbacks.length).toBeGreaterThan(1);
    const ranks = fallbacks.map((f) => f.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(ranks[0]).toBe(1);
    for (const fb of fallbacks) {
      expect(fb.metadata.fallbackPriority).toBeTypeOf("number");
    }

    expect(primary.fallbacks).toEqual(fallbacks.map((f) => f.planId));
  });

  it("ranks a strictly cheaper + lower-risk fallback above a more expensive one", () => {
    const baseStep = {
      stepId: "s1",
      index: 0,
      title: "step",
      description: "",
      dependsOn: [],
      status: "pending" as const,
      route: {
        modelProvider: "openai",
        model: "gpt-4o-mini",
        routeClass: "generation" as const,
        estimatedCostUsd: 1.0,
        selectedBy: "priority" as const,
        fallbackChain: [],
      },
      estimatedValue: 0.5,
      estimatedRisk: 0.5,
      riskLevel: "medium" as const,
      requiredEvidence: [],
      requiredApproval: false,
      rollbackPoints: [],
      inputs: {},
      metadata: {},
    };
    const primary = {
      planId: "p",
      rank: 0,
      title: "p",
      objective: "p",
      status: "draft" as const,
      steps: [baseStep],
      executionOrder: ["s1"],
      estimatedCostUsd: 5,
      estimatedValue: 0.5,
      estimatedRisk: 0.6,
      riskLevel: "high" as const,
      confidence: 0.7,
      fallbacks: [],
      context: {},
      metadata: {},
      createdAt: 0,
      updatedAt: 0,
    };
    const cheap = { ...primary, planId: "cheap", rank: 1, estimatedCostUsd: 1, estimatedRisk: 0.1, riskLevel: "low" as const };
    const expensive = { ...primary, planId: "expensive", rank: 2, estimatedCostUsd: 10, estimatedRisk: 0.7, riskLevel: "high" as const };

    const ranked = rankFallbacks(primary, [expensive, cheap]);
    expect(ranked[0]!.planId).toBe("cheap");
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.planId).toBe("expensive");
    expect(ranked[1]!.rank).toBe(2);
  });
});
