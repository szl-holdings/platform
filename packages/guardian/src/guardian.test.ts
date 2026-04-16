import { describe, it, expect, beforeEach } from "vitest";
import { GuardianDecisionEngine } from "./decision-engine.js";
import { PolicyTierSchema, TIER_RISK_LEVEL } from "./tiers.js";
import type { DecisionRequest, GuardianRule } from "./schema.js";

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
