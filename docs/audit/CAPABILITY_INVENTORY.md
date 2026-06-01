# Capability Inventory — SZL Holdings Platform

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Status:** AUTHORITATIVE — synthesized from Series A audit + launch-readiness audit  
**Machine-readable:** `docs/audit/capability-inventory.json`

---

## Inventory Methodology

Each capability is assigned:
- **ID** — stable reference key
- **Domain** — owning product domain
- **Status** — `live`, `demo-ready`, `partial`, `stub`, `planned`
- **Evidence** — source of claim (route file, component, seed script, doc)
- **Test Coverage** — `covered`, `partial`, `none`
- **Demo Blocker** — whether the capability requires a workaround for investor demos

---

## 1. Core Platform Primitives

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| P-001 | Outcome Graph — decision lifecycle tracking | Platform | live | `lib/outcome-graph`, DB tables | partial |
| P-002 | Proof Chain — immutable audit trail | Platform | live | `lib/proof-chain`, `lib/audit` | partial |
| P-003 | Covenant Policy — permission enforcement | Platform | live | `lib/covenant-policy`, `packages/policy-engine` | partial |
| P-004 | Decision Simulation (Monte Carlo) | Platform | live | `lib/monte-carlo`, API routes | partial |
| P-005 | Workflow Engine (Alloy) | Platform | live | `lib/workflow-engine`, `lib/forge-runtime` | partial |
| P-006 | Event Fabric (PRISM Bus) | Platform | live | `lib/prism-bus`, `packages/atlas-events` | partial |
| P-007 | Correlation ID propagation | Platform | live | `packages/observability-core` middleware | covered |
| P-008 | Multi-tenant RBAC (11 roles) | Platform | live | `lib/auth`, `artifacts/api-server/src/middlewares/` | partial |
| P-009 | Session-based OIDC authentication | Platform | live | `lib/replit-auth-web`, API auth routes | covered |

---

## 2. API Server Capabilities

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| A-001 | REST API (~170 route files) | Backend | live | `artifacts/api-server/src/routes/` | partial |
| A-002 | GraphQL API (Apollo Server) | Backend | live | `artifacts/api-server/src/graphql/` | partial |
| A-003 | WebSocket real-time channels | Backend | live | `artifacts/api-server/src/lib/websocket.ts` | partial |
| A-004 | Server-Sent Events (SSE) | Backend | live | NEXUS research stream, others | none |
| A-005 | Health check endpoints (8 endpoints) | Backend | live | `GET /api/health*` | covered |
| A-006 | Rate limiting (5 layers) | Backend | live | `artifacts/api-server/src/middlewares/rate-limit.ts` | partial |
| A-007 | CSRF protection | Backend | live | Middleware active | partial |
| A-008 | Helmet.js CSP headers | Backend | live | Express middleware | partial |
| A-009 | Field-level encryption | Backend | live | `artifacts/api-server/src/middlewares/field-encryption.ts` | none |
| A-010 | MCP Gateway (Model Context Protocol) | Backend | live | `artifacts/api-server/src/routes/mcp.ts` | none |
| A-011 | OpenAPI documentation | Backend | partial | Schema exists; endpoint availability varies | none |
| A-012 | Webhook receivers (Stripe, Alloy, GitHub, Slack) | Backend | live | Signature verification confirmed | partial |
| A-013 | Zod input validation (84% route coverage) | Backend | live | `scripts/check-zod-coverage.sh` | covered |
| A-014 | Structured logging (pino) | Backend | live | All routes | covered |
| A-015 | Sentry error tracking | Backend | live | `lib/sentry.ts`, `GET /api/healthz` reports status | partial |

---

## 3. SZL Holdings Dashboard (szl-holdings)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| S-001 | Corporate landing page / investor hub | SZL Holdings | live | `artifacts/szl-holdings/src/pages/` | covered (E2E) |
| S-002 | Trust Center | SZL Holdings | live | `/trust-center` route | covered (E2E) |
| S-003 | Legal pages (Privacy, Terms) | SZL Holdings | live | `/legal/*` routes | covered (E2E) |
| S-004 | Lyte business observability dashboard | SZL Holdings | demo-ready | `/lyte` — seeded data | covered (E2E) |
| S-005 | Decision Theater / Decision Center | SZL Holdings | demo-ready | `/decision-center` — seeded data | partial |
| S-006 | ATLAS (observability fabric) | SZL Holdings | demo-ready | Seeded KPIs, ATLAS packages | partial |
| S-007 | Nuro Forge (deal management) | SZL Holdings | demo-ready | `/nuro-forge` — seeded data | covered (E2E) |
| S-008 | Ecosystem navigation | SZL Holdings | live | `lib/shared-ui` EcosystemNav | covered |
| S-009 | Demo/Pilot/Live data state badges | SZL Holdings | live | `lib/shared-ui/data-state-badge.tsx` | partial |
| S-010 | Autopilot header (genome score, job count) | SZL Holdings | stub | Hardcoded values — backlog | none |
| S-011 | Founder / About pages | SZL Holdings | live | Routes confirmed | none |

---

## 4. Unified Command (command)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| C-001 | Strategy layer dashboard | Command | demo-ready | `/command/strategy` — seeded | covered (E2E) |
| C-002 | Executive Briefing | Command | demo-ready | `/command/strategy/executive-briefing` | partial |
| C-003 | Operations layer / Portfolio Health | Command | demo-ready | `/command/operations` — seeded | covered (E2E) |
| C-004 | Approvals queue | Command | demo-ready | `/command/operations/approvals` — seeded | partial |
| C-005 | Blocker Board | Command | demo-ready | `/command/operations/blocker-board` | partial |
| C-006 | Alloy Workflow Canvas | Command | demo-ready | `/command/operations/alloy/canvas` | partial |
| C-007 | Infrastructure / IMPERIUM map | Command | demo-ready | `/command/infrastructure` — seeded | covered (E2E) |
| C-008 | Analytics dashboard | Command | demo-ready | `/command/analytics` — seeded | none |
| C-009 | Demo Mode scenario engine | Command | live | `demo-mode.tsx` — PRISM scenario simulation | none |
| C-010 | Governed Decision Loop | Command | demo-ready | `/command/operations/governed-decision-loop` | covered (E2E) |
| C-011 | Cognitive Consoles (Command Center, Self Model, World Model) | Command | demo-ready | `/command/cognitive/*` — fallback demo data | none |
| C-012 | Cross-domain badge counts (CORTEX) | Command | stub | Hardcoded — backlog | none |

---

## 5. Vessels Maritime Intelligence (vessels)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| V-001 | Fleet management dashboard | Vessels | demo-ready | Seeded AIS data | covered (E2E) |
| V-002 | Vessel tracking (map view) | Vessels | partial | Mapbox blank without token | partial |
| V-003 | Maritime intelligence / signal detection | Vessels | demo-ready | Seeded data | partial |
| V-004 | Port analysis | Vessels | demo-ready | Seeded data | none |
| V-005 | Real-time AIS positions | Vessels | stub | No live AIS subscription — simulated | none |
| V-006 | NOAA CO-OPS marine weather | Vessels | live | Live API via intelligence-feeds | none |
| V-007 | Open-Meteo marine forecast | Vessels | live | Live API | none |
| V-008 | Decision Center | Vessels | demo-ready | `/vessels/decision-center` — shared OS layer | none |
| V-009 | Insurance module | Vessels | stub | UI complete; not connected to DB/API | none |
| V-010 | Trading module | Vessels | stub | UI complete; not connected | none |
| V-011 | Platform module | Vessels | stub | UI complete; not connected | none |

---

## 6. Terra Real Estate Intelligence (terra)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| T-001 | Property intelligence dashboard | Terra | demo-ready | Seeded data | covered (E2E) |
| T-002 | Portfolio view | Terra | demo-ready | Seeded data | partial |
| T-003 | Market analysis | Terra | demo-ready | Seeded + live NYC Open Data | partial |
| T-004 | NYC Open Data distress pipeline | Terra | live | `routes/terra-live.ts` — real API | none |
| T-005 | Valuation tools | Terra | demo-ready | Seeded data | none |
| T-006 | Map visualization | Terra | partial | Mapbox blank without token | none |
| T-007 | Census ACS demographics | Terra | live | Live API via intelligence-feeds | none |
| T-008 | FEMA National Risk Index | Terra | live | Live API | none |
| T-009 | SEC EDGAR REIT filings | Terra | live | Live API | none |
| T-010 | Decision Center | Terra | demo-ready | `/terra/decision-center` | none |

---

## 7. Aegis Investor Pitch Deck / Defense Intelligence (aegis)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| AG-001 | Investor pitch deck slides | Aegis | live | `artifacts/aegis/src/slides/` | partial (validate-slides) |
| AG-002 | Threat intelligence dashboard | Aegis | demo-ready | Seeded SIEM data | covered (E2E) |
| AG-003 | Vulnerability management | Aegis | demo-ready | Seeded data | partial |
| AG-004 | Incident response | Aegis | demo-ready | Seeded data | partial |
| AG-005 | Compliance modules | Aegis | demo-ready | Seeded data | partial |
| AG-006 | Network security | Aegis | demo-ready | Seeded data | none |
| AG-007 | CISA KEV catalog | Aegis | live | 1,554+ real entries | none |
| AG-008 | NVD CVE database | Aegis | live | Live API | none |
| AG-009 | MITRE ATT&CK Matrix v14 | Aegis | live | Live GitHub pull | none |
| AG-010 | CISO Executive Dashboard | Aegis | stub | Not wired to live aggregate data | none |
| AG-011 | 8 new security modules | Aegis | stub | UI built; not wired to APIs | none |

---

## 8. Carlota Jo Advisory (carlota-jo)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| CJ-001 | Advisory consulting landing | Carlota Jo | live | Routes confirmed | covered (E2E) |
| CJ-002 | Services page | Carlota Jo | live | Route confirmed | partial |
| CJ-003 | About page | Carlota Jo | live | Route confirmed | none |
| CJ-004 | Contact form | Carlota Jo | live | Form submission wired | partial |
| CJ-005 | Client engagement history | Carlota Jo | demo-ready | Seeded data | none |
| CJ-006 | Advisory session notes | Carlota Jo | demo-ready | Seeded data | none |
| CJ-007 | Decision Center | Carlota Jo | demo-ready | `/carlota-jo/decision-center` | none |
| CJ-008 | World Bank GDP indicators | Carlota Jo | live | Live intelligence-feeds API | none |
| CJ-009 | Microsoft Outlook Calendar connector | Carlota Jo | live | Active connector | none |
| CJ-010 | Google OAuth | Carlota Jo | stub | No `GOOGLE_CLIENT_ID` configured | none |

---

## 9. Pulse AI Executive Briefing (pulse)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| PU-001 | AI executive briefing reader | Pulse | demo-ready | Demo mode at `?demo` | none |
| PU-002 | Morning briefing generation | Pulse | stub | Static demo content — AI generation not live | none |
| PU-003 | Decision summaries | Pulse | demo-ready | Seeded | none |
| PU-004 | PDF export | Pulse | stub | Not implemented | none |
| PU-005 | Email subscription | Pulse | stub | Not implemented | none |
| PU-006 | Decision Center view | Pulse | demo-ready | `/pulse/decisions` | none |

---

## 10. NEXUS Agentic AI Layer (mockup-sandbox)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| N-001 | Parallel Research Swarm | NEXUS | demo-ready | SSE streaming at `/api/nexus/research` | none |
| N-002 | Persistent Memory + Skills Library | NEXUS | demo-ready | 12 seeded skills at `/api/nexus/memory` | none |
| N-003 | Universal Protocol Bridge (MCP/A2A) | NEXUS | demo-ready | 12 registered tools | none |
| N-004 | Cross-App Orchestrator | NEXUS | demo-ready | Routes across 10 SZL artifacts | none |
| N-005 | Design System preview | NEXUS | live | `/nexus/#design-system` | none |

---

## 11. Mobile (szl-holdings-mobile)

| ID | Capability | Domain | Status | Evidence | Test Coverage |
|----|-----------|--------|--------|----------|---------------|
| M-001 | Mobile command center (CORTEX) | Mobile | demo-ready | Expo app | manual only |
| M-002 | Decision Center mobile view | Mobile | demo-ready | `app/(shell)/intelligence/decisions.tsx` | manual only |
| M-003 | Push notifications | Mobile | stub | No configured endpoint | none |
| M-004 | Sentry mobile monitoring | Mobile | stub | Follow-up task #1753 | none |

---

## Summary Counts

| Status | Count |
|--------|-------|
| live | 32 |
| demo-ready | 41 |
| partial | 8 |
| stub | 19 |
| planned | 0 |
| **Total** | **100** |

---

*See also: `docs/audit/capability-inventory.json` (machine-readable), `docs/audit/SURFACE_MAP.md`, `docs/audit/MOCK_AND_STUB_REGISTER.md`*
