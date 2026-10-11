# Migration Authority Hardening Proof Packet

- `workcell_id`: `DB-MIGRATION-AUTHORITY-P0-20261011`
- `agent`: CodexSmith
- `objective`: Make the bounded migration authority path fail closed without reconciling the unresolved schema and orphan-migration history.
- `plan_summary`:
  1. Remove the legacy tracker backfill from the normal migration command while retaining it as an explicit recovery-only command.
  2. Make the hand-authored migration runner detect every checksum mismatch before applying pending SQL and keep dry-run database access read-only.
  3. Query the schema-qualified Drizzle tracker, report tracker absence explicitly, propagate operational database errors, and remove the nonexistent migration path from the status package.
  4. Add focused tests for command authority, checksum drift, dry-run query behavior, tracker status, and error propagation.
  5. Preserve the historical migration/schema reconciliation as an explicit production hold until it is proved against an ephemeral PostgreSQL database and a verified legacy baseline.
- `baseline_test_results`:
  - `pnpm install --frozen-lockfile --ignore-scripts`: exit 0; 204 workspace projects; supply-chain policy passed for 1,598 lock entries.
  - `pnpm typecheck`: exit 137 after 102 successful tasks; `@szl-holdings/db` was killed during the aggregate run under memory pressure. No TypeScript diagnostic preceded the kill.
- `screenshot_refs`: None. No UI surface is in scope.
- `public_claim_check`: No customer, compliance, revenue, integration, or readiness claim is introduced.
- `security_check`: Changed-file credential-pattern scan returned no matches; no secret, token, credential, `.env` value, or database URL was added.
- `known_gaps_update`: `docs/operations/known-gaps.md` records the unresolved legacy baseline and orphan/schema reconciliation as a production HOLD.
- `proof_level`: 2
- `recorded_at`: 2026-10-11T05:56:13Z
- `recorded_by`: CodexSmith

## Patch summary

- The normal migration command now performs a read-only manual checksum preflight before Drizzle or manual SQL and no longer invokes the current-journal backfill.
- The manual runner loads and hashes the complete file set, plans applied/pending/drift states, fails on any drift before the first migration transaction, and emits a structured JSON report.
- Dry-run checks tracker presence with `to_regclass` and performs only `SELECT` statements; it does not create the tracker when it is absent.
- Status utilities query `drizzle.__drizzle_migrations` and `public.__manual_migrations`, expose `trackerExists` for both, use the Drizzle hash as the latest identity, parse Drizzle epoch milliseconds correctly, and propagate operational query failures.
- The nonexistent `scripts/migrations` status path was removed.
- Twelve focused regression tests cover command ordering, drift-before-apply, dry-run read-only behavior, transactional application, qualified status queries, absent trackers, real errors, and path inventory. The database package's Turbo inputs include its migration scripts and tests so changes invalidate cached test results.
- The recovery-only backfill and database doctrine now state the operator verification boundary. No migration SQL, schema model, or tracker contents were changed.

## Test results

| Command | Exit | Result |
|---|---:|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | 0 | Baseline install completed for 204 workspaces; 1,598 lock entries passed supply-chain policy. |
| `pnpm typecheck` (baseline, default concurrency) | 137 | Runner killed the large `@szl-holdings/db` declaration build after 102 successful tasks; no TypeScript diagnostic preceded the memory kill. |
| `corepack pnpm --filter @szl-holdings/db test` | 0 | 6/6 migration-authority tests passed. |
| `corepack pnpm --filter @szl-holdings/db-migrations test` | 0 | 6/6 status tests passed. |
| `turbo run test --filter=@szl-holdings/db --filter=@szl-holdings/db-migrations --concurrency=2` | 0 | Both package test tasks and every focused case passed through the repository task graph. |
| `corepack pnpm --filter @szl-holdings/db typecheck` | 0 | Database package declaration build passed. |
| `corepack pnpm --filter @szl-holdings/db-migrations typecheck` | 0 | Migration-status package typecheck passed. |
| `biome check` on five changed JavaScript/TypeScript files | 0 | Formatting, lint, and import ordering passed after applying safe formatter output. |
| `git diff --check` | 0 | No whitespace errors. |
| Changed-file credential-pattern scan | 1 | Expected `rg` no-match status; no credential pattern found. |
| `PATH=<pinned-pnpm-10-wrapper> CI=true npm_config_manage_package_manager_versions=false turbo run typecheck --concurrency=2` | 0 | 185/185 repository typecheck/build tasks passed in 12m46s. |
| `CI=true corepack pnpm install --frozen-lockfile --ignore-scripts --offline` after merging protected main | 0 | Frozen install completed for all 204 workspaces using the repository-pinned pnpm 10.26.1. |
| Direct focused tests after merging protected main | 0 | Every focused case passed across `@szl-holdings/db` and `@szl-holdings/db-migrations`. |
| `turbo run test --filter=@szl-holdings/db --filter=@szl-holdings/db-migrations --concurrency=2` after merging protected main | 0 | 4/4 uncached package and dependency-build tasks passed; 12/12 focused tests passed. |
| `turbo run typecheck --concurrency=2` after merging protected main | 0 | 232/232 repository typecheck/build tasks passed in 11m46s. |

Two superseded post-edit harness attempts exited 1 before source validation: one forwarded `--concurrency` to every package command, and one let the nested Evidence Doctrine package request uncached pnpm 11.9.0 during a DNS outage. The final command pins the repository package manager, disables nested package-manager replacement, and passes the complete task graph.

## Verification notes

- The command-string regression test proves the checksum preflight precedes both apply paths and the legacy backfill is absent.
- Scripted clients prove drift performs no `BEGIN`, migration SQL, insert, or tracker DDL when the tracker already exists.
- Dry-run tests prove an absent tracker performs one `SELECT` and a present tracker performs only `SELECT` statements.
- Status tests prove tracker absence is a returned state while connection/permission failures reject.
- No route or UI surface changed, so route QA and screenshot proof do not apply.
- Base source during implementation was `952439b96efe5eccaf9474d831edb4dd46343d15`. The topic merged final protected main `690959d29c6d26f0f3f4a42ef91fd442067c186e` with normal history before final integration validation; only the audit index and known-gaps register required conflict resolution.
