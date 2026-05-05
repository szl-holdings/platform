import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { randomUUID } from 'node:crypto';
import {
  HybridSigner,
  generateHybridKeyPair,
  createHybridSigner,
} from '../hybrid-signer.js';
import type {
  CertificateData,
  CertificateIssuanceResult,
  HybridKeyPair,
  HybridSignature,
} from '../types.js';
import { TransparencyLog } from '../transparency/merkle-log.js';

const DEFAULT_CERT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export interface CAConfig {
  issuerName: string;
  keyPair?: HybridKeyPair;
  transparencyLog?: TransparencyLog;
}

export class CertificateAuthority {
  private readonly _issuerName: string;
  private readonly _rootKeyPair: HybridKeyPair;
  private readonly _rootSigner: HybridSigner;
  private readonly _transparencyLog: TransparencyLog;
  private readonly _issuedCerts = new Map<string, CertificateData>();
  private readonly _revokedCerts = new Map<string, { revokedAt: number; reason: string }>();

  constructor(config: CAConfig) {
    this._issuerName = config.issuerName;
    this._rootKeyPair = config.keyPair ?? generateHybridKeyPair();
    this._rootSigner = createHybridSigner(this._rootKeyPair);
    this._transparencyLog = config.transparencyLog ?? new TransparencyLog();
  }

  get issuerName(): string {
    return this._issuerName;
  }

  get rootPublicKeys(): { ed25519: string; mldsa65: string } {
    return this._rootSigner.publicKeys;
  }

  get transparencyLog(): TransparencyLog {
    return this._transparencyLog;
  }

  issueCertificate(opts: {
    subjectDid: string;
    subjectName: string;
    publicKeys: { ed25519: string; mldsa65: string };
    validityMs?: number;
  }): CertificateIssuanceResult {
    const now = Date.now();
    const validityMs = opts.validityMs ?? DEFAULT_CERT_VALIDITY_MS;
    const serialNumber = randomUUID();
    const certId = `cert-${serialNumber}`;

    const certContent = [
      certId,
      this._issuerName,
      opts.subjectDid,
      opts.publicKeys.ed25519,
      opts.publicKeys.mldsa65,
      now.toString(),
      (now + validityMs).toString(),
    ].join('|');

    const thumbprint = bytesToHex(sha256(new TextEncoder().encode(certContent))).slice(0, 40);

    const issuerSignature = this._rootSigner.sign(
      new TextEncoder().encode(certContent),
    );

    const certificate: CertificateData = {
      certId,
      version: 1,
      issuer: this._issuerName,
      subject: opts.subjectName,
      subjectDid: opts.subjectDid,
      publicKeys: opts.publicKeys,
      notBefore: now,
      notAfter: now + validityMs,
      serialNumber,
      thumbprint,
      issuedAt: now,
      issuerSignature,
    };

    this._issuedCerts.set(certId, certificate);

    const inclusionProof = this._transparencyLog.append({
      entryType: 'issuance',
      certThumbprint: thumbprint,
      certId,
      subjectDid: opts.subjectDid,
    });

    return { certificate, inclusionProof };
  }

  revokeCertificate(certId: string, reason: string): { success: boolean; inclusionProof?: import('../types.js').TransparencyInclusionProof } {
    const cert = this._issuedCerts.get(certId);
    if (!cert) return { success: false };

    const now = Date.now();
    cert.revokedAt = now;
    cert.revocationReason = reason;
    this._revokedCerts.set(certId, { revokedAt: now, reason });

    const inclusionProof = this._transparencyLog.append({
      entryType: 'revocation',
      certThumbprint: cert.thumbprint,
      certId,
      subjectDid: cert.subjectDid,
    });

    return { success: true, inclusionProof };
  }

  getCertificate(certId: string): CertificateData | undefined {
    return this._issuedCerts.get(certId);
  }

  getCertificateByThumbprint(thumbprint: string): CertificateData | undefined {
    for (const cert of this._issuedCerts.values()) {
      if (cert.thumbprint === thumbprint) return cert;
    }
    return undefined;
  }

  isCertificateValid(certId: string): { valid: boolean; reason?: string } {
    const cert = this._issuedCerts.get(certId);
    if (!cert) return { valid: false, reason: 'Certificate not found' };

    if (this._revokedCerts.has(certId)) {
      const rev = this._revokedCerts.get(certId)!;
      return { valid: false, reason: `Revoked: ${rev.reason}` };
    }

    const now = Date.now();
    if (now < cert.notBefore) return { valid: false, reason: 'Not yet valid' };
    if (now > cert.notAfter) return { valid: false, reason: 'Expired' };

    return { valid: true };
  }

  isCertificateRevoked(certId: string): boolean {
    return this._revokedCerts.has(certId);
  }

  signWithRootKey(message: Uint8Array): HybridSignature {
    return this._rootSigner.sign(message);
  }

  verifyCertificateSignature(cert: CertificateData): boolean {
    if (!cert.issuerSignature) return false;

    const certContent = [
      cert.certId,
      this._issuerName,
      cert.subjectDid,
      cert.publicKeys.ed25519,
      cert.publicKeys.mldsa65,
      cert.notBefore.toString(),
      cert.notAfter.toString(),
    ].join('|');

    const sigVerdict = HybridSigner.verify(
      new TextEncoder().encode(certContent),
      cert.issuerSignature,
    );
    return sigVerdict.valid;
  }

  restoreCertificate(cert: CertificateData): void {
    this._issuedCerts.set(cert.certId, cert);
    if (cert.revokedAt) {
      this._revokedCerts.set(cert.certId, {
        revokedAt: cert.revokedAt,
        reason: cert.revocationReason ?? 'unknown',
      });
    }
  }

  listCertificates(): CertificateData[] {
    return Array.from(this._issuedCerts.values());
  }

  getStats(): {
    totalIssued: number;
    totalRevoked: number;
    totalActive: number;
    transparencyLogSize: number;
  } {
    return {
      totalIssued: this._issuedCerts.size,
      totalRevoked: this._revokedCerts.size,
      totalActive: this._issuedCerts.size - this._revokedCerts.size,
      transparencyLogSize: this._transparencyLog.size,
    };
  }
}

let _defaultCA: CertificateAuthority | null = null;

export function getDefaultCA(): CertificateAuthority {
  if (!_defaultCA) {
    _defaultCA = new CertificateAuthority({
      issuerName: 'SZL Holdings Root CA v1',
    });
  }
  return _defaultCA;
}

export function setDefaultCA(ca: CertificateAuthority): void {
  _defaultCA = ca;
  _onCASwapCallbacks.forEach((cb) => { try { cb(); } catch { /* ignore */ } });
}

const _onCASwapCallbacks: Array<() => void> = [];

export function onCASwap(cb: () => void): void {
  _onCASwapCallbacks.push(cb);
}
