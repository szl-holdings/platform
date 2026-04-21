import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: unknown) => useQueryMock(opts),
  useMutation: (opts: unknown) => useMutationMock(opts),
}));

import { useStandardMutation, useStandardQuery } from './standard-hooks.js';

const EXPECTED_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

describe('useStandardQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards the caller's queryKey and queryFn to useQuery", () => {
    const queryFn = vi.fn().mockResolvedValue({ ok: true });
    const queryKey = ['vessels', 'dashboard'] as const;

    useStandardQuery({ queryKey, queryFn });

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const passed = useQueryMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(passed.queryKey).toEqual(queryKey);
    expect(passed.queryFn).toBe(queryFn);
  });

  it('applies the standard cache and retry defaults when none are supplied', () => {
    useStandardQuery({
      queryKey: ['k'],
      queryFn: async () => 1,
    });

    const passed = useQueryMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(passed.staleTime).toBe(EXPECTED_DEFAULTS.staleTime);
    expect(passed.gcTime).toBe(EXPECTED_DEFAULTS.gcTime);
    expect(passed.refetchOnWindowFocus).toBe(EXPECTED_DEFAULTS.refetchOnWindowFocus);
    expect(passed.retry).toBe(EXPECTED_DEFAULTS.retry);
  });

  it('lets caller-provided options override the standard defaults', () => {
    useStandardQuery({
      queryKey: ['k'],
      queryFn: async () => 1,
      staleTime: 0,
      retry: 5,
      refetchOnWindowFocus: true,
      gcTime: 1_000,
    });

    const passed = useQueryMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(passed.staleTime).toBe(0);
    expect(passed.retry).toBe(5);
    expect(passed.refetchOnWindowFocus).toBe(true);
    expect(passed.gcTime).toBe(1_000);
  });

  it('returns whatever the underlying useQuery returns', () => {
    const fakeResult = { data: { hello: 'world' }, isLoading: false };
    useQueryMock.mockReturnValueOnce(fakeResult);

    const result = useStandardQuery({
      queryKey: ['k'],
      queryFn: async () => ({ hello: 'world' }),
    });

    expect(result).toBe(fakeResult);
  });
});

describe('useStandardMutation', () => {
  beforeEach(() => {
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('forwards options to useMutation without injecting query defaults', () => {
    const mutationFn = vi.fn().mockResolvedValue('ok');
    const onSuccess = vi.fn();

    useStandardMutation({ mutationFn, onSuccess });

    expect(useMutationMock).toHaveBeenCalledTimes(1);
    const passed = useMutationMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(passed.mutationFn).toBe(mutationFn);
    expect(passed.onSuccess).toBe(onSuccess);
    // Mutation wrapper should NOT silently inject the query defaults.
    expect(passed.staleTime).toBeUndefined();
    expect(passed.gcTime).toBeUndefined();
    expect(passed.refetchOnWindowFocus).toBeUndefined();
  });

  it('returns whatever the underlying useMutation returns', () => {
    const fakeResult = { mutate: vi.fn(), isPending: true };
    useMutationMock.mockReturnValueOnce(fakeResult);

    const result = useStandardMutation({
      mutationFn: async () => 'v',
    });

    expect(result).toBe(fakeResult);
  });
});
