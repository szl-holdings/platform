#!/usr/bin/env node
/**
 * Route Smoke Tests — SZL Holdings Platform
 * Verifies all registered public routes return HTTP 200.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/smoke-routes.js
 *   node scripts/qa/smoke-routes.js  (defaults to http://localhost:3000)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PUBLIC_ROUTES = [
  "/",
  "/platform",
  "/lyte",
  "/alloy-fabric",
  "/solutions",
  "/solutions/aegis",
  "/solutions/vessels",
  "/solutions/terra",
  "/solutions/prism-counsel",
  "/design-partners",
  "/contact",
  "/pricing",
  "/status",
  "/how-it-works",
  "/trust-center",
  "/trust",
  "/trust/security",
  "/trust/governance",
  "/trust/architecture",
  "/trust/ai",
  "/trust/approvals",
  "/trust/operations",
  "/legal/privacy",
  "/legal/terms",
  "/accessibility",
  "/docs",
  "/prism-counsel-public",
  "/terra-public",
  "/vessels-public",
  "/aegis-public",
  "/carlota-jo-public",
  "/solutions/prism-counsel/trust",
  "/solutions/terra/trust",
  "/solutions/vessels/trust",
  "/solutions/aegis/trust",
  "/solutions/lyte/trust",
];

const API_ROUTES = ["/api/health"];

async function checkRoute(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const start = Date.now();
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SZL-QA-Smoke/1.0" },
    });
    const duration = Date.now() - start;
    clearTimeout(timer);
    return { url, status: res.status, duration, ok: res.status < 400 };
  } catch (err) {
    clearTimeout(timer);
    return { url, status: 0, duration: timeout, ok: false, error: err.message };
  }
}

async function main() {
  console.log(`\nSZL Holdings — Route Smoke Tests`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Routes to test: ${PUBLIC_ROUTES.length + API_ROUTES.length}\n`);

  const allRoutes = [
    ...PUBLIC_ROUTES.map((r) => BASE_URL + r),
    ...API_ROUTES.map((r) => BASE_URL + r),
  ];

  let passed = 0;
  let failed = 0;

  for (const url of allRoutes) {
    const result = await checkRoute(url);
    const icon = result.ok ? "✓" : "✗";
    const durationStr = `${result.duration}ms`;
    if (result.ok) {
      console.log(`  ${icon} ${result.status} ${url} (${durationStr})`);
      passed++;
    } else {
      console.error(
        `  ${icon} ${result.status} ${url} (${durationStr})${result.error ? " — " + result.error : ""}`
      );
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\nFAIL — ${failed} route(s) returned errors`);
    process.exit(1);
  } else {
    console.log(`\nPASS — All routes responding correctly`);
    process.exit(0);
  }
}

main();
