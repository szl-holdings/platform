import { describe, it, expect, beforeEach } from "vitest";
import {
  createPlan,
  getPlanFallbacks,
  replayPlan,
  decomposeObjective,
  estimateRiskAndApprovals,
  topoSort,
  generateFallbackPlans,
  levelForRisk,
  InMemoryPlanStore,
  PlanContextSchema,
  PlanCycleError,
  PlanNotFoundError,
  type PlanGraph,
  type PlanStep,
} from "../index.js";

const ctx = (overrides: Record<string, unknown> = {}) =>
  PlanContextSchema.parse({ approvalThreshold: "high", fallbackCount: 0, ...overrides });

describe("decomposer", () => {
  it("produces a 5-step Perceive→Plan→Act→Verify→Reflect skeleton when no seeds given", () => {
    const steps = decomposeObjective("Cut maritime fuel cost 4%", ctx());
    expect(steps).toHaveLength(5);
    expect(steps.map((s) => s.title)).toEqual([
      "Perceive",
      "Plan",
      "Act",
      "Verify",
      "Reflect",
    ]);
    expect(steps[1]!.dependsOn).toEqual([steps[0]!.stepId]);
    expect(steps[4]!.dependsOn).toEqual([steps[3]!.stepId]);
  });

  it("respects explicit seeds and resolves dependsOn by index AND title", () => {
    const seeds = [
      { title: "Pull vessels", routeClass: "extraction" as const, dependsOn: [] },
      { title: "Score routes", routeClass: "reasoning" as const, dependsOn: ["Pull vessels"] },
      { title: "Notify ops", routeClass: "generation" as const, dependsOn: ["1"] },
    ];
    const steps = decomposeObjective("x", ctx({ seeds }));
    expect(steps).toHaveLength(3);
    expect(steps[1]!.dependsOn).toEqual([steps[0]!.stepId]);
    expect(steps[2]!.dependsOn).toEqual([steps[1]!.stepId]);
  });
});

describe("risk estimator + approvals", () => {
  it("auto-gates high-risk steps with approval + rollback point", () => {
    const steps = decomposeObjective("Reroute fleet", ctx());
    const risked = estimateRiskAndApprovals(steps, ctx());
    const act = risked.find((s) => s.title === "Act")!;
    expect(act.riskLevel).toBe("high");
    expect(act.requiredApproval).toBe(true);
    expect(act.rollbackPoints.length).toBeGreaterThan(0);
    expect(act.approvalReason).toContain("threshold");

    const perceive = risked.find((s) => s.title === "Perceive")!;
    expect(perceive.requiredApproval).toBe(false);
    expect(perceive.rollbackPoints).toEqual([]);
  });

  it("levelForRisk maps thresholds correctly", () => {
    expect(levelForRisk(0)).toBe("low");
    expect(levelForRisk(0.3)).toBe("medium");
    expect(levelForRisk(0.6)).toBe("high");
    expect(levelForRisk(0.9)).toBe("critical");
  });

  it("respects a stricter approvalThreshold", () => {
    const steps = decomposeObjective("Reroute fleet", ctx({ approvalThreshold: "medium" }));
    const risked = estimateRiskAndApprovals(steps, ctx({ approvalThreshold: "medium" }));
    const planStep = risked.find((s) => s.title === "Plan")!;
    expect(planStep.requiredApproval).toBe(false);
    const act = risked.find((s) => s.title === "Act")!;
    expect(act.requiredApproval).toBe(true);
  });
});

describe("topoSort", () => {
  it("returns a valid topological order", () => {
    const steps = decomposeObjective("ok", ctx());
    const order = topoSort(steps);
    expect(order).toHaveLength(5);
    const seen = new Set<string>();
    for (const id of order) {
      const step = steps.find((s) => s.stepId === id)!;
      for (const dep of step.dependsOn) expect(seen.has(dep)).toBe(true);
      seen.add(id);
    }
  });

  it("throws PlanCycleError on cycles", () => {
    const a: PlanStep = {
      stepId: "a",
      index: 0,
      title: "a",
      description: "",
      dependsOn: ["b"],
      status: "pending",
      route: {
        routeClass: "generation",
        selectedBy: "priority",
        estimatedCostUsd: 0,
        fallbackChain: [],
      },
      estimatedValue: 0.5,
      estimatedRisk: 0.1,
      riskLevel: "low",
      requiredEvidence: [],
      requiredApproval: false,
      rollbackPoints: [],
      inputs: {},
      metadata: {},
    };
    const b: PlanStep = { ...a, stepId: "b", title: "b", index: 1, dependsOn: ["a"] };
    expect(() => topoSort([a, b])).toThrow(PlanCycleError);
  });
});

describe("router (ai-control-plane)", () => {
  it("attaches a model + provider + fallback chain to every step", async () => {
    const primary = await createPlan("Triage exception", ctx({ fallbackCount: 0 }), {
      store: new InMemoryPlanStore(),
    });
    for (const step of primary.steps) {
      expect(step.route.modelProvider).toBeTypeOf("string");
      expect(step.route.model).toBeTypeOf("string");
      expect(step.route.fallbackChain.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("createPlan", () => {
  let store: InMemoryPlanStore;
  beforeEach(() => {
    store = new InMemoryPlanStore();
  });

  it("rejects empty objectives", async () => {
    await expect(createPlan("", {}, { store })).rejects.toThrow();
    await expect(createPlan("   ", {}, { store })).rejects.toThrow();
  });

  it("persists primary and fallbacks", async () => {
    const primary = await createPlan("Reduce fuel cost", { fallbackCount: 2 }, { store });
    const fallbacks = await getPlanFallbacks(primary, { store });
    expect(fallbacks).toHaveLength(2);
    expect(primary.fallbacks).toEqual(fallbacks.map((f) => f.planId));
    expect(await store.count()).toBe(3);
    const round = await store.get(primary.planId);
    expect(round?.objective).toBe("Reduce fuel cost");
  });

  it("each fallback has a distinct strategy and references the primary", async () => {
    const primary = await createPlan("Investigate alert", { fallbackCount: 3 }, { store });
    const fallbacks = await getPlanFallbacks(primary, { store });
    const kinds = new Set(fallbacks.map((f) => f.steps[0]!.metadata.fallbackKind));
    expect(kinds.size).toBe(3);
    for (const fb of fallbacks) {
      expect(fb.fallbackOf).toBe(primary.planId);
      expect(fb.parentPlanId).toBeUndefined();
    }
  });

  it("aggregate risk + cost reflect step-level numbers", async () => {
    const primary = await createPlan("Approve trade", {}, { store });
    const expectedRisk =
      primary.steps.reduce((sum, s) => sum + s.estimatedRisk, 0) / primary.steps.length;
    expect(primary.estimatedRisk).toBeCloseTo(expectedRisk, 5);
    expect(primary.riskLevel).toBe(levelForRisk(expectedRisk));
  });
});

describe("fallback strategies", () => {
  it("cheaper fallback halves estimated cost per step", async () => {
    const primary = await createPlan("Plan x", {}, { store: new InMemoryPlanStore() });
    const [cheap] = generateFallbackPlans(primary, { count: 1 });
    for (let i = 0; i < primary.steps.length; i++) {
      expect(cheap!.steps[i]!.route.estimatedCostUsd).toBeCloseTo(
        primary.steps[i]!.route.estimatedCostUsd * 0.5,
        5,
      );
    }
  });
});

describe("replayPlan", () => {
  it("returns steps in execution order with route + approval info", async () => {
    const store = new InMemoryPlanStore();
    const primary = await createPlan("Run audit", {}, { store });
    const out = await replayPlan(primary.planId, { store });
    expect(out.steps.map((s) => s.stepId)).toEqual(primary.executionOrder);
    expect(out.steps[2]!.requiredApproval).toBe(true); // the Act step
  });

  it("throws PlanNotFoundError for unknown plan ids", async () => {
    const store = new InMemoryPlanStore();
    await expect(replayPlan("does-not-exist", { store })).rejects.toThrow(PlanNotFoundError);
  });
});
