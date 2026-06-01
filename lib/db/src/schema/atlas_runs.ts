import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ─── atlas_signals ────────────────────────────────────────────────────────────

export const atlasSignalsTable = pgTable('atlas_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull(),
  signalType: text('signal_type').notNull(),
  severity: text('severity', { enum: ['info', 'low', 'medium', 'high', 'critical'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidence: real('confidence').notNull().default(0.5),
  source: text('source').notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: text('status', { enum: ['raw', 'normalized', 'processed', 'acknowledged', 'resolved'] })
    .notNull()
    .default('raw'),
  tenantId: text('tenant_id').notNull().default('default'),
  workflowId: text('workflow_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertAtlasSignalSchema = createInsertSchema(atlasSignalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAtlasSignal = z.infer<typeof insertAtlasSignalSchema>;
export type AtlasSignal = typeof atlasSignalsTable.$inferSelect;

// ─── atlas_evidence ───────────────────────────────────────────────────────────

export const atlasEvidenceTable = pgTable('atlas_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull(),
  workflowId: text('workflow_id').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  source: text('source').notNull(),
  capturedBy: text('captured_by').notNull(),
  immutable: boolean('immutable').notNull().default(false),
  tenantId: text('tenant_id'),
  capturedAt: timestamp('captured_at').notNull().defaultNow(),
});

export const insertAtlasEvidenceSchema = createInsertSchema(atlasEvidenceTable).omit({
  id: true,
  capturedAt: true,
});
export type InsertAtlasEvidence = z.infer<typeof insertAtlasEvidenceSchema>;
export type AtlasEvidence = typeof atlasEvidenceTable.$inferSelect;

// ─── atlas_outcomes ───────────────────────────────────────────────────────────

export const atlasOutcomesTable = pgTable('atlas_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull(),
  workflowId: text('workflow_id').notNull(),
  signalId: text('signal_id'),
  recommendationId: text('recommendation_id'),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  status: text('status', { enum: ['success', 'partial', 'failed', 'rolled_back'] }).notNull(),
  financialImpactUsd: real('financial_impact_usd'),
  operationalSeverity: text('operational_severity'),
  entitiesAffected: integer('entities_affected'),
  recordedBy: text('recorded_by').notNull(),
  evidence: jsonb('evidence').notNull().default([]),
  metadata: jsonb('metadata').default({}),
  tenantId: text('tenant_id'),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

export const insertAtlasOutcomeSchema = createInsertSchema(atlasOutcomesTable).omit({
  id: true,
  recordedAt: true,
});
export type InsertAtlasOutcome = z.infer<typeof insertAtlasOutcomeSchema>;
export type AtlasOutcome = typeof atlasOutcomesTable.$inferSelect;

// ─── atlas_runs ───────────────────────────────────────────────────────────────

export const atlasRunsTable = pgTable('atlas_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: text('domain').notNull(),
  workflowId: text('workflow_id').notNull().unique(),
  workflowName: text('workflow_name').notNull(),
  triggerSignalId: text('trigger_signal_id'),
  replayable: boolean('replayable').notNull().default(true),
  signalSnapshot: jsonb('signal_snapshot').notNull().default([]),
  runSnapshot: jsonb('run_snapshot').notNull().default({}),
  latencyMs: integer('latency_ms'),
  stepsCompleted: integer('steps_completed'),
  stepsFailed: integer('steps_failed'),
  policyChecks: integer('policy_checks'),
  policiesBlocked: integer('policies_blocked'),
  evidenceCount: integer('evidence_count'),
  tenantId: text('tenant_id'),
  snapshotAt: timestamp('snapshot_at').notNull().defaultNow(),
});

export const insertAtlasRunSchema = createInsertSchema(atlasRunsTable).omit({
  id: true,
  snapshotAt: true,
});
export type InsertAtlasRun = z.infer<typeof insertAtlasRunSchema>;
export type AtlasRun = typeof atlasRunsTable.$inferSelect;
