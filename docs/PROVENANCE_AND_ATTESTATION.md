# SZL Holdings — Provenance and Attestation

**Version:** 1.0  
**Date:** April 2026  
**Classification:** Public — suitable for enterprise security review and investor due diligence  
**Audience:** Procurement teams, security evaluators, engineering leads

---

## Overview

This document describes the supply-chain security posture of the SZL Holdings platform monorepo: how software is built, how dependencies are tracked, what scanning exists, and what attestation artifacts are generated at release time.

---

## Dependency Management

| Control | Implementation | Status |
|---------|---------------|--------|
| Package manager | pnpm 10 with lockfile (`pnpm-lock.yaml`) | ACTIVE |
| Lock file committed | `pnpm-lock.yaml` tracked in version control | ACTIVE |
| Lockfile integrity | `pnpm install --frozen-lockfile` enforced in CI | ACTIVE |
| Dependency review on PRs | `.github/workflows/dependency-review.yml` — blocks PRs that introduce new critical/high CVEs | ACTIVE |
| Dependabot auto-merge | `.github/workflows/dependabot-auto-merge.yml` — auto-merges patch-level Dependabot PRs that pass CI | ACTIVE |

---

## Software Composition Analysis (SCA)

| Tool | Scope | Workflow | Trigger | Disposition |
|------|-------|----------|---------|-------------|
| `pnpm audit` | All npm dependencies | `.github/workflows/security.yml` | Weekly (Mondays) + `workflow_dispatch` | Vulnerability report generated; fails on high/critical |
| GitHub Dependency Review | PR-level new dependency introduction | `.github/workflows/dependency-review.yml` | Every PR | Blocks merge on new critical/high CVEs |
| SBOM generation | Full dependency graph | `.github/workflows/security.yml` (`generate-sbom.js`) | Weekly (Mondays) + `workflow_dispatch` | Uploaded to CI artifacts (`security/sbom-latest.json`, 90-day retention) |

---

## Secret Scanning

| Control | Tool | Trigger | Status |
|---------|------|---------|--------|
| PR-diff secret scan | Gitleaks (`.gitleaks.toml`) | Every PR targeting `main`/`master` | ACTIVE — `.github/workflows/secret-scan.yml` — required status check, blocks merge |
| Scheduled full-repo scan | Gitleaks | Weekly (per `secret-scan-scheduled.yml`) | ACTIVE — scans full `main` history |
| Security suite scan | Gitleaks (full tree) | Weekly (Mondays) + `workflow_dispatch` | ACTIVE — `.github/workflows/security.yml` |

The Gitleaks configuration (`.gitleaks.toml`) defines allowlisted patterns for known false positives (e.g. test fixtures, placeholder values). The allowlist is reviewed whenever a new secret pattern class is added.

---

## SAST (Static Application Security Testing)

| Tool | Coverage | Workflow | Trigger |
|------|----------|----------|---------|
| CodeQL | TypeScript, JavaScript — all source under `artifacts/`, `lib/`, `packages/`, `scripts/` | `.github/workflows/codeql.yml` | Weekly (Mondays at 6am UTC) + `workflow_dispatch` |
| Route security matrix | Custom — audits every API route file for auth classification gaps | `.github/workflows/ci.yml` (`route-security-matrix` job) | On every PR |
| Docs claims check | Custom — verifies documented security claims (role counts, CSRF, route counts) match source code | `.github/workflows/ci.yml` (`docs-claims-check` job) | On every PR |

---

## Supply-Chain Hardening

| Control | Status | Evidence |
|---------|--------|----------|
| GitHub Actions SHA pinning | All workflow `uses:` references pinned to 40-character commit SHAs | Enforced by `pin-check` job in `ci.yml` — blocks unpinned action refs |
| Pinned action refs review | New action refs require SHA pin before merge | `ci.yml` pin-check gate |
| No third-party CI runners | All jobs run on `ubuntu-latest` (GitHub-hosted) | Workflow files |

### SHA Pinning Policy

Every `uses:` reference in `.github/workflows/` must be pinned to a full 40-character commit SHA. Floating version tags (`@v4`, `@main`, `@master`) are not permitted. The `pin-check` job in `ci.yml` enforces this — it fails the build if any unpinned ref is detected. Human-readable version comments (e.g. `# v4.2.2`) are placed inline for auditability.

---

## SBOM (Software Bill of Materials)

| Control | Status |
|---------|--------|
| SBOM generation | ACTIVE — generated weekly by `security.yml` via `scripts/qa/generate-sbom.js` |
| Output | `security/sbom-latest.json` — uploaded as CI artifact, retained 90 days |
| Trigger | Weekly (Mondays) + `workflow_dispatch` |
| Release attachment | Not yet attached to GitHub release artifacts — SBOM is a CI artifact only |
| Gap | SBOM is not attached to release tags; it is not released alongside binaries |

The SBOM is generated on the weekly security scan cycle. The dependency graph is also fully deterministic via `pnpm-lock.yaml` and can be reconstructed at any commit. Attaching SBOM artifacts to GitHub Releases (so they are permanently associated with a tagged version) is a planned improvement.

---

## Release Provenance

Each release created by `.github/workflows/release.yml` includes:

| Artifact | Content | Source |
|----------|---------|--------|
| Git tag | Semver tag on the release commit | Conventional commit analysis |
| Release notes | Structured changelog per commit since last tag | `git log` + conventional commit parsing |
| Platform metrics snapshot | `generated/platform-metrics.json` at time of build | `scripts/audit/generate-platform-metrics.ts` |

**Release gating note:** `release.yml` triggers on push to `main`/`master` and does not declare an explicit `needs:` dependency on `ci.yml`. Whether CI passes before the release workflow runs depends on branch protection rules being configured as required status checks — not on a workflow-level gate. This is a known gap in provenance governance.

Formal SLSA provenance attestation is not yet configured. SBOM attachment to release artifacts and SLSA attestation are planned improvements once the SBOM release-attachment gap above is closed.

---

## Container and Package Publishing

| Surface | Workflow | Status |
|---------|----------|--------|
| Container images | `.github/workflows/container-publish.yml` | Active — images published on release |
| npm packages | `.github/workflows/npm-publish.yml` | Active — packages published on release |
| Container signing | Not configured | Planned — Cosign integration |

---

## Audit Trail for Build Events

Every significant CI event is traceable:

- **Workflow runs** — Full GitHub Actions audit log per repository
- **Dependency changes** — Dependency Review workflow annotates every PR with new/removed packages and license changes
- **Secret scan results** — Gitleaks run logs retained in CI artifacts (redacted)
- **CodeQL alerts** — Tracked in the GitHub Security tab

---

## Responsible Disclosure

If you identify a supply-chain risk or dependency vulnerability not caught by automated scanning:

**Email:** security@szlholdings.com  
**Subject:** `[SECURITY] Supply-chain: <brief description>`

See `SECURITY.md` for the full responsible disclosure process and response SLA.

---

*Supply-chain posture as of April 2026. All claims are based on current workflow configuration and source-code state.*
