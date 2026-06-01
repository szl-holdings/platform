# Tenant Isolation Test Plan

**Date:** 2026-04-02  
**Version:** 1.0  
**Author:** Engineering  
**Status:** Active

---

## Purpose

This document defines the complete test plan for verifying multi-tenant isolation across all API routes, data retrieval, action execution, and role enforcement. Every test case listed here corresponds to a behavioral guarantee enforced by the platform.

---

## Definitions

- **Tenant A / Tenant B**: Separate organizations with no shared membership.
- **Org-scoped resource**: Any record carrying an `org_id` FK to `organizations`.
- **Cross-tenant access**: Any attempt by a user in Tenant A to read or modify a resource owned by Tenant B.
- **Elevated role**: `super_admin`, `admin`, `exec`, `ops` — these bypass org-level scoping by design.
- **Non-elevated role**: `analyst`, `viewer`, `operator`, `seller`, `client_viewer`, `creative_user`.

---

## 1. Authentication Barriers

### TC-AUTH-001 — Unauthenticated request is rejected
- **Request**: Any protected API endpoint without a session cookie or Bearer token.
- **Expected**: `401 Authentication required`
- **Verified in**: `authMiddleware({ required: true })`

### TC-AUTH-002 — Expired session is rejected
- **Request**: Request with a session token whose `expires_at < now()`.
- **Expected**: `401 Authentication required`
- **Verified in**: `resolveUserFromToken` query filter on `gt(sessionsTable.expiresAt, new Date())`

### TC-AUTH-003 — Inactive user is rejected
- **Request**: Valid session token for a user with `is_active = false`.
- **Expected**: `401 Authentication required`
- **Verified in**: `resolveUserFromToken` check on `user.isActive`

### TC-AUTH-004 — Invalid Bearer token is rejected
- **Request**: `Authorization: Bearer <random garbage>`
- **Expected**: `401 Authentication required`

### TC-AUTH-005 — SCIM token rejected for non-SCIM endpoints
- **Request**: SCIM bearer token used against `/api/vessels/*` or similar.
- **Expected**: `401 Authentication required` — SCIM tokens are not valid session tokens.

---

## 2. Cross-Tenant Data Retrieval

### TC-ISO-001 — User in Org A cannot read Org B signals
- **Setup**: User belongs only to Org A. Request `GET /api/alloy/signals`.
- **Expected**: Response includes only signals where `org_id = Org A`. Org B signals are absent.
- **Mechanism**: Route handler filters by `req.user.orgs[].orgId`.

### TC-ISO-002 — User in Org A cannot read Org B vessels
- **Setup**: User belongs only to Org A. Request `GET /api/vessels`.
- **Expected**: Only Org A fleet data returned.

### TC-ISO-003 — User in Org A cannot read Org B files
- **Setup**: User belongs only to Org A. Request `GET /api/files`.
- **Expected**: Only files where `org_id = Org A` returned.

### TC-ISO-004 — User in Org A cannot read Org B audit log
- **Setup**: User in Org A with `analyst` role. Request `GET /api/audit`.
- **Expected**: Only Org A audit records returned.

### TC-ISO-005 — Direct ID lookup blocked for cross-tenant records
- **Setup**: User in Org A requests `GET /api/signals/:id` where the signal belongs to Org B.
- **Expected**: `403 Forbidden` or `404 Not Found`. Must not return Org B data.
- **Mechanism**: `canAccessOrgRecord(user, record.orgId)` enforced in route handler.

### TC-ISO-006 — SCIM provisioning scoped to token's tenant
- **Setup**: SCIM token for Tenant A requests `GET /scim/v2/Users`.
- **Expected**: Only users provisioned under Tenant A's Azure tenant ID returned.

---

## 3. Cross-Tenant Action Execution

### TC-ACT-001 — User in Org A cannot approve Org B action
- **Setup**: User in Org A. POST to `/api/alloy/actions/:id/approve` for an action owned by Org B.
- **Expected**: `403 Forbidden`

### TC-ACT-002 — User in Org A cannot execute Org B workflow
- **Setup**: User in Org A. POST to `/api/alloy/workflows/:id/run` for Org B workflow.
- **Expected**: `403 Forbidden`

### TC-ACT-003 — User in Org A cannot modify Org B vessel alert rules
- **Setup**: User in Org A. PUT to `/api/vessels/alert-rules/:id` for Org B rule.
- **Expected**: `403 Forbidden`

### TC-ACT-004 — Cross-tenant write creates no data
- **Setup**: Verify that after any blocked cross-tenant action attempt, no data was written to the DB.
- **Expected**: Zero new rows in any table with the incorrect org_id.

---

## 4. RBAC Role Enforcement

### TC-RBAC-001 — `viewer` cannot perform write operations
- **Setup**: User with only `viewer` role. POST to any write endpoint.
- **Expected**: `403 Read-only access — write operations are not permitted for your role`
- **Mechanism**: `denyIfReadOnly()` middleware

### TC-RBAC-002 — `analyst` cannot access admin routes
- **Setup**: User with `analyst` role. GET `/api/admin/users`.
- **Expected**: `403 Insufficient permissions`
- **Mechanism**: `adminGuard` middleware on `/admin` prefix

### TC-RBAC-003 — `ops` can acknowledge signals, cannot promote users
- **Setup**: User with `ops` role.
- **Expected**: PATCH `/api/signals/:id` succeeds; POST `/api/admin/users/:id/roles` returns `403`.

### TC-RBAC-004 — `exec` can read all within their org, cannot write
- **Setup**: User with `exec` role in Org A.
- **Expected**: GET requests to Org A data succeed; POST/PUT/DELETE returns `403` or `403 Read-only`.

### TC-RBAC-005 — `super_admin` can access all orgs (internal only)
- **Setup**: Internal agent token or `super_admin` user.
- **Expected**: Can read resources from any org without org membership requirement.
- **Note**: Should be used only for platform admin operations; all actions are audit-logged.

### TC-RBAC-006 — Role hierarchy is respected
- **Setup**: User with `exec` role. Check that ROLE_HIERARCHY grants imply `ops`, `analyst`, `viewer`.
- **Expected**: `requireRole('analyst')` passes for `exec` users.

### TC-RBAC-007 — Missing role is enforced at route, not just middleware
- **Setup**: User without `admin` role calls `requireRole('admin')` protected endpoint.
- **Expected**: `403 Insufficient permissions` regardless of org membership.

### TC-RBAC-008 — Impersonation requires `super_admin` or `admin` role
- **Setup**: User with `analyst` role. POST to `/api/admin/impersonate/:userId`.
- **Expected**: `403 Insufficient permissions`

---

## 5. Session Lifecycle

### TC-SESSION-001 — Session expires after TTL (7 days)
- **Setup**: Session created with `expires_at = now() + 7d`.
- **Expected**: Session valid for 7 days; subsequent requests after expiry return `401`.

### TC-SESSION-002 — Session sliding window renewal
- **Setup**: Valid session with > 1 day remaining. Request to `/api/auth/refresh-session`.
- **Expected**: `expires_at` extended. New expiry returned in response.

### TC-SESSION-003 — Logout invalidates session
- **Setup**: Valid session. POST to `/api/auth/logout`.
- **Expected**: Session deleted from `sessions` table. Subsequent requests with same token return `401`.

### TC-SESSION-004 — Admin-forced session termination
- **Setup**: `super_admin` calls `DELETE /api/admin/sessions/:userId`.
- **Expected**: All sessions for target user deleted. Next request from that user returns `401`.
- **Expected**: Audit event written: `action: admin_force_logout`.

---

## 6. Invited-User Onboarding

### TC-INVITE-001 — Invite creates a pending membership
- **Setup**: Org admin POSTs to `/api/orgs/:slug/invite` with an email.
- **Expected**: `org_invitations` record created with status `pending`. Audit event written.

### TC-INVITE-002 — Invite token is single-use
- **Setup**: Valid invite link used once (GET `/api/orgs/accept-invite?token=...`).
- **Expected**: First use: membership created, invitation marked `accepted`. Second use: `410 Gone`.

### TC-INVITE-003 — Expired invite is rejected
- **Setup**: Invite token with `expires_at` in the past.
- **Expected**: `410 Gone` — invitation expired.

### TC-INVITE-004 — Invite scoped to org — cannot accept into different org
- **Setup**: Invite token for Org A. Attempt to call accept-invite from user already in Org B only.
- **Expected**: Accepted invite creates membership only in Org A. Org B unchanged.

### TC-INVITE-005 — Inviter must be org admin or owner
- **Setup**: User with `member` role in org. POST to `/api/orgs/:slug/invite`.
- **Expected**: `403 Insufficient organization role`

---

## 7. Admin Impersonation

### TC-IMPERSONATE-001 — Only admin/super_admin can impersonate
- **Setup**: User with `analyst` role. POST to `/api/admin/impersonate/:userId`.
- **Expected**: `403 Insufficient permissions`

### TC-IMPERSONATE-002 — Impersonation creates audit trail
- **Setup**: `super_admin` impersonates target user.
- **Expected**: Audit event written: `action: impersonation_start`, `entity_type: user`, actor and target both recorded.

### TC-IMPERSONATE-003 — Impersonation session is time-limited
- **Setup**: Impersonation session issued.
- **Expected**: Impersonation session TTL is 1 hour (shorter than regular sessions).

### TC-IMPERSONATE-004 — Impersonation cannot escalate
- **Setup**: `admin` impersonates a `super_admin` target.
- **Expected**: `403` — impersonation cannot grant roles the impersonator does not hold.

### TC-IMPERSONATE-005 — End impersonation restores original session
- **Setup**: `super_admin` in impersonation session. POST to `/api/admin/impersonate/end`.
- **Expected**: Impersonation session invalidated. Original session restored. Audit event written: `action: impersonation_end`.

---

## Test Execution Notes

- All tests should be run against a fresh `local-dev minimal` seed (not demo seed).
- Cross-tenant tests require at least two organizations seeded with distinct users.
- Tests marked with "Audit event written" should verify the `audit_events` table directly.
- Session tests should use short TTL values in test environment (controlled by env var override).

---

## Pass Criteria

All 35 test cases must pass without exception. Any `2xx` response to a blocked access attempt is a P0 regression.
