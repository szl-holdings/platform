#!/usr/bin/env node
/**
 * health:check — SZL Holdings Platform
 * Verifies each downstream service individually (database, job queue,
 * WebSocket, GraphQL) and returns structured pass/fail per service.
 *
 * Usage:
 *   BASE_URL=https://api.szlholdings.com node scripts/qa/health-check.js
 *   node scripts/qa/health-check.js          (defaults to http://localhost:PORT or 5000)
 *   node scripts/qa/health-check.js --json   (emit full structured JSON report)
 *   node scripts/qa/health-check.js --fast   (primary health check only)
 *   node scripts/qa/health-check.js --strict (exit 1 on ANY failed check, not just primary)
 *
 * Exit semantics:
 *   0 (PASS)     — all checks passed
 *   0 (DEGRADED) — primary OK, secondary failures present (default mode only)
 *   1 (FAIL)     — primary health unreachable, OR any failure when --strict is set
 */

const PORT = process.env.PORT || '5000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TIMEOUT_MS = parseInt(process.env.HEALTH_TIMEOUT ?? '10000', 10);
const JSON_OUTPUT = process.argv.includes('--json');
const FAST_MODE = process.argv.includes('--fast');
const STRICT_MODE = process.argv.includes('--strict');

async function fetch_(url, options, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal, ...options });
    clearTimeout(timer);
    return { ok: res.status < 400, status: res.status, latency: Date.now() - start, res };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, latency: Date.now() - start, error: err.message };
  }
}

async function checkJsonEndpoint(url, name, requiredFields, timeout) {
  const result = await fetch_(
    url,
    {
      headers: { Accept: 'application/json', 'User-Agent': 'SZL-Health/2.0' },
    },
    timeout,
  );

  let body = null;
  if (result.res) {
    try {
      body = await result.res.json();
    } catch {
      body = null;
    }
  }

  if (!result.ok) {
    return {
      name,
      url,
      ok: false,
      latency: result.latency,
      httpStatus: result.status,
      error: result.error ?? `HTTP ${result.status}`,
      services: {},
      body,
    };
  }

  const missingFields = (requiredFields ?? []).filter((f) => body?.[f] === undefined);
  if (missingFields.length > 0) {
    return {
      name,
      url,
      ok: false,
      latency: result.latency,
      httpStatus: result.status,
      error: `Missing fields: ${missingFields.join(', ')}`,
      services: {},
      body,
    };
  }

  const statusVal = body?.status ?? body?.data?.status ?? 'ok';
  const validStatuses = ['ok', 'healthy', 'degraded', 'up', 'running', 'pass', '200'];
  const statusOk = validStatuses.includes(String(statusVal).toLowerCase());

  return {
    name,
    url,
    ok: statusOk,
    latency: result.latency,
    httpStatus: result.status,
    status: statusVal,
    services: extractServices(body),
    body,
    error: statusOk ? undefined : `Unexpected status: ${statusVal}`,
  };
}

function extractServices(body) {
  if (!body) return {};
  const services = {};

  if (body.services && typeof body.services === 'object') {
    for (const [key, value] of Object.entries(body.services)) {
      if (typeof value === 'object' && value !== null) {
        services[key] = {
          status: value.status ?? value.state ?? 'unknown',
          latency: value.latency ?? value.responseTime ?? null,
          ok: !['error', 'down', 'unhealthy', 'failed', 'disconnected'].includes(
            String(value.status ?? value.state ?? '').toLowerCase(),
          ),
        };
      } else {
        const sv = String(value);
        services[key] = {
          status: sv,
          ok: ['ok', 'healthy', 'up', 'connected', 'running'].includes(sv.toLowerCase()),
        };
      }
    }
  }

  const boolFields = {
    database: 'database',
    queue: 'queue',
    jobQueue: 'queue',
    websocket: 'websocket',
    graphql: 'graphql',
    redis: 'redis',
  };
  for (const [field, name] of Object.entries(boolFields)) {
    if (body[field] !== undefined && !(name in services)) {
      const val = body[field];
      if (typeof val === 'boolean') {
        services[name] = { status: val ? 'up' : 'down', ok: val };
      } else if (typeof val === 'string') {
        services[name] = {
          status: val,
          ok: ['ok', 'healthy', 'up', 'connected'].includes(val.toLowerCase()),
        };
      } else if (typeof val === 'object' && val !== null) {
        services[name] = {
          status: val.status ?? val.state ?? 'unknown',
          latency: val.latency ?? null,
          ok: !['error', 'down', 'unhealthy', 'failed'].includes(
            String(val.status ?? val.state ?? '').toLowerCase(),
          ),
        };
      }
    }
  }

  return services;
}

async function probeDatabase(base, timeout) {
  const result = await fetch_(
    `${base}/api/health/ready`,
    {
      headers: { Accept: 'application/json', 'User-Agent': 'SZL-Health/2.0' },
    },
    timeout,
  );

  let body = null;
  if (result.res) {
    try {
      body = await result.res.json();
    } catch {
      body = null;
    }
  }

  const dbStatus =
    body?.database ?? body?.db ?? body?.services?.database ?? (result.ok ? 'ok' : 'error');
  const isOk =
    result.ok && !['error', 'down', 'unhealthy', 'failed'].includes(String(dbStatus).toLowerCase());
  return {
    name: 'Database',
    url: `${base}/api/health/ready`,
    ok: isOk,
    latency: result.latency,
    status: String(dbStatus),
    detail: body,
  };
}

async function probeJobQueue(base, timeout) {
  const result = await fetch_(
    `${base}/api/health`,
    {
      headers: { Accept: 'application/json', 'User-Agent': 'SZL-Health/2.0' },
    },
    timeout,
  );

  let body = null;
  if (result.res) {
    try {
      body = await result.res.json();
    } catch {
      body = null;
    }
  }

  const queueStatus =
    body?.services?.queue?.status ??
    body?.services?.jobQueue?.status ??
    body?.queue ??
    body?.jobQueue ??
    (result.ok ? 'ok' : 'unknown');

  const isOk =
    result.ok &&
    !['error', 'down', 'unhealthy', 'failed'].includes(String(queueStatus).toLowerCase());
  return {
    name: 'Job Queue',
    url: `${base}/api/health`,
    ok: isOk,
    latency: result.latency,
    status: String(queueStatus),
  };
}

async function probeWebSocket(base, timeout) {
  const result = await fetch_(
    `${base}/api/health/detailed`,
    {
      headers: { Accept: 'application/json', 'User-Agent': 'SZL-Health/2.0' },
    },
    timeout,
  );

  let body = null;
  if (result.res) {
    try {
      body = await result.res.json();
    } catch {
      body = null;
    }
  }

  const wsStatus =
    body?.services?.websocket?.status ??
    body?.websocket ??
    body?.services?.realtime?.status ??
    (result.ok ? 'ok' : 'unknown');

  const isOk = !['error', 'down', 'unhealthy', 'failed'].includes(String(wsStatus).toLowerCase());
  return {
    name: 'WebSocket / Realtime',
    url: `${base}/api/health/detailed`,
    ok: isOk && result.ok,
    latency: result.latency,
    status: String(wsStatus),
  };
}

async function probeGraphQL(base, timeout) {
  const introspectionQuery = JSON.stringify({ query: '{ __typename }' });
  const result = await fetch_(
    `${base}/api/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'SZL-Health/2.0',
      },
      body: introspectionQuery,
    },
    timeout,
  );

  let body = null;
  if (result.res) {
    try {
      body = await result.res.json();
    } catch {
      body = null;
    }
  }

  const isOk = result.ok && (body?.data !== undefined || body?.errors !== undefined);
  return {
    name: 'GraphQL',
    url: `${base}/api/graphql`,
    ok: isOk,
    latency: result.latency,
    status: isOk ? 'ok' : (result.error ?? `HTTP ${result.status}`),
  };
}

const DOMAIN_ENDPOINTS = [
  { path: '/api/lyte', name: 'Lyte API' },
  { path: '/api/vessels', name: 'Vessels API' },
  { path: '/api/firestorm', name: 'Aegis (Aegis) API' },
  { path: '/api/terra', name: 'Terra API' },
  { path: '/api/prism-counsel', name: 'Counsel API' },
  { path: '/api/alloy', name: 'Alloy API' },
  { path: '/api/forge', name: 'Forge Runtime API' },
  { path: '/api/distribution-os', name: 'Distribution OS API' },
  { path: '/api/a2a', name: 'A2A (Agent-to-Agent) API' },
  { path: '/api/prism-bus', name: 'PRISM Bus API' },
  { path: '/api/analytics', name: 'Analytics API' },
  { path: '/api/notifications', name: 'Notifications API' },
  { path: '/api/jobs', name: 'Jobs API' },
];

function _formatLatency(ms) {
  if (ms < 100) return `${ms}ms (fast)`;
  if (ms < 500) return `${ms}ms (ok)`;
  if (ms < 2000) return `${ms}ms (slow)`;
  return `${ms}ms (very slow)`;
}

function printResult(result, _indent = '  ') {
  const _icon = result.ok ? '✓' : '✗';
  if (result.ok) {
    for (const [_svc, info] of Object.entries(result.services ?? {})) {
      const _svcIcon = info.ok !== false ? '·' : '!';
      const _latNote = info.latency ? ` ${info.latency}ms` : '';
    }
  } else {
  }
}

async function main() {
  if (!JSON_OUTPUT) {
  }

  const report = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    sections: {},
    summary: { total: 0, passed: 0, failed: 0 },
    overallStatus: 'PASS',
  };

  if (!JSON_OUTPUT) {}
  const coreEndpoints = [
    {
      path: '/api/health',
      name: 'API Health (primary)',
      requiredFields: ['status'],
      primary: true,
    },
    { path: '/api/health/live', name: 'Liveness Probe', requiredFields: [] },
    { path: '/api/health/ready', name: 'Readiness Probe', requiredFields: [] },
  ];

  const coreResults = await Promise.all(
    coreEndpoints.map(({ path, name, requiredFields }) =>
      checkJsonEndpoint(`${BASE_URL}${path}`, name, requiredFields, TIMEOUT_MS),
    ),
  );

  report.sections.coreHealth = coreResults.map(
    ({ name, url, ok, latency, httpStatus, status, error, services }) => ({
      name,
      url,
      ok,
      latency,
      httpStatus,
      status: status ?? null,
      error: error ?? null,
      services,
    }),
  );

  for (const r of coreResults) {
    report.summary.total++;
    if (r.ok) report.summary.passed++;
    else report.summary.failed++;
    if (!JSON_OUTPUT) printResult(r);
  }

  if (!FAST_MODE) {
    if (!JSON_OUTPUT) {}

    const serviceProbes = await Promise.all([
      probeDatabase(BASE_URL, TIMEOUT_MS),
      probeJobQueue(BASE_URL, TIMEOUT_MS),
      probeWebSocket(BASE_URL, TIMEOUT_MS),
      probeGraphQL(BASE_URL, TIMEOUT_MS),
    ]);

    report.sections.serviceProbes = serviceProbes.map(({ name, url, ok, latency, status }) => ({
      name,
      url,
      ok,
      latency,
      status,
    }));

    for (const probe of serviceProbes) {
      report.summary.total++;
      if (probe.ok) report.summary.passed++;
      else report.summary.failed++;
      if (!JSON_OUTPUT) {
        const _icon = probe.ok ? '✓' : '✗';
      }
    }

    if (!JSON_OUTPUT) {}

    const domainResults = await Promise.all(
      DOMAIN_ENDPOINTS.map(({ path, name }) =>
        checkJsonEndpoint(`${BASE_URL}${path}`, name, [], TIMEOUT_MS),
      ),
    );

    report.sections.domainEndpoints = domainResults.map(
      ({ name, url, ok, latency, httpStatus, status, error }) => ({
        name,
        url,
        ok,
        latency,
        httpStatus,
        status: status ?? null,
        error: error ?? null,
      }),
    );

    for (const r of domainResults) {
      report.summary.total++;
      if (r.ok) report.summary.passed++;
      else report.summary.failed++;
      if (!JSON_OUTPUT) printResult(r);
    }
  }

  if (report.summary.failed > 0) report.overallStatus = 'FAIL';

  if (JSON_OUTPUT) {
  } else {
  }

  const primaryResult = coreResults.find((r) => r.name.includes('primary'));
  const primaryOk = !primaryResult || primaryResult.ok;

  if (!primaryOk) {
    if (!JSON_OUTPUT) {
    }
    process.exit(1);
  } else if (report.summary.failed > 0) {
    if (STRICT_MODE) {
      if (!JSON_OUTPUT) {}
      process.exit(1);
    } else {
      if (!JSON_OUTPUT) {}
      process.exit(0);
    }
  } else {
    if (!JSON_OUTPUT) {}
    process.exit(0);
  }
}

main();
