import { describe, expect, it } from 'vitest';
import { SZLMockClient } from './mock-client.js';

describe('SZLMockClient', () => {
  it('returns canned response and emits one R1 receipt per call', async () => {
    const client = new SZLMockClient({
      responses: {
        'portfolio.getSummary': () => ({ summary: 'ok', note: 'n', version: '1' }),
      },
    });
    const summary = await client.portfolio.getSummary();
    expect(summary).toEqual({ summary: 'ok', note: 'n', version: '1' });
    const all = await client.receipts.readAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.endpoint).toBe('portfolio.getSummary');
    expect(all[0]!.method).toBe('MOCK');
  });

  it('asserts governance: exactly N receipts of a given endpoint in a flow', async () => {
    const client = new SZLMockClient();
    await client.briefings.list({ limit: 5 });
    await client.briefings.list({ limit: 5 });
    await client.briefings.get(7);
    await client.alerts.list();
    await client.portfolio.getSummary();

    const all = await client.receipts.readAll();
    expect(all).toHaveLength(5);
    const briefingsList = all.filter((r) => r.endpoint === 'briefings.list');
    expect(briefingsList).toHaveLength(2);
    const briefingsGet = all.filter((r) => r.endpoint === 'briefings.get');
    expect(briefingsGet).toHaveLength(1);
    expect(all.filter((r) => r.endpoint.startsWith('treasury.'))).toHaveLength(0);
  });

  it('chains receipts via prevHash and produces a sealable Merkle root', async () => {
    const client = new SZLMockClient();
    await client.portfolio.getSummary();
    await client.alerts.list();
    await client.briefings.list();
    const all = await client.receipts.readAll();
    expect(all[1]!.prevHash).toBe(all[0]!.selfHash);
    expect(all[2]!.prevHash).toBe(all[1]!.selfHash);
    const root = await client.receipts.merkleRoot();
    const closure = await client.receipts.close();
    expect(closure.chainLength).toBe(3);
    expect(closure.merkleRoot).toBe(root);
  });

  it('throws a clear error when no canned response is registered for an unknown method', async () => {
    const client = new SZLMockClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((client.portfolio as any).bogusMethod()).rejects.toThrow(/no canned response/);
  });
});
