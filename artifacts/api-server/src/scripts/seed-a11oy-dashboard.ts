/**
 * seed-a11oy-dashboard.ts — Seeds the A11oy dashboard tables (alloy.ts schema).
 *
 * Populates the tables consumed by GET /api/a11oy/dashboard so the A11oy
 * HomePage hero shows realistic non-zero workflow / run / approval / audit
 * activity. Idempotent: re-running is a no-op once the marker workflow exists.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server seed:a11oy-dashboard
 *   tsx src/scripts/seed-a11oy-dashboard.ts
 */
import {
  alloyApprovals,
  alloyAuditLog,
  alloyWorkflowRuns,
  alloyWorkflows,
  db,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

const SEED_MARKER = 'a11oy-dashboard-seed-v1';

type WorkflowSeed = {
  externalId: string;
  name: string;
  type:
    | 'investigation'
    | 'remediation'
    | 'escalation'
    | 'review'
    | 'notification'
    | 'report'
    | 'custom';
  domain: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status:
    | 'draft'
    | 'pending'
    | 'running'
    | 'waiting_approval'
    | 'approved'
    | 'rejected'
    | 'completed'
    | 'failed'
    | 'cancelled';
  requiresApproval: boolean;
};

const WORKFLOWS: WorkflowSeed[] = [
  {
    externalId: 'a11oy-wf-etl-daily',
    name: 'Daily ETL Pipeline',
    type: 'report',
    domain: 'data-platform',
    priority: 'medium',
    status: 'completed',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-terra-distress',
    name: 'Terra Distress Scanner',
    type: 'investigation',
    domain: 'terra',
    priority: 'high',
    status: 'running',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-vessels-ais',
    name: 'Vessels AIS Anomaly Sync',
    type: 'investigation',
    domain: 'vessels',
    priority: 'high',
    status: 'completed',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-aegis-threat',
    name: 'Aegis Threat Aggregation',
    type: 'escalation',
    domain: 'aegis',
    priority: 'critical',
    status: 'running',
    requiresApproval: true,
  },
  {
    externalId: 'a11oy-wf-client-onboarding',
    name: 'Client Onboarding Sync',
    type: 'notification',
    domain: 'crm',
    priority: 'medium',
    status: 'waiting_approval',
    requiresApproval: true,
  },
  {
    externalId: 'a11oy-wf-compliance-report',
    name: 'Compliance Evidence Pack',
    type: 'report',
    domain: 'compliance',
    priority: 'high',
    status: 'waiting_approval',
    requiresApproval: true,
  },
  {
    externalId: 'a11oy-wf-revenue-recon',
    name: 'Revenue Reconciliation',
    type: 'review',
    domain: 'finance',
    priority: 'medium',
    status: 'completed',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-prism-ingest',
    name: 'PRISM Signal Ingest',
    type: 'custom',
    domain: 'alloy',
    priority: 'medium',
    status: 'completed',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-crm-sync',
    name: 'CRM Contact Sync',
    type: 'notification',
    domain: 'crm',
    priority: 'low',
    status: 'completed',
    requiresApproval: false,
  },
  {
    externalId: 'a11oy-wf-sentra-remediation',
    name: 'Sentra Remediation Playbook',
    type: 'remediation',
    domain: 'sentra',
    priority: 'critical',
    status: 'failed',
    requiresApproval: false,
  },
];

const RUN_STATUS_MIX: Array<'completed' | 'completed' | 'completed' | 'failed' | 'started'> = [
  'completed',
  'completed',
  'completed',
  'failed',
  'started',
];

const ERROR_MESSAGES = [
  'Upstream connector returned 503 after 30s',
  'Schema validation failed on column `severity`',
  'Rate limit exceeded — exponential backoff engaged',
  'Downstream queue unavailable — circuit breaker open',
];

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000);
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

export async function seedA11oyDashboard(): Promise<{ inserted: boolean; reason?: string }> {
  const existing = await db
    .select({ id: alloyWorkflows.id })
    .from(alloyWorkflows)
    .where(eq(alloyWorkflows.externalId, WORKFLOWS[0]!.externalId))
    .limit(1);
  if (existing.length > 0) {
    return { inserted: false, reason: 'already-seeded' };
  }

  const insertedWorkflows = await db
    .insert(alloyWorkflows)
    .values(
      WORKFLOWS.map((w, i) => {
        const startedAt = minutesAgo(60 + i * 17);
        const completedAt =
          w.status === 'completed' || w.status === 'failed'
            ? minutesAgo(60 + i * 17 - 5)
            : null;
        return {
          externalId: w.externalId,
          name: w.name,
          type: w.type,
          domain: w.domain,
          triggerType: 'signal' as const,
          status: w.status,
          priority: w.priority,
          requiresApproval: w.requiresApproval,
          approvalState: (w.status === 'waiting_approval' ? 'pending' : 'none') as
            | 'none'
            | 'pending'
            | 'approved'
            | 'rejected',
          confidenceScore: 0.7 + (i % 4) * 0.05,
          startedAt,
          completedAt,
          metadata: { seed: SEED_MARKER },
        };
      }),
    )
    .returning({ id: alloyWorkflows.id, externalId: alloyWorkflows.externalId });

  const runRows: Array<typeof alloyWorkflowRuns.$inferInsert> = [];
  for (let i = 0; i < insertedWorkflows.length; i++) {
    const wf = insertedWorkflows[i]!;
    const runCount = 6 + (i % 4); // 6-9 runs per workflow
    for (let r = 0; r < runCount; r++) {
      const status = pick(RUN_STATUS_MIX, i * 3 + r);
      const startedAt = minutesAgo(60 * (r + 1) + i * 7);
      const durationMs =
        status === 'started' ? null : 4_000 + ((i * 13 + r * 29) % 90_000);
      const completedAt =
        status === 'started' || durationMs === null
          ? null
          : new Date(startedAt.getTime() + durationMs);
      runRows.push({
        workflowId: wf.id,
        runNumber: r + 1,
        status,
        trigger: 'signal',
        durationMs,
        startedAt,
        completedAt,
        errorMessage: status === 'failed' ? pick(ERROR_MESSAGES, i + r) : null,
        approvalState: 'none',
        metadata: { seed: SEED_MARKER },
      });
    }
  }
  const insertedRuns = await db
    .insert(alloyWorkflowRuns)
    .values(runRows)
    .returning({ id: alloyWorkflowRuns.id, workflowId: alloyWorkflowRuns.workflowId });

  // Pending approvals tied to the waiting_approval workflows
  const approvalWorkflows = insertedWorkflows.filter((wf) =>
    ['a11oy-wf-client-onboarding', 'a11oy-wf-compliance-report', 'a11oy-wf-aegis-threat'].includes(
      wf.externalId ?? '',
    ),
  );
  if (approvalWorkflows.length > 0) {
    await db.insert(alloyApprovals).values(
      approvalWorkflows.flatMap((wf, idx) => {
        const wfRun = insertedRuns.find((r) => r.workflowId === wf.id);
        const baseReasons = [
          'High-impact remediation — requires admin sign-off',
          'Production write — compliance review needed',
          'Cross-tenant escalation — covenant gate triggered',
        ];
        return [
          {
            workflowId: wf.id,
            runId: wfRun?.id ?? null,
            status: 'pending' as const,
            reason: pick(baseReasons, idx),
            requiredRoles: ['admin', 'compliance'],
            expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
          },
        ];
      }),
    );
  }

  // Recent audit log entries — mix of workflow lifecycle + approval events
  const auditActions: Array<{
    entityType: 'workflow' | 'approval' | 'signal';
    action: string;
  }> = [
    { entityType: 'workflow', action: 'workflow.created' },
    { entityType: 'workflow', action: 'workflow.run.started' },
    { entityType: 'workflow', action: 'workflow.run.completed' },
    { entityType: 'workflow', action: 'workflow.run.failed' },
    { entityType: 'approval', action: 'approval.requested' },
    { entityType: 'approval', action: 'approval.approved' },
    { entityType: 'signal', action: 'signal.received' },
    { entityType: 'signal', action: 'signal.normalized' },
    { entityType: 'workflow', action: 'workflow.completed' },
    { entityType: 'workflow', action: 'workflow.run.started' },
    { entityType: 'approval', action: 'approval.requested' },
    { entityType: 'workflow', action: 'workflow.run.completed' },
  ];
  await db.insert(alloyAuditLog).values(
    auditActions.map((a, i) => {
      const wf = insertedWorkflows[i % insertedWorkflows.length]!;
      return {
        entityType: a.entityType,
        entityId: wf.id,
        action: a.action,
        actorType: 'system' as const,
        notes: `${a.action} for ${wf.externalId}`,
        correlationId: `${SEED_MARKER}-${i}`,
        createdAt: minutesAgo(i * 9 + 3),
      };
    }),
  );

  return { inserted: true };
}

async function main() {
  const result = await seedA11oyDashboard();
  if (result.inserted) {
    console.log('[seed-a11oy-dashboard] seeded workflows, runs, approvals, audit log');
  } else {
    console.log(`[seed-a11oy-dashboard] skipped (${result.reason})`);
  }
  process.exit(0);
}

const invokedDirectly =
  typeof process !== 'undefined' && process.argv[1]?.includes('seed-a11oy-dashboard');
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[seed-a11oy-dashboard] failed', err);
    process.exit(1);
  });
}
