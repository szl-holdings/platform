import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FilesystemLedgerStore } from './fs-store.js';
import {
  queryByRequestId,
  queryByTenant,
  queryByTimeRange,
  queryDenied,
  replayRequest,
} from './query.js';
import { InMemoryLedgerStore, MutableLedgerStore } from './store.js';
import { EvidenceEntrySchema } from './types.js';

function makeEntry(
  overrides: Partial<{
    entryId: string;
    requestId: string;
    tenantId: string;
    chunkId: string;
    sourceId: string;
    finalScore: number;
    policyAllow: boolean;
    requestedAt: string;
    profileId: string;
  }> = {},
) {
  return EvidenceEntrySchema.parse({
    entryId: overrides.entryId ?? `entry-${Math.random().toString(36).slice(2)}`,
    requestId: overrides.requestId ?? 'req-001',
    tenantId: overrides.tenantId ?? 'tenant-alpha',
    chunkId: overrides.chunkId ?? 'chunk-1',
    sourceId: overrides.sourceId ?? 'doc-1',
    finalScore: overrides.finalScore ?? 0.85,
    policyAllow: overrides.policyAllow ?? true,
    requestedAt: overrides.requestedAt ?? new Date().toISOString(),
    profileId: overrides.profileId,
  });
}

describe('EvidenceEntrySchema', () => {
  it('parses a minimal evidence entry', () => {
    const result = EvidenceEntrySchema.safeParse({
      entryId: 'ev-001',
      requestId: 'req-001',
      tenantId: 't-001',
      chunkId: 'chunk-1',
      sourceId: 'doc-1',
      finalScore: 0.85,
      policyAllow: true,
      requestedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing finalScore', () => {
    const result = EvidenceEntrySchema.safeParse({
      entryId: 'ev-001',
      requestId: 'req-001',
      tenantId: 't-001',
      chunkId: 'chunk-1',
      sourceId: 'doc-1',
      policyAllow: true,
      requestedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-datetime requestedAt', () => {
    const result = EvidenceEntrySchema.safeParse({
      entryId: 'ev-001',
      requestId: 'req-001',
      tenantId: 't-001',
      chunkId: 'chunk-1',
      sourceId: 'doc-1',
      finalScore: 0.5,
      policyAllow: true,
      requestedAt: 'not-a-datetime',
    });
    expect(result.success).toBe(false);
  });
});

describe('InMemoryLedgerStore', () => {
  let store: InMemoryLedgerStore;

  beforeEach(() => {
    store = new InMemoryLedgerStore();
  });

  it('appends and retrieves an entry by id', () => {
    const entry = makeEntry({ entryId: 'e-001' });
    store.append(entry);
    expect(store.get('e-001')).toEqual(entry);
  });

  it('returns undefined for unknown entryId', () => {
    expect(store.get('does-not-exist')).toBeUndefined();
  });

  it('throws if the same entryId is appended twice', () => {
    const entry = makeEntry({ entryId: 'e-dup' });
    store.append(entry);
    expect(() => store.append(entry)).toThrow();
  });

  it('counts entries correctly', () => {
    expect(store.count()).toBe(0);
    store.append(makeEntry());
    store.append(makeEntry());
    expect(store.count()).toBe(2);
  });

  it('clears all entries', () => {
    store.append(makeEntry());
    store.clear();
    expect(store.count()).toBe(0);
  });

  it('queries by requestId', () => {
    store.append(makeEntry({ entryId: 'e-1', requestId: 'req-A' }));
    store.append(makeEntry({ entryId: 'e-2', requestId: 'req-B' }));
    store.append(makeEntry({ entryId: 'e-3', requestId: 'req-A' }));
    const results = store.query({ requestId: 'req-A' });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.requestId === 'req-A')).toBe(true);
  });

  it('queries by tenantId', () => {
    store.append(makeEntry({ entryId: 'e-1', tenantId: 'tenant-alpha' }));
    store.append(makeEntry({ entryId: 'e-2', tenantId: 'tenant-beta' }));
    const results = store.query({ tenantId: 'tenant-alpha' });
    expect(results).toHaveLength(1);
    expect(results[0]?.tenantId).toBe('tenant-alpha');
  });

  it('queries by policyAllow=false', () => {
    store.append(makeEntry({ entryId: 'e-1', policyAllow: true }));
    store.append(makeEntry({ entryId: 'e-2', policyAllow: false }));
    const results = store.query({ policyAllow: false });
    expect(results).toHaveLength(1);
    expect(results[0]?.policyAllow).toBe(false);
  });

  it('respects limit and offset', () => {
    for (let i = 0; i < 10; i++) {
      store.append(makeEntry({ entryId: `e-${i}`, requestId: 'req-X' }));
    }
    const page1 = store.query({ requestId: 'req-X', limit: 3, offset: 0 });
    const page2 = store.query({ requestId: 'req-X', limit: 3, offset: 3 });
    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(3);
    expect(page1[0]?.entryId).not.toBe(page2[0]?.entryId);
  });

  it('queries by time range', () => {
    const early = '2024-01-01T00:00:00.000Z';
    const late = '2024-12-31T00:00:00.000Z';
    const mid = '2024-06-15T00:00:00.000Z';
    store.append(makeEntry({ entryId: 'e-early', requestedAt: early }));
    store.append(makeEntry({ entryId: 'e-mid', requestedAt: mid }));
    store.append(makeEntry({ entryId: 'e-late', requestedAt: late }));
    const results = store.query({
      after: '2024-03-01T00:00:00.000Z',
      before: '2024-09-01T00:00:00.000Z',
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.entryId).toBe('e-mid');
  });

  it('enforces tenant isolation: querying tenant-beta does not return tenant-alpha entries', () => {
    store.append(makeEntry({ entryId: 'e-alpha', tenantId: 'tenant-alpha' }));
    store.append(makeEntry({ entryId: 'e-beta', tenantId: 'tenant-beta' }));
    const betaResults = store.query({ tenantId: 'tenant-beta' });
    expect(betaResults.every((r) => r.tenantId === 'tenant-beta')).toBe(true);
    expect(betaResults.find((r) => r.tenantId === 'tenant-alpha')).toBeUndefined();
  });
});

describe('MutableLedgerStore', () => {
  it('delegates to the initial backend', () => {
    const backing = new InMemoryLedgerStore();
    const mutable = new MutableLedgerStore(backing);
    const entry = makeEntry({ entryId: 'e-1' });
    mutable.append(entry);
    expect(mutable.count()).toBe(1);
    expect(mutable.get('e-1')).toEqual(entry);
  });

  it('switches backend at runtime', () => {
    const original = new InMemoryLedgerStore();
    const mutable = new MutableLedgerStore(original);
    mutable.append(makeEntry({ entryId: 'e-original' }));

    const replacement = new InMemoryLedgerStore();
    replacement.append(makeEntry({ entryId: 'e-replacement' }));
    mutable.setBackend(replacement);

    expect(mutable.count()).toBe(1);
    expect(mutable.get('e-original')).toBeUndefined();
    expect(mutable.get('e-replacement')).toBeDefined();
  });
});

describe('Query helpers', () => {
  let store: InMemoryLedgerStore;

  beforeEach(() => {
    store = new InMemoryLedgerStore();
    store.append(
      makeEntry({ entryId: 'e-1', requestId: 'req-1', tenantId: 't-a', policyAllow: true }),
    );
    store.append(
      makeEntry({ entryId: 'e-2', requestId: 'req-1', tenantId: 't-a', policyAllow: false }),
    );
    store.append(
      makeEntry({ entryId: 'e-3', requestId: 'req-2', tenantId: 't-b', policyAllow: true }),
    );
  });

  it('queryByRequestId returns all entries for a request', () => {
    const results = queryByRequestId(store, 'req-1');
    expect(results).toHaveLength(2);
  });

  it("queryByTenant returns only the tenant's entries", () => {
    const results = queryByTenant(store, 't-b');
    expect(results).toHaveLength(1);
    expect(results[0]?.tenantId).toBe('t-b');
  });

  it('queryDenied returns only denied entries', () => {
    const results = queryDenied(store);
    expect(results).toHaveLength(1);
    expect(results[0]?.policyAllow).toBe(false);
  });

  it('queryDenied with tenantId scopes to that tenant', () => {
    const results = queryDenied(store, 't-b');
    expect(results).toHaveLength(0);
  });

  it('replayRequest returns entries sorted by requestedAt ascending', () => {
    const t1 = '2024-01-01T10:00:00.000Z';
    const t2 = '2024-01-01T11:00:00.000Z';
    store.append(makeEntry({ entryId: 'replay-b', requestId: 'req-replay', requestedAt: t2 }));
    store.append(makeEntry({ entryId: 'replay-a', requestId: 'req-replay', requestedAt: t1 }));
    const results = replayRequest(store, 'req-replay');
    expect(results[0]?.requestedAt).toBe(t1);
    expect(results[1]?.requestedAt).toBe(t2);
  });
});

describe('FilesystemLedgerStore', () => {
  let filePath: string;
  let store: FilesystemLedgerStore;

  beforeEach(() => {
    filePath = join(tmpdir(), `aef-ledger-test-${Date.now()}.jsonl`);
    store = new FilesystemLedgerStore(filePath);
  });

  afterEach(() => {
    if (existsSync(filePath)) rmSync(filePath);
  });

  it('appends an entry and persists to disk', () => {
    const entry = makeEntry({ entryId: 'fs-1' });
    store.append(entry);
    expect(store.count()).toBe(1);

    const fresh = new FilesystemLedgerStore(filePath);
    expect(fresh.count()).toBe(1);
    expect(fresh.get('fs-1')).toBeDefined();
  });

  it('throws on duplicate entryId', () => {
    const entry = makeEntry({ entryId: 'fs-dup' });
    store.append(entry);
    expect(() => store.append(entry)).toThrow();
  });

  it('queries by tenantId across persisted entries', () => {
    store.append(makeEntry({ entryId: 'fs-a', tenantId: 't-a' }));
    store.append(makeEntry({ entryId: 'fs-b', tenantId: 't-b' }));
    const results = store.query({ tenantId: 't-a' });
    expect(results).toHaveLength(1);
    expect(results[0]?.tenantId).toBe('t-a');
  });

  it('clears the file', () => {
    store.append(makeEntry({ entryId: 'fs-clear' }));
    store.clear();
    expect(store.count()).toBe(0);
  });

  it('queryByTimeRange works on filesystem store', () => {
    const t1 = '2024-01-01T00:00:00.000Z';
    const t2 = '2024-06-15T00:00:00.000Z';
    const t3 = '2024-12-31T00:00:00.000Z';
    store.append(makeEntry({ entryId: 'fs-t1', requestedAt: t1 }));
    store.append(makeEntry({ entryId: 'fs-t2', requestedAt: t2 }));
    store.append(makeEntry({ entryId: 'fs-t3', requestedAt: t3 }));
    const results = queryByTimeRange(store, '2024-03-01T00:00:00.000Z', '2024-09-01T00:00:00.000Z');
    expect(results).toHaveLength(1);
    expect(results[0]?.entryId).toBe('fs-t2');
  });
});
