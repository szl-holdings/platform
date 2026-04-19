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

  describe("deny paths — role / domain / permission filters", () => {
    it("denies when subject roles do not intersect the policy roles", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({ id: "needs-admin", roles: ["super_admin"] }));
      const d = e.evaluate(req({ subject: { roles: ["member"] } }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
      expect(d.reason).toMatch(/default deny/i);
    });

    it("denies when resource domain does not match the policy domains", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({ id: "vessels-only", domains: ["vessels"] }));
      const d = e.evaluate(req({ resource: { type: "case", domain: "aegis" } }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });

    it("denies when the requested permission is not in the policy permissions", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({ id: "view-only", permissions: ["view"] }));
      const d = e.evaluate(req({ action: "execute" }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });
  });

  describe("deny paths — expired policies", () => {
    it("returns default deny with no matched policies for an expired allow policy", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({ id: "stale", expiresAt: Date.now() - 60_000 }));
      const d = e.evaluate(req());
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
      expect(d.reason).toMatch(/default deny/i);
    });

    it("treats expiresAt === null as never expiring", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({ id: "evergreen", expiresAt: null }));
      expect(e.evaluate(req()).allowed).toBe(true);
    });
  });

  describe("deny paths — condition mismatches", () => {
    it("denies when domain_match eq condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "dom-eq",
        conditions: [{ type: "domain_match", operator: "eq", value: "aegis" }],
      }));
      const d = e.evaluate(req());
      expect(d.allowed).toBe(false);
    });

    it("denies when domain_match in condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "dom-in",
        conditions: [{ type: "domain_match", operator: "in", value: ["aegis", "terra"] }],
      }));
      const d = e.evaluate(req());
      expect(d.allowed).toBe(false);
    });

    it("denies when action_class eq condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "ac-eq",
        conditions: [{ type: "action_class", operator: "eq", value: "write" }],
      }));
      const d = e.evaluate(req());
      expect(d.allowed).toBe(false);
    });

    it("denies when action_class in condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "ac-in",
        conditions: [{ type: "action_class", operator: "in", value: ["write", "delete"] }],
      }));
      const d = e.evaluate(req());
      expect(d.allowed).toBe(false);
    });

    it("denies when attribute_match neq condition is not satisfied", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "attr-neq",
        conditions: [{ type: "attribute_match", field: "region", operator: "neq", value: "EU" }],
      }));
      expect(e.evaluate(req({ context: { region: "EU" } })).allowed).toBe(false);
      expect(e.evaluate(req({ context: { region: "US" } })).allowed).toBe(true);
    });

    it("denies when attribute_match in condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "attr-in",
        conditions: [{ type: "attribute_match", field: "tier", operator: "in", value: ["gold", "platinum"] }],
      }));
      expect(e.evaluate(req({ context: { tier: "silver" } })).allowed).toBe(false);
      expect(e.evaluate(req({ context: { tier: "gold" } })).allowed).toBe(true);
    });

    it("denies when attribute_match contains condition does not match", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "attr-contains",
        conditions: [{ type: "attribute_match", field: "label", operator: "contains", value: "prod" }],
      }));
      expect(e.evaluate(req({ context: { label: "staging-only" } })).allowed).toBe(false);
      expect(e.evaluate(req({ context: { label: "prod-cluster-1" } })).allowed).toBe(true);
    });

    it("denies when attribute_match field is missing from the request entirely", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "attr-missing",
        conditions: [{ type: "attribute_match", field: "region", operator: "eq", value: "EU" }],
      }));
      expect(e.evaluate(req()).allowed).toBe(false);
    });

    it("time_window 'in' allows when current hour is inside the window and denies when outside", () => {
      const e = new CovenantPolicyEngine();
      const hour = new Date().getHours();
      e.register(policy({
        id: "tw-in-window",
        conditions: [{ type: "time_window", operator: "in", value: { start: hour, end: hour } }],
      }));
      expect(e.evaluate(req()).allowed).toBe(true);

      const e2 = new CovenantPolicyEngine();
      // Construct a window guaranteed not to contain the current hour.
      const outsideStart = (hour + 2) % 24;
      const outsideEnd = (hour + 3) % 24;
      // Only assert deny if the wrapped window doesn't accidentally include `hour`.
      if (outsideStart <= outsideEnd && !(hour >= outsideStart && hour <= outsideEnd)) {
        e2.register(policy({
          id: "tw-out-window",
          conditions: [{ type: "time_window", operator: "in", value: { start: outsideStart, end: outsideEnd } }],
        }));
        expect(e2.evaluate(req()).allowed).toBe(false);
      }
    });

    it("time_window with a non-'in' operator currently passes through (documents current behavior)", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "tw-eq",
        conditions: [{ type: "time_window", operator: "eq", value: { start: 0, end: 23 } }],
      }));
      // Current implementation returns true for unsupported operators on time_window.
      expect(e.evaluate(req()).allowed).toBe(true);
    });

    it("ip_range condition is currently a no-op (documents current behavior)", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "ip",
        conditions: [{ type: "ip_range", operator: "eq", value: "10.0.0.0/8" }],
      }));
      // The engine has no ip_range branch yet — the default arm returns true,
      // so this condition does not currently block any request. Pinning the
      // behavior so a future implementation has a failing test to update.
      expect(e.evaluate(req()).allowed).toBe(true);
    });

    it("falls through ANY-of-multiple condition deny: all must pass", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "multi",
        conditions: [
          { type: "domain_match", operator: "eq", value: "vessels" },
          { type: "attribute_match", field: "clearance", operator: "eq", value: "ts" },
        ],
      }));
      // domain ok, attribute missing → deny
      expect(e.evaluate(req()).allowed).toBe(false);
      // both ok → allow
      expect(e.evaluate(req({ context: { clearance: "ts" } })).allowed).toBe(true);
    });
  });

  describe("deny paths — high-risk action override", () => {
    const HIGH_RISK = [
      "deploy",
      "delete_tenant",
      "export_all",
      "modify_policy",
      "escalate_privilege",
      "bypass_sandbox",
      "force_approve",
      "purge_data",
      "external_transfer",
      "modify_audit_log",
    ];

    for (const actionName of HIGH_RISK) {
      it(`denies '${actionName}' when subject lacks approver/admin role even if a policy allows`, () => {
        const e = new CovenantPolicyEngine();
        e.register(policy({
          id: "broad-execute",
          roles: ["operator"],
          permissions: ["execute"],
        }));
        const d = e.evaluate(req({
          subject: { roles: ["operator"] },
          action: "execute",
          context: { actionName },
        }));
        expect(d.allowed).toBe(false);
        expect(d.deniedBy).toBe("covenant:high-risk-action-guard");
        expect(d.reason).toMatch(/high-risk/i);
      });
    }

    it("permits high-risk actions for tenant_admin", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "tenant-execute",
        roles: ["tenant_admin"],
        permissions: ["execute"],
      }));
      const d = e.evaluate(req({
        subject: { roles: ["tenant_admin"] },
        action: "execute",
        context: { actionName: "purge_data" },
      }));
      expect(d.allowed).toBe(true);
    });

    it("permits high-risk actions for super_admin", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "super-execute",
        roles: ["super_admin"],
        permissions: ["execute"],
      }));
      const d = e.evaluate(req({
        subject: { roles: ["super_admin"] },
        action: "execute",
        context: { actionName: "modify_audit_log" },
      }));
      expect(d.allowed).toBe(true);
    });

    it("does not gate non-high-risk actions", () => {
      const e = new CovenantPolicyEngine();
      e.register(policy({
        id: "ops-execute",
        roles: ["operator"],
        permissions: ["execute"],
      }));
      const d = e.evaluate(req({
        subject: { roles: ["operator"] },
        action: "execute",
        context: { actionName: "rotate_dashboard" },
      }));
      expect(d.allowed).toBe(true);
    });

    it("does not invoke the high-risk guard if the underlying decision is already deny", () => {
      const e = new CovenantPolicyEngine();
      // No matching policy → default deny; guard should not overwrite deniedBy.
      const d = e.evaluate(req({
        subject: { roles: ["operator"] },
        action: "execute",
        context: { actionName: "deploy" },
      }));
      expect(d.allowed).toBe(false);
      expect(d.deniedBy).toBeNull();
      expect(d.reason).toMatch(/default deny/i);
    });
  });

  describe("maritime-critical-response-v2 — real production policy", () => {
    const MARITIME_RESPONSE_POLICY: CovenantPolicy = {
      id: "maritime-critical-response-v2",
      name: "Maritime Critical Response Protocol",
      description: "Governs emergency response actions for maritime threats involving cross-domain signals",
      version: "2.0.0",
      roles: ["super_admin", "admin", "exec", "ops", "compliance"],
      domains: ["aegis", "vessels", "global"],
      permissions: ["execute", "approve"],
      conditions: [],
      effect: "allow",
      priority: 100,
    };

    function maritimeReq(overrides: Partial<CovenantRequest> = {}): CovenantRequest {
      return {
        subject: { roles: ["exec", "ops"], userId: "operator-1", tenantId: "szl" },
        resource: { type: "incident_response", domain: "vessels", actionClass: "critical_response" },
        action: "execute",
        ...overrides,
      };
    }

    it("ALLOWs when subject has exec+ops roles on a vessels incident", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq());
      expect(d.allowed).toBe(true);
      expect(d.matchedPolicies).toContain("maritime-critical-response-v2");
    });

    it("DENIES when roles are stripped to a non-privileged set (e.g., analyst only)", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq({ subject: { roles: ["analyst"] } }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
      expect(d.reason).toMatch(/default deny/i);
    });

    it("DENIES when roles are stripped entirely (empty subject roles)", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq({ subject: { roles: [] } }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });

    it("the production maritime policy is intentionally cross-domain via 'global' — counsel resources still match", () => {
      // Documents the current behavior: because the policy lists "global" alongside aegis/vessels,
      // domain filtering does NOT block other domains. Domain isolation must therefore come from
      // either role gating or explicit conditions, not from the domains array.
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq({
        resource: { type: "case", domain: "counsel", actionClass: "critical_response" },
      }));
      expect(d.allowed).toBe(true);
      expect(d.matchedPolicies).toContain("maritime-critical-response-v2");
    });

    it("DENIES on resource domain when 'global' is removed from the policy", () => {
      const e = new CovenantPolicyEngine();
      e.register({ ...MARITIME_RESPONSE_POLICY, domains: ["aegis", "vessels"] });
      const d = e.evaluate(maritimeReq({
        resource: { type: "case", domain: "counsel", actionClass: "critical_response" },
      }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });

    it("DENIES when the requested action is outside the permitted set", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq({ action: "admin" }));
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });

    it("DENIES once the policy has expired even with the right roles", () => {
      const e = new CovenantPolicyEngine();
      e.register({ ...MARITIME_RESPONSE_POLICY, expiresAt: Date.now() - 1000 });
      const d = e.evaluate(maritimeReq());
      expect(d.allowed).toBe(false);
      expect(d.matchedPolicies).toEqual([]);
    });

    it("DENIES a high-risk action (purge_data) for ops-only subject despite the broad allow", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const d = e.evaluate(maritimeReq({
        subject: { roles: ["ops"] },
        context: { actionName: "purge_data" },
      }));
      expect(d.allowed).toBe(false);
      expect(d.deniedBy).toBe("covenant:high-risk-action-guard");
    });

    it("simulate() on a stripped-role maritime request yields a DENY explanation", () => {
      const e = new CovenantPolicyEngine();
      e.register(MARITIME_RESPONSE_POLICY);
      const { decision, explanation } = e.simulate(maritimeReq({ subject: { roles: ["analyst"] } }));
      expect(decision.allowed).toBe(false);
      expect(explanation.some(l => l.includes("DENY"))).toBe(true);
      expect(explanation.some(l => l.toLowerCase().includes("no policies matched"))).toBe(true);
    });
  });
});
