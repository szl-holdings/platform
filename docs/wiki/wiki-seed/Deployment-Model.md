# Deployment Model

The SZL Holdings platform runs on a two-environment model: Replit as the active development workspace and Azure as the production infrastructure target.

---

## Environment Summary

| Environment | Purpose | Status |
|-------------|---------|--------|
| **Replit Workspace** | Active development, internal demo | Live |
| **Azure Production** | Customer-facing production deployment | Production-ready architecture |

---

## Development Environment (Replit)

The Replit workspace is the source of truth for all platform development. It runs the complete monorepo with all 16 artifacts available for preview.

- **API server:** Centralized Express 5 server serving all platform backends
- **Web apps:** 7 React + Vite applications with Vite dev server per artifact
- **Mobile:** 7 Expo/React Native apps accessible via Expo dev client
- **Database:** PostgreSQL (Neon serverless) for development

All Replit-hosted previews use path-based routing under the workspace domain.

---

## Production Infrastructure (Azure)

Production deployment targets Microsoft Azure with the following infrastructure stack:

| Component | Service | Notes |
|-----------|---------|-------|
| API server | Azure App Service | Auto-scaling, custom domain |
| Web apps | Azure App Service (per artifact) | Or CDN-served static builds |
| Database | Azure Database for PostgreSQL Flexible Server | Managed, encrypted at rest |
| Session store | Azure Cache for Redis | Session persistence, rate limiting |
| Secrets | Azure Key Vault | All credentials, connection strings |
| CDN | Azure CDN | Static assets, mobile app builds |
| Container registry | Azure Container Registry | Docker images for deployment |

**IaC:** All infrastructure is defined as Azure Bicep templates in `infra/`. Deployable via `az deployment group create`.

---

## Deployment Architecture

```
Client (Browser / Mobile App)
        │
        ▼
Azure CDN (static assets, edge caching)
        │
        ▼
Azure App Service (web apps + API server)
        │                    │
        ▼                    ▼
PostgreSQL Flexible      Azure Cache for Redis
  Server                   (sessions)
        │
        ▼
Azure Key Vault (secrets injection at runtime)
```

---

## Operational Requirements

| Requirement | Detail |
|------------|--------|
| Node.js | 20+ LTS |
| PostgreSQL | 16+ |
| Redis | 7+ |
| Environment variables | Injected from Azure Key Vault; never hardcoded |
| TLS | Required for all connections in production |
| Domain | Custom domain required for Azure App Service |

---

## Database Migration

Migrations are managed by Drizzle Kit. On each deployment:
1. `drizzle-kit migrate` runs against the target database
2. Migrations are applied sequentially and tracked in the `__drizzle_migrations` table
3. Rollback is manual — review migration files before deployment

---

## Multi-Tenant Architecture

The platform supports multi-tenant deployment for enterprise customers. Organization isolation is enforced at the database query level — every query includes an `org_id` scoping condition. Tenant data is never commingled.

---

## Enterprise Deployment Inquiries

For enterprise deployment, on-premises hosting, or private cloud evaluation:

**Contact:** [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)

---

## Further Reference

- [Trust Center](../../docs/trust/trust-center.md)
- [[Security-Posture]]
- [[Architecture]]
- In-repo IaC: `infra/` (Bicep templates)
