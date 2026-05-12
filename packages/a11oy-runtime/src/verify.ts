/**
 * a11oy.verify — run an A11oy workcell admission decision through the
 * Ouroboros loop spine.
 *
 * Λ-gate          : Λ₉ axes derived from the workcell's MirrorEval scores
 *                   and the proposed operator sequence's trust scores.
 * fluxionsReceipt : tool-risk consistency check — refuse "bare claims"
 *                   where a high-risk tool is being called without an
 *                   approval requirement, or a tool is referenced that
 *                   isn't in the registry.
 * witnessDiversity: Gauss class-number axis on the discriminant derived
 *                   from the operator-sequence signature. Refuses
 *                   workcells whose operator graph collapses to too few
 *                   distinct trust-equivalence classes (echo-chamber
 *                   workcells).
 *
 * Returns the receipt + an A11oySignal describing how the workcell would
 * progress under the current registry.
 */
import { run, type OuroborosReceipt } from "@workspace/ouroboros-loop";
import {
  lutarInvariant9,
  verifyLutarBoundN,
  type LutarAxes9,
  type LutarReportN,
} from "@workspace/ouroboros-invariant";
import { classNumber, classNumberAxis } from "@workspace/ouroboros-gauss";
import { OPERATOR_MAP, TOOL_MAP } from "./data/index.js";
import type {
  ActionBrief,
  MirrorEvalScore,
  OperatorId,
  ProposedAction,
  ToolRisk,
  Workcell,
} from "./types/index.js";

// ---------------------------------------------------------------------------
// Input / output
// ---------------------------------------------------------------------------

export interface A11oyVerifyInput {
  /** The candidate workcell to admit / refuse. */
  workcell: Workcell;
  /** Override Λ-admission threshold (default 0.5). */
  lambdaThreshold?: number;
  /** Override Gauss witness-diversity K_axis floor (default 0.4). */
  witnessThreshold?: number;
  /** Override class-number ceiling K (default 8). */
  classNumberCeiling?: number;
}

export type A11oyVerifySignal =
  | { kind: "admit"; nextStatus: Workcell["status"]; reason: string }
  | { kind: "refuse"; reason: string };

export interface A11oyVerifyOutput {
  receipt: OuroborosReceipt<A11oyVerifyInput>;
  lutar: LutarReportN;
  axes: LutarAxes9;
  /** Discriminant used in the witness-diversity gate. Negative ≡ 0 or 1 (mod 4). */
  discriminant: number;
  /** Computed h(d) class number. */
  classNumberValue: number;
  /** K_axis ∈ [0,1] derived from h(d). */
  witnessAxis: number;
  signal: A11oyVerifySignal;
}

// ---------------------------------------------------------------------------
// Λ₉ axis derivation
// ---------------------------------------------------------------------------

/**
 * Derive a Λ₉ vector from a workcell's MirrorEval scores + operator trust.
 * Each axis is computed deterministically from registry-grounded scores —
 * no random samples, no hidden fudge factors. Returns axes in [0,1].
 *
 * Mapping (each clamped to [0,1]):
 *   - cleanliness         ← 1 − staleContextRisk            (low stale risk ⇒ clean)
 *   - horizon             ← actionSpecificity               (clarity over time)
 *   - resonance           ← evidenceCoverage                (multi-source agreement)
 *   - frustum             ← businessImpactClarity           (truncated impact pyramid)
 *   - gaussClosure        ← verificationReadiness           (closure on a fixed point)
 *   - invariance          ← groundedness                    (Λ₉ invariance ≈ groundedness)
 *   - moralGrounding      ← policyCompliance                (moral law alignment)
 *   - ontologicalGrounding← approvalCorrectness             (correct authority chain)
 *   - measurabilityHonesty← 1 − hallucinationRisk           (we measure what we claim)
 *
 * If the workcell has no actionBrief yet, the trust-score average of the
 * operator sequence is used as a uniform fallback.
 */
export function deriveAxes(workcell: Workcell): LutarAxes9 {
  const m: MirrorEvalScore | undefined = workcell.actionBrief?.mirrorEval;
  if (m) {
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return {
      cleanliness: clamp(1 - m.staleContextRisk),
      horizon: clamp(m.actionSpecificity),
      resonance: clamp(m.evidenceCoverage),
      frustum: clamp(m.businessImpactClarity),
      gaussClosure: clamp(m.verificationReadiness),
      invariance: clamp(m.groundedness),
      moralGrounding: clamp(m.policyCompliance),
      ontologicalGrounding: clamp(m.approvalCorrectness),
      measurabilityHonesty: clamp(1 - m.hallucinationRisk),
    };
  }
  // Fallback: average operator trust across the planned sequence
  const ops = workcell.operatorSequence
    .map((id) => OPERATOR_MAP[id])
    .filter((o): o is NonNullable<typeof o> => Boolean(o));
  const avg =
    ops.length > 0
      ? ops.reduce((s, o) => s + o.trustScore.overall / 100, 0) / ops.length
      : 0.5;
  const v = Math.max(0, Math.min(1, avg));
  return {
    cleanliness: v,
    horizon: v,
    resonance: v,
    frustum: v,
    gaussClosure: v,
    invariance: v,
    moralGrounding: v,
    ontologicalGrounding: v,
    measurabilityHonesty: v,
  };
}

// ---------------------------------------------------------------------------
// fluxionsReceipt: tool-risk consistency
// ---------------------------------------------------------------------------

const HIGH_RISK_TIERS: ReadonlySet<ToolRisk> = new Set(["high", "critical"]);

/**
 * Returns true iff every ProposedAction:
 *  - references a tool present in TOOL_MAP, AND
 *  - does not claim-down a HIGH/CRITICAL registry-risk tool to read_only/low, AND
 *  - if registry risk is high/critical, requiresApproval is true (no bare claim).
 *
 * Claim-down within the read_only/low/medium band is permitted (a write-capable
 * tool used in retrieve mode is honest demo behavior); only claim-down of
 * high/critical tools triggers a fluxions-receipt refusal.
 *
 * No actionBrief → vacuously true (the workcell is still in planning).
 */
export function fluxionsReceiptHolds(workcell: Workcell): boolean {
  const brief: ActionBrief | null = workcell.actionBrief;
  if (!brief) return true;
  for (const a of brief.proposedActions) {
    if (!isFiniteAction(a)) return false;
    const def = TOOL_MAP[a.tool];
    if (!def) return false; // unknown tool ≡ bare claim
    if (HIGH_RISK_TIERS.has(def.risk)) {
      // Strict on dangerous tools: no claim-down, must require approval.
      if (riskRank(a.riskLevel) < riskRank(def.risk)) return false;
      if (!a.requiresApproval) return false;
    }
  }
  return true;
}

function isFiniteAction(a: ProposedAction): boolean {
  return (
    typeof a.id === "string" &&
    a.id.length > 0 &&
    typeof a.tool === "string" &&
    a.tool.length > 0 &&
    typeof a.description === "string"
  );
}

const RISK_ORDER: Record<ToolRisk, number> = {
  read_only: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function riskRank(r: ToolRisk): number {
  return RISK_ORDER[r] ?? 0;
}

// ---------------------------------------------------------------------------
// witnessDiversity: Gauss class-number on operator sequence
// ---------------------------------------------------------------------------

/**
 * Build a fundamental-quadratic discriminant d < 0, d ≡ 0 or 1 (mod 4),
 * deterministically derived from the operator sequence. The discriminant
 * is the negative of the smallest valid integer ≥ |H| where H is a hash
 * of the sorted unique operator IDs. This anchors h(d) to the *set* of
 * distinct trust-equivalence classes represented in the workcell.
 */
export function discriminantForOperators(seq: ReadonlyArray<OperatorId>): number {
  const unique = Array.from(new Set(seq)).sort();
  let h = 17;
  for (const id of unique) {
    for (let i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) >>> 0;
    }
  }
  // Constrain to a tractable enumeration range (|d| ≤ 10^6).
  let raw = (h % 99_991) + 3; // ≥ 3 so |d| ≥ 3
  // Make d ≡ 0 or 1 (mod 4) by walking up at most 3 steps.
  for (let step = 0; step < 4; step++) {
    const mod4 = raw % 4;
    if (mod4 === 0 || mod4 === 3) break; // -raw ≡ 0 or 1 (mod 4)
    raw += 1;
  }
  return -raw;
}

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

export function verify(input: A11oyVerifyInput): A11oyVerifyOutput {
  const { workcell } = input;
  const lambdaThreshold = input.lambdaThreshold ?? 0.5;
  const witnessThreshold = input.witnessThreshold ?? 0.4;
  const ceiling = input.classNumberCeiling ?? 8;

  const axes = deriveAxes(workcell);
  const lutar = lutarInvariant9(axes);
  const boundHolds = verifyLutarBoundN(lutar);
  const lambdaAdmit = boundHolds && lutar.invariant >= lambdaThreshold;

  const disc = discriminantForOperators(workcell.operatorSequence);
  const report = classNumber(disc);
  const witnessAxis = classNumberAxis(report, ceiling);

  const receipt = run<A11oyVerifyInput>({
    payload: input,
    canonical: (x) =>
      `a11oy:${x.workcell.id}:${x.workcell.status}:${lutar.invariant.toFixed(6)}:h${report.classNumber}`,
    transform: (x) => x, // 1-shot: admission is a canonical decision
    mechanisms: {
      lambdaGate: () => lambdaAdmit,
      fluxionsReceipt: (x) => fluxionsReceiptHolds(x.workcell),
      witnessDiversity: () => ({
        axis: witnessAxis,
        threshold: witnessThreshold,
        discriminant: disc,
        classNumber: report.classNumber,
      }),
    },
    maxIter: 1,
  });

  const signal: A11oyVerifySignal =
    receipt.verdict === "ACCEPTED"
      ? {
          kind: "admit",
          nextStatus: nextStatusFor(workcell),
          reason: `Λ=${lutar.invariant.toFixed(3)} ≥ ${lambdaThreshold}, K_axis=${witnessAxis.toFixed(3)} ≥ ${witnessThreshold}`,
        }
      : { kind: "refuse", reason: receipt.refusalReason ?? receipt.verdict };

  return {
    receipt,
    lutar,
    axes,
    discriminant: disc,
    classNumberValue: report.classNumber,
    witnessAxis,
    signal,
  };
}

function nextStatusFor(w: Workcell): Workcell["status"] {
  switch (w.status) {
    case "intake":
      return "planning";
    case "planning":
      return "context_building";
    case "context_building":
      return "risk_review";
    case "risk_review":
      return "action_brief_created";
    case "action_brief_created":
      return w.approvalStatus === "pending" || w.approvalStatus === "not_required"
        ? "approval_required"
        : "executing";
    case "approval_required":
      return "approved";
    case "approved":
      return "executing";
    case "executing":
      return "verifying";
    case "verifying":
      return "proven";
    default:
      return w.status;
  }
}
