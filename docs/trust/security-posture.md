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
- Bearer token authentication on protected API endpoints (155 of 170 route files); 15 routes are intentionally public (health checks, contact form, demo requests, public status, webhook receivers)
- HMAC-signed WebSocket tickets with 5-minute TTL and per-channel ACL

### Authorization

**Model:** Role-based access control (RBAC) with organization scoping.

**Authentication architecture:** A global session hydrator (`authMiddleware.ts`) runs on every request and populates `req.user` from the session cookie or Bearer token. This hydrator does not enforce authentication — it makes user context available. Route-level enforcement is applied explicitly using `authMiddleware({ required: true })` and `requireRole()` from `src/middlewares/auth.ts`.

**Current coverage:** 155 of 170 top-level route files apply explicit authentication middleware. The remaining 15 route files (health checks, contact form, demo request, public status page, webhook receivers) are intentionally unauthenticated. A global deny-by-default enforcement layer is being added to prevent future routes from being inadvertently public.

Authorization is checked at:
1. Middleware level (role check before handler, explicitly applied per router)
2. Business logic level (fine-grained entity-level access)
3. Database query level (organization-scoped queries)

**Known gap:** A route security matrix documenting the auth enforcement level of every route does not yet exist. A companion task is in progress to generate this automatically. See `docs/known-gaps.md §3.2`.

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

- **Zod validation is applied to high-risk input surfaces** — contact forms, demo requests, feedback, invitations, auth flows, GDPR requests, and partner portal submissions use Zod schema validation via `validateBody()` / `validateQuery()` middleware helpers from `lib/validation.ts`. Expansion to remaining high-traffic API routes is an active remediation task (see `docs/known-gaps.md §4.1`).
- SQL injection prevented by Drizzle ORM parameterized queries (no raw SQL with user input) — this applies to all routes regardless of Zod coverage.
- XSS prevented by React's default HTML escaping + CSP headers
- CSRF protection via `SameSite` cookie policy and CSRF tokens on state-changing routes

**Known gap:** Zod input validation helpers are currently applied to 21 of 170 top-level route files. The remaining 149 routes rely on Drizzle's parameterized queries for SQL safety but do not have structured input schema validation. Core high-traffic routes (`lyte.ts`, `vessels.ts`, `firestorm.ts`, `terra.ts`, `alloy.ts`, `billing.ts`) are in the expansion scope. A systematic Zod expansion effort is underway.

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

## Operational Security Controls

### Notification Rate Limiting

Notification dispatch is rate-limited per app per severity tier to prevent alert fatigue:

| Severity | Max per minute | Behavior when exceeded |
|----------|---------------|----------------------|
| Critical | 5 | Suppressed with warning log |
| Warning | 10 | Suppressed with warning log |
| Info | 20 | Suppressed with warning log |

### Self-Monitoring

The API server runs an internal self-monitor (`lib/self-monitor.ts`) that polls `/api/health/detailed` every 5 minutes. It raises alerts when:
- Error rate exceeds 5%
- P95 latency exceeds 2s
- Database becomes unreachable
- Job queue depth exceeds 50

### Provider Health Probes

Active health probes check AI provider reachability (OpenAI, Anthropic, Gemini, HuggingFace) every 2 minutes. Failures are logged and can trigger Slack alerts.

### CI Security Gates

Every commit runs:
- `pnpm audit --audit-level high` — blocks on high/critical dependencies
- Secret pattern scan — blocks if credentials detected in source
- TypeScript typecheck — blocks on type errors
- ESLint — blocks on lint errors
- Full build validation — blocks if any artifact fails to build

---

## Known Gaps (Honest Assessment)

The full technical gap register is maintained at [`docs/known-gaps.md`](../known-gaps.md). Security-relevant gaps are summarized here:

| Gap | Planned Resolution | Timeline |
|-----|-------------------|----------|
| Global deny-by-default auth enforcement | Add deny-by-default guard layer | Active remediation |
| Route security matrix | Automated route→auth audit tooling | Active remediation |
| Zod input validation (21 of 170 top-level routes covered) | Systematic expansion to high-traffic routes | Active remediation |
| SOC 2 Type II certification | Initiate after first revenue | 12–18 months post-revenue |
| Redis for session store (currently in-memory) | Add Redis when scaling beyond single instance | Revenue activation phase |
| FedRAMP readiness (Aegis) | Begin after DoD/Fed contract engagement | 18–24 months |
| Automated backup validation (restore testing) | Quarterly restore drill | Next operational cycle |
| External uptime monitoring | Configure before first enterprise pilot | Pre-commercial launch |
| Sentry or equivalent error tracking in production | Add Sentry DSN to production environment | Next quarter |
| Multi-region failover | Architect after first enterprise contract | Post-initial revenue |
| Formal penetration test | Pen test completed (NCC Group, May 2026) — 0 Critical, 3 High (all remediated and independently re-tested). Formal Letter of Attestation (NCC-SZL-2026-04-LOA-1.0) issued May 16, 2026. | Complete — see `docs/internal/security/pentest-findings-2026-04.md` and the [Letter of Attestation](../internal/security/pentest-attestation-letter-2026-05.md) |

These gaps are honest and documented. None of them represent active vulnerabilities in the current demonstration environment. The full gap register with risk ratings, quantified current state, and remediation paths is maintained at [`docs/known-gaps.md`](../known-gaps.md).
