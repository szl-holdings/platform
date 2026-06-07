# Environment Variables and Secrets Register

**Date:** April 18, 2026  
**Supersedes:** `docs/audit/env-canonical-map.md` (156 vars cataloged)  
**Source:** Codebase-wide `process.env.*` scan, `lib/config/src/index.ts`, `artifacts/api-server/src/lib/env-config.ts`, `.replit` `[userenv]` blocks  
**Purpose:** Single authoritative reference — tier, current state, and silent-fallback analysis

---

## Tier Definitions

| Tier | Meaning |
|------|---------|
| **Required** | Platform will not start or core feature will fail if absent |
| **Required-for-feature** | Feature silently disabled if absent; platform starts |
| **Optional** | Configuration tuning; has safe defaults |
| **Dev-only** | Only relevant in development |
| **Platform-provided** | Auto-injected by Replit; never set manually |
| **Deprecated** | Remove; replaced by canonical alternative |

---

## Group 1: Core Server

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `NODE_ENV` | Required | Set via Replit `[userenv]` | No | `production` in prod |
| `PORT` | Required | Auto-assigned by Replit per artifact | No — fail if absent | Never hardcode |
| `LOG_LEVEL` | Optional | Default: `info` | Yes — uses info | |
| `REPL_ID` | Platform-provided | Injected by Replit | N/A | |
| `REPLIT_DEV_DOMAIN` | Platform-provided | Injected by Replit | N/A | |
| `IP_HASH_SALT` | Optional | **NOT SET** | ⚠️ Warns in logs | Set to random value for production |

---

## Group 2: Database

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `DATABASE_URL` | **Required** | ✅ Stored in Replit Secrets | No — fail if absent | 569-table PostgreSQL 16 |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Platform-provided | Auto-provided | Yes — fallback to individual vars | |
| `DB_POOL_MIN` | Optional | Default: 2 | Yes | |
| `DB_POOL_MAX` | Optional | Default: 10 | Yes | |
| `DB_STATEMENT_TIMEOUT_MS` | Optional | Default: 10000 | Yes | |
| `SLOW_QUERY_THRESHOLD_MS` | Optional | Default: 500 | Yes | |

---

## Group 3: Authentication

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `SESSION_SECRET` | **Required** | ✅ Stored in Replit Secrets | No — fail | Must be ≥32 random bytes |
| `ISSUER_URL` | Required | Default: `https://replit.com/oidc` | Yes — uses default | |
| `OAUTH_STATE_SECRET` | Required | ✅ Stored in Replit Secrets | No — fail | PKCE state signing |
| `SESSION_TTL_MS` | Optional | Default: 7 days | Yes | |
| `ALLOY_INTERNAL_TOKEN` | **Required** | ✅ Stored in Replit Secrets | No — service-to-service fails | ⚠️ Grants full super_admin — HIGH RISK |
| `ADMIN_PIN` | Required-for-feature | **NOT SET** | Yes — admin panel blocks | Configure before enterprise access |
| `ALLOY_EMAIL_INGEST_SECRET` | Required-for-feature | **NOT SET** | Yes — email webhook fails | |

---

## Group 4: CORS / Networking

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `CORS_ORIGINS` | **Required for production** | Set to `*.replit.app,...` | ⚠️ CORS errors on custom domain | **Must update before `szlholdings.com` DNS cutover** |
| `PUBLIC_APP_URL` | Required | Set to Replit app URL | ⚠️ Wrong URLs in emails/OG | **Must update for custom domain** |
| `BASE_URL` | Optional | Not set; derived from `PUBLIC_APP_URL` | Yes | |
| `SZL_API_BASE` | Optional | Not set; defaults to relative URL | Yes | |

---

## Group 5: AI Integrations (Canonical — Replit AI Proxy)

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | **Required** | ✅ Replit Secrets | No — AI calls fail | Canonical OpenAI route |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | **Required** | ✅ Replit Secrets | No | Replit proxy URL |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | **Required** | ✅ Replit Secrets | No | Canonical Anthropic route |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | **Required** | ✅ Replit Secrets | No | |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Required-for-feature | ✅ Replit Secrets | Yes — Gemini disabled | |
| `HF_TOKEN` / `HUGGINGFACE_API_KEY` | Required-for-feature | **NOT SET** | Yes — HF features disabled | |
| `OPENAI_API_KEY` | **Deprecated** | Not set in production | Yes | Remove from code |
| `ANTHROPIC_API_KEY` | **Deprecated** | Not set in production | Yes | Remove from code |
| `GEMINI_API_KEY` | **Deprecated** | Not set in production | Yes | Remove from code |
| `AI_EXECUTION_MODE` | Optional | Default: `live` | Yes | Set to `mock` for testing |

---

## Group 6: Communication Services

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `RESEND_API_KEY` | Required-for-feature | **NOT SET** | ⚠️ Emails silently dropped | Set before sending customer emails |
| `SENDGRID_API_KEY` | Required-for-feature | **NOT SET** | ⚠️ Silent drop | Backup email; Resend is canonical |
| `SLACK_BOT_TOKEN` | Required-for-feature | **NOT SET** | Yes — Slack disabled | |
| `SLACK_SIGNING_SECRET` | Required-for-feature | **NOT SET** | Yes | Webhook verification |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Required-for-feature | **NOT SET** | Yes — SMS disabled | |
| `ELEVENLABS_API_KEY` | Required-for-feature | **NOT SET** | Yes — voice disabled | |

---

## Group 7: Payments

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `STRIPE_SECRET_KEY` | Required-for-feature | **NOT SET (live mode)** | ⚠️ No revenue collection | Configure before first charge |
| `STRIPE_WEBHOOK_SECRET` | Required-for-feature | **NOT SET** | ⚠️ Webhook events ignored | Configure with Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Required-for-feature | **NOT SET** | Yes — payment forms disabled | Frontend Stripe.js |

---

## Group 8: Maps and Geospatial

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `MAPBOX_ACCESS_TOKEN` | Required-for-feature | **NOT SET** | ⚠️ Map views blank | Demo blocker for Vessels/Terra maps |
| `VITE_MAPBOX_TOKEN` | Required-for-feature | **NOT SET** | ⚠️ Maps blank on frontend | Frontend Mapbox key |

---

## Group 9: External Data Feeds

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `MARINE_TRAFFIC_API_KEY` | Required-for-feature | **NOT SET** | Yes — uses simulated AIS | Enterprise live AIS |
| `AIS_HUB_API_KEY` | Required-for-feature | **NOT SET** | Yes | Alternative AIS source |
| `SHODAN_API_KEY` | Required-for-feature | **NOT SET** | Yes — Shodan scans disabled | |
| `GREYNOISE_API_KEY` | Required-for-feature | **NOT SET** | Yes | |
| `ALIENVAULT_OTX_API_KEY` | Required-for-feature | **NOT SET** | Yes | |
| `COURT_LISTENER_API_KEY` | Required-for-feature | **NOT SET** | Yes — legal feed disabled | |
| `GITHUB_TOKEN` | Required-for-feature | ✅ Stored (GitHub Integration) | Yes — public rate limits | GitHub trending feed |

---

## Group 10: Observability and Monitoring

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `SENTRY_DSN` | Required-for-feature | ✅ Stored in Replit Secrets | Yes — console-only errors | API server Sentry |
| `VITE_SENTRY_DSN` | Required-for-feature | ✅ Stored in Replit Secrets | Yes | Frontend Sentry |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional | **NOT SET** | Yes — traces not exported | OpenTelemetry endpoint |
| `LOGTAIL_API_KEY` | Optional | **NOT SET** | Yes | Log aggregation |
| `POSTHOG_API_KEY` / `VITE_POSTHOG_KEY` | Optional | **NOT SET** | Yes — analytics disabled | |

---

## Group 11: Storage

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `OBJECT_STORAGE_BUCKET_ID` | Required-for-feature | **NOT SET** | Yes — file uploads disabled | Replit GCS-backed storage |

---

## Group 12: Enterprise / Identity

| Variable | Tier | Current State | Silent Fallback? | Notes |
|----------|------|--------------|-----------------|-------|
| `AZURE_REDIS_CONNECTION_STRING` | Optional | **NOT SET** | Yes — in-memory fallback | Rate-limiter cache only; sessions are in PostgreSQL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Required-for-feature | **NOT SET** | Yes — Google OAuth disabled | Carlota Jo Google sign-in |
| `NOTION_API_KEY` | Required-for-feature | **NOT SET** | Yes — Notion disabled | Aegis integration |
| `FIGMA_ACCESS_TOKEN` | Required-for-feature | **NOT SET** | Yes | Design tool integration |

---

## Silent Fallback Audit

The following variables silently fail without logging a clear error — **this must be fixed before production**:

| Variable | Silent behavior | Fix |
|----------|----------------|-----|
| `RESEND_API_KEY` | Emails dropped with no user notification | Throw error on transactional email attempt |
| `MAPBOX_ACCESS_TOKEN` | Map renders blank | Show "Map unavailable" placeholder |
| `IP_HASH_SALT` | Logs warning (not silent) | Set in production env |
| `ADMIN_PIN` | Admin panel inaccessible | Document as expected behavior |

---

## Required Secrets Checklist (Pre-Launch)

- [x] `DATABASE_URL` — configured
- [x] `SESSION_SECRET` — configured
- [x] `OAUTH_STATE_SECRET` — configured
- [x] `ALLOY_INTERNAL_TOKEN` — configured
- [x] `AI_INTEGRATIONS_OPENAI_API_KEY` — configured
- [x] `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — configured
- [x] `SENTRY_DSN` — configured
- [x] `VITE_SENTRY_DSN` — configured
- [ ] `STRIPE_SECRET_KEY` (live) — **NOT SET**
- [ ] `RESEND_API_KEY` — **NOT SET**
- [ ] `MAPBOX_ACCESS_TOKEN` — **NOT SET** (demo blocker)
- [ ] `CORS_ORIGINS` — update for custom domain
- [ ] `PUBLIC_APP_URL` — update for custom domain

---

*See also: `docs/SECRETS_POLICY.md`, `docs/audit/series-a-gap-register.md`*
