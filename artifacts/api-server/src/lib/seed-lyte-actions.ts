import { db, lyteActionsTable } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const LYTE_SEED_ACTIONS = [
  {
    title: 'Northgate Contract — Legal Review Stalled',
    description: 'Contract stuck in legal queue 48h past SLA. $840K ARR at risk.',
    signalCategory: 'approval_latency' as const,
    state: 'new' as const,
    priority: 'urgent' as const,
    owner: 'Jordan Alvarez',
    valueAtRisk: '840000',
    dueAt: new Date(Date.now() + 4 * 3600000),
    roleVisibility: { executive: true, operations: true },
    metadata: {
      workflowStage: 'Legal Review',
      evidence: [
        {
          id: 'e1a',
          label: 'Queue Dwell Time',
          value: '48h 12m',
          source: 'workflow-engine / approval-svc',
          confidence: 0.98,
        },
        {
          id: 'e1b',
          label: 'SLA Threshold',
          value: '24h',
          source: 'ops-policy/contracts-v2',
          confidence: 1.0,
        },
        {
          id: 'e1c',
          label: 'Last Reviewer Action',
          value: 'Opened — 48h ago',
          source: 'legal-portal audit log',
        },
        {
          id: 'e1d',
          label: 'ARR at Risk',
          value: '$840,000',
          source: 'crm/opportunity #NG-2241',
          confidence: 0.95,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah1a',
        action: 'Signal surfaced',
        actor: 'alloy-signal-engine',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
      {
        id: 'ah1b',
        action: 'Routed to Jordan Alvarez',
        actor: 'routing-policy/contracts',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 47 * 3600000).toISOString(),
      },
      {
        id: 'ah1c',
        action: 'Viewed',
        actor: 'jordan.alvarez@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 46 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    title: 'TechCorp Onboarding — No Owner Assigned',
    description: 'Critical onboarding step has been unassigned for 6 days.',
    signalCategory: 'ownership_gap' as const,
    state: 'acknowledged' as const,
    priority: 'high' as const,
    owner: 'Marcus Webb',
    valueAtRisk: '320000',
    dueAt: new Date(Date.now() - 2 * 24 * 3600000),
    roleVisibility: { operations: true, delivery: true },
    metadata: {
      workflowStage: 'Onboarding',
      evidence: [
        {
          id: 'e2a',
          label: 'Step Unassigned Since',
          value: '6d 2h',
          source: 'onboarding-orchestrator',
          confidence: 1.0,
        },
        {
          id: 'e2b',
          label: 'Milestone Blocked',
          value: 'Integration Config',
          source: 'project-tracker #TC-891',
        },
        {
          id: 'e2c',
          label: 'Customer Health Risk',
          value: 'High — NPS drop expected',
          source: 'cs-health-model v3',
          confidence: 0.81,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah2a',
        action: 'Ownership gap detected',
        actor: 'ownership-watcher',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 144 * 3600000).toISOString(),
      },
      {
        id: 'ah2b',
        action: 'Acknowledged',
        actor: 'marcus.webb@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 96 * 3600000).toISOString(),
        notes: 'Investigating re-assignment options',
      },
    ],
    createdAt: new Date(Date.now() - 144 * 3600000),
  },
  {
    title: 'Q2 Revenue Forecast — 18% Drift Detected',
    description: 'Forecast model shows significant deviation from plan.',
    signalCategory: 'forecast_drift' as const,
    state: 'new' as const,
    priority: 'urgent' as const,
    owner: 'Sarah Kim',
    valueAtRisk: '2100000',
    dueAt: new Date(Date.now() + 12 * 3600000),
    roleVisibility: { executive: true },
    metadata: {
      workflowStage: 'Finance Review',
      evidence: [
        {
          id: 'e3a',
          label: 'Plan vs Forecast Delta',
          value: '-18.3%',
          source: 'finance-model/q2-2026-v14',
          confidence: 0.91,
        },
        {
          id: 'e3b',
          label: 'Primary Driver',
          value: 'Northgate + 3 mid-market slips',
          source: 'revenue-attribution-engine',
        },
        {
          id: 'e3c',
          label: 'ARR Impact',
          value: '$2.1M',
          source: 'crm-pipeline rollup',
          confidence: 0.87,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah3a',
        action: 'Drift threshold exceeded (>15%)',
        actor: 'forecast-monitor',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'ah3b',
        action: 'Escalated to Sarah Kim',
        actor: 'routing-policy/finance',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 11 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 12 * 3600000),
  },
  {
    title: 'Vendor Onboarding Pipeline — 3 Stalled',
    description: 'Three vendor workflows stuck at compliance check for 5+ days.',
    signalCategory: 'stalled_workflow' as const,
    state: 'assigned' as const,
    priority: 'high' as const,
    owner: 'Riley Torres',
    assignedTo: 'Compliance Team',
    valueAtRisk: '180000',
    dueAt: new Date(Date.now() + 24 * 3600000),
    roleVisibility: { operations: true, delivery: true },
    metadata: {
      workflowStage: 'Compliance Check',
      evidence: [
        {
          id: 'e4a',
          label: 'Stalled Vendors',
          value: 'Praxis Corp, Dataplex, Orion Supply',
          source: 'vendor-pipeline-tracker',
        },
        {
          id: 'e4b',
          label: 'Average Stall Duration',
          value: '5.4 days',
          source: 'workflow-analytics',
          confidence: 0.99,
        },
        {
          id: 'e4c',
          label: 'Blocker',
          value: 'Missing SOC 2 attestation',
          source: 'compliance-gate-engine',
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah4a',
        action: 'Stall detected (>4d threshold)',
        actor: 'workflow-watchdog',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 120 * 3600000).toISOString(),
      },
      {
        id: 'ah4b',
        action: 'Assigned to Compliance Team',
        actor: 'riley.torres@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 100 * 3600000).toISOString(),
      },
      {
        id: 'ah4c',
        action: 'Compliance review initiated',
        actor: 'compliance@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 80 * 3600000).toISOString(),
        notes: 'Requested docs from vendors',
      },
    ],
    createdAt: new Date(Date.now() - 120 * 3600000),
  },
  {
    title: 'Apex Logistics — Handoff Failure at Delivery',
    description: 'Customer success handoff failed; no confirmation from delivery lead.',
    signalCategory: 'handoff_failure' as const,
    state: 'escalated' as const,
    priority: 'urgent' as const,
    owner: 'Alex Chen',
    valueAtRisk: '560000',
    dueAt: new Date(Date.now() - 4 * 3600000),
    roleVisibility: { executive: true, operations: true, delivery: true },
    metadata: {
      workflowStage: 'Customer Handoff',
      evidence: [
        {
          id: 'e5a',
          label: 'Handoff Trigger',
          value: 'Deal closed 2026-04-15',
          source: 'crm/opportunity #APX-1104',
        },
        {
          id: 'e5b',
          label: 'Confirmation Status',
          value: 'No ACK from delivery lead',
          source: 'handoff-orchestrator',
        },
        {
          id: 'e5c',
          label: 'Customer Tenure',
          value: 'Enterprise — 3 years',
          source: 'account-db',
          confidence: 1.0,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah5a',
        action: 'Handoff initiated',
        actor: 'crm-trigger/deal-closed',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'ah5b',
        action: 'ACK timeout (4h)',
        actor: 'handoff-orchestrator',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
      },
      {
        id: 'ah5c',
        action: 'Escalated',
        actor: 'alex.chen@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
        notes: 'No response from delivery lead; escalating to VP',
      },
    ],
    createdAt: new Date(Date.now() - 24 * 3600000),
  },
  {
    title: 'Enterprise Deal Status Conflict',
    description: "CRM shows 'Closed Won' but finance hasn't received PO. $1.2M at stake.",
    signalCategory: 'status_conflict' as const,
    state: 'new' as const,
    priority: 'high' as const,
    owner: 'Morgan Lee',
    valueAtRisk: '1200000',
    dueAt: new Date(Date.now() + 48 * 3600000),
    roleVisibility: { executive: true, operations: true },
    metadata: {
      workflowStage: 'Finance Reconciliation',
      evidence: [
        {
          id: 'e6a',
          label: 'CRM Status',
          value: 'Closed Won (2026-04-16)',
          source: 'salesforce/opp #ENT-7721',
        },
        {
          id: 'e6b',
          label: 'Finance PO Status',
          value: 'Not received',
          source: 'finance-erp/payables',
        },
        {
          id: 'e6c',
          label: 'Contract Value',
          value: '$1,200,000 ARR',
          source: 'contracts-db #CTR-2241',
        },
        {
          id: 'e6d',
          label: 'Conflict Duration',
          value: '4h 12m',
          source: 'reconciliation-engine',
          confidence: 0.99,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah6a',
        action: 'Status discrepancy detected',
        actor: 'reconciliation-cron',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'ah6b',
        action: 'Assigned to Morgan Lee',
        actor: 'ops-routing',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 4 * 3600000),
  },
  {
    title: 'Platform Launch — 3 Gates Not Cleared',
    description: 'Missing security review, load test sign-off, and legal clearance.',
    signalCategory: 'readiness_blocker' as const,
    state: 'assigned' as const,
    priority: 'high' as const,
    owner: 'Sam Park',
    assignedTo: 'Launch Team',
    valueAtRisk: '450000',
    dueAt: new Date(Date.now() + 72 * 3600000),
    roleVisibility: { operations: true, delivery: true },
    metadata: {
      workflowStage: 'Launch Gate Review',
      evidence: [
        {
          id: 'e7a',
          label: 'Pending Gates',
          value: 'Security Review, Load Test, Legal',
          source: 'launch-gate-engine',
        },
        {
          id: 'e7b',
          label: 'Launch Target',
          value: '2026-04-19',
          source: 'project-tracker/launch-v3',
        },
        {
          id: 'e7c',
          label: 'Impacted ARR',
          value: '$450K (first-month)',
          source: 'finance-model',
          confidence: 0.82,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah7a',
        action: 'Gate blockers flagged',
        actor: 'launch-readiness-engine',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'ah7b',
        action: 'Assigned to Launch Team',
        actor: 'sam.park@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 30 * 3600000).toISOString(),
      },
      {
        id: 'ah7c',
        action: 'Security review scheduled',
        actor: 'security@szl.com',
        actorType: 'user',
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 36 * 3600000),
  },
  {
    title: 'Pipeline Hygiene — 47 Stale Opportunities',
    description: 'Deals last touched >30 days consuming forecast capacity.',
    signalCategory: 'pipeline_hygiene' as const,
    state: 'new' as const,
    priority: 'medium' as const,
    owner: 'Jordan Alvarez',
    valueAtRisk: '890000',
    dueAt: new Date(Date.now() + 5 * 24 * 3600000),
    roleVisibility: { executive: true, operations: true },
    metadata: {
      workflowStage: 'Sales Ops Review',
      evidence: [
        {
          id: 'e8a',
          label: 'Stale Opportunity Count',
          value: '47',
          source: 'crm-hygiene-scanner',
          confidence: 1.0,
        },
        { id: 'e8b', label: 'Avg Days Since Touch', value: '38.4 days', source: 'crm-analytics' },
        {
          id: 'e8c',
          label: 'Forecast Distortion',
          value: '$890K inflated pipeline',
          source: 'forecast-quality-engine',
          confidence: 0.88,
        },
      ],
    },
    stateHistory: [
      {
        id: 'ah8a',
        action: 'Hygiene scan completed',
        actor: 'crm-hygiene-scanner',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
      {
        id: 'ah8b',
        action: 'Report generated and queued',
        actor: 'ops-reporting',
        actorType: 'agent',
        timestamp: new Date(Date.now() - 71 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 72 * 3600000),
  },
];

export async function seedLyteActions(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lyteActionsTable);

    if (count > 0) {
      logger.info({ count }, '[seed-kora-actions] KORA actions already seeded, skipping');
      return;
    }

    type LyteActionInsert = typeof lyteActionsTable.$inferInsert;
    const rows = await db
      .insert(lyteActionsTable)
      .values(LYTE_SEED_ACTIONS as LyteActionInsert[])
      .returning({ id: lyteActionsTable.id });

    logger.info(
      { count: rows.length },
      '[seed-kora-actions] KORA action queue seeded successfully',
    );
  } catch (err) {
    logger.warn({ err }, '[seed-lyte-actions] Failed to seed lyte actions (non-fatal)');
  }
}
