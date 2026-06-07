# Cost and Complexity Notes

Updated: 2026-04-16

## Summary

This document captures estimated infrastructure costs and operational complexity for each deployment tier, to inform architecture decisions and investor conversations.

---

## Tier 1: Replit Deployment (Current)

### Estimated Monthly Cost

| Service | Tier | Estimated Monthly Cost |
|---------|------|----------------------|
| Replit Core/Teams subscription | Teams | ~$25–40/month |
| Replit Deployments — Reserved VM (API server) | Reserved | ~$30–50/month |
| Replit Deployments — Autoscale (web apps, 8x) | Autoscale | ~$5–20/month per app |
| Replit PostgreSQL | Managed | Included in deployment |
| **Total (current, low-traffic)** | — | **~$100–200/month** |

### Complexity Assessment

| Area | Complexity | Notes |
|------|-----------|-------|
| Infrastructure setup | Very Low | Managed by Replit |
| Database management | Low | Managed PostgreSQL, auto-backup |
| Secret management | Low | Replit Secrets UI |
| TLS / DNS | Very Low | Managed by Replit |
| Scaling | Low | Autoscale is automatic |
| Observability | Medium | Requires adding Log Drain |
| Multi-region | Not available | Single-region only |

**Verdict**: Correct for pre-PMF scale. Eliminates DevOps burden. Ideal through first $1M ARR or first enterprise customer.

---

## Tier 2: Azure (Target Enterprise)

### Estimated Monthly Cost at Moderate Scale (10–50 active tenants)

| Service | SKU | Estimated Monthly Cost |
|---------|-----|----------------------|
| App Service Plan (P2v3, 2 instances) | P2v3 × 2 | ~$300/month |
| PostgreSQL Flexible Server (D4s_v3) | General Purpose | ~$250/month |
| Azure Cache for Redis (C1 Standard) | C1 | ~$55/month |
| Azure Blob Storage (LRS, 500GB) | LRS | ~$10/month |
| Azure Front Door (Standard) | Standard | ~$35/month + traffic |
| Azure Key Vault | Standard | ~$5/month |
| Application Insights | Pay-per-use | ~$30–100/month |
| Azure Service Bus (future) | Standard | ~$10/month |
| DNS Zones | — | ~$1/month |
| **Total (moderate scale)** | — | **~$700–800/month** |

### Scaling Cost Drivers

| Trigger | Action | Cost Impact |
|---------|--------|-------------|
| >50 concurrent users | Scale out App Service to 3–4 instances | +$150/instance/month |
| >100 tenants | Upgrade PostgreSQL to D8s_v3 | +$250/month |
| Real-time features growth | Upgrade Redis to C2 or P1 | +$100–250/month |
| Compliance requirement (geo) | Enable GRS on PostgreSQL + Blob | +$100–200/month |
| >1TB database | Scale PostgreSQL storage | +$20–50/month |

---

## Complexity Assessment (Azure)

| Area | Complexity | Owner | Notes |
|------|-----------|-------|-------|
| Infrastructure as Code (Bicep) | Medium | DevOps / Founder | Templates exist in `/infra/` |
| Database setup | Medium | DevOps | PostgreSQL Flexible Server + connection pooling |
| Secret rotation | Medium | DevOps | Key Vault + Managed Identity |
| TLS / DNS | Low | DevOps | Front Door manages certs |
| Scaling configuration | Medium | DevOps | Autoscale rules defined in Bicep |
| Zero-downtime deploys | Medium | DevOps | Deployment slots + swap |
| Observability wiring | Medium | DevOps | App Insights SDK integration |
| Multi-region failover | High | DevOps | Not in v1 plan |
| Compliance (SOC 2) | High | Legal + DevOps | Future requirement |

**Verdict**: Introduces ~2–4 weeks of DevOps setup work. Justified when first enterprise customer or $50K MRR is in sight. Do not migrate to Azure prematurely.

---

## Migration Path (Replit → Azure)

| Phase | Trigger | Duration | Risk |
|-------|---------|----------|------|
| Continue on Replit | Pre-PMF | Now | Low |
| Provision Azure (staging) | First enterprise LOI | 2 weeks | Low |
| Dual-run: Replit (prod) + Azure (staging) | Test Azure with real workloads | 4 weeks | Low |
| Migrate production to Azure | First enterprise go-live | 1 weekend | Medium |
| Decommission Replit deployment | Post-migration stable | 2 weeks | Low |

---

## Mobile Infrastructure Costs (Additional)

| Item | Cost |
|------|------|
| Apple Developer Program | $99/year |
| Google Play Console | $25 one-time |
| Firebase (Spark plan) | Free (within limits) |
| Firebase (Blaze) | Pay-per-use; push notifications essentially free |
| EAS Build (free tier) | 15 free builds/month |
| EAS Build (Production) | ~$50–100/month |
| Sentry (crash reporting) | Free up to 5K errors/month; $26/month after |

---

## Build vs Buy Decisions

| Function | Decision | Tool |
|----------|---------|------|
| Auth | Build (Replit Auth / Clerk) | Clerk is $0 at dev scale |
| Background jobs | Build (Node.js cron) | Migrate to Azure Container Apps later |
| Search | Defer | PostgreSQL full-text sufficient at current scale |
| Real-time | Build (Socket.io / SSE) | Evaluate Pusher or Ably at scale |
| Analytics | Defer/Buy | PostHog free tier or build on App Insights |
| Email | Buy | Resend or SendGrid ($0 free tier) |
| File storage | Azure Blob | Object Storage skill available now |

---

*Review this document quarterly. Costs are estimates based on Azure Calculator as of April 2026 — verify before commitment.*
