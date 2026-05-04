# Non-Core Scope Reduction Plan

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9  
**Purpose:** Identify scope that is distracting or inconsistent with the core investment thesis, and create a concrete plan to reduce or remove it.

---

## The Problem

The monorepo contains 14 registered artifacts + archived surfaces + concept-only directories. This breadth is a strength for demonstrating platform scale, but it creates:

1. **Maintenance drag** — 8 partially-complete surfaces require bug-fix attention that dilutes A11oy and core-platform work
2. **Claim inconsistency** — public-facing documentation counts concepts and internal tools alongside real products, overstating scope
3. **Demo confusion** — 14 surfaces in a 30-minute investor demo means nothing gets the attention it deserves
4. **CI cost** — more surfaces = more workflow runs = more GitHub Actions minutes

---

## Immediate Actions (Before Next External Meeting)

### 1. Remove PRAXIS/Mockup Sandbox from Product Count Claims
- **Current:** PRAXIS is listed in artifact inventory as a product surface
- **Action:** Add explicit "(internal tool — not a product)" annotation to `README.md` artifact table and `docs/APP_STATUS.md`
- **Owner:** Documentation pass
- **Effort:** 30 minutes

### 2. Add "AIS Simulated" Disclosure to SEXTANT Entry Points
- **Current:** No explicit simulation disclosure in the SEXTANT UI or README
- **Action:** Add a banner or footnote in the SEXTANT (Vessels) UI and update README table with "(AIS simulated)" suffix
- **Owner:** Vessels artifact
- **Effort:** 1 hour

### 3. Add Mapbox Token Placeholder UI for DOMAINE
- **Current:** Maps are blank — no error message, just empty space
- **Action:** Add a visible "Map requires Mapbox token — contact support" placeholder when `MAPBOX_TOKEN` is absent
- **Owner:** Terra artifact
- **Effort:** 2 hours

### 4. Fix `/api/sentra/risks` Missing Route (TENAX)
- **Current:** Route referenced in UI but not registered in API server
- **Action:** Register the route (even returning seeded data) — this is a 2-hour fix
- **Owner:** API Server
- **Effort:** 2–4 hours

---

## Medium-Term Scope Reduction (Next 30 Days)

### 5. Archive CORTEX Mobile Clearly
- **Current:** `artifacts/cortex-mobile/` directory exists; App/ directory present but no build system
- **Action:** Add `CONCEPT.md` to the directory; ensure it is NOT listed in any public product claim or artifact registry
- **Status:** Not registered in artifact registry — ensure it stays out

### 6. Consolidate FORGE (Command) to Internal-Only
- **Current:** FORGE listed in README artifact table and public claims
- **Action:** Mark FORGE as "internal operator surface" in all external-facing docs until badge counts are wired to live API
- **Effort:** Documentation-only; 1 hour

### 7. Reduce Demo Artifact Count to 8 for External Presentations
- **Current:** All 14 artifacts may appear in demo flows
- **Action:** Create a "demo set" configuration: A11oy, SZL Holdings, Carlota Jo, LUMINA, PARAGON, Counsel, KORA, APEX — and use this subset for investor demos
- **Effort:** Create `docs/investor/demo-runbook.md` with the 8-surface flow

---

## Deferred — No Action Required Yet

| Item | Why Deferred |
|---|---|
| Full SEXTANT live AIS | Requires $15–40K/year AIS provider subscription. Defer to post-revenue. |
| DOMAINE live MLS/CoStar | Requires enterprise data agreement. Defer to growth capital close. |
| TENAX case management integration | Requires third-party SOAR/SIEM wiring. Defer to GA. |
| FORGE full wiring | Requires API server badge count endpoints. 2–3 sprint effort. Defer to v1.1.0. |
| SOC 2 Type 1 audit | Requires 6+ months of evidence collection. Defer to post-growth capital. |
| Enterprise SSO/SCIM | Requires design partner commitment. Defer to first enterprise pilot. |

---

## What NOT to Remove

The breadth of the platform (8 domain verticals) is a genuine moat signal. Do not remove surfaces — reduce their prominence in public claims until they are investor-ready. The goal is honest classification, not deletion.

---

*Review this plan monthly. Promote deferred items to immediate actions as resources free up.*
