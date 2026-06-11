import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';

export const platformJobRunsTable = pgTable('platform_job_runs', {
  id: serial('id').primaryKey(),
  runId: text('run_id').notNull().unique(),
  workflowType: text('workflow_type').notNull(),
  status: text('status', {
    enum: ['pending', 'running', 'completed', 'completed_with_warnings', 'failed'],
  })
    .notNull()
    .default('pending'),
  domain: text('domain').notNull(),
  triggeredBy: text('triggered_by').notNull().default('scheduler'),
  triggeredByUserId: integer('triggered_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: text('error'),
  retries: integer('retries').notNull().default(0),
  correlationId: text('correlation_id'),
  workflowRunId: text('workflow_run_id'),
  signalId: text('signal_id'),
  artifactId: text('artifact_id'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const artifactApprovalsTable = pgTable('artifact_approvals', {
  id: serial('id').primaryKey(),
  approvalId: text('approval_id').notNull().unique(),
  artifactType: text('artifact_type').notNull(),
  artifactId: text('artifact_id').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'expired'] })
    .notNull()
    .default('pending'),
  domain: text('domain').notNull(),
  summary: text('summary').notNull(),
  requestedByUserId: integer('requested_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  requestedByLabel: text('requested_by_label'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  reviewedByLabel: text('reviewed_by_label'),
  reviewNote: text('review_note'),
  correlationId: text('correlation_id'),
  workflowRunId: text('workflow_run_id'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertPlatformJobRunSchema = createInsertSchema(platformJobRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPlatformJobRun = z.infer<typeof insertPlatformJobRunSchema>;
export type PlatformJobRun = typeof platformJobRunsTable.$inferSelect;

export const insertArtifactApprovalSchema = createInsertSchema(artifactApprovalsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArtifactApproval = z.infer<typeof insertArtifactApprovalSchema>;
export type ArtifactApproval = typeof artifactApprovalsTable.$inferSelect;
