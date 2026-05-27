// Executive three-stage protocol — typed orchestrator envelope and per-
// stage result shapes. Re-expressed from MeMo's structured multi-turn
// inference pipeline (Grounding → Entity Identification → Answer Seeking
// & Synthesis) against the ROSIE governed-decision-fabric discipline.
//
// The orchestrator never accepts a final answer whose chain does not
// terminate at the user-query hash. Every stage emits a receipt; every
// per-stage receipt's `parentRef` points at the previous stage's ref
// (Stage 1 → executive-admitted; Stage 2 → Stage 1; Stage 3 → Stage 2
// or, on contradiction-escalated grounding-only, Stage 1 again).

import type { MemoReceiptCommon } from "./receipts.js";
import {
  probeStage2Contradiction,
  type ContradictionProbeOutput,
} from "./contradiction-probe.js";

export interface ExecutiveProtocolEnvelope {
  readonly envelopeId: string;
  readonly executiveModel: string;
  /** Hash of the Memory-model handle (weights version + tokeniser hash). */
  readonly memoryModelRef: string;
  /** SHA-256 of the user query string. The raw query never appears. */
  readonly userQueryHash: string;
  readonly stage1Budget: number;
  readonly stage2Budget: number;
  readonly stage3Budget: number;
  readonly stage1Temperature: number;
  readonly stage2Temperature: number;
  readonly stage3Temperature: number;
  /** Stage 1 ↔ Stage 2 contradiction-probe threshold; below ⇒ violated. */
  readonly minStage1Stage2Agreement: number;
  /** Optional KS-18 parity-coverage check on grounding. */
  readonly requireGroundingParity: boolean;
  readonly issuedAt: string;
  readonly freshnessNonce: string;
}

export interface MemoExecutiveAdmittedReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.executive.admitted.v1";
  readonly envelope: ExecutiveProtocolEnvelope;
}

export type ExecutiveRejectionRule =
  | "stage-budget-non-positive"
  | "stage-temperature-out-of-range"
  | "min-agreement-out-of-range"
  | "memory-model-not-permitted"
  | "executive-model-not-permitted";

export interface MemoExecutiveRejectedReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.executive.rejected.v1";
  readonly proposedEnvelope: ExecutiveProtocolEnvelope;
  readonly violatedRule: ExecutiveRejectionRule;
  readonly explanation: string;
}

export interface AdmissionPolicy {
  readonly maxStageBudget: number;
  readonly minStageBudget: number;
  readonly minAgreementFloor: number;
  readonly permittedExecutiveModels: ReadonlyArray<string>;
  readonly permittedMemoryModelRefs: ReadonlyArray<string>;
}

export interface AdmitInput {
  readonly proposed: ExecutiveProtocolEnvelope;
  readonly policy: AdmissionPolicy;
  readonly tenant: string;
}

export type AdmitResult =
  | {
      readonly ok: true;
      readonly admitted: Omit<
        MemoExecutiveAdmittedReceipt,
        "freshnessNonce" | "issuedAt"
      >;
    }
  | {
      readonly ok: false;
      readonly rejected: Omit<
        MemoExecutiveRejectedReceipt,
        "freshnessNonce" | "issuedAt"
      >;
    };

export function admitExecutive(input: AdmitInput): AdmitResult {
  const { proposed, policy, tenant } = input;
  const reject = (
    rule: ExecutiveRejectionRule,
    explanation: string,
  ): AdmitResult => ({
    ok: false,
    rejected: {
      receiptClass: "memo.executive.rejected.v1",
      tenant,
      parentRef: null,
      proposedEnvelope: proposed,
      violatedRule: rule,
      explanation,
    },
  });
  for (const b of [
    proposed.stage1Budget,
    proposed.stage2Budget,
    proposed.stage3Budget,
  ]) {
    if (
      !Number.isFinite(b) ||
      b < policy.minStageBudget ||
      b > policy.maxStageBudget
    ) {
      return reject(
        "stage-budget-non-positive",
        `stage budget ${b} outside [${policy.minStageBudget}, ${policy.maxStageBudget}]`,
      );
    }
  }
  for (const t of [
    proposed.stage1Temperature,
    proposed.stage2Temperature,
    proposed.stage3Temperature,
  ]) {
    if (!Number.isFinite(t) || t < 0 || t > 2) {
      return reject(
        "stage-temperature-out-of-range",
        `stage temperature ${t} outside [0, 2]`,
      );
    }
  }
  if (
    !Number.isFinite(proposed.minStage1Stage2Agreement) ||
    proposed.minStage1Stage2Agreement < policy.minAgreementFloor ||
    proposed.minStage1Stage2Agreement > 1
  ) {
    return reject(
      "min-agreement-out-of-range",
      `minStage1Stage2Agreement ${proposed.minStage1Stage2Agreement} outside [${policy.minAgreementFloor}, 1]`,
    );
  }
  if (!policy.permittedExecutiveModels.includes(proposed.executiveModel)) {
    return reject(
      "executive-model-not-permitted",
      `executive model ${proposed.executiveModel} not in policy roster`,
    );
  }
  if (!policy.permittedMemoryModelRefs.includes(proposed.memoryModelRef)) {
    return reject(
      "memory-model-not-permitted",
      `memory model ref ${proposed.memoryModelRef} not in policy roster`,
    );
  }
  return {
    ok: true,
    admitted: {
      receiptClass: "memo.executive.admitted.v1",
      tenant,
      parentRef: null,
      envelope: proposed,
    },
  };
}

// ---------- per-stage result shapes ----------

export interface GroundingSubQuery {
  /** SHA-256 of the sub-query string. */
  readonly subQueryHash: string;
  /** Reflection-refs cited by the Memory model's grounding response. */
  readonly citedReflectionRefs: ReadonlyArray<string>;
  readonly memoryTokensOut: number;
  readonly wallMs: number;
}

export interface Stage1GroundingResult {
  readonly subQueries: ReadonlyArray<GroundingSubQuery>;
  /** Union of all cited reflection-refs across the K sub-queries. */
  readonly surfacedFactRefs: ReadonlyArray<string>;
  readonly totalMemoryTokensOut: number;
  readonly totalWallMs: number;
}

export interface MemoGroundingReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.grounding.v1";
  readonly result: Stage1GroundingResult;
}

export interface Stage2EntityIdResult {
  readonly converged: boolean;
  readonly eStar: string | null;
  readonly iterations: number;
  readonly budgetUsed: number;
  readonly candidateSupportingFactRefs: ReadonlyArray<string>;
}

export interface MemoEntityIdReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.entity.identification.v1";
  readonly result: Stage2EntityIdResult;
}

export interface Stage3SynthesisResult {
  readonly fallbackToGroundingOnly: boolean;
  readonly entityConditionedFactRefs: ReadonlyArray<string>;
  /** SHA-256 of the final answer string. The raw answer travels separately. */
  readonly answerHash: string;
  readonly totalTokensOut: number;
  readonly totalWallMs: number;
}

export interface MemoAnswerSynthesisReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.answer.synthesis.v1";
  readonly result: Stage3SynthesisResult;
}

// ---------- contradiction & escalation ----------

export interface MemoContradictionReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.contradiction.v1";
  readonly probe: ContradictionProbeOutput;
  readonly threshold: number;
}

export type EscalationResponse =
  | "re-run-stage-2"
  | "fallback-to-grounding-only";

export interface MemoEscalatedReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.escalated.v1";
  readonly response: EscalationResponse;
  readonly newBudget: number | null;
  readonly explanation: string;
}

// ---------- KS-18 grounding-parity witness ----------

export interface GroundingParityCheck {
  readonly satisfied: boolean;
  readonly subQueryCount: number;
  readonly surfacedFactCount: number;
  readonly explanation: string;
}

/**
 * KS-18-style parity witness: when every surfaced fact appears in exactly
 * two sub-queries' grounding responses, Σ contexts = 2 · Σ facts, so the
 * sub-query count must be even if the surfaced-fact count is odd (and vice
 * versa). Violation does not necessarily mean the run is wrong — it means
 * the grounding step is *under-witnessed* and the orchestrator must record
 * an uncertainty flag rather than serve a confident final answer.
 */
export function checkGroundingParity(
  stage1: Stage1GroundingResult,
): GroundingParityCheck {
  const k = stage1.subQueries.length;
  const f = stage1.surfacedFactRefs.length;
  // Sum of fact-appearances across sub-queries.
  let appearances = 0;
  for (const sq of stage1.subQueries) appearances += sq.citedReflectionRefs.length;
  // Parity rule: appearances == 2 · f ⇒ sum of sub-query citations is even.
  const satisfied = appearances % 2 === 0 && (f === 0 || appearances >= 2 * f);
  const explanation = satisfied
    ? `parity holds: ${k} sub-queries surfaced ${f} facts with ${appearances} total citations`
    : `parity violated: ${k} sub-queries surfaced ${f} facts but only ${appearances} citations (need each fact to appear in ≥2 sub-queries)`;
  return { satisfied, subQueryCount: k, surfacedFactCount: f, explanation };
}

export interface MemoGroundingParityViolatedReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.grounding.parity.violated.v1";
  readonly check: GroundingParityCheck;
}

// ---------- run rollup ----------

export interface MemoExecutiveRunReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.executive.run.v1";
  readonly envelopeRef: string;
  readonly stage1Ref: string;
  /** May be null when Stage 2 was skipped (no candidates). */
  readonly stage2Ref: string | null;
  readonly stage3Ref: string;
  readonly contradictionRef: string | null;
  readonly escalatedRef: string | null;
  readonly groundingParityViolatedRef: string | null;
  readonly finalAnswerHash: string;
}

/**
 * Run a contradiction probe with the envelope-declared threshold. Pure
 * function — caller decides what to do with the verdict.
 */
export function probeRunContradiction(
  envelope: ExecutiveProtocolEnvelope,
  stage1: Stage1GroundingResult,
  stage2: Stage2EntityIdResult,
): ContradictionProbeOutput {
  return probeStage2Contradiction({
    stage1FactRefs: stage1.surfacedFactRefs,
    stage2FactRefs: stage2.candidateSupportingFactRefs,
    minAgreement: envelope.minStage1Stage2Agreement,
  });
}

// ---------- mandatory contradiction-response pairing ----------
//
// Architectural rule (mirrors sparse-attention-kit): a probe that returns
// `violated:true` MUST be paired with an escalation decision in the same
// return contract. Callers cannot silently swallow a violation by
// ignoring the probe output — the helper below returns BOTH receipts as
// a tuple on violation, and `null` only when there is no violation.

export interface ContradictionResponseOptions {
  readonly tenant: string;
  /** parentRef of the Stage 2 receipt, so the escalation chain is auditable. */
  readonly stage2ReceiptRef: string;
  /** Threshold to escalate to a longer Stage 2 re-run rather than fall back. */
  readonly reRunStage2BudgetTokens: number | null;
}

export interface ContradictionResponsePair {
  readonly contradiction: Omit<
    MemoContradictionReceipt,
    "freshnessNonce" | "issuedAt"
  >;
  readonly escalated: Omit<
    MemoEscalatedReceipt,
    "freshnessNonce" | "issuedAt"
  >;
}

/**
 * Decide the contradiction response and return the paired receipt
 * skeletons. If `probe.violated === false`, returns `null` (no receipt
 * pair is emitted — silence on absence of violation is correct).
 *
 * If `probe.violated === true`, returns BOTH receipts:
 *   - `contradiction` — the probe outcome, parented to the Stage 2 ref.
 *   - `escalated` — the orchestrator's response: `re-run-stage-2` when
 *      a longer budget is supplied, otherwise `fallback-to-grounding-only`.
 *
 * The caller stamps freshnessNonce + issuedAt before computing the ref.
 * There is no escape hatch: returning the probe value alone (without
 * routing it through this helper) is now grounds for a code-review NACK.
 */
// ---------- runtime enforcement: composeExecutiveRun ----------
//
// The membrane: a Stage-2 receipt that ran a contradiction probe is not
// "complete" until either the probe was clean OR a paired
// (contradiction, escalated) receipt was produced. composeExecutiveRun
// throws if asked to seal a run that swallowed a probe violation. This
// is the runtime gate — callers cannot satisfy the type system without
// going through it.

export interface ComposeExecutiveRunInput {
  readonly tenant: string;
  readonly envelopeRef: string;
  readonly stage1Ref: string;
  /** Null when Stage 2 was skipped (no candidates). Mirrors MemoExecutiveRunReceipt. */
  readonly stage2Ref: string | null;
  readonly stage3Ref: string;
  /**
   * The probe outcome IF a probe was run. If null, no probe was run and
   * no escalation is expected. If non-null and `violated === true`, the
   * compose call MUST also supply `contradictionRef` + `escalatedRef`
   * (the AUTHENTICATED, content-addressed refs of the receipts the
   * orchestrator already stamped + hashed). Synthesising refs here from
   * a parent would break the audit chain.
   */
  readonly probe: ContradictionProbeOutput | null;
  /**
   * Real content-addressed receipt ref (e.g. `memo.contradiction.v1:abc…`)
   * produced by the orchestrator AFTER stamping freshnessNonce+issuedAt
   * and hashing. Required iff `probe?.violated === true`.
   */
  readonly contradictionRef: string | null;
  /**
   * Real content-addressed receipt ref (e.g. `memo.escalated.v1:def…`)
   * produced by the orchestrator. Required iff `probe?.violated === true`.
   */
  readonly escalatedRef: string | null;
  readonly groundingParityViolatedRef: string | null;
  readonly finalAnswerHash: string;
}

export function composeExecutiveRun(
  input: ComposeExecutiveRunInput,
): Omit<MemoExecutiveRunReceipt, "freshnessNonce" | "issuedAt"> {
  const probeViolated = input.probe?.violated === true;
  const hasPair = input.contradictionRef !== null && input.escalatedRef !== null;
  const hasAnyPair = input.contradictionRef !== null || input.escalatedRef !== null;
  if (probeViolated && !hasPair) {
    throw new Error(
      `composeExecutiveRun: probe violated (agreement=${input.probe!.agreement.toFixed(3)}) but no contradictionRef+escalatedRef pair supplied — refusing to seal a run that swallowed a probe violation. Route the probe through decideContradictionResponse, stamp+hash both receipts, then pass their refs in here.`,
    );
  }
  if (!probeViolated && hasAnyPair) {
    throw new Error(
      `composeExecutiveRun: probe is clean (or absent) but contradiction/escalated refs supplied — receipts must mirror the probe outcome exactly, never the other way round.`,
    );
  }
  return {
    receiptClass: "memo.executive.run.v1",
    tenant: input.tenant,
    parentRef: input.envelopeRef,
    envelopeRef: input.envelopeRef,
    stage1Ref: input.stage1Ref,
    stage2Ref: input.stage2Ref,
    stage3Ref: input.stage3Ref,
    contradictionRef: input.contradictionRef,
    escalatedRef: input.escalatedRef,
    groundingParityViolatedRef: input.groundingParityViolatedRef,
    finalAnswerHash: input.finalAnswerHash,
  };
}

export function decideContradictionResponse(
  envelope: ExecutiveProtocolEnvelope,
  probe: ContradictionProbeOutput,
  opts: ContradictionResponseOptions,
): ContradictionResponsePair | null {
  if (!probe.violated) return null;
  const response: EscalationResponse =
    opts.reRunStage2BudgetTokens !== null && opts.reRunStage2BudgetTokens > 0
      ? "re-run-stage-2"
      : "fallback-to-grounding-only";
  const contradiction: ContradictionResponsePair["contradiction"] = {
    receiptClass: "memo.contradiction.v1",
    tenant: opts.tenant,
    parentRef: opts.stage2ReceiptRef,
    probe,
    threshold: envelope.minStage1Stage2Agreement,
  };
  const escalated: ContradictionResponsePair["escalated"] = {
    receiptClass: "memo.escalated.v1",
    tenant: opts.tenant,
    parentRef: opts.stage2ReceiptRef,
    response,
    newBudget: opts.reRunStage2BudgetTokens,
    explanation:
      response === "re-run-stage-2"
        ? `Stage1↔Stage2 agreement ${probe.agreement.toFixed(3)} below threshold ${envelope.minStage1Stage2Agreement}; re-running Stage 2 with budget ${opts.reRunStage2BudgetTokens}`
        : `Stage1↔Stage2 agreement ${probe.agreement.toFixed(3)} below threshold ${envelope.minStage1Stage2Agreement}; no re-run budget supplied — falling back to grounding-only synthesis`,
  };
  return { contradiction, escalated };
}
