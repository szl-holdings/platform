import { describe, expect, it } from 'vitest';
import { ingestArc, ingestEpoch, ingestMetr } from '../ingestors';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), { status: ok ? status : status });
}
function textResponse(body: string, ok = true, status = 200): Response {
  return new Response(body, { status: ok ? status : status });
}

describe('ingestors — never throw, always return typed result', () => {
  it('METR success returns typed value', async () => {
    const res = await ingestMetr(async () => jsonResponse({ stargazers_count: 42 }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBe(42);
      expect(res.sourceUrl).toMatch(/METR/);
      expect(res.fetchedAt).toMatch(/^\d{4}-/);
    }
  });

  it('METR captures HTTP errors without throwing', async () => {
    const res = await ingestMetr(async () => new Response('nope', { status: 503 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/HTTP 503/);
  });

  it('METR captures malformed payloads without throwing', async () => {
    const res = await ingestMetr(async () => jsonResponse({ stargazers_count: 'not-a-number' }));
    expect(res.ok).toBe(false);
  });

  it('METR captures network failures without throwing', async () => {
    const res = await ingestMetr(async () => {
      throw new Error('boom');
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('boom');
  });

  it('EPOCH success counts CSV data rows', async () => {
    const csv = 'name,year\nGPT-1,2018\nGPT-2,2019\nGPT-3,2020\n';
    const res = await ingestEpoch(async () => textResponse(csv));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(3);
  });

  it('EPOCH fails gracefully on empty CSV', async () => {
    const res = await ingestEpoch(async () => textResponse(''));
    expect(res.ok).toBe(false);
  });

  it('EPOCH captures fetch exceptions', async () => {
    const res = await ingestEpoch(async () => {
      throw new TypeError('network down');
    });
    expect(res.ok).toBe(false);
  });

  it('ARC success returns stargazer count', async () => {
    const res = await ingestArc(async () => jsonResponse({ stargazers_count: 1234 }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(1234);
  });

  it('ARC fails gracefully on missing field', async () => {
    const res = await ingestArc(async () => jsonResponse({ unrelated: true }));
    expect(res.ok).toBe(false);
  });
});
