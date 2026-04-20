import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { GLOBAL_TENANT_SENTINEL } from './command_inbox_alert_states';

/**
 * Immutable audit log for operator actions on Command Inbox alerts.
 *
 * Every acknowledge / snooze / resolve / un-snooze action is appended as a
 * new row here. The companion `command_inbox_alert_states` table stores
 * the *current* state for fast filtering, but it is overwritten on every
 * action and therefore cannot answer "who acted, when". This table is the
 * compliance source of truth for that question.
 *
 * Tenant scoping mirrors command_inbox_alert_states: NULL/empty tenants
 * are coalesced to the GLOBAL_TENANT_SENTINEL so reads with the sentinel
 * literal work without Postgres NULL semantics surprises.
 */
export const commandInboxAlertAuditTable = pgTable(
  'command_inbox_alert_audit',
  {
    id: serial('id').primaryKey(),
    alertId: text('alert_id').notNull(),
    tenantId: text('tenant_id').notNull().default(GLOBAL_TENANT_SENTINEL),
    /**
     * The operator action recorded.
     * - "acknowledged" | "snoozed" | "resolved": new state set on the alert.
     * - "unsnoozed": operator cleared the state (POST state="active").
     *   We log this as a distinct action so the timeline shows the
     *   un-snooze event explicitly rather than a gap.
     */
    action: text('action', {
      enum: ['acknowledged', 'snoozed', 'resolved', 'unsnoozed'],
    }).notNull(),
    snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
    actorId: integer('actor_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    alertIdx: index('command_inbox_alert_audit_alert_idx').on(t.alertId),
    alertTenantIdx: index('command_inbox_alert_audit_alert_tenant_idx').on(t.alertId, t.tenantId),
    createdAtIdx: index('command_inbox_alert_audit_created_at_idx').on(t.createdAt),
  }),
);

export const insertCommandInboxAlertAuditSchema = createInsertSchema(
  commandInboxAlertAuditTable,
).omit({ id: true, createdAt: true });
export type InsertCommandInboxAlertAudit = z.infer<typeof insertCommandInboxAlertAuditSchema>;
export type CommandInboxAlertAudit = typeof commandInboxAlertAuditTable.$inferSelect;
