# Replit Deployment Matrix

Last updated: 2026-04-16

## Deployment Type Reference

| Type | Characteristics | Cost model |
|------|----------------|------------|
| **Autoscale** | Scales to zero, scales up on demand, stateless only | Per-request |
| **Reserved VM** | Always-on, persistent process, supports WebSockets and background jobs | Fixed hourly |
| **Static** | Pure static files, no server-side compute | Per-request (cheap) |
| **N/A** | Not deployed to Replit (e.g., mobile apps distributed via app store) | — |

---

## Workload Deployment Targets

| Workload | Artifact Dir | Deployment Type | Rationale |
|----------|-------------|----------------|-----------|
| `szl-holdings` (flagship web) | `artifacts/szl-holdings` | **Autoscale** | Stateless React SPA; scales with traffic demand |
| `api-server` | `artifacts/api-server` | **Reserved VM** | Always-on required: WebSocket connections, background job processing, GraphQL subscriptions |
| `command` (Command Portal) | `artifacts/command` | **Autoscale** | Stateless React SPA |
| `aegis` (Aegis / Defense) | `artifacts/aegis` | **Autoscale** | Stateless React SPA |
| `terra` (Real Estate) | `artifacts/terra` | **Autoscale** | Stateless React SPA |
| `vessels` (Maritime) | `artifacts/vessels` | **Autoscale** | Stateless React SPA |
| `carlota-jo` (Advisory) | `artifacts/carlota-jo` | **Autoscale** | Stateless React SPA |
| `szl-holdings-mobile` (CORTEX) | `artifacts/szl-holdings-mobile` | **N/A** | Distributed via Expo EAS / App Store / Google Play |
| `cortex-mobile` | `artifacts/cortex-mobile` | **N/A** | Distributed via Expo EAS |
| `mockup-sandbox` | `artifacts/mockup-sandbox` | **N/A** | Development-only component preview; never deployed |
| 5 archived artifacts | (see `ops/frontier/disposition-matrix.md`) | **ARCHIVED** | All deregistered; ARCHIVED.md or DEPRECATED.md present. Do not deploy. |

---

## Production Deployment: `api-server` (Reserved VM)

```
Build:    pnpm --filter @workspace/api-server run build
Start:    NODE_ENV=production PORT=8080 node dist/index.mjs
Health:   GET /api/health/live  → HTTP 200
Domain:   api.szlholdings.com (or *.replit.app subdomain)
```

Required secrets (set in Replit Deployment settings):

```
DATABASE_URL
SESSION_SECRET
FIELD_ENCRYPTION_KEY
CONNECTOR_ENCRYPTION_KEY
ALLOY_INTERNAL_TOKEN
CORS_ORIGINS=https://app.szlholdings.com,https://*.replit.app
NODE_ENV=production
LOG_LEVEL=info
```

---

## Production Deployment: `szl-holdings` (Autoscale)

```
Build:    pnpm --filter @workspace/szl-holdings run build
Serve:    dist/public/ as static files
Health:   GET /  → HTTP 200
Domain:   app.szlholdings.com (or *.replit.app subdomain)
```

The flagship web app is a static React SPA. No runtime secrets needed in the build output. Any environment values baked at build time must be non-sensitive.

---

## Port Mapping (Workspace / Dev)

| Internal Port | External Port | Service |
|--------------|--------------|---------|
| 8080 | 80 | Primary proxy (flagship + path routing) |
| 9090 | 3000 | Secondary service slot |
| 21130 | 3001 | Tertiary service slot |

All services in dev share the Replit proxy via path-based routing:

| Path | Artifact |
|------|---------|
| `/` | `szl-holdings` |
| `/api/` | `api-server` |
| `/command/` | `command` |
| `/aegis/` | `aegis` |
| `/terra/` | `terra` |
| `/vessels/` | `vessels` |
| `/carlota-jo/` | `carlota-jo` |
| `/__mockup` | `mockup-sandbox` (dev only) |
| Archived routes (5 paths) | ARCHIVED — no active frontends; see `ops/frontier/disposition-matrix.md` |

---

## Deployment Strategy Options

### Option A — Unified Reserved VM (current default)

Deploy the entire workspace as one Reserved VM. All apps accessible via path-based routing through the Replit proxy.

- **Pro**: Single deployment, simple to operate
- **Con**: All apps share resources; one bad deploy affects all paths

### Option B — Split Deployments (recommended for scale)

Deploy flagship web and API as separate Replit deployments:

1. `api-server` → Reserved VM (always-on, WebSocket, background jobs)
2. `szl-holdings` → Autoscale (static SPA, zero idle cost)
3. Domain apps → Embed within flagship or deploy independently as Autoscale

- **Pro**: Cost-efficient, fault isolation, independent scaling
- **Con**: Slightly more operational complexity

**Recommendation**: Use Option B when monthly traffic warrants it. The API server must always be Reserved VM regardless of strategy.

---

## Environment Tiers

| Tier | Where | Purpose |
|------|-------|---------|
| **Dev / Workspace** | Replit Secrets panel | Local development in the workspace |
| **Staging** | GitHub Environment `staging` + Replit Deployment secrets | Pre-production validation |
| **Production** | GitHub Environment `production` + Replit Deployment secrets | Live traffic |

See `/ops/replit/replit-runbook.md` for secret configuration details.
