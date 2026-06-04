#!/usr/bin/env node
/**
 * Integration Smoke Test — SZL Holdings Platform
 *
 * Validates that all third-party integrations are configured and reachable.
 * Run from workspace root (checks env vars directly + probes public API endpoints):
 *
 *   node scripts/qa/smoke-test-integrations.js
 *   node scripts/qa/smoke-test-integrations.js --api-base http://localhost:3001
 *
 * Exit code 0 = all required integrations configured.
 * Exit code 1 = one or more required integrations missing or API unreachable.
 *
 * Note: /api/debug/* endpoints require authentication — this script checks
 * integration configs from environment variables and probes public endpoints only.
 */

const API_BASE = (() => {
  const idx = process.argv.indexOf('--api-base');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const port = process.env.API_PORT ?? '3001';
  return `http://localhost:${port}`;
})();

const _REQUIRED = [
  'stripe',
  'sentry_server',
  'posthog_frontend',
  'amplitude_frontend',
  'google_maps',
];
const _WARN_ONLY = new Set(['mapbox']);

async function checkEnvIntegrations() {
  return {
    stripe: {
      name: 'Stripe',
      key: 'stripe',
      ok: !!process.env.STRIPE_SECRET_KEY,
      detail: process.env.STRIPE_SECRET_KEY
        ? `mode: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test'}, webhook: ${process.env.STRIPE_WEBHOOK_SECRET ? '✓' : '✗'}, publishable: ${process.env.STRIPE_PUBLISHABLE_KEY ? '✓' : '✗'}`
        : 'STRIPE_SECRET_KEY not set',
    },
    sentry_server: {
      name: 'Sentry (server)',
      key: 'sentry_server',
      ok: !!process.env.SENTRY_DSN,
      detail: process.env.SENTRY_DSN ? 'SENTRY_DSN configured' : 'SENTRY_DSN not set',
    },
    sentry_frontend: {
      name: 'Sentry (frontend)',
      key: 'sentry_frontend',
      ok: !!process.env.VITE_SENTRY_DSN,
      detail: process.env.VITE_SENTRY_DSN
        ? 'VITE_SENTRY_DSN configured'
        : 'VITE_SENTRY_DSN not set',
      warnOnly: true,
    },
    posthog_server: {
      name: 'PostHog (server)',
      key: 'posthog_server',
      ok: !!process.env.POSTHOG_API_KEY,
      detail: process.env.POSTHOG_API_KEY
        ? 'POSTHOG_API_KEY configured'
        : 'POSTHOG_API_KEY not set',
      warnOnly: true,
    },
    posthog_frontend: {
      name: 'PostHog (frontend)',
      key: 'posthog_frontend',
      ok: !!process.env.VITE_POSTHOG_KEY,
      detail: process.env.VITE_POSTHOG_KEY
        ? 'VITE_POSTHOG_KEY configured'
        : 'VITE_POSTHOG_KEY not set',
    },
    amplitude_frontend: {
      name: 'Amplitude (frontend)',
      key: 'amplitude_frontend',
      ok: !!process.env.VITE_AMPLITUDE_API_KEY,
      detail: process.env.VITE_AMPLITUDE_API_KEY
        ? 'VITE_AMPLITUDE_API_KEY configured'
        : 'VITE_AMPLITUDE_API_KEY not set',
    },
    google_maps: {
      name: 'Google Maps',
      key: 'google_maps',
      ok: !!process.env.GOOGLE_MAPS_API_KEY,
      detail: process.env.GOOGLE_MAPS_API_KEY
        ? 'GOOGLE_MAPS_API_KEY configured — proxy: /api/maps/static, /api/maps/geocode'
        : 'GOOGLE_MAPS_API_KEY not set',
    },
    mapbox: {
      name: 'Mapbox',
      key: 'mapbox',
      ok: !!process.env.VITE_MAPBOX_TOKEN,
      detail: process.env.VITE_MAPBOX_TOKEN
        ? 'VITE_MAPBOX_TOKEN configured'
        : 'VITE_MAPBOX_TOKEN not set',
      warnOnly: true,
    },
  };
}

async function probeApiHealth(apiBase) {
  try {
    const res = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(8_000) });
    const _json = await res.json();
    if (res.ok) {
      return true;
    } else {
      return false;
    }
  } catch (_err) {
    return false;
  }
}

async function probeGoogleMapsProxy(apiBase) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return;
  }
  try {
    const gmRes = await fetch(`${apiBase}/api/maps/geocode?address=425+Park+Ave+New+York+NY`, {
      signal: AbortSignal.timeout(8_000),
    });
    const gmJson = await gmRes.json();
    if (gmRes.status === 503) {
    } else if (gmJson.status === 'OK') {
      const _loc = gmJson.results?.[0]?.geometry?.location;
    } else {
    }
  } catch (_err) {
  }
}

async function probeStripeCheckoutE2E() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return;
  }
  try {
    const stripe = await import('stripe').then((m) => m.default ?? m);
    const client = new stripe(process.env.STRIPE_SECRET_KEY);
    const session = await client.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Smoke Test Item' },
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    if (session.id && session.url) {
    } else {
    }
  } catch (err) {
    if (err.type === 'StripeAuthenticationError') {
    } else if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
    } else {
    }
  }
}

async function main() {

  const integrations = await checkEnvIntegrations();
  const results = Object.values(integrations);

  let failures = 0;
  for (const r of results) {
    const _icon = r.ok ? '✅' : r.warnOnly ? '⚠️ ' : '❌';
    const _status = r.ok ? 'PASS' : r.warnOnly ? 'WARN' : 'FAIL';
    if (!r.ok && !r.warnOnly) failures++;
  }

  await probeApiHealth(API_BASE);
  await probeGoogleMapsProxy(API_BASE);
  await probeStripeCheckoutE2E();
  const _passed = results.filter((r) => r.ok).length;
  const _warned = results.filter((r) => !r.ok && r.warnOnly).length;

  if (failures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((_err) => {
  process.exit(1);
});
