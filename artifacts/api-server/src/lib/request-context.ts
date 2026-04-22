import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  traceParent?: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContextStore.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}

export function getContextHeaders(): Record<string, string> {
  const ctx = requestContextStore.getStore();
  if (!ctx) return {};
  const headers: Record<string, string> = {
    'x-correlation-id': ctx.correlationId,
    'x-request-id': ctx.requestId,
  };
  if (ctx.traceParent) {
    headers.traceparent = ctx.traceParent;
  }
  return headers;
}

export function fetchWithContext(
  url: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const contextHeaders = getContextHeaders();
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...contextHeaders,
      ...(init?.headers as Record<string, string> | undefined),
    },
  };
  return fetch(url, mergedInit);
}
