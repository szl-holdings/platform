/**
 * SZL Holdings — Aegis Trust Surface Model
 * Phase 9 (Operability & Governance)
 *
 * Defines the schema and read paths for the Aegis security trust surface:
 *   - Policy status
 *   - Supply-chain status
 *   - Vulnerability posture
 *   - Audit history
 *   - Exception workflows
 *
 * UI implementation: deferred to UX Normalization task.
 * This file defines the data contracts that the Aegis UI will consume.
 * Read paths are HTTP GET endpoints on api-server.
 */

// ---------------------------------------------------------------------------
// Policy Status
// ---------------------------------------------------------------------------

export type PolicyEvaluationOutcome = "allow" | "deny" | "warn" | "error";

export interface PolicyEvaluationRecord {
  evaluationId: string;
  policyId: string;
  policyTitle: string;
  packageName: string;            // OPA package (e.g. szl.ci, szl.manifest)
  inputSummary: string;           // redacted summary of input (no secrets)
  outcome: PolicyEvaluationOutcome;
  denialMessages: string[];
  warnMessages: string[];
  evaluatedAt: string;
  evaluationContext: {
    service: string;
    environment: string;
    triggeredBy: string;          // "ci" | "argo-cd" | "temporal" | "api"
    workflowRunId: string | null;
  };
}

export interface PolicyStatusSummary {
  totalEvaluations: number;
  allowCount: number;
  denyCount: number;
  warnCount: number;
  errorCount: number;
  blockRate: number;              // denyCount / totalEvaluations
  topDeniedPolicies: Array<{ policyId: string; denyCount: number }>;
  recentDenials: PolicyEvaluationRecord[];
  generatedAt: string;
}

/** Read path: GET /api/aegis/policy-status?days={days}&environment={env} */
export type PolicyStatusResponse = PolicyStatusSummary;

// ---------------------------------------------------------------------------
// Supply-Chain Status
// ---------------------------------------------------------------------------

export type SupplyChainSignalStatus = "passing" | "failing" | "warning" | "unknown";

export interface SupplyChainSignal {
  signalId: string;
  signalType:
    | "dependency-review"
    | "secret-scan"
    | "codeql"
    | "action-pinning"
    | "sbom"
    | "container-scan"
    | "license-compliance";
  status: SupplyChainSignalStatus;
  lastCheckedAt: string;
  details: string;
  ciWorkflowUrl: string | null;
}

export interface SupplyChainPosture {
  overallStatus: SupplyChainSignalStatus;
  signals: SupplyChainSignal[];
  unpinnedActions: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  licenseViolations: number;
  sbomsPresent: number;
  sbomsMissing: number;
  generatedAt: string;
}

/** Read path: GET /api/aegis/supply-chain */
export type SupplyChainResponse = SupplyChainPosture;

// ---------------------------------------------------------------------------
// Vulnerability Posture
// ---------------------------------------------------------------------------

export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "informational";
export type VulnerabilityStatus = "open" | "in-remediation" | "resolved" | "accepted-risk";

export interface VulnerabilityRecord {
  vulnId: string;
  cveId: string | null;
  title: string;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  affectedPackage: string;
  affectedServices: string[];
  detectedAt: string;
  resolvedAt: string | null;
  acceptedRiskBy: string | null;
  acceptedRiskExpiresAt: string | null;
  remediationUrl: string | null;
}

export interface VulnerabilityPosture {
  criticalOpen: number;
  highOpen: number;
  mediumOpen: number;
  lowOpen: number;
  totalOpen: number;
  meanTimeToRemediationDays: number | null;
  recentVulnerabilities: VulnerabilityRecord[];
  oldestOpenCritical: VulnerabilityRecord | null;
  generatedAt: string;
}

/** Read path: GET /api/aegis/vulnerabilities?severity={severity}&status={status} */
export type VulnerabilityResponse = VulnerabilityPosture;

// ---------------------------------------------------------------------------
// Audit History
// ---------------------------------------------------------------------------

export type AuditEventCategory =
  | "policy-evaluation"
  | "approval"
  | "deployment"
  | "secret-access"
  | "schema-migration"
  | "break-glass"
  | "ai-decision"
  | "proof-chain";

export interface AuditHistoryEvent {
  auditId: string;
  category: AuditEventCategory;
  actorId: string;
  actorType: "user" | "ci-bot" | "temporal-workflow" | "opa" | "argo-cd";
  timestamp: string;
  service: string;
  environment: string;
  action: string;
  outcome: "success" | "failure" | "blocked" | "pending";
  evidenceLedgerId: string | null;
  proofChainId: string | null;
  details: Record<string, unknown>;
}

export interface AuditHistorySummary {
  totalEvents: number;
  eventsByCategory: Record<AuditEventCategory, number>;
  recentEvents: AuditHistoryEvent[];
  retentionPolicy: string;        // e.g. "7 years per LOGGING_AND_RETENTION.md"
  generatedAt: string;
}

/** Read path: GET /api/aegis/audit?category={category}&days={days}&service={service} */
export type AuditHistoryResponse = AuditHistorySummary;

// ---------------------------------------------------------------------------
// Exception Workflows
// ---------------------------------------------------------------------------

export type ExceptionStatus = "pending-approval" | "approved" | "rejected" | "expired";

export interface PolicyException {
  exceptionId: string;
  policyId: string;
  policyTitle: string;
  requestedBy: string;
  requestedAt: string;
  justification: string;
  scope: {
    services: string[];
    environments: string[];
    expiresAt: string;
  };
  status: ExceptionStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  temporalWorkflowRunId: string | null;
  evidenceLedgerId: string | null;
}

export interface ExceptionWorkflowSummary {
  pendingCount: number;
  approvedCount: number;
  expiringWithin30Days: number;
  recentExceptions: PolicyException[];
  generatedAt: string;
}

/** Read path: GET /api/aegis/exceptions?status={status} */
export type ExceptionWorkflowResponse = ExceptionWorkflowSummary;

// ---------------------------------------------------------------------------
// Composite Aegis Trust Surface
// ---------------------------------------------------------------------------

/** Read path: GET /api/aegis/trust-surface — composite snapshot for the trust surface UI */
export interface AegisTrustSurface {
  generatedAt: string;
  trustScore: number;              // 0–100 composite trust score
  trustLevel: "high" | "medium" | "low" | "critical";
  policyStatus: PolicyStatusSummary;
  supplyChain: SupplyChainPosture;
  vulnerabilities: VulnerabilityPosture;
  pendingExceptions: PolicyException[];
  recentAuditEvents: AuditHistoryEvent[];
  openRisks: string[];            // summary of open risk items for executive view
}
