# Release Intelligence — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** Engineering lead, product, operations

**Related:** [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) · [RELEASE_PROCESS.md](RELEASE_PROCESS.md) · [ROLLBACK_PLAYBOOK.md](ROLLBACK_PLAYBOOK.md) · [ENVIRONMENT_VALIDATION.md](ENVIRONMENT_VALIDATION.md)

---

## Purpose

This document defines the staged rollout model, feature flag / kill switch approach, environment promotion gates, and post-release monitoring specification for the SZL Holdings platform. It governs how every release moves from development to production safely.

---

## Staged Rollout Model

All production releases for user-facing features follow a staged rollout. Skipping stages requires explicit approval from the Engineering Lead.

### Stage 0 — Internal (5% — SZL team only)

**Target:** SZL team accounts only
**Duration:** 24 hours minimum
**Success criteria:**
- Zero new error events in Sentry
- P95 latency unchanged (< 2s)
- No user-reported issues from team
- Health check returns 200

**Gate to next stage:** Engineering lead approval after 24-hour clean window

---

### Stage 1 — Beta Cohort (10–15%)

**Target:** Design partner orgs + opted-in pilot customers
**Duration:** 48 hours minimum
**Success criteria:**
- Error rate < 0.5% (baseline) on affected routes
- No SEV1 or SEV2 incidents
- Positive or neutral feedback from design partners
- North Star metric unaffected or improving

**Gate to next stage:** Product + Engineering joint sign-off

---

### Stage 2 — Gradual Expansion (25%)

**Target:** Random 25% of active tenants
**Duration:** 72 hours
**Success criteria:**
- All Stage 1 criteria maintained
- No support volume spike (< 2x baseline)
- Conversion/retention metrics unchanged

**Gate to next stage:** Metrics review; no regression on executive scorecard KPIs

---

### Stage 3 — Majority (50%)

**Target:** 50% of active tenants
**Duration:** 48 hours
**Success criteria:**
- All prior criteria maintained
- Full alert monitoring operational

**Gate to full rollout:** Product + Founder sign-off

---

### Stage 4 — Full Rollout (100%)

**Target:** All tenants
**Action:** Remove feature flag once stable for 48 hours at 100%
**Documentation:** Update CHANGELOG; schedule flag cleanup sprint ticket

---

## Feature Flag / Kill Switch Approach

### Flag Types in Use

| Type | Purpose | Default | Permanence |
|------|---------|---------|-----------|
| `release_flag` | Control new feature visibility during staged rollout | `false` | Temporary — remove after 100% rollout + 48h stable |
| `kill_switch` | Emergency disable of a live feature | `true` (feature ON) | Semi-permanent — reviewed monthly |
| `experiment_flag` | A/B test a variant | variable | Temporary — remove after experiment concludes |
| `ops_flag` | System-level operational control | varies | Permanent — quarterly review required |
| `beta_access` | Restrict to beta cohort | `false` | Temporary — promote or remove at GA |

### Kill Switch Protocol

Kill switches are inverted flags — setting them to `false` disables the feature immediately across 100% of tenants. Every major user-facing feature must have a kill switch before launch.

**Activation procedure:**
1. Engineering lead sets kill switch flag to `false` in the flag service
2. Verify feature is disabled within 60 seconds (no config cache lag)
3. Notify on-call team and Product
4. File SEV2+ incident if kill switch was triggered by a production issue
5. Do not re-enable without a documented root cause and fix

### Flag Registry

All flags are registered in the flag service (target path: `lib/feature-flags/` — to be created as part of flag service implementation) with required metadata:
- `flagKey` — unique kebab-case identifier
- `type` — one of the types above
- `owner` — engineer responsible for cleanup
- `expiresAt` — planned removal date
- `linkedTo` — release or experiment ID

### Flag Cleanup

Flags older than 90 days with rollout at 100% are considered stale. The monthly flag audit (first Monday of each month) reviews all flags for cleanup eligibility.

---

## Environment Validation Gates

Every release must pass environment validation before promotion. See [ENVIRONMENT_VALIDATION.md](ENVIRONMENT_VALIDATION.md) for the full checklist.

### Promotion Path

```
Feature Branch
      │
      ▼ (CI gates pass)
Development (Replit workspace)
      │
      ▼ (Smoke tests pass + ENVIRONMENT_VALIDATION.md Stage 1)
Staging / Demo (Replit published)
      │
      ▼ (Full pre-deploy checklist + ENVIRONMENT_VALIDATION.md Stage 2)
Production (Azure App Service)
      │
      ▼ (Stage 0 → Stage 1 → Stage 2 → Stage 3 → Stage 4)
Full Production Rollout
```

### CI Gates (Block promotion on failure)

| Gate | Command | Blocks On |
|------|---------|-----------|
| Security audit | `pnpm audit --audit-level high` | High/Critical CVEs |
| Secret scan | automated | Any credential pattern detected |
| Type check | `pnpm typecheck` | Any TypeScript error |
| Lint | `pnpm lint` | Any ESLint error |
| Build | `pnpm -r build` | Build failure in any artifact |
| Smoke routes | `node scripts/qa/smoke-routes.js` | Any route returning non-200 |

---

## Post-Release Monitoring Specification

### Immediate (0–30 minutes post-deploy)

Monitor continuously. Rollback if any threshold is breached.

| Signal | Threshold | Action |
|--------|-----------|--------|
| `/api/health` status | Must return 200 | Immediate rollback if degraded |
| Error rate (5-min window) | < 1% | Investigate; rollback if > 2% |
| P95 response latency | < 2.5s | Investigate if above; rollback if > 5s |
| Failed authentication events | < 5 / minute | Investigate |
| Database connection errors | 0 | Immediate investigation |

**Who watches:** On-call engineer (required to be available for 60 minutes post-deploy)

### Short-term (1–24 hours post-deploy)

| Signal | What to check | Cadence |
|--------|--------------|---------|
| Sentry error volume | No new error classes introduced | Every hour |
| Support ticket volume | No spike vs. baseline | Every 4 hours |
| AI recommendation quality | Pass rate ≥ baseline | Every 4 hours |
| North Star metric | No regression | End of business day |

### Extended (Day 2–7)

| Signal | What to check | Cadence |
|--------|--------------|---------|
| Activation rate | First governed decision ≤ 72h of new tenant signup | Daily |
| Retention (D7) | Active users on day 7 ≥ 60% of activated users | End of week |
| Error rate trending | Should be < 0.5% in steady state | Daily |
| Flag health | No flags stuck at intermediate rollout % | Daily |

### Post-Release Review

Required for all Minor and Major releases within 72 hours of full rollout:
- What was released
- Metrics before/after comparison
- Any incidents during rollout
- Flag cleanup tickets filed
- Lessons learned

Template: `docs/reports/elite/release/post-launch-review-system.md`

---

## Release Intelligence Dashboard (Planned)

When implemented, the Release Intelligence dashboard will show:
- Active rollouts and current stage
- Per-stage health signal summary
- Flag registry with expiry dates
- Recent post-release review scores
- MTTRecovery trend

Until implemented: use this document + Sentry + `/api/health/detailed` as the primary signals.

---

*Last updated: 2026-04-16*
