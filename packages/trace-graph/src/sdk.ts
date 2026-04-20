import { randomUUID } from 'crypto';
import { defaultQueryEngine, type TraceQueryEngine } from './query.js';
import type {
  MemoryIORecord,
  RetrievalRecord,
  ToolCallRecord,
  TraceRecord,
  TraceSpan,
} from './schema.js';
import { defaultTraceStore } from './store.js';
import { TraceWriter } from './writer.js';

export interface TraceContext {
  traceId: string;
  requestId?: string;
  sessionId?: string;
  workflowId?: string;
  agentId?: string;
  userId?: string;
  operatorId?: string;
  domain?: string;
  model?: string;
  promptVersion?: string;
}

export interface SpanOptions {
  name: string;
  attributes?: Record<string, unknown>;
  parentSpanId?: string;
}

export class TraceSession {
  readonly traceId: string;
  private readonly writer: TraceWriter;
  private readonly queryEngine: TraceQueryEngine;
  private readonly activeSpans = new Map<string, { span: TraceSpan; startedAt: bigint }>();

  constructor(
    ctx: TraceContext,
    writer: TraceWriter,
    queryEngine: TraceQueryEngine = defaultQueryEngine,
  ) {
    this.traceId = ctx.traceId;
    this.writer = writer;
    this.queryEngine = queryEngine;
    this.writer.startTrace({
      traceId: ctx.traceId,
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      workflowId: ctx.workflowId,
      agentId: ctx.agentId,
      model: ctx.model,
      promptVersion: ctx.promptVersion,
      metadata: {
        userId: ctx.userId,
        operatorId: ctx.operatorId,
        domain: ctx.domain,
      },
    });
  }

  startSpan(options: SpanOptions): string {
    const spanId = randomUUID();
    const now = new Date().toISOString();
    const span: TraceSpan = {
      spanId,
      parentSpanId: options.parentSpanId,
      name: options.name,
      startedAt: now,
      status: 'pending',
      attributes: options.attributes ?? {},
    };
    this.activeSpans.set(spanId, { span, startedAt: process.hrtime.bigint() });
    return spanId;
  }

  endSpan(
    spanId: string,
    opts: {
      status?: TraceSpan['status'];
      errorMessage?: string;
      attributes?: Record<string, unknown>;
    } = {},
  ): void {
    const entry = this.activeSpans.get(spanId);
    if (!entry) return;
    const latencyMs = Number(process.hrtime.bigint() - entry.startedAt) / 1e6;
    const now = new Date().toISOString();
    const completed: TraceSpan = {
      ...entry.span,
      endedAt: now,
      latencyMs,
      status: opts.status ?? 'ok',
      errorMessage: opts.errorMessage,
      attributes: { ...entry.span.attributes, ...(opts.attributes ?? {}) },
    };
    this.writer.appendSpan(this.traceId, completed);
    this.activeSpans.delete(spanId);
  }

  recordToolCall(record: ToolCallRecord): void {
    this.writer.appendToolCall(this.traceId, record);
  }

  recordRetrieval(record: RetrievalRecord): void {
    this.writer.appendRetrieval(this.traceId, record);
  }

  recordMemoryIO(record: MemoryIORecord): void {
    this.writer.appendMemoryIO(this.traceId, record);
  }

  recordError(code: string, message: string): void {
    this.writer.recordError(this.traceId, code, message);
  }

  linkEntity(entityId: string, role?: string): void {
    this.queryEngine.linkEntityToTrace(this.traceId, entityId);
    const trace = this.writer['store']['get']?.(this.traceId);
    if (trace) {
      const links: Array<{ entityId: string; role: string }> =
        (trace.metadata?.['entityLinks'] as Array<{ entityId: string; role: string }>) ?? [];
      links.push({ entityId, role: role ?? 'touched' });
      trace.metadata = { ...trace.metadata, entityLinks: links };
      this.writer['store']['save']?.(trace);
    }
  }

  complete(params: Parameters<TraceWriter['completeTrace']>[1] = {}): TraceRecord {
    for (const [spanId] of this.activeSpans) {
      this.endSpan(spanId, { status: 'ok' });
    }
    return this.writer.completeTrace(this.traceId, params);
  }

  fail(code: string, message: string): TraceRecord {
    this.recordError(code, message);
    for (const [spanId] of this.activeSpans) {
      this.endSpan(spanId, { status: 'error', errorMessage: message });
    }
    return this.writer.completeTrace(this.traceId, { status: 'failed' });
  }
}

export class TraceSdk {
  private readonly writer: TraceWriter;
  private readonly queryEngine: TraceQueryEngine;

  constructor(
    writer: TraceWriter = new TraceWriter(defaultTraceStore),
    queryEngine: TraceQueryEngine = defaultQueryEngine,
  ) {
    this.writer = writer;
    this.queryEngine = queryEngine;
  }

  startSession(ctx: Omit<TraceContext, 'traceId'> & { traceId?: string }): TraceSession {
    const traceId = ctx.traceId ?? randomUUID();
    return new TraceSession({ ...ctx, traceId }, this.writer, this.queryEngine);
  }

  wrapToolCall<TArgs extends unknown[], TResult>(
    session: TraceSession,
    toolId: string,
    toolName: string,
    fn: (...args: TArgs) => Promise<TResult>,
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const spanId = session.startSpan({ name: `tool:${toolName}` });
      const start = Date.now();
      let success = false;
      try {
        const result = await fn(...args);
        success = true;
        session.endSpan(spanId, { status: 'ok' });
        session.recordToolCall({
          toolId,
          toolName,
          latencyMs: Date.now() - start,
          success: true,
          retries: 0,
          approvalRequired: false,
        });
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        session.endSpan(spanId, { status: 'error', errorMessage: msg });
        session.recordToolCall({
          toolId,
          toolName,
          latencyMs: Date.now() - start,
          success: false,
          errorCode: 'TOOL_ERROR',
          retries: 0,
          approvalRequired: false,
        });
        throw err;
      }
    };
  }

  wrapModelCall<TResult>(
    session: TraceSession,
    model: string,
    fn: () => Promise<{ result: TResult; tokens?: number; cost?: number }>,
  ): () => Promise<TResult> {
    return async (): Promise<TResult> => {
      const spanId = session.startSpan({ name: `model:${model}`, attributes: { model } });
      const start = Date.now();
      try {
        const { result, tokens, cost } = await fn();
        session.endSpan(spanId, { status: 'ok', attributes: { tokens, cost } });
        session.recordToolCall({
          toolId: `model:${model}`,
          toolName: model,
          latencyMs: Date.now() - start,
          tokens,
          costUsd: cost,
          success: true,
          retries: 0,
          approvalRequired: false,
        });
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        session.endSpan(spanId, { status: 'error', errorMessage: msg });
        throw err;
      }
    };
  }
}

export const defaultSdk = new TraceSdk();
