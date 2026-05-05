import { HybridSigner, computeContentHash } from './hybrid-signer.js';
import { getDefaultCA } from './ca/certificate-authority.js';
import { TransparencyLog } from './transparency/merkle-log.js';
import { resolveDidKey, resolveDidWeb } from './did/resolver.js';
import type {
  VerificationVerdict,
  IdentitySignedEntry,
  HybridSignature,
  SignatureVerdict,
} from './types.js';
import { getMinimumVerificationLevel } from './config/signing-config.js';

function verifyKeyBinding(
  signature: HybridSignature,
  certThumbprint: string,
  signerDid: string,
): { bound: boolean; reason?: string } {
  const ca = getDefaultCA();
  const cert = ca.getCertificateByThumbprint(certThumbprint);
  if (!cert) {
    return { bound: false, reason: 'Certificate not found in CA' };
  }

  if (cert.subjectDid !== signerDid) {
    return {
      bound: false,
      reason: `DID mismatch: cert subject DID "${cert.subjectDid}" does not match signer DID "${signerDid}"`,
    };
  }

  const sigPubKeys = signature.publicKeys;
  if (!sigPubKeys) {
    return { bound: false, reason: 'Signature missing publicKeys field' };
  }

  if (sigPubKeys.ed25519 && sigPubKeys.ed25519 !== cert.publicKeys.ed25519) {
    return {
      bound: false,
      reason: 'Ed25519 public key in signature does not match certificate-bound key',
    };
  }

  if (sigPubKeys.mldsa65 && sigPubKeys.mldsa65 !== cert.publicKeys.mldsa65) {
    return {
      bound: false,
      reason: 'ML-DSA-65 public key in signature does not match certificate-bound key',
    };
  }

  return { bound: true };
}

export async function verifySignedEntry(
  entry: IdentitySignedEntry,
  content: string,
): Promise<VerificationVerdict> {
  const now = Date.now();
  const details: Record<string, unknown> = {};

  const contentHash = computeContentHash(content);
  const hashMatch = contentHash === entry.contentHash;
  details.contentHashMatch = hashMatch;

  const signPayload = entry.previousHash
    ? `proof:${entry.contentHash}:${entry.previousHash}`
    : `proof:${entry.contentHash}`;

  const keyBinding = verifyKeyBinding(entry.signature, entry.certThumbprint, entry.signerDid);
  details.keyBinding = keyBinding;

  if (!keyBinding.bound) {
    return {
      did: entry.signerDid,
      signatureVerdict: { valid: false, ed25519Valid: null, mldsa65Valid: null, mode: entry.signature.mode ?? 'hybrid', minimumMet: false },
      certValid: false,
      certRevoked: false,
      transparencyLogVerified: false,
      chainIntegrityOk: hashMatch,
      overallValid: false,
      details,
      verifiedAt: now,
    };
  }

  const minimumLevel = getMinimumVerificationLevel();
  const sigVerdict = HybridSigner.verifyString(signPayload, entry.signature, minimumLevel);
  details.signatureVerdict = sigVerdict;

  const ca = getDefaultCA();
  let certValid = false;
  let certRevoked = false;

  const cert = ca.getCertificateByThumbprint(entry.certThumbprint);
  if (cert) {
    const validity = ca.isCertificateValid(cert.certId);
    certValid = validity.valid;
    certRevoked = ca.isCertificateRevoked(cert.certId);
    details.certStatus = validity;
  } else {
    details.certStatus = { valid: false, reason: 'Certificate not found in CA' };
  }

  let transparencyLogVerified = false;
  const log = ca.transparencyLog;
  const proof = log.getInclusionProofByThumbprint(entry.certThumbprint);
  if (proof) {
    transparencyLogVerified = TransparencyLog.verifyInclusionProof(proof);
    details.transparencyProof = proof;
  }

  let didResolved = false;
  if (entry.signerDid.startsWith('did:key:')) {
    const resolved = resolveDidKey(entry.signerDid);
    didResolved = resolved !== null;
    details.didResolution = { method: 'did:key', resolved: didResolved };
  } else if (entry.signerDid.startsWith('did:web:')) {
    const doc = await resolveDidWeb(entry.signerDid);
    didResolved = doc !== null;
    details.didResolution = { method: 'did:web', resolved: didResolved };
  }
  details.didResolved = didResolved;

  const overallValid =
    hashMatch &&
    sigVerdict.valid &&
    certValid &&
    !certRevoked &&
    transparencyLogVerified &&
    didResolved;

  return {
    did: entry.signerDid,
    signatureVerdict: sigVerdict,
    certValid,
    certRevoked,
    transparencyLogVerified,
    chainIntegrityOk: hashMatch,
    overallValid,
    details,
    verifiedAt: now,
  };
}

export function verifyHybridSignature(
  message: string,
  signature: HybridSignature,
): SignatureVerdict {
  return HybridSigner.verifyString(message, signature, getMinimumVerificationLevel());
}

export function verifyHybridSignatureWithCertBinding(
  message: string,
  signature: HybridSignature,
  certThumbprint: string,
): SignatureVerdict & { keyBindingValid: boolean; keyBindingReason?: string } {
  const ca = getDefaultCA();
  const cert = ca.getCertificateByThumbprint(certThumbprint);

  if (!cert) {
    return {
      valid: false,
      ed25519Valid: null,
      mldsa65Valid: null,
      mode: signature.mode ?? 'hybrid',
      minimumMet: false,
      keyBindingValid: false,
      keyBindingReason: 'Certificate not found',
    };
  }

  const sigPubKeys = signature.publicKeys;
  if (!sigPubKeys) {
    return {
      valid: false,
      ed25519Valid: null,
      mldsa65Valid: null,
      mode: signature.mode ?? 'hybrid',
      minimumMet: false,
      keyBindingValid: false,
      keyBindingReason: 'Signature missing publicKeys',
    };
  }

  if (
    (sigPubKeys.ed25519 && sigPubKeys.ed25519 !== cert.publicKeys.ed25519) ||
    (sigPubKeys.mldsa65 && sigPubKeys.mldsa65 !== cert.publicKeys.mldsa65)
  ) {
    return {
      valid: false,
      ed25519Valid: null,
      mldsa65Valid: null,
      mode: signature.mode ?? 'hybrid',
      minimumMet: false,
      keyBindingValid: false,
      keyBindingReason: 'Signature public keys do not match certificate-bound keys',
    };
  }

  const verdict = HybridSigner.verifyString(message, signature, getMinimumVerificationLevel());
  return { ...verdict, keyBindingValid: true };
}

export async function verifyDid(did: string): Promise<{
  resolved: boolean;
  method: string;
  details: Record<string, unknown>;
}> {
  if (did.startsWith('did:key:')) {
    const resolved = resolveDidKey(did);
    return {
      resolved: resolved !== null,
      method: 'did:key',
      details: resolved ? { publicKeyHex: resolved.publicKeyHex } : {},
    };
  }

  if (did.startsWith('did:web:')) {
    const doc = await resolveDidWeb(did);
    return {
      resolved: doc !== null,
      method: 'did:web',
      details: doc ? { verificationMethods: doc.verificationMethod.length } : {},
    };
  }

  return { resolved: false, method: 'unknown', details: {} };
}

export interface ProofChainWalkEntry {
  index: number;
  contentId: string;
  contentType: string;
  signedEntry: IdentitySignedEntry;
  entryContent: string;
}

export interface ProofChainWalkResult {
  valid: boolean;
  entriesVerified: number;
  entriesFailed: number;
  hashChainIntact: boolean;
  results: Array<{
    index: number;
    contentId: string;
    overallValid: boolean;
    signatureValid: boolean;
    certValid: boolean;
    certRevoked: boolean;
    transparencyVerified: boolean;
    didResolved: boolean;
    hashLinkValid: boolean;
    hashLinkLegacy: boolean;
    details: Record<string, unknown>;
  }>;
}

export async function walkProofChain(
  entries: ProofChainWalkEntry[],
): Promise<ProofChainWalkResult> {
  const results: ProofChainWalkResult['results'] = [];
  let hashChainIntact = true;
  let entriesFailed = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const { signedEntry, entryContent } = entry;

    const contentHash = computeContentHash(entryContent);
    const hashMatch = contentHash === signedEntry.contentHash;

    let hashLinkValid = true;
    let hashLinkLegacy = false;
    if (i > 0 && signedEntry.previousHash) {
      const prevEntry = entries[i - 1]!;
      hashLinkValid = signedEntry.previousHash === prevEntry.signedEntry.contentHash;
    } else if (i > 0 && !signedEntry.previousHash) {
      hashLinkLegacy = true;
    }

    if (!hashLinkValid) hashChainIntact = false;

    const signPayload = signedEntry.previousHash
      ? `proof:${signedEntry.contentHash}:${signedEntry.previousHash}`
      : `proof:${signedEntry.contentHash}`;

    const keyBinding = verifyKeyBinding(signedEntry.signature, signedEntry.certThumbprint, signedEntry.signerDid);

    const minimumLevel = getMinimumVerificationLevel();
    const sigVerdict = keyBinding.bound
      ? HybridSigner.verifyString(signPayload, signedEntry.signature, minimumLevel)
      : { valid: false, ed25519Valid: null, mldsa65Valid: null, mode: signedEntry.signature.mode ?? 'hybrid' as const, minimumMet: false };

    const ca = getDefaultCA();
    let certValid = false;
    let certRevoked = false;
    const cert = ca.getCertificateByThumbprint(signedEntry.certThumbprint);
    if (cert) {
      certValid = ca.isCertificateValid(cert.certId).valid;
      certRevoked = ca.isCertificateRevoked(cert.certId);
    }

    let transparencyVerified = false;
    const log = ca.transparencyLog;
    const proof = log.getInclusionProofByThumbprint(signedEntry.certThumbprint);
    if (proof) {
      transparencyVerified = TransparencyLog.verifyInclusionProof(proof);
    }

    let didResolved = false;
    if (signedEntry.signerDid.startsWith('did:key:')) {
      didResolved = resolveDidKey(signedEntry.signerDid) !== null;
    } else if (signedEntry.signerDid.startsWith('did:web:')) {
      const doc = await resolveDidWeb(signedEntry.signerDid);
      didResolved = doc !== null;
    }

    const entryValid =
      hashMatch &&
      hashLinkValid &&
      keyBinding.bound &&
      sigVerdict.valid &&
      certValid &&
      !certRevoked &&
      transparencyVerified &&
      didResolved;

    if (!entryValid) entriesFailed++;

    results.push({
      index: entry.index,
      contentId: entry.contentId,
      overallValid: entryValid,
      signatureValid: sigVerdict.valid,
      certValid,
      certRevoked,
      transparencyVerified,
      didResolved,
      hashLinkValid,
      hashLinkLegacy,
      details: {
        contentHashMatch: hashMatch,
        keyBinding,
        signatureVerdict: sigVerdict,
      },
    });
  }

  return {
    valid: entriesFailed === 0 && entries.length > 0,
    entriesVerified: entries.length - entriesFailed,
    entriesFailed,
    hashChainIntact,
    results,
  };
}

export function verifyCertificate(certIdOrThumbprint: string): {
  valid: boolean;
  revoked: boolean;
  transparencyVerified: boolean;
  details: Record<string, unknown>;
} {
  const ca = getDefaultCA();

  let cert = ca.getCertificate(certIdOrThumbprint);
  if (!cert) {
    cert = ca.getCertificateByThumbprint(certIdOrThumbprint);
  }

  if (!cert) {
    return {
      valid: false,
      revoked: false,
      transparencyVerified: false,
      details: { error: 'Certificate not found' },
    };
  }

  const validity = ca.isCertificateValid(cert.certId);
  const revoked = ca.isCertificateRevoked(cert.certId);
  const issuerSignatureValid = ca.verifyCertificateSignature(cert);

  const log = ca.transparencyLog;
  const proof = log.getInclusionProofByThumbprint(cert.thumbprint);
  const transparencyVerified = proof ? TransparencyLog.verifyInclusionProof(proof) : false;

  return {
    valid: validity.valid && issuerSignatureValid,
    revoked,
    transparencyVerified,
    details: {
      certId: cert.certId,
      subject: cert.subject,
      subjectDid: cert.subjectDid,
      issuer: cert.issuer,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      thumbprint: cert.thumbprint,
      issuerSignatureValid,
      ...(revoked ? { revokedAt: cert.revokedAt, revocationReason: cert.revocationReason } : {}),
      transparencyProof: proof ?? null,
    },
  };
}
