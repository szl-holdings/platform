import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const sentraDetectorsTable = pgTable(
  'sentra_detectors',
  {
    id: text('id').primaryKey(),
    label: text('label').notNull(),
    description: text('description').notNull(),
    kind: text('kind', {
      enum: ['heuristic', 'signature', 'statistical', 'ml', 'correlation'],
    }).notNull(),
    runtime: text('runtime', { enum: ['ts', 'python'] }).notNull(),
    inputs: jsonb('inputs').notNull().default([]).$type<string[]>(),
    costClass: text('cost_class', {
      enum: ['free', 'cheap', 'moderate', 'expensive'],
    }).notNull(),
    governanceClass: text('governance_class', {
      enum: ['read-only', 'advisory', 'mutating', 'auto-remediable'],
    }).notNull(),
    attackTechniques: jsonb('attack_techniques').$type<string[]>(),
    version: text('version'),
    sidecarBaseUrl: text('sidecar_base_url'),
    chainReceiptId: text('chain_receipt_id'),
    enabled: text('enabled', { enum: ['true', 'false'] }).notNull().default('true'),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sentra_detectors_runtime_idx').on(t.runtime)],
);

export const sentraDetectorRunsTable = pgTable(
  'sentra_detector_runs',
  {
    id: text('id').primaryKey(),
    detectorId: text('detector_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
    durationMs: integer('duration_ms').notNull(),
    status: text('status', { enum: ['ok', 'error', 'timeout'] }).notNull(),
    triggeredBy: text('triggered_by').notNull(),
    findingsCount: integer('findings_count').notNull().default(0),
    chainReceiptId: text('chain_receipt_id'),
    errorMessage: text('error_message'),
    trace: jsonb('trace').notNull().default([]).$type<unknown[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_detector_runs_detector_idx').on(t.detectorId),
    index('sentra_detector_runs_started_idx').on(t.startedAt),
  ],
);

export const sentraFindingsTable = pgTable(
  'sentra_findings',
  {
    id: text('id').primaryKey(),
    detectorId: text('detector_id').notNull(),
    runId: text('run_id').notNull(),
    severity: text('severity', {
      enum: ['critical', 'high', 'medium', 'low', 'info'],
    }).notNull(),
    score: integer('score_bps').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    attackTechniques: jsonb('attack_techniques').$type<string[]>(),
    affectedAssets: jsonb('affected_assets').notNull().default([]).$type<string[]>(),
    evidence: jsonb('evidence').notNull().default({}).$type<Record<string, unknown>>(),
    recommendedAction: jsonb('recommended_action').$type<{ kind: string; detail: string } | null>(),
    governanceClass: text('governance_class', {
      enum: ['read-only', 'advisory', 'mutating', 'auto-remediable'],
    }).notNull(),
    status: text('status', { enum: ['open', 'resolved', 'suppressed'] })
      .notNull()
      .default('open'),
    chainReceiptId: text('chain_receipt_id'),
    /**
     * Amaru cortex classification (see migration 0151):
     *  - `amaruClassifiedAt` — wall-clock when the cortex pass ran
     *  - `amaruOriginalSeverity` / `amaruOriginalScore` — detector-emitted
     *    values, recorded only when the cortex actually changed them
     *  - `amaruClassification` — structured reason / adversary tags /
     *    signals the cortex used (also recorded on no-op so reviewers
     *    can confirm the pass ran)
     * The post-classification severity/score live in `severity`/`score`.
     */
    amaruClassifiedAt: timestamp('amaru_classified_at', { withTimezone: true }),
    amaruOriginalSeverity: text('amaru_original_severity', {
      enum: ['critical', 'high', 'medium', 'low', 'info'],
    }),
    amaruOriginalScore: integer('amaru_original_score'),
    amaruClassification: jsonb('amaru_classification').$type<{
      mode: 'amaru-cortex' | 'amaru-unavailable' | 'amaru-disabled';
      reason: string;
      adversaryTags?: string[];
      signals?: Record<string, unknown>;
      bumpedSteps?: number;
    } | null>(),
    emittedAt: timestamp('emitted_at', { withTimezone: true }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: text('resolved_by'),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sentra_findings_detector_idx').on(t.detectorId),
    index('sentra_findings_run_idx').on(t.runId),
    index('sentra_findings_status_idx').on(t.status),
    index('sentra_findings_severity_idx').on(t.severity),
    index('sentra_findings_emitted_idx').on(t.emittedAt),
  ],
);

export type SentraDetectorRow = typeof sentraDetectorsTable.$inferSelect;
export type SentraDetectorInsert = typeof sentraDetectorsTable.$inferInsert;
export type SentraDetectorRunRow = typeof sentraDetectorRunsTable.$inferSelect;
export type SentraDetectorRunInsert = typeof sentraDetectorRunsTable.$inferInsert;
export type SentraFindingRow = typeof sentraFindingsTable.$inferSelect;
export type SentraFindingInsert = typeof sentraFindingsTable.$inferInsert;
