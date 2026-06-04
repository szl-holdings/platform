# SZL Holdings — Replit Runtime Audit

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Replit runtime configuration, build/start commands, env loading, artifact routing, workflows

---

## Runtime Configuration

### Workspace Structure
- **Workspace type:** pnpm monorepo (pnpm@10.26.1)
- **Node requirement:** ≥24.0.0
- **Build system:** Turbo (turbo@^2.9.6) for parallel builds
- **Dev server:** Per-artifact Vite (web), Expo (mobile), custom server (api, video)
- **Package isolation:** All cross-platform optional native packages excluded via overrides

### Artifact Routing
Path-based routing — each artifact has a unique `previewPath`:

| Artifact | Preview Path | Workflow |
|---|---|---|
| `szl-holdings` (root dashboard) | `/` | `artifacts/szl-holdings: web` |
| `api-server` | `/api/` | `artifacts/api-server: api` |
| `aegis` | `/aegis/` | `artifacts/aegis: web` |
| `vessels` | `/vessels/` | `artifacts/vessels: web` |
| `terra` | `/terra/` | `artifacts/terra: web` |
| `sentra` | `/sentra/` | `artifacts/sentra: web` |
| `counsel` | `/counsel/` | `artifacts/counsel: web` |
| `pulse` | `/pulse/` | `artifacts/pulse: web` |
| `carlota-jo` | `/carlota-jo/` | `artifacts/carlota-jo: web` |
| `lyte-command-center` | `/lyte/` | `artifacts/lyte-command-center: web` |
| `command` | `/command/` | `artifacts/command: web` |
| `szl-holdings-mobile` | `/szl-holdings-mobile/` | `artifacts/szl-holdings-mobile: expo` |
| `szl-demo-video` | `/szl-demo-video/` | `artifacts/szl-demo-video: web` |
| `mockup-sandbox` | `/nexus/` | `artifacts/mockup-sandbox: web` |

### Port Binding
All Vite-based web artifacts bind to the `PORT` environment variable (not hardcoded 3000). The API server also reads `PORT`. Mobile (Expo) uses its own dev server infrastructure.

---

## Boot Path (Development)

1. Start workflow for desired artifact (e.g., `artifacts/api-server: api`)
2. API server: `tsx watch src/index.ts` (hot-reload via tsx)
3. Frontend artifacts: `vite --port $PORT` (with `allowedHosts: true` for proxy compatibility)
4. Env vars loaded from Replit secrets
5. Database connection attempted; startup validation runs via `@szl-holdings/env`
6. If DATABASE_URL missing: graceful warning, server starts in degraded mode
7. OTel initialization runs async (non-blocking if OTLP endpoint not configured)

---

## Boot Path (Production)

1. `pnpm build` — runs Turbo build across all active artifacts
2. API server: compiled output served via `node dist/index.js`
3. Frontend artifacts: static build output served from `dist/`
4. Env vars from Replit production secrets
5. DATABASE_URL required; session secrets required; missing secrets cause boot failure
6. Sentry initialized with `SENTRY_DSN`
7. OTel initialized with `OTEL_EXPORTER_OTLP_ENDPOINT`
8. Health endpoints immediately available at `/api/health`

---

## Environment Loading

- **Mechanism:** `@szl-holdings/env` package (Zod-validated env schema)
- **Required vars:** `DATABASE_URL`, `SESSION_SECRET` (minimum for production)
- **Optional vars:** All other vars degrade gracefully with feature disabling
- **Replit secrets:** Managed via Replit Secrets panel; not committed to repo
- **Graceful degradation:** Missing non-critical vars produce startup warnings via `startup-validation.ts`

---

## Health Endpoints

| Endpoint | Purpose | Auth |
|---|---|---|
| `GET /api/health` | Primary health check | Public |
| `GET /api/health/db` | Database connectivity | Public |
| `GET /api/health/ready` | Readiness probe | Public |
| `GET /api/health/live` | Liveness probe | Public |

All health endpoints are in the global auth enforcer's public allowlist.

---

## Object Storage

- Replit-managed object storage (via `@replit/connectors-sdk`)
- Bootstrap runs on API server startup
- Missing configuration: graceful warning; file operations degrade to error responses

---

## Background Jobs

Background jobs are managed via the `job_queue` DB table:
- Job persistence: PostgreSQL-backed; survives restarts
- Retry logic: Per-job retry configuration
- Dead-letter: Not yet formally implemented (see indexing-and-query-risk.md)

---

## Known Replit-Specific Issues

| Issue | Impact | Status |
|---|---|---|
| All workflows currently not started | Preview pane shows blank | Requires workflow restart |
| No CD pipeline to Replit | Manual deployment required | By design; CI/CD is external |
| Dev domain changes on preview URL rotation | CORS config may need update | Low risk; CORS_ORIGINS handles this |

---

## Recommendations

1. **Restart all workflows** after code changes to ensure preview reflects current state.
2. **Verify PORT binding** in all Vite configs — ensure no hard-coded ports remain.
3. **Document startup sequence** in a `RUNBOOK.md` for incoming engineers.
4. **Consider adding `@szl-holdings/env` call to each artifact** to fail fast on missing config.

---

*Deployment paths: `audit/infra/deployment-paths.md`*  
*Env matrix: `audit/infra/env-matrix-verified.md`*
