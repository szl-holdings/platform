# SZL Holdings — Auth Flow Matrix

**Audit date:** 2026-04-21  
**Status labels:** VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · NOT IMPLEMENTED

---

## Auth System Overview

The SZL platform has **three parallel auth mechanisms** in use across 15 artifacts, plus a **dual role system** (a `platformRole` enum on the users table with 12 values, a separate `rolesTable` with 4 values, and a canonical role mapping layer on top). None of these three mechanisms have been runtime-verified in this audit because all workflows are NOT STARTED.

---

## Mechanism Map

| Mechanism | Artifacts Using It | Library | Status |
|-----------|-------------------|---------|--------|
| `@szl-holdings/replit-auth-web` shared hook | `carlota-jo`, `prism-counsel` | `lib/replit-auth-web` | PARTIALLY VERIFIED (library exists; runtime not confirmed) |
| `installAuthClearedRedirect("/api/login")` redirect helper | `szl-holdings` | Unknown helper in `main.tsx` | PARTIALLY VERIFIED (call present in source) |
| Local `useAuth()` with `DEMO_USER` fallback | `pulse` | Custom in `App.tsx` | PARTIALLY VERIFIED (code present; DEMO_USER path is a security concern) |
| Replit OIDC (shared pattern) | `aegis`, `vessels`, `terra`, `command`, `lyte-command-center`, `sentra`, `counsel` | `lib/auth` backend | PARTIALLY VERIFIED (config present; OIDC flow not smoke-tested) |
| No auth (public demo) | `szl-demo-video`, `mockup-sandbox` | None | VERIFIED (by design) |

---

## Sign-In Flows

| Flow | Path | Status | Notes |
|------|------|--------|-------|
| Replit OIDC sign-in | `GET /api/login` → Replit OIDC → callback → session cookie | PARTIALLY VERIFIED | Route exists in API server; OIDC callback handler exists; live redirect not tested |
| Password-based sign-in | `POST /api/auth/login` → PBKDF2 hash check → session | PARTIALLY VERIFIED | Route present; password hashing confirmed as PBKDF2-SHA512 100k iterations; rate limiter ABSENT (F-01) |
| Bootstrap admin sign-in | `scripts/seed-bootstrap-admin.ts` → upserts user with `super_admin` role | VERIFIED | Phase A created and documented this; script tested |
| ALLOY_INTERNAL_TOKEN service auth | Header token → grants `super_admin` equivalent | PARTIALLY VERIFIED | Token referenced 22× in codebase; grant logic in middleware; not smoke-tested |
| Mobile auth | Expo app → API token | UNVERIFIED | Mobile token storage mechanism not confirmed (F-07) |
| Demo/guest mode | `DEMO_USER` fallback in Pulse `useAuth()` | PARTIALLY VERIFIED | Code present; behavior on OIDC failure is a fallback, not a separate flow |

---

## Sign-Out Flows

| Flow | Path | Status | Notes |
|------|------|--------|-------|
| Session destroy | `GET /api/logout` → destroy session → redirect | PARTIALLY VERIFIED | Pattern expected; not runtime-confirmed |
| Session expiry | Cookie TTL → auto-expire | PARTIALLY VERIFIED | TTL configured in session middleware; not smoke-tested |
| Token revocation (mobile) | Not confirmed | UNVERIFIED | No evidence of mobile token revocation endpoint |

---

## Session Management

| Attribute | Claimed | Status | Notes |
|-----------|---------|--------|-------|
| Session store | In-memory (dev); Redis (enterprise) | PARTIALLY VERIFIED | Redis "not yet activated"; in-memory in all environments |
| Cookie flags: `secure` | Expected in production | UNVERIFIED | F-03 from Phase A — not confirmed |
| Cookie flags: `httpOnly` | Expected | UNVERIFIED | F-03 from Phase A |
| Cookie flags: `sameSite` | Expected: `lax` or `strict` | UNVERIFIED | F-03 from Phase A |
| Session version (for invalidation) | `sessionVersion` column on users table | VERIFIED | Column exists in `lib/db/src/schema/auth.ts` |

---

## Role / Permission Flows

### Dual Role System (BROKEN — needs consolidation)

The platform has two parallel role systems that must be consolidated:

**System 1: `platformRole` enum on `usersTable`**
```
anonymous_visitor · founder_admin · platform_admin · operator · analyst
executive_viewer · ops_manager · sales_delivery_user · maritime_ops_user
real_estate_ops_user · service_coordinator · pilot_customer_user
```
Total: **12 values**

**System 2: `rolesTable` with separate `userRolesTable` join**
```
super_admin · admin · editor · member
```
Total: **4 values**

**System 3: Canonical role mapping layer** (`lib/auth/src/roles.ts`)
Maps legacy role names to canonical payload roles (`toCanonicalRole()` function). This is a third naming layer on top of the above two.

**What `PLATFORM_CANONICAL.md` says:** `super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer` — **7 names that match neither System 1 nor System 2.**

**Resolution required:** Consolidate to one authoritative role list. Recommend: use `platformRole` enum (12 values) as authoritative, deprecate `rolesTable`, update `PLATFORM_CANONICAL.md` to match actual enum values.

---

| Role flow | Status | Notes |
|-----------|--------|-------|
| Assigning role on user creation (OIDC) | PARTIALLY VERIFIED | Default role assignment in OIDC callback handler — value not confirmed |
| Checking role in route middleware | PARTIALLY VERIFIED | Middleware exists; org_id validation coverage incomplete (F-05) |
| `super_admin` escalation via `ALLOY_INTERNAL_TOKEN` | PARTIALLY VERIFIED | Token grant logic present; not smoke-tested |
| Role-based UI gating (frontend) | PARTIALLY VERIFIED | RBAC checks in component code exist; not runtime-confirmed |
| Tenant / org isolation | PARTIALLY VERIFIED | `org_id` columns present in schema; enforcement coverage F-05 |

---

## Password / Credential Flows

| Flow | Status | Notes |
|------|--------|-------|
| Password hashing (PBKDF2-SHA512, 100k iterations) | VERIFIED | Algorithm confirmed in login route and seed script |
| Password reset token generation | PARTIALLY VERIFIED | Token column exists in schema; single-use not confirmed (F-06) |
| MFA/TOTP secret storage | BROKEN | `MFA_SECRET_ENCRYPTION_KEY` unset — TOTP secrets stored unencrypted (F-02) |
| Email verification token | PARTIALLY VERIFIED | Token column in schema; delivery UNVERIFIED |

---

## Protected Route Coverage

| Artifact | Protected routes have auth middleware? | Status |
|----------|---------------------------------------|--------|
| `api-server` | `audit:route-security:strict` CI gate added (Task #1902) | PARTIALLY VERIFIED — gate wired but runtime not confirmed |
| `szl-holdings` | Auth redirect in `main.tsx` | PARTIALLY VERIFIED |
| `carlota-jo` | Shared auth hook | PARTIALLY VERIFIED |
| `pulse` | Local `useAuth()` with demo fallback | PARTIALLY VERIFIED — DEMO_USER fallback is a security concern |
| `counsel` | Auth present (14-file skeleton) | UNVERIFIED |
| `sentra` | Replit OIDC | UNVERIFIED |
| All others | Replit OIDC pattern | UNVERIFIED |

---

## Auth Flow Matrix Summary

| Flow | VERIFIED | PARTIALLY VERIFIED | UNVERIFIED | BROKEN |
|------|----------|--------------------|-----------|--------|
| Sign-in | 1 | 5 | 1 | 0 |
| Sign-out | 0 | 1 | 2 | 0 |
| Session management | 1 | 2 | 3 | 0 |
| Roles / RBAC | 1 | 4 | 1 | 1 |
| Password / credential | 1 | 3 | 1 | 1 |
| Protected routes | 0 | 3 | 5 | 0 |

---

## Required Auth Remediations (Ordered)

1. Start all workflows and smoke-test every auth flow (blocks everything else)
2. Set `MFA_SECRET_ENCRYPTION_KEY` in Replit Secrets immediately (F-02) — BROKEN
3. Add rate limiting to `/api/auth/login` (F-01) — HIGH
4. Confirm cookie `secure`/`httpOnly`/`sameSite` flags (F-03) — MEDIUM
5. Consolidate dual role system — pick one authoritative enum and deprecate the other (G-A04)
6. Adopt `@szl-holdings/replit-auth-web` as the single auth hook across all artifacts (G-A05, G-A10)
7. Confirm and test org_id isolation per route (F-05) — MEDIUM
8. Confirm password reset token single-use (F-06) — MEDIUM
9. Confirm mobile token storage uses platform secure storage (F-07) — MEDIUM
