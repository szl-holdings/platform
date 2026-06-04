# Archived vs. Active Surface Matrix

**Generated:** 2026-04-26  
**Task:** Rehaul Phase 0 — Inventory & Public-Claims Reconciliation

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| **live** | Fully functional, no known blocking issues, suitable for investor/customer demo without caveats |
| **alpha-working** | Core features implemented and wired; uses seeded/demo data; presentable with clear alpha labeling |
| **alpha-partial** | Significant features implemented; some modules not wired to backend or using mocks |
| **demo-only** | Exists as a rendered demo or proof-of-concept; not an interactive working product |
| **internal-only** | Operational/developer tooling; not a customer-facing product surface |
| **archived** | No longer maintained; content migrated; pending removal |
| **broken** | Exists but non-functional due to known blocking issue |

---

## Web Artifacts

| Dir | Brand | Status | Notes |
|-----|-------|--------|-------|
| `artifacts/szl-holdings` | SZL Holdings Dashboard | **alpha-working** | Primary corporate presence; dashboard KPIs seeded; auth active |
| `artifacts/a11oy` | A11oy — Brand Orchestration Layer | **alpha-working** | Phase 1 complete across operator surfaces; GraphQL wired with seed fallback |
| `artifacts/command` | Unified Command (FORGE) | **alpha-partial** | Core structure built; OMNIA pages wired; some cross-domain views incomplete |
| `artifacts/sentra` | TENAX — Cyber Resilience | **alpha-working** | CISA KEV, NVD CVE, MITRE ATT&CK active; scenario data seeded |
| `artifacts/counsel` | Counsel — Legal Matter Command | **alpha-working** | Matter tracking and obligation mapping functional with seeded data |
| `artifacts/terra` | DOMAINE — Real Estate Intelligence | **alpha-working** | NYC Open Data pipeline live; Mapbox requires token config |
| `artifacts/vessels` | SEXTANT — Maritime Intelligence | **alpha-partial** | NOAA/Open-Meteo active; AIS simulated (no live subscription); 3 modules not wired |
| `artifacts/carlota-jo` | Carlota Jo Consulting | **alpha-working** | Service catalog and inquiry workflow functional |
| `artifacts/pulse` | LUMINA — AI Executive Briefing | **alpha-working** | Auth gate; executive briefing surfaces with seeded signals |
| `artifacts/aegis` | PARAGON (investor pitch + ATLAS) | **alpha-working** | Investor pitch deck + ATLAS runtime; defense surfaces use seeded data |
| `artifacts/lyte-command-center` | KORA — Decision Intelligence | **alpha-working** | PRISM dashboard, command inbox, approvals active with seeded data |
| `artifacts/api-server` | API Server | **live** | Backend API serving all platform; DB-connected; auth enforced |

### Mobile

| Dir | Brand | Status | Notes |
|-----|-------|--------|-------|
| `artifacts/szl-holdings-mobile` | APEX — Mobile Command | **alpha-partial** | Core screens functional; biometric auth wired; some analytics screens missing data |

### Video

| Dir | Brand | Status | Notes |
|-----|-------|--------|-------|
| `artifacts/szl-demo-video` | SZL Holdings Demo Video | **live** | 78-second animated walkthrough; serves correctly |

### Design / Internal Tooling

| Dir | Brand | Status | Notes |
|-----|-------|--------|-------|
| `artifacts/mockup-sandbox` | PRAXIS — Unified Agentic AI Layer | **internal-only** | Developer/design tooling; not a customer surface |
| `artifacts/pluginmesh` | PluginMesh | **internal-only** | Has runtime workflow; not platform-registered; plugin system tooling |
| `artifacts/helios` | Helios | **internal-only** | Full scaffold exists; no workflow; no platform registration; purpose unclear |

---

## Background Apps (all internal-only)

| Dir | Status |
|-----|--------|
| `apps/alloy-embedding-api` | **internal-only** |
| `apps/alloy-ingestion-orchestrator` | **internal-only** |
| `apps/alloy-runtime-api` | **internal-only** |

---

## Platform Services (all internal-only)

| Dir | Status | Notes |
|-----|--------|-------|
| `services/alloy-fabric-api` | **internal-only** | |
| `services/alloy-fabric-ingest-control` | **internal-only** | |
| `services/lyte-metrics-store` | **internal-only** | Removed from workflows (stale); code exists |
| `services/meridian_control_plane` | **internal-only** | |
| `services/meridian_forecast_lab` | **internal-only** | |
| `services/substrate-mcp-gateway` | **internal-only** | |
| `services/substrate-py-workers` | **internal-only** | |
| `services/verticals` | **internal-only** | |

---

## Workers (all internal-only)

| Dir | Status |
|-----|--------|
| `workers/alloy-embed-worker` | **internal-only** |
| `workers/alloy-rank-worker` | **internal-only** |
| `workers/alloy-rerank-worker` | **internal-only** |
| `workers/alloy-vector-worker` | **internal-only** |
| `workers/substrate-python` | **internal-only** |

---

## Referenced-but-Absent Surfaces

| Reference | Where Referenced | Reality | Status |
|-----------|-----------------|---------|--------|
| `artifacts/cortex-mobile` | `docs/APP_STATUS.md` — "CORTEX Mobile" | Directory does not exist | **archived** / concept — no code |

---

## Aggregate Counts by Status (Artifact Dirs Only)

Total artifact directories: 17

| Status | Count | Artifact dirs |
|--------|-------|--------------|
| live | 2 | api-server, szl-demo-video |
| alpha-working | 9 | szl-holdings, a11oy, sentra, counsel, terra, carlota-jo, pulse, aegis, lyte-command-center |
| alpha-partial | 3 | command, vessels, szl-holdings-mobile |
| internal-only | 3 | mockup-sandbox, pluginmesh, helios |
| **Total** | **17** | |

Background infrastructure (all internal-only): 3 apps + 8 services + 5 workers = **16 infrastructure entries**
