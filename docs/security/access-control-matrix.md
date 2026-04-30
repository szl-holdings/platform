# Access Control Matrix — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Engineers, security reviewers, compliance officers, enterprise evaluators

> This document consolidates and expands `docs/ACCESS_CONTROL.md` with per-artifact and per-route role/permission mappings. The source policy document remains at `docs/ACCESS_CONTROL.md`. See `ROUTE_INVENTORY.md` for the complete route inventory.

**Related:** [SECURITY-CHECKLIST.md](security-checklist.md) · [API-SPEC.md](../architecture/api-spec.md) · [architecture.md](../architecture/architecture.md)

---

## Access Control Model

The SZL Holdings platform uses **Role-Based Access Control (RBAC)** with **organization-scoped tenant isolation**.

- Every user belongs to one or more **organizations (orgs)**
- Every user has a **role** within each org
- All database queries are scoped by `org_id` — cross-tenant access is architecturally prevented
- All API routes outside the explicit public allowlist require authentication (deny-by-default)
- The global `authMiddleware` (session hydrator) populates `req.user` / `req.oidcUser`; the `globalAuthEnforcer` middleware runs after it and rejects all unauthenticated requests to non-allowlisted paths with `401`
- Route-level `authMiddleware({ required: true })` and `requireRole(...)` add further role-based enforcement beyond the global gate
- Public routes are limited to: `/api/health*`, `/api/auth/*`, `/api/oidc/*`, `/api/public/*`, `/api/webhooks/*`, `/api/scim/*`, `/api/stream/webhook/*`, `/api/v1/*`, `/api/docs/*`, `/api/csrf-token`, and a small set of exact-path exceptions (see `global-auth-enforcer.ts`)

Source: `docs/ACCESS_CONTROL.md` · `lib/auth/` · `artifacts/api-server/src/middlewares/`

---

## Authentication

**Primary:** OpenID Connect (OIDC) with PKCE flow via Replit Auth (development) and Azure AD (production).

**Fallback:** Email/password authentication via `POST /api/auth/login-password`. Passwords hashed with PBKDF2 (SHA-512, 100,000 iterations, 64-byte key) stored in `users.password_hash`.

**Session management:**
- Server-side sessions stored in PostgreSQL `sessions` table; the `sid` cookie contains only an opaque random token
- Session cookie: `sid`, HttpOnly, Secure (unconditionally), SameSite=Lax
- Session lifetime: **OIDC sessions** — 7-day TTL; **credential login sessions** — 30-day TTL
- Sessions invalidated on explicit logout (GET /api/logout or DELETE /api/auth/sessions/current). No automatic revocation on role change.
- CSRF double-submit tokens on most state-changing requests (exemptions exist — see CSRF section)
- WebSocket tickets: HMAC-signed, 5-minute TTL, signed with `SESSION_SECRET`, per-channel role-based ACL

---

## Role Systems

The platform uses two parallel role systems that serve different purposes, both defined in `lib/db/src/schema/auth.ts` and `lib/db/src/schema/organizations.ts`.

### Platform Roles (`users.platform_role`)

Set on each user account. Controls platform-level access:

| Role | Description |
|------|-------------|
| `founder_admin` | Full platform access — SZL Holdings founder only |
| `platform_admin` | Platform-level administration |
| `operator` | Standard platform operator |
| `ops_manager` | Operations management |
| `analyst` | Read-only analytical access |
| `executive_viewer` | Executive-level read-only access |
| `sales_delivery_user` | Sales and delivery operations |
| `maritime_ops_user` | Maritime-specific operations |
| `service_coordinator` | Service coordination |
| `pilot_customer_user` | Pilot / early-access customer |
| `anonymous_visitor` | No platform access |

### Organization Membership Role (`org_members.role`)

Controls access within a specific organization context:

| Role | Description |
|------|-------------|
| `owner` | Org ownership — billing, org transfer |
| `admin` | Full org management, user provisioning |
| `member` | Standard org member: dashboards, workflows |
| `viewer` | Read-only access to org surfaces |

### CMS / Content Roles (`organization_memberships.role`)

Used for content management access within the SZL Holdings corporate platform:

| Role | Hierarchy Level | Description |
|------|----------------|-------------|
| `super_admin` | 5 | Platform-level super admin |
| `admin` | 4 | Full admin including content |
| `editor` | 3 | Content editing |
| `member` | 2 | Authenticated org member |
| `client` | 2 | Client-level access |
| `authenticated` | 1 | Any authenticated user |
| `public` | 0 | No authentication required |

### Extended Roles Table (`roles.name`)

A separate `roles` table supports granular role assignment via `user_roles` join. Roles include: `super_admin`, `admin`, `editor`, `member`, `client`, `authenticated`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`, `operator`, `seller`, `client_viewer`, `creative_user`.

**Default org membership role on invitation:** `member`

---

## Route Classification

| Classification | Auth Required | Role Restriction |
|---------------|--------------|-----------------|
| `PUBLIC` | No | None |
| `DEMO` | Optional | Any authenticated user |
| `PRIVATE` | Yes | Org member (any org membership role) |
| `INTERNAL` | Yes | `super_admin`, `ops`, or `exec` role (from `roles` table) via `adminGuard` middleware |

Admin routes (`/admin`) are protected by `adminGuard` (`artifacts/api-server/src/middlewares/admin-guard.ts`). In `routes/index.ts`, only `/admin` is mounted with `adminGuard`. There is no separate `/ops` route group mounted with `adminGuard`.

`adminGuard` requires:
1. Valid authentication session
2. User has `super_admin`, `ops`, or `exec` role assigned in the `roles` table via `user_roles` join
3. **OR** the request carries a valid `x-internal-token` header matching `ALLOY_INTERNAL_TOKEN` env var (server-to-server only)

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
| `/investors/data-room` | PRIVATE | `admin` | Highly restricted |
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
| AIOps admin | PRIVATE | `admin` |

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
| Admin functions | PRIVATE | `admin` |

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

### Counsel — Legal Matter Command (`/prism-counsel/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| All Counsel routes | PRIVATE | `analyst` |
| Matter management (read) | PRIVATE | `analyst` |
| Matter management (write) | PRIVATE | `operator` |
| Document review | PRIVATE | `analyst` |
| Recovery operations | PRIVATE | `operator` |
| Court filings | PRIVATE | `operator` |
| Approval chains | PRIVATE | `approver` |
| Admin health | PRIVATE | `admin` |
| No-Fault module | PRIVATE | `analyst` |

---

### Carlota Jo (`/carlota-jo/`)

| Route | Classification | Minimum Role |
|-------|---------------|-------------|
| Public advisory pages | PUBLIC | — |
| Client portal | PRIVATE | `viewer` (client role) |
| Operator view | PRIVATE | `operator` |
| Booking management | PRIVATE | `operator` |
| Admin functions | PRIVATE | `admin` |

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
| `/api/ai/ops/summary` (read) | PRIVATE | `analyst` |
| `/api/ai/ops/traces` (read) | PRIVATE | `analyst` |
| `/api/ai/ops/traces/:id/status` (write) | PRIVATE | `operator` |
| `/api/ai/ops/review-queue` (read) | PRIVATE | `analyst` |
| `/api/ai/ops/review-queue/:id/decision` (write) | PRIVATE | `operator` |
| `/api/ai/ops/evaluators` (read) | PRIVATE | `admin` — platform-global data |
| `/api/ai/ops/evaluators/stats` (read) | PRIVATE | `admin` — platform-global data |
| `/api/intelligence/*` | PRIVATE | `analyst` |
| `/api/storage/*` | PRIVATE | `analyst` |
| `/api/billing/*` | PRIVATE | `owner` |
| `/api/billing/webhook` | PUBLIC | Stripe signature |
| `/api/admin/*` | INTERNAL | `super_admin` |
| `/api/notifications/*` | PRIVATE | `operator` |
| `/api/mcp` (public tools) | PUBLIC | — |
| `/api/mcp` (tenant-scoped tools) | PRIVATE | `analyst` (read), `operator` (write/trigger) |
| `/api/mcp` (admin tools) | INTERNAL | `admin` / `super_admin` |

---

## Permission Matrix

Authorization maps **org membership role** (the primary enforced role in route handlers) to resource actions. Platform roles (`founder_admin`, `platform_admin`) have full access to everything.

| Resource / Action | Platform Admin (founder_admin / platform_admin) | org: owner | org: admin | org: member | org: viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| **Platform Admin** |
| Platform-level user mgmt | ✅ | — | — | — | — |
| Tenant provisioning | ✅ | — | — | — | — |
| Database backup | ✅ | — | — | — | — |
| **Org Administration** |
| Invite / remove org users | ✅ | ✅ | ✅ | — | — |
| Set org member roles | ✅ | ✅ | ✅ | — | — |
| Org settings | ✅ | ✅ | ✅ | — | — |
| Billing management | ✅ | ✅ | — | — | — |
| **Audit & Compliance** |
| Read audit trail | ✅ | ✅ | ✅ | — | — |
| Export compliance reports | ✅ | ✅ | ✅ | — | — |
| View security posture | ✅ | ✅ | ✅ | ✅ | — |
| **Alloy Workflow Engine** |
| Create / manage workflows | ✅ | ✅ | ✅ | ✅ | — |
| Approve / reject actions | ✅ | ✅ | ✅ | — | — |
| View workflow queue | ✅ | ✅ | ✅ | ✅ | 👁 |
| **Aegis / Security** |
| Create / update incidents | ✅ | ✅ | ✅ | ✅ | — |
| Manage playbooks | ✅ | ✅ | ✅ | — | — |
| View threat intel | ✅ | ✅ | ✅ | ✅ | 👁 |
| View incidents | ✅ | ✅ | ✅ | ✅ | 👁 |
| **Vessels / Maritime** |
| Manage fleet registry | ✅ | ✅ | ✅ | ✅ | — |
| View positions + voyages | ✅ | ✅ | ✅ | ✅ | 👁 |
| **Terra / Real Estate** |
| Create / update deals | ✅ | ✅ | ✅ | ✅ | — |
| View property intelligence | ✅ | ✅ | ✅ | ✅ | 👁 |
| **Counsel / Legal** |
| Create / manage matters | ✅ | ✅ | ✅ | ✅ | — |
| Document review | ✅ | ✅ | ✅ | ✅ | — |
| **AI Agent Tools** |
| Invoke AI analysis | ✅ | ✅ | ✅ | ✅ | — |
| AI agent configuration | ✅ | ✅ | — | — | — |
| **Storage** |
| Upload files | ✅ | ✅ | ✅ | ✅ | — |
| Delete files | ✅ | ✅ | ✅ | — | — |

**Legend:** ✅ Full access · 👁 Read-only · — No access

*Note: Fine-grained permission enforcement is implemented per route handler. This matrix represents the general authorization intent; consult individual route files in `artifacts/api-server/src/routes/` for exact checks.*

---

## MCP Gateway Access Control

The MCP gateway (`/api/mcp`) enforces the same RBAC model as the REST API. Access is layered:

| Layer | Enforcement |
|-------|------------|
| Authentication | Session cookie or Bearer token (same as REST API) |
| Tenant scope | `org_id` injected from authenticated session — callers cannot supply their own `orgId` |
| Tool role check | Each tool class has a minimum role requirement (see table below) |
| High-risk guard | Covenant Policy Engine blocks high-risk actions for non-approver roles |
| Audit logging | Every invocation recorded in immutable audit trail |

### MCP Tool Role Requirements

| Tool Class | Examples | Minimum Role | Notes |
|------------|----------|-------------|-------|
| Public read | `platform_schema_query` | None | No auth required |
| Tenant read | `vessels_fleet_status`, `terra_property_search` | `analyst` | Auth + org scope required |
| Analysis | `firestorm_triage_incident`, `lyte_run_analysis` | `analyst` | Queued for review if low-confidence |
| Workflow trigger | `alloy_launch_workflow`, `alloy_skill_invoke` | `operator` | Returns `pending_approval` for review-class skills |
| Approval action | `platform_request_approval` | `operator` | Triggers Alloy approval workflow |
| Admin-only | `alloy_skill_invoke` (admin class) | `admin` / `super_admin` | Returns `PERMISSION_DENIED` otherwise |

### Agent Identity

When an AI agent (NuroMesh, Claude, GPT-4) accesses the MCP gateway, it must present a valid session token on behalf of a human user or a service account. There is no separate "agent identity" bypass — agents are subject to the same role enforcement as human users.

Service accounts used by AI agents should be assigned the minimum necessary role (`analyst` for read-only agents, `operator` for workflow-triggering agents).

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

**Admin PIN:** The `/admin` CMS panel requires a PIN verification on top of session authentication. The PIN is stored as a hashed value.

**Super admin access:** Limited to SZL Holdings internal team. Cannot be granted through the UI — must be written directly to the database. All `super_admin` actions are logged in the immutable audit trail.

**Service role key:** Machine-to-machine internal calls use `SERVICE_ROLE_KEY`. This key bypasses user-facing role checks but is logged and audited.

---

## WebSocket Access Control

Real-time WebSocket channels use:
- HMAC-signed connection tickets with 5-minute TTL (signed with `SESSION_SECRET`)
- Channel names include `org_id` prefix for isolation
- Per-channel ACL enforced at connection time
- Tickets revoked on session expiry or `SESSION_SECRET` rotation

---

## Enterprise Provisioning (SCIM 2.0)

Enterprise deployments support SCIM 2.0 for automated user lifecycle management:
- Azure AD integration for SSO + automated user provisioning
- Role mapping from Azure AD groups to platform roles
- Automated deprovisioning on user offboarding
- Audit log entry for every provisioning action

---

## Access Review Schedule

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

| Framework | Controls Addressed |
|-----------|-------------------|
| SOC 2 Type II | CC6.1–CC6.8 (Logical access controls) |
| ISO 27001 | A.9 (Access control) |
| GDPR | Article 25 (Data protection by design and by default) |
| HIPAA (planned) | § 164.312 (Technical safeguards) |

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

*See also: [docs/ACCESS_CONTROL.md](../ACCESS_CONTROL.md) · [SECURITY-CHECKLIST.md](security-checklist.md) · [API-SPEC.md](../architecture/api-spec.md)*

---

*Last verified against source code: 2026-04-15. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes.*
