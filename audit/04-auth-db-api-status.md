# SZL Holdings — Auth / DB / API Status

**Audit date:** 2026-04-21  
**Summary:** Auth has 9 open findings (F-01 through F-07 plus 2 structural gaps). DB has **915** table definitions across 165 schema files. API has 268 route groups / 382 route files — all routes are code-verified but NONE are running.  
**Reproducibility:** All counts reproducible via `audit/counting-methodology.md`.

---

## Authentication Status

### Overall: PARTIALLY VERIFIED — structural auth exists; runtime smoke test not complete

| Component | Status | Notes |
|-----------|--------|-------|
| OIDC / Replit Auth library | PARTIALLY VERIFIED | `lib/auth` and `@szl-holdings/replit-auth-web` exist; runtime not confirmed |
| Login route (OIDC) | PARTIALLY VERIFIED | `GET /api/login` present; not tested |
| Login route (password) | PARTIALLY VERIFIED | `POST /api/auth/login` present; PBKDF2-SHA512 confirmed |
| Rate limiting on login | **BROKEN** | F-01 — absent; must add before any public exposure |
| MFA / TOTP | **BROKEN** | F-02 — `MFA_SECRET_ENCRYPTION_KEY` unset; secrets stored unencrypted |
| Cookie security flags | UNVERIFIED | F-03 — not confirmed in production |
| Session store | PARTIALLY VERIFIED | In-memory (all environments); Redis not activated |
| RBAC — role definitions | **BROKEN** | Three parallel role systems; `PLATFORM_CANONICAL.md` names don't match any enum |
| Route auth middleware | PARTIALLY VERIFIED | `audit:route-security:strict` CI gate added; coverage not confirmed |
| Tenant / org isolation | UNVERIFIED | F-05 — not confirmed per-route |
| Password reset (single-use) | UNVERIFIED | F-06 |
| Mobile token storage | UNVERIFIED | F-07 |
| Auth pattern consistency | **BROKEN** | Three different auth patterns across 15 artifacts |
| Bootstrap admin path | VERIFIED | Phase A created and documented |

**Open auth findings: 9 (F-01 through F-07 + dual role system + three auth patterns)**

See `audit/auth-flow-matrix.md` for full per-flow details.

---

## Database Status

### Overall: PARTIALLY VERIFIED — schema is real; live database state unconfirmed

| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL 16 | VERIFIED | `.replit` modules |
| DATABASE_URL | VERIFIED | Set in Replit Secrets |
| Drizzle ORM 0.45.1 | VERIFIED | pnpm catalog |
| Schema files | VERIFIED | 165 files in `lib/db/src/schema/` |
| pgTable definitions | VERIFIED | **915** (confirmed: `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` = 915; `grep "pgTable"` broadly = 1,078 lines incl. imports) |
| Migrations applied | UNVERIFIED | `db:push` not run in this session |
| Seed data present | UNVERIFIED | Seed scripts not run in this session |
| Bootstrap admin seeded | PARTIALLY VERIFIED | Script exists; Phase A ran it previously |
| PRISM Counsel recovery seed | **BROKEN** | Risk #6; script broken |
| Dual role tables | **BROKEN** | `usersTable.platformRole` + `rolesTable` + `userRolesTable` — inconsistent |
| Firestorm schema (archived) | PARTIALLY VERIFIED | 22 tables in schema; may be live in DB |
| Rollback migrations | NOT IMPLEMENTED | Forward-only strategy; intentional but risky |

### Canonical table count: **915**

Previous claims of 906 are BROKEN.

---

## API Status

### Overall: PARTIALLY VERIFIED — 268 route groups / 382 files exist; server not running

| Component | Status | Notes |
|-----------|--------|-------|
| Express API server | NOT STARTED | Workflow not running |
| Route file count | VERIFIED | 268 top-level entries; 382 total `.ts` files (confirmed: `find artifacts/api-server/src/routes -name "*.ts" \| wc -l` = 382) |
| `audit:route-security:strict` gate | PARTIALLY VERIFIED | Added by Task #1902; requires running server to test |
| Health endpoint (`/api/health`) | PARTIALLY VERIFIED | Route pattern expected; not smoke-tested |
| AEEP v1 endpoints (18 listed) | PARTIALLY VERIFIED | Route files present; all marked "Active" |
| WebSocket (HMAC-signed) | PARTIALLY VERIFIED | Code present; not smoke-tested |
| CSRF protection | PARTIALLY VERIFIED | Task #2848 downstream includes CSRF testing |
| Rate limiting (general) | UNVERIFIED | Absent on login specifically (F-01); general coverage unclear |
| Input validation (`validateBody`/`validateQuery`) | PARTIALLY VERIFIED | CI gate added by Task #1902; coverage higher than "21/170" doc claims |
| Error handling | PARTIALLY VERIFIED | Express error handler exists; Sentry not configured |

### Route Domain Distribution

The 268 route groups span these domains (estimated from route file names):

| Domain | Estimated Route Groups | Examples |
|--------|----------------------|---------|
| Alloy (core execution fabric) | ~20 | alloy.ts, alloy-runtime.ts, alloy-chat.ts, alloy-governance.ts, alloy-research.ts |
| Agent / AI infrastructure | ~18 | agents.ts, agent-mesh.ts, agent-os.ts, ai-engine.ts, ai-safety.ts |
| Aegis / Security | ~15 | aegis-intel.ts, aegis-modules.ts, aegis-digital-twin.ts, aegis-pcap.ts |
| Terra / Real Estate | ~12 | terra*.ts routes |
| Vessels / Maritime | ~10 | vessels*.ts routes |
| Lyte / Business Observability | ~8 | lyte*.ts routes |
| Admin | ~15 | admin/ subdirectory |
| Auth | ~8 | auth*.ts routes |
| PRISM Counsel / Legal | ~10 | prism*.ts routes |
| Platform/System | ~152 | analytics, billing, cms, notifications, etc. |

### Notable Route Files

- `a2a.ts` — Agent-to-agent communication protocol
- `aegis-pcap.ts` — Packet capture analysis (Aegis defense)
- `agent-federation.ts` — Multi-tenant agent federation
- `agent-training.ts` — Agent training orchestration
- `alloy-cognitive-learning.ts` — Cognitive learning pipeline
- `alloy-policy-compiler.ts` — Policy compilation
- `alloy-policy-llm.ts` — LLM-backed policy evaluation

---

## API Surface vs. Claims

| Claim | Claimed | Actual | Status |
|-------|---------|--------|--------|
| Route groups | 14 (`platform-facts.md`) | 268 | **BROKEN** |
| Route files | 182 → 256 → 268/382 | 268 groups / 382 files | Multiple docs BROKEN |
| Active AEEP v1 endpoints | 18 | 18 listed (PARTIALLY VERIFIED) | Claim accurate but drastically understates surface |
| Validation coverage | "21/170" (`APP_STATUS.md`) | Unknown (CI gate strict-mode; higher than 21/170) | Doc BROKEN |
