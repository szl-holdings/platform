import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluatePolicies,
  buildPolicyEvaluation,
  registerPolicy,
  unregisterPolicy,
  checkAction,
} from "./index.js";
import {
  PolicyModeRegistry,
  PolicyModeConfigSchema,
  defaultPolicyModeRegistry,
} from "./modes.js";
import type { Policy, EvaluationRequest, PolicyEvaluation } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: "test-policy-001",
    name: "Test Policy",
    scope: "action",
    rules: [],
    isActive: true,
    priority: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeRequest(overrides: Partial<EvaluationRequest> = {}): EvaluationRequest {
  return {
    action: "send-email",
    domain: "hospitality",
    tenantId: "tenant-abc",
    subject: { id: "user-1", roles: ["operator"], tenantId: "tenant-abc" },
    resource: { type: "email", id: "email-001", domain: "hospitality" },
    confidence: 0.9,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Policy Evaluator — all five effects
// ---------------------------------------------------------------------------

describe("evaluatePolicies — policy effects", () => {
  it("returns effect=allow when no policies match", () => {
    const result = evaluatePolicies([], makeRequest());
    expect(result.effect).toBe("allow");
    expect(result.allowed).toBe(true);
    expect(result.requiresApproval).toBe(false);
  });

  it("returns effect=block and allowed=false when a block rule matches", () => {
    const policy = makePolicy({
      rules: [{
        id: "r1",
        name: "Block all",
        effect: "block",
        reason: "Not permitted",
        priority: 100,
      }],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("block");
    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("returns effect=require_approval and captures approver role", () => {
    const policy = makePolicy({
      rules: [{
        id: "r2",
        name: "Require approval",
        effect: "require_approval",
        requiredApproverRole: "compliance",
        priority: 100,
      }],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("require_approval");
    expect(result.requiresApproval).toBe(true);
    expect(result.requiredApproverRole).toBe("compliance");
  });

  it("returns effect=escalate and captures escalation target", () => {
    const policy = makePolicy({
      rules: [{
        id: "r3",
        name: "Escalate",
        effect: "escalate",
        escalateTo: "legal-team",
        priority: 100,
      }],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("escalate");
    expect(result.escalationTarget).toBe("legal-team");
  });

  it("returns effect=audit_only and allowed=true", () => {
    const policy = makePolicy({
      rules: [{
        id: "r4",
        name: "Audit only",
        effect: "audit_only",
        priority: 100,
      }],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("audit_only");
    expect(result.allowed).toBe(true);
  });

  it("block takes priority over require_approval (EFFECT_PRIORITY)", () => {
    const policy = makePolicy({
      rules: [
        { id: "r-block", name: "Block", effect: "block", priority: 200 },
        { id: "r-approve", name: "Approval", effect: "require_approval", requiredApproverRole: "admin", priority: 100 },
      ],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("block");
  });

  it("populates evaluatedAt timestamp", () => {
    const before = Date.now();
    const result = evaluatePolicies([], makeRequest());
    const after = Date.now();
    expect(result.evaluatedAt).toBeGreaterThanOrEqual(before);
    expect(result.evaluatedAt).toBeLessThanOrEqual(after);
  });

  it("populates reasoning string", () => {
    const result = evaluatePolicies([], makeRequest());
    expect(typeof result.reasoning).toBe("string");
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Condition operators
// ---------------------------------------------------------------------------

describe("evaluatePolicies — condition operators", () => {
  function policyWithCondition(
    field: string,
    operator: string,
    value: unknown,
    effect: "block" | "allow" = "block"
  ): Policy {
    return makePolicy({
      rules: [{
        id: "r-cond",
        name: "Conditional",
        conditions: [{ field, operator: operator as never, value }],
        effect,
        priority: 100,
      }],
      scope: "action",
    });
  }

  it("eq operator matches exact value", () => {
    const p = policyWithCondition("action", "eq", "send-email");
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });

  it("neq operator does not match when values differ", () => {
    const p = policyWithCondition("action", "neq", "delete-record");
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });

  it("gt operator fires when actual > threshold", () => {
    const p = policyWithCondition("estimatedCostUsd", "gt", 5000);
    const result = evaluatePolicies([p], makeRequest({ estimatedCostUsd: 6000 }));
    expect(result.effect).toBe("block");
  });

  it("lt operator does NOT fire when actual >= threshold", () => {
    const p = policyWithCondition("estimatedCostUsd", "lt", 1000);
    const result = evaluatePolicies([p], makeRequest({ estimatedCostUsd: 6000 }));
    expect(result.effect).toBe("allow");
  });

  it("in operator matches when value is in array", () => {
    const p = policyWithCondition("action", "in", ["send-email", "delete-record"]);
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });

  it("not_in operator fires when value is NOT in array", () => {
    const p = policyWithCondition("action", "not_in", ["delete-record"]);
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });

  it("contains operator matches substring", () => {
    const p = policyWithCondition("action", "contains", "email");
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });

  it("matches operator fires on regex", () => {
    const p = policyWithCondition("action", "matches", "^send");
    const result = evaluatePolicies([p], makeRequest({ action: "send-email" }));
    expect(result.effect).toBe("block");
  });
});

// ---------------------------------------------------------------------------
// 3. Policy scope filtering
// ---------------------------------------------------------------------------

describe("evaluatePolicies — scope filtering", () => {
  it("tenant-scoped policy only matches correct tenant", () => {
    const policy = makePolicy({
      scope: "tenant",
      tenantId: "tenant-xyz",
      rules: [{ id: "r", name: "Block", effect: "block", priority: 100 }],
    });
    const otherTenantResult = evaluatePolicies([policy], makeRequest({ tenantId: "tenant-abc" }));
    expect(otherTenantResult.effect).toBe("allow");

    const matchingTenantResult = evaluatePolicies([policy], makeRequest({ tenantId: "tenant-xyz" }));
    expect(matchingTenantResult.effect).toBe("block");
  });

  it("domain-scoped policy only matches correct domain", () => {
    const policy = makePolicy({
      scope: "domain",
      domain: "maritime",
      rules: [{ id: "r", name: "Block", effect: "block", priority: 100 }],
    });
    const hospitalityResult = evaluatePolicies([policy], makeRequest({ domain: "hospitality" }));
    expect(hospitalityResult.effect).toBe("allow");

    const maritimeResult = evaluatePolicies([policy], makeRequest({ domain: "maritime" }));
    expect(maritimeResult.effect).toBe("block");
  });

  it("inactive policy is skipped", () => {
    const policy = makePolicy({
      isActive: false,
      rules: [{ id: "r", name: "Block", effect: "block", priority: 100 }],
    });
    const result = evaluatePolicies([policy], makeRequest());
    expect(result.effect).toBe("allow");
  });

  it("action-scoped policy matches by actionTypes", () => {
    const policy = makePolicy({
      scope: "action",
      actionTypes: ["send-email"],
      rules: [{ id: "r", name: "Block", effect: "block", priority: 100 }],
    });
    const matchResult = evaluatePolicies([policy], makeRequest({ action: "send-email" }));
    expect(matchResult.effect).toBe("block");

    const noMatchResult = evaluatePolicies([policy], makeRequest({ action: "read-report" }));
    expect(noMatchResult.effect).toBe("allow");
  });
});

// ---------------------------------------------------------------------------
// 4. PolicyModeRegistry — all five modes
// ---------------------------------------------------------------------------

describe("PolicyModeRegistry", () => {
  let registry: PolicyModeRegistry;

  beforeEach(() => {
    registry = new PolicyModeRegistry();
  });

  const ALL_MODES = [
    "observe",
    "recommend",
    "draft",
    "approval-required",
    "auto-within-guardrails",
  ] as const;

  for (const mode of ALL_MODES) {
    it(`registers and resolves mode: ${mode}`, () => {
      const config = PolicyModeConfigSchema.parse({
        id: `cfg-${mode}`,
        scope: { product: "lyte", actionType: "analyze", workspace: "default" },
        mode,
      });
      registry.register(config);

      const resolved = registry.resolve({ product: "lyte", actionType: "analyze", workspace: "default" });
      expect(resolved).not.toBeNull();
      expect(resolved!.mode).toBe(mode);
    });
  }

  it("returns null when no config matches", () => {
    const resolved = registry.resolve({ product: "unknown", actionType: "unknown", workspace: "unknown" });
    expect(resolved).toBeNull();
  });

  it("wildcard scope matches any product", () => {
    const config = PolicyModeConfigSchema.parse({
      id: "cfg-wildcard",
      scope: { product: "*", actionType: "*", workspace: "*" },
      mode: "recommend",
    });
    registry.register(config);
    const resolved = registry.resolve({ product: "any-product", actionType: "any-action", workspace: "any-ws" });
    expect(resolved).not.toBeNull();
    expect(resolved!.mode).toBe("recommend");
  });

  it("more specific scope beats wildcard scope", () => {
    const wildcard = PolicyModeConfigSchema.parse({
      id: "cfg-wildcard",
      scope: { product: "*", actionType: "*", workspace: "*" },
      mode: "recommend",
    });
    const specific = PolicyModeConfigSchema.parse({
      id: "cfg-specific",
      scope: { product: "lyte", actionType: "analyze", workspace: "default" },
      mode: "auto-within-guardrails",
    });
    registry.register(wildcard);
    registry.register(specific);
    const resolved = registry.resolve({ product: "lyte", actionType: "analyze", workspace: "default" });
    expect(resolved!.mode).toBe("auto-within-guardrails");
  });

  it("unregister removes config", () => {
    const config = PolicyModeConfigSchema.parse({
      id: "cfg-remove",
      scope: { product: "terra", actionType: "*", workspace: "*" },
      mode: "draft",
    });
    registry.register(config);
    registry.unregister("cfg-remove");
    const resolved = registry.resolve({ product: "terra", actionType: "any", workspace: "any" });
    expect(resolved).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. buildPolicyEvaluation — required metadata on every evaluation
// ---------------------------------------------------------------------------

describe("buildPolicyEvaluation — required metadata fields", () => {
  it("returns a complete PolicyEvaluation with all required fields", () => {
    const pe = buildPolicyEvaluation({
      action: "approve-vessel-route",
      actionType: "approve",
      product: "vessels",
      workspace: "default",
      subjectRoles: ["operator"],
      entitySensitivity: "confidential",
      confidence: 0.88,
      freshnessScore: 0.95,
      environment: "production",
      windowValid: true,
      projectedCostUsd: 1500,
      projectedImpact: "Reroute vessel away from high-risk corridor",
      projectedRisk: "Moderate — alternate route adds 4h transit time",
      evidenceChain: [
        { source: "ais-feed", summary: "Dark period detected", confidence: 0.92, freshness: 0.97 },
        { source: "sanctions-db", summary: "OFAC proximity match", confidence: 0.78, freshness: 0.90 },
      ],
      evaluatedBy: "auto-policy-engine",
    });

    // Required metadata fields must all be present and non-empty
    expect(typeof pe.evaluationId).toBe("string");
    expect(pe.evaluationId.length).toBeGreaterThan(0);

    expect(typeof pe.mode).toBe("string");
    expect(pe.mode.length).toBeGreaterThan(0);

    expect(typeof pe.action).toBe("string");

    expect(Array.isArray(pe.evidenceChain)).toBe(true);
    expect(pe.evidenceChain.length).toBeGreaterThan(0);

    expect(pe.evidenceChain[0]).toMatchObject({
      source: expect.any(String),
      summary: expect.any(String),
      confidence: expect.any(Number),
      freshness: expect.any(Number),
    });

    expect(typeof pe.confidence).toBe("number");
    expect(pe.confidence).toBeGreaterThanOrEqual(0);
    expect(pe.confidence).toBeLessThanOrEqual(1);

    expect(typeof pe.freshnessScore).toBe("number");

    expect(typeof pe.projectedImpact).toBe("string");
    expect(pe.projectedImpact!.length).toBeGreaterThan(0);

    expect(typeof pe.projectedRisk).toBe("string");
    expect(pe.projectedRisk!.length).toBeGreaterThan(0);

    expect(pe.policyResult).toBeDefined();
    expect(typeof pe.policyResult.effect).toBe("string");
    expect(typeof pe.policyResult.allowed).toBe("boolean");

    expect(typeof pe.evaluatedAt).toBe("number");
    expect(pe.evaluatedAt).toBeGreaterThan(0);
  });

  it("blockedReason is set when confidence is below auto-within-guardrails threshold", () => {
    const config = PolicyModeConfigSchema.parse({
      id: "cfg-awg-test",
      scope: { product: "lyte-confidence-test", actionType: "*", workspace: "*" },
      mode: "auto-within-guardrails",
      confidenceThreshold: 0.85,
    });
    defaultPolicyModeRegistry.register(config);

    const pe = buildPolicyEvaluation({
      action: "run-analysis",
      product: "lyte-confidence-test",
      confidence: 0.70,
      freshnessScore: 0.90,
      projectedImpact: "Run cost model",
      projectedRisk: "Low",
      evidenceChain: [{ source: "db", summary: "Cost data", confidence: 0.70, freshness: 0.90 }],
    });

    expect(pe.blockedReason).toBeDefined();
    expect(pe.blockedReason).toContain("0.70");

    defaultPolicyModeRegistry.unregister("cfg-awg-test");
  });

  it("blockedReason is set in observe mode", () => {
    const config = PolicyModeConfigSchema.parse({
      id: "cfg-observe-test",
      scope: { product: "observe-product", actionType: "*", workspace: "*" },
      mode: "observe",
    });
    defaultPolicyModeRegistry.register(config);

    const pe = buildPolicyEvaluation({
      action: "monitor-signals",
      product: "observe-product",
      evidenceChain: [{ source: "stream", summary: "Signal data", confidence: 0.99, freshness: 1.0 }],
      confidence: 0.99,
      freshnessScore: 1.0,
      projectedImpact: "Log only",
      projectedRisk: "None",
    });

    expect(pe.blockedReason).toContain("observe");

    defaultPolicyModeRegistry.unregister("cfg-observe-test");
  });

  it("blockedReason is set when windowValid=false", () => {
    const pe = buildPolicyEvaluation({
      action: "schedule-action",
      windowValid: false,
      evidenceChain: [{ source: "calendar", summary: "Outside window", confidence: 1.0, freshness: 1.0 }],
      confidence: 1.0,
      freshnessScore: 1.0,
      projectedImpact: "None — outside window",
      projectedRisk: "None",
    });
    expect(pe.blockedReason).toBeDefined();
    expect(pe.blockedReason).toContain("window");
  });
});

// ---------------------------------------------------------------------------
// 6. Built-in guardrails
// ---------------------------------------------------------------------------

describe("built-in guardrails", () => {
  it("checkAction blocks low-confidence autonomous execution", () => {
    const result = checkAction({
      action: "autonomous-execute",
      subject: { roles: ["operator"] },
      resource: { type: "task" },
      confidence: 0.3,
      context: { executionMode: "autonomous" },
    });
    expect(result.effect).toBe("block");
  });

  it("checkAction requires approval for high-cost autonomous actions", () => {
    const result = checkAction({
      action: "autonomous-execute",
      subject: { roles: ["operator"] },
      resource: { type: "task" },
      estimatedCostUsd: 15000,
      context: { executionMode: "autonomous" },
    });
    expect(result.effect).toBe("require_approval");
    expect(result.requiredApproverRole).toBe("admin");
  });

  it("checkAction escalates regulatory-exposed actions", () => {
    const result = checkAction({
      action: "file-regulatory-report",
      subject: { roles: ["analyst"] },
      resource: { type: "report" },
      context: { regulatoryExposure: true },
    });
    expect(result.effect).toBe("require_approval");
    expect(result.requiredApproverRole).toBe("compliance");
  });
});

// ---------------------------------------------------------------------------
// 7. registerPolicy / unregisterPolicy lifecycle
// ---------------------------------------------------------------------------

describe("registerPolicy / unregisterPolicy", () => {
  const POLICY_ID = "ci-test-register-policy";

  it("registered policy takes effect in checkAction", () => {
    const policy: Policy = {
      id: POLICY_ID,
      name: "CI Test Block Policy",
      scope: "action",
      actionTypes: ["ci-test-action"],
      rules: [{
        id: "r-ci-test",
        name: "Block CI test action",
        effect: "block",
        reason: "CI test block",
        priority: 9999,
      }],
      isActive: true,
      priority: 9999,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    registerPolicy(policy);
    const result = checkAction({
      action: "ci-test-action",
      subject: { roles: ["operator"] },
      resource: { type: "ci-test-action" },
    });
    expect(result.effect).toBe("block");

    unregisterPolicy(POLICY_ID);
    const resultAfter = checkAction({
      action: "ci-test-action",
      subject: { roles: ["operator"] },
      resource: { type: "ci-test-action" },
    });
    expect(resultAfter.effect).not.toBe("block");
  });
});
