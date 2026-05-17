import { describe, expect, it } from 'vitest';
import { AefMockClient } from './mock-client.js';

describe('AefMockClient', () => {
  it('returns a default canned embed response and emits one receipt', async () => {
    const client = new AefMockClient({ tenantId: 't1' });
    const resp = await client.embed({ texts: ['hello'], model: 'm' });
    expect(resp.vectors).toHaveLength(1);
    expect(resp.tenantId).toBe('t1');
    const all = await client.receipts.readAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.endpoint).toBe('/v1/embed');
    expect(all[0]!.method).toBe('MOCK');
  });

  it('asserts governance: exactly 5 embed receipts, none on rerank', async () => {
    const client = new AefMockClient({ tenantId: 't1' });
    for (let i = 0; i < 5; i++) {
      await client.embed({ texts: [`x${i}`], model: 'm' });
    }
    const all = await client.receipts.readAll();
    expect(all).toHaveLength(5);
    expect(all.filter((r) => r.endpoint === '/v1/embed')).toHaveLength(5);
    expect(all.filter((r) => r.endpoint === '/v1/rerank')).toHaveLength(0);
  });

  it('honors per-method canned responses', async () => {
    const client = new AefMockClient({
      tenantId: 't1',
      responses: {
        rerank: (req) => ({
          requestId: req.requestId,
          tenantId: req.tenantId,
          model: req.model,
          results: [{ id: 'a', score: 0.99, rank: 0, text: 'pinned', metadata: {} }],
        }),
      },
    });
    const resp = await client.rerank({
      query: 'q',
      candidates: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
      model: 'm',
    });
    expect(resp.results[0]!.text).toBe('pinned');
  });

  it('chains receipts and seals with a Merkle root', async () => {
    const client = new AefMockClient({ tenantId: 't1' });
    await client.embed({ texts: ['a'], model: 'm' });
    await client.hybridSearch({ query: 'q' });
    await client.ingest({ documents: [{ sourceId: 'd1', content: 'c' }] });
    const all = await client.receipts.readAll();
    expect(all).toHaveLength(3);
    expect(all[1]!.prevHash).toBe(all[0]!.selfHash);
    expect(all[2]!.prevHash).toBe(all[1]!.selfHash);
    const root = await client.receipts.merkleRoot();
    const closure = await client.receipts.close();
    expect(closure.chainLength).toBe(3);
    expect(closure.merkleRoot).toBe(root);
  });
});
