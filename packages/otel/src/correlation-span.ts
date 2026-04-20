/**
 * Correlation-aware span utility.
 * Propagates the SZL correlation ID into the active OTel span
 * so that logs, traces, and downstream calls are all linked.
 */
import * as api from "@opentelemetry/api";

const SZL_CORRELATION_ATTR = "szl.correlation_id";
const SZL_REQUEST_ID_ATTR = "szl.request_id";
const SZL_ORG_ID_ATTR = "szl.org_id";

export interface CorrelationContext {
  correlationId?: string;
  requestId?: string;
  orgId?: number;
  userId?: number;
}

/**
 * Run callback inside an active span, injecting correlation attributes.
 */
export async function withCorrelationSpan<T>(
  name: string,
  context: CorrelationContext,
  callback: (span: api.Span) => Promise<T>,
): Promise<T> {
  const tracer = api.trace.getTracer("@szl-holdings/otel");
  return tracer.startActiveSpan(name, async (span) => {
    if (context.correlationId) {
      span.setAttribute(SZL_CORRELATION_ATTR, context.correlationId);
    }
    if (context.requestId) {
      span.setAttribute(SZL_REQUEST_ID_ATTR, context.requestId);
    }
    if (context.orgId) {
      span.setAttribute(SZL_ORG_ID_ATTR, context.orgId);
    }
    if (context.userId) {
      span.setAttribute("szl.user_id", context.userId);
    }

    try {
      const result = await callback(span);
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      span.recordException(err instanceof Error ? err : new Error(message));
      span.setStatus({ code: api.SpanStatusCode.ERROR, message });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Inject correlation attributes into the current active span (if any).
 */
export function annotateActiveSpan(context: CorrelationContext): void {
  const span = api.trace.getActiveSpan();
  if (!span) return;
  if (context.correlationId) span.setAttribute(SZL_CORRELATION_ATTR, context.correlationId);
  if (context.requestId) span.setAttribute(SZL_REQUEST_ID_ATTR, context.requestId);
  if (context.orgId) span.setAttribute(SZL_ORG_ID_ATTR, context.orgId);
  if (context.userId) span.setAttribute("szl.user_id", context.userId);
}
