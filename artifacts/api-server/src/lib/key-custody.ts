/**
 * Key Custody Service
 *
 * Provides a `KeyCustodyProvider` abstraction for all key lifecycle operations.
 * Private key material is encrypted at rest with AES-256-GCM envelope encryption.
 *
 * Two implementations:
 *   - `SoftwareEncryptedCustody` (default) — keys stored in `platform_keys` table,
 *     encrypted with a KEK from env. KEK material never leaves memory unencrypted.
 *   - `HsmStubCustody` — interface-only placeholder; throws `NotConfigured` if
 *     selected. Activated by KEY_CUSTODY_BACKEND=hsm-stub. See:
 *     docs/internal/identity/adr-hsm-custody.md for activation path.
 *
 * Callers always use the provider interface — no direct key access.
 */

import { randomBytes } from 'node:crypto';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { db, platformKeysTable } from '@szl-holdings/db';
import { eq, and } from 'drizzle-orm';
import {
  generateHybridKeyPair,
  createHybridSigner,
  type HybridKeyPair,
  type HybridSigner,
} from '@szl-holdings/pqc-identity';
import { encryptSecret, decryptSecret, isEncrypted } from './crypto';
import { logger } from './logger';

// ── Types ─────────────────────────────────────────────────────────────────

export interface KeyMetadata {
  keyId: string;
  did: string;
  keyVersion: string;
  schemeVersion: string;
  ed25519PublicKey: string;
  mldsa65PublicKey: string;
  isActive: boolean;
  createdAt: Date;
  revokedAt?: Date;
  revocationReason?: string;
}

export interface SignResult {
  ed25519Sig: string;
  mldsa65Sig: string;
  sigPublicKeyEd25519: string;
  sigPublicKeyMldsa65: string;
  keyId: string;
  schemeVersion: string;
}

export interface KeyCustodyProvider {
  /** Bootstrap the platform root key if it does not exist yet. Called once on startup. */
  bootstrap(did: string): Promise<KeyMetadata>;
  /** Retrieve signing key for a DID and return a live signer. Throws if DID has no active key. */
  getSigner(did: string): Promise<{ signer: HybridSigner; meta: KeyMetadata }>;
  /** Sign canonical bytes for a DID. Convenience wrapper over getSigner + sign. */
  sign(did: string, canonicalBytes: Uint8Array): Promise<SignResult>;
  /** Generate a new key pair for a DID, incrementing the key version. */
  rotateKey(did: string, reason?: string): Promise<KeyMetadata>;
  /** Soft-revoke the active key for a DID. */
  revokeKey(did: string, reason: string): Promise<void>;
  /** List all keys for a DID. */
  listKeys(did: string): Promise<KeyMetadata[]>;
  /** Get the active key metadata for a DID without loading the private key. */
  getActiveKeyMeta(did: string): Promise<KeyMetadata | null>;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function encodeKey(raw: Uint8Array): string {
  return bytesToHex(raw);
}

function decodeKey(hex: string): Uint8Array {
  return hexToBytes(hex);
}

function wrapPrivateKey(raw: Uint8Array): string {
  return encryptSecret(encodeKey(raw));
}

function unwrapPrivateKey(ciphertext: string): Uint8Array {
  if (!isEncrypted(ciphertext)) {
    throw new Error('[key-custody] Private key is not encrypted — data integrity violation');
  }
  return decodeKey(decryptSecret(ciphertext));
}

function generateKeyId(did: string, version: string): string {
  const safe = did.replace(/[^a-zA-Z0-9]/g, '-');
  return `${safe}-v${version}-${randomBytes(4).toString('hex')}`;
}

function rowToMeta(row: typeof platformKeysTable.$inferSelect): KeyMetadata {
  return {
    keyId: row.keyId,
    did: row.did,
    keyVersion: row.keyVersion,
    schemeVersion: row.schemeVersion,
    ed25519PublicKey: row.ed25519PublicKey,
    mldsa65PublicKey: row.mldsa65PublicKey,
    isActive: row.isActive,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt ?? undefined,
    revocationReason: row.revocationReason ?? undefined,
  };
}

// ── Software-Encrypted Custody (default) ─────────────────────────────────

export class SoftwareEncryptedCustody implements KeyCustodyProvider {
  async bootstrap(did: string): Promise<KeyMetadata> {
    const existing = await this.getActiveKeyMeta(did);
    if (existing) {
      logger.debug({ did, keyId: existing.keyId }, '[key-custody] Bootstrap: existing key found');
      return existing;
    }

    logger.info({ did }, '[key-custody] Bootstrap: generating new root key');
    const keyPair = generateHybridKeyPair();
    const version = '1';
    const keyId = generateKeyId(did, version);

    const schemeVersion = process.env.SIGNING_SCHEME_VERSION ?? 'hybrid-v1';
    await db.insert(platformKeysTable).values({
      keyId,
      did,
      keyVersion: version,
      ed25519PublicKey: encodeKey(keyPair.ed25519.publicKey),
      mldsa65PublicKey: encodeKey(keyPair.mldsa65.publicKey),
      ed25519SecretKeyEnc: wrapPrivateKey(keyPair.ed25519.privateKey),
      mldsa65SecretKeyEnc: wrapPrivateKey(keyPair.mldsa65.privateKey),
      kekSource: 'env',
      schemeVersion,
      isActive: true,
    });

    logger.info({ did, keyId, schemeVersion }, '[key-custody] Bootstrap: root key generated and persisted');
    return (await this.getActiveKeyMeta(did))!;
  }

  async getSigner(did: string): Promise<{ signer: HybridSigner; meta: KeyMetadata }> {
    const [row] = await db
      .select()
      .from(platformKeysTable)
      .where(and(eq(platformKeysTable.did, did), eq(platformKeysTable.isActive, true)))
      .limit(1);

    if (!row) {
      throw new Error(`[key-custody] No active key for DID: ${did}`);
    }

    const keyPair: HybridKeyPair = {
      ed25519: {
        publicKey: decodeKey(row.ed25519PublicKey),
        privateKey: unwrapPrivateKey(row.ed25519SecretKeyEnc),
      },
      mldsa65: {
        publicKey: decodeKey(row.mldsa65PublicKey),
        privateKey: unwrapPrivateKey(row.mldsa65SecretKeyEnc),
      },
    };

    const signer = createHybridSigner(keyPair, 'hybrid');
    return { signer, meta: rowToMeta(row) };
  }

  async sign(did: string, canonicalBytes: Uint8Array): Promise<SignResult> {
    const { signer, meta } = await this.getSigner(did);
    const sig = signer.sign(canonicalBytes);
    return {
      ed25519Sig: sig.ed25519 ?? '',
      mldsa65Sig: sig.mldsa65 ?? '',
      sigPublicKeyEd25519: sig.publicKeys?.ed25519 ?? meta.ed25519PublicKey,
      sigPublicKeyMldsa65: sig.publicKeys?.mldsa65 ?? meta.mldsa65PublicKey,
      keyId: meta.keyId,
      schemeVersion: meta.schemeVersion,
    };
  }

  async rotateKey(did: string, reason?: string): Promise<KeyMetadata> {
    const current = await this.getActiveKeyMeta(did);
    const nextVersion = current ? String(Number(current.keyVersion) + 1) : '1';

    if (current) {
      await db
        .update(platformKeysTable)
        .set({ isActive: false, revokedAt: new Date(), revocationReason: reason ?? 'key_rotation' })
        .where(eq(platformKeysTable.keyId, current.keyId));
    }

    const keyPair = generateHybridKeyPair();
    const keyId = generateKeyId(did, nextVersion);

    const schemeVersion = process.env.SIGNING_SCHEME_VERSION ?? 'hybrid-v1';
    await db.insert(platformKeysTable).values({
      keyId,
      did,
      keyVersion: nextVersion,
      ed25519PublicKey: encodeKey(keyPair.ed25519.publicKey),
      mldsa65PublicKey: encodeKey(keyPair.mldsa65.publicKey),
      ed25519SecretKeyEnc: wrapPrivateKey(keyPair.ed25519.privateKey),
      mldsa65SecretKeyEnc: wrapPrivateKey(keyPair.mldsa65.privateKey),
      kekSource: 'env',
      schemeVersion,
      isActive: true,
    });

    logger.info({ did, keyId, nextVersion }, '[key-custody] Key rotated');
    return (await this.getActiveKeyMeta(did))!;
  }

  async revokeKey(did: string, reason: string): Promise<void> {
    const current = await this.getActiveKeyMeta(did);
    if (!current) throw new Error(`[key-custody] No active key for DID: ${did}`);
    await db
      .update(platformKeysTable)
      .set({ isActive: false, revokedAt: new Date(), revocationReason: reason })
      .where(eq(platformKeysTable.keyId, current.keyId));
    logger.info({ did, keyId: current.keyId, reason }, '[key-custody] Key revoked');
  }

  async listKeys(did: string): Promise<KeyMetadata[]> {
    const rows = await db
      .select()
      .from(platformKeysTable)
      .where(eq(platformKeysTable.did, did));
    return rows.map(rowToMeta);
  }

  async getActiveKeyMeta(did: string): Promise<KeyMetadata | null> {
    const [row] = await db
      .select()
      .from(platformKeysTable)
      .where(and(eq(platformKeysTable.did, did), eq(platformKeysTable.isActive, true)))
      .limit(1);
    return row ? rowToMeta(row) : null;
  }
}

// ── HSM Stub (interface-only, off by default) ─────────────────────────────

export class HsmStubCustody implements KeyCustodyProvider {
  private readonly _notConfigured = () => {
    throw new Error(
      '[key-custody] HSM custody backend is not configured. ' +
      'See docs/internal/identity/adr-hsm-custody.md for activation instructions. ' +
      'Set KEY_CUSTODY_BACKEND=software-encrypted to use the software backend.',
    );
  };

  async bootstrap(_did: string): Promise<KeyMetadata> { this._notConfigured(); return null as never; }
  async getSigner(_did: string): Promise<{ signer: HybridSigner; meta: KeyMetadata }> { this._notConfigured(); return null as never; }
  async sign(_did: string, _bytes: Uint8Array): Promise<SignResult> { this._notConfigured(); return null as never; }
  async rotateKey(_did: string, _reason?: string): Promise<KeyMetadata> { this._notConfigured(); return null as never; }
  async revokeKey(_did: string, _reason: string): Promise<void> { this._notConfigured(); }
  async listKeys(_did: string): Promise<KeyMetadata[]> { this._notConfigured(); return null as never; }
  async getActiveKeyMeta(_did: string): Promise<KeyMetadata | null> { this._notConfigured(); return null as never; }
}

// ── Singleton ─────────────────────────────────────────────────────────────

let _provider: KeyCustodyProvider | null = null;

export function getKeyCustodyProvider(): KeyCustodyProvider {
  if (_provider) return _provider;

  const backend = process.env.KEY_CUSTODY_BACKEND ?? 'software-encrypted';
  if (backend === 'hsm-stub') {
    _provider = new HsmStubCustody();
    logger.warn('[key-custody] HSM stub backend selected — will throw NotConfigured on any operation');
  } else if (backend === 'software-encrypted') {
    _provider = new SoftwareEncryptedCustody();
    logger.info('[key-custody] Software-encrypted backend initialized');
  } else {
    throw new Error(
      `[key-custody] Unknown KEY_CUSTODY_BACKEND: "${backend}". ` +
      'Must be "software-encrypted" or "hsm-stub".',
    );
  }

  return _provider;
}

export function resetKeyCustodyProvider(): void {
  _provider = null;
}
