# CircleCI Setup — szl-holdings/szl-holdings-platform

Last updated: 2026-04-26

## Overview

CircleCI provides a second CI provider alongside the existing GitHub Actions pipelines. Both systems can coexist — GitHub Actions remains the primary CI (PR checks, branch protection gates, deployments) while CircleCI is available for redundancy, faster ARM builds, or enterprise procurement requirements.

## Pipeline summary

The CircleCI pipeline is defined in `.circleci/config.yml` and runs the following jobs on every branch push:

| Job | Description | Equivalent GitHub Actions job |
|---|---|---|
| `lint` | Biome / oxlint code style checks | `lint` in `ci.yml` |
| `typecheck` | Full TypeScript type-check across the monorepo | `typecheck` in `ci.yml` |
| `unit-test` | Vitest unit tests with coverage output | `test` in `ci.yml` |
| `build` | Recursive workspace build + per-artifact build gates | `build` in `ci.yml` and `build-all` in `build.yml` |
| `integration-test` | API integration tests against a live PostgreSQL 16 service, including the health-pool saturation regression test | `integration-test` in `ci.yml` |
| `secret-scan` | Gitleaks 8.21.2 full-tree secret detection | `secret-scan` in `ci.yml` |

`integration-test` runs after `build` succeeds; all other jobs run in parallel.

## Differences from GitHub Actions

- Uses **Node 24** (matching `.nvmrc` and `package.json engines`). GitHub Actions currently uses Node 22 — that is a separate upgrade tracked elsewhere.
- PostgreSQL service containers are declared inline in the `node24-with-postgres` executor rather than as a separate `services:` block.
- Gitleaks always performs a full-tree scan (CircleCI does not expose a PR base SHA env var in the same way GitHub does; adapt to use `$CIRCLE_MERGE_BASE_SHA` if needed in future).
- Artifact upload uses CircleCI's `store_artifacts` / `store_test_results` rather than `actions/upload-artifact`.

## Connecting the CircleCI project (operator steps)

These steps are performed once by an operator with admin access to the GitHub org and the CircleCI org.

1. **Log in** to [app.circleci.com](https://app.circleci.com) with your GitHub account.
2. **Create or join the `szl-holdings` CircleCI organization** (Settings → Organization Settings).
3. **Add the project**: Projects → Add Project → select `szl-holdings/szl-holdings-platform` → click **Set Up Project**.
4. CircleCI detects `.circleci/config.yml` automatically. Select "Use Existing Config" and click **Start Building**.
5. **Set required environment variables** in Project Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `INTEGRATION_TEST_TOKEN` | Same value as the `INTEGRATION_TEST_TOKEN` GitHub Actions secret |

6. Optionally enable **SSH Debug** (Project Settings → SSH Keys) for interactive debugging of failed builds.

## Relationship to GitHub Actions

Both CI systems watch the same repository. They are independent — a failure in CircleCI does not block GitHub pull request checks, and vice versa. Branch protection rules on GitHub are enforced exclusively by GitHub Actions status checks (see `ops/github/manual-click-paths.md` §2).

To add CircleCI as a required status check on GitHub, a GitHub admin would add the relevant CircleCI check name under Settings → Rulesets → `main-protection` → Status Checks. This is not currently required.

## Reference files

- `.circleci/config.yml` — pipeline definition
- `.github/workflows/ci.yml` — GitHub Actions CI (primary)
- `.github/workflows/build.yml` — GitHub Actions build check on push to main/master
- `.github/workflows/security.yml` — GitHub Actions weekly security audit
- `ops/github/manual-click-paths.md` — GitHub UI configuration guide
