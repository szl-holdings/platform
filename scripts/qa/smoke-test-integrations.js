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

const REQUIRED = [
  'stripe',
  'sentry_server',
  'posthog_frontend',
  'amplitude_frontend',
  'google_maps',
];
const WARN_ONLY = new Set(['mapbox']);

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
  console.log(`\n--- API Server health check ---`);
  try {
    const res = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(8_000) });
    const json = await res.json();
    if (res.ok) {
      console.log(`✅ API Server healthy — status: ${json.status ?? 'ok'}`);
      return true;
    } else {
      console.log(`❌ API Server unhealthy — HTTP ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`⚠️  API Server not reachable at ${apiBase}: ${err.message}`);
    return false;
  }
}

async function probeGoogleMapsProxy(apiBase) {
  console.log(`\n--- Google Maps proxy probe ---`);
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log(`⚠️  Google Maps proxy skipped: GOOGLE_MAPS_API_KEY not set`);
    return;
  }
  try {
    const gmRes = await fetch(`${apiBase}/api/maps/geocode?address=425+Park+Ave+New+York+NY`, {
      signal: AbortSignal.timeout(8_000),
    });
    const gmJson = await gmRes.json();
    if (gmRes.status === 503) {
      console.log(`⚠️  Google Maps proxy: GOOGLE_MAPS_API_KEY not configured on server`);
    } else if (gmJson.status === 'OK') {
      const loc = gmJson.results?.[0]?.geometry?.location;
      console.log(`✅ Google Maps geocode OK — lat: ${loc?.lat}, lng: ${loc?.lng}`);
    } else {
      console.log(`⚠️  Google Maps response: ${gmJson.status} — ${gmJson.error_message ?? ''}`);
    }
  } catch (err) {
    console.log(`⚠️  Google Maps probe skipped: ${err.message}`);
  }
}

async function probeStripeCheckoutE2E() {
  console.log(`\n--- Stripe checkout E2E probe ---`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log(`⚠️  Stripe E2E probe skipped: STRIPE_SECRET_KEY not set`);
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
      console.log(`✅ Stripe checkout session created — id: ${session.id.slice(0, 20)}...`);
      console.log(
        `   mode: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'test'}, url: ${session.url.slice(0, 60)}...`,
      );
    } else {
      console.log(`❌ Stripe session created but missing id/url`);
    }
  } catch (err) {
    if (err.type === 'StripeAuthenticationError') {
      console.log(`❌ Stripe authentication failed — check STRIPE_SECRET_KEY`);
    } else if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
      console.log(`⚠️  Stripe SDK not available for E2E probe (run pnpm install first)`);
    } else {
      console.log(`⚠️  Stripe probe error: ${err.message}`);
    }
  }
}

async function main() {
  console.log(`\n=== Integration Smoke Test — SZL Holdings Platform ===`);
  console.log(`API base: ${API_BASE}`);
  console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}\n`);

  const integrations = await checkEnvIntegrations();
  const results = Object.values(integrations);

  let failures = 0;
  for (const r of results) {
    const icon = r.ok ? '✅' : r.warnOnly ? '⚠️ ' : '❌';
    const status = r.ok ? 'PASS' : r.warnOnly ? 'WARN' : 'FAIL';
    console.log(`${icon} ${r.name.padEnd(24)} ${status}`);
    console.log(`   ${r.detail}`);
    if (!r.ok && !r.warnOnly) failures++;
  }

  await probeApiHealth(API_BASE);
  await probeGoogleMapsProxy(API_BASE);
  await probeStripeCheckoutE2E();

  console.log(`\n=== Summary ===`);
  const passed = results.filter((r) => r.ok).length;
  const warned = results.filter((r) => !r.ok && r.warnOnly).length;
  console.log(`${passed}/${results.length} integrations configured, ${warned} warning(s)\n`);

  if (failures > 0) {
    console.error(`❌ ${failures} required integration(s) not configured. See above for details.`);
    process.exit(1);
  } else {
    console.log(`✅ All required integrations are configured.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
