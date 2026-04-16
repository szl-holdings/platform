# Access Control Matrix — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineers, security reviewers, compliance officers, enterprise evaluators

> This document consolidates and expands `docs/ACCESS_CONTROL.md` with per-artifact and per-route role/permission mappings. The source policy document remains at `docs/ACCESS_CONTROL.md`. See `ROUTE_INVENTORY.md` for the complete route inventory.

---

## Access Control Model

The SZL Holdings platform uses **Role-Based Access Control (RBAC)** with **organization-scoped tenant isolation**.

- Every user belongs to one or more **organizations**
- Every user has a **role** within each org
- All database queries are scoped by `org_id` — cross-tenant access is architecturally prevented
- All API routes outside the explicit public allowlist require authentication (deny-by-default)
- The global `authMiddleware` (session hydrator) populates `req.user` / `req.oidcUser`; the `globalAuthEnforcer` middleware runs after it and rejects all unauthenticated requests to non-allowlisted paths with `401`
- Route-level `authMiddleware({ required: true })` and `requireRole(...)` add further role-based enforcement beyond the global gate
- Public routes are limited to: `/api/health*`, `/api/auth/*`, `/api/oidc/*`, `/api/public/*`, `/api/webhooks/*`, `/api/scim/*`, `/api/stream/webhook/*`, `/api/v1/*`, `/api/docs/*`, `/api/csrf-token`, and a small set of exact-path exceptions (see `global-auth-enforcer.ts`)

---

## Authentication

**Primary:** OpenID Connect (OIDC) with PKCE flow via Replit Auth (development) and Azure AD (production).

**Session management:**
- Server-side sessions stored in PostgreSQL
- Session lifetime: 7 days maximum, 24 hours idle
- Sessions invalidated on explicit logout
- Opaque `sid` cookie (not signed by cookie-parser; session validity checked via DB lookup)
- CSRF tokens (double-submit pattern) on all state-changing requests
- WebSocket tickets: HMAC-signed, 5-minute TTL, signed with `SESSION_SECRET`

---

## Role Hierarchy

11 roles ordered from most to least privileged:

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Platform | Full platform access; SZL Holdings internal only. Must be granted via database. |
| `org_admin` | Organization | Full org management, user provisioning |
| `org_owner` | Organization | Org ownership transfer, billing management |
| `compliance_officer` | Organization | Audit trail access, compliance reports |
| `security_analyst` | Organization | Security posture, threat intelligence (Aegis) |
| `operator` | Organization | Standard operator: dashboards, signals, workflows |
| `approver` | Organization | Can approve actions in the Alloy approval queue |
| `analyst` | Organization | Read-only access to dashboards and signals |
| `viewer` | Organization | Read-only access to specific permitted surfaces |
| `auditor` | Organization | Audit trail and compliance reports only |
| `demo` | Organization | Demo org access (synthetic data only) |

---

## Route Classification

| Classification | Auth Required | Role Restriction |
|---------------|--------------|-----------------|
| `PUBLIC` | No | None |
| `DEMO` | Optional | `demo` role or authenticated user |
| `PRIVATE` | Yes | Org member (any authenticated role) |
| `INTERNAL` | Yes | `super_admin` or designated internal role |

---

## Per-Artifact Access Matrix

### SZL Holdings (`artifacts/szl-holdings`, `/`)

| Route Group | Classification | Minimum Role | Notes |
|-------------|---------------|-------------|-------|
| `/` | PUBLIC | — | Landing page |
| `/platform`, `/lyte`, `/alloy-fabric` | PUBLIC | — | Product pages |
| `/solutions/*` | PUBLIC | — | Domain pack solution pages |
| `/trust*` | PUBLIC | — | Trust Center |
| `/docs/*` | PUBLIC | — | Documentation |
| `/legal/*` | PUBLIC | — | Legal pages |
| `/contact`, `/pricing` | PUBLIC | — | Marketing pages |
| `/demo`, `/pilot/*` | DEMO | `demo` or authenticated | Demo context required |
| `/prism-counsel/*` (app routes) | PRIVATE | `analyst` | Matter management app |
| `/alloy/*` | PRIVATE | `operator` | Alloy workflow app |
| `/investors/*` | PRIVATE | `viewer` | NDA-gated investor hub |
| `/investors/data-room` | PRIVATE | `org_admin` | Highly restricted |
| `/admin` | INTERNAL | `super_admin` + PIN | CMS admin panel (PIN-gated) |
| `/kpi-dashboard`, `/ops/*` | INTERNAL | `super_admin` | Internal operations |
| `/ownership-os` | INTERNAL | `super_admin` | Internal tool |

---

### Lyte (via Command Portal `/command/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Lyte routes | PRIVATE | `analyst` |
| PRISM dashboard (read) | PRIVATE | `analyst` |
| Action queue (read) | PRIVATE | `analyst` |
| Action queue (approve/reject) | PRIVATE | `approver` |
| Workflow management | PRIVATE | `operator` |
| AIOps admin | PRIVATE | `org_admin` |

---

### Aegis — Unified Defense & Intelligence (`/aegis/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Aegis routes | PRIVATE | `analyst` |
| Threat intelligence (read) | PRIVATE | `security_analyst` |
| Incident management (read) | PRIVATE | `analyst` |
| Incident response (write) | PRIVATE | `operator` |
| Playbook execution | PRIVATE | `operator` |
| SOAR automation | PRIVATE | `operator` |
| Deception grid management | PRIVATE | `security_analyst` |
| INCA / Intelligence Labs | PRIVATE | `security_analyst` |
| Managed services (Command workspace) | PRIVATE | `operator` |
| Admin functions | PRIVATE | `org_admin` |

---

### Terra — Real Estate Intelligence (`/terra/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Terra routes | PRIVATE | `analyst` |
| Property search and distress pipeline (read) | PRIVATE | `analyst` |
| Ownership graph (read) | PRIVATE | `analyst` |
| Deal pipeline (read) | PRIVATE | `analyst` |
| Deal pipeline (create/update) | PRIVATE | `operator` |
| CRM management | PRIVATE | `operator` |
| Market signals | PRIVATE | `analyst` |

---

### Vessels — Maritime Intelligence (`/vessels/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Vessels routes | PRIVATE | `analyst` |
| Fleet and AIS (read) | PRIVATE | `analyst` |
| Voyage economics (read) | PRIVATE | `analyst` |
| Sanctions screening (read) | PRIVATE | `analyst` |
| Exception center (read) | PRIVATE | `analyst` |
| Exception response (write) | PRIVATE | `operator` |
| Commodity trading | PRIVATE | `operator` |
| Insurance management | PRIVATE | `operator` |

---

### PRISM Counsel — Legal Matter Command (`/prism-counsel/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All PRISM Counsel routes | PRIVATE | `analyst` |
| Matter management (read) | PRIVATE | `analyst` |
| Matter management (write) | PRIVATE | `operator` |
| Document review | PRIVATE | `analyst` |
| Recovery operations | PRIVATE | `operator` |
| Court filings | PRIVATE | `operator` |
| Approval chains | PRIVATE | `approver` |
| Admin health | PRIVATE | `org_admin` |
| No-Fault module | PRIVATE | `analyst` |

---

### Carlota Jo (`/carlota-jo/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| Public advisory pages | PUBLIC | — |
| Client portal | PRIVATE | `viewer` (client role) |
| Operator view | PRIVATE | `operator` |
| Booking management | PRIVATE | `operator` |
| Admin functions | PRIVATE | `org_admin` |

---

### Command Portal (`/command/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Command routes | PRIVATE | `analyst` |
| Cross-domain command surface | PRIVATE | `analyst` |
| Executive briefing | PRIVATE | `analyst` |
| Cross-domain orchestration | PRIVATE | `operator` |

---

### API Server (`/api/`)

| Route Group | Classification | Minimum Role |
|-------------|---------------|-------------|
| `/api/health/*` | PUBLIC | — |
| `/api/docs` | PUBLIC | — |
| `/api/auth/*` | PUBLIC / Session | — |
| `/api/alloy/*` | PRIVATE | `operator` |
| `/api/alloy/approvals` (read) | PRIVATE | `analyst` |
| `/api/alloy/approvals` (approve) | PRIVATE | `approver` |
| `/api/firestorm/*` | PRIVATE | `analyst` |
| `/api/firestorm/intel` | PRIVATE | `security_analyst` |
| `/api/terra/*` | PRIVATE | `analyst` |
| `/api/vessels/*` | PRIVATE | `analyst` |
| `/api/prism-counsel/*` | PRIVATE | `analyst` |
| `/api/ai/*` | PRIVATE | `analyst` |
| `/api/intelligence/*` | PRIVATE | `analyst` |
| `/api/storage/*` | PRIVATE | `analyst` |
| `/api/billing/*` | PRIVATE | `org_owner` |
| `/api/billing/webhook` | PUBLIC | Stripe signature |
| `/api/admin/*` | INTERNAL | `super_admin` |
| `/api/notifications/*` | PRIVATE | `operator` |

---

## Multi-Tenancy Isolation

Cross-tenant access is **architecturally prevented** at four layers:

1. **Database query scoping:** Every query involving org-specific data includes `WHERE org_id = ?`
2. **ORM enforcement:** Drizzle ORM queries always include org scope via shared query builders
3. **API middleware:** `tenantScope` middleware verifies org membership on applicable routes
4. **WebSocket channels:** Named with `org_id` prefix, access controlled via HMAC-signed tickets

Routes where `tenantScope` middleware is applied globally:
`/api/audit`, `/api/jobs`, `/api/comments`, `/api/documents`, `/api/exports`, `/api/orgs`

Domain routes (Alloy, Firestorm, Terra, Vessels) enforce org scope internally within their route handlers.

---

## Privileged Access

| Access Type | Mechanism | Logging |
|-------------|-----------|---------|
| `super_admin` access | Granted via database, not UI | All actions logged in immutable audit trail |
| Admin CMS panel (`/admin`) | Session auth + admin PIN (PIN stored as hash) | All access logged |
| Internal health token | `X-Internal-Token: $ALLOY_INTERNAL_TOKEN` (≥ 32 chars) | Logged |
| Service role key | `SERVICE_ROLE_KEY` for machine-to-machine calls | All calls logged |

---

## WebSocket Access Control

Real-time WebSocket channels use:
- HMAC-signed connection tickets with 5-minute TTL (signed with `SESSION_SECRET`)
- Channel names include `org_id` for tenant isolation
- Per-channel ACL enforced at connection time
- Tickets revoked on session expiry or `SESSION_SECRET` rotation

---

## SCIM Provisioning (Enterprise)

Enterprise deployments support SCIM 2.0 for automated user provisioning:
- Azure AD integration for SSO + user sync
- Role mapping from Azure AD groups to platform roles
- Automated deprovisioning on user offboarding
- Audit log entry for every provisioning action

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

## Compliance Mapping

This access control model supports:

| Standard | Controls |
|----------|---------|
| SOC 2 Type II | CC6.1 – CC6.8: Logical access controls |
| ISO 27001 | A.9: Access control |
| GDPR | Article 25: Data protection by design |

---

## Audit Trail

All access events generate immutable audit trail entries including:
- Login / logout events
- Failed authentication attempts
- Role changes
- Org membership changes
- Admin panel access
- All state-changing API actions

Audit entries include: timestamp, actor (user ID + org), action, affected resource, IP address (hashed for privacy).

---

## Related Documents

| Document | Path |
|----------|------|
| Access control policy (source) | `docs/ACCESS_CONTROL.md` |
| Route inventory | `ROUTE_INVENTORY.md` |
| Authentication flow detail | `ARCHITECTURE.md` |
| API specification | `API-SPEC.md` |
| Secrets policy | `docs/SECRETS_POLICY.md` |
| Trust center | `docs/trust/trust-center.md` |
