# Repository Structure Audit

> Series A readiness audit · April 2026

---

## Summary

The SZL Holdings monorepo is a pnpm workspace with a well-structured artifact layout. The core product hierarchy is coherent. Key findings are around root-level noise (large binaries already gitignored, script files that belong in `scripts/`, redirect stub files) and documentation sprawl in `docs/` that is comprehensive but deep.

**Overall verdict: Structurally sound. Minor hygiene items documented below.**

---

## Root Directory Assessment

### What belongs at root ✅

The following canonical files are correctly placed at root:

```
README.md             — Public-facing entry point
CHANGELOG.md          — Release history
CONTRIBUTING.md       — Contribution policy
CODE_OF_CONDUCT.md    — Community standards
LICENSE.md            — Legal
SECURITY.md           — Vulnerability disclosure
SECURITY-CHECKLIST.md — Security controls
.gitignore            — Source control configuration
.gitleaks.toml        — Secret scanning configuration
.gitattributes        — Git attributes
biome.json            — Linter / formatter
playwright.config.ts  — E2E test configuration
package.json          — Workspace root
pnpm-workspace.yaml   — Monorepo config
pnpm-lock.yaml        — Lock file
.lighthouserc.json    — Lighthouse CI
.npmrc                — Package manager config
.nvmrc / .node-version — Node version
.oxlintrc.json        — Linter config
replit.md             — Platform documentation
replit.nix            — Nix environment
.replit               — Replit runtime
```

### What should not be at root ⚠️

| Item | Issue | Recommended Action |
|------|-------|--------------------|
| `docker-compose.yml` | Developer utility, not root-level concern | Move to `ops/local/` |
| `build_carousel.py` | Python image builder script | Move to `scripts/media/` |
| `build_video.sh` | Shell video builder | Move to `scripts/media/` |
| `pyproject.toml` | Python tooling config for scripts above | Move with scripts |
| `GITHUB_SETTINGS_APPLIED.json` | Metadata JSON | Move to `docs/github/` |
| `ACCESS-CONTROL-MATRIX.md` | Redirect stub (canonical in `docs/security/`) | Acceptable as redirect |
| `DEPLOYMENT-GUIDE.md` | Redirect stub | Acceptable as redirect |
| `KNOWN-GAPS.md` | Redirect stub | Acceptable as redirect |
| `PLATFORM_PRIMITIVES.md` | Redirect stub | Acceptable as redirect |
| `OPERATIONS-RUNBOOK.md` | Redirect stub | Acceptable as redirect |
| `INCIDENT_RESPONSE.md` | Redirect stub | Acceptable as redirect |

---

## Directory Structure Assessment

### `artifacts/` — ✅ Well-structured

All deployable surfaces correctly co-located. Archived surfaces (`firestorm/`, `imperium/`, `lyte-command-center/`) are retained on disk per intentional decisions with no registered workflow, consistent with the disposition matrix in `ops/frontier/`.

### `lib/` — ✅ Well-structured

16+ shared packages including the six platform primitives. Clear ownership boundaries.

### `packages/` — ✅ Well-structured

Config, metrics-registry, and platform-facts. Auto-generated facts pattern is solid.

### `scripts/` — ✅ Comprehensive

QA, seed, media, docs generation, brand check, metrics. Well-organized subdirectories. Python media scripts at root should be moved here.

### `docs/` — ⚠️ Deep but sprawling

Extensive documentation with 80+ top-level files. The INDEX.md provides navigation. The sprawl is a legacy of intensive documentation passes. No cleanup recommended without explicit owner direction — the content is valuable, the organization is documented in `docs/INDEX.md`.

### `ops/` — ✅ Clean

Infrastructure runbooks, mobile deployment, environment matrix. Well-organized.

### `infra/` — ✅ Present

Azure Bicep IaC. Narrow scope.

### `.github/` — ✅ Comprehensive

Full CI/CD pipeline, issue templates, PR template, CODEOWNERS, dependabot, branch protection docs.

### `archive/` — ⚠️ Monitor

Contains archived deliverables and phase materials. Source retained per disposition matrix. No gitignore issues found for tracked content.

### Root-level noise directories

| Dir | Status | Issue |
|-----|--------|-------|
| `LINKEDIN-LAUNCH/` | Tracked | Social content at root; owner to decide on archival |
| `launch-shots/` | Tracked | Old screenshot assets; superseded by `docs/assets/screenshots/` |
| `attached_assets/` | Gitignored | Payload dumps — correctly excluded |
| `.archive/` | Gitignored | Internal archive — correctly excluded |
| `.mirror-staging-test/` | Gitignored | Mirror validation — correctly excluded |
| `.github-private/` | Gitignored | Private docs — correctly excluded |
| `deliverables/` | Gitignored | Generated output — correctly excluded |
| `output/` | Gitignored | Generated output — correctly excluded |
| `backups/` | Gitignored | DB backups — correctly excluded |

---

## Monorepo Workspace Configuration

`pnpm-workspace.yaml` is present and defines workspace packages. Turbo is configured for build orchestration. TypeScript project references are in place.

**No structural issues found in workspace configuration.**

---

*Generated: April 21, 2026 — Series A GitHub Rehaul*
