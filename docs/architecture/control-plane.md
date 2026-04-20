# Control Plane Architecture — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Engineers, security reviewers, compliance officers, enterprise evaluators

> Documents all admin tooling, privileged access paths, escalation mechanisms, and operational safety controls for the SZL Holdings platform.

**Related:** [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) · [SECURITY-CHECKLIST.md](../security/security-checklist.md) · [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md) · [TENANCY-MODEL.md](tenancy-model.md)

---

## Overview

The SZL Holdings control plane consists of all mechanisms by which platform operators and system processes can take privileged actions that are not available to standard tenant users. This includes admin APIs, internal service tokens, backup operations, tenant provisioning, feature flags, and the audit infrastructure.

Control plane access is **strictly gated** behind the `adminGuard` middleware and `requireRole("admin")` checks. No control plane path is accessible to unauthenticated users or standard org members.

---

## Control Plane Boundary

```
┌─────────────────────────────────────────────────────────────────────┐
│  TENANT PLANE (standard operations)                                  │
│  All domain operations, Alloy workflows, AI tools, dashboards        │
│  Enforced by: globalAuthEnforcer + authMiddleware + requireRole()    │
├─────────────────────────────────────────────────────────────────────┤
│  CONTROL PLANE (privileged operations)                               │
│  Admin APIs · Backup · Tenant Provisioning · Feature Flags           │
│  Enforced by: adminGuard + requireRole("admin") / "super_admin"      │
│                                                                       │
│  Entry paths:                                                         │
│    1. /api/admin/*   — Session auth + admin role + optional PIN      │
│    2. x-internal-token header — Server-to-server only                │
│    3. SERVICE_ROLE_KEY — Machine-to-machine internal calls           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Admin Role Hierarchy

The control plane enforces two overlapping role systems (see ACCESS-CONTROL-MATRIX.md for the full model):

| Role | Control Plane Access | How Assigned |
|------|---------------------|--------------|
| `founder_admin` | Full cross-tenant access; all admin paths | Direct DB write only |
| `platform_admin` | Full cross-tenant access; all admin paths | Direct DB write only |
| `super_admin` (roles table) | Admin APIs + backup + provisioning | Direct DB write only |
| `admin` (roles table) | Admin APIs + backup; no cross-tenant provisioning | Direct DB write only |
| `ops` (roles table) | Operational reads; limited write access | Direct DB write only |
| `exec` (roles table) | Executive read access | Direct DB write only |

**Critical:** No admin role can be granted through any UI surface. Admin roles must be written directly to the database. This is a deliberate architectural decision to prevent privilege escalation via the user-facing application.

---

## Admin Middleware Stack

The following middleware chain applies to all `/api/admin/*` routes:

```
Request → globalAuthEnforcer → authMiddleware (session hydration)
        → sessionRefreshPolicy → adminGuard (role check + internal token)
        → [route handler]
```

### `adminGuard` Middleware

File: `artifacts/api-server/src/middlewares/admin-guard.ts`

The `adminGuard` middleware enforces admin-level access through two paths:

**Path 1: Internal Service Token**
```
x-internal-token: <ALLOY_INTERNAL_TOKEN>
```
- Used by server-to-server internal calls (e.g., AlloyChat → admin endpoints)
- Token must match `ALLOY_INTERNAL_TOKEN` environment variable exactly
- Token must be at least 32 characters (enforced at startup in `startup-config.ts`)
- ⚠️ **Known Issue (AF-001):** Token comparison uses `Buffer.equals()` rather than `crypto.timingSafeEqual`. See AUDIT_FINDINGS_REGISTER.md for remediation plan.

**Path 2: Authenticated Session + Admin Role**
```
Session cookie (sid) → user must have super_admin, ops, or exec role in roles table
```
- Roles are loaded from the `user_roles` join table at session creation
- All admin access is logged to the structured Pino logger and the audit trail

### `requireRole` Middleware

File: `artifacts/api-server/src/middlewares/auth.ts`

Used inside route handlers to enforce role-specific permissions beyond the `adminGuard` gate:

```typescript
adminRouter.use("/admin", authMiddleware());
adminRouter.use("/admin", requireRole("admin"));
// Then individual sub-routes can further restrict:
router.post("/admin/tenant/suspend", requireRole("super_admin"), handler);
```

---

## Admin Route Surface

All admin routes are mounted at `/api/admin/*` with the `adminGuard` applied at the router level.

### System Administration (`/api/admin/system`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/admin/system/health` | GET | `admin` | Platform health status |
| `/admin/system/config` | GET | `super_admin` | Platform configuration |
| `/admin/system/config` | PUT | `super_admin` | Update platform configuration |
| `/admin/system/maintenance` | POST | `super_admin` | Toggle maintenance mode |

### User Administration (`/api/admin/users`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/admin/users` | GET | `admin` | List all platform users |
| `/admin/users/:id` | GET | `admin` | Get user detail |
| `/admin/users/:id/roles` | PUT | `super_admin` | Update user roles |
| `/admin/users/:id/deactivate` | POST | `super_admin` | Deactivate user account |
| `/admin/users/:id/impersonate` | POST | `admin` | Begin impersonation session |
| `/admin/users/:id/impersonate/end` | POST | `admin` | End impersonation session |

**Impersonation Safety:** Impersonation sessions are logged with `event: "admin.impersonation.start"` and `event: "admin.impersonation.end"` in the structured audit log. The impersonating user's original identity is preserved and logged.

### Feature Flags (`/api/admin/flags`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/admin/flags` | GET | `admin` | List all feature flags |
| `/admin/flags/:name` | PUT | `admin` | Enable/disable a feature flag |
| `/admin/flags/:name/org/:orgId` | PUT | `admin` | Org-level flag override |

### Integrations (`/api/admin/integrations`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/admin/integrations` | GET | `admin` | List configured integrations |
| `/admin/integrations/log` | GET | `admin` | Integration activity log |

### Backup & Data Operations (`/api/admin/backup`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/admin/backup/status` | GET | `admin` | Backup health and history |
| `/admin/backup/run` | POST | `admin` | Trigger manual backup |
| `/admin/backup/export-tenant` | POST | `admin` | Export all data for an org |

**Backup Safety Notes:**
- Backups are stored in a directory monitored by the backup service
- Daily and weekly backup labels are tracked
- Export operations stream as ZIP files; no data is stored on the server between request and response
- ⚠️ **Known Issue (AF-004):** `/admin/backup/export-tenant` accepts an `orgId` body parameter without validating that the requesting admin has cross-org authority. See AUDIT_FINDINGS_REGISTER.md.

### Tenant Provisioning (`/api/tenant-provisioning/`)

| Route | Method | Role Required | Description |
|-------|--------|---------------|-------------|
| `/tenant-provisioning/provision` | POST | `super_admin` | Create a new tenant org |
| `/tenant-provisioning/suspend` | POST | `super_admin` | Suspend a tenant |
| `/tenant-provisioning/reactivate` | POST | `super_admin` | Reactivate a suspended tenant |

---

## Internal Service Communication

### Internal Token Pattern

Internal service-to-service calls use a shared `ALLOY_INTERNAL_TOKEN` environment variable. This token is:
- Minimum 32 characters (enforced at startup)
- Passed as `x-internal-token: <token>` header
- Verified before any session-based auth (if valid, request proceeds as `INTERNAL_AGENT_USER` with `super_admin` role)
- Logged in structured logs on every use

The internal token bypasses user-facing RBAC but not the audit trail. All internal token requests are logged.

**Current known issue:** `adminGuard` uses `Buffer.equals()` for token comparison; `auth.ts` correctly uses `crypto.timingSafeEqual`. See AF-001 in AUDIT_FINDINGS_REGISTER.md.

### Service Role Key

Machine-to-machine calls from external services (e.g., Stripe webhooks, SCIM provisioning) use the `SERVICE_ROLE_KEY` environment variable. This key:
- Bypasses user-facing role checks
- Is verified in webhook handlers
- All invocations are logged

---

## CMS Admin Panel (`/admin` route — web frontend)

The `/admin` web route in the `szl-holdings` artifact provides a CMS admin panel for content management. This is a **client-side route** and does not directly access admin APIs.

| Control | Implementation |
|---------|---------------|
| Session auth | Required — must be authenticated |
| Admin PIN | Required — on top of session auth; PIN is stored as a hashed value |
| Access logging | All admin panel access logged in audit trail |
| Allowed roles | `super_admin` only |

The PIN verification adds a second factor to the session-based auth for the CMS panel. This is a partial mitigation for the absence of full MFA (see KG026).

---

## Privileged Access Safety Controls

| Control | Status | Implementation |
|---------|--------|---------------|
| Admin roles database-only (no UI grant) | ✅ | No role assignment endpoint in user-facing product |
| All admin actions logged | ✅ | Pino structured log + audit trail entries |
| Impersonation logged with actor identity | ✅ | `routes/admin/users.ts` |
| Internal token timing-safe compare | ⚠️ Partial | `auth.ts` ✅; `admin-guard.ts` ⚠️ (AF-001) |
| Admin PIN for CMS panel | ✅ | Hashed PIN stored, verified on access |
| MFA for super_admin sessions | ⚠️ Open | Planned for enterprise tier launch (KG026) |
| Cross-org export authorization check | ⚠️ Open | AF-004 — orgId not validated for authority |
| Session invalidation on role change | ⚠️ Open | AF-010 |

---

## Audit Trail Coverage

Every control plane action generates a structured log entry and an immutable audit trail record. Audit entries include:

| Field | Content |
|-------|---------|
| `timestamp` | ISO 8601 timestamp |
| `actor.userId` | Admin user ID |
| `actor.roles` | Roles at time of action |
| `action` | Action type (e.g., `admin.user.deactivate`) |
| `target` | Affected resource (user ID, org ID, etc.) |
| `requestId` | Correlation ID for request tracing |
| `ip` | Client IP (hashed for privacy) |
| `source` | `session` or `internal_token` |

Audit logs are written to:
1. Pino structured log output (stream to OTEL/log aggregator in production)
2. `audit_logs` database table (queryable, org-scoped)
3. For AI operations: `ai_traces` and `eval_events` tables

---

## Known Control Plane Risks

| Risk | Gap ID | Severity | Status |
|------|--------|----------|--------|
| `adminGuard` uses non-timing-safe token compare | AF-001 | P1 | ⚠️ Open |
| No MFA for super_admin sessions | KG026 / AF-011 | P1 | ⚠️ Open |
| Backup export lacks orgId authorization check | AF-004 | P2 | ⚠️ Open |
| Sessions not revoked on role change | AF-010 | P2 | ⚠️ Open |
| Sessions not invalidated on SESSION_SECRET rotation | AF-012 | P2 | ⚠️ Open |
| No CODEOWNERS for admin route files | KG013 | P1 | ⚠️ Open |

---

## Recommended Pre-Launch Control Plane Hardening

Before the first enterprise customer goes live, the following control plane hardening items should be completed:

1. **AF-001** — Replace `Buffer.equals()` with `crypto.timingSafeEqual` in `adminGuard`
2. **KG026 / AF-011** — Implement MFA for `super_admin` / `founder_admin` sessions
3. **AF-004** — Validate `orgId` authorization on backup export endpoint
4. **AF-010** — Implement session invalidation on role change
5. **KG013** — Create `CODEOWNERS` file designating mandatory reviewers for `artifacts/api-server/src/routes/admin/` and `artifacts/api-server/src/middlewares/`

---

*Last verified against source code: 2026-04-16. Re-verify after any changes to `artifacts/api-server/src/routes/admin/`, `artifacts/api-server/src/middlewares/admin-guard.ts`, or `lib/auth/`.*
