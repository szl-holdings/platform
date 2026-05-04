# Final Detailed Report — growth capital Hardening
## SZL Holdings Platform — Phase-by-Phase Coverage

**Date:** 2026-04-21  
**Phases covered:** A (Inventory & Security Baseline), B (Code Quality & Database), D (Public GitHub & Investor Readiness), 8 (Functional & Accessibility Testing), 9 (Security Hardening & Sign-On Consolidation), 10 (AI Architecture Review), Design System Reset, and supporting phases.  
**Audience:** Internal engineering leadership, technical due diligence reviewers  
**Status:** All phases complete. Manual checklist items remain — see `audit/FINAL_ACTION_CHECKLIST.md`.

---

## Phase A — Inventory & Security Baseline

**Report:** `audit/phase-a-report.md`  
**Date:** 2026-04-20  
**Status:** Complete

### What Was Done

**Inventory generation:** Five machine-readable inventory files at `audit/inventory/`:
- `files.json` — 7,584 tracked files by extension and top-level directory
- `packages.json` — 142 `package.json` files across the monorepo
- `routes.json` — 3,243 Express route registrations extracted from route files
- `env-usage.json` — 237 `process.env.*` + 19 `import.meta.env.*` variables
- `media.json` — 687 media files totaling 155.8 MB

**Junk removal:** `nohup.out` deleted. Five root-level zip archives quarantined to `archive/phase-a/`. `.gitignore` updated with `*.log` and explicit zip filename entries.

**Secrets scan:** `scripts/qa/scan-secrets.js` + `.gitleaks.toml`. Result: 0 true positives, 1 false positive (`AKIAIOSFODNN7EXAMPLE` in `.gitleaks.toml` — AWS docs canonical example). **No live credentials committed.**

**Bootstrap admin:** `scripts/seed-bootstrap-admin.ts` created — env-driven, idempotent, PBKDF2-SHA512 hashing, no credential logging. Documented in `docs/BOOTSTRAP_ADMIN.md`.

**Required secrets provisioned:** `BOOTSTRAP_ADMIN_*`, `JWT_SECRET`, `ENCRYPTION_KEY` — all confirmed in Replit Secrets.

**Auth review:** 7 findings documented in `audit/security/auth-review.md` — all deferred to Phase B for remediation.

**Repo policy files:** All required `.github/` files present and current: `ci.yml`, `codeql.yml`, `dependabot.yml`, `PULL_REQUEST_TEMPLATE.md`, issue templates, `CODEOWNERS`, `SECURITY.md`.

**Deferred:** `deliverables/`, `output/`, `screenshots/` review deferred to Phase D. Full git history scan deferred to Phase D.

---

## Phase B — Code Quality & Database Audit

**Report:** `audit/phase-b-report.md`  
**Date:** 2026-04-20  
**Status:** Complete

### TypeScript Hardening

`tsconfig.base.json` was already at maximum TypeScript strictness — no further flag tightening possible. Targeted packages repaired:

| Package | Issue | Fix |
|---------|-------|-----|
| `apps/alloy-embedding-api` | Unmatched `(async` parens (8 files) + missing `boostApplied` fields | Closed handlers; added missing fields |
| `packages/alloy` | 6 `exactOptionalPropertyTypes` violations | Conditional spread pattern applied |
| `packages/szl-alloy` | 6 `exactOptionalPropertyTypes` violations | Conditional spread; added `retries: 0` |
| `packages/db-repository` | Table/column name drift from ORM schema | References updated to canonical Drizzle schema names |
| `apps/demo-seed` | Signal type enum values, table references | Updated to match current ORM schema |

All targeted packages now pass typecheck with zero errors.

**Lint:** 10,348 Biome warnings (all `warn`-level). Dominated by `noExplicitAny` in generated/adapter code. No blocking issues.

### Database Audit

Four audit documents written:

**`audit/db/schema-audit.md`** — 168 schema files, ~24,163 lines. Key findings:
- Two overlapping org membership tables (`org_members` vs `organization_memberships`) — **flagged for human review**
- `audit_logs` lacks FK from `tenantId` to `organizations` — recommendation only
- 14 tables with nullable `createdAt`/`updatedAt` — safe migration written for 8 lowest-risk tables
- Soft-delete inconsistency — standardize on `deletedAt` pattern recommended

**`audit/db/index-audit.md`** — Key findings:
- 12 FK columns with no supporting index — 9 added in migration `0021`
- 3 duplicate indexes — **flagged for human review** (confirm no app reads by name)
- `cognitive_skill_runs.tenant_id` and `evidence_ledger_entries.(tenant_id, requested_at)` composite — added in `0021`

**`audit/db/redundancy-audit.md`** — Key finding:
- `user_profiles` + `users` + `clerk_users` triple user representation — **flagged for human review**

**`audit/db/migration-drift.md`** — No silent drift between `drizzle-kit` snapshot and ORM schema.

**Migration `0021_phase_b_missing_indexes.sql`:** 9 missing FK/filter indexes, `IF NOT EXISTS` guards, non-destructive. Safe for zero-downtime application. **Not yet applied.**

```
pnpm --filter=@workspace/db run migrate
```

### Code Audit Documents

- `audit/code/dead-code-report.md`
- `audit/code/redundancy-report.md`
- `audit/code/dependency-cleanup.md`
- `audit/code/type-debt.md`

See `audit/FINAL_EXEC_SUMMARY.md` §5 for headline findings.

---

## Phase 9 — Security Hardening & Sign-On Consolidation

**Auth review:** `audit/security/auth-review.md` (updated with Phase 9 findings)  
**Auth surface map:** `audit/auth/auth-surface-map.md`  
**Consolidation plan:** `audit/auth/sign-on-consolidation-plan.md`  
**CI security review:** `audit/security/ci-security-review.md`  
**Date:** 2026-04-20  
**Status:** Complete

### Auth Package Consolidation

`packages/auth-shared` created as the single source of truth for all auth primitives:
- Platform role hierarchy (14 roles as `const`)
- Session token generation (`randomBytes(32)` → 64-char hex) and `__Host-sid` cookie options
- CSRF double-submit pattern (server + client helpers)
- RBAC predicates (`checkRole`, `checkNotReadOnly`, `checkOrgMembership`) — all pure functions
- Mobile PKCE helpers and `TokenStore` interface

All web artifacts authenticate exclusively through `artifacts/api-server`. No per-artifact session stores.

### All 7 Phase A Findings Resolved

| ID | Resolution |
|----|-----------|
| F-01 | `loginLimiter` — 10/15min per IP, `skipSuccessfulRequests: true`, returns `429 RATE_LIMITED` + `Retry-After` |
| F-02 | `MFA_SECRET_ENCRYPTION_KEY` enforced at startup via `failFastOnInvalidConfig()`; fatal in production |
| F-03 | `__Host-sid` prefix enforces `Secure`, `httpOnly`, `sameSite=lax`, `Path=/` — browser-enforced |
| F-04 | `user_roles` (join table) authoritative for all `authMiddleware()` routes; `platform_role` authoritative for `platform-auth.ts`; synced transactionally |
| F-05 | Tenant scope audit (Task 2635) complete — 148 group-prefix surfaces enforce `tenantScope({ required: true })`; intentional exceptions documented |
| F-06 | Password reset token cleared atomically in same UPDATE that writes new hash; lookup filters on `IS NOT NULL` and `> NOW()` |
| F-07 | `expo-secure-store` confirmed in `AuthContext.tsx`; `localStorage` fallback only on `Platform.OS === "web"` |

### Unified Auth Verification Checklist (15/15 confirmed)

All items in `audit/auth/sign-on-consolidation-plan.md` §9 confirmed. Highlights:
- Bootstrap admin `stephenlutar` can sign in on web and mobile
- Logout: `DELETE /api/auth/sessions/current` clears DB session + `__Host-sid` cookie
- Password change: `session_version` incremented — all existing sessions invalidated
- Refresh token replay: all sessions revoked; `401 REFRESH_TOKEN_REPLAY` returned
- Internal tokens: `ops` role only (GAP-016 confirmed)

### CI Security Hardening

From `audit/security/ci-security-review.md`:
- All third-party GitHub Actions pinned to full commit SHAs
- `ci-gate` requires 10 independent jobs including secret scan and route security matrix
- Gitleaks on PR diff + daily full-history scheduled scan
- CodeQL SAST on PR/push/weekly
- `pnpm audit` + GitHub Dependency Review block new vulnerable packages

**Remaining low-severity items:**
- P9-01: OIDC route should return 404 when not configured
- P9-02: `DevAuthProvider` should be gated in startup validation explicitly
- P9-04: Clerk placeholder in `.env.example` creates provider ambiguity

---

## Phase D — Public GitHub & Investor Readiness

**Report:** `audit/phase-d-report.md`  
**Date:** 2026-04-20  
**Status:** Complete

### GitHub Changes Applied

Via GitHub API (GitHub integration):
- **Repo topics:** Updated from 8 → 15 topics (added `pnpm`, `drizzle-orm`, `expo`, `react-native`, `maritime`, `real-estate`, `cybersecurity`)
- **Org profile README:** PRISM Counsel and IMPERIUM marked `[archived]`; product gallery corrected. Commit `5ea21216` pushed.
- **Main README Screens section:** 2 archived product screenshots removed; 6 active products remain

### Claim Normalization

| File | Change |
|------|--------|
| `profile-readme/README.md` | "16-artifact monorepo" → "11-artifact registered monorepo" |
| `.github/profile/README.md` | "All 8 domain workspaces" → "All active domain workspaces" |
| `README.md` | Screens section reduced from 7 to 6 screenshots |

### Media Cleanup

- 6 non-image files deleted from `screenshots/` (scripts, PDFs, archives)
- 4 subdirectories quarantined to `archive/phase-d-media/` for human review:
  - `screenshots/raw/` → `archive/phase-d-media/screenshots-raw/` (28 files)
  - `screenshots/working/` → `archive/phase-d-media/screenshots-working/` (23 files)
  - `screenshots/new/` → `archive/phase-d-media/screenshots-new/` (14 files)
  - `screenshots/stephen/` → `archive/phase-d-media/stephen-personal/`

### Investor Readiness Scorecard

**8/10 categories pass, 2 cautions, 0 critical gaps.** Full scorecard: `audit/investor/public-readiness-scorecard.md`.

Two cautions:
1. Screenshot verification — not confirmed as live captures; regeneration recommended
2. Org profile coherence — PRISM Counsel/IMPERIUM marked archived in org profile; user profile README pending

### Audit Documents Produced (Phase D)

| Document | Path |
|----------|------|
| Public/Private Boundary | `audit/github/public-private-boundary.md` |
| Public Repo Recommendations | `audit/github/public-repo-recommendations.md` |
| Archive Candidates | `audit/github/archive-candidates.md` |
| Pin Recommendations | `audit/github/pin-recommendations.md` |
| Media Review | `audit/media/media-review.md` |
| Public Screenshot Manifest | `audit/media/public-screenshot-manifest.json` |
| Investor Executive Summary | `audit/investor/executive-summary.md` |
| Risk Register | `audit/investor/risk-register.md` |
| Manual Next Steps | `audit/investor/manual-next-steps.md` |
| Public Readiness Scorecard | `audit/investor/public-readiness-scorecard.md` |

**GitHub Release:** `v1.0.0-alpha` published (Task #2701). Release notes cover active artifact count (14), six platform primitives, key milestones, and known limitations. CHANGELOG.md updated. `release.yml` workflow present and wired.

### Items Deferred to Human Approval

| Item | Document |
|------|---------|
| Pin repos on org profile | `audit/github/pin-recommendations.md` — requires `admin:org` scope |
| Create `v1.0.0-alpha` GitHub release | DONE — Task #2701 |
| Move `demo-assets/szl-holdings-investor-carousel.pdf` to private | `audit/media/media-review.md` |
| Regenerate screenshots | `audit/media/public-screenshot-manifest.json` |
| Create `szl-holdings/investor-materials` private repo | `audit/github/public-private-boundary.md` |

---

## Phase 8 — Functional, Mobile & Accessibility Testing

**Test summary:** `audit/tests/test-summary.md`  
**App-by-app status:** `audit/tests/app-by-app-status.md`  
**Smoke report:** `audit/tests/smoke-report.md`  
**Date:** 2026-04-21  
**Status:** Complete — spec coverage authored for all surfaces; execution partial due to infrastructure blockers

### Test Results

| Layer | Tests | This Session |
|-------|-------|-------------|
| Component tests (vitest, happy-dom) | 78 | **78/78 pass** ✅ |
| Mobile logic tests (Jest) | 114 | **114/114 pass** ✅ |
| API integration tests (~1,168 tests, 18 files) | ~1,168 | Phase 7 confirmed pass; blocked this session (DB migration) |
| E2E — SZL Holdings | 39 | 26+ pass (timeout cut suite) |
| E2E — Aegis | 21 | 16+ pass (timeout cut suite) |
| E2E — Lyte | 21 | 14 pass, 4 fail (F-019, F-020) |
| E2E — Counsel, Vessels, Terra, Carlota Jo | Authored | Spec verified to compile; execution blocked by resource exhaustion |

**Component test coverage:** API client, command palette, constellation graph, decision engine, ecosystem nav, Monte Carlo modeling, PowerBI embed, user button, utilities.

**Mobile logic test coverage:** Alert center, approval inbox, cognitive runtime transitions, executive briefing transformation, run review state, quick-action security gate.

### Accessibility Testing

axe-core added to Playwright specs for: SZL Holdings, Sentra, Pulse, Vessels, Terra. Sentra violations documented (hydration race prevents full axe run).

### Infrastructure Blockers (Pre-existing, Not Introduced by Hardening)

| ID | Blocker | Impact |
|----|---------|--------|
| F-001 | `react-native-worklets-core` unresolvable — Expo Metro won't start | Mobile e2e blocked |
| F-003/F-004 | DB migration failures inflate API server error count | Integration tests blocked in this session |
| F-005 | Command workflow fails to open port 9090 | Command e2e blocked |
| F-021 | Auth route-mocking against live proxy intercepts don't suppress login wall | Auth e2e partial |
| F-022/F-023 | Pulse/Sentra React hydration race at `networkidle` on Vite dev server | Title/branding assertions fail |
| F-026 | Pre-existing persistence test failures (atlas-execution, guardian-tool-mesh, etc.) | Internal API suite |

### New Specs Authored This Phase

`tests/e2e/szl-demo-video.spec.ts`, `tests/e2e/nexus-sandbox.spec.ts`, expanded Vessels, Terra, Pulse specs with user journeys, mobile viewports, and axe-core.

---

## Design System Reset

**Report:** `audit/design/design-system-audit.md`  
**Style debt:** `audit/design/style-debt-report.md`  
**Component normalization:** `audit/design/component-normalization.md`  
**Status:** Complete

### Token System

`@szl-holdings/design-system` is the single source of truth for all visual tokens. New additions this reset: `gi-tokens.css` static export, `./tokens/css` package export subpath, `./data` component subpath exports (StatusBadge, MetricStat, DataGrid, FilterBar). `productAccent` map is now complete for all 10 products.

### Changes Applied

| Change | Scope |
|--------|-------|
| Radius scale corrected | All 10 web artifacts (was 2× inflated) |
| Motion budget enforced | Infinite animations removed; max 350ms everywhere except Carlota Jo (500ms editorial) |
| Neon palette removed | Aegis, Sentra, Counsel, Vessels, Lyte — replaced with canonical accents |
| Glow decorations removed | SZL Holdings depth glow radials and card hover glows |
| StatusBadge migrated | 8 per-app badge implementations replaced with canonical `StatusBadge` |
| Mobile token bridge | `gi-bridge.ts` wires design-system tokens to React Native |

All 11 artifacts (10 web + mobile) pass the token adoption checklist: GI CSS vars ✅, normalized radius ✅, capped motion ✅, canonical accent ✅.

---

## Phase 10 — AI Architecture Review

**Agent architecture:** `audit/ai/agent-architecture-review.md`  
**Guardrail review:** `audit/ai/guardrail-review.md`  
**Tool contracts:** `audit/ai/tool-contract-review.md`  
**Observability:** `audit/ai/observability-review.md`  
**Evolution roadmap:** `audit/ai/evolution-roadmap.md`  
**Date:** 2026-04-20  
**Status:** Complete

### Seven-Layer Stack

| Layer | Package(s) | Status | Key Gaps |
|-------|-----------|--------|----------|
| 1 — Planner | `packages/planner` | Implemented | Step inputs unvalidated; hardcoded risk on "Act" step |
| 2 — Tool Router | `packages/tool-mesh`, `packages/ai-control-plane` | Implemented | Output schema not validated; rate limiter is process-local |
| 3 — Context / Memory | `packages/memory-fabric`, `packages/memory-core` | Implemented | Eviction not scheduled; in-memory growth unbounded; PostgresStore not wired for hydration |
| 4 — Policy / Guardrails | `packages/policy-engine`, `packages/guardian` | Implemented | **Split evaluation paths** — P0 gap |
| 5 — Execution | `packages/agents-core`, `packages/cognitive-runtime` | Implemented | Parallel step execution not supported |
| 6 — Verification | `packages/verifier`, `packages/evidence-ledger` | Implemented | **Evidence ledger in-memory only** — P0 gap |
| 7 — Observability | `packages/cognitive-observability`, `packages/run-ledger` | Implemented | BatchingExporter never auto-started |

### Canonical Event Chain (INGEST → DELIVER)

All 9 stages implemented. AUDIT stage is partial — `run-ledger` is Postgres-backed but `evidence-ledger` remains in-memory only.

### Guardrail Architecture

| Guardrail | Coverage |
|-----------|----------|
| PII redaction (11 pattern types) | ✅ Active |
| Agent-tier capability checking | ✅ Active |
| Policy engine (4 built-in guards) | ✅ Active |
| Guardian secondary engine | ✅ Active (toggleable) |
| Approval gate with timeout enforcement | ✅ Active |
| `restricted` memory in external prompts | ❌ Gap — no runtime enforcement |
| Cross-domain memory isolation | ❌ Gap — no runtime enforcement |
| `guardianEnabled: false` in production | ❌ Gap — no prohibition |

**Critical confirmed property:** No high-risk action can execute without an approval gate verdict. No silent irreversible automation exists.

### Priority Remediation

| Priority | Gap | Action |
|----------|-----|--------|
| P0 | Split policy paths | Introduce single `evaluateFull()` facade |
| P0 | Evidence ledger in-memory | Persist to Postgres (same pattern as `RunLedgerStore`) |
| P1 | Output schema not validated | Add `outputSchema` to `ToolManifest` |
| P1 | Memory eviction not scheduled | Schedule `evictExpired()` on background timer |
| P1 | Observability export not wired | Auto-flush `globalCollector` on periodic interval |

---

## Security — Dependency & License Analysis

**Vulnerability report:** `security/vuln-report.md`  
**License report:** `security/license-report.md`  
**Secret audit:** `security/secret-audit.md`  
**SBOM history:** `security/sbom-history/`

### Vulnerability Posture

`pnpm audit` across 2,372 dependencies:
- Critical: 0
- High: 0
- Moderate: 0
- Low: 0

Active `pnpm.overrides` pin: `path-to-regexp@8.4.2`, `brace-expansion@2.1.0`, `vite@7.3.2`, `lodash@4.18.1`, and others for known transitive vulnerability resolution.

### License Compliance

- 1,785 permissive (OK)
- 10 copyleft requiring review: `@axe-core/playwright` (MPL-2.0), `@react-leaflet/core` (Hippocratic-2.1), `react-leaflet` (Hippocratic-2.1), `dompurify` (MPL-2.0 OR Apache-2.0, elect permissive), others
- 13 unknown/non-standard: `@replit/*` plugins, `gsap`, `mapbox-gl`, `posthog-js`, others

**Action:** Elect permissive option for all dual-licensed packages. Confirm Hippocratic-2.1 commercial use compliance for `@react-leaflet/core` and `react-leaflet`. Verify license terms for unknown-category packages before commercial distribution.

---

## Summary: Items Requiring Human Action

All items that cannot be automated from inside the repository are captured in `audit/FINAL_ACTION_CHECKLIST.md`. Key categories:

1. **GitHub branch protection and ruleset verification** — cannot be confirmed via code; requires org admin access
2. **GitHub secret scanning and push protection** — must be verified in GitHub Security settings
3. **Org profile pin and coherence check** — requires `admin:org` GitHub scope
4. **Replit deployment secrets** — must be verified in Replit Secrets panel
5. **Custom domain and SSL verification** — requires domain registrar + GitHub org settings access
6. **Database migration `0021` application** — human approval required before any production migration
7. **Screenshot regeneration** — requires all workflows running simultaneously
8. **Investor carousel PDF migration to private channel** — human decision required
9. **CodeQL and Dependabot alert review** — requires GitHub Security tab access
10. **Release cadence establishment** — follow-up after `v1.0.0-alpha`

---

*For the concise leadership-level summary, see `audit/FINAL_EXEC_SUMMARY.md`.*  
*For the complete manual checklist with verification steps, see `audit/FINAL_ACTION_CHECKLIST.md`.*  
*For the risk register, see `audit/investor/risk-register.md`.*
