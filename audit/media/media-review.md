# Media Review — SZL Holdings Screenshot & Asset Audit

**Produced:** Phase D, April 2026  
**Scope:** All screenshot, image, and media assets across `screenshots/`, `media/`, `launch-shots/`, `demo-assets/`, `assets/readme/`, `profile-readme/assets/`

---

## Classification Key

| Status | Meaning |
|--------|---------|
| **KEEP** | Current, used in public-facing surfaces; remain in place |
| **KEEP-ARCHIVE** | Valid content but not currently linked; keep on disk, not in README |
| **QUARANTINE** | Ambiguous (may be dated, duplicate, or working draft); moved to `archive/phase-d-media/` for human review |
| **DELETE** | Non-image files, binary archives, or clearly redundant scripts in screenshot directories |

---

## `assets/readme/products/` — README-Linked Product Screenshots

These are the images directly referenced in the public `README.md`. They are the highest-trust surface.

| File | Classification | Notes |
|------|---------------|-------|
| `szl-holdings-dashboard.jpg` | **KEEP** | Active product; command portal hero |
| `aegis-command.jpg` | **KEEP** | Active security domain; enterprise admin view |
| `vessels-maritime.jpg` | **KEEP** | Active domain pack |
| `terra-real-estate.jpg` | **KEEP** | Active domain pack |
| `command-portal.jpg` | **KEEP** | Active cross-domain command surface |
| `carlota-jo.jpg` | **KEEP** | Active domain pack |
| `cortex-mobile.jpg` | **KEEP** | Active mobile command; CORTEX |
| `prism-counsel.jpg` | **KEEP-ARCHIVE** | Product archived (Task #634); removed from README Screens section; file retained on disk |
| `prism-counsel-command.jpg` | **KEEP-ARCHIVE** | Archived product |
| `prism-counsel-matter-board.jpg` | **KEEP-ARCHIVE** | Archived product |
| `prism-counsel-obligation-timeline.jpg` | **KEEP-ARCHIVE** | Archived product |
| `imperium-cloud.jpg` | **KEEP-ARCHIVE** | Product archived (Task #920); removed from README Screens section; file retained on disk |
| `atlas-spatial-runtime.jpg` | **KEEP-ARCHIVE** | ATLAS runtime; not in current README; internal feature |
| `atlas-spatial-runtime-correlation.jpg` | **KEEP-ARCHIVE** | ATLAS runtime; not in current README |
| `atlas-spatial-runtime-execute.jpg` | **KEEP-ARCHIVE** | ATLAS runtime; not in current README |

---

## `screenshots/` — Root-Level Screenshot Store

### Non-Image Files (Delete)

| File | Classification | Reason |
|------|---------------|--------|
| `generate-pdf.mjs` | **DELETE** | Script file; does not belong in screenshots directory |
| `linkedin-post.md` | **DELETE** | Marketing markdown; does not belong in screenshots directory |
| `szl-portfolio.pdf` | **DELETE** | PDF portfolio export; binary, 11 pages; not a screenshot |
| `szl-portfolio.tar.gz` | **DELETE** | Binary archive; not a screenshot |
| `szl-portfolio.zip` | **DELETE** | Binary archive; not a screenshot |

### Working / Draft Subdirectories (Quarantine)

| Directory | Classification | Count | Notes |
|-----------|---------------|-------|-------|
| `screenshots/raw/` | **QUARANTINE** | 28 files | Raw captures; unprocessed; for human review |
| `screenshots/working/` | **QUARANTINE** | 23 files | Working drafts; may contain outdated UI states |
| `screenshots/new/` | **QUARANTINE** | 14 files | Labeled "new" but date-ambiguous; for human review |

### Stephen / Founder Personal Shots

| File | Classification | Notes |
|------|---------------|-------|
| `06-stephen-site.jpg` | **QUARANTINE** | Personal site screenshot; stephen-site artifact removed |
| `10-stephen-lutar.jpg` | **QUARANTINE** | Founder personal photo |
| `12-stephen-investor.jpg` | **QUARANTINE** | Investor persona shot |
| `13-szl-founder.jpg` | **QUARANTINE** | Founder shot |
| `stephen/` subdirectory | **QUARANTINE** | All founder personal shots; for human review |
| `stephen-*.jpg` files | **QUARANTINE** | Personal/marketing shots; not product screenshots |

### Numbered Launch Sequence (Keep as launch record)

| Files | Classification | Notes |
|-------|---------------|-------|
| `01-szl-holdings-dashboard.jpg` through `09-carlota-jo.jpg` | **KEEP-ARCHIVE** | Numbered launch sequence; valid product shots; not in README but valuable |

### Active Product Screenshots (Keep-Archive)

The remaining product-named JPGs in `screenshots/` (e.g., `aegis-command.jpg`, `vessels-maritime.jpg`, `terra-hero.jpg`, `lyte-dashboard.jpg`, etc.) are valid product screenshots. They are not directly referenced in the main README (which uses `assets/readme/products/`) but are useful for marketing and press. Classification: **KEEP-ARCHIVE**.

### Smoke Test Screenshot

| File | Classification | Notes |
|------|---------------|-------|
| `smoke-01-szl-holdings.jpg` | **DELETE** | QA artifact; test screenshot; not a product asset |

---

## `launch-shots/` — Numbered Launch Gallery

| Files | Classification | Notes |
|-------|---------------|-------|
| `01-szl-home.jpg` through `07-command.jpg` | **KEEP-ARCHIVE** | 7-shot launch gallery; coherent set; not currently README-linked but valuable |

---

## `media/screenshots/` — Processed Screenshot Store

| Directory | Classification | Notes |
|-----------|---------------|-------|
| `media/screenshots/aegis/` | **KEEP-ARCHIVE** | Processed Aegis shots |
| `media/screenshots/command/` | **KEEP-ARCHIVE** | Processed Command Portal shots |
| `media/screenshots/counsel/` | **KEEP-ARCHIVE** | Processed Counsel shots (archived product — for review) |
| `media/screenshots/lyte/` | **KEEP-ARCHIVE** | Processed Lyte shots |
| `media/screenshots/prism-counsel/` | **KEEP-ARCHIVE** | Archived product shots; keep for reference |
| `media/screenshots/pulse/` | **KEEP-ARCHIVE** | Active product |
| `media/screenshots/sentra/` | **KEEP-ARCHIVE** | Processed Sentra shots |
| `media/screenshots/szl-demo-video/` | **KEEP-ARCHIVE** | Demo video stills |
| `media/screenshots/szl-holdings/` | **KEEP-ARCHIVE** | Main dashboard shots |
| `media/screenshots/terra/` | **KEEP-ARCHIVE** | Active domain pack |
| `media/screenshots/vessels/` | **KEEP-ARCHIVE** | Active domain pack |

---

## `demo-assets/`

| Item | Classification | Notes |
|------|---------------|-------|
| `carousel-slides/` (10 JPGs) | **KEEP-ARCHIVE** | Investor carousel deck; internal use |
| `screenshots/` (hero images) | **KEEP-ARCHIVE** | Product hero shots for demo use |
| `szl-holdings-investor-carousel.pdf` | **REMOVED** | ✅ Resolved (task #2703): deleted from the repo and added to `.gitignore`. Distribute via a private channel (private GitHub repo, encrypted storage, or investor data room link). The 10 source slides remain in `demo-assets/carousel-slides/` and the deck can be regenerated with `demo-assets/generate-carousel.mjs` for internal use. |
| `generate-carousel.mjs` | **KEEP-ARCHIVE** | Generator script; useful internally |
| Markdown files | **KEEP-ARCHIVE** | LinkedIn post drafts; internal marketing |

> ✅ **Resolved (task #2703):** `demo-assets/szl-holdings-investor-carousel.pdf` has been removed from the public repo and added to `.gitignore`. Distribute the deck via a private channel rather than the public GitHub surface.

---

## `profile-readme/assets/`

| File | Classification | Notes |
|------|---------------|-------|
| `ecosystem-map.svg` | **KEEP** | Architecture diagram; professional quality |
| `founder-card.svg` | **KEEP** | Founder identity card; appropriate for profile |
| `lyte-overview.jpg` | **KEEP** | Active product overview |
| `platform-map.svg` | **KEEP** | Platform map; accurate |
| `szl-landing-hero.jpg` | **KEEP** | Hero shot for profile README |

---

## Summary Counts

| Status | Count |
|--------|-------|
| KEEP (verified, README-linked) | 7 |
| KEEP-ARCHIVE (valid, off-README) | ~120+ |
| QUARANTINE (moved to archive/phase-d-media/) | ~70+ |
| DELETE (non-image files, binary archives) | 6 |
