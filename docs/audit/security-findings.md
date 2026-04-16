# Security Findings — Series A Audit

**Date:** April 16, 2026
**Auditor:** Automated scan + manual review
**Scope:** Full monorepo — source code, configs, secrets hygiene, workflow security, CSP/CORS/auth headers, dependency hygiene

---

## Executive Summary

The platform is in strong shape for a pre-commercial Series A context. No critical secret exposures were found. The main findings are process gaps (unpinned CI actions, missing SHA pins) and coverage gaps (Zod validation at 12% of routes, route security matrix not yet automated). All findings are documented, categorized, and have active remediation tasks.

---

## 1. Secret Scanning

### 1.1 Methodology

Scanned all tracked files using pattern matching for:
- AWS access keys (`AKIA[A-Z0-9]{16}`)
- OpenAI API keys (`sk-[a-zA-Z0-9]{20,}`)
- GitHub tokens (`ghp_[a-zA-Z0-9]{36}`)
- Generic high-entropy strings in config and env files
- Stripe keys (`sk_live_*`, `sk_test_*`)
- Resend keys (`re_*`)
- Database connection strings with embedded credentials
- JWT secrets and signing keys

**Script used:** `scripts/qa/scan-secrets.js` (CI gate) and `scripts/public-mirror/validate-public-surface.ts` (mirror policy audit)

### 1.2 Findings

| Finding | File | Severity | Status |
|---------|------|----------|--------|
| `.env.example` — `DATABASE_URL` contains `password` literal | `.env.example` | LOW | Safe — `user:password@localhost` is a well-known placeholder pattern, not a real credential |
| `.env.example` — `SESSION_SECRET=replace-with-a-long-random-string` | `.env.example` | NONE | Safe placeholder |
| `.env.example` — `STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE` | `.env.example` | NONE | Safe placeholder |
| `.env.example` — `RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `.env.example` | NONE | Safe placeholder |
| Seed scripts contain narrative text referencing credentials (e.g., "Redis accessible without auth") | `artifacts/api-server/src/scripts/seed-agent-os.ts` | NONE | Demo narrative text, not credentials |
| `lib/services/src/adapters/compstak.ts` contains IDs with `csk-` prefix | `lib/services/src/adapters/compstak.ts` | NONE | Internal fake IDs in mock adapter, not API keys |

**Result: No real secrets found in tracked files.**

### 1.3 `.env.example` Assessment

- ✅ All values are safe placeholders (no real credentials)
- ✅ All 159 variables are documented with comments
- ✅ Covers all service integrations (DB, auth, email, payments, AI, maps)
- ✅ Header instructs users to copy to `.env` and never commit
- ⚠️ Minor: `DATABASE_URL=postgresql://user:password@localhost:5432/szlholdings` — the word `password` could trigger naive scanners. Acceptable as a canonical connection string template.

---

## 2. GitHub Actions Security

### 2.1 Action Pinning Status

| Action | Workflow(s) | Status |
|--------|-------------|--------|
| `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2) | All 11 workflow files | ✅ Pinned |
| `pnpm/action-setup@fe52bf0ad0164d2310b5e4d5d7bfec47b67e3f9d` (v4.0.0) | All workflow files that use pnpm | ✅ Pinned |
| `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) | ci.yml, build.yml, e2e.yml, lighthouse.yml, security.yml, npm-publish.yml | ✅ Pinned |
| `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2) | ci.yml, e2e.yml, security.yml | ✅ Pinned |
| `actions/dependency-review-action@2031cfc080254a8a887f58cffee85186f0e49e48` (v4.9.0) | dependency-review.yml | ✅ Pinned |
| `github/codeql-action/*@ce64ddcb0d8d890d2df4a9d1c04ff297367dea2a` (v3.35.2) | codeql.yml | ✅ Pinned |
| `treosh/lighthouse-ci-action@1b0e7c33270fbba31a18a0fca0bc3d8ea4ae3e79` | lighthouse.yml | ✅ Pinned |
| `softprops/action-gh-release@c062e08bd532815e2082a7e09ce9571a6d1f0e80` | release.yml | ✅ Pinned |

**Result: All third-party GitHub Actions are fully pinned to exact commit SHAs.** Dependabot (`package-ecosystem: github-actions` in `.github/dependabot.yml`) will automatically create PRs to update these SHAs when new versions are released.

### 2.2 Workflow Permissions

| Workflow | Top-Level Permissions | Per-Job Permissions | Status |
|----------|-----------------------|---------------------|--------|
| ci.yml | `contents: read` | Per-job scoped | ✅ Least-privilege |
| security.yml | `contents: read`, `security-events: write` | No per-job override needed | ✅ Correct |
| e2e.yml | `contents: read` | Per-job scoped | ✅ Least-privilege |
| lighthouse.yml | `contents: read` | Per-job scoped | ✅ Least-privilege |
| codeql.yml | `permissions: {}` | `actions: read`, `contents: read`, `security-events: write` | ✅ Least-privilege |
| dependency-review.yml | `contents: read` | None | ✅ Sufficient for PR checkout |
| build.yml | `contents: read` | Per-job scoped | ✅ Least-privilege |
| release.yml | `contents: read` (top) | `contents: write` for release job only | ✅ Correct scope escalation |
| deploy-staging.yml | `contents: read` | No escalation needed | ✅ Correct |
| deploy-production.yml | `contents: read` | No escalation needed | ✅ Correct |

---

## 3. CSP, CORS, and HTTP Security Headers

### 3.1 API Server Middleware Stack

| Middleware | File | Status |
|-----------|------|--------|
| CSRF protection | `artifacts/api-server/src/middlewares/csrf.ts` | ✅ Present |
| SSRF guard | `artifacts/api-server/src/middlewares/ssrf-guard.ts` | ✅ Present |
| Rate limiting | `artifacts/api-server/src/middlewares/rate-limiters.ts` | ✅ Present |
| Sliding window rate limiter | `artifacts/api-server/src/middlewares/sliding-window-limiter.ts` | ✅ Present |
| Field encryption | `artifacts/api-server/src/middlewares/field-encryption.ts` | ✅ Present |
| Zero-trust layer | `artifacts/api-server/src/middlewares/zero-trust.ts` | ✅ Present |
| Auth hydrator | `artifacts/api-server/src/middlewares/auth.ts` | ✅ Present |

### 3.2 Session Configuration

- `HttpOnly`, `SameSite=Strict`, `Secure` flags set on session cookies (per `docs/trust/security-posture.md`)
- Session TTL: configurable, default 7 days
- Session store: **In-memory** — see Known Gap in `docs/known-gaps.md §Session Store`
- OIDC/PKCE — no password storage

### 3.3 API Authentication Coverage

- 155 of 170 top-level route files apply explicit auth middleware
- 15 routes intentionally public (health checks, contact form, demo request, public status, webhook receivers)
- Global deny-by-default enforcement layer: **in progress** (see `docs/known-gaps.md §1.1`)

---

## 4. Dependency Audit

### 4.1 Approach

- SBOM generation script: `scripts/qa/generate-sbom.js`
- Uses npm bulk advisory endpoint (`POST /-/npm/v1/security/advisories/bulk`)
- Integrated into CI via `security.yml` workflow
- Lockfile integrity verified on every push via `lockfile-integrity` job

### 4.2 Audit Configuration

- CI fails on `high` or `critical` severity vulnerabilities (no override without documented exception)
- Dependency review workflow fails on `high`-severity new dependencies in PRs
- Blocked licenses: `GPL-3.0`, `AGPL-3.0`
- SBOM artifact retained for 90 days per CI run

### 4.3 Known Exceptions

None documented at time of writing. If exceptions are required, they must be added to `docs/audit/security-remediation-log.md` with:
- CVE identifier
- Package name and version
- Severity assessment
- Mitigation or acceptance rationale
- Owner and review date

---

## 5. Input Validation Coverage

| Surface | Validation | Method |
|---------|-----------|--------|
| Contact forms | ✅ Zod | `validateBody()` |
| Demo requests | ✅ Zod | `validateBody()` |
| Auth flows | ✅ Zod | `validateBody()` |
| GDPR requests | ✅ Zod | `validateBody()` |
| Partner portal | ✅ Zod | `validateBody()` |
| Feedback submissions | ✅ Zod | `validateBody()` |
| Invitations | ✅ Zod | `validateBody()` |
| General API routes | ⚠️ Partial — 21 of 170 top-level route files | Expansion is active remediation |
| All DB queries | ✅ Parameterized | Drizzle ORM — no raw SQL with user input |

---

## 6. Summary Risk Table

| Finding | Severity | Status |
|---------|----------|--------|
| No real secrets in tracked files | N/A — clean | ✅ Resolved |
| GitHub Actions — all pinned to exact SHAs | LOW | ✅ Resolved — all 9 actions pinned |
| `codeql.yml` missing top-level `permissions: {}` default | LOW | ✅ Fixed — `permissions: {}` added |
| In-memory session store (no Redis) | MEDIUM | ⚠️ Planned — see `docs/known-gaps.md` |
| Zod validation at 12% of routes (21/170) | HIGH | ⚠️ Active remediation in progress |
| Route security matrix not automated | MEDIUM | ⚠️ Companion task in progress |
| No external error tracking (Sentry) | LOW | ⚠️ Planned |

---

*Generated: April 16, 2026. Re-run scans quarterly or after any major dependency or infrastructure change.*
