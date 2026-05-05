/**
 * Platform DID Registry & Resolver
 *
 * Manages `did:plat:<id>` — the platform-internal DID method. This method
 * is deliberately NOT a public DID method; it is unambiguous within the
 * platform and will never collide with public did:web or did:key entries.
 *
 * DIDs are minted per:
 *   - Tenant org (actor_kind = 'tenant')
 *   - Internal service (actor_kind = 'platform_service')
 *   - Registered agent (actor_kind = 'agent')
 *
 * Key operations: create, resolve, rotate-key, revoke.
 * Resolver returns the current DID document constructed from the active key.
 * WebVH history-log writer is scaffolded behind DID_WEBVH_LOG=on (default: off).
 */

import { randomBytes } from 'node:crypto';
import { db, platformDidsTable, platformDidDocumentsTable, didWebvhLogTable } from '@szl-holdings/db';
import { desc, eq, and } from 'drizzle-orm';
import type { DIDDocument } from '@szl-holdings/pqc-identity';
import { getKeyCustodyProvider, type KeyMetadata } from './key-custody';
import { logger } from './logger';

export type ActorKind = 'platform_service' | 'tenant' | 'agent' | 'oauth_client' | 'api_key';

export interface PlatformDidInfo {
  did: string;
  actorKind: ActorKind;
  displayName: string;
  orgId?: string;
  activeKeyId?: string;
  isActive: boolean;
  revokedAt?: Date;
  revocationReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformDidResolution {
  did: string;
  document: DIDDocument;
  activeKeyId: string;
  keyMeta: KeyMetadata;
}

// ── DID generation ────────────────────────────────────────────────────────

function generatePlatformDid(kind: ActorKind, hint?: string): string {
  const slug = hint
    ? hint.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 32)
    : randomBytes(8).toString('hex');
  return `did:plat:${kind}:${slug}`;
}

// ── DID Document builder ──────────────────────────────────────────────────

function buildPlatformDidDocument(did: string, keyMeta: KeyMetadata): DIDDocument {
  const keyIdEd = `${did}#key-ed25519-1`;
  const keyIdMldsa = `${did}#key-mldsa65-1`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: keyIdEd,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyHex: keyMeta.ed25519PublicKey,
      },
      {
        id: keyIdMldsa,
        type: 'MLDsa65VerificationKey2024',
        controller: did,
        publicKeyHex: keyMeta.mldsa65PublicKey,
      },
    ],
    authentication: [keyIdEd, keyIdMldsa],
    assertionMethod: [keyIdEd, keyIdMldsa],
    service: [
      {
        id: `${did}#platform-registry`,
        type: 'PlatformIdentityRegistry',
        serviceEndpoint: '/api/identity-registry',
      },
    ],
  };
}

// ── WebVH log writer (deferred scaffold) ─────────────────────────────────

async function maybeWriteWebvhLog(
  did: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (process.env.DID_WEBVH_LOG !== 'on') return;
  try {
    await db.insert(didWebvhLogTable).values({ did, eventType, payload });
  } catch (err) {
    logger.warn({ err, did, eventType }, '[did-webvh-log] Failed to write log entry (non-fatal)');
  }
}

// ── Registry operations ───────────────────────────────────────────────────

export async function createPlatformDid(opts: {
  actorKind: ActorKind;
  displayName: string;
  orgId?: string;
  hint?: string;
  metadata?: Record<string, unknown>;
}): Promise<PlatformDidInfo> {
  const custody = getKeyCustodyProvider();
  const did = generatePlatformDid(opts.actorKind, opts.hint ?? opts.displayName);

  const [existing] = await db
    .select({ did: platformDidsTable.did })
    .from(platformDidsTable)
    .where(eq(platformDidsTable.did, did))
    .limit(1);

  if (existing) {
    logger.debug({ did }, '[did-registry] DID already exists, returning existing record');
    return resolvePlatformDidInfo(did);
  }

  const keyMeta = await custody.bootstrap(did);
  const document = buildPlatformDidDocument(did, keyMeta);

  await db.insert(platformDidsTable).values({
    did,
    actorKind: opts.actorKind,
    displayName: opts.displayName,
    orgId: opts.orgId ?? null,
    activeKeyId: keyMeta.keyId,
    isActive: true,
    metadata: opts.metadata ?? {},
  });

  await db.insert(platformDidDocumentsTable).values({
    did,
    version: '1',
    document: document as unknown as Record<string, unknown>,
  });

  await maybeWriteWebvhLog(did, 'key_genesis', { keyId: keyMeta.keyId, actorKind: opts.actorKind });

  logger.info({ did, actorKind: opts.actorKind, keyId: keyMeta.keyId }, '[did-registry] DID created');
  return resolvePlatformDidInfo(did);
}

export async function resolvePlatformDid(did: string): Promise<PlatformDidResolution> {
  const [row] = await db
    .select()
    .from(platformDidsTable)
    .where(and(eq(platformDidsTable.did, did), eq(platformDidsTable.isActive, true)))
    .limit(1);

  if (!row) {
    throw new Error(`[did-registry] DID not found or revoked: ${did}`);
  }

  const custody = getKeyCustodyProvider();
  const keyMeta = await custody.getActiveKeyMeta(did);
  if (!keyMeta) {
    throw new Error(`[did-registry] No active key for DID: ${did}`);
  }

  const document = buildPlatformDidDocument(did, keyMeta);
  return { did, document, activeKeyId: keyMeta.keyId, keyMeta };
}

export async function resolvePlatformDidInfo(did: string): Promise<PlatformDidInfo> {
  const [row] = await db
    .select()
    .from(platformDidsTable)
    .where(eq(platformDidsTable.did, did))
    .limit(1);

  if (!row) throw new Error(`[did-registry] DID not found: ${did}`);

  return {
    did: row.did,
    actorKind: row.actorKind as ActorKind,
    displayName: row.displayName,
    orgId: row.orgId ?? undefined,
    activeKeyId: row.activeKeyId ?? undefined,
    isActive: row.isActive,
    revokedAt: row.revokedAt ?? undefined,
    revocationReason: row.revocationReason ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function rotatePlatformDidKey(
  did: string,
  reason?: string,
): Promise<{ keyMeta: KeyMetadata; newDocument: DIDDocument }> {
  const custody = getKeyCustodyProvider();
  const keyMeta = await custody.rotateKey(did, reason);
  const document = buildPlatformDidDocument(did, keyMeta);

  // Fetch the LATEST DID document version (desc by id) so repeated rotations
  // correctly increment from the most recent version instead of the first one.
  const [current] = await db
    .select({ version: platformDidDocumentsTable.version })
    .from(platformDidDocumentsTable)
    .where(eq(platformDidDocumentsTable.did, did))
    .orderBy(desc(platformDidDocumentsTable.id))
    .limit(1);

  const nextVersion = current ? String(Number(current.version) + 1) : '1';

  await db.insert(platformDidDocumentsTable).values({
    did,
    version: nextVersion,
    document: document as unknown as Record<string, unknown>,
  });

  await db
    .update(platformDidsTable)
    .set({ activeKeyId: keyMeta.keyId, updatedAt: new Date() })
    .where(eq(platformDidsTable.did, did));

  await maybeWriteWebvhLog(did, 'key_rotation', {
    newKeyId: keyMeta.keyId,
    keyVersion: keyMeta.keyVersion,
    reason,
  });

  logger.info({ did, newKeyId: keyMeta.keyId }, '[did-registry] Key rotated');
  return { keyMeta, newDocument: document };
}

export async function revokePlatformDid(did: string, reason: string): Promise<void> {
  const custody = getKeyCustodyProvider();
  await custody.revokeKey(did, reason);

  await db
    .update(platformDidsTable)
    .set({ isActive: false, revokedAt: new Date(), revocationReason: reason, updatedAt: new Date() })
    .where(eq(platformDidsTable.did, did));

  await maybeWriteWebvhLog(did, 'did_revocation', { reason });
  logger.info({ did, reason }, '[did-registry] DID revoked');
}

/**
 * Shared helper: ensure a machine-credential DID is registered and active.
 *
 * Security contract (G6):
 *   Every distinct M2M principal has its own DID:
 *     - Internal agents:  did:plat:agent:{slug(agentName)}
 *     - OAuth clients:    did:plat:oauth_client:{clientId}
 *     - API keys:         did:plat:api_key:{keyId}
 *
 *   Returns:
 *     { did, revoked: false } — DID active; caller may proceed
 *     { did, revoked: true }  — DID revoked; auth MUST fail closed
 *     null                    — DB unavailable (non-fatal); auth may continue
 *                               with platform-service fallback DID and a WARN log
 */
async function ensureMachineCredentialDid(opts: {
  kind: 'agent' | 'oauth_client' | 'api_key';
  did: string;
  displayName: string;
  metadata: Record<string, unknown>;
}): Promise<{ did: string; revoked: boolean } | null> {
  const { did, kind, displayName, metadata } = opts;
  try {
    const [existing] = await db
      .select({ isActive: platformDidsTable.isActive })
      .from(platformDidsTable)
      .where(eq(platformDidsTable.did, did))
      .limit(1);

    if (existing) {
      return { did, revoked: !existing.isActive };
    }

    const custody = getKeyCustodyProvider();
    const keyMeta = await custody.bootstrap(did);
    const document = buildPlatformDidDocument(did, keyMeta);

    await db.insert(platformDidsTable).values({
      did,
      actorKind: kind,
      displayName,
      orgId: null,
      activeKeyId: keyMeta.keyId,
      isActive: true,
      metadata,
    });

    await db.insert(platformDidDocumentsTable).values({
      did,
      version: '1',
      document: document as unknown as Record<string, unknown>,
    });

    await maybeWriteWebvhLog(did, 'key_genesis', { keyId: keyMeta.keyId, actorKind: kind });
    logger.info({ did, kind, keyId: keyMeta.keyId }, '[did-registry] Machine credential DID minted');
    return { did, revoked: false };
  } catch (err) {
    logger.warn({ err, did, kind }, '[did-registry] ensureMachineCredentialDid failed (non-fatal)');
    return null;
  }
}

/**
 * Ensure a named internal agent has its own distinct DID (lazy-mint + revocation check).
 *
 * Returns:
 *   { did, revoked: false } — DID is active and ready to use
 *   { did, revoked: true }  — DID exists but has been revoked (auth must fail with 401)
 *   null                    — DB unavailable (non-fatal degradation)
 *
 * Security contract (G6): every named internal agent has a DISTINCT platform DID.
 * A revoked agent DID causes auth to fail closed (caller gets 401 AGENT_IDENTITY_REVOKED).
 */
export async function ensureInternalAgentDid(
  agentName: string,
): Promise<{ did: string; revoked: boolean } | null> {
  const slug = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 48);
  return ensureMachineCredentialDid({
    kind: 'agent',
    did: `did:plat:agent:${slug}`,
    displayName: `Internal Agent (${agentName})`,
    metadata: { agentName, mintedBy: 'ensureInternalAgentDid' },
  });
}

/**
 * Ensure an OAuth machine client has its own distinct DID (lazy-mint + revocation check).
 *
 * Returns:
 *   { did, revoked: false } — DID is active; proceed with auth
 *   { did, revoked: true }  — DID revoked; auth must fail closed
 *   null                    — DB unavailable (non-fatal); use platform DID fallback
 *
 * Security contract (G6): each OAuth clientId gets did:plat:oauth_client:{clientId}.
 */
export async function ensureOAuthClientDid(
  clientId: string,
): Promise<{ did: string; revoked: boolean } | null> {
  const slug = clientId.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 48);
  return ensureMachineCredentialDid({
    kind: 'oauth_client',
    did: `did:plat:oauth_client:${slug}`,
    displayName: `OAuth Client (${clientId})`,
    metadata: { clientId, mintedBy: 'ensureOAuthClientDid' },
  });
}

/**
 * Ensure an API key has its own distinct DID (lazy-mint + revocation check).
 *
 * Returns:
 *   { did, revoked: false } — DID is active; proceed with auth
 *   { did, revoked: true }  — DID revoked; auth must fail closed
 *   null                    — DB unavailable (non-fatal); use platform DID fallback
 *
 * Security contract (G6): each API key id gets did:plat:api_key:{keyId}.
 */
export async function ensureApiKeyDid(
  keyId: number,
): Promise<{ did: string; revoked: boolean } | null> {
  return ensureMachineCredentialDid({
    kind: 'api_key',
    did: `did:plat:api_key:${keyId}`,
    displayName: `API Key (${keyId})`,
    metadata: { keyId, mintedBy: 'ensureApiKeyDid' },
  });
}

export async function listPlatformDids(opts?: {
  actorKind?: ActorKind;
  activeOnly?: boolean;
  orgId?: string;
  limit?: number;
  offset?: number;
}): Promise<PlatformDidInfo[]> {
  const rows = await db
    .select()
    .from(platformDidsTable)
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);

  let filtered = rows;
  if (opts?.actorKind) filtered = filtered.filter((r) => r.actorKind === opts.actorKind);
  if (opts?.activeOnly) filtered = filtered.filter((r) => r.isActive);
  if (opts?.orgId) filtered = filtered.filter((r) => r.orgId === opts.orgId);

  return filtered.map((row) => ({
    did: row.did,
    actorKind: row.actorKind as ActorKind,
    displayName: row.displayName,
    orgId: row.orgId ?? undefined,
    activeKeyId: row.activeKeyId ?? undefined,
    isActive: row.isActive,
    revokedAt: row.revokedAt ?? undefined,
    revocationReason: row.revocationReason ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

// ── Platform service DID singleton ────────────────────────────────────────

let _platformServiceDid: string | null = null;

export async function ensurePlatformServiceDid(): Promise<string> {
  if (_platformServiceDid) return _platformServiceDid;

  const did = 'did:plat:platform_service:szl-api-server';

  const [existing] = await db
    .select({ did: platformDidsTable.did })
    .from(platformDidsTable)
    .where(eq(platformDidsTable.did, did))
    .limit(1);

  if (!existing) {
    await createPlatformDid({
      actorKind: 'platform_service',
      displayName: 'SZL API Server — Platform Service',
      hint: 'szl-api-server',
      metadata: { bootstrappedAt: new Date().toISOString() },
    });
  }

  _platformServiceDid = did;
  return did;
}

export function getPlatformServiceDid(): string | null {
  return _platformServiceDid;
}
