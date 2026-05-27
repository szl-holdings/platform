/**
 * Warhacker receipt-chain primitives — extracted from
 * `routes/warhacker.ts` (#5571).
 *
 * All five Warhacker lanes share these helpers to emit hash-chained
 * Doctrine V6 receipts. Co-locating them with one lane meant any drift
 * (canonical-JSON ordering, prevHash linkage, emittedAt determinism)
 * silently broke every lane at once — #5567 caught that fragility once,
 * this module defends the invariant from a single place going forward.
 *
 * Invariants this module guarantees:
 *   - `canonicalJson` produces stable, key-sorted JSON for any
 *     JSON-serializable value, including nested arrays and objects.
 *   - `chain` is deterministic in its inputs: same `entries` + `traceId`
 *     ⇒ same `payloadSha256`, `prevHash`, `entryHash`, and `emittedAt`.
 *   - `emittedAt` is derived from a fixed epoch + entry index, never
 *     wall-clock, so receipt samples in proposals/docs stay reproducible.
 *   - `prevHash` of entry 0 is GENESIS (64 hex zeros); each subsequent
 *     entry's `prevHash` is the previous entry's `entryHash`.
 *   - `laneEnvelope.head` equals the last entry's `entryHash`, or
 *     GENESIS when the chain is empty.
 *   - `traceFor` is content-addressed off the canonical input body, so
 *     identical request bodies yield identical trace ids.
 */
import { createHash } from 'node:crypto';

export interface Receipt {
  readonly index: number;
  readonly receiptClass: string;
  readonly subject: string;
  readonly summary: string;
  readonly payloadSha256: string;
  readonly prevHash: string;
  readonly entryHash: string;
  readonly emittedAt: string;
  readonly pillar: string;
}

export interface ReceiptInput {
  receiptClass: string;
  subject: string;
  summary: string;
  pillar: string;
  payload: unknown;
}

export interface LaneEnvelope {
  lane: string;
  traceId: string;
  chain: Receipt[];
  head: string;
  chainLength: number;
}

export const GENESIS = '0'.repeat(64);

/** Fixed epoch the chain derives `emittedAt` from. Kept in module scope
 *  so the same input body always yields the same timestamps across
 *  server restarts and test runs. */
const CHAIN_BASE_EPOCH_MS = Date.parse('2026-05-27T00:00:00Z');

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Canonical JSON serialization with deterministic key ordering.
 *
 * Object keys are sorted lexicographically at every depth; arrays
 * preserve order (their order *is* their content). Primitives are
 * emitted via `JSON.stringify`. This is intentionally minimal — it
 * matches the subset of JSON the lane payloads produce — and is what
 * `payloadSha256` is computed against.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

/**
 * Build a hash-chained receipt array.
 *
 * Each entry's `entryHash` is sha256 over a delimited tuple of
 * (traceId, index, receiptClass, subject, payloadSha256, prevHash,
 * emittedAt). The first entry chains from GENESIS; every subsequent
 * entry chains from the prior entry's `entryHash`.
 */
export function chain(entries: ReceiptInput[], traceId: string): Receipt[] {
  const out: Receipt[] = [];
  let prev = GENESIS;
  entries.forEach((e, i) => {
    const payloadSha256 = sha256(canonicalJson(e.payload));
    const emittedAt = new Date(CHAIN_BASE_EPOCH_MS + i * 1000).toISOString();
    const entryHash = sha256(
      [traceId, String(i), e.receiptClass, e.subject, payloadSha256, prev, emittedAt].join('|'),
    );
    out.push({
      index: i,
      receiptClass: e.receiptClass,
      subject: e.subject,
      summary: e.summary,
      payloadSha256,
      prevHash: prev,
      entryHash,
      emittedAt,
      pillar: e.pillar,
    });
    prev = entryHash;
  });
  return out;
}

export function laneEnvelope(lane: string, traceId: string, receipts: Receipt[]): LaneEnvelope {
  return {
    lane,
    traceId,
    chain: receipts,
    head: receipts.length > 0 ? receipts[receipts.length - 1]!.entryHash : GENESIS,
    chainLength: receipts.length,
  };
}

/** Trace id derived from the canonical request body. Same body in,
 *  same trace out, same chain out. */
export function traceFor(lane: string, body: unknown): string {
  return `wh_${lane}_${sha256(canonicalJson(body) + ':' + lane).slice(0, 16)}`;
}
