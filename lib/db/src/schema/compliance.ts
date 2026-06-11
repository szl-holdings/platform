import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';

export const complianceSuitabilityTable = pgTable('compliance_suitability', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull(),
  clientName: text('client_name').notNull(),
  advisorId: text('advisor_id').notNull(),
  advisorName: text('advisor_name').notNull(),
  recommendationId: text('recommendation_id').notNull().unique(),
  recommendationType: text('recommendation_type', {
    enum: ['security', 'insurance', 'annuity', 'rollover', 'account_type', 'other'],
  }).notNull(),
  recommendationSummary: text('recommendation_summary').notNull(),
  rationaleText: text('rationale_text').notNull(),
  clientProfile: jsonb('client_profile').notNull(),
  riskTolerance: text('risk_tolerance', {
    enum: ['conservative', 'moderate', 'aggressive', 'very_aggressive'],
  }).notNull(),
  investmentObjective: text('investment_objective').notNull(),
  timeHorizonYears: integer('time_horizon_years'),
  liquidityNeeds: text('liquidity_needs'),
  financialSituation: jsonb('financial_situation'),
  conflicts: jsonb('conflicts'),
  status: text('status', { enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived'] })
    .notNull()
    .default('draft'),
  reviewerId: text('reviewer_id'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  regulatoryBasis: text('regulatory_basis').notNull().default('Regulation Best Interest (Reg BI)'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceArchivalTable = pgTable('compliance_archival', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  entryId: text('entry_id').notNull().unique(),
  prevHash: text('prev_hash'),
  contentHash: text('content_hash').notNull(),
  communicationType: text('communication_type', {
    enum: [
      'email',
      'chat',
      'voice_transcript',
      'written_correspondence',
      'trade_confirmation',
      'order_ticket',
      'advisory_agreement',
      'other',
    ],
  }).notNull(),
  participants: jsonb('participants').notNull(),
  subject: text('subject'),
  contentSummary: text('content_summary'),
  contentRef: text('content_ref'),
  retentionPolicy: text('retention_policy').notNull().default('rule_17a4_3year'),
  retentionExpiresAt: timestamp('retention_expires_at').notNull(),
  isImmutable: boolean('is_immutable').notNull().default(true),
  metadata: jsonb('metadata'),
  archivedAt: timestamp('archived_at').notNull().defaultNow(),
});

export const complianceSupervisionQueueTable = pgTable('compliance_supervision_queue', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().unique(),
  category: text('category', {
    enum: [
      'suitability_review',
      'reg_bi_violation',
      'concentration_risk',
      'best_execution',
      'outside_business',
      'communications_review',
      'complaint',
      'exception_report',
      'other',
    ],
  }).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('medium'),
  status: text('status', { enum: ['open', 'in_review', 'escalated', 'resolved', 'closed'] })
    .notNull()
    .default('open'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  assignedToId: text('assigned_to_id'),
  assignedToName: text('assigned_to_name'),
  submittedById: text('submitted_by_id'),
  submittedByName: text('submitted_by_name'),
  relatedEntities: jsonb('related_entities'),
  escalationLevel: integer('escalation_level').notNull().default(0),
  escalationChain: jsonb('escalation_chain'),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  dueAt: timestamp('due_at'),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  attachments: jsonb('attachments'),
  auditTrail: jsonb('audit_trail'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceCalendarTable = pgTable('compliance_calendar', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type', {
    enum: [
      'form_adv',
      'form_adv_part2',
      'form_crs',
      'annual_review',
      'exam_prep',
      'retention_review',
      'reg_bi_audit',
      'finra_exam',
      'sec_exam',
      'state_exam',
      'board_review',
      'policy_review',
      'other',
    ],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: timestamp('due_at').notNull(),
  reminderAt: timestamp('reminder_at'),
  status: text('status', { enum: ['upcoming', 'in_progress', 'completed', 'overdue', 'waived'] })
    .notNull()
    .default('upcoming'),
  assignedToId: text('assigned_to_id'),
  assignedToName: text('assigned_to_name'),
  regulatoryBody: text('regulatory_body'),
  filingReference: text('filing_reference'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  recurrence: text('recurrence', { enum: ['none', 'annual', 'quarterly', 'monthly', 'custom'] })
    .notNull()
    .default('none'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complianceRiskScoreTable = pgTable('compliance_risk_scores', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  scoreDate: timestamp('score_date').notNull().defaultNow(),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(),
  regBiScore: decimal('reg_bi_score', { precision: 5, scale: 2 }),
  archivalScore: decimal('archival_score', { precision: 5, scale: 2 }),
  supervisionScore: decimal('supervision_score', { precision: 5, scale: 2 }),
  openSupervisionItems: integer('open_supervision_items').notNull().default(0),
  criticalItems: integer('critical_items').notNull().default(0),
  overdueCalendarItems: integer('overdue_calendar_items').notNull().default(0),
  pendingSuitabilityReviews: integer('pending_suitability_reviews').notNull().default(0),
  breakdown: jsonb('breakdown'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertComplianceSuitabilitySchema = createInsertSchema(
  complianceSuitabilityTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceSuitability = z.infer<typeof insertComplianceSuitabilitySchema>;
export type ComplianceSuitability = typeof complianceSuitabilityTable.$inferSelect;

export const insertComplianceArchivalSchema = createInsertSchema(complianceArchivalTable).omit({
  id: true,
  archivedAt: true,
});
export type InsertComplianceArchival = z.infer<typeof insertComplianceArchivalSchema>;
export type ComplianceArchival = typeof complianceArchivalTable.$inferSelect;

export const insertComplianceSupervisionSchema = createInsertSchema(
  complianceSupervisionQueueTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceSupervision = z.infer<typeof insertComplianceSupervisionSchema>;
export type ComplianceSupervision = typeof complianceSupervisionQueueTable.$inferSelect;

export const insertComplianceCalendarSchema = createInsertSchema(complianceCalendarTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertComplianceCalendar = z.infer<typeof insertComplianceCalendarSchema>;
export type ComplianceCalendar = typeof complianceCalendarTable.$inferSelect;
