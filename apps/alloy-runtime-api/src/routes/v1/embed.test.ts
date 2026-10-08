/**
 * Tests for /v1/embed, /v1/rerank, /v1/openai/embeddings response envelopes
 * and validation.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import embedRouter from './embed.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOY_API_KEY; // open guard, tenant defaults to "default"
  client = await mountRouter('/v1', embedRouter);
});
afterAll(() => client?.close());

describe('POST /v1/embed', () => {
  it('rejects an empty texts array', async () => {
    const res = await client.req('POST', '/v1/embed', { body: { texts: [] } });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Validation failed');
  });

  it('returns one embedding envelope per input text', async () => {
    const res = await client.req('POST', '/v1/embed', {
      body: { texts: ['hello', 'world'], model: 'm1' },
    });
    expect(res.status).toBe(200);
    expect(res.json.model).toBe('m1');
    expect(res.json.embeddings).toHaveLength(2);
    expect(res.json.embeddings[0]).toMatchObject({ text: 'hello', dimensions: 0 });
    expect(res.json.tenantId).toBe('default');
  });
});

describe('POST /v1/rerank', () => {
  it('returns ranked passages capped by topN', async () => {
    const res = await client.req('POST', '/v1/rerank', {
      body: { query: 'q', passages: ['a', 'b', 'c'], topN: 2 },
    });
    expect(res.status).toBe(200);
    expect(res.json.reranked).toHaveLength(2);
    expect(res.json.reranked[0].rank).toBe(1);
  });

  it('rejects a missing query', async () => {
    const res = await client.req('POST', '/v1/rerank', { body: { passages: ['a'] } });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/openai/embeddings', () => {
  it('accepts a string input and applies the default model', async () => {
    const res = await client.req('POST', '/v1/openai/embeddings', { body: { input: 'hi' } });
    expect(res.status).toBe(200);
    expect(res.json.object).toBe('list');
    expect(res.json.model).toBe('text-embedding-ada-002');
    expect(res.json.data).toHaveLength(1);
  });

  it('accepts an array input', async () => {
    const res = await client.req('POST', '/v1/openai/embeddings', {
      body: { input: ['a', 'b', 'c'], model: 'custom' },
    });
    expect(res.json.model).toBe('custom');
    expect(res.json.data).toHaveLength(3);
    expect(res.json.data[2].index).toBe(2);
  });
});

describe('production capability admission', () => {
  it.each([
    ['/v1/embed', { texts: ['hello'] }, 'embedding'],
    ['/v1/rerank', { query: 'q', passages: ['a'] }, 'reranking'],
    ['/v1/openai/embeddings', { input: 'hello' }, 'openai-embedding-compat'],
  ])('fails closed for %s instead of returning a successful stub', async (path, body, capability) => {
    const previous = process.env.NODE_ENV;
    const previousKey = process.env.ALLOY_API_KEY;
    const previousTenant = process.env.ALLOY_API_TENANT_ID;
    process.env.NODE_ENV = 'production';
    process.env.ALLOY_API_KEY = 'production-route-test-key';
    process.env.ALLOY_API_TENANT_ID = 'production-route-test-tenant';
    try {
      const res = await client.req('POST', path, {
        body,
        headers: { 'x-api-key': 'production-route-test-key' },
      });
      expect(res.status).toBe(503);
      expect(res.json).toMatchObject({
        status: 'UNAVAILABLE',
        code: 'CAPABILITY_UNAVAILABLE',
        capability,
        evidenceState: 'UNAVAILABLE',
      });
      expect(JSON.stringify(res.json)).not.toContain('embeddings');
      expect(JSON.stringify(res.json)).not.toContain('reranked');
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
      if (previousKey === undefined) delete process.env.ALLOY_API_KEY;
      else process.env.ALLOY_API_KEY = previousKey;
      if (previousTenant === undefined) delete process.env.ALLOY_API_TENANT_ID;
      else process.env.ALLOY_API_TENANT_ID = previousTenant;
    }
  });
});
