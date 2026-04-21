# SZL Holdings — Screenshot Retake List

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Screenshots requiring retake, archival, or removal

---

## Priority Retakes (README-referenced)

These screenshots appear directly in the main README.md and are the first things investors and engineers see.

### 1. szl-holdings-dashboard.jpg — ✅ RETAKEN 2026-04-21

| Field | Value |
|---|---|
| Current path | `assets/readme/products/szl-holdings-dashboard.jpg` |
| Referenced in | `README.md` (line ~85) |
| Route | `/` (SZL Holdings Dashboard landing page) |
| Completed | Enterprise Rehaul #2841 |
| Notes | Landing page: "The governed infrastructure for high-consequence decisions." Dark UI, enterprise branding confirmed. |
| Status | ✅ **Retaken — current** |

### 2. aegis-command.jpg — ✅ RETAKEN 2026-04-21

| Field | Value |
|---|---|
| Current path | `assets/readme/products/aegis-command.jpg` |
| Referenced in | `README.md` |
| Route | `/aegis/` (Aegis Unified Defense & Intelligence) |
| Completed | Enterprise Rehaul #2841 |
| Notes | Shows "Four workspaces. One shared intelligence layer." — current Aegis UI confirmed. |
| Status | ✅ **Retaken — current** |

### 3. vessels-maritime.jpg — ✅ RETAKEN 2026-04-21

| Field | Value |
|---|---|
| Current path | `assets/readme/products/vessels-maritime.jpg` |
| Referenced in | `README.md` |
| Route | `/vessels/` (Vessels Maritime Intelligence) |
| Completed | Enterprise Rehaul #2841 |
| Notes | Shows "Fleet operations. Decided faster." — fleet command landing. AIS simulated data note should be added to README caption. |
| Status | ✅ **Retaken — current** |

---

## Archive Immediately (Stale / Archived Artifacts)

| File | Reason | Action | Status |
|---|---|---|---|
| `prism-counsel-command.jpg` | PRISM Counsel archived (Task #634) | ✅ Archived to `assets/readme/archive/` — Enterprise Rehaul #2841 | Done |
| `prism-counsel.jpg` | PRISM Counsel archived | ✅ Archived to `assets/readme/archive/` — Enterprise Rehaul #2841 | Done |
| `prism-counsel-matter-board.jpg` | PRISM Counsel archived | ✅ Archived to `assets/readme/archive/` — Enterprise Rehaul #2841 | Done |
| `prism-counsel-obligation-timeline.jpg` | PRISM Counsel archived | ✅ Archived to `assets/readme/archive/` — Enterprise Rehaul #2841 | Done |
| `imperium-cloud.jpg` | Imperium archived (Task #920) | ✅ Archived to `assets/readme/archive/` — Enterprise Rehaul #2841 | Done |

---

## Consider Adding (Exist but Not in README)

These screenshots exist and could strengthen the README portfolio section:

| File | Artifact | Status | Recommendation |
|---|---|---|---|
| `terra-real-estate.jpg` | Terra | Beta | **Add to README** — live NYC data is differentiator |
| `command-portal.jpg` | Command | Beta | **Add to README** — shows cross-domain aggregation |
| `carlota-jo.jpg` | Carlota Jo | Beta | Consider adding |
| `cortex-mobile.jpg` | CORTEX Mobile | Partial | Hold until mobile hardening complete |
| `atlas-spatial-runtime.jpg` | Atlas | Internal | Hold — internal tool |

---

## Capture Procedure

```bash
# 1. Start API server + target artifact workflow
# 2. Seed demo data
pnpm seed:all

# 3. Authenticate as demo user

# 4. Navigate to target route

# 5. Capture at 1440×900 (desktop) or 375×812 (mobile)
pnpm capture:screens

# 6. Review captured screenshots against quality bar:
#    - No blank panels (check MAPBOX_TOKEN, LLM keys)
#    - Data visible (not loading states)
#    - Dark theme active
#    - No debug overlays or error banners
```

---

## Quality Bar for Approved Screenshots

- [ ] Dark theme active (matches design system)
- [ ] Seeded data visible (not empty states)
- [ ] No error banners or debug overlays
- [ ] No loading spinners
- [ ] UI consistent with enterprise design language
- [ ] If maps shown: MAPBOX_TOKEN configured
- [ ] Browser chrome hidden or cropped
- [ ] Consistent left-right padding (no clipping)

---

*Screenshot map: `audit/media/screenshot-map.md`*  
*Approval: `audit/media/public-screenshot-approval.md`*
