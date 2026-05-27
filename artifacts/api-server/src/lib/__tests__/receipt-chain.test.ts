/**
 * Unit tests for the Warhacker receipt-chain primitives (#5571).
 *
 * These exercise the helpers in isolation — no express router, no
 * lane bodies — so a regression in canonical-JSON ordering, prevHash
 * linkage, or head computation surfaces here before it cascades
 * through every Warhacker lane.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  GENESIS,
  canonicalJson,
  chain,
  laneEnvelope,
  sha256,
  traceFor,
  type ReceiptInput,
} from '../receipt-chain';

const HEX64 = /^[a-f0-9]{64}$/;

function sample(overrides: Partial<ReceiptInput> = {}): ReceiptInput {
  return {
    receiptClass: 'bundle.composition.v1',
    subject: 'uds-bundle:test',
    summary: 'sample',
    pillar: 'operational-ontology',
    payload: { a: 1, b: [2, 3] },
    ...overrides,
  };
}

describe('GENESIS', () => {
  it('is 64 hex zeros', () => {
    expect(GENESIS).toBe('0'.repeat(64));
    expect(GENESIS).toHaveLength(64);
  });
});

describe('sha256', () => {
  it('matches node:crypto for strings and buffers', () => {
    expect(sha256('abc')).toBe(createHash('sha256').update('abc').digest('hex'));
    const buf = Buffer.from([1, 2, 3, 4]);
    expect(sha256(buf)).toBe(createHash('sha256').update(buf).digest('hex'));
  });
});

describe('canonicalJson', () => {
  it('serializes primitives via JSON.stringify', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(1)).toBe('1');
    expect(canonicalJson('x')).toBe('"x"');
    expect(canonicalJson(true)).toBe('true');
  });

  it('sorts object keys lexicographically', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('produces the same output regardless of key insertion order', () => {
    const a = { foo: 1, bar: 2, baz: 3 };
    const b = { baz: 3, bar: 2, foo: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it('preserves array order (order is content)', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalJson([3, 1, 2])).not.toBe(canonicalJson([1, 2, 3]));
  });

  it('sorts keys recursively in nested objects and arrays', () => {
    const value = {
      z: { y: 1, x: 2 },
      a: [{ b: 1, a: 2 }, { d: 3, c: 4 }],
    };
    expect(canonicalJson(value)).toBe('{"a":[{"a":2,"b":1},{"c":4,"d":3}],"z":{"x":2,"y":1}}');
  });

  it('hashes to the same digest for two reorderings of the same payload', () => {
    const p1 = { outer: { z: 1, a: 2 }, list: [{ k: 1, j: 2 }] };
    const p2 = { list: [{ j: 2, k: 1 }], outer: { a: 2, z: 1 } };
    expect(sha256(canonicalJson(p1))).toBe(sha256(canonicalJson(p2)));
  });
});

describe('chain', () => {
  it('returns an empty array for empty input', () => {
    expect(chain([], 'trace-x')).toEqual([]);
  });

  it('first entry chains from GENESIS, subsequent entries chain from prior entryHash', () => {
    const out = chain([sample(), sample({ subject: 's2' }), sample({ subject: 's3' })], 'trace-y');
    expect(out).toHaveLength(3);
    expect(out[0]!.prevHash).toBe(GENESIS);
    expect(out[1]!.prevHash).toBe(out[0]!.entryHash);
    expect(out[2]!.prevHash).toBe(out[1]!.entryHash);
  });

  it('entries carry sequential 0-based indices', () => {
    const out = chain([sample(), sample({ subject: 's2' })], 'trace-i');
    expect(out.map((r) => r.index)).toEqual([0, 1]);
  });

  it('hashes are 64-char lowercase hex', () => {
    const out = chain([sample(), sample({ subject: 's2' })], 'trace-h');
    for (const r of out) {
      expect(r.payloadSha256).toMatch(HEX64);
      expect(r.entryHash).toMatch(HEX64);
      expect(r.prevHash).toMatch(HEX64);
    }
  });

  it('is deterministic: same inputs ⇒ same chain across calls', () => {
    const entries = [sample(), sample({ subject: 's2', payload: { nested: { z: 1, a: 2 } } })];
    const a = chain(entries, 'trace-det');
    const b = chain(entries, 'trace-det');
    expect(a).toEqual(b);
  });

  it('emittedAt is derived from a fixed epoch + 1s per entry (not wall-clock)', () => {
    const out = chain([sample(), sample({ subject: 's2' }), sample({ subject: 's3' })], 'trace-t');
    expect(out[0]!.emittedAt).toBe('2026-05-27T00:00:00.000Z');
    expect(out[1]!.emittedAt).toBe('2026-05-27T00:00:01.000Z');
    expect(out[2]!.emittedAt).toBe('2026-05-27T00:00:02.000Z');
  });

  it('payloadSha256 is stable under key reordering', () => {
    const a = chain([sample({ payload: { x: 1, y: 2 } })], 't');
    const b = chain([sample({ payload: { y: 2, x: 1 } })], 't');
    expect(a[0]!.payloadSha256).toBe(b[0]!.payloadSha256);
    expect(a[0]!.entryHash).toBe(b[0]!.entryHash);
  });

  it('changing the traceId changes entryHashes but not payloadSha256', () => {
    const a = chain([sample()], 'trace-A');
    const b = chain([sample()], 'trace-B');
    expect(a[0]!.payloadSha256).toBe(b[0]!.payloadSha256);
    expect(a[0]!.entryHash).not.toBe(b[0]!.entryHash);
  });

  it('mutating any payload byte changes payloadSha256 and the entryHash', () => {
    const a = chain([sample({ payload: { v: 1 } })], 't');
    const b = chain([sample({ payload: { v: 2 } })], 't');
    expect(a[0]!.payloadSha256).not.toBe(b[0]!.payloadSha256);
    expect(a[0]!.entryHash).not.toBe(b[0]!.entryHash);
  });

  it('entryHash matches sha256 over the documented tuple', () => {
    const traceId = 'trace-verify';
    const entry = sample();
    const out = chain([entry], traceId);
    const r = out[0]!;
    const expected = sha256(
      [traceId, '0', r.receiptClass, r.subject, r.payloadSha256, GENESIS, r.emittedAt].join('|'),
    );
    expect(r.entryHash).toBe(expected);
  });
});

describe('laneEnvelope', () => {
  it('head equals last entryHash and chainLength equals chain.length', () => {
    const receipts = chain([sample(), sample({ subject: 's2' })], 'trace-env');
    const env = laneEnvelope('lane-1', 'trace-env', receipts);
    expect(env.lane).toBe('lane-1');
    expect(env.traceId).toBe('trace-env');
    expect(env.chain).toBe(receipts);
    expect(env.chainLength).toBe(2);
    expect(env.head).toBe(receipts[1]!.entryHash);
  });

  it('head is GENESIS when the chain is empty', () => {
    const env = laneEnvelope('lane-x', 'trace-empty', []);
    expect(env.head).toBe(GENESIS);
    expect(env.chainLength).toBe(0);
  });
});

describe('traceFor', () => {
  it('is content-addressed: same body ⇒ same trace id', () => {
    const body = { a: 1, b: 2 };
    expect(traceFor('lane-1', body)).toBe(traceFor('lane-1', body));
  });

  it('is stable under key reordering of the body', () => {
    expect(traceFor('lane-1', { a: 1, b: 2 })).toBe(traceFor('lane-1', { b: 2, a: 1 }));
  });

  it('lane prefix is part of the id and changes the digest', () => {
    const body = { x: 1 };
    const t1 = traceFor('lane-1', body);
    const t2 = traceFor('lane-2', body);
    expect(t1.startsWith('wh_lane-1_')).toBe(true);
    expect(t2.startsWith('wh_lane-2_')).toBe(true);
    expect(t1).not.toBe(t2);
  });

  it('emits a 16-char hex suffix', () => {
    const id = traceFor('lane-3', { foo: 'bar' });
    const suffix = id.split('_').pop()!;
    expect(suffix).toMatch(/^[a-f0-9]{16}$/);
  });
});
