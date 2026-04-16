# Product Surface Census

Generated: 2026-04-15
Purpose: Complete inventory of all user-facing surfaces — real vs. aspirational, per product.

---

## Census by Product

### 1. SZL Holdings Flagship (`artifacts/szl-holdings`)

| Metric | Value |
|--------|-------|
| Source files | 338 ts/tsx |
| Pages/routes | 251 |
| Classification | CANONICAL |
| Functionality | Marketing, trust center, docs, fund intelligence, founder profile, Nexus command, developer portal |
| Backend-connected | Partially — some pages consume live API; some are static/demo |
| Auth-gated surfaces | Forge admin, ops dashboards, CORTEX intelligence |
| Claims accuracy | Functional alpha; most UI real, some data mocked |

### 2. API Server (`artifacts/api-server`)

| Metric | Value |
|--------|-------|
| Source files | 351 ts/tsx |
| Route files | 172 |
| Lines of code | 82,610+ |
| Classification | CANONICAL |
| Functionality | REST + GraphQL + WebSocket; full platform backend |
| Estimated endpoints | ~1,800–2,000 (README claims 2,331 — unverified) |
| Auth coverage | RBAC 11-role, session-based, bearer tokens |
| Real data surfaces | Health, billing, auth, integrations, AI, most domain routes |
| Mock/stub surfaces | Some intelligence feed ingestion; some STIX/TAXII routes in demo mode |

### 3. Aegis — Defense & Intelligence (`artifacts/aegis`)

| Metric | Value |
|--------|-------|
| Source files | 164 ts/tsx |
| Pages/routes | 158 |
| Classification | CANONICAL |
| Functionality | SOC command, MITRE ATT&CK mapping, SOAR playbooks, XDR console, Sentinel AI |
| Backend-connected | Partially — threat intel feeds in demo/stub mode; core SOC UI real |
| Notes | Full app at /aegis/; firestorm at /firestorm/ is thin (9 files) entry point |

### 4. Firestorm (`artifacts/firestorm`)

| Metric | Value |
|--------|-------|
| Source files | 9 ts/tsx |
| Pages/routes | 7 |
| Classification | CANONICAL (thin wrapper) |
| Functionality | Defense intelligence entry point; routes into aegis domain |
| Notes | Very thin; 9 files likely routes/wrappers only |

### 5. Terra — Real Estate Intelligence (`artifacts/terra`)

| Metric | Value |
|--------|-------|
| Source files | 91 ts/tsx |
| Pages/routes | 73 |
| Classification | CANONICAL |
| Functionality | NYC distress pipeline, ownership entity graph, deal pipeline, MLS ingestion, broker workflow |
| Backend-connected | Yes — API routes exist; some data sources in demo mode |
| DB tables | 17 (per README) |

### 6. Vessels — Maritime Intelligence (`artifacts/vessels`)

| Metric | Value |
|--------|-------|
| Source files | 101 ts/tsx |
| Pages/routes | 84 |
| Classification | CANONICAL |
| Functionality | AIS fleet tracking, sanctions screening, voyage economics, dark vessel detection, commodity trading |
| Backend-connected | Partially — AIS feed is demo; commercial modules wired to DB |
| DB tables | 30+ (per README) |

### 7. Carlota Jo — Premium Advisory (`artifacts/carlota-jo`)

| Metric | Value |
|--------|-------|
| Source files | 69 ts/tsx |
| Pages/routes | 49 |
| Classification | CANONICAL |
| Functionality | Client management, service catalog, booking, document delivery, messaging |
| Backend-connected | Yes — client-facing, operational |
| DB tables | 10 (per README) |
| README status | Listed as "Live" |

### 8. Command — Unified Operations (`artifacts/command`)

| Metric | Value |
|--------|-------|
| Source files | 213 ts/tsx |
| Pages/routes | 172 |
| Classification | CANONICAL |
| Functionality | Strategy, operations, infrastructure command — absorbs Lyte + Imperium |
| Backend-connected | Yes — SSE real-time, signal timeline, approval queues |

### 9. CORTEX Mobile (`artifacts/cortex-mobile`)

| Metric | Value |
|--------|-------|
| App screens | Full Expo app structure |
| Classification | CANONICAL MOBILE |
| Functionality | 8-domain workspace switcher, biometric auth, cross-domain signals, copilot |
| Backend-connected | Via API server |
| Release readiness | Not yet on TestFlight/Play Store |
| Credential files | Need verification (szl-holdings-mobile has placeholders) |

### 10. SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)

| Metric | Value |
|--------|-------|
| App screens | Full Expo app |
| Classification | SECONDARY MOBILE |
| Functionality | Holdings companion app |
| Google credential | PLACEHOLDER (confirmed placeholder in google-services.json) |
| iOS credential | PLACEHOLDER (confirmed placeholder in GoogleService-Info.plist) |
| Release readiness | Deferred — ship CORTEX first |

---

## Secondary / Deprecated Surfaces

### Lyte Command Center (`artifacts/lyte-command-center`)
- 155 src files, 141 pages — substantial app
- **Status:** Merged into `command` but still registered and running
- **Surface exposure:** Active at /lyte-command-center/ path
- **Recommendation:** Deregister artifact, redirect traffic to /command/

### IMPERIUM (`artifacts/imperium`)
- 22 src files, 15 pages — thin
- **Status:** Merged into command (infrastructure mode)
- **Surface exposure:** Active at /imperium/ path
- **Recommendation:** Deregister artifact, redirect to /command/infrastructure

### PRISM Counsel (`artifacts/prism-counsel`)
- 138 src files, 128 pages — substantial code base
- **Status:** Has DEPRECATED.md; deprecated in task #579
- **Surface exposure:** Still registered, still running at /prism-counsel/
- **README claims:** Listed as "127 components, Functional alpha" — MISLEADING (it's deprecated)
- **Recommendation:** Remove from README products table; deregister and archive

### Stephen Site (`artifacts/stephen-site`)
- 60 src files, 37 pages
- **Status:** Has DEPRECATED.md; content moved to /founder in szl-holdings
- **README claims:** Listed as "58 components, Live" — MISLEADING (deprecated)
- **Recommendation:** Remove from README products table; deregister and archive

### Mockup Sandbox (`artifacts/mockup-sandbox`)
- 3 src files — pure tooling
- **Status:** Internal UI prototyping
- **Surface exposure:** At /__mockup — internal only
- **Recommendation:** Keep but never list in public-facing docs

---

## Census Summary

| Status | Count | Artifacts |
|--------|-------|-----------|
| CANONICAL (web) | 8 | szl-holdings, api-server, aegis, firestorm, terra, vessels, carlota-jo, command |
| CANONICAL (mobile) | 2 | cortex-mobile, szl-holdings-mobile |
| SECONDARY (running, merge candidates) | 2 | lyte-command-center, imperium |
| ARCHIVE-DEPRECATE | 2 | prism-counsel, stephen-site |
| INTERNAL | 1 | mockup-sandbox |
| **TOTAL** | **15** | |
