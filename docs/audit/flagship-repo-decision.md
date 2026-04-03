# Flagship Repo Decision

## Decision
**`szl-holdings-platform`** is the canonical flagship public repo for SZL Holdings.

## Why This Repo

The SZL Holdings workspace is a monorepo containing the entire platform ecosystem: 16 deployable artifacts, 6 shared libraries, 120+ database tables, and comprehensive documentation. There is no better representation of the company's engineering depth and product breadth than the full platform workspace — properly curated.

A single flagship repo is stronger than fragmented product-specific repos because:
- It demonstrates architectural coherence (shared libraries, shared schema, shared auth)
- It shows the full signal-to-action pipeline from Lyte through Alloy to domain packs
- It presents the investor thesis in code: one platform, multiple verticals, compounding infrastructure
- It avoids the "scattered hobby projects" appearance that multiple small repos create

## What Belongs in the Flagship

### Included
- `/artifacts/` — All 16 application source directories (web + mobile)
- `/lib/` — Shared libraries (ai-engine, db, shared-ui, workflow-engine)
- `/packages/` — Shared packages
- `/docs/` — Architecture, trust, investor, buyer, design, releases
- `/infra/` — Infrastructure templates (sanitized)
- `/scripts/` — Build, mirror, and automation scripts
- `/.github/` — Templates, CODEOWNERS, issue templates
- Root trust files: README, LICENSE, SECURITY, CONTRIBUTING, CHANGELOG
- `/profile-readme/` — Profile README package

### Excluded (Private-Only)
- Database backups, SQL dumps, seed data with real values
- Environment files and secrets
- `.archive/`, `.git-rewrite/` — internal cleanup artifacts
- `test-results/`, `attached_assets/` — transient output
- `social-content/`, `spfx-webparts/` — internal-only assets
- `.local/`, `.cache/`, `.canvas/` — Replit workspace state

## What About Old Repos

Any previously mirrored public repos (if they exist) should be:
1. Archived on GitHub (Settings → Archive)
2. Unpinned from the profile
3. Left in place for link stability — do not delete

The flagship repo replaces them as the primary showcase. Old repos become historical artifacts, not competing representations.

## Profile README Repo

**`stephenlutar2-hash`** (GitHub username repo) is separate and contains only the founder profile README and visual assets. It links to the flagship repo.
