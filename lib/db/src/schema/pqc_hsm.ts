import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Intermediate signing keys for the SZL Holdings CA.
 *
 * The root CA private key (stored separately in `pqc_ca_root_keys` and,
 * in production, behind an HSM/KMS) signs intermediate certificates with
 * a long validity window. Intermediate keys handle day-to-day tenant and
 * agent certificate issuance so the root is rarely touched.
 *
 * `driver` records which HSM/KMS backend custodies the key material
 * (`software` for the in-process default, `aws-kms` / `gcp-kms` / `pkcs11`
 * when a hardware-backed driver is configured).
 */
export const pqcIntermediateKeysTable = pgTable(
  'pqc_intermediate_keys',
  {
    id: serial('id').primaryKey(),
    intermediateName: text('intermediate_name').notNull().unique(),
    rootIssuer: text('root_issuer').notNull(),
    driver: text('driver').notNull().default('software'),
    keyRef: text('key_ref'),
    ed25519PublicKey: text('ed25519_public_key').notNull(),
    mldsa65PublicKey: text('mldsa65_public_key').notNull(),
    /** Only populated for the `software` driver — encrypted-at-rest. */
    ed25519SecretKeyEnc: text('ed25519_secret_key_enc'),
    mldsa65SecretKeyEnc: text('mldsa65_secret_key_enc'),
    /** Hybrid signature from the root over the intermediate's public-key bundle. */
    rootSignature: jsonb('root_signature').$type<Record<string, unknown>>(),
    notBefore: timestamp('not_before').notNull().defaultNow(),
    notAfter: timestamp('not_after').notNull(),
    retiredAt: timestamp('retired_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pqc_intermediate_root_idx').on(table.rootIssuer),
    index('pqc_intermediate_active_idx').on(table.retiredAt),
  ],
);

/**
 * Tamper-evident audit log of every HSM/KMS signing operation against the
 * root or an intermediate key. Each row hash-chains to the previous row so
 * silent deletion is detectable; the chain is independent of the
 * application audit_chain_events log so an API-server compromise cannot
 * rewrite this history without also breaking the chain.
 */
export const pqcHsmAuditLogTable = pgTable(
  'pqc_hsm_audit_log',
  {
    id: serial('id').primaryKey(),
    sequenceNumber: integer('sequence_number').notNull(),
    keyTier: text('key_tier', { enum: ['root', 'intermediate'] }).notNull(),
    keyRef: text('key_ref').notNull(),
    driver: text('driver').notNull(),
    operation: text('operation', {
      enum: [
        'sign',
        'attest',
        'rotate',
        'cross-sign',
        'retire',
        'dr-rehearsal',
        'health-probe',
      ],
    }).notNull(),
    requesterIdentity: text('requester_identity').notNull(),
    payloadHash: text('payload_hash').notNull(),
    outcome: text('outcome', { enum: ['success', 'failure', 'denied'] })
      .notNull()
      .default('success'),
    latencyMs: integer('latency_ms'),
    prevHash: text('prev_hash').notNull().default('genesis'),
    eventHash: text('event_hash').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('pqc_hsm_seq_uniq').on(table.sequenceNumber),
    index('pqc_hsm_key_ref_idx').on(table.keyRef),
    index('pqc_hsm_operation_idx').on(table.operation),
    index('pqc_hsm_occurred_idx').on(table.occurredAt),
  ],
);

/**
 * Disaster-recovery readiness ledger. Records every M-of-N backup-shard
 * verification, operator-access drill, and rehearsal of the root-key
 * recovery procedure so an auditor can confirm DR readiness without
 * trusting the application's runtime state.
 */
export const pqcHsmDrReadinessTable = pgTable(
  'pqc_hsm_dr_readiness',
  {
    id: serial('id').primaryKey(),
    issuer: text('issuer').notNull(),
    rehearsalType: text('rehearsal_type', {
      enum: ['backup-verify', 'operator-roster', 'recovery-rehearsal', 'rotation-rehearsal'],
    }).notNull(),
    outcome: text('outcome', { enum: ['passed', 'failed', 'degraded'] }).notNull(),
    operatorsPresent: integer('operators_present').notNull().default(0),
    operatorsRequired: integer('operators_required').notNull().default(0),
    notes: text('notes'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    performedAt: timestamp('performed_at').notNull().defaultNow(),
  },
  (table) => [
    index('pqc_hsm_dr_issuer_idx').on(table.issuer),
    index('pqc_hsm_dr_type_idx').on(table.rehearsalType),
    index('pqc_hsm_dr_performed_idx').on(table.performedAt),
  ],
);

export type PqcIntermediateKey = typeof pqcIntermediateKeysTable.$inferSelect;
export type PqcHsmAuditLogEntry = typeof pqcHsmAuditLogTable.$inferSelect;
export type PqcHsmDrReadinessEntry = typeof pqcHsmDrReadinessTable.$inferSelect;
