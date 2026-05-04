# Visibility Gaps Report
**Phase:** 1  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

Visibility gaps are features or surfaces that are implemented in code but either not reachable by users, not shown in the primary navigation, or incomplete in a way that creates false impressions.

---

## VG001 — Memory Fabric Has No UI Surface

| Field | Value |
|---|---|
| Package | `packages/memory-fabric` |
| Status | Code: complete. API: partial. UI: none |
| Impact | Capability claimed in platform marketing; not demonstrable via UI |
| Recommended action | Suppress from investor-facing marketing claims until UI surface exists; OR add to `/command/cognitive/` as a read-only inspection panel |

---

## VG002 — Admin Panel Has No Dedicated UI

| Field | Value |
|---|---|
| Location | Admin routes exist in `/api/admin/*`; no frontend admin app |
| Status | API-only; no UI panel |
| Impact | Platform administration requires direct API calls or SQL access |
| Recommended action | Post-GA milestone; acceptable for design-partner phase |

---

## VG003 — OpenAPI Portal Not Hosted

| Field | Value |
|---|---|
| Location | `lib/api-spec` (OpenAPI 3.1 spec exists) |
| Status | Spec exists; no Swagger/Redoc endpoint mounted at `/api/docs` |
| Impact | Developers and integration partners cannot self-serve API documentation |
| Recommended action | Mount Swagger UI at `/api/docs` (1-day effort) |

---

## VG004 — Terra ETL Has No Health Monitor UI

| Field | Value |
|---|---|
| Location | `artifacts/terra/` — NYC Open Data ETL |
| Status | ETL scripts exist; ingestion runs; no UI showing ingestion status/freshness |
| Impact | Operators cannot see data freshness without checking logs |
| Recommended action | Build ingestion status panel on Terra dashboard (1-day effort) |

---

## VG005 — Eval Studio Not Linked from Primary Navigation

| Field | Value |
|---|---|
| Location | `artifacts/lyte-command-center/src/pages/eval-studio.tsx` |
| Status | Page exists at `/lyte/eval-studio`; not prominently linked from main nav |
| Impact | Sophisticated investor evaluators may miss this differentiated surface |
| Recommended action | Add Eval Studio to the Lyte governance navigation group |

---

## VG006 — Pulse PDF Export Not Working

| Field | Value |
|---|---|
| Location | `artifacts/pulse/` — briefing reader PDF export |
| Status | PDF export button present; generation not wired |
| Impact | Button shows; click fails silently or produces empty output |
| Recommended action | Hide export button behind `FEATURE_PDF_EXPORT=false` flag until wired; or fix PDF generation |

---

## VG007 — No Self-Serve Terra Demo Mode

| Field | Value |
|---|---|
| Location | `artifacts/terra/` |
| Status | No guided walkthrough for unaided demo exploration |
| Impact | Prospects exploring without a presenter cannot navigate to key features |
| Recommended action | Add Demo Launchpad shortcut to Terra's "Why This Property Now" (P3 priority) |

---

## VG008 — No Self-Serve Vessels Demo Mode

| Field | Value |
|---|---|
| Location | `artifacts/vessels/` |
| Status | No guided walkthrough |
| Impact | Same as VG007 for maritime product |
| Recommended action | Add demo tour shortcut to Voyage Risk Twin (P3 priority) |

---

## VG009 — NEXUS / Mockup Sandbox Not in Product Navigation

| Field | Value |
|---|---|
| Location | `artifacts/mockup-sandbox/` at `/nexus/` |
| Status | Running; not linked from main platform navigation |
| Impact | Internal design tool not intended for external users |
| Recommended action | Keep excluded from nav; confirm `/nexus/` is auth-protected |

---

## VG010 — Carlota Jo Billing / Checkout Not Wired

| Field | Value |
|---|---|
| Location | `artifacts/carlota-jo/` — billing page |
| Status | Billing page UI present; no Stripe checkout flow |
| Impact | Clients cannot self-serve billing; revenue collection blocked |
| Recommended action | Wire Stripe checkout to `/api/billing/create-session` (P1 — 1-day effort) |

---

## VG011 — SSO / SCIM Not Configured

| Field | Value |
|---|---|
| Location | Auth layer |
| Status | Architecture complete; IdP credentials not provisioned |
| Impact | Enterprise customers cannot use their existing identity provider |
| Recommended action | Add to enterprise tier activation checklist; acceptable for design-partner phase |

---

## Summary

| Priority | Count |
|---|---|
| P1 (investor/design-partner blocker) | 2 (VG006, VG010) |
| P2 (design-partner activation) | 3 (VG001, VG003, VG004) |
| P3 (GA blocker) | 4 (VG002, VG005, VG007, VG008) |
| P4 (post-GA) | 2 (VG009, VG011) |
