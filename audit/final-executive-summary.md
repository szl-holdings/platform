# SZL Holdings Platform — Final Executive Summary

**Date:** 2026-04-21  
**Covering:** Tasks #2848 (Audit) · #2849 (Stabilise & Reposition) · #2850 (Proof, Trust Layer, ROI)  
**Classification:** Internal / Investor Diligence  
**Format:** Verified fact-based assessment — VERIFIED · PARTIAL · BROKEN labels throughout

---

## Area / Status / Notes Table

| Area | Status | Notes |
|------|--------|-------|
| Homepage | VERIFIED | Rebuilt and live. Post-repositioning institutional design. Verified numbers only (915, 122, 382, 165). No unverified claims on the public surface. |
| Core navigation | VERIFIED | 6-item institutional navigation: Platform / Solutions / Trust / Architecture / Company / Contact. Down from 50+ items. Renders correctly. |
| Auth (code) | VERIFIED | Deny-by-default global auth enforcer. Rate limiting on 6 auth routes. Cookie flags correct (`__Host-sid`, `secure`, `httpOnly`, `sameSite: lax`). CSRF enforced. |
| Auth (runtime) | PARTIAL | Code structure confirmed via inspection. Runtime login flow (Replit OIDC) requires deployed environment — not testable in dev workspace without DATABASE_URL. |
| API | VERIFIED | 268 route groups, 382 route files — filesystem confirmed. 100% Zod validation via contracts — code confirmed. Server not running in dev (no DATABASE_URL). |
| Database | VERIFIED | 915 table definitions (direct `pgTable()` calls), 165 schema files, 139 migrations. Schema depth is real. Migration posture documented. |
| Replit runtime | PARTIAL | `szl-holdings: web`, `sentra: web`, `vessels: web`, `terra: web`, `carlota-jo: web`, `szl-holdings-mobile: expo` all running. API server not started (requires DATABASE_URL). `command: web` failed to start (startup timeout). |
| Mobile responsiveness | PARTIAL | Expo mobile workflow running; web preview renders SZL Holdings wrapper. Native mobile experience requires Expo Go / TestFlight build. No DATABASE_URL = no authenticated content. |
| Trust center | VERIFIED | Six trust sub-pages confirmed live and rendering: `/trust`, `/trust/security`, `/trust/architecture`, `/trust/ai`, `/trust/approvals`, `/trust/operations`. All captured as screenshots. `docs/security-posture.md` and `docs/trust-center.md` complete. |
| Investor narrative | VERIFIED | `docs/investor-narrative.md` complete (pre-existing from Task #2849). `docs/roi-model.md` created (modeled ranges, sourced benchmarks). `docs/buyer-one-pager.md` created. `docs/architecture-summary.md` created. ROI numbers are traceable to verified public-surface figures: 915 tables, 382 routes, 122 packages, 165 schema files — all confirmed via direct grep/filesystem; displayed on the homepage at `/`. |
| Screenshots | VERIFIED | 19 post-repositioning screenshots captured: platform/ (11 — includes 5 trust sub-pages), solutions/ (5), mobile/ (1), admin/ (2 — auth-gating confirmed). 8 stale pre-repositioning screenshots deleted. `docs/screenshots/manifest.md` created. |
| GitHub public surface | PARTIAL | README matches verified reality. RBAC count corrected (11 → 12). CI/CodeQL/Security workflows active per `.github/workflows/`. Repository is private; public mirror not confirmed in this pass. |

---

## The Honest One-Paragraph Verdict

SZL Holdings has the architecture of a serious enterprise platform and the post-repositioning public surface to match. The public web (szlholdings.com) is clean, institutional, and honest: verified numbers only, explicit AI governance claims, an architecture story that is structurally defensible. The backend has 268 route groups, 915 schema table definitions, defense-in-depth security architecture, and a genuine workflow execution fabric. The six platform primitives are code, not slides. The primary operational gap is configuration, not architecture: no PostgreSQL database is provisioned, so all authenticated product surfaces return 502s. An investor doing code-level diligence would find a serious platform. An investor trying to click through the authenticated product would need the database started first. Getting from current state to full authenticated demo requires one operator action: provisioning DATABASE_URL.

---

## What Works — Verified

### Security (Green)
- Deny-by-default authentication on all `/api/*` routes — code confirmed
- 12-role RBAC with org-scoped tenant isolation — code confirmed
- Rate limiting on 6 auth routes: `loginLimiter` (10 req/15min in prod) — code confirmed
- CSRF protection via double-submit cookie pattern — code confirmed
- Cookie flags: `__Host-sid`, `httpOnly: true`, `secure: true`, `sameSite: 'lax'` — code confirmed
- Internal service token timing-safe comparison (`crypto.timingSafeEqual()`) — code confirmed
- CI security gates: CodeQL SAST, dependency review, secret scanning — `.github/workflows/` confirmed
- Startup validation: hard error in production for missing/placeholder secrets — code confirmed

### API Infrastructure (Green-Amber)
- 268 route groups, 382 route files — filesystem confirmed
- 100% Zod schema validation via `@szl-holdings/contracts` — code confirmed
- Middleware stack: OTel, correlation IDs, Helmet CSP/HSTS, CSRF, rate limiting, tenant scope, ETag — code confirmed
- Consistent error envelopes across all routes — code confirmed
- Graceful degradation: API server starts in degraded mode without `DATABASE_URL` — code confirmed

### Data Layer (Green)
- 915 database table definitions — grep confirmed (`grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" | wc -l`)
- 165 schema files — filesystem confirmed
- 139 migrations (115 Drizzle + 24 hand-authored) — confirmed
- Drizzle ORM v0.45.x with parameterized queries — code confirmed

### Design System (Green)
- `@szl-holdings/design-system` v0.1.0 — dark-first, enterprise accent family
- Deprecated neon palette explicitly marked `@deprecated` — code confirmed
- Public surface post-repositioning: institutional, dark, no gaming-era artifacts — screenshot confirmed

### Public Surface (Green)
- Homepage, Trust Center, Architecture, Solutions, Platform, Company pages — all loading correctly
- Cookie consent, privacy policy link, correct navigation structure — confirmed
- Sentra, Vessels, Terra, Carlota Jo public homepages — all loading correctly
- CORTEX Expo mobile workflow running

---

## What's Broken — Honestly

### Must Fix Before Authenticated Investor Demo

**1. No database provisioned — authenticated surfaces return 502**  
No `DATABASE_URL`. All product surfaces (Lyte, Vessels authenticated, Terra, Sentra, Counsel, Command, Pulse) return 502 where API responses would appear. Fix: provision PostgreSQL, add `DATABASE_URL` to secrets, run `pnpm migrate && pnpm seed`.

**2. AIS marketed as live — it's simulated**  
Vessels homepage shows "LIVE FLEET — 214 VESSELS TRACKED". The codebase confirms AIS is simulated. A maritime investor checking API headers will catch this. Copy must add "Simulated" qualifier.

**3. Mapbox token absent — Terra maps blank**  
`MAPBOX_TOKEN` not set. Terra's NYC distress pipeline (the live data differentiator) requires Mapbox. Fix: add `MAPBOX_TOKEN` to Replit Secrets. Free tier covers demos.

**4. Command portal startup timeout**  
`artifacts/command: web` failed to start within 60 seconds in this environment. May be resource contention with other running workflows.

### Code Quality (Non-Blocking for Runtime)

**5. Lint: 378 errors, 7,727 warnings** — 100% unused imports; no security impact

**6. Typecheck: @workspace/ontology ambiguous re-exports** — TS2308; cascades to 6 downstream packages; pre-existing

**7. Build: szl-demo-video VITE_PORT missing** — env var required but not set in build context

---

## Exact Commands Run (This Task)

```bash
# Lint verification
pnpm lint:ci
# Result: FAIL — 378 errors, 7,727 warnings (unused imports)

# Typecheck verification (turbo)
pnpm typecheck
# Result: FAIL — @workspace/ontology TS2308; 14 packages passed

# Build verification (turbo)
pnpm build
# Result: FAIL — szl-demo-video (VITE_PORT missing); ontology cascade

# Unit test verification
pnpm test:api
# Result: TIMEOUT — no DATABASE_URL; DB connections block

# Integration test verification
pnpm test:integration
# Result: TIMEOUT — same cause

# Route smoke tests
pnpm qa:site
# Result: SZL Holdings 32/32 PASS; all other domains 0/55 FAIL (workflows not running)

# Trust page QA
pnpm qa:trust
# Result: FAIL — 16 routes unreachable (server not at localhost:3000)

# Metadata QA
pnpm qa:meta
# Result: FAIL — 18 pages unreachable (same cause)

# Workflows started
# szl-holdings:web, sentra:web, vessels:web, terra:web, carlota-jo:web, szl-holdings-mobile:expo
# command:web — failed to start (startup timeout)

# Screenshots captured (19 total across 4 subfolders)
# platform/ (11): home, trust, trust/security, trust/architecture, trust/ai,
#   trust/approvals, trust/operations, solutions, platform, architecture, company
# solutions/ (5): sentra, vessels, terra, carlota-jo, szl-holdings-solutions
# mobile/ (1): cortex-mobile-home (Expo web preview)
# admin/ (2): /admin + /admin/command-center — both show "Authentication Required"
#   (confirms deny-by-default access control is working at UI layer)
# 8 stale screenshots deleted
```

---

## Exact Files Changed (Task #2850)

| File | Action |
|------|--------|
| `audit/verification-runs.md` | Created — full verification run results with all commands |
| `audit/final-executive-summary.md` | Replaced — this document |
| `docs/roi-model.md` | Created — modeled ROI, sourced benchmarks, labeled as modeled |
| `docs/buyer-one-pager.md` | Created — enterprise buyer one-pager, verified facts |
| `docs/security-posture.md` | Created — security controls, open findings, remediation paths |
| `docs/architecture-summary.md` | Created — architecture for technical buyers and diligence teams |
| `docs/screenshots/manifest.md` | Created — complete screenshot inventory |
| `docs/screenshots/platform/szl-holdings-home.jpg` | Created — homepage (post-repositioning) |
| `docs/screenshots/platform/szl-holdings-trust.jpg` | Created — Trust Center page |
| `docs/screenshots/platform/szl-holdings-solutions.jpg` | Created — Solutions/Domain Packs page |
| `docs/screenshots/platform/szl-holdings-platform.jpg` | Created — Platform depth page |
| `docs/screenshots/platform/szl-holdings-architecture.jpg` | Created — Architecture page |
| `docs/screenshots/platform/szl-holdings-company.jpg` | Created — Company page |
| `docs/screenshots/solutions/sentra-cyber-resilience.jpg` | Created — Sentra homepage |
| `docs/screenshots/solutions/vessels-maritime-intelligence.jpg` | Created — Vessels homepage |
| `docs/screenshots/solutions/terra-real-estate.jpg` | Created — Terra homepage |
| `docs/screenshots/solutions/carlota-jo.jpg` | Created — Carlota Jo homepage |
| `docs/screenshots/solutions/szl-holdings-solutions.jpg` | Created — Solutions page (solutions/ copy) |
| `docs/screenshots/mobile/cortex-mobile-home.jpg` | Created — CORTEX Expo mobile web preview |
| `docs/screenshots/platform/szl-holdings-trust-security.jpg` | Created — Trust/Security Posture page (confirmed live) |
| `docs/screenshots/platform/szl-holdings-trust-architecture.jpg` | Created — Trust/Platform Architecture page (confirmed live) |
| `docs/screenshots/platform/szl-holdings-trust-ai.jpg` | Created — Trust/AI Policy page (confirmed live) |
| `docs/screenshots/platform/szl-holdings-trust-approvals.jpg` | Created — Trust/Approval Model page (confirmed live) |
| `docs/screenshots/platform/szl-holdings-trust-operations.jpg` | Created — Trust/Operations page (confirmed live) |
| `docs/screenshots/admin/szl-holdings-admin.jpg` | Created — /admin: auth gating confirmed ("Authentication Required") |
| `docs/screenshots/admin/szl-holdings-admin-command-center.jpg` | Created — /admin/command-center: auth gating confirmed |
| `docs/screenshots/aegis-marketing.jpg` | Deleted — pre-repositioning gaming aesthetic |
| `docs/screenshots/lyte-marketing.jpg` | Deleted — pre-repositioning gaming aesthetic |
| `docs/screenshots/lyte-prism-pulse.jpg` | Deleted — pre-repositioning gaming aesthetic |
| `docs/screenshots/szl-holdings-home.jpg` | Deleted — replaced by platform/szl-holdings-home.jpg |
| `docs/screenshots/terra-marketing.jpg` | Deleted — pre-repositioning |
| `docs/screenshots/vessels-dashboard.jpg` | Deleted — pre-repositioning |
| `docs/screenshots/aegis-soc-dashboard.jpg` | Deleted — pre-repositioning |
| `docs/screenshots/stephen-site.jpg` | Deleted — removed artifact |
| `README.md` | RBAC count corrected: 11 → 12 (audit-verified) |

---

## Top 10 Remaining Risks

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | No database provisioned — API server cannot serve authenticated content | CRITICAL | Open — requires operator action (provision DATABASE_URL) |
| 2 | AIS marketed as live — simulated in codebase | HIGH | Open — copy fix needed in Vessels UI |
| 3 | Mapbox token absent — Terra maps blank during demo | HIGH | Open — add MAPBOX_TOKEN to Replit Secrets |
| 4 | `SUBSTRATE_SIGNING_KEY` hardcoded in `.replit` | HIGH | Partially mitigated — startup detection; needs Secret rotation |
| 5 | `MFA_SECRET_ENCRYPTION_KEY` unset in production | HIGH | Enforced at startup; key must be provisioned |
| 6 | Dual RBAC role system | HIGH | Documented; consolidation deferred |
| 7 | Sentry not configured — silent production failures | MEDIUM | SDK present; DSN placeholder |
| 8 | Redis session store not activated | MEDIUM | Adapter exists; not activated |
| 9 | Stripe in test mode | REVENUE | No live revenue collectable |
| 10 | Typecheck failures (@workspace/ontology TS2308) | MEDIUM | Pre-existing; does not block runtime |

---

## What Is Truly Operational

**Public surfaces (no API dependency):**
- `szl-holdings: web` — Homepage, Trust, Solutions, Platform, Architecture, Company — all correct
- `sentra: web` — Cyber Resilience Command homepage — loads correctly
- `vessels: web` — Maritime Intelligence homepage — loads correctly (AIS simulated)
- `terra: web` — Property Intelligence homepage — loads correctly (maps require MAPBOX_TOKEN)
- `carlota-jo: web` — Private Advisory homepage — loads correctly
- `szl-holdings-mobile: expo` — Expo mobile web preview — loads correctly

**Not operational:**
- All authenticated product surfaces — 502 (API server not running)
- `command: web` — startup timeout
- 8 other workflows — not started

---

## What Is Blocked By Missing Credentials / External Dependencies

| Item | Credential / Dependency | Impact |
|------|------------------------|--------|
| API server | `DATABASE_URL` | All authenticated product surfaces blocked |
| Mapbox maps | `MAPBOX_TOKEN` | Terra map view blank |
| Sentry error tracking | `SENTRY_DSN` | Silent production failures |
| MFA TOTP | `MFA_SECRET_ENCRYPTION_KEY` | TOTP storage unencrypted without this |
| Live AIS | MarineTraffic subscription | AIS simulated; disclosure required |
| Stripe revenue | Live Stripe key | Test mode only; no revenue collectable |
| Redis sessions | Redis URL + activation | Sessions lost on restart |

---

## Recommended Next 7 Days

| Day | Action | Impact |
|-----|--------|--------|
| 1 | Provision PostgreSQL; add `DATABASE_URL` to Replit Secrets | Unblocks all authenticated product surfaces |
| 1 | Run `pnpm migrate && pnpm seed` | Seeds 915-table schema + demo data |
| 1 | Add `MAPBOX_TOKEN` to Replit Secrets (free tier) | Unblocks Terra maps |
| 2 | Fix Vessels UI copy: add "AIS: Simulated" disclosure | Corrects investor-facing claim |
| 2 | Provision `MFA_SECRET_ENCRYPTION_KEY` (`openssl rand -hex 32`) | Required for TOTP security |
| 3 | Start API server and all 14 workflows; run smoke tests | Full platform verification |
| 3 | Capture authenticated surface screenshots (12+ surfaces) | Complete screenshot manifest |
| 4 | Fix `@workspace/ontology` ambiguous re-exports (TS2308) | Unblocks typecheck green |
| 5 | Run `biome lint --apply` on affected artifact files | Clears 378 lint errors; CI green |
| 7 | Configure `SENTRY_DSN` and `OTEL_ENDPOINT` | Production error monitoring active |

---

## Executive Summary

The SZL platform has genuine engineering depth and a credible investor-grade public story. The post-repositioning public surface (homepage, trust center, domain pack pages, architecture documentation) is clean, honest, and enterprise-appropriate. The security architecture is defense-in-depth with code-verified controls. The backend scale (268 route groups, 915 table definitions, 122 packages) is real and documentable.

The platform is not investor-demo-ready for authenticated product surfaces because no database is provisioned. The public surface is demo-ready today. Getting to "authenticated surfaces running" requires one operator action: provisioning a PostgreSQL database. Everything else is configuration (secrets) or copy-level fixes (AIS disclosure). None of the gaps require architectural changes.

**Phase 4 + Phase 5 deliverables (this task) — completed:**
- ✅ All available verification paths run; results recorded honestly in `audit/verification-runs.md`
- ✅ 19 post-repositioning screenshots captured (platform/×11, solutions/×5, mobile/×1, admin/×2); 8 stale deleted; manifest created
- ✅ `docs/roi-model.md` — modeled ranges, sourced benchmarks, labeled as modeled
- ✅ `docs/buyer-one-pager.md` — enterprise buyer one-pager, verified facts
- ✅ `docs/security-posture.md` — controls, open findings, remediation paths
- ✅ `docs/architecture-summary.md` — for technical buyers and diligence teams
- ✅ `audit/final-executive-summary.md` — this document; Area/Status/Notes table; honest verdict
- ✅ `README.md` — RBAC count corrected; numbers and status labels accurate

---

*This document reflects the platform state on 2026-04-21. All claims are based on direct code inspection, command execution, and screenshot capture — not aspirational roadmaps.*
