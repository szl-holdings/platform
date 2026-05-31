/**
 * mesh/ — T13 Mesh / wires / Kallpa: W3C traceparent propagation.
 *
 * Backing (PARTIAL — infrastructure, not a theorem): mirrors vsp-otel /
 * uds-mesh OTel + W3C TraceContext plumbing. Honest framing per the census:
 * this is integration plumbing, NOT a moat-stone theorem. The traceparent
 * parsing/formatting below follows the W3C Trace Context spec exactly. Real
 * string parsing, no mocks.
 */

import { randomBytes } from "node:crypto";

export interface TraceParent {
  readonly version: string; // 2 hex (e.g. "00")
  readonly traceId: string; // 32 hex
  readonly parentId: string; // 16 hex (span id)
  readonly flags: string; // 2 hex
}

const TP_RE = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/** Parse a W3C traceparent header. Returns null on malformed input. */
export function parseTraceparent(header: string): TraceParent | null {
  const m = TP_RE.exec(header.trim());
  if (!m) return null;
  // Per spec: all-zero trace-id / parent-id are invalid.
  if (m[2] === "0".repeat(32) || m[3] === "0".repeat(16)) return null;
  return { version: m[1], traceId: m[2], parentId: m[3], flags: m[4] };
}

/** Format a TraceParent back to the W3C header string. */
export function formatTraceparent(tp: TraceParent): string {
  return `${tp.version}-${tp.traceId}-${tp.parentId}-${tp.flags}`;
}

/** Start a new root trace with a real random 16-byte trace id + 8-byte span id. */
export function newTrace(sampled = true): TraceParent {
  return {
    version: "00",
    traceId: randomBytes(16).toString("hex"),
    parentId: randomBytes(8).toString("hex"),
    flags: sampled ? "01" : "00",
  };
}

/**
 * propagate — create a child span under a parent traceparent: same trace id,
 * new span id. This is the real W3C propagation rule.
 */
export function propagate(parent: TraceParent): TraceParent {
  return { ...parent, parentId: randomBytes(8).toString("hex") };
}
