# SZL Holdings — Deployment Model

**Date:** April 2026

---

## Deployment Architecture

SZL Holdings operates a multi-environment deployment model designed for progressive hardening from development to enterprise production.

### Environment Summary

| Environment | Platform | Purpose | Status |
|-------------|----------|---------|--------|
| Development | Replit Workspace | Active development, feature work | Active |
| Staging / Demo | Replit Published | Pre-production validation, investor/partner demos | Active |
| Enterprise Production | Azure | Customer-facing, multi-tenant, SLA-backed | Designed — pending first commercial contract |

---

## Current Deployment (Replit)

The live Replit workspace serves as both development environment and staging/demo environment. Publishing via Replit provides:

- Automatic HTTPS/TLS
- Managed PostgreSQL with daily backups
- Environment secret management (never in source code)
- Health check monitoring
- Zero-downtime deploy rollouts

**API health endpoint:** `GET /api/health` — returns service status, uptime, version, and database connectivity state.

---

## Azure Production Architecture

Full enterprise deployment is defined in `/infra/` using Azure Bicep templates. Ready to deploy when the first commercial contract is activated.

### Infrastructure Components

| Component | Resource | Purpose |
|-----------|----------|---------|
| Compute | Azure App Service (Linux, Node.js 22 LTS) | API server and static serving |
| Database | PostgreSQL Flexible Server (General Purpose) | Primary data store with automated backups |
| Secrets | Azure Key Vault | Centralized credential management |
| Cache | Azure Cache for Redis | Session store, real-time cache |
| CDN | Azure Front Door | Static asset delivery, edge caching |
| APM | Application Insights | Distributed tracing, log analytics, performance |

### Multi-Tenant Configuration

Enterprise deployments support per-tenant isolation:
- Tenant-scoped configuration in `azure_tenants` table
- Per-tenant embed token issuance with Row-Level Security
- Azure AD integration for SSO
- Tenant provisioning wizard (4-step onboarding flow)

---

## CI/CD Pipeline

### Current Pipeline

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` — Build validation on every commit
- `build.yml` — Full production build verification
- `deploy.yml` — Deployment automation

### Post-Merge Automation

The `scripts/post-merge.sh` script runs automatically after task branch merges:
1. `pnpm install` — Dependency sync
2. `pnpm --filter db push` — Schema migration
3. Build integrity verification

---

## Rollback Strategy

### Code Rollback
- Replit checkpoints created automatically before each task merge
- Full Git history preserved: `git log --oneline`
- GitHub mirror at `stephenlutar2-hash/szl-holdings-platform` (master branch)
- Rollback via: Replit UI → Checkpoints → select previous checkpoint

### Database Rollback
- Drizzle ORM manages schema via `db:push` (forward-only migrations)
- Database snapshots available through Replit platform
- Seed data is idempotent (`onConflictDoNothing()` — safe to re-run)
- No destructive migrations in current schema

### Emergency Procedures
1. API server crash → Restart workflow from Replit UI
2. Database corruption → Restore from Replit DB snapshot
3. Deployment failure → Rollback to previous Replit checkpoint
4. Frontend broken → Each artifact is independently deployable

---

## Environment Variables

All secrets and environment-specific configuration are managed via environment variable injection. No secrets are committed to source control.

See `.env.example` for the full variable reference with documentation for each variable.

**Required for deployment:**
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session signing secret
- `ISSUER_URL` — OIDC provider URL
- `PORT` — Auto-assigned per artifact by platform

**Optional (graceful fallback if absent):**
- `STRIPE_SECRET_KEY` — Activates payment flows
- `RESEND_API_KEY` — Activates transactional email
- `OPENAI_API_KEY` — Direct OpenAI access (proxy available by default)
- `MAPBOX_ACCESS_TOKEN` — Activates map views (Terra, Vessels)
