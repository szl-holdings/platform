/**
 * SZL Ising receipt classes (`ising.*.v1`).
 *
 * Re-expression of patterns from NVIDIA Ising — the pre-decoder
 * architecture from Chamberland, Olle, Li, Thornton & Baratta
 * (arXiv:2604.12841, Apr 14 2026) and the calibration-agent loop
 * encoded in NVIDIA/Quantum-Calibration-Agent-Blueprint by
 * @ShuxiangCao et al.
 *
 * No upstream code or model weights are vendored. These are typed
 * envelopes only.
 */

import { createHash } from "node:crypto";

// ─── canonical-json (sorted keys, throws on NaN/Infinity) ────────────────

/**
 * Stable, deterministic JSON serialization. Object keys are emitted in
 * lexicographic order at every depth so two semantically-equal payloads
 * always produce the same byte string (and therefore the same hash).
 *
 * Throws on NaN or +/-Infinity — non-finite numbers have no canonical
 * JSON encoding and silently allowing them would let two different
 * payloads share a hash.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(
        `canonicalJson: refusing to encode non-finite number ${value}`,
      );
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const parts = keys.map(
      (k) =>
        JSON.stringify(k) +
        ":" +
        canonicalJson((value as Record<string, unknown>)[k]),
    );
    return "{" + parts.join(",") + "}";
  }
  throw new Error(`canonicalJson: unsupported type ${typeof value}`);
}

// ─── content-addressed refs ──────────────────────────────────────────────

export type IsingReceiptClass =
  | "ising.predecode.input.v1"
  | "ising.predecode.local.v1"
  | "ising.predecode.residual.v1"
  | "ising.global.decoded.v1"
  | "ising.escalation.required.v1"
  | "ising.calibration.experiment.v1"
  | "ising.calibration.measurement.v1"
  | "ising.calibration.drift.v1"
  | "ising.calibration.correction.v1"
  | "ising.calibration.rollback.v1"
  | "ising.noise.learned.v1"
  | "ising.noise.declared.v1"
  | "ising.noise.divergence.v1";

export const ISING_RECEIPT_CLASSES: ReadonlyArray<IsingReceiptClass> = [
  "ising.predecode.input.v1",
  "ising.predecode.local.v1",
  "ising.predecode.residual.v1",
  "ising.global.decoded.v1",
  "ising.escalation.required.v1",
  "ising.calibration.experiment.v1",
  "ising.calibration.measurement.v1",
  "ising.calibration.drift.v1",
  "ising.calibration.correction.v1",
  "ising.calibration.rollback.v1",
  "ising.noise.learned.v1",
  "ising.noise.declared.v1",
  "ising.noise.divergence.v1",
];

/** A content-addressed receipt reference, of form `<class>:<digest16>`. */
export type IsingReceiptRef = `${IsingReceiptClass}:${string}`;

/** Length-16 hex prefix of sha256(canonicalJson(body)). */
export function digestBody(body: unknown): string {
  const json = canonicalJson(body);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

/** Construct a content-addressed ref. The digest is computed, never trusted. */
export function makeRef<C extends IsingReceiptClass>(
  cls: C,
  body: unknown,
): `${C}:${string}` {
  return `${cls}:${digestBody(body)}` as `${C}:${string}`;
}

/** Verify a ref matches the body it claims to address. */
export function verifyRef(ref: IsingReceiptRef, body: unknown): boolean {
  const idx = ref.lastIndexOf(":");
  if (idx <= 0) return false;
  const claimedDigest = ref.slice(idx + 1);
  return claimedDigest === digestBody(body);
}

/** Parse a ref into its class + digest, throwing on malformed input. */
export function parseRef(ref: string): {
  cls: IsingReceiptClass;
  digest: string;
} {
  const idx = ref.lastIndexOf(":");
  if (idx <= 0) throw new Error(`parseRef: malformed ref ${ref}`);
  const cls = ref.slice(0, idx) as IsingReceiptClass;
  const digest = ref.slice(idx + 1);
  if (!ISING_RECEIPT_CLASSES.includes(cls)) {
    throw new Error(`parseRef: unknown class ${cls}`);
  }
  if (!/^[0-9a-f]{16}$/.test(digest)) {
    throw new Error(`parseRef: digest must be 16 hex chars, got ${digest}`);
  }
  return { cls, digest };
}
