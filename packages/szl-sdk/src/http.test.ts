import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashJson } from '@szl-holdings/szl-receipts';
import { HttpClient, type HttpRequestRecord } from './http.js';

const origFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = origFetch;
});

function mockOk(body: unknown = { ok: true }, status = 200) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

describe('HttpClient idempotency', () => {
  it('attaches Idempotency-Key header for POST equal to sha256(canonical body)', async () => {
    const fetchMock = mockOk({ data: { ok: true } });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    const body = { b: 2, a: 1 };
    await http.post('/v1/x', body);
    const call = fetchMock.mock.calls[0]!;
    const headers = (call[1] as RequestInit).headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe(hashJson(body));
    // Same hash regardless of key order
    expect(headers['Idempotency-Key']).toBe(hashJson({ a: 1, b: 2 }));
  });

  it('does not attach Idempotency-Key on GET', async () => {
    const fetchMock = mockOk({ data: [] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    await http.get('/v1/x');
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBeUndefined();
  });

  it('honors a caller-supplied Idempotency-Key (case-insensitive) instead of overwriting it', async () => {
    const fetchMock = mockOk({ data: { ok: true } });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    await http.request('POST', '/v1/x', { body: { a: 1 }, headers: { 'idempotency-key': 'caller-key' } });
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['idempotency-key']).toBe('caller-key');
    expect(headers['Idempotency-Key']).toBeUndefined();
  });

  it('observer fires with paramsHash matching the idempotency key', async () => {
    const fetchMock = mockOk({ data: { ok: true } });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    const records: HttpRequestRecord[] = [];
    http.setObserver((r) => { records.push(r); });
    await http.post('/v1/y', { hello: 'world' });
    expect(records).toHaveLength(1);
    expect(records[0]!.idempotencyKey).toBe(records[0]!.paramsHash);
    expect(records[0]!.paramsHash).toBe(hashJson({ hello: 'world' }));
  });
});
