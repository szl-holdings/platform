/**
 * Formula registry, version history, invocation log, and tuning queue
 * for the A11oy Codex `/formulas` surface.
 *
 * Source: docs/audits/formulas.md, lib/formulas/src/registry.ts.
 */
import { index, integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './auth';

export const formulasTable = pgTable(
  'formulas',
  {
    id: serial('id').primaryKey(),
    formulaId: text('formula_id').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain', {
      enum: [
        'governance',
        'risk',
        'scoring',
        'optimization',
        'embedding',
        'routing',
        'evolution',
        'invariant',
        'physics',
        'arbitrage',
      ],
    }).notNull(),
    currentVersion: text('current_version').notNull(),
    description: text('description'),
    /** Provenance from FormulaSpec.provenance */
    provenance: jsonb('provenance').$type<{
      thesisDoc: string;
      thesisSection: string;
      thesisVersion: string;
      firstSeenCommit?: string;
      equation: string;
      intent: string;
      citations?: string[];
    }>(),
    /** Active parameter map { paramName: number } */
    parameters: jsonb('parameters').$type<Record<string, number>>().default({}),
    /** Files that consume this formula. */
    consumers: jsonb('consumers').$type<string[]>().default([]),
    inputShape: text('input_shape'),
    outputShape: text('output_shape'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('formulas_domain_idx').on(t.domain)],
);

export const formulaVersionsTable = pgTable(
  'formula_versions',
  {
    id: serial('id').primaryKey(),
    formulaId: text('formula_id').notNull(),
    version: text('version').notNull(),
    parameters: jsonb('parameters').$type<Record<string, number>>().notNull(),
    note: text('note'),
    promotedBy: integer('promoted_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('formula_versions_formula_idx').on(t.formulaId, t.createdAt)],
);

export const formulaInvocationsTable = pgTable(
  'formula_invocations',
  {
    id: serial('id').primaryKey(),
    formulaId: text('formula_id').notNull(),
    version: text('version').notNull(),
    inputHash: text('input_hash').notNull(),
    outputHash: text('output_hash').notNull(),
    caller: text('caller'),
    durationMs: numeric('duration_ms', { precision: 12, scale: 3 }),
    /** Optional structured metadata (org_id, user, request_id). */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    invokedAt: timestamp('invoked_at').notNull().defaultNow(),
  },
  (t) => [
    index('formula_invocations_formula_idx').on(t.formulaId, t.invokedAt),
    index('formula_invocations_caller_idx').on(t.caller),
  ],
);

export const formulaTuningProposalsTable = pgTable(
  'formula_tuning_proposals',
  {
    id: serial('id').primaryKey(),
    formulaId: text('formula_id').notNull(),
    fromVersion: text('from_version').notNull(),
    parameter: text('parameter').notNull(),
    oldValue: numeric('old_value', { precision: 20, scale: 10 }).notNull(),
    newValue: numeric('new_value', { precision: 20, scale: 10 }).notNull(),
    proposalScore: numeric('proposal_score', { precision: 12, scale: 6 }).notNull(),
    rationale: text('rationale').notNull(),
    /** ROSIE evidence: samples, gap, drift, citation. */
    evidence: jsonb('evidence').$type<{
      samples: number;
      gap: number;
      drift: number;
      thesisCitation: string;
    }>().notNull(),
    proposedBy: text('proposed_by').notNull().default('rosie'),
    status: text('status', { enum: ['pending', 'approved', 'rejected', 'superseded'] })
      .notNull()
      .default('pending'),
    decidedBy: integer('decided_by').references(() => usersTable.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at'),
    decisionNote: text('decision_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('formula_tuning_status_idx').on(t.status),
    index('formula_tuning_formula_idx').on(t.formulaId, t.createdAt),
  ],
);
