import { activityLogTable, auditEventsTable, db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

const ACTORS = [
  { id: 1, name: 'Stephen Lutar', email: 'stephen@szlholdings.com', role: 'founder_admin' },
  { id: 2, name: 'Ops Lead', email: 'ops@szlholdings.com', role: 'operator' },
  { id: 3, name: 'Analyst', email: 'analyst@szlholdings.com', role: 'analyst' },
  { id: 4, name: 'System (Alloy)', email: 'alloy@system.internal', role: 'system' },
];

const ACTIVITY_LOG_ENTRIES = [
  {
    action: 'login',
    resource: 'session',
    resourceId: '1',
    metadata: { ip: '192.168.1.10', ua: 'Mozilla/5.0' },
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'workflow',
    resourceId: 'wf-001',
    metadata: { name: 'Approval Latency Detection', platform: 'lyte' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'create',
    resource: 'signal',
    resourceId: 'sig-001',
    metadata: { type: 'approval_latency', severity: 'high', platform: 'lyte' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'route',
    resource: 'action',
    resourceId: 'act-001',
    metadata: { routedTo: 'ops@szlholdings.com', signal: 'sig-001', priority: 'high' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'acknowledge',
    resource: 'signal',
    resourceId: 'sig-001',
    metadata: { respondedWithin: '14m', context: 'Q1 approval queue review' },
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'signal',
    resourceId: 'sig-002',
    metadata: {
      type: 'ownership_gap',
      severity: 'medium',
      platform: 'lyte',
      affectedEntity: 'Vendor Contract #447',
    },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'create',
    resource: 'workflow_run',
    resourceId: 'run-001',
    metadata: { workflow: 'wf-001', trigger: 'signal_threshold', status: 'completed' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'approve',
    resource: 'action',
    resourceId: 'act-002',
    metadata: {
      decision: 'approved',
      rationale: 'Confirmed vendor ownership gap resolved',
      auditRef: 'AU-2026-001',
    },
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'signal',
    resourceId: 'sig-003',
    metadata: { type: 'workflow_drift', severity: 'low', platform: 'alloy', workflowId: 'wf-002' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'read',
    resource: 'report',
    resourceId: 'rep-001',
    metadata: {
      reportType: 'weekly_kpi_summary',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    actorId: 3,
    actorEmail: 'analyst@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'document',
    resourceId: 'doc-001',
    metadata: { title: 'Q1 2026 Operational Review', type: 'report', appSource: 'szl-holdings' },
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'signal',
    resourceId: 'sig-004',
    metadata: {
      type: 'approval_latency',
      severity: 'critical',
      platform: 'lyte',
      slaBreachIn: '2h',
    },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'escalate',
    resource: 'signal',
    resourceId: 'sig-004',
    metadata: {
      escalatedTo: 'stephen@szlholdings.com',
      reason: 'SLA breach imminent',
      slaHours: 2,
    },
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
  },
  {
    action: 'resolve',
    resource: 'signal',
    resourceId: 'sig-004',
    metadata: {
      resolution: 'Approval processed. Owner identified and notified.',
      resolvedWithin: '1h 47m',
    },
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'audit_event',
    resourceId: 'ae-001',
    metadata: {
      category: 'compliance',
      ref: 'AU-2026-002',
      description: 'Monthly compliance audit completed',
    },
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
  },
  {
    action: 'login',
    resource: 'session',
    resourceId: '2',
    metadata: { ip: '10.0.0.14', ua: 'Mozilla/5.0 Chrome' },
    actorId: 3,
    actorEmail: 'analyst@szlholdings.com',
  },
  {
    action: 'create',
    resource: 'workflow',
    resourceId: 'wf-003',
    metadata: { name: 'Vessel Exception Handler', platform: 'vessels' },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'create',
    resource: 'signal',
    resourceId: 'sig-005',
    metadata: {
      type: 'route_deviation',
      severity: 'high',
      platform: 'vessels',
      vessel: 'MV Meridian Star',
    },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'route',
    resource: 'action',
    resourceId: 'act-003',
    metadata: {
      routedTo: 'ops@szlholdings.com',
      signal: 'sig-005',
      priority: 'high',
      context: 'Vessels fleet exception',
    },
    actorId: 4,
    actorEmail: 'alloy@system.internal',
  },
  {
    action: 'resolve',
    resource: 'signal',
    resourceId: 'sig-005',
    metadata: { resolution: 'Fleet rerouted. Voyage economics updated.', resolvedWithin: '38m' },
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
  },
];

const AUDIT_EVENTS = [
  {
    eventType: 'signal.created',
    resource: 'signal',
    resourceId: 'sig-001',
    actorId: 4,
    actorEmail: 'alloy@system.internal',
    actorRole: 'system',
    severity: 'high',
    description: 'Approval latency signal created — Q1 approval queue, 47 items > 72h threshold',
    metadata: {
      platform: 'lyte',
      prismLayer: 'Signals',
      signalType: 'approval_latency',
      value: 47,
      threshold: 10,
    },
  },
  {
    eventType: 'action.routed',
    resource: 'action',
    resourceId: 'act-001',
    actorId: 4,
    actorEmail: 'alloy@system.internal',
    actorRole: 'system',
    severity: 'high',
    description: 'Action routed to ops lead — priority: high, SLA: 4h',
    metadata: { routedTo: 'ops@szlholdings.com', slaHours: 4, triggerSignal: 'sig-001' },
  },
  {
    eventType: 'signal.acknowledged',
    resource: 'signal',
    resourceId: 'sig-001',
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
    actorRole: 'operator',
    severity: 'info',
    description: 'Signal acknowledged by Ops Lead — responded within SLA (14 minutes)',
    metadata: { responseTime: '14m', context: 'Approval queue under review' },
  },
  {
    eventType: 'action.approved',
    resource: 'action',
    resourceId: 'act-002',
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
    actorRole: 'founder_admin',
    severity: 'info',
    description: 'Approval granted — Vendor contract ownership gap resolved',
    metadata: {
      decision: 'approved',
      auditRef: 'AU-2026-001',
      rationale: 'Ownership confirmed with legal',
    },
  },
  {
    eventType: 'signal.escalated',
    resource: 'signal',
    resourceId: 'sig-004',
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
    actorRole: 'operator',
    severity: 'critical',
    description: 'Approval latency escalated — SLA breach imminent (2h remaining)',
    metadata: { escalatedTo: 'stephen@szlholdings.com', slaHours: 2 },
  },
  {
    eventType: 'signal.resolved',
    resource: 'signal',
    resourceId: 'sig-004',
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
    actorRole: 'founder_admin',
    severity: 'info',
    description: 'Critical approval latency resolved — 1h 47m total resolution time',
    metadata: {
      resolution: 'Approval processed',
      resolvedWithin: '1h47m',
      slaStatus: 'within_sla',
    },
  },
  {
    eventType: 'workflow.completed',
    resource: 'workflow_run',
    resourceId: 'run-001',
    actorId: 4,
    actorEmail: 'alloy@system.internal',
    actorRole: 'system',
    severity: 'info',
    description: 'Workflow run completed — Approval Latency Detection (wf-001)',
    metadata: {
      workflow: 'wf-001',
      trigger: 'signal_threshold',
      stepsCompleted: 5,
      duration: '4m 12s',
    },
  },
  {
    eventType: 'audit.compliance_review',
    resource: 'audit_event',
    resourceId: 'ae-001',
    actorId: 1,
    actorEmail: 'stephen@szlholdings.com',
    actorRole: 'founder_admin',
    severity: 'info',
    description: 'Monthly compliance audit completed — all controls passed',
    metadata: {
      auditRef: 'AU-2026-002',
      period: 'March 2026',
      controlsPassed: 12,
      controlsFailed: 0,
    },
  },
  {
    eventType: 'signal.created',
    resource: 'signal',
    resourceId: 'sig-005',
    actorId: 4,
    actorEmail: 'alloy@system.internal',
    actorRole: 'system',
    severity: 'high',
    description: 'Vessel route deviation detected — MV Meridian Star, 47nm off planned route',
    metadata: {
      platform: 'vessels',
      vessel: 'MV Meridian Star',
      deviation: '47nm',
      voyageId: 'V-2026-0312',
    },
  },
  {
    eventType: 'signal.resolved',
    resource: 'signal',
    resourceId: 'sig-005',
    actorId: 2,
    actorEmail: 'ops@szlholdings.com',
    actorRole: 'operator',
    severity: 'info',
    description: 'Vessel route deviation resolved — fleet rerouted, voyage economics updated',
    metadata: { resolution: 'Fleet rerouted', resolvedWithin: '38m', economicImpact: 'minimal' },
  },
];

async function tableHasData(table: any): Promise<boolean> {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
    return count > 0;
  } catch {
    return false;
  }
}

export async function seedAuditLogs(): Promise<void> {
  console.log('[seed-audit] Seeding audit log data...');

  const activityExists = await tableHasData(activityLogTable);
  if (activityExists) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogTable);
    if (count >= 10) {
      console.log('[seed-audit] Audit data already seeded, skipping...');
      return;
    }
  }

  const now = Date.now();

  for (let i = 0; i < ACTIVITY_LOG_ENTRIES.length; i++) {
    const entry = ACTIVITY_LOG_ENTRIES[i];
    const ts = new Date(now - (ACTIVITY_LOG_ENTRIES.length - i) * 3 * 60 * 60 * 1000);
    try {
      await db
        .insert(activityLogTable)
        .values({
          userId: entry.actorId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          metadata: entry.metadata,
          createdAt: ts,
        } as any)
        .onConflictDoNothing();
    } catch {}
  }

  for (let i = 0; i < AUDIT_EVENTS.length; i++) {
    const event = AUDIT_EVENTS[i];
    const ts = new Date(now - (AUDIT_EVENTS.length - i) * 3 * 60 * 60 * 1000);
    try {
      await db
        .insert(auditEventsTable)
        .values({
          eventType: event.eventType,
          resource: event.resource,
          resourceId: event.resourceId,
          actorId: event.actorId,
          actorEmail: event.actorEmail,
          actorRole: event.actorRole,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata,
          createdAt: ts,
        } as any)
        .onConflictDoNothing();
    } catch {}
  }

  console.log(
    `[seed-audit] Seeded ${ACTIVITY_LOG_ENTRIES.length} activity log entries and ${AUDIT_EVENTS.length} audit events`,
  );
}
