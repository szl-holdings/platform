# SZL Holdings — Verified Environment Variable Matrix

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Source:** `packages/env/src/index.ts` (Zod schema) + `scripts/qa/verify-env.js` run output

---

## Verification Run Result (2026-04-21)

```
Required:    2/5 passed
Recommended: 5/8 present
Optional:    2/11 set
Overall:     FAIL
```

**Missing required vars (development environment):** DATABASE_URL, SESSION_SECRET, and 1 other required var not present in current dev secrets.

> Note: In Replit development, DATABASE_URL and SESSION_SECRET are configured via Replit Secrets. The failure here reflects the audit environment's secret state, not a production issue.

---

## Complete Environment Variable Matrix

### Server / Runtime (Required in Production)

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `NODE_ENV` | enum(development\|production\|staging\|test) | No | `development` | ✅ |
| `PORT` | int | No | `3000` | ✅ |
| `LOG_LEVEL` | enum | No | `info` | ✅ |
| `RUNTIME_MODE` | enum(local-dev\|internal-preview\|demo\|production) | No | — | ⚠️ |
| `APP_ENV` | string | No | — | ⚠️ |

### Database (Required in Production)

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `DATABASE_URL` | string (min 1) | **Yes** | — | ⚠️ Replit Secret |
| `DB_POOL_MIN` | int | No | `1` | ✅ |
| `DB_POOL_MAX` | int | No | `100` | ✅ |
| `DB_CONNECT_TIMEOUT_MS` | int | No | `90000` | ✅ |
| `DB_IDLE_TIMEOUT_MS` | int | No | `60000` | ✅ |
| `DB_STATEMENT_TIMEOUT_MS` | int | No | `60000` | ✅ |
| `SLOW_QUERY_THRESHOLD_MS` | int | No | `500` | ✅ |
| `DB_CHECKOUT_WARN_THRESHOLD_MS` | int | No | `30000` | ✅ |

### Authentication (Required in Production)

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `SESSION_SECRET` | string (min 32) | **Yes** | — | ⚠️ Replit Secret |
| `ISSUER_URL` | URL | No | — | ⚠️ Set for OIDC |
| `OAUTH_STATE_SECRET` | string | No | — | ✅ Set |
| `CLERK_SECRET_KEY` | string | No | — | — Not using Clerk |
| `ALLOY_INTERNAL_TOKEN` | string (min 64) | Recommended | — | ✅ Set |
| `CONNECTOR_ENCRYPTION_KEY` | string (min 32) | Recommended | — | ✅ Set |
| `ADMIN_PIN` | string | Recommended | — | ✅ Set |

### Public URLs

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `PUBLIC_APP_URL` | URL | No | — | ⚠️ Set in production |
| `CORS_ORIGINS` | string (comma-sep) | Recommended | — | ⚠️ Not set |
| `BASE_URL` | string | No | — | — |
| `API_BASE_URL` | string | No | — | — |
| `BASE_PATH` | string | No | — | — |

### AI / LLM APIs

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `OPENAI_API_KEY` | string | No (features off) | — | ⚠️ Not set |
| `ANTHROPIC_API_KEY` | string | No (features off) | — | ⚠️ Not set |
| `GEMINI_API_KEY` | string | No (features off) | — | ⚠️ Not set |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | string | No | — | ⚠️ Verify |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | URL | No | — | ⚠️ Verify |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | string | No | — | ⚠️ Verify |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | URL | No | — | ⚠️ Verify |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | string | No | — | ⚠️ Verify |

### Payments (Stripe)

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | string | No (billing off) | — | 🔵 Set |
| `STRIPE_PUBLISHABLE_KEY` | string | No | — | — |
| `STRIPE_WEBHOOK_SECRET` | string | No | — | — |
| `STRIPE_PRICE_*` | string (×8) | No | — | — |

### Email

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `EMAIL_PROVIDER` | enum(resend\|sendgrid\|smtp) | No | — | — |
| `RESEND_API_KEY` | string | No | — | 🔵 Set |
| `SENDGRID_API_KEY` | string | No | — | — |
| `SMTP_*` | various | No | — | — |

### Observability

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `SENTRY_DSN` | string | Recommended | — | ✅ Set |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | string | Recommended | — | ⚠️ Not set |
| `OTEL_SERVICE_NAME` | string | No | `szl-api-server` | ✅ |
| `OTEL_CONSOLE_EXPORT` | boolean | No | false | ✅ |

### External Data APIs

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `MARINETRAFFIC_API_KEY` | string | No (AIS simulated without) | — | ⬜ Not set |
| `COURT_LISTENER_API_TOKEN` | string | No | — | ⬜ Not set |
| `WEBHOOK_SECRET` | string | No | — | — |
| `GOOGLE_CLIENT_ID` | string | No | — | — |
| `GOOGLE_CLIENT_SECRET` | string | No | — | — |
| `GITHUB_INSTALLATION_ID` | string | No | — | — |

### Mobile (Expo)

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL | No | — | — |
| `EXPO_PUBLIC_API_BASE_URL` | URL | No | — | — |
| `EXPO_PUBLIC_ISSUER_URL` | URL | No | — | — |
| `EXPO_PUBLIC_DOMAIN` | string | No | — | — |

### Platform / Replit Injected

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `REPL_ID` | string | No | — | ✅ Auto-injected |
| `REPLIT_DEV_DOMAIN` | string | No | — | ✅ Auto-injected |
| `IP_HASH_SALT` | string (min 32) | Recommended | — | ⚠️ Not set |

### Feature Flags

| Variable | Type | Required | Default | Status |
|---|---|---|---|---|
| `FEATURE_ALLOY_GOVERNANCE` | boolean | No | false | — |
| `FEATURE_ALLOY_ORCHESTRATION` | boolean | No | false | — |
| `FEATURE_ALLOY_WEBHOOKS` | boolean | No | false | — |
| `FEATURE_AUDIT_LOGGING` | boolean | No | false | — |

---

## Status Legend

| Icon | Meaning |
|---|---|
| ✅ | Set and verified |
| ⚠️ | Not set; impacts functionality |
| ⬜ | Not set; feature disabled gracefully |
| 🔵 | Partially set |
| — | Not required; skipped |

---

## Minimum Production Secrets Checklist

Before any investor demo or production deployment, confirm these are set:

- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `SESSION_SECRET` — ≥32 chars, high entropy
- [ ] `ALLOY_INTERNAL_TOKEN` — ≥64 chars, high entropy
- [ ] `CONNECTOR_ENCRYPTION_KEY` — ≥32 chars, high entropy
- [ ] `OAUTH_STATE_SECRET` — for OIDC CSRF prevention
- [ ] `ADMIN_PIN` — admin console access
- [ ] `SENTRY_DSN` — error tracking
- [ ] `CORS_ORIGINS` — production domains
- [ ] `PUBLIC_APP_URL` — canonical production URL

---

*Full env schema: `packages/env/src/index.ts`*  
*Verify script: `pnpm verify:env` or `pnpm verify:env:strict`*
