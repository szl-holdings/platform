/**
 * NodeSDK bootstrap — wires `LambdaSpanEmitter` to a real OTLP exporter
 * (gRPC or HTTP/protobuf) plus an optional vendor adapter.
 *
 * Env vars (standard OTel + a few VSP-specific):
 *   OTEL_EXPORTER_OTLP_ENDPOINT   — collector URL (e.g. https://api.honeycomb.io)
 *   OTEL_EXPORTER_OTLP_PROTOCOL   — "grpc" | "http/protobuf" (default: http/protobuf)
 *   OTEL_EXPORTER_OTLP_HEADERS    — comma-sep `key=value` pairs (API keys etc.)
 *   OTEL_SERVICE_NAME             — service.name resource attribute (default: vsp-otel)
 *   VSP_OTEL_VENDOR               — "honeycomb" | "datadog" | "phoenix" | "none"
 *                                   (default: none — emit raw gen_ai.* attrs only)
 *
 * Vendor cheatsheet (set these in env to ship somewhere real):
 *   Honeycomb:  OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
 *               OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=YOUR_KEY
 *               VSP_OTEL_VENDOR=honeycomb
 *   Datadog:    OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  (DD agent)
 *               VSP_OTEL_VENDOR=datadog
 *   Phoenix:    OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:6006/v1/traces
 *               VSP_OTEL_VENDOR=phoenix
 *
 * Returns a `shutdown()` you MUST call before process exit so buffered
 * spans flush to the collector.
 */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter as OTLPGrpcExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as OTLPHttpExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  type SpanExporter,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { LambdaSpanEmitter } from './lambda-span-emitter.js';
import type { VspVendor } from './vendor-adapters.js';

export type OtlpProtocol = 'grpc' | 'http/protobuf';

export interface VspNodeSdkOptions {
  /** OTLP endpoint URL. Defaults to env `OTEL_EXPORTER_OTLP_ENDPOINT`. */
  endpoint?: string;
  /** "grpc" or "http/protobuf". Defaults to env or "http/protobuf". */
  protocol?: OtlpProtocol;
  /** Header map (e.g. `{ 'x-honeycomb-team': key }`). Merged with env. */
  headers?: Record<string, string>;
  /** `service.name` resource attribute. Defaults to env or "vsp-otel". */
  serviceName?: string;
  /** Vendor shape adapter. Defaults to env `VSP_OTEL_VENDOR` or "none". */
  vendor?: VspVendor;
  /** Inject your own exporter (e.g. InMemory) — overrides OTLP wiring. */
  exporter?: SpanExporter;
  /** Extra span processors to install before the batch exporter. */
  extraSpanProcessors?: SpanProcessor[];
  /** Enable OTel internal diag logs at the given level. */
  diagLogLevel?: DiagLogLevel;
}

export interface VspNodeSdk {
  /** The underlying NodeSDK instance. Already started. */
  sdk: NodeSDK;
  /** Convenience emitter bound to the SDK's default tracer. */
  emitter: LambdaSpanEmitter;
  /** Flush + shut down the SDK. Call before process exit. */
  shutdown(): Promise<void>;
}

function parseHeaderString(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function resolveProtocol(explicit: OtlpProtocol | undefined): OtlpProtocol {
  if (explicit) return explicit;
  const envProto = process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.toLowerCase();
  if (envProto === 'grpc') return 'grpc';
  return 'http/protobuf';
}

function resolveVendor(explicit: VspVendor | undefined): VspVendor {
  if (explicit) return explicit;
  const v = process.env.VSP_OTEL_VENDOR?.toLowerCase();
  if (v === 'honeycomb' || v === 'datadog' || v === 'phoenix' || v === 'none') {
    return v;
  }
  return 'none';
}

const TRACES_PATH = '/v1/traces';

/**
 * Normalize an OTLP/HTTP endpoint to the full traces URL.
 *
 * The JS OTLP HTTP exporter's `url` is the full per-signal endpoint
 * (e.g. `.../v1/traces`), NOT a base URL. The OTel spec also defines
 * a separate `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` (already full URL)
 * vs. `OTEL_EXPORTER_OTLP_ENDPOINT` (base URL, signal path appended).
 *
 * Resolution rules:
 *   - If the URL already ends in `/v1/traces`, keep it as-is.
 *   - Otherwise append `/v1/traces` (collapsing any duplicate slash).
 *
 * gRPC ignores path components, so this normalization only applies to
 * HTTP/protobuf and HTTP/JSON.
 */
export function normalizeOtlpHttpTracesUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/+$/, '');
  if (trimmed.endsWith(TRACES_PATH)) return trimmed;
  return `${trimmed}${TRACES_PATH}`;
}

/**
 * Resolve the final OTLP/HTTP traces URL given the user's explicit
 * `endpoint` option plus standard OTel env vars. The signal-specific
 * `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` wins (already a full URL); the
 * base `OTEL_EXPORTER_OTLP_ENDPOINT` is normalized via
 * `normalizeOtlpHttpTracesUrl`.
 */
function resolveHttpTracesUrl(explicit: string | undefined): string | undefined {
  const tracesSpecific = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  if (tracesSpecific) return tracesSpecific;
  const base = explicit ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!base) return undefined;
  return normalizeOtlpHttpTracesUrl(base);
}

function buildOtlpExporter(
  protocol: OtlpProtocol,
  endpoint: string | undefined,
  headers: Record<string, string>,
): SpanExporter {
  const config: { url?: string; headers?: Record<string, string> } = {};
  if (Object.keys(headers).length > 0) config.headers = headers;
  if (protocol === 'grpc') {
    // gRPC takes a host[:port] base URL — do NOT append a signal path.
    const grpcEndpoint = endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (grpcEndpoint) config.url = grpcEndpoint;
    return new OTLPGrpcExporter(config);
  }
  const url = resolveHttpTracesUrl(endpoint);
  if (url) config.url = url;
  return new OTLPHttpExporter(config);
}

/**
 * Boot the NodeSDK with OTLP wiring + vendor adapter + LambdaSpanEmitter.
 * Idempotent per-process is the caller's responsibility — calling this
 * twice will start two NodeSDKs.
 */
export function startVspNodeSdk(options: VspNodeSdkOptions = {}): VspNodeSdk {
  if (options.diagLogLevel !== undefined) {
    diag.setLogger(new DiagConsoleLogger(), options.diagLogLevel);
  }

  const protocol = resolveProtocol(options.protocol);
  const endpoint = options.endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const headers = {
    ...parseHeaderString(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    ...(options.headers ?? {}),
  };
  const serviceName =
    options.serviceName ?? process.env.OTEL_SERVICE_NAME ?? 'vsp-otel';
  const vendor = resolveVendor(options.vendor);

  const exporter = options.exporter ?? buildOtlpExporter(protocol, endpoint, headers);

  const spanProcessors: SpanProcessor[] = [];
  if (options.extraSpanProcessors) {
    spanProcessors.push(...options.extraSpanProcessors);
  }
  spanProcessors.push(new BatchSpanProcessor(exporter));

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    spanProcessors,
  });

  sdk.start();

  // Vendor mirroring runs inside the emitter (which owns the span name
  // + axes), not as a SpanProcessor — that keeps the adapter free of
  // any private SDK introspection.
  const emitter = new LambdaSpanEmitter({ tracerName: serviceName, vendor });

  return {
    sdk,
    emitter,
    async shutdown() {
      // Propagate errors — a failed flush means buffered Λ-receipts
      // never reached the collector, and callers must be able to
      // observe that. We log + rethrow so the failure is both visible
      // in OTel diag output and surfaced to the caller's await.
      try {
        await sdk.shutdown();
      } catch (err) {
        diag.error('[vsp-otel] NodeSDK shutdown error', err as Error);
        throw err;
      }
    },
  };
}
