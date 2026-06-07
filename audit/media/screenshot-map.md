# SZL Holdings — Screenshot Map

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** All screenshots referenced in README, public docs, and marketing materials

---

## Screenshots Inventory

All screenshots are located in `assets/readme/products/`. The README references 3 screenshots directly via markdown image syntax.

| File | Dimensions | Referenced In | Route/Screen | Status |
|---|---|---|---|---|
| `szl-holdings-dashboard.jpg` | 1280×720 | README.md | SZL Holdings landing (`/`) | ✅ Retaken 2026-04-21 |
| `aegis-command.jpg` | 1280×720 | README.md | Aegis Unified Defense (`/aegis/`) | ✅ Retaken 2026-04-21 |
| `vessels-maritime.jpg` | 1280×720 | README.md | Vessels maritime (`/vessels/`) | ✅ Retaken 2026-04-21 |
| `command-portal.jpg` | Unknown | Not in README | Command portal (`/command/`) | 📁 Exists, unreferenced |
| `prism-counsel-command.jpg` | Unknown | Not in README | PRISM Counsel (archived) | ✅ Archived — `assets/readme/archive/` |
| `prism-counsel.jpg` | Unknown | Not in README | PRISM Counsel (archived) | ✅ Archived — `assets/readme/archive/` |
| `prism-counsel-matter-board.jpg` | Unknown | Not in README | PRISM Counsel (archived) | ✅ Archived — `assets/readme/archive/` |
| `prism-counsel-obligation-timeline.jpg` | Unknown | Not in README | PRISM Counsel (archived) | ✅ Archived — `assets/readme/archive/` |
| `carlota-jo.jpg` | Unknown | Not in README | Carlota Jo (`/carlota-jo/`) | 📁 Exists, consider adding |
| `terra-real-estate.jpg` | Unknown | Not in README | Terra (`/terra/`) | 📁 Exists, consider adding |
| `cortex-mobile.jpg` | Unknown | Not in README | CORTEX mobile | 📁 Exists, consider adding |
| `atlas-spatial-runtime.jpg` | Unknown | Not in README | Atlas spatial | 📁 Exists |
| `atlas-spatial-runtime-correlation.jpg` | Unknown | Not in README | Atlas correlation | 📁 Exists |
| `atlas-spatial-runtime-execute.jpg` | Unknown | Not in README | Atlas execute | 📁 Exists |
| `imperium-cloud.jpg` | Unknown | Not in README | Imperium (archived) | ✅ Archived — `assets/readme/archive/` |

---

## Screenshot Capture Infrastructure

A screenshot capture script exists at `scripts/media/capture-screenshots.sh` and is available via `pnpm capture:screens`. Screenshots should be captured with:
- Consistent viewport: 1440×900 (desktop) / 375×812 (mobile)
- Dark theme active (default for all artifacts)
- Demo data seeded (`pnpm seed:all`)
- User authenticated (demo credentials)

---

## OG Cards

OG (Open Graph) card generation is available via `pnpm generate:og` (Python 3 + Pillow required). OG card check: `pnpm qa:og`.

Status: Script exists; not verified as generated in current build.

---

*Retake list: `audit/media/retake-list.md`*  
*Approval status: `audit/media/public-screenshot-approval.md`*
