#!/usr/bin/env node
/**
 * check-security-headers.mjs
 *
 * CI smoke check — fetches the root path for each web artifact and asserts
 * that all required security headers are present.
 *
 * Usage
 * -----
 *   node scripts/check-security-headers.mjs
 *
 * Exits 0 on success, 1 if any artifact is missing a required header.
 *
 * Environment
 * -----------
 *   BASE_URL   Override the host to probe (default: http://localhost:9090).
 *              The shared proxy on port 9090 routes every artifact's prefix
 *              to the correct upstream, so this script works against one host.
 *
 * Adding a new artifact
 * ---------------------
 * Add an entry to the ARTIFACTS array below with its preview path prefix.
 * See docs/csp-allowlist.md for the full runbook.
 */

import http from 'node:http';
import https from 'node:https';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:9090';

/**
 * Web artifacts to probe.  Each entry is the path prefix that the shared
 * proxy routes to the artifact's upstream dev/preview server.
 *
 * Kept in sync with packages/shared-proxy/src/index.ts:PROXY_ROUTES.
 */
const ARTIFACTS = [
  { name: 'szl-holdings (root)', path: '/' },
  { name: 'a11oy', path: '/a11oy/' },
  { name: 'carlota-jo', path: '/carlota-jo/' },
  { name: 'command', path: '/command/' },
  { name: 'conduit', path: '/conduit/' },
  { name: 'counsel', path: '/counsel/' },
  { name: 'lyte', path: '/lyte/' },
  { name: 'nexus (mockup-sandbox)', path: '/nexus/' },
  { name: 'pluginmesh', path: '/pluginmesh/' },
  { name: 'pulse', path: '/pulse/' },
  { name: 'sentra', path: '/sentra/' },
  { name: 'szl-demo-video', path: '/szl-demo-video/' },
  { name: 'terra', path: '/terra/' },
  { name: 'vessels', path: '/vessels/' },
  { name: 'api', path: '/api/' },
];

/**
 * Pass --allow-unreachable (or set ALLOW_UNREACHABLE=true) to treat
 * unreachable artifacts as warnings instead of CI failures.
 * Default: unreachable artifacts fail the check.
 */
const allowUnreachable =
  process.argv.includes('--allow-unreachable') ||
  process.env.ALLOW_UNREACHABLE === 'true';

/**
 * Headers required on every response regardless of protocol.
 * Each entry is [header-name, expected-substring] — the check passes when the
 * actual header value *contains* the substring (case-insensitive).
 */
const REQUIRED_HEADERS = [
  ['x-content-type-options', 'nosniff'],
  ['referrer-policy', 'strict-origin-when-cross-origin'],
  ['x-frame-options', 'sameorigin'],
  ['content-security-policy', 'default-src'],
];

/**
 * Additional headers validated only when probing over HTTPS.
 * HSTS is never sent over plain HTTP, so checking it against a local
 * dev proxy (http://localhost) would produce false failures.
 * In CI against the real deployment (https://...) all of these must pass.
 */
const HTTPS_REQUIRED_HEADERS = [
  ['strict-transport-security', 'max-age='],
  ['strict-transport-security', 'includesubdomains'],
];

const isHttps = BASE_URL.toLowerCase().startsWith('https');

// ─── HTTP fetch ───────────────────────────────────────────────────────────────

function fetchHeaders(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'GET' }, (res) => {
      res.resume();
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.setTimeout(10_000, () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = [];

for (const artifact of ARTIFACTS) {
  const url = `${BASE_URL}${artifact.path}`;
  let fetchResult;

  try {
    fetchResult = await fetchHeaders(url);
  } catch (err) {
    results.push({
      name: artifact.name,
      path: artifact.path,
      status: 'UNREACHABLE',
      missing: [],
      error: err.message,
    });
    continue;
  }

  const { headers } = fetchResult;
  const missing = [];

  const headersToCheck = [
    ...REQUIRED_HEADERS,
    ...(isHttps ? HTTPS_REQUIRED_HEADERS : []),
  ];

  for (const [headerName, fragment] of headersToCheck) {
    const actual = headers[headerName.toLowerCase()];
    if (!actual || !actual.toLowerCase().includes(fragment.toLowerCase())) {
      missing.push({ header: headerName, expected: fragment, actual: actual ?? '(absent)' });
    }
  }

  results.push({
    name: artifact.name,
    path: artifact.path,
    status: missing.length === 0 ? 'OK' : 'FAIL',
    missing,
    httpStatus: fetchResult.status,
  });
}

// ─── Report ───────────────────────────────────────────────────────────────────

const PASS = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✖\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';

console.log('\nSecurity headers smoke check\n' + '─'.repeat(60));

for (const r of results) {
  if (r.status === 'UNREACHABLE') {
    console.log(`${WARN} ${r.name.padEnd(30)} UNREACHABLE — ${r.error}`);
    continue;
  }

  const icon = r.status === 'OK' ? PASS : FAIL;
  console.log(`${icon} ${r.name.padEnd(30)} HTTP ${r.httpStatus}  ${r.path}`);

  for (const m of r.missing) {
    console.log(
      `   ${FAIL} Missing/wrong: ${m.header}\n` +
      `      expected to contain: ${m.expected}\n` +
      `      actual:              ${m.actual}`,
    );
  }
}

console.log('─'.repeat(60));

const reachable = results.filter((r) => r.status !== 'UNREACHABLE');
const unreachable = results.filter((r) => r.status === 'UNREACHABLE');
const headerFails = results.filter((r) => r.status === 'FAIL').length;
const unreachableFails = allowUnreachable ? 0 : unreachable.length;
const totalFails = headerFails + unreachableFails;
const passed = reachable.length - headerFails;

const unreachableNote = allowUnreachable
  ? `${unreachable.length} unreachable (skipped via --allow-unreachable)`
  : `${unreachable.length} unreachable (counted as failures)`;

console.log(
  `\nResults: ${passed} passed, ${headerFails} header-fail, ${unreachableNote}\n`,
);

if (totalFails > 0) {
  if (headerFails > 0) {
    console.error('One or more artifacts are missing required security headers.\n');
  }
  if (unreachableFails > 0) {
    console.error(
      `${unreachableFails} artifact(s) were unreachable.\n` +
      '  Pass --allow-unreachable or set ALLOW_UNREACHABLE=true to skip.\n' +
      `  BASE_URL=${BASE_URL}\n`,
    );
  }
  process.exit(1);
}

if (reachable.length === 0 && allowUnreachable) {
  console.error(
    'All artifacts were unreachable. Is the proxy server running?\n' +
    `  BASE_URL=${BASE_URL}\n`,
  );
  process.exit(1);
}

if (!isHttps) {
  console.log(
    'Note: Strict-Transport-Security (HSTS) is not validated over HTTP.\n' +
    '  Run with BASE_URL=https://... in production/CI to validate HSTS.\n',
  );
}

console.log('All reachable artifacts passed the security headers check.\n');
