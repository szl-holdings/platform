# Aegis — Identity and Access Management

**Document type:** Buyer-facing governance documentation  
**Current status:** Production-ready (pilot)  
**Last updated:** April 2025  

---

## Authentication

### Current State

Aegis supports session-based authentication for the pilot environment. JWT tokens are issued on login, stored server-side (Redis), and validated on every API request.

### SSO (Single Sign-On) — Hook Ready

Aegis has implemented SSO hook points for:
- **SAML 2.0** — SP-initiated and IdP-initiated flows
- **OIDC / OAuth 2.0** — Authorization Code with PKCE

These hooks are tested against a mock IdP in the pilot environment. Binding to a production IdP (Okta, Azure AD, Ping, Google Workspace) requires per-customer deployment configuration. Aegis does not manage IdP registration on behalf of customers.

**What this means for buyers:** You will need to register Aegis as an application in your IdP and provide the metadata/client credentials during onboarding. Aegis supports the configuration; the IdP account belongs to you.

### SCIM 2.0 — Hook Ready

Aegis supports SCIM 2.0 for automated user provisioning and deprovisioning:
- User create/update/deactivate
- Group synchronization
- Role assignment via group membership mapping

SCIM endpoint stub is implemented. Customer IdP configuration is required for production activation.

---

## Authorization (RBAC)

Role-based access control is enforced **server-side** on every API route. Client-side UI hiding is supplementary only — all authorization decisions are made at the API layer.

### Role Definitions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| Super Admin | Platform | All |
| Tenant Admin | Tenant | Manage users, integrations, audit logs, policies |
| SOC Lead | Tenant | Approve actions, close incidents, view all reports |
| SOC Analyst | Tenant | View/update incidents, create cases, view findings |
| Executive Viewer | Tenant | View executive reports, risk posture |
| Integration Manager | Tenant | Manage integrations, view audit logs |
| Read Only | Tenant | View incidents, findings, reports |

All roles are **tenant-scoped** except Super Admin. A user authenticated to Tenant A cannot access Tenant B's data regardless of role.

---

## Tenant Isolation

Tenant isolation is enforced at the database query level. Every query is scoped to the authenticated tenant's ID. This is not a UI-level control — cross-tenant data access is structurally impossible through the application API.

Cross-tenant agent queries are blocked at the policy layer and logged to the audit trail as `policy_block` events.

### Verification

Tenant isolation is tested via a suite of automated tests. See: `docs/internal/aegis/tenant-isolation-tests.md`

---

## Session Management

- Sessions expire after 24 hours of inactivity
- Session tokens are invalidated on logout (server-side revocation)
- Concurrent session limits: configurable per tenant (default: 3)
- All session events (login, logout, token refresh) are logged to the audit trail

---

## Audit Logging

Every authentication and authorization event is logged:

| Event | Logged |
|-------|--------|
| Successful login | Yes |
| Failed login attempt | Yes |
| Logout | Yes |
| Session expiry | Yes |
| Permission denied | Yes |
| Role change | Yes |
| User provisioned/deprovisioned | Yes |

Audit logs are immutable after write. Retention: 2 years (configurable).

---

## Current Limitations

| Limitation | Status |
|-----------|--------|
| Full MFA enforcement (TOTP/SMS) | Planned |
| Hardware key (FIDO2/WebAuthn) | Planned |
| Real-time anomalous login detection | Planned |
| Privileged access management (PAM) integration | Planned |

These limitations are disclosed because accurate posture assessment requires complete information. We do not claim capabilities we have not built.
