# SZL Holdings Platform — Inventory Report

**Generated:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** All registered artifacts, packages, data layer, API server, design system, security posture

---

## Platform Identity

| Fact | Value |
|------|-------|
| Name | SZL Holdings Platform |
| Codename | AEEP (Alloy Execution and Evidence Platform) |
| Version | 4.0.0 |
| Founded | 2024 |
| Package manager | pnpm@10.26.1 |
| Node requirement | ≥24.0.0 |
| Last comprehensive audit | 2026-04-21 |

---

## Registered Artifacts (14 total)

### Web Applications (11)

| Artifact | Title | Status | Preview Path | Auth | Notes |
|---|---|---|---|---|---|
| `szl-holdings` | SZL Holdings Dashboard | **Beta** | `/` | Yes | Primary investor/corporate surface |
| `aegis` | Investor Pitch Deck | **Beta** | `/aegis/` | Yes | Security intelligence + pitch |
| `vessels` | Vessels Maritime Intelligence | **Partial** | `/vessels/` | Yes | 3 modules unconnected; AIS simulated |
| `terra` | Terra Real Estate Intelligence | **Beta** | `/terra/` | Yes | NYC live; Mapbox missing |
| `sentra` | Sentra Cyber Resilience Command | **Beta** | `/sentra/` | Yes | Threat data seeded |
| `counsel` | Counsel Legal Matter Command | **Beta** | `/counsel/` | Yes | Matter data seeded |
| `pulse` | Pulse AI Executive Briefing | **Beta** | `/pulse/` | Yes | Live signal synthesis |
| `carlota-jo` | Carlota Jo Consulting | **Beta** | `/carlota-jo/` | Yes | UHNW portal; billing active |
| `lyte-command-center` | Lyte Decision Intelligence | **Beta** | `/lyte/` | Yes | PRISM signals active |
| `command` | Unified Command | **Beta** | `/command/` | Yes | 8-domain SSE feeds |
| `api-server` | API Server | **Active** | `/api/` | Yes | 268 routes; backbone of all artifacts |

### Mobile Applications (1)

| Artifact | Title | Status | Preview Path | Auth | Notes |
|---|---|---|---|---|---|
| `szl-holdings-mobile` | SZL Holdings Mobile Command | **Partial** | `/szl-holdings-mobile/` | Yes | Terra modules unconnected; safe-area issues |

### Video Applications (1)

| Artifact | Title | Status | Preview Path | Auth | Notes |
|---|---|---|---|---|---|
| `szl-demo-video` | Governed Autonomy Demo | **Active** | `/szl-demo-video/` | No | Static animated demo |

### Design Artifacts (1)

| Artifact | Title | Status | Preview Path | Auth | Notes |
|---|---|---|---|---|---|
| `mockup-sandbox` | NEXUS Unified Agentic AI Layer | **Concept** | `/nexus/` | No | Design mockup; no active development |

---

## Package Ecosystem

| Type | Count |
|---|---|
| Domain packages (`packages/`) | 77 |
| Shared library packages (`lib/`) | 41 |
| **Total** | **118** |

Notable shared libraries:
- `packages/design-system` — canonical token layer + shell components
- `packages/db-schema` — domain-namespaced Drizzle schema re-exports
- `packages/db-migrations` — migration management
- `packages/env` — Zod-validated env variable schema
- `packages/auth-shared` — shared RBAC types and role definitions
- `packages/config` — platform registry, claims, feature flags
- `packages/observability` — OpenTelemetry + Sentry integration

---

## Data Layer

| Metric | Count |
|---|---|
| Schema files (`lib/db/src/schema/`) | 165 |
| Drizzle-generated migrations (`lib/db/drizzle/`) | 115 |
| Hand-authored migrations (`lib/db/migrations/`) | 24 |
| **Total migrations** | **139** |
| Schema domains | 8 |

Schema domains: `auth`, `alloy`, `ai`, `firestorm`, `platform`, `terra`, `vessels`, `audit`

---

## API Server

| Metric | Value |
|---|---|
| Route files | 268 |
| Middleware files | 26 |
| Routes with Zod validation | 268 (100%) — corrected; initial 179 estimate missed imported schemas |
| Routes lacking Zod validation | 0 (0%) — corrected; see route-health.md for methodology |
| Framework | express@5 |
| ORM | drizzle-orm@0.45.2 |

**Middleware stack (execution order):**
1. `correlationMiddleware` — request/trace IDs
2. `otelSpanMiddleware` — OpenTelemetry span creation
3. `apiVersionMiddleware` — API version header enforcement
4. `appModeMiddleware` — runtime mode resolution
5. `helmet` — HTTP security headers (CSP, HSTS, permissions policy)
6. `compression` — response compression
7. `cors` — configured CORS
8. `cookieParser` — session cookie parsing
9. `csrfMiddleware` — double-submit CSRF protection
10. `globalLimiter` — rate limiting
11. `sessionRefreshPolicy` — session expiry enforcement
12. `telemetryMiddleware` — request telemetry
13. `traceEmitMiddleware` — distributed trace emission
14. `authMiddleware` — OIDC session hydration (global, non-enforcing)
15. `globalAuthEnforcer` — deny-by-default for /api/* routes
16. `etagMiddleware` — optimistic concurrency (ETag)

---

## Design System

| Attribute | Value |
|---|---|
| Package | `@szl-holdings/design-system@0.1.0` |
| Palette | Dark-first; cool neutral base; enterprise accent family (no neon in product UX) |
| Token categories | color, typography, spacing, radius, elevation, motion, chartPalette, semanticColors, densityConfig |
| Shell components | AppShell, SideNav, PageHeader, CommandBar, GlobalCommandPalette, TenantIndicator, TopBar, SectionPanel, InspectorTabs, SideInspector, SplitPane |
| Constraint | No raw hex outside token files; neon deprecated for authenticated product UX |

---

## Security Posture Summary

| Area | Status |
|---|---|
| RBAC | 11-role hierarchy; deny-by-default enforcer |
| Tenant isolation | Org-scoped queries; cross-org returns 404; RAG tenant partitioning |
| CSRF | Double-submit cookie pattern |
| Rate limiting | Global limiter + per-endpoint sliding window |
| Observability | OTel with OTLP export; Sentry error tracking; pino structured logging |
| Secrets | Zod-validated env schema; no hardcoded secrets |
| Security headers | Helmet CSP + HSTS + Permissions-Policy (production) |
| P0 gaps | All resolved (Apr 2026 hardening sprint) |
| Open gaps | 9 items, all P1–P2 severity |

---

## Archived / Non-Active Artifacts

| Directory | Reason |
|---|---|
| `artifacts/firestorm` | Aegis domain backend moved here (Task #920) |
| `artifacts/imperium` | Cloud sovereignty — archived (Task #920) |
| `artifacts/prism-counsel` | PRISM Counsel — archived (Task #634) |
| `artifacts/internal-audit` | Internal audit tooling |

---

*Source of truth: `packages/platform-metrics-registry`, `docs/APP_STATUS.md`, `docs/platform-facts.md`*
