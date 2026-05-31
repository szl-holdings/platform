// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
// ORCID: 0009-0001-0110-4173
//
// spans.ts — an in-memory span recorder for the nervous-system wire (Wire E).
//
// The mesh's cross-app calls each carry a W3C `traceparent` (see index.ts).
// This module is the verification side of that wire: a zero-dependency
// in-memory recorder that captures spans and reconstructs the parent→child
// tree from the propagated traceparents. It is OTel-shaped (the field names
// match the OpenTelemetry data model: traceId, spanId, parentSpanId) so a real
// OTel exporter can drop in later without changing the contract, but it carries
// no OTel runtime dependency — the package stays installable everywhere.
//
// The recorder lets a test assert, without any network, that a request entering
// at rosie and fanning out to a11oy → {sentra immune, amaru brain} produces a
// single trace whose spans form a correct parent→child tree.

import { childTraceparent, isValidTraceparent, traceIdOf } from "./index.ts";

/** Parse a traceparent into its trace-id and span-id, or null if malformed. */
export function parseTraceparent(
  traceparent: string,
): { traceId: string; spanId: string } | null {
  if (!isValidTraceparent(traceparent)) return null;
  return { traceId: traceparent.slice(3, 35), spanId: traceparent.slice(36, 52) };
}

/** A recorded span, shaped like the OpenTelemetry span data model. */
export interface RecordedSpan {
  readonly name: string;
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | null;
  /** The exact traceparent header this span advertised to its children. */
  readonly traceparent: string;
}

/**
 * An in-memory span recorder. Each `start` derives a child traceparent from the
 * parent (same trace-id, fresh span-id) — exactly what the mesh servers do when
 * they forward `traceparent` on a cross-app call — and records the resulting
 * span. A root span (no parent) gets the supplied traceparent as-is.
 */
export class SpanRecorder {
  readonly #spans: RecordedSpan[] = [];

  /** Record a root span carrying an already-minted traceparent. */
  startRoot(name: string, traceparent: string): RecordedSpan {
    const parsed = parseTraceparent(traceparent);
    if (!parsed) throw new Error(`SpanRecorder: invalid root traceparent ${traceparent}`);
    const span: RecordedSpan = {
      name,
      traceId: parsed.traceId,
      spanId: parsed.spanId,
      parentSpanId: null,
      traceparent,
    };
    this.#spans.push(span);
    return span;
  }

  /**
   * Record a child span of `parent`. The child keeps the parent's trace-id and
   * receives a fresh span-id, mirroring `childTraceparent` propagation.
   */
  startChild(name: string, parent: RecordedSpan): RecordedSpan {
    const childTp = childTraceparent(parent.traceparent);
    const parsed = parseTraceparent(childTp)!;
    const span: RecordedSpan = {
      name,
      traceId: parsed.traceId,
      spanId: parsed.spanId,
      parentSpanId: parent.spanId,
      traceparent: childTp,
    };
    this.#spans.push(span);
    return span;
  }

  /** All recorded spans, in start order. */
  spans(): readonly RecordedSpan[] {
    return [...this.#spans];
  }

  /** Distinct trace-ids seen. A correctly propagated request has exactly one. */
  traceIds(): readonly string[] {
    return [...new Set(this.#spans.map((s) => s.traceId))];
  }

  /** The direct children of a span. */
  childrenOf(span: RecordedSpan): readonly RecordedSpan[] {
    return this.#spans.filter((s) => s.parentSpanId === span.spanId);
  }

  /**
   * Validate the recorded set forms one well-formed trace tree:
   *  - every span's traceparent is valid and its trace-id matches the tree,
   *  - span-ids are unique,
   *  - every non-root parentSpanId resolves to a recorded span,
   *  - exactly one root (parentSpanId === null).
   * Returns the list of problems (empty === valid).
   */
  validate(): string[] {
    const problems: string[] = [];
    const ids = new Set<string>();
    const roots = this.#spans.filter((s) => s.parentSpanId === null);
    if (roots.length !== 1) problems.push(`expected exactly one root span, found ${roots.length}`);
    const traceIds = this.traceIds();
    if (traceIds.length > 1) problems.push(`spans span multiple traces: ${traceIds.join(", ")}`);
    for (const s of this.#spans) {
      if (traceIdOf(s.traceparent) !== s.traceId) {
        problems.push(`${s.name}: traceparent trace-id does not match span trace-id`);
      }
      if (ids.has(s.spanId)) problems.push(`${s.name}: duplicate span-id ${s.spanId}`);
      ids.add(s.spanId);
    }
    for (const s of this.#spans) {
      if (s.parentSpanId !== null && !this.#spans.some((p) => p.spanId === s.parentSpanId)) {
        problems.push(`${s.name}: parentSpanId ${s.parentSpanId} resolves to no recorded span`);
      }
    }
    return problems;
  }
}
