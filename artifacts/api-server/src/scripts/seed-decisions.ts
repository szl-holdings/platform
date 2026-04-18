/**
 * seed-decisions.ts
 *
 * Seeds the AI decision and execution audit trail:
 *   • alloy_ai_decisions          — AI-generated decision recommendations
 *   • szl_decisioning_runs        — ATLAS workflow execution runs
 *   • szl_decisioning_recommendations — structured recommendations
 *   • szl_policy_violations       — policy gate breaches
 *   • agent_knowledge             — agent knowledge base entries
 *   • agent_runs                  — agent execution history
 *
 * Idempotent: skips if data already present.
 */

import {
  db,
  alloyAiDecisions,
  szlDecisioningRunsTable,
  szlDecisioningRecommendationsTable,
  szlPolicyViolationsTable,
  agentKnowledgeTable,
  agentRunsTable,
} from "@szl-holdings/db";
import { randomUUID } from "crypto";

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function hoursAgo(n: number) { return new Date(Date.now() - n * 3600000); }

const DOMAINS = ["aegis", "vessels", "terra", "lyte", "carlota-jo", "platform"] as const;

const WORKFLOWS = [
  { id: "wf-aegis-patch-001", name: "Security Patch Deployment — payment-api-v3", domain: "aegis" },
  { id: "wf-terra-outreach-002", name: "Distress Property Outreach — 234 W 145th St", domain: "terra" },
  { id: "wf-vessels-screening-003", name: "AIS Anomaly Review — IMO 9876543", domain: "vessels" },
  { id: "wf-lyte-escalation-004", name: "Revenue Anomaly Escalation — PRISM ARR", domain: "lyte" },
  { id: "wf-aegis-iam-005", name: "IAM Policy Remediation — Azure AD Admin", domain: "aegis" },
  { id: "wf-terra-model-006", name: "Valuation Model Refresh — Brooklyn Multifamily", domain: "terra" },
  { id: "wf-vessels-reroute-007", name: "Red Sea Re-routing Authorization — MV Atlantic Voyager", domain: "vessels" },
  { id: "wf-platform-backup-008", name: "Disaster Recovery Drill — Backup Validation", domain: "platform" },
  { id: "wf-aegis-redteam-009", name: "Red Team Finding Triage — Q1 Assessment", domain: "aegis" },
  { id: "wf-lyte-nrr-010", name: "NRR Calculation Audit — Vessels TTM vs 6-month", domain: "lyte" },
];

export async function seedDecisions() {
  console.log("[seed-decisions] Starting AI decisions + decisioning runs seed...");
  // Each insert below uses onConflictDoNothing() on stable IDs — fully idempotent per row.
  // No early-exit skip needed; partial failures are healed on rerun.

  // ── AI Decisions ─────────────────────────────────────────────────────────────

  const aiDecisions: (typeof alloyAiDecisions.$inferInsert)[] = [
    {
      decisionId: "dec-001",
      orgId: 1,
      workflowId: "wf-aegis-patch-001",
      signalIds: ["aegis-asset-payment-api-v3", "aegis-finding-idor-cvss-9-3"],
      recommendedAction: "Deploy emergency security patch to payment-api-v3 — approve in next 2 hours",
      rationaleSummary: "CVSS 9.3 IDOR vulnerability in payment API. Active exploitation window exists. Patch tested in staging — no regressions. Risk of non-action: $4.2M payment data exposure.",
      evidenceRefs: [
        { type: "finding", id: "aegis-asset-payment-api-v3", label: "IDOR finding — payment-api-v3" },
        { type: "incident", id: "inc-aegis-2026-001", label: "Active threat monitoring — confirmed exploitation attempt" },
      ],
      confidence: 0.96,
      ownerSuggestion: "security-ops@szlholdings.com",
      approvalRequired: true,
      riskLevel: "critical",
      fallbackPlan: "Take payment-api-v3 offline and redirect to v2 failover endpoint if patch deployment fails",
      modelRoute: "gpt-4o",
      schemaVersion: "2.1",
      status: "approved",
      approvedBy: "stephen@szlholdings.com",
      approvedAt: hoursAgo(4),
      rawInput: JSON.stringify({ finding: "IDOR in payment API", cvss: 9.3, affected_asset: "payment-api-v3" }),
      rawOutput: JSON.stringify({ recommendation: "immediate_patch", confidence: 0.96 }),
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(4),
    },
    {
      decisionId: "dec-002",
      orgId: 1,
      workflowId: "wf-terra-outreach-002",
      signalIds: ["terra-distress-dp-seed-002", "terra-auction-alert-145th"],
      recommendedAction: "Authorize letter of intent submission for 234 W 145th St — auction window closes April 10",
      rationaleSummary: "Opportunity score 92/100. 283 days in distress. Auction April 10. Comparable analysis confirms 8% below-market entry. Projected IRR 18.4% at hold-to-sell exit.",
      evidenceRefs: [
        { type: "property", id: "dp-seed-002", label: "234 W 145th St — distress property" },
        { type: "signal", id: "terra-auction-signal-002", label: "Auction deadline alert — 11 days" },
      ],
      confidence: 0.89,
      ownerSuggestion: "terra-acquisitions@szlholdings.com",
      approvalRequired: true,
      riskLevel: "high",
      fallbackPlan: "If LOI rejected, place property on watch list and monitor for REO conversion",
      modelRoute: "gpt-4o",
      schemaVersion: "2.1",
      status: "proposed",
      rawInput: JSON.stringify({ property: "dp-seed-002", opportunity_score: 92, days_in_distress: 283 }),
      rawOutput: JSON.stringify({ recommendation: "submit_loi", confidence: 0.89 }),
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(12),
    },
    {
      decisionId: "dec-003",
      orgId: 1,
      workflowId: "wf-vessels-screening-003",
      signalIds: ["vessels-dark-imo-9876543", "vessels-sanctions-screen-001"],
      recommendedAction: "Clear IMO 9876543 — secondary OFAC screening complete, no match, resume normal tracking",
      rationaleSummary: "18-hour AIS dark period resolved. OFAC API re-query: no match on vessel, operator, or last 3 port calls.",
      evidenceRefs: [
        { type: "vessel", id: "vessel-imo-9876543", label: "MV Horizon Star — AIS dark period" },
        { type: "screening", id: "ofac-screen-2026-0148", label: "OFAC API screening result" },
      ],
      confidence: 0.93,
      ownerSuggestion: "vessels-compliance@szlholdings.com",
      approvalRequired: false,
      riskLevel: "medium",
      fallbackPlan: "If additional anomalies detected within 72 hours, escalate to Tier-1 compliance review",
      modelRoute: "gpt-4o",
      schemaVersion: "2.1",
      status: "executed",
      executedAt: daysAgo(5),
      executionOutcome: "Vessel cleared. Normal AIS monitoring resumed.",
      rawInput: JSON.stringify({ imo: "9876543", dark_period_hours: 18, ofac_result: "no_match" }),
      rawOutput: JSON.stringify({ recommendation: "clear", confidence: 0.93 }),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      decisionId: "dec-004",
      orgId: 1,
      workflowId: "wf-lyte-escalation-004",
      signalIds: ["lyte-signal-prism-latency"],
      recommendedAction: "Escalate PRISM document review latency spike to infrastructure team — SLA at risk",
      rationaleSummary: "P95 latency up 340% over 4-hour window. Pattern consistent with DB connection pool contention. 14 active matters at risk of SLA breach.",
      evidenceRefs: [{ type: "signal", id: "lyte-signal-prism-latency", label: "Lyte latency spike — PRISM pipeline" }],
      confidence: 0.84,
      ownerSuggestion: "platform-ops@szlholdings.com",
      approvalRequired: false,
      riskLevel: "medium",
      fallbackPlan: "Route PRISM review pipeline to dedicated DB replica if primary pool remains saturated",
      modelRoute: "claude-3-5-sonnet",
      schemaVersion: "2.1",
      status: "executed",
      executedAt: daysAgo(2),
      executionOutcome: "Escalated. Platform ops routed pipeline to replica — latency resolved within 20 minutes.",
      rawInput: JSON.stringify({ service: "prism-review-pipeline", p95_latency_ms: 8400, baseline_ms: 2100 }),
      rawOutput: JSON.stringify({ recommendation: "escalate", confidence: 0.84 }),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      decisionId: "dec-005",
      orgId: 1,
      workflowId: "wf-aegis-iam-005",
      signalIds: ["finding-azure-ad-001", "firestorm-alert-mfa-gap"],
      recommendedAction: "Enforce MFA on all Azure AD admin accounts — estimated 4-hour rollout, 0 business disruption",
      rationaleSummary: "4 admin accounts without MFA enforcement. CVSS 9.0. Rollout plan tested — push notification method compatible with all enrolled devices.",
      evidenceRefs: [
        { type: "finding", id: "finding-azure-ad-001", label: "Azure AD MFA enforcement gap" },
        { type: "asset", id: "asset-azure-ad-tenant", label: "Azure AD tenant — admin accounts" },
      ],
      confidence: 0.91,
      ownerSuggestion: "security-ops@szlholdings.com",
      approvalRequired: true,
      riskLevel: "critical",
      fallbackPlan: "If MFA enforcement causes lockout, break-glass procedure documented in Vault-prod",
      modelRoute: "gpt-4o",
      schemaVersion: "2.1",
      status: "approved",
      approvedBy: "stephen@szlholdings.com",
      approvedAt: daysAgo(3),
      rawInput: JSON.stringify({ affected_accounts: 4, finding: "azure-ad-mfa-gap", cvss: 9.0 }),
      rawOutput: JSON.stringify({ recommendation: "enforce_mfa", confidence: 0.91 }),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    ...Array.from({ length: 25 }, (_, i) => ({
      decisionId: `dec-auto-${String(i + 6).padStart(3, "0")}`,
      orgId: 1,
      workflowId: WORKFLOWS[i % WORKFLOWS.length]!.id,
      signalIds: [`signal-${DOMAINS[i % DOMAINS.length]}-${i}`],
      recommendedAction: [
        "Rotate API credentials for affected service — low disruption, automated rollout",
        "Add rate limiting to identified endpoint — deploy via CI/CD pipeline",
        "Update dependency to patched version — staging tests passing",
        "Escalate anomaly to on-call engineer — SLA risk if unresolved in 90 minutes",
        "Archive stale Constellation nodes — confidence below threshold for 7+ days",
        "Refresh model inputs with latest market data — accuracy improvement estimated 12%",
        "Initiate outreach to distress property owner — acquisition window open 14 days",
        "Flag vessel for enhanced screening — AIS behavior inconsistent with declared route",
        "Generate investor update for LP portal — Q1 metrics finalized",
        "Trigger governance review — cost ceiling approach detected on agent workflow",
      ][i % 10]!,
      rationaleSummary: `Automated recommendation from ${DOMAINS[i % DOMAINS.length]} domain signal analysis. Confidence reflects signal quality and historical accuracy.`,
      evidenceRefs: [{ type: "signal", id: `signal-auto-${i}`, label: `Automated signal — ${DOMAINS[i % DOMAINS.length]}` }],
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)),
      ownerSuggestion: "ops-team@szlholdings.com",
      approvalRequired: i % 3 === 0,
      riskLevel: (["low", "low", "medium", "medium", "high", "critical"] as const)[i % 6]!,
      fallbackPlan: "Escalate to human operator if automated resolution fails within defined timeout.",
      modelRoute: i % 2 === 0 ? "gpt-4o" : "claude-3-5-sonnet",
      schemaVersion: "2.1",
      status: (["proposed", "proposed", "approved", "executed", "rejected"] as const)[i % 5]!,
      rawInput: JSON.stringify({ domain: DOMAINS[i % DOMAINS.length], signal_index: i }),
      rawOutput: JSON.stringify({ recommendation_index: i }),
      createdAt: daysAgo(i % 14),
      updatedAt: daysAgo(i % 14),
    })),
  ];

  await db.insert(alloyAiDecisions).values(aiDecisions).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${aiDecisions.length} AI decisions`);

  // ── Decisioning Runs ──────────────────────────────────────────────────────────

  const decisioningRuns: (typeof szlDecisioningRunsTable.$inferInsert)[] = WORKFLOWS.flatMap((wf, wfIdx) =>
    Array.from({ length: 3 }, (_, runIdx) => {
      const daysBack = wfIdx * 2 + runIdx * 5;
      const status: "completed" | "dry_run" | "simulated" = runIdx === 0 ? "completed" : runIdx === 1 ? "dry_run" : "simulated";
      const outcome: "success" | undefined = runIdx === 0 ? "success" : undefined;
      const durationMs = 800 + Math.floor(Math.random() * 4200);
      return {
        runId: `run-${wf.id}-${runIdx + 1}`,
        workflowId: wf.id,
        workflowName: wf.name,
        domain: wf.domain,
        status,
        initiatedBy: "atlas-scheduler@szlholdings.com",
        approvedBy: runIdx === 0 && wfIdx % 3 === 0 ? "stephen@szlholdings.com" : undefined,
        tenantId: "org-1",
        isDryRun: runIdx === 1,
        isSimulation: runIdx === 2,
        requiresApproval: wfIdx % 3 === 0,
        durationMs,
        steps: [
          { step: 1, name: "Signal collection", status: "completed", durationMs: Math.round(durationMs * 0.15) },
          { step: 2, name: "Policy evaluation", status: "completed", durationMs: Math.round(durationMs * 0.20) },
          { step: 3, name: "Decision generation", status: "completed", durationMs: Math.round(durationMs * 0.35) },
          { step: 4, name: "Action execution", status: outcome === "success" ? "completed" : "skipped", durationMs: Math.round(durationMs * 0.30) },
        ],
        auditTrail: [
          { action: "workflow_started", actor: "atlas-scheduler", timestamp: daysAgo(daysBack).toISOString() },
          { action: "policy_checked", actor: "policy-engine", result: "pass", timestamp: new Date(daysAgo(daysBack).getTime() + durationMs * 0.4).toISOString() },
          { action: "workflow_completed", actor: "atlas-scheduler", timestamp: new Date(daysAgo(daysBack).getTime() + durationMs).toISOString() },
        ],
        policyEvaluation: { passed: true, policiesChecked: 3 + wfIdx % 4, violationsFound: 0 },
        cost: { modelTokens: 1200 + Math.floor(Math.random() * 3000), estimatedUsd: parseFloat((0.01 + Math.random() * 0.40).toFixed(4)) },
        outcome,
        outcomeSummary: outcome === "success" ? `${wf.name} completed successfully in ${durationMs}ms — all policy gates passed` : undefined,
        outcomeImpact: outcome === "success" ? { riskReduction: "moderate", entitiesAffected: 1 + wfIdx % 3 } : {},
        outcomeRecordedAt: outcome === "success" ? daysAgo(daysBack) : undefined,
        outcomeRecordedBy: outcome === "success" ? "atlas-scheduler@szlholdings.com" : undefined,
        metadata: { narrativeId: `narrative-${wf.domain}`, triggerSource: "scheduler" },
        startedAt: daysAgo(daysBack),
        completedAt: new Date(daysAgo(daysBack).getTime() + durationMs),
        createdAt: daysAgo(daysBack),
      };
    }),
  );

  await db.insert(szlDecisioningRunsTable).values(decisioningRuns).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${decisioningRuns.length} decisioning runs`);

  // ── Decisioning Recommendations ───────────────────────────────────────────────

  const recommendations: (typeof szlDecisioningRecommendationsTable.$inferInsert)[] = [
    {
      sessionId: "session-atlas-q2-001",
      recommendationId: "rec-atlas-001",
      title: "Critical Patch Required — payment-api-v3 IDOR (CVSS 9.3)",
      description: "IDOR vulnerability in payment API allows unauthorized access to other users' transaction data. Emergency patch available and tested.",
      domain: "aegis",
      action: "Deploy hotfix v3.2.1 immediately — patch pre-staged in release registry",
      priorityScore: 0.96,
      confidence: 0.96,
      urgency: "critical",
      businessImpact: { riskExposureUsd: 4_200_000, slaImpact: "none", userImpact: "payment_data_exposure" },
      signals: [{ id: "aegis-asset-payment-api-v3", type: "security_finding", severity: "critical" }],
      evidence: [{ type: "finding", id: "aegis-asset-payment-api-v3", label: "IDOR finding — payment-api-v3", cvss: 9.3 }],
      reasoning: "CVSS 9.3 confirmed by red team. Active monitoring shows 3 probe attempts in past 6 hours. Patch tested in staging with 0 regression failures.",
      policyState: "requires_approval",
      policyEvaluation: { passed: true, requiresApproval: true, approvedBy: "stephen@szlholdings.com" },
      requiredRoles: ["super_admin", "security-ops"],
      estimatedEffortHours: 2,
      estimatedCostUsd: 0,
      suggestedOwner: "security-ops",
      isActionable: true,
      tenantId: "org-1",
      initiatedBy: "aegis-soar-engine",
      metadata: { narrativeId: "narrative-security-soc", runId: "run-wf-aegis-patch-001-1" },
      evaluatedAt: hoursAgo(6),
      createdAt: hoursAgo(6),
    },
    {
      sessionId: "session-atlas-q2-001",
      recommendationId: "rec-atlas-002",
      title: "Acquisition Window — 234 W 145th St, Manhattan",
      description: "Auction April 10. Opportunity score 92. Below-market debt load. Recommend LOI submission within 48 hours.",
      domain: "terra",
      action: "Submit non-binding letter of intent to 145th Holdings LLC — acquisition team to lead",
      priorityScore: 0.89,
      confidence: 0.89,
      urgency: "urgent",
      businessImpact: { estimatedMarginUsd: 1_400_000, acquisitionPriceUsd: 4_200_000, projectedIrr: 0.184 },
      signals: [{ id: "terra-distress-dp-seed-002", type: "distress_signal", severity: "high" }],
      evidence: [{ type: "property", id: "dp-seed-002", label: "234 W 145th St", opportunityScore: 92 }],
      reasoning: "283 days in distress. No cure plan on file. Auction scheduled in 11 days. Model projects 18.4% IRR at hold-to-sell 5-year exit.",
      policyState: "requires_approval",
      policyEvaluation: { passed: true, requiresApproval: true },
      requiredRoles: ["super_admin", "terra-acquisitions"],
      estimatedEffortHours: 8,
      estimatedCostUsd: 4_200_000,
      suggestedOwner: "terra-acquisitions",
      isActionable: true,
      tenantId: "org-1",
      initiatedBy: "terra-intelligence-agent",
      metadata: { narrativeId: "narrative-business-revops", runId: "run-wf-terra-outreach-002-1" },
      evaluatedAt: hoursAgo(12),
      createdAt: hoursAgo(12),
    },
    {
      sessionId: "session-atlas-q2-001",
      recommendationId: "rec-atlas-003",
      title: "Vessels Sanctions Screening — IMO 9876543 Cleared",
      description: "18-hour AIS dark period resolved. OFAC re-query: no match. Route consistent with declared manifest.",
      domain: "vessels",
      action: "Mark vessel clear — resume standard AIS monitoring cadence",
      priorityScore: 0.78,
      confidence: 0.93,
      urgency: "moderate",
      businessImpact: { delayAvoidedUsd: 120_000, delayAvoidedPerDay: 120_000, daysOnHold: 1 },
      signals: [{ id: "vessels-dark-imo-9876543", type: "ais_anomaly", severity: "medium" }],
      evidence: [{ type: "screening", id: "ofac-screen-2026-0148", label: "OFAC API screening", result: "no_match" }],
      reasoning: "Secondary OFAC screening complete. Port call history verified. Analyst dissent reviewed and addressed.",
      policyState: "allowed",
      policyEvaluation: { passed: true, requiresApproval: false },
      requiredRoles: ["vessels-compliance"],
      estimatedEffortHours: 0.5,
      estimatedCostUsd: 0,
      suggestedOwner: "vessels-compliance",
      isActionable: true,
      tenantId: "org-1",
      initiatedBy: "vessels-sanctions-screener",
      metadata: { runId: "run-wf-vessels-screening-003-1" },
      evaluatedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    ...Array.from({ length: 20 }, (_, i) => ({
      sessionId: "session-atlas-q2-auto",
      recommendationId: `rec-auto-${String(i + 4).padStart(3, "0")}`,
      title: `Automated recommendation — ${DOMAINS[i % DOMAINS.length]} domain (${i + 1})`,
      description: `Signal aggregated from ${DOMAINS[i % DOMAINS.length]} domain pipeline. Routine monitoring recommendation.`,
      domain: DOMAINS[i % DOMAINS.length]!,
      action: ["Monitor and log", "Escalate if threshold exceeded", "Auto-remediate", "Notify owner", "Archive stale record"][i % 5]!,
      priorityScore: parseFloat((0.40 + Math.random() * 0.50).toFixed(2)),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)),
      urgency: (["routine", "routine", "moderate", "urgent", "critical"] as const)[i % 5]!,
      businessImpact: {},
      signals: [{ id: `signal-auto-${i}`, type: "platform_signal", domain: DOMAINS[i % DOMAINS.length] }],
      evidence: [],
      reasoning: `Routine recommendation from automated platform monitoring.`,
      policyState: (["allowed", "allowed", "requires_approval", "allowed", "blocked"] as const)[i % 5]!,
      policyEvaluation: { passed: true },
      requiredRoles: [] as string[],
      estimatedEffortHours: 0.5 + i % 4,
      suggestedOwner: "ops-team",
      isActionable: true,
      tenantId: "org-1",
      initiatedBy: `${DOMAINS[i % DOMAINS.length]}-agent`,
      metadata: {},
      evaluatedAt: daysAgo(i % 14),
      createdAt: daysAgo(i % 14),
    })),
  ];

  await db.insert(szlDecisioningRecommendationsTable).values(recommendations).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${recommendations.length} decisioning recommendations`);

  // ── Policy Violations ─────────────────────────────────────────────────────────

  const policyViolations: (typeof szlPolicyViolationsTable.$inferInsert)[] = [
    {
      policyId: "policy-cost-ceiling-production",
      policyName: "Production AI Model Approval Gate",
      ruleName: "per-call-cost-ceiling",
      effect: "warn",
      action: "agent.run.cost.exceeded",
      domain: "lyte",
      subjectId: "lyte-revenue-intelligence",
      subjectRoles: ["agent"],
      resourceType: "agent_run",
      resourceId: "run-wf-lyte-escalation-004-1",
      reason: "Agent run exceeded per-call cost ceiling of $0.50 — actual cost $0.78 on PRISM escalation workflow",
      estimatedCostUsd: 0.78,
      confidence: 0.99,
      runId: "run-wf-lyte-escalation-004-1",
      tenantId: "org-1",
      metadata: { suggestedRemediation: "Review token budget. Consider summarization pre-pass." },
      occurredAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      policyId: "policy-approval-gate-production",
      policyName: "Production AI Model Approval Gate",
      ruleName: "confidence-threshold-check",
      effect: "warn",
      action: "agent.playbook.auto_triggered",
      domain: "aegis",
      subjectId: "aegis-soar-engine",
      subjectRoles: ["agent", "soar"],
      resourceType: "incident",
      resourceId: "inc-ransomware-2026-001",
      reason: "Automated playbook triggered without required sign-off — confidence 67% below PSP-2024-07 threshold of 80%",
      confidence: 0.67,
      runId: "run-wf-aegis-redteam-009-1",
      tenantId: "org-1",
      metadata: { suggestedRemediation: "Raise auto-trigger threshold to 80% confidence in PSP-2024-07." },
      occurredAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      policyId: "policy-approval-gate-production",
      policyName: "Production AI Model Approval Gate",
      ruleName: "binding-decision-approval",
      effect: "require_approval",
      action: "terra.acquisition.loi.submit",
      domain: "terra",
      subjectId: "terra-intelligence-agent",
      subjectRoles: ["agent"],
      resourceType: "property",
      resourceId: "dp-seed-002",
      reason: "LOI submission for $4.2M acquisition requires senior operator approval per binding-decision policy",
      estimatedCostUsd: 4_200_000,
      confidence: 0.89,
      runId: "run-wf-terra-outreach-002-1",
      recommendationId: "rec-atlas-002",
      tenantId: "org-1",
      metadata: { approvalRequired: true, requiredApprover: "super_admin" },
      occurredAt: hoursAgo(12),
      createdAt: hoursAgo(12),
    },
  ];

  await db.insert(szlPolicyViolationsTable).values(policyViolations).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${policyViolations.length} policy violations`);

  // ── Agent Knowledge ───────────────────────────────────────────────────────────

  const knowledgeEntries: (typeof agentKnowledgeTable.$inferInsert)[] = [
    {
      entryId: "k-aegis-001",
      type: "threat_intelligence",
      domain: "aegis",
      sourceAgent: "aegis-threat-intel",
      title: "Payment API IDOR Pattern — Active Exploitation Probes",
      summary: "IDOR in payment-api-v3 /api/payments/transactions/{id} allows sequential ID enumeration. 3 probe attempts detected in past 6h. Patch pre-staged.",
      confidence: 0.96,
      tags: ["idor", "payment-api", "critical", "active-threat"],
      relatedEntryIds: ["k-aegis-002"],
      data: { cvss: 9.3, assetId: "payment-api-v3", probeAttempts: 3, patchReady: true },
      timestamp: hoursAgo(6).getTime(),
    },
    {
      entryId: "k-aegis-002",
      type: "asset_context",
      domain: "aegis",
      sourceAgent: "aegis-asset-scanner",
      title: "payment-api-v3 — Full Asset Context",
      summary: "Production payment API. 47 endpoints. $2.4M daily transaction volume. Last scanned 30 minutes ago. 4 critical, 9 high findings open.",
      confidence: 0.99,
      tags: ["payment-api", "production", "critical-asset"],
      relatedEntryIds: ["k-aegis-001"],
      data: { assetId: "payment-api-v3", criticalFindings: 4, highFindings: 9, dailyTransactionVolume: 2_400_000 },
      timestamp: hoursAgo(0.5).getTime(),
    },
    {
      entryId: "k-terra-001",
      type: "market_intelligence",
      domain: "terra",
      sourceAgent: "terra-market-intel",
      title: "Harlem Multifamily — Q1 2026 Comp Update",
      summary: "Q1 2026 comparables show 8-12% discount to 2025 peak valuations. Auction properties clearing at 94-96% of appraised value.",
      confidence: 0.87,
      tags: ["harlem", "multifamily", "comparables", "q1-2026"],
      relatedEntryIds: ["k-terra-002"],
      data: { market: "upper-manhattan", discountRange: [0.08, 0.12], clearanceRate: [0.94, 0.96] },
      timestamp: daysAgo(3).getTime(),
    },
    {
      entryId: "k-terra-002",
      type: "opportunity_analysis",
      domain: "terra",
      sourceAgent: "terra-opportunity-scorer",
      title: "234 W 145th St — Acquisition Analysis",
      summary: "Opportunity score 92. 283 days distress. Auction Apr 10. Model: 18.4% IRR at 5-year hold-to-sell.",
      confidence: 0.89,
      tags: ["145th-st", "manhattan", "auction", "high-opportunity"],
      relatedEntryIds: ["k-terra-001"],
      data: { propertyId: "dp-seed-002", opportunityScore: 92, projectedIrr: 0.184, auctionDate: "2026-04-10" },
      timestamp: daysAgo(1).getTime(),
    },
    {
      entryId: "k-vessels-001",
      type: "compliance_check",
      domain: "vessels",
      sourceAgent: "vessels-sanctions-screener",
      title: "IMO 9876543 — OFAC Screening Result",
      summary: "MV Horizon Star. OFAC API re-query on 2026-04-13. No match on vessel, operator, or last 3 port calls. AIS dark period route-consistent.",
      confidence: 0.93,
      tags: ["imo-9876543", "ofac", "cleared", "ais-dark-period"],
      relatedEntryIds: [],
      data: { imo: "9876543", ofacResult: "no_match", darkPeriodHours: 18, routeConsistent: true },
      timestamp: daysAgo(5).getTime(),
    },
    {
      entryId: "k-lyte-001",
      type: "revenue_signal",
      domain: "lyte",
      sourceAgent: "lyte-revenue-intelligence",
      title: "Vessels ARR — Q2 Tracking Above Plan",
      summary: "Vessels Maritime ARR tracking $200K above Q2 plan. NRR TTM 119%. Two enterprise expansion events in Q1.",
      confidence: 0.91,
      tags: ["vessels", "arr", "nrr", "above-plan"],
      relatedEntryIds: [],
      data: { entity: "vessels-maritime", arrVsPlan: 200_000, nrrTtm: 1.19, quarter: "Q2-2026" },
      timestamp: daysAgo(2).getTime(),
    },
    ...Array.from({ length: 30 }, (_, i) => ({
      entryId: `k-auto-${String(i + 7).padStart(3, "0")}`,
      type: ["threat_intelligence", "market_intelligence", "asset_context", "revenue_signal", "compliance_check"][i % 5]!,
      domain: DOMAINS[i % DOMAINS.length]!,
      sourceAgent: `${DOMAINS[i % DOMAINS.length]}-agent`,
      title: `Automated knowledge entry — ${DOMAINS[i % DOMAINS.length]} domain signal ${i + 1}`,
      summary: `Signal aggregated from ${DOMAINS[i % DOMAINS.length]} domain pipeline. Confidence: ${(0.65 + Math.random() * 0.30).toFixed(2)}. Routine monitoring.`,
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)),
      tags: [DOMAINS[i % DOMAINS.length]!, "auto", "monitoring"],
      relatedEntryIds: [] as string[],
      data: { domain: DOMAINS[i % DOMAINS.length], signalIndex: i, automated: true },
      timestamp: daysAgo(i % 14).getTime(),
    })),
  ];

  await db.insert(agentKnowledgeTable).values(knowledgeEntries).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${knowledgeEntries.length} knowledge entries`);

  // ── Agent Runs ────────────────────────────────────────────────────────────────

  const agentRuns: (typeof agentRunsTable.$inferInsert)[] = WORKFLOWS.flatMap((wf, wfIdx) =>
    Array.from({ length: 4 }, (_, runIdx) => {
      const hoursBack = wfIdx * 8 + runIdx * 12;
      const durationMs = 500 + Math.floor(Math.random() * 3500);
      const status = runIdx === 3 ? "failed" : "completed";
      return {
        runId: `agent-run-${wf.id}-${runIdx + 1}`,
        agentId: `${wf.domain}-intelligence-agent`,
        domain: wf.domain,
        status,
        startedAt: hoursAgo(hoursBack).getTime(),
        completedAt: new Date(hoursAgo(hoursBack).getTime() + durationMs).getTime(),
        durationMs,
        summary: status === "completed"
          ? `${wf.name} — completed. ${1 + wfIdx % 4} knowledge entries created.`
          : `${wf.name} — failed after step 2. Timeout on external signal source.`,
        error: status === "failed" ? "External API timeout after 30s — retry scheduled" : undefined,
        knowledgeEntryIds: [`k-${wf.domain}-001`],
        eventsPublished: [`event-${wf.domain}-${wfIdx}`],
      };
    }),
  );

  await db.insert(agentRunsTable).values(agentRuns).onConflictDoNothing();
  console.log(`[seed-decisions] Inserted ${agentRuns.length} agent runs`);

  return {
    aiDecisions: aiDecisions.length,
    decisioningRuns: decisioningRuns.length,
    recommendations: recommendations.length,
    policyViolations: policyViolations.length,
    knowledgeEntries: knowledgeEntries.length,
    agentRuns: agentRuns.length,
  };
}
