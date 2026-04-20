/**
 * Local TypeScript types mirroring the ACR governance contracts from
 * @szl-holdings/contracts/governance. Defined here to avoid pulling the full
 * contracts package into the frontend bundle.
 */

export type ApprovalStatus = "pending" | "approved" | "denied" | "escalated" | "timed_out";
export type ApprovalVerdict_ = "approve" | "deny" | "escalate";
export type GateStatus = "complete" | "degraded" | "blocked" | "pending";

export interface ApprovalInterruptSpec {
  actionLabel: string;
  payload: Record<string, unknown>;
  policyReason: string;
  evidenceSummary: string;
  suggestedDecision: ApprovalVerdict_;
  expiresAt: number;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  traceId?: string;
  tenantId?: string;
  profileId?: string;
  stepId: string;
  stepName: string;
  checkpointRef?: string;
  interrupt: ApprovalInterruptSpec;
  status: ApprovalStatus;
  requestedAt: number;
  expiresAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface ApprovalDecision {
  decisionId: string;
  requestId: string;
  verdict: ApprovalVerdict_;
  actor: string;
  reason: string;
  decidedAt: number;
  signature?: string;
}

export interface LedgerToolCall {
  toolId: string;
  stepId: string;
  latencyMs: number;
  outcome: "success" | "failure" | "skipped";
  error?: string;
}

export interface LedgerSource {
  sourceId: string;
  sourceType: string;
  retrievalScore: number;
  summary?: string;
}

export interface LedgerApprovalEvent {
  requestId: string;
  stepId: string;
  verdict: "approve" | "deny" | "escalate" | "timed_out" | "pending";
  actor?: string;
  decidedAt?: number;
}

export interface LedgerPolicyOutcome {
  policyId: string;
  result: "pass" | "require-approval" | "block" | "pending";
  tier?: string;
  reason?: string;
}

export interface LedgerEvalScore {
  metric: string;
  score: number;
  threshold: number;
  passed: boolean;
}

export interface LedgerStageTiming {
  phase: string;
  startedAt: number;
  durationMs: number;
}

export interface QualityGateFailingGate {
  gate: string;
  reason: string;
  actual?: number;
  threshold?: number;
}

export interface QualityGateResult {
  status: GateStatus;
  failingGates: QualityGateFailingGate[];
  recommendedNextAction: string;
  evaluatedAt: number;
}

export interface RunLedgerEntry {
  ledgerId: string;
  requestId: string;
  runId: string;
  traceId?: string;
  tenantId?: string;
  actor?: string;
  profileId?: string;
  objective: string;
  planSummary?: string;
  planStepCount: number;
  sourcesConsulted: LedgerSource[];
  toolCalls: LedgerToolCall[];
  approvalEvents: LedgerApprovalEvent[];
  policyOutcomes: LedgerPolicyOutcome[];
  finalArtifacts: string[];
  evalScores: LedgerEvalScore[];
  stageTimings: LedgerStageTiming[];
  startedAt: number;
  completedAt?: number;
  totalDurationMs?: number;
  gateStatus: GateStatus;
  gateResult?: QualityGateResult;
  createdAt: number;
}
