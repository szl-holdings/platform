# SZL Holdings — Target Architecture

> **DEPRECATED** — This document has been superseded by [`ops/infra/target-production-architecture.md`](../infra/target-production-architecture.md).
> This file is retained for historical reference only. Do not update it.

Generated: 2026-04-15

## Canonical Product Topology

### A. Public Web Flagship: `szl-holdings`
- Path: `/szl-holdings/` (root `/` in production)
- The single canonical public-facing web experience
- Contains: marketing, product pages, trust center, docs, founder profile, leadership, demo, fund intelligence, Nexus command, developer portal
- Authenticated surfaces: Forge (admin), Ops dashboards, CORTEX intelligence, Distribution OS

### B. API Platform: `api-server`
- Path: `/api/`
- Express.js + Apollo GraphQL
- Already has: health endpoints, rate limiting, CORS, Zod validation, audit logging, RBAC, structured errors, request IDs
- Serves all web and mobile clients

### C. Mobile Flagship: `cortex-mobile`
- CORTEX — Unified Command for all 8 business domains
- Biometric auth, voice commands, offline sync, push notifications
- Ship first via TestFlight/Play Internal Testing

### D. Secondary Mobile: `szl-holdings-mobile`
- Defer until CORTEX is shipped
- Share mobile-shared lib with cortex-mobile

## App Disposition Matrix

### Production Now (canonical, actively deployed)
| App | Purpose | Notes |
|-----|---------|-------|
| szl-holdings | Public web flagship | Primary entry point |
| api-server | Backend API | Powers all apps |
| aegis | Defense & intel command | Defense & Intelligence platform at /aegis/ |
| terra | Real estate intelligence | Full feature set |
| vessels | Maritime intelligence | Full feature set |
| carlota-jo | Advisory consulting | Client-facing |
| command | Unified ops command | Merged Command+Lyte+Imperium |
| cortex-mobile | Mobile command center | Flagship mobile |

### Production Later (functional but secondary)
| App | Purpose | Notes |
|-----|---------|-------|
| szl-holdings-mobile | Mobile holdings app | After CORTEX ships |

### Internal/Demo Only
| App | Purpose | Notes |
|-----|---------|-------|
| mockup-sandbox | UI prototyping | Dev tool only |

### Archive/Deprecate
| App | Reason |
|-----|--------|
| _(5 surfaces)_ | Archived — see `ops/frontier/disposition-matrix.md` |
| aegis-mobile | Empty stub |
| alloy-mobile | Empty stub |
| carlota-jo-mobile | Empty stub |
| forge | Empty stub |
| inca-lab | Empty stub |
| lyte-mobile | Empty stub |
| nexus | Empty stub |
| partner-portal | Empty stub |
| stephen-mobile | Empty stub |
| terra-mobile | Empty stub |
| vessels-mobile | Empty stub |

## Deployment Strategy

### Replit Deployment
| Workload | Type | Reason |
|----------|------|--------|
| szl-holdings (web) | Autoscale | Public HTTP traffic |
| api-server | Reserved VM | Always-on, WebSocket, background jobs |
| All domain apps | Autoscale | Standard HTTP |
| Mobile apps | N/A | Built via EAS, distributed via stores |

### Environment Separation
| Environment | Purpose | Secrets Namespace |
|-------------|---------|-------------------|
| Development | Replit workspace | Replit Secrets |
| Staging | Replit deployment (staging) | STAGING_* secrets |
| Production | Replit deployment (production) | PROD_* secrets |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind + Framer Motion |
| Backend | Express.js + Apollo GraphQL + Drizzle ORM |
| Database | PostgreSQL |
| Mobile | Expo / React Native |
| Auth | Replit Auth (OIDC/PKCE) + session cookies |
| AI | OpenAI + Anthropic + Gemini via ai-engine |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |
| IaC | Bicep (Azure) — future production path |
| Observability | Pino structured logging + telemetry middleware |
