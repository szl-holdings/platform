import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest";

import {
  estimateVarFromSignal,
  parseTimeWindow,
  safeParseLimit,
  computeBottleneckUrgency,
  computeAccountabilityUrgency,
  SEVERITY_VAR,
  CATEGORY_DOMAIN,
} from "../routes/lyte-cognitive-helpers.js";

import {
  estimateRiskAndApprovals,
  levelForRisk,
  type PlanStep,
  PlanContextSchema,
} from "@workspace/planner";

// ---------------------------------------------------------------------------
// 1. Helper function unit tests
// ---------------------------------------------------------------------------

describe("estimateVarFromSignal", () => {
  it("returns SEVERITY_VAR default for a critical signal with no metadata", () => {
    expect(estimateVarFromSignal({ severity: "critical" })).toBe(1_000_000);
  });

  it("returns SEVERITY_VAR default for a high signal with no metadata", () => {
    expect(estimateVarFromSignal({ severity: "high" })).toBe(250_000);
  });

  it("returns 0 for info severity with no metadata", () => {
    expect(estimateVarFromSignal({ severity: "info" })).toBe(0);
  });

  it("prefers metadata.valueAtRisk over severity default", () => {
    expect(
      estimateVarFromSignal({
        severity: "low",
        metadata: { valueAtRisk: 999_000 },
      }),
    ).toBe(999_000);
  });

  it("falls back to metadata.value_at_risk (snake_case) correctly", () => {
    expect(
      estimateVarFromSignal({
        severity: "medium",
        metadata: { value_at_risk: 123_456 },
      }),
    ).toBe(123_456);
  });

  it("returns 0 for unknown severity with no metadata", () => {
    expect(estimateVarFromSignal({ severity: "phantom" })).toBe(0);
  });

  it("ignores metadata.valueAtRisk if it is not a number", () => {
    expect(
      estimateVarFromSignal({
        severity: "critical",
        metadata: { valueAtRisk: "not-a-number" },
      }),
    ).toBe(1_000_000);
  });
});

describe("parseTimeWindow", () => {
  it("returns defaults (last 7 days) when no args supplied", () => {
    const before = Date.now() - 7 * 24 * 3600_000;
    const { fromDate, toDate } = parseTimeWindow();
    expect(toDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(fromDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffDays = diffMs / (24 * 3600_000);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it("parses ISO date strings correctly", () => {
    const { fromDate, toDate } = parseTimeWindow("2026-01-01", "2026-02-01");
    expect(fromDate.getFullYear()).toBe(2026);
    expect(fromDate.getMonth()).toBe(0);
    expect(toDate.getMonth()).toBe(1);
  });

  it("throws on invalid from date", () => {
    expect(() => parseTimeWindow("not-a-date", "2026-01-01")).toThrow("Invalid from/to date format");
  });

  it("throws on invalid to date", () => {
    expect(() => parseTimeWindow("2026-01-01", "also-not-a-date")).toThrow("Invalid from/to date format");
  });
});

describe("safeParseLimit (NaN guard)", () => {
  it("returns default when given undefined", () => {
    expect(safeParseLimit(undefined)).toBe(20);
  });

  it("returns default when given a non-numeric string", () => {
    expect(safeParseLimit("abc")).toBe(20);
  });

  it("caps at max (50 by default)", () => {
    expect(safeParseLimit("999")).toBe(50);
  });

  it("respects a valid numeric string", () => {
    expect(safeParseLimit("15")).toBe(15);
  });

  it("respects a valid numeric string at the max boundary", () => {
    expect(safeParseLimit("50")).toBe(50);
  });

  it("returns default when parseLimit is explicitly NaN (Number('') = NaN)", () => {
    expect(safeParseLimit("")).toBe(20);
  });

  it("respects custom default and max", () => {
    expect(safeParseLimit("junk", 10, 30)).toBe(10);
    expect(safeParseLimit("99", 10, 30)).toBe(30);
  });
});

describe("computeBottleneckUrgency", () => {
  it("returns low urgency for an idle owner with zero metrics", () => {
    const { urgencyScore, level } = computeBottleneckUrgency({
      var: 0,
      bottlenecks: 0,
      ageHours: 0,
      escalationCount: 0,
    });
    expect(urgencyScore).toBeGreaterThan(0);
    expect(level).toBe("low");
  });

  it("rates critical when VaR > 500K + several bottlenecks + escalations", () => {
    const { urgencyScore, level } = computeBottleneckUrgency({
      var: 600_000,
      bottlenecks: 3,
      ageHours: 48,
      escalationCount: 2,
    });
    expect(urgencyScore).toBeGreaterThanOrEqual(60);
    expect(level).toBe("critical");
  });

  it("caps urgencyScore at 100", () => {
    const { urgencyScore } = computeBottleneckUrgency({
      var: 10_000_000,
      bottlenecks: 10,
      ageHours: 200,
      escalationCount: 10,
    });
    expect(urgencyScore).toBe(100);
  });

  it("rates higher age as higher urgency", () => {
    const low = computeBottleneckUrgency({ var: 0, bottlenecks: 1, ageHours: 1, escalationCount: 0 });
    const high = computeBottleneckUrgency({ var: 0, bottlenecks: 1, ageHours: 30, escalationCount: 0 });
    expect(high.urgencyScore).toBeGreaterThan(low.urgencyScore);
  });

  it("correctly maps medium-range to 'medium' level", () => {
    const { level } = computeBottleneckUrgency({
      var: 15_000,
      bottlenecks: 1,
      ageHours: 9,
      escalationCount: 0,
    });
    expect(level).toBe("medium");
  });
});

describe("computeAccountabilityUrgency", () => {
  it("returns 0 for completely clean owner", () => {
    const score = computeAccountabilityUrgency({
      bottlenecks: 0,
      urgentInterventions: 0,
      criticalIncidents: 0,
      escalationCount: 0,
      totalVaR: 0,
    });
    expect(score).toBe(0);
  });

  it("caps at 100", () => {
    const score = computeAccountabilityUrgency({
      bottlenecks: 10,
      urgentInterventions: 10,
      criticalIncidents: 10,
      escalationCount: 10,
      totalVaR: 1_000_000,
    });
    expect(score).toBe(100);
  });

  it("critical incidents contribute more per item than bottlenecks", () => {
    const incidentScore = computeAccountabilityUrgency({
      bottlenecks: 0, urgentInterventions: 0, criticalIncidents: 1, escalationCount: 0, totalVaR: 0,
    });
    const bottleneckScore = computeAccountabilityUrgency({
      bottlenecks: 1, urgentInterventions: 0, criticalIncidents: 0, escalationCount: 0, totalVaR: 0,
    });
    expect(incidentScore).toBeGreaterThan(bottleneckScore);
  });
});

describe("SEVERITY_VAR and CATEGORY_DOMAIN constants", () => {
  it("SEVERITY_VAR has expected shape", () => {
    expect(SEVERITY_VAR.critical).toBeGreaterThan(SEVERITY_VAR.high);
    expect(SEVERITY_VAR.high).toBeGreaterThan(SEVERITY_VAR.medium);
    expect(SEVERITY_VAR.info).toBe(0);
  });

  it("CATEGORY_DOMAIN maps all expected categories", () => {
    const expected = [
      "approval_latency", "ownership_gap", "forecast_drift", "stalled_workflow",
      "handoff_failure", "status_conflict", "readiness_blocker", "pipeline_hygiene",
    ];
    for (const cat of expected) {
      expect(CATEGORY_DOMAIN[cat]).toBeDefined();
    }
  });

  it("CATEGORY_DOMAIN maps stalled_workflow and approval_latency to operations", () => {
    expect(CATEGORY_DOMAIN.stalled_workflow).toBe("operations");
    expect(CATEGORY_DOMAIN.approval_latency).toBe("operations");
  });
});

// ---------------------------------------------------------------------------
// 2. Planner integration — estimateRiskAndApprovals + levelForRisk
// ---------------------------------------------------------------------------

const planCtx = PlanContextSchema.parse({ approvalThreshold: "high", fallbackCount: 0 });

function makeStep(id: string, idx: number, estimatedRisk: number): PlanStep {
  return {
    stepId: id,
    index: idx,
    title: `Step ${id}`,
    description: "",
    dependsOn: [],
    status: "pending" as const,
    route: {
      routeClass: "planning" as const,
      estimatedCostUsd: 0,
      selectedBy: "priority" as const,
      fallbackChain: [],
    },
    estimatedValue: 0.5,
    estimatedRisk,
    riskLevel: levelForRisk(estimatedRisk),
    requiredEvidence: [],
    requiredApproval: false,
    rollbackPoints: [],
    inputs: {},
    metadata: {},
  };
}

describe("levelForRisk", () => {
  it("returns critical for risk >= 0.75", () => {
    expect(levelForRisk(0.75)).toBe("critical");
    expect(levelForRisk(1.0)).toBe("critical");
  });

  it("returns high for risk in [0.5, 0.75)", () => {
    expect(levelForRisk(0.5)).toBe("high");
    expect(levelForRisk(0.74)).toBe("high");
  });

  it("returns medium for risk in [0.25, 0.5)", () => {
    expect(levelForRisk(0.25)).toBe("medium");
    expect(levelForRisk(0.49)).toBe("medium");
  });

  it("returns low for risk < 0.25", () => {
    expect(levelForRisk(0)).toBe("low");
    expect(levelForRisk(0.24)).toBe("low");
  });
});

describe("estimateRiskAndApprovals (planner integration)", () => {
  it("auto-gates a critical-risk intervention with approval + rollback", () => {
    const steps = [makeStep("int-critical", 0, 0.9)];
    const assessed = estimateRiskAndApprovals(steps, planCtx);
    expect(assessed[0]!.riskLevel).toBe("critical");
    expect(assessed[0]!.requiredApproval).toBe(true);
    expect(assessed[0]!.rollbackPoints.length).toBeGreaterThan(0);
    expect(assessed[0]!.approvalReason).toContain("threshold");
  });

  it("auto-gates a high-risk intervention", () => {
    const steps = [makeStep("int-high", 0, 0.6)];
    const assessed = estimateRiskAndApprovals(steps, planCtx);
    expect(assessed[0]!.riskLevel).toBe("high");
    expect(assessed[0]!.requiredApproval).toBe(true);
  });

  it("does NOT gate a low-risk intervention (below high threshold)", () => {
    const steps = [makeStep("int-low", 0, 0.1)];
    const assessed = estimateRiskAndApprovals(steps, planCtx);
    expect(assessed[0]!.riskLevel).toBe("low");
    expect(assessed[0]!.requiredApproval).toBe(false);
    expect(assessed[0]!.rollbackPoints).toHaveLength(0);
  });

  it("processes multiple steps independently", () => {
    const steps = [
      makeStep("a", 0, 0.9),
      makeStep("b", 1, 0.1),
      makeStep("c", 2, 0.6),
    ];
    const assessed = estimateRiskAndApprovals(steps, planCtx);
    expect(assessed).toHaveLength(3);
    expect(assessed[0]!.requiredApproval).toBe(true);
    expect(assessed[1]!.requiredApproval).toBe(false);
    expect(assessed[2]!.requiredApproval).toBe(true);
  });

  it("does not lose original step metadata", () => {
    const steps = [makeStep("meta-test", 0, 0.3)];
    steps[0]!.metadata = { interventionId: "x1", domain: "operations" };
    const assessed = estimateRiskAndApprovals(steps, planCtx);
    expect(assessed[0]!.metadata.interventionId).toBe("x1");
    expect(assessed[0]!.metadata.domain).toBe("operations");
  });
});

// ---------------------------------------------------------------------------
// 3. Intervention limit-to-planner pipeline shape test
// ---------------------------------------------------------------------------

describe("intervention planner step construction (integration shape)", () => {
  it("builds a valid PlanStep for a critical-urgency intervention signal group", () => {
    const varValue = 1_200_000;
    const urgencyRisk = 0.9;
    const varRisk = varValue >= 1_000_000 ? 0.3 : 0;
    const estimatedRisk = Math.min(urgencyRisk + varRisk, 1);

    const step = makeStep("grp-critical", 0, estimatedRisk);
    step.estimatedValue = Math.min(varValue / 1_000_000, 1);

    expect(estimatedRisk).toBe(1.0);
    expect(step.estimatedValue).toBe(1.0);
    expect(levelForRisk(estimatedRisk)).toBe("critical");

    const assessed = estimateRiskAndApprovals([step], planCtx);
    expect(assessed[0]!.requiredApproval).toBe(true);
    expect(assessed[0]!.rollbackPoints.length).toBeGreaterThan(0);
  });

  it("builds a low-risk plan step for a routine moderate signal group", () => {
    const varValue = 5_000;
    const urgencyRisk = 0.15;
    const varRisk = 0;
    const estimatedRisk = urgencyRisk + varRisk;

    const step = makeStep("grp-routine", 0, estimatedRisk);
    const assessed = estimateRiskAndApprovals([step], planCtx);
    expect(assessed[0]!.riskLevel).toBe("low");
    expect(assessed[0]!.requiredApproval).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. VaR byDomain aggregation consistency test
// ---------------------------------------------------------------------------

describe("VaR byDomain aggregation — count + items both increment", () => {
  it("increments both count and items for signals domain", () => {
    const byDomain: Record<string, { var: number; count: number; items: number }> = {};

    const signals = [
      { severity: "critical" as const, metadata: null },
      { severity: "high" as const, metadata: null },
    ];

    for (const sig of signals) {
      const domain = "signals";
      const varNum = estimateVarFromSignal(sig);
      if (!byDomain[domain]) byDomain[domain] = { var: 0, count: 0, items: 0 };
      byDomain[domain].var += varNum;
      byDomain[domain].count++;
      byDomain[domain].items++;
    }

    expect(byDomain.signals!.count).toBe(2);
    expect(byDomain.signals!.items).toBe(2);
    expect(byDomain.signals!.var).toBe(1_000_000 + 250_000);
  });
});
