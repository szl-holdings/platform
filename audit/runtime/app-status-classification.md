# App Status Classification — SZL Holdings Platform

**Date:** 2026-04-26
**Scope:** All registered artifacts — 13 active web apps, 1 mobile, 1 video, 1 internal design tool
**Method:** Route-by-route smoke test + source inspection + API health check
**Labels:** See definitions below

---

## Label Definitions

| Label | Meaning |
|---|---|
| `live` | Production-ready, investor/customer-presentable, no known blocking issues, live data end-to-end |
| `alpha working` | Core features functional with demo or seeded data; no fatal gaps; presentable with clear labeling |
| `alpha partial` | Core structure built; significant features missing, mocked, or not wired to backend |
| `demo-only` | Serves as a presentation/demo artifact; no interactive data or live backend |
| `archived` | Deregistered, no active development, no active workflow |
| `broken` | Fails to load or has fatal runtime errors on primary routes |
| `internal only` | Engineering or design tooling — not customer-facing |

---

## Classification Register

### API Server — Backend Infrastructure

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/api-server` |
| **Preview path** | `/api/` |
| **Classification** | `alpha working` |
| **Evidence** | `GET /api/health` → 200, mode `demo`, DB latency 13ms, AI live, 8 registered apps; all auth-protected routes correctly return 401 |
| **Gaps** | `/api/sentra/risks` → 404 (route not registered); running in `demo` mode (no live production data source); integration tests not in CI |
| **Follow-up** | Register `sentraRisksRouter` in route index; wire production data sources before upgrading to `live` |

---

### SZL Holdings Dashboard

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/szl-holdings` |
| **Preview path** | `/` |
| **Classification** | `alpha working` |
| **Evidence** | Root `/`, `/szl/`, static assets all 200; OIDC auth wired; investor-facing dashboard KPIs seeded |
| **Gaps** | Autopilot header stats and genome score hardcoded; no live data pipeline to KPI widgets |
| **Follow-up** | Wire live KPI aggregation from api-server before upgrading to `live` |

---

### Aegis — Defense & Intelligence Command

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/aegis` |
| **Preview path** | `/aegis/` |
| **Classification** | `alpha working` |
| **Evidence** | All 5 sampled routes 200; CISA KEV, NVD CVE, MITRE ATT&CK v14, AbuseIPDB integrations active |
| **Gaps** | 8 new security modules not wired to live API/case management; CISO Executive Dashboard not yet aggregated from live sources |
| **Follow-up** | Wire remaining modules; promote to `live` when live case management connected |

---

### Vessels — Maritime Intelligence (SEXTANT)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/vessels` |
| **Preview path** | `/vessels/` |
| **Classification** | `alpha partial` |
| **Evidence** | All 5 sampled routes 200; NOAA, Open-Meteo Marine, GDELT active |
| **Gaps** | AIS telemetry simulated (no live AIS subscription); 3 commercial modules (insurance, trading, platform) not connected to DB/API; no live vessel position data |
| **Follow-up** | AIS provider integration ($15–40K/year); wire commercial modules to database |

---

### Terra — Real Estate Intelligence (DOMAINE)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/terra` |
| **Preview path** | `/terra/` |
| **Classification** | `alpha partial` |
| **Evidence** | All 12 runner routes 200 (`pnpm qa:routes`); NYC Open Data distress pipeline live; Census ACS, BLS, FEMA, SEC EDGAR active |
| **Gaps** | Mapbox token not configured — maps render blank; no live MLS/CoStar market data integration |
| **Infrastructure fix** | Dev-server port changed 6000 → 6100 (port 6000 is in the WHATWG Fetch blocked-port list; runner uses native `fetch`) |
| **Follow-up** | Configure Mapbox token; negotiate MLS/CoStar data access |

---

### Carlota Jo — Private Advisory

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/carlota-jo` |
| **Preview path** | `/carlota-jo/` |
| **Classification** | `alpha working` |
| **Evidence** | All 4 sampled routes 200; World Bank, BLS, HBR RSS, Microsoft Outlook Calendar/Contacts active; booking workflow functional |
| **Gaps** | None blocking — most complete artifact in the portfolio |
| **Follow-up** | Promote to `live` after final security review and production data validation |

---

### Command — Unified Command Portal (FORGE)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/command` |
| **Preview path** | `/command/` |
| **Classification** | `alpha partial` |
| **Evidence** | All 4 sampled routes 200; CORTEX hub scaffolded |
| **Gaps** | CORTEX cross-domain badge counts not wired to live API; Vessels module KPIs missing from Command Overview; push notification deep linking not implemented |
| **Follow-up** | Wire badge counts; add Vessels KPI panel; implement push deep linking |

---

### Pulse — AI Executive Briefing (LUMINA)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/pulse` |
| **Preview path** | `/pulse/` |
| **Classification** | `alpha working` |
| **Evidence** | All 4 sampled routes 200; AI multi-provider routing active; briefing generation functional |
| **Gaps** | Some briefing sources use seeded/mocked signals rather than live cross-domain feeds |
| **Follow-up** | Wire live cross-domain signal aggregation from A11oy fabric |

---

### Counsel — Legal Matter Command

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/counsel` |
| **Preview path** | `/counsel/` |
| **Classification** | `alpha working` |
| **Evidence** | All 6 sampled routes 200; matter tracking, contract management, risk surfaces all render; API calls correctly auth-gated (401) |
| **Gaps** | CourtListener integration requires API token; some obligation dependency edges are seeded rather than live |
| **Follow-up** | Configure `COURT_LISTENER_API_TOKEN`; wire live obligation dependency graph |

---

### Sentra — Cyber Resilience Command (TENAX)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/sentra` |
| **Preview path** | `/sentra/` |
| **Classification** | `alpha partial` |
| **Evidence** | All 6 UI routes 200; risk, compliance, incident, asset surfaces render |
| **Gaps** | **`GET /api/sentra/risks` → 404** — the API route backing the risk feed is not registered server-side; Sentra UI will show empty/error state when authenticated and calling this endpoint |
| **Follow-up** | Register `sentraRisksRouter` in `api-server/src/routes/index.ts` — blocks upgrade to `alpha working` |

---

### Lyte — Decision Intelligence (KORA)

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/lyte-command-center` |
| **Preview path** | `/lyte/` |
| **Classification** | `alpha partial` |
| **Evidence** | `/lyte/` and `/lyte/decisions` and `/lyte/models` all 200; decision intelligence surfaces render |
| **Gaps** | **`/lyte-command-center/` → 404** — the artifact directory name is `lyte-command-center` but preview path is `/lyte/`; no redirect alias registered; external links using the directory-name slug will 404; cross-domain badge wiring incomplete |
| **Follow-up** | Add redirect alias for `/lyte-command-center/` → `/lyte/`; wire cross-domain decision metrics |

---

### A11oy — Brand Orchestration Layer

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/a11oy` |
| **Preview path** | `/a11oy/` |
| **Classification** | `alpha working` |
| **Evidence** | All 5 sampled routes 200; Phase 1 fabric primitives, type system, demo seed, and read API complete |
| **Gaps** | Phase 2 (workcell engine with live AI reasoning) in progress; Phase 3 (proof-carrying execution with live connectors) planned |
| **Follow-up** | Complete Phase 2 workcell engine; wire live connectors for Phase 3 |

---

### Mockup Sandbox — PRAXIS Component Preview

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/mockup-sandbox` |
| **Preview path** | `/` (root redirect) |
| **Classification** | `internal only` |
| **Evidence** | Root `/` → 302 redirect (expected); `/mockup-sandbox/` → 404 (subpath not mounted — internal tooling, acceptable) |
| **Gaps** | Not customer-facing — no gaps relevant to product status |
| **Follow-up** | None required for product classification |

---

### SZL Holdings Mobile — CORTEX/APEX

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/szl-holdings-mobile` |
| **Preview path** | N/A (Expo/React Native) |
| **Classification** | `alpha partial` |
| **Evidence** | Expo scaffold functional; mobile companion surfaces implemented; no HTTP smoke test applicable |
| **Gaps** | Custom splash screen and icon pending; push notification deep linking not implemented; not deployed to app stores |
| **Follow-up** | Complete splash/icon assets; implement push deep linking; submit to TestFlight/Play Store |

---

### SZL Demo Video

| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/szl-demo-video` |
| **Preview path** | `/szl-demo-video/` |
| **Classification** | `demo-only` |
| **Evidence** | Video artifact — React/Remotion animated demo video; workflow not started at time of test |
| **Gaps** | Not interactive; serves as presentation content only |
| **Follow-up** | None — intentionally demo-only |

---

## Summary Dashboard

| Classification | Count | Artifacts |
|---|---|---|
| `live` | 0 | — |
| `alpha working` | 7 | api-server, szl-holdings, aegis, carlota-jo, pulse, counsel, a11oy |
| `alpha partial` | 6 | vessels, terra, command, sentra, lyte, szl-holdings-mobile |
| `demo-only` | 1 | szl-demo-video |
| `archived` | 0 | — (archived artifacts deregistered in prior phase) |
| `broken` | 0 | — |
| `internal only` | 1 | mockup-sandbox |

Total: 14 active artifacts + 1 internal tooling + 1 demo-only = **16 registered artifacts**.

---

## Upgrade Path

| From | To | Blockers to clear |
|---|---|---|
| `alpha partial` → `alpha working` | sentra | Register `/api/sentra/risks` route in api-server |
| `alpha partial` → `alpha working` | lyte | Add `/lyte-command-center/` redirect alias |
| `alpha partial` → `alpha working` | terra | Configure Mapbox token |
| `alpha partial` → `alpha working` | vessels | AIS data provider integration |
| `alpha partial` → `alpha working` | command | Wire live CORTEX badge counts |
| `alpha working` → `live` | carlota-jo | Final security review + production data validation |
| `alpha working` → `live` | api-server | Live data sources + production mode + CI integration tests |

---

*Classification produced by runtime smoke test run 2026-04-26. Update after each major feature completion or infrastructure change.*
