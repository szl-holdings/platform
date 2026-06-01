#!/usr/bin/env node
/**
 * SZL Holdings — Workflow Connectivity Pre-Check
 *
 * Checks whether required dev server URLs are accessible before running
 * the proof screenshot capture. The capture script requires all artifact
 * workflows to be running and serving on their configured ports.
 *
 * Since Replit manages workflow lifecycle through its platform UI (not via
 * shell commands), this script cannot start workflows automatically.
 * It provides clear, actionable guidance when servers are offline.
 *
 * Usage:
 *   node scripts/assert-workflows-running.mjs
 *   (called automatically by pnpm screenshots:proof)
 */

import { createServer } from 'node:net';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL
  ?? (process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:80');

/**
 * Map of artifact route to their expected port on localhost.
 * In the Replit environment, each artifact dev server binds to the PORT
 * env variable assigned to that workflow. The proxy at :80 routes paths
 * to the correct port — but the proxy only routes workflows that are running.
 */
const REQUIRED_ROUTES = [
  { id: 'a11oy', path: '/a11oy/', description: 'A11oy — Live Enterprise Execution Fabric', required: true },
  { id: 'command', path: '/command/', description: 'Command', required: false },
  { id: 'aegis', path: '/aegis/', description: 'Aegis', required: false },
  { id: 'sentra', path: '/sentra/', description: 'Sentra', required: false },
  { id: 'pulse', path: '/pulse/', description: 'Pulse', required: false },
  { id: 'counsel', path: '/counsel/', description: 'Counsel', required: false },
  { id: 'terra', path: '/terra/', description: 'Terra', required: false },
  { id: 'vessels', path: '/vessels/', description: 'Vessels', required: false },
  { id: 'carlota-jo', path: '/carlota-jo/', description: 'Carlota Jo', required: false },
  { id: 'szl-holdings', path: '/', description: 'SZL Holdings Dashboard', required: false },
];

async function check(route) {
  try {
    const url = BASE_URL + route.path;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return { ...route, ok: res.ok || res.status < 500, status: res.status };
  } catch {
    return { ...route, ok: false, status: 0 };
  }
}

const results = await Promise.all(REQUIRED_ROUTES.map(check));
const offline = results.filter(r => !r.ok);
const requiredOffline = offline.filter(r => r.required);
const optionalOffline = offline.filter(r => !r.required);
const online = results.filter(r => r.ok);

console.log('\n  SZL Holdings — Workflow Pre-Check');
console.log(`  Base URL: ${BASE_URL}\n`);

for (const r of results) {
  const icon = r.ok ? '  ✓' : r.required ? '  ✗' : '  ⚠';
  const status = r.ok ? `HTTP ${r.status}` : 'offline';
  console.log(`${icon}  ${r.description.padEnd(40)} ${status}`);
}

console.log();

if (requiredOffline.length > 0) {
  console.error('  ERROR: Required artifact(s) are offline:');
  for (const r of requiredOffline) {
    console.error(`    - ${r.description} (${r.path})`);
  }
  console.error('\n  Fix: Start the required workflows in the Replit workspace before running pnpm screenshots:proof.');
  console.error('  In the Replit UI: open the Workflows panel and start each required workflow.\n');
  process.exit(1);
}

if (optionalOffline.length > 0) {
  console.warn(`  WARNING: ${optionalOffline.length} optional artifact(s) are offline.`);
  console.warn('  Artifact hero screenshots for offline services will be recorded as FAIL in the manifest.');
  console.warn('  To capture all heroes: start all workflows before running pnpm screenshots:proof.\n');
}

console.log(`  ${online.length} of ${results.length} services reachable. Proceeding with capture.\n`);
