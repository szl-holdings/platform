/**
 * @szl/substrate — Workflow Seed Data
 *
 * Deterministic seed examples for every workflow in the substrate.
 * Used by end-to-end tests, dry-run demos, and storybook fixtures.
 * All seeds produce realistic but fictional data — safe for demos.
 */

// ─── Phase 1 Reference Workflow Seeds ────────────────────────────────────────

export const opportunityAuditSeed = {
  input: {
    domain: "lyte",
    services: ["lyte-api-gateway", "lyte-data-pipeline"],
    timeWindowHours: 24,
    requestedBy: "seed-test",
    sessionId: "seed-opportunity-audit-001",
  },
  expectedStages: ["retrieve-lyte-data", "reason-anomalies", "verify-findings", "approval-gate", "decide-remediation"],
};

// ─── Phase 2 Reference Workflow Seeds ────────────────────────────────────────

export const crossSystemReconciliationSeed = {
  input: {
    systemAId: "erp-production",
    systemBId: "finance-ledger",
    entityType: "invoice",
    entityIds: ["INV-00441", "INV-00442", "INV-00443"],
    requestedBy: "seed-test",
    sessionId: "seed-reconciliation-001",
  },
  expectedStages: [
    "retrieve-system-a",
    "retrieve-system-b",
    "reason-discrepancies",
    "verify-discrepancies",
    "approval-gate",
    "decide-corrections",
  ],
};

export const executiveBriefSeed = {
  input: {
    domains: ["lyte", "aegis", "vessels", "terra"],
    lookbackHours: 24,
    audienceLevel: "executive" as const,
    requestedBy: "seed-test",
    sessionId: "seed-executive-brief-001",
  },
  expectedStages: ["retrieve-signals", "reason-brief", "verify-brief", "decide-publish"],
};

export const riskEscalationSeed = {
  input: {
    entityId: "ENTITY-ALPHA-001",
    entityType: "counterparty",
    domain: "vessels",
    escalationLevel: "high" as const,
    requestedBy: "seed-test",
    sessionId: "seed-risk-escalation-001",
  },
  expectedStages: [
    "retrieve-risk-signals",
    "reason-risk-score",
    "verify-risk-assessment",
    "approval-gate",
    "decide-escalation",
  ],
};

export const evidenceBasedRecommendationSeed = {
  input: {
    targetId: "ASSET-NYC-TOWER",
    targetType: "commercial-real-estate",
    domain: "terra",
    objective: "Determine whether to extend the master lease or initiate sale process",
    constraints: ["IRR > 12%", "Hold period <= 5 years"],
    requestedBy: "seed-test",
    sessionId: "seed-ebr-001",
  },
  expectedStages: [
    "retrieve-evidence",
    "reason-recommendation",
    "verify-recommendation",
    "approval-gate",
    "decide-recommendation",
  ],
};

// ─── Phase 2 Vertical Pack Seeds ─────────────────────────────────────────────

export const lyteOperationalDriftSeed = {
  input: {
    services: ["lyte-api-gateway", "lyte-scheduler", "lyte-data-pipeline"],
    lookbackHours: 72,
    driftThreshold: 0.15,
    requestedBy: "seed-test",
    sessionId: "seed-lyte-drift-001",
  },
  expectedStages: [
    "retrieve-drift-signals",
    "reason-drift-analysis",
    "verify-drift-findings",
    "approval-gate",
    "decide-drift-response",
  ],
};

export const aegisThreatTriageSeed = {
  input: {
    lookbackHours: 24,
    minSeverity: "medium" as const,
    requestedBy: "seed-test",
    sessionId: "seed-aegis-triage-001",
  },
  expectedStages: [
    "retrieve-threat-signals",
    "reason-triage",
    "verify-triage",
    "approval-gate",
    "decide-routing",
  ],
};

export const vesselsVoyageAnomalySeed = {
  input: {
    vesselIds: ["IMO-9876543", "IMO-1234567"],
    lookbackHours: 48,
    requestedBy: "seed-test",
    sessionId: "seed-vessels-anomaly-001",
  },
  expectedStages: [
    "retrieve-voyage-events",
    "reason-anomaly-detection",
    "verify-anomalies",
    "approval-gate",
    "decide-escalation",
  ],
};

export const terraPortfolioAnomalySeed = {
  input: {
    portfolioId: "PORTFOLIO-US-CORE",
    lookbackDays: 30,
    requestedBy: "seed-test",
    sessionId: "seed-terra-anomaly-001",
  },
  expectedStages: [
    "retrieve-portfolio-signals",
    "reason-portfolio-anomaly",
    "verify-anomalies",
    "approval-gate",
    "decide-portfolio-action",
  ],
};

export const prismCounselEvidencePackagingSeed = {
  input: {
    matterIds: ["MTR-2024-0108", "MTR-2024-0072"],
    lookAheadDays: 14,
    includePrivileged: false,
    requestedBy: "seed-test",
    sessionId: "seed-counsel-evidence-001",
  },
  expectedStages: [
    "retrieve-matter-records",
    "reason-evidence-packaging",
    "verify-evidence-package",
    "approval-gate",
    "decide-deadline-escalation",
  ],
};

export const carlotaJoTaskRoutingSeed = {
  input: {
    clientId: "CLIENT-MERIDIAN-001",
    taskTitle: "Strategic diagnostic and competitive positioning review",
    taskDescription: "Client requires a 90-day strategic diagnostic with competitive positioning recommendations for their SMB advisory expansion.",
    taskType: "strategic-advisory",
    urgency: "standard" as const,
    requestedBy: "seed-test",
    sessionId: "seed-carlota-routing-001",
  },
  expectedStages: [
    "retrieve-client-context",
    "reason-task-routing",
    "verify-routing",
    "approval-gate",
    "decide-task-assignment",
  ],
};

// ─── Seed Registry ────────────────────────────────────────────────────────────

export const ALL_WORKFLOW_SEEDS = {
  "opportunity-audit": opportunityAuditSeed,
  "cross-system-reconciliation": crossSystemReconciliationSeed,
  "executive-brief": executiveBriefSeed,
  "risk-escalation": riskEscalationSeed,
  "evidence-based-recommendation": evidenceBasedRecommendationSeed,
  "lyte-operational-drift": lyteOperationalDriftSeed,
  "aegis-threat-triage": aegisThreatTriageSeed,
  "vessels-voyage-anomaly": vesselsVoyageAnomalySeed,
  "terra-portfolio-anomaly": terraPortfolioAnomalySeed,
  "prism-counsel-evidence-packaging": prismCounselEvidencePackagingSeed,
  "carlota-jo-task-routing": carlotaJoTaskRoutingSeed,
} as const;

export type WorkflowSeedKey = keyof typeof ALL_WORKFLOW_SEEDS;
