# GitHub Operating Model — SZL Holdings Platform

Last updated: 2026-04-16

This document defines how we use GitHub as the platform for source control, code review, CI/CD, and release management. It is the authoritative reference for team process.

---

## Repository Structure

| Area | Path | Description |
|------|------|-------------|
| Monorepo root | `/` | pnpm workspace root |
| Shared libraries | `/lib/` | Platform primitives shared across artifacts |
| Artifacts (web apps) | `/artifacts/` | Individual deployable surfaces |
| Infrastructure | `/infra/` | IaC, infrastructure configuration |
| Operations docs | `/ops/` | Runbooks, matrices, playbooks |
| CI/CD | `/.github/workflows/` | GitHub Actions workflows |
| Docs | `/docs/` | Product and architecture documentation |
| Scripts | `/scripts/` | Dev tooling, QA scripts, seed scripts |

---

## Branch Strategy

| Branch | Purpose | Protected |
|--------|---------|-----------|
| `main` / `master` | Canonical trunk — always deployable | Yes |
| `feat/<name>` | Feature work | No |
| `fix/<name>` | Bug fixes | No |
| `chore/<name>` | Tooling, config, non-functional | No |
| `release/<version>` | Release preparation branches | No |

**Golden rule**: `main` must always pass CI and be deployable to production. Never commit directly to `main`.

---

## Workflow: Feature Development

```
1. Branch off main:  git checkout -b feat/your-feature
2. Work in small, focused commits using Conventional Commits format
3. Open a Pull Request against main
4. CI runs automatically (lint, typecheck, test, build, E2E)
5. Request review — CODEOWNERS are auto-requested
6. Merge only when CI is green and reviews are approved
7. Delete the feature branch after merge
```

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | Use for | Version bump |
|------|---------|-------------|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `chore` | Build, tooling, deps | patch |
| `refactor` | Code restructure without behavior change | patch |
| `docs` | Documentation only | patch |
| `test` | Test additions or fixes | patch |
| `perf` | Performance improvement | patch |
| `ci` | CI/CD changes | patch |
| `BREAKING CHANGE` (footer) | Breaking API/behavior change | major |

**Examples:**

```
feat(vessels): add freight rate benchmarking to voyage P&L
fix(api-server): correct multi-tenant org_id scoping in route handler
chore(deps): update pnpm to 9.15.0
feat!: rename API response shape for /api/intelligence (BREAKING CHANGE)
```

---

## CI Workflow Map

| Workflow file | Triggers | Purpose |
|--------------|---------|---------|
| `ci.yml` | PR + push to main | Lint, typecheck, test, build (CI Gate) |
| `e2e.yml` | PR + push to main | Playwright E2E across all apps |
| `lighthouse.yml` | PR + push to main | Lighthouse perf/accessibility audits |
| `security.yml` | PR + push to main + weekly | Dependency scan, SBOM generation |
| `codeql.yml` | PR + push to main + weekly | SAST via GitHub CodeQL |
| `dependency-review.yml` | PRs only | License and vulnerability review on new deps |
| `release.yml` | Push to main + manual | Auto-version, tag, and create GitHub Release |
| `deploy-staging.yml` | Push to main | Deploy to staging (reads `REPLIT_STAGING_*` from `staging` environment) |
| `deploy-production.yml` | Release published + manual | Deploy to production (reads env secrets via `production` environment) |
| `container-publish.yml` | Release published + tags | Build and push Docker images to GHCR |
| `npm-publish.yml` | Release published + tags | Publish npm packages to GitHub Packages |
| `prism-counsel-ci.yml` | PRs + push to main (path-filtered) | Prism Counsel–specific CI checks |

All workflows must pass before a PR may be merged. The **CI Gate** and **E2E Gate** jobs act as required status checks.

---

## Code Review Standards

- Every PR requires at least **1 approving review** before merge
- CODEOWNERS (`.github/CODEOWNERS`) auto-assigns reviewers based on changed paths
- Reviewers are expected to:
  - Verify correctness, not just style
  - Check security implications for new API endpoints
  - Confirm tests exist for new functionality
  - Validate CHANGELOG entry for notable changes
- Authors must respond to or resolve all reviewer comments before merge

---

## Merging Rules

- **Squash merge** is preferred for feature and fix branches — keeps `main` history clean
- **Merge commit** is acceptable for release branches or large multi-commit migrations
- **No force pushes to main** — ever
- Delete the source branch after merge (configured in repo settings)

---

## Dependency Management

- Dependencies are managed via **pnpm** with a shared catalog in `pnpm-workspace.yaml`
- **Dependabot** is configured in `.github/dependabot.yml` for weekly updates
- Pin all GitHub Actions to SHA in workflow files (Dependabot keeps them updated)
- Review all Dependabot PRs within 7 days — do not let them accumulate

---

## Security Posture

- **CodeQL** scans run on every push to main and weekly
- **Dependency review** blocks PRs that introduce high/critical CVEs
- **SBOM** is generated on every push to main (90-day artifact retention)
- No secrets committed to the repository — use GitHub Environments for deployment secrets and Replit Secrets panel for workspace secrets
- Security-sensitive paths in CODEOWNERS require owner review

See `/ops/github/actions-secret-matrix.md` for the full secrets inventory.

---

## Release Process Summary

Releases are automated via `release.yml`:

1. Push to `main` triggers the release workflow
2. Workflow auto-detects version bump from commit messages (Conventional Commits)
3. A new SemVer tag is created and pushed
4. A GitHub Release is published with auto-generated changelog
5. Publishing the release triggers `deploy-production.yml`

See `/ops/github/release-governance.md` for full release governance details.
