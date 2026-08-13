#!/usr/bin/env node
/**
 * Product-mode smoke for the current Alloy Runtime API contract.
 *
 * The target server is already running. This probe verifies build identity,
 * dependency readiness, fail-closed API-key enforcement, and an authenticated,
 * tenant-scoped read without calling any mutation endpoint.
 */

import { appendFileSync } from 'node:fs';
import { artifactUrl } from '../lib/artifact-ports.js';

const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.BASE_URL ??
  artifactUrl('api-server')
).replace(/\/+$/, '');
const SMOKE_API_KEY = process.env.SMOKE_API_KEY;
const INVALID_SMOKE_API_KEY = `${SMOKE_API_KEY ?? 'unset'}-deliberately-invalid`;
const EXPECTED_GIT_SHA = process.env.GITHUB_SHA?.trim() || null;
const SMOKE_TENANT_ID = `runtime-audit-${process.env.GITHUB_RUN_ID ?? process.pid}`;
const parsedTimeout = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? '10000', 10);
const TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 10_000;
const EXPECTED_DEPENDENCIES = ['memory-store', 'run-registry', 'workflow-runtime'];

const checks = [];
let livenessGitSha = null;

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isValidDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

async function fetchJson(pathname, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${pathname}`, {
      ...options,
      signal: controller.signal,
    });
    const rawBody = await response.text();
    let body = null;

    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new Error(`${pathname} returned invalid JSON`);
      }
    }

    return { response, body };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${pathname} timed out after ${TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runCheck(id, probe) {
  const startedAt = Date.now();

  try {
    const detail = await probe();
    const result = { id, passed: true, detail, durationMs: Date.now() - startedAt };
    checks.push(result);
    writeStdout(`PASS ${id}: ${detail}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const result = { id, passed: false, detail, durationMs: Date.now() - startedAt };
    checks.push(result);
    writeStderr(`FAIL ${id}: ${detail}`);
  }
}

writeStdout(`Product-mode smoke target: ${API_BASE_URL}`);
writeStdout(`Expected build SHA: ${EXPECTED_GIT_SHA ?? '(not supplied)'}`);

await runCheck('liveness-build-identity', async () => {
  const { response, body } = await fetchJson('/healthz');

  invariant(response.status === 200, `/healthz returned HTTP ${response.status}, expected 200`);
  invariant(body && typeof body === 'object', '/healthz returned no JSON object');
  invariant(
    body.status === 'ok',
    `/healthz status is ${JSON.stringify(body.status)}, expected "ok"`,
  );
  invariant(
    body.service === 'alloy-runtime-api',
    `/healthz service is ${JSON.stringify(body.service)}, expected "alloy-runtime-api"`,
  );
  invariant(
    typeof body.version === 'string' && body.version.length > 0,
    '/healthz version is empty',
  );
  invariant(typeof body.gitSha === 'string' && body.gitSha.length > 0, '/healthz gitSha is empty');
  invariant(isValidDate(body.bootTime), '/healthz bootTime is not a valid timestamp');
  invariant(
    Number.isFinite(body.uptimeSeconds) && body.uptimeSeconds >= 0,
    '/healthz uptimeSeconds is not a finite nonnegative number',
  );

  if (EXPECTED_GIT_SHA) {
    invariant(
      body.gitSha === EXPECTED_GIT_SHA,
      `/healthz gitSha ${body.gitSha} does not match expected ${EXPECTED_GIT_SHA}`,
    );
  }

  livenessGitSha = body.gitSha;
  return `HTTP 200; service=${body.service}; gitSha=${body.gitSha}`;
});

await runCheck('dependency-readiness', async () => {
  const { response, body } = await fetchJson('/readyz');

  invariant(response.status === 200, `/readyz returned HTTP ${response.status}, expected 200`);
  invariant(body && typeof body === 'object', '/readyz returned no JSON object');
  invariant(body.ready === true, `/readyz ready is ${JSON.stringify(body.ready)}, expected true`);
  invariant(
    body.service === 'alloy-runtime-api',
    `/readyz service is ${JSON.stringify(body.service)}, expected "alloy-runtime-api"`,
  );
  invariant(isValidDate(body.checkedAt), '/readyz checkedAt is not a valid timestamp');
  invariant(Array.isArray(body.dependencies), '/readyz dependencies is not an array');
  invariant(typeof livenessGitSha === 'string', 'liveness build identity was not established');
  invariant(
    body.gitSha === livenessGitSha,
    `/readyz gitSha ${JSON.stringify(body.gitSha)} does not match /healthz ${livenessGitSha}`,
  );

  const dependencyNames = body.dependencies.map((dependency) => dependency?.name);
  invariant(
    body.dependencies.length === EXPECTED_DEPENDENCIES.length &&
      new Set(dependencyNames).size === EXPECTED_DEPENDENCIES.length &&
      EXPECTED_DEPENDENCIES.every((name) => dependencyNames.includes(name)),
    `/readyz dependencies are ${JSON.stringify(dependencyNames)}, expected ${JSON.stringify(EXPECTED_DEPENDENCIES)}`,
  );

  for (const dependency of body.dependencies) {
    invariant(dependency.ready === true, `${dependency.name} readiness is not true`);
    invariant(
      Number.isFinite(dependency.latencyMs) && dependency.latencyMs >= 0,
      `${dependency.name} latencyMs is not a finite nonnegative number`,
    );
    invariant(dependency.detail === 'ok', `${dependency.name} detail is not "ok"`);
  }

  return `HTTP 200; ready=true; dependencies=${dependencyNames.join(',')}`;
});

await runCheck('anonymous-api-key-guard', async () => {
  const { response, body } = await fetchJson('/v1/workflows', {
    headers: { 'X-Tenant-Id': SMOKE_TENANT_ID },
  });

  invariant(
    response.status === 401,
    `/v1/workflows returned HTTP ${response.status}, expected 401`,
  );
  invariant(
    body?.code === 'INVALID_API_KEY',
    `/v1/workflows error code is ${JSON.stringify(body?.code)}, expected "INVALID_API_KEY"`,
  );

  return 'HTTP 401; code=INVALID_API_KEY';
});

await runCheck('invalid-api-key-guard', async () => {
  const { response, body } = await fetchJson('/v1/workflows', {
    headers: {
      'X-Api-Key': INVALID_SMOKE_API_KEY,
      'X-Tenant-Id': SMOKE_TENANT_ID,
    },
  });

  invariant(
    response.status === 401,
    `/v1/workflows returned HTTP ${response.status} for an invalid key, expected 401`,
  );
  invariant(
    body?.code === 'INVALID_API_KEY',
    `/v1/workflows error code for an invalid key is ${JSON.stringify(body?.code)}, expected "INVALID_API_KEY"`,
  );

  return 'HTTP 401; code=INVALID_API_KEY';
});

await runCheck('authenticated-tenant-read', async () => {
  invariant(
    typeof SMOKE_API_KEY === 'string' && SMOKE_API_KEY.length > 0,
    'SMOKE_API_KEY is required for the authenticated product-mode probe',
  );

  const { response, body } = await fetchJson('/v1/workflows', {
    headers: {
      'X-Api-Key': SMOKE_API_KEY,
      'X-Tenant-Id': SMOKE_TENANT_ID,
    },
  });

  invariant(
    response.status === 200,
    `/v1/workflows returned HTTP ${response.status}, expected 200`,
  );
  invariant(Array.isArray(body?.runs), '/v1/workflows runs is not an array');
  invariant(
    body.tenantId === SMOKE_TENANT_ID,
    `/v1/workflows tenantId is ${JSON.stringify(body?.tenantId)}, expected ${SMOKE_TENANT_ID}`,
  );

  return `HTTP 200; tenantId=${body.tenantId}; runs=${body.runs.length}`;
});

const passed = checks.every((check) => check.passed);
const result = {
  schemaVersion: 1,
  baseUrl: API_BASE_URL,
  expectedGitSha: EXPECTED_GIT_SHA,
  tenantId: SMOKE_TENANT_ID,
  passed,
  checks,
};

writeStdout(`PRODUCT_SMOKE_RESULT ${JSON.stringify(result)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## Alloy Runtime product-mode smoke',
    '',
    `- Target: \`${API_BASE_URL}\``,
    `- Expected SHA: \`${EXPECTED_GIT_SHA ?? 'not supplied'}\``,
    `- Result: **${passed ? 'PASS' : 'FAIL'}**`,
    '',
    '| Check | Result | Detail |',
    '| --- | --- | --- |',
    ...checks.map(
      (check) =>
        `| \`${check.id}\` | ${check.passed ? 'PASS' : 'FAIL'} | ${check.detail.replace(/\|/g, '\\|')} |`,
    ),
    '',
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
}

process.exitCode = passed ? 0 : 1;
