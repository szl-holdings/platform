import { index, jsonb, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const driftSnapshotsTable = pgTable(
  'drift_snapshots',
  {
    id: serial('id').primaryKey(),
    measuredAt: timestamp('measured_at').notNull().defaultNow(),
    overallDriftScore: real('overall_drift_score').notNull(),
    status: text('status', { enum: ['healthy', 'degraded', 'critical'] }).notNull(),
    summary: jsonb('summary').notNull(),
  },
  (t) => [index('drift_snapshots_measured_at_idx').on(t.measuredAt)],
);

export type DriftSnapshot = typeof driftSnapshotsTable.$inferSelect;
export type InsertDriftSnapshot = typeof driftSnapshotsTable.$inferInsert;
