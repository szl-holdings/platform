/**
 * Pilot Data Seed — Sample operational data for the pilot org.
 * Run AFTER seed-pilot-org.ts. Safe to run multiple times (onConflictDoNothing).
 */

import {
  db,
  organizationsTable,
  platformSignalsTable,
  actionsTable,
  workflowsTable,
} from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const PILOT_ORG_SLUG = "pilot-customer-1";

async function getPilotOrgId(): Promise<number> {
  const [org] = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, PILOT_ORG_SLUG))
    .limit(1);

  if (!org) {
    throw new Error(`Pilot org '${PILOT_ORG_SLUG}' not found. Run seed-pilot-org.ts first.`);
  }

  return org.id;
}

async function seedPilotSignals(orgId: number) {
  console.log("[seed-pilot-data] Seeding pilot signals...");

  const now = new Date();

  await db.insert(platformSignalsTable).values([
    {
      orgId,
      source: "ERP System",
      sourceType: "connector",
      severity: "high",
      title: "Q2 Budget Approval Stuck — Finance VP Queue",
      body: "Budget approval for Q2 headcount plan has been pending for 9 days. VP Finance queue depth at 23 items.",
      status: "new",
      valueAtRisk: "255000",
      metadata: { productSlug: "lyte", whyItMatters: "Delayed approval blocks 3 engineering hires. Each week of delay = $85K in deferred productivity.", confidence: "high", correlationId: "pilot-budget-001" },
      receivedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      orgId,
      source: "CRM",
      sourceType: "connector",
      severity: "critical",
      title: "Enterprise Contract — Legal Review Overdue 5 Days",
      body: "Contract NOR-2026-0445 ($1.2M ARR) overdue in legal review. SLA was 3 business days.",
      status: "processing",
      valueAtRisk: "1200000",
      metadata: { productSlug: "lyte", whyItMatters: "$1.2M ARR at risk if Q2 close window missed. Board reporting in 8 days.", confidence: "high", correlationId: "pilot-contract-001" },
      receivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      orgId,
      source: "Monitoring",
      sourceType: "monitoring",
      severity: "medium",
      title: "Vendor Compliance — 2 of 5 Onboardings Stalled",
      body: "2 vendor onboardings stuck at compliance step for 4+ days. Process gap: no compliance owner since last reorg.",
      status: "new",
      valueAtRisk: "84000",
      metadata: { productSlug: "lyte", whyItMatters: "Each blocked onboarding = $42K in delayed procurement savings. Total at risk: $84K.", confidence: "medium", correlationId: "pilot-vendor-001" },
      receivedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      orgId,
      source: "Security Scanner",
      sourceType: "monitoring",
      severity: "high",
      title: "SOC 2 Gap — 2 Controls Without Evidence",
      body: "2 critical SOC 2 controls missing evidence. Audit window: 22 days. Current closure rate insufficient.",
      status: "new",
      valueAtRisk: "2800000",
      metadata: { productSlug: "lyte", whyItMatters: "SOC 2 certification required for 3 enterprise prospects ($2.8M combined ARR). Audit failure = lost pipeline.", confidence: "high", correlationId: "pilot-soc2-001" },
      receivedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  ]).onConflictDoNothing();

  console.log("[seed-pilot-data] 4 pilot signals seeded");
}

async function seedPilotActions(orgId: number) {
  console.log("[seed-pilot-data] Seeding pilot actions...");

  await db.insert(actionsTable).values([
    {
      orgId,
      product: "lyte",
      title: "Escalate Contract NOR-2026-0445 to General Counsel",
      description: "Legal review is 5 days overdue. Escalate directly to GC to unblock before Q2 close window.",
      actionType: "escalation",
      status: "pending",
      priority: "high",
      metadata: { contractId: "NOR-2026-0445", escalateTo: "general_counsel", deadline: "7d", requiresApproval: true, proposedBy: "alloy" },
    },
    {
      orgId,
      product: "lyte",
      title: "Assign Compliance Owner for Vendor Onboarding Queue",
      description: "2 vendor onboardings blocked due to unowned compliance step. Assign interim owner from Legal ops.",
      actionType: "manual",
      status: "pending",
      priority: "medium",
      metadata: { blockedVendors: 2, suggestedOwner: "legal_ops_lead", requiresApproval: false, proposedBy: "alloy" },
    },
    {
      orgId,
      product: "lyte",
      title: "Schedule SOC 2 Evidence Review Session",
      description: "2 controls missing evidence. Book 90-min review with Security team and auditor by EOW.",
      actionType: "manual",
      status: "pending",
      priority: "high",
      metadata: { controlsAtRisk: 2, auditDaysRemaining: 22, requiresApproval: false, proposedBy: "alloy" },
    },
  ]).onConflictDoNothing();

  console.log("[seed-pilot-data] 3 pilot actions seeded");
}

async function seedPilotWorkflows(orgId: number) {
  console.log("[seed-pilot-data] Seeding pilot workflow templates...");

  await db.insert(workflowsTable).values([
    {
      orgId,
      product: "lyte",
      name: "Contract Approval SLA Monitor",
      description: "Detects contract approvals overdue by >3 business days and escalates to legal leadership",
      triggerType: "signal",
      triggerConfig: { signalType: "approval_latency", slaThresholdDays: 3, resource: "contract" },
      status: "active",
    },
    {
      orgId,
      product: "lyte",
      name: "Vendor Onboarding Exception Handler",
      description: "Monitors vendor onboarding pipeline for steps unowned >2 days and triggers assignment",
      triggerType: "signal",
      triggerConfig: { signalType: "ownership_gap", resource: "vendor_onboarding", thresholdDays: 2 },
      status: "active",
    },
    {
      orgId,
      product: "lyte",
      name: "Compliance Audit Countdown",
      description: "Tracks open compliance control gaps as audit date approaches. Escalates at 30/14/7 day marks.",
      triggerType: "schedule",
      triggerConfig: { cron: "0 9 * * 1", checkpoints: [30, 14, 7] },
      status: "active",
    },
  ]).onConflictDoNothing();

  console.log("[seed-pilot-data] 3 pilot workflows seeded");
}

async function main() {
  console.log("=== Pilot Data Seed ===\n");
  try {
    const orgId = await getPilotOrgId();
    await seedPilotSignals(orgId);
    await seedPilotActions(orgId);
    await seedPilotWorkflows(orgId);
    console.log("\n=== Pilot data seed complete ===");
    process.exit(0);
  } catch (err) {
    console.error("[seed-pilot-data] Failed:", err);
    process.exit(1);
  }
}

main();
