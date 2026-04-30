# Portfolio Architecture — SZL Holdings Platform

Generated: 2026-04-16
Authority: Phase 2-3 Product Topology & Portfolio Rationalization

---

## Canonical Product Topology

The SZL Holdings platform is organized into four canonical layers. Every surface fits exactly one role in this hierarchy.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ENTRY SURFACES                                                           │
│                                                                           │
│  szl-holdings (web)          CORTEX (mobile)                             │
│  Public flagship             Unified command, all 8 domains              │
│  Marketing · Trust · Docs    Biometric · Offline · Push                  │
├──────────────────────────────────────────────────────────────────────────┤
│  OPERATOR COMMAND SURFACE                                                 │
│                                                                           │
│  command                                                                  │
│  Unified ops command — Strategy · Operations · Infrastructure             │
│  (Absorbs: Lyte, IMPERIUM)                                               │
├──────────────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                             │
│                                                                           │
│  aegis          vessels      terra        carlota-jo                     │
│  Security &        Maritime     Real Estate  Premium Advisory            │
│  Defense Intel     Intelligence Intelligence Services                    │
├──────────────────────────────────────────────────────────────────────────┤
│  PLATFORM BACKEND                                                         │
│                                                                           │
│  api-server — REST + GraphQL + WebSocket                                 │
│  Auth · RBAC · AI · Governance · Real-time                               │
├──────────────────────────────────────────────────────────────────────────┤
│  SHARED LIBRARIES (33 packages)                                           │
│                                                                           │
│  ai-engine · api-zod · shared-ui · db · services · observability        │
│  mobile-shared · forge-runtime · intelligence-feeds · offline-engine     │
│  monte-carlo · proof-chain · covenant-policy · prism-bus · …            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Canonical Artifact Designations

### A. Public Web Flagship: `szl-holdings`

**Classification: CANONICAL — Primary Public Entry Point**

| Attribute | Value |
|-----------|-------|
| Path | `/` (root in production) |
| Source files | 338 ts/tsx |
| Pages / routes | 251 |
| Backend connected | Partially — live API + static pages |
| Auth-gated surfaces | Forge admin, ops dashboards, CORTEX intelligence |

**Designation Rationale:**
`szl-holdings` is the public-facing face of the entire platform. It serves marketing, trust documentation, developer portal, fund intelligence, investor relations, and the founder profile. It is the correct canonical flagship because:
- It has the broadest scope of any web artifact (251 pages, 338 source files)
- It directly tells the SZL platform story to investors, enterprise evaluators, and partners
- Its `/founder` section consolidates the founder profile (previously a separate surface)
- Auth-gated sub-sections provide operators access to Forge, dashboards, and CORTEX intelligence without requiring a separate app
- In production, it maps to the root domain (`szlholdings.com`) — every other surface is a subdomain or subpath

**What it is NOT:** An operator command center. Operators who need workflow intelligence go to `command`. Domain specialists go to their domain pack (aegis, vessels, terra, carlota-jo).

---

### B. API Platform: `api-server`

**Classification: CANONICAL — Sole Backend**

| Attribute | Value |
|-----------|-------|
| Source files | 351 ts/tsx |
| Route files | 357 |
| Lines of code | ~82,610 |
| Estimated endpoints | 2,816 |
| Auth | RBAC 11-role, session, bearer tokens |
| Real-time | WebSocket (HMAC tickets), SSE |

**Designation Rationale:**
`api-server` is the sole backend for the entire platform. There is no second API server. All web and mobile surfaces consume it. It provides:
- REST routes for all domain packs and operator surfaces
- Apollo GraphQL for graph-style queries
- WebSocket for real-time signal streaming
- RBAC enforcement for all 11 roles
- Audit logging, rate limiting, Zod validation, structured errors

**Endpoint count:** 2,816 across 357 route files (canonical verified count — see `docs/metrics-reference.md`).

---

### C. Canonical Operator Command Surface: `command`

**Classification: CANONICAL — Primary Operator Surface**

| Attribute | Value |
|-----------|-------|
| Source files | 213 ts/tsx |
| Pages / routes | 172 |
| Backend connected | Yes — SSE, signal timeline, approval queues |
| Absorbed surfaces | Lyte command center (155 src), IMPERIUM (22 src) |

**Designation Rationale:**
`command` is the canonical operator command surface — the place where platform operators observe signals, review recommendations, manage approvals, and execute decisions. It is the correct designation because:
- It is the largest and most feature-complete operator surface (213 files, 357 routes)
- It has absorbed the functionality of two previously separate operator surfaces (both merged)
- It is backed by live SSE streams, signal timelines, and approval queues from `api-server`
- It maps cleanly to the "governed decision loop": Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning

**What was merged into it:**
- Operations workflow surface (signal timeline, PRISM). Redirect → `/command/`
- Cloud sovereignty and infrastructure mode. Merged as `/command/infrastructure`. Redirect → `/command/infrastructure`

---

### D. Primary Mobile Flagship: `cortex-mobile`

**Classification: CANONICAL-MOBILE — Primary**

See `ops/mobile/mobile-disposition.md` for full rationale.

---

### E. Secondary Mobile: `szl-holdings-mobile`

**Classification: CANONICAL-MOBILE — Secondary (Deferred)**

See `ops/mobile/mobile-disposition.md` for deferral conditions and credential blockers.

---

## Full Artifact Classification Registry

| Artifact | Classification | Action | Path |
|----------|----------------|--------|------|
| `szl-holdings` | CANONICAL — Public Flagship | Keep; root in production | `/` |
| `api-server` | CANONICAL — API Platform | Keep; sole backend | `/api/` |
| `aegis` | CANONICAL — Domain Pack | Keep; full defense UI | `/aegis/` |
| `terra` | CANONICAL — Domain Pack | Keep; live data wiring | `/terra/` |
| `vessels` | CANONICAL — Domain Pack | Keep; live data wiring | `/vessels/` |
| `carlota-jo` | CANONICAL — Domain Pack | Keep; most production-ready | `/carlota-jo/` |
| `command` | CANONICAL — Operator Surface | Keep; absorbed merged operator surfaces | `/command/` |
| `cortex-mobile` | CANONICAL-MOBILE — Primary | Keep; TestFlight next | Mobile |
| `szl-holdings-mobile` | CANONICAL-MOBILE — Secondary | Defer; ship after CORTEX | Mobile |
| _(5 archived artifacts)_ | ARCHIVED/DEPRECATED | Deregistered — see ops/frontier/disposition-matrix.md | — |
| `mockup-sandbox` | INTERNAL | Keep; never list in public docs | `/__mockup` |

---

## Shared Library Health Summary

| Tier | Libraries | Action |
|------|-----------|--------|
| **HIGH priority — maintain** | ai-engine, api-zod, shared-ui, services, db, observability | Treat as platform-critical |
| **MEDIUM priority — maintain** | mobile-shared, forge-runtime, intelligence-feeds, offline-engine | Required for mobile + AI pipelines |
| **LOW priority — keep** | monte-carlo, graphql-client, covenant-policy, prism-bus, mcp-client, object-storage-web, replit-auth-web | Used but not on critical path |
| **LIGHT — keep, low priority** | analytics, api-client-react, auth, audit, config, crdt-sync, data-connectors, i18n, outcome-graph, proof-chain, pulse-evals, receipt-graph, worldline, workflow-engine, atlas-artifacts | Thin wrappers; maintain, do not extend without purpose |
| **SHELL — evaluate** | api-spec, approvals | Fill with real implementation or delete before Phase 4 |

---

## CI/CD Actions Required

| Workflow | Action |
|----------|--------|
| `ci.yml` | Add all 7 canonical web apps to build matrix |
| `e2e.yml` | Updated — archived specs removed; canonical command spec added |
| legacy CI workflow | Archived — retained as archival record; disable triggers |
| `deploy.yml` | Review — may be legacy duplicate of `deploy-staging.yml` + `deploy-production.yml` |
| `npm-publish.yml` | Review — confirm still needed in pnpm workspace |

---

## Related Files

- `ops/frontier/disposition-matrix.md` — Truth audit source
- `ops/frontier/product-surface-census.md` — Artifact census with file counts
- `ops/mobile/mobile-disposition.md` — Mobile flagship decision
- `ops/portfolio/public-narrative-map.md` — Audience and narrative mapping
- `ops/portfolio/domain-pack-strategy.md` — Domain pack platform relationship
- `ops/portfolio/archive-plan.md` — Archive and deprecation instructions
