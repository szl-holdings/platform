import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ─── CERTIFICATION PROGRAMS ───────────────────────────────────────────────────

export const certificationProgramsTable = pgTable('certification_programs', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortName: text('short_name'),
  administeredBy: text('administered_by'),
  programType: text('program_type', {
    enum: ['state', 'federal', 'municipal', 'third_party'],
  })
    .notNull()
    .default('state'),
  targetDemographic: text('target_demographic'),
  description: text('description'),
  eligibilitySummary: text('eligibility_summary'),
  applicationUrl: text('application_url'),
  renewalIntervalMonths: integer('renewal_interval_months'),
  isActive: boolean('is_active').notNull().default(true),
  requiresAttorneyReview: boolean('requires_attorney_review').notNull().default(false),
  requiresCpaReview: boolean('requires_cpa_review').notNull().default(false),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── CERTIFICATION REQUIREMENTS ───────────────────────────────────────────────

export const certificationRequirementsTable = pgTable(
  'certification_requirements',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id')
      .notNull()
      .references(() => certificationProgramsTable.id, { onDelete: 'cascade' }),
    requirementKey: text('requirement_key').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category', {
      enum: [
        'ownership',
        'control',
        'documentation',
        'financials',
        'operational',
        'legal',
        'identity',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    isRequired: boolean('is_required').notNull().default(true),
    requiresReview: boolean('requires_review').notNull().default(false),
    reviewType: text('review_type', { enum: ['attorney', 'cpa', 'both', 'none'] })
      .notNull()
      .default('none'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('cert_reqs_program_idx').on(t.programId)],
);

// ─── CERTIFICATION STATUS ─────────────────────────────────────────────────────

export const certificationStatusTable = pgTable(
  'certification_status',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id')
      .notNull()
      .references(() => certificationProgramsTable.id, { onDelete: 'cascade' }),
    overallStatus: text('overall_status', {
      enum: [
        'not_started',
        'assessing',
        'preparing',
        'applied',
        'in_review',
        'approved',
        'denied',
        'renewal_due',
        'expired',
        'withdrawn',
      ],
    })
      .notNull()
      .default('not_started'),
    readinessScore: integer('readiness_score').notNull().default(0),
    appliedAt: timestamp('applied_at'),
    approvedAt: timestamp('approved_at'),
    expiresAt: timestamp('expires_at'),
    renewalDueAt: timestamp('renewal_due_at'),
    certificationNumber: text('certification_number'),
    certificationBody: text('certification_body'),
    blockers: jsonb('blockers'),
    nextActions: jsonb('next_actions'),
    notes: text('notes'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('cert_status_program_idx').on(t.programId)],
);

// ─── CERTIFICATION TASKS ──────────────────────────────────────────────────────

export const certificationTasksTable = pgTable(
  'certification_tasks',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id')
      .notNull()
      .references(() => certificationProgramsTable.id, { onDelete: 'cascade' }),
    requirementId: integer('requirement_id').references(() => certificationRequirementsTable.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    taskType: text('task_type', {
      enum: [
        'document_gather',
        'document_create',
        'review',
        'legal',
        'financial',
        'submit',
        'follow_up',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    status: text('status', { enum: ['open', 'in_progress', 'blocked', 'complete', 'na'] })
      .notNull()
      .default('open'),
    assignedTo: text('assigned_to'),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    artifactUrl: text('artifact_url'),
    flagsReview: boolean('flags_review').notNull().default(false),
    reviewType: text('review_type'),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cert_tasks_program_idx').on(t.programId),
    index('cert_tasks_status_idx').on(t.status),
  ],
);

// ─── APPLICATION ARTIFACTS ────────────────────────────────────────────────────

export const applicationArtifactsTable = pgTable(
  'application_artifacts',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id')
      .notNull()
      .references(() => certificationProgramsTable.id, { onDelete: 'cascade' }),
    taskId: integer('task_id').references(() => certificationTasksTable.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    artifactType: text('artifact_type', {
      enum: [
        'form',
        'supporting_doc',
        'identification',
        'financial_statement',
        'legal_doc',
        'attestation',
        'correspondence',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    status: text('status', {
      enum: ['needed', 'in_progress', 'complete', 'submitted', 'accepted', 'rejected'],
    })
      .notNull()
      .default('needed'),
    fileUrl: text('file_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('app_artifacts_program_idx').on(t.programId)],
);

// ─── OPPORTUNITY PIPELINE ─────────────────────────────────────────────────────

export const opportunityPipelineTable = pgTable(
  'opportunity_pipeline',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    opportunityType: text('opportunity_type', {
      enum: ['rfp', 'rfq', 'sole_source', 'idiq', 'bpa', 'set_aside', 'other'],
    })
      .notNull()
      .default('other'),
    source: text('source', { enum: ['ny_state', 'nyc', 'federal', 'other'] })
      .notNull()
      .default('federal'),
    agencyName: text('agency_name'),
    solicitation_number: text('solicitation_number'),
    naicsCodes: jsonb('naics_codes'),
    setAsideType: text('set_aside_type'),
    estimatedValue: text('estimated_value'),
    postedAt: timestamp('posted_at'),
    dueDate: timestamp('due_date'),
    status: text('status', {
      enum: [
        'tracking',
        'qualifying',
        'pursuing',
        'submitted',
        'awarded',
        'lost',
        'no_bid',
        'archived',
      ],
    })
      .notNull()
      .default('tracking'),
    fitScore: integer('fit_score'),
    fitNotes: text('fit_notes'),
    requiredCertifications: jsonb('required_certifications'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    opportunityUrl: text('opportunity_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('opportunity_status_idx').on(t.status),
    index('opportunity_source_idx').on(t.source),
  ],
);

// ─── PROCUREMENT CONTACTS ─────────────────────────────────────────────────────

export const procurementContactsTable = pgTable('procurement_contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  agency: text('agency'),
  agencyType: text('agency_type', { enum: ['ny_state', 'nyc', 'federal', 'other'] }),
  email: text('email'),
  phone: text('phone'),
  linkedinUrl: text('linkedin_url'),
  contactType: text('contact_type', {
    enum: ['contracting_officer', 'small_biz_liaison', 'program_manager', 'osd_contact', 'other'],
  })
    .notNull()
    .default('other'),
  relationshipStatus: text('relationship_status', {
    enum: ['cold', 'introduced', 'warm', 'engaged', 'partner'],
  })
    .notNull()
    .default('cold'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── CERTIFICATION CALENDAR ───────────────────────────────────────────────────

export const certificationCalendarTable = pgTable(
  'certification_calendar',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id').references(() => certificationProgramsTable.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    eventType: text('event_type', {
      enum: [
        'application_deadline',
        'renewal_deadline',
        'status_check',
        'document_due',
        'review_meeting',
        'submission',
        'follow_up',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    eventDate: timestamp('event_date').notNull(),
    reminderDays: integer('reminder_days').notNull().default(14),
    status: text('status', { enum: ['upcoming', 'overdue', 'complete', 'canceled'] })
      .notNull()
      .default('upcoming'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('cert_calendar_date_idx').on(t.eventDate)],
);

// ─── LEGAL REVIEW CHECKPOINTS ─────────────────────────────────────────────────

export const legalReviewCheckpointsTable = pgTable(
  'legal_review_checkpoints',
  {
    id: serial('id').primaryKey(),
    programId: integer('program_id').references(() => certificationProgramsTable.id, {
      onDelete: 'cascade',
    }),
    taskId: integer('task_id').references(() => certificationTasksTable.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    reviewType: text('review_type', { enum: ['attorney', 'cpa', 'both'] })
      .notNull()
      .default('attorney'),
    triggerCondition: text('trigger_condition'),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    status: text('status', { enum: ['pending', 'scheduled', 'in_review', 'complete', 'waived'] })
      .notNull()
      .default('pending'),
    reviewerName: text('reviewer_name'),
    scheduledAt: timestamp('scheduled_at'),
    completedAt: timestamp('completed_at'),
    outcomeNotes: text('outcome_notes'),
    legalDisclaimerAcknowledged: boolean('legal_disclaimer_acknowledged').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('legal_review_program_idx').on(t.programId),
    index('legal_review_status_idx').on(t.status),
  ],
);

// ─── NAICS CODE MAPPING ────────────────────────────────────────────────────────

export const naicsCodeMappingTable = pgTable('naics_code_mapping', {
  id: serial('id').primaryKey(),
  naicsCode: text('naics_code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  businessLine: text('business_line'),
  isSetAsideEligible: boolean('is_set_aside_eligible').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── INSERT SCHEMAS & TYPES ───────────────────────────────────────────────────

export const insertCertificationProgramSchema = createInsertSchema(certificationProgramsTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertCertificationProgram = z.infer<typeof insertCertificationProgramSchema>;
export type CertificationProgram = typeof certificationProgramsTable.$inferSelect;

export const insertCertificationRequirementSchema = createInsertSchema(
  certificationRequirementsTable,
).omit({ id: true, createdAt: true });
export type InsertCertificationRequirement = z.infer<typeof insertCertificationRequirementSchema>;
export type CertificationRequirement = typeof certificationRequirementsTable.$inferSelect;

export const insertCertificationStatusSchema = createInsertSchema(certificationStatusTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCertificationStatus = z.infer<typeof insertCertificationStatusSchema>;
export type CertificationStatus = typeof certificationStatusTable.$inferSelect;

export const insertCertificationTaskSchema = createInsertSchema(certificationTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCertificationTask = z.infer<typeof insertCertificationTaskSchema>;
export type CertificationTask = typeof certificationTasksTable.$inferSelect;

export const insertApplicationArtifactSchema = createInsertSchema(applicationArtifactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplicationArtifact = z.infer<typeof insertApplicationArtifactSchema>;
export type ApplicationArtifact = typeof applicationArtifactsTable.$inferSelect;

export const insertOpportunityPipelineSchema = createInsertSchema(opportunityPipelineTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpportunityPipeline = z.infer<typeof insertOpportunityPipelineSchema>;
export type OpportunityPipeline = typeof opportunityPipelineTable.$inferSelect;

export const insertProcurementContactSchema = createInsertSchema(procurementContactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProcurementContact = z.infer<typeof insertProcurementContactSchema>;
export type ProcurementContact = typeof procurementContactsTable.$inferSelect;

export const insertCertificationCalendarSchema = createInsertSchema(
  certificationCalendarTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCertificationCalendar = z.infer<typeof insertCertificationCalendarSchema>;
export type CertificationCalendar = typeof certificationCalendarTable.$inferSelect;

export const insertLegalReviewCheckpointSchema = createInsertSchema(
  legalReviewCheckpointsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalReviewCheckpoint = z.infer<typeof insertLegalReviewCheckpointSchema>;
export type LegalReviewCheckpoint = typeof legalReviewCheckpointsTable.$inferSelect;

export const insertNaicsCodeMappingSchema = createInsertSchema(naicsCodeMappingTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNaicsCodeMapping = z.infer<typeof insertNaicsCodeMappingSchema>;
export type NaicsCodeMapping = typeof naicsCodeMappingTable.$inferSelect;
