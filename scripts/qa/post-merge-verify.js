#!/usr/bin/env node
/**
 * post-merge-verify — SZL Holdings Ecosystem
 * Runs the full smoke + health check suite and produces a concise ecosystem
 * health report. Invokes the canonical qa:routes and health:check scripts
 * rather than reimplementing spot checks.
 *
 * Usage:
 *   BASE_URL=http://localhost:80 node scripts/qa/post-merge-verify.js
 *   BASE_URL=https://szlholdings.com node scripts/qa/post-merge-verify.js
 *   node scripts/qa/post-merge-verify.js --report-file=ecosystem-report.json
 *   node scripts/qa/post-merge-verify.js --skip-e2e
 *
 * Exit codes:
 *   0 — all critical checks passed
 *   1 — one or more critical checks failed
 *
 * Health check semantics (delegated to health-check.js --strict):
 *   PASS     — all health endpoints returned expected responses
 *   FAIL     — primary /health endpoint unreachable, OR any secondary probe failed
 *              (--strict mode is always enabled in post-merge verification)
 */

import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.BASE_URL || "http://localhost:80";
const API_BASE_URL = process.env.API_BASE_URL || process.env.BASE_URL || "http://localhost:5000";
const REPORT_FILE_ARG = process.argv.find((a) => a.startsWith("--report-file="));
const REPORT_FILE = REPORT_FILE_ARG ? REPORT_FILE_ARG.split("=")[1] : null;
const SKIP_E2E = process.env.SKIP_E2E === "1" || process.argv.includes("--skip-e2e");

const ROOT = resolve(join(__dirname, "../.."));
const startTime = Date.now();
const SEP = "=".repeat(60);

function log(msg) { console.log(msg); }
function logSection(title) { log(`\n${SEP}\n  ${title}\n${SEP}`); }

function runScript(scriptPath, env, label, extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    [scriptPath, "--json", ...extraArgs],
    {
      env: { ...process.env, ...env },
      encoding: "utf8",
      timeout: 120000,
      cwd: ROOT,
    }
  );

  let parsed = null;
  let rawOutput = (result.stdout ?? "") + (result.stderr ?? "");

  if (result.stdout) {
    try {
      const jsonStart = result.stdout.indexOf("{");
      if (jsonStart >= 0) {
        parsed = JSON.parse(result.stdout.slice(jsonStart));
      }
    } catch {
      parsed = null;
    }
  }

  return {
    label,
    exitCode: result.status ?? 1,
    ok: result.status === 0,
    parsed,
    output: rawOutput.slice(0, 4000),
    error: result.error?.message ?? null,
  };
}

function runE2e(env) {
  const result = spawnSync(
    "pnpm",
    ["test:e2e", "--reporter=list"],
    {
      env: { ...process.env, ...env, BASE_URL },
      stdio: "inherit",
      timeout: 300000,
      cwd: ROOT,
    }
  );
  return { exitCode: result.status ?? 1, ok: result.status === 0, error: result.error?.message ?? null };
}

async function main() {
  log(`\n${"#".repeat(60)}`);
  log(`  SZL Holdings — Post-Merge Ecosystem Verification`);
  log(`  ${new Date().toISOString()}`);
  log("#".repeat(60));
  log(`  Web Base URL: ${BASE_URL}`);
  log(`  API Base URL: ${API_BASE_URL}`);
  log(`  Skip E2E:     ${SKIP_E2E ? "yes (--skip-e2e)" : "no"}`);

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiBaseUrl: API_BASE_URL,
    sections: {},
    summary: { passed: 0, failed: 0, warnings: 0 },
    overallStatus: "PASS",
  };

  logSection("1 / 3  Health Check  (scripts/qa/health-check.js)");
  const healthResult = runScript(
    join(ROOT, "scripts/qa/health-check.js"),
    { BASE_URL: API_BASE_URL },
    "health-check",
    ["--strict"]
  );

  if (healthResult.ok) {
    log("  ✓ Health check PASSED");
    const p = healthResult.parsed?.summary;
    if (p) log(`    ${p.passed}/${p.total} endpoints OK`);
    report.summary.passed++;
  } else {
    log(`  ✗ Health check FAILED (exit ${healthResult.exitCode})`);
    if (healthResult.error) log(`    Error: ${healthResult.error}`);
    report.summary.failed++;
  }
  report.sections.health = {
    ok: healthResult.ok,
    exitCode: healthResult.exitCode,
    summary: healthResult.parsed?.summary ?? null,
    endpoints: healthResult.parsed?.sections ?? null,
    error: healthResult.error,
  };

  logSection("2 / 3  Smoke Routes  (scripts/qa/smoke-routes.js)");
  const smokeResult = runScript(
    join(ROOT, "scripts/qa/smoke-routes.js"),
    { BASE_URL },
    "smoke-routes"
  );

  if (smokeResult.ok) {
    log("  ✓ Route smoke tests PASSED");
    const s = smokeResult.parsed?.summary;
    if (s) log(`    ${s.passed}/${s.total} routes OK`);
  } else {
    log(`  ✗ Route smoke tests FAILED (exit ${smokeResult.exitCode})`);
    if (smokeResult.error) log(`    Error: ${smokeResult.error}`);

    const domains = smokeResult.parsed?.domains ?? {};
    for (const [domain, results] of Object.entries(domains)) {
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        log(`    ✗ ${domain}: ${failed.length} route(s) failed`);
        for (const r of failed.slice(0, 5)) {
          log(`      ✗ ${r.path} — HTTP ${r.status}${r.error ? " " + r.error : ""}`);
        }
      }
    }
    report.summary.failed++;
  }
  report.sections.smoke = {
    ok: smokeResult.ok,
    exitCode: smokeResult.exitCode,
    summary: smokeResult.parsed?.summary ?? null,
    discoveredApiPrefixes: smokeResult.parsed?.discoveredApiPrefixes ?? 0,
    error: smokeResult.error,
  };

  logSection("3 / 3  Playwright E2E Suite");
  if (SKIP_E2E) {
    log("  Skipped (--skip-e2e flag set)");
    report.sections.e2e = { skipped: true };
    report.summary.warnings++;
  } else {
    log("  Running: pnpm test:e2e\n  (runs all app specs — may take several minutes)\n");
    const e2eResult = runE2e({ BASE_URL });
    if (e2eResult.ok) {
      log("\n  ✓ E2E suite PASSED");
      report.summary.passed++;
    } else {
      log(`\n  ✗ E2E suite FAILED (exit ${e2eResult.exitCode})`);
      log("    View details: pnpm test:e2e:ui  or check playwright-report/");
      report.summary.failed++;
      if (e2eResult.error) log(`    Error: ${e2eResult.error}`);
    }
    report.sections.e2e = { ok: e2eResult.ok, exitCode: e2eResult.exitCode, error: e2eResult.error };
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  report.elapsedSeconds = parseFloat(elapsed);

  if (report.summary.failed > 0) report.overallStatus = "FAIL";
  else if (report.summary.warnings > 0) report.overallStatus = "WARN";

  log(`\n${SEP}`);
  log(`  ECOSYSTEM HEALTH REPORT`);
  log(SEP);
  log(`  Overall:  ${report.overallStatus}`);
  log(`  Passed:   ${report.summary.passed}`);
  log(`  Failed:   ${report.summary.failed}`);
  log(`  Warnings: ${report.summary.warnings}`);
  log(`  Elapsed:  ${elapsed}s`);
  log(SEP);

  if (REPORT_FILE) {
    const outPath = resolve(REPORT_FILE);
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    log(`\n  Report saved to: ${outPath}`);
  }

  if (report.summary.failed > 0) {
    log("\n  FAIL — One or more critical checks failed. Review output above.");
    process.exit(1);
  } else if (report.overallStatus === "WARN") {
    log("\n  WARN — All critical checks passed. E2E was skipped.");
    process.exit(0);
  } else {
    log("\n  PASS — All ecosystem checks passed.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("post-merge-verify fatal error:", err);
  process.exit(1);
});
