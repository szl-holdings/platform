import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { randomUUID } from 'node:crypto';
import {
  HybridSigner,
  generateHybridKeyPair,
} from '../hybrid-signer.js';
import type {
  CertificateData,
  CertificateIssuanceResult,
  HybridKeyPair,
  HybridSignature,
} from '../types.js';
import { TransparencyLog } from '../transparency/merkle-log.js';
import {
  type HsmSigner,
  type HsmSignContext,
  SoftwareHsmDriver,
} from './hsm-signer.js';

const DEFAULT_CERT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export interface CAConfig {
  issuerName: string;
  /** Preferred: an HSM-backed signer for the root key. */
  rootSigner?: HsmSigner;
  /**
   * Legacy: in-process key material. When supplied without `rootSigner`,
   * the CA wraps it in a `SoftwareHsmDriver` so the audit chain still
   * captures every signing operation. Production deployments should
   * register a hardware driver and pass `rootSigner` instead.
   */
  keyPair?: HybridKeyPair;
  transparencyLog?: TransparencyLog;
}

export class CertificateAuthority {
  private readonly _issuerName: string;
  private readonly _rootSigner: HsmSigner;
  private _intermediateSigner: HsmSigner | null = null;
  private _intermediateName: string | null = null;
  private readonly _transparencyLog: TransparencyLog;
  private readonly _issuedCerts = new Map<string, CertificateData>();
  private readonly _revokedCerts = new Map<string, { revokedAt: number; reason: string }>();

  constructor(config: CAConfig) {
    this._issuerName = config.issuerName;
    if (config.rootSigner) {
      this._rootSigner = config.rootSigner;
    } else {
      // Legacy / dev path: wrap a raw keyPair in the software HSM driver
      // so every root-key use still flows through the audit sink and the
      // signing path is identical to the hardware-driver path.
      const keyPair = config.keyPair ?? generateHybridKeyPair();
      this._rootSigner = new SoftwareHsmDriver({
        keyTier: 'root',
        keyRef: `root:${config.issuerName}`,
        keyPair,
      });
    }
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

  /**
   * Whether day-to-day issuance is delegated to an intermediate signer.
   * When `false`, `issueCertificate` falls back to the root signer and
   * the audit chain will record root-key usage on every certificate —
   * acceptable for dev, but the production cutover should set an
   * intermediate at boot via `setIntermediateSigner`.
   */
  get hasIntermediateSigner(): boolean {
    return this._intermediateSigner !== null;
  }

  get intermediateName(): string | null {
    return this._intermediateName;
  }

  getRootSigner(): HsmSigner {
    return this._rootSigner;
  }

  getIntermediateSigner(): HsmSigner | null {
    return this._intermediateSigner;
  }

  /**
   * Install an intermediate-tier HSM signer. After this is called, all
   * subsequent `issueCertificate` operations sign with the intermediate
   * and the root signer is touched only for ceremonies (rotation,
   * attestation, intermediate creation, cross-signing).
   */
  setIntermediateSigner(signer: HsmSigner, intermediateName: string): void {
    if (signer.keyTier !== 'intermediate') {
      throw new Error(
        `setIntermediateSigner expected keyTier='intermediate', got '${signer.keyTier}'`,
      );
    }
    this._intermediateSigner = signer;
    this._intermediateName = intermediateName;
  }

  clearIntermediateSigner(): void {
    this._intermediateSigner = null;
    this._intermediateName = null;
  }

  async issueCertificate(opts: {
    subjectDid: string;
    subjectName: string;
    publicKeys: { ed25519: string; mldsa65: string };
    validityMs?: number;
    requesterIdentity?: string;
  }): Promise<CertificateIssuanceResult> {
    const now = Date.now();
    const validityMs = opts.validityMs ?? DEFAULT_CERT_VALIDITY_MS;
    const serialNumber = randomUUID();
    const certId = `cert-${serialNumber}`;

    // Issuer of record is whichever tier actually signs the cert. This
    // keeps the X.509-style chain honest: a verifier walks subject ->
    // intermediate -> root rather than subject -> root.
    const signingTier: HsmSigner = this._intermediateSigner ?? this._rootSigner;
    const issuerName = this._intermediateSigner
      ? (this._intermediateName ?? this._issuerName)
      : this._issuerName;

    const certContent = [
      certId,
      issuerName,
      opts.subjectDid,
      opts.publicKeys.ed25519,
      opts.publicKeys.mldsa65,
      now.toString(),
      (now + validityMs).toString(),
    ].join('|');

    const thumbprint = bytesToHex(sha256(new TextEncoder().encode(certContent))).slice(0, 40);

    const ctx: HsmSignContext = {
      requesterIdentity: opts.requesterIdentity ?? 'ca-issuance',
      operation: 'sign',
      metadata: { certId, subjectDid: opts.subjectDid },
    };
    const issuerSignature = await signingTier.sign(
      new TextEncoder().encode(certContent),
      ctx,
    );

    const certificate: CertificateData = {
      certId,
      version: 1,
      issuer: issuerName,
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

  /**
   * Sign an arbitrary payload with the ROOT key. Reserved for ceremonies
   * (intermediate creation, rotation, attestation, cross-signing). Day-to-day
   * issuance must go through `issueCertificate`, which delegates to the
   * intermediate signer when one is installed.
   */
  async signWithRootKey(
    message: Uint8Array,
    requesterIdentity = 'root-ceremony',
  ): Promise<HybridSignature> {
    return this._rootSigner.sign(message, {
      requesterIdentity,
      operation: 'sign',
      metadata: { tier: 'root', ceremonial: true },
    });
  }

  verifyCertificateSignature(cert: CertificateData): boolean {
    if (!cert.issuerSignature) return false;

    // Recompute against the issuer recorded on the cert so chains signed
    // by an intermediate verify against the intermediate's name.
    const certContent = [
      cert.certId,
      cert.issuer,
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
    intermediateInstalled: boolean;
    intermediateName: string | null;
  } {
    return {
      totalIssued: this._issuedCerts.size,
      totalRevoked: this._revokedCerts.size,
      totalActive: this._issuedCerts.size - this._revokedCerts.size,
      transparencyLogSize: this._transparencyLog.size,
      intermediateInstalled: this._intermediateSigner !== null,
      intermediateName: this._intermediateName,
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
