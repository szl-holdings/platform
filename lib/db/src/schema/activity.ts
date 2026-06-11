import { integer, jsonb, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';

export const activityLogTable = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  description: text('description'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auditEventsTable = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  // Policy-decision audit fields — populated when an approve/reject decision
  // is recorded so the proof chain (resolved mode, confidence, evidence) is
  // durable and replayable from this single events log.
  decision: text('decision'),
  policyEvaluationId: text('policy_evaluation_id'),
  resolvedMode: text('resolved_mode'),
  confidence: real('confidence'),
  blockedReason: text('blocked_reason'),
  projectedImpact: jsonb('projected_impact'),
  product: text('product'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogTable.$inferSelect;

export const insertAuditEventSchema = createInsertSchema(auditEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEventsTable.$inferSelect;
