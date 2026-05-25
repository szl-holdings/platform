import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export type AttestationKind = 'backfill' | 'catch_up';
export type QuarantineDecision = 'pending' | 'accepted' | 'known_bad' | 'escalated';
export type AttestationCheckpointStatus = 'running' | 'paused' | 'completed' | 'failed';

/**
 * proof_chain_hybrid_attestations
 *
 * Parallel record appended for each historical audit_chain_events row,
 * carrying a hybrid (Ed25519 + ML-DSA-65) signature signed by the SZL
 * platform attestation authority. The original event is never rewritten —
 * this is a backward attestation, not a re-signature of the underlying ledger.
 */
export const proofChainHybridAttestationsTable = pgTable(
  'proof_chain_hybrid_attestations',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().unique(),
    eventHash: text('event_hash').notNull(),
    orgId: integer('org_id'),
    ed25519Sig: text('ed25519_sig').notNull(),
    mldsa65Sig: text('mldsa65_sig').notNull(),
    sigPublicKeyEd25519: text('sig_public_key_ed25519').notNull(),
    sigPublicKeyMldsa65: text('sig_public_key_mldsa65').notNull(),
    attestingDid: text('attesting_did').notNull(),
    keyId: text('key_id').notNull(),
    schemeVersion: text('scheme_version').notNull().default('hybrid-ed25519-mldsa65-v1'),
    certThumbprint: text('cert_thumbprint'),
    attestedAt: timestamp('attested_at', { withTimezone: true }).notNull().defaultNow(),
    attestationKind: text('attestation_kind', { enum: ['backfill', 'catch_up'] })
      .notNull()
      .default('backfill'),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => [
    index('pcha_event_idx').on(table.eventId),
    index('pcha_org_idx').on(table.orgId),
    index('pcha_did_idx').on(table.attestingDid),
    index('pcha_attested_idx').on(table.attestedAt),
  ],
);

/**
 * proof_chain_attestation_quarantine
 *
 * Rows that failed the integrity guard (hash mismatch, broken chain link).
 * Never attested — an admin must review and either accept with justification
 * or mark known-bad.
 */
export const proofChainAttestationQuarantineTable = pgTable(
  'proof_chain_attestation_quarantine',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().unique(),
    orgId: integer('org_id'),
    expectedPrevHash: text('expected_prev_hash'),
    actualPrevHash: text('actual_prev_hash'),
    expectedEventHash: text('expected_event_hash'),
    actualEventHash: text('actual_event_hash'),
    failureReason: text('failure_reason').notNull(),
    decision: text('decision', {
      enum: ['pending', 'accepted', 'known_bad', 'escalated'],
    })
      .notNull()
      .default('pending'),
    decidedBy: integer('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNote: text('decision_note'),
    quarantinedAt: timestamp('quarantined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('pcaq_event_idx').on(table.eventId),
    index('pcaq_decision_idx').on(table.decision),
    index('pcaq_org_idx').on(table.orgId),
  ],
);

/**
 * proof_chain_attestation_checkpoint
 *
 * Resumable cursor for the Temporal backfill workflow. A single row keyed
 * by workflow id tracks the last attested event id so an interrupted run
 * picks up where it left off without re-signing already-attested entries.
 */
export const proofChainAttestationCheckpointTable = pgTable(
  'proof_chain_attestation_checkpoint',
  {
    id: text('id').primaryKey(),
    lastEventId: integer('last_event_id').notNull().default(0),
    totalAttested: integer('total_attested').notNull().default(0),
    totalQuarantined: integer('total_quarantined').notNull().default(0),
    totalSkipped: integer('total_skipped').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: text('status', { enum: ['running', 'paused', 'completed', 'failed'] })
      .notNull()
      .default('running'),
    summary: jsonb('summary'),
  },
);

export type ProofChainHybridAttestation = typeof proofChainHybridAttestationsTable.$inferSelect;
export type InsertProofChainHybridAttestation =
  typeof proofChainHybridAttestationsTable.$inferInsert;
export type ProofChainAttestationQuarantine =
  typeof proofChainAttestationQuarantineTable.$inferSelect;
export type InsertProofChainAttestationQuarantine =
  typeof proofChainAttestationQuarantineTable.$inferInsert;
export type ProofChainAttestationCheckpoint =
  typeof proofChainAttestationCheckpointTable.$inferSelect;
export type InsertProofChainAttestationCheckpoint =
  typeof proofChainAttestationCheckpointTable.$inferInsert;
