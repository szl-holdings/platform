# SZL Holdings — Security Posture

**Version:** 1.0  
**Date:** April 2026  
**Classification:** Public — suitable for investor and enterprise evaluation  
**Status labels:** VERIFIED (code-confirmed) · PARTIALLY VERIFIED (structure confirmed, runtime not checked) · UNVERIFIED (asserted, not checked) · BROKEN (contradicted by evidence)

---

## Summary Verdict

The SZL platform security posture is **structurally sound with several open operational gaps**. The code-level security architecture is defense-in-depth: deny-by-default authentication, 11-role RBAC, CSRF protection, rate limiting, tenant isolation, and an immutable audit trail are all implemented and code-verified. The primary gaps are operational: three secrets need rotation, Sentry error monitoring is not configured, and the Redis session store is not activated. None of these require architectural changes — they require operator configuration.

---

## Authentication Architecture

| Control | Implementation | Status |
|---------|---------------|--------|
| Authentication model | OpenID Connect (PKCE) via Replit Auth | VERIFIED |
| Session cookie | `__Host-sid` prefix; `httpOnly: true`; `secure: true`; `sameSite: 'lax'` | VERIFIED |
| Session store | In-memory (development); Redis adapter exists but not activated | PARTIALLY VERIFIED |
| Login rate limiting | `loginLimiter` (10 req/15min in prod, `skipSuccessful`); applied to `/auth/login`, `/auth/login-password`, `/auth/refresh`, `/auth/mfa/challenge`, `/auth/mfa/setup-required`, `/auth/mfa/enable-required` | VERIFIED |
| MFA / TOTP | Infrastructure present; `MFA_SECRET_ENCRYPTION_KEY` required — emits hard error in production if not set | VERIFIED (code); UNVERIFIED (runtime) |
| Token scope | Internal service token uses timing-safe comparison (`crypto.timingSafeEqual()`); legacy token role downgraded from `super_admin` to `ops` | VERIFIED |
| Logout | Both new (`__Host-sid`) and legacy cookies cleared on logout | VERIFIED |

---

## Authorization Architecture

| Control | Implementation | Status |
|---------|---------------|--------|
| RBAC model | 11 granted user roles (see taxonomy below); `platformRole` column in `lib/db/src/schema/auth.ts`; `auth.rbac_roles.count: 11` per `audit/source-of-truth.json` | VERIFIED |
| Auth enforcer | Deny-by-default global auth enforcer on all `/api/*` routes; public allowlist explicitly documented | VERIFIED |
| Tenant isolation | All queries scoped by org identifier; cross-org access returns 404 to prevent information leakage | VERIFIED |
| Org scoped access | Tenant scope middleware logs violations to telemetry | VERIFIED |
| Role assignment | Access granted by explicit role assignment; no default access | VERIFIED |
| Privileged actions | Destructive/irreversible actions require multi-step confirmation and audit trail entry | VERIFIED (architecture); PARTIALLY VERIFIED (coverage) |

### RBAC Role Taxonomy

The `platformRole` text column in `lib/db/src/schema/auth.ts` (lines 21–36) contains **12 enum values**. Eleven of these are **granted user roles** — assignable permissions for authenticated platform users. The twelfth, `anonymous_visitor`, represents the unauthenticated visitor state and is not a grantable role. All public-facing documentation and `audit/source-of-truth.json` (`auth.rbac_roles.count: 11`) count only the 11 granted roles.

| Role | Scope | Notes |
|------|-------|-------|
| `founder_admin` | Platform-wide | Full administrative access |
| `platform_admin` | Platform-wide | Platform configuration and user management |
| `operator` | Platform-wide | Operational management |
| `analyst` | Platform-wide | Read-only analytics access |
| `executive_viewer` | Platform-wide | Executive dashboard access |
| `ops_manager` | Domain | Operations management within assigned tenant |
| `sales_delivery_user` | Domain | Sales and delivery operations |
| `maritime_ops_user` | Domain (Vessels) | Vessels domain access |
| `real_estate_ops_user` | Domain (Terra) | Terra domain access |
| `service_coordinator` | Domain | Service coordination access |
| `pilot_customer_user` | Domain | Pilot/trial customer access |

*Plus `anonymous_visitor` (unauthenticated state — not a grantable role). Total enum values: 12. Granted roles: 11. Source: `lib/db/src/schema/auth.ts` lines 21–35; verified via `audit/verify.sh` RBAC note.*

---

## Transport and API Security

| Control | Implementation | Status |
|---------|---------------|--------|
| TLS in transit | All production traffic over TLS 1.3 (Replit-managed) | PARTIALLY VERIFIED |
| CORS policy | `CORS_ORIGINS` env var; production set to `*.replit.app,*.replit.dev,*.repl.co`; custom enterprise domain not included | VERIFIED |
| CSRF protection | Double-submit cookie pattern on all state-mutating routes | VERIFIED |
| Security headers | Helmet.js: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | VERIFIED |
| Rate limiting | Global limiter + per-endpoint sliding window; applied to auth routes | VERIFIED |
| API validation | Zod schema validation on all 347 route files across 12 top-level route groups via `@szl-holdings/contracts` (`api.route_files: 347`, `api.route_groups_top_level: 12` per audit/source-of-truth.json) | VERIFIED |
| WebSocket auth | HMAC-signed tickets with per-channel access control | VERIFIED |

---

## Data Security

| Control | Implementation | Status |
|---------|---------------|--------|
| Data at rest | PostgreSQL with AES-256 equivalent (Replit-managed encryption) | PARTIALLY VERIFIED |
| Query parameterization | Drizzle ORM with parameterized queries; no string concatenation in SQL | VERIFIED |
| Data classification | Data classified at ingestion; sensitive classifications require elevated role | VERIFIED (architecture) |
| Retention policy | Per-data-class retention defined in `docs/LOGGING_AND_RETENTION.md` | PARTIALLY VERIFIED |

---

## Secrets and Credential Management

| Item | Status | Risk | Remediation |
|------|--------|------|-------------|
| `SUBSTRATE_SIGNING_KEY` | Hardcoded dev value in `.replit [userenv.shared]`; startup-validation.ts detects and emits hard production error | HIGH | Move to Replit Secrets |
| `ALLOY_INTERNAL_TOKEN` | Hardcoded dev placeholder in `.replit [userenv.development]`; detected at startup in production | MEDIUM | Move to Replit Secrets |
| `SUBSTRATE_GATEWAY_API_KEY` | Hardcoded dev gateway key; detected at startup in production | HIGH | Move to Replit Secrets |
| `MFA_SECRET_ENCRYPTION_KEY` | Must be set; emits hard error in production if absent | HIGH | Generate: `openssl rand -hex 32`; add to Replit Secrets |
| `STRIPE_SECRET_KEY` | Present; test mode only | REVENUE | Configure live key for production |
| `DATABASE_URL` | Required; not present in dev workspace | OPERATIONAL | Provision PostgreSQL; add to secrets |

---

## CI/CD Security

| Control | Status |
|---------|--------|
| CodeQL SAST | Active in `.github/workflows/codeql.yml` | VERIFIED |
| Dependency review | Active in `.github/workflows/security.yml` | VERIFIED |
| Secret scanning | Active (GitHub native + Security workflow) | VERIFIED |
| Dependency audit | `pnpm audit` integrated into CI | VERIFIED |
| Branch protection | CI must pass before merge | PARTIALLY VERIFIED |

---

## Observability and Incident Detection

| Control | Status |
|---------|--------|
| Structured logging | Pino JSON logging with correlation IDs on all API requests | VERIFIED |
| OpenTelemetry | SDK present; `OTEL_ENDPOINT` not configured | PARTIALLY VERIFIED |
| Sentry error tracking | SDK present (`@sentry/node`); `SENTRY_DSN` placeholder — tracking disabled | PARTIALLY VERIFIED |
| Audit trail | Proof Chain — immutable append-only event log for every significant action | VERIFIED (architecture) |
| Tenant violation logging | Cross-tenant access attempts logged to telemetry | VERIFIED |

---

## Open Security Findings (From Phase A Audit)

| Finding | Severity | Status |
|---------|----------|--------|
| F-01: Rate limiting on login | HIGH | RESOLVED — loginLimiter applied to 6 auth routes |
| F-02: MFA_SECRET_ENCRYPTION_KEY unset | HIGH | Enforced at startup — hard error in production if absent |
| F-03: Cookie secure/sameSite flags | MEDIUM | RESOLVED — `__Host-sid` with `httpOnly`, `secure: true`, `sameSite: lax` |
| F-04: SUBSTRATE_SIGNING_KEY hardcoded | HIGH | PARTIALLY MITIGATED — startup detection; key still in `.replit`; needs Secret rotation |
| F-05: ALLOY_INTERNAL_TOKEN hardcoded | MEDIUM | PARTIALLY MITIGATED — startup detection; needs Secret rotation |
| F-06: Dual RBAC role system | HIGH | DOCUMENTED — consolidation deferred; canonical mapping layer exists |
| F-07: Three auth patterns across artifacts | MEDIUM | DOCUMENTED — consolidation deferred |

---

## What SZL Does NOT Claim

- SZL Holdings does not claim SOC 2 certification or any formal regulatory compliance status.
- AIS telemetry in Vessels is simulated; live AIS requires a MarineTraffic or equivalent subscription.
- Redis session store is not activated in the current deployment.
- WCAG accessibility has not been formally audited.

---

## Responsible Disclosure

Security disclosures: **security@szlholdings.com** (or via the SZL Holdings website contact form)

We commit to:
- Acknowledging receipt within 2 business days
- Providing a resolution timeline within 10 business days
- Not pursuing legal action against good-faith security researchers

---

*Security posture as of April 2026. All claims verified from source code, configuration files, and audit logs unless explicitly marked PARTIALLY VERIFIED or UNVERIFIED.*
