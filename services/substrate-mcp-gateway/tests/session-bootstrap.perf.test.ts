/**
 * Substrate MCP Gateway — Session Bootstrap Load Test
 *
 * Task #5069 — Guards the per-session-cost win from task #5059 / #5068.
 *
 * Task #5068 collapsed every Streamable HTTP session onto a single
 * PRAXISMcpServer via the multiplexing transport, so opening a new MCP
 * session should now cost only:
 *   - one StreamableHTTPServerTransport allocation,
 *   - one MultiplexingTransport sub-session registration, and
 *   - the SDK's `initialize` round-trip.
 *
 * Task #5059 layered cached PQC identity bootstrap, cached domain root
 * enumeration, and cached domain App construction on top of that, all of
 * which happen exactly once at module load.
 *
 * If a future change reintroduces a per-session DB call, a per-session
 * `new PRAXISMcpServer()`, or a per-session domain-roots scan, this
 * benchmark will fail loudly via the documented thresholds below.
 *
 * What the test does:
 *   1. Boots the gateway HTTP transport once.
 *   2. Opens one warm-up session (so the singleton server, PQC identity,
 *      domain roots, and domain Apps are all built before measurement).
 *   3. Opens SESSIONS concurrent fresh sessions, recording the wall-clock
 *      duration of each `initialize` round-trip.
 *   4. Snapshots heap usage before/after, attributes the delta per session.
 *   5. Asserts P50/P95/heap-per-session against documented baselines.
 *
 * Run on demand:
 *   pnpm --filter @szl/substrate-mcp-gateway test:perf
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';
import { createHttpTransport } from '../src/transport/http.js';

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
// the CI container as of task #5069 so transient noise doesn't flake the
// suite, while still being tight enough to detect a regression that
// reintroduces meaningful per-session work (e.g. an extra DB round-trip
// adds ~5-20ms on local Postgres, a fresh PRAXISMcpServer + tool
// registration adds ~30-100ms).
//
// If you find yourself loosening these, ask whether you just regressed
// task #5059 / #5068 instead.

const BASELINE_P50_MS = 50;
const BASELINE_P95_MS = 150;
const BASELINE_HEAP_PER_SESSION_KB = 256;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface SessionResult {
  durationMs: number;
  sessionId: string | null;
  status: number;
  ok: boolean;
  failure?: string;
}

async function openSession(): Promise<SessionResult> {
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

  // Parse the body (JSON or SSE-framed JSON) so we can verify the
  // JSON-RPC `result` actually arrived — a transport error that still
  // emits an `mcp-session-id` header would otherwise under-report
  // failures.
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

// ─── Test ────────────────────────────────────────────────────────────────────

test(`session bootstrap stays cheap (${SESSIONS} sessions, baseline P50<${BASELINE_P50_MS}ms P95<${BASELINE_P95_MS}ms heap<${BASELINE_HEAP_PER_SESSION_KB}KB/session)`, async () => {
  // Warm-up: triggers singleton PRAXISMcpServer construction, PQC identity
  // bootstrap, domain root enumeration, and domain App registration. We
  // measure only steady-state per-session cost, not first-init cost.
  const warm = await openSession();
  assert.ok(warm.ok, `warm-up session must initialize successfully: ${warm.failure ?? 'unknown'}`);

  // A couple of extra warm-up sessions stabilize V8 inlining + the HTTP
  // keep-alive pool before measurement.
  for (let i = 0; i < 2; i++) {
    const extra = await openSession();
    assert.ok(extra.ok, `warm-up session ${i + 2} failed: ${extra.failure ?? 'unknown'}`);
  }

  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;

  const measured = await runWithConcurrency(SESSIONS, CONCURRENCY, () => openSession());

  if (global.gc) global.gc();
  const heapAfter = process.memoryUsage().heapUsed;

  // Validate every session actually completed initialize successfully —
  // HTTP 200, mcp-session-id header, and a JSON-RPC `result.protocolVersion`.
  // A failed session would otherwise pollute the latency stats (often
  // looking artificially fast) and hide a real regression.
  const failures = measured.filter((m) => !m.ok);
  if (failures.length > 0) {
    const sample = failures.slice(0, 5).map((f) => f.failure ?? 'unknown').join('; ');
    assert.fail(
      `${failures.length}/${SESSIONS} sessions failed to initialize. First failures: ${sample}`,
    );
  }

  const durations = measured.map((m) => m.durationMs).sort((a, b) => a - b);
  const p50 = quantile(durations, 0.5);
  const p95 = quantile(durations, 0.95);
  const p99 = quantile(durations, 0.99);
  const mean = durations.reduce((s, n) => s + n, 0) / durations.length;
  const heapDeltaBytes = heapAfter - heapBefore;
  const heapPerSessionKb = heapDeltaBytes / SESSIONS / 1024;

  // Pass/fail report — emitted on stdout so CI captures it next to the
  // assertions even when everything is green.
  console.log('\n── MCP session bootstrap perf ──────────────────────────────');
  console.log(`sessions:               ${SESSIONS} (concurrency ${CONCURRENCY})`);
  console.log(`warm-up duration:       ${warm.durationMs.toFixed(2)} ms`);
  console.log(`mean:                   ${mean.toFixed(2)} ms`);
  console.log(`P50:                    ${p50.toFixed(2)} ms  (baseline < ${BASELINE_P50_MS} ms)`);
  console.log(`P95:                    ${p95.toFixed(2)} ms  (baseline < ${BASELINE_P95_MS} ms)`);
  console.log(`P99:                    ${p99.toFixed(2)} ms`);
  console.log(`heap delta (total):     ${(heapDeltaBytes / 1024).toFixed(1)} KB`);
  console.log(
    `heap delta per session: ${heapPerSessionKb.toFixed(2)} KB  (baseline < ${BASELINE_HEAP_PER_SESSION_KB} KB)`,
  );
  console.log(
    `verdict:                ${
      p50 < BASELINE_P50_MS &&
      p95 < BASELINE_P95_MS &&
      heapPerSessionKb < BASELINE_HEAP_PER_SESSION_KB
        ? 'PASS'
        : 'FAIL'
    }`,
  );
  console.log('────────────────────────────────────────────────────────────\n');

  assert.ok(
    p50 < BASELINE_P50_MS,
    `P50 session-bootstrap regressed: ${p50.toFixed(2)}ms >= baseline ${BASELINE_P50_MS}ms — ` +
      `did task #5059 / #5068 caching get undone (e.g. a per-session DB call or per-session PRAXISMcpServer)?`,
  );
  assert.ok(
    p95 < BASELINE_P95_MS,
    `P95 session-bootstrap regressed: ${p95.toFixed(2)}ms >= baseline ${BASELINE_P95_MS}ms`,
  );
  // Heap delta is noisy under GC — only fail on a clear blow-out (negative
  // values mean GC reclaimed more than we allocated, which is fine).
  assert.ok(
    heapPerSessionKb < BASELINE_HEAP_PER_SESSION_KB,
    `Per-session heap growth regressed: ${heapPerSessionKb.toFixed(2)}KB >= baseline ${BASELINE_HEAP_PER_SESSION_KB}KB — ` +
      `a per-session allocation may have been reintroduced (e.g. fresh server, fresh tool registry, leaked closures).`,
  );
});
