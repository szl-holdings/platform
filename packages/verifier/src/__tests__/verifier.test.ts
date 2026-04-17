import { describe, it, expect, beforeEach } from "vitest";
import {
  verify,
  aggregateDecision,
  evidenceSufficiencyCheck,
  citationFidelityCheck,
  unsupportedClaimsCheck,
  hallucinationSignalsCheck,
  internalContradictionCheck,
  policyComplianceCheck,
  domainRuleComplianceCheck,
  actionSafetyCheck,
  outputCompletenessCheck,
  confidenceCalibrationCheck,
  InMemoryVerifierStore,
  VerifierContextSchema,
  type VerifierContext,
  type VerifierOutput,
  type VerifierTarget,
} from "../index.js";
import { registerPolicy, unregisterPolicy } from "@szl-holdings/policy-engine";

const target: VerifierTarget = { targetType: "output", targetId: "o-1" };
const ctx = (overrides: Partial<VerifierContext> = {}): VerifierContext =>
  VerifierContextSchema.parse(overrides);

describe("evidence-sufficiency", () => {
  it("passes when every claim has the required citations", () => {
    const r = evidenceSufficiencyCheck(
      { claims: [{ text: "x", citationIds: ["c1"] }] },
      ctx(),
    );
    expect(r?.outcome).toBe("pass");
  });

  it("fails when claims are undercited and recommends more evidence", () => {
    const r = evidenceSufficiencyCheck(
      {
        claims: [
          { text: "a", citationIds: ["c1"] },
          { text: "b", citationIds: [] },
        ],
      },
      ctx(),
    );
    expect(r?.outcome).toBe("fail");
    expect(r?.recommendedAction).toBe("request_more_evidence");
  });
});

describe("citation-fidelity", () => {
  it("fails on missing referenced citation ids", () => {
    const r = citationFidelityCheck(
      {
        claims: [{ text: "a", citationIds: ["missing"] }],
        citations: [],
      },
      ctx(),
    );
    expect(r?.outcome).toBe("fail");
    expect(r?.recommendedAction).toBe("revise");
  });

  it("warns when references resolve but are not verified", () => {
    const r = citationFidelityCheck(
      {
        claims: [{ text: "a", citationIds: ["c1"] }],
        citations: [{ id: "c1", sourceId: "s1", verified: false }],
      },
      ctx(),
    );
    expect(r?.outcome).toBe("warn");
  });
});

describe("unsupported-claims", () => {
  it("fails on explicitly unsupported claims", () => {
    const r = unsupportedClaimsCheck(
      { claims: [{ text: "a", citationIds: [], supported: false }] },
      ctx(),
    );
    expect(r?.outcome).toBe("fail");
  });
});

describe("hallucination-signals", () => {
  it("fails on hallucination markers in text", () => {
    const r = hallucinationSignalsCheck(
      { text: "[citation needed] - I made that up." },
      ctx(),
    );
    expect(r?.outcome).toBe("fail");
  });

  it("warns when uncited claims exceed maxUncitedClaims", () => {
    const r = hallucinationSignalsCheck(
      { claims: [{ text: "a", citationIds: [] }] },
      ctx({ maxUncitedClaims: 0 }),
    );
    expect(r?.outcome).toBe("warn");
  });
});

describe("internal-contradiction", () => {
  it("fails when both halves of a contradiction pair occur", () => {
    const r = internalContradictionCheck(
      { text: "the system is online but the system is offline" },
      ctx({ contradictionPairs: [["online", "offline"]] }),
    );
    expect(r?.outcome).toBe("fail");
    expect(r?.recommendedAction).toBe("revise");
  });

  it("opts out when no contradiction pairs configured", () => {
    expect(internalContradictionCheck({ text: "anything" }, ctx())).toBeUndefined();
  });
});

describe("policy-compliance", () => {
  beforeEach(() => {
    unregisterPolicy("verifier-test-block");
  });

  it("blocks when policy effect is block", () => {
    registerPolicy({
      id: "verifier-test-block",
      name: "block-test",
      scope: "action",
      actionTypes: ["dangerous"],
      rules: [
        {
          id: "r1",
          name: "deny dangerous",
          conditions: [{ field: "action", operator: "eq", value: "dangerous" }],
          effect: "block",
          reason: "test policy block",
          priority: 100,
        },
      ],
      isActive: true,
      priority: 100,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const r = policyComplianceCheck(
      {},
      ctx({
        policyRequest: {
          action: "dangerous",
          subject: { roles: ["operator"] },
          resource: { type: "any" },
        },
      }),
    );
    expect(r?.outcome).toBe("blocked");
    expect(r?.recommendedAction).toBe("block");
  });

  it("opts out when no policyRequest provided", () => {
    expect(policyComplianceCheck({}, ctx())).toBeUndefined();
  });
});

describe("domain-rule-compliance", () => {
  it("fails when a rule with severity=fail is violated", () => {
    const r = domainRuleComplianceCheck(
      { metadata: { region: "US" } },
      ctx({
        domainRules: [
          { id: "r-region", field: "region", operator: "eq", value: "EU", severity: "fail" },
        ],
      }),
    );
    expect(r?.outcome).toBe("fail");
  });

  it("blocks when a rule with severity=blocked is violated", () => {
    const r = domainRuleComplianceCheck(
      { metadata: { tier: "free" } },
      ctx({
        domainRules: [
          { id: "r-tier", field: "tier", operator: "in", value: ["paid"], severity: "blocked" },
        ],
      }),
    );
    expect(r?.outcome).toBe("blocked");
    expect(r?.recommendedAction).toBe("block");
  });
});

describe("action-safety", () => {
  it("blocks critical irreversible actions", () => {
    const r = actionSafetyCheck(
      { proposedAction: { kind: "drop_db", risk: "critical", reversible: false, blastRadius: "tenant" } },
      ctx(),
    );
    expect(r?.outcome).toBe("blocked");
    expect(r?.recommendedAction).toBe("block");
  });

  it("warns on high-risk irreversible actions", () => {
    const r = actionSafetyCheck(
      { proposedAction: { kind: "delete_record", risk: "high", reversible: false, blastRadius: "self" } },
      ctx(),
    );
    expect(r?.outcome).toBe("warn");
    expect(r?.recommendedAction).toBe("route_to_human_review");
  });

  it("passes safe actions", () => {
    const r = actionSafetyCheck(
      { proposedAction: { kind: "read", risk: "low", reversible: true, blastRadius: "self" } },
      ctx(),
    );
    expect(r?.outcome).toBe("pass");
  });
});

describe("output-completeness", () => {
  it("fails on missing required fields", () => {
    const r = outputCompletenessCheck(
      { requiredFields: ["title", "body"], providedFields: ["title"] },
      ctx(),
    );
    expect(r?.outcome).toBe("fail");
    expect(r?.message).toContain("body");
  });

  it("passes when all required fields present", () => {
    const r = outputCompletenessCheck(
      { requiredFields: ["title"], providedFields: ["title", "extra"] },
      ctx(),
    );
    expect(r?.outcome).toBe("pass");
  });
});

describe("confidence-calibration", () => {
  it("warns on overconfidence beyond tolerance and recommends escalate", () => {
    const r = confidenceCalibrationCheck(
      { confidence: 0.95, historicalAccuracy: 0.5 },
      ctx(),
    );
    expect(r?.outcome).toBe("warn");
    expect(r?.recommendedAction).toBe("escalate");
  });

  it("passes when calibration within tolerance", () => {
    const r = confidenceCalibrationCheck(
      { confidence: 0.7, historicalAccuracy: 0.65 },
      ctx(),
    );
    expect(r?.outcome).toBe("pass");
  });
});

describe("aggregator", () => {
  it("returns block when any check is blocked", () => {
    const a = aggregateDecision([
      { name: "policy", outcome: "blocked", score: 0, recommendedAction: "block" },
      { name: "evidence", outcome: "pass", score: 1 },
    ]);
    expect(a.action).toBe("block");
    expect(a.outcome).toBe("blocked");
  });

  it("picks the most severe non-blocking action across checks", () => {
    const a = aggregateDecision([
      { name: "evidence", outcome: "fail", score: 0.5, recommendedAction: "request_more_evidence" },
      { name: "calib", outcome: "warn", score: 0.7, recommendedAction: "escalate" },
    ]);
    expect(a.action).toBe("escalate");
  });

  it("approves when all pass", () => {
    const a = aggregateDecision([
      { name: "x", outcome: "pass", score: 1 },
      { name: "y", outcome: "pass", score: 1 },
    ]);
    expect(a.action).toBe("approve");
    expect(a.outcome).toBe("pass");
  });
});

describe("verify() end-to-end", () => {
  const out: VerifierOutput = {
    text: "the system is online",
    claims: [
      { text: "uptime is 99.9", citationIds: ["c1"] },
      { text: "cost dropped 20%", citationIds: ["c2"] },
    ],
    citations: [
      { id: "c1", sourceId: "metrics-2026-q1", verified: true },
      { id: "c2", sourceId: "billing-2026-q1", verified: true },
    ],
    confidence: 0.8,
    historicalAccuracy: 0.78,
    requiredFields: ["text"],
    providedFields: ["text"],
  };

  it("approves a clean output", () => {
    const decision = verify(out, target);
    expect(decision.action).toBe("approve");
    expect(decision.outcome).toBe("pass");
    expect(decision.checks.length).toBeGreaterThan(0);
  });

  it("blocks when a critical irreversible action is proposed", () => {
    const decision = verify(
      {
        ...out,
        proposedAction: {
          kind: "wipe_tenant",
          risk: "critical",
          reversible: false,
          blastRadius: "tenant",
        },
      },
      target,
    );
    expect(decision.action).toBe("block");
    expect(decision.outcome).toBe("blocked");
  });

  it("requests more evidence when claims are undercited", () => {
    const decision = verify(
      {
        claims: [
          { text: "a", citationIds: [] },
          { text: "b", citationIds: [] },
        ],
      },
      target,
    );
    // With no citations + uncited claims, evidence-sufficiency fails (needs more
    // evidence) and hallucination-signals warns. The most severe action wins.
    expect(["request_more_evidence", "escalate"]).toContain(decision.action);
  });

  it("respects disabledChecks", () => {
    const decision = verify(out, target, { disabledChecks: ["citation-fidelity"] });
    expect(decision.checks.find((c) => c.name === "citation-fidelity")).toBeUndefined();
  });
});

describe("InMemoryVerifierStore", () => {
  it("saves, lists by target, and returns the latest", async () => {
    const store = new InMemoryVerifierStore();
    const a = verify({ text: "older" }, target);
    a.evaluatedAt = 1000;
    const b = verify({ text: "newer" }, target);
    b.evaluatedAt = 2000;
    await store.save(a);
    await store.save(b);

    const latest = await store.latestForTarget("output", target.targetId);
    expect(latest?.verifierId).toBe(b.verifierId);

    const listed = await store.list({ targetId: target.targetId });
    expect(listed.total).toBe(2);
  });
});
