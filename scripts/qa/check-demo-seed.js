#!/usr/bin/env node
/**
 * Demo Seed Integrity Check — SZL Holdings Platform
 * Verifies the demo environment is properly seeded via the API.
 *
 * Usage:
 *   API_URL=http://localhost:3001 node scripts/qa/check-demo-seed.js
 *   node scripts/qa/check-demo-seed.js
 */

const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:3000";

async function apiFetch(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        "User-Agent": "SZL-QA-DemoCheck/1.0",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

async function checkApiHealth() {
  const result = await apiFetch("/api/health");
  if (result.error) {
    return { ok: false, issue: `API health check failed: ${result.error}` };
  }
  if (result.status !== "ok") {
    return { ok: false, issue: `API status is not ok: ${JSON.stringify(result)}` };
  }
  return { ok: true };
}

async function checkCmsSites() {
  const result = await apiFetch("/api/cms/sites");
  if (result.error) {
    return { ok: false, issue: `CMS sites endpoint failed: ${result.error}` };
  }
  const sites = Array.isArray(result) ? result : result.data || [];
  if (sites.length === 0) {
    return { ok: false, issue: "No CMS sites found — seed data may be missing" };
  }
  return { ok: true, detail: `${sites.length} site(s) found` };
}

async function checkCmsVentures() {
  const result = await apiFetch("/api/cms/ventures");
  if (result.error) {
    return { ok: false, issue: `CMS ventures endpoint failed: ${result.error}` };
  }
  const ventures = Array.isArray(result) ? result : result.data || [];
  if (ventures.length === 0) {
    return { ok: false, issue: "No ventures found — demo data may be missing" };
  }
  return { ok: true, detail: `${ventures.length} venture(s) found` };
}

async function main() {
  console.log(`\nSZL Holdings — Demo Seed Integrity Check`);
  console.log(`API URL: ${API_URL}\n`);

  const checks = [
    { name: "API Health", fn: checkApiHealth },
    { name: "CMS Sites", fn: checkCmsSites },
    { name: "CMS Ventures", fn: checkCmsVentures },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of checks) {
    const result = await fn();
    if (result.ok) {
      console.log(`  ✓ ${name}${result.detail ? " — " + result.detail : ""}`);
      passed++;
    } else {
      console.error(`  ✗ ${name} — ${result.issue}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\nFAIL — Demo environment may not be properly seeded`);
    console.error(`Run: pnpm seed:demo`);
    process.exit(1);
  } else {
    console.log(`\nPASS — Demo environment appears properly configured`);
    process.exit(0);
  }
}

main();
