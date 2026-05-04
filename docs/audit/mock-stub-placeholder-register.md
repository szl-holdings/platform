# SZL Holdings — Mock, Stub, and Placeholder Register

**Date:** April 16, 2026
**Purpose:** Catalog every known mock, stub, placeholder, and hardcoded demo value across the platform — with location and recommended disposition

---

## Classification

| Class | Meaning |
|---|---|
| **Seeded** | Data loaded via seed scripts into the real database; real structure, simulated values |
| **Hardcoded** | Values baked into source code (React components, route handlers) — not in the DB |
| **Mocked endpoint** | API route returns fabricated data rather than querying the DB |
| **Stub integration** | External service call is stubbed out — no real API key or live call |
| **Placeholder UI** | UI element shows static text, empty states, or "Coming soon" panels |
| **Demo badge** | UI explicitly labeled Demo / Pilot / Live — by design |

---

## 1. Dashboard Data — Seeded / Simulated (By Domain)

### 1.1 Lyte — Business Observability

| Item | Location | Class | Status |
|---|---|---|---|
| Business metrics (revenue, pipeline, headcount) | Seeds / `scripts/seed-demo-data.ts` | Seeded | By design — pre-commercial |
| Client satisfaction scores | `artifacts/szl-holdings` (Forge module) | Hardcoded | Needs live survey data — see backlog |
| Autopilot header stats (genome score, job count) | `artifacts/szl-holdings` | Hardcoded | Needs live API wiring — see backlog |
| PRISM scores | Seeds | Seeded | By design |
| Approval latency metrics | Seeds | Seeded | By design |
| BLS unemployment feed | `lib/intelligence-feeds` | **Live** | Active — real data |
| GitHub Trending | `lib/intelligence-feeds` | **Live** | Active — real data |
| TechCrunch / The Verge RSS | `lib/intelligence-feeds` | **Live** | Active — real data |

### 1.2 Aegis / Firestorm — Security

| Item | Location | Class | Status |
|---|---|---|---|
| SIEM event logs | Seeds / `scripts/seed-demo-data.ts` | Seeded | Simulated — no live SIEM connector |
| Threat intelligence feed content | Seeds | Seeded | CISA KEV / NVD / MITRE ATT&CK pull real data but scenario data is seeded |
| Incident tickets | Seeds | Seeded | |
| SOC analyst workload metrics | Seeds | Seeded | |
| CISA KEV catalog | `lib/intelligence-feeds` | **Live** | 1,554+ entries, live pull |
| NVD CVE database | `lib/intelligence-feeds` | **Live** | Real CVE search |
| MITRE ATT&CK Enterprise Matrix v14 | `lib/intelligence-feeds` | **Live** | Live GitHub pull |
| AbuseIPDB IP reputation | `lib/intelligence-feeds` | **Live** | Real data |
| MSP client list | Seeds | Seeded | |
| RMM device inventory | Seeds / `artifacts/aegis` pages | Seeded + Placeholder UI | New modules not yet DB-connected |
| CISO Executive Dashboard KPIs | `artifacts/aegis` | Placeholder UI | Not yet wired to live aggregate data — see backlog |
| New security modules (8 modules) | `artifacts/aegis/src/pages/` | Placeholder UI | UI built; not wired to live API or case management |

### 1.3 Vessels — Maritime Intelligence

| Item | Location | Class | Status |
|---|---|---|---|
| AIS vessel positions | Seeds / API routes | Seeded (simulated positions) | No live AIS subscription |
| Voyage P&L calculations | Seeds | Seeded | Simulated economics |
| Freight rate benchmarks | Seeds | Seeded | See backlog — needs market context |
| Dark vessel detection events | Seeds | Seeded | |
| Sanctions screening results | Seeds | Seeded | OFAC list referenced but not live-queried per vessel |
| Fleet telemetry | Seeds | Seeded | |
| NOAA CO-OPS station data | `lib/intelligence-feeds` | **Live** | Real wind/temp data |
| Open-Meteo Marine Forecast | `lib/intelligence-feeds` | **Live** | Real marine conditions |
| GDELT Geopolitical Events | `lib/intelligence-feeds` | **Live** | Real geopolitical signals |
| Vessels insurance module | `artifacts/vessels/src/pages/` | Placeholder UI | New module — not connected to DB/API |
| Vessels trading module | `artifacts/vessels/src/pages/` | Placeholder UI | New module — not connected |
| Vessels platform module | `artifacts/vessels/src/pages/` | Placeholder UI | New module — not connected |

### 1.4 Terra — Real Estate Intelligence

| Item | Location | Class | Status |
|---|---|---|---|
| NYC Open Data distress pipeline | `artifacts/api-server/src/routes/terra-live.ts` | **Live** | Real public data |
| Portfolio performance metrics | Seeds | Seeded | |
| Broker CRM data | Seeds | Seeded | |
| Market trends (non-NYC) | Seeds | Seeded | |
| Census ACS demographics | `lib/intelligence-feeds` | **Live** | Real data |
| BLS employment data | `lib/intelligence-feeds` | **Live** | Real data |
| FEMA National Risk Index | `lib/intelligence-feeds` | **Live** | Real data |
| SEC EDGAR REIT filings | `lib/intelligence-feeds` | **Live** | Real data |

### 1.5 Alloy / Command

| Item | Location | Class | Status |
|---|---|---|---|
| Workflow completion metrics | Seeds | Seeded | |
| Agent performance metrics | Seeds | Seeded | |
| Cross-domain KPIs | Seeds | Seeded | |
| Command Overview dashboard KPIs | `artifacts/command` | Placeholder UI | New modules not yet wired — see backlog |
| CORTEX badge counts | `artifacts/command` | Stub | Cross-domain badge counts not wired to live API signals — see backlog |

### 1.6 Carlota Jo — Advisory

| Item | Location | Class | Status |
|---|---|---|---|
| World Bank GDP indicators | `lib/intelligence-feeds` | **Live** | Real data |
| BLS employment | `lib/intelligence-feeds` | **Live** | Real data |
| HBR RSS | `lib/intelligence-feeds` | **Live** | Real data |
| Microsoft Outlook Calendar | Connector | **Live** | Real availability |
| Client engagement history | Seeds | Seeded | |
| Advisory session notes | Seeds | Seeded | |

---

## 2. Hardcoded / Inline Values in Source Code

| Item | Class | Location | Disposition |
|---|---|---|---|
| Demo badge labels ("Demo", "Pilot", "Live") | Demo badge | Various artifact components | **Keep** — by design; clearly labeled |
| Hardcoded genome score | Hardcoded | `artifacts/szl-holdings` Autopilot header | Wire to live API — see backlog |
| Hardcoded job count | Hardcoded | `artifacts/szl-holdings` Autopilot header | Wire to live API — see backlog |
| Hardcoded client satisfaction scores | Hardcoded | Forge client module | Wire to live survey data — see backlog |
| Simulated AIS coordinates in route handlers | Mocked endpoint | `artifacts/api-server/src/routes/vessels-live.ts` | Replace with real AIS subscription |

---

## 3. Stub Integrations (No Active Credentials)

| Integration | Location | Class | Blocker |
|---|---|---|---|
| Stripe billing | `artifacts/api-server/src/routes/billing.ts` | Stub integration | No `STRIPE_SECRET_KEY` configured — demo mode |
| Transactional email (Resend) | `lib/services` email module | Stub integration | No `RESEND_API_KEY` — silent drop |
| Mapbox maps | Vessels, Terra frontend | Stub integration | No `MAPBOX_ACCESS_TOKEN` — map views blank |
| Sentry error tracking | Not configured | Stub integration | No `SENTRY_DSN` — errors console-only |
| Live AIS provider (MarineTraffic, AISHub) | `lib/intelligence-feeds` | Stub integration | No API subscription or key |
| Azure AD SSO / SCIM | `artifacts/api-server/src/routes/scim.ts` | Stub integration | Code exists; needs tenant admin consent |
| Power BI embedded analytics | Various | Stub integration | Code exists; needs per-tenant Power BI workspace token |
| Redis session store | API server session config | Stub integration | No `AZURE_REDIS_CONNECTION_STRING` — in-memory fallback |
| SendGrid | `lib/services` | Stub integration | No `SENDGRID_API_KEY` — not the canonical email path |
| Slack bot | Various | Stub integration | No `SLACK_BOT_TOKEN` |
| Twilio SMS | Various | Stub integration | No `TWILIO_ACCOUNT_SID` |
| Google OAuth | `artifacts/carlota-jo` | Stub integration | No `GOOGLE_CLIENT_ID` |
| Notion | `artifacts/aegis` | Stub integration | No `NOTION_API_KEY` |

---

## 4. Seed Scripts

All seed scripts in `scripts/` are **intentionally seeded** for pre-commercial demo operation. They are idempotent (`onConflictDoNothing`). Known issues:

| Script | Status | Notes |
|---|---|---|
| `scripts/seed-demo-data.ts` | Working | General platform seed |
| `scripts/seed-demo-canonical.sh` | Working | Canonical demo seed |
| `scripts/seed-pilot-data.ts` | Working | Pilot org seed |
| `scripts/seed-prism-counsel.ts` | **Known issue** | Recovery tables seed broken — see backlog |
| `scripts/seed-ecosystem.ts` | Working | Ecosystem data |
| `scripts/seed-marine-extended.ts` | Working | Maritime data |
| `scripts/seed-governance.ts` | Working | Governance/audit data |
| `scripts/seed-carlota-clients.ts` | Working | Advisory client data |
| `scripts/seed-holdings-fundops.ts` | Working | Holdings fund operations |
| `scripts/seed-agent-os.ts` | Working | Agent OS data |
| `scripts/seed-audit-logs.ts` | Working | Audit trail seed |
| `scripts/seed-stephen.ts` | Working | Founder identity data |
| `scripts/seed-distribution-os.ts` | Working | Distribution OS seed |
| `scripts/seed-pilot-org.ts` | Working | Pilot organization |

---

## 5. Placeholder UI Panels

The following UI surfaces are built but not yet wired to live data or back-end APIs:

| Surface | Artifact | Notes |
|---|---|---|
| CORTEX cross-domain badge counts | `artifacts/command` | See backlog |
| Autopilot header stats | `artifacts/szl-holdings` | See backlog |
| CISO Executive Dashboard | `artifacts/aegis` | 8 new security module KPIs not yet aggregated |
| New Aegis security modules (8) | `artifacts/aegis` | UI complete; not connected to case management APIs |
| Vessels new commercial modules (3) | `artifacts/vessels` | UI complete; not connected to DB/API |
| Command Overview KPIs | `artifacts/command` | Not yet wired to Vessels/Firestorm new modules |

---

*Part of growth capital Cleanup — Phase 1 audit. April 2026.*
