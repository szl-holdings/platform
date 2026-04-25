# Global Cleanup Report — Task #3473

**Generated:** 2026-04-25  
**Phase:** Stale-term scan and replacement

---

## Scope

Files scanned: `*.md`, `*.ts`, `*.tsx`, `*.json`, `*.html`, `public/`

Banned terms searched:
- `Bo11y`, `Bolly`, `Boss` (old product name)
- `Inca` (old architecture codename)
- `Firestorm` (old Aegis codename)
- `Business Observability Super System`
- `Explore Bo11y`
- `Official Technology Partners`
- `Canonical Arquitecture` / `Arquitecture` (misspelling)
- `ChatGPT Image` (ugly AI-gen filename prefix)
- `lorem ipsum` (placeholder text)
- `Alloy` (old product name — now A11oy)
- `Lyte` (old product name — now KORA)
- `Prism Counsel` / `PRISM Counsel` (legacy product — superseded)

---

## Findings by Term

### `Firestorm` — Screenshot filenames (stale codename for Aegis)
**Status:** Filenames only — no doc content changes; files moved to archive (see ASSET_CLEANUP_REPORT.md)

Files with stale filenames:
- `screenshots/02-aegis-firestorm.jpg`
- `screenshots/06-aegis-firestorm.jpg`
- `screenshots/aegis-firestorm.jpg`
- `screenshots/firestorm-aegis.jpg`

**Action:** Moved to `archive/old-screenshots/` — see ASSET_CLEANUP_REPORT.md

---

### `Alloy` (old product name) — Screenshot filenames
**Status:** Filenames only — moved to archive (see ASSET_CLEANUP_REPORT.md)

Files with stale Alloy-named filenames in `screenshots/`:
`02-alloy-platform.jpg`, `03-alloy-full-page.jpg`, `11-alloy-evolution-radar.jpg`, `alloy-connectors.jpg`, `alloy-dag.jpg`, `alloy-decisions.jpg`, `alloy-execution-history.jpg`, `alloy-governance.jpg`, `alloy-home.jpg`, `alloy-operator-control.jpg`, `alloy-platform.jpg` (dir), `alloy-public-page.jpg`, `alloy-signals.jpg`, `alloy-skills.jpg`, `alloy-workflows.jpg`

**Action:** Moved to `archive/old-screenshots/` — see ASSET_CLEANUP_REPORT.md

---

### `Alloy` in documentation — `profile-readme/README.md`
**Status:** Fixed

Lines 21, 23, 53 in `profile-readme/README.md` referenced "Lyte" and "Alloy" as current product names. Updated to KORA and A11oy respectively.

**Changes made:**
- Line 21: "**Lyte**" → "**KORA**" + updated description
- Line 23: "**Alloy**" → "**A11oy**" + updated description  
- Line 53: "Lyte and Alloy are not product-specific" → "KORA and A11oy are not product-specific"

---

### `Alloy` in documentation — `.github/profile/README.md`
**Status:** Fixed in rewrite

The architecture diagram contained `Signal Normalization (Alloy)`. Corrected to `Signal Normalization (A11oy)` in the full README rewrite.

---

### `Lyte` (old product name) — Screenshot filenames
**Status:** Filenames only — moved to archive

Files with stale Lyte-named filenames in `screenshots/`:
`04-lyte-command-center.jpg`, `gh-lyte-landing.jpg`, `lyte-blocker-board.jpg`, `lyte-board-clean.jpg`, `lyte-board-fresh.jpg`, `lyte-board-mode.jpg`, `lyte-capabilities.jpg`, `lyte-command-center.jpg`, `lyte-dashboard.jpg`, `lyte-demo-dashboard.jpg`, `lyte-demo-live.jpg`, `lyte-exec-command.jpg`, `lyte-exec-fresh.jpg`, `lyte-hero-clean.jpg`, `lyte-hero.jpg`, `lyte-overview.jpg`, `lyte-platform.jpg`, `lyte-signals.jpg`, `lyte/` (directory)

**Action:** Moved to `archive/old-screenshots/` — see ASSET_CLEANUP_REPORT.md

---

### `Prism Counsel` / `PRISM Counsel` — Screenshot filenames
**Status:** Filenames only — moved to archive

Files in `screenshots/`: `08-prism-counsel.jpg`, `prism-counsel-*.jpg` (10+ files)

**Note:** "PRISM Counsel" as a legacy product name is acceptable in historical audit docs where it describes what was superseded. The root README and org profile use only "Counsel" (current name).

**Action:** Screenshot files moved to `archive/old-screenshots/`

---

### `lorem ipsum` — Documentation files
**Status:** Found in historical/planning documents; not in user-facing surfaces

Files found:
- `docs/PRODUCTION_READINESS_CHECKLIST.md` — checklist template placeholders
- `docs/production-readiness.md` — planning document

**Action:** These are internal planning documents, not user-facing. No change required. Noted for human review.

---

### `Bo11y` / `Bolly` / `Boss` / `Business Observability Super System` / `Explore Bo11y`
**Status:** Found only in historical audit records

Files found: `audit/MOONSHOT_PHASE1_INVENTORY.md`, `audit/screenshot-catalog.md`, `audit/residual-risk-register.md`, `audit/db-verification.md`, and other historical audit docs.

**Action:** These appear exclusively in audit records documenting what was renamed/removed — correct historical context. No change. Noted for human review.

---

### `Inca` (architecture codename)
**Status:** Not found in current user-facing markdown or source files.

One reference in `CHANGELOG.md` (historical entry). No action required.

---

### `Canonical Arquitecture` / `Arquitecture` (misspelling)
**Status:** Found in historical audit docs only

Files: `audit/` historical reports documenting a previous misspelling that was corrected.

**Action:** Not present in user-facing docs. No change required. Noted for human review.

---

### `Official Technology Partners` (fake partner claim)
**Status:** Not found in current user-facing markdown or source files.

**Action:** None required.

---

### `ChatGPT Image` (ugly AI-gen filename prefix)
**Status:** No files with this prefix found in README-facing locations.

**Action:** None required.

---

## Summary

| Term | User-Facing Docs Fixed | Screenshot Files Archived | Historical Docs (No Change) |
|------|----------------------|--------------------------|----------------------------|
| Firestorm | — | ✅ 4 files | — |
| Alloy | ✅ profile-readme + org profile | ✅ 15 files | Audit docs (OK) |
| Lyte | ✅ profile-readme | ✅ 19+ files | — |
| Prism Counsel | — | ✅ 10+ files | Audit docs (OK) |
| lorem ipsum | — | — | ⚠️ 2 planning docs (human review) |
| Bo11y/Bolly/Boss | — | — | Audit records (OK) |
| Inca | — | — | CHANGELOG (OK) |
| Arquitecture | — | — | Audit records (OK) |
| Official Tech Partners | — | — | Not found |
| ChatGPT Image | — | — | Not found |

---

## Items Requiring Human Review

1. **`docs/PRODUCTION_READINESS_CHECKLIST.md`** — contains `lorem ipsum` placeholder text in checklist items. Review and replace with real content before publishing.
2. **`docs/production-readiness.md`** — contains `lorem ipsum` placeholder text. Review and replace.
3. Any remaining "PRISM Counsel" references in investor-facing documents served via the API server at `/api/investor-docs/*` — these are live-served docs that should be reviewed for currency.
