# Deleted & Relocated Noise Files — Task #2937

**Date:** 2026-04-26  
**Task:** Rehaul 2/9 — Repo hygiene & structural cleanup  
**Commit:** `chore: remove tracked noise and normalize repo structure`

---

## Summary

140 file-level git operations performed across 3 categories:
- **Deleted from git** (tracked junk removed): 65 files
- **Moved to canonical location** (git mv): 75 files
- **Deleted from disk only** (were already untracked): all dirs below

---

## A. Files / Dirs Removed from Git Tracking (git rm)

### `X-LAUNCH-SERIES/` — 20 files
**Reason:** Unpacked social launch content dir (LinkedIn/X posts, screenshots). Not source code. Content superseded by `docs/` and `audit/`. All screenshots duplicated across other dirs.

| Path | Reason |
|------|--------|
| `X-LAUNCH-SERIES/LAUNCH-PLAYBOOK.docx` | Binary Word doc; not source |
| `X-LAUNCH-SERIES/README.txt` | Ad-hoc note |
| `X-LAUNCH-SERIES/screenshots/monday/*.jpg` (13 files) | Stale launch captures |
| `X-LAUNCH-SERIES/screenshots/sunday/*.jpg` (3 files) | Stale launch captures |
| `X-LAUNCH-SERIES/screenshots/thursday/*.jpg` (2 files) | Stale launch captures |

### `a11oy-launch-content/` — 16 files
**Reason:** A11oy-specific launch export dir. Contains `.mp4` demo video, Word docs, and screenshots. All are binary/generated artefacts not appropriate for source control.

| Path | Reason |
|------|--------|
| `a11oy-launch-content/a11oy-demo-walkthrough.mp4` | Large binary video |
| `a11oy-launch-content/linkedin-metrics-positioning.docx` | Binary Word doc |
| `a11oy-launch-content/medium-alignment-risk-analysis.docx` | Binary Word doc |
| `a11oy-launch-content/substack-the-missing-layer.docx` | Binary Word doc |
| `a11oy-launch-content/screenshots/*.jpg` (12 files) | Stale launch captures |

### `a11oy-launch-content.zip` — 1 file
**Reason:** Root-level 5.3 MB zip archive; binary blob; source of `a11oy-launch-content/` above.

### `demo-assets/` — 27 files
**Reason:** Carousel slides, LinkedIn markdown posts, a PDF investor carousel, and screenshot copies. All are generated/marketing content, not source. Carousel generation script belongs in `scripts/` if needed.

| Path | Reason |
|------|--------|
| `demo-assets/carousel-slides/*.jpg` (10 files) | Generated image slides |
| `demo-assets/screenshots/*.jpg` (10 files) | Duplicate launch captures |
| `demo-assets/generate-carousel.mjs` | Standalone build script (root noise) |
| `demo-assets/szl-holdings-investor-carousel.pdf` | Binary PDF |
| `demo-assets/CAROUSEL_README.md` | Orphaned doc |
| `demo-assets/README.md` | Orphaned doc |
| `demo-assets/linkedin-*.md` (3 files) | Marketing copy |

### `media/README.md` — 1 file
**Reason:** Orphaned README for the now-removed `media/` root dir. Its content (`screenshots/` and `brand-kit/`) has been relocated to `docs/media/`; the README itself is superseded.

| Path | Reason |
|------|--------|
| `media/README.md` | Orphaned dir README; dir relocated to `docs/media/` |

---

## B. Files / Dirs Moved to Canonical Location (git mv)

### `media/screenshots/` → `docs/media/screenshots/` — 22 files
**Reason:** Canonical screenshot home per task spec is `docs/media/screenshots/`. Files were in `media/screenshots/` which is a non-standard root dir.

Moved subdirs: `aegis/`, `command/`, `counsel/`, `lyte/`, `prism-counsel/`, `pulse/`, `sentra/`, `szl-demo-video/`, `szl-holdings-mobile/`, `szl-holdings/`, `terra/`, `vessels/`

### `media/brand-kit/tokens.md` → `docs/media/brand-kit/tokens.md` — 1 file
**Reason:** Brand token documentation consolidated under `docs/media/` alongside screenshots.

### `launch/` → `audit/launch/` — 52 files
**Reason:** Launch readiness audits and scorecards are audit documents. Canonical audit home per task spec is `audit/`. Entire directory tree relocated.

Moved: `00_repo_truth.md`, `01_ability_matrix.json`, `02_mock_register.md`, `03_visibility_gaps.md`, `04_dead_surface_report.md`, `FINAL_*.{md,csv}` (4 files), `NEXT_STEPS_FOR_OPERATOR.md`, plus subdirs `backend/`, `data/`, `demo/`, `ops/`, `perf/`, `products/`, `release/`, `security/`, `tests/`, `web/`

---

## C. Untracked Files / Dirs Deleted from Disk

These existed on disk but were **not git-tracked** (already gitignored or never added). Deleted to clean working tree.

| Path | Reason |
|------|--------|
| `backups/` | DB dumps (`.sql.gz`) and old `.tsx` file snapshots. Not source. Already gitignored. |
| `deliverables/` | Launch PDFs, newsletter zip, `linkedin-4-17.zip`. Binary exports. Already gitignored. |
| `exports/` | PDF, `tar.gz` archives, stray `lyte-logo.svg`. Binary exports. Already gitignored. |
| `launch-shots/` | 7 stray `.jpg` screenshots. Already gitignored. |
| `output/` | Generated X/Substack launch kits with embedded `.py` build scripts and images. |
| `screenshots/` | ~60 root-level `.jpg` screenshot dumps from various capture sessions. |
| `social-content/` | LinkedIn/Substack content calendar, banner generators, PDF guides. Not source code. |
| `spfx-webparts/` | SharePoint Framework stub (unrelated to this monorepo). |
| `.mirror-staging-test/` | Empty mirror test dir. |
| `LINKEDIN-LAUNCH.zip` | 12 MB root-level zip archive. |
| `X-LAUNCH-SERIES.zip` | 1.3 MB root-level zip archive. |
| `01-thursday-intro.zip` | Root-level launch zip. |
| `02-sunday-deep-dive.zip` | Root-level launch zip. |
| `03-monday-operator-lens.zip` | Root-level launch zip. |
| `build_carousel.py` | Root-level carousel build script (24 KB). |
| `build_video.sh` | Root-level video build script. |

---

## D. .gitignore Additions (Task #2937 section)

New patterns added to prevent regression:

```
/X-LAUNCH-SERIES/        — launch content dir
/X-LAUNCH-SERIES.zip     — launch zip
/a11oy-launch-content/   — launch content dir
/a11oy-launch-content.zip — launch zip
/demo-assets/            — carousel/screenshots export dir
/launch/                 — launch audit dir (migrated to audit/launch/)
/media/screenshots/      — stale root media path
/media/brand-kit/        — stale root media path
/launch-shots/           — stray screenshot captures
/screenshots/            — stray screenshot captures
/output/                 — generated output kits
/backups/                — DB dumps / file backups
/deliverables/           — binary PDF/zip exports
/social-content/         — marketing content dir
/spfx-webparts/          — SharePoint stub
/build_carousel.py       — root build script
/build_video.sh          — root build script
```

## E. .replitignore Additions (Task #2937 section)

Same patterns mirrored to `.replitignore` plus a belt-and-suspenders `/*.zip` rule to exclude all root-level zip archives from deploy images.

---

## Post-cleanup Root State

The repo root now contains only:
- Config files: `.gitignore`, `.replitignore`, `.replit`, `turbo.json`, `tsconfig*.json`, `vitest*.config.ts`, `playwright.config.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `eslint.config.*`
- Top-level docs: `README.md`, `replit.md`, `threat_model.md`, `CONTRIBUTING.md` (if present)
- Workspace dirs: `artifacts/`, `packages/`, `workers/`, `docs/`, `audit/`, `scripts/`, `tests/`, `payloads/`, `proof-pack/`, `profile-readme/`, `public/`
