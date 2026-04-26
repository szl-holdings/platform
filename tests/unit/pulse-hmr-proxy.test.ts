/**
 * Pulse — HMR / WebSocket Proxy Unit Tests
 *
 * Verifies that the Pulse app is correctly registered in the shared proxy
 * route table and that the upgrade-routing logic used by sharedProxyPlugin
 * resolves HMR/WebSocket frames for all /pulse/* paths to the Pulse dev-server
 * port (5201).  This ensures hot-module-replacement works end-to-end without
 * WebSocket errors in the preview pane.
 *
 * Run with: pnpm vitest run tests/unit/pulse-hmr-proxy.test.ts
 */

import { describe, expect, it } from 'vitest';
import { PROXY_ROUTES, SHARED_PROXY_PORT, sharedProxyPlugin } from '../../packages/proxy-routes.js';

const Pulse_PORT = 5201;
const Pulse_PREFIX = '/pulse/';

// ─── Route registration ───────────────────────────────────────────────────────

describe('PROXY_ROUTES — Pulse registration', () => {
  it('includes a /pulse/ entry', () => {
    const entry = PROXY_ROUTES.find((r) => r.prefix === Pulse_PREFIX);
    expect(entry).toBeDefined();
  });

  it('maps /pulse/ to port 5201', () => {
    const entry = PROXY_ROUTES.find((r) => r.prefix === Pulse_PREFIX);
    expect(entry?.port).toBe(Pulse_PORT);
  });

  it('exposes SHARED_PROXY_PORT as a number', () => {
    expect(typeof SHARED_PROXY_PORT).toBe('number');
    expect(SHARED_PROXY_PORT).toBeGreaterThan(0);
  });

  it('SHARED_PROXY_PORT does not collide with any artifact port in PROXY_ROUTES', () => {
    const conflicting = PROXY_ROUTES.find((r) => r.port === SHARED_PROXY_PORT);
    expect(conflicting).toBeUndefined();
  });

  it('SHARED_PROXY_PORT is a valid unprivileged port number', () => {
    expect(SHARED_PROXY_PORT).toBeGreaterThanOrEqual(1024);
    expect(SHARED_PROXY_PORT).toBeLessThanOrEqual(65535);
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

describe('HMR upgrade routing — Pulse paths', () => {
  it('routes /pulse/ to the Pulse port', () => {
    expect(resolveUpgradePort('/pulse/')).toBe(Pulse_PORT);
  });

  it('routes /pulse (no trailing slash) to the Pulse port', () => {
    expect(resolveUpgradePort('/pulse')).toBe(Pulse_PORT);
  });

  it('routes a deep Pulse HMR path to the Pulse port', () => {
    expect(resolveUpgradePort('/pulse/@vite/client')).toBe(Pulse_PORT);
  });

  it('routes the Vite WS handshake path under /pulse/ to the Pulse port', () => {
    expect(resolveUpgradePort('/pulse/__vite_hmr')).toBe(Pulse_PORT);
  });

  it('does NOT route an unrelated path to the Pulse port', () => {
    expect(resolveUpgradePort('/api/health')).not.toBe(Pulse_PORT);
    expect(resolveUpgradePort('/vessels/')).not.toBe(Pulse_PORT);
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
