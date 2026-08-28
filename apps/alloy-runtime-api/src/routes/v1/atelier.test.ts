import type { AtelierProvider } from '@szl-holdings/a11oy-atelier';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mountRouter, type TestClient } from '../__testkit.js';
import { createAtelierRouter } from './atelier.js';

const headers = { 'x-api-key': 'k', 'x-tenant-id': 'solo-builder' };
const otherTenant = { 'x-api-key': 'k', 'x-tenant-id': 'other-tenant' };
const savedKey = process.env.ALLOY_API_KEY;
let client: TestClient;

const provider: AtelierProvider = {
  id: 'xai',
  label: 'xAI API',
  localOnly: false,
  health: () => ({
    provider: 'xai',
    model: 'grok-4.6',
    configured: true,
    available: true,
    localOnly: false,
    evidenceState: 'OBSERVED',
    reason: 'test',
  }),
  generate: async () => ({
    text: 'ATELIER_API_OK',
    provider: 'xai',
    providerLabel: 'xAI API',
    model: 'grok-4.6',
    providerRequestId: 'req_api_test',
    usage: { totalTokens: 7 },
    localOnly: false,
  }),
};

beforeAll(async () => {
  process.env.ALLOY_API_KEY = 'k';
  process.env.NODE_ENV = 'test';
  client = await mountRouter('/api/a11oy/v1/atelier', createAtelierRouter({ provider }));
});

afterAll(() => {
  client.close();
  if (savedKey === undefined) delete process.env.ALLOY_API_KEY;
  else process.env.ALLOY_API_KEY = savedKey;
});

describe('POST /api/a11oy/v1/atelier/ask', () => {
  it('returns a disclosed Proof Ledger receipt and commits session memory', async () => {
    const result = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers,
      body: { prompt: 'hello', sessionId: 'session-one', provider: 'xai' },
    });
    expect(result.status).toBe(200);
    expect(result.json.answer).toBe('ATELIER_API_OK');
    expect(result.json.disclosure).toContain('xAI API');
    expect(result.json.receipt).toMatchObject({
      provider: 'xai',
      model: 'grok-4.6',
      providerRequestId: 'req_api_test',
      ledgerState: 'IN_PROCESS_APPEND_ACCEPTED',
      memoryState: 'COMMITTED_IN_PROCESS',
    });
    expect(result.json.receipt.ledgerEntryId).toMatch(/^le_/);
  });

  it('fails closed when a disabled capability is requested', async () => {
    const result = await client.req('POST', '/api/a11oy/v1/atelier/ask', {
      headers,
      body: { prompt: 'hello', capabilities: { tools: true } },
    });
    expect(result.status).toBe(403);
    expect(result.json.code).toBe('ATELIER_POLICY_DENIED');
  });

  it('keeps session memory isolated by tenant', async () => {
    const own = await client.req('GET', '/api/a11oy/v1/atelier/sessions/session-one', { headers });
    const other = await client.req('GET', '/api/a11oy/v1/atelier/sessions/session-one', {
      headers: otherTenant,
    });
    expect(own.json.turnCount).toBe(2);
    expect(other.json.turnCount).toBe(0);
  });
});
