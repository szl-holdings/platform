import * as api from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { getEnv } from '@szl-holdings/env';

let otelInitialized = false;
let _provider: BasicTracerProvider | NodeTracerProvider | null = null;
let inMemoryExporter: InMemorySpanExporter | null = null;

export interface OtelConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  exportToAzureMonitor?: boolean;
  exportToNewRelic?: boolean;
  exportToConsole?: boolean;
}

export interface ActorContext {
  actorId?: string;
  actorType?: 'human' | 'agent' | 'system' | 'external';
  actorRole?: string;
  actorDisplayName?: string;
  actorSessionId?: string;
}

export interface SpanContext {
  correlationId?: string;
  requestId?: string;
  workspaceId?: string;
  workspaceName?: string;
  organizationId?: string;
  environment?: string;
  actor?: ActorContext;
  workflowId?: string;
  workflowType?: string;
  workflowStep?: string;
  workflowStepIndex?: number;
  policyId?: string;
  approvalId?: string;
}

export interface Span {
  setAttributes(attributes: Record<string, string | number | boolean>): Span;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): Span;
  setStatus(status: 'ok' | 'error', message?: string): Span;
  end(): void;
  spanContext(): api.SpanContext;
}

class OtelSpanWrapper implements Span {
  constructor(private nativeSpan: api.Span) {}

  setAttributes(attributes: Record<string, string | number | boolean>): Span {
    this.nativeSpan.setAttributes(attributes);
    return this;
  }

  addEvent(name: string, attributes?: Record<string, string | number | boolean>): Span {
    this.nativeSpan.addEvent(name, attributes);
    return this;
  }

  setStatus(status: 'ok' | 'error', message?: string): Span {
    this.nativeSpan.setStatus({
      code: status === 'ok' ? api.SpanStatusCode.OK : api.SpanStatusCode.ERROR,
      ...(message !== undefined ? { message } : {}),
    });
    return this;
  }

  end(): void {
    this.nativeSpan.end();
  }

  spanContext(): api.SpanContext {
    return this.nativeSpan.spanContext();
  }
}

class NoOpSpan implements Span {
  setAttributes(_: Record<string, string | number | boolean>): Span {
    return this;
  }
  addEvent(_: string, __?: Record<string, string | number | boolean>): Span {
    return this;
  }
  setStatus(_: 'ok' | 'error', __?: string): Span {
    return this;
  }
  end(): void {}
  spanContext(): api.SpanContext {
    return { traceId: '0'.repeat(32), spanId: '0'.repeat(16), traceFlags: 0, isRemote: false };
  }
}

type SpanCallback<T> = (span: Span) => T | Promise<T>;

export function buildActorAttributes(actor: ActorContext): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (actor.actorId) attrs['szl.actor.id'] = actor.actorId;
  if (actor.actorType) attrs['szl.actor.type'] = actor.actorType;
  if (actor.actorRole) attrs['szl.actor.role'] = actor.actorRole;
  if (actor.actorDisplayName) attrs['szl.actor.display_name'] = actor.actorDisplayName;
  if (actor.actorSessionId) attrs['szl.actor.session.id'] = actor.actorSessionId;
  return attrs;
}

export function buildContextAttributes(ctx: SpanContext): Record<string, string | number> {
  const attrs: Record<string, string | number> = {};
  if (ctx.correlationId) attrs['szl.correlation.id'] = ctx.correlationId;
  if (ctx.requestId) attrs['szl.request.id'] = ctx.requestId;
  if (ctx.workspaceId) attrs['szl.workspace.id'] = ctx.workspaceId;
  if (ctx.workspaceName) attrs['szl.workspace.name'] = ctx.workspaceName;
  if (ctx.organizationId) attrs['szl.organization.id'] = ctx.organizationId;
  attrs['szl.environment'] = ctx.environment ?? getEnv().NODE_ENV;
  if (ctx.workflowId) attrs['szl.workflow.id'] = ctx.workflowId;
  if (ctx.workflowType) attrs['szl.workflow.type'] = ctx.workflowType;
  if (ctx.workflowStep) attrs['szl.workflow.step'] = ctx.workflowStep;
  if (ctx.workflowStepIndex !== undefined) attrs['szl.workflow.step.index'] = ctx.workflowStepIndex;
  if (ctx.policyId) attrs['szl.policy.id'] = ctx.policyId;
  if (ctx.approvalId) attrs['szl.approval.id'] = ctx.approvalId;
  if (ctx.actor) Object.assign(attrs, buildActorAttributes(ctx.actor));
  return attrs;
}

class OtelTracer {
  private serviceName: string;
  private tracer: api.Tracer;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.tracer = api.trace.getTracer(serviceName);
  }

  refreshTracer(): void {
    this.tracer = api.trace.getTracer(this.serviceName);
  }

  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    try {
      const nativeSpan = this.tracer.startSpan(name, {
        attributes: attributes as api.Attributes,
      });
      return new OtelSpanWrapper(nativeSpan);
    } catch {
      return new NoOpSpan();
    }
  }

  async withSpan<T>(
    name: string,
    fn: SpanCallback<T>,
    attributes?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const nativeSpan = this.tracer.startSpan(name, {
      attributes: attributes as api.Attributes,
    });
    const ctx = api.trace.setSpan(api.context.active(), nativeSpan);

    return api.context.with(ctx, async () => {
      const spanWrapper = new OtelSpanWrapper(nativeSpan);
      try {
        const result = await fn(spanWrapper);
        nativeSpan.setStatus({ code: api.SpanStatusCode.OK });
        return result;
      } catch (err) {
        nativeSpan.setStatus({ code: api.SpanStatusCode.ERROR, message: (err as Error).message });
        nativeSpan.recordException(err as Error);
        throw err;
      } finally {
        nativeSpan.end();
      }
    });
  }

  async withContextSpan<T>(name: string, ctx: SpanContext, fn: SpanCallback<T>): Promise<T> {
    const attrs = buildContextAttributes(ctx);
    return this.withSpan(name, fn, attrs as Record<string, string | number | boolean>);
  }

  async withActorSpan<T>(
    name: string,
    actor: ActorContext,
    fn: SpanCallback<T>,
    extraAttrs?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const actorAttrs = buildActorAttributes(actor);
    const allAttrs: Record<string, string | number | boolean> = {
      ...actorAttrs,
      ...extraAttrs,
    };
    return this.withSpan(name, fn, allAttrs);
  }

  getServiceName(): string {
    return this.serviceName;
  }

  getActiveSpanId(): string | undefined {
    const active = api.trace.getActiveSpan();
    return active ? active.spanContext().spanId : undefined;
  }

  getActiveTraceId(): string | undefined {
    const active = api.trace.getActiveSpan();
    return active ? active.spanContext().traceId : undefined;
  }
}

let globalTracer: OtelTracer | null = null;

export function getTracer(): OtelTracer {
  if (!globalTracer) {
    globalTracer = new OtelTracer(getEnv().OTEL_SERVICE_NAME);
  }
  return globalTracer;
}

export async function initializeOpenTelemetry(config: OtelConfig): Promise<void> {
  if (otelInitialized) return;

  const contextManager = new AsyncLocalStorageContextManager();
  contextManager.enable();
  api.context.setGlobalContextManager(contextManager);

  api.propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const activeExporters: string[] = [];
  const spanProcessors: import('@opentelemetry/sdk-trace-base').SpanProcessor[] = [];

  const _env = getEnv();
  const isDevMode = _env.NODE_ENV !== 'production';
  const enableInMemory = isDevMode || _env.OTEL_IN_MEMORY;
  if (enableInMemory) {
    inMemoryExporter = new InMemorySpanExporter();
    spanProcessors.push(new SimpleSpanProcessor(inMemoryExporter));
    activeExporters.push('in-memory');
    const MAX_IN_MEMORY_SPANS = 2000;
    const memoryRotationTimer = setInterval(() => {
      const count = inMemoryExporter?.getFinishedSpans().length ?? 0;
      if (count > MAX_IN_MEMORY_SPANS) {
        inMemoryExporter?.reset();
      }
    }, 30_000);
    if (typeof memoryRotationTimer !== 'number' && memoryRotationTimer.unref) {
      memoryRotationTimer.unref();
    }
  }

  const otlpEndpoint =
    config.otlpEndpoint ?? _env.OTLP_ENDPOINT ?? _env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (otlpEndpoint) {
    const normalizedEndpoint = otlpEndpoint.replace(/\/+$/, '');
    const otlpUrl = normalizedEndpoint.endsWith('/v1/traces')
      ? normalizedEndpoint
      : `${normalizedEndpoint}/v1/traces`;
    const otlpExporter = new OTLPTraceExporter({ url: otlpUrl });
    spanProcessors.push(new BatchSpanProcessor(otlpExporter));
    activeExporters.push(`otlp:${otlpEndpoint}`);
  }

  if (config.exportToConsole || _env.OTEL_CONSOLE_EXPORT) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    activeExporters.push('console');
  }

  const resource = resourceFromAttributes({
    'service.name': config.serviceName,
    'service.version': config.serviceVersion ?? process.env.npm_package_version ?? '0.0.0',
    'deployment.environment': _env.NODE_ENV,
  });

  // NodeTracerProvider extends BasicTracerProvider with Node-specific
  // context propagation defaults. Required by task #5149 so that
  // orchestration proof spans (and every other span emitted via the
  // global tracer) are exported to a real OTLP collector when
  // OTEL_EXPORTER_OTLP_ENDPOINT is set in production.
  const tracerProvider = new NodeTracerProvider({ spanProcessors, resource });
  _provider = tracerProvider;

  api.trace.setGlobalTracerProvider(tracerProvider);

  globalTracer = new OtelTracer(config.serviceName);
  globalTracer.refreshTracer();

  otelInitialized = true;
}

export function isOtelInitialized(): boolean {
  return otelInitialized;
}

export function getOtelConfig(): {
  serviceName: string;
  otlpEndpoint?: string;
  azureMonitor: boolean;
  newRelic: boolean;
  initialized: boolean;
} {
  const _env = getEnv();
  const otlpEndpoint = _env.OTLP_ENDPOINT ?? _env.OTEL_EXPORTER_OTLP_ENDPOINT;
  return {
    serviceName: _env.OTEL_SERVICE_NAME,
    ...(otlpEndpoint !== undefined ? { otlpEndpoint } : {}),
    azureMonitor: !!_env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
    newRelic: !!_env.NEW_RELIC_LICENSE_KEY,
    initialized: otelInitialized,
  };
}

export function getInMemorySpans() {
  return inMemoryExporter?.getFinishedSpans() ?? [];
}

export function flushInMemorySpans() {
  inMemoryExporter?.reset();
}

/**
 * Flush all pending spans and shut down the tracer provider.
 *
 * Call this during graceful process shutdown so that spans buffered in the
 * BatchSpanProcessor are exported to the collector before the process exits.
 * Without this, any spans accumulated since the last batch flush interval are
 * silently dropped.
 *
 * The call is idempotent and resolves even when OTel was never initialized.
 * A timeout guard prevents the flush from blocking shutdown indefinitely if
 * the collector is unreachable.
 */
export async function shutdownTracer(timeoutMs = 5_000): Promise<void> {
  if (!_provider) return;
  try {
    await Promise.race([
      _provider.shutdown(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('OTel provider shutdown timed out')), timeoutMs),
      ),
    ]);
  } catch {
    // Best-effort: a timeout or export error must never block process exit.
  }
}
