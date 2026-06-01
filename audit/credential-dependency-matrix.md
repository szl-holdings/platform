# SZL Holdings — Credential Dependency Matrix

**Generated:** 2026-04-21
**Track:** Zero-Gap Track 3

This matrix documents every credential/secret each auth path needs, its category,
and whether it is available in the local Replit dev environment vs. production-only.

Categories:
- **required-prod**: Must be set before any production traffic; server blocks boot or degrades if absent.
- **required-local**: Should be set for full local development; features degrade/mock otherwise.
- **optional**: Enables a specific feature; platform continues without it (mock fallback or feature disabled).
- **demo-fallback**: Hardcoded or auto-generated value used in dev/demo; NEVER use in production.

---

## Auth System Credentials

| Secret | Category | Auth Flow | Local | Production | Notes |
|--------|----------|-----------|-------|-----------|-------|
| `SESSION_SECRET` | **required-prod** | All session-based auth | Optional (demo key used) | **SET** ✓ (2026-04-23, task #3121) | Signs session tokens; startup warns if missing in prod |
| `REPL_ID` | **required-prod** | Replit OIDC sign-in | Optional (OIDC disabled) | **MUST SET** | OIDC client ID; without it `/api/login` returns 404 |
| `ISSUER_URL` | optional | Replit OIDC | Defaults to `https://replit.com/oidc` | Set explicitly | OIDC discovery URL |
| `OAUTH_STATE_SECRET` | **required-prod** | OIDC state param CSRF | Auto-generated at boot | **SET** ✓ (64 hex, 2026-04-23, task #3121) | Prevents OIDC state forgery; auto-gen is dev-safe only |
| `MFA_SECRET_ENCRYPTION_KEY` | **required-prod** | TOTP/MFA | **SET** ✓ (64 hex, 2026-04-22, task #2885) | **SET** ✓ | 64 hex chars; AES-256-GCM encryption of TOTP secrets at rest active |
| `AZURE_AD_TENANT_ID` | optional | Azure AD SSO | Not required | Set for AAD tenants | Multi-tenant SSO |
| `AZURE_AD_CLIENT_ID` | optional | Azure AD SSO | Not required | Set for AAD tenants | |
| `AZURE_AD_CLIENT_SECRET` | optional | Azure AD SSO | Not required | Set for AAD tenants | Sensitive |
| `SERVICE_ROLE_KEY` | optional | Machine-to-machine | Not required | Set for M2M | Admin bypass for internal calls |
| `AUTH_PROVIDER_KEY` | optional | Generic OIDC | Not required | Optional | OIDC client secret for non-Replit providers |

---

## Service-to-Service Auth Credentials

| Secret | Category | Flow | Local | Production | Notes |
|--------|----------|------|-------|-----------|-------|
| `ALLOY_INTERNAL_TOKEN` | **required-prod** | Internal service auth (`x-internal-token`) | **Auto-generated** (96-char hex) at boot | **SET** ✓ (64+ chars, 2026-04-23, task #3121) | Production boot fails if not set or < 32 chars |
| `CONNECTOR_ENCRYPTION_KEY` | **required-prod** | RMM credential encryption (AES-256-GCM) | Optional (derived dev key) | **SET** ✓ (64 hex, 2026-04-23, task #3121) | Production boot fails if not set |
| `USAGE_EVENT_SERVICE_TOKEN` | optional | `POST /api/orgs/:slug/usage/events` internal collector | Not required | Set for usage tracking | Scoped to single endpoint |
| `SUBSTRATE_GATEWAY_API_KEY` | optional | Substrate MCP gateway proxy (`/mcp/*`) | Not required | Set for substrate | Bearer auth for gateway sidecar |

---

## Database Credential

| Secret | Category | Impact if Missing | Local | Production |
|--------|----------|--------------------|-------|-----------|
| `DATABASE_URL` | **required-prod** | Sessions, users, roles, all DB-backed routes | Optional (mock/in-memory) | **MUST SET** |

Without `DATABASE_URL`:
- `/api/health` returns 503 (DB probe times out)
- `/api/ready` times out
- `/api/auth/login-password` times out
- `/api/auth/login` cannot create sessions
- All DB-backed domain routes return 500 or degrade

---

## AI / Inference Credentials

| Secret | Category | Impact if Missing | Notes |
|--------|----------|-------------------|-------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | optional | AI features use mock fallback | Replit AI proxy key |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | optional | Same | |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | optional | Same | |

Without any AI key, the server reports `aiMode: "mock"` in `/api/health`. Pulse AI generation uses fixture data.

---

## Observability / Monitoring Credentials

| Secret | Category | Impact if Missing | Notes |
|--------|----------|-------------------|-------|
| `SENTRY_DSN` | **required-prod** (KG028) | Error tracking disabled | Startup warns in prod |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | **required-prod** (KG009) | No distributed tracing | Startup warns in prod |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | optional | Azure Monitor disabled | Alternative to OTLP |
| `NEW_RELIC_LICENSE_KEY` | optional | New Relic disabled | |

---

## External Integration Credentials

| Secret | Category | Domain | Notes |
|--------|----------|--------|-------|
| `STRIPE_SECRET_KEY` | optional | Billing | Billing routes degrade without |
| `STRIPE_WEBHOOK_SECRET` | optional | Billing webhooks | |
| `MAPBOX_TOKEN` (or env equiv) | optional | Terra, Vessels maps | Public `pk.*` token; URL-allowlisted |
| `GITHUB_TOKEN` | optional | GitHub integration | |
| `RESEND_API_KEY` | optional | Email delivery | Falls back to SendGrid, then SMTP, then silent drop |
| `SENDGRID_API_KEY` | optional | Email delivery (fallback) | |
| `ELEVENLABS_API_KEY` | optional | Voice asset generation | |

---

## Demo / Dev-Only Credentials

| Secret | Category | Notes |
|--------|----------|-------|
| `DEMO_MODE=true` | demo-fallback | Enables mock external services; disables destructive ops |
| `ENABLE_DEMO_SEED=true` | demo-fallback | Seeds demo data at boot |
| `ALLOY_INTERNAL_TOKEN` (auto-generated) | demo-fallback | 96-char hex auto-gen in dev; permanent secret SET ✓ (task #3121) |
| `OAUTH_STATE_SECRET` (auto-generated) | demo-fallback | 64-char hex auto-gen in dev; permanent secret SET ✓ (task #3121) |

---

## Secrets Never in Code

The following secrets are referenced exclusively via `process.env.*`. No hardcoded values exist in the codebase (validated by static search). All are documented in `.env.example` with placeholder values:

`SESSION_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SENDGRID_API_KEY`, `ALLOY_INTERNAL_TOKEN`, `CONNECTOR_ENCRYPTION_KEY`, `MFA_SECRET_ENCRYPTION_KEY`, `AZURE_AD_CLIENT_SECRET`, `SENTRY_DSN`, `GITHUB_TOKEN`, `AI_INTEGRATIONS_*`

---

## Action Items (Ordered by Severity)

| Priority | Action | Credential | Command |
|----------|--------|-----------|---------|
| P0 | ~~Set `MFA_SECRET_ENCRYPTION_KEY`~~ | F-02 | **DONE** ✓ (task #2885, 2026-04-22) |
| P0 | ~~Set `SESSION_SECRET`~~ | Auth | **DONE** ✓ (task #3121, 2026-04-23) |
| P0 | ~~Set `CONNECTOR_ENCRYPTION_KEY`~~ | RMM encryption | **DONE** ✓ (task #3121, 2026-04-23) |
| P0 | ~~Set `ALLOY_INTERNAL_TOKEN` (permanent)~~ | Internal auth | **DONE** ✓ (task #3121, 2026-04-23) |
| P0 | ~~Set `OAUTH_STATE_SECRET` (permanent)~~ | OIDC state | **DONE** ✓ (task #3121, 2026-04-23) |
| P1 | Set `DATABASE_URL` (live DB) | DB | Replit PostgreSQL or external |
| P1 | Set `REPL_ID` | OIDC | Replit project settings |
| P2 | Set `SENTRY_DSN` | Observability | Sentry dashboard |
| P2 | Set `OTEL_EXPORTER_OTLP_ENDPOINT` | Tracing | Tempo/Jaeger/Honeycomb/Datadog |
| P3 | Set `AI_INTEGRATIONS_*` | AI features | Replit AI Integrations |
