import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const cpsRunsTable = pgTable(
  'cps_runs',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default('default'),
    payloadId: text('payload_id').notNull(),
    payloadVersion: text('payload_version').notNull(),
    status: text('status', {
      enum: [
        'pending',
        'detecting',
        'deciding',
        'awaiting-approval',
        'acting',
        'recovering',
        'completed',
        'rolled-back',
        'failed',
        'blocked',
      ],
    }).notNull().default('pending'),
    maturityMode: text('maturity_mode', {
      enum: ['shadow', 'supervised-auto', 'autonomous'],
    }).notNull(),
    detect: jsonb('detect').$type<unknown>(),
    decide: jsonb('decide').$type<unknown>(),
    actions: jsonb('actions').notNull().default([]).$type<unknown[]>(),
    recover: jsonb('recover').$type<unknown>(),
    proofBundle: jsonb('proof_bundle').$type<unknown>(),
    governanceChecks: jsonb('governance_checks').notNull().default([]).$type<unknown[]>(),
    triggeredBy: jsonb('triggered_by').notNull().$type<{ id: string; displayName: string; email: string | null; roles: string[] }>(),
    linkedCaseId: text('linked_case_id'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cps_runs_tenant_id_idx').on(t.tenantId),
    index('cps_runs_payload_id_idx').on(t.payloadId),
    index('cps_runs_status_idx').on(t.status),
    index('cps_runs_started_at_idx').on(t.startedAt),
  ],
);

export const cpsApprovalsTable = pgTable(
  'cps_approvals',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default('default'),
    runId: text('run_id').notNull().references(() => cpsRunsTable.id, { onDelete: 'cascade' }),
    tier: text('tier', {
      enum: ['auto', 'operator', 'supervisor', 'executive', 'dual-executive'],
    }).notNull(),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'expired'],
    }).notNull().default('pending'),
    approver: text('approver'),
    approverRole: text('approver_role'),
    approverId: text('approver_id'),
    reason: text('reason'),
    dualApprovals: jsonb('dual_approvals').default([]).$type<Array<{
      approverId: string;
      approver: string;
      approverRole: string;
      approvedAt: string;
      reason?: string;
    }>>(),
    requiredDualCount: integer('required_dual_count'),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cps_approvals_tenant_id_idx').on(t.tenantId),
    index('cps_approvals_run_id_idx').on(t.runId),
    index('cps_approvals_status_idx').on(t.status),
  ],
);

export const cpsProofBundlesTable = pgTable(
  'cps_proof_bundles',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default('default'),
    runId: text('run_id').notNull().references(() => cpsRunsTable.id, { onDelete: 'cascade' }),
    payloadId: text('payload_id').notNull(),
    payloadVersion: text('payload_version').notNull(),
    signature: text('signature').notNull(),
    sections: jsonb('sections').notNull().$type<unknown>(),
    governanceChecks: jsonb('governance_checks').notNull().default([]).$type<unknown[]>(),
    residualRisk: text('residual_risk'),
    classification: text('classification').notNull().default('internal-confidential'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cps_proof_bundles_tenant_id_idx').on(t.tenantId),
    index('cps_proof_bundles_run_id_idx').on(t.runId),
    index('cps_proof_bundles_payload_id_idx').on(t.payloadId),
  ],
);
