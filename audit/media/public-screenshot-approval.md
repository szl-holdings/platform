# SZL Holdings — Public Screenshot Approval Register

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Purpose:** Track approval status of all screenshots used in public-facing materials

---

## Approval Status

| Screenshot | Location | Status | Approved By | Notes |
|---|---|---|---|---|
| `szl-holdings-dashboard.jpg` | README.md | ✅ **Retaken 2026-04-21** | Enterprise Rehaul #2841 | Fresh screenshot; dark UI; landing page |
| `aegis-command.jpg` | README.md | ✅ **Retaken 2026-04-21** | Enterprise Rehaul #2841 | "Four workspaces. One shared intelligence layer." |
| `vessels-maritime.jpg` | README.md | ✅ **Retaken 2026-04-21** | Enterprise Rehaul #2841 | "Fleet operations. Decided faster." |
| `command-portal.jpg` | (unreferenced) | ⚠️ **On hold** | — | Consider adding to README after retake |
| `terra-real-estate.jpg` | (unreferenced) | ⚠️ **Pending review** | — | Good candidate for README addition |
| `carlota-jo.jpg` | (unreferenced) | ⚠️ **On hold** | — | Review before use |
| `cortex-mobile.jpg` | (unreferenced) | ⚠️ **On hold** | — | Hold until mobile hardening complete |
| `prism-counsel-*.jpg` | (unreferenced) | ✅ **Archived 2026-04-21** | Enterprise Rehaul #2841 | Moved to `assets/readme/archive/`; artifact archived |
| `imperium-cloud.jpg` | (unreferenced) | ✅ **Archived 2026-04-21** | Enterprise Rehaul #2841 | Moved to `assets/readme/archive/`; artifact archived |

---

## Approval Criteria

A screenshot is approved for public/investor use when ALL of the following are true:

1. **Accuracy** — Reflects the current, deployed state of the artifact
2. **Completeness** — No blank panels, loading spinners, or error states
3. **Brand compliance** — Dark theme, enterprise palette, no neon
4. **Data honesty** — Seeded data is labeled as such where visible; no aspirational metrics presented as live
5. **Resolution** — 1440×900 minimum for desktop; 375×812 for mobile; JPG quality ≥85%
6. **Reviewed** — Reviewed by at least one team member within 30 days of use

---

## Process for New Screenshots

1. Capture using `pnpm capture:screens` or manual browser capture
2. Review against quality bar (see `retake-list.md`)
3. Submit for review with route, date, and data state noted
4. Add to this register with approval
5. Update README and marketing materials

---

## Actions Completed (2026-04-21 — Enterprise Rehaul #2841)

**Screenshots retaken:**
- [x] `szl-holdings-dashboard.jpg` — retaken at landing page; dark UI; enterprise branding
- [x] `vessels-maritime.jpg` — retaken; "Fleet operations. Decided faster."; AIS simulated note in retake-list
- [x] `aegis-command.jpg` — retaken; "Four workspaces. One shared intelligence layer."

**Screenshots archived to `assets/readme/archive/`:**
- [x] `prism-counsel-command.jpg` — artifact archived
- [x] `prism-counsel.jpg` — artifact archived
- [x] `prism-counsel-matter-board.jpg` — artifact archived
- [x] `prism-counsel-obligation-timeline.jpg` — artifact archived
- [x] `imperium-cloud.jpg` — artifact archived

## Remaining Actions

**After MAPBOX_TOKEN is configured:**
- [ ] Retake Terra screenshots with maps visible (currently blank without token)

---

*Screenshot map: `audit/media/screenshot-map.md`*  
*Retake list: `audit/media/retake-list.md`*
