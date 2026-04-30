import { boolean, index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const sloDefinitionsTable = pgTable(
  'slo_definitions',
  {
    id: serial('id').primaryKey(),
    serviceGroup: text('service_group').notNull(),
    metricType: text('metric_type', {
      enum: ['latency_p50', 'latency_p95', 'latency_p99', 'error_rate', 'availability'],
    }).notNull(),
    targetValue: real('target_value').notNull(),
    windowHours: integer('window_hours').notNull().default(720),
    description: text('description'),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('slo_definitions_group_metric_unique').on(t.serviceGroup, t.metricType),
  ],
);

export const sloMeasurementsTable = pgTable(
  'slo_measurements',
  {
    id: serial('id').primaryKey(),
    sloDefinitionId: integer('slo_definition_id').notNull().references(() => sloDefinitionsTable.id, { onDelete: 'cascade' }),
    serviceGroup: text('service_group').notNull(),
    metricType: text('metric_type').notNull(),
    windowHours: integer('window_hours').notNull(),
    compliancePct: real('compliance_pct').notNull(),
    errorBudgetRemainingPct: real('error_budget_remaining_pct').notNull(),
    burnRate1h: real('burn_rate_1h'),
    burnRate6h: real('burn_rate_6h'),
    burnRate24h: real('burn_rate_24h'),
    requestCount: integer('request_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    p50Ms: real('p50_ms'),
    p95Ms: real('p95_ms'),
    p99Ms: real('p99_ms'),
    alertFired: boolean('alert_fired').notNull().default(false),
    measuredAt: timestamp('measured_at').notNull().defaultNow(),
  },
  (t) => [
    index('slo_measurements_service_group_measured_at_idx').on(t.serviceGroup, t.measuredAt),
    index('slo_measurements_slo_definition_id_idx').on(t.sloDefinitionId),
  ],
);

export const sreIncidentsTable = pgTable(
  'sre_incidents',
  {
    id: serial('id').primaryKey(),
    incidentKey: text('incident_key').notNull().unique(),
    title: text('title').notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
    status: text('status', {
      enum: ['open', 'investigating', 'mitigating', 'resolved', 'postmortem'],
    }).notNull().default('open'),
    affectedServices: text('affected_services').array().notNull().default([]),
    description: text('description'),
    rootCause: text('root_cause'),
    resolutionNotes: text('resolution_notes'),
    postmortemUrl: text('postmortem_url'),
    assignee: text('assignee'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at'),
    resolvedAt: timestamp('resolved_at'),
    sloImpacted: boolean('slo_impacted').notNull().default(false),
    impactedSloServices: text('impacted_slo_services').array().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('sre_incidents_status_idx').on(t.status),
    index('sre_incidents_detected_at_idx').on(t.detectedAt),
    index('sre_incidents_severity_status_idx').on(t.severity, t.status),
  ],
);

export const sreIncidentTimelineTable = pgTable(
  'sre_incident_timeline',
  {
    id: serial('id').primaryKey(),
    incidentId: integer('incident_id').notNull().references(() => sreIncidentsTable.id, { onDelete: 'cascade' }),
    eventType: text('event_type', {
      enum: ['created', 'status_changed', 'update', 'assigned', 'resolved', 'postmortem_added', 'slo_linked'],
    }).notNull(),
    message: text('message').notNull(),
    previousStatus: text('previous_status'),
    newStatus: text('new_status'),
    author: text('author'),
    metadata: jsonb('metadata').default({}),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('sre_incident_timeline_incident_id_idx').on(t.incidentId),
    index('sre_incident_timeline_occurred_at_idx').on(t.occurredAt),
  ],
);

export type SloDefinition = typeof sloDefinitionsTable.$inferSelect;
export type InsertSloDefinition = typeof sloDefinitionsTable.$inferInsert;
export type SloMeasurement = typeof sloMeasurementsTable.$inferSelect;
export type InsertSloMeasurement = typeof sloMeasurementsTable.$inferInsert;
export type SreIncident = typeof sreIncidentsTable.$inferSelect;
export type InsertSreIncident = typeof sreIncidentsTable.$inferInsert;
export type SreIncidentTimeline = typeof sreIncidentTimelineTable.$inferSelect;
export type InsertSreIncidentTimeline = typeof sreIncidentTimelineTable.$inferInsert;
