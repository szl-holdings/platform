/**
 * Server-side signing — depends on `node:crypto` for secure key handling.
 * The keypair is loaded from platform secrets at runtime; never persisted
 * to disk by this module.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  type ProofPacket,
  type ProofPacketBody,
  type Signature,
  packetSigningBytes,
} from './packet.js';
import { bytesToHex, hexToBytes, sha256Hex } from './verify.js';

export interface SigningIdentity {
  publicKeyId: string;
  publicKeyHex: string;
  privateKeyHex: string;
}

/**
 * Load the signing identity from environment variables. The private key is
 * a 32-byte Ed25519 seed encoded as hex; the public key is derived from it.
 *
 * Env:
 *   SOVEREIGN_SIGNING_KEY_ID   — opaque key id (e.g. "sovereign-2026-05")
 *   SOVEREIGN_SIGNING_KEY_HEX  — 32-byte Ed25519 seed in hex
 */
export function loadSigningIdentity(env: NodeJS.ProcessEnv = process.env): SigningIdentity | null {
  const keyId = env.SOVEREIGN_SIGNING_KEY_ID;
  const keyHex = env.SOVEREIGN_SIGNING_KEY_HEX;
  if (!keyId || !keyHex) return null;
  const seed = hexToBytes(keyHex);
  if (seed.length !== 32) {
    throw new Error('SOVEREIGN_SIGNING_KEY_HEX must decode to 32 bytes');
  }
  const publicKey = ed25519.getPublicKey(seed);
  return {
    publicKeyId: keyId,
    publicKeyHex: bytesToHex(publicKey),
    privateKeyHex: keyHex,
  };
}

/**
 * Generate a fresh Ed25519 keypair. Returned hex strings are safe to store
 * in platform secrets. Never log the private key.
 */
export function generateSigningIdentity(keyId: string): SigningIdentity {
  const seed = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(seed);
  return {
    publicKeyId: keyId,
    publicKeyHex: bytesToHex(publicKey),
    privateKeyHex: bytesToHex(seed),
  };
}

/**
 * Sign a Proof Packet body. Caller is responsible for ensuring the body
 * matches the artifact bytes (use `computeContentHash` for the content hash).
 */
export function signPacket(body: ProofPacketBody, identity: SigningIdentity): ProofPacket {
  const message = packetSigningBytes(body);
  const signatureBytes = ed25519.sign(message, hexToBytes(identity.privateKeyHex));
  const signature: Signature = {
    algorithm: 'ed25519',
    publicKeyId: identity.publicKeyId,
    publicKey: identity.publicKeyHex,
    signature: bytesToHex(signatureBytes),
    signedAt: new Date().toISOString(),
  };
  return { ...body, signature };
}

export function computeContentHash(artifactBytes: Uint8Array): string {
  return `sha256:${sha256Hex(artifactBytes)}`;
}

export function computePacketHash(packet: ProofPacket): string {
  const canonical = packetSigningBytes(packet);
  return `sha256:${bytesToHex(sha256(canonical))}`;
}
