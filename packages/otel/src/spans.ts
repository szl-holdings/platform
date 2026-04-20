/**
 * Span helper utilities for common instrumentation patterns.
 */
import * as api from "@opentelemetry/api";

function getActiveTracer(): api.Tracer {
  return api.trace.getTracer("@szl-holdings/otel");
}

type SpanCallback<T> = (span: api.Span) => Promise<T>;

/**
 * Generic span wrapper — runs callback inside an active span.
 */
export async function startSpan<T>(
  name: string,
  callback: SpanCallback<T>,
  options?: api.SpanOptions,
): Promise<T> {
  const tracer = getActiveTracer();
  return tracer.startActiveSpan(name, options ?? {}, async (span) => {
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
 * Span for an AI agent tool call.
 */
export async function toolCallSpan<T>(
  toolName: string,
  args: Record<string, unknown>,
  callback: SpanCallback<T>,
  context?: {
    correlationId?: string;
    orgId?: number;
    agentId?: string;
    domain?: string;
  },
): Promise<T> {
  return startSpan(
    `tool.${toolName}`,
    async (span) => {
      span.setAttributes({
        "tool.name": toolName,
        "tool.args_count": Object.keys(args).length,
        ...(context?.correlationId ? { "szl.correlation_id": context.correlationId } : {}),
        ...(context?.orgId ? { "szl.org_id": context.orgId } : {}),
        ...(context?.agentId ? { "szl.agent_id": context.agentId } : {}),
        ...(context?.domain ? { "szl.domain": context.domain } : {}),
      });
      return callback(span);
    },
    { kind: api.SpanKind.INTERNAL },
  );
}

/**
 * Span for a Drizzle/PostgreSQL database query.
 */
export async function dbSpan<T>(
  operation: string,
  table: string,
  callback: SpanCallback<T>,
): Promise<T> {
  return startSpan(
    `db.${operation}`,
    async (span) => {
      span.setAttributes({
        "db.system": "postgresql",
        "db.operation": operation,
        "db.sql.table": table,
      });
      return callback(span);
    },
    { kind: api.SpanKind.CLIENT },
  );
}

/**
 * Span for an outbound HTTP / external API call.
 */
export async function httpOutboundSpan<T>(
  url: string,
  method: string,
  callback: SpanCallback<T>,
  context?: { correlationId?: string; service?: string },
): Promise<T> {
  const parsedUrl = new URL(url);
  return startSpan(
    `http.${method.toUpperCase()} ${parsedUrl.hostname}${parsedUrl.pathname}`,
    async (span) => {
      span.setAttributes({
        "http.method": method.toUpperCase(),
        "http.url": url,
        "net.peer.name": parsedUrl.hostname,
        ...(context?.correlationId ? { "szl.correlation_id": context.correlationId } : {}),
        ...(context?.service ? { "peer.service": context.service } : {}),
      });
      return callback(span);
    },
    { kind: api.SpanKind.CLIENT },
  );
}

/**
 * Span for a background job execution.
 */
export async function jobSpan<T>(
  jobType: string,
  jobId: string,
  callback: SpanCallback<T>,
  context?: { correlationId?: string; orgId?: number },
): Promise<T> {
  return startSpan(
    `job.${jobType}`,
    async (span) => {
      span.setAttributes({
        "szl.job.type": jobType,
        "szl.job.id": jobId,
        ...(context?.correlationId ? { "szl.correlation_id": context.correlationId } : {}),
        ...(context?.orgId ? { "szl.org_id": context.orgId } : {}),
      });
      return callback(span);
    },
    { kind: api.SpanKind.INTERNAL },
  );
}
