import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  requestId?: string;
  traceParent?: string;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  domain?: string;
  workflowId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function getWorkflowId(): string | undefined {
  return storage.getStore()?.workflowId;
}

export function getTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}

export function withEnrichedContext<T>(partial: Partial<RequestContext>, fn: () => T): T {
  const current = storage.getStore();
  const merged: RequestContext = {
    correlationId: partial.correlationId ?? current?.correlationId ?? 'unknown',
    ...current,
    ...partial,
  };
  return storage.run(merged, fn);
}
