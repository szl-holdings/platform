# Environment Variable Matrix

> **DEPRECATED** — This document has been superseded by [`ops/infra/environment-matrix.md`](ops/infra/environment-matrix.md).
> This file is retained for historical reference only. Do not update it.

> Complete reference for all environment variables used across the SZL Holdings platform. Organized by service and environment.

---

## Environment Classification

| Environment | Description |
|-------------|-------------|
| `development` | Replit workspace — active development |
| `staging` | Pre-production validation (Azure staging slot) |
| `production` | Live customer-facing deployment (Azure) |

---

## Critical Variables (All Services)

| Variable | Required | Description | Example | Secret |
|----------|----------|-------------|---------|--------|
| `NODE_ENV` | Yes | Runtime environment | `development` / `production` | No |
| `PORT` | Yes | Server port (set by Replit automatically) | `3000` | No |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db` | **Yes** |
| `SESSION_SECRET` | Yes | Express session signing secret | Random 64-char hex string | **Yes** |

---

## API Server (`artifacts/api-server`)

| Variable | Required | Description | Default | Secret |
|----------|----------|-------------|---------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | — | **Yes** |
| `SESSION_SECRET` | Yes | Session signing key | — | **Yes** |
| `ADMIN_PIN` | Yes | Admin panel access PIN | — | **Yes** |
| `REPLIT_DOMAINS` | Yes (dev) | Comma-separated allowed domains for Replit Auth | — | No |
| `CSRF_SECRET` | No | CSRF token secret (falls back to SESSION_SECRET) | — | **Yes** |
| `PORT` | Yes | Server port | `3001` | No |
| `CORS_ORIGINS` | No | Additional allowed CORS origins | — | No |
| `LOG_LEVEL` | No | Logging verbosity | `info` | No |
| `SENTRY_DSN` | No | Sentry error tracking DSN | — | **Yes** |

---

## Authentication

| Variable | Required | Description | Secret |
|----------|----------|-------------|--------|
| `REPLIT_DOMAINS` | Yes (Replit env) | Replit domain for OIDC callback | No |
| `OAUTH_CLIENT_ID` | No (prod) | Azure AD OAuth client ID | **Yes** |
| `OAUTH_CLIENT_SECRET` | No (prod) | Azure AD OAuth client secret | **Yes** |
| `OAUTH_TENANT_ID` | No (prod) | Azure AD tenant ID | **Yes** |
| `AZURE_AD_ISSUER` | No (prod) | Azure AD issuer URL | No |

---

## Third-Party Integrations

### AI / ML

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `HUGGINGFACE_API_KEY` | HuggingFace Inference | For AI features | **Yes** |
| `OPENAI_API_KEY` | OpenAI (fallback) | Optional | **Yes** |
| `ANTHROPIC_API_KEY` | Anthropic (fallback) | Optional | **Yes** |

### Payments

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `STRIPE_SECRET_KEY` | Stripe | For billing | **Yes** |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Frontend | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook validation | **Yes** |

### Mapping

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `MAPBOX_ACCESS_TOKEN` | Mapbox | For Terra/Vessels maps | **Yes** |
| `VITE_MAPBOX_TOKEN` | Mapbox (frontend) | For Vite builds | **Yes** |

### Email

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `SMTP_HOST` | Nodemailer | For email sending | No |
| `SMTP_PORT` | Nodemailer | | No |
| `SMTP_USER` | Nodemailer | | **Yes** |
| `SMTP_PASS` | Nodemailer | | **Yes** |
| `SMTP_FROM` | Nodemailer | From address | No |

### Analytics

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `VITE_GA_MEASUREMENT_ID` | Google Analytics | Optional | No |
| `VITE_POSTHOG_KEY` | PostHog | Optional | **Yes** |

### Azure (Production Only)

| Variable | Description | Secret |
|----------|-------------|--------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription | No |
| `AZURE_RESOURCE_GROUP` | Resource group name | No |
| `AZURE_KEY_VAULT_NAME` | Key Vault name | No |
| `AZURE_STORAGE_ACCOUNT` | Storage account for backups | **Yes** |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights | **Yes** |
| `REDIS_CONNECTION_STRING` | Azure Redis Cache | **Yes** |
| `CDN_ENDPOINT` | Azure CDN endpoint | No |

---

## Frontend Variables (Vite `VITE_*`)

Vite only exposes variables prefixed with `VITE_` to the frontend bundle. Never put secrets in `VITE_*` variables.

| Variable | Used In | Description |
|----------|---------|-------------|
| `VITE_API_URL` | All web apps | API base URL |
| `VITE_MAPBOX_TOKEN` | Terra, Vessels | Mapbox public token |
| `VITE_GA_MEASUREMENT_ID` | SZL Holdings | Google Analytics |
| `VITE_POSTHOG_KEY` | All web apps | PostHog analytics |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Billing flows | Stripe public key |
| `BASE_URL` | All (auto) | Artifact base path (set by Vite) |

---

## Per-Environment Variable Values

### Development (Replit)

```
NODE_ENV=development
# DATABASE_URL — set in Replit Secrets
# SESSION_SECRET — set in Replit Secrets
# ADMIN_PIN — set in Replit Secrets
REPLIT_DOMAINS=<auto-set by Replit>
LOG_LEVEL=debug
```

### Production (Azure)

```
NODE_ENV=production
# All secrets managed via Azure Key Vault
# Application reads from Key Vault references in App Service config
LOG_LEVEL=warn
SENTRY_DSN=<set in Key Vault>
APPLICATIONINSIGHTS_CONNECTION_STRING=<set in Key Vault>
REDIS_CONNECTION_STRING=<set in Key Vault>
```

---

## Secrets Management Policy

1. **Never commit secrets to version control.** Use Replit Secrets for development, Azure Key Vault for production.
2. **No `.env` files with real values.** Only `.env.example` with placeholder values is acceptable.
3. **Rotate secrets immediately** if any exposure occurs. See [RUNBOOK_SECRETS.md](infra/runbooks/RUNBOOK_SECRETS.md).
4. **Minimum permission principle.** Each service only receives the secrets it needs.
5. **Audit access.** All Key Vault access is logged in Azure Monitor.

See [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) for the full secrets policy.

---

## Adding a New Environment Variable

1. Determine if it's a secret (if in doubt, treat it as one)
2. Add to Replit Secrets for development
3. Add to Azure Key Vault for production
4. Update this document
5. Add to `.env.example` with a placeholder value and description
6. Update [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) if the variable has special handling requirements

---

## ATLAS Spatial Runtime Environment Variables

The following environment variables control ATLAS feature flags and integrations. All flags are also manageable through the admin UI without environment variable changes.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_ATLAS_SPATIAL_RUNTIME` | No | Feature flag default (on) | Overrides the `ENABLE_ATLAS_SPATIAL_RUNTIME` platform flag. Set to `"false"` to disable all ATLAS routes globally. |
| `ENABLE_OPENUSD_EXPORTS` | No | Feature flag default (off) | Overrides the `ENABLE_OPENUSD_EXPORTS` platform flag. Safe to enable — stub output always available. |
| `ENABLE_NIM_PROVIDER` | No | Feature flag default (off) | Overrides the `ENABLE_NIM_PROVIDER` platform flag. |
| `NIM_API_BASE_URL` | Conditional | — | Required when `ENABLE_NIM_PROVIDER` is active. NVIDIA NIM endpoint base URL. |
| `NIM_API_KEY` | Conditional | — | Required when `ENABLE_NIM_PROVIDER` is active. NIM API key. Store in Replit Secrets. |
| `ENABLE_SCENARIO_FORGE` | No | Feature flag default (on) | Overrides the `ENABLE_SCENARIO_FORGE` platform flag. |
| `ENABLE_EXECUTIVE_SAFE_MODE` | No | Feature flag default (off) | Overrides the `ENABLE_EXECUTIVE_SAFE_MODE` platform flag. Set to `"true"` for board/investor demos. |

**Note:** Feature flags set via environment variables override database values. This is intentional for emergency shutoff scenarios. Remove the environment variable to revert control to the database/admin UI.
