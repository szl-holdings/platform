import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { recordSpan, withSpan } = vi.hoisted(() => ({
  recordSpan: vi.fn(),
  withSpan: vi.fn(
    async (_name: string, _attrs: Record<string, unknown>, fn: () => Promise<unknown>) => fn(),
  ),
}));

vi.mock('../../artifacts/command/src/telemetry', () => ({
  recordSpan,
  withSpan,
}));

import {
  fetchJson,
  tracedFetch,
} from '../../artifacts/command/src/pages/cognitive/shared';

describe('command shared traced fetchJson', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    recordSpan.mockClear();
    withSpan.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('emits an app.api_call span with status=ok on a successful GET', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ value: 42 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ) as unknown as typeof fetch;

    const result = await fetchJson<{ value: number }>('/api/example');
    expect(result).toEqual({ value: 42 });

    expect(recordSpan).toHaveBeenCalledTimes(1);
    const call = recordSpan.mock.calls[0]![0] as {
      name: string;
      status: string;
      attributes: Record<string, unknown>;
    };
    expect(call.name).toBe('app.api_call');
    expect(call.status).toBe('ok');
    expect(call.attributes['app.api_call.path']).toBe('/api/example');
    expect(call.attributes['app.api_call.method']).toBe('GET');
    expect(call.attributes['app.api_call.status']).toBe(200);
  });

  it('emits an app.api_call span with status=error and rethrows on HTTP failure', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('boom', { status: 503, statusText: 'Service Unavailable' }),
    ) as unknown as typeof fetch;

    await expect(fetchJson('/api/broken', { method: 'POST' })).rejects.toThrow(/HTTP 503/);

    expect(recordSpan).toHaveBeenCalledTimes(1);
    const call = recordSpan.mock.calls[0]![0] as {
      name: string;
      status: string;
      attributes: Record<string, unknown>;
      errorMessage?: string;
    };
    expect(call.name).toBe('app.api_call');
    expect(call.status).toBe('error');
    expect(call.attributes['app.api_call.method']).toBe('POST');
    expect(call.attributes['app.api_call.status']).toBe(503);
    expect(call.errorMessage).toMatch(/HTTP 503/);
  });

  it('forwards caller-supplied headers (e.g. CSRF tokens) to fetch', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await fetchJson('/api/with-csrf', {
      method: 'POST',
      headers: { 'x-csrf-token': 'token-123' },
    });

    const initArg = fetchSpy.mock.calls[0]![1] as RequestInit;
    const headers = initArg.headers as Record<string, string>;
    expect(headers['x-csrf-token']).toBe('token-123');
    expect(initArg.credentials).toBe('include');
    expect(initArg.method).toBe('POST');
  });

  it('tracedFetch wraps fetchJson in withSpan with path/method attributes', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ) as unknown as typeof fetch;

    await tracedFetch('app.example', '/api/named', { 'extra.attr': 'yes' });

    expect(withSpan).toHaveBeenCalledTimes(1);
    const [name, attrs] = withSpan.mock.calls[0]!;
    expect(name).toBe('app.example');
    const a = attrs as Record<string, unknown>;
    expect(a['extra.attr']).toBe('yes');
    expect(a['app.api_call.path']).toBe('/api/named');
    expect(a['app.api_call.method']).toBe('GET');
  });
});
