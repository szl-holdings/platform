import { db, pqcCaRootKeysTable, pqcCertificatesTable, pqcTransparencyLogTable } from '@szl-holdings/db';
import { eq, asc } from 'drizzle-orm';
import type { PersistentCAStore } from '@szl-holdings/pqc-identity';
import type { HybridKeyPair, CertificateData, HybridSignature, TransparencyLogEntry } from '@szl-holdings/pqc-identity';
import { encryptSecret, decryptSecret, isEncrypted } from './crypto';

function encodeKey(raw: Uint8Array): string {
  return Buffer.from(raw).toString('hex');
}

function decodeKey(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function wrapPrivateKey(raw: Uint8Array): string {
  const hex = encodeKey(raw);
  return encryptSecret(hex);
}

function unwrapPrivateKey(ciphertext: string): Uint8Array {
  if (!isEncrypted(ciphertext)) {
    throw new Error(
      '[pqc-db-store] CA private key in DB is not encrypted — data integrity violation',
    );
  }
  const hex = decryptSecret(ciphertext);
  return decodeKey(hex);
}

export class DrizzlePersistentCAStore implements PersistentCAStore {
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
      publicKeys: {
        ed25519: r.ed25519PublicKey,
        mldsa65: r.mldsa65PublicKey,
      },
      notBefore: r.notBefore.getTime(),
      notAfter: r.notAfter.getTime(),
      serialNumber: r.serialNumber,
      thumbprint: r.thumbprint,
      issuedAt: r.issuedAt.getTime(),
      issuerSignature: (r.issuerSignature as HybridSignature) ?? undefined,
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
        entryType: entry.entryType,
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
