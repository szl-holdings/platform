/**
 * OTLP/HTTP traces receiver — production adapter for the Λ-gate.
 *
 * The SDK's `telemetryPolicyProvider` consumes a `LambdaAxisStream`. In dev
 * we publish to that stream from the same process via
 * `createLambdaAxisStream().publishFromReceipt(...)`. In production the
 * trace data lives in a real OTel collector, so we need a network adapter
 * that receives OTLP exports from the collector (or directly from
 * instrumented services) and republishes the Λ-axes onto the SDK's stream.
 *
 * This file is that adapter. It speaks the OTLP/HTTP JSON wire format
 * (`POST /v1/traces`, `Content-Type: application/json`) — the same encoding
 * `@opentelemetry/otlp-transformer`'s `JsonTraceSerializer` produces — and:
 *
 *   - Authenticates incoming exports against a shared bearer token when
 *     `authToken` is set (returns `401` otherwise).
 *   - Applies backpressure with a body-size cap (`413`), an in-flight
 *     request cap (`429`), and a request-timeout cap.
 *   - Tracks a `connectionState` (`listening` / `receiving` / `stale` /
 *     `closed` / `error`) and fires `onConnectionState` whenever it flips.
 *     The `stale` transition fires within `staleAfterMs` of the most
 *     recent successful export — matching the
 *     `telemetryPolicyProvider`'s own fail-closed window so operators see
 *     a single, coherent "we lost the collector" signal.
 *   - Survives transient listener errors: when the underlying HTTP server
 *     emits `error`, `restart()` reopens it on the same port.
 *
 * Protobuf (`application/x-protobuf`) is intentionally *not* decoded here.
 * The JS otlp-transformer's protobuf request type is not part of its
 * public ESM surface, and reaching into its internals is brittle. Standing
 * up a JSON-emitting collector exporter (or pointing the
 * `otelcol`/Alloy `otlphttp/json` exporter at this endpoint) covers the
 * production path; protobuf support is a follow-up.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { LambdaAxes } from './lambda-span-emitter.js';
import type { LambdaAxisStreamHandle } from './lambda-axis-stream.js';

/** Lifecycle states the receiver surfaces via `onConnectionState`. */
export type ReceiverConnectionState =
  | 'listening'
  | 'receiving'
  | 'stale'
  | 'closed'
  | 'error';

export interface OtlpHttpReceiverOptions {
  /** Stream to publish extracted Λ-axes onto. Usually the same instance
   *  passed to `telemetryPolicyProvider({ stream })`. */
  stream: LambdaAxisStreamHandle;
  /** TCP port to listen on. `0` lets the kernel pick (use `port()` after). */
  port?: number;
  /** Host/interface to bind. Defaults to `0.0.0.0` so collectors on other
   *  pods can reach us; pass `127.0.0.1` to restrict to loopback. */
  host?: string;
  /** When set, requests must carry `Authorization: Bearer <token>`. */
  authToken?: string;
  /** Time without a successful export after which `connectionState` flips
   *  to `stale` and `onConnectionState('stale', ...)` fires. Defaults to
   *  30s — same window as `telemetryPolicyProvider`'s default. */
  staleAfterMs?: number;
  /** Cadence of the freshness watchdog. Defaults to `staleAfterMs / 3`,
   *  clamped to [250ms, 5_000ms]. */
  staleCheckIntervalMs?: number;
  /** Maximum accepted request body. Default 4 MiB — well above a typical
   *  OTLP batch. Exceeding bodies are rejected with `413`. */
  maxBodyBytes?: number;
  /** Maximum concurrent in-flight requests. Default 64 — beyond this we
   *  shed load with `429` rather than queue. */
  maxInFlightRequests?: number;
  /** Per-request hard timeout. Default 10s. */
  requestTimeoutMs?: number;
  /** Fired whenever `connectionState()` transitions. */
  onConnectionState?: (state: ReceiverConnectionState, detail?: string) => void;
  /** Fired for every successfully decoded OTLP request (for metrics). */
  onExport?: (info: { spanCount: number; axisSamplesPublished: number }) => void;
}

export interface OtlpHttpReceiver {
  /** Resolved URL including the `/v1/traces` path. */
  url(): string;
  /** Bound port (useful when `port: 0` was requested). */
  port(): number;
  /** Current lifecycle state. */
  connectionState(): ReceiverConnectionState;
  /** Force the freshness watchdog to evaluate immediately (testing). */
  checkFreshness(): void;
  /** Reopen the listener after an `error` state. */
  restart(): Promise<void>;
  /** Stop the listener and clear timers. */
  close(): Promise<void>;
}

const DEFAULT_PORT = 0;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_STALE_AFTER_MS = 30_000;
const DEFAULT_MAX_BODY_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_INFLIGHT = 64;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const TRACES_PATH = '/v1/traces';

const LAMBDA_AXIS_PREFIX = 'gen_ai.lambda.';
const VALID_AXIS_KEYS: ReadonlySet<keyof LambdaAxes> = new Set([
  'cleanliness',
  'horizon',
  'resonance',
  'frustum',
  'gaussClosure',
  'invariance',
  'moralGrounding',
  'ontologicalGrounding',
  'measurabilityHonesty',
]);

interface OtlpAnyValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: string | number;
  doubleValue?: number;
}

interface OtlpKeyValue {
  key?: string;
  value?: OtlpAnyValue;
}

interface OtlpSpan {
  name?: string;
  startTimeUnixNano?: string | number;
  endTimeUnixNano?: string | number;
  attributes?: OtlpKeyValue[];
}

interface OtlpScopeSpans {
  spans?: OtlpSpan[];
}

interface OtlpResourceSpans {
  scopeSpans?: OtlpScopeSpans[];
  /** Pre-1.0 OTLP used `instrumentationLibrarySpans`. */
  instrumentationLibrarySpans?: OtlpScopeSpans[];
}

interface OtlpExportTraceServiceRequest {
  resourceSpans?: OtlpResourceSpans[];
}

function coerceAxisValue(v: OtlpAnyValue | undefined): number | null {
  if (!v) return null;
  if (typeof v.doubleValue === 'number') return v.doubleValue;
  if (typeof v.intValue === 'number') return v.intValue;
  if (typeof v.intValue === 'string') {
    const n = Number(v.intValue);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v.stringValue === 'string') {
    const n = Number(v.stringValue);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Pull Λ-axes out of a span's OTLP attribute list. Returns `null` when
 * the span has no `gen_ai.lambda.*` attributes — those spans are skipped
 * rather than publishing an empty axis vector (which would inadvertently
 * mark the gate as having fresh telemetry it does not have).
 */
export function extractLambdaAxesFromOtlpAttributes(
  attributes: OtlpKeyValue[] | undefined,
): LambdaAxes | null {
  if (!attributes || attributes.length === 0) return null;
  const out: LambdaAxes = {};
  let found = false;
  for (const kv of attributes) {
    const key = kv.key;
    if (!key || !key.startsWith(LAMBDA_AXIS_PREFIX)) continue;
    const axis = key.slice(LAMBDA_AXIS_PREFIX.length) as keyof LambdaAxes;
    if (!VALID_AXIS_KEYS.has(axis)) continue;
    const n = coerceAxisValue(kv.value);
    if (n === null) continue;
    out[axis] = n;
    found = true;
  }
  return found ? out : null;
}

function nanosToMillis(t: string | number | undefined): number | null {
  if (t === undefined) return null;
  // OTLP timestamps are uint64 nanoseconds. With `useLongBits: false` the
  // JSON encoder emits them as decimal strings; numbers up to 2^53 also
  // fit a JS Number. We divide by 1e6 to get ms-since-epoch.
  const n = typeof t === 'number' ? t : Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n / 1_000_000);
}

function iterSpans(req: OtlpExportTraceServiceRequest): Iterable<OtlpSpan> {
  const spans: OtlpSpan[] = [];
  for (const rs of req.resourceSpans ?? []) {
    const groups = rs.scopeSpans ?? rs.instrumentationLibrarySpans ?? [];
    for (const ss of groups) {
      for (const s of ss.spans ?? []) spans.push(s);
    }
  }
  return spans;
}

function readBody(
  req: IncomingMessage,
  maxBytes: number,
  timeoutMs: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(Object.assign(new Error('request timeout'), { httpStatus: 408 }));
    }, timeoutMs);
    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        settled = true;
        clearTimeout(timer);
        // Drain the rest of the request so we can still write a 413
        // response — destroying the socket here would race the
        // response and fail the client with a socket error.
        req.resume();
        reject(Object.assign(new Error('payload too large'), { httpStatus: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

function writeJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': String(payload.length),
  });
  res.end(payload);
}

/**
 * Start an OTLP/HTTP traces receiver. The returned handle is asynchronous
 * because TCP binding is async — awaiting guarantees `url()` / `port()`
 * are valid by the time you wire downstream consumers to them.
 */
export async function startOtlpHttpReceiver(
  options: OtlpHttpReceiverOptions,
): Promise<OtlpHttpReceiver> {
  const host = options.host ?? DEFAULT_HOST;
  const wantedPort = options.port ?? DEFAULT_PORT;
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  const checkInterval = options.staleCheckIntervalMs
    ?? Math.min(5_000, Math.max(250, Math.floor(staleAfterMs / 3)));
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const maxInFlight = options.maxInFlightRequests ?? DEFAULT_MAX_INFLIGHT;
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const authToken = options.authToken;

  let state: ReceiverConnectionState = 'listening';
  let inFlight = 0;
  let lastExportAt: number | null = null;
  let actualPort = wantedPort;
  let bindPort = wantedPort;
  let server: Server | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;

  function setState(next: ReceiverConnectionState, detail?: string): void {
    if (state === next) return;
    state = next;
    options.onConnectionState?.(next, detail);
  }

  function checkFreshness(): void {
    if (state === 'closed' || state === 'error') return;
    if (lastExportAt === null) return; // never received → stay 'listening'
    const age = Date.now() - lastExportAt;
    if (age > staleAfterMs) {
      setState(
        'stale',
        `no OTLP export received in ${age}ms (>${staleAfterMs}ms threshold)`,
      );
    }
  }

  function handle(req: IncomingMessage, res: ServerResponse): void {
    // Reject anything that isn't the traces endpoint up front — no
    // metrics/logs receiver, no health-check route (collectors don't
    // probe receivers, and an unauthed `/healthz` is a footgun).
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      writeJson(res, 405, { error: 'method not allowed' });
      return;
    }
    const url = req.url ?? '';
    const pathOnly = url.split('?', 1)[0];
    if (pathOnly !== TRACES_PATH) {
      writeJson(res, 404, { error: `unknown path ${pathOnly}` });
      return;
    }
    if (authToken) {
      const auth = req.headers.authorization ?? '';
      const ok =
        auth.startsWith('Bearer ') && auth.slice('Bearer '.length) === authToken;
      if (!ok) {
        writeJson(res, 401, { error: 'invalid bearer token' });
        return;
      }
    }
    const ctype = (req.headers['content-type'] ?? '').toLowerCase();
    if (!ctype.includes('application/json')) {
      // Protobuf bodies are rejected explicitly so the operator gets a
      // clear message rather than a silent parse failure.
      writeJson(res, 415, {
        error: 'unsupported content-type; this receiver decodes application/json OTLP only',
      });
      return;
    }
    if (inFlight >= maxInFlight) {
      res.setHeader('retry-after', '1');
      writeJson(res, 429, { error: 'too many in-flight exports' });
      return;
    }
    inFlight += 1;
    readBody(req, maxBodyBytes, requestTimeoutMs)
      .then((buf) => {
        let parsed: OtlpExportTraceServiceRequest;
        try {
          parsed = JSON.parse(buf.toString('utf8')) as OtlpExportTraceServiceRequest;
        } catch (err) {
          writeJson(res, 400, { error: `invalid JSON: ${(err as Error).message}` });
          return;
        }
        let spanCount = 0;
        let published = 0;
        let latest: { axes: LambdaAxes; observedAt: number } | null = null;
        for (const span of iterSpans(parsed)) {
          spanCount += 1;
          const axes = extractLambdaAxesFromOtlpAttributes(span.attributes);
          if (!axes) continue;
          const ts = nanosToMillis(span.endTimeUnixNano)
            ?? nanosToMillis(span.startTimeUnixNano)
            ?? Date.now();
          // Publish the freshest sample in the batch last so the
          // provider's `latest()` lines up with the most recent span.
          if (!latest || ts >= latest.observedAt) {
            latest = { axes, observedAt: ts };
          } else {
            options.stream.publish(axes, ts);
            published += 1;
          }
        }
        if (latest) {
          options.stream.publish(latest.axes, latest.observedAt);
          published += 1;
        }
        lastExportAt = Date.now();
        setState('receiving', `accepted ${spanCount} span(s), ${published} axis sample(s)`);
        options.onExport?.({ spanCount, axisSamplesPublished: published });
        // OTLP spec response: empty `ExportTraceServiceResponse{}` on success.
        writeJson(res, 200, {});
      })
      .catch((err: Error & { httpStatus?: number }) => {
        const status = err.httpStatus ?? 500;
        writeJson(res, status, { error: err.message });
      })
      .finally(() => {
        inFlight -= 1;
      });
  }

  async function listen(): Promise<void> {
    server = createServer(handle);
    server.on('error', (err) => {
      setState('error', `listener error: ${err.message}`);
    });
    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error): void => {
        server?.off('listening', onListening);
        reject(err);
      };
      const onListening = (): void => {
        server?.off('error', onError);
        const addr = server?.address();
        if (addr && typeof addr === 'object') {
          actualPort = (addr as AddressInfo).port;
          // Sticky-bind: after the kernel picks a port for us on
          // first listen, restart() must reuse it so downstream
          // collectors don't have to rediscover the endpoint.
          bindPort = actualPort;
        }
        resolve();
      };
      server!.once('error', onError);
      server!.once('listening', onListening);
      server!.listen(bindPort, host);
    });
    setState('listening', `bound ${host}:${actualPort}`);
  }

  async function stopListening(): Promise<void> {
    if (!server) return;
    const s = server;
    server = null;
    await new Promise<void>((resolve) => {
      s.close(() => resolve());
      // Don't keep open keep-alive sockets around.
      s.closeAllConnections?.();
    });
  }

  await listen();
  watchdog = setInterval(checkFreshness, checkInterval);
  watchdog.unref?.();

  return {
    url() {
      const displayHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
      return `http://${displayHost}:${actualPort}${TRACES_PATH}`;
    },
    port() {
      return actualPort;
    },
    connectionState() {
      return state;
    },
    checkFreshness,
    async restart() {
      await stopListening();
      await listen();
    },
    async close() {
      if (watchdog) {
        clearInterval(watchdog);
        watchdog = null;
      }
      await stopListening();
      setState('closed', 'receiver closed');
    },
  };
}
