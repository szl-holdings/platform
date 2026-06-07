#!/usr/bin/env node
/**
 * SZL Holdings API Load Test Baseline
 * Uses autocannon (install via: pnpm add -g autocannon).
 *
 * Latency percentiles: autocannon reports p50, p97.5 (closest to p95), and p99.
 * The "p95" column in the output is actually p97.5 from autocannon's internal histogram.
 *
 * Tests the 5 hottest API endpoints at 50 concurrent connections for 30s each.
 *
 * Usage:
 *   BASE_URL=http://localhost:5000 node tests/scripts/load-test.js
 *   LOAD_TEST_JSON=1 node tests/scripts/load-test.js > load-results.json
 *   ENDPOINT=/api/health node tests/scripts/load-test.js
 *
 * Requires autocannon (pnpm add -g autocannon or npx autocannon).
 */


const { execFileSync, spawn } = require('node:child_process');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TARGET_ENDPOINT = process.env.ENDPOINT || null;
const JSON_OUTPUT = process.env.LOAD_TEST_JSON === '1';

const CONCURRENCY = Number(process.env.LOAD_TEST_CONNECTIONS || 50);
const DURATION = Number(process.env.LOAD_TEST_DURATION || 30);
const PIPELINING = Number(process.env.LOAD_TEST_PIPELINING || 1);

const ENDPOINTS = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    description: 'Health check — baseline canary',
    p97_5Budget: 50,
  },
  {
    id: 'holdings',
    method: 'GET',
    path: '/api/holdings',
    description: 'Portfolio summary — SZL Holdings dashboard home',
    p97_5Budget: 300,
  },
  {
    id: 'vessels',
    method: 'GET',
    path: '/api/vessels',
    description: 'Vessel list — Vessels maritime grid',
    p97_5Budget: 300,
  },
  {
    id: 'terra-properties',
    method: 'GET',
    path: '/api/terra/properties',
    description: 'Property list — Terra real estate intelligence',
    p97_5Budget: 300,
  },
  {
    id: 'counsel-matters',
    method: 'GET',
    path: '/api/counsel/matters',
    description: 'Matter list — Counsel legal matter command',
    p97_5Budget: 300,
  },
];

const selected = TARGET_ENDPOINT
  ? ENDPOINTS.filter((e) => e.path === TARGET_ENDPOINT)
  : ENDPOINTS;

if (selected.length === 0) {
  process.exit(1);
}

function resolveAutocannonBin() {
  try {
    const which = execFileSync('which', ['autocannon'], { encoding: 'utf8' }).trim();
    if (which) return which;
  } catch {}
  try {
    const _npxResult = execFileSync('npx', ['--yes', 'autocannon', '--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return null;
  } catch {}
  return null;
}

function runAutocannon(endpoint) {
  const url = BASE_URL + endpoint.path;
  const args = [
    '--connections', String(CONCURRENCY),
    '--duration', String(DURATION),
    '--pipelining', String(PIPELINING),
    '--json',
    '--method', endpoint.method,
    '--headers', 'accept=application/json',
    url,
  ];

  const bin = resolveAutocannonBin();
  const cmd = bin ? [bin, ...args] : ['npx', 'autocannon', ...args];
  const [exe, ...cmdArgs] = cmd;

  return new Promise((resolve, reject) => {
    const proc = spawn(exe, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`autocannon exited ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Failed to parse autocannon output: ${e.message}\n${stdout}`));
      }
    });
  });
}

function _formatMs(ms) {
  if (ms === undefined || ms === null) return 'n/a';
  return `${Math.round(ms)} ms`;
}

function statusIcon(p97_5, budget) {
  if (p97_5 <= budget) return '✅';
  if (p97_5 <= budget * 1.5) return '⚠️ ';
  return '❌';
}

async function main() {
  if (!JSON_OUTPUT) {
  }

  const results = [];
  let overallPass = true;

  for (const endpoint of selected) {
    if (!JSON_OUTPUT) {
      process.stdout.write(`  Running ${endpoint.method} ${endpoint.path} ... `);
    }

    let result;
    try {
      result = await runAutocannon(endpoint);
    } catch (err) {
      if (!JSON_OUTPUT) {
      }
      results.push({ endpoint: endpoint.path, error: err.message });
      overallPass = false;
      continue;
    }

    const p50 = result.latency?.p50;
    const p97_5 = result.latency?.p97_5;
    const p99 = result.latency?.p99;
    const rps = result.requests?.average;
    const errors = result.errors || 0;
    const timeouts = result.timeouts || 0;
    const totalRequests = (result.requests?.total) || 0;
    const errorRate = totalRequests > 0 ? ((errors + timeouts) / totalRequests) * 100 : 0;

    const pass = p97_5 !== undefined ? p97_5 <= endpoint.p97_5Budget : true;
    if (!pass) overallPass = false;

    const summary = {
      id: endpoint.id,
      endpoint: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      concurrency: CONCURRENCY,
      duration: DURATION,
      p50Ms: Math.round(p50 || 0),
      p97_5Ms: Math.round(p97_5 || 0),
      p99Ms: Math.round(p99 || 0),
      rps: Math.round(rps || 0),
      totalRequests,
      errors,
      timeouts,
      errorRatePct: Math.round(errorRate * 100) / 100,
      p97_5Budget: endpoint.p97_5Budget,
      pass,
    };

    results.push(summary);

    if (!JSON_OUTPUT) {
      const _icon = statusIcon(p97_5, endpoint.p97_5Budget);
    }
  }

  if (JSON_OUTPUT) {
    process.exit(overallPass ? 0 : 1);
    return;
  }

  for (const r of results) {
    if (r.error) {
      continue;
    }
    const _icon = statusIcon(r.p97_5Ms, r.p97_5Budget);
  }

  process.exit(overallPass ? 0 : 1);
}

main().catch((_err) => {
  process.exit(1);
});
