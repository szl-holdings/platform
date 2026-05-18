import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReceiptChain, hashJson, sha256Hex } from '@szl-holdings/szl-receipts';
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

function sseResponse(frames: string[]): Response {
  const wire = frames.map((f) => f + '\n\n').join('');
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(wire));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

describe('HttpClient.stream()', () => {
  it('happy path: yields chunks, records one receipt per chunk, and folds a closure', async () => {
    const frames = [
      'event: chunk\ndata: {"id":"b1","delta":"hello"}',
      'event: chunk\ndata: {"id":"b1","delta":" world"}',
      'event: end\ndata: {"streamId":"abc"}',
    ];
    globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    const chain = new ReceiptChain({ operatorId: 'op@szl' });
    http.setStreamChain(chain, 'op@szl');
    const stream = http.stream<{ id: string; delta: string }>('GET', '/v1/briefings/stream');
    const chunks: { id: string; delta: string }[] = [];
    for await (const c of stream) chunks.push(c);
    expect(chunks).toEqual([
      { id: 'b1', delta: 'hello' },
      { id: 'b1', delta: ' world' },
    ]);
    const closure = await stream.closure;
    expect(closure.chainLength).toBe(2);
    expect(closure.reason).toBe('end');
    const rows = await chain.readAll();
    expect(rows).toHaveLength(2);
    expect(rows[0]!.paramsHash).toBe(sha256Hex('{"id":"b1","delta":"hello"}'));
    expect(rows[1]!.paramsHash).toBe(sha256Hex('{"id":"b1","delta":" world"}'));
    expect((await chain.verify()).valid).toBe(true);
  });

  it('mid-stream abort: closure carries only the chunks the consumer actually read', async () => {
    const frames = [
      'event: chunk\ndata: {"i":1}',
      'event: chunk\ndata: {"i":2}',
      'event: chunk\ndata: {"i":3}',
      'event: end\ndata: {}',
    ];
    globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
    const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
    const chain = new ReceiptChain({ operatorId: 'op' });
    http.setStreamChain(chain, 'op');
    const stream = http.stream<{ i: number }>('GET', '/v1/alerts/subscribe');
    const got: { i: number }[] = [];
    for await (const c of stream) {
      got.push(c);
      if (got.length === 2) break;
    }
    const closure = await stream.closure;
    expect(closure.reason).toBe('abort');
    expect(closure.chainLength).toBe(2);
  });

  it('chunk-tamper detection: paramsHash is byte-stable across runs; altering one byte changes the closure', async () => {
    async function streamRun(payloads: string[]): Promise<{ root: string; paramsHashes: string[] }> {
      const frames = payloads.map((p) => `event: chunk\ndata: ${p}`).concat(['event: end\ndata: {}']);
      globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
      const http = new HttpClient({ apiKey: 'szl_test', baseUrl: 'https://example.test/api' });
      const chain = new ReceiptChain({ operatorId: 'op' });
      http.setStreamChain(chain, 'op');
      const stream = http.stream<{ v: number }>('GET', '/v1/briefings/stream');
      for await (const _ of stream) void _;
      const closure = await stream.closure;
      const rows = await chain.readAll();
      return { root: closure.merkleRoot, paramsHashes: rows.map((r) => r.paramsHash) };
    }
    const baseline = await streamRun(['{"v":1}', '{"v":2}', '{"v":3}']);
    const same = await streamRun(['{"v":1}', '{"v":2}', '{"v":3}']);
    const tampered = await streamRun(['{"v":1}', '{"v":2}', '{"v":4}']);
    // paramsHash is derived purely from chunk bytes, so it must match across clean runs.
    expect(same.paramsHashes).toEqual(baseline.paramsHashes);
    // Altering the last chunk's bytes changes its paramsHash, propagating to the closure.
    expect(tampered.paramsHashes[2]).not.toBe(baseline.paramsHashes[2]);
    expect(tampered.root).not.toBe(baseline.root);
    // And the untouched chunks' paramsHashes remain stable — tamper detection localizes.
    expect(tampered.paramsHashes[0]).toBe(baseline.paramsHashes[0]);
    expect(tampered.paramsHashes[1]).toBe(baseline.paramsHashes[1]);
  });
});
