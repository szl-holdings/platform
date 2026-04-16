# SZL Holdings — Deployment Model

**Date:** April 16, 2026  
**Status:** ⚠️ PARTIALLY SUPERSEDED — See `docs/architecture/canonical-deployment-model.md` for the authoritative deployment doctrine. The Azure tier described in this document has been revised: Azure is used for enterprise feature integrations (SSO, Power BI) only, not as a production deployment host. Replit is the sole primary deployment target.  
**Audience:** Engineering, DevOps, investors conducting technical due diligence

---

## Summary

SZL Holdings deployment model (updated April 16, 2026):
1. **Replit** — primary live environment for development, demos, investor evaluation, **and production deployment** (autoscale)
2. **GitHub Actions** — CI validation on every PR/merge; deploy workflows trigger Replit deployments
3. **Azure** — ~~enterprise production target~~ enterprise feature integrations only (Azure AD SSO, SCIM, Power BI embed); not the deployment host

> **Deployment doctrine decision (April 16, 2026):** Replit is the sole primary deployment target. Azure infrastructure (App Service, Bicep templates, Key Vault as secrets store) is not part of the production deployment. See `docs/architecture/canonical-deployment-model.md`.

---

## Tier 1: Replit (Primary)

### Role
The Replit workspace is the **primary deployment surface** for all active demos, investor evaluations, and pre-commercial staging. It serves as both the development environment and the public-facing presentation environment.

### Architecture

| Component | Detail |
|---|---|
| **Routing model** | Path-based via Replit application router; each artifact gets a unique path prefix |
| **Deploy target** | `autoscale` (Replit managed) |
| **HTTPS** | Automatic — managed by Replit |
| **Database** | Replit-managed PostgreSQL 16 (separate dev and production instances) |
| **Secrets** | Replit Secrets (UI); never in source control |
| **Session management** | In-memory (dev); production uses same in-memory (Redis upgrade pending first contract) |
| **Object storage** | Replit Object Storage when `STORAGE_BUCKET` configured; local filesystem fallback |

### Artifact → URL Routing

| Artifact | Public URL Path | Internal Port |
|---|---|---|
| `szl-holdings` (corporate + Lyte) | `/` | 8080 |
| `api-server` | `/api/` | 9090 |
| `aegis` | `/aegis/` | Assigned |
| `carlota-jo` | `/carlota-jo/` | Assigned |
| `command` | `/command/` | Assigned |
| `mockup-sandbox` | `/__mockup` | 21130 |
| `szl-holdings-mobile` | `/szl-holdings-mobile/` | Expo |
| `terra` | `/terra/` | Assigned |
| `vessels` | `/vessels/` | Assigned |

### What is Public vs. Internal vs. Prototype

| Classification | Artifacts |
|---|---|
| **Public** (investor/customer facing) | `szl-holdings`, `carlota-jo`, `aegis`, `vessels`, `terra` |
| **Internal** (platform operations) | `api-server`, `command` |
| **Mobile** | `szl-holdings-mobile` |
| **Tooling** (dev-only) | `mockup-sandbox` |
| **Archived/Deprecated** (marker files only) | `firestorm` (→ aegis), `prism-counsel` (→ aegis), `stephen-site` (→ szl-holdings) |

### Health Check

The API server exposes a health endpoint at both `GET /api/healthz` (canonical) and `GET /api/health` (alias). The full schema is implemented in `artifacts/api-server/src/routes/health.ts`. Actual response shape (derived from source, April 2026):

```json
{
  "status": "ok | degraded",
  "timestamp": "<ISO 8601>",
  "version": "<npm_package_version>",
  "uptime": "<seconds>",
  "services": {
    "server":   { "status": "ok" },
    "database": { "status": "ok | degraded", "latencyMs": "<number>", "tables": "<number>" },
    "storage":  { "status": "ok", "mode": "cloud | local" },
    "auth":     { "status": "ok | degraded", "mode": "configured | missing_secret" },
    "ai":       { "status": "ok", "mode": "live | mock" },
    "backup":   {
      "status": "<string>", "lastBackupAt": "<ISO 8601 | null>",
      "lastBackupSizeBytes": "<number | null>", "ageHours": "<number | null>",
      "warning": "<string | null>", "totalBackups": "<number>", "details": "<string>"
    }
  },
  "platform": {
    "apps": [ { "slug": "<string>", "name": "<string>", "type": "<string>" } ],
    "totalApps": 11
  }
}
```

Overall `status` is `"ok"` only when both `database.status === "ok"` and `auth.status === "ok"`. There is no `job_queue` service in this endpoint.

---

## Tier 2: GitHub Actions (CI/CD Pipeline)

### Role
Validates code quality on every commit and PR. Triggers staging and production deployments when configured.

### CI Gate (Active)

All four jobs must pass before a merge proceeds:

1. `lint` — ESLint
2. `typecheck` — TypeScript
3. `test` — Unit/integration tests
4. `build` — All packages build

CI uses Node.js 22 and pnpm 10 (updated in Phase 2). Replit dev environment runs Node.js 24 (platform constraint).

### Staging Deploy (Defined, Inactive)

- **Trigger:** Push to `master`/`main`
- **Mechanism:** Calls Replit deployment API via `REPLIT_STAGING_DEPLOY_TOKEN` and `REPLIT_STAGING_APP_ID` secrets
- **Status:** Workflow defined in `.github/workflows/deploy-staging.yml`; secrets not yet configured → deployment skipped

### Production Deploy (Defined, Inactive)

- **Trigger:** Published GitHub Release OR manual dispatch with `confirm="deploy"`
- **Mechanism:** Calls Replit deployment API via `REPLIT_DEPLOY_TOKEN` and `REPLIT_APP_ID` secrets
- **Safeguard:** Manual dispatch requires explicit confirmation string (`confirm="deploy"`)
- **Status:** Workflow defined in `.github/workflows/deploy-production.yml`; `REPLIT_DEPLOY_TOKEN` and `REPLIT_APP_ID` secrets not yet configured → deployment skipped

---

## Tier 3: Azure (Secondary — Enterprise Production)

### Role
The enterprise-grade production environment for the first commercial customer. **Not yet deployed.** All infrastructure is defined and ready to activate.

### Activation Trigger
Azure production is activated when the first commercial enterprise contract is signed. It is not needed for investor demonstrations or pre-commercial pilots (those use Replit).

### Infrastructure Defined (IaC — `infra/`)

| Module | Azure Resource | Purpose |
|---|---|---|
| `containerapp.bicep` | Azure Container Apps | App server hosting |
| `postgres.bicep` | PostgreSQL Flexible Server (General Purpose) | Primary database |
| `redis.bicep` | Azure Cache for Redis | Session store at scale |
| `keyvault.bicep` | Azure Key Vault | Centralized secret management |
| `frontdoor.bicep` | Azure Front Door | CDN + edge caching + WAF |
| `blobstorage.bicep` + `storage.bicep` | Azure Blob Storage | File and asset storage |
| `servicebus.bicep` | Azure Service Bus | Async message queue |
| `vnet.bicep` | Azure Virtual Network | Network isolation |
| `alerting.bicep` | Azure Monitor | Operational alerting |
| `staticwebapp.bicep` | Azure Static Web Apps | Frontend static hosting (alt) |
| `docintell.bicep` | Azure AI Document Intelligence | Document processing |

### Multi-Tenant Enterprise Features

- Per-tenant row-level security
- Azure AD / Entra ID SSO (code exists; requires tenant admin consent)
- SCIM provisioning endpoint (`/api/scim`) ready
- Tenant provisioning wizard (4-step onboarding)
- Per-tenant configuration in `azure_tenants` database table

### Activation Checklist (When Ready)

1. Provision Azure subscription and resource group
2. Deploy Bicep stack: `az deployment group create --template-file infra/main.bicep`
3. Configure secrets in Azure Key Vault
4. Configure `AZURE_REDIS_CONNECTION_STRING` to replace in-memory session store
5. Set `CORS_ORIGINS` to custom domain list
6. Configure DNS for custom domains per artifact
7. Run `pnpm migrate` against Azure PostgreSQL instance
8. Configure Stripe live keys (`sk_live_...`)
9. Configure `RESEND_API_KEY` and email domain SPF/DKIM
10. Deploy frontend artifacts to Azure Static Web Apps or Container Apps

---

## Rollback Strategy

### Code Rollback
- **Replit:** Checkpoint created automatically before each task merge → restore via Replit UI → Checkpoints
- **GitHub:** Full Git history at `stephenlutar2-hash/szl-holdings-platform` → `git revert` or reset to previous commit

### Database Rollback
- Drizzle ORM uses forward-only migrations (`db:push`)
- Replit provides automatic database snapshots
- Seed data is idempotent — safe to re-run: `pnpm seed`
- No destructive migrations in current schema

### Emergency Procedures
1. API server crash → Restart workflow from Replit UI
2. Database corruption → Restore from Replit DB snapshot
3. Deployment failure → Roll back to previous Replit checkpoint
4. Frontend broken → Each artifact is independently deployable and restartable

---

## Port Allocation

| External Port | Internal Port | Service |
|---|---|---|
| 80 | 8080 | Primary web routing (szl-holdings + path-based router) |
| 3000 | 9090 | API server |
| 3001 | 21130 | Mockup sandbox (internal) |

---

*This document is the authoritative deployment model. Update when deployment surfaces or topology changes.*
