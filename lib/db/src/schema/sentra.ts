import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const sentraIncidentsTable = pgTable(
  'sentra_incidents',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    status: text('status', {
      enum: ['open', 'triaging', 'escalated', 'contained', 'resolved'],
    }).notNull().default('open'),
    mitreStage: text('mitre_stage').notNull().default('Initial Access'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    assignedTo: text('assigned_to'),
    affectedAssets: jsonb('affected_assets').notNull().default([]).$type<string[]>(),
    tags: jsonb('tags').notNull().default([]).$type<string[]>(),
    timeline: jsonb('timeline').notNull().default([]).$type<unknown[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_incidents_status_idx').on(t.status),
    index('sentra_incidents_severity_idx').on(t.severity),
    index('sentra_incidents_detected_at_idx').on(t.detectedAt),
  ],
);

export const sentraAlertsTable = pgTable(
  'sentra_alerts',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    source: text('source').notNull(),
    status: text('status', { enum: ['open', 'acknowledged', 'suppressed'] }).notNull().default('open'),
    description: text('description').notNull(),
    asset: text('asset'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    linkedIncidentId: text('linked_incident_id').references(() => sentraIncidentsTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_alerts_status_idx').on(t.status),
    index('sentra_alerts_severity_idx').on(t.severity),
    index('sentra_alerts_detected_at_idx').on(t.detectedAt),
  ],
);

export type SentraIncidentRow = typeof sentraIncidentsTable.$inferSelect;
export type SentraIncidentInsert = typeof sentraIncidentsTable.$inferInsert;
export type SentraAlertRow = typeof sentraAlertsTable.$inferSelect;
export type SentraAlertInsert = typeof sentraAlertsTable.$inferInsert;

export const REMEDIATION_STAGES = [
  'ingested',
  'contextualized',
  'recommended',
  'simulated',
  'policy-gated',
  'approved',
  'executing',
  'verifying',
  'resolved',
  'failed',
] as const;
export type RemediationStage = (typeof REMEDIATION_STAGES)[number];

export const sentraRemediationCasesTable = pgTable(
  'sentra_remediation_cases',
  {
    id: text('id').primaryKey(),
    cveId: text('cve_id'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    source: text('source').notNull().default('manual'),
    sourceRef: text('source_ref'),
    affectedAsset: text('affected_asset'),
    affectedAssets: jsonb('affected_assets').notNull().default([]).$type<string[]>(),
    stage: text('stage', { enum: REMEDIATION_STAGES }).notNull().default('ingested'),
    outcome: text('outcome', { enum: ['pending', 'verified', 'regressed', 'failed', 'risk-accepted'] })
      .notNull()
      .default('pending'),
    context: jsonb('context').notNull().default({}).$type<Record<string, unknown>>(),
    recommendation: jsonb('recommendation').$type<{
      action: string;
      type: 'patch' | 'config-change' | 'compensating-control' | 'accept-risk';
      confidence: number;
      rationale: string;
      alternatives?: Array<{ action: string; type: string; confidence: number }>;
      generatedAt: string;
    } | null>(),
    simulation: jsonb('simulation').$type<{
      affectedSystemCount: number;
      estimatedDowntimeMinutes: number;
      blastRadius: 'low' | 'medium' | 'high';
      dependencyImpact: string[];
      rollbackPlan: string;
      simulatedAt: string;
    } | null>(),
    policy: jsonb('policy').$type<{
      requiredTier: 'auto' | 'operator' | 'executive';
      tierReason: string;
      approvedBy?: string;
      approvedAt?: string;
      decision?: 'approved' | 'rejected';
      rejectionReason?: string;
    } | null>(),
    execution: jsonb('execution').$type<{
      instructions: string;
      dispatchedTo: string[];
      startedAt: string;
      completedAt?: string;
      executor?: string;
      result?: 'success' | 'partial' | 'failed';
      notes?: string;
    } | null>(),
    verification: jsonb('verification').$type<{
      verifiedAt?: string;
      verifiedBy?: string;
      method: 'manual' | 'rescan' | 'automated';
      vulnerabilityResolved: boolean;
      regressionDetected: boolean;
      notes?: string;
    } | null>(),
    proofChainIds: jsonb('proof_chain_ids').notNull().default([]).$type<string[]>(),
    timeline: jsonb('timeline').notNull().default([]).$type<
      Array<{
        id: string;
        stage: RemediationStage;
        message: string;
        actor: string;
        timestamp: string;
        proofId?: string;
      }>
    >(),
    assignedTo: text('assigned_to'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_remediation_stage_idx').on(t.stage),
    index('sentra_remediation_severity_idx').on(t.severity),
    index('sentra_remediation_detected_at_idx').on(t.detectedAt),
    index('sentra_remediation_cve_idx').on(t.cveId),
  ],
);

export type SentraRemediationCaseRow = typeof sentraRemediationCasesTable.$inferSelect;
export type SentraRemediationCaseInsert = typeof sentraRemediationCasesTable.$inferInsert;
