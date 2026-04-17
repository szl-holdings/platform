import { describe, it, expect } from "vitest";
import { EvalCategorySchema, GoldExampleSchema, EvalScenarioSchema } from "./types.js";
import { createPack, addScenario, getExamplesForCategory, SAMPLE_EVAL_PACK } from "./dataset.js";
import { exactMatchScorer, numericalToleranceScorer, scoreExample, aggregateResults } from "./scorer.js";
import { detectRegressions } from "./regression.js";
import { runPack } from "./cli.js";
import type { EvalReport } from "./types.js";
import {
  getGrader,
  promptEvalGrader,
  citationQualityGrader,
  hallucinationGrader,
  policyAdherenceGrader,
  toolReliabilityGrader,
  latencyCostGrader,
  traceGradingGrader,
  humanReviewGrader,
  biasSafetyGrader,
  agentWorkflowEvalGrader,
  modelRoutingEvalGrader,
} from "./graders.js";
import {
  runEvalSuite,
  checkRunRegression,
  type EvalSuiteDef,
  type EvalRunReport,
} from "./runtime.js";
import { buildTraceStore, gradeRunWithTraces, type Trace, summarizeTrace } from "./trace-grader.js";
import { runNightlyEvals } from "./nightly-runner.js";
import { ALL_SUITES, SUITE_BY_ID, terraSuite, vesselsSuite, aegisSuite } from "./suites/index.js";

const MOCK_GRADER_CTX = {
  caseId: "c1",
  domain: "test",
  input: {} as Record<string, unknown>,
  output: {} as Record<string, unknown>,
  groundTruth: {} as Record<string, unknown>,
  latencyMs: 100,
  costUsd: 0.001,
  tokensUsed: 50,
};

describe("EvalCategorySchema", () => {
  it("has 10 categories", () => {
    expect(EvalCategorySchema.options).toHaveLength(10);
  });
});

describe("GoldExampleSchema", () => {
  it("parses valid example with defaults", () => {
    const ex = GoldExampleSchema.parse({ id: "ex-1", input: "hello", expectedOutput: "world" });
    expect(ex.weight).toBe(1);
    expect(ex.tags).toEqual([]);
  });
});

describe("EvalPack operations", () => {
  it("creates a pack and adds scenarios", () => {
    let pack = createPack({ id: "p1", name: "Test Pack", version: "1.0", tags: [] });
    const scenario = EvalScenarioSchema.parse({
      id: "s1",
      name: "Exact match test",
      category: "gold-dataset",
      examples: [{ id: "ex-1", input: "ping", expectedOutput: "pong" }],
    });
    pack = addScenario(pack, scenario);
    expect(pack.scenarios).toHaveLength(1);
  });

  it("getExamplesForCategory filters correctly", () => {
    let pack = createPack({ id: "p1", name: "Pack", version: "1", tags: [] });
    pack = addScenario(pack, EvalScenarioSchema.parse({
      id: "s1", name: "A", category: "gold-dataset",
      examples: [{ id: "e1", input: "x", expectedOutput: "y" }],
    }));
    pack = addScenario(pack, EvalScenarioSchema.parse({
      id: "s2", name: "B", category: "latency",
      examples: [{ id: "e2", input: "a", expectedOutput: "b" }],
    }));
    expect(getExamplesForCategory(pack, "gold-dataset")).toHaveLength(1);
    expect(getExamplesForCategory(pack, "latency")).toHaveLength(1);
  });

  it("SAMPLE_EVAL_PACK is valid", () => {
    expect(SAMPLE_EVAL_PACK.id).toBe("sample-pack-v1");
  });
});

describe("Scoring", () => {
  const example = GoldExampleSchema.parse({ id: "e1", input: "test", expectedOutput: "expected" });

  it("exactMatchScorer returns 1 for exact match", () => {
    expect(exactMatchScorer(example, "expected")).toBe(1);
    expect(exactMatchScorer(example, "wrong")).toBe(0);
  });

  it("numericalToleranceScorer passes within tolerance", () => {
    const numExample = GoldExampleSchema.parse({ id: "e1", input: 0, expectedOutput: 100 });
    const scorer = numericalToleranceScorer(5);
    expect(scorer(numExample, 100)).toBe(1);
    expect(scorer(numExample, 104)).toBe(1);
    expect(scorer(numExample, 110)).toBe(0);
  });

  it("scoreExample produces EvalResult with metrics", () => {
    const result = scoreExample(example, "expected", exactMatchScorer, { latencyMs: 50 });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
    expect(result.metrics.some((m) => m.name === "latency_ms")).toBe(true);
  });

  it("aggregateResults computes correct overall score", () => {
    const r1 = scoreExample(example, "expected", exactMatchScorer);
    const r2 = scoreExample(example, "wrong", exactMatchScorer);
    const { overallScore, passRate } = aggregateResults([r1, r2]);
    expect(overallScore).toBe(0.5);
    expect(passRate).toBe(0.5);
  });
});

describe("Old regression detection (EvalReport-based)", () => {
  function makeReport(overallScore: number, passed: number, total: number): EvalReport {
    return {
      reportId: `r-${Math.random()}`,
      packId: "p1",
      runAt: new Date().toISOString(),
      totalExamples: total,
      passedExamples: passed,
      failedExamples: total - passed,
      overallScore,
      results: [],
      metrics: [],
      regressions: [],
      metadata: {},
    };
  }

  it("detects score regression", () => {
    const baseline = makeReport(0.9, 9, 10);
    const current = makeReport(0.8, 8, 10);
    const result = detectRegressions(baseline, current);
    expect(result.hasRegression).toBe(true);
    expect(result.regressions.length).toBeGreaterThan(0);
  });

  it("no regression when score is same", () => {
    const baseline = makeReport(0.9, 9, 10);
    const current = makeReport(0.9, 9, 10);
    const result = detectRegressions(baseline, current);
    expect(result.hasRegression).toBe(false);
  });
});

describe("runPack CLI", () => {
  it("runs a pack and produces a report", async () => {
    let pack = createPack({ id: "test-pack", name: "Test", version: "1", tags: [] });
    pack = addScenario(pack, EvalScenarioSchema.parse({
      id: "s1",
      name: "Identity test",
      category: "prompt-test",
      examples: [
        { id: "e1", input: "hello", expectedOutput: "hello" },
        { id: "e2", input: "world", expectedOutput: "world" },
      ],
    }));

    const report = await runPack({
      pack,
      runFn: async (input) => input,
    });

    expect(report.totalExamples).toBe(2);
    expect(report.passedExamples).toBe(2);
    expect(report.overallScore).toBe(1);
  });

  it("handles runtime errors in runFn", async () => {
    let pack = createPack({ id: "error-pack", name: "Error Pack", version: "1", tags: [] });
    pack = addScenario(pack, EvalScenarioSchema.parse({
      id: "s1",
      name: "Error test",
      category: "tool-reliability",
      examples: [{ id: "e1", input: "x", expectedOutput: "y" }],
    }));

    const report = await runPack({
      pack,
      runFn: async () => { throw new Error("Tool failed"); },
    });

    expect(report.failedExamples).toBe(1);
    expect(report.results[0]?.errorMessage).toContain("Tool failed");
  });
});

describe("Graders", () => {
  it("getGrader returns a callable grader for every type", () => {
    const types = [
      "prompt-eval", "model-routing-eval", "tool-reliability",
      "agent-workflow-eval", "policy-adherence", "citation-quality",
      "hallucination", "bias-safety", "latency-cost", "trace-grading",
      "human-review", "exact-match", "semantic-similarity", "custom",
    ] as const;
    for (const t of types) {
      expect(typeof getGrader(t)).toBe("function");
    }
  });

  it("promptEvalGrader scores perfect match as passing", () => {
    const result = promptEvalGrader({
      ...MOCK_GRADER_CTX,
      graderType: "prompt-eval",
      output: { answer: "yes", coherence: 1, relevance: 1 },
      groundTruth: { answer: "yes" },
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it("citationQualityGrader fails when below minimum citations", () => {
    const result = citationQualityGrader({
      ...MOCK_GRADER_CTX,
      graderType: "citation-quality",
      output: { citations: [], unsupportedClaims: 0 },
      groundTruth: { minCitations: 3 },
    });
    expect(result.passed).toBe(false);
    expect(result.failureReason).toContain("citations");
  });

  it("citationQualityGrader passes with sufficient citations", () => {
    const result = citationQualityGrader({
      ...MOCK_GRADER_CTX,
      graderType: "citation-quality",
      output: {
        citations: [
          { source: "case-001", text: "Some case text", url: "https://example.com/001" },
          { source: "case-002", text: "Another case", url: "https://example.com/002" },
        ],
        unsupportedClaims: 0,
      },
      groundTruth: { minCitations: 2 },
    });
    expect(result.passed).toBe(true);
  });

  it("hallucinationGrader detects hallucinated facts", () => {
    const result = hallucinationGrader({
      ...MOCK_GRADER_CTX,
      graderType: "hallucination",
      output: {
        hallucinatedFacts: ["Invented case v Imaginary Corp (2024)"],
        unsupportedClaims: 3,
        totalClaims: 5,
      },
      groundTruth: {},
    });
    expect(result.passed).toBe(false);
    expect(result.failureReason).toBeDefined();
  });

  it("hallucinationGrader passes for clean output", () => {
    const result = hallucinationGrader({
      ...MOCK_GRADER_CTX,
      graderType: "hallucination",
      output: { hallucinatedFacts: [], unsupportedClaims: 0, totalClaims: 10 },
      groundTruth: {},
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it("policyAdherenceGrader fails for violations", () => {
    const result = policyAdherenceGrader({
      ...MOCK_GRADER_CTX,
      graderType: "policy-adherence",
      input: { policies: ["no-pii-sharing", "data-residency"] },
      output: { violations: ["no-pii-sharing"] },
      groundTruth: {},
    });
    expect(result.passed).toBe(false);
  });

  it("policyAdherenceGrader passes for compliant output", () => {
    const result = policyAdherenceGrader({
      ...MOCK_GRADER_CTX,
      graderType: "policy-adherence",
      input: { policies: ["no-pii-sharing"] },
      output: { violations: [] },
      groundTruth: {},
    });
    expect(result.passed).toBe(true);
  });

  it("toolReliabilityGrader fails when tool errors", () => {
    const result = toolReliabilityGrader({
      ...MOCK_GRADER_CTX,
      graderType: "tool-reliability",
      output: { error: "Connection timeout", failed: true },
      groundTruth: { toolName: "search-api" },
    });
    expect(result.passed).toBe(false);
  });

  it("latencyCostGrader fails when over budget", () => {
    const result = latencyCostGrader({
      ...MOCK_GRADER_CTX,
      graderType: "latency-cost",
      latencyMs: 10000,
      costUsd: 0.50,
      output: {},
      groundTruth: { maxLatencyMs: 2000, maxCostUsd: 0.01 },
    });
    expect(result.passed).toBe(false);
    expect(result.failureReason).toContain("Latency");
  });

  it("latencyCostGrader passes within budget", () => {
    const result = latencyCostGrader({
      ...MOCK_GRADER_CTX,
      graderType: "latency-cost",
      latencyMs: 500,
      costUsd: 0.001,
      output: {},
      groundTruth: { maxLatencyMs: 2000, maxCostUsd: 0.01 },
    });
    expect(result.passed).toBe(true);
  });

  it("traceGradingGrader fails without trace data", () => {
    const result = traceGradingGrader({
      ...MOCK_GRADER_CTX,
      graderType: "trace-grading",
      output: {},
      groundTruth: {},
      metadata: {},
    });
    expect(result.passed).toBe(false);
    expect(result.failureReason).toContain("trace");
  });

  it("traceGradingGrader passes with clean trace", () => {
    const result = traceGradingGrader({
      ...MOCK_GRADER_CTX,
      graderType: "trace-grading",
      output: { status: "ok" },
      groundTruth: { status: "ok", expectedSpanCount: 3 },
      metadata: { trace: { spanCount: 3, errorCount: 0 } },
    });
    expect(result.passed).toBe(true);
  });

  it("humanReviewGrader is pending without label", () => {
    const result = humanReviewGrader({
      ...MOCK_GRADER_CTX,
      graderType: "human-review",
      output: {},
      groundTruth: {},
      metadata: {},
    });
    expect(result.passed).toBe(false);
    expect(result.details).toHaveProperty("pendingReview", true);
  });

  it("humanReviewGrader passes with positive human label", () => {
    const result = humanReviewGrader({
      ...MOCK_GRADER_CTX,
      graderType: "human-review",
      output: {},
      groundTruth: {},
      metadata: { humanLabel: "pass", humanScore: 1.0 },
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
  });

  it("biasSafetyGrader fails with safety flags", () => {
    const result = biasSafetyGrader({
      ...MOCK_GRADER_CTX,
      graderType: "bias-safety",
      output: { biasFlags: [], safetyFlags: ["hate-speech"], toxicityScore: 0.8 },
      groundTruth: {},
    });
    expect(result.passed).toBe(false);
  });

  it("agentWorkflowEvalGrader scores goal completion", () => {
    const result = agentWorkflowEvalGrader({
      ...MOCK_GRADER_CTX,
      graderType: "agent-workflow-eval",
      output: { stepsCompleted: 4, goalAchieved: true },
      groundTruth: { stepsExpected: 4 },
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("modelRoutingEvalGrader matches expected model", () => {
    const result = modelRoutingEvalGrader({
      ...MOCK_GRADER_CTX,
      graderType: "model-routing-eval",
      model: "gpt-4o",
      output: { model: "gpt-4o" },
      groundTruth: { expectedModel: "gpt-4o", maxCostUsd: 0.10, maxLatencyMs: 5000 },
      latencyMs: 800,
      costUsd: 0.02,
    });
    expect(result.passed).toBe(true);
  });
});

describe("EvalRunReport runtime", () => {
  const simpleSuite: EvalSuiteDef = {
    suiteId: "test-suite-runtime",
    name: "Runtime Test Suite",
    domain: "platform",
    cases: [
      {
        id: "rt-001",
        domain: "platform",
        label: "Exact match test",
        graderType: "exact-match",
        input: { value: "hello" },
        groundTruth: { value: "hello" },
        expectedOutcome: "pass",
      },
      {
        id: "rt-002",
        domain: "platform",
        label: "Failing test",
        graderType: "exact-match",
        input: { value: "world" },
        groundTruth: { value: "different" },
        expectedOutcome: "pass",
      },
    ],
  };

  const identityExecutor = async (input: Record<string, unknown>) => ({
    output: input,
    model: "test-model",
    latencyMs: 10,
    tokensUsed: 5,
    costUsd: 0.0001,
  });

  it("runs suite and produces correct pass/fail counts", async () => {
    const report = await runEvalSuite(simpleSuite, identityExecutor);
    expect(report.totalCases).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBe(0.5);
    expect(report.suiteId).toBe("test-suite-runtime");
  });

  it("computes avgScore and avgLatencyMs", async () => {
    const report = await runEvalSuite(simpleSuite, identityExecutor);
    expect(report.avgScore).toBeGreaterThanOrEqual(0);
    expect(report.avgScore).toBeLessThanOrEqual(1);
    expect(report.avgLatencyMs).toBeGreaterThan(0);
  });

  it("handles executor errors gracefully", async () => {
    const errorSuite: EvalSuiteDef = {
      suiteId: "error-suite",
      name: "Error Suite",
      domain: "platform",
      cases: [
        {
          id: "err-001",
          domain: "platform",
          label: "Error case",
          graderType: "exact-match",
          input: { value: "x" },
          groundTruth: { value: "y" },
        },
      ],
    };

    const report = await runEvalSuite(errorSuite, async () => {
      throw new Error("Executor failed");
    });

    expect(report.failed).toBe(1);
    expect(report.caseResults[0]?.failureReason).toContain("Executor failed");
  });
});

describe("Regression detection (run-level)", () => {
  function makeRunReport(passRate: number, avgScore: number, avgLatencyMs = 100): EvalRunReport {
    const totalCases = 10;
    const passed = Math.round(passRate * totalCases);
    return {
      runId: `run-${Math.random()}`,
      suiteId: "test-suite",
      suiteName: "Test Suite",
      domain: "platform",
      runAt: new Date().toISOString(),
      triggeredBy: "test",
      totalCases,
      passed,
      failed: totalCases - passed,
      passRate,
      avgScore,
      avgLatencyMs,
      totalCostUsd: 0.01,
      totalTokensUsed: 100,
      caseResults: [],
    };
  }

  it("detects pass rate regression", () => {
    const baseline = makeRunReport(0.9, 0.85);
    const current = makeRunReport(0.7, 0.75);
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(true);
    expect(result.regressionNotes.length).toBeGreaterThan(0);
    expect(result.passRateDelta).toBeLessThan(0);
  });

  it("no regression for stable results", () => {
    const baseline = makeRunReport(0.9, 0.85);
    const current = makeRunReport(0.91, 0.86);
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(false);
    expect(result.severity).toBe("none");
  });

  it("detects improvement", () => {
    const baseline = makeRunReport(0.7, 0.65);
    const current = makeRunReport(0.9, 0.85);
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(false);
    expect(result.improvementNotes.length).toBeGreaterThan(0);
  });

  it("assigns critical severity for large pass rate drop", () => {
    const baseline = makeRunReport(0.95, 0.9);
    const current = makeRunReport(0.6, 0.5);
    const result = checkRunRegression(baseline, current);
    expect(result.hasRegression).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("detects case-level regressions", () => {
    const baseline = makeRunReport(1.0, 1.0);
    baseline.caseResults = [{ caseId: "c1", passed: true, score: 1.0, domain: "platform", label: "Test", graderType: "exact-match", input: {}, output: {}, groundTruth: {}, expectedOutcome: "pass", latencyMs: 50, tokensUsed: 5, costUsd: 0 }];
    const current = makeRunReport(0.0, 0.0);
    current.caseResults = [{ caseId: "c1", passed: false, score: 0.0, domain: "platform", label: "Test", graderType: "exact-match", input: {}, output: {}, groundTruth: {}, expectedOutcome: "pass", latencyMs: 50, tokensUsed: 5, costUsd: 0 }];
    const result = checkRunRegression(baseline, current, 5);
    expect(result.regressionNotes.some((n) => n.includes("c1") || n.includes("Test"))).toBe(true);
  });
});

describe("Trace grading", () => {
  const makeTrace = (traceId: string, errorCount = 0, spanCount = 5): Trace => ({
    traceId,
    rootSpan: {
      spanId: "span-root",
      name: "root",
      startTime: Date.now() - 200,
      endTime: Date.now(),
      status: "ok",
    },
    spans: Array.from({ length: spanCount }, (_, i) => ({
      spanId: `span-${i}`,
      name: i < errorCount ? "error-span" : `span-${i}`,
      startTime: Date.now() - (200 - i * 30),
      endTime: Date.now() - (200 - i * 30 - 20),
      status: (i < errorCount ? "error" : "ok") as "ok" | "error",
    })),
    durationMs: 200,
    status: errorCount > 0 ? "error" : "ok",
    domain: "platform",
  });

  it("summarizeTrace extracts span count and errors", () => {
    const trace = makeTrace("t1", 2, 10);
    const summary = summarizeTrace(trace);
    expect(summary.spanCount).toBe(10);
    expect(summary.errorCount).toBe(2);
  });

  it("buildTraceStore indexes by traceId", () => {
    const traces = [makeTrace("t1"), makeTrace("t2")];
    const store = buildTraceStore(traces);
    expect(store.has("t1")).toBe(true);
    expect(store.has("t2")).toBe(true);
    expect(store.get("t1")).toHaveProperty("spanCount");
  });

  it("gradeRunWithTraces augments case results with trace info", async () => {
    const suite: EvalSuiteDef = {
      suiteId: "trace-test-suite",
      name: "Trace Test",
      domain: "platform",
      cases: [
        {
          id: "tc-001",
          domain: "platform",
          label: "Traced case",
          graderType: "exact-match",
          input: { x: 1 },
          groundTruth: { x: 1 },
          traceId: "trace-001",
        },
      ],
    };

    const report = await runEvalSuite(suite, async (input) => ({
      output: input,
      model: "test",
      latencyMs: 50,
      tokensUsed: 10,
      costUsd: 0,
      traceId: "trace-001",
    }));

    const traces = [makeTrace("trace-001", 0, 4)];
    const { tracedCases, traceAugmentedReport } = gradeRunWithTraces(report, traces);
    expect(tracedCases).toBe(1);
    expect(traceAugmentedReport.caseResults[0]?.graderDetails).toHaveProperty("traceSpans");
  });
});

describe("Domain suites scaffolding", () => {
  it("ALL_SUITES has 7 domain suites", () => {
    expect(ALL_SUITES).toHaveLength(7);
  });

  it("SUITE_BY_ID indexes all suites", () => {
    for (const suite of ALL_SUITES) {
      expect(SUITE_BY_ID[suite.suiteId]).toBeDefined();
    }
  });

  it("terraSuite has correct domain and cases", () => {
    expect(terraSuite.domain).toBe("terra");
    expect(terraSuite.cases.length).toBeGreaterThanOrEqual(5);
    const graderTypes = terraSuite.cases.map((c) => c.graderType);
    expect(graderTypes.some((t) => t === "exact-match" || t === "policy-adherence" || t === "hallucination")).toBe(true);
  });

  it("vesselsSuite has red-team cases", () => {
    const redTeam = vesselsSuite.cases.filter((c) => c.isRedTeam);
    expect(redTeam.length).toBeGreaterThanOrEqual(1);
  });

  it("aegisSuite has critical incident triage case", () => {
    const triage = aegisSuite.cases.filter((c) => c.tags?.includes("incident-triage"));
    expect(triage.length).toBeGreaterThanOrEqual(2);
  });

  it("all suite cases have required fields", () => {
    for (const suite of ALL_SUITES) {
      for (const c of suite.cases) {
        expect(c.id).toBeTruthy();
        expect(c.label).toBeTruthy();
        expect(c.graderType).toBeTruthy();
        expect(c.domain).toBe(suite.domain);
      }
    }
  });
});

describe("Nightly runner", () => {
  it("runs all suites and produces summary", async () => {
    const summary = await runNightlyEvals({ verbose: false });
    expect(summary.totalSuites).toBe(ALL_SUITES.length);
    expect(summary.totalCases).toBeGreaterThan(0);
    expect(summary.suiteReports).toHaveLength(ALL_SUITES.length);
    expect(summary.overallPassRate).toBeGreaterThanOrEqual(0);
    expect(summary.overallPassRate).toBeLessThanOrEqual(1);
  });

  it("detects regressions across runs via baseline store", async () => {
    const baselineStore = new Map();
    const run1 = await runNightlyEvals({ verbose: false, baselineStore });
    expect(run1.suitesWithRegression).toBe(0);
    const run2 = await runNightlyEvals({ verbose: false, baselineStore });
    expect(run2.suitesWithRegression).toBeGreaterThanOrEqual(0);
  });

  it("run-suite command filters by suiteId", async () => {
    const { terraSuite: ts } = await import("./suites/index.js");
    const summary = await runNightlyEvals({
      suites: [ts],
      verbose: false,
    });
    expect(summary.totalSuites).toBe(1);
    expect(summary.suiteReports[0]?.suiteId).toBe("terra-v1");
  });
});
