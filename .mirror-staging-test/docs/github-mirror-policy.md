# GitHub Mirror Policy

## Source of Truth

The authoritative source of truth for the SZL Holdings platform codebase is the **live Replit workspace**. All active development, feature work, and integrations happen in Replit.

## Mirror Repository

**Repository**: `stephenlutar2-hash/szl-holdings-platform`
**Branch**: `master`

This GitHub repository is a **public code mirror** — a clean, professional representation of the live platform state intended for partners, investors, and enterprise evaluators.

## Update Cadence

The mirror is updated:
- After significant feature milestones
- Before investor or partner reviews
- When the platform state has materially changed
- At the discretion of the founder

## What Is Published

- All application source code (`artifacts/`)
- Shared libraries (`lib/`)
- Infrastructure templates (`infra/`)
- Scripts and tooling (`scripts/`)
- Documentation (`docs/`)
- Brand assets (`social-content/`)
- Marketplace packages (`packages/`)
- Configuration templates (`.env.example`, `tsconfig.json`, etc.)
- Current UI screenshots (`docs/screenshots/`)

## What Is Excluded

- `.env` files with real secrets
- `node_modules/`
- `dist/` build outputs
- `.local/` Replit agent workspace
- `.cache/` temporary files
- `attached_assets/` (user-uploaded payload dumps)
- Replit-specific runtime files

## Predecessor Repository

If the original repository (`stephenlutar2-hash/szl-holdings-platform`) was previously archived, this mirror continues its lineage. The archived repository remains as a historical reference.

## Branch Strategy

- `master` — The single published branch, always clean and buildable
- No feature branches are published to the mirror
- All branching and merging happens within the Replit workspace
