import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  sign as cryptoSign,
  timingSafeEqual,
  verify as cryptoVerify,
  type KeyLike,
} from 'node:crypto';
import { StateNativeError } from './errors.js';

const AES_KEY_BYTES = 32;
const AES_IV_BYTES = 12;
const AES_TAG_BYTES = 16;

export interface EncryptedEnvelope {
  readonly algorithm: 'AES-256-GCM';
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly wrappedKey: string;
  readonly wrapIv: string;
  readonly wrapAuthTag: string;
}

function encryptAesGcm(key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): {
  readonly ciphertext: Buffer;
  readonly iv: Buffer;
  readonly authTag: Buffer;
} {
  const iv = randomBytes(AES_IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AES_TAG_BYTES });
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, iv, authTag: cipher.getAuthTag() };
}

function decryptAesGcm(
  key: Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  authTag: Uint8Array,
  aad: Uint8Array,
): Buffer {
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: AES_TAG_BYTES });
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (error) {
    throw new StateNativeError(
      'SIGNATURE_INVALID',
      'Encrypted state authentication failed.',
      undefined,
      { cause: error },
    );
  }
}

export function assertMasterKey(masterKey: Uint8Array): void {
  if (masterKey.byteLength !== AES_KEY_BYTES) {
    throw new StateNativeError('INVALID_INPUT', 'The state master key must contain exactly 32 bytes.');
  }
}

export function encryptEnvelope(
  masterKey: Uint8Array,
  plaintext: Uint8Array,
  aadText: string,
): EncryptedEnvelope {
  assertMasterKey(masterKey);
  const aad = Buffer.from(aadText, 'utf8');
  const dataKey = randomBytes(AES_KEY_BYTES);
  const payload = encryptAesGcm(dataKey, plaintext, aad);
  const wrapped = encryptAesGcm(masterKey, dataKey, aad);
  dataKey.fill(0);

  return {
    algorithm: 'AES-256-GCM',
    ciphertext: payload.ciphertext.toString('base64'),
    iv: payload.iv.toString('base64'),
    authTag: payload.authTag.toString('base64'),
    wrappedKey: wrapped.ciphertext.toString('base64'),
    wrapIv: wrapped.iv.toString('base64'),
    wrapAuthTag: wrapped.authTag.toString('base64'),
  };
}

export function decryptEnvelope(
  masterKey: Uint8Array,
  envelope: EncryptedEnvelope,
  aadText: string,
): Uint8Array {
  assertMasterKey(masterKey);
  const aad = Buffer.from(aadText, 'utf8');
  const dataKey = decryptAesGcm(
    masterKey,
    Buffer.from(envelope.wrappedKey, 'base64'),
    Buffer.from(envelope.wrapIv, 'base64'),
    Buffer.from(envelope.wrapAuthTag, 'base64'),
    aad,
  );

  try {
    return decryptAesGcm(
      dataKey,
      Buffer.from(envelope.ciphertext, 'base64'),
      Buffer.from(envelope.iv, 'base64'),
      Buffer.from(envelope.authTag, 'base64'),
      aad,
    );
  } finally {
    dataKey.fill(0);
  }
}

export function signDigest(privateKey: KeyLike, digestHex: string): string {
  return cryptoSign(null, Buffer.from(digestHex, 'hex'), privateKey).toString('base64');
}

export function verifyDigest(publicKey: KeyLike, digestHex: string, signature: string): boolean {
  return cryptoVerify(
    null,
    Buffer.from(digestHex, 'hex'),
    publicKey,
    Buffer.from(signature, 'base64'),
  );
}

export function constantTimeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length || left.length % 2 !== 0) {
    return false;
  }
  const leftBytes = Buffer.from(left, 'hex');
  const rightBytes = Buffer.from(right, 'hex');
  return leftBytes.byteLength === rightBytes.byteLength && timingSafeEqual(leftBytes, rightBytes);
}
