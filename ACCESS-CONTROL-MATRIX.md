# Access Control Matrix — SZL Platform

Canonical reference for platform identity, role hierarchy, and access-control boundaries.
Validated by `scripts/docs/check-docs-claims.js` (checks 1, 2, 7).

---

## Identity Model

Authentication is handled by `artifacts/api-server/src/middlewares/auth.ts`.
Sessions are stored in the `sessions` table (`lib/db/src/schema/auth.ts`) with per-row expiry, revocation tracking, and a session-version counter that forces re-authentication when a user's roles or org membership change.

User records live in the `users` table. Each user has a single `platform_role` column (see below) and zero or more rows in the `user_roles` join table that map to the legacy `roles` table.

---

## Platform Role Hierarchy

### Platform Roles

The `platform_role` enum on the `users` table defines the canonical privilege level for every authenticated (and anonymous) principal. Hierarchy values are defined in `PLATFORM_ROLE_HIERARCHY` in `lib/db/src/schema/auth.ts`.

| Role | Hierarchy | Description |
|------|-----------|-------------|
| `anonymous_visitor` | 0 | Unauthenticated or lowest-privilege visitor |
| `pilot_customer_user` | 1 | External pilot customer with limited read access |
| `executive_viewer` | 2 | Read-only executive dashboard access |
| `analyst` | 3 | Analytical and reporting access |
| `service_coordinator` | 4 | Service coordination across domains |
| `sales_delivery_user` | 4 | Sales and delivery operations |
| `maritime_ops_user` | 4 | Maritime domain operations (Vessels) |
| `real_estate_ops_user` | 4 | Real estate domain operations (Terra) |
| `operator` | 5 | General platform operations |
| `ops_manager` | 6 | Operations management and oversight |
| `platform_admin` | 8 | Platform administration |
| `founder_admin` | 10 | Full platform access — highest privilege |

Read-only roles: `executive_viewer`, `pilot_customer_user`.
Write roles: `operator`, `ops_manager`, `service_coordinator`, `sales_delivery_user`, `maritime_ops_user`, `platform_admin`, `founder_admin`.
Admin roles: `platform_admin`, `founder_admin`.

---

## Extended Roles Table

The `roles` table (`lib/db/src/schema/auth.ts`) stores the legacy role-based access control (RBAC) names used by `requireRole()` in `artifacts/api-server/src/middlewares/auth.ts`. Each user can hold multiple roles via the `user_roles` join table.

Roles include: `super_admin`, `admin`, `editor`, `member`, `client`, `authenticated`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`, `operator`, `seller`, `client_viewer`, `creative_user`.

Legacy roles are mapped to canonical platform roles via `LEGACY_TO_CANONICAL` and `CANONICAL_TO_LEGACY` in `lib/db/src/schema/auth.ts`. The `toCanonicalRole()` function resolves a user's highest-priority canonical role from their legacy role set.

### Role Hierarchy

Role hierarchy is defined in `ROLE_HIERARCHY` — each role key maps to an array of roles it implicitly includes. `requireRole()` expands a user's assigned roles through this hierarchy before checking authorization.

| Legacy Role | Canonical Mapping | Implied Roles |
|-------------|-------------------|---------------|
| `super_admin` | `founder_admin` | All roles |
| `admin` | `platform_admin` | All except `super_admin` |
| `exec` | `executive_viewer` | `ops`, `compliance`, `maintenance`, `analyst`, `viewer`, `operator` |
| `ops` | `ops_manager` | `viewer`, `operator` |
| `editor` | `platform_admin` | `member`, `authenticated`, `viewer`, `creative_user` |
| `member` | `operator` | `authenticated`, `viewer` |
| `client` | `pilot_customer_user` | `authenticated`, `client_viewer` |
| `seller` | `sales_delivery_user` | `viewer` |
| `compliance` | `analyst` | `viewer` |
| `maintenance` | `ops_manager` | `viewer` |
| `analyst` | `analyst` | `viewer` |
| `viewer` | `anonymous_visitor` | — |
| `operator` | `operator` | `viewer` |
| `client_viewer` | `executive_viewer` | — |
| `creative_user` | `service_coordinator` | `viewer` |
| `authenticated` | `operator` | — |

---

## Admin Access

Admin routes (`/api/admin/*`) are protected by `artifacts/api-server/src/middlewares/admin-guard.ts`, which requires one of: `super_admin`, `ops`, or `exec` roles — or a scoped internal service token with `internal:write` scope.

---

## Session Management

Session lifecycle is managed through the `sessions` table with the following controls:

- **Expiry:** Each session row has an `expires_at` timestamp; expired sessions are rejected at query time.
- **Revocation:** Sessions can be revoked individually (`revoked_at` + `revoked_reason`).
- **Version check:** `session_version` on both `users` and `sessions` must match; a mismatch forces re-authentication (triggered by role or org-membership changes).
- **Refresh tokens:** Opaque refresh tokens with independent expiry and one-time-use tracking (`refresh_token_used_at`, `replaced_by_session_id`).
