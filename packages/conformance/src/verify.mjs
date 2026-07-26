import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const KHIPU_PAYLOAD_TYPE = 'application/vnd.szl.khipu.receipt+json';
export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED: 'verified',
  INVALID: 'invalid',
  INDETERMINATE: 'indeterminate',
});

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

function keyAlgorithm(key) {
  if (key.asymmetricKeyType === 'ed25519') {
    return { name: 'Ed25519', digest: null };
  }
  if (
    key.asymmetricKeyType === 'ec' &&
    ['prime256v1', 'P-256'].includes(key.asymmetricKeyDetails?.namedCurve)
  ) {
    return { name: 'ECDSA-P256-SHA256', digest: 'sha256' };
  }
  throw new TypeError(
    `unsupported key type: ${key.asymmetricKeyType || 'unknown'}${
      key.asymmetricKeyDetails?.namedCurve ? `/${key.asymmetricKeyDetails.namedCurve}` : ''
    }`,
  );
}

function verificationResult(status, checks, details = {}) {
  return {
    valid: status === VERIFICATION_STATUS.VERIFIED,
    status,
    checks,
    ...details,
  };
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

export function verifyDsseEnvelope(
  envelope,
  { publicKeyPem, expectedFingerprint, expectedPayloadType = KHIPU_PAYLOAD_TYPE } = {},
) {
  const checks = [];
  try {
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
      throw new TypeError('envelope must be an object');
    }
    if (typeof envelope.payloadType !== 'string' || !envelope.payloadType) {
      throw new TypeError('payloadType must be a non-empty string');
    }
    if (envelope.payloadType !== expectedPayloadType) {
      throw new TypeError(
        `payloadType must be ${expectedPayloadType}; received ${envelope.payloadType}`,
      );
    }
    const payload = decodeBase64Strict(envelope.payload, 'payload');
    const signatures = envelope.signatures;
    if (!Array.isArray(signatures) || signatures.length !== 1) {
      throw new TypeError('exactly one DSSE signature is required');
    }

    const embeddedKey = envelope.verification?.publicKeyPem;
    const trustedKey = publicKeyPem || embeddedKey;
    if (!trustedKey) {
      return verificationResult(VERIFICATION_STATUS.INDETERMINATE, checks, {
        error: 'public key material is required',
        trust: 'missing-key-material',
      });
    }
    if (
      expectedFingerprint !== undefined &&
      (typeof expectedFingerprint !== 'string' ||
        !/^sha256:[0-9a-f]{64}$/.test(expectedFingerprint))
    ) {
      return verificationResult(VERIFICATION_STATUS.INDETERMINATE, checks, {
        error: 'expected fingerprint must be sha256 followed by 64 lowercase hexadecimal digits',
        trust: 'invalid-trust-input',
      });
    }
    let key;
    let algorithm;
    try {
      key = createPublicKey(trustedKey);
      algorithm = keyAlgorithm(key);
    } catch (error) {
      return verificationResult(
        publicKeyPem ? VERIFICATION_STATUS.INDETERMINATE : VERIFICATION_STATUS.INVALID,
        checks,
        {
          error: error instanceof Error ? error.message : String(error),
          trust: publicKeyPem ? 'invalid-trust-input' : 'invalid-embedded-key',
        },
      );
    }

    const fingerprint = publicKeyFingerprint(trustedKey);
    const hasExternalTrustRoot = Boolean(publicKeyPem || expectedFingerprint);
    checks.push({
      name: 'public-key',
      status: publicKeyPem
        ? 'trusted-input'
        : expectedFingerprint
          ? 'fingerprint-pinned-embedded'
          : 'embedded-unpinned',
      fingerprint,
      algorithm: algorithm.name,
    });
    if (expectedFingerprint && fingerprint !== expectedFingerprint) {
      throw new Error(
        `public key fingerprint mismatch: expected ${expectedFingerprint}, received ${fingerprint}`,
      );
    }

    const signature = decodeBase64Strict(signatures[0]?.sig, 'signatures[0].sig');
    const signatureValid = verify(
      algorithm.digest,
      dssePae(envelope.payloadType, payload),
      key,
      signature,
    );
    checks.push({
      name: 'dsse-signature',
      status: signatureValid ? 'pass' : 'fail',
      keyid: signatures[0]?.keyid || null,
      algorithm: algorithm.name,
    });
    if (!signatureValid) {
      return verificationResult(VERIFICATION_STATUS.INVALID, checks, {
        error: 'DSSE signature verification failed',
        trust: hasExternalTrustRoot ? 'pinned' : 'embedded-key-unpinned',
      });
    }

    const decodedPayload = decodeDssePayload(envelope);
    checks.push({ name: 'payload-json', status: 'pass' });
    const common = {
      payload: decodedPayload,
      payloadHash: payloadHash(envelope),
      algorithm: algorithm.name,
      signatureValid: true,
    };
    if (!hasExternalTrustRoot) {
      return verificationResult(VERIFICATION_STATUS.INDETERMINATE, checks, {
        ...common,
        error: 'an externally pinned public key or expected fingerprint is required',
        trust: 'embedded-key-unpinned',
      });
    }
    return verificationResult(VERIFICATION_STATUS.VERIFIED, checks, {
      ...common,
      trust: publicKeyPem
        ? expectedFingerprint
          ? 'pinned-external-key-and-fingerprint'
          : 'pinned-external-key'
        : 'pinned-embedded-key-fingerprint',
    });
  } catch (error) {
    return verificationResult(VERIFICATION_STATUS.INVALID, checks, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function verifyDsseFile(path, options = {}) {
  let contents;
  try {
    contents = await readFile(path, 'utf8');
  } catch (error) {
    return verificationResult(VERIFICATION_STATUS.INDETERMINATE, [], {
      error: `unable to read envelope file: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  try {
    return verifyDsseEnvelope(JSON.parse(contents), options);
  } catch (error) {
    return verificationResult(VERIFICATION_STATUS.INVALID, [], {
      error: `envelope file must contain JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

export function signDssePayload(payload, { privateKeyPem, publicKeyPem, keyid }) {
  const privateKey = createPrivateKey(privateKeyPem);
  const algorithm = keyAlgorithm(privateKey);
  const payloadBytes = Buffer.from(canonicalJson(payload), 'utf8');
  const signature = sign(algorithm.digest, dssePae(KHIPU_PAYLOAD_TYPE, payloadBytes), privateKey);
  return {
    payloadType: KHIPU_PAYLOAD_TYPE,
    payload: payloadBytes.toString('base64'),
    signatures: [
      {
        keyid: keyid || (algorithm.name === 'Ed25519' ? 'local-ed25519' : 'local-ecdsa-p256'),
        sig: signature.toString('base64'),
      },
    ],
    verification: publicKeyPem ? { publicKeyPem } : undefined,
  };
}
