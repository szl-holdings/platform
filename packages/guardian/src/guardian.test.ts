import { describe, it, expect, beforeEach } from "vitest";
import { GuardianDecisionEngine, addDefaultAllowRule, defaultDecisionEngine } from "./decision-engine.js";
import { PolicyTierSchema, TIER_RISK_LEVEL, POLICY_TIER_DESCRIPTIONS } from "./tiers.js";
import type { DecisionRequest, GuardianRule } from "./schema.js";
import { GuardianRuleSchema, DecisionRequestSchema } from "./schema.js";

function makeRequest(overrides: Partial<DecisionRequest> = {}): DecisionRequest {
  return {
    requestId: "req-001",
    action: "write-record",
    context: {},
    ...overrides,
  };
}

describe("PolicyTier", () => {
  it("has 8 tiers", () => {
    expect(PolicyTierSchema.options).toHaveLength(8);
  });

  it("human-approval-mandatory has highest risk", () => {
    expect(TIER_RISK_LEVEL["human-approval-mandatory"]).toBe(8);
    expect(TIER_RISK_LEVEL["advisory-only"]).toBe(1);
  });
});

describe("GuardianDecisionEngine", () => {
  let engine: GuardianDecisionEngine;

  beforeEach(() => {
    engine = new GuardianDecisionEngine();
  });

  it("denies by default when no tier is set", () => {
    const result = engine.decide(makeRequest());
    expect(result.outcome).toBe("deny");
    expect(result.reason).toMatch(/deny-by-default/i);
  });

  it("denies by default when tier is set but no matching rule", () => {
    const result = engine.decide(makeRequest({ tier: "internal-workflow" }));
    expect(result.outcome).toBe("deny");
  });

  it("always requires approval for human-approval-mandatory", () => {
    engine.addRule({
      id: "allow-all",
      name: "Allow all",
      tier: "human-approval-mandatory",
      conditions: [],
      action: "allow",
      priority: 1,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "human-approval-mandatory" }));
    expect(result.outcome).toBe("require-approval");
  });

  it("allows when a matching allow rule is added", () => {
    const rule: GuardianRule = {
      id: "allow-internal",
      name: "Allow internal workflow",
      tier: "internal-workflow",
      conditions: [],
      action: "allow",
      priority: 10,
      enabled: true,
      tags: [],
    };
    engine.addRule(rule);
    const result = engine.decide(makeRequest({ tier: "internal-workflow" }));
    expect(result.outcome).toBe("allow");
    expect(result.matchedRuleId).toBe("allow-internal");
  });

  it("denies when matching rule says deny", () => {
    engine.addRule({
      id: "deny-write",
      name: "Deny writes",
      tier: "advisory-only",
      conditions: [{ field: "action", operator: "eq", value: "write-record" }],
      action: "deny",
      priority: 10,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "advisory-only" }));
    expect(result.outcome).toBe("deny");
  });

  it("respects priority order (lower priority number runs first)", () => {
    engine.addRule({
      id: "deny-first",
      name: "Deny (low priority number = first)",
      tier: "advisory-only",
      conditions: [],
      action: "deny",
      priority: 1,
      enabled: true,
      tags: [],
    });
    engine.addRule({
      id: "allow-second",
      name: "Allow (higher priority number = later)",
      tier: "advisory-only",
      conditions: [],
      action: "allow",
      priority: 2,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "advisory-only" }));
    expect(result.outcome).toBe("deny");
    expect(result.matchedRuleId).toBe("deny-first");
  });

  it("skips disabled rules", () => {
    engine.addRule({
      id: "disabled-allow",
      name: "Disabled allow",
      tier: "advisory-only",
      conditions: [],
      action: "allow",
      priority: 1,
      enabled: false,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "advisory-only" }));
    expect(result.outcome).toBe("deny");
  });

  it("supports condition evaluation (eq)", () => {
    engine.addRule({
      id: "allow-read",
      name: "Allow read actions",
      tier: "advisory-only",
      conditions: [{ field: "action", operator: "eq", value: "read" }],
      action: "allow",
      priority: 10,
      enabled: true,
      tags: [],
    });
    const allow = engine.decide(makeRequest({ tier: "advisory-only", action: "read" }));
    expect(allow.outcome).toBe("allow");
    const deny = engine.decide(makeRequest({ tier: "advisory-only", action: "write" }));
    expect(deny.outcome).toBe("deny");
  });
});

describe("GuardianRuleSchema validation", () => {
  it("validates a minimal valid rule", () => {
    const rule = {
      id: "r1",
      name: "Test rule",
      tier: "internal-workflow",
      action: "allow",
    };
    expect(() => GuardianRuleSchema.parse(rule)).not.toThrow();
  });

  it("rejects an unknown action", () => {
    const rule = { id: "r1", name: "Test", tier: "internal-workflow", action: "unknown" };
    expect(() => GuardianRuleSchema.parse(rule)).toThrow();
  });

  it("rejects an unknown tier", () => {
    const rule = { id: "r1", name: "Test", tier: "super-secret", action: "allow" };
    expect(() => GuardianRuleSchema.parse(rule)).toThrow();
  });

  it("defaults conditions to empty array", () => {
    const rule = GuardianRuleSchema.parse({ id: "r1", name: "Test", tier: "advisory-only", action: "allow" });
    expect(rule.conditions).toEqual([]);
  });
});

describe("DecisionRequestSchema validation", () => {
  it("validates a minimal decision request", () => {
    const req = { requestId: "r1", action: "read-data" };
    expect(() => DecisionRequestSchema.parse(req)).not.toThrow();
  });

  it("fails when requestId is missing", () => {
    expect(() => DecisionRequestSchema.parse({ action: "read-data" })).toThrow();
  });

  it("defaults context to empty object", () => {
    const req = DecisionRequestSchema.parse({ requestId: "r1", action: "x" });
    expect(req.context).toEqual({});
  });
});

describe("Approval-required flow", () => {
  let engine: GuardianDecisionEngine;

  beforeEach(() => {
    engine = new GuardianDecisionEngine();
  });

  it("require-approval rule sets outcome to require-approval", () => {
    engine.addRule({
      id: "approval-rule",
      name: "Requires executive sign-off",
      tier: "executive-facing",
      conditions: [],
      action: "require-approval",
      priority: 10,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "executive-facing" }));
    expect(result.outcome).toBe("require-approval");
    expect(result.requiredApprovers.length).toBeGreaterThan(0);
    expect(result.matchedRuleId).toBe("approval-rule");
  });

  it("human-approval-mandatory always requires approval regardless of rules", () => {
    engine.addRule({
      id: "unconditional-allow",
      name: "Unconditional allow",
      tier: "human-approval-mandatory",
      conditions: [],
      action: "allow",
      priority: 1,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "human-approval-mandatory" }));
    expect(result.outcome).toBe("require-approval");
    expect(result.requiredApprovers).toContain("human-approver");
  });

  it("escalate action also resolves to require-approval", () => {
    engine.addRule({
      id: "escalate-rule",
      name: "Escalate regulated",
      tier: "regulated-workflow",
      conditions: [],
      action: "escalate",
      priority: 1,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "regulated-workflow" }));
    expect(result.outcome).toBe("require-approval");
  });

  it("approval decision carries decidedAt timestamp", () => {
    engine.addRule({
      id: "approval-ts",
      name: "Approval with timestamp",
      tier: "autonomous-reversible",
      conditions: [],
      action: "require-approval",
      priority: 1,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: "autonomous-reversible" }));
    expect(result.outcome).toBe("require-approval");
    expect(new Date(result.decidedAt).getTime()).toBeGreaterThan(0);
  });

  it("context-driven approval: high-risk amount triggers require-approval", () => {
    engine.addRule({
      id: "high-value-approval",
      name: "High value transfer approval",
      tier: "regulated-workflow",
      conditions: [{ field: "amount", operator: "gt", value: 100000 }],
      action: "require-approval",
      priority: 1,
      enabled: true,
      tags: ["finance"],
    });
    engine.addRule({
      id: "low-value-allow",
      name: "Low value allow",
      tier: "regulated-workflow",
      conditions: [],
      action: "allow",
      priority: 100,
      enabled: true,
      tags: [],
    });

    const high = engine.decide(makeRequest({ tier: "regulated-workflow", context: { amount: 500000 } }));
    expect(high.outcome).toBe("require-approval");

    const low = engine.decide(makeRequest({ tier: "regulated-workflow", context: { amount: 1000 } }));
    expect(low.outcome).toBe("allow");
  });
});

describe("addDefaultAllowRule helper", () => {
  it("adds a default allow rule to the default engine", () => {
    addDefaultAllowRule("advisory-only");
    const result = defaultDecisionEngine.decide(makeRequest({ tier: "advisory-only" }));
    expect(result.outcome).toBe("allow");
  });
});
