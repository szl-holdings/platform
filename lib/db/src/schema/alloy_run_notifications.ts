import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Dedup ledger for server-initiated push notifications fired when an Alloy
 * workflow run transitions to "failed" or is detected as "stuck" (running
 * past the configured threshold). Unique on (run_id, user_id, kind) so the
 * stuck-run sweeper and the failure transition path can both call into the
 * same notifier without ever sending the same alert twice for the same run.
 *
 * `kind` is one of:
 *   - `failed`  — run.state transitioned to "failed".
 *   - `stuck`   — run has been in "running" past the stuck threshold.
 */
export const alloyRunFailureNotificationsTable = pgTable(
  'alloy_run_failure_notifications',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id').notNull(),
    userId: integer('user_id').notNull(),
    kind: text('kind', { enum: ['failed', 'stuck'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dedupIdx: uniqueIndex('alloy_run_failure_notifications_dedup').on(t.runId, t.userId, t.kind),
  }),
);

export type AlloyRunFailureNotification = typeof alloyRunFailureNotificationsTable.$inferSelect;
