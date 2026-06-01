# Release Blocker Policy

Phase H · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

A bounded list of conditions that block a release. Anything not on this
list does not block a release. The point is to remove judgment from the
moment the train is leaving.

## What Blocks a Release

| # | Condition | Detection |
|---|-----------|-----------|
| 1 | Any P0 incident open | `incident-triage-model.md` board |
| 2 | Any P1 incident open without a documented workaround | Same |
| 3 | Lint workflow failing on the release commit | `lint` workflow |
| 4 | Typecheck workflow failing on the release commit | `typecheck` workflow |
| 5 | Unit tests failing on the release commit | `test` workflow |
| 6 | Integration tests failing on the release commit | CI |
| 7 | Code review verdict not APPROVED for any change in the release | Code review skill output |
| 8 | Staging deploy failed for the release commit | `deploy-staging.yml` |
| 9 | Staging E2E tests failing | `test:e2e` workflow |
| 10 | Staging smoke tests failing per `staging-and-prod-smoke-tests.md` | Smoke job |
| 11 | Backward-incompatible schema migration | Schema review |
| 12 | A write route added without Zod validation | Code review |
| 13 | A new ATLAS event published without entry in the taxonomy | `atlas-events` strict mode |
| 14 | A secret added or modified without entry in `ops/security/secret-inventory.md` | Code review |
| 15 | A new external subprocessor added without DPA + counsel review | Code review |
| 16 | Cross-tenant data path added or modified without explicit security review | Code review |
| 17 | Mobile native release without successful EAS build for both iOS and Android | EAS dashboard |
| 18 | Mobile public release without privacy manifest / data disclosure | `mobile-beta-ops.md` exit criteria |
| 19 | Production cutover steps incomplete (only applies to first prod release) | `production-cutover-checklist.md` |
| 20 | Founder release approval not signed | `founder-release-approval.md` |

## What Does NOT Block a Release

These are explicitly NOT blockers:

- A non-blocker P2 / P3 / P4 bug
- A flaky test that has been triaged with a documented flake report
- A Lighthouse score regression below 5 percentage points
- A dependency security advisory that is not exploitable in our context
  (must be documented in the dependency review)
- A roadmap feature being incomplete
- A design partner asking for a feature that did not make this train
- A telemetry alarm in Tier 3 (dashboard only)

A long list of explicit "not blockers" exists because at founder-stage
the temptation to delay is constant. Discipline is shipping the
known-good code we have.

## Who Can Wave a Blocker

| Blocker | Who can wave |
|---------|--------------|
| 1, 2, 16 | Nobody — these are absolute |
| 3–10 | Nobody — these are quality gates |
| 11 | Founder + engineering, only if a fix-forward plan is documented in advance |
| 12, 13, 14, 15 | Founder, only with a written rationale stored in `what-changed.md` |
| 17, 18 | Nobody for public release; founder for internal beta |
| 19 | Nobody |
| 20 | Founder is the signer, so cannot wave it |

## Blocker Discovery During the Train Window

If a blocker is discovered between Wednesday freeze and Friday deploy:

1. Engineering posts the blocker in the engineering channel within 30
   minutes of discovery
2. Founder triages within 1 hour
3. Decision: wave (per the table above), revert the offending change,
   or skip the train

Skipping the train is a normal outcome. A skipped train is documented
in `what-changed.md` with the reason and the date the next train will
ship.

## Blocker Discovery During Production Watch (first 30 min)

If a blocker condition is discovered after deploy but during the watch
window:

- Trigger rollback per `deploy-and-rollback-runbook.md`
- Open incident per `incident-triage-model.md`

Do not attempt to roll forward through a blocker. The watch window is
a cheap safety net; use it.

## Anti-Patterns

- Adding a new "blocker" mid-train — blockers are defined in advance
- Treating a non-blocker as a blocker because it would be embarrassing
  — embarrassment is not a blocker
- Waving a blocker because the train is ready — quality gates are
  gates precisely because they cannot be timed around
- Quietly downgrading a P1 to ship the train — postmortem-worthy

## Review

This list is reviewed quarterly. Conditions that have never blocked a
release and have no realistic path to blocking one are removed.
Conditions that should have blocked a release but did not are added.
