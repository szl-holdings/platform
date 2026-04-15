#!/usr/bin/env node
/**
 * Route Smoke Tests — SZL Holdings Ecosystem
 * Dynamically discovers API route prefixes from routes/index.ts and merges them
 * with the known web-app route table. API discovery treats 401/403/405 as
 * "acceptable" (auth-gated or method-gated) — only 5xx and connection failures
 * are flagged as regressions.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/smoke-routes.js
 *   node scripts/qa/smoke-routes.js            (defaults to http://localhost:3000)
 *   node scripts/qa/smoke-routes.js --api-only  (API routes only)
 *   node scripts/qa/smoke-routes.js --web-only  (web frontend routes only)
 *   node scripts/qa/smoke-routes.js --json      (emit JSON output)
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TIMEOUT_MS = parseInt(process.env.SMOKE_TIMEOUT ?? "10000", 10);
const CONCURRENCY = parseInt(process.env.SMOKE_CONCURRENCY ?? "5", 10);
const API_ONLY = process.argv.includes("--api-only");
const WEB_ONLY = process.argv.includes("--web-only");
const JSON_OUTPUT = process.argv.includes("--json");

const ROOT = join(__dirname, "../..");
const ROUTES_INDEX = join(ROOT, "artifacts/api-server/src/routes/index.ts");

const PARAM_PATTERN = /:[a-zA-Z_]+/;
const SKIP_PATTERNS = ["/auth", "/billing/checkout", "/billing/cancel", "/billing/update", "/scim"];

function discoverApiPrefixes(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8");
  const paths = new Set();

  const usePattern = /router\.use\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = usePattern.exec(content)) !== null) {
    const p = match[1].trim();
    if (
      p.startsWith("/") &&
      p.length > 1 &&
      !PARAM_PATTERN.test(p) &&
      !SKIP_PATTERNS.some((s) => p.startsWith(s)) &&
      !p.includes("*")
    ) {
      paths.add(p);
    }
  }
  return Array.from(paths).sort();
}

const WEB_DOMAIN_ROUTES = {
  "SZL Holdings (root)": [
    "/",
    "/about",
    "/ecosystem",
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
    "/nuro-forge",
    "/nuro-forge/arena",
    "/nuro-forge/governance",
    "/nuro-forge/composition",
    "/nuro-forge/fine-tuning",
    "/nuro-forge/multimodal",
  ],

  "Ecosystem Command Portal": [
    "/command",
  ],

  "PRISM Counsel": [
    "/prism-counsel",
    "/prism-counsel/pulse",
    "/prism-counsel/today",
    "/prism-counsel/matters",
    "/prism-counsel/watchlist",
    "/prism-counsel/deadlines",
    "/prism-counsel/forecast",
    "/prism-counsel/playbooks",
    "/prism-counsel/review-desk",
    "/prism-counsel/copilot",
    "/prism-counsel/portfolio",
    "/prism-counsel/signoff-queue",
    "/prism-counsel/recovery-ops",
    "/prism-counsel/discovery",
    "/prism-counsel/parties",
    "/prism-counsel/agentic/contracts",
    "/prism-counsel/agentic/litigation-prediction",
    "/prism-counsel/agentic/e-discovery",
    "/prism-counsel/agentic/legal-spend",
    "/prism-counsel/agentic/regulatory-radar",
    "/prism-counsel/predict/settlement",
    "/prism-counsel/predict/judge-analytics",
    "/prism-counsel/predict/case-strength",
    "/prism-counsel/worldline",
    "/prism-counsel/signal-forge",
    "/prism-counsel/admin",
  ],

  "Lyte Command Center": [
    "/lyte-command-center",
    "/lyte-command-center/dashboard",
    "/lyte-command-center/ai-ops",
    "/lyte-command-center/alerts",
    "/lyte-command-center/action-center",
    "/lyte-command-center/executive-command",
    "/lyte-command-center/alloy-workflow-canvas",
    "/lyte-command-center/autonomous-noc",
    "/lyte-command-center/intervention-workspace",
    "/lyte-command-center/living-topology",
  ],

  "Aegis / Firestorm": [
    "/firestorm",
    "/firestorm/incidents",
    "/firestorm/alerts",
    "/firestorm/cases",
    "/firestorm/findings",
    "/firestorm/executive-risk",
    "/firestorm/asset-inventory",
    "/firestorm/command-home",
    "/firestorm/simulation-runner",
    "/firestorm/scenario-library",
    "/firestorm/agentic-soc",
    "/firestorm/adversary-engine",
    "/firestorm/deception-grid",
    "/firestorm/nexus/analyst-workspace",
  ],

  "Terra": [
    "/terra",
    "/terra/dashboard",
    "/terra/deals",
    "/terra/documents",
    "/terra/analytics",
    "/terra/executive-overview",
    "/terra/climate-risk",
    "/terra/agents-command",
    "/terra/unified-command",
    "/terra/portfolio-scenario",
    "/terra/distress-engine",
    "/terra/avm-engine",
  ],

  "Vessels": [
    "/vessels",
    "/vessels/fleet-dashboard",
    "/vessels/fleet-map",
    "/vessels/exceptions-center",
    "/vessels/alert-center",
    "/vessels/command-overview",
    "/vessels/document-engine",
    "/vessels/simulations-page",
    "/vessels/disruption-forecast",
    "/vessels/command-mode",
    "/vessels/voyage-desk",
    "/vessels/dark-vessel-detection",
  ],

  "Carlota Jo": [
    "/carlota-jo",
    "/carlota-jo/about",
    "/carlota-jo/approach",
    "/carlota-jo/booking",
    "/carlota-jo/contact",
    "/carlota-jo/founder",
    "/carlota-jo/consulting-os",
    "/carlota-jo/revenue-intelligence",
  ],

  "Stephen Site": [
    "/stephen",
    "/stephen/about",
    "/stephen/contact",
    "/stephen/career-command",
    "/stephen/thesis-tracker",
  ],
};

const KNOWN_READ_API_ROUTES = [
  "/api/health",
  "/api/health/live",
  "/api/health/ready",
  "/api/csrf-token",
  "/api/docs",
];

/**
 * Three-tier route checking:
 *
 * "web"      — React SPA routes: must return < 400 (HTML page load).
 * "api"      — Known concrete API endpoints (health, docs): must return 2xx.
 * "discover" — Dynamically discovered router.use() prefix mounts: must return < 500.
 *              A 404 here is expected — many middleware prefix mounts have no root
 *              GET handler. Only a 5xx indicates an Express crash regression.
 */
async function checkRouteUrl(url, timeout, tier) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SZL-QA-Smoke/2.0" },
    });
    const duration = Date.now() - start;
    clearTimeout(timer);
    let ok;
    if (tier === "web") {
      ok = res.status < 400;
    } else if (tier === "api") {
      ok = res.status >= 200 && res.status < 300;
    } else {
      ok = res.status < 500;
    }
    return { url, status: res.status, duration, ok, tier };
  } catch (err) {
    clearTimeout(timer);
    return { url, status: 0, duration: Date.now() - start, ok: false, tier, error: err.message };
  }
}

async function runDomainBatch(paths, tier, concurrency, timeout) {
  const results = [];
  for (let i = 0; i < paths.length; i += concurrency) {
    const batch = paths.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((path) => checkRouteUrl(BASE_URL + path, timeout, tier))
    );
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  const discoveredPrefixes = discoverApiPrefixes(ROUTES_INDEX);

  const knownApiSet = new Set(KNOWN_READ_API_ROUTES);
  const newlyDiscovered = discoveredPrefixes
    .map((p) => `/api${p}`)
    .filter((p) => !knownApiSet.has(p));

  if (!JSON_OUTPUT) {
    console.log(`\nSZL Holdings Ecosystem — Route Smoke Tests`);
    console.log(`Base URL:     ${BASE_URL}`);
    console.log(`Timeout:      ${TIMEOUT_MS}ms | Concurrency: ${CONCURRENCY}`);
    console.log(`API Discovery: ${discoveredPrefixes.length} prefixes from routes/index.ts`);
    console.log(`  Tiers: web=<400 | api(known)=2xx | discover(prefix)=<500 (404 ok, no root GET)`);
    console.log(`  Web routes require < 400 (full page load)\n`);
  }

  const domainSummary = [];
  const allResults = {};
  let totalPassed = 0;
  let totalFailed = 0;

  if (!API_ONLY) {
    for (const [domain, routes] of Object.entries(WEB_DOMAIN_ROUTES)) {
      if (!JSON_OUTPUT) console.log(`  ── ${domain} (${routes.length} routes)`);

      const results = await runDomainBatch(routes, "web", CONCURRENCY, TIMEOUT_MS);
      let dp = 0, df = 0;

      for (const result of results) {
        if (result.ok) {
          if (!JSON_OUTPUT) console.log(`    ✓ ${result.status} ${result.url} (${result.duration}ms)`);
          dp++; totalPassed++;
        } else {
          if (!JSON_OUTPUT) console.error(`    ✗ ${result.status} ${result.url} (${result.duration}ms)${result.error ? " — " + result.error : ""}`);
          df++; totalFailed++;
        }
      }

      allResults[domain] = results.map((r) => ({ path: r.url.replace(BASE_URL, ""), ok: r.ok, status: r.status, duration: r.duration, error: r.error ?? null }));
      domainSummary.push({ domain, passed: dp, failed: df, total: routes.length });
      if (!JSON_OUTPUT) console.log();
    }
  }

  if (!WEB_ONLY) {
    const apiSections = [
      { label: "API Health & Core (2xx required)", paths: KNOWN_READ_API_ROUTES, tier: "api" },
      { label: "API Prefixes (discovered router.use mounts, <500 required)", paths: newlyDiscovered, tier: "discover" },
    ];

    for (const { label, paths, tier } of apiSections) {
      if (paths.length === 0) continue;
      if (!JSON_OUTPUT) console.log(`  ── ${label} (${paths.length} routes)`);

      const results = await runDomainBatch(paths, tier, CONCURRENCY, TIMEOUT_MS);
      let dp = 0, df = 0;

      for (const result of results) {
        if (result.ok) {
          if (!JSON_OUTPUT) console.log(`    ✓ ${result.status} ${result.url} (${result.duration}ms)`);
          dp++; totalPassed++;
        } else {
          if (!JSON_OUTPUT) console.error(`    ✗ ${result.status} ${result.url} (${result.duration}ms)${result.error ? " — " + result.error : ""}`);
          df++; totalFailed++;
        }
      }

      allResults[label] = results.map((r) => ({ path: r.url.replace(BASE_URL, ""), ok: r.ok, status: r.status, duration: r.duration, error: r.error ?? null }));
      domainSummary.push({ domain: label, passed: dp, failed: df, total: paths.length });
      if (!JSON_OUTPUT) console.log();
    }
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      baseUrl: BASE_URL,
      timestamp: new Date().toISOString(),
      discoveredApiPrefixes: discoveredPrefixes.length,
      domains: allResults,
      summary: { total: totalPassed + totalFailed, passed: totalPassed, failed: totalFailed },
    }, null, 2));
  } else {
    console.log("── Domain Summary ─────────────────────────────────────────");
    for (const { domain, passed, failed, total } of domainSummary) {
      const icon = failed === 0 ? "✓" : "✗";
      console.log(`  ${icon} ${domain}: ${passed}/${total}${failed > 0 ? ` (${failed} FAILED)` : ""}`);
    }
    console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);
  }

  if (totalFailed > 0) {
    if (!JSON_OUTPUT) console.error(`\nFAIL — ${totalFailed} route(s) returned errors`);
    process.exit(1);
  } else {
    if (!JSON_OUTPUT) console.log(`\nPASS — All routes responding correctly`);
    process.exit(0);
  }
}

main();
