import { describe, it, expect } from "vitest";
import {
  verify,
  deriveAxes,
  fluxionsReceiptHolds,
  discriminantForOperators,
  OPERATIONAL_WORKCELLS,
  WORKCELL_SOURCE,
  WORKCELL_MAP,
  TOOL_MAP,
  OPERATOR_MAP,
} from "../src/index.js";
import type {
  Workcell,
  ActionBrief,
  MirrorEvalScore,
  ProposedAction,
} from "../src/types/index.js";
import { SAMPLE_WORKCELLS } from "./fixtures/sample-workcells.js";

// ---- helpers --------------------------------------------------------------

function cloneWorkcell(w: Workcell): Workcell {
  return JSON.parse(JSON.stringify(w)) as Workcell;
}

function withMirror(w: Workcell, override: Partial<MirrorEvalScore>): Workcell {
  const c = cloneWorkcell(w);
  if (!c.actionBrief) return c;
  c.actionBrief = {
    ...c.actionBrief,
    mirrorEval: { ...c.actionBrief.mirrorEval, ...override },
  };
  return c;
}

function pickAccepted(): Workcell {
  // Find a SAMPLE workcell whose default mirror-eval passes Lambda-gate and has a brief.
  for (const w of SAMPLE_WORKCELLS) {
    if (!w.actionBrief) continue;
    const out = verify({ workcell: w, witnessThreshold: 0 }); // disable witness for picking
    if (out.receipt.verdict === "ACCEPTED" || out.receipt.verdict === "REFUSED_WITNESS_DIVERSITY") {
      return w;
    }
  }
  throw new Error("no admissible SAMPLE workcell found");
}

// ---- registry sanity ------------------------------------------------------

describe("a11oy operational registry - fail closed", () => {
  it("exposes no records when an operational source is unavailable", () => {
    expect(WORKCELL_SOURCE.state).toBe("UNAVAILABLE");
    expect(WORKCELL_SOURCE.source).toBeNull();
    expect(WORKCELL_SOURCE.observedAt).toBeNull();
    expect(OPERATIONAL_WORKCELLS).toHaveLength(0);
    expect(WORKCELL_MAP).toEqual({});
  });
});

describe("a11oy SAMPLE registry - sanity", () => {
  it("SAMPLE_WORKCELLS contains at least one workcell with an actionBrief", () => {
    const withBrief = SAMPLE_WORKCELLS.filter((w) => w.actionBrief !== null);
    expect(withBrief.length).toBeGreaterThan(0);
  });

  it("every operator referenced by every workcell is in OPERATOR_MAP", () => {
    for (const w of SAMPLE_WORKCELLS) {
      for (const opId of w.operatorSequence) {
        expect(OPERATOR_MAP[opId], `op ${opId} from workcell ${w.id}`).toBeDefined();
      }
    }
  });

  it("every tool referenced by every proposedAction is in TOOL_MAP", () => {
    for (const w of SAMPLE_WORKCELLS) {
      if (!w.actionBrief) continue;
      for (const a of w.actionBrief.proposedActions) {
        expect(TOOL_MAP[a.tool], `tool ${a.tool} from workcell ${w.id}`).toBeDefined();
      }
    }
  });
});

// ---- core verify ----------------------------------------------------------

describe("a11oy.verify — spine integration", () => {
  it("ACCEPTS a clean SAMPLE workcell with strong mirror-eval", () => {
    const w = withMirror(pickAccepted(), {
      groundedness: 0.95,
      evidenceCoverage: 0.95,
      policyCompliance: 0.98,
      verificationReadiness: 0.95,
      actionSpecificity: 0.95,
      businessImpactClarity: 0.92,
      approvalCorrectness: 0.99,
      staleContextRisk: 0.05,
      hallucinationRisk: 0.04,
    });
    const out = verify({ workcell: w, witnessThreshold: 0 });
    expect(out.receipt.verdict).toBe("ACCEPTED");
    expect(out.signal.kind).toBe("admit");
    expect(out.receipt.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(out.lutar.invariant).toBeGreaterThan(0.5);
  });

  it("REFUSES at Λ-gate when mirror-eval is poor", () => {
    const w = withMirror(pickAccepted(), {
      groundedness: 0.05,
      evidenceCoverage: 0.05,
      policyCompliance: 0.05,
      verificationReadiness: 0.05,
      actionSpecificity: 0.05,
      businessImpactClarity: 0.05,
      approvalCorrectness: 0.05,
      staleContextRisk: 0.95,
      hallucinationRisk: 0.95,
    });
    const out = verify({ workcell: w, witnessThreshold: 0 });
    expect(out.receipt.verdict).toBe("REFUSED_LAMBDA_GATE");
    expect(out.signal.kind).toBe("refuse");
  });

  it("REFUSES on fluxions bare-claim: unknown tool in proposedActions", () => {
    const w = cloneWorkcell(pickAccepted());
    const brief = w.actionBrief as ActionBrief;
    const bogus: ProposedAction = {
      id: "bogus-1",
      tool: "tool_that_does_not_exist",
      description: "ghost tool",
      riskLevel: "low",
      requiresApproval: false,
      expectedOutcome: "n/a",
    };
    brief.proposedActions = [...brief.proposedActions, bogus];
    const out = verify({ workcell: w, witnessThreshold: 0 });
    expect(out.receipt.verdict).toBe("REFUSED_FLUXIONS_BARE_CLAIM");
  });

  it("REFUSES on fluxions bare-claim: high-risk tool without requiresApproval", () => {
    const w = cloneWorkcell(pickAccepted());
    const brief = w.actionBrief as ActionBrief;
    // Find a high/critical-risk tool from registry
    const critical = Object.values(TOOL_MAP).find(
      (t) => t.risk === "high" || t.risk === "critical",
    );
    if (!critical) throw new Error("registry lacks high-risk tool — fixture broken");
    brief.proposedActions = [
      {
        id: "claim-down-1",
        tool: critical.id,
        description: "bare claim on critical tool",
        riskLevel: "low", // claim-down
        requiresApproval: false, // no approval
        expectedOutcome: "should be refused",
      },
    ];
    const out = verify({ workcell: w, witnessThreshold: 0 });
    expect(out.receipt.verdict).toBe("REFUSED_FLUXIONS_BARE_CLAIM");
  });

  it("REFUSES at witness-diversity gate when threshold is set very high", () => {
    const w = withMirror(pickAccepted(), {
      groundedness: 0.95,
      evidenceCoverage: 0.95,
      policyCompliance: 0.98,
      verificationReadiness: 0.95,
      actionSpecificity: 0.95,
      businessImpactClarity: 0.92,
      approvalCorrectness: 0.99,
      staleContextRisk: 0.05,
      hallucinationRisk: 0.04,
    });
    const out = verify({ workcell: w, witnessThreshold: 1.5 }); // unreachable
    expect(out.receipt.verdict).toBe("REFUSED_WITNESS_DIVERSITY");
    expect(out.receipt.witnessDiversity?.admitted).toBe(false);
  });

  it("identical inputs yield identical receipt digests (deterministic)", () => {
    const w = pickAccepted();
    const a = verify({ workcell: w, witnessThreshold: 0 });
    const b = verify({ workcell: w, witnessThreshold: 0 });
    expect(a.receipt.receiptDigest).toBe(b.receipt.receiptDigest);
  });

  it("Λ₉ bound holds for every accepted receipt", () => {
    const w = withMirror(pickAccepted(), {
      groundedness: 0.95,
      evidenceCoverage: 0.95,
      policyCompliance: 0.95,
      verificationReadiness: 0.95,
      actionSpecificity: 0.95,
      businessImpactClarity: 0.95,
      approvalCorrectness: 0.95,
      staleContextRisk: 0.05,
      hallucinationRisk: 0.05,
    });
    const out = verify({ workcell: w, witnessThreshold: 0 });
    expect(out.receipt.verdict).toBe("ACCEPTED");
    expect(out.lutar.invariant).toBeGreaterThanOrEqual(out.lutar.bound.lower);
    expect(out.lutar.invariant).toBeLessThanOrEqual(out.lutar.bound.upper);
  });

  it("works on workcells without an actionBrief (early-stage planning)", () => {
    const intake = SAMPLE_WORKCELLS.find(
      (w) => w.actionBrief === null && w.operatorSequence.length > 0,
    );
    if (!intake) {
      // construct one
      const base = cloneWorkcell(SAMPLE_WORKCELLS[0] as Workcell);
      base.actionBrief = null;
      base.status = "intake";
      const out = verify({ workcell: base, witnessThreshold: 0 });
      // fallback axes from operator trust ⇒ should ACCEPT (operators all ≥ 0.85 overall)
      expect(["ACCEPTED", "REFUSED_LAMBDA_GATE"]).toContain(out.receipt.verdict);
      return;
    }
    const out = verify({ workcell: intake, witnessThreshold: 0 });
    expect(["ACCEPTED", "REFUSED_LAMBDA_GATE"]).toContain(out.receipt.verdict);
  });
});

// ---- deriveAxes -----------------------------------------------------------

describe("a11oy.deriveAxes — Λ₉ derivation", () => {
  it("all 9 axes are in [0,1]", () => {
    for (const w of SAMPLE_WORKCELLS) {
      const axes = deriveAxes(w);
      for (const [k, v] of Object.entries(axes)) {
        expect(v, `axis ${k} on workcell ${w.id}`).toBeGreaterThanOrEqual(0);
        expect(v, `axis ${k} on workcell ${w.id}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("staleContextRisk=0, hallucinationRisk=0 ⇒ cleanliness=1, measurabilityHonesty=1", () => {
    const w = withMirror(pickAccepted(), { staleContextRisk: 0, hallucinationRisk: 0 });
    const axes = deriveAxes(w);
    expect(axes.cleanliness).toBe(1);
    expect(axes.measurabilityHonesty).toBe(1);
  });
});

// ---- fluxionsReceiptHolds -------------------------------------------------

describe("a11oy.fluxionsReceiptHolds — tool-risk consistency", () => {
  it("vacuously true when no actionBrief is present", () => {
    const w = cloneWorkcell(SAMPLE_WORKCELLS[0] as Workcell);
    w.actionBrief = null;
    expect(fluxionsReceiptHolds(w)).toBe(true);
  });

  it("true for the unmodified SAMPLE workcells (fixture is self-consistent)", () => {
    for (const w of SAMPLE_WORKCELLS) {
      // SAMPLE data should be coherent - every proposed action's tool exists.
      const holds = fluxionsReceiptHolds(w);
      if (!holds) {
        // surface which workcell is broken for diagnosis
        throw new Error(`SAMPLE workcell ${w.id} fails fluxionsReceipt`);
      }
      expect(holds).toBe(true);
    }
  });

  it("false when an action claims lower risk than the registered tool", () => {
    const w = cloneWorkcell(pickAccepted());
    const brief = w.actionBrief as ActionBrief;
    const high = Object.values(TOOL_MAP).find((t) => t.risk === "critical" || t.risk === "high");
    if (!high) throw new Error("no high-risk tool in registry");
    brief.proposedActions = [
      {
        id: "x",
        tool: high.id,
        description: "claim-down",
        riskLevel: "read_only",
        requiresApproval: true,
        expectedOutcome: "n/a",
      },
    ];
    expect(fluxionsReceiptHolds(w)).toBe(false);
  });
});

// ---- discriminantForOperators --------------------------------------------

describe("a11oy.discriminantForOperators — Gauss discriminant builder", () => {
  it("returns d < 0 and d ≡ 0 or 1 (mod 4)", () => {
    for (const w of SAMPLE_WORKCELLS) {
      const d = discriminantForOperators(w.operatorSequence);
      expect(d).toBeLessThan(0);
      const mod4 = ((d % 4) + 4) % 4;
      expect([0, 1]).toContain(mod4);
    }
  });

  it("is deterministic for the same operator set", () => {
    const seq = ["planner", "analyst", "risk", "proof"] as const;
    const a = discriminantForOperators([...seq]);
    const b = discriminantForOperators([...seq]);
    expect(a).toBe(b);
  });

  it("is permutation-invariant (depends on the SET of operators)", () => {
    const a = discriminantForOperators(["planner", "analyst", "risk"]);
    const b = discriminantForOperators(["risk", "planner", "analyst"]);
    expect(a).toBe(b);
  });
});

// ---- end-to-end ------------------------------------------------------------

describe("a11oy verify - end-to-end on the SAMPLE registry", () => {
  it("can run on every SAMPLE workcell without throwing", () => {
    for (const w of SAMPLE_WORKCELLS) {
      const out = verify({ workcell: w, witnessThreshold: 0 });
      expect(out.receipt.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof out.classNumberValue).toBe("number");
      expect(out.classNumberValue).toBeGreaterThanOrEqual(1);
    }
  });

});
