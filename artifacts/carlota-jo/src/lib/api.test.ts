import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function makeFetch(responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const queue = [...responses];
  return vi.fn(async (_url: string, _init?: RequestInit) => {
    const next = queue.shift();
    if (!next) throw new Error('Unexpected fetch call — no response queued');
    return {
      ok: next.ok,
      status: next.status,
      json: async () => next.body,
    } as Response;
  });
}

describe('apiJson', () => {
  let apiJson: <T>(path: string, init?: RequestInit) => Promise<T>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('./api.js');
    apiJson = mod.apiJson;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET request does not attach X-CSRF-Token and does not fetch the CSRF endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    } as Response);

    const result = await apiJson<{ hello: string }>('/test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/test');
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBeUndefined();
    expect(result).toEqual({ hello: 'world' });
  });

  it('POST request fetches a CSRF token and attaches X-CSRF-Token header', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'tok-abc' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 }),
      } as Response);

    await apiJson('/items', { method: 'POST', body: JSON.stringify({ name: 'x' }) });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [csrfUrl] = fetchMock.mock.calls[0] as [string];
    expect(csrfUrl).toBe('/api/csrf-token');
    const [, postInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect((postInit.headers as Record<string, string>)['X-CSRF-Token']).toBe('tok-abc');
  });

  it('CSRF token is cached — only one CSRF fetch across multiple writes', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'tok-cached' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 2 }),
      } as Response);

    await apiJson('/a', { method: 'POST', body: '{}' });
    await apiJson('/b', { method: 'PATCH', body: '{}' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const csrfCalls = fetchMock.mock.calls.filter(
      ([url]: [string]) => (url as string).includes('/csrf-token'),
    );
    expect(csrfCalls).toHaveLength(1);
  });

  it('403 response clears the CSRF cache so the next write re-fetches the token', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'tok-first' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'forbidden' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'tok-refreshed' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 99 }),
      } as Response);

    await expect(apiJson('/first', { method: 'POST', body: '{}' })).rejects.toThrow('HTTP 403');

    await apiJson('/second', { method: 'POST', body: '{}' });

    const csrfCalls = fetchMock.mock.calls.filter(([url]: [string]) =>
      (url as string).includes('/csrf-token'),
    );
    expect(csrfCalls).toHaveLength(2);

    const [, secondPostInit] = fetchMock.mock.calls[3] as [string, RequestInit];
    expect((secondPostInit.headers as Record<string, string>)['X-CSRF-Token']).toBe('tok-refreshed');
  });

  it('unwraps { data: … } envelope from the API response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 42, name: 'Alice' } }),
    } as Response);

    const result = await apiJson<{ id: number; name: string }>('/users/42');

    expect(result).toEqual({ id: 42, name: 'Alice' });
  });

  it('returns the raw body when there is no data envelope', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [1, 2, 3],
    } as Response);

    const result = await apiJson<number[]>('/numbers');

    expect(result).toEqual([1, 2, 3]);
  });

  it('throws on a non-ok, non-403 response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'internal error' }),
    } as Response);

    await expect(apiJson('/broken')).rejects.toThrow('HTTP 500');
  });

  it('attaches credentials: include on every request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiJson('/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
  });
});
