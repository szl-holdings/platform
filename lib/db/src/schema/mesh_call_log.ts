import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const meshCallLogTable = pgTable(
  'mesh_call_log',
  {
    id: serial('id').primaryKey(),
    principalType: text('principal_type').notNull(),
    principalId: text('principal_id').notNull(),
    principalName: text('principal_name').notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    statusCode: integer('status_code'),
    latencyMs: integer('latency_ms'),
    orgId: integer('org_id'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (t) => [
    index('mesh_call_log_principal_type_idx').on(t.principalType),
    index('mesh_call_log_principal_id_idx').on(t.principalId),
    index('mesh_call_log_timestamp_idx').on(t.timestamp),
    index('mesh_call_log_path_idx').on(t.path),
  ],
);

export type MeshCallLog = typeof meshCallLogTable.$inferSelect;
