# Access Control — SZL Holdings Platform

> Policy and implementation documentation for access control across the SZL Holdings platform.

---

## Access Control Model

The SZL Holdings platform uses **Role-Based Access Control (RBAC)** with organization-scoped tenant isolation.

- Every user belongs to one or more **organizations (orgs)**
- Every user has a **role** within each org
- All database queries are scoped by `org_id` — cross-tenant access is architecturally prevented
- All API routes enforce authentication and role checks

---

## Authentication

**Primary:** OpenID Connect (OIDC) with PKCE flow via Replit Auth (development) and Azure AD (production).

**Session management:**
- Server-side sessions (Express session + PostgreSQL or Redis session store)
- Session lifetime: 24 hours idle, 7 days maximum
- Sessions invalidated on explicit logout
- HMAC-signed session tokens
- CSRF tokens on all state-changing requests

---

## Role Hierarchy

The platform defines 11 roles, ordered from most to least privileged:

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Platform | Full platform access; SZL Holdings internal only |
| `org_admin` | Organization | Full org management, user provisioning |
| `org_owner` | Organization | Org ownership transfer, billing |
| `compliance_officer` | Organization | Audit trail, compliance reports |
| `security_analyst` | Organization | Security posture, threat intel (Aegis) |
| `operator` | Organization | Standard operator: dashboards, signals, workflows |
| `approver` | Organization | Can approve actions in the Alloy approval queue |
| `analyst` | Organization | Read-only access to dashboards and signals |
| `viewer` | Organization | Read-only access to specific permitted surfaces |
| `auditor` | Organization | Audit trail and compliance reports only |
| `demo` | Organization | Demo org access (synthetic data only) |

---

## Route Authorization

All routes are classified as:

| Classification | Auth Required | Role Restriction |
|---------------|--------------|-----------------|
| `PUBLIC` | No | None |
| `DEMO` | Optional | `demo` role or authenticated |
| `PRIVATE` | Yes | Org member |
| `INTERNAL` | Yes | `super_admin` or designated internal role |

Admin routes (`/admin`, `/ops/*`) require:
1. Valid authentication session
2. `super_admin` role OR a valid admin PIN (PIN-gated for emergency access)

---

## Multi-Tenancy Isolation

All org-scoped data is isolated through:

1. **Database query scoping:** Every query involving org-specific data includes `WHERE org_id = ?`
2. **ORM enforcement:** Drizzle ORM queries always include org scope via shared query builders
3. **API middleware:** Org membership is verified on every request
4. **WebSocket channels:** Channels are named with `org_id` prefix, access controlled via HMAC-signed tickets

Cross-tenant access is **architecturally prevented** — there is no mechanism to access another org's data through the API.

---

## WebSocket Access Control

Real-time WebSocket channels use:
- HMAC-signed connection tickets with 5-minute TTL
- Channel names include `org_id` for isolation
- Per-channel ACL enforced at connection time
- Tickets revoked on session expiry

---

## SCIM Provisioning (Enterprise)

Enterprise deployments support SCIM 2.0 for automated user provisioning:
- Azure AD integration for SSO + user sync
- Role mapping from Azure AD groups to platform roles
- Automated deprovisioning on user offboarding
- Audit log entry for every provisioning action

---

## Multi-Factor Authentication (MFA)

The platform supports TOTP-based MFA (e.g. Google Authenticator, 1Password).

**Per-user MFA (opt-in):**
- Any user may enable MFA for their own account via `POST /auth/mfa/setup` followed by `POST /auth/mfa/enable`.
- When MFA is enabled, login returns an `mfa_challenge_token` instead of a session; the user submits a 6-digit TOTP code to `POST /auth/mfa/challenge` to receive a session.

**Org-level MFA enforcement (admin-controlled):**
- Org admins may require MFA for every member of their organization by setting `mfa_required = true` on the org. This is exposed via:
  - `PATCH /api/orgs/:orgSlug/mfa-required` — body `{ "mfaRequired": true | false }`
  - `PATCH /api/orgs/:orgSlug` — same body (alias)
- Toggling enforcement requires the `admin` (or `owner`) org role, or a platform-elevated user (`super_admin` / `admin`).
- When enforcement is on and a member without MFA logs in, the login response is `{ mfa_setup_required: true, mfa_setup_token }` and **no session is issued**. The user must complete:
  1. `POST /auth/mfa/setup-required` with the setup token → returns the TOTP secret + QR-friendly `otpauth://` URI.
  2. `POST /auth/mfa/enable-required` with the setup token + 6-digit code → enables MFA, consumes the setup token, and issues the session in a single step.
- Setup tokens are short-lived (15 minutes) and stored in Redis with an in-memory fallback.
- Enabling or disabling org-level MFA enforcement writes an audit event (`org_mfa_enforcement_enabled` / `org_mfa_enforcement_disabled`) including the actor, prior value, and new value.
- Per-user MFA enable / disable / challenge events are also audited (`mfa.enabled`, `mfa.disabled`, `mfa.challenge_passed`).

This satisfies enterprise buyers in regulated sectors (financial services, legal, security) who require organization-wide MFA as a tenant policy rather than relying on individual user opt-in.

---

## Privileged Access

**Admin PIN:** The `/admin` CMS panel requires a PIN verification in addition to session authentication. The PIN is stored as a hashed value; it is not stored in plaintext.

**Super admin access:** Limited to SZL Holdings internal team. Must be granted via database (not through the UI). All super admin actions are logged in the immutable audit trail.

---

## Access Reviews

| Review | Frequency |
|--------|-----------|
| User role audit (per org) | Quarterly |
| Super admin access | Monthly |
| Service account permissions | Quarterly |
| API key access rights | Annually |
| SCIM provisioning config | On every organizational change |

---

## Audit Trail

All access events generate audit trail entries:
- Login / logout events
- Failed authentication attempts
- Role changes
- Org membership changes
- Admin panel access
- All state-changing API actions

Audit entries are immutable (append-only). They include: timestamp, actor (user ID + org), action, affected resource, IP address (hashed for privacy).

---

## Compliance

This access control model supports:
- SOC 2 Type II (CC6.1 – CC6.8: Logical access controls)
- ISO 27001 (A.9: Access control)
- GDPR (Article 25: Data protection by design)

---

*Last updated: 2026-04-03*
