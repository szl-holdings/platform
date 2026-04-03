#!/usr/bin/env node
/**
 * health:check — SZL Holdings Platform
 * Hits the API server /health endpoint and validates the response.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/health-check.js
 *   node scripts/qa/health-check.js  (defaults to http://localhost:PORT or 5000)
 */

const PORT = process.env.PORT || "5000";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TIMEOUT_MS = 10000;

const HEALTH_ENDPOINTS = [
  { path: "/api/health", name: "API Health", requiredFields: ["status", "uptime", "services"] },
  { path: "/api/healthz", name: "API Healthz (backup)", requiredFields: ["status"] },
  { path: "/api/core/health", name: "Core Intelligence Health", requiredFields: ["success", "data"] },
];

async function checkEndpoint(url, name, requiredFields, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json", "User-Agent": "SZL-Health-Check/1.0" },
    });
    clearTimeout(timer);
    const latency = Date.now() - start;

    if (!res.ok) {
      return { name, url, ok: false, latency, error: `HTTP ${res.status} ${res.statusText}` };
    }

    const body = await res.json();

    // Check required fields
    const missingFields = requiredFields.filter((f) => body[f] === undefined);
    if (missingFields.length > 0) {
      return { name, url, ok: false, latency, error: `Missing fields: ${missingFields.join(", ")}`, body };
    }

    // Check status field if present
    const status = body.status || body.data?.status;
    if (status && !["ok", "healthy", "degraded"].includes(status)) {
      return { name, url, ok: false, latency, error: `Unexpected status: ${status}`, body };
    }

    return { name, url, ok: true, latency, status: status ?? "ok", body };
  } catch (err) {
    clearTimeout(timer);
    return { name, url, ok: false, latency: Date.now() - start, error: err.message };
  }
}

function formatLatency(ms) {
  if (ms < 100) return `${ms}ms (fast)`;
  if (ms < 500) return `${ms}ms (ok)`;
  if (ms < 2000) return `${ms}ms (slow)`;
  return `${ms}ms (very slow)`;
}

async function main() {
  console.log("\nSZL Holdings — API Health Check");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms\n`);

  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(({ path, name, requiredFields }) =>
      checkEndpoint(`${BASE_URL}${path}`, name, requiredFields, TIMEOUT_MS)
    )
  );

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.ok) {
      console.log(`  ✓ ${result.name} — ${result.status} (${formatLatency(result.latency)})`);
      // Show service details if available
      if (result.body?.services) {
        for (const [svc, info] of Object.entries(result.body.services)) {
          const svcStatus = typeof info === "object" ? info.status : info;
          console.log(`      ${svc}: ${svcStatus}`);
        }
      }
      passed++;
    } else {
      console.error(`  ✗ ${result.name} — ${result.error} (${formatLatency(result.latency)})`);
      console.error(`    URL: ${result.url}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    // Only fail if the primary health endpoint fails
    const primaryResult = results[0];
    if (!primaryResult.ok) {
      console.error(`\nFAIL — Primary health endpoint unreachable.`);
      console.error("Ensure the API server is running: pnpm --filter @workspace/api-server run dev");
      process.exit(1);
    } else {
      console.log(`\nPASS — Primary health OK. Secondary endpoints may still be starting.`);
      process.exit(0);
    }
  } else {
    console.log(`\nPASS — All health endpoints responding correctly.`);
    process.exit(0);
  }
}

main();
