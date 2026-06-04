import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const siemExportConnectionsTable = pgTable(
  'siem_export_connections',
  {
    id: serial('id').primaryKey(),
    connectionId: text('connection_id').notNull().unique(),
    name: text('name').notNull(),
    adapterId: text('adapter_id', {
      enum: ['splunk-cef', 'sentinel-asim', 'chronicle-udm'],
    }).notNull(),
    config: jsonb('config').notNull().$type<Record<string, unknown>>(),
    enabled: text('enabled').notNull().default('true'),
    orgId: text('org_id'),
    lastExportAt: timestamp('last_export_at'),
    totalExported: integer('total_exported').notNull().default(0),
    totalFailed: integer('total_failed').notNull().default(0),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('siem_export_connections_org_idx').on(t.orgId),
    index('siem_export_connections_adapter_idx').on(t.adapterId),
  ],
);

export const siemExportEventsTable = pgTable(
  'siem_export_events',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().unique(),
    connectionId: text('connection_id').notNull(),
    findingId: text('finding_id').notNull(),
    format: text('format', { enum: ['cef', 'asim', 'udm'] }).notNull(),
    status: text('status', { enum: ['queued', 'exported', 'failed'] })
      .notNull()
      .default('queued'),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    errorMessage: text('error_message'),
    exportedAt: timestamp('exported_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('siem_export_events_connection_idx').on(t.connectionId),
    index('siem_export_events_status_idx').on(t.status),
  ],
);

export type SiemExportConnection = typeof siemExportConnectionsTable.$inferSelect;
export type SiemExportEvent = typeof siemExportEventsTable.$inferSelect;
