# Target Production Architecture — SZL Holdings

Updated: 2026-04-16

## Overview

This document describes the concrete production infrastructure target for the SZL Holdings platform. The current production environment is Replit deployment. The target architecture below represents the path to a hardened, enterprise-grade production setup. Both tiers are documented.

---

## Current State: Replit Deployment (Production Today)

| Workload | Type | Notes |
|----------|------|-------|
| szl-holdings (web) | Autoscale deployment | Primary public web |
| api-server | Reserved VM deployment | Always-on, WebSocket, background jobs |
| aegis | Autoscale | Defense domain |
| terra | Autoscale | Real estate domain |
| vessels | Autoscale | Maritime domain |
| carlota-jo | Autoscale | Advisory domain |
| command | Autoscale | Unified ops command |
| Database | Replit PostgreSQL | Managed, automatic backups |
| Secrets | Replit Secrets | Per-environment namespacing |
| TLS | Replit-managed | Automatic Let's Encrypt |
| CDN | Replit proxy | Built into deployment |

**Limitations**: No custom CDN configuration, no multi-region failover, no Redis cache tier, no worker queue infrastructure. Sufficient for pre-PMF scale.

---

## Target State: Azure Enterprise (Phase 2 / PMF+)

Infrastructure defined in `/infra/` via Azure Bicep templates.

### Compute Layer

| Service | SKU | Purpose |
|---------|-----|---------|
| Azure App Service Plan | P2v3 (Linux) | API server + web apps |
| App Service — API | Node.js 20 LTS | `api-server` Express + Apollo |
| App Service — Web | Static Web App or Azure CDN | Built React artifacts |
| Azure Container Apps (future) | Consumption tier | Worker queue processors |

**Autoscale Rules**: Scale out at 70% CPU for 5 minutes; scale in at 30% CPU for 10 minutes. Min 2 instances in production for HA.

### Data Layer

| Service | SKU | Purpose |
|---------|-----|---------|
| Azure Database for PostgreSQL Flexible Server | General Purpose D4s_v3 | Primary relational store |
| Point-in-Time Restore | Built-in (35-day window) | Recovery |
| Azure Cache for Redis | C1 Standard | Session store, real-time cache, pub/sub |
| Azure Blob Storage | LRS → GRS in production | Object storage (exports, backups, media) |

**Database**: Single-region primary with read replica for reporting workloads. Connection pooling via PgBouncer or Prisma connection pool (max 50 connections per app service instance).

### Security Layer

| Service | Purpose |
|---------|---------|
| Azure Key Vault | All secrets, API keys, DB URLs |
| Managed Identity | App Services authenticate to Key Vault without static credentials |
| Azure AD B2C (future) | Customer-facing SSO (if multi-tenant expands) |
| Azure DDoS Standard | Network-layer protection |
| Web Application Firewall (Front Door) | OWASP rule set, rate limiting |

### Networking Layer

| Service | Purpose |
|---------|---------|
| Azure Front Door (Standard) | Global CDN, load balancer, WAF, TLS termination |
| Azure Virtual Network | Private subnet for App Service ↔ DB ↔ Redis |
| Private Endpoints | DB and Redis not exposed to public internet |
| Custom Domain | `szlholdings.com`, `api.szlholdings.com` |
| TLS | Azure-managed certificates (auto-renewed) |

### Observability Layer

| Service | Purpose |
|---------|---------|
| Azure Application Insights | APM, distributed tracing, request logs |
| Azure Monitor | Infrastructure metrics, alerts |
| Log Analytics Workspace | Centralized log aggregation sink |
| Pino structured logs → Log Drain | Application logs forwarded to Log Analytics |
| Uptime Alerts | P1 alert if `GET /api/health` returns non-200 for 3 consecutive checks |

### Background Workers

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backup job | Node.js cron (App Service) | Daily DB backup to Azure Blob |
| Push notification sender | Node.js worker | FCM/APNs dispatch |
| Sync engine | Node.js worker | Mobile offline sync reconciliation |
| Webhook dispatcher | Azure Service Bus (future) | Event fan-out |

---

## DNS Architecture

```
szlholdings.com          → Azure Front Door → szl-holdings (web)
api.szlholdings.com      → Azure Front Door → api-server
app.szlholdings.com      → Azure Front Door → cortex PWA (future)
*.szlholdings.com        → Azure Front Door (wildcard cert)
```

---

## Secrets Management Flow

```
Developer → azure keyvault secret set → Key Vault
App Service (Managed Identity) → GET secret → Key Vault
App Service (Key Vault reference in App Settings) → SECRET_VALUE injected as env var
```

No static credentials in source code. No credentials in environment files committed to repo.

---

## Deployment Pipeline

```
GitHub PR → GitHub Actions CI (lint, typecheck, tests)
         → Merge to main → EAS Build (mobile) + Azure deployment (web/API)
         → Staging slot validation → Slot swap to production
```

**Zero-downtime deploys**: Azure App Service deployment slots. Build and validate in staging slot, then swap. Rollback = swap back.

---

## Multi-Tenant Architecture

| Feature | Implementation |
|---------|---------------|
| Tenant isolation | Row-level data isolation via `organization_id` column |
| Per-tenant config | `azure_tenants` table (encrypted Power BI workspace config, SSO) |
| Row-Level Security | PostgreSQL RLS policies per tenant |
| Tenant onboarding | 4-step wizard at `/admin/tenants/new` |
| Custom domains | Per-tenant CNAME configuration (future) |

---

*See also: `/infra/main.bicep`, `/infra/parameters.json`, `docs/deployment.md`*
