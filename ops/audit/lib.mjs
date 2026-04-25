/**
 * ops/audit/lib.mjs
 * Shared utilities for SZL Holdings operational audit harnesses.
 * Dependency-light — uses only Node built-ins and fetch (Node ≥18).
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Environment ──────────────────────────────────────────────────────────────

export const env = {
  TARGET_URL: process.env.TARGET_URL ?? 'http://localhost:3000',
  EXPECTED_TEXT: process.env.EXPECTED_TEXT ?? '',
  MAX_PAGES: parseInt(process.env.MAX_PAGES ?? '50', 10),
  STRESS_REQUESTS: parseInt(process.env.STRESS_REQUESTS ?? '50', 10),
  STRESS_CONCURRENCY: parseInt(process.env.STRESS_CONCURRENCY ?? '5', 10),
  MAX_P95_MS: parseInt(process.env.MAX_P95_MS ?? '3000', 10),
  REPORT_DIR: process.env.REPORT_DIR ?? resolve(__dirname, '../../ops/reports'),
};

// ── Logging ──────────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

export function log(msg) { console.log(`${GRAY}[audit]${RESET} ${msg}`); }
export function ok(msg) { console.log(`${GREEN}✓${RESET} ${msg}`); }
export function fail(msg) { console.error(`${RED}✗${RESET} ${msg}`); }
export function warn(msg) { console.warn(`${YELLOW}⚠${RESET} ${msg}`); }
export function section(title) {
  console.log(`\n${CYAN}── ${title} ──${RESET}`);
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch a URL with timeout, returning { status, body, durationMs, error }.
 */
export async function fetchWithTimeout(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'szl-audit-harness/1.0' },
    });
    const body = await res.text();
    return {
      status: res.status,
      body,
      durationMs: Date.now() - start,
      error: null,
    };
  } catch (err) {
    return {
      status: 0,
      body: '',
      durationMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check a response against expected conditions.
 * Returns { passed, reasons[] }
 */
export function validateResponse({ status, body, durationMs }, opts = {}) {
  const reasons = [];
  const expectedStatus = opts.expectedStatus ?? 200;
  const expectedText = opts.expectedText ?? env.EXPECTED_TEXT;

  if (status !== expectedStatus) {
    reasons.push(`HTTP ${status} (expected ${expectedStatus})`);
  }
  if (expectedText && !body.includes(expectedText)) {
    reasons.push(`Missing expected text: "${expectedText}"`);
  }
  if (opts.maxMs && durationMs > opts.maxMs) {
    reasons.push(`Slow: ${durationMs}ms (max ${opts.maxMs}ms)`);
  }

  return { passed: reasons.length === 0, reasons };
}

// ── Route manifest ───────────────────────────────────────────────────────────

export function loadRoutes() {
  const routesPath = resolve(__dirname, 'routes.json');
  const manifest = JSON.parse(readFileSync(routesPath, 'utf8'));
  const routes = [];
  for (const app of manifest.apps) {
    for (const route of app.routes) {
      routes.push({
        appId: app.id,
        appTitle: app.title,
        path: route.path,
        label: route.label,
      });
    }
  }
  return routes;
}

/**
 * Build a full URL from a route path, stripping duplicate base prefixes.
 */
export function buildUrl(basePath, routePath) {
  const base = basePath.replace(/\/$/, '');
  const path = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${base}${path}`;
}

// ── Statistics ───────────────────────────────────────────────────────────────

export function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

export function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1),
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

// ── Reporting ────────────────────────────────────────────────────────────────

export function ensureReportDir() {
  mkdirSync(env.REPORT_DIR, { recursive: true });
}

export function writeReport(filename, data) {
  ensureReportDir();
  const filePath = resolve(env.REPORT_DIR, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  log(`Report written → ${filePath}`);
  return filePath;
}

export function printSummary(label, results) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  section(`${label} Summary`);
  ok(`${passed} passed`);
  if (failed > 0) fail(`${failed} failed`);
  for (const r of results.filter(r => !r.passed)) {
    fail(`  ${r.label ?? r.url}: ${r.reasons?.join(', ') ?? 'unknown'}`);
  }
  return { passed, failed, total: results.length };
}
