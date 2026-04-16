import { describe, it, expect } from "vitest";
import { EvalCategorySchema, GoldExampleSchema, EvalScenarioSchema } from "./types.js";
import { createPack, addScenario, getExamplesForCategory, SAMPLE_EVAL_PACK } from "./dataset.js";
import { exactMatchScorer, numericalToleranceScorer, scoreExample, aggregateResults } from "./scorer.js";
import { detectRegressions } from "./regression.js";
import { runPack } from "./cli.js";
import type { EvalReport } from "./types.js";

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

describe("Regression detection", () => {
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
