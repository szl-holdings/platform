import {
  db,
  alloyLegacyPoliciesTable,
  modelRoutingPoliciesTable,
  costBudgetsTable,
  costEventsTable,
  governanceIncidentsTable,
  complianceSuitabilityTable,
  complianceArchivalTable,
  complianceSupervisionQueueTable,
  complianceCalendarTable,
  complianceRiskScoreTable,
} from "@szl-holdings/db";
import { randomUUID } from "crypto";

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function daysAhead(n: number) { return new Date(Date.now() + n * 86400000); }

export async function seedGovernance() {
  console.log("[seed-governance] Starting Governance & Compliance seed...");

  const existing = await db.select({ id: alloyLegacyPoliciesTable.id }).from(alloyLegacyPoliciesTable).limit(1);
  if (existing.length > 0) {
    console.log("[seed-governance] Data already seeded, skipping.");
    return { skipped: true };
  }

  const ORG_ID = 1;

  const policies = await db.insert(alloyLegacyPoliciesTable).values([
    {
      orgId: ORG_ID,
      name: "Production AI Model Approval Gate",
      description: "Requires human approval for any AI-generated content, recommendation, or action that will be surfaced externally or used in a binding decision.",
      policyType: "approval_matrix",
      scope: "global",
      rules: [
        { trigger: "external_output", requiredApprover: "senior_operator", timeoutHours: 24 },
        { trigger: "binding_decision", requiredApprover: "super_admin", timeoutHours: 4 },
      ],
      isActive: true,
      priority: 10,
      complianceFramework: "SOC 2 Type II",
      createdBy: "stephen@szlholdings.com",
    },
    {
      orgId: ORG_ID,
      name: "Agent Cost Ceiling — Production",
      description: "Enforces maximum AI inference cost per agent run in the production environment. Blocks execution if per-call cost exceeds $0.50.",
      policyType: "cost_ceiling",
      scope: "global",
      rules: [
        { maxCostPerCall: 0.50, action: "block_and_alert", environment: "production" },
        { maxCostPerCall: 2.00, action: "alert_only", environment: "staging" },
      ],
      isActive: true,
      priority: 20,
      complianceFramework: "Internal Cost Controls",
      createdBy: "stephen@szlholdings.com",
    },
    {
      orgId: ORG_ID,
      name: "Sensitive Data Access Policy",
      description: "Controls which agent roles and users can access PII, financial records, and attorney-client privileged data. Enforces access logging.",
      policyType: "data_access",
      scope: "tenant",
      rules: [
        { resource: "pii", requiredRole: "operator", logAccess: true },
        { resource: "privileged_documents", requiredRole: "super_admin", logAccess: true, requireApproval: true },
        { resource: "financial_records", requiredRole: "analyst", logAccess: true },
      ],
      isActive: true,
      priority: 5,
      complianceFramework: "GDPR / CCPA",
      createdBy: "stephen@szlholdings.com",
    },
    {
      orgId: ORG_ID,
      name: "External Communication Agent Permission",
      description: "Controls which agents are permitted to send external communications (email, Slack messages, webhooks) on behalf of the organization.",
      policyType: "agent_permission",
      scope: "global",
      rules: [
        { action: "send_email", allowedAgents: ["communication-agent", "notification-agent"], requireApproval: true },
        { action: "send_slack", allowedAgents: ["notification-agent"], requireApproval: false },
        { action: "call_webhook", allowedAgents: ["integration-agent"], requireApproval: false },
      ],
      isActive: true,
      priority: 15,
      complianceFramework: "Internal Governance",
      createdBy: "alex@szlholdings.com",
    },
    {
      orgId: ORG_ID,
      name: "Compliance Template — SOC 2",
      description: "Automated compliance template mapping platform controls to SOC 2 Trust Service Criteria.",
      policyType: "compliance_template",
      scope: "global",
      rules: [
        { criteria: "CC6.1", control: "Access control — role-based permissions enforced", status: "compliant" },
        { criteria: "CC7.2", control: "System monitoring — health checks every 5 minutes", status: "compliant" },
        { criteria: "CC8.1", control: "Change management — all deployments require PR review", status: "compliant" },
        { criteria: "CC9.2", control: "Vendor risk — quarterly vendor security assessments", status: "in_progress" },
      ],
      isActive: true,
      priority: 100,
      complianceFramework: "SOC 2 Type II",
      createdBy: "stephen@szlholdings.com",
    },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-governance] Seeded ${policies.length} policies`);

  await db.insert(modelRoutingPoliciesTable).values([
    { orgId: ORG_ID, name: "Primary Production Router — Claude Sonnet", modelProvider: "anthropic", modelId: "claude-sonnet-4-5", taskCategories: ["reasoning", "analysis", "writing", "summarization"], maxCostPerCall: "0.15", isAllowed: true, isDefault: true, priority: 10, environment: "production", isActive: true },
    { orgId: ORG_ID, name: "Fast Classification — GPT-4o Mini", modelProvider: "openai", modelId: "gpt-4o-mini", taskCategories: ["classification", "extraction", "routing", "tagging"], maxCostPerCall: "0.02", isAllowed: true, isDefault: false, priority: 20, environment: "production", isActive: true },
    { orgId: ORG_ID, name: "Embeddings — text-embedding-3-small", modelProvider: "openai", modelId: "text-embedding-3-small", taskCategories: ["embedding", "similarity", "search"], maxCostPerCall: "0.005", isAllowed: true, isDefault: true, priority: 10, environment: "production", isActive: true },
    { orgId: ORG_ID, name: "High-Stakes Legal — Claude Opus", modelProvider: "anthropic", modelId: "claude-opus-4-5", taskCategories: ["legal_analysis", "privilege_review", "contract_analysis"], maxCostPerCall: "0.75", isAllowed: true, isDefault: false, priority: 5, environment: "production", isActive: true },
    { orgId: ORG_ID, name: "Staging Router — GPT-4o", modelProvider: "openai", modelId: "gpt-4o", taskCategories: ["reasoning", "analysis", "writing"], maxCostPerCall: "0.10", isAllowed: true, isDefault: true, priority: 10, environment: "staging", isActive: true },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded model routing policies`);

  const budgets = await db.insert(costBudgetsTable).values([
    { orgId: ORG_ID, name: "Platform AI — Monthly Budget", budgetType: "monthly", limitAmount: "2000.00", currentSpend: "847.32", warnThreshold: "0.80", hardStopThreshold: "1.00", alertSent80: false, alertSent100: false, periodStart: new Date("2026-04-01"), periodEnd: new Date("2026-04-30"), isActive: true },
    { orgId: ORG_ID, name: "PRISM Counsel AI — Monthly Budget", budgetType: "monthly", limitAmount: "500.00", currentSpend: "218.45", warnThreshold: "0.80", hardStopThreshold: "1.00", alertSent80: false, alertSent100: false, periodStart: new Date("2026-04-01"), periodEnd: new Date("2026-04-30"), isActive: true },
    { orgId: ORG_ID, name: "Aegis Threat Intelligence — Daily Budget", budgetType: "daily", limitAmount: "150.00", currentSpend: "42.18", warnThreshold: "0.80", hardStopThreshold: "1.00", alertSent80: false, alertSent100: false, periodStart: new Date("2026-04-15"), isActive: true },
  ]).onConflictDoNothing().returning();

  console.log(`[seed-governance] Seeded ${budgets.length} cost budgets`);

  await db.insert(costEventsTable).values([
    { orgId: ORG_ID, budgetId: budgets[0].id, eventType: "agent_run", resourceId: "lyte-signal-agent", resourceName: "Lyte Signal Detection Agent", modelProvider: "anthropic", modelId: "claude-sonnet-4-5", tokensIn: 2400, tokensOut: 850, costUsd: "0.0284" },
    { orgId: ORG_ID, budgetId: budgets[0].id, eventType: "skill_invocation", resourceId: "vessels-route-analyzer", resourceName: "Vessels Route Analysis Skill", modelProvider: "openai", modelId: "gpt-4o-mini", tokensIn: 1200, tokensOut: 400, costUsd: "0.0082" },
    { orgId: ORG_ID, budgetId: budgets[0].id, eventType: "model_call", resourceId: "terra-distress-scorer", resourceName: "Terra Distress Scoring", modelProvider: "openai", modelId: "gpt-4o-mini", tokensIn: 800, tokensOut: 200, costUsd: "0.0034" },
    { orgId: ORG_ID, budgetId: budgets[1].id, eventType: "agent_run", resourceId: "prism-forecast-agent", resourceName: "PRISM Settlement Forecast Agent", modelProvider: "anthropic", modelId: "claude-opus-4-5", tokensIn: 8200, tokensOut: 2100, costUsd: "0.4890" },
    { orgId: ORG_ID, budgetId: budgets[1].id, eventType: "skill_invocation", resourceId: "prism-demand-readiness", resourceName: "PRISM Demand Readiness Scorer", modelProvider: "anthropic", modelId: "claude-sonnet-4-5", tokensIn: 4100, tokensOut: 1200, costUsd: "0.1182" },
    { orgId: ORG_ID, budgetId: budgets[2].id, eventType: "agent_run", resourceId: "aegis-threat-intel", resourceName: "Aegis Threat Intelligence Agent", modelProvider: "anthropic", modelId: "claude-sonnet-4-5", tokensIn: 5600, tokensOut: 1800, costUsd: "0.1842" },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded cost events`);

  await db.insert(governanceIncidentsTable).values([
    {
      orgId: ORG_ID,
      policyId: policies[1].id,
      severity: "high",
      incidentType: "budget_exceeded",
      title: "PRISM Legal Agent — Daily Cost Spike",
      description: "PRISM legal analysis agent consumed $428 in a single day during bulk matter processing, exceeding the $150 daily alert threshold.",
      agentId: "prism-legal-analysis-agent",
      resourceType: "agent_run",
      resolution: "Daily cost cap enforcement added to agent configuration. Bulk processing now limited to off-peak windows.",
      resolvedBy: "stephen@szlholdings.com",
      resolvedAt: daysAgo(14),
    },
    {
      orgId: ORG_ID,
      policyId: policies[0].id,
      severity: "medium",
      incidentType: "policy_violation",
      title: "External Email Sent Without Approval",
      description: "Communication agent sent external email to law firm client without human review approval. Email was informational and not harmful, but violated the external output approval gate.",
      agentId: "communication-agent",
      resourceType: "email",
      resolution: "Communication agent deployment pipeline updated to enforce approval gate before any external transmission.",
      resolvedBy: "alex@szlholdings.com",
      resolvedAt: daysAgo(7),
    },
    {
      orgId: ORG_ID,
      severity: "medium",
      incidentType: "manual_override",
      title: "Manual Override on Auto-Generated Demand Amount",
      description: "Attorney manually overrode PRISM AI-generated settlement demand amount ($290K → $350K) without logging rationale in system.",
      agentId: "prism-forecast-agent",
      userId: "1",
      resourceType: "pc_offers",
      metadata: { matterId: 1, originalAmount: 290000, overrideAmount: 350000 },
    },
    {
      orgId: ORG_ID,
      severity: "low",
      incidentType: "agent_error",
      title: "Vessels Route Analyzer — Timeout on Pacific Route",
      description: "Route analysis agent timed out during Pacific fleet computation. Non-critical — fallback cache data served.",
      agentId: "vessels-route-analyzer",
      resourceType: "workflow_run",
      resolution: "Timeout threshold increased from 15s to 45s. Pacific routing computation optimized.",
      resolvedBy: "stephen@szlholdings.com",
      resolvedAt: daysAgo(3),
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded governance incidents`);

  await db.insert(complianceSuitabilityTable).values([
    {
      orgId: ORG_ID,
      clientId: "client-holloway-001",
      clientName: "Vanessa Holloway",
      advisorId: "advisor-szl-001",
      advisorName: "Stephen L.",
      recommendationId: `rec-${randomUUID().slice(0, 8)}`,
      recommendationType: "account_type",
      recommendationSummary: "Recommend transition from standard advisory to discretionary managed account for equity portfolio.",
      rationaleText: "Client's 10+ year investment horizon, high risk tolerance, and illiquidity tolerance support discretionary management structure.",
      clientProfile: { age: 52, netWorth: "25M+", incomeLevel: "high", investmentExperience: "sophisticated" },
      riskTolerance: "aggressive",
      investmentObjective: "capital_growth",
      timeHorizonYears: 12,
      liquidityNeeds: "Low — 5% liquid reserve maintained",
      financialSituation: { annualIncome: "1.8M", liquidAssets: "8.5M", totalNetWorth: "28M" },
      conflicts: [],
      status: "approved",
      reviewerId: "reviewer-001",
      reviewedAt: daysAgo(30),
      reviewNotes: "Suitability confirmed. Client acknowledged discretionary authorization.",
    },
    {
      orgId: ORG_ID,
      clientId: "client-chakrabarti-002",
      clientName: "Priya Chakrabarti",
      advisorId: "advisor-szl-001",
      advisorName: "Stephen L.",
      recommendationId: `rec-${randomUUID().slice(0, 8)}`,
      recommendationType: "security",
      recommendationSummary: "Recommend adding 15% allocation to private credit through Series B+ company credit facilities.",
      rationaleText: "Client's moderate-to-aggressive risk profile and 7-year horizon accommodate illiquid credit positions. Expected yield premium 4–6% over public fixed income.",
      clientProfile: { age: 38, netWorth: "4M+", incomeLevel: "high", investmentExperience: "intermediate" },
      riskTolerance: "moderate",
      investmentObjective: "income_and_growth",
      timeHorizonYears: 7,
      liquidityNeeds: "Moderate — needs 20% liquid",
      financialSituation: { annualIncome: "620K", liquidAssets: "1.2M", totalNetWorth: "4.2M" },
      conflicts: [{ type: "advisory_fee", description: "Advisor receives performance fee on private credit allocation" }],
      status: "pending_review",
      regulatoryBasis: "Regulation Best Interest (Reg BI)",
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded compliance suitability records`);

  await db.insert(complianceArchivalTable).values([
    {
      orgId: ORG_ID,
      entryId: `arch-${randomUUID().slice(0, 12)}`,
      contentHash: randomUUID().replace(/-/g, ""),
      communicationType: "email",
      participants: [{ id: "advisor-szl-001", name: "Stephen L.", role: "advisor" }, { id: "client-holloway-001", name: "Vanessa Holloway", role: "client" }],
      subject: "Q1 Strategy Engagement — Outcomes and Q2 Proposal",
      contentSummary: "Email summarizing Q1 engagement outcomes and proposing Q2 advisory scope.",
      retentionPolicy: "rule_17a4_3year",
      retentionExpiresAt: daysAhead(365 * 3),
      isImmutable: true,
    },
    {
      orgId: ORG_ID,
      entryId: `arch-${randomUUID().slice(0, 12)}`,
      contentHash: randomUUID().replace(/-/g, ""),
      communicationType: "advisory_agreement",
      participants: [{ id: "advisor-szl-001", name: "Stephen L.", role: "advisor" }, { id: "client-chakrabarti-002", name: "Priya Chakrabarti", role: "client" }],
      subject: "Signed Advisory Agreement — VIP Coaching Retainer 2026",
      contentSummary: "Executed advisory agreement for monthly executive coaching retainer.",
      retentionPolicy: "rule_17a4_3year",
      retentionExpiresAt: daysAhead(365 * 6),
      isImmutable: true,
    },
    {
      orgId: ORG_ID,
      entryId: `arch-${randomUUID().slice(0, 12)}`,
      contentHash: randomUUID().replace(/-/g, ""),
      communicationType: "trade_confirmation",
      participants: [{ id: "advisor-szl-001", name: "Stephen L.", role: "advisor" }, { id: "client-holloway-001", name: "Vanessa Holloway", role: "client" }],
      subject: "Trade Confirmation — Private Credit Allocation Q1 2026",
      contentSummary: "Trade confirmation for $450K private credit allocation in Meridian Credit Fund III.",
      retentionPolicy: "rule_17a4_3year",
      retentionExpiresAt: daysAhead(365 * 3),
      isImmutable: true,
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded compliance archival records`);

  await db.insert(complianceSupervisionQueueTable).values([
    {
      orgId: ORG_ID,
      itemId: `sup-${randomUUID().slice(0, 8)}`,
      category: "suitability_review",
      priority: "medium",
      status: "in_review",
      title: "Chakrabarti — Private Credit Recommendation Suitability Review",
      description: "Pending review of private credit recommendation with identified conflict of interest. Requires independent suitability sign-off.",
      assignedToId: "reviewer-001",
      assignedToName: "Jordan Chen",
      submittedById: "advisor-szl-001",
      submittedByName: "Stephen L.",
      relatedEntities: [{ type: "client", id: "client-chakrabarti-002", name: "Priya Chakrabarti" }],
      escalationLevel: 0,
      riskScore: "62.00",
      dueAt: daysAhead(5),
      auditTrail: [{ action: "created", by: "system", at: daysAgo(2).toISOString() }, { action: "assigned", by: "admin", at: daysAgo(1).toISOString() }],
    },
    {
      orgId: ORG_ID,
      itemId: `sup-${randomUUID().slice(0, 8)}`,
      category: "communications_review",
      priority: "low",
      status: "open",
      title: "Monthly Communications Archive Spot Check — April 2026",
      description: "Routine monthly spot check of archived communications for completeness and retention compliance.",
      assignedToId: "reviewer-001",
      assignedToName: "Jordan Chen",
      submittedById: "system",
      submittedByName: "Compliance Engine",
      escalationLevel: 0,
      riskScore: "18.00",
      dueAt: daysAhead(14),
      auditTrail: [{ action: "auto_created", by: "system", at: new Date().toISOString() }],
    },
    {
      orgId: ORG_ID,
      itemId: `sup-${randomUUID().slice(0, 8)}`,
      category: "reg_bi_violation",
      priority: "high",
      status: "escalated",
      title: "Potential Reg BI Conflict — Performance Fee Disclosure",
      description: "Review flagged: performance fee arrangement on Holloway private credit allocation may require enhanced conflict disclosure under Reg BI. Legal review requested.",
      assignedToId: "legal-001",
      assignedToName: "External Counsel",
      submittedById: "system",
      submittedByName: "Compliance Engine",
      escalationLevel: 1,
      riskScore: "78.00",
      dueAt: daysAhead(3),
      auditTrail: [{ action: "auto_created", by: "system", at: daysAgo(3).toISOString() }, { action: "escalated", by: "reviewer-001", at: daysAgo(1).toISOString() }],
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded compliance supervision queue`);

  await db.insert(complianceCalendarTable).values([
    {
      orgId: ORG_ID,
      eventId: `cal-${randomUUID().slice(0, 8)}`,
      eventType: "annual_review",
      title: "Annual Compliance Program Review — 2026",
      description: "Comprehensive annual review of all compliance policies, procedures, and controls. Required annually under our compliance program.",
      dueAt: new Date("2026-12-31"),
      reminderAt: new Date("2026-11-30"),
      status: "upcoming",
      assignedToId: "stephen@szlholdings.com",
      assignedToName: "Stephen L.",
      regulatoryBody: "SEC / FINRA",
      recurrence: "annual",
    },
    {
      orgId: ORG_ID,
      eventId: `cal-${randomUUID().slice(0, 8)}`,
      eventType: "reg_bi_audit",
      title: "Reg BI Best Interest Compliance Audit — Q2 2026",
      description: "Quarterly Regulation Best Interest audit covering suitability documentation, conflict disclosure, and care obligation assessments.",
      dueAt: new Date("2026-06-30"),
      reminderAt: new Date("2026-06-15"),
      status: "upcoming",
      assignedToId: "reviewer-001",
      assignedToName: "Jordan Chen",
      regulatoryBody: "SEC",
      recurrence: "quarterly",
    },
    {
      orgId: ORG_ID,
      eventId: `cal-${randomUUID().slice(0, 8)}`,
      eventType: "retention_review",
      title: "Communications Retention Policy Review — Q2 2026",
      description: "Review and validation of communication archival completeness against Rule 17a-4 retention requirements.",
      dueAt: new Date("2026-05-31"),
      reminderAt: new Date("2026-05-15"),
      status: "upcoming",
      assignedToId: "reviewer-001",
      assignedToName: "Jordan Chen",
      regulatoryBody: "SEC / FINRA",
      recurrence: "quarterly",
    },
    {
      orgId: ORG_ID,
      eventId: `cal-${randomUUID().slice(0, 8)}`,
      eventType: "policy_review",
      title: "Data Access Policy Review",
      description: "Annual review of data access and privacy policies for GDPR and CCPA compliance.",
      dueAt: new Date("2026-09-30"),
      reminderAt: new Date("2026-09-01"),
      status: "upcoming",
      assignedToId: "stephen@szlholdings.com",
      assignedToName: "Stephen L.",
      regulatoryBody: "Internal / Data Privacy",
      recurrence: "annual",
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded compliance calendar`);

  await db.insert(complianceRiskScoreTable).values([
    {
      orgId: ORG_ID,
      scoreDate: new Date(),
      overallScore: "74.00",
      regBiScore: "68.00",
      archivalScore: "92.00",
      supervisionScore: "71.00",
      openSupervisionItems: 3,
      criticalItems: 0,
      overdueCalendarItems: 0,
      pendingSuitabilityReviews: 1,
      breakdown: {
        regBi: { openConflicts: 1, pendingReviews: 1, disclosureGaps: 0 },
        archival: { totalArchived: 3, missingItems: 0, retentionCompliance: "100%" },
        supervision: { openItems: 3, escalatedItems: 1, overdueItems: 0 },
      },
    },
    {
      orgId: ORG_ID,
      scoreDate: daysAgo(30),
      overallScore: "81.00",
      regBiScore: "79.00",
      archivalScore: "88.00",
      supervisionScore: "82.00",
      openSupervisionItems: 1,
      criticalItems: 0,
      overdueCalendarItems: 0,
      pendingSuitabilityReviews: 0,
      breakdown: { note: "Prior month — pre-private credit recommendation" },
    },
  ]).onConflictDoNothing();

  console.log(`[seed-governance] Seeded compliance risk scores`);

  console.log("[seed-governance] Governance & Compliance seed complete.");
  return { seeded: true };
}
