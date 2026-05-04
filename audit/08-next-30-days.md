# SZL Holdings — Next 30 Days

**Audit date:** 2026-04-21  
**Purpose:** Prioritized action list for the next 30 days. Items are sequenced by dependency and impact.

**Truth Label Key (applies to current-state claims in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection  
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked  
- **UNVERIFIED** — asserted but not checked in this audit  
- **BROKEN** — claim is contradicted by primary-source evidence

---

## Week 1 — Start the Platform, Fix Critical Blockers

**Goal:** All workflows running, core blockers resolved, platform demo-able.

| # | Action | Owner | Effort | Priority |
|---|--------|-------|--------|----------|
| 1.1 | `pnpm install && pnpm migrate && pnpm seed` | Engineering | 1 hour | P0 |
| 1.2 | Start all 18 workflows; resolve startup errors | Engineering | 2–4 hours | P0 |
| 1.3 | `pnpm health:check` — verify API health | Engineering | 30 min | P0 |
| 1.4 | Set `MFA_SECRET_ENCRYPTION_KEY` in Replit Secrets | Founder | 15 min | P0 |
| 1.5 | Add rate limiting to `/api/auth/login` | Engineering | 2–4 hours | P0 |
| 1.6 | Correct all contradictory metric claims in docs | Engineering | 2–4 hours | P0 |
| 1.7 | Smoke test OIDC sign-in flow end-to-end | Engineering | 1 hour | P0 |
| 1.8 | Fix PRISM Counsel recovery seed script | Engineering | 2–4 hours | P1 |
| 1.9 | Add enterprise custom domain to `CORS_ORIGINS` in `.replit [userenv.production]` (Replit domains already set) | Founder | 15 min | P2 |
| 1.10 | Configure Sentry (backend + all frontend artifacts) | Engineering | 2–4 hours | P1 |

---

## Week 2 — Auth Hardening, Data Verification

**Goal:** 7 remaining Phase A auth findings resolved; live data sources confirmed.

| # | Action | Owner | Effort | Priority |
|---|--------|-------|--------|----------|
| 2.1 | Confirm cookie `secure`/`httpOnly`/`sameSite` in production | Engineering | 2 hours | P1 |
| 2.2 | Confirm org_id isolation per route (F-05) | Engineering | 1 day | P1 |
| 2.3 | Confirm password reset token is single-use (F-06) | Engineering | 2 hours | P1 |
| 2.4 | Confirm mobile token secure storage (F-07) | Engineering | 2–4 hours | P1 |
| 2.5 | Consolidate dual RBAC role system | Engineering | 1 day | P1 |
| 2.6 | Adopt single auth hook across all artifacts | Engineering | 1–2 days | P1 |
| 2.7 | Verify NOAA/GDELT/Open-Meteo routes return live data | Engineering | 2 hours | P1 |
| 2.8 | Wire Vessels commercial modules to live database | Engineering | 1–2 days | P1 |
| 2.9 | Activate Stripe live mode keys | Founder | 2–4 hours | P1 |
| 2.10 | Activate Redis session store | Engineering | 1 day | P1 |

---

## Week 3 — Positioning & Surface Cleanup

**Goal:** Public surface reflects honest state; investor narrative is clear; junk removed.

| # | Action | Owner | Effort | Priority |
|---|--------|-------|--------|----------|
| 3.1 | Rewrite `szl-holdings` homepage around primary wedge (Alloy governance) | Engineering/Design | 2–3 days | P1 |
| 3.2 | Reduce `szl-holdings` nav to: Platform · How It Works · Proof · Contact | Engineering | 4 hours | P1 |
| 3.3 | Update `PRODUCT_MATRIX.md` with honest lifecycle states | Engineering | 2 hours | P2 |
| 3.4 | Remove contradictory counts from all public surfaces | Engineering | 2–4 hours | P2 |
| 3.5 | Delete `artifacts/firestorm/` and `artifacts/imperium/` | Engineering | 30 min | P2 |
| 3.6 | Move `artifacts/audit/` and `artifacts/internal-audit/` to `ops/` | Engineering | 1 hour | P2 |
| 3.7 | Decide on `artifacts/cortex-mobile/` — scaffold or delete | Founder+Eng | 30 min decision | P2 |
| 3.8 | Decide on `counsel` vs. `prism-counsel` — one canonical legal artifact | Founder+Eng | 30 min decision | P2 |
| 3.9 | Merge Sentra into Aegis as "Mesh Defense" workspace | Engineering | 1 day | P2 |
| 3.10 | Consolidate `/lyte/` into `/command/` (or implement tab redirect) | Engineering | 1–2 days | P2 |

---

## Week 4 — Investor Package & Quality Gate

**Goal:** growth capital investor package ready; CI gate includes integration tests.

| # | Action | Owner | Effort | Priority |
|---|--------|-------|--------|----------|
| 4.1 | Add E2E specs for Pulse, Sentra, Counsel/Lyte (currently zero) | Engineering | 2–3 days | P2 |
| 4.2 | Wire `pnpm test:integration` into CI gate | Engineering | 1 day | P2 |
| 4.3 | Generate updated screenshots for Command and Vessels (primary wedge proof) | Engineering | 2–4 hours | P2 |
| 4.4 | Write investor one-pager anchored on primary wedge | Founder | 1 day | P1 |
| 4.5 | Build Alloy governance demo flow (5-minute walk-through) | Engineering | 2–3 days | P1 |
| 4.6 | Record Vessels intelligence demo (dark vessel + sanctions) | Engineering | 1 day | P2 |
| 4.7 | Update `platform-facts.md` with all corrected counts | Engineering | 1 hour | P2 |
| 4.8 | Verify `launch/01_ability_matrix.json` `live_state` columns backfilled | Engineering | 2–4 hours | P2 |
| 4.9 | Production deploy and smoke test | Engineering | 1 day | P1 |
| 4.10 | Full platform demo run-through — founder + engineering | Both | 2 hours | P1 |

---

## 30-Day Summary Metrics

| Metric | Current State | 30-Day Target | Audit Status |
|--------|--------------|---------------|--------------|
| Workflows running | 0 of 18 | All 18 | **VERIFIED** — system log: 18 workflows NOT STARTED |
| Open auth findings | 9 | 0 | **PARTIALLY VERIFIED** — findings from Phase A review; runtime behavior unverified |
| Contradictory metric claims | 14 | 0 | **VERIFIED** — catalogued in `audit/public-surface-cleanup.md` |
| Artifacts with zero E2E tests | 6 | 2 | **PARTIALLY VERIFIED** — based on code scan; not run in this session |
| Stripe mode | Test | Live | **VERIFIED** — `STRIPE_SECRET_KEY` (test mode prefix confirmed) |
| Sentry configured | No | Yes | **PARTIALLY VERIFIED** — DSN env var not found; SDK init not confirmed |
| Integration tests in CI | No | Yes | **PARTIALLY VERIFIED** — CI config present; integration test gate absent |
| Investor narrative (single wedge) | No | Yes | **VERIFIED** — contradictory platform narratives confirmed across docs |
| Platform demo ready | No | Yes | **VERIFIED** — 0 workflows running; no demo possible |

---

## What Is NOT in the Next 30 Days

Items explicitly deferred (see individual audit files):

- OTel / distributed tracing (Q3 2026)
- Agent eval infrastructure (Q3 2026; growth capital hire)
- Azure Bicep production deployment (pre-revenue; deferred)
- National expansion (Terra) — roadmap
- CORTEX deep linking for push notifications — backlog
- StateRAMP certification — roadmap

---

## Decision Required from Founder (This Week)

These decisions require founder input before engineering can proceed:

1. **`artifacts/cortex-mobile/` — scaffold as CORTEX Mobile or delete?** Engineering recommends: rename existing `szl-holdings-mobile` as CORTEX Mobile and delete the `cortex-mobile/` stub.
2. **`counsel` vs. `prism-counsel` — which is the canonical legal artifact?** Engineering recommends: `counsel` as the canonical path; deregister and archive `prism-counsel` (which is already marked Archived in `APP_STATUS.md`).
3. **AIS data disclosure — acknowledge simulated or invest in live AIS feed?** Engineering recommends: disclose honestly in all surfaces ("AIS data is simulated; route planning and compliance data are real"). Live AIS requires MarineTraffic/AISHub subscription.
4. **Stripe live mode — confirm you are ready to accept first payment?** Requires configuring live keys; hours of work once decided.
