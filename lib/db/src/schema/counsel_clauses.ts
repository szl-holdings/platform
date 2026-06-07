import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from './organizations';

export const counselClausesTable = pgTable(
  'counsel_clauses',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    clauseType: text('clause_type').notNull(),
    category: text('category').notNull(),
    title: text('title').notNull(),
    text: text('text').notNull(),
    matterId: text('matter_id'),
    matterName: text('matter_name'),
    documentRef: text('document_ref'),
    jurisdiction: text('jurisdiction'),
    riskScore: real('risk_score').notNull().default(0),
    riskTags: jsonb('risk_tags').notNull().default([]),
    taxonomyTags: jsonb('taxonomy_tags').notNull().default([]),
    provenanceEnvelope: jsonb('provenance_envelope'),
    confidenceBand: jsonb('confidence_band'),
    precedentLinks: jsonb('precedent_links').notNull().default([]),
    effectiveDate: timestamp('effective_date'),
    status: text('status', { enum: ['active', 'superseded', 'draft', 'archived'] })
      .notNull()
      .default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cc_org_type_idx').on(t.orgId, t.clauseType),
    index('cc_matter_idx').on(t.matterId),
    index('cc_risk_idx').on(t.riskScore),
  ],
);

export const counselPlaybookRulesTable = pgTable(
  'counsel_playbook_rules',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    clauseType: text('clause_type').notNull(),
    ruleName: text('rule_name').notNull(),
    description: text('description'),
    requiredLanguage: text('required_language'),
    prohibitedTerms: jsonb('prohibited_terms').notNull().default([]),
    riskThreshold: real('risk_threshold').notNull().default(0.5),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cpr_org_type_idx').on(t.orgId, t.clauseType),
    index('cpr_severity_idx').on(t.severity),
  ],
);

export const counselDraftSessionsTable = pgTable(
  'counsel_draft_sessions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    clauseType: text('clause_type').notNull(),
    context: text('context'),
    matterId: text('matter_id'),
    draftText: text('draft_text').notNull(),
    citations: jsonb('citations').notNull().default([]),
    provenanceEnvelope: jsonb('provenance_envelope').notNull(),
    confidenceBand: jsonb('confidence_band').notNull(),
    riskDiff: jsonb('risk_diff'),
    status: text('status', { enum: ['draft', 'approved', 'rejected', 'superseded'] })
      .notNull()
      .default('draft'),
    createdBy: integer('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('cds_org_type_idx').on(t.orgId, t.clauseType),
    index('cds_matter_idx').on(t.matterId),
    index('cds_created_idx').on(t.createdAt),
  ],
);

export type CounselClause = typeof counselClausesTable.$inferSelect;
export type CounselPlaybookRule = typeof counselPlaybookRulesTable.$inferSelect;
export type CounselDraftSession = typeof counselDraftSessionsTable.$inferSelect;
