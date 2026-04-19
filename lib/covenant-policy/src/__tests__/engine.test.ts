import { describe, expect, it } from "vitest";
import { CovenantPolicyEngine, type CovenantPolicy, type CovenantRequest } from "../engine.js";

function req(overrides: Partial<CovenantRequest> = {}): CovenantRequest {
  return {
    subject: { roles: ["member"], userId: "u1", tenantId: "t1" },
    resource: { type: "voyage", domain: "vessels", actionClass: "read" },
    action: "view",
    ...overrides,
  };
}

function policy(overrides: Partial<CovenantPolicy>): CovenantPolicy {
  return {
    id: overrides.id ?? "p",
    name: overrides.name ?? "Policy",
    version: "1.0",
    roles: ["member"],
    domains: ["vessels"],
    permissions: ["view"],
    effect: "allow",
    ...overrides,
  };
}

describe("CovenantPolicyEngine", () => {
  it("denies by default when no policies match", () => {
    const e = new CovenantPolicyEngine();
    const d = e.evaluate(req());
    expect(d.allowed).toBe(false);
    expect(d.effect).toBe("deny");
    expect(d.reason).toMatch(/default deny/i);
    expect(d.matchedPolicies).toEqual([]);
  });

  it("allows when an applicable allow policy matches", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "allow-view" }));
    const d = e.evaluate(req());
    expect(d.allowed).toBe(true);
    expect(d.matchedPolicies).toEqual(["allow-view"]);
    expect(d.deniedBy).toBeNull();
  });

  it("respects priority and short-circuits on a deny policy", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "low-allow", effect: "allow", priority: 1 }));
    e.register(policy({ id: "high-deny", effect: "deny", priority: 10 }));
    const d = e.evaluate(req());
    expect(d.allowed).toBe(false);
    expect(d.deniedBy).toBe("high-deny");
    expect(d.matchedPolicies).toEqual(["high-deny"]);
  });

  it("ignores expired policies", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "expired", expiresAt: Date.now() - 1000 }));
    const d = e.evaluate(req());
    expect(d.allowed).toBe(false);
    expect(d.matchedPolicies).toEqual([]);
  });

  it("filters by role, domain, and permission", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "wrong-role", roles: ["super_admin"] }));
    e.register(policy({ id: "wrong-domain", domains: ["aegis"] }));
    e.register(policy({ id: "wrong-perm", permissions: ["admin"] }));
    e.register(policy({ id: "right" }));
    const d = e.evaluate(req());
    expect(d.matchedPolicies).toEqual(["right"]);
  });

  it("treats a policy with the 'global' domain as matching any resource domain", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "global", domains: ["global"] }));
    const d = e.evaluate(req({ resource: { type: "x", domain: "aegis" } }));
    expect(d.allowed).toBe(true);
  });

  it("evaluates attribute_match conditions", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({
      id: "attr",
      conditions: [{ type: "attribute_match", field: "region", operator: "eq", value: "EU" }],
    }));
    expect(e.evaluate(req({ context: { region: "EU" } })).allowed).toBe(true);
    expect(e.evaluate(req({ context: { region: "US" } })).allowed).toBe(false);
  });

  it("evaluates domain_match and action_class conditions", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({
      id: "dom",
      conditions: [
        { type: "domain_match", operator: "in", value: ["vessels", "terra"] },
        { type: "action_class", operator: "eq", value: "read" },
      ],
    }));
    expect(e.evaluate(req()).allowed).toBe(true);
    expect(
      e.evaluate(req({ resource: { type: "x", domain: "vessels", actionClass: "write" } })).allowed
    ).toBe(false);
  });

  it("blocks high-risk actions for non-approver subjects", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "allow-execute", permissions: ["execute"] }));
    const denied = e.evaluate(req({
      action: "execute",
      context: { actionName: "deploy" },
    }));
    expect(denied.allowed).toBe(false);
    expect(denied.deniedBy).toBe("covenant:high-risk-action-guard");
    expect(denied.reason).toMatch(/high-risk/i);
  });

  it("permits high-risk actions when subject has approver role", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({
      id: "allow-execute",
      roles: ["approver"],
      permissions: ["execute"],
    }));
    const allowed = e.evaluate(req({
      subject: { roles: ["approver"] },
      action: "execute",
      context: { actionName: "deploy" },
    }));
    expect(allowed.allowed).toBe(true);
  });

  it("simulate() returns a structured explanation and reuses evaluate()", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "p1", name: "View Policy" }));
    const { decision, explanation } = e.simulate(req());
    expect(decision.allowed).toBe(true);
    expect(explanation.some(l => l.includes("View Policy"))).toBe(true);
    expect(explanation.some(l => l.includes("ALLOW"))).toBe(true);
  });

  it("logs decisions and reports stats", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "ok" }));
    e.evaluate(req());
    e.evaluate(req({ subject: { roles: ["unknown_role" as never] } }));
    const stats = e.getStats();
    expect(stats.total).toBe(2);
    expect(stats.allowed).toBe(1);
    expect(stats.denied).toBe(1);
    expect(stats.policyCount).toBe(1);
    expect(e.getDecisionLog({ effect: "allow" })).toHaveLength(1);
  });

  it("exposes high-risk action helpers", () => {
    const e = new CovenantPolicyEngine();
    expect(e.isHighRiskAction("deploy")).toBe(true);
    expect(e.isHighRiskAction("read_dashboard")).toBe(false);
    expect(e.getHighRiskActions()).toContain("delete_tenant");
  });

  it("unregister removes the policy from evaluation", () => {
    const e = new CovenantPolicyEngine();
    e.register(policy({ id: "p" }));
    expect(e.evaluate(req()).allowed).toBe(true);
    e.unregister("p");
    expect(e.evaluate(req()).allowed).toBe(false);
  });
});
