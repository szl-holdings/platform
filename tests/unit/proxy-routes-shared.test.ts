/**
 * Shared Proxy Routes — Drift Prevention
 *
 * The PROXY_ROUTES table and the helper that wires it into Vite live in
 * packages/proxy-routes.ts. Every gateway artifact must import from that
 * single module so adding or changing a sub-path app only requires one
 * change. These tests lock in the invariants we rely on:
 *
 *   1. The five gateway vite configs called out by Task #1422 import the
 *      shared module instead of defining the routes inline.
 *   2. PROXY_ROUTES has no duplicate prefixes and no two prefixes map to
 *      the same upstream port (would silently swallow another artifact).
 *   3. Every prefix is normalised to start AND end with "/" so the
 *      `startsWith` matcher in sharedProxyPlugin behaves predictably.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AEGIS_PORT,
  CARLOTA_JO_PORT,
  COMMAND_PORT,
  PROXY_ROUTES,
  SHARED_PROXY_PORT,
  TERRA_PORT,
  VESSELS_PORT,
} from '../../packages/proxy-routes.js';

const REPO_ROOT = resolve(__dirname, '..', '..');

const GATEWAY_CONFIGS = [
  'artifacts/aegis/vite.config.ts',
  'artifacts/terra/vite.config.ts',
  'artifacts/carlota-jo/vite.config.ts',
  'artifacts/vessels/vite.config.ts',
  'artifacts/command/vite.config.ts',
];

describe('Shared proxy module is the single source of truth', () => {
  it.each(GATEWAY_CONFIGS)('%s imports sharedProxyPlugin from packages/proxy-routes', (rel) => {
    const src = readFileSync(resolve(REPO_ROOT, rel), 'utf8');
    expect(src).toMatch(/from\s+['"][^'"]*packages\/proxy-routes(?:\.js)?['"]/);
    expect(src).toMatch(/sharedProxyPlugin\s*\(/);
  });

  it.each(GATEWAY_CONFIGS)('%s does not redeclare the PROXY_ROUTES array inline', (rel) => {
    const src = readFileSync(resolve(REPO_ROOT, rel), 'utf8');
    // A local declaration would look like `const PROXY_ROUTES = [` (or let/var).
    // An import statement uses `import { PROXY_ROUTES }` — that is allowed.
    expect(src).not.toMatch(/(?:^|\s)(?:const|let|var)\s+PROXY_ROUTES\s*[:=]/);
  });
});

describe('PROXY_ROUTES invariants', () => {
  it('has no duplicate prefixes', () => {
    const prefixes = PROXY_ROUTES.map((r) => r.prefix);
    expect(prefixes.length).toBe(new Set(prefixes).size);
  });

  it('has no two routes mapped to the same upstream port', () => {
    const ports = PROXY_ROUTES.map((r) => r.port);
    expect(ports.length).toBe(new Set(ports).size);
  });

  it('reserves SHARED_PROXY_PORT — no upstream may collide with the listener', () => {
    expect(PROXY_ROUTES.find((r) => r.port === SHARED_PROXY_PORT)).toBeUndefined();
  });

  it('normalises every prefix to start and end with "/"', () => {
    for (const route of PROXY_ROUTES) {
      expect(route.prefix.startsWith('/')).toBe(true);
      expect(route.prefix.endsWith('/')).toBe(true);
    }
  });

  it('uses sane TCP port numbers', () => {
    for (const route of PROXY_ROUTES) {
      expect(Number.isInteger(route.port)).toBe(true);
      expect(route.port).toBeGreaterThan(0);
      expect(route.port).toBeLessThan(65536);
    }
  });
});

describe('Per-app port constants are exported and wired into PROXY_ROUTES', () => {
  // Locks in the second half of Task #1422's "Done looks like":
  // a single shared file exports the per-app port constants. Each gateway
  // app named in the task spec must have a named export AND that export
  // must agree with the corresponding entry in PROXY_ROUTES.
  it.each([
    ['/aegis/', AEGIS_PORT],
    ['/terra/', TERRA_PORT],
    ['/carlota-jo/', CARLOTA_JO_PORT],
    ['/vessels/', VESSELS_PORT],
    ['/command/', COMMAND_PORT],
  ])('%s is backed by an exported port constant (%i)', (prefix, constant) => {
    expect(typeof constant).toBe('number');
    const entry = PROXY_ROUTES.find((r) => r.prefix === prefix);
    expect(entry).toBeDefined();
    expect(entry?.port).toBe(constant);
  });
});
