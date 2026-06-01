# Deploy and Rollback Runbook

Phase B · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Single source of truth for how a change reaches Production and how it
gets reverted. Two paths only: planned release and emergency rollback.

## Pre-Deploy Gates (must all pass)

| Gate | Where | Failing Action |
|------|-------|----------------|
| Code review APPROVED | `.local/skills/code_review` verdict | Block — fix and re-review |
| Lint clean | `pnpm run lint` workflow | Block |
| Typecheck clean | `pnpm run typecheck` workflow | Block |
| Unit tests passing | `pnpm run test` workflow | Block |
| E2E tests passing on Staging | `pnpm run test:e2e` after Staging deploy | Block |
| Smoke tests passing on Staging | `staging-and-prod-smoke-tests.md` (staging tier) | Block |
| No P0/P1 incidents open | `incident-triage-model.md` | Block |
| Founder release approval signed | `founder-release-approval.md` | Block |

All gates must be green simultaneously. Any red gate blocks the deploy.

## Planned Deploy — Production

Sequence:

1. Cut release branch from `main` once gates green: `release/vX.Y.Z`
2. Tag the head: `git tag vX.Y.Z && git push --tags`
3. Tag push fires `deploy-production.yml` (GitHub Actions)
4. Workflow halts at the manual `confirm` gate awaiting founder approval
5. Founder approves; deploy proceeds
6. Post-deploy: production smoke tests run automatically per
   `staging-and-prod-smoke-tests.md`
7. Founder watches the first 30 minutes of telemetry per
   `telemetry-priority-matrix.md` (Tier-1 events only)
8. Mark release as live in `what-changed.md`

## Planned Deploy — Staging

Triggered automatically by push to `main`. No manual gate. If staging
deploy fails, no production deploy can proceed for that commit until
the staging failure is resolved.

## Mobile (CORTEX) Deploy

CORTEX (`artifacts/szl-holdings-mobile`) does not follow the web release
train. It uses its own EAS-driven cadence:

- See `mobile-beta-ops.md` for full lifecycle
- See `ops/mobile/testflight-play-internal-runbook.md` for the canonical
  step-by-step
- See `ops/mobile/eas-and-store-secrets-matrix.md` for credentials

Mobile rollback paths (TestFlight stop-distribute, Play halt-rollout,
EAS Update OTA rollback) are documented in the testflight runbook.

## Emergency Rollback — Production

Trigger conditions (any one):

- Sustained Tier-1 telemetry alarm for >2 minutes
- Authentication broken for >1 user (any reproducible report)
- Data loss or corruption signal (e.g., audit row mismatch)
- Founder judgment

Procedure:

1. Founder declares rollback in incident channel — no committee
2. Re-run `deploy-production.yml` against the last known-good tag
   (recorded in `what-changed.md`)
3. Database migrations: if the broken release applied a migration,
   confirm migration is forward-compatible with the prior code (Drizzle
   migrations are forward-compatible by convention; if not,
   coordinate with engineering before reverting code)
4. Confirm rollback succeeded via production smoke tests
5. Post-incident note in `what-changed.md` with timestamps

Total target time from declare to recovery: ≤15 minutes. The path
above currently meets that target only when the migration is
forward-compatible. Backward-incompatible migrations are explicitly
forbidden and are caught at code review.

## Emergency Rollback — Mobile

Mobile cannot be rolled back the same day except via EAS Update OTA
(JS bundle only). For native binary issues:

- iOS: stop distribution in TestFlight or App Store Connect
- Android: halt rollout in Play Console; revert to the previous release
- Always: ship a JS-only OTA with the bug fix
  (`eas update --channel production --message "Fix: ..."`)

## Database Rollback

Database changes use forward-only migrations
(`pnpm run migrate` workflow). The rollback strategy is forward-fix,
not rollback:

- A new migration that reverses the bad one
- The bad release is reverted at the code level only

Backups: Replit-managed PostgreSQL provides automatic point-in-time
recovery. Restore is a Replit support action — see
`incident-triage-model.md`, P0 procedure.

## Post-Deploy Telemetry Watch (first 30 min)

The founder watches these metrics actively for 30 minutes after every
production deploy:

1. `/api/health/detailed` returning 200 within p95 200ms
2. Auth login success rate (target ≥99% over a rolling 5-min window)
3. Error rate per route (no route exceeds prior baseline + 50%)
4. Outbound AI provider success rate (≥99%)
5. ATLAS event ingestion rate (no zero-window for any active domain)

Any breach triggers either rollback (above) or escalation per
`incident-triage-model.md`.

## What This Runbook Does Not Cover

- DR (disaster recovery) for Replit-managed infra is documented in
  `ops/replit/` and is Replit-managed
- Long-running data migrations (>5 min) require their own runbook —
  none currently exist; see `manual-actions-left.md`
