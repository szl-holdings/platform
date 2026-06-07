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
