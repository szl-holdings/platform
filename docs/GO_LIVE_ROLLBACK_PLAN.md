# GO-LIVE ROLLBACK PLAN

Captured: 2026-04-23.

## Trigger criteria — auto-rollback

Roll back **immediately** (no debate) if any of:

1. `/api/health` returns non-200 for >5 consecutive minutes after deploy.
2. Any signed-in user surface returns blank screen on first load.
3. `sorry, too many clients already` appears in logs more than 3 times in a 10-minute window after the deploy. (The Phase 4 fix should make this near-impossible; if it recurs, the production DB tier is undersized.)
4. Any tenant-isolation regression — a single user seeing another tenant's data is a stop-the-line event.
5. Mobile login fails for >25% of attempts in any 5-minute window.

## Trigger criteria — investigate before rollback

- New Sentry fingerprint at >10/minute that is not visible to end users.
- A single workflow's port detection failing intermittently — restart first; rollback only if the restart loop continues.
- Slow query alerts — investigate via `pg_stat_activity`; rollback only if a single endpoint is dominant and unfixable in <30 minutes.

## Rollback mechanics

1. **Application code:** Replit checkpoints provide one-click rollback to the previous good commit. Latest known-good (as of this doc) is `7268f95` (Task #1439 merge).
2. **Database:** Migrations in this codebase are additive (column additions, new tables). To roll back data:
   - Use `scripts/backup-db.sh` snapshots taken before deploy.
   - For schema rollback, reverse migrations are present in `scripts/rollback/` for some major changes (e.g. `003_rollback_0006_firestorm_hardening.sql`). **There is no full rollback script for every migration.**
3. **Secrets / env:** Restore from the secrets manager snapshot.
4. **Workflows:** Restart all artifact workflows after the rollback commit lands.

## Known unsafe rollbacks

- **Cannot roll back tenant isolation work** (Tasks #1416, #1417) without re-introducing data-leak risk.
- **Cannot roll back the LP-portal upload tables** without losing user-submitted data.
- **Cannot roll back the Carlota Jo team-members table** (`0028_carlota_team_members.sql`) without losing the seed data.

For any of the above, the right move is **fix forward**, not roll back.

## Communication

If rollback is triggered:

1. Post status to ops channel: "Rolling back deploy — affects: [scope] — ETA to recovery: [time]."
2. Tag the on-call engineer.
3. After recovery, write the post-mortem within 24 hours.

## Practice

This rollback plan has **not been rehearsed** in this codebase. Recommend a 30-minute tabletop exercise before midnight launch:
- Pick a recent commit, walk through the rollback steps in a staging environment, time how long each step takes, fix any gaps in tooling.
