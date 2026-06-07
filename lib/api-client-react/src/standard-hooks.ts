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
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiBaseUrl } from './custom-fetch';

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

// ── SSE Live Stream Hook ───────────────────────────────────────────────────────

export interface SseEvent<T = unknown> {
  event: string;
  data: T;
  timestamp?: number;
  channel?: string;
}

export interface UseLiveStreamOptions<T = unknown> {
  /** SSE channel name to subscribe to */
  channel: string;
  /** Optional path override (defaults to /api/realtime/stream) */
  path?: string;
  /** Called when a new event is received */
  onEvent?: (event: SseEvent<T>) => void;
  /** Called when the connection is established */
  onConnect?: () => void;
  /** Called when the connection is lost */
  onDisconnect?: () => void;
  /** Called on error */
  onError?: (err: Event) => void;
  /**
   * If provided, the hook automatically updates these TanStack Query cache keys
   * when data events arrive. Useful for syncing live updates with query cache.
   */
  invalidateOnEvent?: QueryKey[];
  /**
   * Reconnect delay in milliseconds. Defaults to 3000ms with exponential backoff.
   */
  reconnectDelayMs?: number;
  /** Whether the stream is enabled. Defaults to true. */
  enabled?: boolean;
}

export interface UseLiveStreamResult<T = unknown> {
  connected: boolean;
  lastEvent: SseEvent<T> | null;
  eventCount: number;
  error: string | null;
  reconnectCount: number;
}

/**
 * useLiveStream — SSE-backed real-time update hook.
 *
 * Connects to the platform SSE endpoint and delivers live events without polling.
 * Automatically reconnects with exponential backoff on connection loss.
 * Optionally invalidates TanStack Query cache keys when events arrive.
 *
 * Example:
 *   const { connected, lastEvent } = useLiveStream<VesselPosition>({
 *     channel: 'vessels-positions',
 *     onEvent: (e) => setPosition(e.data),
 *     invalidateOnEvent: [queryKeys.vessels.positions()],
 *   });
 *
 * AI token streaming example:
 *   const { lastEvent } = useLiveStream<{ token: string; done: boolean }>({
 *     channel: 'ai-tokens',
 *     onEvent: (e) => {
 *       setTokens(prev => prev + (e.data.token ?? ''));
 *       if (e.data.done) setGenerating(false);
 *     },
 *   });
 */
export function useLiveStream<T = unknown>(
  options: UseLiveStreamOptions<T>,
): UseLiveStreamResult<T> {
  const {
    channel,
    path = '/api/realtime/stream',
    onEvent,
    onConnect,
    onDisconnect,
    onError,
    invalidateOnEvent,
    reconnectDelayMs = 3000,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SseEvent<T> | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const mountedRef = useRef(true);

  const invalidate = useCallback(() => {
    if (!invalidateOnEvent?.length) return;
    for (const key of invalidateOnEvent) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient, invalidateOnEvent]);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const base = getApiBaseUrl();
    const url = `${base}${path}?channel=${encodeURIComponent(channel)}`;

    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('connected', () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
      reconnectCountRef.current = 0;
      setReconnectCount(0);
      onConnect?.();
    });

    es.onmessage = (msgEvent) => {
      if (!mountedRef.current) return;
      try {
        const parsed = JSON.parse(msgEvent.data) as SseEvent<T>;
        setLastEvent(parsed);
        setEventCount((c) => c + 1);
        onEvent?.(parsed);
        invalidate();
      } catch {
        // ignore parse errors for non-JSON messages (e.g. heartbeats)
      }
    };

    // Named event listeners for typed SSE events
    for (const eventName of [
      'signal', 'workflow', 'approval', 'deal', 'incident', 'token', 'metric', 'update',
    ]) {
      es.addEventListener(eventName, (e) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse((e as MessageEvent).data) as SseEvent<T>;
          const parsed: SseEvent<T> = { ...data, event: eventName };
          setLastEvent(parsed);
          setEventCount((c) => c + 1);
          onEvent?.(parsed);
          invalidate();
        } catch {
          // ignore
        }
      });
    }

    es.onerror = (e) => {
      if (!mountedRef.current) return;
      setConnected(false);
      onError?.(e);
      onDisconnect?.();
      es.close();
      esRef.current = null;

      // Exponential backoff: delay doubles up to 30s
      const backoffMs = Math.min(
        reconnectDelayMs * 2 ** reconnectCountRef.current,
        30_000,
      );
      reconnectCountRef.current++;
      setReconnectCount(reconnectCountRef.current);
      setError(`Connection lost. Reconnecting in ${Math.round(backoffMs / 1000)}s...`);

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, backoffMs);
    };
  }, [channel, path, enabled, onEvent, onConnect, onDisconnect, onError, reconnectDelayMs, invalidate]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect, enabled]);

  return { connected, lastEvent, eventCount, error, reconnectCount };
}

// ── Optimistic Update Utilities ────────────────────────────────────────────────

export interface OptimisticMutationOptions<TData, TVariables, TOptimistic = TData> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  /**
   * Computes the optimistic value to set in the cache immediately.
   * Called before the mutation request is sent.
   */
  optimisticUpdater: (variables: TVariables, currentData: TOptimistic | undefined) => TOptimistic;
  /**
   * Optional: runs after the mutation succeeds to reconcile server response with cache.
   */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

/**
 * useOptimisticMutation — wraps a mutation with automatic optimistic updates.
 *
 * Immediately updates the TanStack Query cache with an optimistic value,
 * then reconciles after the server responds. On error, rolls back to the
 * previous cache value.
 *
 * Example:
 *   const mutation = useOptimisticMutation({
 *     queryKey: queryKeys.terra.deals.list(),
 *     mutationFn: (args) => api.updateDeal(args),
 *     optimisticUpdater: (args, current) =>
 *       current?.map(d => d.id === args.id ? { ...d, ...args } : d),
 *   });
 *   mutation.mutate({ id: dealId, stage: 'closing' });
 */
export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void, TCache = unknown>(
  options: OptimisticMutationOptions<TData, TVariables, TCache>,
) {
  const queryClient = useQueryClient();
  const { queryKey, mutationFn, optimisticUpdater, onSettled } = options;

  return useMutation<TData, TError, TVariables, { previousData: TCache | undefined }>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TCache>(queryKey);
      const optimistic = optimisticUpdater(variables, previousData);
      queryClient.setQueryData(queryKey, optimistic);
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey });
      onSettled?.(data, error as Error | null, variables);
    },
  });
}
