/**
 * Standard query / mutation wrappers for @szl-holdings/api-client-react.
 *
 * These opinionated wrappers apply a uniform cache and refetch policy so
 * high-traffic pages don't have to repeat the same options every time. Import
 * useStandardQuery instead of useQuery when you don't need custom cache
 * behaviour.
 *
 * Default policy:
 *   staleTime            60 000 ms (1 min) — avoids hammering on tab focus
 *   gcTime               5 * 60 * 1000 ms  — keep data in cache for 5 min
 *   refetchOnWindowFocus false             — no surprise refetches on focus
 *   retry                1                 — one retry on transient errors
 *
 * Usage:
 *   const { data, isLoading } = useStandardQuery({
 *     queryKey: ['vessels', 'dashboard'],
 *     queryFn: () => api.dashboard(),
 *   });
 */

import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';

const STANDARD_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

export function useStandardQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...STANDARD_DEFAULTS,
    ...options,
  });
}

export function useStandardMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  return useMutation<TData, TError, TVariables, TContext>(options);
}
