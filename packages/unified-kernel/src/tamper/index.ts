/**
 * tamper/ — T18 Tamper-evidence: Ed25519 sign/verify + SHA-256 hash chain.
 *
 * Backing (REAL): mirrors the a11oy receipt hash chain and the MCP
 * verify_receipt tool; formal layer is Lutar/Thesis/TH_V18_14_SHA256Collision
 * Honest.lean (th_v18_14a/c, proven *given* axiom sha256_collision_resistant /
 * A15) and Lutar/TwoWitness.lean (dual-witness, proven).
 *
 * Real cryptography via node:crypto. No mocks. SHA-256 is real; Ed25519 keypair
 * is generated at boot and signatures are real Ed25519 over the body hash.
 *
 * Honest gap: SHA-256 collision-resistance is an axiom (A15, OPEN PROBLEM) in
 * Lean — cannot be discharged without resolving P≠NP-class hardness. The code
 * relies on the standard NIST FIPS 180-4 assumption, honestly labelled.
 */

import { createHash, generateKeyPairSync, sign as edSign, verify as edVerify, type KeyObject } from "node:crypto";

/** Real SHA-256 hex digest over a UTF-8 string. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Stable canonical JSON (sorted keys, NFC-normalized strings) then SHA-256. */
export function hashJson(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function canonicalValue(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === "string") return value.normalize("NFC");
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("canonicalJson: non-finite number");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const child = obj[key];
      if (child === undefined || typeof child === "function" || typeof child === "symbol") continue;
      sorted[key.normalize("NFC")] = canonicalValue(child);
    }
    return sorted;
  }
  throw new Error("canonicalJson: unsupported value");
}

export interface KeyPair {
  readonly privateKey: KeyObject;
  readonly publicKeyHex: string;
}

/** Generate a real Ed25519 keypair. */
export function generateSigningKey(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const raw = publicKey.export({ type: "spki", format: "der" });
  return { privateKey, publicKeyHex: Buffer.from(raw).toString("hex") };
}

/** Real Ed25519 signature (hex) over the message bytes. */
export function sign(message: string, key: KeyPair): string {
  const sig = edSign(null, Buffer.from(message, "utf8"), key.privateKey);
  return sig.toString("hex");
}

/** Real Ed25519 verification against a hex public key (SPKI DER). */
export function verifySignature(message: string, signatureHex: string, publicKeyHex: string): boolean {
  try {
    const pub = {
      key: Buffer.from(publicKeyHex, "hex"),
      format: "der" as const,
      type: "spki" as const,
    };
    return edVerify(null, Buffer.from(message, "utf8"), pub, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

/** A single link in a SHA-256 hash chain. */
export interface ChainLink {
  readonly index: number;
  readonly bodyHash: string;
  readonly prevHash: string | null;
  /** Link hash = SHA-256(prevHash || bodyHash). */
  readonly linkHash: string;
}

/** Append a body to a hash chain, producing the new link. */
export function chainAppend(prev: ChainLink | null, body: unknown): ChainLink {
  const bodyHash = hashJson(body);
  const prevHash = prev ? prev.linkHash : null;
  const linkHash = sha256Hex(`${prevHash ?? ""}|${bodyHash}`);
  return { index: prev ? prev.index + 1 : 0, bodyHash, prevHash, linkHash };
}

/** Verify a full chain's prev-hash linkage. Real recomputation, no shortcut. */
export function verifyChain(links: readonly ChainLink[]): { valid: boolean; brokenAt: number | null } {
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    const expectedPrev = i === 0 ? null : links[i - 1].linkHash;
    if (link.prevHash !== expectedPrev) return { valid: false, brokenAt: i };
    const recomputed = sha256Hex(`${link.prevHash ?? ""}|${link.bodyHash}`);
    if (recomputed !== link.linkHash) return { valid: false, brokenAt: i };
  }
  return { valid: true, brokenAt: null };
}
