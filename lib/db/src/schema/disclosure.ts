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
import { organizationsTable } from './organizations';

// ─── Disclosure Recipients ────────────────────────────────────────────────────

export const disclosureRecipientsTable = pgTable(
  'disclosure_recipients',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id').notNull().unique(),
    name: text('name').notNull(),
    type: text('type', {
      enum: ['subprocessor', 'controller', 'third_party', 'partner', 'regulator', 'other'],
    }).notNull(),
    country: text('country'),
    legalBasis: text('legal_basis', {
      enum: [
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_task',
        'legitimate_interests',
        'consent',
        'other',
      ],
    }).notNull(),
    dataCategories: jsonb('data_categories').$type<string[]>().notNull().default([]),
    purposeDescription: text('purpose_description').notNull(),
    contactEmail: text('contact_email'),
    safeguards: text('safeguards'),
    isApproved: boolean('is_approved').notNull().default(false),
    approvedAt: timestamp('approved_at'),
    approvedBy: text('approved_by'),
    archivedAt: timestamp('archived_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('dr_org_id_idx').on(t.orgId),
    index('dr_type_idx').on(t.type),
    index('dr_legal_basis_idx').on(t.legalBasis),
  ],
);

// ─── Disclosure Records ───────────────────────────────────────────────────────

export const disclosureRecordsTable = pgTable(
  'disclosure_records',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    disclosureId: text('disclosure_id').notNull().unique(),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => disclosureRecipientsTable.recipientId, { onDelete: 'restrict' }),
    agreementId: text('agreement_id').references(() => legalAgreementsTable.agreementId, {
      onDelete: 'set null',
    }),
    dataCategories: jsonb('data_categories').$type<string[]>().notNull().default([]),
    legalBasis: text('legal_basis', {
      enum: [
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_task',
        'legitimate_interests',
        'consent',
        'other',
      ],
    }).notNull(),
    purposeDescription: text('purpose_description').notNull(),
    transferMechanism: text('transfer_mechanism', {
      enum: ['standard_contractual_clauses', 'adequacy_decision', 'binding_corporate_rules', 'derogation', 'api_integration', 'other'],
    }),
    status: text('status', {
      enum: ['active', 'pending_approval', 'approved', 'expired', 'terminated', 'archived'],
    })
      .notNull()
      .default('pending_approval'),
    effectiveAt: timestamp('effective_at'),
    expiresAt: timestamp('expires_at'),
    lastReviewedAt: timestamp('last_reviewed_at'),
    proofLedgerEntryId: text('proof_ledger_entry_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('drec_org_id_idx').on(t.orgId),
    index('drec_recipient_id_idx').on(t.recipientId),
    index('drec_status_idx').on(t.status),
    index('drec_expires_at_idx').on(t.expiresAt),
  ],
);

// ─── Disclosure Subprocessors ─────────────────────────────────────────────────

export const disclosureSubprocessorsTable = pgTable(
  'disclosure_subprocessors',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    subprocessorId: text('subprocessor_id').notNull().unique(),
    name: text('name').notNull(),
    country: text('country').notNull(),
    serviceDescription: text('service_description').notNull(),
    dataCategories: jsonb('data_categories').$type<string[]>().notNull().default([]),
    dpaReference: text('dpa_reference'),
    certifications: jsonb('certifications').$type<string[]>().notNull().default([]),
    status: text('status', { enum: ['active', 'pending', 'removed', 'under_review'] })
      .notNull()
      .default('pending'),
    addedAt: timestamp('added_at').notNull().defaultNow(),
    removedAt: timestamp('removed_at'),
    lastAuditedAt: timestamp('last_audited_at'),
    proofLedgerEntryId: text('proof_ledger_entry_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('dsp_org_id_idx').on(t.orgId),
    index('dsp_status_idx').on(t.status),
  ],
);

// ─── Legal Agreements ─────────────────────────────────────────────────────────

export const legalAgreementsTable = pgTable(
  'legal_agreements',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    agreementId: text('agreement_id').notNull().unique(),
    agreementType: text('agreement_type', {
      enum: ['msa', 'dpa', 'nda', 'sla', 'addendum', 'other'],
    }).notNull(),
    counterpartyName: text('counterparty_name').notNull(),
    counterpartyEmail: text('counterparty_email'),
    status: text('status', {
      enum: ['draft', 'sent', 'under_review', 'countersigned', 'active', 'expired', 'terminated'],
    })
      .notNull()
      .default('draft'),
    version: text('version').notNull().default('1.0'),
    linkedMatterId: text('linked_matter_id'),
    linkedRecipientId: text('linked_recipient_id'),
    effectiveDate: timestamp('effective_date'),
    expiryDate: timestamp('expiry_date'),
    sentAt: timestamp('sent_at'),
    countersignedAt: timestamp('countersigned_at'),
    terminatedAt: timestamp('terminated_at'),
    terminationReason: text('termination_reason'),
    contentHash: text('content_hash'),
    proofLedgerEntryId: text('proof_ledger_entry_id'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('la_org_id_idx').on(t.orgId),
    index('la_type_idx').on(t.agreementType),
    index('la_status_idx').on(t.status),
    index('la_counterparty_idx').on(t.counterpartyName),
    index('la_expiry_idx').on(t.expiryDate),
  ],
);

// ─── Legal Agreement Versions ─────────────────────────────────────────────────

export const legalAgreementVersionsTable = pgTable(
  'legal_agreement_versions',
  {
    id: serial('id').primaryKey(),
    agreementId: text('agreement_id')
      .notNull()
      .references(() => legalAgreementsTable.agreementId, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    changeDescription: text('change_description'),
    contentSnapshot: text('content_snapshot'),
    contentHash: text('content_hash'),
    authoredBy: text('authored_by'),
    status: text('status', { enum: ['draft', 'active', 'superseded', 'archived'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('lav_agreement_id_idx').on(t.agreementId),
    index('lav_org_id_idx').on(t.orgId),
  ],
);

// ─── Compliance Framework Controls ───────────────────────────────────────────

export const complianceFrameworkControlsTable = pgTable(
  'compliance_framework_controls',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    controlId: text('control_id').notNull().unique(),
    framework: text('framework', {
      enum: ['eu-ai-act', 'nist-ai-rmf', 'iso-42001', 'csa-agentic'],
    }).notNull(),
    controlRef: text('control_ref').notNull(),
    controlTitle: text('control_title').notNull(),
    description: text('description').notNull(),
    a11oyPrimitive: text('a11oy_primitive'),
    evidenceSource: text('evidence_source'),
    freshnessThresholdDays: integer('freshness_threshold_days').notNull().default(30),
    drilldownType: text('drilldown_type', {
      enum: [
        'proof-ledger',
        'mirror-eval',
        'behavioral-audit',
        'system-card',
        'red-team',
        'covenant',
        'welfare',
        'snapshot',
        'glasswing',
        'cavd',
      ],
    }),
    drilldownDetail: text('drilldown_detail'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cfc_framework_idx').on(t.framework),
    index('cfc_org_id_idx').on(t.orgId),
  ],
);

// ─── Compliance Control Evidence ──────────────────────────────────────────────

export const complianceControlEvidenceTable = pgTable(
  'compliance_control_evidence',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    controlId: text('control_id')
      .notNull()
      .references(() => complianceFrameworkControlsTable.controlId, { onDelete: 'cascade' }),
    evidenceStatus: text('evidence_status', { enum: ['fresh', 'stale', 'gap'] })
      .notNull()
      .default('gap'),
    lastEvidenceAt: timestamp('last_evidence_at'),
    lastAssessedAt: timestamp('last_assessed_at').notNull().defaultNow(),
    evidenceRef: text('evidence_ref'),
    notes: text('notes'),
    isStale: boolean('is_stale').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cce_control_id_idx').on(t.controlId),
    index('cce_org_id_idx').on(t.orgId),
    index('cce_status_idx').on(t.evidenceStatus),
    index('cce_last_assessed_idx').on(t.lastAssessedAt),
  ],
);

// ─── Inferred Insert Types ────────────────────────────────────────────────────

export const insertDisclosureRecipientSchema = createInsertSchema(disclosureRecipientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDisclosureRecipient = z.infer<typeof insertDisclosureRecipientSchema>;
export type DisclosureRecipient = typeof disclosureRecipientsTable.$inferSelect;

export const insertDisclosureRecordSchema = createInsertSchema(disclosureRecordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDisclosureRecord = z.infer<typeof insertDisclosureRecordSchema>;
export type DisclosureRecord = typeof disclosureRecordsTable.$inferSelect;

export const insertDisclosureSubprocessorSchema = createInsertSchema(
  disclosureSubprocessorsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDisclosureSubprocessor = z.infer<typeof insertDisclosureSubprocessorSchema>;
export type DisclosureSubprocessor = typeof disclosureSubprocessorsTable.$inferSelect;

export const insertLegalAgreementSchema = createInsertSchema(legalAgreementsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLegalAgreement = z.infer<typeof insertLegalAgreementSchema>;
export type LegalAgreement = typeof legalAgreementsTable.$inferSelect;

export const insertLegalAgreementVersionSchema = createInsertSchema(
  legalAgreementVersionsTable,
).omit({ id: true, createdAt: true });
export type InsertLegalAgreementVersion = z.infer<typeof insertLegalAgreementVersionSchema>;
export type LegalAgreementVersion = typeof legalAgreementVersionsTable.$inferSelect;

export const insertComplianceFrameworkControlSchema = createInsertSchema(
  complianceFrameworkControlsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceFrameworkControl = z.infer<
  typeof insertComplianceFrameworkControlSchema
>;
export type ComplianceFrameworkControl = typeof complianceFrameworkControlsTable.$inferSelect;

export const insertComplianceControlEvidenceSchema = createInsertSchema(
  complianceControlEvidenceTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceControlEvidence = z.infer<typeof insertComplianceControlEvidenceSchema>;
export type ComplianceControlEvidence = typeof complianceControlEvidenceTable.$inferSelect;
