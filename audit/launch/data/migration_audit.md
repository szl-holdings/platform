# Migration Audit
**Phase:** 4  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Migration Architecture

| Attribute | Value |
|---|---|
| Migration tool | Drizzle ORM (`lib/db`) |
| Migration command | `pnpm db:migrate` → `pnpm --filter @szl-holdings/db run migrate` |
| Push command (non-interactive) | `pnpm --filter @szl-holdings/db run push-non-interactive` |
| Migration files location | `lib/db/migrations/` |
| Idempotency | Drizzle tracks applied migrations in `__drizzle_migrations` table |
| Interactive prompts | None — push-non-interactive flag eliminates all prompts |

---

## Migration Safety

| Check | Status | Notes |
|---|---|---|
| Migrations run idempotently | ✅ | Drizzle tracks applied state; re-running is safe |
| No interactive prompts | ✅ | `push-non-interactive` flag configured |
| Backwards-compatible changes | ✅ (for all current migrations) | No destructive schema changes without migration window |
| Migration order deterministic | ✅ | Sequential numbering enforced |
| Failed migration recovery | ✅ | Drizzle rolls back failed migrations automatically |

---

## Known Outstanding Migration Items

| Item | Impact | Resolution |
|---|---|---|
| `platform_settings` table not yet created in dev DB | WARN on startup; platform settings features unavailable | Run `pnpm db:migrate` |
| `eval_forge_suites` and `eval_forge_runs` not created | Eval Forge UI shows empty | Run `pnpm db:migrate` |

**Root cause:** These tables were added in recent migrations that have not been run against the current dev database instance. They are present in migration files and will be created on next `pnpm db:migrate` run.

---

## Demo Reset Command

| Command | Script | Behavior |
|---|---|---|
| `pnpm seed:demo` | `scripts/seed-demo-canonical.sh` | Wipes demo org data; re-seeds all demo orgs and users; deterministic |
| `pnpm seed:all` | `scripts/seed-demo-canonical.sh` | Full seed including atlas, vessels, terra, counsel |
| `pnpm seed:atlas` | `packages/scripts` | ATLAS-specific seed |
| `pnpm seed:atlas:aegis` | `packages/scripts` | Aegis-specific seed |
| `pnpm seed:atlas:vessels` | `packages/scripts` | Vessels-specific seed |
| `pnpm seed:atlas:terra` | `packages/scripts` | Terra-specific seed |
| `pnpm seed:atlas:counsel` | `packages/scripts` | Counsel-specific seed |

---

## Production Migration Checklist

Before running migrations in production:

- [ ] Take a full database backup before running migrations
- [ ] Run `pnpm db:migrate` (non-interactive; no prompts)
- [ ] Verify `GET /api/health/detailed` returns DB healthy after migration
- [ ] Run `pnpm seed:demo` to seed demo org (if first deploy)
- [ ] Verify missing tables no longer appear in logs
- [ ] Do NOT run `pnpm seed:all` in production — demo seed only

---

## Rollback Notes

| Scenario | Action |
|---|---|
| Migration fails partway | Drizzle rolls back transaction automatically |
| Bad schema change discovered after deploy | Restore from backup taken before migration |
| Restore from Replit checkpoint | Use Replit checkpoint feature — includes DB snapshot |
