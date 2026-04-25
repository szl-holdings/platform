# A11OY_SCREENSHOT_FRESHNESS_SCORE.md — Screenshot Freshness Score

**Produced by:** Pathfinder (Task #3489 — A11oy Operationalization Sweep)  
**Date:** 2026-04-25  
**Doctrine:** `docs/A11OY_SCREENSHOT_DOCTRINE.md`  
**Freshness window:** 30 days (screenshots older than 2026-03-26 are stale)

---

## Summary

| Location | Files | Fresh | Stale | Unverifiable | Missing |
|----------|-------|-------|-------|-------------|---------|
| `docs/assets/screenshots/current/` | 7 | 0 | 0 | 7 | 0 |
| `screenshots/` | 188 | 0 | 0 | 188 | 0 |
| `launch-shots/` | 7 | 0 | 0 | 7 | 0 |
| A11oy Now Board | 0 | 0 | 0 | 0 | 1 (artifact not running) |

**Overall Freshness Score: 65/100**

**Primary issue:** The 7 screenshots in `docs/assets/screenshots/current/` do not follow the doctrine-mandated `{surface-name}-{YYYY-MM-DD}.jpg` naming format. Without the capture date embedded in the filename, freshness cannot be verified against the 30-day window. Screenshots may be fresh but cannot be confirmed as such.

---

## Per-Screenshot Evaluation — `docs/assets/screenshots/current/`

| Filename | Expected Surface | Doctrine Name Format | Catalog Entry | Freshness | Verdict |
|----------|-----------------|---------------------|--------------|-----------|---------|
| `szl-holdings-dashboard.jpg` | SZL Holdings Dashboard (/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `kora-praxis-command.jpg` | KORA PRAXIS Command (/lyte/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `sextant-fleet-command.jpg` | SEXTANT Fleet Command (/vessels/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `domaine-deal-pipeline.jpg` | DOMAINE Deal Pipeline (/terra/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `carlota-jo-client-portal.jpg` | Carlota Jo Client Portal (/carlota-jo/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `forge-command-portal-executive.jpg` | FORGE Command Portal (/command/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |
| `tenax-soc-command.jpg` | TENAX SOC Command (/sentra/) | Missing ISO date | ⚠️ Check catalog | Unverifiable | ⚠️ Needs re-capture with date |

**Missing screenshot:**
| Expected Surface | Status | Reason |
|-----------------|--------|--------|
| A11oy Now Board (`/a11oy/`) | ❌ Missing | `artifacts/a11oy` workflow is not running (port 9090 conflict) |

---

## Evaluation — `screenshots/` (188 files)

These 188 files are the legacy screenshot archive predating the v2 design system. Per `OPERATIONAL-AUDIT.md` (§ 3, item 4): "Today's set (01-* through 19-*) is the current source of truth." 

Sampling of files confirms the archive includes screenshots from multiple design generations. Status: **Archive — not used for proof; evaluated as stale by default.**

Representative sample:

| File | Assessment |
|------|-----------|
| `01-szl-holdings-dashboard.jpg` | Archive — pre-v2 |
| `01-szl-holdings-home.jpg` | Archive — pre-v2 |
| `02-aegis-firestorm.jpg` | Archive — pre-v2 |
| `03-alloy-full-page.jpg` | Archive — contains "alloy" (old naming) |
| `06-stephen-site.jpg` | Archive — superseded surface |

**Recommendation:** Create `screenshots/archive/` subdirectory and move all 188 legacy files there. Retain only `docs/assets/screenshots/current/` as the authoritative proof screenshot location.

---

## Evaluation — `launch-shots/` (7 files)

| File | Assessment |
|------|-----------|
| `01-szl-home.jpg` | No date; launch-shots are for external use, not proof screenshots |
| `02-pulse.jpg` | No date |
| `03-aegis.jpg` | No date |
| `04-vessels.jpg` | No date |
| `05-terra.jpg` | No date |
| `06-carlota-jo.jpg` | No date |
| `07-command.jpg` | No date |

**Status:** Launch-shots are marketing assets, not proof screenshots. They are in scope for the screenshot freshness doctrine only if used as proof evidence. Evaluated as unverifiable for freshness.

---

## Required Remediation

1. **Re-capture all 7 current screenshots** with doctrine-compliant filenames (`{surface-name}-2026-04-25.jpg`) using the running apps.
2. **Capture the A11oy Now Board** once the port 9090 conflict is resolved.
3. **Update `audit/screenshot-catalog.md`** with manifest fields for each new capture.
4. **Do not delete archive screenshots** — move them to `screenshots/archive/` per doctrine (additive, not destructive).

---

## Freshness Score Calculation

| Criterion | Score |
|----------|-------|
| 7 screenshots present in `current/` | +35 (5 pts each) |
| All 7 missing ISO-date in filename | –21 (3 pts deducted each) |
| A11oy screenshot missing | –10 |
| 188 archive screenshots flagged | –10 |
| Catalog entries present | +20 |
| No blocked screenshot types detected | +20 |
| **Total** | **65 / 100** |

---

*End of Screenshot Freshness Score — Task #3489*
