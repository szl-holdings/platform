import { randomUUID } from "crypto";

export type RiskLevel = "P0" | "P1" | "P2" | "P3" | "P4";
export type DecisionStatus = "proposed" | "pending_approval" | "approved" | "rejected" | "executed" | "expired";
export type ApprovalRequired = boolean;

export interface AlloyDecisionEvidenceRef {
  refId: string;
  source: string;
  sourceType: "workflow" | "audit" | "signal" | "connector" | "policy" | "prior_incident" | "playbook" | "retrieval";
  content: string;
  relevanceScore: number;
  timestamp: string | null;
  objectId: string | null;
}

export interface AlloyDecision {
  decisionId: string;
  workflowId: string | null;
  signalIds: string[];
  recommendedAction: string;
  rationaleSummary: string;
  evidenceRefs: AlloyDecisionEvidenceRef[];
  confidence: number;
  ownerSuggestion: string | null;
  approvalRequired: ApprovalRequired;
  riskLevel: RiskLevel;
  fallbackPlan: string | null;
  modelRoute: string;
  schemaVersion: "2.0.0";
  createdAt: string;
  status: DecisionStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  executedAt: string | null;
  executionOutcome: "pending" | "executed" | "failed" | "rejected" | "expired" | null;
  rawInput: string | null;
  rawOutput: string | null;
}

export function createAlloyDecision(params: Partial<AlloyDecision> & {
  recommendedAction: string;
  rationaleSummary: string;
  riskLevel: RiskLevel;
  modelRoute: string;
}): AlloyDecision {
  const riskLevel = params.riskLevel;
  const approvalRequired = params.approvalRequired ?? (riskLevel === "P0" || riskLevel === "P1");

  return {
    decisionId: params.decisionId ?? `dec_${randomUUID()}`,
    workflowId: params.workflowId ?? null,
    signalIds: params.signalIds ?? [],
    recommendedAction: params.recommendedAction,
    rationaleSummary: params.rationaleSummary,
    evidenceRefs: params.evidenceRefs ?? [],
    confidence: params.confidence ?? 0.5,
    ownerSuggestion: params.ownerSuggestion ?? null,
    approvalRequired,
    riskLevel,
    fallbackPlan: params.fallbackPlan ?? "Escalate to on-call operator for manual review",
    modelRoute: params.modelRoute,
    schemaVersion: "2.0.0",
    createdAt: params.createdAt ?? new Date().toISOString(),
    status: params.status ?? (approvalRequired ? "pending_approval" : "proposed"),
    approvedBy: params.approvedBy ?? null,
    approvedAt: params.approvedAt ?? null,
    rejectedBy: params.rejectedBy ?? null,
    rejectedAt: params.rejectedAt ?? null,
    rejectionReason: params.rejectionReason ?? null,
    executedAt: params.executedAt ?? null,
    executionOutcome: params.executionOutcome ?? null,
    rawInput: params.rawInput ?? null,
    rawOutput: params.rawOutput ?? null,
  };
}

export function validateAlloyDecision(raw: unknown): { valid: boolean; decision: AlloyDecision | null; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { valid: false, decision: null, errors: ["Not an object"] };
  const obj = raw as Record<string, unknown>;

  if (typeof obj.decisionId !== "string" || !obj.decisionId) errors.push("Missing decisionId");
  if (typeof obj.recommendedAction !== "string" || !obj.recommendedAction) errors.push("Missing recommendedAction");
  if (typeof obj.rationaleSummary !== "string" || !obj.rationaleSummary) errors.push("Missing rationaleSummary");
  if (!["P0", "P1", "P2", "P3", "P4"].includes(obj.riskLevel as string)) errors.push("Invalid riskLevel (must be P0-P4)");
  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 1) errors.push("Invalid confidence (0-1)");
  if (!Array.isArray(obj.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (typeof obj.approvalRequired !== "boolean") errors.push("Missing approvalRequired");
  if (typeof obj.modelRoute !== "string") errors.push("Missing modelRoute");
  if (obj.schemaVersion !== "2.0.0") errors.push("schemaVersion must be '2.0.0'");
  if (typeof obj.createdAt !== "string") errors.push("Missing createdAt");

  if (errors.length > 0) return { valid: false, decision: null, errors };

  return {
    valid: true,
    decision: obj as AlloyDecision,
    errors: [],
  };
}

export const APPROVAL_MATRIX: Record<RiskLevel, { requiresApproval: boolean; approverRole: string; sla: string; autoExpireHours: number }> = {
  P0: { requiresApproval: true, approverRole: "executive", sla: "15m", autoExpireHours: 1 },
  P1: { requiresApproval: true, approverRole: "manager", sla: "1h", autoExpireHours: 4 },
  P2: { requiresApproval: false, approverRole: "operator", sla: "4h", autoExpireHours: 24 },
  P3: { requiresApproval: false, approverRole: "operator", sla: "24h", autoExpireHours: 72 },
  P4: { requiresApproval: false, approverRole: "none", sla: "72h", autoExpireHours: 168 },
};

export function getApprovalPolicy(riskLevel: RiskLevel): typeof APPROVAL_MATRIX[RiskLevel] {
  return APPROVAL_MATRIX[riskLevel];
}

export function mapConfidenceToRisk(confidence: number, priority?: string): RiskLevel {
  if (priority === "P0" || confidence < 0.1) return "P0";
  if (priority === "P1" || confidence < 0.3) return "P1";
  if (priority === "P2" || confidence < 0.6) return "P2";
  if (priority === "P3" || confidence < 0.8) return "P3";
  return "P4";
}
