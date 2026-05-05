import {
  boolean,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * platform_keys — envelope-encrypted signing keys for the key custody service.
 *
 * Private key material is encrypted at rest using AES-256-GCM with an
 * envelope-encryption pattern. The KEK (key encryption key) is sourced from
 * the KEK_SOURCE env config (env-based now, HSM/KMS later). Storage backend
 * can be swapped without touching callers.
 *
 * Append-only for key material; rotation creates a new row with incremented
 * keyVersion and the old row is soft-revoked.
 */
export const platformKeysTable = pgTable(
  'platform_keys',
  {
    id: serial('id').primaryKey(),
    keyId: text('key_id').notNull().unique(),
    did: text('did').notNull(),
    keyVersion: text('key_version').notNull().default('1'),
    ed25519PublicKey: text('ed25519_public_key').notNull(),
    mldsa65PublicKey: text('mldsa65_public_key').notNull(),
    ed25519SecretKeyEnc: text('ed25519_secret_key_enc').notNull(),
    mldsa65SecretKeyEnc: text('mldsa65_secret_key_enc').notNull(),
    kekSource: text('kek_source').notNull().default('env'),
    schemeVersion: text('scheme_version').notNull().default('hybrid-v1'),
    isActive: boolean('is_active').notNull().default(true),
    revokedAt: timestamp('revoked_at'),
    revocationReason: text('revocation_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_keys_did_idx').on(table.did),
    index('platform_keys_active_idx').on(table.isActive),
    uniqueIndex('platform_keys_did_version_uniq').on(table.did, table.keyVersion),
  ],
);

/**
 * platform_dids — intra-platform DID registry.
 *
 * Each DID uses the platform-internal `did:plat:<id>` method so it is
 * unambiguous and cannot collide with public DID methods. Every tenant org,
 * internal service, and registered agent gets one row.
 *
 * actor_kind: 'platform_service' | 'tenant' | 'agent'
 */
export const platformDidsTable = pgTable(
  'platform_dids',
  {
    id: serial('id').primaryKey(),
    did: text('did').notNull().unique(),
    actorKind: text('actor_kind').notNull(),
    displayName: text('display_name').notNull(),
    orgId: text('org_id'),
    activeKeyId: text('active_key_id'),
    isActive: boolean('is_active').notNull().default(true),
    revokedAt: timestamp('revoked_at'),
    revocationReason: text('revocation_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_dids_actor_kind_idx').on(table.actorKind),
    index('platform_dids_active_idx').on(table.isActive),
    index('platform_dids_org_idx').on(table.orgId),
  ],
);

/**
 * platform_did_documents — W3C DID document snapshots for resolved DIDs.
 *
 * Stored so the resolver can answer offline and the history of key rotations
 * is preserved. Each key rotation creates a new document row; the current
 * document is the one with the highest `version` for that DID.
 */
export const platformDidDocumentsTable = pgTable(
  'platform_did_documents',
  {
    id: serial('id').primaryKey(),
    did: text('did').notNull(),
    version: text('version').notNull().default('1'),
    document: jsonb('document').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('platform_did_docs_did_idx').on(table.did),
    uniqueIndex('platform_did_docs_did_version_uniq').on(table.did, table.version),
  ],
);

/**
 * did_webvh_log — deferred `did:webvh` key-rotation history log.
 *
 * This table is only written when DID_WEBVH_LOG=on (default: off).
 * It is part of the scaffolding for the `did:webvh` history log that will
 * be activated in a follow-up task. See docs/internal/identity/adr-webvh.md.
 */
export const didWebvhLogTable = pgTable(
  'did_webvh_log',
  {
    id: serial('id').primaryKey(),
    did: text('did').notNull(),
    eventType: text('event_type').notNull(),
    keyId: text('key_id'),
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('did_webvh_log_did_idx').on(table.did),
    index('did_webvh_log_event_type_idx').on(table.eventType),
  ],
);

export type PlatformKey = typeof platformKeysTable.$inferSelect;
export type PlatformDid = typeof platformDidsTable.$inferSelect;
export type PlatformDidDocument = typeof platformDidDocumentsTable.$inferSelect;
export type DidWebvhLogEntry = typeof didWebvhLogTable.$inferSelect;
