# Mock, Stub, and Fake Data Register
**Phase:** 1  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

This register catalogs every identified mock, stub, fake loader, hard-coded value, and placeholder in production paths, with disposition and recommended action.

---

## Legend

| Status | Meaning |
|---|---|
| `acceptable` | Labeled as demo data; disclosed to user; acceptable for design-partner phase |
| `fix-required` | Must be wired to real data or hidden before first paying tenant |
| `flagged-off` | Hidden behind disabled feature flag; not visible to users |
| `removed` | Already removed from production surface |

---

## M001 — Vessels AIS Positions (Demo Data)

| Field | Value |
|---|---|
| Location | `artifacts/vessels/`, `artifacts/api-server/src/routes/vessels-live.ts` |
| Finding | AIS vessel positions are seeded demo data; not pulling from MarineTraffic live API |
| User visibility | Visible; labeled "AIS Tracking" — no "demo" disclosure |
| Disposition | `acceptable` — `MARINETRAFFIC_API_KEY` secret needed to activate; feature flag `FEATURE_LIVE_AIS=false` |
| Recommended action | Add "(Demo)" label to AIS tab; add `MARINETRAFFIC_API_KEY` to production secrets when live AIS is desired |

---

## M002 — Pulse Briefing Content (Seeded, Not AI-Generated Live)

| Field | Value |
|---|---|
| Location | `artifacts/pulse/`, `artifacts/api-server/src/routes/briefings.ts` |
| Finding | Briefing content is seeded static text; AI generation pipeline exists but `FEATURE_LIVE_AI_BRIEFINGS=false` |
| User visibility | Visible; no "demo" disclosure on briefing cards |
| Disposition | `acceptable` — code path for live generation exists; gated on feature flag |
| Recommended action | Add "Demo Content" badge to briefing cards in the UI; activate `FEATURE_LIVE_AI_BRIEFINGS` when `RESEND_API_KEY` + AI provider confirmed |

---

## M003 — Hardcoded Autopilot Stats on szl-holdings Dashboard

| Field | Value |
|---|---|
| Location | `artifacts/szl-holdings/` (corporate dashboard / investor portal) |
| Finding | Autopilot metrics shown as live intelligence are hardcoded numbers |
| User visibility | Visible on marketing/investor pages |
| Disposition | `fix-required` — metrics on investor-facing pages must either come from real data or be labeled "Illustrative" |
| Recommended action | Add "Illustrative" label to all stat callouts not sourced from live DB queries |

---

## M004 — Hardcoded Client Satisfaction Scores (Forge Module)

| Field | Value |
|---|---|
| Location | `artifacts/szl-holdings/` (Forge client module) |
| Finding | Satisfaction scores are hardcoded; misleading in a live production context |
| User visibility | Visible |
| Disposition | `fix-required` — label as "Illustrative" or wire to aggregate from real feedback data |
| Recommended action | Add "Illustrative" label or remove the stat panel until real data exists |

---

## M005 — CORTEX Badge Counts Not Wired to Live API

| Field | Value |
|---|---|
| Location | `artifacts/command/` — cross-domain badge counts |
| Finding | Badge counts in Command app header are hardcoded or use seeded values |
| User visibility | Visible in navigation |
| Disposition | `fix-required` — wire to `/api/command/badge-counts` endpoint |
| Recommended action | Connect badge counts to real API or remove numeric badges until wired |

---

## M006 — Command Overview KPIs (New Module)

| Field | Value |
|---|---|
| Location | `artifacts/command/` overview page KPI cards |
| Finding | New module KPIs not yet wired to live API endpoints |
| User visibility | Visible |
| Disposition | `fix-required` — wire to API or label as "Demo Values" |
| Recommended action | Wire KPI cards to `/api/command/overview-kpis` or add "Demo" badge |

---

## M007 — Aegis SIEM Connectors (Stubbed)

| Field | Value |
|---|---|
| Location | `artifacts/aegis/`, `artifacts/api-server/src/routes/aegis-modules.ts` |
| Finding | SIEM connector abstraction exists; no live SIEM vendor wired |
| User visibility | Connector status UI shows placeholder state |
| Disposition | `acceptable` for design-partner phase — clearly labeled as "Integration Pending" in UI |
| Recommended action | Keep `SIEM_CONNECTOR_STATUS=pending` flag; do not show fake live data |

---

## M008 — Aegis CISO Dashboard KPIs Not Aggregated

| Field | Value |
|---|---|
| Location | `artifacts/aegis/` — CISO dashboard |
| Finding | 8 security module KPIs not aggregated from backend; shown as static layout |
| User visibility | Visible on CISO dashboard |
| Disposition | `fix-required` — wire or add "Demo" label |
| Recommended action | Wire to `/api/aegis/ciso-kpis` aggregation endpoint or label clearly |

---

## M009 — Vessels Commercial Modules (3 Modules)

| Field | Value |
|---|---|
| Location | `artifacts/vessels/src/pages/` — insurance, trading, platform modules |
| Finding | 3 new modules UI built; not connected to backend DB APIs |
| User visibility | Visible via navigation |
| Disposition | `fix-required` — hide behind feature flag or wire |
| Recommended action | Add `FEATURE_VESSELS_COMMERCIAL=false` flag; hide tabs from navigation until wired |

---

## M010 — Aegis New Security Modules (Not API-Connected)

| Field | Value |
|---|---|
| Location | `artifacts/aegis/src/pages/` — newer security modules |
| Finding | UI built; not connected to case management APIs |
| User visibility | Visible via navigation |
| Disposition | `fix-required` — hide behind feature flag or wire |
| Recommended action | Add `FEATURE_AEGIS_EXTENDED_MODULES=false` flag until API connection complete |

---

## M011 — Demo API Route Integration Test Stub

| Field | Value |
|---|---|
| Location | `artifacts/api-server/src/routes/alloy-integrations.ts:345` |
| Finding | "Test not implemented" comment present for some connector types |
| User visibility | Not user-visible (server-side only) |
| Disposition | `acceptable` — backend only; no user exposure |
| Recommended action | Add TODO to backlog; not a production blocker |

---

## M012 — CourtListener API (No Auth Token)

| Field | Value |
|---|---|
| Location | `artifacts/api-server/src/routes/` — legal feed routes |
| Finding | CourtListener API used without authentication token (public API rate limits apply) |
| User visibility | Indirect — may cause rate-limit failures for legal search features |
| Disposition | `fix-required` for production — add `COURT_LISTENER_API_TOKEN` to secrets |
| Recommended action | Add token to production secrets; graceful degradation if missing |

---

## Summary

| Status | Count |
|---|---|
| acceptable (labeled / flagged off) | 4 |
| fix-required | 7 |
| flagged-off | 1 |
| **Total mocks identified** | **12** |

**Production blocking (fix before first paying tenant):** M003, M004, M005, M006, M008, M009, M010, M012  
**Acceptable for design-partner demo phase:** M001, M002, M007, M011
