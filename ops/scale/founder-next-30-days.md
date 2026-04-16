# Founder — Next 30 Days

Phase J · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The founder's prioritized 30-day action list immediately following this
pass. Every item maps to a specific doc in `/ops/scale/`. Sequence
matters; dependencies are noted.

## North Star for the Next 30 Days

Get one paying enterprise customer to live on Production, with the
operational backbone running, in a way that survives founder
distraction.

## Week 1 — Production Foundation

**Goal:** Production cutover completed, smoke tests passing.

| Day | Action | Reference |
|-----|--------|-----------|
| Mon | Complete CI / GitHub Secrets (🔴 in `manual-actions-left.md`) | `manual-console-actions-master.md` |
| Mon | Open Replit Production + Staging deployment slots | `production-cutover-checklist.md` Phase 0 |
| Tue | Generate and set ALL Production Secrets (Phase 1) | `production-cutover-checklist.md` |
| Tue | Provision Production PostgreSQL; run migrations; verify table count | Same |
| Wed | First Staging deploy via `deploy-staging.yml`; verify smoke pass | `staging-and-prod-smoke-tests.md` |
| Thu | Stand up pager channel; wire Tier 1 alarms | `telemetry-priority-matrix.md` |
| Fri | First Production deploy (no tenants yet); run production smoke tests | `production-cutover-checklist.md` Phase 6 |

**End-of-week verdict:** Production exists, is empty, is healthy, is
monitored.

## Week 2 — First Tenant Live

**Goal:** First paying tenant or highest-intent design partner running
on Production.

| Day | Action | Reference |
|-----|--------|-----------|
| Mon | Identify the tenant (paying or convertible design partner) | `founder-pipeline-dashboard-spec.md` |
| Mon | Confirm DPA + MSA + Order Form signed | `enterprise-evaluation-flow.md` |
| Tue | Provision tenant via authenticated API | `manual-console-actions-master.md` T1–T6 |
| Tue | Send `customer-launch-pack.md` link; open Slack Connect channel | `customer-launch-pack.md` |
| Wed | Day-1 kickoff; capture commitments | `partner-first-14-days.md` |
| Thu–Fri | Data load + workflow walkthrough | Same |

**End-of-week verdict:** First tenant logged in, used the system once
end-to-end, and the founder watched telemetry through it.

## Week 3 — Discipline + Mobile Bridge

**Goal:** Operating cadence locked in; mobile beta moving toward
TestFlight.

| Day | Action | Reference |
|-----|--------|-----------|
| Mon | Begin running the founder operating rhythm (Monday blocks) | `founder-operating-rhythm.md` |
| Tue | First Friday-style release rehearsal — small, low-risk change through full train | `release-train-model.md` |
| Wed | Mobile: real Firebase configs, EAS init, first preview build for both platforms | `mobile-beta-ops.md` |
| Thu | Internal team installs mobile preview builds on physical devices | Same |
| Fri | First real release through the train; founder approval signed | `founder-release-approval.md` |

**End-of-week verdict:** The founder lived a real operating week. The
release train ran. Mobile is one step from TestFlight.

## Week 4 — Conversion + Compliance Posture

**Goal:** Pipeline coverage clarified; SOC 2 readiness initiated if
warranted.

| Day | Action | Reference |
|-----|--------|-----------|
| Mon | Pipeline review with target conversion math | `conversion-ops-map.md` |
| Tue | Reach out to top 3 enterprise prospects with `one-page-evaluator-brief.md` | `enterprise-evaluation-flow.md` |
| Wed | If any enterprise opp requires SOC 2: select Compliance-as-a-service vendor | `next-hires-or-outsourcing.md` Role 4 |
| Thu | Counsel sync — confirm fallback positions for redlines | `enterprise-evaluation-flow.md` Stage 6 |
| Fri | Friday writeup answering the three reset questions | `founder-operating-rhythm.md` |

**End-of-week verdict:** Pipeline is clear-eyed; compliance posture is
honest; counsel is engaged.

## Recurring Throughout

- Daily 5-min check from `founder-control-room-checklist.md`
- Daily inbox SLA from `inbound-routing-and-response-sla.md`
- Continuous tracking against `manual-actions-left.md`
- Continuous tracking of any new risks into `risk-register.md`
- Continuous Slack Connect responsiveness for the first tenant

## What Will Not Get Done in 30 Days

Honestly:

- SOC 2 will not be certified — auditor selected at most
- CORTEX will not be in public app stores — TestFlight + Play Internal
  by month-end is the realistic target
- The pipeline page in `artifacts/command` will not be built
- The number-two operator hire likely will not be filled — interviews
  may begin

Each is acceptable for 30 days. Each is in the 90-day plan that follows
this one.

## End-of-30-Day Verdict

The founder writes the verdict against `go-live-readiness-verdict.md`
on day 30. Expected outcomes:

- Production live: yes
- First paying or paying-equivalent tenant live: yes
- Pager operational: yes
- Operating rhythm running: yes
- Mobile in TestFlight + Play Internal: target yes
- SOC 2 path opened: target yes if warranted

If any of the "yes" items did not happen, the verdict says so plainly,
and the next 30-day plan starts with that gap.

## Anti-Patterns

- Treating the 30 days as "engineering catch-up" — the 30 days are
  about putting the operating model into actual practice
- Skipping the Friday writeup because it was a busy week — the writeup
  is the discipline
- Trying to do all 🔴 + 🟡 items in 30 days — the 🟡 items are
  realistically post-30
- Overcommitting to enterprise opportunities before Production is
  proven on the first tenant
