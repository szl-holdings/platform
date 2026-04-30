# Operations Runbook — SZL Holdings Platform

**Version:** 2.0 | **Date:** April 2026 | **Audience:** Engineers, operators, on-call responders

**Related:** [architecture.md](../architecture/architecture.md) · [DEPLOYMENT-GUIDE.md](deployment-guide.md) · [KNOWN-GAPS.md](known-gaps.md)

---

## Table of Contents

1. [Environment Overview](#1-environment-overview)
2. [Workflow Management (Replit)](#2-workflow-management-replit)
3. [Environment Variables](#3-environment-variables)
4. [Database Operations](#4-database-operations)
5. [Health & Monitoring](#5-health--monitoring)
   - [5.3 Production Observability Runbook](#53-production-observability-runbook)
6. [Common Failure Modes & Recovery](#6-common-failure-modes--recovery)
7. [Incident Response](#7-incident-response)
8. [Code Quality Commands](#8-code-quality-commands)
9. [Release Operations](#9-release-operations)
10. [Canonical Documentation — Freshness Policy & Drift Risk](#10-canonical-documentation--freshness-policy--drift-risk)

---

## 1. Environment Overview

The SZL Holdings platform runs as a **pnpm monorepo** on Replit (development / staging) with Azure as the production target.

| Environment | Platform | Purpose |
|-------------|----------|---------|
| Development | Replit workspace | Active development, feature work, internal preview |
| Staging / Demo | Replit (published) | Pre-production validation, investor demo |
| Production | Azure App Service | Enterprise customer-facing (target architecture, not yet live) |

**Monorepo layout:**

```
/
├── artifacts/          # Deployable apps — web + mobile
├── lib/                # 34 shared TypeScript packages
├── scripts/            # QA, seeding, backup, migration scripts
├── infra/              # Azure Bicep IaC templates
├── packages/           # Marketplace integrations
└── docs/               # Full documentation suite
```

---

## 2. Workflow Management (Replit)

Each artifact has a dedicated Replit workflow. Workflows are managed through the Replit interface.

| Workflow | Service | Preview Path | Notes |
|----------|---------|--------------|-------|
| `artifacts/szl-holdings: web` | SZL Holdings corporate site | `/` | Independent on port 21130 |
| `artifacts/api-server: api` | Centralized API server | `/api/` | Runs as subprocess of Command Vite process |
| `artifacts/aegis: web` | Aegis Defense | `/aegis/` | Shared gateway on port 9090 |
| `artifacts/vessels: web` | Vessels Maritime | `/vessels/` | Shared gateway on port 9090 |
| `artifacts/terra: web` | Terra Real Estate | `/terra/` | Shared gateway on port 9090 |
| `artifacts/carlota-jo: web` | Carlota Jo Advisory | `/carlota-jo/` | Shared gateway on port 9090 |
| `artifacts/command: web` | Command Portal | `/command/` | Shared gateway on port 9090 |
| `artifacts/szl-holdings-mobile: expo` | CORTEX mobile | Expo tunnel | |
| `artifacts/mockup-sandbox: Component Preview Server` | Design sandbox | `/__mockup` | Internal only |

The `artifacts/api-server: api` workflow is registered but the API server runs as a subprocess of the Command Vite process. The standalone workflow will fail with port conflict — this is expected.

**Archived artifacts** (firestorm, lyte-command-center, imperium, prism-counsel, stephen-site) have no running workflows. App source code (pages, components, routes) has been removed; DEPRECATED.md/ARCHIVED.md markers, stale dist/node_modules, and residual config files may remain.

### When to Restart a Workflow
- Code changes require a server restart
- Environment variable changes were applied
- Dependencies were installed or updated
- A workflow has crashed or become unresponsive

### Port Configuration
**Critical:** All services must bind to `$PORT`. Never hardcode port numbers.

```typescript
// Vite config pattern
server: {
  port: parseInt(process.env.PORT || "3000"),
  host: "0.0.0.0",
  allowedHosts: true,  // Required for Replit proxy iframe
}
```

---

## 3. Environment Variables

Secrets are managed via **Replit Secrets** (development) and **Azure Key Vault** (production). Never commit secrets to source control.

### Critical — Required for All Environments

| Variable | Description | Production Notes |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Provisioned automatically by Replit |
| `SECRET_ENCRYPTION_KEY` | Primary encryption key for `lib/crypto.ts` | Set in production; falls back to `SESSION_SECRET` if absent |
| `SESSION_SECRET` | Fallback encryption key + HMAC key for WebSocket tickets | Required in production; if unset, WS tickets use ephemeral per-process key (not production-safe) |
| `NODE_ENV` | Runtime environment (`development` / `production`) | Set automatically in Replit deploys |
| `PORT` | Server port | Assigned automatically per artifact by Replit |

### Authentication & Security

| Variable | Description |
|----------|-------------|
| `ISSUER_URL` | OIDC issuer URL (default: `https://replit.com/oidc`) |
| `REPL_ID` | Replit deployment ID — used as OIDC client ID. Provided automatically |
| `OAUTH_STATE_SECRET` | Signs OAuth state parameters (in Replit Secrets, not .replit) |
| `SERVICE_ROLE_KEY` | Internal machine-to-machine service key |
| `ALLOY_INTERNAL_TOKEN` | Admin token for AlloyChat and `/api/health/detailed` access (must be 32+ chars) |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins. **Must be set in production** |
| `ADMIN_PIN` | Admin panel PIN (hashed at rest). Required for `/admin` CMS access |
| `DEMO_MODE` | `true` mocks external services and disables destructive operations |

### Database Pool Tuning

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_MIN` | `2` | Minimum connections |
| `DB_POOL_MAX` | `10` | Maximum connections |
| `DB_CONNECT_TIMEOUT_MS` | `5000` | Connection acquisition timeout |
| `DB_IDLE_TIMEOUT_MS` | `30000` | Idle connection release timeout |
| `DB_STATEMENT_TIMEOUT_MS` | `10000` | Per-statement execution timeout |
| `SLOW_QUERY_THRESHOLD_MS` | `500` | Slow query logging threshold |

### AI Integrations

| Variable | Description |
|----------|-------------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (Replit AI proxy) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (Replit proxy in dev) |
| `OPENAI_API_KEY` | Direct OpenAI key (fallback) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic API key (Replit AI proxy) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API key (Replit AI proxy) |

### Mobile

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | API server base URL for Expo apps |
| `REPLIT_EXPO_DEV_DOMAIN` | Expo tunnel domain for mobile preview |
| `REPLIT_DEV_DOMAIN` | Replit dev proxy domain — used for API + WebSocket URL construction |

---

## 4. Database Operations

The workspace uses a Replit-managed PostgreSQL database in development. Azure PostgreSQL Flexible Server in production.

### Schema Management

```bash
# Push schema changes (development — uses Drizzle push, no migration files)
pnpm --filter db push

# Force push (reset + apply — destroys data, only for dev)
yes '' | pnpm --filter db push --force

# Run migrations (production — uses migration files)
pnpm --filter artifacts/api-server db:migrate
```

### Seeding

```bash
# Seed all demo data
pnpm seed:demo

# Seed specific domain data
pnpm --filter scripts run seed:vessels
pnpm --filter scripts run seed:terra
pnpm --filter scripts run seed:aegis
```

### Direct Access (Development)

```bash
psql $DATABASE_URL
```

**Never run destructive operations against production.** The production connection string differs from development.

---

## 5. Health & Monitoring

### Health Endpoints

| Endpoint | Auth | Returns |
|----------|------|---------|
| `GET /api/health` | Public | DB-checked liveness — returns `200 {"status":"healthy"}` if DB is reachable, `503 {"status":"degraded"}` otherwise |
| `GET /api/health/detailed` | Internal token (`X-Internal-Token: $ALLOY_INTERNAL_TOKEN`) or authenticated session (production only; unauthenticated in development) | Full system status: DB connectivity + connection pool metrics, job queue depth (pending/running/completed/failed), telemetry snapshot (P95 latency, error rate, active alerts). Returns `503` if any check is `degraded`. |

**Health check for production monitoring:**

```bash
curl https://api.szlholdings.com/api/health
```

### Self-Monitoring

The API server runs `lib/self-monitor.ts` which polls `/api/health/detailed` every 5 minutes. Alerts fire when:
- Error rate exceeds 5%
- P95 latency exceeds 2 seconds
- Database becomes unreachable
- Job queue depth exceeds 50

### AI Provider Health

Active health probes check OpenAI, Anthropic, and Gemini reachability every 2 minutes. Failures are logged and can trigger Slack alerts.

### Notification Rate Limiting

| Severity | Max per minute | Behavior when exceeded |
|----------|---------------|----------------------|
| Critical | 5 | Suppressed with warning log |
| Warning | 10 | Suppressed with warning log |
| Info | 20 | Suppressed with warning log |

---

## 5.3 Production Observability Runbook

This section documents setup, verification, and incident procedures for all three production observability systems. **These must be configured before any enterprise pilot or public launch.**

---

### Sentry Error Tracking (KG028 — Resolved Apr-2026)

**Status:** Code fully implemented in `artifacts/api-server/src/lib/sentry.ts`. Activated by setting `SENTRY_DSN`.

#### Setup

1. Create a **Node.js** project in your Sentry organization at https://sentry.io
2. Copy the DSN from the project settings
3. Add the secret in Replit (dev/staging) or Azure Key Vault (production):

```bash
# Replit Secrets
SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project-id>

# Azure Key Vault
az keyvault secret set --vault-name szl-keyvault \
  --name SENTRY-DSN --value "https://<key>@o<org>.ingest.sentry.io/<project-id>"
```

4. Optional tuning variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | — | Sentry project DSN (required to activate) |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Fraction of transactions traced (0–1) |
| `SENTRY_PROFILES_SAMPLE_RATE` | `0.1` | Fraction of transactions profiled (0–1) |

#### What is captured automatically

- All unhandled exceptions and promise rejections (`onUncaughtExceptionIntegration`)
- HTTP request breadcrumbs (`httpIntegration`)
- Express route errors (`expressIntegration`)
- PostgreSQL query spans (`postgresIntegration`)
- Authorization, cookie, and internal token headers are scrubbed before sending

#### Source Maps

Release tagging is automatic — Sentry receives `szl-api@<version>` from `package.json`. To upload source maps to Sentry for readable stack traces in production:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps after build
sentry-cli releases new "szl-api@$(node -p "require('./package.json').version")"
sentry-cli releases files "szl-api@$(node -p "require('./package.json').version")" \
  upload-sourcemaps ./artifacts/api-server/dist --url-prefix '~/dist'
sentry-cli releases finalize "szl-api@$(node -p "require('./package.json').version")"
```

#### Verification

```bash
# Confirm Sentry is receiving events (check your Sentry project issues tab)
# Or trigger a test error via the admin panel (Development only):
curl -X POST https://$REPLIT_DEV_DOMAIN/api/admin/test-sentry-error \
  -H "x-internal-token: $ALLOY_INTERNAL_TOKEN"
```

After restart, look for this startup log line:

```
[observability] Production observability status  sentry=enabled
```

---

### OpenTelemetry Distributed Tracing (KG009 — Resolved Apr-2026)

**Status:** `initializeOpenTelemetry()` wired in `index.ts`. Configuration module at `artifacts/api-server/src/lib/observability.ts`. Activated by setting an exporter env var.

#### Supported Exporters

| Exporter | Environment Variable | When to Use |
|----------|---------------------|-------------|
| **OTLP/gRPC or HTTP** | `OTEL_EXPORTER_OTLP_ENDPOINT` | Grafana Tempo, Jaeger, Honeycomb, Datadog OTLP ingest |
| **Azure Application Insights** | `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Azure production deployment |
| **New Relic** | `NEW_RELIC_LICENSE_KEY` | New Relic OTLP ingest |
| **Console (dev/debug)** | `OTEL_CONSOLE_EXPORT=true` | Local development span inspection |

#### Setup (Azure Application Insights — recommended for Azure deploys)

```bash
# Get connection string from Azure portal → Application Insights → Overview
az keyvault secret set --vault-name szl-keyvault \
  --name AZURE-APP-INSIGHTS-CONNECTION-STRING \
  --value "InstrumentationKey=<guid>;IngestionEndpoint=..."
```

#### Setup (Generic OTLP)

```bash
# Point to your OTLP collector
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com:4317
OTEL_SERVICE_NAME=szl-api          # optional — defaults to "szl-api"
```

#### Verification

After setting the exporter env var and restarting:

```bash
# Check startup log for active exporters
# Expected: "[otel] OpenTelemetry initialized: service=szl-api, exporters=[otlp:https://...]"

# Or call the observability status endpoint
curl -H "x-internal-token: $ALLOY_INTERNAL_TOKEN" \
  https://$REPLIT_DEV_DOMAIN/api/health/detailed | jq '.checks'
```

Startup warning if no exporter is configured in production:

```
[observability] Production observability gap  warning="No OTEL exporter configured..."
```

---

### External Uptime Monitoring (KG027 — Resolved Apr-2026)

**Status:** Health endpoint `GET /api/health` is live and returns structured JSON. Setup guide documented here.

#### Health Endpoint Reference

| Endpoint | Auth | Returns |
|----------|------|---------|
| `GET /api/health` | Public | `{ "status": "healthy" }` (200) or `{ "status": "degraded" }` (503) |
| `GET /api/health/detailed` | Internal token | Full system status — DB pool, queue depth, telemetry, memory |

#### Configuring an Uptime Monitor

**Betterstack Uptime (recommended)**

1. Sign in at https://betterstack.com
2. Create a new monitor:
   - **Type:** HTTP
   - **URL:** `https://api.szlholdings.com/api/health` (production) or `https://$REPLIT_DEV_DOMAIN/api/health` (staging)
   - **Check frequency:** 60 seconds
   - **Confirmation threshold:** 2 failures before alerting (prevents flapping)
   - **HTTP method:** GET
   - **Expected status code:** 200
3. Configure alert routing:
   - **On-call escalation:** Page on-call engineer immediately
   - **Email:** stephen@szlholdings.com
   - **Status page webhook:** Connect to your Betterstack status page for automatic incident creation
4. Set `UPTIME_MONITOR_ID` in production env once the monitor ID is known (used in status reporting)

**UptimeRobot (alternative)**

1. Create a new monitor at https://uptimerobot.com
2. Type: HTTP(s), URL: `https://api.szlholdings.com/api/health`
3. Monitoring interval: 5 minutes
4. Alert contacts: email + Slack/PagerDuty webhook

**Datadog Synthetics (if Datadog is your observability platform)**

```yaml
# Datadog synthetic test spec
type: api
name: szl-api health
request:
  method: GET
  url: https://api.szlholdings.com/api/health
assertions:
  - type: statusCode
    operator: is
    target: 200
  - type: body
    operator: contains
    target: '"healthy"'
options:
  tick_every: 60
locations:
  - aws:us-east-1
  - aws:eu-west-1
```

#### Alert Routing Policy

| Condition | Action |
|-----------|--------|
| 2 consecutive health check failures (~2 min) | SEV1 page — on-call engineer |
| Sustained degraded for > 5 minutes | Page stephen@szlholdings.com |
| Sustained degraded for > 15 minutes | Activate incident response: see § 7 Incident Response |
| Recovery | Auto-resolve alert; log recovery time; file 5-minute post-mortem if SEV1 |

#### Verification

```bash
# Manual health check
curl -s https://api.szlholdings.com/api/health
# Expected: {"status":"healthy"}

# Simulate degraded state (dev only — temporarily kill DB connection)
# Then verify the monitor fires within 2 check intervals
```

---

## 6. Common Failure Modes & Recovery

### Blank Preview Pane

1. Is the workflow running? Check workflow status panel.
2. Did the server start? Check workflow logs for startup errors.
3. Is `PORT` set? Server must bind to `$PORT`.
4. Is `server.allowedHosts: true` set in Vite config? (Required for Replit proxy)
5. Restart the workflow.

### Database Connection Failures

1. Verify `DATABASE_URL` is set in Replit Secrets.
2. Check Replit PostgreSQL database is online.
3. Run `pnpm --filter artifacts/api-server db:migrate` to ensure migrations are current.
4. Check `DB_POOL_MAX` — may be exhausted under load.

### TypeScript Errors After Merge

1. Run `pnpm typecheck` to identify affected packages.
2. Rebuild affected library packages first: `pnpm --filter './lib/**' build`.
3. Check `tsconfig.json` project references for the affected package.

### Expo Mobile Not Loading

1. Expo apps use a separate tunnel URL (not the Replit proxy).
2. Check the Expo workflow logs for the tunnel URL.
3. Ensure `EXPO_PUBLIC_API_URL` is set and points to the API server.
4. Check `REPLIT_EXPO_DEV_DOMAIN` is set.

### Session / Auth Issues

1. Verify `SESSION_SECRET` is set in Replit Secrets (must be 32+ chars).
2. Verify `ISSUER_URL` points to the correct OIDC provider.
3. Check that `CORS_ORIGINS` includes the client origin (production).
4. Inspect session records in DB: `SELECT * FROM sessions WHERE expires_at > NOW() LIMIT 10;`

### WebSocket Ticket Failures

1. `SESSION_SECRET` must be set — if absent, tickets use an ephemeral per-process key (reconnects on restart).
2. Check that ticket TTL (5 minutes) has not expired before WebSocket connection.
3. Verify channel ACL is configured correctly for the org.

---

## 7. Incident Response

See [INCIDENT_RESPONSE.md](incident-response.md) for full procedures.

### Severity Quick Reference

| Severity | Description | Response Time |
|----------|-------------|---------------|
| SEV1 | Complete outage, data breach | Immediate (< 15 min) |
| SEV2 | Major feature broken, significant degradation | < 1 hour |
| SEV3 | Minor feature broken, partial degradation | < 4 hours |
| SEV4 | Cosmetic, low-impact | Next business day |

### Rollback Decision Rule

If a deployment happened in the last 2 hours → **rollback first, investigate second.**

**Rollback steps (Replit):**
1. Use Replit checkpoint system to revert to the last known good checkpoint.
2. Restart all affected workflows.
3. Verify `/api/health` returns 200.
4. Monitor for 30 minutes post-rollback.

**Azure rollback:**
- Azure deployment slots provide blue/green swap.
- See `infra/runbooks/RUNBOOK_ROLLBACK.md` for full Azure rollback procedure.

### Security Incident Escalation

1. Immediately notify stephen@szlholdings.com
2. Preserve all logs — do not delete or overwrite anything
3. Do not patch without legal review for potential data exposure
4. Rotate credentials if exposure is confirmed

---

## 8. Code Quality Commands

```bash
pnpm lint          # ESLint across all packages
pnpm typecheck     # TypeScript type checking
pnpm test          # Unit and integration tests
pnpm build         # Full production build (all artifacts)

# QA scripts
node scripts/qa/smoke-routes.js     # Route smoke tests
node scripts/qa/check-links.js      # Broken link detection
node scripts/qa/check-metadata.js   # Meta tag validation
node scripts/qa/check-a11y.js       # Accessibility baseline

# Screenshots
pnpm capture:screens                # Regenerate all screenshots
```

---

## 9. Release Operations

See [RELEASE_CHECKLIST.md](release-checklist.md) for full pre-release checklist.

### Quick Reference

```bash
# 1. Prepare release
pnpm release:prep          # Updates CHANGELOG and version

# 2. Run RELEASE_CHECKLIST.md manually

# 3. Deploy (Azure)
az deployment group create \
  --resource-group szl-production \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json

# 4. Post-deploy verification
curl https://api.szlholdings.com/api/health
pnpm qa:site --url https://szlholdings.com

# 5. Generate release notes
pnpm release:notes
```

### Post-Merge Setup

After every task branch merge, the post-merge script runs automatically:

1. `pnpm install` — Install dependencies
2. `pnpm --filter db push` — Push schema changes
3. Build integrity verification

---

## 10. Canonical Documentation — Freshness Policy & Drift Risk

### Doc Freshness Policy

The eight canonical reference docs listed below are point-in-time snapshots derived from the codebase. They drift as new routes, schema changes, platform surfaces, and API contracts are added. To keep them synchronized:

| Trigger | Action Required |
|---------|----------------|
| Any major platform task merged (new routes, new schema tables, new artifacts) | Re-verify the affected doc(s) against source code; update the *Last verified* footer |
| New artifact registered or archived | Update `PRODUCT-SURFACES.md` and `ARCHITECTURE.md` monorepo structure |
| Schema table count changes significantly | Update `DATA-MODEL.md` and `ARCHITECTURE.md` table counts |
| New API route group added | Update `API-SPEC.md` Route Groups section |
| Role or access control change | Update `ACCESS-CONTROL-MATRIX.md` |
| New analytics event taxonomy added | Update `ANALYTICS-EVENTS.md` Event Registry |
| Deployment model or environment variable changes | Update `DEPLOYMENT-GUIDE.md` and this runbook |
| Quarterly (minimum) | Full review of all eight docs against source |

**Source verification commands:**
```bash
# Count pgTable declarations (current: 798 tables)
grep -rc "= pgTable" lib/db/src/schema/ | awk -F: '{sum += $2} END {print sum}'

# Count schema files (current: 170)
ls lib/db/src/schema/*.ts | wc -l

# Count API route files including subdirectories (current: ~258 .ts files)
find artifacts/api-server/src/routes/ -name "*.ts" | wc -l

# List registered artifacts
cat artifact.toml  # or check .replit artifact registrations
```

### Maintenance & Drift Risk Table

| Document | Source of Truth | Last Verified | Drift Risk | Re-verify When |
|----------|----------------|---------------|------------|----------------|
| [architecture.md](../architecture/architecture.md) | `artifacts/`, `lib/`, `artifacts/api-server/src/` | 2026-04-17 | Medium — monorepo structure and table counts drift with every schema/artifact change | New artifact added/archived; significant schema growth |
| [API-SPEC.md](../architecture/api-spec.md) | `artifacts/api-server/src/routes/`, `lib/api-spec/openapi.yaml` | 2026-04-16 | High — 357 route files; new route groups added frequently | Any new route group or auth model change |
| [DATA-MODEL.md](../architecture/data-model.md) | `lib/db/src/schema/` (170 files, 798 tables) | 2026-04-17 | High — 798 tables across 170 schema files; changes with every schema migration | Any `pnpm --filter db push` in dev or `db:migrate` in prod |
| [PRODUCT-SURFACES.md](../product/product-surfaces.md) | `artifacts/` directory + registered artifact list | 2026-04-17 | Medium — artifact status, component counts, and deprecated surfaces drift | New artifact registered, archived, or status-changed |
| [OPERATIONS-RUNBOOK.md](operations-runbook.md) (this document) | `artifacts/api-server/`, `lib/`, Replit workflows | 2026-04-17 | Low — operational procedures are stable; env vars and health endpoints change occasionally | New env var added; health endpoint changed; workflow topology changes |
| [DEPLOYMENT-GUIDE.md](deployment-guide.md) | `infra/`, `scripts/`, `.github/workflows/` | 2026-04-16 | Low — infrastructure and CI/CD procedures are stable | IaC changes; new GitHub Actions workflow added |
| [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) | `lib/auth/`, `artifacts/api-server/src/middlewares/`, `lib/db/src/schema/auth.ts` | 2026-04-15 | Medium — role system and route classifications change with new features | New role added; new route group requiring distinct auth; RBAC middleware change |
| [ANALYTICS-EVENTS.md](../architecture/analytics-events.md) | `EVENT_TAXONOMY.md`, `ANALYTICS_PLAN.md`, analytics instrumentation | 2026-04-16 | Low — event taxonomy is stable; new event categories added per major feature | New product surface or major feature requiring funnel coverage |

---

*See also: [DEPLOYMENT-GUIDE.md](deployment-guide.md) · [INCIDENT_RESPONSE.md](incident-response.md) · [docs/ops-runbook.md](../ops-runbook.md) · [REPLIT_OPERATIONS.md](replit-operations.md) · [architecture.md](../architecture/architecture.md) · [KNOWN-GAPS.md](known-gaps.md) · [Environment Matrix](../../ops/infra/environment-matrix.md) · [BACKUP-RESTORE.md](backup-restore.md)*

---

*Last verified against source code: 2026-04-18 — § 5.3 Production Observability Runbook added (KG009/KG027/KG028 resolved)*
