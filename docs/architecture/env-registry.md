# Canonical Environment Variable Registry

**Version:** 1.0  
**Date:** April 2026  
**Source of truth:** `artifacts/api-server/src/lib/startup-validation.ts` — `ENV_SPECS` array  
**Runtime endpoint:** `GET /api/env-registry` (returns live configuration state)

This document is the canonical, human-readable registry of all environment variables used by the SZL Holdings API server. It is generated from the same `ENV_SPECS` array that the startup validation reads at boot time.

---

## Group: server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server listen port |
| `NODE_ENV` | No | `development` | Runtime environment (`development` \| `production` \| `test`) |
| `APP_ENV` | No | — | Application environment label (`staging` \| `production` \| `demo`) |
| `LOG_LEVEL` | No | `info` | Pino log level (`trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal`) |
| `PUBLIC_APP_URL` | No | — | Public-facing URL for OIDC redirects and email links |
| `CORS_ORIGINS` | No | — | Comma-separated list of allowed CORS origins |

---

## Group: database

| Variable | Required | Default | Secret | Description |
|----------|----------|---------|--------|-------------|
| `DATABASE_URL` | No | — | ✅ | PostgreSQL connection string for the primary database |

Also accepted as individual components: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

---

## Group: platform

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEMO_MODE` | No | `false` | Enables demo mode — mocks external services, disables destructive ops |
| `ENABLE_DEMO_SEED` | No | `false` | Seeds demo data on startup — sets runtime mode to `demo` |

---

## Group: auth

| Variable | Required | Default | Secret | Description |
|----------|----------|---------|--------|-------------|
| `AUTH_PROVIDER_URL` | No | — | | OIDC provider discovery URL (defaults to Replit OIDC) |
| `AUTH_PROVIDER_KEY` | No | — | ✅ | OIDC client secret or API key |
| `SERVICE_ROLE_KEY` | No | — | ✅ | Internal service role key for machine-to-machine calls |
| `SESSION_SECRET` | No | auto | ✅ | Session encryption secret — **must be set in production** |
| `REPL_ID` | No | — | | Replit deployment ID used as OIDC client ID |
| `ISSUER_URL` | No | `https://replit.com/oidc` | | OIDC issuer URL |
| `OAUTH_STATE_SECRET` | No | auto-generated | ✅ | OAuth state signing secret — auto-generated if missing |

---

## Group: alloy

| Variable | Required | Default | Secret | Description |
|----------|----------|---------|--------|-------------|
| `ALLOY_INTERNAL_TOKEN` | **Yes (production)** | auto | ✅ | Internal token for Alloy admin context — must be 32+ chars |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | No | `true` | | Human approval gate for critical ops — **cannot be `false` in production** |
| `ALLOY_WORKFLOW_AUTO_RUN` | No | `true` | | Auto-run scheduled workflows on startup |
| `ALLOY_MAX_BATCH_SIZE` | No | `100` | | Maximum items in a single workflow batch |

---

## Group: atlas

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ATLAS_SCHEMA_VERSION` | No | `1.0.0` | ATLAS enterprise state model schema version |
| `ATLAS_DOMAIN_PACK_ENFORCE` | No | `false` | Enforce strict ATLAS conformance validation on entity writes |
| `ATLAS_EVENT_BUS_ENABLED` | No | `false` | Enable cross-domain ATLAS event bus routing |
| `ATLAS_CROSS_DOMAIN_TELEMETRY` | No | `false` | Capture cross-domain entity relationship telemetry |

---

## Group: features

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FEATURE_ALLOY_ORCHESTRATION` | No | `true` | Enable the Alloy orchestration subsystem |
| `FEATURE_ALLOY_GOVERNANCE` | No | `true` | Enable the Alloy governance and approval subsystem |
| `FEATURE_ALLOY_WEBHOOKS` | No | `true` | Enable Alloy outbound webhook delivery |
| `FEATURE_AUDIT_LOGGING` | No | `true` | Enable platform-wide immutable audit logging |

---

## Group: billing

| Variable | Required | Default | Secret | Description |
|----------|----------|---------|--------|-------------|
| `STRIPE_SECRET_KEY` | No | — | ✅ | Stripe secret key for payment processing |

---

## Group: integrations

| Variable | Required | Default | Secret | Description |
|----------|----------|---------|--------|-------------|
| `GITHUB_TOKEN` | No | — | ✅ | GitHub personal access token |
| `OPENAI_API_KEY` | No | — | ✅ | OpenAI API key for AI inference |
| `ANTHROPIC_API_KEY` | No | — | ✅ | Anthropic API key for Claude |
| `ELEVENLABS_API_KEY` | No | — | ✅ | ElevenLabs API key for voice |

Also recognized (Replit AI proxy):
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- `AI_INTEGRATIONS_GEMINI_API_KEY` / `AI_INTEGRATIONS_GEMINI_BASE_URL`

---

## Group: storage

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | No | — | Replit GCS object storage bucket ID |
| `PUBLIC_OBJECT_SEARCH_PATHS` | No | — | GCS paths for public asset serving |
| `PRIVATE_OBJECT_DIR` | No | — | GCS path prefix for private uploads |

---

## Group: runtime

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REPLIT_DEV_DOMAIN` | No | — | Replit dev domain for proxy-aware redirects |

---

## Production Requirements

The following variables **must be set** before deploying to production:

| Priority | Variable | Why |
|----------|----------|-----|
| **BLOCKING** | `DATABASE_URL` | All database features unavailable without this |
| **BLOCKING** | `SESSION_SECRET` | Sessions will use insecure default |
| **BLOCKING** | `ALLOY_INTERNAL_TOKEN` | Server will refuse to start |
| **BLOCKING** | `CORS_ORIGINS` | Cross-origin requests will be rejected |
| **Important** | `PUBLIC_APP_URL` | OIDC redirects and email links may break |
| **Important** | `STRIPE_SECRET_KEY` | Billing will operate in demo mode only |

---

## Runtime Inspection

```bash
# Check live configuration state (development only)
curl http://localhost:3000/api/env-registry | jq .

# In production, requires authentication
curl -H "Cookie: ..." https://api.szlholdings.com/api/env-registry | jq .
```

---

*See also: [Environment Separation](../ENVIRONMENT_SEPARATION.md) · [Secrets Policy](../SECRETS_POLICY.md) · [Production Readiness](../production-readiness.md)*
