import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  integer,
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

// ─── Active Defense Tables ───────────────────────────────────────────────────

/**
 * sentra_events: Real-time security events emitted from api-server middleware.
 * Auth failures, rate anomalies, geo drift, honey hits, suspicious payloads.
 */
export const sentraEventsTable = pgTable(
  'sentra_events',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    sourceIp: text('source_ip'),
    sessionId: text('session_id'),
    userId: text('user_id'),
    path: text('path'),
    method: text('method'),
    statusCode: integer('status_code'),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low', 'info'] }).notNull().default('info'),
    payload: jsonb('payload').notNull().default({}).$type<Record<string, unknown>>(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }),
  },
  (t) => [
    index('sentra_events_type_idx').on(t.eventType),
    index('sentra_events_ip_idx').on(t.sourceIp),
    index('sentra_events_detected_at_idx').on(t.detectedAt),
    index('sentra_events_severity_idx').on(t.severity),
  ],
);

export type SentraEventRow = typeof sentraEventsTable.$inferSelect;
export type SentraEventInsert = typeof sentraEventsTable.$inferInsert;

/**
 * sentra_canaries: Honey rows / canary tokens registered in the deception grid.
 * Any access to a registered canary triggers a high-confidence detection.
 */
export const sentraCanariesTable = pgTable(
  'sentra_canaries',
  {
    id: text('id').primaryKey(),
    tokenType: text('token_type').notNull(),
    tokenValue: text('token_value').notNull(),
    location: text('location').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    triggerCount: integer('trigger_count').notNull().default(0),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_canaries_type_idx').on(t.tokenType),
    index('sentra_canaries_active_idx').on(t.isActive),
  ],
);

export type SentraCanaryRow = typeof sentraCanariesTable.$inferSelect;
export type SentraCanaryInsert = typeof sentraCanariesTable.$inferInsert;

/**
 * sentra_evidence_ledger: Append-only, hash-chained audit log.
 * Every detection, response action, Sentinel counter-move, and operator
 * approval/decline writes a record linking to the previous record.
 */
export const sentraEvidenceLedgerTable = pgTable(
  'sentra_evidence_ledger',
  {
    id: text('id').primaryKey(),
    sequenceNumber: integer('sequence_number').notNull(),
    entryType: text('entry_type', {
      enum: ['detection', 'response', 'counter_move', 'approval', 'scope_violation', 'canary_trigger', 'sentinel_action'],
    }).notNull(),
    actorType: text('actor_type', { enum: ['system', 'operator', 'sentinel', 'evaluator'] }).notNull(),
    actorId: text('actor_id'),
    targetType: text('target_type'),
    targetId: text('target_id'),
    action: text('action').notNull(),
    outcome: text('outcome', { enum: ['executed', 'approved', 'rejected', 'blocked', 'pending'] }).notNull(),
    details: jsonb('details').notNull().default({}).$type<Record<string, unknown>>(),
    previousHash: text('previous_hash'),
    entryHash: text('entry_hash').notNull(),
    linkedEventId: text('linked_event_id'),
    linkedIncidentId: text('linked_incident_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_ledger_type_idx').on(t.entryType),
    index('sentra_ledger_seq_idx').on(t.sequenceNumber),
    index('sentra_ledger_created_idx').on(t.createdAt),
    index('sentra_ledger_incident_idx').on(t.linkedIncidentId),
  ],
);

export type SentraEvidenceLedgerRow = typeof sentraEvidenceLedgerTable.$inferSelect;
export type SentraEvidenceLedgerInsert = typeof sentraEvidenceLedgerTable.$inferInsert;

/**
 * sentra_response_queue: HITL queue for defensive actions awaiting operator approval.
 */
export const sentraResponseQueueTable = pgTable(
  'sentra_response_queue',
  {
    id: text('id').primaryKey(),
    actionType: text('action_type').notNull(),
    category: text('category', {
      enum: ['block', 'revoke', 'rotate', 'quarantine', 'tarpit', 'poison_response', 'counter_move'],
    }).notNull(),
    target: text('target').notNull(),
    targetType: text('target_type').notNull(),
    reason: text('reason').notNull(),
    riskLevel: text('risk_level', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected', 'auto_executed', 'cancelled'] }).notNull().default('pending'),
    autoExecute: boolean('auto_execute').notNull().default(false),
    linkedEventId: text('linked_event_id'),
    linkedIncidentId: text('linked_incident_id'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: text('resolved_by'),
    details: jsonb('details').notNull().default({}).$type<Record<string, unknown>>(),
  },
  (t) => [
    index('sentra_rq_status_idx').on(t.status),
    index('sentra_rq_category_idx').on(t.category),
    index('sentra_rq_requested_idx').on(t.requestedAt),
  ],
);

export type SentraResponseQueueRow = typeof sentraResponseQueueTable.$inferSelect;
export type SentraResponseQueueInsert = typeof sentraResponseQueueTable.$inferInsert;

/**
 * sentra_duel_sessions: Tracks active Sentinel-vs-Adversary duel engagements.
 */
export const sentraDuelSessionsTable = pgTable(
  'sentra_duel_sessions',
  {
    id: text('id').primaryKey(),
    sessionKey: text('session_key').notNull(),
    attackerProfile: text('attacker_profile', { enum: ['human', 'scripted_automation', 'llm_agent', 'unknown'] }).notNull().default('unknown'),
    attackerConfidence: integer('attacker_confidence').notNull().default(0),
    sentinelStrategy: text('sentinel_strategy'),
    counterMoveCount: integer('counter_move_count').notNull().default(0),
    status: text('status', { enum: ['active', 'resolved', 'escaped'] }).notNull().default('active'),
    timeline: jsonb('timeline').notNull().default([]).$type<Array<{
      ts: string;
      event: string;
      actor: 'sentinel' | 'attacker';
      detail: string;
    }>>(),
    policyEstimate: jsonb('policy_estimate').notNull().default({}).$type<Record<string, number>>(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => [
    index('sentra_duel_status_idx').on(t.status),
    index('sentra_duel_session_key_idx').on(t.sessionKey),
    index('sentra_duel_started_idx').on(t.startedAt),
  ],
);

export type SentraDuelSessionRow = typeof sentraDuelSessionsTable.$inferSelect;
export type SentraDuelSessionInsert = typeof sentraDuelSessionsTable.$inferInsert;
