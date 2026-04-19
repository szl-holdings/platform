import { pgTable, text, serial, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Persisted operator action state for Command Inbox alerts.
 *
 * The /api/command/alerts feed is built on the fly from live signals
 * (OTX threats, GDELT events, prism-bus correlations, …) and has no
 * intrinsic identity beyond the deterministic alertId the builder
 * assigns to each row. This table records operator decisions —
 * acknowledge / snooze / resolve — keyed by that alertId so the inbox
 * stops re-surfacing them on every poll and survives process restarts.
 *
 * Tenant scoping:
 *   - tenantId is the caller's primary orgId stringified (matches the
 *     tenantId column on prism-bus events). For unauthenticated / demo
 *     callers we store the literal sentinel "_global_" so the unique
 *     index works without Postgres' NULL semantics (NULL ≠ NULL would
 *     allow duplicate global rows). Routes must coalesce nullable tenant
 *     ids to this sentinel before reading or writing.
 *   - (alertId, tenantId) is a real UNIQUE index, used as the conflict
 *     target for upserts.
 */
export const GLOBAL_TENANT_SENTINEL = "_global_" as const;

export const commandInboxAlertStatesTable = pgTable(
  "command_inbox_alert_states",
  {
    id: serial("id").primaryKey(),
    alertId: text("alert_id").notNull(),
    tenantId: text("tenant_id").notNull().default(GLOBAL_TENANT_SENTINEL),
    state: text("state", {
      enum: ["acknowledged", "snoozed", "resolved"],
    }).notNull(),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    updatedById: integer("updated_by_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    alertTenantUnique: uniqueIndex("command_inbox_alert_states_alert_tenant_uq").on(
      t.alertId,
      t.tenantId,
    ),
    alertIdx: index("command_inbox_alert_states_alert_idx").on(t.alertId),
    tenantIdx: index("command_inbox_alert_states_tenant_idx").on(t.tenantId),
  }),
);

export const insertCommandInboxAlertStateSchema = createInsertSchema(
  commandInboxAlertStatesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommandInboxAlertState = z.infer<typeof insertCommandInboxAlertStateSchema>;
export type CommandInboxAlertState = typeof commandInboxAlertStatesTable.$inferSelect;
