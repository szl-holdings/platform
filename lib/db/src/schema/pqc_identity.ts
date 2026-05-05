import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const pqcCaRootKeysTable = pgTable(
  'pqc_ca_root_keys',
  {
    id: serial('id').primaryKey(),
    issuerName: text('issuer_name').notNull().unique(),
    ed25519PublicKey: text('ed25519_public_key').notNull(),
    mldsa65PublicKey: text('mldsa65_public_key').notNull(),
    ed25519SecretKeyEnc: text('ed25519_secret_key_enc').notNull(),
    mldsa65SecretKeyEnc: text('mldsa65_secret_key_enc').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const pqcCertificatesTable = pgTable(
  'pqc_certificates',
  {
    id: serial('id').primaryKey(),
    certId: text('cert_id').notNull().unique(),
    version: integer('version').notNull().default(1),
    issuer: text('issuer').notNull(),
    subject: text('subject').notNull(),
    subjectDid: text('subject_did').notNull(),
    ed25519PublicKey: text('ed25519_public_key').notNull(),
    mldsa65PublicKey: text('mldsa65_public_key').notNull(),
    notBefore: timestamp('not_before').notNull(),
    notAfter: timestamp('not_after').notNull(),
    serialNumber: text('serial_number').notNull().unique(),
    thumbprint: text('thumbprint').notNull().unique(),
    issuerSignature: jsonb('issuer_signature').$type<Record<string, unknown>>(),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
    revokedAt: timestamp('revoked_at'),
    revocationReason: text('revocation_reason'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pqc_cert_subject_did_idx').on(table.subjectDid),
    index('pqc_cert_thumbprint_idx').on(table.thumbprint),
    index('pqc_cert_active_idx').on(table.isActive),
    index('pqc_cert_issuer_idx').on(table.issuer),
  ],
);

export const pqcTransparencyLogTable = pgTable(
  'pqc_transparency_log',
  {
    id: serial('id').primaryKey(),
    logIndex: integer('log_index').notNull(),
    entryType: text('entry_type', { enum: ['issuance', 'revocation'] }).notNull(),
    certThumbprint: text('cert_thumbprint').notNull(),
    certId: text('cert_id').notNull(),
    subjectDid: text('subject_did').notNull(),
    entryHash: text('entry_hash').notNull(),
    merkleRoot: text('merkle_root').notNull(),
    treeSize: integer('tree_size').notNull(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('pqc_tlog_log_index_uniq').on(table.logIndex),
    index('pqc_tlog_cert_thumbprint_idx').on(table.certThumbprint),
    index('pqc_tlog_entry_type_idx').on(table.entryType),
  ],
);

export type PqcCaRootKey = typeof pqcCaRootKeysTable.$inferSelect;
export type PqcCertificate = typeof pqcCertificatesTable.$inferSelect;
export type PqcTransparencyLogEntry = typeof pqcTransparencyLogTable.$inferSelect;
