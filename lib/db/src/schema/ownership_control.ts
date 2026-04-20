import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ─── OWNERSHIP SCENARIOS ─────────────────────────────────────────────────────

export const ownershipScenariosTable = pgTable(
  'ownership_scenarios',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    isTemplate: boolean('is_template').notNull().default(false),
    isActive: boolean('is_active').notNull().default(false),
    isPreferred: boolean('is_preferred').notNull().default(false),
    status: text('status', { enum: ['draft', 'under_review', 'approved', 'archived'] })
      .notNull()
      .default('draft'),
    certificationFitSummary: text('certification_fit_summary'),
    fundraisingFitScore: integer('fundraising_fit_score'),
    bankFitScore: integer('bank_fit_score'),
    investorClarityScore: integer('investor_clarity_score'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('ownership_scenarios_status_idx').on(t.status),
    index('ownership_scenarios_is_active_idx').on(t.isActive),
  ],
);

// ─── OWNERSHIP ALLOCATIONS ───────────────────────────────────────────────────

export const ownershipAllocationsTable = pgTable(
  'ownership_allocations',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    role: text('role', { enum: ['primary_owner', 'co_owner', 'minority_owner', 'advisor', 'none'] })
      .notNull()
      .default('co_owner'),
    equityPct: numeric('equity_pct', { precision: 6, scale: 3 }).notNull(),
    votingRightsPct: numeric('voting_rights_pct', { precision: 6, scale: 3 }),
    isControlling: boolean('is_controlling').notNull().default(false),
    isMajorityOwner: boolean('is_majority_owner').notNull().default(false),
    citizenshipConfirmed: boolean('citizenship_confirmed').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('ownership_allocations_scenario_idx').on(t.scenarioId)],
);

// ─── CONTROL ROLES ───────────────────────────────────────────────────────────

export const controlRolesTable = pgTable(
  'control_roles',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    hasDayToDayControl: boolean('has_day_to_day_control').notNull().default(false),
    hasLongTermDecisionAuthority: boolean('has_long_term_decision_authority')
      .notNull()
      .default(false),
    hasHiringFiringAuthority: boolean('has_hiring_firing_authority').notNull().default(false),
    hasStrategicVeto: boolean('has_strategic_veto').notNull().default(false),
    controlDescription: text('control_description'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('control_roles_scenario_idx').on(t.scenarioId)],
);

// ─── OFFICER ROLES ───────────────────────────────────────────────────────────

export const officerRolesTable = pgTable(
  'officer_roles',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    title: text('title').notNull(),
    isPrimaryOfficer: boolean('is_primary_officer').notNull().default(false),
    isOnRegistration: boolean('is_on_registration').notNull().default(false),
    isOnBankAccount: boolean('is_on_bank_account').notNull().default(false),
    isOnOperatingAgreement: boolean('is_on_operating_agreement').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('officer_roles_scenario_idx').on(t.scenarioId)],
);

// ─── MANAGER ROLES ───────────────────────────────────────────────────────────

export const managerRolesTable = pgTable(
  'manager_roles',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    managementArea: text('management_area', {
      enum: [
        'finance',
        'sales',
        'operations',
        'product',
        'certifications',
        'hr',
        'legal',
        'technology',
        'other',
      ],
    }).notNull(),
    responsibility: text('responsibility'),
    isDocumented: boolean('is_documented').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('manager_roles_scenario_idx').on(t.scenarioId)],
);

// ─── SIGNATURE AUTHORITY RECORDS ─────────────────────────────────────────────

export const signatureAuthorityRecordsTable = pgTable(
  'signature_authority_records',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    authorityType: text('authority_type', {
      enum: [
        'bank_primary',
        'bank_secondary',
        'contracts',
        'payroll',
        'legal_filings',
        'government_forms',
        'other',
      ],
    }).notNull(),
    institution: text('institution'),
    isActive: boolean('is_active').notNull().default(true),
    documentationStatus: text('documentation_status', {
      enum: ['documented', 'pending', 'not_started'],
    })
      .notNull()
      .default('not_started'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('signature_authority_scenario_idx').on(t.scenarioId)],
);

// ─── CAPITAL CONTRIBUTIONS ───────────────────────────────────────────────────

export const capitalContributionsTable = pgTable(
  'capital_contributions',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    contributionType: text('contribution_type', {
      enum: ['cash', 'services', 'ip', 'equipment', 'other'],
    })
      .notNull()
      .default('cash'),
    amountCents: integer('amount_cents'),
    description: text('description'),
    isDocumented: boolean('is_documented').notNull().default(false),
    documentReference: text('document_reference'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('capital_contributions_scenario_idx').on(t.scenarioId)],
);

// ─── VOTING RIGHTS ───────────────────────────────────────────────────────────

export const votingRightsTable = pgTable(
  'voting_rights',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    personName: text('person_name').notNull(),
    votingPct: numeric('voting_pct', { precision: 6, scale: 3 }).notNull(),
    hasVetoRight: boolean('has_veto_right').notNull().default(false),
    restrictions: text('restrictions'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('voting_rights_scenario_idx').on(t.scenarioId)],
);

// ─── CERTIFICATION READINESS RECORDS ─────────────────────────────────────────

export const certificationReadinessRecordsTable = pgTable(
  'certification_readiness_records',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    certificationName: text('certification_name').notNull(),
    certificationBody: text('certification_body'),
    fitLevel: text('fit_level', { enum: ['strong', 'moderate', 'weak', 'not_applicable'] })
      .notNull()
      .default('moderate'),
    keyRequirements: text('key_requirements'),
    gapSummary: text('gap_summary'),
    requiredDocuments: jsonb('required_documents'),
    estimatedReadinessDate: timestamp('estimated_readiness_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('cert_readiness_scenario_idx').on(t.scenarioId)],
);

// ─── LEGAL REVIEW FLAGS ──────────────────────────────────────────────────────

export const legalReviewFlagsTable = pgTable(
  'legal_review_flags',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    flagType: text('flag_type', {
      enum: [
        'attorney_review',
        'cpa_review',
        'operating_agreement',
        'articles_amendment',
        'banking_change',
        'payroll_alignment',
        'certification_docs',
        'other',
      ],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    status: text('status', { enum: ['open', 'in_progress', 'resolved'] })
      .notNull()
      .default('open'),
    assignedTo: text('assigned_to'),
    resolvedAt: timestamp('resolved_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('legal_review_flags_scenario_idx').on(t.scenarioId),
    index('legal_review_flags_status_idx').on(t.status),
  ],
);

// ─── GOVERNANCE DOCUMENTS ────────────────────────────────────────────────────

export const governanceDocumentsTable = pgTable(
  'governance_documents',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    documentType: text('document_type', {
      enum: [
        'operating_agreement',
        'articles_of_organization',
        'shareholder_agreement',
        'buy_sell_agreement',
        'board_resolution',
        'officer_appointment',
        'ownership_certificate',
        'other',
      ],
    }).notNull(),
    title: text('title').notNull(),
    status: text('status', { enum: ['current', 'draft', 'needs_update', 'missing'] })
      .notNull()
      .default('missing'),
    fileReference: text('file_reference'),
    lastReviewedAt: timestamp('last_reviewed_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('governance_documents_scenario_idx').on(t.scenarioId)],
);

// ─── OWNERSHIP DECISION LOGS ─────────────────────────────────────────────────

export const ownershipDecisionLogsTable = pgTable(
  'ownership_decision_logs',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .notNull()
      .references(() => ownershipScenariosTable.id, { onDelete: 'cascade' }),
    decisionType: text('decision_type', {
      enum: [
        'scenario_created',
        'scenario_activated',
        'structure_changed',
        'certification_target_set',
        'legal_flag_raised',
        'document_updated',
        'advisor_consulted',
        'other',
      ],
    }).notNull(),
    summary: text('summary').notNull(),
    madeBy: text('made_by'),
    rationale: text('rationale'),
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('ownership_decision_logs_scenario_idx').on(t.scenarioId),
    index('ownership_decision_logs_occurred_at_idx').on(t.occurredAt),
  ],
);

// ─── INSERT SCHEMAS ───────────────────────────────────────────────────────────

export const insertOwnershipScenarioSchema = createInsertSchema(ownershipScenariosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOwnershipScenario = z.infer<typeof insertOwnershipScenarioSchema>;
export type OwnershipScenario = typeof ownershipScenariosTable.$inferSelect;

export const insertOwnershipAllocationSchema = createInsertSchema(ownershipAllocationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOwnershipAllocation = z.infer<typeof insertOwnershipAllocationSchema>;
export type OwnershipAllocation = typeof ownershipAllocationsTable.$inferSelect;

export const insertControlRoleSchema = createInsertSchema(controlRolesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertControlRole = z.infer<typeof insertControlRoleSchema>;
export type ControlRole = typeof controlRolesTable.$inferSelect;

export const insertOfficerRoleSchema = createInsertSchema(officerRolesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOfficerRole = z.infer<typeof insertOfficerRoleSchema>;
export type OfficerRole = typeof officerRolesTable.$inferSelect;

export const insertManagerRoleSchema = createInsertSchema(managerRolesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertManagerRole = z.infer<typeof insertManagerRoleSchema>;
export type ManagerRole = typeof managerRolesTable.$inferSelect;

export const insertSignatureAuthorityRecordSchema = createInsertSchema(
  signatureAuthorityRecordsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSignatureAuthorityRecord = z.infer<typeof insertSignatureAuthorityRecordSchema>;
export type SignatureAuthorityRecord = typeof signatureAuthorityRecordsTable.$inferSelect;

export const insertCapitalContributionSchema = createInsertSchema(capitalContributionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCapitalContribution = z.infer<typeof insertCapitalContributionSchema>;
export type CapitalContribution = typeof capitalContributionsTable.$inferSelect;

export const insertVotingRightsSchema = createInsertSchema(votingRightsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVotingRights = z.infer<typeof insertVotingRightsSchema>;
export type VotingRights = typeof votingRightsTable.$inferSelect;

export const insertCertificationReadinessRecordSchema = createInsertSchema(
  certificationReadinessRecordsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCertificationReadinessRecord = z.infer<
  typeof insertCertificationReadinessRecordSchema
>;
export type CertificationReadinessRecord = typeof certificationReadinessRecordsTable.$inferSelect;

export const insertLegalReviewFlagSchema = createInsertSchema(legalReviewFlagsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLegalReviewFlag = z.infer<typeof insertLegalReviewFlagSchema>;
export type LegalReviewFlag = typeof legalReviewFlagsTable.$inferSelect;

export const insertGovernanceDocumentSchema = createInsertSchema(governanceDocumentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGovernanceDocument = z.infer<typeof insertGovernanceDocumentSchema>;
export type GovernanceDocument = typeof governanceDocumentsTable.$inferSelect;

export const insertOwnershipDecisionLogSchema = createInsertSchema(ownershipDecisionLogsTable).omit(
  { id: true, createdAt: true },
);
export type InsertOwnershipDecisionLog = z.infer<typeof insertOwnershipDecisionLogSchema>;
export type OwnershipDecisionLog = typeof ownershipDecisionLogsTable.$inferSelect;
