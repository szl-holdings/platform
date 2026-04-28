import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const scheduledJobRunsTable = pgTable(
  'scheduled_job_runs',
  {
    id: serial('id').primaryKey(),
    jobType: text('job_type').notNull(),
    startedAt: timestamp('started_at').notNull(),
    status: text('status', { enum: ['completed', 'failed'] }).notNull(),
    durationMs: integer('duration_ms'),
    result: jsonb('result').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('scheduled_job_runs_job_type_started_at_idx').on(t.jobType, t.startedAt),
  ],
);

export const insertScheduledJobRunSchema = createInsertSchema(scheduledJobRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScheduledJobRun = z.infer<typeof insertScheduledJobRunSchema>;
export type ScheduledJobRun = typeof scheduledJobRunsTable.$inferSelect;
