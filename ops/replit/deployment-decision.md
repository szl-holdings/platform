# Deployment Decision Matrix

Generated: 2026-04-15

## Replit Deployment Types

| Workload | Deployment Type | Reason |
|----------|----------------|--------|
| szl-holdings (web) | **Autoscale** | Public HTTP traffic, stateless, scales with demand |
| firestorm/Aegis (web) | **Autoscale** | Standard web app, stateless rendering |
| terra (web) | **Autoscale** | Standard web app |
| vessels (web) | **Autoscale** | Standard web app |
| carlota-jo (web) | **Autoscale** | Standard web app |
| command (web) | **Autoscale** | Standard web app |
| api-server | **Reserved VM** | Always-on, WebSocket connections, background job processing, GraphQL subscriptions |
| cortex-mobile | **N/A** | Built via EAS, distributed through app stores |
| szl-holdings-mobile | **N/A** | Built via EAS, deferred |

## Production Web Deployment Configuration

For the flagship web app (szl-holdings), the deployment should:
1. Build: `pnpm --filter @workspace/szl-holdings run build`
2. Serve the `dist/` directory as static files
3. Health check: HTTP 200 on `/`
4. Custom domain: `app.szlholdings.com` (or similar)

For the API server:
1. Build: `pnpm --filter @workspace/api-server run build`
2. Run: `NODE_ENV=production PORT=8080 node dist/index.mjs`
3. Health check: HTTP 200 on `/api/health/live`
4. Requires: DATABASE_URL, SESSION_SECRET, all integration keys

## Environment Variables for Deployment

### Workspace (Dev)
All secrets in Replit Secrets panel.

### Staging Deployment
Set in Replit deployment settings:
- `NODE_ENV=staging`
- All production secrets with staging values
- `CORS_ORIGINS` pointing to staging domain

### Production Deployment
Set in Replit deployment settings:
- `NODE_ENV=production`
- All production secrets with production values
- `CORS_ORIGINS` pointing to production domain
- `FIELD_ENCRYPTION_KEY` (production-only, rotated quarterly)

## Multi-App Deployment Note

Currently all apps run in the same Replit workspace using path-based routing through the Replit proxy. For production:

**Option A (Current)**: Deploy the entire workspace as one Reserved VM. All apps accessible via path-based routing.
- Pro: Simple, one deployment
- Con: All apps share resources, single point of failure

**Option B (Recommended for Scale)**: Deploy flagship web + API as separate deployments.
- szl-holdings: Autoscale deployment (static site)
- api-server: Reserved VM deployment (API + WebSocket)
- Domain apps: Embed within szl-holdings or deploy separately as needed
