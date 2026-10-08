# CircleCI Setup — `szl-holdings/platform`

Last updated: 2026-10-06

## Evidence boundary

`.circleci/config.yml` defines an optional secondary CI pipeline alongside the
repository's GitHub Actions workflows. The checked-in configuration does not,
by itself, prove that the CircleCI project is connected or that a hosted run
has passed. Treat a CircleCI run as evidence only when its URL, exact source
revision, and job conclusions are recorded.

GitHub Actions remains the primary CI source for the repository. The latest
sanitized ruleset receipt in
`audit/evidence/github-platform-ruleset-summary-2026-10-06.json` does not list a
CircleCI context as a required status check. That receipt records configuration
only and is not evidence of any check conclusion or deployment state.

## Pipeline summary

Once an authorized operator connects the repository to CircleCI, the `ci`
workflow is configured for branch events and ignores tags. It declares these
jobs:

| Job | Exact repository command or contract | Nearest GitHub Actions coverage |
|---|---|---|
| `lint` | `pnpm run lint` | `Lint` in `.github/workflows/ci.yml` (the GitHub job uses `lint:ci`, so it is not command-identical) |
| `typecheck` | `pnpm run typecheck` | `Typecheck` in `.github/workflows/ci.yml` |
| `unit-test` | `pnpm run test`; the config points test-result and artifact collection at `coverage` | `.github/workflows/tests.yml` |
| `build` | `pnpm run build` | `Build All Artifacts` in `.github/workflows/build.yml` |
| `integration-test` | Builds and tests the three current backend applications, then runs local process preflights and probes both `/healthz` and `/readyz` | No command-identical GitHub Actions job |
| `secret-scan` | Downloads Gitleaks 8.21.2, verifies its pinned SHA-256, and scans committed content reachable from the checkout | `Secret Scan (Gitleaks)` in `.github/workflows/security.yml` |

`integration-test` waits for `build`. The other five jobs have no workflow
dependency on `build` and can run in parallel.

## Toolchain and dependency installation

All jobs use the sole `node24` executor, backed by `cimg/node:24.4`. This
satisfies the repository's Node.js `>=24.0.0` contract. Dependency jobs source
`scripts/activate-pnpm.sh`, verify pnpm `10.26.1` exactly, restore the pnpm-store
cache keyed by `pnpm-lock.yaml`, and run:

```bash
pnpm install --frozen-lockfile --prefer-offline
```

The cache is an optimization. The frozen lockfile remains authoritative.
GitHub Actions also requests Node 24; the former Node 22 difference no longer
exists.

## Backend integration preflight

The integration job exercises the backend applications currently named in the
configuration:

| Package | Port | Local-only configuration |
|---|---:|---|
| `@workspace/alloy-runtime-api` | 4010 | `NODE_ENV=development` |
| `@workspace/alloy-embedding-api` | 8766 | `NODE_ENV=development`, `AEF_AUTH_BYPASS=true`, `AEF_STORE_BACKEND=in-memory` |
| `@workspace/alloy-ingestion-orchestrator` | 3003 | `NODE_ENV=development` |

Before starting those processes with the package commands defined in
`.circleci/config.yml`, Turbo builds and tests the same three package filters.
Each local preflight then has up to 60 seconds to satisfy both its loopback
liveness and readiness endpoint. The job always prints the tail of the local
service logs and stores `/tmp/backend-logs` as an artifact.

This is deliberately a local, in-memory preflight. It does **not** start
PostgreSQL, run migrations, invoke `@workspace/api-server`, require an
`INTEGRATION_TEST_TOKEN`, exercise a remote environment, or establish deployed
health.

## Connecting the CircleCI project

These are operator actions, not completed state asserted by this repository:

1. Sign in to CircleCI through the GitHub identity authorized for the
   `szl-holdings` organization.
2. Grant the CircleCI GitHub integration access to `szl-holdings/platform` and
   select the existing `.circleci/config.yml`.
3. Do not add `INTEGRATION_TEST_TOKEN` for this pipeline; the current
   configuration neither reads nor needs it. The current configuration does
   not reference a project-level secret.
4. Ensure the runner can install the locked dependency graph and download the
   pinned Gitleaks archive from its GitHub release URL.
5. Run the pipeline and retain the run URL, exact 40-character revision, and
   all job conclusions before treating CircleCI as verified redundancy.

SSH debugging is optional and should be enabled only under the organization's
access policy.

## Relationship to branch protection

CircleCI and GitHub Actions are separate execution systems. Do not describe a
CircleCI source file, project connection, or local preflight as a passing
hosted check. If a CircleCI context is later proposed as required, first prove
that exact context green on the candidate head, update the protected-branch
ruleset through an authorized operator, and capture a new sanitized ruleset
receipt. Never replace an existing required GitHub check implicitly.

## Reference files

- `.circleci/config.yml` — CircleCI pipeline definition
- `.github/workflows/ci.yml` — primary lint and typecheck workflow
- `.github/workflows/tests.yml` — primary workspace test workflow
- `.github/workflows/build.yml` — primary workspace build workflow
- `.github/workflows/security.yml` — primary security and Gitleaks workflow
- `audit/evidence/github-platform-ruleset-summary-2026-10-06.json` — latest
  sanitized repository-ruleset observation
- `ops/github/manual-click-paths.md` — operator-only GitHub UI procedures
