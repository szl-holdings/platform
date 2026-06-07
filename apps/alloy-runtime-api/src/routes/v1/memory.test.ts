/**
 * Tests for /v1/memory routes: validation, write/query/evict, tenant isolation.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import memoryRouter from './memory.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
const savedKey = process.env.ALLOY_API_KEY;

const ACME = { 'x-api-key': 'k', 'x-tenant-id': 'acme' };
const GLOBEX = { 'x-api-key': 'k', 'x-tenant-id': 'globex' };

beforeAll(async () => {
  // Configure a key so the guard enforces auth and reads X-Tenant-Id, letting
  // us exercise real tenant isolation across requests.
  process.env.ALLOY_API_KEY = 'k';
  process.env.NODE_ENV = 'test';
  client = await mountRouter('/v1/memory', memoryRouter);
});

afterAll(() => {
  client?.close();
  if (savedKey === undefined) delete process.env.ALLOY_API_KEY;
  else process.env.ALLOY_API_KEY = savedKey;
});

describe('POST /v1/memory/write', () => {
  it('rejects an invalid scope with 400 and zod issues', async () => {
    const res = await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'not-a-scope', key: 'k1', value: 1 },
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Validation failed');
    expect(Array.isArray(res.json.issues)).toBe(true);
  });

  it('writes an entry and echoes scope/key/tenant', async () => {
    const res = await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'working', key: 'alpha:1', value: { n: 1 } },
    });
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({ ok: true, scope: 'working', key: 'alpha:1', tenantId: 'acme' });
  });
});

describe('POST /v1/memory/query', () => {
  it('returns written entries and supports keyPrefix filtering', async () => {
    await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'semantic', key: 'doc:1', value: 'a' },
    });
    await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'semantic', key: 'doc:2', value: 'b' },
    });
    await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'semantic', key: 'other:1', value: 'c' },
    });

    const all = await client.req('POST', '/v1/memory/query', {
      headers: ACME,
      body: { scope: 'semantic' },
    });
    expect(all.status).toBe(200);
    expect(all.json.count).toBeGreaterThanOrEqual(3);

    const filtered = await client.req('POST', '/v1/memory/query', {
      headers: ACME,
      body: { scope: 'semantic', keyPrefix: 'doc:' },
    });
    expect(filtered.json.count).toBe(2);
    expect(filtered.json.entries.every((e: any) => e.key.startsWith('doc:'))).toBe(true);
  });

  it('honors the limit parameter', async () => {
    const res = await client.req('POST', '/v1/memory/query', {
      headers: ACME,
      body: { scope: 'semantic', keyPrefix: 'doc:', limit: 1 },
    });
    expect(res.json.count).toBe(1);
  });
});

describe('tenant isolation', () => {
  it('does not leak one tenant entries to another', async () => {
    await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: { scope: 'working', key: 'secret', value: 'acme-private' },
    });
    const globex = await client.req('POST', '/v1/memory/query', {
      headers: GLOBEX,
      body: { scope: 'working', keyPrefix: 'secret' },
    });
    expect(globex.status).toBe(200);
    expect(globex.json.tenantId).toBe('globex');
    expect(globex.json.count).toBe(0);
  });
});

describe('DELETE /v1/memory/evict-stale', () => {
  it('evicts expired entries and returns a count', async () => {
    // Write an already-expired entry, then evict.
    await client.req('POST', '/v1/memory/write', {
      headers: ACME,
      body: {
        scope: 'episodic',
        key: 'stale:1',
        value: 'x',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      },
    });
    const res = await client.req('DELETE', '/v1/memory/evict-stale', { headers: ACME });
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
    expect(typeof res.json.evicted).toBe('number');
    expect(res.json.evicted).toBeGreaterThanOrEqual(1);
  });
});
