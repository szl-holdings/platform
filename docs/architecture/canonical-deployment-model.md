# Canonical Deployment Model — SZL Holdings Platform

**Status:** AUTHORITATIVE  
**Effective date:** April 16, 2026  
**Supersedes:** `DEPLOYMENT_READINESS.md` (deprecated), Azure-deployment narratives in `REPLIT_OPERATIONS.md` release section, `infra/` Bicep references

---

## Decision: Replit is the Primary Deployment Target

**Replit is the sole primary deployment target for all SZL Holdings production services.**

This decision is final and removes all ambiguity created by earlier drafts that referenced Azure App Service, Azure Bicep templates, and Azure Key Vault as deployment infrastructure.

### Rationale

1. The `.replit` file already configures Replit autoscale deployment (`deploymentTarget = "autoscale"`).
2. `docs/production-readiness.md` is written entirely against Replit infrastructure (Replit PostgreSQL, Replit Secrets, Replit autoscale).
3. Replit handles SSL/TLS, custom domains, port routing, and zero-downtime deploys natively.
4. No Azure infrastructure has been provisioned or validated in production.
5. Azure services listed in historical docs (Key Vault, App Service, Application Insights, Bicep) are *feature integrations* (Azure AD SSO, SCIM, Power BI embed) not hosting — those remain valid as optional enterprise add-ons.

---

## What "Production" Means

| Tier | Environment | Platform | Secrets | Database |
|------|-------------|----------|---------|----------|
| **Development** | Replit workspace (this environment) | Replit | Replit Secrets | Replit PostgreSQL (dev instance) |
| **Production** | Replit autoscale deployment | Replit | Replit Secrets (production scope) | Replit PostgreSQL (separate production instance) |
| **Staging** | Replit deployment (optional) | Replit | Replit Secrets (staging scope) | Replit PostgreSQL (staging instance) |

There is no Azure-hosted production environment. All references to Azure deployment infrastructure in docs are historical artifacts and should be treated as superseded by this document.

---

## Deployment Mechanics

### How Replit Autoscale Works

1. Production deployment is triggered from the Replit UI ("Deploy" button) or via GitHub Actions (`deploy-production.yml`) by publishing a GitHub Release.
2. Each artifact is registered via its own `.replit-artifact/artifact.toml` file (e.g., `artifacts/szl-holdings/.replit-artifact/artifact.toml`). The top-level `.replit` `[[artifacts]]` block explicitly references only `api-server` and `mockup-sandbox`; all other artifacts are registered via their per-directory config.
3. The deployment router (`router = "application"`) handles path-based routing across all artifacts.
4. Port 80 is the external entry point; internal services bind to the `$PORT` environment variable.
5. Post-build step: `pnpm store prune` (reduces image size).

### Registered Artifacts in Production

| Artifact | Preview Path | Service |
|----------|-------------|---------|
| `szl-holdings` | `/` | Corporate site, investor hub, trust center |
| `api-server` | `/api/` | REST + GraphQL + WebSocket backend |
| `command` | `/command/` | Unified ops command center |
| `aegis` | `/aegis/` | Defense & security intelligence |
| `vessels` | `/vessels/` | Maritime fleet command |
| `terra` | `/terra/` | Real estate intelligence |
| `carlota-jo` | `/carlota-jo/` | Premium advisory |
| `szl-holdings-mobile` | Expo tunnel | CORTEX mobile command |

---

## Azure Services: Scope Clarification

Azure is used for **enterprise feature integrations only**, not hosting:

| Azure Service | Purpose | Status |
|---------------|---------|--------|
| Azure AD / Entra ID | Multi-tenant SSO, SCIM provisioning | Optional — requires per-tenant admin consent |
| Azure Power BI | Embedded analytics per tenant | Optional — requires per-tenant Power BI workspace |
| Azure Key Vault | NOT used — superseded by Replit Secrets | Removed from deployment scope |
| Azure App Service | NOT used — superseded by Replit autoscale | Removed from deployment scope |
| Azure Bicep / ARM | NOT used — no Azure infrastructure provisioned | Removed from deployment scope |
| Azure Application Insights | NOT used — planned Sentry instead | Removed from deployment scope |

---

## Secrets Management in Production

All production secrets are managed via **Replit Secrets** (the platform's native secret store). There is no Azure Key Vault in the deployment path.

See `docs/security/secrets-remediation.md` and `docs/SECRETS_POLICY.md` for the full secrets policy.

Critical production secrets (must be set before deployment):

| Secret | Purpose | Where Set |
|--------|---------|-----------|
| `DATABASE_URL` | Production PostgreSQL connection | Replit Secrets (production scope) |
| `SESSION_SECRET` | Cookie signing | Replit Secrets (production scope) |
| `ALLOY_INTERNAL_TOKEN` | Internal API auth | Replit Secrets (production scope) |
| `CORS_ORIGINS` | Production CORS allowlist | `.replit` `[userenv.production]` |
| `PUBLIC_APP_URL` | Canonical URL | `.replit` `[userenv.production]` |

---

## Stale References Resolved

The following stale Azure deployment references have been addressed:

| File | Stale Reference | Status |
|------|----------------|--------|
| `REPLIT_OPERATIONS.md` (Release Process section) | "Deploy via Azure Bicep templates in `/infra/`" | ✅ Fixed — now references Replit deployment |
| `docs/production-readiness.md` (section 2) | "Azure App Service" listed under external service dependencies | ✅ Fixed — note added clarifying Azure is not the hosting target |
| `DEPLOYMENT_READINESS.md` | Azure Key Vault, Azure App Service, Azure deployment slots | Already marked DEPRECATED at top of file — explicit supersession notice in place |
| `docs/DEPLOYMENT_MODEL.md` | Historical Replit vs Azure narrative | Superseded notice added pointing to this document |

---

## Custom Domains

Custom domain configuration is handled entirely within Replit:
- Primary: `szlholdings.com` → Replit deployment (DNS A/CNAME to Replit)
- SSL/TLS: Automatic via Replit
- Per-artifact subdomains: Optional, configured in Replit deployment settings
- Email: SPF/DKIM records in DNS registrar for `@szlholdings.com` (independent of hosting)

---

_This document is the single source of truth for deployment model decisions. Any conflicting statement in another doc is superseded by this document._
