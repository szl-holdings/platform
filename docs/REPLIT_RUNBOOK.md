# SZL Holdings — Replit Runbook

**Date:** April 22, 2026
**Environment:** Replit workspace (NixOS, Node 24.13.0, PostgreSQL 16)

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start API server (required first)
# Uses Replit workflow: "artifacts/api-server: api"
pnpm --filter @workspace/api-server run dev:fast

# Start any web artifact (each uses its own workflow)
# Example: Terra
cd artifacts/terra && npx vite --host ::
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Replit Workspace                       │
│                                         │
│  artifacts/api-server  ← Single backend │
│    ├── 257 route files                  │
│    ├── 2,781 handlers                   │
│    └── PostgreSQL (732 tables)          │
│                                         │
│  artifacts/<name>      ← Vite frontends │
│    ├── szl-holdings (/)                 │
│    ├── aegis (/aegis/)                  │
│    ├── terra (/terra/)                  │
│    ├── vessels (/vessels/)              │
│    ├── counsel (/counsel/)              │
│    ├── carlota-jo (/carlota-jo/)        │
│    ├── pulse (/pulse/)                  │
│    ├── sentra (/sentra/)                │
│    ├── command (/command/)              │
│    └── lyte-command-center (/lyte/)     │
│                                         │
│  lib/         ← 41 shared libraries    │
│  packages/    ← 82 platform packages   │
└─────────────────────────────────────────┘
```

## Workflows

| Workflow | Command | Port | Path |
|----------|---------|------|------|
| api-server | `pnpm --filter @workspace/api-server run dev:fast` | `$PORT` | `/api/` |
| szl-holdings | `vite --host ::` | `$PORT` | `/` |
| aegis | `vite --host ::` | `$PORT` | `/aegis/` |
| terra | `vite --host ::` | `$PORT` | `/terra/` |
| vessels | `vite --host ::` | `$PORT` | `/vessels/` |
| counsel | `vite --host ::` | `$PORT` | `/counsel/` |
| carlota-jo | `vite --host ::` | `$PORT` | `/carlota-jo/` |
| pulse | `vite --host ::` | `$PORT` | `/pulse/` |
| sentra | `vite --host ::` | `$PORT` | `/sentra/` |
| command | `vite --host 0.0.0.0` | `$PORT` | `/command/` |
| lyte-command-center | `vite --host ::` | `$PORT` | `/lyte/` |
| szl-holdings-mobile | `pnpm run dev` | Expo | `/mobile/` |
| szl-demo-video | `vite --host ::` | `$PORT` | `/szl-demo-video/` |
| mockup-sandbox | `bash start.sh` | `$PORT` | `/nexus/` |

## Environment Variables

### Required (Set Automatically)

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Replit PostgreSQL | Auto-provisioned |
| `PORT` | Replit | Per-artifact port assignment |
| `REPL_ID` | Replit | Workspace identifier |
| `REPL_SLUG` | Replit | Workspace slug |
| `REPLIT_DEV_DOMAIN` | Replit | Dev preview domain |

### Required (Manual Configuration)

| Variable | Purpose | Default Behavior Without |
|----------|---------|------------------------|
| `SESSION_SECRET` | Express session signing | Auth degraded |
| `ALLOY_INTERNAL_TOKEN` | Service-to-service auth | Internal routes 401 |

### Optional (Feature Enablement)

| Variable | Feature | Fallback |
|----------|---------|----------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI AI engine | AI mock mode |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic AI engine | AI mock mode |
| `MAPBOX_TOKEN` | Terra map rendering | Maps blank |
| `STRIPE_SECRET_KEY` | Payment processing | Stripe disabled |
| `SENDGRID_API_KEY` / `RESEND_API_KEY` | Email delivery | Email disabled |
| `SENTRY_DSN` | Error tracking | No error reporting |
| `REDIS_URL` | Session store / cache | In-memory sessions |
| `S3_BUCKET` / `OBJECT_STORE_BUCKET` | Cloud storage | Local filesystem |
| `VITE_OTEL_ENDPOINT` | OpenTelemetry export | No telemetry export |

## Common Operations

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Run Platform Metrics
```bash
pnpm metrics:generate
pnpm metrics:validate
```

### Run Smoke Tests
```bash
pnpm --filter @workspace/api-server smoke:terra-cognitive
pnpm --filter @workspace/api-server smoke:terra-diligence-lifecycle
```

### Database Operations
```bash
# Direct query
psql $DATABASE_URL -c "SELECT count(*) FROM pg_tables WHERE schemaname='public'"

# Run migrations (happens automatically on api-server start)
# Migrations are in artifacts/api-server/src/config/migrations/
```

## Troubleshooting

### API Server Returns 503

**Cause:** Bootstrap sequence blocked — usually a hung DB query during startup.
**Fix:** Restart the api-server workflow. The bootstrap now uses fire-and-forget with timeouts for non-critical hydration steps.

### Port Collision

**Cause:** Multiple artifacts trying to bind the same port.
**Fix:** Each artifact reads `$PORT` from environment. Ensure no hardcoded ports in Vite config. Check `vite.config.ts` for `server: { port: ... }`.

### Migration Warnings

**Cause:** Migration ordering — some statements reference tables that haven't been created yet in the ordering.
**Status:** Non-fatal; tracked as Task #2886. Server continues normally.

### Pool Checkout Warnings

**Cause:** DB connections held >30s.
**Fix:** Bootstrap was redesigned to avoid blocking. If warnings persist during normal operation, check for long-running transactions in route handlers.
