/**
 * Intermediate CA tier.
 *
 * Day-to-day certificate issuance is delegated to intermediate signing keys
 * so the root key is touched only during rare ceremonies (intermediate
 * creation, rotation, cross-signing, attestation). This is the standard
 * defence-in-depth shape for any CA: limit root-key usage to events that
 * cleanly map to an HSM audit-log entry.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { randomUUID } from 'node:crypto';
import type { HsmSigner } from './hsm-signer.js';
import type { CertificateData, CertificateIssuanceResult, HybridSignature } from '../types.js';
import { TransparencyLog } from '../transparency/merkle-log.js';

export interface IntermediateCAConfig {
  intermediateName: string;
  rootIssuer: string;
  signer: HsmSigner;
  /** Hybrid signature from the root over this intermediate's public-key bundle. */
  rootSignature?: HybridSignature;
  transparencyLog?: TransparencyLog;
  defaultValidityMs?: number;
}

const DEFAULT_CERT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export class IntermediateCA {
  private readonly _name: string;
  private readonly _rootIssuer: string;
  private readonly _signer: HsmSigner;
  private readonly _rootSignature: HybridSignature | undefined;
  private readonly _transparencyLog: TransparencyLog;
  private readonly _defaultValidityMs: number;
  private readonly _issuedCerts = new Map<string, CertificateData>();

  constructor(config: IntermediateCAConfig) {
    this._name = config.intermediateName;
    this._rootIssuer = config.rootIssuer;
    this._signer = config.signer;
    this._rootSignature = config.rootSignature;
    this._transparencyLog = config.transparencyLog ?? new TransparencyLog();
    this._defaultValidityMs = config.defaultValidityMs ?? DEFAULT_CERT_VALIDITY_MS;
  }

  get intermediateName(): string {
    return this._name;
  }
  get rootIssuer(): string {
    return this._rootIssuer;
  }
  get publicKeys(): { ed25519: string; mldsa65: string } {
    return this._signer.publicKeys;
  }
  get rootSignature(): HybridSignature | undefined {
    return this._rootSignature;
  }
  get transparencyLog(): TransparencyLog {
    return this._transparencyLog;
  }
  get signer(): HsmSigner {
    return this._signer;
  }

  async issueCertificate(opts: {
    subjectDid: string;
    subjectName: string;
    publicKeys: { ed25519: string; mldsa65: string };
    validityMs?: number;
    requesterIdentity?: string;
  }): Promise<CertificateIssuanceResult> {
    const now = Date.now();
    const validityMs = opts.validityMs ?? this._defaultValidityMs;
    const serialNumber = randomUUID();
    const certId = `cert-${serialNumber}`;

    const certContent = [
      certId,
      this._name,
      opts.subjectDid,
      opts.publicKeys.ed25519,
      opts.publicKeys.mldsa65,
      now.toString(),
      (now + validityMs).toString(),
    ].join('|');

    const thumbprint = bytesToHex(sha256(new TextEncoder().encode(certContent))).slice(0, 40);

    const issuerSignature = await this._signer.sign(new TextEncoder().encode(certContent), {
      requesterIdentity: opts.requesterIdentity ?? 'intermediate-ca',
      operation: 'sign',
      metadata: { certId, subjectDid: opts.subjectDid },
    });

    const certificate: CertificateData = {
      certId,
      version: 1,
      issuer: this._name,
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
}
