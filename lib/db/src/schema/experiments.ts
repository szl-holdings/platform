import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// experiments
// ---------------------------------------------------------------------------

export const experimentsTable = pgTable(
  'experiments',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    hypothesis: text('hypothesis'),
    type: text('type', {
      enum: ['product', 'ml_model', 'content', 'pricing', 'workflow'],
    })
      .notNull()
      .default('product'),
    status: text('status', {
      enum: ['draft', 'running', 'paused', 'concluded', 'stopped'],
    })
      .notNull()
      .default('draft'),
    primaryMetric: text('primary_metric').notNull().default('conversion_rate'),
    guardRailMetrics: jsonb('guard_rail_metrics').$type<
      { metric: string; minAllowedValue?: number; maxAllowedRelativeDrop?: number }[]
    >(),
    trafficAllocation: integer('traffic_allocation').notNull().default(100),
    isBandit: boolean('is_bandit').notNull().default(false),
    minSampleSize: integer('min_sample_size').notNull().default(100),
    significanceThreshold: numeric('significance_threshold', { precision: 5, scale: 4 })
      .notNull()
      .default('0.05'),
    createdBy: integer('created_by'),
    startedAt: timestamp('started_at'),
    concludedAt: timestamp('concluded_at'),
    winnerId: integer('winner_id'),
    stopReason: text('stop_reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('experiments_status_idx').on(t.status),
    index('experiments_type_idx').on(t.type),
    index('experiments_created_at_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// experiment_variants
// ---------------------------------------------------------------------------

export const experimentVariantsTable = pgTable(
  'experiment_variants',
  {
    id: serial('id').primaryKey(),
    experimentId: integer('experiment_id')
      .notNull()
      .references(() => experimentsTable.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    isControl: boolean('is_control').notNull().default(false),
    trafficWeight: integer('traffic_weight').notNull().default(50),
    config: jsonb('config'),
    mlModelVersionId: text('ml_model_version_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('experiment_variants_experiment_id_idx').on(t.experimentId),
    uniqueIndex('experiment_variants_experiment_key_idx').on(t.experimentId, t.key),
  ],
);

// ---------------------------------------------------------------------------
// experiment_assignments
// Deterministic user-to-variant assignments, persisted for auditability.
// ---------------------------------------------------------------------------

export const experimentAssignmentsTable = pgTable(
  'experiment_assignments',
  {
    id: serial('id').primaryKey(),
    experimentId: integer('experiment_id')
      .notNull()
      .references(() => experimentsTable.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => experimentVariantsTable.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', { enum: ['user', 'org', 'session', 'device'] })
      .notNull()
      .default('user'),
    entityId: text('entity_id').notNull(),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  },
  (t) => [
    index('experiment_assignments_experiment_entity_idx').on(t.experimentId, t.entityId),
    uniqueIndex('experiment_assignments_unique_entity_idx').on(t.experimentId, t.entityId),
  ],
);

// ---------------------------------------------------------------------------
// experiment_events
// Exposure and conversion events that drive statistical analysis.
// ---------------------------------------------------------------------------

export const experimentEventsTable = pgTable(
  'experiment_events',
  {
    id: serial('id').primaryKey(),
    experimentId: integer('experiment_id')
      .notNull()
      .references(() => experimentsTable.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => experimentVariantsTable.id, { onDelete: 'cascade' }),
    entityId: text('entity_id').notNull(),
    eventType: text('event_type', { enum: ['exposure', 'conversion', 'metric', 'error'] })
      .notNull()
      .default('exposure'),
    metricKey: text('metric_key'),
    metricValue: numeric('metric_value', { precision: 18, scale: 6 }),
    properties: jsonb('properties'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('experiment_events_experiment_id_idx').on(t.experimentId),
    index('experiment_events_variant_id_idx').on(t.variantId),
    index('experiment_events_entity_id_idx').on(t.entityId),
    index('experiment_events_event_type_idx').on(t.eventType),
    index('experiment_events_occurred_at_idx').on(t.occurredAt),
  ],
);

// ---------------------------------------------------------------------------
// experiment_snapshots
// Persisted analysis results at a point in time.
// ---------------------------------------------------------------------------

export const experimentSnapshotsTable = pgTable(
  'experiment_snapshots',
  {
    id: serial('id').primaryKey(),
    experimentId: integer('experiment_id')
      .notNull()
      .references(() => experimentsTable.id, { onDelete: 'cascade' }),
    snapshotData: jsonb('snapshot_data').notNull(),
    triggeredBy: text('triggered_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('experiment_snapshots_experiment_id_idx').on(t.experimentId),
    index('experiment_snapshots_created_at_idx').on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Zod schemas & types
// ---------------------------------------------------------------------------

export const insertExperimentSchema = createInsertSchema(experimentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  concludedAt: true,
});
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type Experiment = typeof experimentsTable.$inferSelect;

export const insertExperimentVariantSchema = createInsertSchema(experimentVariantsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertExperimentVariant = z.infer<typeof insertExperimentVariantSchema>;
export type ExperimentVariant = typeof experimentVariantsTable.$inferSelect;

export const insertExperimentAssignmentSchema = createInsertSchema(
  experimentAssignmentsTable,
).omit({ id: true, assignedAt: true });
export type InsertExperimentAssignment = z.infer<typeof insertExperimentAssignmentSchema>;
export type ExperimentAssignment = typeof experimentAssignmentsTable.$inferSelect;

export const insertExperimentEventSchema = createInsertSchema(experimentEventsTable).omit({
  id: true,
  occurredAt: true,
});
export type InsertExperimentEvent = z.infer<typeof insertExperimentEventSchema>;
export type ExperimentEvent = typeof experimentEventsTable.$inferSelect;

export const insertExperimentSnapshotSchema = createInsertSchema(experimentSnapshotsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertExperimentSnapshot = z.infer<typeof insertExperimentSnapshotSchema>;
export type ExperimentSnapshot = typeof experimentSnapshotsTable.$inferSelect;
