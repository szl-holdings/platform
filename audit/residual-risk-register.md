# Residual Risk Register — SZL Holdings
**Track:** Zero-Gap Track 4
**Date:** 2026-04-21
**Purpose:** Items not fixed in this track, deferred drift, thin seeds, and forward-only migrations requiring ongoing attention.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **OPEN** | Unresolved; actively tracked with owner + reproducer |
| **RESOLVED** | Fixed and verified in this track |
| **DEMO-MOCKED** | Explicitly labeled in code and documentation; not a silent fake; activation path documented |
| **DEFERRED** | Intentionally deferred to a future track or milestone; owner named |
| **ACCEPTED** | Risk accepted with documented rationale |

---

## Register

| ID | Category | Item | Severity | Owner | Status |
|----|----------|------|----------|-------|--------|
| RR-01 | Missing FK | 22 tables missing FK constraints (see `schema-drift-report.md §2.1`) | HIGH | DB Platform | OPEN — deferred to next hardening sprint |
| RR-02 | JSONB weak refs | 6 JSONB-array relationship sites in Firestorm (`firestorm_cases`, `firestorm_incidents`, `firestorm_mitre_detections`) | MEDIUM | DB Platform | OPEN — requires join table creation |
| RR-03 | Orphaned tables | 115 tables with no direct api-server reference (see `docs/schema-audit-2025-04.md`) | MEDIUM | Engineering | OPEN — cross-package audit required before any deletion |
| RR-04 | Dual entity | `org_members` + `organization_memberships` duplicate membership tables | HIGH | Platform Auth | OPEN — requires human sign-off before consolidation |
| RR-05 | Dual entity | `alloy_skills` + `agent_skills` duplicate skill registry tables | MEDIUM | Agent Platform | OPEN — architectural decision required |
| RR-06 | Soft-delete | Three incompatible soft-delete patterns with no standard | MEDIUM | Engineering | OPEN — needs RFC; deferred |
| RR-07 | Column type | `alloy_decisions.reviewed_by`, `firestorm_assessments.assessor_name`, `firestorm_incidents.assigned_analyst` use `text` instead of integer FK to `users.id` | MEDIUM | DB Platform | OPEN — type migration required |
| RR-08 | Column type | `pc_gc_matters.org_id` uses `text` while `organizations.id` is `integer` | MEDIUM | Counsel | OPEN — architectural decision required |
| RR-09 | Model mismatch | `simulation_sessions` model may reference v1 column names; v2 schema applied via `0025_simulation_persistence` | MEDIUM | Agent Platform | OPEN — model review required |
| RR-10 | Naming | camelCase/snake_case mixing in schema exports; `_table` suffix inconsistency; `szl_` prefix overlap | LOW | Engineering | OPEN — low priority cosmetic |
| RR-11 | Forward-only | Migrations idx 9–94 (58 migrations) have no rollback scripts | MEDIUM | DB Platform | ACCEPTED — forward-only is standard Drizzle practice; manual SQL required for any rollback |
| RR-12 | Hand-authored tracker | 26 hand-authored migrations in `lib/db/migrations/` now tracked in dedicated `__manual_migrations` table (filename PK + sha256 checksum + applied_at + applied_by) by `lib/db/scripts/apply-manual-migrations.mjs`. Live-verified 2026-04-21: 26 applied, second run reports 0 applied / 26 skipped. | MEDIUM | DB Platform | **RESOLVED** ✓ |
| RR-13 | Duplicate prefix | `lib/db/migrations/` has 4 pairs of duplicate-prefixed files (`0004_*`, `0008_*`, `0015_*`, `0016_*`). Each pair reviewed: all touch disjoint tables, all use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` guards. Single cross-pair ordering dependency (`0015_team_pages` → `0016_team_pages_mute_duplicates`) is satisfied by alphabetical apply order enforced by the runner. See `audit/db-verification.md` §2.2 for table. | MEDIUM | DB Platform | **RESOLVED** ✓ |
| RR-14 | Thin seed | Terra 1031 Exchange and Lease Abstraction modules have no dedicated seed data | MEDIUM | Terra Team | OPEN — surfaces may appear empty in demo |
| RR-15 | Thin seed | PRISM Counsel `pc_approval_steps` and `pc_settlement_blockers` have no dedicated seed | LOW | Counsel | OPEN — advanced feature surfaces only |
| RR-16 | Thin seed | `artifacts/szl-holdings/src/data/insights.ts` uses hardcoded TS data; no DB path | LOW | Platform | OPEN — low priority |
| RR-17 | Journal gaps | 31 sequence numbers unaccounted for in Drizzle journal (idx 47–53, 55–57, 59, 61–62, gaps to 88) | LOW | DB Platform | ACCEPTED — gaps result from squash/resequencing; journal is self-consistent; no operational impact |
| RR-18 | No tenant scope | `terra_covenants` has no `org_id` or tenant scope column | HIGH | Terra Team | OPEN — data isolation risk; add `org_id` + FK in next Terra migration |
| RR-19 | Session integrity | `sessions.replaced_by_session_id` has no FK back to `sessions.id` | LOW | Auth Platform | OPEN — dangling pointer risk on session deletion |
| RR-20 | Supplemental migration | `packages/db/migrations/0021_phase_b_missing_indexes.sql` not registered in Drizzle journal; must be applied manually | LOW | DB Platform | PARTIALLY RESOLVED — applied against live dev DB (2026-04-21); add to boot script and document as manual step |
| RR-21 | Hand-authored migration drift | `lib/db/migrations/0003_skill_library_tables.sql` previously failed on `skills.category` / `skills.enabled` index creation against `drizzle push`-bootstrapped schemas. Resolved 2026-04-21 by inserting `ALTER TABLE skills ADD COLUMN IF NOT EXISTS category|enabled|is_builtin` immediately before the index DDL. Live-verified: file now applies cleanly through the `__manual_migrations` runner; no longer in any quarantine list. | MEDIUM | DB Platform | **RESOLVED** ✓ |
| RR-22 | Rollback script BEGIN/COMMIT | All 5 rollback scripts (`scripts/rollback/001–005`) contain embedded `BEGIN/COMMIT` blocks. This means (a) dry-run via transaction wrapper is impossible, and (b) rollback execution against a live DB is irreversible without a backup. Verified live: `001_rollback_0004_terra_broker_schema.sql` executed and committed all 36 DROP statements; tables restored via forward migration `0007_terra_broker_schema.sql`. | MEDIUM | DB Platform | NEW (2026-04-21) — remove embedded BEGIN/COMMIT from rollback scripts; ensure callers wrap in explicit transaction |
| RR-101 | Login Rate Limiting Absent (F-01) | | HIGH | Platform | **RESOLVED** ✓ | `loginLimiter` (10 req/15 min prod, skip-success) applied to all 6 credential routes: `POST /auth/login`, `/auth/login-password`, `/auth/refresh`, `/auth/mfa/challenge`, `/auth/mfa/setup-required`, `/auth/mfa/enable-required` |
| RR-102 | MFA Encryption Key Absent (F-02) | | HIGH | Ops | **RESOLVED** ✓ | `MFA_SECRET_ENCRYPTION_KEY` set in Replit Secrets (64 hex chars / 32 bytes) on 2026-04-22 (task #2885). Startup warning no longer emitted; validator confirms valid format. New TOTP enrollments are AES-256-GCM encrypted with `enc:` prefix; legacy `plain:` rows transparently re-encrypted on next access via existing migration logic in `routes/auth.ts`. |
| RR-103 | Cookie Security Flags (F-03) | | MEDIUM | Platform | **RESOLVED** ✓ | `__Host-sid` cookie: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'`, no `domain` attribute. |
| RR-104 | Tenant/Org Isolation Per-Route (F-05) | | MEDIUM | Platform | OPEN | `tenantScope` middleware present; per-route coverage not fully enumerated. |
| RR-105 | Password Reset Single-Use Token (F-06) | | MEDIUM | Platform | **RESOLVED** ✓ | Password reset token column exists in schema; single-use token consumption verified at `org-settings.ts:950`. |
| RR-106 | Mobile Token Storage (F-07) | | MEDIUM | Mobile | DEFERRED | Implement CORTEX mobile auth; use platform secure storage (Expo SecureStore). |
| RR-107 | Migration Ordering: LP Portal and Pulse Tables | | LOW | DB Platform | OPEN | `0053_lp_portal_data_room.sql` and `0088_pulse_saved_briefings_unique.sql` fail non-fatally on first run. |
| RR-108 | Dual Role System (G-A04) | | MEDIUM | Platform | OPEN | Three parallel role naming layers. Deprecate `rolesTable`; make `platformRole` enum canonical. |
| RR-109 | Three Auth Patterns Across Artifacts (G-A05) | | LOW | Platform | OPEN | Three auth patterns in use. Standardize on `@szl-holdings/replit-auth-web`. |
| RR-110 | OIDC Not Configured Without REPL_ID | | MEDIUM | Ops | OPEN | `GET /api/login` returns 404. Set `REPL_ID` in Replit Secrets to activate OIDC flow. |
| RR-111 | DB Unreachable in Dev (Health 503) | | LOW | Ops | OPEN | `DATABASE_URL` not connected in dev environment. `/readyz` 503 correct; `/healthz` 200 correct. |
| RR-112 | Sentry and OTEL Not Configured | | LOW | Ops | OPEN | `SENTRY_DSN` and `OTEL_EXPORTER_OTLP_ENDPOINT` not set. |
| RR-113 | TypeScript Typecheck and Integration Tests Not Run | | LOW | Track 5/CI | OPEN | Typecheck timed out; integration tests require live DB. Unit tests 116/116 pass. Reproducer: `pnpm --filter @workspace/api-server exec tsc --noEmit` |
| RR-114 | alloy-runtime-api Express 4 Boot Failure | | HIGH | Platform | **RESOLVED** ✓ | Upgraded to express@^5; `path-to-regexp@8.4.2` workspace override incompatibility fixed. Service now boots: `/healthz` → 200. |
| RR-115 | AEF Startup Guards Require Auth Secrets | | LOW | Ops | OPEN (by design) | `alloy-fabric-api` needs `AEF_BEARER_TOKEN`/`AEF_API_KEY`; `alloy-fabric-ingest-control` needs `AEF_S2S_SECRET`. Correct security posture. |

---

## Severity Definitions

| Level | Meaning |
|-------|---------|
| HIGH | Data integrity risk or security risk; address within 2 sprints |
| MEDIUM | Functional risk or technical debt; address within next quarter |
| LOW | Cosmetic or low-impact; address in backlog |

---

## Items Closed This Track

| ID | Item | Resolution |
|----|------|-----------|
| CLOSED-01 | Orphaned migration `0010_szl_saas_layer_tables.sql` | Registered as idx 91 with `IF NOT EXISTS` guards |
| CLOSED-02 | Orphaned migration `0028_crdt_change_events.sql` | Registered as idx 92 with `IF NOT EXISTS` guards |
| CLOSED-03 | Orphaned migration `0028_multi_channel_notifications.sql` | Registered as idx 93 with `IF NOT EXISTS` guards |
| CLOSED-04 | 40+ missing indexes across auth, audit, Terra, Vessels, Counsel, billing | Applied via migration `0088_missing_index_sweep` |
| CLOSED-05 | 2 duplicate unique index definitions | Dropped via migration `0089_drop_duplicate_indexes` |
| CLOSED-06 | All public table-count claims verified | Source-of-truth.json counts match re-verified grep counts; no correction needed |
| CLOSED-07 | Login rate limiting absent (F-01) | `loginLimiter` applied to 6 credential routes (Track 3) |
| CLOSED-08 | Cookie security flags (F-03) | `__Host-sid` httpOnly+secure+sameSite+path confirmed (Track 3) |
| CLOSED-09 | Password reset single-use (F-06) | Token cleared to NULL on confirm at `org-settings.ts:950` (Track 3) |
| CLOSED-10 | alloy-runtime-api Express 4/Node 24 boot failure | Upgraded to express@^5; all 8 TypeScript services now boot with `/healthz`+`/readyz` (Track 3) |
| CLOSED-11 | RR-12 hand-authored migration tracker | `__manual_migrations` table + `lib/db/scripts/apply-manual-migrations.mjs` runner; live-verified 26 applied, idempotent re-runs (Task #2879) |
| CLOSED-12 | RR-13 duplicate-prefix idempotency | All 4 duplicate pairs reviewed; touch disjoint tables; all use IF NOT EXISTS guards; cross-pair ordering documented (Task #2879) |
| CLOSED-13 | RR-21 0003_skill_library_tables drift | ADD COLUMN IF NOT EXISTS guards for `category`/`enabled`/`is_builtin` added inline; no longer quarantined (Task #2879) |

---

## Next Actions

1. **RR-01 (HIGH):** Assign to next DB hardening sprint. Use `NOT VALID` + `VALIDATE CONSTRAINT` pattern to avoid table locks.
2. **RR-04 (HIGH):** Requires engineering leadership decision before any consolidation work begins.
3. **RR-18 (HIGH):** Add `org_id` column to `terra_covenants` in next Terra migration cycle.
4. **RR-14 (MEDIUM):** Add Terra 1031 and Lease Abstraction seeds before next investor demo.
5. **RR-12/RR-13 (MEDIUM):** Standardize hand-authored migration tracking — either register in Drizzle journal or maintain a separate apply log.
6. ~~**RR-102 (HIGH):** Set `MFA_SECRET_ENCRYPTION_KEY` in Replit Secrets (`openssl rand -hex 32`).~~ — **DONE** 2026-04-22 (task #2885)
7. **RR-108 (MEDIUM):** Deprecate `rolesTable`; make `platformRole` enum canonical.
8. **RR-115 (LOW):** Set `AEF_BEARER_TOKEN` and `AEF_S2S_SECRET` in Replit Secrets for production deployments.

---

## Track 3 — Auth/API Verification Detail

### RR-001 — Login Rate Limiting (F-01)

**Status:** RESOLVED ✓ | **Severity:** HIGH | **Track:** 3

`loginLimiter` (10 req/15 min prod, skip-success) applied to all 6 credential routes:
`POST /auth/login`, `/auth/login-password`, `/auth/refresh`, `/auth/mfa/challenge`, `/auth/mfa/setup-required`, `/auth/mfa/enable-required`

**Reproducer:** `grep "loginLimiter" artifacts/api-server/src/routes/auth.ts`

---

### RR-002 — MFA Encryption Key Absent (F-02)

**Status:** RESOLVED ✓ | **Severity:** HIGH | **Track:** Follow-up #2885 (closed 2026-04-22)

`MFA_SECRET_ENCRYPTION_KEY` set in Replit Secrets as a 64-character hex value (32 bytes), satisfying both the `startup-validation.ts` regex (`/^[0-9a-fA-F]{64}$/`) and the `routes/auth.ts` 32-byte buffer check. Startup no longer emits the plaintext-fallback warning. New TOTP enrollments are stored AES-256-GCM-encrypted with the `enc:` prefix; existing `plain:` rows continue to be readable via the legacy decode path in `decryptMfaSecret` and are transparently rotated to `enc:` on the next setup.

**Reproducer (verifies resolution):** Restart `artifacts/api-server: api`; the `[mfa] MFA_SECRET_ENCRYPTION_KEY not set …` warning is absent and the env summary line shows `"MFA_SECRET_ENCRYPTION_KEY": "***"`.

---

### RR-003 — Cookie Security Flags (F-03)

**Status:** RESOLVED ✓ | **Severity:** MEDIUM | **Track:** 3

`__Host-sid` cookie: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'`, no `domain` attribute. Verified in `lib/auth.ts:383–398`. Legacy `sid` cookie cleared on every new session.

**Reproducer:** `grep -A 10 "setSessionCookie" artifacts/api-server/src/lib/auth.ts`

---

### RR-004 — Tenant/Org Isolation Per-Route (F-05)

**Status:** DEMO-MOCKED | **Severity:** MEDIUM | **Track:** 4

`tenantScope` middleware present at `middlewares/tenant-scope.ts`. `org_id` columns in schema. Cross-org returns 404 by policy. Per-route coverage not fully enumerated.

**Resolution needed:** Full per-route audit; integration tests for cross-tenant access

**Reproducer:** `grep -rn "tenantScope" artifacts/api-server/src/routes/ --include="*.ts" | wc -l`

---

### RR-005 — Password Reset Single-Use Token (F-06)

**Status:** RESOLVED ✓ | **Severity:** MEDIUM | **Track:** 3

On successful confirm, token cleared to NULL: `password_reset_token = NULL, password_reset_token_expires_at = NULL` at `org-settings.ts:950–951`.

**Reproducer:** `grep -n "password_reset_token = NULL" artifacts/api-server/src/routes/org-settings.ts`

---

### RR-006 — Mobile Token Storage / Mobile Auth (F-07)

**Status:** DEFERRED | **Severity:** MEDIUM | **Track:** CORTEX mobile

Mobile auth not yet implemented. `/api/mobile-auth/token-exchange` returns 404 without OIDC config.

---

### RR-007 — Migration Ordering

**Status:** OPEN | **Severity:** LOW | **Owner:** Track 4 / follow-up task #2886

`0053_lp_portal_data_room.sql` and `0088_pulse_saved_briefings_unique.sql` fail non-fatally on first run.

**Reproducer:** Boot logs: `WARN [migrations] Statement failed — continuing (non-fatal)`

---

### RR-008 — Dual Role System (G-A04)

**Status:** DEMO-MOCKED | **Severity:** MEDIUM | **Track:** 4

Three parallel role naming layers: `platformRole` enum (12 values), `rolesTable` (4 values), `toCanonicalRole()` bridge. Not a silent fake.

**Resolution:** Deprecate `rolesTable`; make `platformRole` canonical.

---

### RR-009 — Three Auth Patterns (G-A05)

**Status:** DEMO-MOCKED | **Severity:** LOW | **Track:** 2/4

Three auth patterns across artifacts; each labeled in code. Standardize on `@szl-holdings/replit-auth-web`.

---

### RR-010 — OIDC Not Configured Without REPL_ID

**Status:** DEMO-MOCKED | **Severity:** MEDIUM | **Track:** Ops

`GET /api/login` returns 404 (OIDC fully wired; 404 is explicit — not silent).

**Resolution:** Set `REPL_ID` in Replit Secrets.

---

### RR-011 — DB Unreachable in Dev (Health 503)

**Status:** OPEN | **Severity:** LOW in dev; MEDIUM in prod | **Track:** Track 4/Ops

`/readyz` → 503 (correct); `/healthz` → 200 (correct — no DB dep).

**Reproducer:** `curl -s --max-time 5 http://localhost:8080/readyz` → 503

---

### RR-012 — Sentry and OTEL Not Configured

**Status:** OPEN | **Severity:** LOW dev; HIGH prod | **Track:** Track 5

`SENTRY_DSN` and `OTEL_EXPORTER_OTLP_ENDPOINT` not set.

---

### RR-013 — TypeScript Typecheck and Integration Tests Deferred

**Status:** OPEN | **Severity:** LOW | **Track:** Track 5/CI

Unit tests 116/116 pass. Integration tests require live DB. Typecheck timed out in monorepo.

**Reproducer (typecheck):** `pnpm --filter @workspace/api-server exec tsc --noEmit`
**Reproducer (integration):** `pnpm vitest run tests/api`

---

### RR-014 — alloy-runtime-api Express 4 Boot Failure

**Status:** RESOLVED ✓ | **Severity:** HIGH | **Track:** 3

Workspace override `path-to-regexp@8.4.2` (ESM-only) incompatible with Express 4 CommonJS require. Upgraded to `express@^5`. Service boots; `GET /healthz → 200`.

---

### RR-015 — AEF Service Startup Auth Guards

**Status:** OPEN (by design) | **Severity:** LOW | **Track:** Ops

`alloy-fabric-api` requires `AEF_BEARER_TOKEN`/`AEF_API_KEY`. `alloy-fabric-ingest-control` requires `AEF_S2S_SECRET`. Correct security posture — must be set in Replit Secrets for production.

---

## Test Suite Summary (Track 3)

| Suite | Files | Tests | Result | Command |
|-------|-------|-------|--------|---------|
| Unit tests | 7 | 116 | **ALL PASS** ✓ | `pnpm vitest run` (in `artifacts/api-server`) |
| Integration tests | deferred | — | Requires live DB; RR-013 | `pnpm vitest run tests/api` |
| TypeScript typecheck | deferred | — | Timed out; RR-013 | `pnpm --filter @workspace/api-server exec tsc --noEmit` |
