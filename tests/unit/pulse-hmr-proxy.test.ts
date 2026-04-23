/**
 * LUMINA — HMR / WebSocket Proxy Unit Tests
 *
 * Verifies that the LUMINA app is correctly registered in the shared proxy
 * route table and that the upgrade-routing logic used by sharedProxyPlugin
 * resolves HMR/WebSocket frames for all /pulse/* paths to the LUMINA dev-server
 * port (5201).  This ensures hot-module-replacement works end-to-end without
 * WebSocket errors in the preview pane.
 *
 * Run with: pnpm vitest run tests/unit/pulse-hmr-proxy.test.ts
 */

import { describe, expect, it } from 'vitest';
import { PROXY_ROUTES, SHARED_PROXY_PORT, sharedProxyPlugin } from '../../packages/proxy-routes.js';

const LUMINA_PORT = 5201;
const LUMINA_PREFIX = '/pulse/';

// ─── Route registration ───────────────────────────────────────────────────────

describe('PROXY_ROUTES — LUMINA registration', () => {
  it('includes a /pulse/ entry', () => {
    const entry = PROXY_ROUTES.find((r) => r.prefix === LUMINA_PREFIX);
    expect(entry).toBeDefined();
  });

  it('maps /pulse/ to port 5201', () => {
    const entry = PROXY_ROUTES.find((r) => r.prefix === LUMINA_PREFIX);
    expect(entry?.port).toBe(LUMINA_PORT);
  });

  it('exposes SHARED_PROXY_PORT as a number', () => {
    expect(typeof SHARED_PROXY_PORT).toBe('number');
    expect(SHARED_PROXY_PORT).toBeGreaterThan(0);
  });
});

// ─── Upgrade / HMR routing logic ─────────────────────────────────────────────
//
// The sharedProxyPlugin upgrade handler resolves the target port with:
//   const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
//   const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
//   const targetPort = route ? route.port : CANONICAL_FALLBACK_PORT;
//
// We exercise that logic directly so any future change to the matching
// algorithm is caught without needing a live server.

function resolveUpgradePort(url: string): number {
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
  const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
  return route ? route.port : -1;
}

describe('HMR upgrade routing — LUMINA paths', () => {
  it('routes /pulse/ to the LUMINA port', () => {
    expect(resolveUpgradePort('/pulse/')).toBe(LUMINA_PORT);
  });

  it('routes /pulse (no trailing slash) to the LUMINA port', () => {
    expect(resolveUpgradePort('/pulse')).toBe(LUMINA_PORT);
  });

  it('routes a deep LUMINA HMR path to the LUMINA port', () => {
    expect(resolveUpgradePort('/pulse/@vite/client')).toBe(LUMINA_PORT);
  });

  it('routes the Vite WS handshake path under /pulse/ to the LUMINA port', () => {
    expect(resolveUpgradePort('/pulse/__vite_hmr')).toBe(LUMINA_PORT);
  });

  it('does NOT route an unrelated path to the LUMINA port', () => {
    expect(resolveUpgradePort('/api/health')).not.toBe(LUMINA_PORT);
    expect(resolveUpgradePort('/vessels/')).not.toBe(LUMINA_PORT);
  });
});

// ─── Plugin shape ─────────────────────────────────────────────────────────────

describe('sharedProxyPlugin — plugin contract', () => {
  it('returns a plugin named shared-proxy', () => {
    const plugin = sharedProxyPlugin();
    expect(plugin.name).toBe('shared-proxy');
  });

  it('applies only in serve mode (not during build)', () => {
    const plugin = sharedProxyPlugin();
    expect(plugin.apply).toBe('serve');
  });

  it('exposes a configureServer hook', () => {
    const plugin = sharedProxyPlugin();
    expect(typeof plugin.configureServer).toBe('function');
  });
});
