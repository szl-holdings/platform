import { randomUUID } from 'node:crypto';

export const CORRELATION_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
export const TRACE_PARENT_HEADER = 'traceparent';
export const TENANT_ID_HEADER = 'x-tenant-id';
export const WORKFLOW_ID_HEADER = 'x-workflow-id';
export const SESSION_ID_HEADER = 'x-session-id';

const VALID_ID_PATTERN = /^[\w\-.:]{1,128}$/;

export function generateCorrelationId(): string {
  return randomUUID();
}

export function generateRequestId(): string {
  return randomUUID();
}

export function extractCorrelationId(
  headers: Record<string, string | string[] | undefined>,
): string {
  const inbound =
    (headers[REQUEST_ID_HEADER] as string | undefined) ??
    (headers[CORRELATION_HEADER] as string | undefined);
  return inbound && VALID_ID_PATTERN.test(inbound) ? inbound : randomUUID();
}

export function buildPropagationHeaders(
  correlationId: string,
  requestId?: string,
  traceParent?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    [CORRELATION_HEADER]: correlationId,
  };
  if (requestId) headers[REQUEST_ID_HEADER] = requestId;
  if (traceParent) headers[TRACE_PARENT_HEADER] = traceParent;
  return headers;
}
