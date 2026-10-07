# Current Release Doctrine

**Date:** October 6, 2026
**Status:** Authoritative — supersedes `release-strategy.md` and `release-governance.md` where there is conflict
**Scope:** How code becomes a build, how builds are validated, how a release is cut and rolled back, how secrets enter runtime, and how environments differ

---

## 1. How Code Becomes a Build

The SZL Holdings platform is a pnpm monorepo. The checkout contains Replit,
GitHub Actions, container, and Azure-oriented configuration, but configuration
presence is not evidence that any provider currently hosts the platform.

### Development Build

1. Code changes may be authored in any authorized checkout, including a managed
   cloud workspace.
2. Changes are committed and reviewed through Git. Provider checkpoint or
   auto-commit behavior is not assumed by this doctrine.
3. Each registered workspace package is invoked only through scripts that its
   current `package.json` actually defines.
4. The top-level build command is: `pnpm run build` (Turbo workspace graph)
5. Web frontends generally use Vite; the startable TypeScript services under
   `apps/*` use `tsc`. Python services use their package-specific checks.
6. TypeScript compilation errors fail the build.

### Build Artifacts

This is a source/build inventory, not a deployment inventory:

| Package | Build Command | Output / boundary |
|----------|-------------|--------|
| `apps/alloy-runtime-api` | `pnpm --filter @workspace/alloy-runtime-api build` | `dist/` — startable Express implementation in source |
| `apps/alloy-embedding-api` | `pnpm --filter @workspace/alloy-embedding-api build` | `dist/` — startable Express implementation in source |
| `apps/alloy-ingestion-orchestrator` | `pnpm --filter @workspace/alloy-ingestion-orchestrator build` | `dist/` — startable Express implementation in source |
| `artifacts/api-server` | No build or start script | Historical compatibility stub retaining a narrow export; it is not the canonical runnable backend |
| `a11oy` | `pnpm --filter @workspace/a11oy build` | `dist/` — Vite bundle |
| `counsel` | `pnpm --filter @workspace/counsel build` | `dist/` — Vite bundle |
| `sentra` | `pnpm --filter @workspace/sentra build` | `dist/` — Vite bundle |
| `vessels` | `pnpm --filter @workspace/vessels build` | `dist/` — Vite bundle |
| `terra` | `pnpm --filter @workspace/terra build` | `dist/` — Vite bundle |
| `carlota-jo` | `pnpm --filter @workspace/carlota-jo build` | `dist/` — Vite bundle |

### CI Validation (GitHub Actions)

The core `.github/workflows/ci.yml` workflow runs on pull requests, pushes to
`main`, and manual dispatch. It defines:

1. **Clean clone:** dependency-free invariants on Ubuntu and Windows.
2. **Lint:** `pnpm run lint:ci` after a frozen install.
3. **Type-check:** `pnpm run typecheck` after a frozen install.

Tests, builds, integration coverage, runtime audit, E2E, security,
reproducibility, and filesystem/SCA scanning are separate workflows with their
own triggers. Only the contexts in the dated authenticated ruleset receipt are
branch-required; workflow source is not enforcement evidence.

> **Runtime contract:** GitHub CI source declares Node 24 and the root-pinned
> pnpm 10.26.1. The preinstall and clean-clone contracts fail closed if the
> effective package manager differs. Reviewed container source declares
> digest-pinned Node 26 and the same exact pnpm version. Execution must still
> verify those effective versions.

---

## 2. How Builds Are Validated

### Pre-Release Checklist

Before tagging any release:

- [ ] `pnpm run build` — clean workspace build, no errors
- [ ] `pnpm run typecheck` — no TypeScript errors
- [ ] `pnpm run lint:ci` — no lint or environment-coverage errors
- [ ] `pnpm test` — all configured contract and workspace tests pass
- [ ] Run the applicable source and route smoke suites, including `pnpm qa:site`
- [ ] For each promoted service, bind `/healthz` and `/readyz` semantics to the exact deployed source/image and dependency state
- [ ] Review `CHANGELOG.md` entry for the release
- [ ] No new `console.log` or debug artifacts in production code
- [ ] No secrets committed (verify with `git diff`)
- [ ] Screenshots updated if UI changed significantly

The full checklist lives at `docs/releases/release-checklist.md`.

### Release Gates

Formal release gates are documented in `docs/RELEASE_GATES.md`. Key gates:

| Gate | Requirement |
|------|-------------|
| Build | All artifacts build without error |
| Type safety | Zero TypeScript errors |
| Auth | Package-specific authentication and negative-authorization tests pass; deployed configuration is read back |
| Health | Each promoted service's health/readiness response is bound to exact deployed identity and dependencies |
| Smoke tests | Smoke test matrix passes |
| CHANGELOG | Release notes written |

---

## 3. How a Release Is Cut

SZL Holdings follows Semantic Versioning (`MAJOR.MINOR.PATCH`).

| Increment | When |
|-----------|------|
| MAJOR | Breaking API contract changes or significant architectural shifts |
| MINOR | New features or integrations — backward-compatible |
| PATCH | Bug fixes, documentation, small improvements |

### Current Version Range

- `v0.x.x` = Pre-commercial versioning policy; no deployment or customer status is inferred
- `v1.0.0` = Reserved release-policy milestone; customer or deployment state requires separate evidence

### Cutting a Release

```bash
# 1. Ensure build is clean
pnpm run build

# 2. Run smoke tests
pnpm qa:site

# 3. Tag the release
git tag -a v0.2.0 -m "v0.2.0 — Description"
git push origin v0.2.0

# 4. Create GitHub Release from the tag
#    Title: "v0.2.0 — Description"
#    Body: Contents of docs/releases/v0.2.0.md
#    Mark as pre-release if beta/RC

# 5. Deployment is a separate, receipted operation
#    This tree has no production-deployment workflow. A tag or release does
#    not establish that any provider received or is serving the release.
```

### Release Naming Convention

```
v{MAJOR}.{MINOR}.{PATCH}[-{pre-release}.{build}]

Examples:
  v0.2.0           — Minor release
  v0.2.1           — Patch release
  v1.0.0-beta.1    — Beta pre-release
  v1.0.0-rc.1      — Release candidate
```

---

## 4. How Secrets Enter Runtime

**Rule: Secrets are never committed to version control. No exceptions.**

### Configured targets and evidence boundary

- Application code reads secrets from environment variables. Real values must
  come from an authorized secret store and must never be committed.
- `.replit` declares non-secret environment defaults and Replit-oriented
  targets; it does not reveal whether a Replit vault, deployment, or production
  binding currently exists.
- Azure Key Vault and managed-identity references are target architecture in
  repository documentation/IaC. No current Azure staging or production secret
  binding was observed.
- Managed cloud-environment vault bindings, when configured, belong to the
  environment control plane rather than this repository. Draft presence is not
  runtime publication or deployment evidence.

### Secret Rotation Policy

| Secret | Rotation Schedule |
|--------|-----------------|
| Session secret | Every 90 days or on any suspicion of exposure |
| Database credentials | Every 90 days |
| API keys (Stripe, etc.) | Every 180 days |
| OAuth client secrets | Every 180 days |
| Webhook signing secrets | Every 90 days |
| Internal auth token | Every 90 days |

Full policy target: `docs/SECRETS_POLICY.md`. The schedules above are policy
requirements; this document is not a rotation receipt.

---

## 5. How Environments Differ

The repository describes development, staging, and production *targets*, but a
current provider/environment inventory was not observed. Treat the following as
admission requirements, not present-tense topology:

| Attribute | Development target | Staging target | Production target |
|-----------|--------------------|----------------|-------------------|
| Host | Managed/local workspace; provider **UNKNOWN** | **UNKNOWN** until a deployment receipt identifies it | **UNKNOWN** until a deployment receipt identifies it |
| Database | Disposable or isolated development database | Isolated staging database required; provider **UNKNOWN** | Isolated production database required; provider **UNKNOWN** |
| Secrets | Authorized development vault binding | Separate staging vault binding required | Separate production vault binding required |
| Auth | Source supports Replit OIDC and other integration paths; active mode **UNKNOWN** | Identity provider and tenant require deployment evidence | Identity provider and tenant require deployment evidence |
| Domain | Workspace/local URL as configured | No current staging-domain receipt | The bounded domain receipts do not identify the serving origin or full runtime |
| Data | Synthetic/demo only | Synthetic or approved anonymized data only | Customer-data admission is **UNKNOWN / HOLD** until tenancy, security, retention, and deployment gates are evidenced |
| Rate limiting, CORS, telemetry | Local/source defaults only | Production-equivalent policy must be proved | Exact active policy must be proved |

Azure and Replit references elsewhere in the repository are configuration or
target doctrine unless a dated provider receipt says otherwise. See the
environment-promotion model for intended gates, not for proof that promotion
occurred.

---

## 6. Deployment Evidence Boundary

The current deployment platform is **UNKNOWN** from the evidence in this
checkout. Source inspection establishes that:

- `.replit` declares an autoscale application-router target and several local
  workflow/port settings; it does not prove a live Replit deployment.
- `.github/workflows/deploy-staging.yml` is a fail-soft Replit staging trigger.
  It can skip for missing credentials and treats remote failures as warnings,
  so workflow presence or success is not a deployment receipt.
- No `.github/workflows/deploy-production.yml` exists in the current tree.
- Azure Bicep files and integration code are target/source artifacts, not an
  observed Azure environment.
- The dated domain homepage receipts do not establish origin provider,
  database, deployed revision, or customer-data handling.

See `docs/releases/current-environment-promotion-model.md` for intended
promotion gates. Record provider, exact source/image identity, configuration,
health/readiness, data classification, and rollback readback before naming any
environment production.
