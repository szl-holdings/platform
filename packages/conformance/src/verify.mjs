import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const KHIPU_PAYLOAD_TYPE = 'application/vnd.szl.khipu.receipt+json';

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

export function dssePae(payloadType, payload) {
  const typeBytes = Buffer.from(payloadType, 'utf8');
  const payloadBytes = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  return Buffer.concat([
    Buffer.from(`DSSEv1 ${typeBytes.length} `, 'utf8'),
    typeBytes,
    Buffer.from(` ${payloadBytes.length} `, 'utf8'),
    payloadBytes,
  ]);
}

function decodeBase64Strict(value, field) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new TypeError(`${field} must be canonical base64`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) {
    throw new TypeError(`${field} must be canonical base64`);
  }
  return decoded;
}

export function publicKeyFingerprint(publicKeyPem) {
  const key = createPublicKey(publicKeyPem);
  const der = key.export({ format: 'der', type: 'spki' });
  return `sha256:${createHash('sha256').update(der).digest('hex')}`;
}

export function payloadHash(envelope) {
  const payload = decodeBase64Strict(envelope?.payload, 'payload');
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

export function decodeDssePayload(envelope) {
  const payload = decodeBase64Strict(envelope?.payload, 'payload');
  try {
    return JSON.parse(payload.toString('utf8'));
  } catch (error) {
    throw new TypeError(`payload must contain UTF-8 JSON: ${error.message}`);
  }
}

export function verifyDsseEnvelope(envelope, { publicKeyPem, expectedFingerprint } = {}) {
  const checks = [];
  try {
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
      throw new TypeError('envelope must be an object');
    }
    if (typeof envelope.payloadType !== 'string' || !envelope.payloadType) {
      throw new TypeError('payloadType must be a non-empty string');
    }
    const payload = decodeBase64Strict(envelope.payload, 'payload');
    const signatures = envelope.signatures;
    if (!Array.isArray(signatures) || signatures.length !== 1) {
      throw new TypeError('exactly one DSSE signature is required');
    }

    const embeddedKey = envelope.verification?.publicKeyPem;
    const trustedKey = publicKeyPem || embeddedKey;
    if (!trustedKey) {
      throw new TypeError('a public key is required');
    }
    const key = createPublicKey(trustedKey);
    if (key.asymmetricKeyType !== 'ed25519') {
      throw new TypeError(`unsupported key type: ${key.asymmetricKeyType || 'unknown'}`);
    }

    const fingerprint = publicKeyFingerprint(trustedKey);
    checks.push({
      name: 'public-key',
      status: publicKeyPem ? 'trusted-input' : 'embedded-unpinned',
      fingerprint,
    });
    if (expectedFingerprint && fingerprint !== expectedFingerprint) {
      throw new Error(
        `public key fingerprint mismatch: expected ${expectedFingerprint}, received ${fingerprint}`,
      );
    }

    const signature = decodeBase64Strict(signatures[0]?.sig, 'signatures[0].sig');
    const valid = verify(null, dssePae(envelope.payloadType, payload), key, signature);
    checks.push({
      name: 'dsse-signature',
      status: valid ? 'pass' : 'fail',
      keyid: signatures[0]?.keyid || null,
    });
    if (!valid) {
      return { valid: false, checks, error: 'DSSE signature verification failed' };
    }

    const decodedPayload = decodeDssePayload(envelope);
    checks.push({ name: 'payload-json', status: 'pass' });
    return {
      valid: true,
      checks,
      payload: decodedPayload,
      payloadHash: payloadHash(envelope),
      trust: publicKeyPem ? 'pinned-external-key' : 'embedded-key-unpinned',
    };
  } catch (error) {
    return {
      valid: false,
      checks,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyDsseFile(path, options = {}) {
  const envelope = JSON.parse(await readFile(path, 'utf8'));
  return verifyDsseEnvelope(envelope, options);
}

export function signDssePayload(payload, { privateKeyPem, publicKeyPem, keyid = 'local-ed25519' }) {
  const privateKey = createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    throw new TypeError('private key must be Ed25519');
  }
  const payloadBytes = Buffer.from(canonicalJson(payload), 'utf8');
  const signature = sign(null, dssePae(KHIPU_PAYLOAD_TYPE, payloadBytes), privateKey);
  return {
    payloadType: KHIPU_PAYLOAD_TYPE,
    payload: payloadBytes.toString('base64'),
    signatures: [{ keyid, sig: signature.toString('base64') }],
    verification: publicKeyPem ? { publicKeyPem } : undefined,
  };
}
