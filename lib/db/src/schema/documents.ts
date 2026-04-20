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
import { usersTable } from './auth';

export const documentsTable = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    type: text('type', {
      enum: [
        'deal_memo',
        'offer_letter',
        'property_report',
        'investor_packet',
        'incident_report',
        'vulnerability_assessment',
        'compliance_evidence',
        'penetration_test_summary',
        'engagement_letter',
        'nda',
        'service_agreement',
        'confidential_memo',
        'voyage_report',
        'charter_party',
        'port_state_inspection',
        'cargo_manifest',
        'workflow_approval_memo',
        'integration_spec',
        'change_request',
        'investor_one_pager',
        'platform_overview',
        'general',
      ],
    })
      .notNull()
      .default('general'),
    templateId: text('template_id'),
    contentJson: jsonb('content_json').notNull().default({}),
    status: text('status', {
      enum: ['draft', 'review', 'approved', 'signed', 'archived'],
    })
      .notNull()
      .default('draft'),
    ownerId: integer('owner_id').references(() => usersTable.id, { onDelete: 'set null' }),
    appSource: text('app_source', {
      enum: ['terra', 'aegis', 'carlota_jo', 'vessels', 'alloy', 'szl', 'general'],
    })
      .notNull()
      .default('general'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    mergeFieldValues: jsonb('merge_field_values').$type<Record<string, string>>().default({}),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('documents_status_idx').on(t.status),
    index('documents_app_source_idx').on(t.appSource),
    index('documents_owner_idx').on(t.ownerId),
    index('documents_entity_idx').on(t.entityType, t.entityId),
    index('documents_created_idx').on(t.createdAt),
  ],
);

export const documentVersionsTable = pgTable(
  'document_versions',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => documentsTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    contentJson: jsonb('content_json').notNull().default({}),
    changeNote: text('change_note'),
    savedById: integer('saved_by_id').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('doc_versions_doc_idx').on(t.documentId),
    index('doc_versions_version_idx').on(t.documentId, t.version),
  ],
);

export const documentCommentsTable = pgTable(
  'document_comments',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => documentsTable.id, { onDelete: 'cascade' }),
    authorId: integer('author_id').references(() => usersTable.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    sectionRef: text('section_ref'),
    content: text('content').notNull(),
    resolved: boolean('resolved').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('doc_comments_doc_idx').on(t.documentId)],
);

export const documentTemplatesTable = pgTable(
  'document_templates',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    appSource: text('app_source', {
      enum: ['terra', 'aegis', 'carlota_jo', 'vessels', 'alloy', 'szl', 'general'],
    })
      .notNull()
      .default('general'),
    documentType: text('document_type').notNull().default('general'),
    contentJson: jsonb('content_json').notNull().default({}),
    mergeFields: jsonb('merge_fields')
      .$type<Array<{ key: string; label: string; description?: string; required?: boolean }>>()
      .notNull()
      .default([]),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('doc_templates_slug_idx').on(t.slug),
    index('doc_templates_app_idx').on(t.appSource),
  ],
);

export const contentLibraryBlocksTable = pgTable(
  'content_library_blocks',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category', {
      enum: [
        'legal_clause',
        'standard_terms',
        'company_boilerplate',
        'intro',
        'signature_block',
        'disclaimer',
        'custom',
      ],
    })
      .notNull()
      .default('custom'),
    appSource: text('app_source').notNull().default('general'),
    contentJson: jsonb('content_json').notNull().default({}),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('content_blocks_category_idx').on(t.category),
    index('content_blocks_app_idx').on(t.appSource),
  ],
);

export const signaturesTable = pgTable(
  'signatures',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => documentsTable.id, { onDelete: 'cascade' }),
    signerEmail: text('signer_email').notNull(),
    signerName: text('signer_name').notNull(),
    signingOrder: integer('signing_order').notNull().default(1),
    status: text('status', {
      enum: ['pending', 'viewed', 'signed', 'declined', 'expired'],
    })
      .notNull()
      .default('pending'),
    signatureData: text('signature_data'),
    signatureType: text('signature_type', { enum: ['typed', 'drawn', 'uploaded'] }),
    signedAt: timestamp('signed_at'),
    viewedAt: timestamp('viewed_at'),
    declinedAt: timestamp('declined_at'),
    expiresAt: timestamp('expires_at'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    browserFingerprint: text('browser_fingerprint'),
    consentGiven: boolean('consent_given').notNull().default(false),
    auditHash: text('audit_hash'),
    signingToken: text('signing_token').unique(),
    reminderSentAt: timestamp('reminder_sent_at'),
    docuSignEnvelopeId: text('docusign_envelope_id'),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('signatures_doc_idx').on(t.documentId),
    index('signatures_status_idx').on(t.status),
    index('signatures_signer_idx').on(t.signerEmail),
    index('signatures_token_idx').on(t.signingToken),
  ],
);

export const pdfJobsTable = pgTable(
  'pdf_jobs',
  {
    id: serial('id').primaryKey(),
    batchId: text('batch_id').notNull(),
    templateId: text('template_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    entityData: jsonb('entity_data').$type<Record<string, unknown>>().default({}),
    appSource: text('app_source').notNull().default('general'),
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    outputUrl: text('output_url'),
    outputFilename: text('output_filename'),
    error: text('error'),
    scheduledFor: timestamp('scheduled_for'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    requestedById: integer('requested_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('pdf_jobs_batch_idx').on(t.batchId),
    index('pdf_jobs_status_idx').on(t.status),
    index('pdf_jobs_app_idx').on(t.appSource),
    index('pdf_jobs_created_idx').on(t.createdAt),
  ],
);

export const pdfBatchesTable = pgTable(
  'pdf_batches',
  {
    id: serial('id').primaryKey(),
    batchId: text('batch_id').notNull().unique(),
    title: text('title').notNull(),
    templateId: text('template_id').notNull(),
    appSource: text('app_source').notNull().default('general'),
    totalJobs: integer('total_jobs').notNull().default(0),
    completedJobs: integer('completed_jobs').notNull().default(0),
    failedJobs: integer('failed_jobs').notNull().default(0),
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    zipUrl: text('zip_url'),
    requestedById: integer('requested_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('pdf_batches_batch_id_idx').on(t.batchId),
    index('pdf_batches_status_idx').on(t.status),
    index('pdf_batches_app_idx').on(t.appSource),
  ],
);

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;

export const insertSignatureSchema = createInsertSchema(signaturesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSignature = z.infer<typeof insertSignatureSchema>;
export type Signature = typeof signaturesTable.$inferSelect;

export const insertPdfJobSchema = createInsertSchema(pdfJobsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPdfJob = z.infer<typeof insertPdfJobSchema>;
export type PdfJob = typeof pdfJobsTable.$inferSelect;

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type DocumentTemplate = typeof documentTemplatesTable.$inferSelect;
