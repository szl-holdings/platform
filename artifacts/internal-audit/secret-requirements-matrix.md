# Secret Requirements Matrix
**Audit Date:** April 19, 2026

## Required for Demo / Investor Readiness (Must Have Now)

| Secret | Purpose | Status | Notes |
|---|---|---|---|
| DATABASE_URL | PostgreSQL connection | ✅ Set | All DB queries working |
| STRIPE_SECRET_KEY | Stripe server-side | ✅ Set (test) | Smoke test PASS |
| STRIPE_PUBLISHABLE_KEY | Stripe client-side | ✅ Set (test) | |
| STRIPE_WEBHOOK_SECRET | Stripe webhooks | ✅ Set | |
| VITE_MAPBOX_TOKEN | Map rendering | ✅ Set | Terra + Vessels maps live |
| GOOGLE_MAPS_API_KEY | Geocoding + static maps | ✅ Set | |
| POSTHOG_API_KEY | Analytics (server) | ✅ Set | |
| VITE_POSTHOG_KEY | Analytics (frontend) | ✅ Set | |
| VITE_AMPLITUDE_API_KEY | Analytics (frontend) | ✅ Set | |
| SENTRY_DSN | Error tracking (server) | ✅ Set | |
| VITE_SENTRY_DSN | Error tracking (frontend) | ✅ Set | |

## Required for Commercial Activation (High Priority)

| Secret | Purpose | Status | One-Step Activation |
|---|---|---|---|
| RESEND_API_KEY | Transactional email | ❌ Not set | Add to secrets panel → instant |
| SENDGRID_API_KEY | Email fallback | ❌ Not set | Alternative to Resend |
| REDIS_URL | Cache layer | ❌ Not set | Add Redis URL → instant |

## Required for Enterprise Features (Pre-Series A)

| Secret | Purpose | Status | Notes |
|---|---|---|---|
| OIDC_ISSUER | Enterprise SSO | ❌ Not set | Configure IdP first |
| OIDC_CLIENT_ID | Enterprise SSO | ❌ Not set | |
| OIDC_CLIENT_SECRET | Enterprise SSO | ❌ Not set | |
| SCIM_TOKEN | SCIM provisioning | ❌ Not set | |

## Required for Live Data Feeds (Pre-GA)

| Secret | Purpose | Status | Notes |
|---|---|---|---|
| MARINETRAFFIC_API_KEY | Live AIS vessel tracking | ❌ Not set | Currently labeled DEMO AIS |
| COURT_LISTENER_API_TOKEN | Enhanced legal records | ❌ Not set | Public rate-limited access works |
| OPENAI_API_KEY | AI generation | ⚠️ Check | Pulse briefings need for live gen |
| ANTHROPIC_API_KEY | AI generation fallback | ⚠️ Check | |

## Security-Hardening Secrets

| Secret | Purpose | Status | Notes |
|---|---|---|---|
| IP_HASH_SALT | IP anonymization | ❌ Not set | Low risk in dev; required for prod |
| SESSION_SECRET | Session signing | ✅ Set | |
| JWT_SECRET | Token signing | ✅ Set | |

## Stripe Live Mode Cutover (When Ready)

1. Replace `STRIPE_SECRET_KEY` test key with live key
2. Replace `STRIPE_PUBLISHABLE_KEY` with live publishable key
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
4. Wire Carlota Jo checkout flow to Stripe checkout session
5. Test with real card in Stripe test environment

_No code changes needed — all paths already exist._
