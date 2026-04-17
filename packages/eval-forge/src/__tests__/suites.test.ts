import { describe, it, expect } from "vitest";
import {
  FORGE_SUITES,
  FORGE_SUITE_BY_ID,
  FORGE_SUITE_BY_EVAL_TYPE,
  promptEvalSuite,
  modelRoutingSuite,
  verifierSuite,
  toolReliabilitySuite,
  citationFidelitySuite,
  memoryRetrievalSuite,
  planningQualitySuite,
  reflectionQualitySuite,
  autonomySafetySuite,
  endToEndScenarioSuite,
} from "../suites/index.js";
import { runEvalSuite } from "../runtime.js";
import { ALL_EVAL_TYPES } from "../types.js";
import type { EvalExecutor } from "../types.js";

const stubExecutor: EvalExecutor = async (input, _caseId, _domain) => {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 2));
  return {
    output: {
      ...input,
      confidence: 0.85,
      verified: true,
      success: true,
      completed: true,
      stepsCompleted: 5,
      citations: ["ref-1", "ref-2"],
      citationAccuracy: 0.9,
      sourceVerified: true,
      retrieved: ["item-1", "item-2"],
      steps: ["step-1", "step-2", "step-3", "step-4"],
      feasible: true,
      reflection: "Reviewed output critically.",
      reflectionScore: 0.85,
    },
    model: "stub-v1",
    latencyMs: Date.now() - start,
    tokensUsed: 100,
    costUsd: 0.0001,
  };
};

describe("FORGE_SUITES coverage", () => {
  it("has exactly 10 suites covering all eval types", () => {
    expect(FORGE_SUITES).toHaveLength(10);
    const coveredTypes = new Set(FORGE_SUITES.map((s) => s.evalType));
    for (const t of ALL_EVAL_TYPES) {
      expect(coveredTypes.has(t), `Missing eval type: ${t}`).toBe(true);
    }
  });

  it("FORGE_SUITE_BY_ID has entry for every suite", () => {
    for (const s of FORGE_SUITES) {
      expect(FORGE_SUITE_BY_ID[s.suiteId]).toBeDefined();
    }
  });

  it("FORGE_SUITE_BY_EVAL_TYPE has entry for every eval type", () => {
    for (const t of ALL_EVAL_TYPES) {
      expect(FORGE_SUITE_BY_EVAL_TYPE[t], `Missing suite for eval type: ${t}`).toBeDefined();
    }
  });

  it("every suite has at least 3 cases", () => {
    for (const s of FORGE_SUITES) {
      expect(s.cases.length, `Suite ${s.suiteId} has too few cases`).toBeGreaterThanOrEqual(3);
    }
  });

  it("every suite has at least one red-team case", () => {
    const suitesWithRedTeam = FORGE_SUITES.filter((s) => s.cases.some((c) => c.isRedTeam));
    expect(suitesWithRedTeam.length).toBeGreaterThanOrEqual(8);
  });

  it("every case has required fields", () => {
    for (const s of FORGE_SUITES) {
      for (const c of s.cases) {
        expect(c.id, `Case in ${s.suiteId} missing id`).toBeDefined();
        expect(c.label, `Case ${c.id} missing label`).toBeDefined();
        expect(c.evalType, `Case ${c.id} missing evalType`).toBeDefined();
        expect(c.graderType, `Case ${c.id} missing graderType`).toBeDefined();
        expect(c.input, `Case ${c.id} missing input`).toBeDefined();
        expect(c.groundTruth, `Case ${c.id} missing groundTruth`).toBeDefined();
      }
    }
  });
});

describe("Each eval type runs successfully", () => {
  for (const suite of [
    promptEvalSuite,
    modelRoutingSuite,
    verifierSuite,
    toolReliabilitySuite,
    citationFidelitySuite,
    memoryRetrievalSuite,
    planningQualitySuite,
    reflectionQualitySuite,
    autonomySafetySuite,
    endToEndScenarioSuite,
  ]) {
    it(`runs ${suite.evalType} suite`, async () => {
      const report = await runEvalSuite(suite, stubExecutor, { triggeredBy: "test" });
      expect(report.totalCases).toBe(suite.cases.length);
      expect(report.evalType).toBe(suite.evalType);
      expect(report.metrics).toHaveProperty("correctness");
      expect(report.metrics).toHaveProperty("latency");
      expect(report.metrics).toHaveProperty("cost");
      expect(report.metrics).toHaveProperty("policyViolations");
      expect(report.caseResults).toHaveLength(suite.cases.length);
    });
  }
});
