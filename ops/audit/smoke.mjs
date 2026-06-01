#!/usr/bin/env node
/**
 * ops/audit/smoke.mjs
 * Smoke-tests every known route in routes.json by hitting it and checking for
 * an HTTP 200 and optional expected text.
 *
 * Environment variables:
 *   TARGET_URL        Base URL to test against (default: http://localhost:3000)
 *   EXPECTED_TEXT     Text that must appear in every response body (optional)
 *
 * Usage:
 *   node ops/audit/smoke.mjs
 *   TARGET_URL=https://staging.szlholdings.com node ops/audit/smoke.mjs
 */

import {
  env,
  loadRoutes,
  buildUrl,
  fetchWithTimeout,
  validateResponse,
  printSummary,
  writeReport,
  section,
  log,
  ok,
  fail,
} from './lib.mjs';

async function smokeTest(route) {
  const url = buildUrl(env.TARGET_URL, route.path);
  log(`GET ${url}`);
  const res = await fetchWithTimeout(url);

  if (res.error) {
    return {
      ...route,
      url,
      passed: false,
      reasons: [res.error],
      status: 0,
      durationMs: res.durationMs,
    };
  }

  const { passed, reasons } = validateResponse(res, {
    expectedStatus: 200,
    expectedText: env.EXPECTED_TEXT,
  });

  if (passed) {
    ok(`${route.label} (${res.durationMs}ms)`);
  } else {
    fail(`${route.label}: ${reasons.join(', ')}`);
  }

  return {
    ...route,
    url,
    passed,
    reasons,
    status: res.status,
    durationMs: res.durationMs,
  };
}

async function main() {
  section('Smoke Test — SZL Ecosystem');
  log(`Target: ${env.TARGET_URL}`);
  if (env.EXPECTED_TEXT) log(`Expected text: "${env.EXPECTED_TEXT}"`);

  const routes = loadRoutes();
  log(`Testing ${routes.length} routes across ${new Set(routes.map(r => r.appId)).size} apps\n`);

  const results = [];
  for (const route of routes) {
    results.push(await smokeTest(route));
  }

  const summary = printSummary('Smoke Test', results);

  writeReport('smoke-report.json', {
    timestamp: new Date().toISOString(),
    targetUrl: env.TARGET_URL,
    expectedText: env.EXPECTED_TEXT,
    summary,
    results,
  });

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
