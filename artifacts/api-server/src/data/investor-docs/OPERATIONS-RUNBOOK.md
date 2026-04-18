# Operations Runbook — SZL Holdings Platform

**Version:** 2.0 | **Date:** April 2026 | **Audience:** Engineers, operators, on-call responders

**Related:** [ARCHITECTURE.md](ARCHITECTURE.md) · [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) · [KNOWN-GAPS.md](KNOWN-GAPS.md)

---

## Table of Contents

1. [Environment Overview](#1-environment-overview)
2. [Workflow Management (Replit)](#2-workflow-management-replit)
3. [Environment Variables](#3-environment-variables)
4. [Database Operations](#4-database-operations)
5. [Health & Monitoring](#5-health--monitoring)
6. [Common Failure Modes & Recovery](#6-common-failure-modes--recovery)
7. [Incident Response](#7-incident-response)
8. [Code Quality Commands](#8-code-quality-commands)
9. [Release Operations](#9-release-operations)

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
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (Replit proxy) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic API key (Replit AI proxy) |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Anthropic base URL (Replit proxy) |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API key (Replit AI proxy) |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini base URL (Replit proxy) |

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

See [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) for full procedures.

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

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for full pre-release checklist.

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

*See also: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) · [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) · [docs/ops-runbook.md](docs/ops-runbook.md) · [REPLIT_OPERATIONS.md](REPLIT_OPERATIONS.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [KNOWN-GAPS.md](KNOWN-GAPS.md) · [ENV_MATRIX.md](ENV_MATRIX.md) · [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md)*

---

*Last verified against source code: 2026-04-16*
