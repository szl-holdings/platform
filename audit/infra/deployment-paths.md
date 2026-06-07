# SZL Holdings — Deployment Paths

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Development and production deployment paths, build sequences, env requirements

---

## Development Boot Path

### Prerequisites
- Node.js ≥24.0.0
- pnpm@10.26.1
- PostgreSQL 16 instance (or Replit DB)
- Replit secrets configured

### Sequence

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
#    Set secrets via Replit Secrets panel:
#    DATABASE_URL, SESSION_SECRET, OAUTH_STATE_SECRET, ALLOY_INTERNAL_TOKEN
#    CONNECTOR_ENCRYPTION_KEY, ADMIN_PIN, SENTRY_DSN

# 3. Run database migrations
pnpm migrate

# 4. Seed demo data (optional but recommended for dev)
pnpm seed:all

# 5. Start desired workflow(s) via Replit workflow runner
#    Each artifact runs independently; start the ones you need:
#    - API Server (required for all frontend artifacts)
#    - Frontend artifact(s) of choice
```

### Per-Artifact Dev Commands

| Artifact | Dev Command | Notes |
|---|---|---|
| `api-server` | `tsx watch src/index.ts` | Hot-reload; reads PORT |
| All web artifacts | `vite --port $PORT` | Reads PORT; allowedHosts: true |
| `szl-holdings-mobile` | `expo start` | Expo dev server |
| `szl-demo-video` | `vite --port $PORT` | Static video artifact |

---

## Production Build Path

### Prerequisites
- All development prerequisites
- Production Replit secrets set
- `NODE_ENV=production`
- `DATABASE_URL` pointing to production PostgreSQL
- `SESSION_SECRET` (≥32 chars) set
- `SENTRY_DSN` set for error tracking
- `OTEL_EXPORTER_OTLP_ENDPOINT` set for tracing

### Sequence

```bash
# 1. Install dependencies (production-only)
pnpm install --frozen-lockfile

# 2. Type-check all packages
pnpm typecheck

# 3. Run tests
pnpm test

# 4. Build all active artifacts
pnpm build

# 5. Apply migrations (production)
pnpm migrate

# 6. Run readiness gate
pnpm readiness:gate

# 7. Start production server
node artifacts/api-server/dist/index.js
# Frontend artifacts served from their dist/ directories via CDN/static hosting
```

---

## Azure Deployment (Readiness Documented, Not Executed)

### Architecture Assumptions
- API server → Azure App Service (Node.js 24)
- Frontend artifacts → Azure Static Web Apps (CDN)
- Database → Azure Database for PostgreSQL Flexible Server
- Object storage → Azure Blob Storage
- Redis → Azure Cache for Redis
- Monitoring → Azure Monitor + OpenTelemetry

### Azure Environment Variables Required
```
DATABASE_URL=postgresql://user:pass@prod-server.postgres.database.azure.com:5432/szldb?sslmode=require
SESSION_SECRET=<>=32 char secret>
ALLOY_INTERNAL_TOKEN=<>=64 char token>
CONNECTOR_ENCRYPTION_KEY=<>=32 char key>
SENTRY_DSN=https://...@sentry.io/...
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
NODE_ENV=production
APP_ENV=production
RUNTIME_MODE=production
```

### Deployment Blockers (Not Yet Resolved)
1. No Azure App Service deployment pipeline configured
2. No Azure Static Web Apps workflow configured
3. CORS_ORIGINS not set for production Azure domains
4. Mapbox token (`MAPBOX_TOKEN`) not configured
5. LLM API keys not confirmed in production secrets

---

## CI/CD Pipeline

### Current CI (GitHub Actions)
- CI workflow: `.github/workflows/ci.yml` — type-check, lint, test
- CodeQL: `.github/workflows/codeql.yml` — SAST scanning
- Security: `.github/workflows/security.yml` — dependency audit, secret scanning

### Missing CI Steps (Recommended)
- Automated deployment on main branch push
- Schema drift check (`pnpm migrate --dry-run`)
- Lighthouse CI performance regression guard
- E2E smoke test run against staging

---

## Rollback Path

```bash
# Database rollback
pnpm --filter @szl-holdings/db-migrations run rollback <migration-name>

# Application rollback
# Revert to previous Replit checkpoint
# Or: git revert + redeploy
```

---

*Runtime audit: `audit/infra/replit-runtime-audit.md`*  
*Env matrix: `audit/infra/env-matrix-verified.md`*
