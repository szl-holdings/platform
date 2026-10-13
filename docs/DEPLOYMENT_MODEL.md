# SZL Holdings — Deployment Model and Evidence Boundary

**Date:** October 6, 2026
**Status:** Source-declared targets reconciled; live deployment topology **UNKNOWN**
**Audience:** Engineering, DevOps, and technical diligence reviewers

---

## Summary

This checkout proves deployment-related source configuration, not a live
deployment. The current evidence supports only these statements:

1. `.replit` declares an application-router/autoscale target, Node 24,
   Python 3.11, PostgreSQL 16, local workflows, and environment defaults.
2. Six tracked `.replit-artifact/artifact.toml` files declare static web build
   and path-routing targets.
3. `.github/workflows/deploy-staging.yml` declares a fail-soft Replit staging
   trigger. It can skip for missing credentials and converts remote failures to
   warnings, so neither file presence nor a green job proves deployment.
4. No `.github/workflows/deploy-production.yml` exists in the current tree.
5. `infra/` contains Azure-oriented Bicep templates. They are target artifacts,
   not evidence of an Azure subscription, resource, secret binding, or runtime.
6. The bounded domain receipts do not identify serving provider, exact deployed
   revision, backend health, database, or customer-data state.

Therefore no current Replit, Azure, Hugging Face, Hetzner, or other production
host is asserted here. Provider, environment, and customer-data admission stay
**UNKNOWN / HOLD** until a dated deployment and readback receipt establishes
them.

---

## Replit-Oriented Source Configuration

### Root declaration

| Source declaration | What it establishes | What remains unknown |
|---|---|---|
| `.replit [deployment]` uses `router = "application"` and `deploymentTarget = "autoscale"` | A Replit target is configured in source | Whether a deployment exists, is current, or serves traffic |
| `.replit modules` lists Node 24, Python 3.11, and PostgreSQL 16 | Requested environment versions | Installed production versions and active database identity |
| `.replit [userenv.production]` contains non-secret defaults | Intended Replit-target environment values | Active values, secret bindings, and production use |
| `.replit [postMerge]` names `scripts/post-merge.sh` | A provider hook is declared | Whether it executed for any merge and with what result |
| Root `[[artifacts]]` lists `artifacts/api-server` and `artifacts/mockup-sandbox` | Two legacy artifact registrations remain | Whether either registration is valid or deployed |

`artifacts/api-server` is a historical compatibility stub. Its current package
defines only a typecheck script and one narrow route export; it has no build or
start script. The root artifact registration does not turn that stub into a
runnable canonical backend and should be reconciled before any deployment.

### Per-artifact route targets

The following paths are source declarations only:

| Configuration | Declared path | Build/serve target |
|---|---|---|
| `artifacts/a11oy/.replit-artifact/artifact.toml` | `/a11oy/` | Vite build, static serve |
| `artifacts/carlota-jo/.replit-artifact/artifact.toml` | `/carlota-jo/` | Vite build, static serve |
| `artifacts/counsel/.replit-artifact/artifact.toml` | `/counsel/` | Vite build, static serve |
| `artifacts/sentra/.replit-artifact/artifact.toml` | `/sentra/` | Vite build, static serve |
| `artifacts/terra/.replit-artifact/artifact.toml` | `/terra/` | Vite build, static serve |
| `artifacts/vessels/.replit-artifact/artifact.toml` | `/vessels/` | Vite build, static serve |

No current deployment receipt establishes that these paths are reachable or
that a Replit router applies the files. The separate dated domain-homepage
receipt is intentionally narrower than this source inventory.

---

## Backend Source Topology

The old claim that `artifacts/api-server` is the single Express backend is no
longer true of the current tree.

| Source path | Current source role | Evidence boundary |
|---|---|---|
| `artifacts/api-server` | Historical compatibility stub with one exported route | Not startable; not deployment authority |
| `apps/alloy-runtime-api` | Startable TypeScript/Express runtime API | Source implementation only |
| `apps/alloy-embedding-api` | Startable TypeScript/Express embedding gateway | Source implementation only |
| `apps/alloy-ingestion-orchestrator` | Startable TypeScript/Express ingestion control plane | Source implementation only |
| `apps/eval-runner`, `apps/substrate-inference`, `apps/energy-harvest`, `apps/mesh-resilience`, `apps/revenue-estimate`, `apps/verify-api` | Python/FastAPI implementations present in source | Presence does not prove deployment or whole-platform authority |
| `services/*` and `workers/*` | Additional TypeScript and Python services/workers | Inspect each package contract separately |

The three startable TypeScript apps expose package-specific health/readiness
code paths. Those source handlers and their local tests are not a whole-platform
health receipt. An operator must bind a health response to exact deployed
source/image identity and dependencies before using it for promotion.

---

## GitHub Actions and Live Merge Gate

`.github/workflows/ci.yml` declares clean-clone checks on Ubuntu and Windows,
followed by lint and full-workspace typecheck. Tests, builds, runtime audit,
E2E, security, reproducibility, and filesystem/SCA scanning are declared in
separate workflows. Workflow presence does not itself make a context required
or prove a hosted conclusion.

The authenticated repository-ruleset receipt at
`audit/evidence/github-platform-ruleset-summary-2026-10-06.json` records five
required contexts for `main`:

- `Runtime Audit (audit:full)`
- `Security Gate (blocking)`
- `E2E Gate`
- `severity-gate`
- `lockfiles / No lockfile references a Replit-internal registry host`

`severity-gate` is already required in that receipt. Grype and reproducibility
are source-declared gates but were not in the observed required list. Settings
do not prove that any context passed for a candidate SHA.

The source toolchain contract is Node >=24 with pnpm 10.26.1 exactly. GitHub,
CircleCI, `.replit`, and devcontainer configuration declare Node 24; reviewed
Node service Dockerfiles declare digest-pinned Node 26. Execution must still
verify the effective versions.

### Staging source declaration

`.github/workflows/deploy-staging.yml` triggers on pushes to `main`/`master`
and attempts a Replit API call only when staging secrets are present. It exits
successfully when credentials are missing and treats curl/HTTP failures as
warnings. This is a best-effort trigger, not a release admission gate or a
staging deployment receipt. Secret presence and hosted outcomes are
**UNKNOWN**.

### Production workflow

A production deployment workflow is **absent** from the current tree. There is
no `.github/workflows/deploy-production.yml`. Release, package-publication, and
post-deploy-smoke workflows do not substitute for a production promotion
transaction. Production deployment remains blocked until a fail-closed,
exact-artifact workflow and an authorized provider readback are defined and
observed.

---

## Azure-Oriented Target Artifacts

`infra/main.bicep` and modules for Container Apps, PostgreSQL, Redis, Key Vault,
Front Door, Blob Storage, Service Bus, networking, monitoring, Static Web Apps,
and Document Intelligence are present. Their presence establishes source
templates only.

Before any Azure claim, record at minimum:

1. authorized subscription, tenant, region, and resource-group identity;
2. successful template validation/deployment against the exact source revision;
3. immutable image/artifact identities and vulnerability attestations;
4. separate secret bindings and managed identities;
5. database migration, tenancy, backup/restore, and rollback evidence;
6. DNS/TLS routing plus health/readiness and observability readback; and
7. data-classification approval before any customer data is admitted.

Azure AD/Entra, SCIM, Power BI, or other integration code does not prove Azure
hosting, tenant consent, or production enablement.

---

## Rollback and Emergency Boundary

Git revert, provider rollback/checkpoint, database restore, and artifact
redeployment are possible procedure targets, not verified capabilities in this
report. No current provider checkpoint, database snapshot, recovery-point
objective, restoration test, or deployed artifact identity was observed.

Before production promotion, prove a rollback against the exact candidate:

1. capture the pre-promotion source and immutable artifact identities;
2. back up and verify the database or durable state;
3. deploy and perform bounded health/readiness/semantic checks;
4. roll back application and compatible schema/state changes;
5. verify traffic, data integrity, and audit continuity after rollback; and
6. retain provider responses and timestamps as a sanitized receipt.

---

*Update this document from repository source and dated provider receipts. Never
infer live deployment, production readiness, or customer-data handling from
configuration files alone.*
