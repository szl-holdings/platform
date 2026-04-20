import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const analyticsGranularityEnum = pgEnum('analytics_granularity', [
  'minute',
  'hour',
  'day',
  'week',
  'month',
]);

export const analyticsAttributionModelEnum = pgEnum('analytics_attribution_model', [
  'first_touch',
  'last_touch',
  'linear',
  'time_decay',
]);

export const analyticsAnomalySeverityEnum = pgEnum('analytics_anomaly_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

// ---------------------------------------------------------------------------
// Raw Events
// ---------------------------------------------------------------------------

export const analyticsEventsTable = pgTable(
  'analytics_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    eventId: text('event_id').notNull().unique(),
    eventName: text('event_name').notNull(),
    domain: text('domain').notNull(),
    sourceApp: text('source_app').notNull(),
    sessionId: text('session_id'),
    userId: text('user_id'),
    organizationId: integer('organization_id').references(() => organizationsTable.id, {
      onDelete: 'set null',
    }),
    tenantId: text('tenant_id'),
    deviceType: text('device_type'),
    platform: text('platform'),
    url: text('url'),
    referrer: text('referrer'),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    country: text('country'),
    properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
    dimensions: jsonb('dimensions').$type<Record<string, string>>().default({}),
    numericValue: real('numeric_value'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    serverSide: boolean('server_side').notNull().default(false),
  },
  (t) => [
    index('analytics_events_name_idx').on(t.eventName),
    index('analytics_events_domain_idx').on(t.domain),
    index('analytics_events_source_idx').on(t.sourceApp),
    index('analytics_events_user_idx').on(t.userId),
    index('analytics_events_org_idx').on(t.organizationId),
    index('analytics_events_tenant_idx').on(t.tenantId),
    index('analytics_events_occurred_idx').on(t.occurredAt),
    index('analytics_events_session_idx').on(t.sessionId),
    index('analytics_events_domain_class_ts_idx').on(t.domain, t.eventName, t.occurredAt),
  ],
);

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEventsTable).omit({
  receivedAt: true,
});
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Custom Metric Definitions
// ---------------------------------------------------------------------------

export const analyticsMetricDefinitionsTable = pgTable(
  'analytics_metric_definitions',
  {
    id: serial('id').primaryKey(),
    metricId: text('metric_id').notNull().unique(),
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    calculationType: text('calculation_type', {
      enum: ['count', 'sum', 'avg', 'min', 'max', 'distinct_count', 'rate', 'ratio', 'percentile'],
    }).notNull(),
    eventName: text('event_name'),
    numericField: text('numeric_field'),
    filterConditions: jsonb('filter_conditions')
      .$type<Array<{ field: string; operator: string; value: unknown }>>()
      .default([]),
    dimensions: jsonb('dimensions').$type<string[]>().default([]),
    unit: text('unit'),
    granularities: jsonb('granularities')
      .$type<string[]>()
      .default(['hour', 'day', 'week', 'month']),
    visualizationType: text('visualization_type', {
      enum: ['line', 'bar', 'area', 'number', 'table', 'heatmap', 'funnel'],
    })
      .notNull()
      .default('line'),
    thresholdWarning: real('threshold_warning'),
    thresholdCritical: real('threshold_critical'),
    thresholdDirection: text('threshold_direction', { enum: ['above', 'below'] }),
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('analytics_metric_def_domain_idx').on(t.domain)],
);

export const insertAnalyticsMetricDefinitionSchema = createInsertSchema(
  analyticsMetricDefinitionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnalyticsMetricDefinition = z.infer<typeof insertAnalyticsMetricDefinitionSchema>;
export type AnalyticsMetricDefinition = typeof analyticsMetricDefinitionsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Metric Snapshots (Pre-computed Aggregations)
// ---------------------------------------------------------------------------

export const analyticsMetricSnapshotsTable = pgTable(
  'analytics_metric_snapshots',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    metricId: text('metric_id').notNull(),
    granularity: analyticsGranularityEnum('granularity').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    value: real('value').notNull(),
    sampleCount: integer('sample_count').notNull().default(0),
    dimensions: jsonb('dimensions').$type<Record<string, string>>().default({}),
    domain: text('domain').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('analytics_snap_metric_idx').on(t.metricId),
    index('analytics_snap_period_idx').on(t.periodStart, t.periodEnd),
    index('analytics_snap_domain_idx').on(t.domain),
    index('analytics_snap_gran_idx').on(t.granularity),
    uniqueIndex('analytics_snap_unique_idx').on(t.metricId, t.granularity, t.periodStart),
  ],
);

export const insertAnalyticsMetricSnapshotSchema = createInsertSchema(
  analyticsMetricSnapshotsTable,
).omit({ computedAt: true });
export type InsertAnalyticsMetricSnapshot = z.infer<typeof insertAnalyticsMetricSnapshotSchema>;
export type AnalyticsMetricSnapshot = typeof analyticsMetricSnapshotsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Attribution Touch Points
// ---------------------------------------------------------------------------

export const analyticsAttributionTouchpointsTable = pgTable(
  'analytics_attribution_touchpoints',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    journeyId: text('journey_id').notNull(),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    domain: text('domain').notNull(),
    touchpointType: text('touchpoint_type').notNull(),
    channel: text('channel'),
    content: text('content'),
    campaignId: text('campaign_id'),
    properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
    position: integer('position').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('analytics_touch_journey_idx').on(t.journeyId),
    index('analytics_touch_entity_idx').on(t.entityId, t.entityType),
    index('analytics_touch_domain_idx').on(t.domain),
  ],
);

export const insertAnalyticsAttributionTouchpointSchema = createInsertSchema(
  analyticsAttributionTouchpointsTable,
);
export type InsertAnalyticsAttributionTouchpoint = z.infer<
  typeof insertAnalyticsAttributionTouchpointSchema
>;
export type AnalyticsAttributionTouchpoint =
  typeof analyticsAttributionTouchpointsTable.$inferSelect;

export const analyticsAttributionOutcomesTable = pgTable(
  'analytics_attribution_outcomes',
  {
    id: serial('id').primaryKey(),
    journeyId: text('journey_id').notNull(),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    domain: text('domain').notNull(),
    outcomeType: text('outcome_type').notNull(),
    outcomeValue: real('outcome_value'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    attributionComputed: boolean('attribution_computed').notNull().default(false),
  },
  (t) => [
    index('analytics_outcome_journey_idx').on(t.journeyId),
    index('analytics_outcome_entity_idx').on(t.entityId, t.entityType),
    index('analytics_outcome_domain_idx').on(t.domain),
  ],
);

export const insertAnalyticsAttributionOutcomeSchema = createInsertSchema(
  analyticsAttributionOutcomesTable,
).omit({ id: true });
export type InsertAnalyticsAttributionOutcome = z.infer<
  typeof insertAnalyticsAttributionOutcomeSchema
>;
export type AnalyticsAttributionOutcome = typeof analyticsAttributionOutcomesTable.$inferSelect;

// ---------------------------------------------------------------------------
// Cohort Definitions
// ---------------------------------------------------------------------------

export const analyticsCohortDefinitionsTable = pgTable(
  'analytics_cohort_definitions',
  {
    id: serial('id').primaryKey(),
    cohortId: text('cohort_id').notNull().unique(),
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    entityType: text('entity_type').notNull(),
    entryConditions: jsonb('entry_conditions')
      .$type<Array<{ field: string; operator: string; value: unknown }>>()
      .notNull()
      .default([]),
    entryEventName: text('entry_event_name'),
    analysisType: text('analysis_type', { enum: ['retention', 'ltv', 'engagement', 'conversion'] })
      .notNull()
      .default('retention'),
    windowDays: integer('window_days').notNull().default(30),
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('analytics_cohort_def_domain_idx').on(t.domain)],
);

export const insertAnalyticsCohortDefinitionSchema = createInsertSchema(
  analyticsCohortDefinitionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnalyticsCohortDefinition = z.infer<typeof insertAnalyticsCohortDefinitionSchema>;
export type AnalyticsCohortDefinition = typeof analyticsCohortDefinitionsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Funnel Definitions
// ---------------------------------------------------------------------------

export const analyticsFunnelDefinitionsTable = pgTable(
  'analytics_funnel_definitions',
  {
    id: serial('id').primaryKey(),
    funnelId: text('funnel_id').notNull().unique(),
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    steps: jsonb('steps')
      .$type<
        Array<{
          id: string;
          name: string;
          eventName: string;
          conditions?: Array<{ field: string; operator: string; value: unknown }>;
        }>
      >()
      .notNull()
      .default([]),
    windowHours: integer('window_hours').notNull().default(168),
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('analytics_funnel_def_domain_idx').on(t.domain)],
);

export const insertAnalyticsFunnelDefinitionSchema = createInsertSchema(
  analyticsFunnelDefinitionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnalyticsFunnelDefinition = z.infer<typeof insertAnalyticsFunnelDefinitionSchema>;
export type AnalyticsFunnelDefinition = typeof analyticsFunnelDefinitionsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Anomaly Records
// ---------------------------------------------------------------------------

export const analyticsAnomaliesTable = pgTable(
  'analytics_anomalies',
  {
    id: serial('id').primaryKey(),
    anomalyId: text('anomaly_id').notNull().unique(),
    metricId: text('metric_id').notNull(),
    domain: text('domain').notNull(),
    anomalyType: text('anomaly_type', {
      enum: ['spike', 'drop', 'trend_change', 'seasonal_deviation', 'missing'],
    }).notNull(),
    severity: analyticsAnomalySeverityEnum('severity').notNull(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    observedValue: real('observed_value').notNull(),
    expectedValue: real('expected_value').notNull(),
    deviationPercent: real('deviation_percent').notNull(),
    zScore: real('z_score'),
    context: jsonb('context').$type<Record<string, unknown>>().default({}),
    potentialCauses: jsonb('potential_causes').$type<string[]>().default([]),
    isResolved: boolean('is_resolved').notNull().default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    isSuppressed: boolean('is_suppressed').notNull().default(false),
  },
  (t) => [
    index('analytics_anomaly_metric_idx').on(t.metricId),
    index('analytics_anomaly_domain_idx').on(t.domain),
    index('analytics_anomaly_detected_idx').on(t.detectedAt),
    index('analytics_anomaly_severity_idx').on(t.severity),
  ],
);

export const insertAnalyticsAnomalySchema = createInsertSchema(analyticsAnomaliesTable).omit({
  id: true,
  detectedAt: true,
});
export type InsertAnalyticsAnomaly = z.infer<typeof insertAnalyticsAnomalySchema>;
export type AnalyticsAnomaly = typeof analyticsAnomaliesTable.$inferSelect;

// ---------------------------------------------------------------------------
// Dashboard Definitions
// ---------------------------------------------------------------------------

export const analyticsDashboardsTable = pgTable(
  'analytics_dashboards',
  {
    id: serial('id').primaryKey(),
    dashboardId: text('dashboard_id').notNull().unique(),
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    layout: jsonb('layout')
      .$type<
        Array<{
          id: string;
          type: 'metric_card' | 'time_series' | 'funnel' | 'cohort' | 'anomaly_feed' | 'table';
          metricId?: string;
          funnelId?: string;
          cohortId?: string;
          title?: string;
          width?: number;
          height?: number;
          row?: number;
          col?: number;
          config?: Record<string, unknown>;
        }>
      >()
      .notNull()
      .default([]),
    defaultTimeRange: text('default_time_range').notNull().default('7d'),
    isPublic: boolean('is_public').notNull().default(false),
    createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('analytics_dashboard_domain_idx').on(t.domain)],
);

export const insertAnalyticsDashboardSchema = createInsertSchema(analyticsDashboardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnalyticsDashboard = z.infer<typeof insertAnalyticsDashboardSchema>;
export type AnalyticsDashboard = typeof analyticsDashboardsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Analytics Export Jobs
// ---------------------------------------------------------------------------

export const analyticsExportJobsTable = pgTable(
  'analytics_export_jobs',
  {
    id: serial('id').primaryKey(),
    exportId: text('export_id').notNull().unique(),
    domain: text('domain').notNull(),
    exportType: text('export_type', {
      enum: ['events', 'metric_snapshots', 'funnel', 'cohort', 'anomalies'],
    }).notNull(),
    format: text('format', { enum: ['csv', 'json', 'parquet'] })
      .notNull()
      .default('csv'),
    status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
      .notNull()
      .default('pending'),
    filterParams: jsonb('filter_params').$type<Record<string, unknown>>().default({}),
    rowCount: integer('row_count'),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
    downloadToken: text('download_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    scheduleFrequency: text('schedule_frequency', { enum: ['once', 'daily', 'weekly', 'monthly'] })
      .notNull()
      .default('once'),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    triggeredByUserId: integer('triggered_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    webhookUrl: text('webhook_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('analytics_export_domain_idx').on(t.domain),
    index('analytics_export_status_idx').on(t.status),
  ],
);

export const insertAnalyticsExportJobSchema = createInsertSchema(analyticsExportJobsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAnalyticsExportJob = z.infer<typeof insertAnalyticsExportJobSchema>;
export type AnalyticsExportJob = typeof analyticsExportJobsTable.$inferSelect;
