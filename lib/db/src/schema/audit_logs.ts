import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

export const auditLogsTable = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id').references(() => organizationsTable.id, {
      onDelete: 'set null',
    }),
    siteId: integer('site_id'),
    actorUserId: integer('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    actionType: text('action_type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    payloadJson: jsonb('payload_json'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_created_at_idx').on(sql`${t.createdAt} DESC`),
    index('audit_logs_actor_user_id_idx').on(t.actorUserId),
    index('audit_logs_org_id_idx').on(t.organizationId),
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
  ],
);

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
