import { useCallback, useContext } from 'react';
import { type EnqueueOptions, SyncEngineContext } from '../context/SyncEngineContext';

export type SyncMutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SyncMutationOptions<TData = unknown, TInput = unknown> {
  url: string | ((input: TInput) => string);
  method?: SyncMutationMethod;
  buildHeaders?: (input: TInput) => Record<string, string>;
  onSuccess?: (data: TData, input: TInput) => void | Promise<void>;
  onError?: (error: Error, input: TInput) => void;
  onQueued?: (input: TInput) => void;
  idempotencyKeyFn?: (input: TInput) => string;
  getToken?: () => Promise<string | null>;
}

export interface SyncMutationResult<TData = unknown, TInput = unknown> {
  mutate: (input: TInput, headers?: Record<string, string>) => Promise<TData | null>;
  isOnline: boolean;
}

export function useSyncMutation<TData = unknown, TInput = unknown>(
  options: SyncMutationOptions<TData, TInput>,
): SyncMutationResult<TData, TInput> {
  const ctx = useContext(SyncEngineContext);

  const mutate = useCallback(
    async (input: TInput, extraHeaders?: Record<string, string>): Promise<TData | null> => {
      const resolvedUrl = typeof options.url === 'function' ? options.url(input) : options.url;
      const method = options.method ?? 'POST';

      const builtHeaders = options.buildHeaders ? options.buildHeaders(input) : {};
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...builtHeaders,
        ...extraHeaders,
      };

      if (options.getToken) {
        const token = await options.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const idempotencyKey = options.idempotencyKeyFn
        ? options.idempotencyKeyFn(input)
        : `${method}-${resolvedUrl}-${Date.now().toString(36)}`;

      const domain = ctx?.domain ?? 'default';
      const isOffline = ctx ? !ctx.isOnline : false;

      if (isOffline && ctx) {
        const queueOptions: EnqueueOptions = {
          domain,
          method,
          url: resolvedUrl,
          body: input,
          headers,
          idempotencyKey,
        };
        await ctx.enqueue(queueOptions);
        options.onQueued?.(input);
        return null;
      }

      try {
        const res = await fetch(resolvedUrl, {
          method,
          headers: {
            ...headers,
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(input),
        });

        if (res.ok || res.status === 204) {
          const data = res.status === 204 ? null : ((await res.json()) as TData);
          await options.onSuccess?.(data as TData, input);
          return data as TData;
        }

        if ((res.status === 0 || res.status >= 500) && ctx) {
          const queueOptions: EnqueueOptions = {
            domain,
            method,
            url: resolvedUrl,
            body: input,
            headers,
            idempotencyKey,
          };
          await ctx.enqueue(queueOptions);
          options.onQueued?.(input);
          return null;
        }

        const errorBody = await res.text().catch(() => '');
        throw new Error(`${method} ${resolvedUrl} failed with ${res.status}: ${errorBody}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        const isNetworkError =
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Failed to fetch');

        if (isNetworkError && ctx) {
          const queueOptions: EnqueueOptions = {
            domain,
            method,
            url: resolvedUrl,
            body: input,
            headers,
            idempotencyKey,
          };
          await ctx.enqueue(queueOptions);
          options.onQueued?.(input);
          return null;
        }

        options.onError?.(error, input);
        throw error;
      }
    },
    [ctx, options],
  );

  return {
    mutate,
    isOnline: ctx?.isOnline ?? true,
  };
}
