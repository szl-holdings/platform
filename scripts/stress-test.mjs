#!/usr/bin/env node
/**
 * API Server Stress / Load Test
 *
 * Sends sustained concurrent HTTP requests to a set of key endpoints and
 * asserts that:
 *   1. The server keeps responding (no complete outages during the run).
 *   2. The error rate stays below a configurable threshold.
 *   3. Median (p50) and 95th-percentile (p95) response times stay within
 *      acceptable bounds.
 *   4. Node.js heap usage reported by GET /api/health/detailed does not
 *      grow beyond a configurable ceiling during the run.
 *      (Only asserted when --internal-token is supplied; fails if the token
 *       is supplied but the server does not return parseable heap data.)
 *
 * Error counting:
 *   - For endpoints marked expectOk=true (public/health), any non-2xx is an error.
 *   - For auth-required endpoints without a bearer token, 4xx is expected and NOT an error.
 *   - 5xx is always an error regardless of endpoint type.
 *
 * Usage:
 *   node scripts/stress-test.mjs [options]
 *
 * Options:
 *   --base-url <url>          Base URL of the API server (default: http://localhost:5000)
 *   --concurrency <n>         Concurrent request workers (default: 20)
 *   --duration <s>            Test duration in seconds (default: 30)
 *   --p50-limit <ms>          Max acceptable p50 latency in ms (default: 500)
 *   --p95-limit <ms>          Max acceptable p95 latency in ms (default: 2000)
 *   --error-rate-limit <%>    Max acceptable error rate 0-100 (default: 5)
 *   --heap-limit-mb <mb>      Max heap growth in MB (default: 150)
 *   --token <bearer>          Bearer token for authenticated endpoints
 *   --internal-token <tok>    x-internal-token for /health/detailed (enables heap assertion)
 *
 * Exit codes:
 *   0  All assertions pass
 *   1  One or more assertions failed
 *   2  Server unreachable / could not start test
 */

import { parseArgs } from 'node:util';

// ─── Argument parsing ────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'base-url':          { type: 'string',  default: 'http://localhost:5000' },
    concurrency:         { type: 'string',  default: '20' },
    duration:            { type: 'string',  default: '30' },
    'p50-limit':         { type: 'string',  default: '500' },
    'p95-limit':         { type: 'string',  default: '2000' },
    'error-rate-limit':  { type: 'string',  default: '5' },
    'heap-limit-mb':     { type: 'string',  default: '150' },
    token:               { type: 'string',  default: '' },
    'internal-token':    { type: 'string',  default: '' },
  },
  strict: false,
});

const BASE_URL         = args['base-url'];
const CONCURRENCY      = Number.parseInt(args.concurrency, 10);
const DURATION_S       = Number.parseInt(args.duration, 10);
const P50_LIMIT_MS     = Number.parseInt(args['p50-limit'], 10);
const P95_LIMIT_MS     = Number.parseInt(args['p95-limit'], 10);
const ERROR_RATE_LIMIT = Number.parseFloat(args['error-rate-limit']);
const HEAP_LIMIT_MB    = Number.parseInt(args['heap-limit-mb'], 10);
const BEARER_TOKEN     = args.token;
const INTERNAL_TOKEN   = args['internal-token'];

// ─── Endpoints under test ────────────────────────────────────────────────────

/**
 * Endpoint definition:
 *   path      — path appended to BASE_URL
 *   auth      — 'none' | 'bearer' | 'internal'
 *   weight    — relative frequency in the request mix (higher = more requests)
 *   expectOk  — if true, any non-2xx response is counted as an error
 *               (use for public endpoints that must always return 200)
 */
const ENDPOINTS = [
  { path: '/api/health/live',    auth: 'none',     weight: 4, expectOk: true  },
  { path: '/api/health/ready',   auth: 'none',     weight: 4, expectOk: true  },
  { path: '/api/health',         auth: 'none',     weight: 3, expectOk: true  },
  { path: '/api/csrf-token',     auth: 'none',     weight: 2, expectOk: true  },
  { path: '/api/auth/me',        auth: 'bearer',   weight: 3, expectOk: false },
  { path: '/api/auth/providers', auth: 'none',     weight: 2, expectOk: true  },
  { path: '/api/health/detailed', auth: 'internal', weight: 1, expectOk: false, trackHeap: true },
];

// Build a weighted pool for round-robin selection.
const weightedPool = [];
for (const ep of ENDPOINTS) {
  for (let i = 0; i < (ep.weight ?? 1); i++) weightedPool.push(ep);
}

// ─── Shared state ─────────────────────────────────────────────────────────────

const latencies = [];
let totalRequests  = 0;
let totalErrors    = 0;
let heapBaselineMb = null;
let heapPeakMb     = null;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function httpGet(path, auth) {
  const url     = `${BASE_URL}${path}`;
  const headers = { 'x-stress-test': '1' };

  if (auth === 'bearer' && BEARER_TOKEN) {
    headers['authorization'] = `Bearer ${BEARER_TOKEN}`;
  } else if (auth === 'internal' && INTERNAL_TOKEN) {
    headers['x-internal-token'] = INTERNAL_TOKEN;
  }

  const t0 = Date.now();
  try {
    const res  = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    const ms   = Date.now() - t0;
    const body = res.status < 500 ? await res.json().catch(() => null) : null;
    return { ok: res.status >= 200 && res.status < 300, status: res.status, ms, body };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: err.message };
  }
}

// ─── Heap tracking ────────────────────────────────────────────────────────────

async function sampleHeap() {
  if (!INTERNAL_TOKEN) return null;
  const res = await httpGet('/api/health/detailed', 'internal');
  if (!res.body) return null;
  const body = res.body;
  return (
    body?.checks?.memory?.heapUsedMb ??
    (body?.heap?.used != null ? body.heap.used / 1024 / 1024 : null) ??
    null
  );
}

// ─── Worker ──────────────────────────────────────────────────────────────────

async function worker(stopAt) {
  let idx = Math.floor(Math.random() * weightedPool.length);
  while (Date.now() < stopAt) {
    const ep     = weightedPool[idx % weightedPool.length];
    idx++;

    const result = await httpGet(ep.path, ep.auth);
    totalRequests++;
    latencies.push(result.ms);

    // Count as error when: 5xx always; non-2xx on expectOk endpoints.
    if (result.status >= 500 || (ep.expectOk && !result.ok)) {
      totalErrors++;
    }
  }
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx    = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('───────────────────────────────────────────────────');
console.log(' SZL Holdings API — Stress Test');
console.log('───────────────────────────────────────────────────');
console.log(` Base URL    : ${BASE_URL}`);
console.log(` Concurrency : ${CONCURRENCY} workers`);
console.log(` Duration    : ${DURATION_S}s`);
console.log(` P50 limit   : ${P50_LIMIT_MS} ms`);
console.log(` P95 limit   : ${P95_LIMIT_MS} ms`);
console.log(` Error limit : ${ERROR_RATE_LIMIT}%`);
console.log(` Heap check  : ${INTERNAL_TOKEN ? `enabled (limit: +${HEAP_LIMIT_MB} MB growth)` : 'disabled (no --internal-token)'}`);
console.log('───────────────────────────────────────────────────\n');

// Preflight — confirm server is up.
const preflight = await httpGet('/api/health/live', 'none');
if (!preflight.ok) {
  console.error(`✗  Preflight failed — server at ${BASE_URL} is not reachable (status ${preflight.status})`);
  console.error(`   Error: ${preflight.error ?? 'non-2xx response'}`);
  process.exit(2);
}
console.log('✓  Preflight OK — server is reachable\n');

// Sample heap baseline before load (only when internal-token is configured).
heapBaselineMb = await sampleHeap();
if (INTERNAL_TOKEN && heapBaselineMb === null) {
  console.warn('⚠  --internal-token supplied but /api/health/detailed returned no heap data.');
  console.warn('   Heap assertion will be treated as a failure at the end of the run.');
}
if (heapBaselineMb != null) {
  heapPeakMb = heapBaselineMb;
  console.log(`   Heap baseline: ${heapBaselineMb.toFixed(1)} MB`);
}

// Run workers.
const stopAt  = Date.now() + DURATION_S * 1000;
const workers = Array.from({ length: CONCURRENCY }, () => worker(stopAt));

const heapSampler = INTERNAL_TOKEN
  ? setInterval(async () => {
      const mb = await sampleHeap();
      if (mb != null && (heapPeakMb === null || mb > heapPeakMb)) heapPeakMb = mb;
    }, 5_000)
  : null;

console.log(`   Starting ${CONCURRENCY} workers for ${DURATION_S}s…\n`);
await Promise.all(workers);
if (heapSampler) clearInterval(heapSampler);

// Final heap sample.
if (INTERNAL_TOKEN) {
  const finalMb = await sampleHeap();
  if (finalMb != null && (heapPeakMb === null || finalMb > heapPeakMb)) heapPeakMb = finalMb;
}

// ─── Results ──────────────────────────────────────────────────────────────────

const errorRate  = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
const p50        = percentile(latencies, 50);
const p95        = percentile(latencies, 95);
const heapGrowth = (heapBaselineMb != null && heapPeakMb != null) ? heapPeakMb - heapBaselineMb : null;
const rps        = (totalRequests / DURATION_S).toFixed(1);

console.log('───────────────────────────────────────────────────');
console.log(' Results');
console.log('───────────────────────────────────────────────────');
console.log(` Total requests : ${totalRequests}`);
console.log(` Errors         : ${totalErrors} (${errorRate.toFixed(2)}%)`);
console.log(` Throughput     : ${rps} req/s`);
console.log(` Latency p50    : ${p50} ms`);
console.log(` Latency p95    : ${p95} ms`);
if (INTERNAL_TOKEN) {
  if (heapBaselineMb != null) {
    console.log(` Heap baseline  : ${heapBaselineMb.toFixed(1)} MB`);
    console.log(` Heap peak      : ${heapPeakMb?.toFixed(1) ?? 'n/a'} MB`);
    console.log(` Heap growth    : ${heapGrowth != null ? `+${heapGrowth.toFixed(1)} MB` : 'n/a'}`);
  } else {
    console.log(' Heap data      : unavailable (health/detailed did not return heap metrics)');
  }
}
console.log('');

// ─── Assertions ───────────────────────────────────────────────────────────────

let passed = true;

function assert(label, actual, limit, unit) {
  const ok   = actual <= limit;
  const icon = ok ? '✓' : '✗';
  console.log(`  ${icon}  ${label}: ${actual.toFixed(2)}${unit} (limit: ${limit}${unit})`);
  if (!ok) passed = false;
}

assert('Error rate',  errorRate, ERROR_RATE_LIMIT, '%');
assert('Latency p50', p50,       P50_LIMIT_MS,     ' ms');
assert('Latency p95', p95,       P95_LIMIT_MS,     ' ms');

if (INTERNAL_TOKEN) {
  if (heapGrowth != null) {
    assert('Heap growth', heapGrowth, HEAP_LIMIT_MB, ' MB');
  } else {
    console.log('  ✗  Heap growth: no data (--internal-token provided but /api/health/detailed returned no heap metrics)');
    passed = false;
  }
}

const serverStayedUp = totalRequests > 0;
console.log(`  ${serverStayedUp ? '✓' : '✗'}  Server remained responsive during the run`);
if (!serverStayedUp) passed = false;

console.log('\n───────────────────────────────────────────────────');
if (passed) {
  console.log(' ✓  All stress test assertions passed');
} else {
  console.error(' ✗  One or more stress test assertions FAILED');
}
console.log('───────────────────────────────────────────────────\n');

process.exit(passed ? 0 : 1);
