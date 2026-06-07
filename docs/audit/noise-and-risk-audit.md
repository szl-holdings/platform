# SZL Holdings — Noise and Risk Audit

**Version:** 1.0  
**Date:** April 2026  
**Phase:** GitHub Overhaul Phase 1  
**Authority:** Stephen Lutar, Founder

---

## Purpose

This audit catalogs every category of noisy, internal, or risky content found in the SZL Holdings Replit workspace. For each item, it documents the category, the risk if it appears in the public mirror, and the disposition (exclude, quarantine, move, or keep).

---

## 1. Risk Classification

| Risk Level | Meaning |
|------------|---------|
| **CRITICAL** | Exposure could be a security incident (secrets, credentials, PII) |
| **HIGH** | Exposure would significantly damage credibility or create legal risk |
| **MEDIUM** | Exposure would create noise, confusion, or minor credibility harm |
| **LOW** | Minor issue — cosmetic or organizational |

---

## 2. Noisy Root Files

| File | Risk | Category | Disposition |
|------|------|----------|-------------|
| `PUBLIC_RELEASE_NOTES.md` | LOW | Redundant | Quarantine from root — content exists in `docs/releases/` |
| `PUBLIC_REPO_AUDIT_REPORT.md` | LOW | Superseded | Quarantine from root — superseded by `docs/audit/` |
| `ECOSYSTEM_ROADMAP.md` | LOW | Redundant | Quarantine from root — content in `docs/architecture/platform-map.md` |
| `ROADMAP.md` | LOW | Redundant | Quarantine from root — superseded by CHANGELOG + docs/releases |
| `LICENSE` (no extension) | LOW | Duplicate | Remove — `LICENSE.md` is canonical |

**Root files to quarantine:** Move to `.archive/root-cleanup/` to preserve content without polluting the public root.

---

## 3. Directories Quarantined or Excluded

### 3.1 Critical Security Risk

| Directory | Contents | Risk | Status |
|-----------|----------|------|--------|
| `backups/` | `daily_20260401T124214Z.sql.gz`, `szl-master-20260401-184931/`, `szl-master-20260402-134816/` | CRITICAL — SQL dumps with database content | Excluded in `.gitignore` + mirror scripts |
| `.env`, `.env.*` | Live secrets and credentials | CRITICAL — secret exposure | Excluded in `.gitignore` |

**Note on `backups/`:** The directory currently contains:
- `daily_20260401T124214Z.sql.gz` — compressed SQL dump
- `backup_manifest.json` — backup metadata
- `szl-master-20260401-184931/` — point-in-time backup
- `szl-master-20260402-134816/` — point-in-time backup

All of these are excluded from the public mirror. The directory itself should never appear in a public git commit.

### 3.2 High Risk — Internal Operational Content

| Directory | Contents | Risk | Status |
|-----------|----------|------|--------|
| `attached_assets/` | Raw user-pasted files, screenshots, uploads | HIGH — unsorted, unvetted content | Excluded |
| `.git-rewrite/` | Git history rewrite artifacts | HIGH — internal cleanup state | Excluded |
| `.local/` | Replit agent workspace, task files, session plans | HIGH — agent-internal state visible to evaluators | Excluded |

### 3.3 Medium Risk — Internal Content Not for Public Consumption

| Directory | Contents | Risk | Status |
|-----------|----------|------|--------|
| `social-content/` | Draft social media content, LinkedIn banners, carousel generators | MEDIUM — unpolished draft content | Excluded |
| `spfx-webparts/` | SharePoint Framework web parts | MEDIUM — internal tooling, not platform code | Excluded |
| `test-results/` | CI/test output files | MEDIUM — operational noise | Excluded |
| `.archive/` | Archived work, old versions | MEDIUM — historical cleanup artifacts | Excluded |
| `exports/` | Raw export artifacts | MEDIUM — internal operational output | Excluded |

### 3.4 Low Risk — Transient/Build Artifacts

| Directory | Contents | Risk | Status |
|-----------|----------|------|--------|
| `node_modules/` | Installed dependencies | LOW — not meaningful to expose | Excluded |
| `dist/` | Build output | LOW — built from source | Excluded |
| `.cache/` | Build cache | LOW — transient | Excluded |
| `.canvas/` | Canvas editor state | LOW — Replit workspace feature | Excluded |
| `.cursor/` | Cursor editor state | LOW — editor tooling | Excluded |
| `.expo/` | Expo dev artifacts | LOW — mobile build cache | Excluded |

---

## 4. File Pattern Risks

### 4.1 Secret/Credential File Patterns

| Pattern | Risk | Status |
|---------|------|--------|
| `*.env`, `.env`, `.env.*` | CRITICAL | Excluded in `.gitignore` |
| `*.sql.gz` | CRITICAL | Excluded in `.gitignore` |
| `*.dump`, `*.pgdump` | CRITICAL | Excluded in `.gitignore` |

### 4.2 Internal Content File Patterns

| Pattern | Risk | Status |
|---------|------|--------|
| `*.bak`, `*.backup` | MEDIUM | Excluded in `.gitignore` |
| `NOTES.md` in root | MEDIUM | Not present — watch for future |
| `TODO.md` in root | MEDIUM | Not present — watch for future |
| `*scratch*` | LOW | Not present — watch for future |

---

## 5. Documentation Risk Inventory

### 5.1 Internal-Only Documents

| Path | Risk | Status |
|------|------|--------|
| `docs/internal/` | HIGH — internal strategy docs | Excluded in mirror scripts |
| `docs/internal/security/` | HIGH — internal security posture details | Excluded |
| `docs/internal/ops/` | HIGH — internal operations | Excluded |
| `docs/internal/data/` | HIGH — internal data ops | Excluded |
| `docs/internal/commercial/` | HIGH — commercial strategy | Excluded |
| `docs/internal/auth/` | HIGH — authentication internals | Excluded |
| `docs/internal/analytics/` | HIGH — analytics internals | Excluded |
| `docs/internal/web/` | MEDIUM — internal web docs | Excluded |

### 5.2 Investor/Confidential Documents

| Document | Risk | Status |
|----------|------|--------|
| Cap table | CRITICAL — investor data room only | Not present in workspace (correct) |
| Financial projections | HIGH — investor data room only | Not present in workspace (correct) |
| Investor-readiness gaps | MEDIUM — candid internal assessment | `docs/investor/readiness-gaps.md` — low-risk, honest positioning |

### 5.3 Redundant or Stale Documents

| Document | Risk | Status |
|----------|------|--------|
| `PUBLIC_RELEASE_NOTES.md` | LOW — superseded | Quarantine from root |
| `PUBLIC_REPO_AUDIT_REPORT.md` | LOW — superseded | Quarantine from root |
| `ECOSYSTEM_ROADMAP.md` | LOW — redundant | Quarantine from root |
| `ROADMAP.md` | LOW — redundant | Quarantine from root |

---

## 6. Social Content Risk Detail

`social-content/` contains:
- `banners/`, `logos/` — marketing visual assets (drafts)
- `content-calendar.md` — editorial schedule
- `hackajob-profile.md` — recruiting profile draft
- `generate-banners.js`, `generate-carousels.js`, `generate-linkedin-7lenses-banner.js` — generation scripts
- `generate-playbook.js`, `generate-profile-kit.js` — internal tools
- `pdf-guides/`, `screenshots/` — internal reference materials
- `README.md` — internal-only

**Assessment:** The presence of `hackajob-profile.md` and editorial calendars in a public mirror would be a credibility signal against professionalism. Exclude entirely.

---

## 7. Backup Directory Risk Detail

`backups/` contains:
- `daily_20260401T124214Z.sql.gz` — full compressed PostgreSQL dump from April 1, 2026
- `backup_manifest.json` — lists backup filenames and timestamps
- `szl-master-20260401-184931/` — snapshot backup directory
- `szl-master-20260402-134816/` — snapshot backup directory

**Assessment:** CRITICAL risk. Even `backup_manifest.json` reveals backup naming patterns and database metadata. The `.sql.gz` files contain the live database schema and potentially seeded data. This directory must never appear in any public mirror.

**Disposition:** Permanently excluded via `.gitignore`. Mirror scripts verify exclusion before push.

---

## 8. Noise Suppression Summary

| Category | Count | Disposition |
|----------|-------|-------------|
| Critical security exclusions | 3 dirs + file patterns | `.gitignore` + mirror script verification |
| High-risk internal content | 4 dirs | Excluded in scripts |
| Medium-risk noisy content | 6 dirs | Excluded in scripts + .gitignore |
| Redundant root files | 4 files | Quarantine to `.archive/` |
| Internal docs (`docs/internal/`) | 8 subdirs | Excluded in scripts |
| Duplicate file (LICENSE no ext) | 1 file | Remove |

---

## 9. Ongoing Vigilance — Patterns to Watch

Before every mirror push, verify:
1. No new `.env` files committed
2. No new directories matching: `scratch/`, `temp/`, `tmp/`, `raw/`, `dump/`
3. No new root-level `NOTES.md`, `TODO.md`, or `DRAFT*.md`
4. No database dumps outside `backups/` (search for `*.sql.gz`, `*.dump`)
5. `docs/internal/` remains excluded from mirror scripts

---

*Noise and Risk Audit produced as part of GitHub Overhaul Phase 1.*  
*Maintained by: Stephen Lutar, Founder — SZL Holdings*
