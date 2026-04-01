# SZL Holdings — Security Posture

**Date:** April 2026

---

## Security Architecture

### Authentication

**Protocol:** OpenID Connect (PKCE flow) — no password storage in SZL systems. Identity is delegated to the OIDC provider.

**Session management:**
- Session cookies with `HttpOnly`, `SameSite=Strict`, and `Secure` flags
- Short session TTL (configurable, default 7 days)
- Session invalidation on role change or security event

**API access:**
- Bearer token authentication on all API endpoints
- HMAC-signed WebSocket tickets with 5-minute TTL and per-channel ACL

### Authorization

**Model:** Role-based access control (RBAC) with organization scoping.

Every API route is protected. Access is checked at:
1. Middleware level (role check before handler)
2. Business logic level (fine-grained entity-level access)
3. Database query level (organization-scoped queries)

**Principle of least privilege:** Users receive the minimum role necessary for their function. Default role on registration is `viewer`.

**Privileged operations** (destructive actions, role changes, configuration resets) require:
- Multi-step confirmation
- Audit log entry
- In some cases, explicit re-authentication

### Data Protection

**In Transit:**
- TLS 1.3 on all connections (enforced by deployment infrastructure)
- No unencrypted WebSocket connections in production
- API responses never include credential material

**At Rest:**
- PostgreSQL encryption at rest (managed deployment)
- Azure Key Vault for production secret management
- Secrets are never stored in application code or `.env` files in source control

### Input Validation

- All API inputs validated via Zod schemas before handler execution
- SQL injection prevented by Drizzle ORM parameterized queries (no raw SQL with user input)
- XSS prevented by React's default HTML escaping + CSP headers
- CSRF protection via `SameSite` cookie policy and CSRF tokens on state-changing routes

### Rate Limiting

- API rate limiting configured on public endpoints
- Authentication endpoints have stricter limits
- Background: Recommended production configuration documented in `docs/production-readiness.md`

---

## Dependency Security

**Scanning:** Automated dependency vulnerability scanning via GitHub Dependabot (`.github/dependabot.yml`).

**Policy:**
- Critical severity: immediate review and patching
- High severity: patched within 5 business days
- Medium/Low severity: addressed in next scheduled maintenance cycle

**Versioning:** All dependencies are pinned to exact versions in `package.json`. Lockfile (`pnpm-lock.yaml`) is committed.

---

## AI Security Boundaries

The AI agent layer has explicit security boundaries enforced at the code level:

1. **Agent outputs are advisory** — Agents surface recommendations, not commands
2. **Alloy approval gate** — Any agent-suggested action that affects live state requires human approval before execution
3. **Prompt injection mitigation** — Agent inputs are sanitized. User-supplied text is not directly interpolated into system prompts
4. **Model version logging** — All inference calls log the model version used
5. **No credential access** — AI agents do not have access to secrets, credentials, or raw production data

---

## Vulnerability Disclosure

See [SECURITY.md](../../SECURITY.md) for the full responsible disclosure process.

**Contact:** security@szlholdings.com

---

## Known Gaps (Honest Assessment)

The following items are on the roadmap but not yet implemented:

| Gap | Planned Resolution | Timeline |
|-----|-------------------|----------|
| Sentry error tracking in production | Phase 2 | Next quarter |
| Global React ErrorBoundary | Phase 2 | Next quarter |
| Redis for session store (currently in-memory) | Phase 3 | Revenue activation phase |
| CORS configuration for production domains | Pre-deploy | Before first commercial deployment |
| SOC 2 Type II audit | Phase 4 | 12–18 months post-revenue |
| FedRAMP readiness (Aegis) | Phase 4 | 18–24 months |

These gaps are honest and documented. None of them affect the security of the current demonstration environment.
