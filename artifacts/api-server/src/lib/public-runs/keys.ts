/**
 * Ed25519 key management for the public proof-surface.
 *
 * Key resolution order (highest priority first):
 *   1. SZL_ATTESTATION_PRIVATE_KEY_PEM env var (PKCS8 PEM) — production path.
 *   2. <DATA_DIR>/keys/ed25519-private.pem on disk — dev/persistent path.
 *   3. Generate a fresh keypair and persist to (2). First-boot path.
 *
 * The PUBLIC half is ALWAYS published via /.well-known/szl-attestation-keys.json.
 * The PRIVATE half NEVER touches the response body, the repo, or the logs.
 *
 * Key fingerprint = first 16 hex chars of sha256(public_key_raw_bytes).
 * Algorithm tag in the .well-known: "Ed25519" (RFC 8032).
 */

import {
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  createHash,
  type KeyObject,
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface AttestationKeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicKeyPem: string;
  publicKeyRawBase64: string;
  fingerprint: string;
  generatedAt: string;
  source: "env" | "disk" | "generated";
}

let cachedKeys: AttestationKeyPair | null = null;

function defaultDataDir(): string {
  return (
    process.env.SZL_PUBLIC_RUNS_DIR ||
    path.resolve(process.cwd(), "..", "..", ".szl-public-runs")
  );
}

function publicKeyArtifacts(publicKey: KeyObject): {
  pem: string;
  rawBase64: string;
  fingerprint: string;
} {
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  // Extract raw 32-byte Ed25519 key from SPKI DER (last 32 bytes).
  const der = publicKey.export({ type: "spki", format: "der" });
  const raw = der.subarray(der.length - 32);
  const rawBase64 = raw.toString("base64");
  const fingerprint = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return { pem, rawBase64, fingerprint };
}

function loadFromEnv(): AttestationKeyPair | null {
  const pem = process.env.SZL_ATTESTATION_PRIVATE_KEY_PEM;
  if (!pem) return null;
  try {
    const privateKey = createPrivateKey(pem);
    const publicKey = createPublicKey(privateKey);
    const arts = publicKeyArtifacts(publicKey);
    return {
      privateKey,
      publicKey,
      publicKeyPem: arts.pem,
      publicKeyRawBase64: arts.rawBase64,
      fingerprint: arts.fingerprint,
      generatedAt: process.env.SZL_ATTESTATION_KEY_GENERATED_AT || "unknown",
      source: "env",
    };
  } catch (err) {
    throw new Error(`SZL_ATTESTATION_PRIVATE_KEY_PEM is set but invalid: ${(err as Error).message}`);
  }
}

function loadFromDisk(dataDir: string): AttestationKeyPair | null {
  const privPath = path.join(dataDir, "keys", "ed25519-private.pem");
  const metaPath = path.join(dataDir, "keys", "metadata.json");
  if (!fs.existsSync(privPath)) return null;
  const pem = fs.readFileSync(privPath, "utf8");
  const privateKey = createPrivateKey(pem);
  const publicKey = createPublicKey(privateKey);
  const arts = publicKeyArtifacts(publicKey);
  let generatedAt = "unknown";
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as { generatedAt?: string };
    generatedAt = meta.generatedAt ?? "unknown";
  } catch { /* ignore */ }
  return {
    privateKey,
    publicKey,
    publicKeyPem: arts.pem,
    publicKeyRawBase64: arts.rawBase64,
    fingerprint: arts.fingerprint,
    generatedAt,
    source: "disk",
  };
}

function generateAndPersist(dataDir: string): AttestationKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const generatedAt = new Date().toISOString();

  const keysDir = path.join(dataDir, "keys");
  fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });

  const privPath = path.join(keysDir, "ed25519-private.pem");
  const pubPath = path.join(keysDir, "ed25519-public.pem");
  const metaPath = path.join(keysDir, "metadata.json");

  fs.writeFileSync(
    privPath,
    privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    { mode: 0o600 },
  );
  fs.writeFileSync(
    pubPath,
    publicKey.export({ type: "spki", format: "pem" }) as string,
    { mode: 0o644 },
  );
  fs.writeFileSync(metaPath, JSON.stringify({ generatedAt, algorithm: "Ed25519" }, null, 2));

  const arts = publicKeyArtifacts(publicKey);
  return {
    privateKey,
    publicKey,
    publicKeyPem: arts.pem,
    publicKeyRawBase64: arts.rawBase64,
    fingerprint: arts.fingerprint,
    generatedAt,
    source: "generated",
  };
}

/**
 * Load (and cache) the attestation keypair.
 * Idempotent: subsequent calls return the same object.
 */
export function loadAttestationKeys(opts: { dataDir?: string; forceReload?: boolean } = {}): AttestationKeyPair {
  if (cachedKeys && !opts.forceReload) return cachedKeys;
  const dataDir = opts.dataDir || defaultDataDir();
  cachedKeys = loadFromEnv() || loadFromDisk(dataDir) || generateAndPersist(dataDir);
  return cachedKeys;
}

/** Test-only: clear the cached keypair. */
export function _clearKeyCache(): void {
  cachedKeys = null;
}

/** Sign a canonical JSON byte string with the private key. Returns base64. */
export function signBytes(bytes: Buffer | Uint8Array, keys: AttestationKeyPair): string {
  // Ed25519 in Node: pass null for algorithm (per Node docs).
  const sig = cryptoSign(null, Buffer.from(bytes), keys.privateKey);
  return sig.toString("base64");
}

/** Verify an Ed25519 signature against a public key (base64 raw 32 bytes). */
export function verifyBytes(
  bytes: Buffer | Uint8Array,
  signatureBase64: string,
  publicKeyRawBase64: string,
): boolean {
  const raw = Buffer.from(publicKeyRawBase64, "base64");
  if (raw.length !== 32) return false;
  // Reconstruct an SPKI-formatted Ed25519 public key from the raw 32 bytes.
  // The standard SPKI Ed25519 prefix is: 30 2a 30 05 06 03 2b 65 70 03 21 00
  const spkiPrefix = Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
  const der = Buffer.concat([spkiPrefix, raw]);
  const pubKey = createPublicKey({ key: der, format: "der", type: "spki" });
  return cryptoVerify(null, Buffer.from(bytes), pubKey, Buffer.from(signatureBase64, "base64"));
}
