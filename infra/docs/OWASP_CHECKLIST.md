# OWASP Top 10 (2021) Compliance Checklist — SZL Holdings Platform

> Status review for each OWASP Top 10 category with current controls and remediation notes.  
> **Last Updated:** 2026-04-03  
> **Reference:** [OWASP Top 10:2021](https://owasp.org/Top10/)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Controls in place and verified |
| 🟡 | Partially mitigated — gaps noted |
| ❌ | Not yet mitigated |

---

## A01 — Broken Access Control

**Status: ✅ Mitigated**

### Controls in Place

- **RBAC enforcement:** Six-tier role hierarchy (`founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client`). Every protected route uses `authMiddleware()` + `requireRole()`.
- **Organization scoping:** `tenantScope` middleware prevents cross-tenant data access at the application layer.
- **Server-side enforcement:** Authorization checks are never client-side-only.
- **Session revocation:** Sessions can be invalidated server-side.
- **Audit logging:** Every access-controlled action generates an immutable audit record.

### Residual Risk

- Privileged access reviews are not yet formally scheduled (quarterly review needed — see SOC 2 checklist).
- IDOR testing has not been formally performed.

### Remediation Notes

- Schedule quarterly RBAC review to check for role drift.
- Add IDOR test cases to future penetration testing scope.

---

## A02 — Cryptographic Failures

**Status: ✅ Mitigated**

### Controls in Place

- **TLS 1.3** enforced on all connections.
- **HSTS** with 2-year max-age (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
- **No password storage** — authentication via OpenID Connect (PKCE). No passwords stored.
- **Encryption at rest:** PostgreSQL encryption at rest on all managed Azure deployments.
- **WebSocket tickets** use HMAC-signed tokens with 5-minute TTL.
- **Session tokens** are cryptographically random (32 bytes, `crypto.randomBytes`).
- **No sensitive data in logs** — credential fields redacted at capture point.

### Residual Risk

- Certificate rotation process is informal (relies on Azure managed certificates).
- No explicit check that TLS 1.2 is disabled (verify in Azure App Service TLS settings).

### Remediation Notes

- Confirm TLS 1.2 is disabled in Azure App Service TLS policy.
- Document certificate renewal process.

---

## A03 — Injection

**Status: ✅ Mitigated**

### Controls in Place

- **Drizzle ORM** used for all primary database queries — parameterization is automatic.
- **Parameterized raw queries** where `pg` is used directly (e.g., `contact.ts`) — all values use `$N` placeholders.
- **Zod input validation** on all user-facing API endpoints via shared `validateBody()` middleware.
- **String length limits** enforced on all text inputs.
- **Type coercion** via Zod schema parsing — malformed types rejected before reaching DB layer.

### Drizzle ORM SQL Injection Analysis

Drizzle ORM builds parameterized queries by design. All `eq()`, `and()`, `or()`, `like()`, and aggregation operators emit `$N` placeholders. Reviewed routes confirm no raw string interpolation into SQL.

Raw `pool.query()` calls (contact.ts, health checks) use `$1`/`$2` parameter arrays — no string concatenation.

### Residual Risk

- Dynamic `ORDER BY` columns derived from user input (e.g., sort parameters) should be validated against an allowlist. Audit for these patterns.
- `metadata` JSONB fields accept arbitrary key-value input — verified to be stored and retrieved, never executed.

### Remediation Notes

- Audit all `ORDER BY` clauses that use query parameters; apply allowlist validation.
- Add Zod enum validation for any user-controlled sort/order fields.

---

## A04 — Insecure Design

**Status: ✅ Mitigated**

### Controls in Place

- **Human-in-the-loop AI architecture:** Alloy agents cannot execute consequential actions without explicit human confirmation. Enforced at workflow level, not UI.
- **Fail-secure defaults:** Routes that fail authentication return 401, not fall through.
- **Defense-in-depth:** Multiple independent layers — RBAC, tenant scope, rate limiting, CSRF, input validation.
- **Immutable audit trail:** Override records are never deleted; flagged for review.
- **Separate environments:** Production and development environments are logically isolated.

### Residual Risk

- No formal threat model document exists yet.
- Business logic abuse cases have not been formally mapped.

### Remediation Notes

- Create threat model document (`docs/THREAT_MODEL.md`) covering business logic abuse paths.
- Document trust boundaries between Lyte command layer and Alloy action spine.

---

## A05 — Security Misconfiguration

**Status: ✅ Mitigated**

### Controls in Place

- **Helmet.js** with production-tuned Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **HSTS** with preload enabled in production.
- **Permissions-Policy** header restricts camera, microphone, geolocation, payment, USB.
- **`X-Permitted-Cross-Domain-Policies: none`**
- **`Cache-Control: no-store`** on API responses in production.
- **CORS** policy requires explicit origin allowlist in production (`CORS_ORIGINS` env var).
- **Trust proxy** set correctly for Azure App Service.
- **Secrets** managed via environment variables / Azure Key Vault — none in source control.
- **Error messages** do not expose stack traces in production.

### Content Security Policy (Production)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https:;
font-src 'self' data: https:;
object-src 'none';
media-src 'self';
frame-src 'self';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

> Note: `style-src 'unsafe-inline'` is accepted for SSR-in-place styled components. Nonce-based approach is preferred but requires additional plumbing; tracked for future work.

### Residual Risk

- Swagger UI is available — verify it is disabled or access-restricted in production.
- `unsafe-inline` in `style-src` is a residual risk; nonce migration is planned.

### Remediation Notes

- Disable or restrict Swagger UI behind `adminGuard` in production.
- Track nonce-based CSP migration as a future hardening item.

---

## A06 — Vulnerable and Outdated Components

**Status: ✅ Mitigated**

### Controls in Place

- **`pnpm audit`** runs in CI on every commit. Policy: block on high/critical severity.
- **Dependency updates** reviewed on regular cadence.
- **No known critical vulnerabilities** in current dependency tree (verify at each release).

### Commands

```bash
# Run dependency audit
pnpm audit --audit-level=high

# Check for outdated packages
pnpm outdated -r
```

### Residual Risk

- No automated PR for dependency updates (Dependabot / Renovate not yet configured).
- Third-party services (Azure, Stripe, HuggingFace, Mapbox) are not in scope for `pnpm audit` but carry supply chain risk.

### Remediation Notes

- Configure Renovate Bot or Dependabot to auto-raise PRs for security patches.

---

## A07 — Identification and Authentication Failures

**Status: ✅ Mitigated**

### Controls in Place

- **OpenID Connect (PKCE)** — no password storage in our systems. No credential enumeration possible.
- **Rate limiting on auth endpoints:** Login limited to 10 requests per hour per IP (`loginLimiter`). General auth endpoints limited to 20 requests per 15 minutes (`authLimiter`), skipping successful requests.
- **Session tokens:** Cryptographically random (32-byte hex), 30-day TTL, stored server-side.
- **Session revocation:** Active sessions can be revoked via API.
- **Re-authentication** required for privileged operations.
- **SCIM lifecycle management** ensures de-provisioned users lose access.
- **Correlation IDs** on all requests enable session-level forensics.

### Residual Risk

- Brute-force protection relies solely on rate limiting — no account lockout for non-OIDC flows.
- Multi-factor authentication is delegated to the OIDC provider; MFA enforcement policy should be documented.

### Remediation Notes

- Document MFA enforcement policy for enterprise customers.
- Consider adding account-level anomaly detection (e.g., login from new geography).

---

## A08 — Software and Data Integrity Failures

**Status: ✅ Mitigated**

### Controls in Place

- **Proof Chain:** Every exported document carries an immutable hash for integrity verification.
- **Audit records are immutable:** Deletion of audit records is not possible through the application API.
- **Secrets never in source control:** `.env` is gitignored; secret scan runs in CI.
- **Idempotency keys** on write operations prevent duplicate processing.
- **All production changes require peer review** before merge.

### Residual Risk

- Subresource Integrity (SRI) hashes not yet applied to any CDN-loaded resources.
- Supply chain integrity for npm packages not verified via lock-file pinning audit.

### Remediation Notes

- Add SRI hashes if loading any scripts from external CDNs.
- Review `pnpm-lock.yaml` integrity in CI; do not allow lockfile drift in PRs.

---

## A09 — Security Logging and Monitoring Failures

**Status: 🟡 Partially Mitigated**

### Controls in Place

- **Immutable audit log:** Every significant action generates an audit event with actor, role, timestamp, entity.
- **Pino structured logging** on all API requests with correlation IDs.
- **Override records** never hidden — flagged for mandatory review.
- **AI decision records** stored with complete lineage (signal, confidence, approver).

### Gaps

- **No SIEM integration** — logs are in the database and local log files only.
- **No real-time alerting** on suspicious patterns (auth spikes, data volume anomalies).
- **Log retention** in production is not formally defined or enforced off-site.
- **No audit log tampering detection** — write-once enforcement relies on application layer only.

### Remediation Notes

- Integrate Azure Monitor / Azure Sentinel for centralized SIEM.
- Configure alerts for auth anomalies and error rate spikes.
- Define and implement log retention policy with off-site archival.
- Consider Azure Immutable Blob Storage for audit log archival.

---

## A10 — Server-Side Request Forgery (SSRF)

**Status: 🟡 Partially Mitigated**

### Controls in Place

- **No user-controlled URL fetch** in core application paths (contact, auth, RBAC flows).
- **Connector system** uses pre-configured endpoint URLs, not user-supplied URLs.
- **Webhook endpoints** use registered URLs from the database, not from request payloads.

### Gaps

- **AI research features** (Alloy Research, agent-training) may accept user-provided URLs as data sources. These paths need explicit SSRF allowlist validation.
- No systematic audit of all URL-accepting parameters has been completed.

### Remediation Notes

- Audit all routes that fetch external URLs on behalf of users.
- Implement allowlist validation for any user-provided URL: validate against expected domain patterns, block internal IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x, 127.0.0.1, 169.254.x.x).
- Use a dedicated HTTP client wrapper that enforces SSRF protections.

---

## Summary

| # | Category | Status | Priority |
|---|----------|--------|----------|
| A01 | Broken Access Control | ✅ | — |
| A02 | Cryptographic Failures | ✅ | — |
| A03 | Injection | ✅ | — |
| A04 | Insecure Design | ✅ | — |
| A05 | Security Misconfiguration | ✅ | — |
| A06 | Vulnerable Components | ✅ | — |
| A07 | Auth Failures | ✅ | — |
| A08 | Data Integrity Failures | ✅ | — |
| A09 | Security Logging Failures | 🟡 | Medium — SIEM integration |
| A10 | SSRF | 🟡 | Medium — audit AI research routes |

### Open Action Items

1. **A09:** Integrate Azure Monitor / SIEM for real-time alerting (Owner: Stephen, Q2 2026)
2. **A09:** Define off-site log retention policy (Owner: Stephen, Q2 2026)
3. **A10:** Audit all URL-accepting parameters in AI research routes (Owner: Stephen, Q2 2026)
4. **A05:** Disable Swagger UI in production or restrict with `adminGuard`
5. **A01:** Schedule quarterly RBAC access review

---

*This checklist should be reviewed after each major feature release and updated after penetration testing.*
