import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { usersTable } from './auth.js';

export const reportTemplatesTable = pgTable('report_templates', {
  id: serial('id').primaryKey(),
  templateId: uuid('template_id').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  domain: text('domain', {
    enum: ['szl_holdings', 'carlota_jo', 'aegis', 'terra', 'vessels', 'lyte', 'prism', 'general'],
  })
    .notNull()
    .default('general'),
  reportType: text('report_type').notNull(),
  blocks: jsonb('blocks').notNull().default([]),
  brandTheme: text('brand_theme', {
    enum: ['szl', 'carlota', 'aegis', 'terra', 'vessels', 'lyte', 'prism', 'neutral'],
  })
    .notNull()
    .default('szl'),
  isSchedulable: boolean('is_schedulable').notNull().default(false),
  conditionalRules: jsonb('conditional_rules').default([]),
  dataRequirements: jsonb('data_requirements').default([]),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const reportGenerationsTable = pgTable('report_generations', {
  id: serial('id').primaryKey(),
  reportId: uuid('report_id').notNull().unique().defaultRandom(),
  templateId: uuid('template_id'),
  templateVersion: integer('template_version').default(1),
  title: text('title').notNull(),
  domain: text('domain').notNull().default('general'),
  reportType: text('report_type').notNull(),
  status: text('status', {
    enum: ['draft', 'review', 'approved', 'distributed', 'archived'],
  })
    .notNull()
    .default('draft'),
  brandTheme: text('brand_theme').notNull().default('szl'),
  dataSnapshot: jsonb('data_snapshot'),
  snapshotAt: timestamp('snapshot_at'),
  renderedBlocks: jsonb('rendered_blocks'),
  narrativeSections: jsonb('narrative_sections'),
  pdfBuffer: text('pdf_buffer'),
  pdfSizeBytes: integer('pdf_size_bytes'),
  formats: jsonb('formats').default([]),
  generationDurationMs: integer('generation_duration_ms'),
  scheduledRunId: text('scheduled_run_id'),
  parentReportId: uuid('parent_report_id'),
  versionNumber: integer('version_number').notNull().default(1),
  notes: text('notes'),
  generatedByUserId: integer('generated_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const reportApprovalsTable = pgTable('report_approvals', {
  id: serial('id').primaryKey(),
  approvalId: uuid('approval_id').notNull().unique().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  requestedByUserId: integer('requested_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  reviewerUserId: integer('reviewer_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'revision_requested'],
  })
    .notNull()
    .default('pending'),
  annotations: jsonb('annotations').default([]),
  comment: text('comment'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reportDistributionsTable = pgTable('report_distributions', {
  id: serial('id').primaryKey(),
  distributionId: uuid('distribution_id').notNull().unique().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name'),
  channel: text('channel', {
    enum: ['email', 'webhook', 'dashboard', 'download'],
  })
    .notNull()
    .default('email'),
  status: text('status', {
    enum: ['pending', 'sent', 'delivered', 'opened', 'failed'],
  })
    .notNull()
    .default('pending'),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  distributedByUserId: integer('distributed_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reportSchedulesTable = pgTable('report_schedules', {
  id: serial('id').primaryKey(),
  scheduleId: uuid('schedule_id').notNull().unique().defaultRandom(),
  name: text('name').notNull(),
  templateId: uuid('template_id').notNull(),
  domain: text('domain').notNull().default('general'),
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'on_demand'],
  })
    .notNull()
    .default('weekly'),
  isActive: boolean('is_active').notNull().default(true),
  dataConfig: jsonb('data_config').default({}),
  recipientEmails: jsonb('recipient_emails').default([]),
  autoApprove: boolean('auto_approve').notNull().default(false),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  lastStatus: text('last_status'),
  runCount: integer('run_count').notNull().default(0),
  failCount: integer('fail_count').notNull().default(0),
  createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertReportGenerationSchema = createInsertSchema(reportGenerationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertReportApprovalSchema = createInsertSchema(reportApprovalsTable).omit({
  id: true,
  createdAt: true,
});
export const insertReportDistributionSchema = createInsertSchema(reportDistributionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertReportScheduleSchema = createInsertSchema(reportSchedulesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ReportTemplate = typeof reportTemplatesTable.$inferSelect;
export type ReportGeneration = typeof reportGenerationsTable.$inferSelect;
export type ReportApproval = typeof reportApprovalsTable.$inferSelect;
export type ReportDistribution = typeof reportDistributionsTable.$inferSelect;
export type ReportSchedule = typeof reportSchedulesTable.$inferSelect;
