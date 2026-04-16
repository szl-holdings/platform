# Release Train Model

Phase H · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

A predictable rhythm for shipping changes that is fast enough to keep
design partners happy, slow enough to keep production stable, and
honest about the founder-stage realities of the team.

## Cadence

| Train | Cadence | Window |
|-------|---------|--------|
| Web release train | Weekly | Friday 14:00 founder local |
| Mobile native release train | Bi-weekly | Friday 14:00 founder local on alternating weeks |
| Mobile OTA fast lane | As needed | Any business day, JS-only |
| Hotfix train | As needed | Any time, with explicit founder approval |
| Schema migration train | Weekly, ride the web train | Same window |

The Friday window is intentional: it gives the founder the weekend to
watch telemetry without competing demands. Releases late on Friday or
on the weekend are not done. If a fix cannot wait for next Friday, it
goes through the hotfix train.

## What Goes In a Train

A change is eligible for the next train if:

- Code review verdict APPROVED
- Lint, typecheck, unit tests, integration tests green
- Author has filled in release notes
- No blocker label per `release-blocker-policy.md`
- Schema changes (if any) are forward-compatible

A change is held for the next train if any of the above fails.

## Train Composition

The Friday web train batch contains:

- All eligible changes merged to `main` between the prior Friday and
  Wednesday 23:59 (Thursday is "freeze day" for the train)
- Any reverts of Wednesday's known-bad changes
- Schema migrations as a single ordered set

Changes merged Thursday or Friday morning are NOT in this train; they
go in the next one. This rule kills the "just one more thing" pattern
that breaks Friday releases.

## Steps

| When | Step |
|------|------|
| Wednesday EOD | Train scope frozen. Engineering posts the candidate list. |
| Thursday AM | Founder + engineering walk the candidate list and the release notes |
| Thursday | Final tests run on Staging; smoke tests pass per `staging-and-prod-smoke-tests.md` |
| Friday AM | Founder release approval per `founder-release-approval.md` |
| Friday 14:00 | Tag pushed; deploy workflow runs per `deploy-and-rollback-runbook.md` |
| Friday 14:00–14:30 | First-30-min telemetry watch |
| Friday 14:30–17:00 | Stabilization window; founder owns the channel |
| Monday AM | Train retrospective in pipeline review block |

## Mobile Native Train

Native releases (anything that requires a new EAS build) go through:

| When | Step |
|------|------|
| Wednesday EOD | Native scope frozen |
| Thursday AM | EAS preview build for both iOS and Android |
| Thursday PM | Internal team installs, exercises critical paths |
| Friday AM | EAS production build queued |
| Friday PM | TestFlight + Play Internal upload |
| Saturday | Distribution to testers |
| Monday | Tester feedback, decide store-submit or revise |

Native trains take longer than web trains. This is normal — store
review queues are external dependencies.

## Mobile OTA Fast Lane

JS-only fixes can ship via `eas update --channel production` any
business day with:

- Code review APPROVED
- Internal device test on iOS + Android
- Founder approval (lighter weight than full release approval — a single
  acknowledgement in the engineering channel suffices)

OTA fast lane is for bug fixes, not feature additions.

## Hotfix Train

A hotfix is allowed if and only if:

- Bug is P0 or customer-impacting P1
- Fix is small and well-scoped (can be reviewed in <30 min)
- Fix is forward-compatible at the schema level
- Founder explicitly opens the hotfix slot

Hotfix steps:

1. Branch off from the production tag
2. Fix the bug; test locally
3. Code review; same gates
4. Deploy to Staging; smoke tests
5. Founder release approval
6. Deploy to Production
7. Cherry-pick (or forward-port) the fix into `main`
8. `what-changed.md` entry with hotfix label

The hotfix path does not skip any quality gate. It only skips waiting
for the train.

## What Is NOT in a Train

- Internal-only changes that do not affect production binaries (e.g.,
  ops doc updates) — merge to `main` any time
- Workspace-only experiments (artifacts not registered to production
  routes) — same
- Mockup sandbox changes — never deployed
- Changes to archived artifacts — none allowed; redirects only

## Train Health Metrics

| Metric | Target |
|--------|--------|
| Train on-time rate | ≥90% |
| Trains followed by rollback | <10% |
| Trains with one or more P1 incidents in 24h | <5% |
| OTA fast lane usage per month | ≤4 |
| Hotfix train usage per month | ≤2 |

These metrics are reviewed monthly per `founder-operating-rhythm.md`.
Trends are more meaningful than month-over-month deltas at this scale.
