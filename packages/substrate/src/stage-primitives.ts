/**
 * @szl/substrate — Stage Primitive Factories
 *
 * Ergonomic builder functions for each stage type.
 * Use separate defaults + spread to avoid TS2783 duplicate key warnings.
 */

import type {
  ReasonStage,
  RetrieveStage,
  ToolCallStage,
  VerifyStage,
  DecideStage,
  ApprovalGate,
  SideEffectCategory,
  PolicyProfile,
  ConfidenceBudget,
} from "./types.js";

// ─── Stage Builders ───────────────────────────────────────────────────────────

const BASE_DEFAULTS = {
  dependsOn: [] as string[],
  timeoutMs: 30_000,
  maxRetries: 2,
  runtime: "typescript" as const,
  otelTags: {} as Record<string, string>,
  requiredEvidence: [] as string[],
  priority: "normal" as const,
};

export function Reason(opts: Partial<Omit<ReasonStage, "type">> & { id: string; name: string }): ReasonStage {
  return {
    ...BASE_DEFAULTS,
    modelAdapterId: "default",
    ...opts,
    type: "Reason",
  };
}

export function Retrieve(opts: Partial<Omit<RetrieveStage, "type">> & { id: string; name: string }): RetrieveStage {
  return {
    ...BASE_DEFAULTS,
    timeoutMs: 45_000,
    retrieverAdapterId: "default",
    topK: 10,
    minRelevanceScore: 0.5,
    ...opts,
    type: "Retrieve",
  };
}

export function ToolCall(opts: Partial<Omit<ToolCallStage, "type">> & { id: string; name: string; toolId: string }): ToolCallStage {
  return {
    ...BASE_DEFAULTS,
    maxRetries: 1,
    sideEffects: [] as SideEffectCategory[],
    requiresApprovalFor: ["financial", "deletion", "write-external", "infrastructure"] as SideEffectCategory[],
    ...opts,
    type: "ToolCall",
  };
}

export function Verify(opts: Partial<Omit<VerifyStage, "type">> & { id: string; name: string }): VerifyStage {
  return {
    ...BASE_DEFAULTS,
    timeoutMs: 20_000,
    maxRetries: 1,
    minConfidence: 0.7,
    modelAdapterId: "verifier",
    allowRevision: true,
    ...opts,
    type: "Verify",
  };
}

export function Decide(opts: Partial<Omit<DecideStage, "type">> & { id: string; name: string }): DecideStage {
  return {
    ...BASE_DEFAULTS,
    maxRetries: 1,
    priority: "critical",
    sideEffects: [] as SideEffectCategory[],
    highRiskSideEffects: [] as SideEffectCategory[],
    approvalPolicy: "operator" as const,
    modelAdapterId: "default",
    ...opts,
    type: "Decide",
  };
}

export function ApprovalGate(opts: Partial<Omit<ApprovalGate, "type">> & { id: string; name: string }): ApprovalGate {
  return {
    ...BASE_DEFAULTS,
    timeoutMs: 0,
    maxRetries: 0,
    priority: "critical",
    requiredTier: "operator" as const,
    inboxPattern: "substrate-approval",
    approvalTimeoutMs: 0,
    ...opts,
    type: "ApprovalGate",
  };
}

// ─── Policy Profile Builder ───────────────────────────────────────────────────

export function definePolicy(opts: {
  id: string;
  name: string;
  highRiskCategories?: SideEffectCategory[];
  policyIds?: string[];
  minimumApprovalTier?: "operator" | "manager" | "executive" | "board";
}): PolicyProfile {
  return {
    id: opts.id,
    name: opts.name,
    highRiskCategories: opts.highRiskCategories ?? [
      "financial",
      "deletion",
      "write-external",
      "infrastructure",
    ],
    policyIds: opts.policyIds ?? [],
    minimumApprovalTier: opts.minimumApprovalTier ?? "operator",
  };
}

// ─── Budget Builder ───────────────────────────────────────────────────────────

export function defineBudget(opts?: {
  escalateAt?: number;
  requireHumanBelow?: number;
  minFinalConfidence?: number;
  escalationModelAdapterId?: string;
  verifierAdapterId?: string;
}): ConfidenceBudget {
  return {
    escalateAt: opts?.escalateAt ?? 0.5,
    requireHumanBelow: opts?.requireHumanBelow ?? 0.3,
    minFinalConfidence: opts?.minFinalConfidence ?? 0.4,
    escalationModelAdapterId: opts?.escalationModelAdapterId ?? "strong",
    verifierAdapterId: opts?.verifierAdapterId ?? "verifier",
  };
}
