# SZL Holdings — Release Trust Pack

**Version:** 1.0  
**Date:** April 2026  
**Audience:** Enterprise security reviewers, procurement teams, investors, design partners

---

## What This Document Is

This pack bundles the evidence that makes a SZL Holdings release trustworthy: the CI gates that blocked it, the security scanning that cleared it, the governance model that governed it, and the supply-chain controls that verified it. Each section links to the source document or workflow file where the claim is grounded.

---

## 1. CI Quality Gates

Every pull request targeting `main` must pass the full CI gate defined in `.github/workflows/ci.yml` (triggered on `pull_request` and `workflow_dispatch`; branch-protection required-checks enforce this gate before any merge). The `CI Gate` job at the end of the workflow requires all of the following jobs to succeed:

| Job | What it checks |
|-----|---------------|
| `lint` | ESLint — zero errors |
| `typecheck` | TypeScript strict compile — zero type errors |
| `test` | Unit test suite |
| `build` | All workspace packages build successfully |
| `integration-test` | API integration tests against a live PostgreSQL instance |
| `docs-claims-check` | Documented security claims (RBAC role count, CSRF, route count) verified against source code |
| `secret-scan` | Gitleaks — no credentials detected in diff |
| `readiness-gate` | Product-mode smoke tests against the running API server |
| `proof-chain-checks` | Policy engine, action engine, trace graph, connector, telemetry, and proof-chain unit tests |
| `route-security-matrix` | Every API route file audited for auth classification — no unclassified routes permitted |
| `brand-strings` | Trademark regression guard — banned brand strings blocked |
| `cortex-security-tests` | Multi-tenant org-scoping tests for CORTEX endpoints |
| `env-coverage` | Per-artifact env-var coverage — no undocumented environment variables |
| `design-token-drift` | Design token compliance across governed artifacts |
| `api-spec-drift` | API route files cross-referenced against OpenAPI spec |
| `pin-check` | All GitHub Actions `uses:` references must be SHA-pinned (40-char commit hash) |
| `agent-eval-gate` | AI agent evaluation gate — sentinel-maritime and prism-ai eval scores |

**Source:** `.github/workflows/ci.yml`

---

## 2. Security Scanning

### Static Analysis (SAST)
- **CodeQL** — Semantic analysis of all TypeScript/JavaScript source. Runs on a weekly schedule (Mondays at 6am UTC) and on `workflow_dispatch`.  
  **Workflow:** `.github/workflows/codeql.yml`

- **Route Security Matrix** — Custom audit that inspects every API route file and fails if any route lacks an explicit auth classification.  
  **Workflow:** `ci.yml` — `route-security-matrix` job

### Dependency Vulnerability Scanning (SCA)
- **`pnpm audit`** — Fails on high/critical severity CVEs.  
  **Workflow:** `.github/workflows/security.yml`

- **GitHub Dependency Review** — Blocks PRs that introduce new critical/high CVEs.  
  **Workflow:** `.github/workflows/dependency-review.yml`

### Secret Scanning
- **Gitleaks (PR gate)** — Scans PR diff on every PR targeting `main`/`master`. Required status check — blocks merge.  
  **Workflow:** `.github/workflows/secret-scan.yml`
- **Gitleaks (scheduled)** — Scans full `main` history daily at 06:17 UTC (`secret-scan-scheduled.yml`) and again as part of the weekly security suite (`security.yml`).  
  **Workflows:** `.github/workflows/secret-scan-scheduled.yml`, `.github/workflows/security.yml`

**Full details:** `docs/PROVENANCE_AND_ATTESTATION.md`

---

## 3. Release Process

Releases are created automatically by `.github/workflows/release.yml` on every push to `main`/`master`.

| Step | Detail |
|------|--------|
| Version determination | Conventional commit analysis since last tag — auto-bumps major/minor/patch |
| Manual override | `workflow_dispatch` supports explicit `major`, `minor`, `patch` inputs |
| Release notes | Structured changelog per commit, grouped by type |
| Rollback | Deployment rollback available via Replit platform controls; see `docs/RELEASE_GOVERNANCE.md` |

**Release gating note:** `release.yml` triggers on push to `main`/`master` and does not have an explicit workflow-level dependency on `ci.yml`. CI gates are enforced via branch protection required status checks, not a `needs:` declaration in the release workflow itself. See `docs/PROVENANCE_AND_ATTESTATION.md` for details.

**Release types and approval requirements:** See `docs/RELEASE_GOVERNANCE.md`.

---

## 4. Supply-Chain Controls

| Control | Status |
|---------|--------|
| Lock file committed (`pnpm-lock.yaml`) | Active |
| `--frozen-lockfile` enforced in CI | Active |
| All GitHub Actions SHA-pinned to 40-char commit hashes | Active — enforced by `pin-check` job |
| Dependabot auto-merge for patch updates | Active — `.github/workflows/dependabot-auto-merge.yml` |
| SBOM generation | Active — generated weekly by `security.yml` via `scripts/qa/generate-sbom.js`; CI artifact, not yet release-attached |
| Container image signing | Not yet configured — planned (Cosign) |

**Full details:** `docs/PROVENANCE_AND_ATTESTATION.md`

---

## 5. Security Architecture Summary

| Layer | Control | Status |
|-------|---------|--------|
| Authentication | OIDC/PKCE — no password storage | Implemented |
| Authorization | Deny-by-default global auth enforcer; 11-role RBAC | Implemented |
| Session security | `__Host-sid` cookie; `httpOnly`, `secure`, `sameSite: lax` | Implemented |
| CSRF | Double-submit cookie on all state-mutating routes | Implemented |
| Transport | TLS 1.3 (Replit-managed) | Implemented |
| SQL injection | Drizzle ORM parameterized queries | Implemented |
| Multi-tenant isolation | All queries org-scoped; cross-org access returns 404 | Implemented |
| Audit trail | Hash-linked immutable proof chain — every significant action logged | Implemented |
| AI governance | All AI agent actions gated by Covenant Policy Engine; human approval required | Implemented |
| Rate limiting | Per-user sliding window + global circuit breaker | Implemented |
| Security headers | Helmet.js — CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Implemented |

**Full details:** `docs/security-posture.md`, `SECURITY.md`

---

## 6. Known Gaps (Disclosed)

| Gap | Severity | Status |
|-----|----------|--------|
| SOC 2 Type II not yet obtained | Medium | Targeted Q3 2026 |
| SBOM not release-attached | Low | SBOM generated weekly (`security.yml` CI artifact, 90-day retention); not yet attached to GitHub release tags |
| Redis session store not activated | Low | In-memory sessions in use; Redis planned |
| Sentry DSN not configured | Medium | SDK present; configuration pending |
| Container image signing not configured | Low | Planned |
| SLSA provenance attestation not configured | Low | Planned — after SBOM integration |

We disclose known gaps. This list is maintained in `docs/TRUST_CENTER.md` and `docs/security-posture.md`.

---

## 7. Contact

**Security disclosures:** security@szlholdings.com — see `SECURITY.md` for response SLA  
**Enterprise evaluation inquiries:** inquiries@szlholdings.com  
**Support:** support@szlholdings.com

---

## Document Index

| Document | Location | Purpose |
|----------|----------|---------|
| Security Policy | `SECURITY.md` | Responsible disclosure, scope, severity SLA |
| Trust Center | `docs/trust-center.md` | Architecture principles, governance, AI posture |
| Security Posture | `docs/security-posture.md` | Code-verified security control inventory |
| Release Governance | `docs/RELEASE_GOVERNANCE.md` | Release pipeline, approval tiers, rollback |
| Provenance & Attestation | `docs/PROVENANCE_AND_ATTESTATION.md` | Supply-chain controls, SBOM status |
| Platform Metrics | `docs/PLATFORM_METRICS.md` | Code-derived platform scale metrics |
| Product Surfaces | `docs/PRODUCT_SURFACES.md` | Full artifact and surface inventory |

---

*This pack reflects the state of the SZL Holdings platform as of April 2026. All CI and security claims are sourced from workflow configuration files and verified source code.*
