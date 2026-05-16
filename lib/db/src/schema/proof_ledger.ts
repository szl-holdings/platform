import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Proof Ledger — durable persistence for the A11oy fabric proof stream
 * (task #4879).
 *
 * Lexicon decisions and orchestration events emit proofs via `appendProof`
 * in `artifacts/api-server/src/services/orchestration-store.ts`. Historically
 * those proofs lived only in memory and were lost on every server restart,
 * which broke the governance audit trail. This table is the durable backing
 * store: every `appendProof` call is mirrored here, and the in-memory ring
 * is rehydrated from the most recent rows on boot.
 *
 * One row per proof. The id matches the in-memory entry id (e.g. `pf-xxxxxxxx`)
 * so that listProofs() can return identical identifiers before and after a
 * restart.
 */
export const proofLedgerTable = pgTable(
  'proof_ledger',
  {
    /** Stable proof id (matches in-memory ring entry id, e.g. `pf-3f1c8a2b`). */
    id: text('id').primaryKey(),
    product: text('product').notNull(),
    kind: text('kind').notNull(),
    summary: text('summary').notNull(),
    deepLink: text('deep_link'),
    relatedProduct: text('related_product'),
    /** Captures the modelUsed hint so product.modelsUsed can be rebuilt on hydrate. */
    modelUsed: text('model_used'),
    payload: jsonb('payload').notNull().default({}),
    ts: timestamp('ts', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index('proof_ledger_product_idx').on(t.product),
    tsIdx: index('proof_ledger_ts_idx').on(t.ts),
  }),
);

export type ProofLedgerRow = typeof proofLedgerTable.$inferSelect;
export type InsertProofLedgerRow = typeof proofLedgerTable.$inferInsert;
