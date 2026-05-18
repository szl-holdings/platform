import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashJson } from '@szl-holdings/szl-receipts';
import { AefClient } from './client.js';

const origFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = origFetch;
});

const baseConfig = {
  gatewayUrl: 'https://gateway.test',
  apiKey: 'tok',
  tenantId: 't1',
  maxRetries: 0,
};

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('AefClient idempotency + receipts', () => {
  it('attaches idempotency-key equal to sha256(canonical body) on writes', async () => {
    const embedResp = {
      requestId: 'r',
      tenantId: 't1',
      model: 'm',
      dimensions: 2,
      vectors: [{ index: 0, text: 'hi', vector: [0.1, 0.2] }],
    };
    const fetchMock = vi.fn(async () => okJson(embedResp));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new AefClient(baseConfig);
    await client.embed({ inputs: ['hi'], model: 'm', requestId: 'r' });
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(headers['idempotency-key']).toBe(hashJson(body));
  });

  it('records receipts when enabled, and merkleRoot / close() work', async () => {
    const embedResp = {
      requestId: 'r',
      tenantId: 't1',
      model: 'm',
      dimensions: 1,
      vectors: [{ index: 0, text: 'x', vector: [0.1] }],
    };
    globalThis.fetch = vi.fn(async () => okJson(embedResp)) as unknown as typeof fetch;
    const client = new AefClient({
      ...baseConfig,
      receipts: { enabled: true, operatorId: 'op@szl' },
    });
    await client.embed({ inputs: ['a'], model: 'm', requestId: 'r1' });
    await client.embed({ inputs: ['b'], model: 'm', requestId: 'r2' });
    const all = await client.receipts.readAll();
    expect(all).toHaveLength(2);
    expect(all[1]!.prevHash).toBe(all[0]!.selfHash);
    const root = await client.receipts.merkleRoot();
    expect(root).toHaveLength(64);
    const closure = await client.receipts.close();
    expect(closure.chainLength).toBe(2);
    expect(closure.merkleRoot).toBe(root);
  });

  it('throws when accessing disabled receipts', async () => {
    const client = new AefClient(baseConfig);
    expect(client.receipts.enabled).toBe(false);
    await expect(client.receipts.merkleRoot()).rejects.toThrow(/disabled/);
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

describe('AefClient.hybridSearchStream()', () => {
  it('happy path: yields chunks and emits one receipt per chunk plus a closure', async () => {
    const { sha256Hex } = await import('@szl-holdings/szl-receipts');
    const frames = [
      'event: chunk\ndata: {"score":0.9,"id":"a"}',
      'event: chunk\ndata: {"score":0.8,"id":"b"}',
      'event: end\ndata: {}',
    ];
    globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
    const client = new AefClient({
      ...baseConfig,
      receipts: { enabled: true, operatorId: 'op@szl' },
    });
    const stream = client.hybridSearchStream({ query: 'q', requestId: 'rq' });
    const got: unknown[] = [];
    for await (const c of stream) got.push(c);
    expect(got).toEqual([
      { score: 0.9, id: 'a' },
      { score: 0.8, id: 'b' },
    ]);
    const closure = await stream.closure;
    expect(closure.chainLength).toBe(2);
    expect(closure.reason).toBe('end');
    const rows = await client.receipts.readAll();
    expect(rows).toHaveLength(2);
    expect(rows[0]!.paramsHash).toBe(sha256Hex('{"score":0.9,"id":"a"}'));
    expect(rows[1]!.paramsHash).toBe(sha256Hex('{"score":0.8,"id":"b"}'));
  });

  it('mid-stream abort produces closure with reason="abort" and the consumed chunk count', async () => {
    const frames = [
      'event: chunk\ndata: {"i":1}',
      'event: chunk\ndata: {"i":2}',
      'event: chunk\ndata: {"i":3}',
      'event: end\ndata: {}',
    ];
    globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
    const client = new AefClient({
      ...baseConfig,
      receipts: { enabled: true, operatorId: 'op' },
    });
    const stream = client.hybridSearchStream({ query: 'q', requestId: 'rq' });
    let count = 0;
    for await (const _ of stream) {
      void _;
      if (++count === 2) break;
    }
    const closure = await stream.closure;
    expect(closure.reason).toBe('abort');
    expect(closure.chainLength).toBe(2);
  });

  it('chunk-tamper detection: paramsHash is byte-stable; altering one byte changes the closure', async () => {
    async function runFor(payloads: string[]): Promise<{ root: string; paramsHashes: string[] }> {
      const frames = payloads.map((p) => `event: chunk\ndata: ${p}`).concat(['event: end\ndata: {}']);
      globalThis.fetch = vi.fn(async () => sseResponse(frames)) as unknown as typeof fetch;
      const client = new AefClient({
        ...baseConfig,
        receipts: { enabled: true, operatorId: 'op' },
      });
      const stream = client.hybridSearchStream({ query: 'q', requestId: 'rq' });
      for await (const _ of stream) void _;
      const rows = await client.receipts.readAll();
      return { root: (await stream.closure).merkleRoot, paramsHashes: rows.map((r) => r.paramsHash) };
    }
    const baseline = await runFor(['{"v":1}', '{"v":2}', '{"v":3}']);
    const same = await runFor(['{"v":1}', '{"v":2}', '{"v":3}']);
    const tampered = await runFor(['{"v":1}', '{"v":2}', '{"v":4}']);
    expect(same.paramsHashes).toEqual(baseline.paramsHashes);
    expect(tampered.paramsHashes[2]).not.toBe(baseline.paramsHashes[2]);
    expect(tampered.root).not.toBe(baseline.root);
    expect(tampered.paramsHashes[0]).toBe(baseline.paramsHashes[0]);
    expect(tampered.paramsHashes[1]).toBe(baseline.paramsHashes[1]);
  });
});
