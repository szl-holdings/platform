/**
 * Tests for the Decision Runtime mutation hooks.
 *
 * Covers the mutationFn contract for the four mutating hooks consumed by the
 * Approvals UI: useDecisionApprove, useDecisionReject, useDecisionRequestChanges,
 * useDecisionDelegate. Each test asserts:
 *   - the correct POST endpoint is called
 *   - credentials: 'include' is set (cookie auth)
 *   - the CSRF token cookie is mirrored into the X-CSRF-Token header
 *   - the request body shape matches the route contract
 *   - the cache invalidates the 'decisions' query key on success
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useDecisionApprove,
  useDecisionDelegate,
  useDecisionReject,
  useDecisionRequestChanges,
} from './decisions-api';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc, invalidateSpy };
}

function mockFetchOk(body: unknown = { success: true }) {
  const fetchSpy = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
  return fetchSpy;
}

function mockFetchFail(status = 500, text = 'boom') {
  const fetchSpy = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => text,
  });
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
  return fetchSpy;
}

beforeEach(() => {
  // Set the CSRF cookie that postJson() reads from document.cookie.
  document.cookie = 'csrf_token=test-csrf-abc123';
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clear cookie between tests
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
});

describe('useDecisionApprove', () => {
  it('POSTs to /api/decisions/cards/:id/approve with the reason body', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDecisionApprove(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-42', reason: 'looks good' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/decisions/cards/card-42/approve');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'looks good' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['decisions'] });
  });

  it('forwards the CSRF cookie value as X-CSRF-Token header', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDecisionApprove(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-1' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('test-csrf-abc123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('rejects when the server returns a non-2xx response', async () => {
    mockFetchFail(403, 'forbidden');
    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDecisionApprove(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync({ cardId: 'card-x' })).rejects.toThrow(/403/);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useDecisionReject', () => {
  it('POSTs to /api/decisions/cards/:id/reject and invalidates the cache', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDecisionReject(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-7', reason: 'stale evidence' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/decisions/cards/card-7/reject');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'stale evidence' });
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['decisions'] }),
    );
  });

  it('omits reason from the body when not provided', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDecisionReject(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-9' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ reason: undefined });
  });
});

describe('useDecisionRequestChanges', () => {
  it('POSTs to /api/decisions/cards/:id/request-changes with the reason', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDecisionRequestChanges(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-12', reason: 'add fresh signal' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/decisions/cards/card-12/request-changes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'add fresh signal' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['decisions'] });
  });
});

describe('useDecisionDelegate', () => {
  it('POSTs to /api/decisions/cards/:id/delegate with delegateTo + optional reason', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDecisionDelegate(), { wrapper: Wrapper });

    await result.current.mutateAsync({
      cardId: 'card-99',
      delegateTo: 'jordan@szl.com',
      reason: 'OOO this week',
    });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/decisions/cards/card-99/delegate');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({
      delegateTo: 'jordan@szl.com',
      reason: 'OOO this week',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['decisions'] });
  });

  it('still includes delegateTo when reason is omitted', async () => {
    const fetchSpy = mockFetchOk();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDecisionDelegate(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-101', delegateTo: 'taylor@szl.com' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/decisions/cards/card-101/delegate');
    expect(JSON.parse(init.body as string)).toEqual({
      delegateTo: 'taylor@szl.com',
      reason: undefined,
    });
  });

  it('surfaces server errors so the UI can roll back its pending state', async () => {
    mockFetchFail(409, 'conflict — already delegated');
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDecisionDelegate(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ cardId: 'card-conflict', delegateTo: 'sam@szl.com' }),
    ).rejects.toThrow(/409/);
  });

  it('uses an empty CSRF header when no csrf_token cookie is present', async () => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const fetchSpy = mockFetchOk();
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDecisionDelegate(), { wrapper: Wrapper });

    await result.current.mutateAsync({ cardId: 'card-1', delegateTo: 'a@b.c' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-CSRF-Token']).toBe('');
  });
});
