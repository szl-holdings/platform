import crypto from 'node:crypto';
import {
  createAgentIdentity,
  getDefaultCA,
  setPQCConfig,
  getSigningMode,
  initializePersistentCA,
  setPersistentCAStore,
  setDefaultCA,
  type CryptographicIdentity,
  type PersistentCAStore,
  type HybridKeyPair,
  type CertificateData,
  type HybridSignature,
  type TransparencyLogEntry,
} from '@szl-holdings/pqc-identity';
import { db, pqcCaRootKeysTable, pqcCertificatesTable, pqcTransparencyLogTable } from '@szl-holdings/db';
import { eq, asc } from 'drizzle-orm';
import type { CryptographicIdentityConfig } from '@workspace/nexus-mcp';

const ALGO = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.SECRET_ENCRYPTION_KEY;
  if (raw && raw.length >= KEY_LENGTH) {
    return Buffer.from(raw.slice(0, KEY_LENGTH), 'utf8');
  }
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret) {
    return crypto.scryptSync(sessionSecret, 'szl-dataverse-salt', KEY_LENGTH);
  }
  throw new Error('No encryption key configured.');
}

function encodeKey(raw: Uint8Array): string {
  return Buffer.from(raw).toString('hex');
}

function decodeKey(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function wrapPrivateKey(raw: Uint8Array): string {
  const hex = encodeKey(raw);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(hex, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function unwrapPrivateKey(ciphertext: string): Uint8Array {
  const buf = Buffer.from(ciphertext, 'base64');
  if (buf.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error('[pqc-gateway] CA private key in DB is not encrypted');
  }
  const key = getEncryptionKey();
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  const hex = decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  return decodeKey(hex);
}

class GatewayPersistentCAStore implements PersistentCAStore {
  async loadRootKeys(issuerName: string): Promise<{ keyPair: HybridKeyPair } | null> {
    const [row] = await db
      .select()
      .from(pqcCaRootKeysTable)
      .where(eq(pqcCaRootKeysTable.issuerName, issuerName))
      .limit(1);
    if (!row) return null;
    return {
      keyPair: {
        ed25519: {
          publicKey: decodeKey(row.ed25519PublicKey),
          privateKey: unwrapPrivateKey(row.ed25519SecretKeyEnc),
        },
        mldsa65: {
          publicKey: decodeKey(row.mldsa65PublicKey),
          privateKey: unwrapPrivateKey(row.mldsa65SecretKeyEnc),
        },
      },
    };
  }

  async saveRootKeys(issuerName: string, keyPair: HybridKeyPair): Promise<void> {
    await db
      .insert(pqcCaRootKeysTable)
      .values({
        issuerName,
        ed25519PublicKey: encodeKey(keyPair.ed25519.publicKey),
        mldsa65PublicKey: encodeKey(keyPair.mldsa65.publicKey),
        ed25519SecretKeyEnc: wrapPrivateKey(keyPair.ed25519.privateKey),
        mldsa65SecretKeyEnc: wrapPrivateKey(keyPair.mldsa65.privateKey),
      })
      .onConflictDoNothing();
  }

  async loadCertificates(): Promise<CertificateData[]> {
    const rows = await db.select().from(pqcCertificatesTable);
    return rows.map((r) => ({
      certId: r.certId,
      version: r.version,
      issuer: r.issuer,
      subject: r.subject,
      subjectDid: r.subjectDid,
      publicKeys: { ed25519: r.ed25519PublicKey, mldsa65: r.mldsa65PublicKey },
      notBefore: r.notBefore.getTime(),
      notAfter: r.notAfter.getTime(),
      serialNumber: r.serialNumber,
      thumbprint: r.thumbprint,
      issuedAt: r.issuedAt.getTime(),
      issuerSignature: (r.issuerSignature as unknown as HybridSignature) ?? undefined,
      revokedAt: r.revokedAt?.getTime(),
      revocationReason: r.revocationReason ?? undefined,
    }));
  }

  async saveCertificate(cert: CertificateData): Promise<void> {
    await db
      .insert(pqcCertificatesTable)
      .values({
        certId: cert.certId,
        version: cert.version,
        issuer: cert.issuer,
        subject: cert.subject,
        subjectDid: cert.subjectDid,
        ed25519PublicKey: cert.publicKeys.ed25519,
        mldsa65PublicKey: cert.publicKeys.mldsa65,
        notBefore: new Date(cert.notBefore),
        notAfter: new Date(cert.notAfter),
        serialNumber: cert.serialNumber,
        thumbprint: cert.thumbprint,
        issuerSignature: cert.issuerSignature as unknown as Record<string, unknown>,
        issuedAt: new Date(cert.issuedAt),
        revokedAt: cert.revokedAt ? new Date(cert.revokedAt) : null,
        revocationReason: cert.revocationReason ?? null,
        isActive: !cert.revokedAt,
      })
      .onConflictDoNothing();
  }

  async persistRevocation(certId: string, revokedAt: number, reason: string): Promise<void> {
    await db
      .update(pqcCertificatesTable)
      .set({
        revokedAt: new Date(revokedAt),
        revocationReason: reason,
        isActive: false,
      })
      .where(eq(pqcCertificatesTable.certId, certId));
  }

  async loadTransparencyEntries(): Promise<TransparencyLogEntry[]> {
    const rows = await db
      .select()
      .from(pqcTransparencyLogTable)
      .orderBy(asc(pqcTransparencyLogTable.logIndex));
    return rows.map((r) => ({
      index: r.logIndex,
      timestamp: r.timestamp.getTime(),
      entryType: r.entryType as 'issuance' | 'revocation',
      certThumbprint: r.certThumbprint,
      certId: r.certId,
      subjectDid: r.subjectDid,
      leafHash: r.entryHash,
    }));
  }

  async saveTransparencyEntry(entry: {
    logIndex: number;
    entryType: string;
    certThumbprint: string;
    certId: string;
    subjectDid: string;
    entryHash: string;
    merkleRoot: string;
    treeSize: number;
  }): Promise<void> {
    await db
      .insert(pqcTransparencyLogTable)
      .values({
        logIndex: entry.logIndex,
        entryType: entry.entryType as 'issuance' | 'revocation',
        certThumbprint: entry.certThumbprint,
        certId: entry.certId,
        subjectDid: entry.subjectDid,
        entryHash: entry.entryHash,
        merkleRoot: entry.merkleRoot,
        treeSize: entry.treeSize,
      })
      .onConflictDoNothing();
  }
}

let _gatewayIdentity: CryptographicIdentity | null = null;

export async function initPersistentCAForGateway(): Promise<void> {
  const signingMode = getSigningMode();

  setPQCConfig({
    signingMode,
    minimumVerificationLevel: 'classical-only',
    enableTransparencyLog: true,
    caIssuerName: 'SZL Holdings Root CA v1',
  });

  if (process.env.DATABASE_URL) {
    const store = new GatewayPersistentCAStore();
    setPersistentCAStore(store);
    const ca = await initializePersistentCA('SZL Holdings Root CA v1', store);
    setDefaultCA(ca);
  }
}

export async function initGatewayIdentity(): Promise<CryptographicIdentityConfig> {
  const signingMode = getSigningMode();

  _gatewayIdentity = await createAgentIdentity({
    agentName: 'substrate-mcp-gateway',
  });

  const cert = _gatewayIdentity.certificate;

  return {
    did: _gatewayIdentity.did,
    certThumbprint: _gatewayIdentity.certThumbprint,
    certificate: {
      certId: cert.certId,
      issuer: cert.issuer,
      subject: cert.subject,
      subjectDid: cert.subjectDid,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      thumbprint: cert.thumbprint,
      publicKeys: cert.publicKeys,
    },
    sign: (message: string) => _gatewayIdentity!.signer.signString(message),
    signingMode,
  };
}

export function getGatewayIdentity(): CryptographicIdentity | null {
  return _gatewayIdentity;
}

export function getGatewayIdentityStatus(): {
  initialized: boolean;
  did?: string;
  certThumbprint?: string;
  signingMode: string;
  caStats: { totalIssued: number; totalRevoked: number; totalActive: number; transparencyLogSize: number };
} {
  const ca = getDefaultCA();
  return {
    initialized: _gatewayIdentity !== null,
    did: _gatewayIdentity?.did,
    certThumbprint: _gatewayIdentity?.certThumbprint,
    signingMode: getSigningMode(),
    caStats: ca.getStats(),
  };
}
