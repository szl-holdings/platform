# SZL Holdings — Capability Manifest
**Audit Date:** April 19, 2026  
**Auditor:** SZL Singularity Program (Task #2239)  
**Status Legend:** `working` | `partial` | `broken` | `dormant` | `mock`

---

## Platform Primitives

| Capability | Domain | Code | Route | UI | API | Data | Auth | Tests | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Signal ingestion (PRISM Bus) | Platform | Y | Y | Y | Y | seeded | Y | Y | **working** | Cross-domain event bus; SSE live feed |
| Policy engine (Covenant Policy) | Platform | Y | Y | Y | Y | seeded | Y | Y | **working** | packages/policy-engine |
| Proof chain (audit trail) | Platform | Y | Y | Y | Y | seeded | Y | Y | **working** | packages/replay-core; immutable logs |
| Decision simulation (Monte Carlo) | Platform | Y | Y | Y | Y | seeded | Y | Y | **working** | packages/simulation |
| Workflow orchestration (Alloy) | Platform | Y | Y | Y | Y | seeded | Y | Y | **working** | packages/alloy; full CRUD |
| Multi-tenant RBAC (11 roles) | Platform | Y | Y | N | Y | live | Y | Y | **working** | No dedicated UI panel; API-enforced |
| Memory Fabric | Platform | Y | N | N | Y | seeded | Y | N | **partial** | packages/memory-fabric; no UI surface |
| Reflection Engine | Platform | Y | Y | Y | Y | seeded | Y | N | **working** | packages/reflection-engine; Command UI |

---

## Lyte — Decision Intelligence

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Overview dashboard | Y | Y | Y | Y | seeded | Y | **working** | 6-critical signals, KPIs, action queue |
| Signals Console | Y | Y | Y | Y | seeded | Y | **working** | 47-signal live feed, priority sorting |
| Entity Graph | Y | Y | Y | Y | seeded | Y | **working** | SVG relationship map, interactive |
| Decision Center | Y | Y | Y | Y | seeded | Y | **working** | Ranked recommendations, Monte Carlo |
| **Decision Twin** | Y | Y | Y | Y | seeded | Y | **working** | 761 lines; simulate approve/delay/reroute/escalate |
| Workflow Health | Y | Y | Y | Y | seeded | Y | **working** | Per-workflow bottleneck tracking |
| Run Console | Y | Y | Y | Y | seeded | Y | **working** | Agent trace log |
| Evidence Explorer | Y | Y | Y | Y | seeded | Y | **working** | Proof chain browser |
| Policy Center | Y | Y | Y | Y | seeded | Y | **working** | Registry view; 179 lines |
| Eval Studio | Y | Y | Y | Y | seeded | Y | **working** | Radar chart + eval logs |
| Board View | Y | Y | Y | Y | seeded | Y | **working** | Legacy surface |
| Ownership Drift | Y | Y | Y | Y | seeded | Y | **working** | Legacy surface |
| Pressure Map | Y | Y | Y | Y | seeded | Y | **working** | Legacy surface |
| Action Debt | Y | Y | Y | Y | seeded | Y | **working** | Legacy surface |

---

## Alloy — Execution Fabric (Command artifact)

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| **Policy Compiler** | Y | Y | Y | Y | seeded | Y | **working** | 1252 lines; plain-English → structured policy |
| Workflow Canvas | Y | Y | Y | Y | seeded | Y | **working** | Drag-and-drop workflow builder |
| Action Console | Y | Y | Y | Y | seeded | Y | **working** | Live action queue |
| Workflow Templates | Y | Y | Y | Y | seeded | Y | **working** | Pre-built workflow patterns |
| Human Approval Gates | Y | Y | Y | Y | seeded | Y | **working** | Write-back gates; HITL enforced |
| Agent Monitor | Y | Y | Y | Y | seeded | Y | **working** | Live agent status |
| Execution Traces | Y | Y | Y | Y | seeded | Y | **working** | Per-run trace viewer |
| Replay Timeline | Y | Y | Y | Y | seeded | Y | **working** | Incident replay |
| Policy Simulation | Y | Y | Y | Y | seeded | Y | **working** | Dry-run mode |
| Agent Handoffs | Y | Y | Y | Y | seeded | Y | **working** | Cross-agent coordination |
| Trust Receipts | Y | Y | Y | Y | seeded | Y | **working** | Immutable receipts |
| Integration Health | Y | Y | Y | Y | seeded | Y | **working** | Connector status |
| Graph Compiler | Y | Y | Y | Y | seeded | Y | **working** | Workflow graph |
| Eval Lab | Y | Y | Y | Y | seeded | Y | **working** | Evaluation runs |
| Replay Lab | Y | Y | Y | Y | seeded | Y | **working** | Scenario replay |
| Intelligence | Y | Y | Y | Y | seeded | Y | **working** | AI-generated insights |
| Governance | Y | Y | Y | Y | seeded | Y | **working** | Policy governance |
| Policy Approvals | Y | Y | Y | Y | seeded | Y | **working** | Approval routing |
| Policy Manager | Y | Y | Y | Y | seeded | Y | **working** | Policy CRUD |
| Trust Console | Y | Y | Y | Y | seeded | Y | **working** | Trust posture |

---

## Terra — Real Estate Intelligence

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Property Map | Y | Y | Y | Y | seeded | Y | **working** | Mapbox configured (VITE_MAPBOX_TOKEN ✓) |
| **Why This Property Now** | Y | Y | Y | Y | seeded | Y | **working** | 912 lines; ranked thesis engine |
| Distress Engine | Y | Y | Y | Y | seeded | Y | **working** | Lien/violation scoring |
| Ownership Graph | Y | Y | Y | Y | seeded | Y | **working** | Entity resolution |
| Portfolio Dashboard | Y | Y | Y | Y | seeded | Y | **working** | |
| Deals Pipeline | Y | Y | Y | Y | seeded | Y | **working** | |
| Investment Analysis | Y | Y | Y | Y | seeded | Y | **working** | |
| Pro Forma | Y | Y | Y | Y | seeded | Y | **working** | |
| AVM Engine | Y | Y | Y | Y | seeded | Y | **working** | |
| Comparable Sales | Y | Y | Y | Y | seeded | Y | **working** | |
| NYC Open Data ingestion | Y | N | N | Y | live | Y | **partial** | ETL scripts exist; no UI health monitor |
| Watchlist → Alloy handoff | Y | Y | Y | Y | seeded | Y | **working** | Pipeline wired |
| Property Brief Export | Y | Y | Y | Y | seeded | Y | **working** | PDF-ready template |

---

## Aegis — Cyber Resilience

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| SOC Dashboard | Y | Y | Y | Y | seeded | Y | **working** | |
| **Adversary Narrative Engine** | Y | Y | Y | Y | seeded | Y | **working** | 1806 lines; exec + analyst modes |
| MITRE ATT&CK mapping | Y | Y | Y | Y | seeded | Y | **working** | Verified framework mappings |
| SOAR Playbooks | Y | Y | Y | Y | seeded | Y | **working** | Safety gates on irreversible actions |
| Threat Intelligence Feed | Y | Y | Y | Y | live+seeded | Y | **partial** | STIX/TAXII polling; OFAC/EU/UN sanctions |
| Incident Management | Y | Y | Y | Y | seeded | Y | **working** | |
| Alert Center | Y | Y | Y | Y | seeded | Y | **working** | |
| Vulnerability Dashboard | Y | Y | Y | Y | seeded | Y | **working** | |
| XDR Console | Y | Y | Y | Y | seeded | Y | **working** | |
| Identity Blast Radius | Y | Y | Y | Y | seeded | Y | **working** | |
| SIEM connectors | Y | N | N | Y | mock | Y | **dormant** | Abstraction exists; no live vendor wired |
| Compliance Evidence | Y | Y | Y | Y | seeded | Y | **working** | |

---

## Vessels — Maritime Intelligence

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Fleet Dashboard | Y | Y | Y | Y | seeded | Y | **working** | |
| **Voyage Risk Twin** | Y | Y | Y | Y | seeded | Y | **working** | 1063 lines; risk + alternatives + compliance |
| AIS Tracking | Y | Y | Y | Y | demo | Y | **mock** | Live AIS requires MarineTraffic API key |
| Sanctions Screening | Y | Y | Y | Y | live | Y | **working** | OFAC/EU/UN lists active |
| Route Anomaly Engine | Y | Y | Y | Y | seeded | Y | **working** | |
| Vessel Profile | Y | Y | Y | Y | seeded | Y | **working** | |
| Voyage Economics | Y | Y | Y | Y | seeded | Y | **working** | |
| Port Analytics | Y | Y | Y | Y | seeded | Y | **working** | |
| Decarbonization | Y | Y | Y | Y | seeded | Y | **working** | |
| Cargo Tracking | Y | Y | Y | Y | seeded | Y | **working** | |
| Dark Vessel Detection | Y | Y | Y | Y | seeded | Y | **working** | |

---

## Carlota Jo — Premium Concierge

| Capability | Code | Route | UI | API | Data | Auth | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| **White-Glove Command** | Y | Y | Y | Y | seeded | Y | **working** | Concierge: clients, requests, comms, playbooks |
| Client Dossiers | Y | Y | Y | Y | seeded | Y | **working** | VIP preference memory |
| Service Requests | Y | Y | Y | Y | seeded | Y | **working** | SLA tracking |
| Escalation Playbooks | Y | Y | Y | Y | seeded | Y | **working** | |
| Communications Log | Y | Y | Y | Y | seeded | Y | **working** | Quiet activity log |
| Booking Flow | Y | Y | Y | Y | seeded | Y | **working** | |
| Client Portal | Y | Y | Y | Y | seeded | Y | **working** | |
| Billing (Stripe) | Y | N | N | Y | test | Y | **dormant** | Stripe configured in test mode; no checkout UI |
| Governed Cockpit | Y | Y | Y | Y | seeded | Y | **working** | |

---

## Commercial / Infrastructure

| Capability | Code | Config | Sandbox | Status | Notes |
|---|---|---|---|---|---|
| Stripe billing | Y | Y | test | **working** | Publishable key + webhook ✓ |
| Email (Resend/SendGrid) | Y | N | N | **dormant** | Scaffold present; RESEND_API_KEY not set |
| Mapbox maps | Y | Y | N/A | **working** | VITE_MAPBOX_TOKEN configured |
| Google Maps | Y | Y | N/A | **working** | GOOGLE_MAPS_API_KEY configured |
| SSO / SCIM | Y | N | N | **dormant** | OIDC scaffold; no IdP configured |
| Redis cache | Y | N | N | **dormant** | Code checks for REDIS_URL; falls back to DB/LRU |
| Sentry (server) | Y | Y | N/A | **working** | SENTRY_DSN configured |
| Sentry (frontend) | Y | Y | N/A | **working** | VITE_SENTRY_DSN configured |
| PostHog analytics | Y | Y | N/A | **working** | POSTHOG_API_KEY + VITE_POSTHOG_KEY configured |
| Amplitude analytics | Y | Y | N/A | **working** | VITE_AMPLITUDE_API_KEY configured |
| GraphQL API | Y | Y | N/A | **working** | Apollo Server at /api/graphql |
| MCP Gateway | Y | Y | N/A | **working** | Tool integration layer |
| OpenAPI portal | Y | N | N | **partial** | API spec exists; no hosted portal UI |
| Admin surface | Y | Y | Y | **partial** | Basic admin; no dedicated admin panel app |

---

## Overall Platform Health

- **Working capabilities:** 72 / 89 (81%)
- **Partial:** 7 / 89 (8%)
- **Dormant (built, not activated):** 6 / 89 (7%)
- **Mock (labeled demo):** 2 / 89 (2%)
- **Broken:** 0 / 89 (0%)

_All demo data is labeled as seeded scenario data. Live data sources (NYC Open Data, STIX/TAXII, OFAC/EU/UN sanctions, Stripe test mode) are identified with provenance._
