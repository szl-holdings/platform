import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * LEXICON — License Intelligence Catalog
 *
 * Folded into A11oy from the archived `lyte-command-center` artifact (task
 * #4763). Powers the operator-driven `license_approved` governance gate
 * (one of the five HF inference gates). When an inference call asks about a
 * model not present in the catalog, the api-server enqueues a review request
 * automatically and the gate fails closed until an operator approves.
 *
 * Three tables:
 *   - lexicon_entries          : the authoritative catalog (one row per
 *                                model/dataset license target)
 *   - lexicon_review_requests  : pending operator-review queue
 *   - lexicon_decisions        : append-only audit trail of every
 *                                approve/deny decision
 */

export const LEXICON_ENTRY_KINDS = ['model', 'dataset'] as const;
export type LexiconEntryKind = (typeof LEXICON_ENTRY_KINDS)[number];

export const LEXICON_LICENSE_STATUSES = [
  'pending_review',
  'approved',
  'denied',
  'risk_flagged',
] as const;
export type LexiconLicenseStatus = (typeof LEXICON_LICENSE_STATUSES)[number];

export const LEXICON_REVIEW_STATUSES = ['pending', 'approved', 'denied'] as const;
export type LexiconReviewStatus = (typeof LEXICON_REVIEW_STATUSES)[number];

export const lexiconEntriesTable = pgTable(
  'lexicon_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Canonical target identifier (e.g. HF modelId `Qwen/Qwen3-8B`). */
    targetId: text('target_id').notNull().unique(),
    kind: text('kind').notNull().$type<LexiconEntryKind>().default('model'),
    provider: text('provider').notNull().default('huggingface'),
    license: text('license').notNull().default('unknown'),
    status: text('status').notNull().$type<LexiconLicenseStatus>().default('pending_review'),
    riskFlagged: boolean('risk_flagged').notNull().default(false),
    riskNote: text('risk_note'),
    description: text('description').notNull().default(''),
    /** Free-form metadata: source URL, sensitivity, derived data fields. */
    metadata: jsonb('metadata').notNull().default({}),
    seeded: boolean('seeded').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('lexicon_entries_status_idx').on(t.status),
    providerIdx: index('lexicon_entries_provider_idx').on(t.provider),
  }),
);

export const lexiconReviewRequestsTable = pgTable(
  'lexicon_review_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => lexiconEntriesTable.id, { onDelete: 'cascade' }),
    status: text('status').notNull().$type<LexiconReviewStatus>().default('pending'),
    /** Where the review was triggered from (e.g. `inference_gate`, `manual`). */
    requestedBy: text('requested_by').notNull().default('inference_gate'),
    /** Free-form context (e.g. requesting product, model invocation id). */
    context: jsonb('context').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
  },
  (t) => ({
    statusIdx: index('lexicon_review_requests_status_idx').on(t.status),
    entryIdx: index('lexicon_review_requests_entry_idx').on(t.entryId),
  }),
);

export const lexiconDecisionsTable = pgTable(
  'lexicon_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => lexiconEntriesTable.id, { onDelete: 'cascade' }),
    reviewRequestId: uuid('review_request_id').references(
      () => lexiconReviewRequestsTable.id,
      { onDelete: 'set null' },
    ),
    decision: text('decision').notNull().$type<'approved' | 'denied'>(),
    reason: text('reason').notNull().default(''),
    /** Operator/principal that made the decision. */
    decidedBy: text('decided_by').notNull(),
    decidedAt: timestamp('decided_at').notNull().defaultNow(),
  },
  (t) => ({
    entryIdx: index('lexicon_decisions_entry_idx').on(t.entryId),
    decidedAtIdx: index('lexicon_decisions_decided_at_idx').on(t.decidedAt),
  }),
);

export type LexiconEntryRow = typeof lexiconEntriesTable.$inferSelect;
export type InsertLexiconEntry = typeof lexiconEntriesTable.$inferInsert;
export type LexiconReviewRequestRow = typeof lexiconReviewRequestsTable.$inferSelect;
export type InsertLexiconReviewRequest = typeof lexiconReviewRequestsTable.$inferInsert;
export type LexiconDecisionRow = typeof lexiconDecisionsTable.$inferSelect;
export type InsertLexiconDecision = typeof lexiconDecisionsTable.$inferInsert;
