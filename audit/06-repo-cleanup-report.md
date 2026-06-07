# SZL Holdings — Repository Cleanup Report

**Audit date:** 2026-04-21
**Task:** #2849 — Stabilize blockers & execute enterprise repositioning
**Status:** COMPLETE (Task #2849) — cleanup, security hardening, and cross-surface normalization pass complete; stale screenshots pending regeneration (proof task).

---

## Summary

This document records all cleanup actions taken to the repository root and public-facing surfaces during the enterprise repositioning task. It replaces and extends the prior placeholder.

---

## Actions Taken

### A-01: Landing page rebuild

**Action:** Replaced `artifacts/szl-holdings/src/pages/landing.tsx` (1,145 lines) with a clean institutional rebuild (≈ 360 lines).

**Removed from public surface:**
- 9-step animated loop with multicolor neon step indicators (`#0ea5e9`, `#8b5cf6`, `#ec4899`, `#f59e0b`, `#10b981`, `#6366f1`, `#14b8a6`, `#ef4444`, `#f97316`)
- Platform tier visualization with gaming-style colored tier labels
- Domain packs grid with saturated accent colors
- Evidence stats with unverified numbers ("700+ Database tables", "40+ Shared packages", "13 Active surfaces", "116 schema files")
- Inline BG/LYTE/TEXT constants using neon-adjacent values (`hsl(192,72%,48%)`)
- Grid texture decorative element

**Added:**
- Clean IA: hero → proof strip → core platform → primary wedge → secondary wedge → trust → ROI → CTA
- Proof strip using only audit-verified numbers (915, 122, 382, 165)
- Honest disclosure on seeded demonstration data
- One primary CTA (Request Demo), one secondary CTA (Design Partners or See Platform)

### A-02: Navigation collapse

**Action:** Replaced `artifacts/szl-holdings/src/components/SiteNav.tsx` (822 lines) with institutional 6-item navigation.

**Removed from top-level navigation:**
- `Primitives` (merged into Architecture)
- `Domain Packs` (merged into Solutions)
- `Proof` (merged into Architecture)
- `Resources` (merged into Company)
- `Request Demo` as a standalone nav item (demoted to CTA button)
- 50+ mobile navigation items reduced to 30 essential links

**New structure:** Platform / Solutions / Trust / Architecture / Company / Contact

### A-03: Metrics reconciliation in documentation

**Action:** Updated the following docs to match canonical numbers from `audit/00-executive-summary.md`:

| File | Metric | Before | After |
|------|--------|--------|-------|
| `docs/platform-facts.md` | Active registered artifacts | 2 | 15 registered (documented) |
| `docs/platform-facts.md` | Database tables | 906 | 915 |
| `docs/platform-facts.md` | Schema files | 163 | 165 |
| `docs/platform-facts.md` | Domain packages | 77 | 81 |
| `docs/platform-facts.md` | Total packages | 118 | 122 |
| `docs/platform-facts.md` | API route groups | 14 | 268 |
| `docs/platform-facts.md` | RBAC roles | 11 | 12 enum + 4 rolesTable (dual system noted) |
| `docs/PLATFORM_CANONICAL.md` | Session store | "Redis (enterprise production, not yet activated)" | "In-memory (all environments)" |
| `docs/PLATFORM_CANONICAL.md` | RBAC roles | 7 values | Dual system documented |
| `docs/APP_STATUS.md` | Route files | "182 route files" | "382 route files (268 route groups)" |
| `docs/PRODUCT_MATRIX.md` | Platform statuses | All "Live" | "Beta" with disclaimer |
| `docs/platform-facts.md` | Last audit | 2026-04-20 | 2026-04-21 |

### A-04: Missing audit documents created

| Document | Status |
|----------|--------|
| `audit/03-ui-ux-overhaul-decisions.md` | Created — documents all UI/UX design decisions |
| `audit/06-repo-cleanup-report.md` | This document |

---

## Screenshots — Pending

The following screenshot files in `docs/screenshots/` are **stale** and should be replaced by the proof/trust task:

| File | Issue |
|------|-------|
| `docs/screenshots/aegis-marketing.jpg` | Pre-repositioning gaming aesthetic |
| `docs/screenshots/lyte-marketing.jpg` | Pre-repositioning gaming aesthetic |
| `docs/screenshots/lyte-prism-pulse.jpg` | Pre-repositioning gaming aesthetic |
| `docs/screenshots/szl-holdings-home.jpg` | Homepage rebuilt — screenshot outdated |
| `docs/screenshots/terra-marketing.jpg` | Pre-repositioning |
| `docs/screenshots/vessels-dashboard.jpg` | Pre-repositioning |
| `docs/screenshots/aegis-soc-dashboard.jpg` | Pre-repositioning |
| `docs/screenshots/stephen-site.jpg` | Verify still accurate |

**Action required:** Regenerate all screenshots after workflows are started and smoke-tested. Do not replace screenshots here — leave the originals in place until verified replacements are ready (see: proof task).

---

## Blocker Status (Task #2849 Final)

The following blockers from `audit/00-executive-summary.md` were assessed. Status reflects code state as of this task.

| Blocker | Severity | Status | Evidence |
|---------|----------|--------|----------|
| B-01: All workflows NOT STARTED | CRITICAL | Partial — `szl-holdings: web` running. Full matrix requires API server + all artifact workflows. | `szl-holdings: web` workflow active |
| B-02: CORS_ORIGINS enterprise domain | MEDIUM | Deferred — requires custom domain configuration | `app.ts` warns in production if `CORS_ORIGINS` not set |
| B-02a: SUBSTRATE_SIGNING_KEY hardcoded in .replit | HIGH | **Code fix applied** — startup-validation.ts now detects known dev key value and emits hard error in production, warning in dev. Cannot edit .replit (platform restriction), so detection is the code-level mitigation. | `startup-validation.ts` lines 518–530 |
| B-02b: ALLOY_INTERNAL_TOKEN hardcoded | HIGH | **Code fix applied** — same pattern as B-02a. Detection of known dev placeholder with production hard error. | `startup-validation.ts` lines 505–516 |
| B-02c: SUBSTRATE_GATEWAY_API_KEY hardcoded | HIGH | **Code fix applied** — detection of known dev gateway key with production hard error. | `startup-validation.ts` lines 532–544 |
| B-03: No rate limiting on login | HIGH | **ALREADY IMPLEMENTED** — `loginLimiter` (10 req/15min in prod, skipSuccessful) applied to: `/auth/login`, `/auth/login-password`, `/auth/refresh`, `/auth/mfa/challenge`, `/auth/mfa/setup-required`, `/auth/mfa/enable-required`. | `middlewares/rate-limiters.ts` lines 86–121; `routes/auth.ts` lines 202, 349, 651, 833, 957, 1013 |
| B-04: MFA_SECRET_ENCRYPTION_KEY unset | HIGH | **ALREADY ENFORCED** — startup-validation.ts emits hard error in production if key not set or invalid format; warning in dev. Key provisioning requires operator action (generate with `openssl rand -hex 32`). | `startup-validation.ts` lines 570–597 |
| B-05: Dual RBAC role system | HIGH | Documented — code consolidation is a separate task | `platform-facts.md`, `PLATFORM_CANONICAL.md` |
| B-06: Three auth patterns across artifacts | MEDIUM | Documented — consolidation is a separate task | `platform-facts.md` |
| B-07: Cookie secure/sameSite flags | MEDIUM | **ALREADY IMPLEMENTED** — session cookie uses `__Host-sid` prefix (blocks subdomain injection), `httpOnly: true`, `secure: true`, `sameSite: 'lax'`. Both new and legacy cookies cleared on logout. | `lib/auth.ts` lines 30–31, 388–398 |
| B-08: Stripe in test mode | REVENUE | Deferred — requires Stripe production account setup | External dependency |
| B-09: Sentry not configured | MEDIUM | Deferred — requires Sentry DSN provisioning | `startup-validation.ts` warns in production |
| B-10: In-memory session store | MEDIUM | Documented accurately — Redis adapter exists but not activated | `PLATFORM_CANONICAL.md` |

### Additional fixes in this task

| Item | Action |
|------|--------|
| `artifacts/vessels/src/pages/vessels-home.tsx` | Proof strip metric accent colors migrated from raw hex (`#3b82f6`, `#0ea5e9`, `#38bdf8`, `#22d3ee`, `#67e8f9`, `#a5f3fc`) to design token CSS variables (`var(--gi-chart-1)` through `var(--gi-chart-6)`) |
| Lyte primary wedge shell normalization | Verified: `index.css` imports `@szl-holdings/design-system/tokens/css`; App.tsx uses `@szl-holdings/shared-ui/command-palette`, `/sentient-layer`, `/app-mode-banner`. Token layer is in place. Domain amber accent is intentional for authenticated product surface. |
| Vessels secondary wedge shell normalization | Verified: `index.css` imports `@szl-holdings/design-system/tokens/css`. Public-surface proof strip raw hex replaced with token vars. Authenticated data visualization chart colors retained (serve data clarity). |

---

## What Was NOT Cleaned

The following items were assessed and left in place:

- **`docs/`** — The docs directory contains 200+ files. No file was deleted; cleanup is scoped to inaccurate metrics, not file removal. Removing docs requires a separate review.
- **Stale screenshots** — Left in place pending regeneration with post-repositioning visuals.
- **Generated junk in version control** — No build artifacts or generated files were found committed at the root level during this audit pass.

---

*Updated: 2026-04-21 | Task #2849*
