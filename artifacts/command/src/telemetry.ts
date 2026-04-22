import { type Attributes, SpanStatusCode, type Tracer, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

const ATTR_SERVICE_NAME = 'service.name';
const ATTR_SERVICE_VERSION = 'service.version';
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

const SERVICE_NAME = 'command-web';
const TRACER_NAME = 'command-web';

let initialised = false;
let tracer: Tracer | null = null;

export interface TelemetryInitOptions {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  endpoint?: string;
}

export function initTelemetry(opts: TelemetryInitOptions = {}): Tracer {
  if (initialised && tracer) return tracer;

  const env = import.meta.env;
  const endpoint = opts.endpoint ?? env.VITE_OTEL_ENDPOINT ?? '';
  const environment = opts.environment ?? env.MODE ?? 'development';

  // Optional auth headers for hosted OTLP collectors (Honeycomb, Grafana
  // Cloud, Datadog, etc.). Format: comma-separated `Header=Value` pairs,
  // matching the OTel SDK convention for OTEL_EXPORTER_OTLP_HEADERS.
  // Examples:
  //   VITE_OTEL_HEADERS="x-honeycomb-team=hcaik_xxx"
  //   VITE_OTEL_HEADERS="Authorization=Basic <b64>,X-Scope-OrgID=12345"  (Grafana)
  //   VITE_OTEL_HEADERS="DD-API-KEY=abc123"                              (Datadog)
  const rawHeaders = (env.VITE_OTEL_HEADERS ?? '').toString().trim();
  const headers: Record<string, string> = {};
  if (rawHeaders) {
    for (const pair of rawHeaders.split(',')) {
      const idx = pair.indexOf('=');
      if (idx <= 0) continue;
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (k && v) headers[k] = v;
    }
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: opts.serviceName ?? SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: opts.serviceVersion ?? '0.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: environment,
  });

  const processors: SpanProcessor[] = [];
  if (endpoint) {
    const trimmed = endpoint.replace(/\/+$/, '');
    // Append `/v1/traces` only when the operator gave us a base URL (no path
    // beyond the host). If the URL already includes any path segment (e.g.
    // Datadog's `/api/v0.2/traces`, Grafana's `/otlp/v1/traces`, or a
    // collector route prefix), respect it verbatim — appending blindly would
    // produce a 404 like `/api/v0.2/traces/v1/traces`.
    let url: string;
    try {
      const parsed = new URL(trimmed);
      const hasPath = parsed.pathname && parsed.pathname !== '/';
      url = hasPath ? trimmed : `${trimmed}/v1/traces`;
    } catch {
      // Not a parseable URL — fall back to the simple suffix check.
      url = trimmed.endsWith('/v1/traces') ? trimmed : `${trimmed}/v1/traces`;
    }
    const exporter = new OTLPTraceExporter({
      url,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });
    processors.push(
      new BatchSpanProcessor(exporter, {
        maxExportBatchSize: 64,
        scheduledDelayMillis: 1500,
      }),
    );
    if (typeof console !== 'undefined') {
    }
  } else if (environment !== 'production') {
    processors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  } else if (typeof console !== 'undefined') {
  }

  const provider = new WebTracerProvider({ resource, spanProcessors: processors });
  provider.register();

  tracer = trace.getTracer(TRACER_NAME);
  initialised = true;
  return tracer;
}

export function getTracer(): Tracer {
  if (!tracer) return initTelemetry();
  return tracer;
}

export interface TracedSpanResult<T> {
  result: T;
  durationMs: number;
}

function toAttributes(input: Record<string, unknown>): Attributes {
  const out: Attributes = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else if (
      Array.isArray(v) &&
      v.every((x) => typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean')
    ) {
      out[k] = v as Attributes[string];
    } else {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = String(v);
      }
    }
  }
  return out;
}

export interface RecordSpanInput {
  name: string;
  attributes?: Record<string, unknown>;
  durationMs: number;
  status?: 'ok' | 'error';
  errorMessage?: string;
}

export function recordSpan(input: RecordSpanInput): void {
  const t = getTracer();
  const start = Date.now() - Math.max(0, Math.round(input.durationMs));
  const span = t.startSpan(input.name, {
    startTime: start,
    attributes: toAttributes(input.attributes ?? {}),
  });
  if (input.status === 'error') {
    span.setStatus({ code: SpanStatusCode.ERROR, message: input.errorMessage });
    if (input.errorMessage) span.recordException({ name: 'Error', message: input.errorMessage });
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }
  span.end(start + Math.max(0, Math.round(input.durationMs)));
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const t = getTracer();
  const span = t.startSpan(name, { attributes: toAttributes(attributes) });
  const start = performance.now();
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('app.duration_ms', Math.round(performance.now() - start));
    span.end();
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    span.setStatus({ code: SpanStatusCode.ERROR, message });
    span.recordException(err instanceof Error ? err : new Error(message));
    span.setAttribute('app.duration_ms', Math.round(performance.now() - start));
    span.end();
    throw err;
  }
}
