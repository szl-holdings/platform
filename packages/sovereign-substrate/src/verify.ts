/**
 * Pure verification helpers — no platform dependencies. Safe to ship in the
 * `hf-sovereign` CLI so any third party can audit a packet without our
 * platform being online.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  type ProofPacket,
  ProofPacketSchema,
  packetSigningBytes,
} from './packet.js';

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  packet?: ProofPacket;
}

/**
 * A trusted public key pinned by the verifier. Verification MUST be done
 * against a key the verifier already trusts — never against the key embedded
 * in the packet alone, otherwise an attacker can self-sign forgeries.
 *
 * Use one of:
 *   - The key fetched from /api/sovereign/public-key over HTTPS at deploy time
 *   - A locally-bundled known-good key (CLI ships a default trust set)
 *   - An out-of-band published key (e.g. printed in a release artifact)
 */
export interface TrustedKey {
  publicKeyId: string;
  publicKeyHex: string;
}

export interface VerifyOptions {
  /** Pinned trusted keys. If empty, verification fails closed. */
  trustedKeys: ReadonlyArray<TrustedKey>;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error('invalid hex length');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function sha256Hex(data: Uint8Array): string {
  return bytesToHex(sha256(data));
}

/**
 * Verify a Proof Packet against the raw artifact bytes. Returns ok=true only
 * when (a) the packet parses, (b) the content hash matches the artifact, and
 * (c) the signature verifies against the embedded public key.
 *
 * Pure function — no I/O, no platform deps.
 */
export function verifyPacket(
  packet: unknown,
  artifactBytes: Uint8Array,
  options: VerifyOptions,
): VerifyResult {
  const parsed = ProofPacketSchema.safeParse(packet);
  if (!parsed.success) {
    return { ok: false, reason: `invalid packet shape: ${parsed.error.message}` };
  }
  const pkt = parsed.data;

  const expectedHash = `sha256:${sha256Hex(artifactBytes)}`;
  if (expectedHash !== pkt.artifact.contentHash) {
    return {
      ok: false,
      reason: `content hash mismatch: artifact=${expectedHash} packet=${pkt.artifact.contentHash}`,
      packet: pkt,
    };
  }

  if (!options.trustedKeys.length) {
    return {
      ok: false,
      reason: 'no trusted keys configured — verification fails closed',
      packet: pkt,
    };
  }
  const trusted = options.trustedKeys.find(
    (k) =>
      k.publicKeyId === pkt.signature.publicKeyId &&
      k.publicKeyHex.toLowerCase() === pkt.signature.publicKey.toLowerCase(),
  );
  if (!trusted) {
    return {
      ok: false,
      reason: `packet signer ${pkt.signature.publicKeyId} is not in the trusted key set`,
      packet: pkt,
    };
  }

  const { signature, ...body } = pkt;
  const message = packetSigningBytes(body);
  let signatureValid = false;
  try {
    signatureValid = ed25519.verify(
      hexToBytes(signature.signature),
      message,
      hexToBytes(trusted.publicKeyHex),
    );
  } catch (err) {
    return {
      ok: false,
      reason: `signature verify threw: ${(err as Error).message}`,
      packet: pkt,
    };
  }

  if (!signatureValid) {
    return { ok: false, reason: 'signature does not verify', packet: pkt };
  }

  return { ok: true, packet: pkt };
}

/**
 * Verify a packet against the SHA-256 hash of an artifact (without holding
 * the full bytes in memory). Useful for streaming verification.
 */
export function verifyPacketAgainstHash(
  packet: unknown,
  contentHashHex: string,
  options: VerifyOptions,
): VerifyResult {
  const parsed = ProofPacketSchema.safeParse(packet);
  if (!parsed.success) {
    return { ok: false, reason: `invalid packet shape: ${parsed.error.message}` };
  }
  const pkt = parsed.data;
  const expected = contentHashHex.startsWith('sha256:')
    ? contentHashHex
    : `sha256:${contentHashHex}`;
  if (expected !== pkt.artifact.contentHash) {
    return { ok: false, reason: 'content hash mismatch', packet: pkt };
  }
  if (!options.trustedKeys.length) {
    return { ok: false, reason: 'no trusted keys configured', packet: pkt };
  }
  const trusted = options.trustedKeys.find(
    (k) =>
      k.publicKeyId === pkt.signature.publicKeyId &&
      k.publicKeyHex.toLowerCase() === pkt.signature.publicKey.toLowerCase(),
  );
  if (!trusted) {
    return { ok: false, reason: 'untrusted signer', packet: pkt };
  }
  const { signature, ...body } = pkt;
  const message = packetSigningBytes(body);
  try {
    const valid = ed25519.verify(
      hexToBytes(signature.signature),
      message,
      hexToBytes(trusted.publicKeyHex),
    );
    return valid
      ? { ok: true, packet: pkt }
      : { ok: false, reason: 'signature does not verify', packet: pkt };
  } catch (err) {
    return { ok: false, reason: (err as Error).message, packet: pkt };
  }
}

export { hexToBytes, bytesToHex };
