# Claim vs. Capability Audit — SZL Holdings Platform
**Date:** April 3, 2026  
**Status:** Current  
**Audience:** Internal leadership, legal, investor diligence

---

## Purpose

Every claim this platform makes — in marketing copy, investor materials, and product documentation — must have a corresponding operational capability. This document audits every significant claim across the entire ecosystem and rates its backing.

**Rating scale:**
- **Real** — capability exists, is operational, and can be demonstrated
- **Partial** — capability exists in schema or API but UI/integration is incomplete
- **Seeded** — UI exists and works; data is demonstrative, not live production
- **Roadmap** — on the plan; not yet built
- **Removed** — claim was inaccurate and has been removed from all materials

---

## Platform-Level Claims

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| AI-powered decisions with evidence trails | Real | `lib/ai-engine/` — 9 decision schemas, audit logging on every call | All decisions in propose_only mode by default |
| Evidence-backed retrieval | Real | `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — hybrid search, BGE reranking | Needs more indexed data for production scale |
| Policy-gated execution | Real | `lib/ai-engine/src/tools/` — 9 tools, approval gates, role checks | Approval UI partially integrated in Lyte |
| Immutable audit trail | Real | `lib/audit/` — persisted log, actor, timestamp, rationale | Full across all AI decisions |
| Human-in-the-loop governance | Partial | Approval center UI in Lyte; HITL schema in Alloy | UI flow not completed for all entity types |
| Multi-tenant architecture | Partial | Auth middleware, SCIM endpoints, tenant tables | Retrieval not yet partitioned by tenantId |
| 1,166 API endpoints | Real | `artifacts/api-server/` — documented, counted | Many return seeded data; auth coverage good |
| RBAC and role-based access | Real | `lib/auth/` — JWT, session, role middleware | All apps enforce auth; role granularity varies |
| Real-time data integrations | Real | Census, HUD, FEMA, NYC Open Data (Terra) | Terra: 4 live feeds; others: planned |
| Production-ready infrastructure | Partial | All apps build and run; E2E tests and load testing missing | Functional Alpha, not production-hardened |

---

## Lyte Command Center

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Signal intake and routing | Real | `/signals` CRUD, filter, priority queue | Live data available |
| Ownership gap detection | Real | Owner assignment, unassigned detection | Seeded demonstration data |
| Command inbox with action queue | Real | Action queue UI, task board | Seeded data |
| AI-assisted operational briefing | Real | Alloy integration, decision cards | propose_only, human approval required |
| Approval center | Partial | Schema + UI components exist | Workflow integration incomplete |
| Escalation center | Seeded | Page exists, routes escalations | No live paging/notification integration |
| Audit trail on all decisions | Real | Audit log viewer, per-decision record | Real and persisted |
| PRISM signal dashboard | Real | Visualization of signal context | Real |
| Observability and APM | Real | Service health, APM pages | Real |
| Readiness assessments | Real | Assessment CRUD working | Real |
| "Real-time visibility" | Real | Signal stream, live updates on dashboard | Real with live/seeded toggle |

---

## Alloy (Execution Fabric)

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Decision objects with schema validation | Real | 9 Zod-validated schemas in `lib/ai-engine/src/schemas/` | All in production |
| Hybrid evidence retrieval | Real | `retrieval.ts` — keyword + semantic, BGE, reranking | Real |
| Policy enforcement layer | Real | Role-gated tools, propose_only default, approval gates | Real |
| Immutable audit on every call | Real | `lib/audit/` — logged per invocation | Real |
| Evaluation harness | Real | 25+ golden test scenarios | Real |
| Multi-model routing | Real | HuggingFace primary, fallback config | Real |
| Connector mesh | Partial | Architecture exists; selective integrations live | Not all connectors active |
| Self-serve API access | Roadmap | No public API documentation yet | Planned post-pilot |

---

## Aegis (Firestorm — Security Command)

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| SOC dashboard | Seeded | Alert/incident views operational | Seeded data; no live SIEM feed |
| Incident management | Seeded | Case management UI, incident records | Seeded data |
| Risk scoring | Seeded | Risk score display, trend charts | Seeded data |
| Threat intelligence (STIX/TAXII) | Roadmap | Page exists; no live feed connected | Decorative |
| XDR console | Roadmap | Page exists | Decorative — no live endpoint data |
| Forensics timeline | Roadmap | Page exists | Decorative |
| Sentinel integration | Roadmap | Dashboard page exists | Not connected |
| SOAR automation | Roadmap | Architecture planned | Not built |
| MSP operations | Seeded | 10+ operations pages | Seeded data |
| "Enterprise SOC platform" | Partial | Core SOC workflows functional; advanced features decorative | Accurate at prototype level |

---

## Terra (Real Estate Intelligence)

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Property portfolio management | Seeded | Property list + detail pages | Seeded data |
| Market intelligence from live APIs | Real | Census, HUD, FEMA NRI, NYC Open Data | 4 verified live feeds |
| Distress detection engine | Seeded | Detection algorithm + scoring display | Seeded data, algorithm real |
| Deal pipeline management | Real | CRUD operations for deals | Real |
| Property map visualization | Real | Mapbox integration | Real (1.7MB bundle) |
| Climate risk scoring | Real | FEMA NRI integration | Real |
| Document management | Real | Document engine across properties | Real |
| "Institutional-grade property intelligence" | Partial | Live data integrations are real; portfolio data is seeded | Honest at prototype level |

---

## Vessels (Maritime Intelligence)

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Fleet dashboard | Seeded | Vessel list, overview, metrics | Seeded data |
| Vessel detail pages | Seeded | Comprehensive vessel page | Seeded data |
| Exception and alert management | Seeded | Exception center with triage workflow | Seeded data |
| Route planning | Seeded | Route visualization with Mapbox | Seeded data |
| Maritime map | Real | Mapbox integration | Real (1.7MB bundle) |
| Sanctions screening | Roadmap | Page exists | Decorative — no live data feed |
| Dark vessel detection | Roadmap | Page exists | Decorative — no AIS data |
| Commodity flow tracking | Roadmap | Page exists | Seeded |
| "Maritime operating intelligence" | Partial | Core fleet management real; intelligence features are prototype | Honest at prototype level |

---

## Carlota Jo

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Advisory practice services | Real | 6 service areas documented and operational | Real |
| Booking and inquiry flow | Real | `/booking` and `/contact` operational | Real |
| Client portal | Real | Document and session management | Provisioned per engagement |
| ROI calculator | Real | Interactive tool on site | Real |
| AI-powered advisory | Partial | Domain agent exists; not live as client-facing feature | Softened in web copy |
| "94% repeat client rate" | Removed | No verified tracking | Removed from all materials |
| "14+ countries" | Removed | Not verified | Replaced with "4 Continents" (accurate) |

---

## SZL Holdings (Corporate)

| Claim | Rating | Evidence | Notes |
|-------|--------|---------|-------|
| Multi-lane technology holding company | Real | 7 platforms built and documented | Real |
| Investor relations content | Real | Comprehensive investor pages | Real |
| Trust center | Real | Security and governance pages | Real |
| Capital readiness artifacts | Real | Diligence packets, artifacts documented | Real |
| "$180M in assets under influence" | Removed | No live AUM | Removed |
| "6 platforms live" | Removed | Lyte + Alloy are design-partner; others are prototypes | Replaced with honest staging |
| Ecosystem map | Real | Interactive visualization of all platforms | Real |
| Design partners programme | Real | Application page operational | Real |

---

## Summary Counts

| Rating | Count |
|--------|-------|
| Real | 38 |
| Partial | 11 |
| Seeded | 18 |
| Roadmap | 11 |
| Removed | 6 |
| **Total claims audited** | **84** |

**45% of claims are fully real.** **13% have been removed or tightened.**  
This is an honest platform that knows what it is and what it is not.

---

*See also: [platform-trust-summary.md](platform-trust-summary.md) · [executive-audit-summary.md](executive-audit-summary.md) · [product/live-vs-roadmap-summary.md](product/live-vs-roadmap-summary.md)*
