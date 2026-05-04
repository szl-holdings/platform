# Secrets Register
**Phase:** 3 + 6  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Required Secrets (Production)

| Secret | Purpose | Source | Status |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Replit-managed | ✅ Set |
| `SESSION_SECRET` | Session cookie signing (≥32 chars) | Manual | ⚠️ Must set for prod |
| `SECRET_ENCRYPTION_KEY` | Secrets encryption | Manual | ⚠️ Must set for prod |
| `ALLOY_INTERNAL_TOKEN` | Internal service-to-service auth (≥32 chars) | Manual | ⚠️ Must set for prod |
| `CONNECTOR_ENCRYPTION_KEY` | OAuth token AES-256 encryption | Manual | ⚠️ Must set for prod |
| `ISSUER_URL` | OIDC issuer URL | Environment | ⚠️ Must set for prod |
| `PUBLIC_APP_URL` | Canonical public URL | Environment | ⚠️ Must set for prod |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | Environment | ⚠️ Must set for prod |
| `IP_HASH_SALT` | IP address anonymization salt | Manual | ⚠️ Must set for prod |
| `OAUTH_STATE_SECRET` | OAuth state parameter signing | Manual | ⚠️ Must set for prod |
| `ADMIN_PIN` | Admin panel access PIN hash | Manual | ⚠️ Must set for prod |

## AI Provider Secrets (via Replit AI Integration)

| Secret | Purpose | Status |
|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI via Replit proxy | ✅ Set |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL | ✅ Set |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic via Replit proxy | ✅ Set |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Anthropic base URL | ✅ Set |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini via Replit proxy | ✅ Set |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini base URL | ✅ Set |

## External Service Secrets (Conditional)

| Secret | Purpose | Status | Priority |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe payment processing | Test mode set | Activate live key before billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook validation | Set (test) | Update for prod |
| `SENTRY_DSN` | Error tracking | ⚠️ Not set | LB-003 — must set |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Production tracing | ⚠️ Not set | LB-006 — must set |
| `RESEND_API_KEY` | Email delivery | ⚠️ Not set | GAP-001 — needed for email |
| `MARINETRAFFIC_API_KEY` | Live AIS data | ⚠️ Not set | GAP-003 — needed for live AIS |
| `POSTHOG_API_KEY` | Product analytics | ✅ Set | |
| `AMPLITUDE_API_KEY` | Analytics | ✅ Set | |
| `MAPBOX_PUBLIC_TOKEN` | Map rendering | ✅ Set | |
| `GOOGLE_MAPS_API_KEY` | Google Maps | ✅ Set | |
| `SLACK_WEBHOOK_URL` | Slack notifications | Configured | |
| `TWILIO_ACCOUNT_SID` | SMS/voice | Configured | |
| `COURT_LISTENER_API_TOKEN` | Legal feed auth | ⚠️ Not set | GAP-015 |
| `IP_HASH_SALT` | IP anonymization | ⚠️ Not set | Must set |
| `REDIS_URL` | Session/cache store | ⚠️ Not set | Performance; optional |

## Git History Audit (Clean)

| Check | Result | Date |
|---|---|---|
| `.env` files in git history | 0 commits found | Apr-2026 (Task #1034) |
| Firebase admin SDK JSON | 0 commits found | Apr-2026 |
| Service account JSON | 0 commits found | Apr-2026 |
| `google-services.json` | Only `PLACEHOLDER_*` values | Apr-2026 |
| `GoogleService-Info.plist` | Only `PLACEHOLDER_*` values | Apr-2026 |

**Git history verdict: Clean. No live secrets ever committed.**

## Secret Rotation Checklist (Operator)

- [ ] Firebase Web API key rotated in Firebase Console
- [ ] Google Cloud service account keys rotated in IAM
- [ ] `SESSION_SECRET` generated (≥32 chars) and set in production
- [ ] `SECRET_ENCRYPTION_KEY` generated and set in production
- [ ] `ALLOY_INTERNAL_TOKEN` generated (≥64 char hex) and set in production
- [ ] `SENTRY_DSN` obtained from Sentry project and set
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` set to production OTLP backend
- [ ] `STRIPE_SECRET_KEY` switched to `sk_live_...` when billing activates
