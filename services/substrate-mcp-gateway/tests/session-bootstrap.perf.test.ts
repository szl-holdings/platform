/**
 * Substrate MCP Gateway — Session Bootstrap Load Test (all transports)
 *
 * Task #5069 introduced this benchmark for the Streamable HTTP transport.
 * Task #5210 extends it to cover the other two transports the gateway
 * exposes, so the cheap-session win from task #5068 is protected across
 * the full surface:
 *
 *   1. Streamable HTTP (POST /mcp)              — MCP 2025 spec
 *   2. Legacy SSE      (GET /mcp/sse + POST /mcp/message) — MCP 2024-11-05
 *   3. stdio           (simulated in-process via InMemoryTransport pairs)
 *
 * All three transports share the same singleton PRAXISMcpServer +
 * multiplexing-transport path; the per-session work should therefore be
 * limited to:
 *   - one per-session transport allocation
 *     (StreamableHTTPServerTransport / SSEServerTransport / InMemoryTransport),
 *   - one MultiplexingTransport sub-session registration via
 *     `PRAXISMcpServer.attachSession()`, and
 *   - the SDK's `initialize` round-trip.
 *
 * If a future change reintroduces a per-session DB call, a per-session
 * `new PRAXISMcpServer()`, or a per-session domain-roots scan on any
 * transport, the corresponding benchmark fails loudly via the documented
 * thresholds below.
 *
 * Note on the stdio benchmark: real stdio sessions are one-per-process, so
 * a true child-process benchmark would mostly measure Node startup cost
 * (~100ms/process) rather than per-session bootstrap. We instead simulate
 * stdio-shaped sessions in-process by attaching `InMemoryTransport` pairs
 * to the shared gateway server via the same `attachSession()` path the
 * other transports use. This isolates the gateway-side cost we actually
 * care about (allocation + multiplexer registration + initialize) and
 * keeps the benchmark deterministic on CI.
 *
 * What each test does:
 *   1. Boots the gateway (HTTP transport for HTTP-based tests; shared
 *      PRAXISMcpServer is reused across all three).
 *   2. Opens a few warm-up sessions so the singleton server, PQC
 *      identity, domain roots, and domain Apps are all built before
 *      measurement.
 *   3. Opens SESSIONS concurrent fresh sessions, recording the wall-clock
 *      duration of each `initialize` round-trip.
 *   4. Snapshots heap usage before/after, attributes the delta per
 *      session.
 *   5. Asserts P50 / P95 / heap-per-session against documented baselines.
 *
 * A unified report is printed at the end with one row per transport so
 * regressions can be spotted at a glance.
 *
 * Run on demand:
 *   pnpm --filter @szl/substrate-mcp-gateway test:perf
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import express from 'express';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { createHttpTransport } from '../src/transport/http.js';
import { getGatewayServer } from '../src/nexus-gateway-server.js';

// ─── Tunables ────────────────────────────────────────────────────────────────

const SESSIONS = Number(process.env.MCP_PERF_SESSIONS ?? '100');
// Concurrency is capped at undici's default per-origin socket pool (6) so
// the measured P95 reflects server-side bootstrap cost, not client-side
// socket-pool queueing. Bump via the env var to stress the server harder
// (P95 will then bake in HTTP keep-alive contention too).
const CONCURRENCY = Number(process.env.MCP_PERF_CONCURRENCY ?? '6');

// ─── Documented baselines ────────────────────────────────────────────────────
//
// These thresholds were chosen with a wide margin over measured numbers on
// the CI container as of tasks #5069 / #5210 so transient noise doesn't
// flake the suite, while still being tight enough to detect a regression
// that reintroduces meaningful per-session work (e.g. an extra DB
// round-trip adds ~5-20ms on local Postgres, a fresh PRAXISMcpServer +
// tool registration adds ~30-100ms).
//
// Per-transport baselines:
//   - streamable-http: real HTTP roundtrip, so its thresholds bake in
//     socket setup, JSON framing, and keep-alive contention.
//   - legacy-sse: driven in-process against a real `SSEServerTransport`
//     with mock req/res — no socket cost, but still pays SSE-frame
//     serialization + the SDK's `handlePostMessage` → `handleMessage`
//     → `onmessage` → multiplexer dispatch + async `send()` back to the
//     mock stream. Tighter than streamable-http, looser than stdio.
//   - stdio: in-process via `InMemoryTransport` linked pair, no framing
//     at all — tightest baseline.
//
// If you find yourself loosening these, ask whether you just regressed
// task #5059 / #5068 instead.

interface PerfBaseline {
  p50Ms: number;
  p95Ms: number;
  heapPerSessionKb: number;
}

const BASELINES: Record<TransportName, PerfBaseline> = {
  'streamable-http': { p50Ms: 50, p95Ms: 150, heapPerSessionKb: 256 },
  'legacy-sse': { p50Ms: 75, p95Ms: 200, heapPerSessionKb: 384 },
  stdio: { p50Ms: 10, p95Ms: 50, heapPerSessionKb: 256 },
};

type TransportName = 'streamable-http' | 'legacy-sse' | 'stdio';

// ─── Test server ─────────────────────────────────────────────────────────────

let server: http.Server;
let baseUrl: string;

const TEST_API_KEY = 'perf-key-5069';
process.env.SUBSTRATE_GATEWAY_API_KEY = TEST_API_KEY;
process.env.NODE_ENV = 'test';

before(async () => {
  const app = express();
  app.use('/mcp', createHttpTransport());
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

// ─── Shared types & helpers ──────────────────────────────────────────────────

interface SessionResult {
  durationMs: number;
  sessionId: string | null;
  status: number;
  ok: boolean;
  failure?: string;
}

interface PerfReport {
  transport: TransportName;
  sessions: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  heapDeltaKb: number;
  heapPerSessionKb: number;
  baseline: PerfBaseline;
  passed: boolean;
}

const reports: PerfReport[] = [];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx] ?? 0;
}

async function runWithConcurrency<T>(
  count: number,
  concurrency: number,
  worker: (i: number) => Promise<T>,
): Promise<T[]> {
  const results: T[] = new Array(count);
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, count) }, async () => {
    while (true) {
      const i = next++;
      if (i >= count) return;
      results[i] = await worker(i);
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * Run a benchmark trial against a single transport. Performs three warm-up
 * sessions to stabilize V8 inlining + amortize first-init cost, then opens
 * SESSIONS fresh sessions at CONCURRENCY parallelism and measures P50/P95
 * latency plus heap delta per session.
 *
 * The result is appended to `reports` for the trailing unified-report
 * assertion, and immediate per-transport baseline assertions are also
 * fired so a regression is attributed to the correct transport.
 */
async function runTrial(
  name: TransportName,
  open: () => Promise<SessionResult>,
): Promise<void> {
  // Warm-up: triggers (on the first transport to run) singleton
  // PRAXISMcpServer construction, PQC identity bootstrap, domain root
  // enumeration, and domain App registration. Subsequent transports reuse
  // the same singleton so their warm-up only amortizes V8 / pool effects.
  const warm = await open();
  assert.ok(warm.ok, `[${name}] warm-up session must initialize successfully: ${warm.failure ?? 'unknown'}`);
  for (let i = 0; i < 2; i++) {
    const extra = await open();
    assert.ok(extra.ok, `[${name}] warm-up session ${i + 2} failed: ${extra.failure ?? 'unknown'}`);
  }

  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;

  const measured = await runWithConcurrency(SESSIONS, CONCURRENCY, () => open());

  if (global.gc) global.gc();
  const heapAfter = process.memoryUsage().heapUsed;

  const failures = measured.filter((m) => !m.ok);
  if (failures.length > 0) {
    const sample = failures.slice(0, 5).map((f) => f.failure ?? 'unknown').join('; ');
    assert.fail(
      `[${name}] ${failures.length}/${SESSIONS} sessions failed to initialize. First failures: ${sample}`,
    );
  }

  const durations = measured.map((m) => m.durationMs).sort((a, b) => a - b);
  const p50 = quantile(durations, 0.5);
  const p95 = quantile(durations, 0.95);
  const p99 = quantile(durations, 0.99);
  const mean = durations.reduce((s, n) => s + n, 0) / durations.length;
  const heapDeltaBytes = heapAfter - heapBefore;
  const heapPerSessionKb = heapDeltaBytes / SESSIONS / 1024;

  const baseline = BASELINES[name];
  const passed =
    p50 < baseline.p50Ms && p95 < baseline.p95Ms && heapPerSessionKb < baseline.heapPerSessionKb;

  reports.push({
    transport: name,
    sessions: SESSIONS,
    meanMs: mean,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    heapDeltaKb: heapDeltaBytes / 1024,
    heapPerSessionKb,
    baseline,
    passed,
  });

  assert.ok(
    p50 < baseline.p50Ms,
    `[${name}] P50 session-bootstrap regressed: ${p50.toFixed(2)}ms >= baseline ${baseline.p50Ms}ms — ` +
      `did task #5059 / #5068 caching get undone (e.g. a per-session DB call or per-session PRAXISMcpServer)?`,
  );
  assert.ok(
    p95 < baseline.p95Ms,
    `[${name}] P95 session-bootstrap regressed: ${p95.toFixed(2)}ms >= baseline ${baseline.p95Ms}ms`,
  );
  assert.ok(
    heapPerSessionKb < baseline.heapPerSessionKb,
    `[${name}] Per-session heap growth regressed: ${heapPerSessionKb.toFixed(2)}KB >= baseline ${baseline.heapPerSessionKb}KB — ` +
      `a per-session allocation may have been reintroduced (e.g. fresh server, fresh tool registry, leaked closures).`,
  );
}

// ─── Transport 1: Streamable HTTP (POST /mcp) ────────────────────────────────

async function openStreamableHttpSession(): Promise<SessionResult> {
  const start = performance.now();
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${TEST_API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'perf-harness', version: '1.0.0' },
      },
    }),
  });

  const ct = res.headers.get('content-type') ?? '';
  const text = await res.text();
  const durationMs = performance.now() - start;
  const sessionId = res.headers.get('mcp-session-id');

  let body: { result?: { protocolVersion?: string }; error?: unknown } | null = null;
  try {
    if (ct.includes('text/event-stream')) {
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          body = JSON.parse(line.slice(6));
          break;
        }
      }
    } else if (ct.includes('application/json')) {
      body = JSON.parse(text);
    }
  } catch (err) {
    return {
      durationMs,
      sessionId,
      status: res.status,
      ok: false,
      failure: `body parse failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (res.status !== 200) {
    return { durationMs, sessionId, status: res.status, ok: false, failure: `HTTP ${res.status}` };
  }
  if (!sessionId) {
    return { durationMs, sessionId, status: res.status, ok: false, failure: 'missing mcp-session-id header' };
  }
  if (!body?.result?.protocolVersion) {
    return {
      durationMs,
      sessionId,
      status: res.status,
      ok: false,
      failure: `missing JSON-RPC result.protocolVersion (error: ${JSON.stringify(body?.error ?? null)})`,
    };
  }
  return { durationMs, sessionId, status: res.status, ok: true };
}

// ─── Transport 2: Legacy SSE (in-process SSEServerTransport) ─────────────────
//
// We exercise the SAME per-session wiring the production gateway uses on the
// legacy SSE path:
//   1. Allocate a fresh `SSEServerTransport('/mcp/message', res)`.
//   2. Register it with the shared PRAXISMcpServer via `attachSession()` —
//      the same multiplexer call Streamable HTTP uses.
//   3. Call `transport.start()` (which writes the SSE `endpoint` event and
//      flushes headers — the production HTTP handler delegates this to
//      `Server.connect()`).
//   4. Drive an `initialize` round-trip through `handlePostMessage(...)`
//      with mock req/res, and await the JSON-RPC response that the
//      transport writes back onto the SSE stream as `event: message`.
//
// Driving the SSE transport in-process (rather than going through a real
// HTTP socket) keeps the measurement focused on the gateway-side cost we
// care about (allocation + multiplexer registration + initialize) and
// avoids depending on the exact wiring of the production HTTP handler —
// the per-session cost of those three steps is what task #5068 made
// cheap and what this guard is meant to defend.

/**
 * Minimal mock of Node's `ServerResponse` shape that `SSEServerTransport`
 * touches in `start()` and `send()`. We capture every `write()` payload so
 * the test can parse SSE frames synchronously without a TCP roundtrip.
 *
 * Implements EventEmitter so the SDK can call `res.on('close', ...)`.
 */
class MockSseResponse extends EventEmitter {
  chunks: string[] = [];
  headers: Record<string, string | number | string[]> = {};
  statusCode = 0;
  ended = false;
  writeHead(code: number, headers?: Record<string, string | number | string[]>): this {
    this.statusCode = code;
    if (headers) this.headers = headers;
    return this;
  }
  write(chunk: string | Buffer): boolean {
    this.chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
    return true;
  }
  end(chunk?: string | Buffer): this {
    if (chunk !== undefined) this.write(chunk);
    this.ended = true;
    return this;
  }
}

/**
 * Minimal mock of `ServerResponse` for `handlePostMessage`'s POST path
 * (which only invokes `res.writeHead(code).end(body)`).
 */
class MockPostResponse {
  statusCode = 0;
  body = '';
  writeHead(code: number): this {
    this.statusCode = code;
    return this;
  }
  end(chunk?: string): this {
    if (chunk !== undefined) this.body = chunk;
    return this;
  }
}

/**
 * Minimal `IncomingMessage`-shaped object for `handlePostMessage`. The SDK
 * reads `headers`, `socket` (TLS check), `url`, and optionally `auth`.
 */
function makeMockPostRequest(): {
  headers: Record<string, string>;
  socket: object;
  url: string;
} {
  return {
    headers: { 'content-type': 'application/json', host: 'localhost' },
    socket: {},
    url: '/mcp/message',
  };
}

function parseSseFrames(chunks: string[]): Array<{ event: string; data: string }> {
  const text = chunks.join('');
  const frames: Array<{ event: string; data: string }> = [];
  for (const raw of text.split('\n\n')) {
    if (!raw.trim()) continue;
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
    }
    if (dataLines.length > 0) frames.push({ event, data: dataLines.join('\n') });
  }
  return frames;
}

async function openLegacySseSession(): Promise<SessionResult> {
  const start = performance.now();
  const mockSseRes = new MockSseResponse();

  // SDK type signatures expect Node's IncomingMessage / ServerResponse;
  // our mocks implement only the subset the SDK actually touches. Cast
  // narrowly at the boundary so TypeScript doesn't reject the call sites.
  const sseTransport = new SSEServerTransport(
    '/mcp/message',
    mockSseRes as unknown as http.ServerResponse,
  );

  const sharedServer = getGatewayServer();
  let disposer: () => void;
  try {
    disposer = await sharedServer.attachSession(sseTransport);
  } catch (err) {
    return {
      durationMs: performance.now() - start,
      sessionId: null,
      status: 0,
      ok: false,
      failure: `attachSession failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const cleanup = async (): Promise<void> => {
    try { disposer(); } catch { /* best effort */ }
    try { await sseTransport.close(); } catch { /* best effort */ }
  };

  try {
    await sseTransport.start();
  } catch (err) {
    await cleanup();
    return {
      durationMs: performance.now() - start,
      sessionId: sseTransport.sessionId ?? null,
      status: 0,
      ok: false,
      failure: `sseTransport.start failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const sessionId = sseTransport.sessionId;
  const mockPostRes = new MockPostResponse();
  try {
    await sseTransport.handlePostMessage(
      makeMockPostRequest() as unknown as http.IncomingMessage,
      mockPostRes as unknown as http.ServerResponse,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'perf-harness-sse', version: '1.0.0' },
        },
      },
    );
  } catch (err) {
    await cleanup();
    return {
      durationMs: performance.now() - start,
      sessionId,
      status: 0,
      ok: false,
      failure: `handlePostMessage failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // The SDK Server replies asynchronously: `handlePostMessage` only
  // dispatches `onmessage`, then the SDK runs the initialize handler and
  // schedules a `send()` (which writes to mockSseRes). Poll the mock's
  // captured frames for the JSON-RPC response with id=1.
  const deadline = performance.now() + 5_000;
  let initResponse: { result?: { protocolVersion?: string }; error?: unknown } | null = null;
  while (performance.now() < deadline) {
    const frames = parseSseFrames(mockSseRes.chunks);
    for (const frame of frames) {
      if (frame.event !== 'message') continue;
      try {
        const msg = JSON.parse(frame.data) as { id?: unknown; result?: { protocolVersion?: string }; error?: unknown };
        if (msg.id === 1) {
          initResponse = msg;
          break;
        }
      } catch { /* ignore non-JSON frames */ }
    }
    if (initResponse) break;
    await new Promise((r) => setImmediate(r));
  }

  const durationMs = performance.now() - start;
  await cleanup();

  if (mockPostRes.statusCode !== 202) {
    return {
      durationMs,
      sessionId,
      status: mockPostRes.statusCode,
      ok: false,
      failure: `POST /mcp/message returned ${mockPostRes.statusCode}: ${mockPostRes.body}`,
    };
  }
  if (!initResponse) {
    return {
      durationMs,
      sessionId,
      status: 202,
      ok: false,
      failure: 'no initialize response observed on SSE stream within 5s',
    };
  }
  if (!initResponse.result?.protocolVersion) {
    return {
      durationMs,
      sessionId,
      status: 202,
      ok: false,
      failure: `missing JSON-RPC result.protocolVersion (error: ${JSON.stringify(initResponse.error ?? null)})`,
    };
  }
  return { durationMs, sessionId, status: 202, ok: true };
}

// ─── Transport 3: stdio (simulated in-process via InMemoryTransport) ─────────
//
// Spawning N child processes would dominate the measurement with Node
// startup cost (~100ms/process) and miss the per-session gateway-side
// work we actually want to guard. Instead we allocate N linked
// `InMemoryTransport` pairs and attach the server-side end to the shared
// PRAXISMcpServer via `attachSession()` — the same code path the
// production stdio entry point would take if it adopted the multiplexer
// (and the same path Streamable HTTP + legacy SSE already use).
//
// The client-side end speaks raw JSON-RPC (no full SDK Client needed)
// to keep the harness lean and the measurement focused on server-side
// bootstrap cost.

async function openStdioSession(): Promise<SessionResult> {
  const start = performance.now();
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();

  // The MultiplexingTransport keys sessions by `sub.sessionId`; if the
  // sub-transport never assigns one, addSession warns on every inbound
  // message. InMemoryTransport leaves `sessionId` undefined, so we
  // synthesize a stable id per pair before attach.
  const synthSessionId = `stdio-sim-${randomUUID()}`;
  (serverSide as { sessionId?: string }).sessionId = synthSessionId;

  const sharedServer = getGatewayServer();
  let disposer: () => void;
  try {
    disposer = await sharedServer.attachSession(serverSide);
  } catch (err) {
    return {
      durationMs: performance.now() - start,
      sessionId: synthSessionId,
      status: 0,
      ok: false,
      failure: `attachSession failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const cleanup = async (): Promise<void> => {
    try { disposer(); } catch { /* best effort */ }
    try { await clientSide.close(); } catch { /* best effort */ }
    try { await serverSide.close(); } catch { /* best effort */ }
  };

  let resolveResp: ((msg: JSONRPCMessage) => void) | null = null;
  let rejectResp: ((err: Error) => void) | null = null;
  const responsePromise = new Promise<JSONRPCMessage>((resolve, reject) => {
    resolveResp = resolve;
    rejectResp = reject;
  });
  const timeout = setTimeout(() => rejectResp?.(new Error('stdio init timeout (5s)')), 5_000);

  clientSide.onmessage = (msg) => {
    const env = msg as { id?: unknown };
    if (env.id === 1) {
      resolveResp?.(msg);
    }
  };

  try {
    await clientSide.start();
    await clientSide.send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'perf-harness-stdio', version: '1.0.0' },
      },
    } as JSONRPCMessage);
  } catch (err) {
    clearTimeout(timeout);
    await cleanup();
    return {
      durationMs: performance.now() - start,
      sessionId: synthSessionId,
      status: 0,
      ok: false,
      failure: `send initialize failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let response: JSONRPCMessage;
  try {
    response = await responsePromise;
  } catch (err) {
    clearTimeout(timeout);
    await cleanup();
    return {
      durationMs: performance.now() - start,
      sessionId: synthSessionId,
      status: 0,
      ok: false,
      failure: err instanceof Error ? err.message : String(err),
    };
  }

  clearTimeout(timeout);
  const durationMs = performance.now() - start;
  await cleanup();

  const body = response as { result?: { protocolVersion?: string }; error?: unknown };
  if (!body.result?.protocolVersion) {
    return {
      durationMs,
      sessionId: synthSessionId,
      status: 0,
      ok: false,
      failure: `missing JSON-RPC result.protocolVersion (error: ${JSON.stringify(body.error ?? null)})`,
    };
  }
  return { durationMs, sessionId: synthSessionId, status: 200, ok: true };
}

// ─── Tests ───────────────────────────────────────────────────────────────────
//
// One test per transport so a regression is attributed to the right path.
// A trailing test prints a single consolidated report covering all three.

test(`streamable HTTP session bootstrap stays cheap (${SESSIONS} sessions)`, async () => {
  await runTrial('streamable-http', openStreamableHttpSession);
});

test(`legacy SSE session bootstrap stays cheap (${SESSIONS} sessions)`, async () => {
  await runTrial('legacy-sse', openLegacySseSession);
});

test(`stdio session bootstrap stays cheap (${SESSIONS} sessions, in-process simulation)`, async () => {
  await runTrial('stdio', openStdioSession);
});

test('unified perf report — all three transports', () => {
  // Sanity: every transport should have produced a report by this point.
  // If a previous test threw before recording, surface that here so the
  // unified report can't silently miss a transport.
  const recorded = new Set(reports.map((r) => r.transport));
  for (const t of ['streamable-http', 'legacy-sse', 'stdio'] as const) {
    assert.ok(
      recorded.has(t),
      `[unified-report] transport "${t}" did not record a result — its trial likely failed before measurement`,
    );
  }

  console.log('\n══ MCP session bootstrap perf — all transports ═════════════════════════════');
  console.log(`sessions/transport:    ${SESSIONS}   concurrency: ${CONCURRENCY}\n`);
  const header = ['transport', 'mean', 'P50 (base)', 'P95 (base)', 'P99', 'heap/sess (base)', 'verdict'];
  const rows = reports.map((r) => [
    r.transport,
    `${r.meanMs.toFixed(2)}ms`,
    `${r.p50Ms.toFixed(2)}ms (<${r.baseline.p50Ms})`,
    `${r.p95Ms.toFixed(2)}ms (<${r.baseline.p95Ms})`,
    `${r.p99Ms.toFixed(2)}ms`,
    `${r.heapPerSessionKb.toFixed(2)}KB (<${r.baseline.heapPerSessionKb})`,
    r.passed ? 'PASS' : 'FAIL',
  ]);
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i]!.length)),
  );
  const fmt = (cells: string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i]!)).join('  ');
  console.log(fmt(header));
  console.log(widths.map((w) => '─'.repeat(w)).join('  '));
  for (const r of rows) console.log(fmt(r));
  console.log('════════════════════════════════════════════════════════════════════════════\n');

  // Per-transport asserts already fired inside each trial; this is a
  // final belt-and-braces guard so the unified report can never print
  // "PASS" rows while the suite as a whole silently regressed.
  const failed = reports.filter((r) => !r.passed);
  assert.equal(
    failed.length,
    0,
    `${failed.length}/${reports.length} transport(s) regressed: ${failed.map((r) => r.transport).join(', ')}`,
  );
});
