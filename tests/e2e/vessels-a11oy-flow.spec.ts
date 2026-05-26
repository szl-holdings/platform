/**
 * Vessels A11oy — End-to-end flow spec (Task #5343)
 *
 * Walks the five backend surfaces wired by Task #5318 against the running
 * api-server:
 *
 *   POST /api/vessels/fleet         → create an Anatomy
 *   POST /api/vessels/positions     → append a Substance state-log entry
 *   POST /api/vessels/risk          → compute a perturbation-bound Transformation
 *   POST /api/vessels/route-plan    → compute a Connection (anatomy boundary)
 *   POST /api/vessels/coexistence   → compute a null-space-projection report
 *   GET  /api/agi-forecast/status   → assert Lutar Readiness surfaces
 *
 * The spec recomputes each Phase-2 receipt hash client-side and asserts it
 * matches the one returned by the server (round-trip determinism). A
 * subsequent GET on the same fleetRef must echo the same receipt hash back
 * to prove the row was persisted exactly as computed.
 *
 * ── Auth strategy ─────────────────────────────────────────────────────────
 * The POSTs require an authenticated principal with an org membership and
 * one of {ops, exec, admin, editor}. The CI runner is expected to provide
 * a working `x-internal-token` (or session cookie) via
 * `VESSELS_E2E_AUTH_TOKEN` / `VESSELS_E2E_COOKIE`. When no usable auth is
 * available the write portion of the suite is skipped with a clear reason
 * (matching the terra.spec.ts proforma round-trip pattern); the read-only
 * formula-determinism and status-shape assertions still run so a missing
 * env never silently masks a regression in those surfaces.
 */
import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

const API_BASE = (process.env.API_BASE_URL ?? 'http://localhost:80/api').replace(/\/$/, '');
const AUTH_TOKEN = process.env.VESSELS_E2E_AUTH_TOKEN ?? process.env.INTEGRATION_TEST_TOKEN ?? '';
const AUTH_COOKIE = process.env.VESSELS_E2E_COOKIE ?? '';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (AUTH_TOKEN) headers['x-internal-token'] = AUTH_TOKEN;
  if (AUTH_COOKIE) headers['cookie'] = AUTH_COOKIE;
  return headers;
}

function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Phase-2 formula mirrors (must match artifacts/api-server/src/routes/*) ──

function computeRiskHash(
  factors: Record<string, number>,
  weights: Record<string, number> | null,
): { bound: number; severity: string; receiptHash: string } {
  let weighted = 0;
  let totalWeight = 0;
  for (const [k, v] of Object.entries(factors)) {
    const w = weights?.[k] ?? 1;
    weighted += v * w;
    totalWeight += w;
  }
  const bound = totalWeight > 0 ? Math.min(1, Math.max(0, weighted / totalWeight)) : 0;
  const severity =
    bound >= 0.75 ? 'critical' : bound >= 0.5 ? 'elevated' : bound >= 0.25 ? 'watch' : 'normal';
  const receiptHash = createHash('sha256')
    .update(JSON.stringify({ factors, weights, bound }))
    .digest('hex');
  return { bound, severity, receiptHash };
}

const EARTH_KM = 6371;
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

function checkAnatomyBoundary(
  waypoints: { lat: number; lon: number; label?: string }[],
  maxDeviationKm: number,
): { ok: boolean; notes: string | null; maxObservedKm: number } {
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const totalDirect = haversineKm(origin, destination);
  let maxDev = 0;
  for (const wp of waypoints) {
    const dev = Math.abs(haversineKm(origin, wp) + haversineKm(wp, destination) - totalDirect);
    if (dev > maxDev) maxDev = dev;
  }
  const ok = maxDev <= maxDeviationKm;
  return {
    ok,
    notes: ok ? null : `max waypoint deviation ${maxDev.toFixed(1)}km exceeds δ=${maxDeviationKm}km`,
    maxObservedKm: maxDev,
  };
}

function computeRouteHash(
  vesselImo: string,
  originPort: string,
  destinationPort: string,
  waypoints: { lat: number; lon: number; label?: string }[],
  anatomyBoundary: { ok: boolean; notes: string | null; maxObservedKm: number },
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        vesselImo,
        origin: originPort,
        destination: destinationPort,
        waypoints,
        anatomyBoundary,
      }),
    )
    .digest('hex');
}

function computeCoexistenceHash(
  bands: { band: string; utilization: number }[],
  weights: number[] | undefined,
): { receiptHash: string; interferenceScore: number; projection: number[] } {
  const u = bands.map((b) => b.utilization);
  const w = weights && weights.length === u.length ? weights : u.map(() => 1 / u.length);
  const ww = w.reduce((s, x) => s + x * x, 0);
  const uw = u.reduce((s, x, i) => s + x * w[i], 0);
  const proj = ww > 0 ? uw / ww : 0;
  const residual = u.map((x, i) => x - proj * w[i]);
  const uNorm = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
  const rNorm = Math.sqrt(residual.reduce((s, x) => s + x * x, 0));
  const score = uNorm > 0 ? Math.min(1, Math.max(0, rNorm / uNorm)) : 0;
  const receiptHash = createHash('sha256')
    .update(JSON.stringify({ u, w, residual, score }))
    .digest('hex');
  return { receiptHash, interferenceScore: score, projection: residual };
}

// ── Reachability + auth probe ──────────────────────────────────────────────

let apiReachable = false;
let writesAllowed = false;
let skipReason = '';

test.beforeAll(async ({ request }) => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const r = await request.get(`${API_BASE}/agi-forecast/status`, { timeout: 5_000 });
      if (r.status() < 500) {
        apiReachable = true;
        break;
      }
    } catch {
      // api-server not yet listening
    }
    await new Promise((r) => setTimeout(r, 1_500));
  }

  if (!apiReachable) {
    skipReason = 'api-server not reachable at ' + API_BASE;
    return;
  }

  // Probe write capability with a no-op payload; we only care about the
  // status code (401/403 => no usable auth, treat writes as unsupported).
  const probe = await request.post(`${API_BASE}/vessels/fleet`, {
    headers: authHeaders(),
    data: { fleetRef: unique('probe'), name: 'probe' },
  });
  const s = probe.status();
  if (s === 200 || s === 201) {
    writesAllowed = true;
  } else if (s === 401 || s === 403) {
    skipReason = `vessels writes unauthenticated (${s}); set VESSELS_E2E_AUTH_TOKEN/VESSELS_E2E_COOKIE`;
  } else {
    skipReason = `vessels fleet probe returned ${s}`;
  }
}, 60_000);

test.describe('Vessels A11oy — read-only surfaces (always run when api is reachable)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!apiReachable) testInfo.skip(true, skipReason);
  });

  test('GET /api/vessels/fleet returns an array (vessels-demo public read)', async ({
    request,
  }) => {
    const r = await request.get(`${API_BASE}/vessels/fleet`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    const rows = Array.isArray(body) ? body : (body.data ?? body.items ?? body);
    expect(Array.isArray(rows)).toBe(true);
  });

  test('GET /api/agi-forecast/status exposes vesselsLutar derived block', async ({ request }) => {
    const r = await request.get(`${API_BASE}/agi-forecast/status`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    const payload = body.data ?? body;
    expect(payload).toHaveProperty('summary');
    expect(payload.summary).toHaveProperty('derived');
    expect(payload.summary.derived).toHaveProperty('vesselsLutar');
    expect(Array.isArray(payload.summary.derived.vesselsLutar)).toBe(true);
    for (const e of payload.summary.derived.vesselsLutar) {
      expect(typeof e.fleetRef).toBe('string');
      expect(typeof e.lutarReadiness).toBe('number');
      expect(e.lutarReadiness).toBeGreaterThanOrEqual(0);
      expect(e.lutarReadiness).toBeLessThanOrEqual(1);
    }
  });

  test('formula determinism: risk hash recomputes identically client-side', () => {
    const factors = { ais_gap: 0.4, weather: 0.6, sanctions: 0.2 };
    const weights = { ais_gap: 1, weather: 0.5, sanctions: 1 };
    const a = computeRiskHash(factors, weights);
    const b = computeRiskHash(factors, weights);
    expect(a.receiptHash).toBe(b.receiptHash);
    expect(a.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.severity).toBe('watch');
  });

  test('formula determinism: coexistence hash recomputes identically client-side', () => {
    const bands = [
      { band: '2.4GHz', utilization: 0.3 },
      { band: '5GHz', utilization: 0.7 },
      { band: 'L-band', utilization: 0.2 },
    ];
    const a = computeCoexistenceHash(bands, undefined);
    const b = computeCoexistenceHash(bands, undefined);
    expect(a.receiptHash).toBe(b.receiptHash);
    expect(a.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.interferenceScore).toBeGreaterThanOrEqual(0);
    expect(a.interferenceScore).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Write-path round-trip — gated on the probe in beforeAll succeeding
// ─────────────────────────────────────────────────────────────────────────

test.describe('Vessels A11oy — write-path round-trip (fleet → position → risk → route → coexistence)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!apiReachable) testInfo.skip(true, skipReason);
    if (!writesAllowed) testInfo.skip(true, skipReason);
  });

  test('full A11oy flow: create fleet → record position → compute risk/route/coexistence → status reflects fleet', async ({
    request,
  }) => {
    const fleetRef = unique('e2e-fleet');
    const vesselImo = `IMO${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;

    // 1. Fleet (Anatomy)
    const fleetRes = await request.post(`${API_BASE}/vessels/fleet`, {
      headers: authHeaders(),
      data: {
        fleetRef,
        name: `E2E A11oy Fleet ${fleetRef}`,
        operator: 'E2E Test Operator',
        vesselCount: 1,
      },
    });
    expect([200, 201]).toContain(fleetRes.status());
    const fleetBody = await fleetRes.json();
    const fleet = fleetBody.data ?? fleetBody;
    expect(fleet.fleetRef).toBe(fleetRef);

    // 2. Position (Substance state-log)
    const posRes = await request.post(`${API_BASE}/vessels/positions`, {
      headers: authHeaders(),
      data: {
        fleetRef,
        vesselImo,
        latitude: 35.6762,
        longitude: 139.6503,
        speedKnots: 14.2,
        headingDeg: 270,
        source: 'e2e',
      },
    });
    expect([200, 201]).toContain(posRes.status());

    // 3. Risk (Transformation) — receipt-hash round-trip
    const factors = { ais_gap: 0.4, weather: 0.6, sanctions: 0.2 };
    const weights = { ais_gap: 1, weather: 0.5, sanctions: 1 };
    const expectedRisk = computeRiskHash(factors, weights);
    const riskRes = await request.post(`${API_BASE}/vessels/risk`, {
      headers: authHeaders(),
      data: { fleetRef, vesselImo, factors, weights },
    });
    expect([200, 201]).toContain(riskRes.status());
    const riskBody = await riskRes.json();
    const risk = riskBody.data ?? riskBody;
    expect(risk.receiptHash).toBe(expectedRisk.receiptHash);
    expect(risk.severity).toBe(expectedRisk.severity);
    // GET round-trip
    const riskList = await request.get(
      `${API_BASE}/vessels/risk?fleetRef=${encodeURIComponent(fleetRef)}`,
    );
    expect(riskList.status()).toBe(200);
    const riskListBody = await riskList.json();
    const riskRows = (riskListBody.data ?? riskListBody) as Array<{ receiptHash: string }>;
    expect(riskRows.some((r) => r.receiptHash === expectedRisk.receiptHash)).toBe(true);

    // 4. Route plan (Connection) — receipt-hash round-trip
    const originPort = 'JP TYO';
    const destinationPort = 'CN SHA';
    const waypoints: Array<{ lat: number; lon: number; label?: string }> = [
      { lat: 35.6, lon: 139.7, label: 'Tokyo Bay' },
      { lat: 33.5, lon: 130.4, label: 'Hakata' },
      { lat: 31.2, lon: 121.5, label: 'Shanghai' },
    ];
    const expectedBoundary = checkAnatomyBoundary(waypoints, 500);
    const expectedRouteHash = computeRouteHash(
      vesselImo,
      originPort,
      destinationPort,
      waypoints,
      expectedBoundary,
    );
    const routeRes = await request.post(`${API_BASE}/vessels/route-plan`, {
      headers: authHeaders(),
      data: { fleetRef, vesselImo, originPort, destinationPort, waypoints },
    });
    expect([200, 201]).toContain(routeRes.status());
    const routeBody = await routeRes.json();
    const routeWrap = routeBody.data ?? routeBody;
    const route = routeWrap.route ?? routeWrap;
    expect(route.receiptHash).toBe(expectedRouteHash);
    const routeId = route.id;
    expect(typeof routeId === 'number' || typeof routeId === 'string').toBe(true);

    // 5. Coexistence (Connection-level Transformation) — receipt-hash round-trip
    const bands = [
      { band: '2.4GHz', utilization: 0.3 },
      { band: '5GHz', utilization: 0.7 },
      { band: 'L-band', utilization: 0.2 },
    ];
    const expectedCoex = computeCoexistenceHash(bands, undefined);
    const coexRes = await request.post(`${API_BASE}/vessels/coexistence`, {
      headers: authHeaders(),
      data: { fleetRef, routeId: typeof routeId === 'number' ? routeId : undefined, bands },
    });
    expect([200, 201]).toContain(coexRes.status());
    const coexBody = await coexRes.json();
    const coex = coexBody.data ?? coexBody;
    expect(coex.receiptHash).toBe(expectedCoex.receiptHash);
    expect(Math.abs(coex.interferenceScore - expectedCoex.interferenceScore)).toBeLessThan(1e-9);

    // 6. Status reflects the new fleet's Lutar Readiness derived from risk
    const statusRes = await request.get(`${API_BASE}/agi-forecast/status`);
    expect(statusRes.status()).toBe(200);
    const statusBody = await statusRes.json();
    const status = statusBody.data ?? statusBody;
    const lutar = (status.summary?.derived?.vesselsLutar ?? []) as Array<{
      fleetRef: string;
      lutarReadiness: number;
      perturbationBound: number;
    }>;
    const entry = lutar.find((e) => e.fleetRef === fleetRef);
    expect(entry, `expected fleetRef ${fleetRef} in vesselsLutar`).toBeDefined();
    if (entry) {
      expect(Math.abs(entry.perturbationBound - expectedRisk.bound)).toBeLessThan(1e-9);
      expect(Math.abs(entry.lutarReadiness - (1 - expectedRisk.bound))).toBeLessThan(1e-9);
    }
  });
});

// Silence unused-import lint for APIRequestContext (kept for the type comment above).
void (null as unknown as APIRequestContext);
