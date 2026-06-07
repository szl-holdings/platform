# SZL Holdings — Audit Executive Summary

**Audit date:** 2026-04-21  
**Audit type:** Truth Audit & Strategic Repositioning (Task #2848)  
**Status labels used throughout:** VERIFIED · PARTIALLY VERIFIED · UNVERIFIED · BROKEN · OUT OF SCOPE  
**Reproducibility:** All canonical metric counts have exact shell commands documented in `audit/counting-methodology.md`. Every number in this document can be re-verified by running those commands from the repository root.

---

## Critical Finding — Nothing Is Running

**All 18 registered workflows are NOT STARTED.** This is the single most important runtime fact in this audit. No artifact is serving traffic. No API server is alive. Claims of "Live" status across the product matrix are made against a platform that is not running in this environment. This does not mean the code is broken — it means every functional claim must be treated as UNVERIFIED until workflows are started and smoke-tested.

All 18 workflows confirmed NOT STARTED:
- `artifacts/api-server: api` — the entire backend
- `artifacts/szl-holdings: web`, `artifacts/aegis: web`, `artifacts/vessels: web`, `artifacts/terra: web`, `artifacts/carlota-jo: web`, `artifacts/command: web`, `artifacts/lyte-command-center: web`, `artifacts/pulse: web`, `artifacts/sentra: web`, `artifacts/counsel: web`, `artifacts/szl-demo-video: web`, `artifacts/mockup-sandbox: web`
- `artifacts/szl-holdings-mobile: expo`
- `shared-proxy`, `lyte-metrics-store: service`, `lyte-metrics-store-test`, `api-test`

---

## What Is Real

| Area | Status | Evidence |
|------|--------|----------|
| PostgreSQL schema | VERIFIED | **915** `pgTable(` table definitions across 165 schema files in `lib/db/src/schema/` (confirmed: `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915; note: `grep "pgTable"` broadly yields 1,078 lines which includes import statements, type references, and inference helpers — not all are table definitions) |
| API route structure | VERIFIED | 268 top-level entries in `artifacts/api-server/src/routes/`, 382 `.ts` route files total (confirmed: `find artifacts/api-server/src/routes -name "*.ts" | wc -l` = 382) |
| Monorepo build tooling | VERIFIED | pnpm 10.x, TypeScript 5.x strict, Vite 7, Drizzle 0.45.1 wired; CI config exists at `.github/workflows/ci.yml` |
| Phase A security hardening | PARTIALLY VERIFIED | Phase A secrets scan covered `.ts/.tsx/.js/.jsx` files only and found no committed secrets there. However `.replit [userenv.shared]` contains a hardcoded `SUBSTRATE_SIGNING_KEY` (256-bit hex) and `.replit [userenv.development]` contains a hardcoded `ALLOY_INTERNAL_TOKEN`. These are committed credential-like values in `.replit`. Phase A scan missed `.replit`. 7 auth findings documented (F-01 → F-07); bootstrap admin seed exists. |
| Phase B code quality | VERIFIED | TypeScript baseline clean on targeted packages; 10,348 Biome `warn`-level items (no blockers) |
| Auth library exists | PARTIALLY VERIFIED | `lib/auth`, `@szl-holdings/replit-auth-web` present in filesystem; runtime behavior UNVERIFIED (server not running) |
| Drizzle migrations | PARTIALLY VERIFIED | Schema files exist; `db:push` strategy documented; no rollback path |
| Alloy execution fabric | PARTIALLY VERIFIED | `packages/alloy`, `lib/workflow-engine` present; runtime execution UNVERIFIED |
| Live external data (Vessels) | PARTIALLY VERIFIED | NOAA, Open-Meteo, GDELT integrations documented in route files; actual HTTP calls UNVERIFIED |
| Live external data (Aegis) | PARTIALLY VERIFIED | CISA KEV, NVD, MITRE ATT&CK routes present; actual HTTP calls UNVERIFIED |
| Stripe billing | UNVERIFIED | Infrastructure present; `STRIPE_SECRET_KEY` points to test mode per open risks doc |
| MFA/TOTP | UNVERIFIED | `MFA_SECRET_ENCRYPTION_KEY` was noted as unset in Phase A |
| Redis session store | UNVERIFIED | Documented as "enterprise production, not yet activated"; current store is in-memory |
| Agent eval infrastructure | UNVERIFIED | Spec complete; runner, dataset store, promotion gate not implemented per `OPEN_RISKS_AND_NEXT_10.md` |
| OTel / Sentry | UNVERIFIED | Both documented but not configured |
| CORS_ORIGINS (production) | PARTIALLY VERIFIED | `.replit [userenv.production]` sets `CORS_ORIGINS = "https://*.replit.app,https://*.replit.dev,https://*.repl.co"` — covers Replit preview/deploy domains. No custom enterprise domain (e.g. `szlholdings.com`) is in the allowlist. Sufficient for Replit-hosted deployment; insufficient for any white-label or custom enterprise domain deployment. |

---

## Metric Discrepancies (Canonical Resolutions)

| Metric | Claimed (where) | Actual | Resolution |
|--------|----------------|--------|------------|
| pgTable count | 906 (`docs/platform-facts.md`) | **915** (`grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915 actual table definitions; `grep "pgTable"` broadly = 1,078 lines incl. imports) | Use 915 everywhere — 915 counts only direct `pgTable(` function calls |
| Schema files | 163 (`platform-facts.md`) | **165** (filesystem) | Use 165 |
| Route files | 182 (`APP_STATUS.md`) / 256 (reconciliation report) | **268** top-level entries, **382** total `.ts` route files | Use 268 route groups / 382 files |
| `lib/` packages | 41 (`platform-facts.md`) | **41** (filesystem) | No change |
| `packages/` entries | 77 (`platform-facts.md`) | **81 directories** (82 ls entries; `packages/proxy-routes.ts` is a non-directory file) | Use 81 package directories |
| Total packages | 118 (`platform-facts.md`) | **122** (81 package dirs + 41 lib dirs) | Use 122 |
| Active artifacts | 2 (`platform-facts.md`) | **Two separate registration systems:** `.replit [[artifacts]]` has 2 entries (`artifacts/api-server`, `artifacts/mockup-sandbox`). The workspace registry has 15 registered artifacts. `platform-facts.md` "Active artifacts: 2" reflects only the `.replit [[artifacts]]` count; 0 are currently running in any system. BROKEN — "2 active" is misleading; 15 are registered across both systems; none are running. |
| RBAC roles | 7 (`PLATFORM_CANONICAL.md`) / 11 (`platform-facts.md`) | **12 platformRole enum values + 4 rolesTable roles + canonical mapping layer = dual parallel system** | See `audit/auth-flow-matrix.md`; consolidation required |

---

## Primary and Secondary Wedge Decision

**Primary wedge: Governed Workflow Orchestration (Alloy + Command + Lyte)**  
Rationale: The Alloy execution fabric — workflow routing, human-in-the-loop gates, audit trail, agent coordination — is the actual architectural differentiator. Command has 281 source files (deepest UI surface). Lyte/PRISM is the intended commercial entry point. The "governed AI" story is investor-understandable, enterprise-resonant, and not dependent on fake data — the schema, route structure, and workflow engine code are all real. Full rationale in `audit/05-investor-positioning.md`.

**Secondary wedge: Maritime Intelligence (Vessels)**  
Rationale: Vessels has the most externally verifiable real data story (AIS, NOAA, Open-Meteo, GDELT, OFAC SDN sanctions screening). The buyer profile (fleet executives, maritime insurers, government) has the highest willingness-to-pay. Dark vessel detection and sanctions screening are demonstrable, quantifiable, and not replicable with a simple dashboard. Full rationale in `audit/05-investor-positioning.md`.

---

## Runtime / Auth Blockers — Must Fix Before Any Redesign

These must be resolved by the next task before any cosmetic or repositioning work begins:

| # | Blocker | Severity | Evidence |
|---|---------|----------|----------|
| B-01 | All workflows are NOT STARTED | CRITICAL | Workflow status log — zero traffic possible |
| B-02 | CORS_ORIGINS covers Replit domains only — enterprise custom domain not in allowlist | MEDIUM | `.replit [userenv.production]`: set for `*.replit.app,*.replit.dev,*.repl.co`; add custom domain before any white-label or enterprise domain deployment |
| B-02a | `SUBSTRATE_SIGNING_KEY` hardcoded in `.replit [userenv.shared]` | HIGH | 256-bit hex key committed in `.replit`; should be moved to Replit Secrets |
| B-02b | `ALLOY_INTERNAL_TOKEN` hardcoded in `.replit [userenv.development]` | MEDIUM | Dev token committed in `.replit`; acceptable in dev but must not carry to production |
| B-03 | No rate limiting on login endpoint (F-01) | HIGH | `audit/security/auth-review.md` F-01 |
| B-04 | `MFA_SECRET_ENCRYPTION_KEY` unset — TOTP secrets stored unencrypted (F-02) | HIGH | Phase A report |
| B-05 | Dual RBAC role system — inconsistent enforcement risk | HIGH | `lib/db/src/schema/auth.ts` — 12-value enum + rolesTable + canonical layer |
| B-06 | Three different auth patterns across artifacts | MEDIUM | Reconciliation report §B; `audit/auth-flow-matrix.md` |
| B-07 | Cookie `secure`/`sameSite` flags not confirmed in production (F-03) | MEDIUM | Phase A auth findings |
| B-08 | Stripe in test mode — no revenue collectable | REVENUE | `OPEN_RISKS_AND_NEXT_10.md` Risk #3 |
| B-09 | Sentry not configured — silent production failures | MEDIUM | `OPEN_RISKS_AND_NEXT_10.md` Risk #8 |
| B-10 | In-memory session store — sessions lost on restart | MEDIUM | `PLATFORM_CANONICAL.md` auth section |

---

## Contradictory Public Claims Requiring Reconciliation

| Claim location | Claim | Reality |
|----------------|-------|---------|
| `docs/platform-facts.md` | "Active registered artifacts: 2" | 15 are registered |
| `docs/PRODUCT_MATRIX.md` | All 6 platforms listed as "Live" | All workflows NOT STARTED; "Live" is unverified |
| `docs/platform-facts.md` | "Database tables: 906" | Actual: 915 (direct `pgTable(` definitions) |
| `docs/APP_STATUS.md` | "182 route files" | Actual: 268 groups / 382 files |
| `docs/PLATFORM_CANONICAL.md` | "RBAC roles: 7" | Actual: 12 platformRole + 4 rolesTable + canonical mapping |
| `docs/platform-facts.md` | "Total packages: 118" | Actual: 122 (81 package dirs + 41 lib dirs) |
| `docs/PLATFORM_CANONICAL.md` | "Session store: In-memory (development); Redis (enterprise production)" | Redis not activated; in-memory used in all environments |

---

*This summary is the governing document for Task #2848 and the decision spine for the subsequent repositioning task.*
