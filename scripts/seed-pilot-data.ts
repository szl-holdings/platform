/**
 * Pilot Data Seed — Sample operational data for the pilot org
 *
 * Adds representative signals, actions, and workflow templates
 * for the pilot organization. Designed to demonstrate key platform
 * value propositions without requiring real production data.
 *
 * Run AFTER seed-pilot-org.ts
 * Safe to run multiple times — uses onConflictDoNothing throughout.
 */

import {
  db,
  organizationsTable,
  szlActionsTable,
  szlSignalsTable,
  szlWorkflowsTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

const PILOT_ORG_SLUG = 'pilot-customer-1';

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

  const now = new Date();

  await db
    .insert(szlSignalsTable)
    .values([
      {
        orgId,
        productSlug: 'lyte',
        source: 'ERP System',
        sourceType: 'connector',
        severity: 'high',
        title: 'Q2 Budget Approval Stuck — Finance VP Queue',
        body: 'Budget approval for Q2 headcount plan has been pending for 9 days. VP Finance queue depth at 23 items.',
        whyItMatters:
          'Delayed approval blocks 3 engineering hires. Each week of delay = $85K in deferred productivity.',
        valueAtRiskCents: 25500000,
        confidence: 'high',
        ownerState: 'unassigned',
        status: 'new',
        correlationId: 'pilot-budget-001',
        detectedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      },
      {
        orgId,
        productSlug: 'lyte',
        source: 'CRM',
        sourceType: 'connector',
        severity: 'critical',
        title: 'Enterprise Contract — Legal Review Overdue 5 Days',
        body: 'Contract NOR-2026-0445 ($1.2M ARR) overdue in legal review. SLA was 3 business days.',
        whyItMatters: '$1.2M ARR at risk if Q2 close window missed. Board reporting in 8 days.',
        valueAtRiskCents: 120000000,
        confidence: 'high',
        ownerState: 'assigned',
        status: 'acknowledged',
        correlationId: 'pilot-contract-001',
        detectedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        orgId,
        productSlug: 'lyte',
        source: 'Monitoring',
        sourceType: 'monitoring',
        severity: 'medium',
        title: 'Vendor Compliance — 2 of 5 Onboardings Stalled',
        body: '2 vendor onboardings stuck at compliance step for 4+ days. Process gap: no compliance owner since last reorg.',
        whyItMatters:
          'Each blocked onboarding = $42K in delayed procurement savings. Total at risk: $84K.',
        valueAtRiskCents: 8400000,
        confidence: 'medium',
        ownerState: 'unassigned',
        status: 'new',
        correlationId: 'pilot-vendor-001',
        detectedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        orgId,
        productSlug: 'lyte',
        source: 'Security Scanner',
        sourceType: 'monitoring',
        severity: 'high',
        title: 'SOC 2 Gap — 2 Controls Without Evidence',
        body: '2 critical SOC 2 controls missing evidence. Audit window: 22 days. Current closure rate insufficient.',
        whyItMatters:
          'SOC 2 certification required for 3 enterprise prospects ($2.8M combined ARR). Audit failure = lost pipeline.',
        valueAtRiskCents: 280000000,
        confidence: 'high',
        ownerState: 'assigned',
        status: 'new',
        correlationId: 'pilot-soc2-001',
        detectedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ])
    .onConflictDoNothing();
}

async function seedPilotActions(orgId: number) {

  await db
    .insert(szlActionsTable)
    .values([
      {
        orgId,
        productSlug: 'lyte',
        title: 'Escalate Contract NOR-2026-0445 to General Counsel',
        description:
          'Legal review is 5 days overdue. Escalate directly to GC to unblock before Q2 close window.',
        actionType: 'escalation',
        status: 'proposed',
        impactLevel: 'high',
        requiresApproval: true,
        proposedBy: 'alloy',
        metadata: { contractId: 'NOR-2026-0445', escalateTo: 'general_counsel', deadline: '7d' },
      },
      {
        orgId,
        productSlug: 'lyte',
        title: 'Assign Compliance Owner for Vendor Onboarding Queue',
        description:
          '2 vendor onboardings blocked due to unowned compliance step. Assign interim owner from Legal ops.',
        actionType: 'assignment',
        status: 'proposed',
        impactLevel: 'medium',
        requiresApproval: false,
        proposedBy: 'alloy',
        metadata: { blockedVendors: 2, suggestedOwner: 'legal_ops_lead' },
      },
      {
        orgId,
        productSlug: 'lyte',
        title: 'Schedule SOC 2 Evidence Review Session',
        description:
          '2 controls missing evidence. Book 90-min review with Security team and auditor by EOW.',
        actionType: 'schedule',
        status: 'proposed',
        impactLevel: 'high',
        requiresApproval: false,
        proposedBy: 'alloy',
        metadata: { controlsAtRisk: 2, auditDaysRemaining: 22 },
      },
    ])
    .onConflictDoNothing();
}

async function seedPilotWorkflows(orgId: number) {

  await db
    .insert(szlWorkflowsTable)
    .values([
      {
        orgId,
        name: 'Contract Approval SLA Monitor',
        description:
          'Detects contract approvals overdue by >3 business days and escalates to legal leadership',
        triggerType: 'signal',
        triggerConfig: {
          signalType: 'approval_latency',
          slaThresholdDays: 3,
          resource: 'contract',
        },
        status: 'active',
        version: 1,
      },
      {
        orgId,
        name: 'Vendor Onboarding Exception Handler',
        description:
          'Monitors vendor onboarding pipeline for steps unowned >2 days and triggers assignment',
        triggerType: 'signal',
        triggerConfig: {
          signalType: 'ownership_gap',
          resource: 'vendor_onboarding',
          thresholdDays: 2,
        },
        status: 'active',
        version: 1,
      },
      {
        orgId,
        name: 'Compliance Audit Countdown',
        description:
          'Tracks open compliance control gaps as audit date approaches. Escalates at 30/14/7 day marks.',
        triggerType: 'schedule',
        triggerConfig: { cron: '0 9 * * 1', checkpoints: [30, 14, 7] },
        status: 'active',
        version: 1,
      },
    ])
    .onConflictDoNothing();
}

async function main() {
  try {
    const orgId = await getPilotOrgId();
    await seedPilotSignals(orgId);
    await seedPilotActions(orgId);
    await seedPilotWorkflows(orgId);
    process.exit(0);
  } catch (_err) {
    process.exit(1);
  }
}

main();
