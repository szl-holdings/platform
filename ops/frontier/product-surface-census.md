# Product Surface Census

Generated: 2026-04-16 (updated)
Purpose: Complete inventory of all user-facing surfaces — real vs. aspirational, per product.

---

## Census by Product

### 1. SZL Holdings Flagship (`artifacts/szl-holdings`)

| Metric | Value |
|--------|-------|
| Source files | 402 ts/tsx |
| Pages/routes | 251 |
| Classification | CANONICAL |
| Functionality | Marketing, trust center, docs, fund intelligence, founder profile, Nexus command, developer portal |
| Backend-connected | Partially — some pages consume live API; some are static/demo |
| Auth-gated surfaces | Forge admin, ops dashboards, CORTEX intelligence |
| Claims accuracy | Functional alpha; most UI real, some data mocked |

### 2. API Server (`artifacts/api-server`)

| Metric | Value |
|--------|-------|
| Source files | 395 ts/tsx |
| Route files | 172 |
| Lines of code | 82,610+ |
| Classification | CANONICAL |
| Functionality | REST + GraphQL + WebSocket; full platform backend |
| Estimated endpoints | 2,816 |
| Auth coverage | RBAC 11-role, session-based, bearer tokens |
| Real data surfaces | Health, billing, auth, integrations, AI, most domain routes |
| Mock/stub surfaces | Some intelligence feed ingestion; some STIX/TAXII routes in demo mode |

### 3. Aegis — Defense & Intelligence (`artifacts/aegis`)

| Metric | Value |
|--------|-------|
| Source files | 166 ts/tsx (165 src/ + 1 vite.config.ts) |
| Pages/routes | 158 |
| Classification | CANONICAL |
| Functionality | SOC command, MITRE ATT&CK mapping, SOAR playbooks, XDR console, Sentinel AI |
| Backend-connected | Partially — threat intel feeds in demo/stub mode; core SOC UI real |
| Notes | Full app at /aegis/; supersedes the previous thin-wrapper artifact (now archived) |

### 4. Terra — Real Estate Intelligence (`artifacts/terra`)

| Metric | Value |
|--------|-------|
| Source files | 92 ts/tsx |
| Pages/routes | 73 |
| Classification | CANONICAL |
| Functionality | NYC distress pipeline, ownership entity graph, deal pipeline, MLS ingestion, broker workflow |
| Backend-connected | Yes — API routes exist; some data sources in demo mode |
| DB tables | 17 (per README) |

### 5. Vessels — Maritime Intelligence (`artifacts/vessels`)

| Metric | Value |
|--------|-------|
| Source files | 103 ts/tsx (102 src/ + 1 vite.config.ts) |
| Pages/routes | 84 |
| Classification | CANONICAL |
| Functionality | AIS fleet tracking, sanctions screening, voyage economics, dark vessel detection, commodity trading |
| Backend-connected | Partially — AIS feed is demo; commercial modules wired to DB |
| DB tables | 30+ (per README) |

### 6. Carlota Jo — Premium Advisory (`artifacts/carlota-jo`)

| Metric | Value |
|--------|-------|
| Source files | 70 ts/tsx (69 src/ + 1 vite.config.ts) |
| Pages/routes | 49 |
| Classification | CANONICAL |
| Functionality | Client management, service catalog, booking, document delivery, messaging |
| Backend-connected | Yes — client-facing, operational |
| DB tables | 10 (per README) |
| README status | Listed as "Live" |

### 7. Command — Unified Operations (`artifacts/command`)

| Metric | Value |
|--------|-------|
| Source files | 223 ts/tsx |
| Pages/routes | 172 |
| Classification | CANONICAL |
| Functionality | Strategy, operations, infrastructure command — absorbs Lyte + Imperium |
| Backend-connected | Yes — SSE real-time, signal timeline, approval queues |

### 8. SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)

| Metric | Value |
|--------|-------|
| Source files | 167 ts/tsx |
| Classification | CANONICAL-MOBILE |
| Functionality | Primary mobile app; full Expo app with live workflow |
| Google credential | PLACEHOLDER (.example tracked; real file in .gitignore) |
| iOS credential | PLACEHOLDER (.example tracked; real file in .gitignore) |
| Release readiness | Alpha — not yet on TestFlight/Play Store |

### 9. CORTEX Mobile (`artifacts/cortex-mobile`)

| Metric | Value |
|--------|-------|
| Source files | 2 ts/tsx (expo-env.d.ts + router types) |
| Classification | SHELL |
| Functionality | Expo scaffold only — no app screens, no navigation, no business logic |
| Notes | 8-domain workspace concept exists only in docs, not in code |

---

## Archived Surfaces

All archived artifacts have 0 source files (code removed). Only marker files remain.

5 artifacts archived — see `ops/frontier/disposition-matrix.md` for full list and dispositions.

### Mockup Sandbox (`artifacts/mockup-sandbox`)
- 5 src files — pure tooling
- **Status:** Internal UI prototyping
- **Surface exposure:** At /__mockup — internal only, dev-only

---

## Census Summary

| Status | Count | Artifacts |
|--------|-------|-----------|
| CANONICAL (web) | 7 | szl-holdings, api-server, aegis, terra, vessels, carlota-jo, command |
| CANONICAL (mobile) | 1 | szl-holdings-mobile |
| SHELL (scaffold only) | 1 | cortex-mobile |
| ARCHIVE (code removed) | 5 | see ops/frontier/disposition-matrix.md |
| INTERNAL | 1 | mockup-sandbox |
| **TOTAL** | **15** (17 dirs total, some renamed/reclassified) |
