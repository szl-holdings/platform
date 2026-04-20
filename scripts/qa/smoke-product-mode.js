#!/usr/bin/env node
/**
 * smoke-product-mode.js — Product-Mode Readiness Runner
 *
 * Validates that the platform is ready to operate in production/demo mode:
 *   1. Critical environment variables exist
 *   2. API server boots and responds to health check
 *   3. Auth endpoints are reachable
 *   4. Core trust routes load without error
 *   5. Health endpoint reports real dependency status (not optimistic stub)
 *   6. Demo data sentinel — confirms demo data is not treated as production data
 *   7. No production-blocking errors in health response
 *
 * Usage:
 *   node scripts/qa/smoke-product-mode.js
 *   BASE_URL=https://szlholdings.com node scripts/qa/smoke-product-mode.js
 *   BASE_URL=http://localhost:5000 node scripts/qa/smoke-product-mode.js
 *
 * Exit codes:
 *   0 — All checks passed
 *   1 — One or more Sev 0 or Sev 1 checks failed
 */

const BASE_URL = process.env.BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:5000';
const TIMEOUT_MS = parseInt(process.env.SMOKE_TIMEOUT_MS ?? '10000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

const pass = (msg) => console.log(`  ${COLORS.green}✓${COLORS.reset} ${msg}`);
const fail = (msg) => console.log(`  ${COLORS.red}✗${COLORS.reset} ${msg}`);
const warn = (msg) => console.log(`  ${COLORS.yellow}⚠${COLORS.reset} ${msg}`);
const info = (msg) => console.log(`  ${COLORS.cyan}ℹ${COLORS.reset} ${msg}`);
const header = (msg) => console.log(`\n${COLORS.bold}${msg}${COLORS.reset}`);

const results = { sev0: [], sev1: [], sev2: [], skipped: [] };

function recordSev0(name, message) {
  results.sev0.push({ name, message });
}
function recordSev1(name, message) {
  results.sev1.push({ name, message });
}
function recordSev2(name, message) {
  results.sev2.push({ name, message });
}
function recordSkip(name, reason) {
  results.skipped.push({ name, reason });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Check 1: Critical Environment Variables ──────────────────────────────────

header('Check 1: Critical Environment Variables');

const REQUIRED_ENV_VARS = [
  { name: 'DATABASE_URL', sev: 0, description: 'PostgreSQL connection string' },
  { name: 'SESSION_SECRET', sev: 0, description: 'Session signing secret' },
];

const RECOMMENDED_ENV_VARS = [
  { name: 'NODE_ENV', sev: 2, description: 'Runtime environment' },
  { name: 'PORT', sev: 2, description: 'Server port' },
];

const PRODUCTION_REQUIRED = [
  { name: 'OBJECT_STORAGE_BUCKET_ID', sev: 1, description: 'Cloud object storage' },
];

for (const { name, sev, description } of REQUIRED_ENV_VARS) {
  if (process.env[name]) {
    pass(`${name} — present (${description})`);
  } else {
    fail(`${name} — MISSING (${description})`);
    if (sev === 0) recordSev0(`env:${name}`, `Required env var ${name} is missing`);
    else recordSev1(`env:${name}`, `Required env var ${name} is missing`);
  }
}

for (const { name, description } of RECOMMENDED_ENV_VARS) {
  if (process.env[name]) {
    pass(`${name} — present (${description})`);
  } else {
    warn(`${name} — not set (${description})`);
    recordSev2(`env:${name}`, `Recommended env var ${name} is not set`);
  }
}

if (IS_PRODUCTION) {
  for (const { name, description } of PRODUCTION_REQUIRED) {
    if (process.env[name]) {
      pass(`${name} — present (${description}) [production-required]`);
    } else {
      fail(`${name} — MISSING in production (${description})`);
      recordSev1(`env:${name}`, `Production-required env var ${name} is missing`);
    }
  }
} else {
  info(`Skipping production-only env checks (NODE_ENV=${NODE_ENV})`);
}

// ─── Check 2: API Server Boot Health ─────────────────────────────────────────

header('Check 2: API Server Health Endpoint');

let healthData = null;
let healthReachable = false;

try {
  const healthUrl = `${BASE_URL}/api/health`;
  info(`GET ${healthUrl}`);
  const res = await fetchWithTimeout(healthUrl);

  if (res.status === 200) {
    pass(`/api/health — HTTP 200`);
    healthReachable = true;
    try {
      healthData = await res.json();
      const status = healthData?.status;
      if (status === 'ok') {
        pass(`Health status: ${status}`);
      } else if (status === 'degraded') {
        warn(`Health status: ${status} — check service dependencies`);
        recordSev1(
          'health:status',
          `Health endpoint reports degraded status: ${JSON.stringify(healthData?.services ?? {})}`,
        );
      } else {
        warn(`Health status: ${status ?? 'unknown'}`);
      }
    } catch {
      warn(`/api/health returned 200 but body is not valid JSON`);
      recordSev2('health:json', 'Health endpoint returned non-JSON body');
    }
  } else {
    fail(`/api/health — HTTP ${res.status}`);
    recordSev0('health:status-code', `/api/health returned HTTP ${res.status}`);
  }
} catch (err) {
  fail(`/api/health — ${err.message}`);
  recordSev0('health:reachable', `API server unreachable: ${err.message}`);
}

// ─── Check 3: Readiness Probe (DB-aware) ─────────────────────────────────────

header('Check 3: Readiness Probe (DB-aware health)');

try {
  const readyUrl = `${BASE_URL}/api/health/ready`;
  info(`GET ${readyUrl}`);
  const res = await fetchWithTimeout(readyUrl);

  if (res.status === 200) {
    pass(`/api/health/ready — HTTP 200`);
    try {
      const readyData = await res.json();
      // /api/health/ready uses { checks: { database, server, uptime } } shape
      // /api/health uses { services: { database: { status, latencyMs } } } shape
      const dbCheck = readyData?.checks?.database;
      const dbServiceStatus = readyData?.services?.database?.status;
      if (dbCheck === 'connected' || dbCheck === 'ok' || dbServiceStatus === 'ok') {
        pass(`Database status in readiness probe: connected`);
      } else if (dbCheck && dbCheck !== 'connected' && dbCheck !== 'ok') {
        fail(`Database status in readiness probe: ${dbCheck}`);
        recordSev1('health:db-degraded', `Readiness probe reports database: ${dbCheck}`);
      } else if (!readyData?.checks && !readyData?.services) {
        warn(`Readiness probe response has no checks or services key — health may be optimistic`);
        recordSev2('health:optimistic', 'Readiness probe lacks per-service status breakdown');
      }
    } catch {
      warn(`/api/health/ready body is not valid JSON`);
    }
  } else if (res.status === 503) {
    fail(`/api/health/ready — HTTP 503 (not ready)`);
    recordSev0('health:not-ready', 'Readiness probe returned 503 — system not ready');
  } else if (res.status === 404) {
    // /api/health/ready is not implemented in this API — fall back to /api/health
    info(
      `/api/health/ready — HTTP 404 (no dedicated readiness probe; using /api/health DB status)`,
    );
    if (healthReachable && healthData?.services?.database) {
      const dbStatus = healthData.services.database.status;
      if (dbStatus === 'ok') {
        pass(`Database status from /api/health: ok`);
      } else {
        fail(`Database status from /api/health: ${dbStatus}`);
        recordSev1('health:db-degraded', `DB status from /api/health is ${dbStatus}`);
      }
    } else {
      recordSkip(
        'health:ready',
        '/api/health/ready not implemented; DB status unavailable from /api/health',
      );
    }
  } else {
    warn(`/api/health/ready — HTTP ${res.status} (unexpected; checking /api/health fallback)`);
    if (healthReachable && healthData?.services?.database) {
      info(`Falling back to DB status from /api/health: ${healthData.services.database.status}`);
    }
  }
} catch {
  warn(`/api/health/ready — connection error; falling back to /api/health DB status`);
  if (healthReachable && healthData?.services?.database) {
    const dbStatus = healthData.services.database.status;
    if (dbStatus === 'ok') {
      pass(`Database status from /api/health: ok (fallback check)`);
    } else {
      fail(`Database status from /api/health: ${dbStatus}`);
      recordSev1('health:db-degraded-fallback', `DB status from /api/health is ${dbStatus}`);
    }
  } else {
    recordSkip('health:ready', '/api/health/ready not reachable; DB check skipped');
  }
}

// ─── Check 4: Auth Contract Validation ───────────────────────────────────────
//
// Validates the auth contract at three levels:
//   4a. /api/auth/user — returns 200 with { user: null } when unauthenticated,
//       confirming the auth endpoint is up and not erroring
//   4b. Auth guard enforcement — known protected routes must return 401 without
//       credentials; a 200 here means auth is bypassed (Sev 0)
//   4c. Login entry point — GET /api/login must be reachable (302 or 503 ok)
//
// Routes are derived from actual oidc-auth.ts and auth.ts registrations:
//   - GET  /api/auth/user    → user info (200 with {user:null} when anon)
//   - GET  /api/login        → OIDC login redirect (302 or 503 when unconfigured)
//   - POST /api/auth/login   → credential login (not probed — needs POST body)
//   - GET  /api/apm/snapshot → protected by authMiddleware() → must 401 anon
//   - GET  /api/connectors   → protected by authMiddleware() → must 401 anon

header('Check 4: Auth Contract Validation');

// 4a: Auth user endpoint — must be reachable and return non-5xx
// Returns { user: null } when unauthenticated (200 is correct behavior here)
try {
  const userUrl = `${BASE_URL}/api/auth/user`;
  info(`GET ${userUrl}`);
  const res = await fetchWithTimeout(userUrl, { method: 'GET' });

  if (res.status >= 500) {
    fail(`/api/auth/user — HTTP ${res.status} (server error on auth endpoint)`);
    recordSev0('auth:user-5xx', `/api/auth/user returned ${res.status} — auth system error`);
  } else if (res.status === 404) {
    fail(`/api/auth/user — HTTP 404 (auth/user endpoint not registered)`);
    recordSev1(
      'auth:user-missing',
      '/api/auth/user returned 404 — auth endpoint must be registered',
    );
  } else if (res.status === 200) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    if (body !== null && typeof body === 'object' && 'user' in body) {
      pass(`/api/auth/user — HTTP 200 with {user} shape (unauthenticated returns user:null)`);
    } else {
      pass(`/api/auth/user — HTTP 200 (auth endpoint up)`);
    }
  } else {
    pass(`/api/auth/user — HTTP ${res.status} (auth endpoint reachable)`);
  }
} catch (err) {
  fail(`/api/auth/user — ${err.message}`);
  recordSev0('auth:user-unreachable', `/api/auth/user unreachable: ${err.message}`);
}

// 4b: Auth guard enforcement — probe known protected routes without credentials.
// These routes use authMiddleware() with no { required: false } override, so they
// MUST return 401 for unauthenticated requests. A 200 means auth is bypassed (Sev 0).
const PROTECTED_ROUTES_TO_PROBE = [
  { path: '/api/apm/snapshot', description: 'APM snapshot — authMiddleware() enforced' },
  { path: '/api/connectors', description: 'Connectors list — authMiddleware() enforced' },
  { path: '/api/audit/events', description: 'Audit events — authMiddleware() enforced' },
];

let authGuardVerified = false;
for (const { path, description } of PROTECTED_ROUTES_TO_PROBE) {
  try {
    const url = `${BASE_URL}${path}`;
    info(`GET ${url} (without credentials — expecting 401)`);
    const res = await fetchWithTimeout(url, { method: 'GET' });

    if (res.status === 401 || res.status === 403) {
      pass(
        `${path} — HTTP ${res.status} (auth guard confirmed — unauthenticated request rejected)`,
      );
      authGuardVerified = true;
      break;
    } else if (res.status === 200) {
      fail(`${path} — HTTP 200 without credentials (auth guard BYPASSED!)`);
      recordSev0(
        'auth:guard-bypassed',
        `Protected route ${path} (${description}) returned 200 without credentials — auth middleware is broken`,
      );
      break;
    } else if (res.status >= 500) {
      warn(`${path} — HTTP ${res.status} (server error; trying next route)`);
    } else {
      info(`${path} — HTTP ${res.status} (unexpected; trying next route)`);
    }
  } catch {
    info(`${path} — not reachable; trying next protected route`);
  }
}

if (
  !authGuardVerified &&
  results.sev0.filter((r) => r.name === 'auth:guard-bypassed').length === 0
) {
  warn(
    'Auth guard unverifiable — known protected routes all returned non-200/non-401 (API server may not be running)',
  );
  recordSev2(
    'auth:guard-unverifiable',
    'Could not confirm auth guard enforcement — API server may be offline',
  );
}

// 4c: Login entry point — GET /api/login must exist (302 to OIDC or 503 when unconfigured)
try {
  const loginUrl = `${BASE_URL}/api/login`;
  info(`GET ${loginUrl}`);
  const res = await fetchWithTimeout(loginUrl, { method: 'GET', redirect: 'manual' });

  if (res.status >= 500) {
    fail(`/api/login — HTTP ${res.status} (server error on login route)`);
    recordSev1('auth:login-5xx', `/api/login returned ${res.status} — login entry point is broken`);
  } else if (res.status === 404) {
    fail(`/api/login — HTTP 404 (login route not registered)`);
    recordSev1(
      'auth:login-missing',
      '/api/login returned 404 — OIDC login entry point must be registered',
    );
  } else if (res.status === 302 || res.status === 301) {
    pass(`/api/login — HTTP ${res.status} (login redirects to OIDC provider)`);
  } else if (res.status === 503) {
    warn(`/api/login — HTTP 503 (OIDC not configured — acceptable in dev/staging without OIDC)`);
  } else {
    pass(`/api/login — HTTP ${res.status} (login route reachable)`);
  }
} catch (err) {
  warn(`/api/login — ${err.message}`);
  recordSev2('auth:login-unreachable', `/api/login not reachable: ${err.message}`);
}

// ─── Check 5: Core Trust Routes ──────────────────────────────────────────────

header('Check 5: Core Trust Routes');

// Trust routes are PUBLIC endpoints (no authMiddleware) that must respond 200.
// /api/status is excluded — it is protected and will always 401 unauthenticated.
// Use /api/auth/providers and /api/health/integrations as canonical public probes.
const TRUST_ROUTES = [
  { path: '/api/auth/providers', description: 'Auth providers list (public, from oidc-auth.ts)' },
  {
    path: '/api/health/integrations',
    description: 'Integration health snapshot (public, from health-integrations.ts)',
  },
  { path: '/api/health', description: 'Health endpoint (repeated, expect cached)' },
];

for (const { path, description } of TRUST_ROUTES) {
  try {
    const url = `${BASE_URL}${path}`;
    const res = await fetchWithTimeout(url);
    if (res.status < 400) {
      pass(`${path} — HTTP ${res.status} (${description})`);
    } else {
      warn(`${path} — HTTP ${res.status} (${description})`);
      recordSev2(`trust:${path}`, `Trust route ${path} returned ${res.status}`);
    }
  } catch (err) {
    warn(`${path} — not reachable (${err.message})`);
    recordSev2(`trust:${path}`, `Trust route ${path} unreachable`);
  }
}

// ─── Check 6: Demo Data Sentinel ─────────────────────────────────────────────

header('Check 6: Demo Data Sentinel');

if (IS_PRODUCTION) {
  info('Running in production — checking for demo data leakage indicators');
  try {
    if (healthData) {
      const version = healthData?.version;
      const isDemoVersion = typeof version === 'string' && version.includes('demo');
      if (isDemoVersion) {
        fail(`Version string contains 'demo' in production: ${version}`);
        recordSev1('demo:version', 'Production health endpoint exposes demo version marker');
      } else {
        pass(`Version string does not indicate demo mode: ${version ?? '(not set)'}`);
      }
    } else {
      info('Health data unavailable — skipping version check');
      recordSkip('demo:version', 'Health data not available for demo sentinel check');
    }
  } catch {
    recordSkip('demo:sentinel', 'Demo data sentinel skipped — health not available');
  }
} else {
  info(`NODE_ENV=${NODE_ENV} — demo data checks are relaxed in non-production`);
  pass('Demo data sentinel skipped for non-production environment');
}

// ─── Check 7: Health Endpoint Authenticity ───────────────────────────────────

header('Check 7: Health Endpoint Authenticity (Anti-Optimism Check)');

if (healthData?.services) {
  const db = healthData.services.database;
  if (!db) {
    warn('Health endpoint does not report database status — may be optimistic');
    recordSev2('health:authenticity', 'Health endpoint lacks database status field');
  } else if (db.status === 'ok' && typeof db.latencyMs !== 'number') {
    warn("Health endpoint reports DB 'ok' without a latency measurement — may not be checking DB");
    recordSev2(
      'health:db-check-depth',
      'DB health check lacks latency measurement — verify it performs a real query',
    );
  } else {
    pass(
      `Health endpoint reports database status: ${db.status} (latency: ${db.latencyMs ?? 'N/A'}ms)`,
    );
  }

  const auth = healthData.services.auth;
  if (auth?.status === 'ok' && auth?.mode === 'missing_secret') {
    fail("Health reports auth 'ok' but mode is 'missing_secret' — contradictory status");
    recordSev1('health:auth-contradiction', 'Auth status is ok but session secret is missing');
  } else if (auth) {
    pass(`Auth status: ${auth.status} (mode: ${auth.mode ?? 'N/A'})`);
  }
} else if (healthReachable) {
  warn('Health endpoint reachable but lacks services breakdown — treating as optimistic');
  recordSev2('health:no-services', 'Health endpoint does not include per-service status');
} else {
  recordSkip('health:authenticity', 'Health endpoint not reachable — cannot check authenticity');
}

// ─── Final Report ─────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`${COLORS.bold}Product-Mode Smoke Test — Results${COLORS.reset}`);
console.log('─'.repeat(60));

const totalFailed = results.sev0.length + results.sev1.length;
const totalWarnings = results.sev2.length;

if (results.sev0.length > 0) {
  console.log(
    `\n${COLORS.red}${COLORS.bold}SEV 0 FAILURES (${results.sev0.length}) — DEPLOYMENT BLOCKED:${COLORS.reset}`,
  );
  for (const { name, message } of results.sev0) {
    console.log(`  ${COLORS.red}✗ [${name}] ${message}${COLORS.reset}`);
  }
}

if (results.sev1.length > 0) {
  console.log(
    `\n${COLORS.yellow}${COLORS.bold}SEV 1 FAILURES (${results.sev1.length}) — RELEASE BLOCKED:${COLORS.reset}`,
  );
  for (const { name, message } of results.sev1) {
    console.log(`  ${COLORS.yellow}✗ [${name}] ${message}${COLORS.reset}`);
  }
}

if (results.sev2.length > 0) {
  console.log(
    `\n${COLORS.cyan}SEV 2 WARNINGS (${results.sev2.length}) — Fix this sprint:${COLORS.reset}`,
  );
  for (const { name, message } of results.sev2) {
    console.log(`  ${COLORS.cyan}⚠ [${name}] ${message}${COLORS.reset}`);
  }
}

if (results.skipped.length > 0) {
  console.log(`\nSkipped (${results.skipped.length}):`);
  for (const { name, reason } of results.skipped) {
    console.log(`  - [${name}] ${reason}`);
  }
}

console.log('\n' + '─'.repeat(60));

if (totalFailed === 0 && totalWarnings === 0) {
  console.log(`${COLORS.green}${COLORS.bold}✓ All product-mode checks passed.${COLORS.reset}`);
} else if (totalFailed === 0) {
  console.log(
    `${COLORS.yellow}${COLORS.bold}⚠ No blocking failures. ${totalWarnings} warning(s) to address.${COLORS.reset}`,
  );
} else {
  console.log(
    `${COLORS.red}${COLORS.bold}✗ ${totalFailed} blocking failure(s). Platform not ready for release.${COLORS.reset}`,
  );
  if (results.sev0.length > 0) {
    console.log(
      `${COLORS.red}  Sev 0 failures require immediate resolution before any deployment.${COLORS.reset}`,
    );
  }
}

console.log(`\nSee docs/FAILURE_SEVERITY_POLICY.md for severity definitions.\n`);

// ─── GitHub Actions Step Summary ─────────────────────────────────────────────
// When running in GitHub Actions, $GITHUB_STEP_SUMMARY points to a markdown file
// that gets rendered in the PR check view. Writing a summary here makes failures
// easy to read without scrolling through raw logs (where ANSI colors are stripped).

if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    const fs = await import('node:fs');

    const overall =
      totalFailed === 0 && totalWarnings === 0
        ? '✅ All product-mode checks passed'
        : totalFailed === 0
          ? `⚠️ No blocking failures — ${totalWarnings} warning(s) to address`
          : `❌ ${totalFailed} blocking failure(s) — platform not ready for release`;

    const lines = [];
    lines.push(`## Product-Mode Smoke Test`);
    lines.push('');
    lines.push(`**Base URL:** \`${BASE_URL}\`  `);
    lines.push(`**NODE_ENV:** \`${NODE_ENV}\`  `);
    lines.push(`**Result:** ${overall}`);
    lines.push('');
    lines.push(`| Severity | Count |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Sev 0 (deployment blocked) | ${results.sev0.length} |`);
    lines.push(`| Sev 1 (release blocked) | ${results.sev1.length} |`);
    lines.push(`| Sev 2 (warnings) | ${results.sev2.length} |`);
    lines.push(`| Skipped | ${results.skipped.length} |`);
    lines.push('');

    const renderRows = (items) =>
      items.length === 0
        ? '_None_'
        : [
            `| Check | Detail |`,
            `| --- | --- |`,
            ...items.map(
              ({ name, message, reason }) =>
                `| \`${name}\` | ${String(message ?? reason ?? '').replace(/\|/g, '\\|')} |`,
            ),
          ].join('\n');

    if (results.sev0.length > 0) {
      lines.push(`### ❌ Sev 0 — Deployment Blocked (${results.sev0.length})`);
      lines.push(renderRows(results.sev0));
      lines.push('');
    }
    if (results.sev1.length > 0) {
      lines.push(`### ❌ Sev 1 — Release Blocked (${results.sev1.length})`);
      lines.push(renderRows(results.sev1));
      lines.push('');
    }
    if (results.sev2.length > 0) {
      lines.push(`### ⚠️ Sev 2 — Warnings (${results.sev2.length})`);
      lines.push(renderRows(results.sev2));
      lines.push('');
    }
    if (results.skipped.length > 0) {
      lines.push(`<details><summary>Skipped checks (${results.skipped.length})</summary>`);
      lines.push('');
      lines.push(renderRows(results.skipped));
      lines.push('');
      lines.push(`</details>`);
      lines.push('');
    }

    lines.push(`<sub>See \`docs/FAILURE_SEVERITY_POLICY.md\` for severity definitions.</sub>`);
    lines.push('');

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
  } catch (err) {
    console.log(`(Could not write GITHUB_STEP_SUMMARY: ${err.message})`);
  }
}

process.exit(totalFailed > 0 ? 1 : 0);
