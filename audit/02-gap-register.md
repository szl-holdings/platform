# SZL Holdings — Gap Register

**Audit date:** 2026-04-21  
**Scope:** All gaps between claimed state and verified state, plus structural gaps with no covering task.

**Truth labels** (per audit standard): VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · OUT OF SCOPE  
**Gap tracking labels** (operational workflow — distinct from truth labels):  
- **OPEN** — no task covers this gap  
- **COVERED** — an existing backlog task addresses this gap  
- **DEFERRED** — intentionally deferred (documented rationale)  

Each gap has:  
- **ID** — unique reference  
- **Severity** — CRITICAL / HIGH / MEDIUM / LOW  
- **Type** — RUNTIME / AUTH / DATA / DOCS / INFRA / CODE  
- **Status** — OPEN / COVERED / DEFERRED (see gap tracking labels above)

---

## Runtime Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-R01 | CRITICAL | All 18 workflows NOT STARTED — zero traffic possible | OPEN | Must start api-server first, then frontend artifacts |
| G-R02 | HIGH | No process manager / supervisor — workflows started manually in Replit | OPEN | Replit handles this in dev; production deploy needed |
| G-R03 | HIGH | Session store is in-memory — sessions lost on API server restart | OPEN | Redis not activated; risk in any multi-restart scenario |
| G-R04 | MEDIUM | CORS_ORIGINS set for Replit domains only — not configured for custom enterprise domains | OPEN | `.replit [userenv.production]` has `CORS_ORIGINS = "https://*.replit.app,https://*.replit.dev,https://*.repl.co"`; any custom domain (e.g. `szlholdings.com`) must be added |
| G-R05 | MEDIUM | No health endpoint smoke test in CI with running server | OPEN | `pnpm health:check` requires live server; integration tests not in CI gate |
| G-R06 | MEDIUM | Sentry DSN not configured — production errors silent | OPEN | Listed as Risk #8 |
| G-R07 | MEDIUM | OTel / distributed tracing not implemented | DEFERRED | Q3 2026 per risk doc; spec complete |

---

## Authentication Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-A01 | HIGH | No rate limiting on login endpoint (F-01) | OPEN | Phase A finding; Phase B did not remediate |
| G-A02 | HIGH | MFA_SECRET_ENCRYPTION_KEY unset — TOTP secrets stored unencrypted (F-02) | OPEN | Must add to Replit Secrets immediately |
| G-A03 | MEDIUM | Cookie `secure`/`sameSite` flags not confirmed in production (F-03) | OPEN | Phase A finding F-03 |
| G-A04 | HIGH | Dual RBAC role system — `platformRole` enum (12 values) + `rolesTable` (4 values) + canonical mapping layer | OPEN | Three-layer system creates enforcement inconsistency risk |
| G-A05 | MEDIUM | Three different auth patterns across artifacts (shared hook / local useAuth / redirect helper) | OPEN | Reconciliation report §B1–B4 |
| G-A06 | MEDIUM | Route-level `org_id` validation not fully confirmed (F-05) | OPEN | Phase A finding |
| G-A07 | MEDIUM | Password reset token single-use not confirmed (F-06) | OPEN | Phase A finding |
| G-A08 | MEDIUM | Mobile token storage mechanism not confirmed (F-07) | OPEN | Phase A finding |
| G-A09 | LOW | Clerk listed as auth provider in `platform-facts.md` — not found as active library | OPEN | Remove from public claims or wire it |
| G-A10 | MEDIUM | No shared `RequireAuth` primitive used across all artifacts | OPEN | Each artifact handles protected routes differently |

---

## Data Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-D01 | HIGH | pgTable count: **915** actual table definitions vs 906 claimed — confirmed by `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915; `grep "pgTable"` broadly = 1,078 lines incl. imports | OPEN | `platform-facts.md` must be updated to 915 |
| G-D02 | MEDIUM | Schema file count: 165 actual vs 163 claimed | OPEN | Minor but part of broader metric accuracy problem |
| G-D03 | HIGH | No rollback migrations — `db:push` strategy means any migration error requires manual recovery | OPEN | Acceptable in dev; blocking risk for production |
| G-D04 | MEDIUM | Prism Counsel recovery table seed script broken | OPEN | Listed as Risk #6; low-effort fix |
| G-D05 | MEDIUM | Vessels commercial modules (charter, freight benchmarking) not connected to live database | OPEN | Listed as Risk #5; `artifacts/vessels/src/` |
| G-D06 | LOW | AIS data for Vessels is simulated (not live feed) | OPEN | `reconciliation-report.md` row 3; no live AIS API key |
| G-D07 | LOW | MarineTraffic, AISHub, Digitraffic, BarentsWatch listed as sources — no API keys in `.env.example` | OPEN | Public claims without backend support |
| G-D08 | MEDIUM | No per-route "live vs. mocked" telemetry signal | OPEN | GAP D3 from reconciliation report; no covering task |

---

## Documentation / Claims Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-DC01 | HIGH | `platform-facts.md` "Active artifacts: 2" misleads — `.replit [[artifacts]]` has 2; workspace registry has 15; none running | OPEN | Must clarify both registration systems and correct to accurate lifecycle state |
| G-DC02 | HIGH | All platforms listed as "Live" in `PRODUCT_MATRIX.md` — none running | OPEN | Must reflect actual lifecycle state |
| G-DC03 | HIGH | RBAC role names in `PLATFORM_CANONICAL.md` don't match any enum | OPEN | Seven names used there exist in neither schema |
| G-DC04 | MEDIUM | Route file count wrong in multiple docs (182 → 256 → 268/382 actual) | OPEN | Canonical: 268 route groups / 382 `.ts` files (`find artifacts/api-server/src/routes -name "*.ts" \| wc -l` = 382) |
| G-DC05 | MEDIUM | Package counts wrong across docs (118 claimed vs 122 actual: 81 package dirs + 41 lib dirs; `packages/proxy-routes.ts` is a standalone file, not a package) | OPEN | See `audit/counting-methodology.md` for exact commands |
| G-DC06 | MEDIUM | `APP_STATUS.md` marks Lyte and PRISM Counsel as Archived — both are registered but not running (see G-R01; all 18 workflows NOT STARTED) | OPEN | Reconciliation report A1; lifecycle status in docs contradicts registration state |
| G-DC07 | LOW | `launch/01_ability_matrix.json` has empty `live_state` columns | OPEN | Reconciliation report A2; `verify:claims` CI gate wired but data absent |
| G-DC08 | LOW | Three competing capability manifest files with no CI reference | OPEN | Reconciliation report A4 |
| G-DC09 | MEDIUM | No single registry file a new contributor can read to understand all artifacts | OPEN | Reconciliation report GAP A3 |

---

## Infrastructure / Repo Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-I01 | MEDIUM | `artifacts/firestorm/` — only `ARCHIVED.md` on disk; deregistered but not deleted | OPEN | Phase D deferred |
| G-I02 | MEDIUM | `artifacts/imperium/` — only `node_modules/` orphan; no package.json | OPEN | Phase D deferred |
| G-I03 | LOW | `artifacts/cortex-mobile/` — Expo concept stub, no package.json | OPEN | Misleading; scaffold or delete |
| G-I04 | LOW | `artifacts/audit/` and `artifacts/internal-audit/` — ops output stored inside `artifacts/` | OPEN | Should move to `ops/` or project root |
| G-I05 | MEDIUM | Stripe in test mode — no revenue collectable | OPEN | Risk #3; hours of setup work |
| G-I06 | HIGH | No artifact E2E specs for: Pulse, Sentra, Counsel, PRISM Counsel, Lyte, Mockup Sandbox | OPEN | Zero test coverage for 6 of 15 artifacts |
| G-I07 | MEDIUM | Azure Bicep IaC exists but not tested or deployed | DEFERRED | Enterprise deployment path; pre-revenue |
| G-I08 | LOW | `deliverables/`, `output/`, `screenshots/`, `backups/` dirs — content ambiguous, large | OPEN | Phase D deferred; 400+ files |

---

## Code Quality Gaps

| ID | Severity | Gap | Status | Notes |
|----|----------|-----|--------|-------|
| G-CQ01 | MEDIUM | 10,348 Biome `warn`-level lint items across monorepo | OPEN | Phase B report; no build blockers but maintenance debt |
| G-CQ02 | MEDIUM | Integration tests exist but not in CI gate | OPEN | `pnpm test:integration` not wired; Risk #10 |
| G-CQ03 | MEDIUM | No per-artifact route ownership map (256+ routes, no attribution) | OPEN | Reconciliation report GAP C1 |
| G-CQ04 | LOW | Design system fragmentation — each artifact ships own Tailwind config and Card/Button wrappers | OPEN | Reconciliation report E1 |
| G-CQ05 | LOW | Agent eval runner, eval dataset store, model promotion gate not built | DEFERRED | Q3 2026 per risk doc; spec complete |

---

## Summary Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 13 |
| MEDIUM | 24 |
| LOW | 12 |
| **Total** | **50** |

---

*Items marked COVERED with a task number have existing backlog coverage. Items marked OPEN with no task number are net-new gaps requiring action in the next 30 days.*
