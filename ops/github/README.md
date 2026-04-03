# SZL Holdings — GitHub Operations

This directory contains documentation, scripts, and configuration for managing the `szl-holdings-platform` GitHub repository and the `stephenlutar2-hash` GitHub profile.

---

## Directory Contents

| File | Purpose |
|------|---------|
| `README.md` | This file — overview and navigation |
| `manual-checklist.md` | Step-by-step manual instructions for all GitHub operations |
| `wiki-manual-steps.md` | Full wiki enable, publish, and verify checklist |
| `repo-branding-manual-steps.md` | About text, topics, social preview, positioning steps |
| `recommended-topics.md` | Topic taxonomy with brand/technical/market rationale |
| `commands.sh` | Shell commands for GitHub CLI operations |
| `commands.ps1` | PowerShell equivalents for Windows environments |
| `repo-metadata.json` | Canonical repository settings reference |
| `repo-settings.json` | Legacy settings reference (pre-Phase 2) |
| `profile-values.md` | Recommended GitHub profile field values |
| `release-plan.md` | Release tagging and publishing strategy |

---

## Primary Operations

### Repository Branding

Apply canonical branding to `szl-holdings-platform`:
- About description and website URL
- Topics (11 recommended — see `recommended-topics.md`)
- Social preview image (see `docs/media/social-preview/`)

**Quick path:** `ops/github/repo-branding-manual-steps.md`

### Wiki Setup & Sync

Enable the GitHub Wiki and publish all 12 seed pages:
- Enable wiki in repository settings
- Initialize wiki repo, clone locally
- Run sync pipeline: validate → export → commit

**Quick path:** `ops/github/wiki-manual-steps.md`  
**Sync scripts:** `scripts/wiki/prepare-wiki-pages.ts`, `export-docs-to-wiki.ts`, `wiki-commit.sh`

### Topic Update

Apply or update repository topics via API or manual UI steps.

**Quick path:** `ops/github/recommended-topics.md`  
**Automation:** `scripts/github/update-topics.ts`

### Social Preview

Upload the repository social preview image.

**Quick path:** `scripts/github/update-social-preview-guide.md`  
**Spec:** `docs/media/social-preview/social-preview-spec.md`

### Release Creation

Create a new GitHub Release for a version tag.

**Quick path:** `release-plan.md`  
**Automation:** `commands.sh` (step [4/6])

### Label Bootstrapping

Create the canonical set of issue labels for the repository.

**Quick path:** `commands.sh` (step [5/6])

---

## GitHub CLI vs Manual

Most operations can be performed either via the GitHub CLI (`gh`) or manually through the GitHub web interface.

**GitHub CLI** (`gh auth login` required):
- Faster for scripted operations
- See `commands.sh` for all CLI commands

**GitHub Web Interface:**
- No authentication setup required
- See `manual-checklist.md`, `wiki-manual-steps.md`, and `repo-branding-manual-steps.md`

---

## Authentication

To use GitHub CLI:
```bash
gh auth login
# Follow the prompts
gh auth status  # Verify
```

For REST API automation (topics, etc.):
```bash
export GITHUB_TOKEN=<your-token>
npx tsx scripts/github/update-topics.ts
```
