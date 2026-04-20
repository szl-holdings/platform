# RBAC — Authoritative Source per Surface

Resolves **FINDING F-04** from `audit/security/auth-review.md` (Phase A).

The codebase has two parallel role storage mechanisms. They serve
different purposes and must not be conflated. This document is the
authoritative reference for which mechanism owns the access decision on
each surface.

## The two mechanisms

| Mechanism | Storage | Type | Used by |
|---|---|---|---|
| **Application RBAC** | `user_roles` join table → `roles` table | Many-to-many `RoleName` set (`super_admin`, `admin`, `ops`, `analyst`, `viewer`, etc.) | All HTTP route protection via `requireRole(...)` and `authMiddleware()`; org-scoped checks via `orgMembersTable.role` |
| **Platform Role** | `users.platform_role` enum column | Single canonical role per user (subset of `RoleName`) | WebSocket ticket issuance (`/auth/ws-ticket`), the `platform-auth.ts` middleware (used by `/teams`, `/scim`, `/gdpr`, `/monte-carlo`, `/command`, `/demo-reset`), and as a deterministic fallback when `user_roles` is empty |

## Authoritative source per surface

### HTTP API (all routes mounted in `src/app.ts` via `authMiddleware()`)

- **Authoritative:** `user_roles` join table.
- `authMiddleware()` (`src/middlewares/auth.ts`) reads `user_roles` →
  `roles.name` and exposes the resulting `RoleName[]` as
  `req.user!.roles`. Every `requireRole(...)` decision in the API
  derives from this set.
- `users.platform_role` is **not consulted** for HTTP route
  authorization on these surfaces.

### Surfaces using `platform-auth.ts` middleware

- **Authoritative:** `users.platform_role`.
- `platform-auth.ts` is a separate, narrower middleware used by
  domains modeled around the canonical platform role enum (`teams`,
  `scim`, `gdpr`, `monte-carlo`, `command`, `demo-reset`,
  scheduled-jobs, websocket alerting). For these the
  `users.platform_role` column is the single source of truth and
  `user_roles` is not consulted.

### WebSocket ticket (`POST /auth/ws-ticket`)

- **Authoritative:** `users.platform_role`, with a deterministic
  fallback to `toCanonicalRole(userRoles)` when the column is null
  (e.g. legacy users created before the column was populated). See
  `routes/auth.ts` lines 511–522.

### Org-scoped permissions (org membership / org admin)

- **Authoritative:** `org_members.role` (per-org membership role).
- Neither `user_roles` nor `users.platform_role` controls per-org
  access; `requireOrgMembership(...)` and `canAccessOrgRecord(...)`
  read the org membership table.
- Platform-wide elevated roles (`super_admin`, `admin`) bypass org
  membership checks — see `requireOrgMembership` and
  `canAccessOrgRecord` in `src/middlewares/auth.ts`.

## Consistency invariants

1. `users.platform_role` should always be a subset of `user_roles` for
   the same user, and is kept in sync at write time by:
   - `replaceUserRoles()` and `setUserRoles()` in
     `lib/db/src/auth/role-management.ts` (both update
     `users.platform_role` to `toCanonicalRole(newRoles)` in the same
     transaction).
   - The Azure AD provisioning path
     (`upsertUserFromAzureAd` in `src/lib/auth.ts`).
2. Hierarchy (`ROLE_HIERARCHY` in `lib/db`) governs role implication
   for `requireRole(...)` only — it is not applied on the platform_role
   side, where a single role is the gating decision.
3. The internal-agent path (`x-internal-token`) always synthesizes
   `roles: ["ops"]` (GAP-016) and never has a `platform_role` — those
   surfaces gate on declared scopes via `requireInternalScope(...)`,
   not on either role mechanism.

## Why both exist

`user_roles` predates `users.platform_role`. The platform role was
introduced for surfaces that needed a single canonical role for
ticket-issuance, scheduled-job authorization, and the WS gateway,
where evaluating a multi-role hierarchy on every event would be hot.
Consolidation onto a single mechanism is tracked separately as a
future cleanup item; the invariants above ensure they cannot diverge
in practice today.
