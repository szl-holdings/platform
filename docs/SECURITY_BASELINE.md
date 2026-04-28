# Security Baseline — SZL Holdings Platform

**Version:** 1.0  
**Date:** April 16, 2026  
**Authority:** Stephen Lutar, Founder  
**Audience:** Technical diligence reviewers, Series A investors, enterprise prospects

---

## Purpose

This document defines the minimum security baseline the platform must maintain at all times. It is the single source of truth for what "secure" means for this platform. Deviations from this baseline must be documented in `docs/audit/security-remediation-log.md` with a remediation plan and owner.

---

## 1. Secret Hygiene

### Requirements

- No real secrets, credentials, or API keys in any tracked file (source code, docs, configs, seeds, fixtures)
- `.env.example` contains only safe placeholder values
- All production secrets stored in Azure Key Vault (production) or Replit Secrets (development)
- `.env` files gitignored; never committed
- Database backups gitignored and excluded from public mirrors
- Secret scanning runs on every push and PR via CI

### Verification

```bash
node scripts/public-mirror/validate-public-surface.ts
```

### Current Status: ✅ PASSING

Last verified: April 16, 2026. No real secrets found. See `docs/audit/security-findings.md §1`.

CI enforcement: `secret-scan` job in `security.yml` runs `node scripts/qa/scan-secrets.js` on every push and PR. Checks for OpenAI, AWS, GitHub, Stripe, Resend keys; committed `.env` files; PEM private keys; and database dumps. Exits non-zero if any secret is detected.

---

## 2. Authentication

### Requirements

- All API routes enforce authentication via `authMiddleware({ required: true })` or are explicitly documented as intentionally public
- Public routes limited to: health checks, contact form, demo request, public status, webhook receivers
- OIDC/PKCE flow — no password storage in SZL systems
- Session cookies: `HttpOnly`, `SameSite=Lax`, `Secure` flags required; cookie name uses `__Host-` prefix to block subdomain injection
- Bearer tokens on all protected API endpoints
- WebSocket tickets: HMAC-signed, 5-minute TTL, per-channel ACL
- Route security coverage: ≥ 155 of 170 top-level route files (91%)

### Verification

```bash
node scripts/qa/audit-routes.js
```

### Current Status: ✅ PASSING (with known gap)

155/170 routes (91%) have explicit auth enforcement. Known gap documented in `docs/known-gaps.md §Auth`. Route security matrix automation is an active remediation task.

---

## 3. Input Validation

### Requirements

- All user-facing form submissions use Zod schema validation
- All write endpoints (POST, PUT, PATCH, DELETE) with user-supplied data use `validateBody()` or `validateQuery()` from `lib/validation.ts`
- No raw SQL with user input — use Drizzle ORM parameterized queries only
- XSS prevention: React default HTML escaping + CSP headers

### Verification

```bash
# Check Zod coverage
grep -rn "validateBody\|validateQuery\|validateParams" artifacts/api-server/src/routes/ | wc -l
```

### Current Status: ⚠️ PARTIAL

21/170 route files have explicit Zod validation (12%). All highest-risk surfaces (auth, forms, payments) are covered. Expansion to remaining routes is an active remediation item. See REM-002 in `docs/audit/security-remediation-log.md`.

---

## 4. Transport Security

### Requirements

- TLS 1.3 on all connections (enforced at infrastructure level)
- No unencrypted WebSocket connections in production
- HTTPS enforced on all external-facing endpoints
- API responses never include credential material

### Verification

Verified by deployment infrastructure (Azure / Replit). No application-level override permitted.

### Current Status: ✅ PASSING

---

## 5. Dependencies

### Requirements

- `pnpm audit` clean at `high` severity or above, OR all exceptions documented
- SBOM generated and retained for every CI run (90-day retention)
- No `GPL-3.0` or `AGPL-3.0` licensed production dependencies
- Lockfile integrity verified on every push
- Dependabot configured for weekly dependency updates

### Verification

```bash
node scripts/qa/generate-sbom.js
pnpm audit --audit-level=high
```

### Current Status: ✅ PASSING

CI fails on high/critical severity vulnerabilities. SBOM integrated into `security.yml` workflow.

---

## 6. CI Security Gates

### Required Gates (block merge on failure)

| Gate | Workflow | Check |
|------|---------|-------|
| Lint | `ci.yml` | ESLint clean |
| Typecheck | `ci.yml` | TypeScript no errors |
| Unit + integration tests | `ci.yml` | All tests pass |
| Build | `ci.yml` | All artifacts build successfully |
| Secret scan | `security.yml` | No secrets detected |
| Dependency audit | `security.yml` | No high/critical CVEs |
| Lockfile integrity | `security.yml` | Lockfile in sync |

### Optional Gates (informational, non-blocking)

| Gate | Workflow | Purpose |
|------|---------|---------|
| E2E tests | `e2e.yml` | Full user-flow regression |
| Lighthouse performance | `lighthouse.yml` | Performance and a11y scoring |
| CodeQL analysis | `codeql.yml` | Static analysis for code vulnerabilities |
| Dependency review | `dependency-review.yml` | License and vulnerability check on new deps |

---

## 7. GitHub Actions Security

### Requirements

- All third-party GitHub Actions pinned to exact commit SHAs
- Workflow permissions set to least-privilege (`contents: read` as default)
- Per-job permission escalation only where required (e.g., `contents: write` for release job)
- Dependabot configured for automatic SHA-pin updates

### Current Status: ✅ PASSING

All third-party GitHub Actions are fully pinned to exact commit SHAs as of April 16, 2026:
- `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2)
- `pnpm/action-setup@fe52bf0ad0164d2310b5e4d5d7bfec47b67e3f9d` (v4.0.0)
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0)
- `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2)
- `actions/dependency-review-action@2031cfc080254a8a887f58cffee85186f0e49e48` (v4.9.0)
- `github/codeql-action/*@ce64ddcb0d8d890d2df4a9d1c04ff297367dea2a` (v3.35.2)
- `treosh/lighthouse-ci-action@1b0e7c33270fbba31a18a0fca0bc3d8ea4ae3e79`
- `softprops/action-gh-release@c062e08bd532815e2082a7e09ce9571a6d1f0e80`

Dependabot is configured to keep these SHAs updated automatically. See `docs/audit/security-remediation-log.md (REM-C004)`.

---

## 8. Data Protection

### Requirements

- Database encryption at rest (managed deployment)
- Field-level encryption for sensitive data (`artifacts/api-server/src/middlewares/field-encryption.ts`)
- No credential material in logs or error responses
- Database backups excluded from source control (`.gitignore`)
- GDPR request handling via Zod-validated endpoints

### Current Status: ✅ PASSING

---

## 9. Access Control

### Requirements

- RBAC with organization scoping on all tenanted resources
- Default role on registration: `viewer` (minimum privilege)
- Privileged operations require multi-step confirmation + audit log entry
- Audit log entries for all destructive actions and role changes

### Current Status: ✅ PASSING

---

## 10. Health and Observability

### Requirements

- Every deployable artifact has a health check endpoint
- Health endpoints: `/health` or `/api/health` at minimum
- Primary health check returns status within 5 seconds

### Current Status: ✅ PASSING

API server exposes `/api/health`, `/api/healthz`, `/api/health/live`, `/api/health/ready`, `/api/health/detailed`, `/api/health/ai`, `/api/health/integrations`, and `/api/health/external-feeds`.

---

## Baseline Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 16, 2026 | Initial baseline — Series A pre-launch |

---

*This document must be reviewed and updated each quarter and before any major release.*
