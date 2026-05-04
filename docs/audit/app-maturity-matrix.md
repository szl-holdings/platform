# SZL Holdings — App Maturity Matrix

**Date:** April 16, 2026
**Purpose:** Classify every artifact by operational maturity and readiness for commercial deployment

---

## Maturity Classification Definitions

| Status | Meaning |
|---|---|
| **GA (General Availability)** | Fully operational, live data where applicable, no known blocking issues, investor/customer presentable |
| **Beta** | Core features complete, some gaps (mocked data, missing integrations, or minor UX issues) — presentable with caveats |
| **Partial** | Core structure built, significant functionality mocked or missing — internal/demo only |
| **Mocked** | UI complete but backed entirely by seeded/hardcoded data — no live data connections |
| **Internal-only** | Infrastructure or tooling artifact not intended for external access |
| **Deprecated** | No longer maintained, content migrated elsewhere |
| **Skeleton** | Directory exists but artifact is not scaffolded — no active source |

---

## Artifact Maturity Matrix

### Web Applications

| Artifact | Package | Status | Data State | Auth | Presentable | Blocker / Notes |
|---|---|---|---|---|---|---|
| `artifacts/szl-holdings` | `@workspace/szl-holdings` | **Beta** | Mostly real (static content, live public feeds) | Yes (OIDC) | Yes | Dashboard KPIs use seeded data; core site is production-ready |
| `artifacts/aegis` | `@workspace/aegis` | **Beta** | Partially mocked | Yes (OIDC) | Yes — with demo caveat | 8+ new security modules recently added; CISO dashboard not yet wired to live data |
| `artifacts/firestorm` | `@workspace/firestorm` | **Beta** | Partially mocked | Yes (OIDC) | Yes — with demo caveat | Live threat feeds (CISA KEV, NVD, MITRE ATT&CK) connected; scenario data seeded |
| `artifacts/vessels` | `@workspace/vessels` | **Partial** | Mocked (AIS simulated) | Yes (OIDC) | Yes — with demo caveat | New commercial modules (insurance, trading, platform) recently added but not connected to live DB/API; AIS telemetry is simulated |
| `artifacts/terra` | `@workspace/terra` | **Beta** | NYC Open Data live; portfolio data mocked | Yes (OIDC) | Yes — with demo caveat | Live NYC distress pipeline active; broker CRM, market trends use seeded data |
| `artifacts/carlota-jo` | `@workspace/carlota-jo` | **GA** | Live external feeds (World Bank, BLS, Microsoft) | Yes (OIDC) | Yes | Advisory site with live booking integration; Outlook Calendar/Contacts wired |
| `artifacts/prism-counsel` | `@workspace/prism-counsel` | **Partial** | Partially real | Yes (OIDC) | Internal | Matter management complete; seed scripts have known issues; recovery tables need fix |
| `artifacts/command` | `@workspace/command` | **Partial** | Mocked / seeded | Yes (OIDC) | Internal | Unified Command Portal — recently scaffolded; CORTEX cross-domain badge counts not wired to live API |
| `artifacts/api-server` | `@workspace/api-server` | **GA** | Real — live PostgreSQL | N/A (backend) | N/A | 182 route files; health endpoint healthy; Zod coverage gap (21/170 routes) |

### Mobile Applications

| Artifact | Package | Status | Notes |
|---|---|---|---|
| `artifacts/szl-holdings-mobile` | `@workspace/szl-holdings-mobile` | **Beta** | Expo / React Native; SZL Holdings mobile command app |
| `artifacts/cortex-mobile` | (none) | **Skeleton** | Expo structure (`app/` dir) present but no package.json; CORTEX mobile app in early development |

### Internal / Tooling

| Artifact | Package | Status | Notes |
|---|---|---|---|
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | **Internal-only** | Component preview server for design system work; not a customer-facing product |

### Deprecated / Legacy

| Artifact | Package | Status | Notes |
|---|---|---|---|
| `artifacts/stephen-site` | `@workspace/stephen-site` | **Deprecated** | Has `DEPRECATED.md`; content migrated to `/founder` route in `szl-holdings`. Scheduled for removal. |
| `artifacts/lyte-command-center` | (none) | **Deprecated** | Built `dist/` and `vite.config.ts` present but no source files. Lyte functionality now served from `szl-holdings` and the API server. Remove. |
| `artifacts/imperium` | (none) | **Skeleton** | Only `node_modules` directory — no package.json, no source. Intended as internal admin command tool. Remove or scaffold. |

---

## Shared Library Maturity

| Library | Status | Notes |
|---|---|---|
| `lib/shared-ui` | GA | Design system; 55 dependencies; widely used |
| `lib/db` | GA | Drizzle ORM + PostgreSQL; 120+ tables; real data |
| `lib/auth` | GA | OIDC authentication; real sessions |
| `lib/audit` | GA | Immutable event log; production-ready |
| `lib/proof-chain` | GA | Attribution tracking; production-ready |
| `lib/config` | GA | Platform constants; app registry |
| `lib/workflow-engine` | Beta | Alloy DAG definitions; active |
| `lib/forge-runtime` | Beta | Alloy execution internals |
| `lib/ai-engine` | Beta | AI provider wrappers; proxy configured |
| `lib/intelligence-feeds` | Beta | Live data feeds; some feeds active |
| `lib/observability` | Beta | Pino logging; no external APM yet |
| `lib/data-connectors` | Partial | Connector framework; not all connectors active |
| `lib/api-spec` | Partial | OpenAPI spec; coverage incomplete |
| `lib/api-zod` | Partial | Shared Zod schemas; coverage incomplete |
| `lib/api-client-react` | Partial | React query hooks; coverage incomplete |
| `lib/covenant-policy` | Partial | Policy enforcement; not globally applied |
| `lib/monte-carlo` | Partial | Simulation engine; used in specific modules |
| `lib/graphql-client` | Partial | GraphQL layer; not primary transport |
| `lib/crdt-sync` | Internal | Real-time sync primitives; not production-deployed |
| `lib/offline-engine` | Internal | Mobile offline sync; not production-deployed |
| `lib/mobile-shared` | Internal | Mobile primitives; used by mobile artifacts |
| `lib/mcp-client` | Internal | Model Context Protocol; experimental |
| `lib/i18n` | Internal | i18n framework; not actively used |
| `lib/worldline` | Internal | Geospatial utilities; used in Vessels/Terra |
| `lib/outcome-graph` | Internal | Decision modeling; experimental |
| `lib/prism-bus` | Internal | PRISM event bus; active in Lyte flows |
| `lib/pulse-evals` | Internal | AI evaluation; active in INCA |
| `lib/receipt-graph` | Internal | Billing graph; active in billing routes |
| `lib/atlas-artifacts` | Internal | Artifact metadata; used in admin |
| `lib/services` | Internal | Service abstractions; backend-only |
| `lib/replit-auth-web` | Internal | Frontend auth hook for Replit OIDC |
| `lib/object-storage-web` | Internal | Object storage client; falls back to local |
| `lib/analytics` | Internal | Analytics events; wired to PostHog |
| `lib/approvals` | **Needs Investigation** | No `package.json`; only compiled artifacts present. May be a build artifact from a previous refactor — source unclear. |

---

## Summary Counts

| Status | Count | Artifacts |
|---|---|---|
| GA | 2 | Carlota Jo, API Server |
| Beta | 5 | SZL Holdings, Aegis, Firestorm, Terra, SZL Holdings Mobile |
| Partial | 3 | Vessels, Counsel, Command |
| Internal-only | 1 | Mockup Sandbox |
| Deprecated | 2 | Stephen Site, Lyte Command Center |
| Skeleton / Concept | 2 | Cortex Mobile, Imperium |
| **Total** | **15** | 15 total artifact directories; 12 have `package.json` (cortex-mobile, imperium, lyte-command-center do not) |

---

*Part of growth capital Cleanup — Phase 1 audit. April 2026.*
