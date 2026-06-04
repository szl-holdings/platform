# SZL Holdings — Excluded Content Policy

**Version:** 1.0  
**Date:** April 2026  
**Authority:** Stephen Lutar, Founder

---

## Purpose

This document defines the complete policy for content that must never appear in the `szl-holdings-platform` public GitHub mirror. It serves as the authoritative reference for mirror scripts, `.gitignore` configuration, and pre-push validation.

The principle governing exclusions: **when in doubt, exclude**. The public mirror is a curated representation — not a raw workspace sync.

---

## 1. Absolute Exclusions (Hard Block — Never Publish)

These categories are excluded unconditionally. Finding any of these in a mirror staging directory is a blocker for publishing.

### 1.1 Secret Material

| Pattern | Category | Why Excluded |
|---------|----------|--------------|
| `.env` | Environment secrets | Would expose live credentials |
| `.env.local` | Local environment secrets | Would expose live credentials |
| `.env.*.local` | Scoped environment secrets | Would expose live credentials |
| `.env.*` | Any env variant | Assume secret content |
| `*.env` | Misplaced env files | Assume secret content |
| Files containing `sk-*` patterns | OpenAI API keys | Live API key exposure |
| Files containing `AKIA*` patterns | AWS access keys | Live API key exposure |
| Files containing `ghp_*` patterns | GitHub personal tokens | Live token exposure |

**Enforcement:** Pre-push validation script scans for these patterns with grep. Any match is a hard error.

### 1.2 Database Artifacts

| Pattern | Category | Why Excluded |
|---------|----------|--------------|
| `backups/` | Database backup directory | Contains SQL dumps with live data |
| `*.sql.gz` | Compressed SQL dumps | Live database content |
| `*.dump` | PostgreSQL dump files | Live database schema and data |
| `*.pgdump` | PostgreSQL dump files | Live database schema and data |
| `*.sql` (if containing live data) | SQL files with data | Depends on content — scan before include |

### 1.3 Replit Internal State

| Path | Category | Why Excluded |
|------|----------|--------------|
| `.local/` | Replit agent workspace | Task files, session plans, agent state |
| `.cache/` | Build cache | Transient artifacts |
| `.canvas/` | Canvas board state | Replit UI feature — not code |
| `.cursor/` | Cursor editor state | Editor tooling |
| `.github/instructions/` | Replit internal instructions | Agent configuration |
| `.upm/` | Replit package manager state | Internal |
| `.config/` | Replit config | Internal |

---

## 2. Directory Exclusions (Quarantine Protocol)

These directories are excluded from the public mirror. They are not deleted from the workspace — they are quarantined (present in Replit, absent from mirror).

| Directory | Contents | Risk | Mirror Status |
|-----------|----------|------|---------------|
| `.archive/` | Archived historical work | MEDIUM — internal cleanup | Excluded |
| `.git-rewrite/` | Git history rewrite artifacts | HIGH — internal operation | Excluded |
| `backups/` | Database backups | CRITICAL — secret data | Excluded |
| `exports/` | Raw export output | MEDIUM — unvetted | Excluded |
| `test-results/` | CI and test output | MEDIUM — operational noise | Excluded |
| `attached_assets/` | Raw user-uploaded files | HIGH — unsorted, unvetted | Excluded |
| `social-content/` | Social media draft content | MEDIUM — not public-ready | Excluded |
| `spfx-webparts/` | SharePoint web parts | MEDIUM — internal tooling | Excluded |
| `scratch/` | Scratch work | HIGH — developer notes | Excluded |
| `temp/`, `tmp/` | Temporary files | MEDIUM — transient | Excluded |
| `node_modules/` | Dependencies | LOW — installed from source | Excluded |
| `dist/` | Build output | LOW — built from source | Excluded |

---

## 3. File Pattern Exclusions

### Binary and Archive Files

| Pattern | Why Excluded |
|---------|--------------|
| `*.bak` | Backup files — internal |
| `*.backup` | Backup files — internal |
| `*.tar.gz` | Compressed archives — check contents |
| `*.zip` (in repo root or docs) | Compressed archives — check contents |

### Build Artifacts

| Pattern | Why Excluded |
|---------|--------------|
| `*.tsbuildinfo` | TypeScript build cache |
| `.expo/` | Expo build artifacts |
| `.expo-shared/` | Expo shared state |
| `coverage/` | Test coverage output |

### Runtime Output

| Pattern | Why Excluded |
|---------|--------------|
| `*.log` | Runtime log files |
| `npm-debug.log` | npm debug output |
| `yarn-error.log` | Yarn error output |

---

## 4. Documentation Exclusions

### Internal Documentation (Always Excluded)

| Path | Why Excluded |
|------|--------------|
| `docs/internal/` | Internal strategy, operations, and implementation notes |
| `docs/internal/security/` | Detailed internal security posture |
| `docs/internal/ops/` | Internal operations documentation |
| `docs/internal/commercial/` | Commercial strategy details |
| `docs/internal/data/` | Internal data operations |
| `docs/internal/auth/` | Authentication implementation details |
| `docs/internal/analytics/` | Internal analytics docs |

### Sensitive Business Documents (Never in Workspace — Data Room Only)

| Document Type | Why Excluded |
|---------------|--------------|
| Cap table | Investor data room only |
| Financial projections | Investor data room only |
| Valuation models | Investor data room only |
| Term sheet history | Investor data room only |
| Internal legal agreements | Legal/confidential |

---

## 5. Root File Cleanup

The following root files are noisy, redundant, or superseded. They are not deleted from the Replit workspace but are moved to `.archive/root-cleanup/` to keep the public root clean.

| File | Issue | Action |
|------|-------|--------|
| `PUBLIC_RELEASE_NOTES.md` | Redundant with `docs/releases/` | Move to `.archive/root-cleanup/` |
| `PUBLIC_REPO_AUDIT_REPORT.md` | Superseded by `docs/audit/` | Move to `.archive/root-cleanup/` |
| `ECOSYSTEM_ROADMAP.md` | Redundant with `docs/architecture/platform-map.md` | Move to `.archive/root-cleanup/` |
| `ROADMAP.md` | Superseded by CHANGELOG + docs/releases | Move to `.archive/root-cleanup/` |
| `LICENSE` (no extension) | Duplicate of `LICENSE.md` | Remove |

---

## 6. Enforcement Mechanisms

### .gitignore

The workspace `.gitignore` enforces exclusions at the git level. Any content matching excluded patterns will not be staged or committed.

**Key `.gitignore` entries:**
```
.env
.env.local
.env.*.local
*.env
backups/
exports/
test-results/
.archive/
.git-rewrite/
*.sql.gz
*.dump
*.pgdump
*.bak
*.backup
social-content/
spfx-webparts/
attached_assets/
.local/
.cache/
.canvas/
.cursor/
node_modules/
dist/
```

### Mirror Preparation Script

`scripts/public-mirror/prepare-public-mirror.ts` — TypeScript script that:
1. Builds an inclusion list (explicit paths only — allowlist approach)
2. Rsyncs included content to a staging directory
3. Removes any leaked exclusions from staging
4. Produces a staging report

### Validation Script

`scripts/public-mirror/validate-public-surface.ts` — TypeScript script that:
1. Scans the staging directory for excluded patterns
2. Checks for secret pattern matches in file content
3. Verifies all required trust files are present
4. Validates documentation structure
5. Produces a validation report with PASS/FAIL status

### Pre-Push Checklist

Human verification before every mirror push. See `docs/public/public-mirror-policy.md` → Mirror Push Checklist.

---

## 7. Exceptions Process

If content normally excluded needs to be published for a specific reason:
1. Document the specific file and rationale
2. Review with Stephen Lutar (Founder)
3. Confirm no sensitive data is present
4. Add a note to this document in the `Approved Exceptions` section below
5. Ensure the exception is time-bounded or permanent, and documented as such

### Approved Exceptions

| File | Reason | Approved By | Date |
|------|--------|-------------|------|
| *(none)* | | | |

---

*This policy is maintained by Stephen Lutar, Founder.*  
*See also: [Public Mirror Policy](public-mirror-policy.md) | [Public Repo Goals](public-repo-goals.md)*
