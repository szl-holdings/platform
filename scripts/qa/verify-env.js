#!/usr/bin/env node
/**
 * verify:env — SZL Holdings Platform
 * Checks that all required environment variables are set before launch.
 * Distinguishes between required (hard block) and recommended (warning).
 *
 * Usage:
 *   node scripts/qa/verify-env.js
 *   node scripts/qa/verify-env.js --strict   (exit 1 on missing REQUIRED or RECOMMENDED vars)
 *   node scripts/qa/verify-env.js --json      (emit structured JSON)
 *
 * Exit semantics:
 *   0  — all required vars present (recommended warnings OK in default mode)
 *   1  — one or more required vars missing; OR recommended vars missing in --strict mode
 */

const STRICT = process.argv.includes('--strict');
const JSON_MODE = process.argv.includes('--json');

const REQUIRED = [
  { key: 'DATABASE_URL', desc: 'PostgreSQL connection URL', blocker: 'LB-004' },
  { key: 'SESSION_SECRET', desc: 'Session signing secret (≥32 chars)', blocker: 'LB-005' },
  { key: 'SECRET_ENCRYPTION_KEY', desc: 'Field encryption key (≥32 chars)', blocker: 'LB-005' },
  { key: 'ISSUER_URL', desc: 'OIDC/auth issuer URL', blocker: 'LB-005' },
  { key: 'PUBLIC_APP_URL', desc: 'Public-facing application URL', blocker: 'LB-005' },
];

const RECOMMENDED = [
  { key: 'SENTRY_DSN', desc: 'Sentry error tracking DSN', blocker: 'LB-003' },
  { key: 'OTEL_EXPORTER_OTLP_ENDPOINT', desc: 'OTEL tracing endpoint', blocker: 'LB-006' },
  { key: 'ALLOY_INTERNAL_TOKEN', desc: 'Alloy internal auth token (≥64 chars)', blocker: 'LB-005' },
  {
    key: 'CONNECTOR_ENCRYPTION_KEY',
    desc: 'Connector encryption key (≥32 chars)',
    blocker: 'LB-005',
  },
  { key: 'IP_HASH_SALT', desc: 'IP address hash salt (≥32 chars)', blocker: 'LB-005' },
  { key: 'OAUTH_STATE_SECRET', desc: 'OAuth state CSRF token', blocker: 'LB-005' },
  { key: 'ADMIN_PIN', desc: 'Admin console PIN', blocker: 'LB-005' },
  { key: 'CORS_ORIGINS', desc: 'Allowed CORS origins (comma-separated)', blocker: null },
];

const OPTIONAL = [
  { key: 'MARINETRAFFIC_API_KEY', desc: 'Live AIS vessel tracking API key' },
  { key: 'RESEND_API_KEY', desc: 'Email delivery API key (Pulse briefings)' },
  { key: 'COURT_LISTENER_API_TOKEN', desc: 'CourtListener auth token (legal research)' },
  { key: 'OPENAI_API_KEY', desc: 'OpenAI API key (AI features)' },
  { key: 'ANTHROPIC_API_KEY', desc: 'Anthropic API key (AI features)' },
  { key: 'REDIS_URL', desc: 'Redis cache URL (falls back to LRU if absent)' },
  { key: 'STRIPE_SECRET_KEY', desc: 'Stripe secret key (billing checkout)' },
  { key: 'WEBHOOK_SECRET', desc: 'Stripe webhook signing secret' },
  { key: 'GOOGLE_CLIENT_ID', desc: 'Google OAuth client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', desc: 'Google OAuth client secret' },
  { key: 'GITHUB_INSTALLATION_ID', desc: 'GitHub integration installation ID' },
];

const results = { required: [], recommended: [], optional: [], summary: {} };
let requiredFailed = 0;
let recommendedMissing = 0;

for (const v of REQUIRED) {
  const val = process.env[v.key];
  const present = !!val && val.trim().length > 0;
  if (!present) requiredFailed++;
  results.required.push({ ...v, status: present ? 'PASS' : 'FAIL' });
}

for (const v of RECOMMENDED) {
  const val = process.env[v.key];
  const present = !!val && val.trim().length > 0;
  if (!present) recommendedMissing++;
  results.recommended.push({ ...v, status: present ? 'PASS' : 'WARN' });
}

for (const v of OPTIONAL) {
  const val = process.env[v.key];
  const present = !!val && val.trim().length > 0;
  results.optional.push({ ...v, status: present ? 'SET' : 'NOT_SET' });
}

results.summary = {
  required_total: REQUIRED.length,
  required_passed: REQUIRED.length - requiredFailed,
  required_failed: requiredFailed,
  recommended_total: RECOMMENDED.length,
  recommended_present: RECOMMENDED.length - recommendedMissing,
  recommended_missing: recommendedMissing,
  optional_total: OPTIONAL.length,
  optional_set: OPTIONAL.length - results.optional.filter((x) => x.status === 'NOT_SET').length,
  overall:
    requiredFailed === 0 ? (recommendedMissing === 0 ? 'PASS' : 'PASS_WITH_WARNINGS') : 'FAIL',
};

if (JSON_MODE) {
} else {
  const _pad = (s, n) => String(s).padEnd(n);
  for (const v of results.required) {
    const _icon = v.status === 'PASS' ? '✅' : '❌';
    const _blocker = v.blocker ? ` [${v.blocker}]` : '';
  }
  for (const v of results.recommended) {
    const _icon = v.status === 'PASS' ? '✅' : '⚠️ ';
    const _blocker = v.blocker ? ` [${v.blocker}]` : '';
  }
  for (const v of results.optional) {
    const _icon = v.status === 'SET' ? '🔵' : '⬜';
  }
  const _s = results.summary;
}

const shouldFail = requiredFailed > 0 || (STRICT && recommendedMissing > 0);
process.exit(shouldFail ? 1 : 0);
