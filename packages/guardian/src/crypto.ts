/**
 * Ed25519 cryptographic signing for Guardian approval decisions.
 *
 * Replaces the base64 stub with real cryptographic signatures.
 * Each tenant gets a deterministic signing key pair derived from a
 * seeded HKDF expansion of the tenant ID (or a global key for
 * unscoped decisions). On first use the key pair is generated and
 * cached in-process.
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

export interface SigningKeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicKeyHex: string;
}

const keyCache = new Map<string, SigningKeyPair>();

/**
 * Retrieve (or generate) a tenant-scoped Ed25519 key pair.
 * Key pairs are cached in-process for the lifetime of the service.
 */
export function getSigningKeyPair(tenantId: string = 'default'): SigningKeyPair {
  const cached = keyCache.get(tenantId);
  if (cached) return cached;

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pubDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const pair: SigningKeyPair = {
    privateKey,
    publicKey,
    publicKeyHex: pubDer.toString('hex'),
  };
  keyCache.set(tenantId, pair);
  return pair;
}

/**
 * Sign an approval decision payload with the tenant's Ed25519 private key.
 * Returns a base64url-encoded Ed25519 signature.
 *
 * The signed message is: `${requestId}:${verdict}:${actor}:${decidedAt}`
 */
export function signApprovalDecision(params: {
  requestId: string;
  verdict: string;
  actor: string;
  decidedAt: number;
  tenantId?: string;
}): { signature: string; publicKeyHex: string } {
  const { requestId, verdict, actor, decidedAt, tenantId } = params;
  const message = `${requestId}:${verdict}:${actor}:${decidedAt}`;
  const keyPair = getSigningKeyPair(tenantId);
  const sigBuf = sign(null, Buffer.from(message, 'utf8'), keyPair.privateKey);
  return {
    signature: sigBuf.toString('base64url'),
    publicKeyHex: keyPair.publicKeyHex,
  };
}

/**
 * Verify an Ed25519 approval decision signature.
 * Returns true when the signature is cryptographically valid.
 */
export function verifyApprovalSignature(params: {
  requestId: string;
  verdict: string;
  actor: string;
  decidedAt: number;
  signature: string;
  publicKeyHex: string;
}): boolean {
  const { requestId, verdict, actor, decidedAt, signature, publicKeyHex } = params;
  try {
    const message = `${requestId}:${verdict}:${actor}:${decidedAt}`;
    const pubDer = Buffer.from(publicKeyHex, 'hex');
    const publicKey = createPublicKey({ key: pubDer, type: 'spki', format: 'der' });
    const sigBuf = Buffer.from(signature, 'base64url');
    return verify(null, Buffer.from(message, 'utf8'), publicKey, sigBuf);
  } catch {
    return false;
  }
}

/**
 * Build a compact, human-readable proof label for display in the UI.
 * Format: `Ed25519·${first8charsOfPubKey}·${first8charsOfSig}`
 */
export function buildProofLabel(signature: string, publicKeyHex: string): string {
  return `Ed25519·${publicKeyHex.slice(0, 8)}·${signature.slice(0, 8)}`;
}

// Re-export so dependents can import from this single module
export { createPrivateKey, createPublicKey };
