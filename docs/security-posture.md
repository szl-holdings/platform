# SZL Holdings — Security Posture

**Version:** 1.2
**Date:** 2026-10-11
**Classification:** Public — source posture, not a deployment attestation
**Status labels:** SOURCE-CONFIRMED · PARTIAL · UNVERIFIED · BROKEN

## Evidence boundary

This document reports what the current Platform source tree and one dated
repository-ruleset read establish. It does not claim that a control is deployed,
configured, exercised by every service, or passing on a hosted candidate unless
an exact-source runtime receipt says so.

The April 2026 version of this document described one development-workspace
snapshot. Its operational statements are historical and must not be read as
current production state. In particular,
`artifacts/api-server/package.json` now identifies that package as a historical
stub: active HTTP servers live under `apps/`, with additional servers under
`services/` and `workers/`. A primitive found in source is not fleet-wide
coverage until every active entry point is inventoried and tested.

## Current verdict

The repository contains substantial security primitives and fail-closed source
gates. Active-entrypoint authentication, authorization, tenancy, CSRF, rate
limiting, header, validation, logging, and secret configuration are not yet
proved consistently across the polyglot estate. Those are verification and
convergence gaps, not grounds for a blanket “secure” or “insecure” claim.

## Identity and authorization boundary

The tree currently contains multiple role vocabularies:

| Source | Source-confirmed vocabulary | Boundary |
|---|---|---|
| `lib/db/src/schema/auth.ts` `platformRole` | 12 values: 11 non-anonymous values plus `anonymous_visitor` | One column vocabulary only; not proof of the platform-wide enforcement model |
| `packages/auth-shared/src/types.ts` | 14-role hierarchy | Includes `ops`, `admin`, and `super_admin`, which are absent from the 12-value column vocabulary |
| `lib/db/src/schema/auth.ts` `rolesTable.name` | 16 values | Separate legacy/general role table with another vocabulary |

The canonical platform RBAC model and the mapping enforced by every active
server are therefore **BROKEN/UNVERIFIED** as an estate-wide claim. The retained
`auth.rbac_roles.count: 11` value in `audit/source-of-truth.json` is a historical
documentation-consistency value, not an automated current-tree security metric.

| Control claim | Current status |
|---|---|
| OIDC/PKCE, cookie, MFA, and logout behavior on every active server | **UNVERIFIED** — implementations exist, but active-entrypoint coverage and hosted behavior were not established |
| Deny-by-default authentication for every `/api/*` route | **UNVERIFIED** — the formerly cited API package is a stub; audit each active router and mount |
| Tenant isolation for every query | **UNVERIFIED** — no complete active-query and identity-to-tenant binding proof is attached |
| CSRF, security headers, and rate limiting on every state-changing route | **UNVERIFIED** — source primitives do not prove universal mounting or policy equivalence |
| Destructive-action confirmation and authorization | **PARTIAL** — patterns exist, but complete route/action coverage is not established |

## Transport, API, and data boundary

The integrated candidate source-of-truth validator measures 44 detected Express
route source files, 334 static handler declarations, and 246 root example
environment variables. The registry and canonical documents now carry those
same values and must pass the validator together. Route counts do not prove deployment,
reachability, authentication, schema validation, or HTTP behavior. The retired
claim of “Zod validation on all 347 route files across 12 groups” referenced
keys that no longer exist in the current metric schema and is not a current
security fact.

| Control | Current status |
|---|---|
| TLS version and termination for every public origin | **UNVERIFIED** — requires current endpoint and infrastructure evidence |
| CORS, CSRF, Helmet/security headers, and WebSocket authentication | **PARTIAL** — implementations exist; complete active-server coverage is unverified |
| Query parameterization and data classification | **PARTIAL** — architectural patterns exist; an estate-wide negative scan/runtime proof is not attached |
| Encryption at rest, retention, backup, and restoration | **UNVERIFIED** — source documentation does not establish deployed provider configuration or recovery |

## Dependency and CI controls

| Control | Current source/observed state |
|---|---|
| CodeQL | `.github/workflows/codeql.yml` analyzes JavaScript/TypeScript and Python; the exact-PR-ref `severity-gate` was live-required in the dated repository ruleset read |
| Dependency review | `.github/workflows/dependency-review.yml` reviews pull-request dependency changes; it was not in the dated live-required list |
| Secret scanning | `.github/workflows/security.yml` runs Gitleaks plus the project-specific scanner on PR, default-branch, scheduled, and manual paths |
| Package-manager audit | The 2026-10-11 candidate `security/vuln-report.md` records pinned `pnpm@10.26.1`, 0 Critical / 0 High / 2 Moderate / 0 Low findings across 1,820 reported dependencies. The live local-patch mitigation registry is empty. `braces` consumers resolve to the private, source-attributed `@szl-holdings/braces-safe@0.2.0` fork, whose override identity and adversarial recursion/cycle/stateful-input behavior are tested; `node-forge@1.4.0` is absent from the lockfile. The one detailed Moderate is `sprintf-js` GHSA-hp3w-g68c-fv3c and one Moderate is aggregate-only. Hosted exact-head success remains required. |
| License admission | Candidate `security.yml` makes the license-report job a dependency of `Security Gate (blocking)`; exact package/version/license/classification reviews expire and parse errors block. The 2026-10-11 clean-install local report scans 1,522 unique pairs, matches all 8 REVIEW and 6 CHECK findings to 14 exact admissions from a 17-entry registry, and records 0 parse errors and 0 violations; hosted exact-head success remains unobserved. |
| Python dependency coverage | **HOLD** — the pnpm SBOM, vulnerability, and license reports do not cover the three deployable Python services. Their declarations remain ranged and unhashed, with no resolved lock, Python SBOM/vulnerability/license evidence, or reproducible image proof. |
| Filesystem/SCA scan | `.github/workflows/trivy.yml` retains raw, digest-sealed Grype JSON and fails closed on unadmitted High/Critical findings; hosted success and live-required status were not established by the dated read |
| Reproducibility | `.github/workflows/repro-check.yml` compares two clean builds of one SHA; hosted success and live-required status were not established by the dated read |
| Aggregate security gate | `Security Gate (blocking)` was live-required in the authenticated 2026-10-06 Platform repository-ruleset observation |

The historical node-forge patch is inactive because that package is absent.
The braces patch is retained as exact provenance for the private fork and is
not an active pnpm `patchedDependencies` entry. The current fork tests include
stateful Proxy, cycle, depth, breadth, parent-chain, and consumer-resolution
regressions. Replace the fork with an official fixed release only after source,
compatibility, and advisory review. Moderate and Low findings remain
nonblocking but visible. The current report
renders the one detailed `sprintf-js` Moderate and explicitly preserves one
aggregate-only Moderate whose package detail pnpm omitted at the selected audit
level. Track an upstream fix for `sprintf-js`; absence of a patched release is
not permission to apply an incompatible override or suppress the advisory.

## Secrets and credential management

The current `.replit` file does not contain the previously documented
`SUBSTRATE_SIGNING_KEY`, `ALLOY_INTERNAL_TOKEN`, or
`SUBSTRATE_GATEWAY_API_KEY` names, and the previously cited
`artifacts/api-server/src/lib/startup-validation.ts` path is absent. That
removes the basis for the April claim that those exact values remain hardcoded;
it does not prove rotation, revocation, external provisioning, or deployment
safety.

Secret values and presence are not documented here. Operators must use the
deployment platform's secret manager, least-privilege scopes, rotation, and an
authorized readback that does not expose values. Database, MFA, billing,
observability, signing, Hugging Face, npm, wake-receipt, and deployment
credentials remain **UNVERIFIED** unless a separate environment receipt covers
them.

## Evidence ledger and observability

`packages/evidence-ledger` implements an append-only API and defines a durable
store interface, but `defaultEvidenceLedgerStore` starts in memory and entries
are lost on restart unless a durable backend is explicitly installed. Therefore
“immutable audit trail for every significant action” is not a current deployment
claim. Deployed durability, action coverage, retention, read authorization, and
tamper-evident external attestation remain **UNVERIFIED**.

Structured logging, OpenTelemetry, Sentry, and tenant-violation hooks exist in
parts of the tree. Their active coverage, exporters, alert routing, sampling,
retention, and incident response are **UNVERIFIED** without runtime evidence.

## Open security work

1. Inventory every active HTTP/WebSocket entry point and prove authentication,
   authorization, tenancy, CSRF, validation, rate, and header policy with
   positive and negative tests.
2. Converge the 12-value, 14-role, and 16-value role vocabularies or document and
   test one explicit compatibility mapping.
3. Verify secret bindings, rotation, and environment protections without
   exposing values.
4. Replace temporary dependency patches before expiry and retain exact hosted
   pnpm and Grype evidence for the promoted SHA.
5. Activate and test durable evidence storage, restore behavior, read policy,
   retention, and external attestation before making immutability claims.

## What SZL does not claim

- SOC 2 certification or another formal regulatory certification.
- Whole-estate production readiness from source inspection alone.
- Current live AIS authority for Vessels.
- Formal WCAG conformance from source-declared accessibility jobs alone.
- Deployment, customer use, secret availability, or hosted gate success from a
  workflow file.

## Responsible disclosure

Security disclosures: **security@szlholdings.com** (or the SZL Holdings website
contact form). Do not include secret values or sensitive exploit details in a
public issue.
