# GitHub Engineering Spine — Summary Report

Generated: 2026-04-02

## Repository: stephenlutar2-hash/szl-holdings-platform

## Executive Summary

The engineering spine has been fully locked. The repository now has production-grade CI, branch protection, security scanning, test infrastructure, and release discipline in place.

## CI/CD Pipeline

| Workflow | File | Status | Trigger |
|----------|------|--------|---------|
| CI (lint + typecheck + test + build) | `ci.yml` | Active | PR, push to master |
| Build Check (sequential build all) | `build.yml` | Active | push to master |
| E2E Tests | `e2e.yml` | Active | PR, push to master |
| CodeQL Security Analysis | `codeql.yml` | Active | PR, push, weekly |
| Dependency Review | `dependency-review.yml` | Active | PR only |
| Lighthouse Performance | `lighthouse.yml` | Active | PR, push to master |
| Release | `release.yml` | Active | Tag push (v*) |

## CI Job Matrix (ci.yml)

| Job | Purpose | Required Check |
|-----|---------|----------------|
| `CI / lint` | ESLint across workspace | Yes |
| `CI / typecheck` | TypeScript type checking | Yes |
| `CI / test` | Vitest unit + component tests | Yes |
| `CI / build-api` | API server build | Yes |
| `CI / build-web (all apps)` | 7 web apps in parallel matrix | Yes |
| `CI` (gate) | Aggregate pass/fail gate | Yes — the required check |

## Branch Protection (master)

| Rule | Value |
|------|-------|
| Require PR | Yes |
| Required approvals | 1 |
| Dismiss stale reviews | Yes |
| Require code owner reviews | Yes |
| Required status checks | 7 checks (CI, E2E, CodeQL + sub-jobs) |
| Strict status checks | Yes (branch must be up to date) |
| Require conversation resolution | Yes |
| Allow force pushes | No |
| Allow deletions | No |
| Enforce admins | Yes |

## Security Posture

| Feature | Status |
|---------|--------|
| Secret scanning | Enabled |
| Push protection | Enabled |
| Dependabot alerts | Enabled |
| Dependabot auto-fixes | Enabled |
| CodeQL scanning | Active (weekly + PR) |
| Dependency review | Active (blocks high severity) |
| CODEOWNERS | Configured |

## Test Coverage

| Layer | Framework | Files | Tests |
|-------|-----------|-------|-------|
| API / integration | Vitest + Supertest | 3 | 37 |
| Components | Vitest + Testing Library | 5 | 33 |
| E2E smoke | Playwright | 7 | 35 |

Total: 105 tests across 15 files

## Release Discipline

- `CHANGELOG.md` — Keep a Changelog format, Semantic Versioning
- `.github/RELEASE_TEMPLATE.md` — Structured release notes template
- `release.yml` — Auto-generates release notes from git log on tag push
- Versioning policy documented in `/docs/releases/versioning-policy.md`
