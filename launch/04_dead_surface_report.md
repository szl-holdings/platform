# Dead Surface Report
**Phase:** 1  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

Dead surfaces are routes, UI elements, or features that are visible but lead nowhere useful, produce errors, or have no backend wiring.

---

## DS001 — `artifacts/firestorm` (Archived — No Active Route)

| Field | Value |
|---|---|
| Status | Archived; `DEPRECATED.md` present |
| User visibility | Not routed; no artifact.toml; not in nav |
| Action | None required — already archived |

---

## DS002 — `artifacts/imperium` (Skeleton — Never Built)

| Field | Value |
|---|---|
| Status | Only `node_modules/`; no source code |
| User visibility | Not routed; not in nav |
| Action | None required — not exposed |

---

## DS003 — Deprecated Navigation Links (Resolved)

| Field | Value |
|---|---|
| Status | `check-deprecated-links` workflow: **PASS** |
| Evidence | `qa:deprecated-links` → 0 deprecated navigation link references found |
| Action | None required |

---

## DS004 — Pulse PDF Export Button (Dead CTA)

| Field | Value |
|---|---|
| Location | `artifacts/pulse/` briefing reader |
| Status | Button rendered; handler unimplemented; produces no output |
| User visibility | Visible to all Pulse users |
| Recommended action | Hide behind `FEATURE_PDF_EXPORT=false` or wire to generation endpoint |

---

## DS005 — Vessels Commercial Modules (3 Pages — Not DB-Connected)

| Field | Value |
|---|---|
| Location | `/vessels/insurance`, `/vessels/trading`, `/vessels/platform` |
| Status | UI rendered; no API wiring; shows empty or error state |
| User visibility | Visible via navigation |
| Recommended action | Hide behind `FEATURE_VESSELS_COMMERCIAL=false` flag until wired |

---

## DS006 — Aegis Extended Security Modules (UI Only)

| Field | Value |
|---|---|
| Location | New pages in `artifacts/aegis/src/pages/` |
| Status | UI rendered; not connected to case management APIs |
| User visibility | Visible via navigation |
| Recommended action | Hide behind `FEATURE_AEGIS_EXTENDED_MODULES=false` flag |

---

## DS007 — CourtListener Legal Feed (No Auth — Rate Limited)

| Field | Value |
|---|---|
| Location | Legal research features in Counsel/PRISM Counsel |
| Status | API calls made without auth token; hits public rate limits |
| User visibility | Legal search may fail silently at rate limit |
| Recommended action | Add `COURT_LISTENER_API_TOKEN` to secrets; add graceful error state |

---

## DS008 — Missing DB Tables Causing Non-Fatal API Warnings

| Field | Value |
|---|---|
| Tables | `platform_settings`, `eval_forge_suites`, `eval_forge_runs` |
| Status | Non-fatal WARN on startup; affected routes return 500 or empty |
| User visibility | Eval Forge UI and platform settings UI may show errors |
| Recommended action | Run `pnpm seed:all` after `pnpm db:migrate` |

---

## DS009 — `cortex-mobile` (Unregistered Active Development)

| Field | Value |
|---|---|
| Location | `artifacts/cortex-mobile/` |
| Status | Active development directory; no `artifact.toml`; not registered as artifact |
| User visibility | Not exposed |
| Recommended action | Either register as artifact or add to archived list |

---

## DS010 — Stephen Site / Founder Profile (Deprecated Location)

| Field | Value |
|---|---|
| Location | `artifacts/szl-holdings/src/` — `/founder` route |
| Status | Founder profile integrated into szl-holdings under `/founder`; old standalone reference may still exist in some links |
| User visibility | Users following old links may land on wrong route |
| Recommended action | Verify all `/stephen-site/` external links redirect to `/founder` |

---

## Summary

| Category | Count | Action Required |
|---|---|---|
| Archived / not exposed | 2 | None |
| Resolved | 1 | None |
| Active dead surfaces needing fix | 7 | Fix or flag off |
| **Total dead surfaces** | **10** | |

**Priority fixes (before design-partner demo):** DS004, DS005, DS006, DS007, DS008
