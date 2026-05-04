import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { ModelPassport, SignedModelPassport } from './types.js';

/**
 * Deep-canonical JSON serializer: recursively sorts object keys so that the
 * same passport body always produces the same byte sequence regardless of
 * insertion order. Arrays are serialized in their natural order (reordering
 * them would change semantics). This replaces the broken array-replacer form
 * of JSON.stringify which only filters top-level keys and never sorts nested
 * objects.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k]),
      )
      .join(',') +
    '}'
  );
}

export interface PassportKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export function generatePassportKeyPair(): PassportKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const keyId = createHash('sha256')
    .update(publicKey)
    .digest('hex')
    .slice(0, 16);
  return { publicKey, privateKey, keyId };
}

export function computePassportHash(passport: ModelPassport): string {
  const canonical = canonicalJson(passport);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function signPassport(
  passport: ModelPassport,
  privateKeyPem: string,
  publicKeyPem: string,
): SignedModelPassport {
  const provenanceHash = computePassportHash(passport);
  const payload = Buffer.from(provenanceHash, 'utf8');

  const signatureBuffer = sign(null, payload, { key: privateKeyPem, dsaEncoding: 'ieee-p1363' });
  const signature = signatureBuffer.toString('base64url');

  return {
    passport,
    signature,
    signerPublicKey: publicKeyPem,
    provenanceHash,
    signedAt: new Date().toISOString(),
  };
}

export function verifyPassportSignature(signed: SignedModelPassport): {
  signatureOk: boolean;
  hashOk: boolean;
} {
  try {
    const recomputedHash = computePassportHash(signed.passport);
    const hashOk = recomputedHash === signed.provenanceHash;

    const payload = Buffer.from(signed.provenanceHash, 'utf8');
    const sigBuffer = Buffer.from(signed.signature, 'base64url');

    const signatureOk = verify(
      null,
      payload,
      { key: signed.signerPublicKey, format: 'pem', dsaEncoding: 'ieee-p1363' },
      sigBuffer,
    );

    return { signatureOk, hashOk };
  } catch {
    return { signatureOk: false, hashOk: false };
  }
}

export function computeSignatureDigest(signature: string): string {
  return createHash('sha256').update(signature).digest('hex').slice(0, 32);
}

export function generatePassportId(
  provider: string,
  providerModelId: string,
  quantTier: string,
  tenantId?: number,
): string {
  const base = `${provider}:${providerModelId}:${quantTier}${tenantId ? `:t${tenantId}` : ''}`;
  const hash = createHash('sha256').update(base, 'utf8').digest('hex').slice(0, 12);
  return `mpf_${hash}`;
}

/**
 * parsePassport — load and validate a SignedModelPassport from a local file path
 * or a remote HTTPS URL. Returns the parsed, schema-validated passport or throws
 * a descriptive error. Useful for CLI tooling and ops scripts.
 */
export async function parsePassport(source: string): Promise<SignedModelPassport> {
  let raw: string;

  if (source.startsWith('https://') || source.startsWith('http://')) {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`parsePassport: HTTP ${res.status} fetching ${source}`);
    }
    raw = await res.text();
  } else {
    raw = await readFile(source, 'utf8');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`parsePassport: invalid JSON in ${source}: ${(e as Error).message}`);
  }

  const { validateSignedPassport } = await import('./schema.js');
  const result = validateSignedPassport(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`parsePassport: schema validation failed for ${source}: ${issues}`);
  }

  return result.data;
}
