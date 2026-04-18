/**
 * OS Layer — Canonical Contract Types
 *
 * Every app, every screen. Decisions with receipts.
 * Signal → Evidence → Policy → Run → Action → Audit.
 */

// ─── Autonomy Mode ───────────────────────────────────────────────────────────

export type AutonomyMode =
  | "suggest"
  | "approve_each"
  | "approve_batch"
  | "auto_with_rollback"
  | "full_auto";

export const AUTONOMY_LABELS: Record<AutonomyMode, string> = {
  suggest: "Suggest Only",
  approve_each: "Approve Each",
  approve_batch: "Approve Batch",
  auto_with_rollback: "Auto + Rollback",
  full_auto: "Full Auto",
};

export const AUTONOMY_DESCRIPTIONS: Record<AutonomyMode, string> = {
  suggest: "All recommendations surface as suggestions. No action is taken without explicit operator approval.",
  approve_each: "Each recommended action requires individual operator approval before execution.",
  approve_batch: "Actions can be batched and approved in groups. Each batch requires approval.",
  auto_with_rollback: "Actions execute automatically but remain reversible within the rollback window.",
  full_auto: "Actions execute automatically. Policy engine is the only gate. Audit trail captures everything.",
};

// ─── Policy Verdict ──────────────────────────────────────────────────────────

export type PolicyVerdict = "green" | "yellow" | "red" | "blocked";

export interface PolicyVerdictDetail {
  verdict: PolicyVerdict;
  policyPack: string;
  ruleId: string;
  ruleLabel: string;
  reason: string;
  approvalThreshold?: string;
  overridePath?: string;
  requiresJustification: boolean;
  evaluatedAt: string;
}

export const POLICY_VERDICT_LABELS: Record<PolicyVerdict, string> = {
  green: "Cleared",
  yellow: "Conditional",
  red: "Flagged",
  blocked: "Blocked",
};

export const POLICY_VERDICT_DESCRIPTIONS: Record<PolicyVerdict, string> = {
  green: "All policy rules passed. Action is cleared for execution.",
  yellow: "One or more rules require written justification before execution.",
  red: "Policy flags this action as high-risk. Operator escalation required.",
  blocked: "Policy prohibits this action under current conditions.",
};

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface EvidenceRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: "live_feed" | "database" | "model_inference" | "human_input" | "external_api" | "derived";
  content: string;
  excerpt?: string;
  timestamp: string;
  freshnessSeconds: number;
  confidence: number;
  lineage?: string[];
  url?: string;
}

// ─── Source Health ────────────────────────────────────────────────────────────

export type SourceHealthStatus = "healthy" | "degraded" | "stale" | "disconnected";

export interface SourceHealthRecord {
  sourceId: string;
  sourceName: string;
  connector: string;
  status: SourceHealthStatus;
  lastSeenAt: string;
  freshnessSeconds: number;
  latencyMs?: number;
  errorMessage?: string;
  affectedWidgets?: string[];
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export type RecommendationAction = "approve" | "reject" | "escalate" | "rollback" | "defer";

export interface Recommendation {
  id: string;
  variant: string;
  title: string;
  summary: string;
  rationale: string;
  proposedAction: string;
  confidence: number;
  valueAtRisk?: number;
  opportunityValue?: number;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  autonomyMode: AutonomyMode;
  policyVerdict: PolicyVerdictDetail;
  evidenceCount: number;
  evidence: EvidenceRecord[];
  runId?: string;
  createdAt: string;
  expiresAt?: string;
  status: "pending" | "approved" | "rejected" | "escalated" | "executed" | "rolled_back" | "expired";
  category?: string;
  tags?: string[];
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export type RunStatus = "running" | "completed" | "failed" | "cancelled" | "pending";
export type RunEffort = "low" | "medium" | "high" | "deep";

export interface ToolCall {
  toolName: string;
  inputSummary?: string;
  outputSummary?: string;
  latencyMs: number;
  success: boolean;
}

export interface Run {
  id: string;
  variant: string;
  planId?: string;
  skillName?: string;
  status: RunStatus;
  effort: RunEffort;
  label: string;
  toolCalls: ToolCall[];
  latencyMs: number;
  tokenUsage?: { input: number; output: number; total: number };
  evalScore?: number;
  humanOverride?: "approved" | "rejected" | "escalated";
  humanOverrideNote?: string;
  recommendations?: Recommendation[];
  startedAt: string;
  completedAt?: string;
  replayable: boolean;
  artifacts?: Record<string, unknown>;
}

// ─── Audit Entry ─────────────────────────────────────────────────────────────

export type AuditAction =
  | "recommendation_viewed"
  | "recommendation_approved"
  | "recommendation_rejected"
  | "recommendation_escalated"
  | "action_executed"
  | "action_rolled_back"
  | "autonomy_dial_changed"
  | "policy_override"
  | "run_replayed";

export interface OSAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  action: AuditAction;
  targetId: string;
  targetType: "recommendation" | "run" | "policy" | "workflow";
  detail?: string;
  justification?: string;
  proofHash?: string;
  variant: string;
}
