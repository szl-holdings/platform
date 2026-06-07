#!/usr/bin/env node
/**
 * ops/audit/stress.mjs
 * Concurrent load / stress test with p95 latency threshold enforcement.
 * Tests the TARGET_URL (defaults to root) with configurable request count
 * and concurrency.
 *
 * Environment variables:
 *   TARGET_URL          URL to stress test (default: http://localhost:3000)
 *   STRESS_REQUESTS     Total requests to send (default: 50)
 *   STRESS_CONCURRENCY  Concurrent requests per batch (default: 5)
 *   MAX_P95_MS          p95 latency threshold in ms; fail if exceeded (default: 3000)
 *
 * Usage:
 *   node ops/audit/stress.mjs
 *   TARGET_URL=https://staging.szlholdings.com STRESS_REQUESTS=200 STRESS_CONCURRENCY=20 node ops/audit/stress.mjs
 */

import {
  env,
  loadRoutes,
  buildUrl,
  fetchWithTimeout,
  stats,
  writeReport,
  section,
  log,
  ok,
  fail,
  warn,
} from './lib.mjs';

async function sendRequest(url, idx) {
  const start = Date.now();
  const res = await fetchWithTimeout(url, 15_000);
  return {
    idx,
    url,
    status: res.status,
    durationMs: res.durationMs,
    error: res.error,
    passed: !res.error && res.status >= 200 && res.status < 400,
  };
}

async function runBatch(url, indices) {
  return Promise.all(indices.map(i => sendRequest(url, i)));
}

async function stressUrl(url) {
  const total = env.STRESS_REQUESTS;
  const concurrency = env.STRESS_CONCURRENCY;
  const results = [];

  log(`Sending ${total} requests (${concurrency} concurrent) → ${url}`);

  let sent = 0;
  while (sent < total) {
    const batchSize = Math.min(concurrency, total - sent);
    const indices = Array.from({ length: batchSize }, (_, i) => sent + i);
    const batch = await runBatch(url, indices);
    results.push(...batch);
    sent += batchSize;
    process.stdout.write(`  ${sent}/${total}\r`);
  }
  process.stdout.write('\n');

  return results;
}

async function main() {
  section('Stress Test — SZL Ecosystem');
  log(`Target:      ${env.TARGET_URL}`);
  log(`Requests:    ${env.STRESS_REQUESTS}`);
  log(`Concurrency: ${env.STRESS_CONCURRENCY}`);
  log(`Max p95:     ${env.MAX_P95_MS}ms\n`);

  const routes = loadRoutes();
  const testUrls = [
    buildUrl(env.TARGET_URL, '/'),
    buildUrl(env.TARGET_URL, '/api/health'),
    ...routes.slice(0, 3).map(r => buildUrl(env.TARGET_URL, r.path)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const allResults = [];
  const urlStats = [];

  for (const url of testUrls) {
    const results = await stressUrl(url);
    allResults.push(...results);

    const durations = results.filter(r => r.passed).map(r => r.durationMs).sort((a, b) => a - b);
    const errors = results.filter(r => !r.passed).length;
    const s = stats(durations);
    const p95Pass = s.p95 <= env.MAX_P95_MS;

    log(`  p50=${s.p50}ms  p95=${s.p95}ms  p99=${s.p99}ms  errors=${errors}/${results.length}`);

    if (p95Pass && errors === 0) {
      ok(`${url} — p95 ${s.p95}ms ≤ ${env.MAX_P95_MS}ms`);
    } else {
      if (!p95Pass) fail(`${url} — p95 ${s.p95}ms > ${env.MAX_P95_MS}ms threshold`);
      if (errors > 0) fail(`${url} — ${errors} request errors`);
    }

    urlStats.push({ url, ...s, errors, total: results.length, p95Pass });
  }

  const overallDurations = allResults.filter(r => r.passed).map(r => r.durationMs).sort((a, b) => a - b);
  const overall = stats(overallDurations);
  const totalErrors = allResults.filter(r => !r.passed).length;
  const globalP95Pass = overall.p95 <= env.MAX_P95_MS;

  section('Overall');
  log(`Requests: ${allResults.length}  Errors: ${totalErrors}`);
  log(`p50=${overall.p50}ms  p95=${overall.p95}ms  p99=${overall.p99}ms`);

  writeReport('stress-report.json', {
    timestamp: new Date().toISOString(),
    targetUrl: env.TARGET_URL,
    stressRequests: env.STRESS_REQUESTS,
    stressConcurrency: env.STRESS_CONCURRENCY,
    maxP95Ms: env.MAX_P95_MS,
    overall,
    totalRequests: allResults.length,
    totalErrors,
    globalP95Pass,
    urlStats,
  });

  if (totalErrors > 0 || !globalP95Pass) {
    if (!globalP95Pass) fail(`Global p95 ${overall.p95}ms exceeds ${env.MAX_P95_MS}ms threshold`);
    if (totalErrors > 0) fail(`${totalErrors} request errors`);
    process.exit(1);
  } else {
    ok(`Stress test passed — p95 ${overall.p95}ms ≤ ${env.MAX_P95_MS}ms`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
