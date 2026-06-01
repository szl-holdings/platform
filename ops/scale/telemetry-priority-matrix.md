# Telemetry Priority Matrix

Phase C · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Prioritize the telemetry signals that justify a page, that justify a
look, and that can wait for the weekly review. Built on
`ops/observability/otel-plan.md` and the ATLAS event taxonomy in
`packages/atlas-events`.

## Tier Definitions

| Tier | Action | SLO Coupling |
|------|--------|--------------|
| **Tier 1** | Pages on breach | Coupled to a stated SLO; breach is an incident |
| **Tier 2** | Slack notification on breach; founder reviews same day | Health indicator; trends matter |
| **Tier 3** | Dashboard only; reviewed weekly | Diagnostic; no action triggered |

Founder-stage rule: keep Tier 1 short. Every additional Tier 1 alarm
that is not actionable degrades the value of every other Tier 1 alarm.

---

## Tier 1 — Page (max 12)

These are the only signals that wake the founder.

| # | Signal | Source | SLO |
|---|--------|--------|-----|
| 1 | API healthcheck failing | `/api/health/detailed` | 99.9% over 30 days |
| 2 | DB unreachable from API | `/api/health/detailed` `db.ok` | 99.95% |
| 3 | Auth login success rate | Clerk + API session route | ≥99% over rolling 5 min |
| 4 | Audit log write failures | `lib/audit` middleware | 0 failures permitted |
| 5 | Cross-tenant data leak signal | Anomaly detector on `callerOrgIds` checks | 0 |
| 6 | Production deploy smoke test failure | Post-deploy job | Block release |
| 7 | Field-encryption decrypt error rate | `lib/services` field decrypt path | 0 |
| 8 | ATLAS event envelope rejection rate | `packages/atlas-events` strict-mode reject counter | <0.01% |
| 9 | Production env-registry missing required var | `/api/env-registry` daily probe | 0 |
| 10 | Stripe webhook signature failure | `artifacts/api-server/src/routes/billing.ts` | 0 |
| 11 | Pager channel itself unreachable | Self-test on pager | Self-test daily |
| 12 | Mobile crash-on-launch rate (CORTEX) | Sentry once enabled per testflight runbook | <1% of sessions |

If a 13th Tier 1 alarm is proposed, an existing Tier 1 alarm must be
demoted or retired first.

---

## Tier 2 — Slack notify, same-day founder review

| # | Signal | Source |
|---|--------|--------|
| 13 | API p95 latency over baseline +50% | OpenTelemetry per `ops/observability/otel-plan.md` |
| 14 | AI provider error rate >5% over 15 min | Provider-tagged spans |
| 15 | Per-route 5xx rate elevated | Per-route metrics |
| 16 | Per-tenant active-user drop >50% day-over-day | Tenant analytics |
| 17 | Push notification delivery failure rate >5% | `web-push-sender` metrics |
| 18 | Background job failure rate >2% | Workflow engine metrics |
| 19 | Disk / DB connection pool >80% saturation | Replit infra metrics |
| 20 | Demo seed run on a non-dev tier | Audit signal — should be impossible |
| 21 | New unknown event name appearing in non-strict mode | ATLAS event taxonomy drift |
| 22 | Smoke test on Staging failed (not a deploy block but a signal) | CI |

---

## Tier 3 — Dashboard, weekly review

| # | Signal | Use |
|---|--------|-----|
| 23 | Daily active workspaces by domain | Adoption tracking |
| 24 | Top routes by request volume | Capacity planning |
| 25 | Top routes by p99 latency | Performance backlog |
| 26 | Audit log volume per tenant | Anomaly baseline |
| 27 | RBAC denial rate per role | Onboarding gap detection |
| 28 | AI tokens consumed per provider | Cost tracking |
| 29 | Cold-start frequency on Autoscale | Replit Autoscale tuning |
| 30 | Lighthouse perf scores per artifact | UX trend |
| 31 | E2E test flake rate | Test-suite health |
| 32 | Drift between schema files and actual DB tables | Schema-health drift |

---

## Implementation Status (Honest)

| Status | Items |
|--------|-------|
| Already wired in repo | API healthcheck, env-registry probe, Pino structured logs, audit middleware, ATLAS strict-mode |
| Defined but not yet alarming | OpenTelemetry plan items in `ops/observability/otel-plan.md` |
| Pending operator action | Pager channel, Sentry for mobile, on-call rotation — see `manual-actions-left.md` |

The honest readout: Tier 3 is mostly available; Tier 2 partially
available; Tier 1 actionability requires the pager channel to exist.
Until the pager channel is stood up, "page" means "send to founder
phone via the documented backup path in `customer-launch-pack.md`."

## Review Cadence

- Tier 1 list reviewed monthly by the founder
- Tier 2 list reviewed quarterly
- Tier 3 dashboard reviewed weekly during founder operating rhythm
  (see `founder-operating-rhythm.md`)

## Anti-Patterns

- Adding a Tier 1 alarm without retiring one — leads to alert fatigue
- Pages for non-actionable signals — train the founder to ignore the pager
- Hidden alarms (alarms that exist in code but no one knows about) —
  every alarm must appear in this matrix
