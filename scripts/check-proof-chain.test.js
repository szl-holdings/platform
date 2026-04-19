/**
 * Unit tests for check-proof-chain.js checker functions.
 *
 * Each test exercises the exported checker functions directly with inline
 * fixture strings — no file I/O, no spawned processes. Positive fixtures must
 * produce zero violations; negative fixtures must produce ≥1 violation that
 * mentions the expected field or gate.
 */

import { describe, it, expect } from "vitest";
import {
  checkExecuteWorkflowCalls,
  checkBuildPolicyEvaluationCalls,
  checkCreateRecommendationCalls,
  checkRecommendationTypeAssertions,
  extractArgBlock,
  removeNestedBraces,
} from "./check-proof-chain.js";

const FAKE_PATH = "/workspace/packages/fake/src/fake.ts";

// ---------------------------------------------------------------------------
// Gate 1 — executeWorkflow() must carry a policy evaluation
// ---------------------------------------------------------------------------

describe("checkExecuteWorkflowCalls", () => {
  it("passes when policyEvaluation is supplied", () => {
    const src = `
      const result = await executeWorkflow({
        workflowId: "wf-001",
        policyEvaluation: eval,
        input: {},
      });
    `;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes when policyEvaluationOverride is supplied", () => {
    const src = `
      const result = await executeWorkflow({
        workflowId: "wf-001",
        policyEvaluationOverride: true,
        input: {},
      });
    `;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes when isDryRun is supplied", () => {
    const src = `
      const result = await executeWorkflow({
        workflowId: "wf-001",
        isDryRun: true,
      });
    `;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes when isSimulation is supplied", () => {
    const src = `
      const result = await executeWorkflow({
        workflowId: "wf-001",
        isSimulation: true,
      });
    `;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes for function definitions named executeWorkflow", () => {
    const src = `async function executeWorkflow({ workflowId, input }) {
      return run(workflowId, input);
    }`;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("fails when executeWorkflow() call has no policy evaluation field", () => {
    const src = `
      const result = await executeWorkflow({
        workflowId: "wf-dangerous",
        input: { amount: 9999 },
      });
    `;
    const violations = checkExecuteWorkflowCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/policyEvaluation/i);
  });

  it("fails for every ungated executeWorkflow() call in the source", () => {
    const violations1 = checkExecuteWorkflowCalls(
      FAKE_PATH,
      `await executeWorkflow({ workflowId: "wf-a", input: {} });`,
    );
    const violations2 = checkExecuteWorkflowCalls(
      FAKE_PATH,
      `await executeWorkflow({ workflowId: "wf-c", input: {} });`,
    );
    expect(violations1.length).toBe(1);
    expect(violations2.length).toBe(1);
  });

  it("fails when isDryRun is a dynamic expression (not literal true)", () => {
    const src = `await executeWorkflow({ workflowId: "wf-x", isDryRun: req.isDryRun ?? false });`;
    const violations = checkExecuteWorkflowCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/policyEvaluation/i);
  });

  it("fails when isSimulation is a dynamic expression (not literal true)", () => {
    const src = `await executeWorkflow({ workflowId: "wf-x", isSimulation: req.isSimulation ?? false });`;
    const violations = checkExecuteWorkflowCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/policyEvaluation/i);
  });

  it("fails when policyEvaluationOverride is false (not literal true)", () => {
    const src = `await executeWorkflow({ workflowId: "wf-x", policyEvaluationOverride: false });`;
    const violations = checkExecuteWorkflowCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/policyEvaluation/i);
  });

  it("passes when policyEvaluation key is present alongside dynamic isDryRun", () => {
    const src = `await executeWorkflow({ workflowId: "wf-x", policyEvaluation: req.policyEvaluation, isDryRun: req.isDryRun ?? false });`;
    expect(checkExecuteWorkflowCalls(FAKE_PATH, src)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Gate 2 — buildPolicyEvaluation() must carry all five proof-chain args
// ---------------------------------------------------------------------------

const FULL_BUILD_CALL = `
  const pe = buildPolicyEvaluation({
    action: "vessel.reroute",
    confidence: 0.92,
    freshnessScore: 0.88,
    projectedImpact: "MV Albatross rerouted; +18h transit.",
    projectedRisk: "Weather risk eliminated.",
    evidenceChain: [
      { source: "weather-intelligence", summary: "Storm Nadia", confidence: 0.96, freshness: 0.99 },
    ],
  });
`;

describe("checkBuildPolicyEvaluationCalls", () => {
  it("passes when all five proof-chain fields are present", () => {
    expect(checkBuildPolicyEvaluationCalls(FAKE_PATH, FULL_BUILD_CALL)).toHaveLength(0);
  });

  it("fails when evidenceChain is missing", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        confidence: 0.92,
        freshnessScore: 0.88,
        projectedImpact: "Reroute vessel.",
        projectedRisk: "Low.",
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/evidenceChain/);
  });

  it("fails when freshnessScore is missing", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        confidence: 0.92,
        projectedImpact: "Reroute vessel.",
        projectedRisk: "Low.",
        evidenceChain: [{ source: "s", summary: "t", confidence: 0.9, freshness: 0.9 }],
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/freshnessScore/);
  });

  it("fails when confidence is missing", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        freshnessScore: 0.88,
        projectedImpact: "Reroute vessel.",
        projectedRisk: "Low.",
        evidenceChain: [],
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/confidence/);
  });

  it("fails when projectedImpact is missing", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        confidence: 0.92,
        freshnessScore: 0.88,
        projectedRisk: "Low.",
        evidenceChain: [{ source: "s", summary: "t", confidence: 0.9, freshness: 0.9 }],
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/projectedImpact/);
  });

  it("fails when projectedRisk is missing", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        confidence: 0.92,
        freshnessScore: 0.88,
        projectedImpact: "Reroute vessel.",
        evidenceChain: [{ source: "s", summary: "t", confidence: 0.9, freshness: 0.9 }],
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/projectedRisk/);
  });

  it("passes for function definitions named buildPolicyEvaluation", () => {
    const src = `
      export function buildPolicyEvaluation(params) {
        return computeEval(params);
      }
    `;
    expect(checkBuildPolicyEvaluationCalls(FAKE_PATH, src)).toHaveLength(0);
  });

  it("reports one violation per non-compliant call listing all missing fields", () => {
    const src = `
      buildPolicyEvaluation({
        action: "a",
        confidence: 0.9,
        freshnessScore: 0.8,
        projectedImpact: "Impact A.",
        projectedRisk: "Risk A.",
        evidenceChain: [],
      });
      buildPolicyEvaluation({
        action: "b",
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBe(1);
    expect(violations[0].issue).toMatch(/evidenceChain/);
    expect(violations[0].issue).toMatch(/freshnessScore/);
    expect(violations[0].issue).toMatch(/confidence/);
    expect(violations[0].issue).toMatch(/projectedImpact/);
    expect(violations[0].issue).toMatch(/projectedRisk/);
  });

  it("does not false-positive on confidence: inside nested evidenceChain items", () => {
    const src = `
      buildPolicyEvaluation({
        action: "vessel.reroute",
        freshnessScore: 0.88,
        projectedImpact: "Reroute vessel.",
        projectedRisk: "Low.",
        evidenceChain: [
          { source: "weather", summary: "Storm", confidence: 0.96, freshness: 0.99 },
        ],
      });
    `;
    const violations = checkBuildPolicyEvaluationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/confidence/);
  });
});

// ---------------------------------------------------------------------------
// Bracket-bounded extraction helpers
// ---------------------------------------------------------------------------

describe("extractArgBlock", () => {
  it("extracts only the current call's argument block", () => {
    const src = `fn({ a: 1 }); fn({ b: 2 });`;
    const block = extractArgBlock(src, 0);
    expect(block).toBe(`fn({ a: 1 })`);
    expect(block).not.toContain("b: 2");
  });

  it("handles nested braces correctly", () => {
    const src = `fn({ outer: { inner: true }, x: 42 })`;
    const block = extractArgBlock(src, 0);
    expect(block).toContain("inner: true");
    expect(block).toContain("x: 42");
  });
});

describe("removeNestedBraces", () => {
  it("exposes top-level keys and strips nested object content", () => {
    const src = `fn({ confidence: 0.9, chain: [{ confidence: 0.5, other: "x" }] })`;
    const flat = removeNestedBraces(src);
    expect(flat).toMatch(/confidence/);
    expect(flat).toMatch(/chain/);
    expect(flat).not.toContain("other");
  });

  it("does not expose keys that only appear inside nested arrays", () => {
    const src = `fn({ items: [{ secret: true }] })`;
    const flat = removeNestedBraces(src);
    expect(flat).toMatch(/items/);
    expect(flat).not.toContain("secret");
  });
});

// ---------------------------------------------------------------------------
// Gate 3 — createRecommendation() must carry proof-chain fields
// ---------------------------------------------------------------------------

describe("checkCreateRecommendationCalls", () => {
  const FULL_CALL = `
    createRecommendation({
      domain: "maritime",
      title: "Reroute MV Albatross",
      summary: "Storm avoidance required.",
      rationale: "Weather data indicates Force-9 conditions.",
      suggestedAction: "execute",
      actionPayload: {},
      confidence: 0.92,
      freshness: 0.88,
      projectedImpact: "Reroute avoids $185K/day demurrage and resolves OFAC gate.",
      projectedRisk: "Without reroute, vessel faces detention and $3.2M cargo exposure.",
      policyEvaluation: { outcome: "pending", policyIds: [] },
      evidenceIds: ["ev-001", "ev-002"],
      signalIds: [],
      entityRefs: [],
      generatedAt: new Date().toISOString(),
    });
  `;

  it("passes when all required fields are present", () => {
    expect(checkCreateRecommendationCalls(FAKE_PATH, FULL_CALL)).toHaveLength(0);
  });

  const BASE_REQUIRED = `domain: "maritime", rationale: "Storm risk detected.", confidence: 0.92, freshness: 0.88, projectedImpact: "Impact.", projectedRisk: "Risk.", policyEvaluation: { outcome: "pending" }, evidenceIds: ["ev-001"], generatedAt: new Date().toISOString()`;

  it("fails when evidenceIds is missing", () => {
    const src = `createRecommendation({ domain: "maritime", rationale: "R.", confidence: 0.92, freshness: 0.88, projectedImpact: "I.", projectedRisk: "Risk.", generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/evidenceIds/);
  });

  it("fails when confidence is missing", () => {
    const src = `createRecommendation({ domain: "maritime", rationale: "R.", freshness: 0.88, projectedImpact: "I.", projectedRisk: "Risk.", evidenceIds: ["ev-001"], generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/confidence/);
  });

  it("fails when freshness is missing", () => {
    const src = `createRecommendation({ domain: "maritime", rationale: "R.", confidence: 0.92, projectedImpact: "I.", projectedRisk: "Risk.", evidenceIds: ["ev-001"], generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/freshness/);
  });

  it("fails when rationale is missing", () => {
    const src = `createRecommendation({ domain: "maritime", confidence: 0.92, freshness: 0.88, projectedImpact: "I.", projectedRisk: "Risk.", evidenceIds: ["ev-001"], generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/rationale/);
  });

  it("fails when domain is missing", () => {
    const src = `createRecommendation({ rationale: "R.", confidence: 0.92, freshness: 0.88, projectedImpact: "I.", projectedRisk: "Risk.", evidenceIds: ["ev-001"], generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/domain/);
  });

  it("fails when projectedImpact is missing", () => {
    const src = `createRecommendation({ ${BASE_REQUIRED.replace(", projectedImpact: \"Impact.\"", "")} });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/projectedImpact/);
  });

  it("fails when projectedRisk is missing", () => {
    const src = `createRecommendation({ ${BASE_REQUIRED.replace(", projectedRisk: \"Risk.\"", "")} });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/projectedRisk/);
  });

  it("fails when policyEvaluation is missing", () => {
    const src = `createRecommendation({ domain: "maritime", rationale: "R.", confidence: 0.92, freshness: 0.88, projectedImpact: "I.", projectedRisk: "Risk.", evidenceIds: ["ev-001"], generatedAt: new Date().toISOString() });`;
    const violations = checkCreateRecommendationCalls(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/policyEvaluation/);
  });

  it("passes for function definitions named createRecommendation", () => {
    const src = `export function createRecommendation(input) { return schema.parse(input); }`;
    expect(checkCreateRecommendationCalls(FAKE_PATH, src)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Gate 4 — `as Recommendation` type assertions bypass the factory
// ---------------------------------------------------------------------------

describe("checkRecommendationTypeAssertions", () => {
  it("fails when as Recommendation type assertion is used to bypass the factory", () => {
    const src = `const rec = JSON.parse(rawData) as Recommendation;`;
    const violations = checkRecommendationTypeAssertions(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/as Recommendation/);
    expect(violations[0].issue).toMatch(/createRecommendation/);
  });

  it("fails when as Recommendation is used in a DB row mapper", () => {
    const src = `const recs = rows.map(r => r as Recommendation);`;
    const violations = checkRecommendationTypeAssertions(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("passes for type annotations (not assertions): param: Recommendation", () => {
    const src = `function renderRec(rec: Recommendation): void { console.log(rec.title); }`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes for Recommendation property access type lookups", () => {
    const src = `const domain: Recommendation["domain"] = "maritime";`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes for import type statements", () => {
    const src = `import type { Recommendation } from "@workspace/ontology";`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes when createRecommendation is used (factory path)", () => {
    const src = `const rec = createRecommendation({ domain: "maritime", evidenceIds: ["ev-001"], confidence: 0.9, freshness: 0.9, rationale: "R.", projectedImpact: "I.", projectedRisk: "Risk.", policyEvaluation: { outcome: "pending" }, generatedAt: new Date().toISOString() });`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });

  it("fails for legacy angle-bracket cast syntax <Recommendation>someExpr", () => {
    const src = `const rec = <Recommendation>dbRow;`;
    const violations = checkRecommendationTypeAssertions(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].issue).toMatch(/legacy cast/);
  });

  it("fails for legacy cast used in a mapper: <Recommendation>row", () => {
    const src = `return rows.map(row => <Recommendation>row);`;
    const violations = checkRecommendationTypeAssertions(FAKE_PATH, src);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("passes for generic type usage Array<Recommendation> (not a cast)", () => {
    const src = `const recs: Array<Recommendation> = [];`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });

  it("passes for Map generic type Map<string, Recommendation> (not a cast)", () => {
    const src = `const map: Map<string, Recommendation> = new Map();`;
    expect(checkRecommendationTypeAssertions(FAKE_PATH, src)).toHaveLength(0);
  });
});
