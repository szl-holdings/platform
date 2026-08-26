#!/usr/bin/env node
/**
 * Route Smoke Tests — SZL Holdings Ecosystem
 * Each app runs on its own port; routes are tested against the correct server.
 * API health routes are tested directly against the runtime API (apps/alloy-runtime-api).
 *
 * Usage:
 *   node scripts/qa/smoke-routes.js
 *   node scripts/qa/smoke-routes.js --api-only
 *   node scripts/qa/smoke-routes.js --web-only
 *   node scripts/qa/smoke-routes.js --json
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { artifactUrl } from '../lib/artifact-ports.js';

const TIMEOUT_MS = parseInt(process.env.SMOKE_TIMEOUT ?? '10000', 10);
const CONCURRENCY = parseInt(process.env.SMOKE_CONCURRENCY ?? '5', 10);
const API_ONLY = process.argv.includes('--api-only');
const WEB_ONLY = process.argv.includes('--web-only');
const JSON_OUTPUT = process.argv.includes('--json');

const ROOT = join(__dirname, '../..');
const ROUTES_INDEX = join(ROOT, 'artifacts/api-server/src/routes/index.ts');

// Per-app base URLs — env override takes priority; defaults from scripts/lib/artifact-ports.js.
// To change a port, update artifact-ports.js — one change propagates to all QA scripts.
// Live product artifacts only. The monorepo was shrunk to six web apps + the
// runtime API (2026-07); szl-holdings, aegis, command, pulse, and lyte were
// deleted alongside their route configs (see git history for the old surface).
const TERRA_URL = process.env.TERRA_URL || artifactUrl('terra');
const VESSELS_URL = process.env.VESSELS_URL || artifactUrl('vessels');
const CJ_URL = process.env.CJ_URL || artifactUrl('carlota-jo');
const API_URL = process.env.API_URL || artifactUrl('api-server');
const SENTRA_URL = process.env.SENTRA_URL || artifactUrl('sentra');
const COUNSEL_URL = process.env.COUNSEL_URL || artifactUrl('counsel');
const A11OY_URL = process.env.A11OY_URL || artifactUrl('a11oy');

// Legacy single-base-url override (used by external callers)
const BASE_URL = process.env.BASE_URL || null;

const PARAM_PATTERN = /:[a-zA-Z_]+/;
const SKIP_PATTERNS = ['/auth', '/billing/checkout', '/billing/cancel', '/billing/update', '/scim'];

function discoverApiPrefixes(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf8');
  const paths = new Set();

  const usePattern = /router\.use\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = usePattern.exec(content)) !== null) {
    const p = match[1].trim();
    if (
      p.startsWith('/') &&
      p.length > 1 &&
      !PARAM_PATTERN.test(p) &&
      !SKIP_PATTERNS.some((s) => p.startsWith(s)) &&
      !p.includes('*')
    ) {
      paths.add(p);
    }
  }
  return Array.from(paths).sort();
}

// Domain config: each entry has a name, baseUrl, and route paths
// Routes are relative paths appended to baseUrl
const WEB_DOMAIN_CONFIGS = [
  {
    name: 'Terra',
    baseUrl: BASE_URL ? `${BASE_URL}` : TERRA_URL,
    routes: [
      '/terra/',
      '/terra/dashboard',
      '/terra/deals',
      '/terra/documents',
      '/terra/analytics',
      '/terra/executive-overview',
      '/terra/climate-risk',
      '/terra/agents-command',
      '/terra/unified-command',
      '/terra/portfolio-scenario',
      '/terra/distress-engine',
      '/terra/avm-engine',
    ],
  },
  {
    name: 'Vessels',
    baseUrl: BASE_URL ? `${BASE_URL}` : VESSELS_URL,
    routes: [
      '/vessels/',
      '/vessels/fleet-dashboard',
      '/vessels/fleet-map',
      '/vessels/exceptions-center',
      '/vessels/alert-center',
      '/vessels/command-overview',
      '/vessels/document-engine',
      '/vessels/simulations-page',
      '/vessels/disruption-forecast',
      '/vessels/command-mode',
      '/vessels/voyage-desk',
      '/vessels/dark-vessel-detection',
    ],
  },
  {
    name: 'Carlota Jo',
    baseUrl: BASE_URL ? `${BASE_URL}` : CJ_URL,
    routes: [
      '/carlota-jo/',
      '/carlota-jo/about',
      '/carlota-jo/approach',
      '/carlota-jo/booking',
      '/carlota-jo/contact',
      '/carlota-jo/founder',
      '/carlota-jo/consulting-os',
      '/carlota-jo/revenue-intelligence',
    ],
  },
  {
    name: 'Sentra — Cyber Resilience',
    baseUrl: BASE_URL ? `${BASE_URL}` : SENTRA_URL,
    routes: [
      '/sentra/',
      '/sentra/decision-center',
      '/sentra/dashboard',
      '/sentra/threats',
      '/sentra/assets',
      '/sentra/incident',
      '/sentra/exposure',
      '/sentra/controls',
      '/sentra/resilience',
      '/sentra/soc',
      '/sentra/alerts',
      '/sentra/incidents',
      '/sentra/investigations',
      '/sentra/threat-intelligence',
      '/sentra/compliance',
      '/sentra/mesh/map',
    ],
  },
  {
    name: 'Counsel — Legal Matter Command',
    baseUrl: BASE_URL ? `${BASE_URL}` : COUNSEL_URL,
    routes: [
      '/counsel/',
      '/counsel/dashboard',
      '/counsel/matters',
      '/counsel/alerts',
      '/counsel/risk',
      '/counsel/approvals',
      '/counsel/evidence',
      '/counsel/forecast',
      '/counsel/knowledge',
      '/counsel/obligations',
      '/counsel/performance',
      '/counsel/decision-center',
    ],
  },
  {
    name: 'A11oy — Brand Orchestration',
    baseUrl: BASE_URL ? `${BASE_URL}` : A11OY_URL,
    routes: [
      '/a11oy/',
      '/a11oy/start',
      '/a11oy/investor-demo',
      '/a11oy/now',
      '/a11oy/recommendations',
      '/a11oy/brief',
      '/a11oy/command',
      '/a11oy/signals',
      '/a11oy/actions',
      '/a11oy/proof',
      '/a11oy/governance',
      '/a11oy/agents',
      '/a11oy/workcells',
      '/a11oy/connectors',
      '/a11oy/sovereign',
      '/a11oy/verticals',
      '/a11oy/fabric',
      '/a11oy/tools',
    ],
  },
];

// The runtime API (apps/alloy-runtime-api) mounts its router at the root, so
// these are the real unauthenticated 2xx endpoints — NOT the legacy /api/*
// surface of the retired api-server. /readyz returns 503 (a failure) if any
// in-process dependency probe fails, so it is a genuine readiness gate.
const KNOWN_READ_API_ROUTES = ['/health', '/healthz', '/readyz', '/metrics', '/docs'];

async function checkRouteUrl(url, timeout, tier) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SZL-QA-Smoke/2.0' },
    });
    const duration = Date.now() - start;
    clearTimeout(timer);
    let ok;
    if (tier === 'web') {
      ok = res.status < 400;
    } else if (tier === 'api') {
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

async function runDomainBatch(baseUrl, paths, tier, concurrency, timeout) {
  const results = [];
  for (let i = 0; i < paths.length; i += concurrency) {
    const batch = paths.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((path) => checkRouteUrl(baseUrl + path, timeout, tier)),
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
    console.log(`\nSZL Holdings — Route Smoke Runner`);
    console.log(
      `Timeout: ${TIMEOUT_MS}ms  Concurrency: ${CONCURRENCY}  API-only: ${API_ONLY}  Web-only: ${WEB_ONLY}\n`,
    );
  }

  const domainSummary = [];
  const allResults = {};
  let totalPassed = 0;
  let totalFailed = 0;

  if (!API_ONLY) {
    for (const { name, baseUrl, routes } of WEB_DOMAIN_CONFIGS) {
      if (!JSON_OUTPUT) console.log(`\n[${name}]  base: ${baseUrl}`);

      const results = await runDomainBatch(baseUrl, routes, 'web', CONCURRENCY, TIMEOUT_MS);
      let dp = 0,
        df = 0;

      for (const result of results) {
        if (result.ok) {
          if (!JSON_OUTPUT)
            console.log(
              `  PASS  ${result.status}  ${result.duration}ms  ${result.url.replace(baseUrl, '')}`,
            );
          dp++;
          totalPassed++;
        } else {
          if (!JSON_OUTPUT)
            console.error(
              `  FAIL  ${result.status}  ${result.duration}ms  ${result.url.replace(baseUrl, '')}${result.error ? '  err=' + result.error : ''}`,
            );
          df++;
          totalFailed++;
        }
      }

      allResults[name] = results.map((r) => ({
        path: r.url.replace(baseUrl, ''),
        ok: r.ok,
        status: r.status,
        duration: r.duration,
        error: r.error ?? null,
      }));
      domainSummary.push({ domain: name, passed: dp, failed: df, total: routes.length });
      if (!JSON_OUTPUT)
        console.log(`  → ${dp}/${routes.length} passed${df > 0 ? `  (${df} FAILED)` : ''}`);
    }
  }

  if (!WEB_ONLY) {
    const apiBaseUrl = BASE_URL || API_URL;
    const apiSections = [
      { label: 'API Health & Core (2xx required)', paths: KNOWN_READ_API_ROUTES, tier: 'api' },
      {
        label: 'API Prefixes (discovered router.use mounts, <500 required)',
        paths: newlyDiscovered,
        tier: 'discover',
      },
    ];

    for (const { label, paths, tier } of apiSections) {
      if (paths.length === 0) continue;
      if (!JSON_OUTPUT) console.log(`\n[${label}]  base: ${apiBaseUrl}`);

      const results = await runDomainBatch(apiBaseUrl, paths, tier, CONCURRENCY, TIMEOUT_MS);
      let dp = 0,
        df = 0;

      for (const result of results) {
        if (result.ok) {
          if (!JSON_OUTPUT)
            console.log(
              `  PASS  ${result.status}  ${result.duration}ms  ${result.url.replace(apiBaseUrl, '')}`,
            );
          dp++;
          totalPassed++;
        } else {
          if (!JSON_OUTPUT)
            console.error(
              `  FAIL  ${result.status}  ${result.duration}ms  ${result.url.replace(apiBaseUrl, '')}${result.error ? '  err=' + result.error : ''}`,
            );
          df++;
          totalFailed++;
        }
      }

      allResults[label] = results.map((r) => ({
        path: r.url.replace(apiBaseUrl, ''),
        ok: r.ok,
        status: r.status,
        duration: r.duration,
        error: r.error ?? null,
      }));
      domainSummary.push({ domain: label, passed: dp, failed: df, total: paths.length });
      if (!JSON_OUTPUT)
        console.log(`  → ${dp}/${paths.length} passed${df > 0 ? `  (${df} FAILED)` : ''}`);
    }
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ summary: domainSummary, results: allResults }, null, 2));
  } else {
    console.log('\n--- Summary ---');
    for (const { domain, passed, failed, total } of domainSummary) {
      const icon = failed === 0 ? '✓' : '✗';
      console.log(
        `  ${icon}  ${domain}: ${passed}/${total}${failed > 0 ? `  (${failed} failed)` : ''}`,
      );
    }
    console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);
  }

  if (totalFailed > 0) {
    if (!JSON_OUTPUT)
      console.error(`\nSmoke run FAILED — ${totalFailed} route(s) did not meet expectations.`);
    process.exit(1);
  } else {
    if (!JSON_OUTPUT) console.log(`\nSmoke run PASSED`);
    process.exit(0);
  }
}

main();
