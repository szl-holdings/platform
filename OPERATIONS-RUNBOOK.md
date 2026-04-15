# Operations Runbook — SZL Holdings Platform

**Version:** 2.0 · **Last updated:** April 2026
**Audience:** Engineers, operators, on-call responders
**Scope:** Internal operations reference — not user-facing documentation

> This runbook consolidates `docs/ops-runbook.md` and `REPLIT_OPERATIONS.md` into one canonical on-call reference. For deployment procedures see `DEPLOYMENT-GUIDE.md`. For environment variables see `ENV_MATRIX.md`.

---

## Table of Contents

1. [On-Call Triage Sequence](#1-on-call-triage-sequence)
2. [Health Endpoints](#2-health-endpoints)
3. [Workflow Management (Replit)](#3-workflow-management-replit)
4. [Common Failure Modes & Recovery](#4-common-failure-modes--recovery)
5. [Database Operations](#5-database-operations)
6. [Code Quality & Build](#6-code-quality--build)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Incident Severity](#8-incident-severity)

---

## 1. On-Call Triage Sequence

When something is broken and you don't know where to start, follow this sequence:

1. **Is the API alive?** → `GET /api/health/live` — if 503 or unreachable → [FM-2: API Crash](#fm-2-api-server-crash--not-starting)
2. **Is the database reachable?** → `GET /api/health/ready` — if 503 → [FM-1: Database](#fm-1-database-unreachable)
3. **Are subsystems degraded?** → `GET /api/health` — check `services` object for `degraded`, `missing_secret`, or `not_configured` states
4. **Is it a build/startup failure?** → Check workflow logs in Replit for `Error:` on startup → [FM-3: Build Failure](#fm-3-build-failure-typescript--vite)
5. **Is it an auth issue?** → Users can't log in or get 401s everywhere → [FM-4: Auth Broken](#fm-4-authentication-broken)
6. **Is it a specific feature?**
   - AI broken → [FM-5: AI](#fm-5-ai-features-not-working)
   - File uploads failing → [FM-8: Storage](#fm-8-object-storage--file-uploads-failing)
   - Mobile can't connect → [FM-7: Mobile](#fm-7-mobile-app-cannot-connect-to-api)
   - CORS errors → [FM-10: CORS](#fm-10-cors-errors-in-production)
   - Schema out of sync → [FM-9: Migrations](#fm-9-database-schema-out-of-sync)
   - Job queue backpressure → [FM-6: Queue](#fm-6-job-queue-backpressure)

---

## 2. Health Endpoints

| Endpoint | Auth Required | Purpose |
|----------|--------------|---------|
| `GET /api/health/live` | None | Liveness probe — returns 200 if process is running |
| `GET /api/health/ready` | None | Readiness probe — checks database connectivity |
| `GET /api/health` | None | Full system health (DB, job queue, memory, auth, AI, storage) |
| `GET /api/health/detailed` | Session or `X-Internal-Token` header | Full diagnostics — DB pool, queue depth, telemetry, p95 latency |

**Health response statuses:**
- `healthy` (HTTP 200) — all systems nominal
- `warning` (HTTP 200) — degraded performance but serving requests
- `degraded` (HTTP 503) — critical subsystem unreachable

**Health response example:**
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "auth": { "status": "configured" },
    "ai": { "status": "configured" },
    "storage": { "status": "configured" },
    "job_queue": { "status": "healthy", "details": { "pending": 0, "running": 2 } }
  },
  "timestamp": "2026-04-15T12:00:00Z"
}
```

**Queue backpressure threshold:** depth > 50 triggers `backpressure` status.

---

## 3. Workflow Management (Replit)

### Available Workflows

| Workflow | Service | Notes |
|----------|---------|-------|
| `artifacts/api-server: api` | API Server | All backends. Must be running first. |
| `artifacts/szl-holdings: web` | SZL Holdings | |
| `artifacts/lyte-command-center: web` | Lyte Command Center | |
| `artifacts/firestorm: web` | Aegis/Firestorm | |
| `artifacts/vessels: web` | Vessels | |
| `artifacts/terra: web` | Terra | |
| `artifacts/carlota-jo: web` | Carlota Jo | |
| `artifacts/stephen-site: web` | Stephen Site | |
| `artifacts/imperium: web` | IMPERIUM | |
| `artifacts/command: web` | Command Portal | |
| `artifacts/prism-counsel: web` | PRISM Counsel | |
| `artifacts/szl-holdings-mobile: expo` | CORTEX Mobile | Expo tunnel |
| `artifacts/cortex-mobile: expo` | Cortex Mobile (WIP) | Expo tunnel |
| `artifacts/mockup-sandbox: Component Preview Server` | Design sandbox | Internal only |

### When to Restart a Workflow

- Code changes require a server restart
- Environment variable changes applied (Replit Secrets update)
- Dependencies installed or updated
- Workflow crashed or became unresponsive
- Database migrations applied

### Port Configuration

All services bind to `$PORT` (assigned automatically by Replit per artifact). **Never hardcode a port number.**

```typescript
server: {
  port: parseInt(process.env.PORT || "3000"),
  host: "0.0.0.0",
  allowedHosts: true,
}
```

### Preview Debugging (Blank Pane)

1. Is the workflow running? Check workflow status.
2. Did the server start successfully? Check workflow logs.
3. Is `PORT` set correctly? Server must bind to `$PORT`.
4. Vite: is `server.allowedHosts: true` set?
5. Restart the workflow.

---

## 4. Common Failure Modes & Recovery

### FM-1: Database Unreachable

**Symptoms:** `GET /api/health/ready` returns 503. All data reads/writes fail.

**Likely causes:**
- `DATABASE_URL` is not set or incorrect
- Replit's managed PostgreSQL is temporarily unavailable
- Connection pool exhausted (connection leak or high traffic)

**Recovery:**
1. Check `services.database.status` via `GET /api/health`
2. Verify `DATABASE_URL` in Replit Secrets
3. Check Replit's database status page for platform incidents
4. If pool exhaustion: restart the API server workflow (resets connection pool)
5. For connection leaks: check `GET /api/health/detailed` — `total=N idle=N waiting=N`. If `waiting` is high and `idle` is 0, pool is exhausted.

**Emergency restore from backup:**
```bash
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c backups/daily_<timestamp>.sql.gz | psql "$DATABASE_URL"
```
See `docs/disaster-recovery.md` for the full restore playbook.

---

### FM-2: API Server Crash / Not Starting

**Symptoms:** All frontends show network errors. `/api/health/live` is unreachable.

**Likely causes:**
- Syntax or runtime error introduced during a recent change
- Missing required environment variable causing crash on startup
- Port conflict

**Recovery:**
1. Check workflow logs via the Replit workflow panel
2. Look for `Error:` or `Cannot find module` at startup
3. If missing env var: set it in Replit Secrets, restart workflow
4. If code error: revert the most recent change or fix and restart
5. Restart the workflow — the API server has no in-memory state that cannot be reconstructed

**Quick check:** `/api/health` reports `services.auth.status: "missing_secret"` when `SESSION_SECRET` is absent.

---

### FM-3: Build Failure (TypeScript / Vite)

**Symptoms:** A web artifact workflow fails to start after changes. Vite dev server exits immediately.

**Likely causes:**
- TypeScript type error in a shared library (changes to `lib/` affect all consumers)
- Import path error (wrong package name or missing export)
- Version mismatch between shared library and artifact

**Recovery:**
```bash
pnpm typecheck                                        # All type errors across monorepo
pnpm --filter <artifact-name> run typecheck           # Specific artifact
pnpm --filter @szl-holdings/<lib-name> run build      # Rebuild a shared library
pnpm run typecheck:libs                               # tsc --build in dependency order
```

If missing export: check `exports` field in the library's `package.json`.

---

### FM-4: Authentication Broken

**Symptoms:** Login redirects fail, `/api/auth/me` returns 401, or sessions expire immediately.

**Likely causes:**
- `SESSION_SECRET` missing, rotated, or different between restarts
- `ISSUER_URL` incorrect (OIDC issuer mismatch)
- `CORS_ORIGINS` misconfigured, blocking cookie sending
- Session cookie `sameSite` or `secure` flags incompatible with deployment domain

**Recovery:**
1. Verify `SESSION_SECRET` is set in Replit Secrets and unchanged
2. Verify `ISSUER_URL` is `https://replit.com/oidc` (default) or correct provider URL
3. In production: verify `CORS_ORIGINS` includes frontend domain(s) exactly
4. Check `GET /api/health` — `services.auth.status` should be `"configured"`

**Note:** Rotating `SESSION_SECRET` does NOT invalidate existing DB-backed sessions, but immediately invalidates all in-flight WebSocket tickets. To force all users to re-authenticate, delete all rows from the `sessions` table.

---

### FM-5: AI Features Not Working

**Symptoms:** AI recommendations, copilot features, or agent responses return errors. Console shows `AI not configured` or 500s from `/api/ai`.

**Recovery:**
1. Check `GET /api/health` — `services.ai.status` should be `"configured"`
2. If `"not_configured"`: set `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` in Replit Secrets
3. If configured but failing: test the provider connection directly from the API server console
4. Anthropic and Gemini are optional fallbacks — ensure OpenAI is configured first
5. `AI_EXECUTION_MODE=propose_only` is the intended default — AI surfaces recommendations but does not execute autonomously

---

### FM-6: Job Queue Backpressure

**Symptoms:** `/api/health` shows `services.job_queue.status: "backpressure"`. Background jobs are slow or stuck.

**Recovery:**
1. Check `/api/health/detailed` — `job_queue.details` shows `pending=N running=N completed=N failed=N`
2. If `failed` is increasing: a job type is crashing — check API server logs for execution errors
3. If `running` is high but `completed` not increasing: workers stuck — restart API server to reset worker threads
4. Fix database first if DB is slow (FM-1) — job queue performance is tied to DB latency
5. Reduce `ALLOY_MAX_BATCH_SIZE` temporarily if a specific batch job is flooding the queue

---

### FM-7: Mobile App Cannot Connect to API

**Symptoms:** Mobile app shows "Network Error". All API calls fail.

**Recovery:**
1. Confirm API server is running (`GET /api/health/live` returns 200)
2. Verify `EXPO_PUBLIC_API_URL` matches the Replit dev domain or production URL
3. In development: confirm `EXPO_PUBLIC_DOMAIN` matches `$REPLIT_DEV_DOMAIN`
4. For WebSocket failures: confirm `SESSION_SECRET` is set (unset causes ephemeral per-process key — tickets invalid after restart)
5. Rebuild and restart the Expo development server after changing environment variables

---

### FM-8: Object Storage / File Uploads Failing

**Symptoms:** File uploads return errors. Documents or media are not persisting.

**Recovery:**
1. Check `GET /api/health` — `services.storage.status` will be `"demo"` if `OBJECT_STORAGE_BUCKET_ID` is not set
2. For development: demo mode is acceptable — uploads fall back gracefully
3. For production: ensure `OBJECT_STORAGE_BUCKET_ID` is set. Replit App Storage provisioning sets `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, and `PRIVATE_OBJECT_DIR`
4. For Azure production: set `AZURE_STORAGE_CONNECTION_STRING` in Key Vault

---

### FM-9: Database Schema Out of Sync

**Symptoms:** API returns 500 errors with `column "X" does not exist` or `relation "Y" does not exist` in logs.

**Recovery:**
```bash
# Check for pending migration files
ls -lt lib/db/drizzle/

# Apply migrations
pnpm --filter @szl-holdings/db run db:migrate

# Development only (destructive — never use on production)
pnpm --filter @szl-holdings/db run db:push
```

If schema is corrupted: restore from most recent backup (FM-1 restore procedure) and re-apply migrations.

---

### FM-10: CORS Errors in Production

**Symptoms:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin' header`. Authenticated requests fail.

**Recovery:**
1. Set `CORS_ORIGINS` in Replit Secrets to comma-separated allowed origins: `https://myapp.replit.app,https://myapp.com`
2. Wildcard patterns supported: `https://*.replit.app`
3. Restart the API server workflow after updating secrets
4. Verify: `curl -H "Origin: https://your-frontend.com" -I https://your-api/api/health` — check for `Access-Control-Allow-Origin` in response

---

## 5. Database Operations

```bash
# Run migrations (development)
pnpm --filter @szl-holdings/db run db:push

# Run migrations (production-safe)
pnpm --filter @szl-holdings/db run db:migrate

# Seed demo data (development only)
pnpm --filter scripts run seed

# Access database directly
psql $DATABASE_URL

# Manual health check
node -e "const {db} = require('@szl-holdings/db'); db.execute('SELECT 1').then(console.log)"
```

**Never run destructive database operations against production.** The production database connection string differs from development.

---

## 6. Code Quality & Build

```bash
pnpm lint              # ESLint across all packages
pnpm typecheck         # TypeScript type checking
pnpm test              # Unit and integration tests
pnpm build             # Full production build
pnpm run typecheck:libs # Build shared libraries in dependency order
```

### QA Scripts

```bash
node scripts/qa/smoke-routes.js     # Route smoke tests
node scripts/qa/check-links.js      # Broken link detection
node scripts/qa/check-metadata.js   # Meta tag validation
node scripts/qa/check-a11y.js       # Accessibility baseline
```

### Post-Merge Automation

The `scripts/post-merge.sh` script runs automatically after task branch merges:
1. `pnpm install` — Install dependencies
2. `pnpm --filter db push` — Push database schema
3. Verify build integrity

---

## 7. Monitoring & Observability

### Telemetry

The `@szl-holdings/observability` library tracks:
- p95 request latency
- Error rates (> 10% triggers `elevated_errors` in detailed health report)
- DB pool utilization
- Job queue depth

### Logging

All logs are structured JSON via Pino. Log level is configurable via `LOG_LEVEL` env var.

| Level | Use |
|-------|-----|
| `fatal` | Process-stopping errors |
| `error` | Handled errors with impact |
| `warn` | Degraded operation, non-fatal |
| `info` | Key operational events (default) |
| `debug` | Detailed request/response info |
| `trace` | Full SQL query logging |

### Azure Production Monitoring

- **Application Insights** — APM, distributed tracing, log analytics (`APPLICATIONINSIGHTS_CONNECTION_STRING`)
- **Alert thresholds** — Error rate, response time, CPU/memory
- **Uptime monitoring** — `/api/health` endpoint monitored via Azure Monitor

---

## 8. Incident Severity

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| SEV-1 | Complete service outage, data loss risk | Immediate | Database down, API crash, auth broken for all users |
| SEV-2 | Major feature broken, partial outage | < 1 hour | AI not working, specific platform unavailable |
| SEV-3 | Degraded performance, minor feature broken | < 4 hours | Slow queries, upload failures, CORS warnings |
| SEV-4 | Cosmetic or low-impact issue | Next business day | UI glitch, minor content issue |

See `INCIDENT_RESPONSE.md` for the full incident response process and `INCIDENT_SEVERITY_MATRIX.md` for detailed criteria.

---

## Maintenance & Drift Risk

| Area | Drift risk | How to verify |
|------|-----------|---------------|
| Environment variables | High | Compare `ENV_MATRIX.md` against `startup-validation.ts` `ENV_SPECS` array |
| Stripe price IDs | High | Compare against `artifacts/api-server/src/routes/billing.ts` |
| Artifact registry | Medium | Run `ls artifacts/` and compare to workflow list |
| Shared library list | Low | Run `ls lib/` and compare to `ARCHITECTURE.md` |

**Last audited:** April 2026

---

## Related Documents

| Document | Path |
|----------|------|
| Detailed ops runbook (source) | `docs/ops-runbook.md` |
| Replit operations guide (source) | `REPLIT_OPERATIONS.md` |
| Environment variable matrix | `ENV_MATRIX.md` |
| Deployment guide | `DEPLOYMENT-GUIDE.md` |
| Disaster recovery | `docs/disaster-recovery.md` |
| Backup & recovery | `BACKUP_AND_RECOVERY.md` |
| Incident response | `INCIDENT_RESPONSE.md` |
| Secrets policy | `docs/SECRETS_POLICY.md` |
