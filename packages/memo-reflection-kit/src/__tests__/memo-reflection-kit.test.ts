import { describe, it, expect } from "vitest";
import {
  admitExecutive,
  type AdmissionPolicy,
  type ExecutiveProtocolEnvelope,
  checkGroundingParity,
  probeRunContradiction,
} from "../executive-protocol.js";
import { probeStage2Contradiction } from "../contradiction-probe.js";
import {
  canonicalJson,
  computeReceiptRef,
  isMemoReceiptClass,
} from "../receipts.js";
import {
  findCanaryLeaks,
  findCanaryLeaksInReceipt,
  assertReflectionHashFormat,
  type ReflectionEnvelope,
} from "../reflection.js";
import {
  decideContradictionResponse,
  composeExecutiveRun,
} from "../executive-protocol.js";

const POLICY: AdmissionPolicy = {
  maxStageBudget: 64,
  minStageBudget: 1,
  minAgreementFloor: 0.2,
  permittedExecutiveModels: ["claude-opus-4-7"],
  permittedMemoryModelRefs: ["memo:qwen2.5-14b@deadbeef"],
};

function envelope(
  overrides: Partial<ExecutiveProtocolEnvelope> = {},
): ExecutiveProtocolEnvelope {
  return {
    envelopeId: "env-1",
    executiveModel: "claude-opus-4-7",
    memoryModelRef: "memo:qwen2.5-14b@deadbeef",
    userQueryHash:
      "0".repeat(64),
    stage1Budget: 8,
    stage2Budget: 16,
    stage3Budget: 8,
    stage1Temperature: 0.3,
    stage2Temperature: 0.5,
    stage3Temperature: 0.2,
    minStage1Stage2Agreement: 0.5,
    requireGroundingParity: false,
    issuedAt: "2026-05-27T00:00:00Z",
    freshnessNonce: "nonce-1",
    ...overrides,
  };
}

describe("admitExecutive", () => {
  it("admits a well-formed envelope", () => {
    const r = admitExecutive({
      proposed: envelope(),
      policy: POLICY,
      tenant: "szl-holdings",
    });
    expect(r.ok).toBe(true);
  });

  it("rejects an out-of-roster executive model", () => {
    const r = admitExecutive({
      proposed: envelope({ executiveModel: "gpt-4-rogue" }),
      policy: POLICY,
      tenant: "szl-holdings",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.rejected.violatedRule).toBe("executive-model-not-permitted");
    }
  });

  it("rejects a stage budget above policy ceiling", () => {
    const r = admitExecutive({
      proposed: envelope({ stage2Budget: 9999 }),
      policy: POLICY,
      tenant: "szl-holdings",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.rejected.violatedRule).toBe("stage-budget-non-positive");
    }
  });

  it("rejects an out-of-range temperature", () => {
    const r = admitExecutive({
      proposed: envelope({ stage1Temperature: 3 }),
      policy: POLICY,
      tenant: "szl-holdings",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects min-agreement below policy floor", () => {
    const r = admitExecutive({
      proposed: envelope({ minStage1Stage2Agreement: 0.05 }),
      policy: POLICY,
      tenant: "szl-holdings",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.rejected.violatedRule).toBe("min-agreement-out-of-range");
    }
  });
});

describe("probeStage2Contradiction", () => {
  it("returns agreement=1 when both keysets are empty", () => {
    const p = probeStage2Contradiction({
      stage1FactRefs: [],
      stage2FactRefs: [],
      minAgreement: 0.5,
    });
    expect(p.agreement).toBe(1);
    expect(p.violated).toBe(false);
  });

  it("detects a Stage-2-only fact-set as violation", () => {
    const p = probeStage2Contradiction({
      stage1FactRefs: ["a", "b"],
      stage2FactRefs: ["c", "d"],
      minAgreement: 0.5,
    });
    expect(p.agreement).toBe(0);
    expect(p.violated).toBe(true);
    expect(p.stage1Only).toEqual(["a", "b"]);
    expect(p.stage2Only).toEqual(["c", "d"]);
  });

  it("computes Jaccard correctly on partial overlap", () => {
    const p = probeStage2Contradiction({
      stage1FactRefs: ["a", "b", "c"],
      stage2FactRefs: ["b", "c", "d"],
      minAgreement: 0.4,
    });
    expect(p.agreement).toBeCloseTo(2 / 4, 6);
    expect(p.violated).toBe(false);
  });
});

describe("probeRunContradiction", () => {
  it("threads the envelope threshold through to the probe", () => {
    const env = envelope({ minStage1Stage2Agreement: 0.9 });
    const v = probeRunContradiction(
      env,
      {
        subQueries: [],
        surfacedFactRefs: ["a", "b"],
        totalMemoryTokensOut: 0,
        totalWallMs: 0,
      },
      {
        converged: true,
        eStar: "Linda",
        iterations: 3,
        budgetUsed: 6,
        candidateSupportingFactRefs: ["b", "c"],
      },
    );
    expect(v.violated).toBe(true);
  });
});

describe("checkGroundingParity", () => {
  it("satisfies parity when each fact appears in two sub-queries", () => {
    const r = checkGroundingParity({
      subQueries: [
        {
          subQueryHash: "h1",
          citedReflectionRefs: ["fA", "fB"],
          memoryTokensOut: 10,
          wallMs: 50,
        },
        {
          subQueryHash: "h2",
          citedReflectionRefs: ["fA", "fB"],
          memoryTokensOut: 10,
          wallMs: 50,
        },
      ],
      surfacedFactRefs: ["fA", "fB"],
      totalMemoryTokensOut: 20,
      totalWallMs: 100,
    });
    expect(r.satisfied).toBe(true);
  });

  it("flags parity violation when a fact appears in only one sub-query", () => {
    const r = checkGroundingParity({
      subQueries: [
        {
          subQueryHash: "h1",
          citedReflectionRefs: ["fA"],
          memoryTokensOut: 10,
          wallMs: 50,
        },
      ],
      surfacedFactRefs: ["fA"],
      totalMemoryTokensOut: 10,
      totalWallMs: 50,
    });
    expect(r.satisfied).toBe(false);
  });
});

describe("findCanaryLeaks — perception-loop privacy invariant", () => {
  it("returns empty when the snippet has no canary substring", () => {
    expect(
      findCanaryLeaks("Linda is Earl's wife and caregiver.", [
        "CANARY-XYZ-1979",
      ]),
    ).toEqual([]);
  });

  it("reports canaries that leaked into a snippet (and fails the test)", () => {
    expect(
      findCanaryLeaks(
        "raw chunk fragment CANARY-XYZ-1979 leaked through",
        ["CANARY-XYZ-1979"],
      ),
    ).toEqual(["CANARY-XYZ-1979"]);
  });
});

describe("canonicalJson", () => {
  it("sorts object keys deterministically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("recurses into nested objects and arrays", () => {
    expect(canonicalJson({ z: [{ b: 1, a: 2 }, 3] })).toBe(
      '{"z":[{"a":2,"b":1},3]}',
    );
  });
});

describe("computeReceiptRef", () => {
  it("produces a class:hash16 ref that changes when the body changes", async () => {
    const a = await computeReceiptRef({
      receiptClass: "memo.executive.run.v1",
      freshnessNonce: "n1",
      issuedAt: "2026-05-27T00:00:00Z",
      parentRef: null,
      tenant: "t",
    } as never);
    const b = await computeReceiptRef({
      receiptClass: "memo.executive.run.v1",
      freshnessNonce: "n2", // mutate one field
      issuedAt: "2026-05-27T00:00:00Z",
      parentRef: null,
      tenant: "t",
    } as never);
    expect(a).toMatch(/^memo\.executive\.run\.v1:[0-9a-f]{16}$/);
    expect(a).not.toBe(b);
  });
});

describe("isMemoReceiptClass", () => {
  it("accepts known classes and rejects unknown", () => {
    expect(isMemoReceiptClass("memo.executive.run.v1")).toBe(true);
    expect(isMemoReceiptClass("memo.bogus.v1")).toBe(false);
  });
});

describe("canonicalJson — non-finite guard", () => {
  it("throws on NaN to prevent semantic hash collisions with null", () => {
    expect(() => canonicalJson({ x: NaN })).toThrow(/non-finite/);
  });
  it("throws on Infinity for the same reason", () => {
    expect(() => canonicalJson({ x: Infinity })).toThrow(/non-finite/);
  });
});

describe("assertReflectionHashFormat — privacy invariant gatekeeper", () => {
  const HEX = "a".repeat(64);
  function refl(overrides: Partial<ReflectionEnvelope> = {}): ReflectionEnvelope {
    return {
      reflectionId: "r1",
      reflectionClass: "fact-extract",
      corpusRef: HEX,
      spanHash: HEX,
      generatorModel: "qwen2.5-32b-instruct",
      temperature: 0.2,
      snippet: "Linda is Earl's wife.",
      tokensIn: 100,
      tokensOut: 20,
      wallMs: 500,
      ...overrides,
    };
  }
  it("accepts a well-formed sha-256 corpusRef + spanHash pair", () => {
    expect(() => assertReflectionHashFormat(refl())).not.toThrow();
  });
  it("refuses raw-byte smuggling via corpusRef", () => {
    expect(() =>
      assertReflectionHashFormat(refl({ corpusRef: "raw-corpus-bytes-here" })),
    ).toThrow(/corpusRef/);
  });
  it("refuses raw-byte smuggling via spanHash", () => {
    expect(() =>
      assertReflectionHashFormat(refl({ spanHash: "raw-span-bytes-here" })),
    ).toThrow(/spanHash/);
  });
});

describe("findCanaryLeaksInReceipt — end-to-end privacy scan", () => {
  it("catches a canary leaked through any string field, not just snippet", async () => {
    const CANARY = "CANARY-XYZ-1979";
    const leakedReceipt = {
      receiptClass: "memo.reflection.v1",
      freshnessNonce: "n",
      issuedAt: "2026-05-27T00:00:00Z",
      parentRef: null,
      tenant: "t",
      envelope: {
        reflectionId: "r1",
        reflectionClass: "fact-extract",
        corpusRef: "a".repeat(64),
        spanHash: "b".repeat(64),
        generatorModel: `qwen-leak-${CANARY}`, // <-- leak via non-snippet field
        temperature: 0.2,
        snippet: "harmless",
        tokensIn: 1,
        tokensOut: 1,
        wallMs: 1,
      },
    };
    const leaks = await findCanaryLeaksInReceipt(leakedReceipt, [CANARY]);
    expect(leaks).toEqual([CANARY]);
  });

  it("returns empty when the canary is absent from every field", async () => {
    const leaks = await findCanaryLeaksInReceipt(
      { receiptClass: "memo.reflection.v1", x: "clean" },
      ["CANARY-XYZ-1979"],
    );
    expect(leaks).toEqual([]);
  });
});

describe("decideContradictionResponse — mandatory pairing", () => {
  const env = envelope({ minStage1Stage2Agreement: 0.5 });
  it("returns null when the probe is not violated", () => {
    const r = decideContradictionResponse(
      env,
      {
        agreement: 0.9,
        violated: false,
        stage1Only: [],
        stage2Only: [],
        intersection: ["a"],
      },
      {
        tenant: "t",
        stage2ReceiptRef: "memo.entity.identification.v1:deadbeefdeadbeef",
        reRunStage2BudgetTokens: 32,
      },
    );
    expect(r).toBeNull();
  });

  it("returns BOTH receipts on violation with re-run budget", () => {
    const r = decideContradictionResponse(
      env,
      {
        agreement: 0.1,
        violated: true,
        stage1Only: ["a"],
        stage2Only: ["b"],
        intersection: [],
      },
      {
        tenant: "t",
        stage2ReceiptRef: "memo.entity.identification.v1:deadbeefdeadbeef",
        reRunStage2BudgetTokens: 32,
      },
    );
    expect(r).not.toBeNull();
    expect(r!.contradiction.receiptClass).toBe("memo.contradiction.v1");
    expect(r!.escalated.receiptClass).toBe("memo.escalated.v1");
    expect(r!.escalated.response).toBe("re-run-stage-2");
    expect(r!.escalated.newBudget).toBe(32);
    expect(r!.contradiction.parentRef).toBe(
      "memo.entity.identification.v1:deadbeefdeadbeef",
    );
  });

  const REFS = {
    envelope: "memo.executive.admitted.v1:aaaaaaaaaaaaaaaa",
    stage1: "memo.grounding.v1:bbbbbbbbbbbbbbbb",
    stage2: "memo.entity.identification.v1:cccccccccccccccc",
    stage3: "memo.answer.synthesis.v1:dddddddddddddddd",
    contradiction: "memo.contradiction.v1:1111111111111111",
    escalated: "memo.escalated.v1:2222222222222222",
  };

  it("composeExecutiveRun REFUSES to seal a run that swallowed a violation", () => {
    expect(() =>
      composeExecutiveRun({
        tenant: "t",
        envelopeRef: REFS.envelope,
        stage1Ref: REFS.stage1,
        stage2Ref: REFS.stage2,
        stage3Ref: REFS.stage3,
        probe: {
          agreement: 0.1,
          violated: true,
          stage1Only: ["a"],
          stage2Only: ["b"],
          intersection: [],
        },
        contradictionRef: null, // <-- silently swallowed violation
        escalatedRef: null,
        groundingParityViolatedRef: null,
        finalAnswerHash: "e".repeat(64),
      }),
    ).toThrow(/swallowed a probe violation/);
  });

  it("composeExecutiveRun REFUSES a run with mirror-mismatch (clean probe + ref)", () => {
    expect(() =>
      composeExecutiveRun({
        tenant: "t",
        envelopeRef: REFS.envelope,
        stage1Ref: REFS.stage1,
        stage2Ref: REFS.stage2,
        stage3Ref: REFS.stage3,
        probe: {
          agreement: 0.9,
          violated: false,
          stage1Only: [],
          stage2Only: [],
          intersection: ["a"],
        },
        contradictionRef: REFS.contradiction,
        escalatedRef: REFS.escalated,
        groundingParityViolatedRef: null,
        finalAnswerHash: "e".repeat(64),
      }),
    ).toThrow(/mirror the probe outcome/);
  });

  it("composeExecutiveRun seals a clean run (no probe) without escalation", () => {
    const run = composeExecutiveRun({
      tenant: "t",
      envelopeRef: REFS.envelope,
      stage1Ref: REFS.stage1,
      stage2Ref: REFS.stage2,
      stage3Ref: REFS.stage3,
      probe: null,
      contradictionRef: null,
      escalatedRef: null,
      groundingParityViolatedRef: null,
      finalAnswerHash: "e".repeat(64),
    });
    expect(run.receiptClass).toBe("memo.executive.run.v1");
    expect(run.contradictionRef).toBeNull();
    expect(run.escalatedRef).toBeNull();
  });

  it("composeExecutiveRun seals a violated run with REAL content-addressed refs (no synthesis)", () => {
    const run = composeExecutiveRun({
      tenant: "t",
      envelopeRef: REFS.envelope,
      stage1Ref: REFS.stage1,
      stage2Ref: REFS.stage2,
      stage3Ref: REFS.stage3,
      probe: {
        agreement: 0.1,
        violated: true,
        stage1Only: ["a"],
        stage2Only: ["b"],
        intersection: [],
      },
      contradictionRef: REFS.contradiction,
      escalatedRef: REFS.escalated,
      groundingParityViolatedRef: null,
      finalAnswerHash: "e".repeat(64),
    });
    expect(run.contradictionRef).toBe(REFS.contradiction);
    expect(run.escalatedRef).toBe(REFS.escalated);
    expect(run.envelopeRef).toBe(REFS.envelope);
  });

  it("composeExecutiveRun seals a Stage-2-skipped run (stage2Ref:null)", () => {
    const run = composeExecutiveRun({
      tenant: "t",
      envelopeRef: REFS.envelope,
      stage1Ref: REFS.stage1,
      stage2Ref: null,
      stage3Ref: REFS.stage3,
      probe: null,
      contradictionRef: null,
      escalatedRef: null,
      groundingParityViolatedRef: null,
      finalAnswerHash: "e".repeat(64),
    });
    expect(run.stage2Ref).toBeNull();
  });

  it("falls back to grounding-only when no re-run budget is supplied", () => {
    const r = decideContradictionResponse(
      env,
      {
        agreement: 0.1,
        violated: true,
        stage1Only: ["a"],
        stage2Only: ["b"],
        intersection: [],
      },
      {
        tenant: "t",
        stage2ReceiptRef: "memo.entity.identification.v1:deadbeefdeadbeef",
        reRunStage2BudgetTokens: null,
      },
    );
    expect(r).not.toBeNull();
    expect(r!.escalated.response).toBe("fallback-to-grounding-only");
    expect(r!.escalated.newBudget).toBeNull();
  });
});
