# SZL Holdings — Replit Boot Matrix

**Date:** April 22, 2026

---

## Boot Sequence

```
1. pnpm install (if needed)
2. api-server workflow starts
   ├── esbuild bundles server.mjs (~2.7s)
   ├── HTTP server binds 0.0.0.0:$PORT
   ├── startingHandler returns 503 for all requests
   ├── runMigrations() — 121 files, ~1,334 statements (~3s)
   │   └── 12 non-fatal warnings (missing relations)
   ├── onMigrationsReady → live handler activated
   │   └── Server now returns 200 for /api/health
   ├── Background init (fire-and-forget):
   │   ├── bootstrapChainState (10s timeout)
   │   ├── ensurePlatformFlags
   │   ├── knowledgeStore.loadFromDb
   │   ├── initDurablePersistence
   │   ├── initGuardianEngine
   │   ├── startDurableQueue + scheduler
   │   ├── seed data (if DEMO_MODE=true)
   │   └── embedding worker, push notifications, signal fusion
   └── "Bootstrap sequence complete — server fully ready"
3. Frontend workflows start (Vite dev servers)
   └── Each binds to its own $PORT
```

## Service Dependency Graph

```
PostgreSQL ← api-server ← all frontends
                ↑
           lib/db (pool)
           lib/auth (OIDC)
           lib/ai-engine (AI proxy)
           packages/guardian (policy)
           packages/alloy (agents)
```

## Startup Timing

| Phase | Duration | Blocking? |
|-------|----------|-----------|
| esbuild bundle | ~2.7s | Yes |
| HTTP bind | <100ms | Yes |
| Migrations | ~3s | Yes (503 until done) |
| Live handler flip | Instant | — |
| Background init | 10-30s | No (traffic served) |
| Full ready | ~35s total | — |

## Dev vs Production

| Aspect | Development (Replit) | Production (Deployed) |
|--------|---------------------|----------------------|
| Node.js | v24.13.0 | Same |
| Database | Replit PostgreSQL | Replit PostgreSQL |
| Auth | Replit OIDC | Replit OIDC |
| AI | Proxied (live) | Proxied (live) |
| Storage | Local filesystem | Cloud (if configured) |
| Sessions | In-memory | Redis (if configured) |
| Seeds | Enabled (DEMO_MODE) | Suppressed |
| OTEL | Optional | Recommended |
| Sentry | Not configured | Recommended |

## Health Endpoints

| Endpoint | Purpose | Auth | Pool |
|----------|---------|------|------|
| `GET /api/health` | Basic health | No | `healthPool` (dedicated, max 2) |
| `GET /api/healthz` | Alias | No | `healthPool` |
| `GET /api/health/detailed` | Full diagnostics | Admin (prod) | Main pool |

## Port Assignment

Each artifact reads `$PORT` from environment. Replit assigns unique ports per artifact workflow. No hardcoded ports should exist in config files.

| Artifact | Reads PORT From | Binding |
|----------|----------------|---------|
| api-server | `process.env.PORT` | `0.0.0.0:$PORT` |
| Web artifacts | Vite `server.port` → `$PORT` | `:::$PORT` or `0.0.0.0:$PORT` |
| Mobile | Expo dev server | Expo domain |
