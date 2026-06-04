# SZL Holdings — GitHub Operations

This directory contains operational runbooks, scripts, and configuration for managing the `szl-holdings-platform` GitHub repository and the `stephenlutar2-hash` GitHub profile.

---

## Primary Reference — docs/github/

The comprehensive governance documentation lives in `docs/github/`:

| Document | Purpose |
|----------|---------|
| [org-setup-package.md](../../docs/github/org-setup-package.md) | Org creation, canonical name, profile values, governance model |
| [pinned-repos-strategy.md](../../docs/github/pinned-repos-strategy.md) | Which repos to pin and in what order |
| [repo-cleanup-matrix.md](../../docs/github/repo-cleanup-matrix.md) | Full repo classification matrix and naming system |
| [readme-standard.md](../../docs/github/readme-standard.md) | README standard — required sections, templates |
| [security-governance-baseline.md](../../docs/github/security-governance-baseline.md) | SECURITY.md, CODEOWNERS, CONTRIBUTING.md templates |
| [enterprise-rulesets.md](../../docs/github/enterprise-rulesets.md) | Ruleset configs by tier — flagship, docs, experiment |
| [actions-ci-audit.md](../../docs/github/actions-ci-audit.md) | CI/Actions audit, hardened workflow templates |
| [gist-policy.md](../../docs/github/gist-policy.md) | Gist acceptable use policy |
| [manual-ui-checklist.md](../../docs/github/manual-ui-checklist.md) | Complete manual UI checklist with exact values and plan tiers |
| [enterprise-maturity-path.md](../../docs/github/enterprise-maturity-path.md) | Three-phase maturity path — Phase 1, 2, 3 |

---

## This Directory Contents

| File | Purpose |
|------|---------|
| `README.md` | This file — overview and navigation |
| `manual-checklist.md` | Step-by-step manual instructions for all GitHub operations (see also: `docs/github/manual-ui-checklist.md` for the full enterprise version) |
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

## Start Here

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

**Phase 1 execution:** `docs/github/manual-ui-checklist.md` — top to bottom  
**Org setup:** `docs/github/org-setup-package.md`  
**Repo governance:** `docs/github/enterprise-rulesets.md`  
**README updates:** `docs/github/readme-standard.md`

---

## GitHub CLI vs Manual

Most operations can be performed either via the GitHub CLI (`gh`) or manually through the GitHub web interface.

**GitHub CLI** (`gh auth login` required):
- Faster for scripted operations
- See `commands.sh` for all CLI commands

**GitHub Web Interface:**
- No authentication setup required
- See `manual-checklist.md`, `wiki-manual-steps.md`, and `repo-branding-manual-steps.md`
- See `docs/github/manual-ui-checklist.md` for step-by-step instructions

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
