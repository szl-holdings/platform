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
