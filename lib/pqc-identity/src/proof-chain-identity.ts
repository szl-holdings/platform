import type { CryptographicIdentity, IdentitySignedEntry, HybridSignature } from './types.js';
import { computeContentHash, HybridSigner } from './hybrid-signer.js';
import { getDefaultCA } from './ca/certificate-authority.js';
import { TransparencyLog } from './transparency/merkle-log.js';
import { getMinimumVerificationLevel, getSigningMode } from './config/signing-config.js';

export interface SignedProofChainEntry {
  contentHash: string;
  previousEntryHash?: string;
  signerDid: string;
  certThumbprint: string;
  signature: HybridSignature;
  signedAt: string;
  signingMode: string;
}

export function signProofChainEntry(
  identity: CryptographicIdentity,
  entryContent: string,
  previousEntryHash?: string,
): SignedProofChainEntry {
  const contentHash = computeContentHash(entryContent);
  const signPayload = previousEntryHash
    ? `proof:${contentHash}:${previousEntryHash}`
    : `proof:${contentHash}`;

  const signature = identity.signer.signString(signPayload);

  return {
    contentHash,
    previousEntryHash,
    signerDid: identity.did,
    certThumbprint: identity.certThumbprint,
    signature,
    signedAt: new Date().toISOString(),
    signingMode: getSigningMode(),
  };
}

export function verifyProofChainEntry(
  entry: SignedProofChainEntry,
  entryContent: string,
): { valid: boolean; details: Record<string, unknown> } {
  const details: Record<string, unknown> = {};

  const contentHash = computeContentHash(entryContent);
  const hashValid = contentHash === entry.contentHash;
  details.contentHashValid = hashValid;

  const signPayload = entry.previousEntryHash
    ? `proof:${entry.contentHash}:${entry.previousEntryHash}`
    : `proof:${entry.contentHash}`;

  const ca = getDefaultCA();
  const cert = ca.getCertificateByThumbprint(entry.certThumbprint);
  let certValid = false;
  let keyBindingValid = false;

  if (cert) {
    const validity = ca.isCertificateValid(cert.certId);
    certValid = validity.valid;
    details.certValid = validity;

    if (cert.subjectDid !== entry.signerDid) {
      details.keyBinding = {
        bound: false,
        reason: `DID mismatch: cert subject "${cert.subjectDid}" != signer "${entry.signerDid}"`,
      };
    } else {
      const sigPubKeys = entry.signature.publicKeys;
      if (!sigPubKeys) {
        details.keyBinding = { bound: false, reason: 'Signature missing publicKeys' };
      } else if (
        (sigPubKeys.ed25519 && sigPubKeys.ed25519 !== cert.publicKeys.ed25519) ||
        (sigPubKeys.mldsa65 && sigPubKeys.mldsa65 !== cert.publicKeys.mldsa65)
      ) {
        details.keyBinding = {
          bound: false,
          reason: 'Signature public keys do not match certificate-bound keys',
        };
      } else {
        keyBindingValid = true;
        details.keyBinding = { bound: true };
      }
    }
  } else {
    details.certValid = { valid: false, reason: 'Certificate not found' };
    details.keyBinding = { bound: false, reason: 'Certificate not found' };
  }

  const minimumLevel = getMinimumVerificationLevel();
  const sigVerdict = HybridSigner.verifyString(signPayload, entry.signature, minimumLevel);
  details.signatureVerdict = sigVerdict;

  const log = ca.transparencyLog;
  const proof = log.getInclusionProofByThumbprint(entry.certThumbprint);
  const transparencyValid = proof ? TransparencyLog.verifyInclusionProof(proof) : false;
  details.transparencyValid = transparencyValid;

  const valid = hashValid && sigVerdict.valid && certValid && keyBindingValid && transparencyValid;
  return { valid, details };
}

export function isLegacyEntry(metadata: Record<string, unknown>): boolean {
  const pqcSig = metadata.pqcSignature as Record<string, unknown> | undefined;
  if (pqcSig && (pqcSig.signerDid || pqcSig.certThumbprint || pqcSig.signature)) {
    return false;
  }
  return !metadata.signerDid && !metadata.certThumbprint && !metadata.signature;
}

export function verifyLegacyEntry(): { valid: boolean; details: Record<string, unknown> } {
  return {
    valid: true,
    details: {
      legacy: true,
      note: 'Pre-PQC entry verified under legacy path (no cryptographic signature)',
    },
  };
}
