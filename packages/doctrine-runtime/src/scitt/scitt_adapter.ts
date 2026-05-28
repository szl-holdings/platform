/**
 * scitt_adapter.ts — SCITT-Rekor Adapter (R2)
 * Constructs IETF SCITT Signed Statement envelopes and submits them to Rekor.
 *
 * References
 * ----------
 * [1] IETF draft-ietf-scitt-architecture-07 (2024), §4 Signed Statement,
 *     §5 Receipt, https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/
 * [2] Rekor API v1: https://www.sigstore.dev/docs/rekor/api/
 * [3] RFC 8949 — Concise Binary Object Representation (CBOR)
 * [4] RFC 9052 — COSE: CBOR Object Signing and Encryption
 * [5] Doctrine v6 §6.1 "SCITT-binding" constraint
 */

import { createHash, createHmac } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// COSE / SCITT types (subset of draft-ietf-scitt-architecture-07 [1])
// ─────────────────────────────────────────────────────────────────────────────

/** COSE header parameters (RFC 9052 §3.1 [4]) */
export interface CoseProtectedHeader {
  /** Algorithm: -7 = ES256, -8 = EdDSA */
  alg: -7 | -8;
  /** Content type: "application/szl.policy+json" */
  content_type: string;
  /** Issuer DID or URI */
  iss: string;
  /** Subject (policy id) */
  sub: string;
  /** Issued-at (Unix seconds) */
  iat: number;
}

/** Minimal SCITT Signed Statement (COSE_Sign1) [1] §4 */
export interface ScittSignedStatement {
  protectedHeader: CoseProtectedHeader;
  unprotectedHeader: Record<string, unknown>;
  /** The Doctrine v6 policy payload (JSON-encoded) */
  payload: Buffer;
  /** ECDSA / EdDSA signature bytes (DER for ES256, raw 64B for EdDSA) */
  signature: Buffer;
}

/** SCITT Receipt returned from the transparency service [1] §5 */
export interface ScittReceipt {
  /** SHA-256 of the submitted COSE_Sign1 structure */
  statementHash: string;
  /** Rekor log ID */
  logId: string;
  /** Rekor entry index */
  logIndex: number;
  /** Inclusion proof (SHA-256 Merkle hashes, base64) */
  inclusionProof: string[];
  /** Signed timestamp from Rekor */
  integratedTime: number;
}

/** Config for the adapter */
export interface ScittAdapterConfig {
  rekorBaseUrl: string;      // e.g. "https://rekor.sigstore.dev"
  issuerDid: string;         // e.g. "did:web:policy.szl.io"
  defaultAlg: -7 | -8;
  /** Timeout for Rekor HTTP calls in ms */
  timeoutMs: number;
  /** If true, use a stub (no real HTTP) for testing */
  dryRun?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CBOR-lite encoder (RFC 8949 §3 [3])
// Implements only the subset needed: map, text, bytes, integer, array.
// ─────────────────────────────────────────────────────────────────────────────

function encodeUnsignedInt(n: number): Buffer {
  if (n < 24) return Buffer.from([n]);
  if (n < 0x100) return Buffer.from([0x18, n]);
  if (n < 0x10000) return Buffer.from([0x19, (n >> 8) & 0xff, n & 0xff]);
  return Buffer.from([0x1a, (n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
}

function encodeMajor(major: number, n: number): Buffer {
  const base = encodeUnsignedInt(n);
  base[0] |= major << 5;
  return base;
}

function cborText(s: string): Buffer {
  const bytes = Buffer.from(s, "utf8");
  return Buffer.concat([encodeMajor(3, bytes.length), bytes]);
}

function cborBytes(b: Buffer): Buffer {
  return Buffer.concat([encodeMajor(2, b.length), b]);
}

function cborInt(n: number): Buffer {
  if (n >= 0) return encodeMajor(0, n);
  return encodeMajor(1, -1 - n);
}

function cborArray(items: Buffer[]): Buffer {
  const header = encodeMajor(4, items.length);
  return Buffer.concat([header, ...items]);
}

function cborMap(pairs: Array<[Buffer, Buffer]>): Buffer {
  const header = encodeMajor(5, pairs.length);
  const flatPairs = pairs.flatMap(([k, v]) => [k, v]);
  return Buffer.concat([header, ...flatPairs]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCITT envelope construction (draft-ietf-scitt-architecture-07 §4 [1])
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs the COSE_Sign1 protected header as a CBOR-encoded map.
 * Header parameter labels per RFC 9052 §3.1 [4]:
 *   1 = alg, 3 = content_type, custom TBD labels for iss/sub/iat.
 */
function buildProtectedHeaderCbor(h: CoseProtectedHeader): Buffer {
  return cborMap([
    [cborInt(1), cborInt(h.alg)],                          // alg
    [cborInt(3), cborText(h.content_type)],                 // content_type
    [cborText("iss"), cborText(h.iss)],                     // issuer
    [cborText("sub"), cborText(h.sub)],                     // subject
    [cborText("iat"), cborInt(h.iat)],                      // issued-at
  ]);
}

/**
 * Builds the Sig_Structure for COSE_Sign1 (RFC 9052 §4.4 [4]).
 * Sig_Structure = ["Signature1", protected, external_aad, payload]
 */
function buildSigStructure(
  protectedHeaderCbor: Buffer,
  payload: Buffer,
  externalAad: Buffer = Buffer.alloc(0)
): Buffer {
  return cborArray([
    cborText("Signature1"),
    cborBytes(protectedHeaderCbor),
    cborBytes(externalAad),
    cborBytes(payload),
  ]);
}

/**
 * Produces a deterministic HMAC-SHA256 "signature" for dry-run / testing.
 * NOT cryptographically valid — replace with real ECDSA/EdDSA in production.
 */
function stubSign(sigStructure: Buffer, key: string): Buffer {
  return createHmac("sha256", key).update(sigStructure).digest();
}

// ─────────────────────────────────────────────────────────────────────────────
// Rekor submission helpers (Rekor API v1 [2])
// ─────────────────────────────────────────────────────────────────────────────

interface RekorEntry {
  kind: "hashedrekord";
  apiVersion: "0.0.1";
  spec: {
    signature: { content: string; publicKey: { content: string } };
    data: { hash: { algorithm: "sha256"; value: string } };
  };
}

function buildRekorEntry(signedStatementBytes: Buffer, pubKeyPem: string): RekorEntry {
  const hash = createHash("sha256").update(signedStatementBytes).digest("hex");
  return {
    kind: "hashedrekord",
    apiVersion: "0.0.1",
    spec: {
      signature: {
        content: signedStatementBytes.slice(0, 64).toString("base64"), // stub
        publicKey: { content: Buffer.from(pubKeyPem).toString("base64") },
      },
      data: { hash: { algorithm: "sha256", value: hash } },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ScittAdapter — main class
// ─────────────────────────────────────────────────────────────────────────────

export class ScittAdapter {
  constructor(private readonly cfg: ScittAdapterConfig) {}

  /**
   * Builds a SCITT Signed Statement for a Doctrine v6 policy payload.
   * In production: provide a real signing key; replace stubSign with ECDSA.
   */
  buildSignedStatement(
    policyJson: string,
    subject: string,
    signingKeyOrSeed: string = "test-seed"
  ): { envelope: ScittSignedStatement; envelopeBytes: Buffer } {
    const payload = Buffer.from(policyJson, "utf8");
    const iat = Math.floor(Date.now() / 1000);

    const header: CoseProtectedHeader = {
      alg: this.cfg.defaultAlg,
      content_type: "application/szl.policy+json",
      iss: this.cfg.issuerDid,
      sub: subject,
      iat,
    };

    const protectedCbor = buildProtectedHeaderCbor(header);
    const sigStructure = buildSigStructure(protectedCbor, payload);
    const signature = stubSign(sigStructure, signingKeyOrSeed);

    // COSE_Sign1 = [protected, unprotected, payload, signature]
    const envelopeBytes = cborArray([
      cborBytes(protectedCbor),
      cborMap([]),                    // empty unprotected header
      cborBytes(payload),
      cborBytes(signature),
    ]);

    const envelope: ScittSignedStatement = {
      protectedHeader: header,
      unprotectedHeader: {},
      payload,
      signature,
    };

    return { envelope, envelopeBytes };
  }

  /**
   * Submits a SCITT Signed Statement to Rekor and returns a SCITT Receipt.
   * In dry-run mode, returns a synthetic receipt without real HTTP.
   */
  async submitToRekor(
    envelopeBytes: Buffer,
    pubKeyPem: string = "-----BEGIN PUBLIC KEY-----\nSTUB\n-----END PUBLIC KEY-----"
  ): Promise<ScittReceipt> {
    const statementHash = createHash("sha256").update(envelopeBytes).digest("hex");

    if (this.cfg.dryRun) {
      return {
        statementHash,
        logId: "dry-run-log-id",
        logIndex: 0,
        inclusionProof: [
          createHash("sha256").update("sibling-0").digest("hex"),
          createHash("sha256").update("sibling-1").digest("hex"),
        ],
        integratedTime: Math.floor(Date.now() / 1000),
      };
    }

    // Production path: real Rekor v1 API call
    const entry = buildRekorEntry(envelopeBytes, pubKeyPem);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    let resp: Response;
    try {
      resp = await fetch(`${this.cfg.rekorBaseUrl}/api/v1/log/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      throw new Error(`Rekor submission failed: ${resp.status} ${resp.statusText}`);
    }

    const body = await resp.json() as Record<string, unknown>;
    const [uuid, logEntry] = Object.entries(body)[0] as [string, Record<string, unknown>];
    const verification = logEntry["verification"] as Record<string, unknown>;
    const inclusionProof = (verification?.["inclusionProof"] as Record<string, unknown>)?.["hashes"] as string[] ?? [];

    return {
      statementHash,
      logId: logEntry["logID"] as string ?? uuid,
      logIndex: Number(logEntry["logIndex"] ?? 0),
      inclusionProof,
      integratedTime: Number(logEntry["integratedTime"] ?? 0),
    };
  }

  /**
   * End-to-end: build + submit in one call.
   */
  async notarise(
    policyJson: string,
    subject: string,
    signingKeyOrSeed?: string,
    pubKeyPem?: string
  ): Promise<{ receipt: ScittReceipt; envelopeBytes: Buffer }> {
    const { envelopeBytes } = this.buildSignedStatement(policyJson, subject, signingKeyOrSeed);
    const receipt = await this.submitToRekor(envelopeBytes, pubKeyPem);
    return { receipt, envelopeBytes };
  }
}
