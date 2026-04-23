# Platform Production Audit — Route & Integration Inventory

**Date:** April 22, 2026  
**Scope:** All 14 registered artifacts + API Server  
**Methodology:** Source code walkthrough of every artifact's `App.tsx` routes, sidebar nav definitions, API route groups, and data-source files. Cross-referenced against `docs/audit/GAP_MATRIX.md`, `docs/audit/MOCK_AND_STUB_REGISTER.md`, and `docs/ops/gap-register.md`.

> **Status key:**  
> `REAL` = Backed by live DB / external API with real credentials  
> `PARTIAL` = Core backed by DB/API; some sub-features stubbed or seeded  
> `SEED` = Idempotent seeded data; server-authoritative but not live external feed  
> `STUB` = UI complete; backend route exists but returns hardcoded or empty data  
> `MISSING` = Nav item / page exists with no backend connection at all  
> `INTERNAL` = Not a customer-facing surface  
>  
> **Disposition key:**  
> `KEEP-REAL` = Confirmed working against real data  
> `KEEP-SEED` = Seeded data acceptable pre-revenue; labeled in UI  
> `KEEP-FLAG` = Kept behind `DEMO_MODE` / feature flag; labeled when inactive  
> `REMOVE` = Removed from nav/routing  
> `WIRE` = Needs connection to real backend (identified in Notes)

---

## 1. API Server (`artifacts/api-server`)

| Route Group | Backing | Status | Disposition | Notes |
|-------------|---------|--------|-------------|-------|
| `/api/auth` / `/api/oidc` | Replit OIDC + PostgreSQL sessions | REAL | KEEP-REAL | Sessions in DB via Drizzle; sliding-window refresh |
| `/api/health` / `/api/healthz` | Live DB probe + service checks | REAL | KEEP-REAL | Detailed endpoint probes all registered services |
| `/api/status` (public) | Live DB probe | REAL | KEEP-REAL | `public-status.ts` records live health checks |
| `/api/vessels/*` | PostgreSQL + tenant scope | REAL | KEEP-REAL | All fleet/cargo/route routes tenant-scoped via `tenantScope({ required: true })` |
| `/api/sentra/*` | PostgreSQL | REAL | KEEP-REAL | Incidents and alerts CRUD; in-memory fallback removed |
| `/api/terra/*` | PostgreSQL + NYC Open Data pipeline | PARTIAL | KEEP-FLAG | Distress pipeline live; broker CRM seeded; enrichment job scheduled |
| `/api/lyte/*` | PostgreSQL (seeded) | SEED | KEEP-SEED | Business metrics seeded at startup via `seed-demo-data.ts`; no live infra connector |
| `/api/counsel/*` / `/api/prism-counsel-*` | PostgreSQL | PARTIAL | KEEP-REAL | Matter CRUD real; court filing stubs (`prism-counsel-court.ts`) not active |
| `/api/aegis/*` | PostgreSQL (seeded) | SEED | KEEP-SEED | SIEM events seeded; SOAR webhook stubs exist |
| `/api/alloy/*` | PostgreSQL + AI gateway | PARTIAL | KEEP-REAL | Chat, KB, approvals real; policy LLM wired to AI gateway |
| `/api/billing/*` | Stripe (test mode) | PARTIAL | KEEP-FLAG | Flag: `live_stripe_billing_enabled=false`; test-mode Stripe wired |
| `/api/booking/*` | PostgreSQL | REAL | KEEP-REAL | Carlota Jo time-tracking and invoicing real |
| `/api/agent-mesh/*` | PostgreSQL | REAL | KEEP-REAL | Mesh telemetry read-only; scan endpoints public |
| `/api/geo-intel/*` | PostgreSQL | REAL | KEEP-REAL | Live-mutating GeoPin data |
| `/api/briefings/*` / `/api/pulse/*` | AI gateway + PostgreSQL | PARTIAL | KEEP-FLAG | Briefing generation wired to AI gateway; live retrieval partial |
| `/api/webhooks/*` | PostgreSQL + SSRF guard | REAL | KEEP-REAL | SSRF validation wired (P1-006 CLOSED) |
| `/api/admin/seed/*` | Seed scripts | INTERNAL | KEEP-REAL | Production-gated via `seedProductionGuard` |
| `/api/analytics-engine/*` | PostgreSQL | REAL | KEEP-REAL | Public anonymous ingest working |
| `/api/simulation/*` | In-process Monte Carlo | PARTIAL | KEEP-REAL | What-if engine is in-process; no external model |
| `/api/ot-ics/*` | Stub | STUB | KEEP-FLAG | OT/ICS decoder routes exist; live protocol feed not wired (separate task) |
| Seed-overwrite risk | `seed-guard.ts` | REAL | KEEP-REAL | Production guard returns 404 on `/seed` routes in `NODE_ENV=production` |
| OTEL export | OTEL + env var | PARTIAL | KEEP-FLAG | Flag: `live_otel_export_enabled=false`; exports to local only; requires `OTEL_EXPORTER_OTLP_ENDPOINT` |
| Email delivery | Resend | PARTIAL | KEEP-FLAG | Flag: `live_email_delivery_enabled=false`; drops silently with log warning until `RESEND_API_KEY` set |

---

## 2. Sentra — Cyber Resilience Command (`artifacts/sentra`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/sentra/` — Dashboard | `/api/sentra/summary` | REAL | KEEP-REAL | Live incident/alert counts from DB |
| `/sentra/incidents` — Incident Commander | `/api/sentra/incidents` | REAL | KEEP-REAL | Full CRUD; create/update/resolve working |
| `/sentra/alerts` — Alerts | `/api/sentra/alerts` | REAL | KEEP-REAL | Acknowledge/suppress working |
| `/sentra/resilience-scorecard` — Scorecard | `/api/sentra/summary` | PARTIAL | KEEP-SEED | Score derived from seeded incidents |
| `/sentra/threat-overview` — Threat Overview | MITRE ATT&CK mapping | PARTIAL | KEEP-SEED | Live MITRE stage from incident data; threat count seeded |
| `/sentra/asset-risk-graph` — Asset Risk | `/api/agent-mesh` | PARTIAL | KEEP-SEED | Mesh node topology real; risk scores derived |
| `/sentra/recovery-readiness` — Recovery | DB | PARTIAL | KEEP-SEED | Recovery runbook data seeded |
| `/sentra/exposure-board` — Exposure | DB | PARTIAL | KEEP-SEED | Exposure calculations from seeded data |
| `/sentra/control-drift` — Control Drift | DB | PARTIAL | KEEP-SEED | Drift metrics seeded |
| `/sentra/decision-center` — Decision Center | `/api/approvals` | REAL | KEEP-REAL | Approval workflow live |
| `/sentra/trust-provenance` — Trust | `/api/proof-chain` | REAL | KEEP-REAL | Attribution chain real |
| `/sentra/approvals` — Approvals | `/api/approvals` | REAL | KEEP-REAL | Full approval CRUD |
| `/sentra/mesh-map` — Mesh Map | `/api/agent-mesh` | REAL | KEEP-REAL | Live agent mesh telemetry |
| `/sentra/mesh-exposures` | `/api/agent-mesh` | REAL | KEEP-REAL | Live mesh exposure data |
| `/sentra/mesh-drift` | `/api/agent-mesh` | REAL | KEEP-REAL | |
| `/sentra/mesh-connectors` | `/api/agent-mesh` | REAL | KEEP-REAL | |
| `/sentra/containment-rules` | DB | PARTIAL | KEEP-SEED | Rule config real; enforcement simulation |
| External SIEM/XDR feed | Missing credential | STUB | KEEP-FLAG | No `SIEM_API_KEY` configured; flag `live_ais_feed_enabled` is vessel-specific; Sentra relies on seeded incidents |

---

## 3. Counsel — Legal Matter Command (`artifacts/counsel`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/counsel/` — Dashboard | `/api/counsel/matters` | REAL | KEEP-REAL | Matter list from DB |
| `/counsel/matters` — Matter Overview | `/api/counsel/matters` | REAL | KEEP-REAL | Full CRUD |
| `/counsel/obligations` — Obligation Timeline | `/api/counsel/obligations` | REAL | KEEP-REAL | Obligation tracking real |
| `/counsel/dependency-graph` — Dependency Graph | `/api/counsel/dependencies` | REAL | KEEP-REAL | Graph rendering from live data |
| `/counsel/performance` — Counsel Performance | `/api/counsel/performance` | PARTIAL | KEEP-SEED | KPI aggregation seeded |
| `/counsel/risk-exposure` — Risk Exposure Desk | `/api/counsel/risk` | PARTIAL | KEEP-SEED | Risk scoring seeded |
| `/counsel/decision-center` | `/api/approvals` | REAL | KEEP-REAL | |
| `/counsel/alerts` | `/api/alerts` | REAL | KEEP-REAL | |
| `/counsel/approvals` | `/api/approvals` | REAL | KEEP-REAL | |
| `/counsel/trust-provenance` | `/api/proof-chain` | REAL | KEEP-REAL | |
| `/counsel/aef-search` | `/api/rag-knowledge` | REAL | KEEP-REAL | RAG search working |
| Court filing integration | `prism-counsel-court.ts` | STUB | KEEP-FLAG | Court filing endpoint exists; no live court API credential |
| NY public records | `prism-counsel-ny.ts` | PARTIAL | KEEP-REAL | NYC court data wired; enrichment runs on schedule |

---

## 4. Command — Unified Command (`artifacts/command`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/command/` — Overview | `/api/command` | PARTIAL | KEEP-SEED | Domain health cards seeded (Aegis 91, Vessels 87, etc.) |
| `/command/strategy` | `/api/command` | PARTIAL | KEEP-SEED | Strategy metrics seeded |
| `/command/operations` | `/api/command` | PARTIAL | KEEP-SEED | Ops metrics from DB |
| `/command/geospatial` | `/api/geo-intel` | REAL | KEEP-REAL | GeoPin data live-mutating |
| `/command/convergence` | `/api/cross-platform` | REAL | KEEP-REAL | Cross-domain convergence signals real (separate task: make cards clickable) |
| `/command/counterfactual` | `/api/simulation` | PARTIAL | KEEP-REAL | Monte Carlo in-process; no external model |
| `/command/competitive-atlas` | `/api/competitive-intel` | PARTIAL | KEEP-SEED | Competitive intel seeded |
| `/command/export-history` | DB | PARTIAL | KEEP-REAL | Export log real; download delivery not wired to object storage |
| CORTEX cross-domain badge counts | `/api/cross-platform` | PARTIAL | KEEP-SEED | Badge counts not wired to live signal API (HC-005) |

---

## 5. Pulse — AI Executive Briefing (`artifacts/pulse`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/pulse/` — Today's Brief | `/api/briefings` | PARTIAL | KEEP-FLAG | Content generated via AI gateway; retrieval not fully grounded in live signals |
| `/pulse/briefing-engine` | `/api/briefings` | PARTIAL | KEEP-FLAG | AI gateway wired; live threshold signals partial |
| `/pulse/library` | DB | REAL | KEEP-REAL | Historical briefing archive real |
| `/pulse/confidence-dashboard` | DB | PARTIAL | KEEP-SEED | Confidence scores derived from seeded data |
| `/pulse/custom-brief` | `/api/briefings` | PARTIAL | KEEP-FLAG | Custom brief generation via AI gateway |
| `/pulse/dissent-channel` | DB | REAL | KEEP-REAL | Dissent records persistent |
| `/pulse/constellation` | `/api/agent-mesh` | REAL | KEEP-REAL | Agent mesh constellation real |
| `/pulse/system-health` | `/api/health` | REAL | KEEP-REAL | Live health probe |
| `/pulse/governed-cockpit` | DB | PARTIAL | KEEP-SEED | |
| PDF export | Not implemented | MISSING | KEEP-FLAG | PL-007: PDF export not implemented |
| Email subscription | Not implemented | MISSING | KEEP-FLAG | PL-008: Email subscription not implemented |
| Live AI briefing | AI gateway partial | PARTIAL | KEEP-FLAG | PL-006: Briefing uses AI gateway but retrieval grounding incomplete |

---

## 6. Aegis — SZL Holdings Investor Pitch Deck (`artifacts/aegis`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/aegis/` — Landing | Static content | REAL | KEEP-REAL | Pitch deck static content |
| `/aegis/soc-overview` | DB (seeded) | SEED | KEEP-SEED | SOC metrics seeded |
| `/aegis/incident-response` | DB (seeded) | SEED | KEEP-SEED | Incidents seeded |
| `/aegis/threat-intelligence` | MITRE ATT&CK (live) | PARTIAL | KEEP-REAL | Live MITRE feed wired |
| `/aegis/compliance` | DB | PARTIAL | KEEP-SEED | Compliance controls seeded |
| `/aegis/governance` | DB | PARTIAL | KEEP-SEED | |
| `/aegis/trust-positioning` | Static | REAL | KEEP-REAL | Trust positioning static content |
| `/aegis/phantom-tabletop` | AI gateway | PARTIAL | KEEP-FLAG | Tabletop AI scenario generation uses AI gateway |
| 8 new security modules | DB (seeded) | SEED | KEEP-SEED | CISO dashboard KPIs not aggregated from live feeds (PL-001, PL-002) |
| SOAR backend | Stub webhook | STUB | KEEP-FLAG | SOAR action webhook exists but no external SOAR credential |

---

## 7. Terra — Real Estate Intelligence (`artifacts/terra`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/terra/` — Dashboard | NYC Open Data + DB | REAL | KEEP-REAL | Live distress pipeline active |
| `/terra/distress` — Distress Map | NYC Open Data + Mapbox | PARTIAL | KEEP-FLAG | NYC data live; Mapbox tiles blank without `MAPBOX_ACCESS_TOKEN` (P1-004) |
| `/terra/portfolio` | DB (seeded) | SEED | KEEP-SEED | Portfolio performance seeded (SD-010) |
| `/terra/broker-crm` | DB (seeded) | SEED | KEEP-SEED | Broker CRM seeded (SD-011) |
| `/terra/market-trends` | DB (seeded) | SEED | KEEP-SEED | Market trend data seeded |
| `/terra/listings` | DB | PARTIAL | KEEP-REAL | Property listings from DB |
| `/terra/commercial-intelligence` | DB (seeded) | SEED | KEEP-SEED | Commercial intel seeded |
| `/terra/spatial-walkthrough` | ATLAS runtime | PARTIAL | KEEP-FLAG | Spatial runtime wired; scene data seeded |
| `/terra/scenario-branches` | DB | PARTIAL | KEEP-FLAG | Scenario forge wired; branch data seeded |
| Owner names / lien amounts | NYC Open Data | REAL | KEEP-REAL | Live enrichment job runs on schedule |
| Mapbox token | Missing credential | STUB | KEEP-FLAG | Must set `VITE_MAPBOX_TOKEN` / `MAPBOX_ACCESS_TOKEN` for maps to render |

---

## 8. Vessels — Maritime Intelligence (`artifacts/vessels`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/vessels/` — Fleet Dashboard | DB (seeded AIS) | SEED | KEEP-SEED | Fleet positions seeded; AIS feed off by feature flag |
| `/vessels/ais-tracking` | DB (seeded AIS) | SEED | KEEP-FLAG | `live_ais_feed_enabled=false`; flag: AIS simulated |
| `/vessels/cargo-tracking` | DB | REAL | KEEP-REAL | Cargo records tenant-scoped from DB |
| `/vessels/route-planning` | DB | REAL | KEEP-REAL | Route CRUD from DB |
| `/vessels/dark-vessel` | DB (seeded) | SEED | KEEP-SEED | Dark vessel detections seeded (SD-009) |
| `/vessels/piracy-sanctions` | DB + sanctions DB | PARTIAL | KEEP-REAL | Sanctions screening from DB |
| `/vessels/sanctions-screening` | DB | REAL | KEEP-REAL | |
| `/vessels/exceptions-center` | DB | REAL | KEEP-REAL | Exceptions from DB |
| `/vessels/alert-center` | DB | REAL | KEEP-REAL | Alerts from DB |
| `/vessels/command-workflows` | DB | REAL | KEEP-REAL | Workflow CRUD from DB |
| `/vessels/simulations` | In-process | PARTIAL | KEEP-REAL | Simulation engine in-process |
| `/vessels/logs-explorer` | DB | REAL | KEEP-REAL | Audit log from DB |
| `/vessels/audit-log` | DB | REAL | KEEP-REAL | |
| `/vessels/intelligence-briefs` | `/api/briefings` | PARTIAL | KEEP-FLAG | AI-generated briefs via AI gateway |
| `/vessels/blockchain-bol` | DB | PARTIAL | KEEP-SEED | Bill of lading seeded |
| `/vessels/atlas-execute` | ATLAS runtime | PARTIAL | KEEP-FLAG | ATLAS scene execution wired |
| `/vessels/atlas-artifacts` | DB | REAL | KEEP-REAL | |
| `/vessels/aef-search` | `/api/rag-knowledge` | REAL | KEEP-REAL | |
| Insurance module | DB (not wired) | STUB | KEEP-FLAG | PL-003: UI complete; DB routes exist but not fully connected |
| Trading module | DB (not wired) | STUB | KEEP-FLAG | PL-004: UI complete; routes not fully connected |
| Platform module | DB (not wired) | STUB | KEEP-FLAG | PL-005: UI complete; not connected |
| Helmsman AI | `/api/alloy` | PARTIAL | KEEP-REAL | Alloy copilot config exists; full Helmsman AI not live |
| Tenant scoping | `tenantScope({ required: true })` | REAL | KEEP-REAL | AF-003 CLOSED: all fleet/cargo routes scoped |

---

## 9. Lyte Command Center (`artifacts/lyte-command-center`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/lyte/` — Overview | DB (seeded) | SEED | KEEP-SEED | Business metrics seeded |
| `/lyte/signals-console` | DB | REAL | KEEP-REAL | Signal CRUD from DB |
| `/lyte/decision-center` | `/api/approvals` | REAL | KEEP-REAL | Approvals live |
| `/lyte/decision-twin` | DB | PARTIAL | KEEP-SEED | Decision twin from DB; live infra not connected |
| `/lyte/entity-graph` | DB | REAL | KEEP-REAL | Entity relationships from DB |
| `/lyte/workflow-health` | DB | REAL | KEEP-REAL | Workflow state from DB |
| `/lyte/run-console` | DB | REAL | KEEP-REAL | Run history from DB |
| `/lyte/evidence-explorer` | DB | REAL | KEEP-REAL | Evidence from DB |
| `/lyte/policy-center` | DB | REAL | KEEP-REAL | Policy CRUD from DB |
| `/lyte/eval-studio` | DB + AI gateway | PARTIAL | KEEP-REAL | Eval running; AI grading via gateway |
| `/lyte/brief` | `/api/briefings` | PARTIAL | KEEP-FLAG | Briefing partial (see Pulse) |
| `/lyte/board-view` | DB | PARTIAL | KEEP-SEED | Board metrics seeded |
| `/lyte/action-debt` | DB | REAL | KEEP-REAL | Action debt from DB |
| AIOps infra connectors | Missing credentials | STUB | KEEP-FLAG | Datadog/CloudWatch connectors exist; no credentials configured |
| Simulated collector path | `collector.ts` | STUB | KEEP-FLAG | Collector simulation present; not in production builds |
| Role-based views | Feature flag | STUB | KEEP-FLAG | `lyte_role_views_enabled=false` |

---

## 10. SZL Holdings Dashboard (`artifacts/szl-holdings`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/` — Landing | Static + live feeds | REAL | KEEP-REAL | World Bank, BLS, Microsoft live feeds |
| `/status` | `/api/status` | REAL | KEEP-REAL | Live health probes for all services |
| `/trust-center/status` | `/api/status` | REAL | KEEP-REAL | |
| `/command-center` | Cross-artifact | REAL | KEEP-REAL | Links to all artifacts |
| `/forge` | DB | REAL | KEEP-REAL | Agent forge operational |
| `/lyte` | DB (seeded) | SEED | KEEP-SEED | |
| `/alloy` | DB + AI gateway | PARTIAL | KEEP-REAL | Alloy workflows real |
| `/admin` | DB | REAL | KEEP-REAL | Admin routes auth-gated |
| Developer API samples | `/api/v1/*` | PARTIAL | KEEP-FLAG | API docs present; endpoints exist but some samples reference stub routes |
| Investor data room | DB + OIDC | REAL | KEEP-REAL | Auth-gated with session; MFA not yet enforced (P1-007) |
| Autopilot header genome score | Hardcoded | STUB | KEEP-SEED | HC-001: Static; labeled as demo |
| HC-002 Autopilot job count | Hardcoded | STUB | KEEP-SEED | Static number; polish |

---

## 11. SZL Holdings Mobile — CORTEX (`artifacts/szl-holdings-mobile`)

| Screen / Deep Link | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| Auth / login | Replit OIDC | REAL | KEEP-REAL | Auth context wired |
| Dashboard | `/api` | PARTIAL | KEEP-SEED | Dashboard metrics seeded |
| Vessels feed | `/api/vessels` | REAL | KEEP-REAL | Fleet data from tenant-scoped API |
| Terra map | Mapbox | PARTIAL | KEEP-FLAG | Mapbox token required for map tiles |
| Sentra alerts | `/api/sentra` | REAL | KEEP-REAL | Alerts from API |
| Offline sync | IndexedDB | PARTIAL | KEEP-REAL | Offline engine wired; full sync coverage partial |
| Push notifications | DB | REAL | KEEP-REAL | Push token registration and delivery wired |
| Firebase credentials | Placeholder | STUB | KEEP-FLAG | P0-001: Credential files are placeholders; must rotate |

---

## 12. Carlota Jo Consulting (`artifacts/carlota-jo`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| `/carlota-jo/` — Home | Static + live feeds | REAL | KEEP-REAL | World Bank, BLS live feeds |
| `/carlota-jo/booking` | DB + Outlook Calendar | REAL | KEEP-REAL | Booking integration live |
| `/carlota-jo/services` | Static | REAL | KEEP-REAL | |
| `/carlota-jo/insights` | DB + external | REAL | KEEP-REAL | |
| `/carlota-jo/expert-network` | DB (seeded) | SEED | KEEP-SEED | Expert network seeded; marketplace not live |
| Stripe billing | Test mode | PARTIAL | KEEP-FLAG | P1-001: `live_stripe_billing_enabled=false`; test mode |
| Google OAuth | Missing credential | STUB | KEEP-FLAG | ST-009: `GOOGLE_CLIENT_ID` not set |
| Expert Marketplace | Seeded | SEED | KEEP-SEED | No real marketplace backend |

---

## 13. NEXUS / Mockup Sandbox (`artifacts/mockup-sandbox`)

| Route / Page | Backing | Status | Disposition | Notes |
|---|---|---|---|---|
| All routes | Local component library | INTERNAL | KEEP-REAL | Design system preview; not customer-facing |
| Production routing | Not exposed | REAL | KEEP-REAL | Preview path `/nexus/` is dev-only sandbox |

---

## 14. SZL Demo Video (`artifacts/szl-demo-video`)

| Item | Status | Disposition | Notes |
|---|---|---|---|
| Video reel | Pre-rendered | REAL | KEEP-REAL | Static video artifact; should be re-rendered once all UI hardening lands |

---

## External Integration Status

| Integration | Feature Flag | Secret Required | Status |
|---|---|---|---|
| Stripe (live billing) | `live_stripe_billing_enabled` | `STRIPE_SECRET_KEY` (sk_live_) | OFF — test mode only |
| Resend (email) | `live_email_delivery_enabled` | `RESEND_API_KEY` | OFF — silently drops |
| AIS feed | `live_ais_feed_enabled` | `AIS_API_KEY` | OFF — simulated positions |
| OTEL export | `live_otel_export_enabled` | `OTEL_EXPORTER_OTLP_ENDPOINT` | OFF — local traces only |
| Mapbox tiles | `live_mapbox_tiles_enabled` | `MAPBOX_ACCESS_TOKEN` | OFF — maps blank |
| Azure AD SSO/SCIM | none | `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID` | STUB |
| Slack bot | none | `SLACK_BOT_TOKEN` | STUB |
| HubSpot CRM | none | `HUBSPOT_ACCESS_TOKEN` | STUB (mock fallback active) |
| Salesforce | none | `SALESFORCE_*` | STUB (mock fallback active) |
| Datadog / CloudWatch | none | `DATADOG_API_KEY` | STUB |
| Court filing (NY courts) | none | Court API credential | STUB |
| SOAR (Aegis) | none | SOAR webhook secret | STUB |

---

*Next: See `docs/audit/report.md` for consolidated findings, dispositions, and production readiness assessment.*
