import {
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  createHash,
  type KeyObject,
} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface ForgeKeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicKeyPem: string;
  publicKeyRawBase64: string;
  fingerprint: string;
  generatedAt: string;
  source: 'env' | 'disk' | 'generated';
}

let cached: ForgeKeyPair | null = null;

/**
 * Where (and whether) to persist a generated keypair to disk.
 *
 * - If FORGE_KEYS_DIR is set, use it.
 * - Otherwise default to a gitignored path under the OS tmp dir so
 *   generated private key material NEVER lands in the project repo.
 *
 * Production deployments are expected to provide FORGE_SIGNING_KEY_PEM
 * via the platform secret store; the disk path is only a sandbox/dev
 * convenience and is explicitly disabled in production (see
 * `loadForgeKeys`).
 */
function defaultDataDir(): string {
  return process.env.FORGE_KEYS_DIR || path.join(os.tmpdir(), 'a11oy-forge-keys');
}

function publicArtifacts(publicKey: KeyObject): {
  pem: string;
  rawBase64: string;
  fingerprint: string;
} {
  const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const der = publicKey.export({ type: 'spki', format: 'der' });
  const raw = der.subarray(der.length - 32);
  return {
    pem,
    rawBase64: raw.toString('base64'),
    fingerprint: createHash('sha256').update(raw).digest('hex').slice(0, 16),
  };
}

function loadFromEnv(): ForgeKeyPair | null {
  const pem = process.env.FORGE_SIGNING_KEY_PEM;
  if (!pem) return null;
  const privateKey = createPrivateKey(pem);
  const publicKey = createPublicKey(privateKey);
  const arts = publicArtifacts(publicKey);
  return {
    privateKey,
    publicKey,
    publicKeyPem: arts.pem,
    publicKeyRawBase64: arts.rawBase64,
    fingerprint: arts.fingerprint,
    generatedAt: process.env.FORGE_SIGNING_KEY_GENERATED_AT || 'unknown',
    source: 'env',
  };
}

function loadFromDisk(dir: string): ForgeKeyPair | null {
  const privPath = path.join(dir, 'forge-keys', 'ed25519-private.pem');
  const metaPath = path.join(dir, 'forge-keys', 'metadata.json');
  if (!fs.existsSync(privPath)) return null;
  try {
    const pem = fs.readFileSync(privPath, 'utf8');
    const privateKey = createPrivateKey(pem);
    const publicKey = createPublicKey(privateKey);
    const arts = publicArtifacts(publicKey);
    let generatedAt = 'unknown';
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { generatedAt?: string };
      generatedAt = meta.generatedAt ?? 'unknown';
    } catch { /* ignore */ }
    return {
      privateKey,
      publicKey,
      publicKeyPem: arts.pem,
      publicKeyRawBase64: arts.rawBase64,
      fingerprint: arts.fingerprint,
      generatedAt,
      source: 'disk',
    };
  } catch {
    return null;
  }
}

function generateAndPersist(dir: string): ForgeKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const generatedAt = new Date().toISOString();
  try {
    const keysDir = path.join(dir, 'forge-keys');
    fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      path.join(keysDir, 'ed25519-private.pem'),
      privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
      { mode: 0o600 },
    );
    fs.writeFileSync(
      path.join(keysDir, 'ed25519-public.pem'),
      publicKey.export({ type: 'spki', format: 'pem' }) as string,
      { mode: 0o644 },
    );
    fs.writeFileSync(
      path.join(keysDir, 'metadata.json'),
      JSON.stringify({ generatedAt, algorithm: 'Ed25519', purpose: 'forge-capability-certificates' }, null, 2),
    );
  } catch {
    // disk write failed (read-only fs) — still return an in-memory keypair so
    // the server keeps running; the keypair just won't survive restart.
  }
  const arts = publicArtifacts(publicKey);
  return {
    privateKey,
    publicKey,
    publicKeyPem: arts.pem,
    publicKeyRawBase64: arts.rawBase64,
    fingerprint: arts.fingerprint,
    generatedAt,
    source: 'generated',
  };
}

export function loadForgeKeys(opts: { dataDir?: string; forceReload?: boolean } = {}): ForgeKeyPair {
  if (cached && !opts.forceReload) return cached;
  const dir = opts.dataDir || defaultDataDir();
  const fromEnv = loadFromEnv();
  if (fromEnv) {
    cached = fromEnv;
    return cached;
  }
  // In production we refuse to fall back to disk-loaded or freshly-generated
  // keys: the only acceptable signing key in production comes from the
  // FORGE_SIGNING_KEY_PEM environment variable / secret manager. Failing
  // closed here prevents accidental issuance of certificates signed by an
  // ephemeral or persisted-on-disk key in a real deployment.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FORGE signing key is not configured. Set FORGE_SIGNING_KEY_PEM (PKCS8 PEM, Ed25519) ' +
      'in the production secret store before starting the server.',
    );
  }
  cached = loadFromDisk(dir) || generateAndPersist(dir);
  return cached;
}

export function _clearForgeKeyCache(): void {
  cached = null;
}

export function signForgeBytes(bytes: Buffer | Uint8Array, keys: ForgeKeyPair): string {
  return cryptoSign(null, Buffer.from(bytes), keys.privateKey).toString('base64');
}

export function verifyForgeBytes(
  bytes: Buffer | Uint8Array,
  signatureBase64: string,
  publicKeyRawBase64: string,
): boolean {
  const raw = Buffer.from(publicKeyRawBase64, 'base64');
  if (raw.length !== 32) return false;
  const spkiPrefix = Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
  const der = Buffer.concat([spkiPrefix, raw]);
  const pubKey = createPublicKey({ key: der, format: 'der', type: 'spki' });
  return cryptoVerify(null, Buffer.from(bytes), pubKey, Buffer.from(signatureBase64, 'base64'));
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}
