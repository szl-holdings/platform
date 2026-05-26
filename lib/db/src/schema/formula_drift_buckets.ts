/**
 * Durable storage for the ROSIE drift detector's rolling-window buckets.
 *
 * The in-memory `DriftDetector` (`lib/formulas/src/drift-detector.ts`)
 * write-throughs every `record()` call into this table so that a restart
 * of the api-server resumes accumulation where the previous process left
 * off, instead of re-earning the 25-sample threshold from scratch.
 *
 * Concurrency model
 * -----------------
 * The api-server is single-writer per process today, but the schema is
 * deliberately designed to be safe under future horizontal scale-out:
 *
 *   - `revision` is a per-(formula_id, parameter) monotonically increasing
 *     counter. Every UPSERT must include a revision strictly greater than
 *     the one already on disk; a `setWhere` clause enforces this at the
 *     SQL level, so a delayed write from any process cannot regress state.
 *   - `tombstoned_at` is a soft-delete marker. `drainSignals()` / `reset()`
 *     write a tombstone (revision bumped, history cleared) rather than
 *     issuing a hard DELETE. This means a stale UPSERT from another
 *     process that arrives AFTER a drain cannot resurrect the bucket —
 *     its lower revision is rejected by `setWhere`. A periodic janitor
 *     (follow-up task) hard-deletes tombstones older than retention.
 *   - On boot, `loadBuckets()` filters out tombstoned rows.
 *
 * Source: task #4960.
 */
import {
  bigint,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const formulaDriftBucketsTable = pgTable(
  'formula_drift_buckets',
  {
    formulaId: text('formula_id').notNull(),
    parameter: text('parameter').notNull(),
    oldValue: doublePrecision('old_value').notNull(),
    candidateValue: doublePrecision('candidate_value').notNull(),
    fromVersion: text('from_version').notNull(),
    thesisCitation: text('thesis_citation').notNull(),
    irreversibility: doublePrecision('irreversibility').notNull().default(0),
    observedHistory: jsonb('observed_history').$type<number[]>().notNull().default([]),
    baselineHistory: jsonb('baseline_history').$type<number[]>().notNull().default([]),
    gapHistory: jsonb('gap_history').$type<number[]>().notNull().default([]),
    totalSamples: integer('total_samples').notNull().default(0),
    /**
     * Monotonic per-key revision. Incremented on every write (including
     * tombstone writes). UPSERTs are gated on `EXCLUDED.revision >
     * formula_drift_buckets.revision` so stale writes cannot regress
     * state — even from a second writer process.
     */
    revision: bigint('revision', { mode: 'number' }).notNull().default(0),
    /**
     * Soft-delete marker. NULL = live bucket. Non-NULL = drained; the
     * row is retained so the high revision blocks resurrection by
     * stale upserts. `loadBuckets()` filters these out.
     */
    tombstonedAt: timestamp('tombstoned_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.formulaId, t.parameter] })],
);

export type FormulaDriftBucketRow = typeof formulaDriftBucketsTable.$inferSelect;
export type InsertFormulaDriftBucket = typeof formulaDriftBucketsTable.$inferInsert;
