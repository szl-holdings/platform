export type ATLASEventClass =
  | "business.transaction.started"
  | "business.transaction.completed"
  | "business.transaction.failed"
  | "business.risk.detected"
  | "business.opportunity.created"
  | "policy.violation.detected"
  | "recommendation.generated"
  | "action.approved"
  | "action.executed"
  | "action.failed"
  | "outcome.realized";

export type ATLASDomain =
  | "maritime"
  | "real-estate"
  | "defense"
  | "finance"
  | "lyte"
  | "workforce"
  | "platform"
  | string;

export type ATLASSeverity = "info" | "low" | "medium" | "high" | "critical";

export type ATLASSLAImpact = "none" | "at-risk" | "breached" | "recovered";

export interface ATLASActor {
  actorId?: string;
  actorType: "user" | "agent" | "system" | "automation";
  actorName?: string;
  tenantId?: string;
  orgId?: string;
}

export interface ATLASBusinessValue {
  amount?: number;
  currency?: string;
  type: "at-risk" | "protected" | "created" | "lost" | "estimated";
  description?: string;
}

export interface ATLASSLOImpact {
  slaId?: string;
  sloId?: string;
  impact: ATLASSLAImpact;
  breachThresholdMs?: number;
  actualDurationMs?: number;
}

export interface ATLASBaseEvent {
  eventId: string;
  eventClass: ATLASEventClass;
  domain: ATLASDomain;
  tenantId?: string;
  actor?: ATLASActor;
  workflowId?: string;
  correlationId?: string;
  entityIds?: Record<string, string>;
  businessValue?: ATLASBusinessValue;
  sloImpact?: ATLASSLOImpact;
  severity?: ATLASSeverity;
  tags?: string[];
  metadata?: Record<string, unknown>;
  timestamp: number;
  schemaVersion: "1.0";
}

export interface ATLASTransactionStartedEvent extends ATLASBaseEvent {
  eventClass: "business.transaction.started";
  transactionType: string;
  transactionId: string;
}

export interface ATLASTransactionCompletedEvent extends ATLASBaseEvent {
  eventClass: "business.transaction.completed";
  transactionType: string;
  transactionId: string;
  durationMs: number;
  outcome: "success" | "partial" | "compensated";
}

export interface ATLASTransactionFailedEvent extends ATLASBaseEvent {
  eventClass: "business.transaction.failed";
  transactionType: string;
  transactionId: string;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
}

export interface ATLASRiskDetectedEvent extends ATLASBaseEvent {
  eventClass: "business.risk.detected";
  riskType: string;
  riskScore?: number;
  riskFactors?: string[];
  mitigationSuggested?: string;
}

export interface ATLASOpportunityCreatedEvent extends ATLASBaseEvent {
  eventClass: "business.opportunity.created";
  opportunityType: string;
  opportunityId: string;
  estimatedValue?: ATLASBusinessValue;
  expiresAt?: number;
}

export interface ATLASPolicyViolationEvent extends ATLASBaseEvent {
  eventClass: "policy.violation.detected";
  policyId: string;
  policyName: string;
  violationType: string;
  autoRemediated?: boolean;
  remediationNote?: string;
}

export interface ATLASRecommendationGeneratedEvent extends ATLASBaseEvent {
  eventClass: "recommendation.generated";
  recommendationType: string;
  recommendationId: string;
  confidence?: number;
  modelId?: string;
  reasoningSummary?: string;
}

export interface ATLASActionApprovedEvent extends ATLASBaseEvent {
  eventClass: "action.approved";
  actionId: string;
  actionType: string;
  approvedByUserId?: string;
  approvalDelayMs?: number;
  approvalLevel: "auto" | "human" | "executive";
}

export interface ATLASActionExecutedEvent extends ATLASBaseEvent {
  eventClass: "action.executed";
  actionId: string;
  actionType: string;
  executorId?: string;
  durationMs: number;
  resultSummary?: string;
}

export interface ATLASActionFailedEvent extends ATLASBaseEvent {
  eventClass: "action.failed";
  actionId: string;
  actionType: string;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
  rollbackPerformed?: boolean;
}

export interface ATLASOutcomeRealizedEvent extends ATLASBaseEvent {
  eventClass: "outcome.realized";
  outcomeType: string;
  outcomeId?: string;
  measuredValue?: ATLASBusinessValue;
  comparedToBaseline?: number;
  periodDays?: number;
  confidence?: number;
}

export type ATLASEvent =
  | ATLASTransactionStartedEvent
  | ATLASTransactionCompletedEvent
  | ATLASTransactionFailedEvent
  | ATLASRiskDetectedEvent
  | ATLASOpportunityCreatedEvent
  | ATLASPolicyViolationEvent
  | ATLASRecommendationGeneratedEvent
  | ATLASActionApprovedEvent
  | ATLASActionExecutedEvent
  | ATLASActionFailedEvent
  | ATLASOutcomeRealizedEvent;

export type ATLASEventHandler<T extends ATLASEvent = ATLASEvent> = (
  event: T,
) => void | Promise<void>;
