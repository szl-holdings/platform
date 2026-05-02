/**
 * SZL Holdings — Lyte Operator Surface Model
 * Phase 8 (Operability & Governance)
 *
 * Defines the schema and read paths for the Lyte operator correlation surface:
 *   - Deployment state
 *   - Service health
 *   - Incident evidence
 *   - Service lineage / dependencies
 *   - Approval trace
 *   - Drift / policy violations
 *
 * UI implementation: deferred to UX Normalization task.
 * This file defines the data contracts that the UI will consume.
 * Read paths are HTTP GET endpoints on api-server (to be wired in Phase 9 / UX task).
 */

// ---------------------------------------------------------------------------
// Deployment State
// ---------------------------------------------------------------------------

export interface DeploymentState {
  serviceId: string;
  serviceName: string;
  domain: string;
  environment: "development" | "staging" | "production";
  currentVersion: string;
  previousVersion: string | null;
  deployedAt: string;            // ISO 8601 UTC
  deployedBy: string;            // user ID or "ci-bot"
  gitCommitSha: string;
  gitBranch: string;
  argoSyncStatus: "Synced" | "OutOfSync" | "Unknown" | "Progressing";
  argoHealthStatus: "Healthy" | "Degraded" | "Progressing" | "Missing" | "Unknown";
  approvalTraceId: string | null; // Temporal workflow run ID for the promotion approval
}

/** Read path: GET /api/lyte/deployments?env={env}&domain={domain} */
export interface DeploymentListResponse {
  deployments: DeploymentState[];
  totalCount: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Service Health
// ---------------------------------------------------------------------------

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceHealthSnapshot {
  serviceId: string;
  serviceName: string;
  domain: string;
  environment: string;
  status: HealthStatus;
  checkedAt: string;
  uptimePercent: number;
  p99LatencyMs: number | null;
  errorRatePercent: number | null;
  checks: Record<string, "ok" | string>;  // "ok" or error message
  sloTarget: number;                       // target availability % from slo.yaml
  sloActual: number | null;               // actual availability % (last 30d)
}

/** Read path: GET /api/lyte/health?env={env} */
export interface ServiceHealthListResponse {
  services: ServiceHealthSnapshot[];
  platformStatus: HealthStatus;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Incident Evidence
// ---------------------------------------------------------------------------

export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "open" | "investigating" | "mitigated" | "resolved";

export interface IncidentEvidence {
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  affectedDomains: string[];
  detectedAt: string;
  resolvedAt: string | null;
  mttrMinutes: number | null;
  evidenceLedgerIds: string[];    // lib/evidence-ledger entry IDs
  proofChainIds: string[];        // lib/proof-chain IDs for AI decisions during incident
  timeline: IncidentTimelineEvent[];
  postMortemUrl: string | null;
}

export interface IncidentTimelineEvent {
  timestamp: string;
  actor: string;
  action: string;
  details: Record<string, unknown>;
}

/** Read path: GET /api/lyte/incidents?status={status}&severity={severity} */
export interface IncidentListResponse {
  incidents: IncidentEvidence[];
  openCount: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Service Lineage / Dependencies
// ---------------------------------------------------------------------------

export interface ServiceNode {
  serviceId: string;
  serviceName: string;
  domain: string;
  type: "api" | "worker" | "spa" | "db" | "queue" | "external";
}

export interface ServiceEdge {
  from: string;                  // serviceId
  to: string;
  protocol: "http" | "grpc" | "amqp" | "postgres" | "redis" | "otlp";
  criticality: "required" | "optional";
  p99LatencyMs: number | null;
  errorRatePercent: number | null;
}

export interface ServiceLineageGraph {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  generatedAt: string;
  source: "backstage-catalog" | "otel-trace-analysis" | "static-config";
}

/** Read path: GET /api/lyte/lineage?service={serviceId}&depth={depth} */
export type ServiceLineageResponse = ServiceLineageGraph;

// ---------------------------------------------------------------------------
// Approval Trace
// ---------------------------------------------------------------------------

export type ApprovalOutcome = "approved" | "rejected" | "expired" | "pending";

export interface ApprovalTrace {
  workflowRunId: string;          // Temporal workflow run ID
  workflowType: string;           // e.g. "promotion-approval", "remediation-approval"
  initiatedBy: string;
  initiatedAt: string;
  targetService: string;
  targetEnvironment: string;
  targetVersion: string;
  policyId: string;               // OPA policy evaluated
  policyOutcome: "allowed" | "blocked";
  approvers: ApprovalStep[];
  finalOutcome: ApprovalOutcome;
  completedAt: string | null;
  durationMs: number | null;
}

export interface ApprovalStep {
  approverUserId: string;
  approverRole: string;
  requestedAt: string;
  respondedAt: string | null;
  decision: "approved" | "rejected" | "pending";
  notes: string | null;
}

/** Read path: GET /api/lyte/approvals?status={status}&service={service} */
export interface ApprovalListResponse {
  approvals: ApprovalTrace[];
  pendingCount: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Drift / Policy Violations
// ---------------------------------------------------------------------------

export type DriftSeverity = "critical" | "high" | "medium" | "low";
export type DriftStatus = "open" | "acknowledged" | "remediated" | "accepted";

export interface DriftViolation {
  violationId: string;
  serviceId: string;
  serviceName: string;
  environment: string;
  policyId: string;
  policyTitle: string;
  severity: DriftSeverity;
  status: DriftStatus;
  detectedAt: string;
  description: string;
  evidence: string;              // the specific diff / config that triggered the violation
  remediationWorkflowRunId: string | null;
  remediatedAt: string | null;
  exceptionGrantedBy: string | null;
  exceptionExpiresAt: string | null;
}

/** Read path: GET /api/lyte/drift?severity={severity}&status={status} */
export interface DriftListResponse {
  violations: DriftViolation[];
  criticalCount: number;
  openCount: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Composite Operator Surface
// ---------------------------------------------------------------------------

/** Read path: GET /api/lyte/surface — composite snapshot for the command center */
export interface LyteOperatorSurface {
  generatedAt: string;
  platformHealth: {
    overall: HealthStatus;
    servicesDown: number;
    servicesTotal: number;
    openIncidents: number;
    criticalDrift: number;
    pendingApprovals: number;
  };
  deployments: DeploymentState[];
  serviceHealth: ServiceHealthSnapshot[];
  openIncidents: IncidentEvidence[];
  pendingApprovals: ApprovalTrace[];
  criticalDrift: DriftViolation[];
}
