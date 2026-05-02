/**
 * SZL Holdings — Temporal Workflow Shared Types
 * Phase 10 (Operability & Governance)
 *
 * Shared type definitions for all Temporal workflows.
 * All workflow inputs and outputs must be JSON-serializable.
 */

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------

export type Environment = "development" | "staging" | "production";
export type ApprovalDecision = "approved" | "rejected" | "expired";

export interface WorkflowMetadata {
  workflowId: string;
  runId: string;
  startedAt: string;
  initiatedBy: string;
  environment: Environment;
  domain: string;
  service: string;
}

export interface LyteVisibilityEvent {
  eventType: string;
  workflowType: string;
  workflowId: string;
  runId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Approval Workflow
// ---------------------------------------------------------------------------

export interface ApprovalWorkflowInput {
  operationType: string;
  targetService: string;
  targetEnvironment: Environment;
  targetVersion: string;
  policyId: string;
  initiatedBy: string;
  requestedApproverGroups: string[];
  requiredApprovalCount: number;
  timeoutMs: number;
  context: Record<string, unknown>;
}

export interface ApprovalWorkflowResult {
  outcome: ApprovalDecision;
  approvals: ApprovalRecord[];
  completedAt: string;
  durationMs: number;
  evidenceLedgerId: string | null;
}

export interface ApprovalRecord {
  approverUserId: string;
  approverGroups: string[];
  decision: "approved" | "rejected";
  decidedAt: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Remediation Workflow
// ---------------------------------------------------------------------------

export type RemediationStrategy = "rollback" | "patch" | "scale-down" | "circuit-break" | "manual";
export type RemediationStatus = "pending" | "in-progress" | "resolved" | "escalated" | "failed";

export interface RemediationWorkflowInput {
  incidentId: string;
  violationType: string;
  affectedService: string;
  environment: Environment;
  strategy: RemediationStrategy;
  initiatedBy: string;
  policyId: string;
  evidenceLedgerId: string | null;
  autoRemediate: boolean;         // if false, requires human approval before each step
  maxAttempts: number;
}

export interface RemediationWorkflowResult {
  status: RemediationStatus;
  strategy: RemediationStrategy;
  attemptsCount: number;
  resolvedAt: string | null;
  escalatedTo: string | null;
  evidenceLedgerId: string;
  timeline: RemediationTimelineEvent[];
}

export interface RemediationTimelineEvent {
  timestamp: string;
  step: string;
  outcome: "success" | "failure" | "skipped";
  details: string;
}

// ---------------------------------------------------------------------------
// Change Window Workflow
// ---------------------------------------------------------------------------

export interface ChangeWindowWorkflowInput {
  changeWindowId: string;
  title: string;
  description: string;
  environment: Environment;
  targetServices: string[];
  requestedBy: string;
  proposedStart: string;            // ISO 8601
  proposedEnd: string;              // ISO 8601
  requiredApprovers: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ChangeWindowWorkflowResult {
  changeWindowId: string;
  status: "approved" | "rejected" | "executed" | "cancelled" | "expired";
  approvedBy: string[];
  approvedAt: string | null;
  executedAt: string | null;
  evidenceLedgerId: string;
}

// ---------------------------------------------------------------------------
// Promotion Workflow (dependency-aware)
// ---------------------------------------------------------------------------

export interface PromotionWorkflowInput {
  service: string;
  fromEnvironment: Environment;
  toEnvironment: Environment;
  imageTag: string;
  gitCommitSha: string;
  initiatedBy: string;
  dependencies: PromotionDependency[];
  approvalRequired: boolean;
  changeWindowId: string | null;
}

export interface PromotionDependency {
  service: string;
  minimumVersion: string;
  environment: Environment;
}

export interface PromotionWorkflowResult {
  promoted: boolean;
  service: string;
  toEnvironment: Environment;
  imageTag: string;
  deployedAt: string | null;
  approvalTraceId: string | null;
  dependencyChecks: DependencyCheckResult[];
  evidenceLedgerId: string;
}

export interface DependencyCheckResult {
  service: string;
  requiredVersion: string;
  actualVersion: string;
  passed: boolean;
}

// ---------------------------------------------------------------------------
// Evidence Collection Workflow
// ---------------------------------------------------------------------------

export interface EvidenceCollectionWorkflowInput {
  incidentId: string;
  collectionScope: {
    services: string[];
    environment: Environment;
    fromTimestamp: string;
    toTimestamp: string;
  };
  evidenceTypes: EvidenceType[];
  requestedBy: string;
  timeoutMs: number;
}

export type EvidenceType =
  | "logs"
  | "traces"
  | "metrics"
  | "proof-chain-entries"
  | "deployment-history"
  | "approval-records"
  | "policy-evaluations";

export interface EvidenceCollectionWorkflowResult {
  evidenceLedgerId: string;
  collectedAt: string;
  evidenceItems: EvidenceItem[];
  totalItems: number;
  failedCollections: string[];
}

export interface EvidenceItem {
  evidenceType: EvidenceType;
  service: string;
  collectedAt: string;
  itemCount: number;
  storageRef: string;             // reference to evidence in storage (not raw data)
  checksum: string;
}

// ---------------------------------------------------------------------------
// Ingestion Sync Workflow (long-running)
// ---------------------------------------------------------------------------

export interface IngestionSyncWorkflowInput {
  connectorId: string;
  sourceType: string;
  targetDomain: string;
  batchSize: number;
  continuationToken: string | null;
  tenantId: string;
  maxRecordsPerRun: number;
  retryPolicy: {
    maxAttempts: number;
    initialIntervalMs: number;
    backoffCoefficient: number;
    maxIntervalMs: number;
  };
}

export interface IngestionSyncWorkflowResult {
  connectorId: string;
  recordsIngested: number;
  recordsFailed: number;
  continuationToken: string | null;
  hasMore: boolean;
  completedAt: string;
  nextScheduledAt: string | null;
}
