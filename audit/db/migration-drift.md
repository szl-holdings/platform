# Migration Drift Report — SZL Holdings
**Date:** 2026-04-20  
**Scope:** `lib/db/drizzle/` (Drizzle-Kit managed), `lib/db/migrations/` (hand-authored)  
**Journal:** `lib/db/drizzle/meta/_journal.json` — 56 registered entries

---

## 1. Executive Summary

The migration history is in **significant drift** across four dimensions:

1. **Duplicate sequence numbers** — at least two pairs of SQL files share the same `NNNN_` prefix, meaning one file in each pair was never registered in the journal and has never been applied by Drizzle.
2. **Non-sequential journal** — the journal has gaps and skips (entries jump from 46 → 54 → 58 → 60 → 63, etc.), indicating migrations were renumbered, squashed, or manually added.
3. **Two separate migration paths with no shared tracker** — `lib/db/drizzle/` (Drizzle-Kit) and `lib/db/migrations/` (hand-authored) are applied by different mechanisms with no unified `__drizzle_migrations` record.
4. **Schema-model drift** — multiple tables and columns exist in the ORM models that have no corresponding drizzle migration (they were pushed directly via `drizzle push` or applied out-of-band).

---

## 2. Duplicate Migration File Numbers

### 2.1 `0010` — Two Files, One Registered

| File | Journal Status |
|------|---------------|
| `0010_azure_tenants_dataverse.sql` | **REGISTERED** — journal entry 10 (`0010_azure_tenants_dataverse`) |
| `0010_szl_saas_layer_tables.sql` | **ORPHANED** — not in journal, never tracked |

**Impact:** `onboarding_wizard_state` and `org_notification_settings` tables defined in `0010_szl_saas_layer_tables.sql` were likely applied manually or via `drizzle push`. If a fresh environment is set up by running only journal migrations, these tables will be missing.

**Resolved:** Registered as `0091_register_szl_saas_layer_tables.sql` (journal idx 91) with `CREATE TABLE IF NOT EXISTS` guards. Original `0010_szl_saas_layer_tables.sql` is kept on disk for historical context.

### 2.2 `0028` — Three Files, One Registered

| File | Journal Status |
|------|---------------|
| `0028_knowledge_graph_vector_embeddings.sql` | **REGISTERED** — journal entry 28 |
| `0028_crdt_change_events.sql` | **ORPHANED** — not in journal |
| `0028_multi_channel_notifications.sql` | **ORPHANED** — not in journal |

**Impact:** CRDT change events and multi-channel notification infrastructure may be missing from environments bootstrapped via the migration journal. If `change_events` and `web_push`/`push_tokens` tables were created by these orphaned files, those tables are untracked.

**Resolved:** Registered as `0092_register_crdt_change_events.sql` (journal idx 92) and `0093_register_multi_channel_notifications.sql` (journal idx 93), both with `IF NOT EXISTS` guards. Originals kept on disk.

### 2.3 `0021` and `0025` — Same Filename, Different Content

| File | Journal Status | Content |
|------|---------------|---------|
| `0021_simulation_persistence.sql` | REGISTERED — journal entry 21 | A2A protocol tables, agent cards, simulation sessions (v1) |
| `0025_simulation_persistence.sql` | REGISTERED — journal entry 25 | Simulation sessions (v2 — domain-generic variant) |

**Impact:** Both files are registered but they share a human-readable name, making it impossible to determine which represents the canonical simulation table structure by filename alone. The `simulation_sessions` table was created twice — journal entry 21 (via `0021`) and then recreated with `IF NOT EXISTS` in journal entry 25. This suggests the v1 table schema was incorrect and patched rather than migrated cleanly.

**Action Required:** Rename `0021_simulation_persistence.sql` to a more descriptive name (e.g., `0021_a2a_and_simulation_v1.sql`). The rename is safe as it does not affect the journal entry (journal references by tag, not filename). Update the tag in `_journal.json` for entry 21.

---

## 3. Non-Sequential Journal Gaps

The journal entries jump over the following sequence numbers, indicating migrations were removed, squashed, or never created:

| Gap Range | Missing idx Values | Notes |
|-----------|-------------------|-------|
| 47–53 | 47, 48, 49, 50, 51, 52, 53 | 7 consecutive entries missing — likely a squash or rollback |
| 55–57 | 55, 56, 57 | 3 entries missing |
| 59 | 59 | 1 entry missing |
| 61–62 | 61, 62 | 2 entries missing |

Total: **13 sequence numbers unaccounted for.**

**Risk:** If any of these migrations were partially applied on a production database before being removed from the journal, the live schema may contain orphan tables or columns not tracked by the ORM. The `drizzle-kit check` command cannot detect this because the journal no longer references these entries.

**Action Required:** Run `drizzle-kit check` against the live database to compare the current schema snapshot against the ORM model. Any tables/columns present in the DB but not in the model represent orphan drift.

---

## 4. Drizzle Journal vs Hand-Authored Migrations — No Unified Tracker

`lib/db/migrations/` contains 20 hand-authored SQL files tracked separately from the Drizzle journal:

```
0001_add_tenant_id_to_rag_knowledge_chunks.sql
0002_support_and_data_retention_tables.sql
0003_skill_library_tables.sql
0004_carlota_time_billing.sql
0004_signal_chain_executions.sql       ← DUPLICATE prefix 0004
0005_page_view_events.sql
0006_decision_receipts.sql
0007_daily_briefings.sql
0008_notification_preferences_digest_config.sql
0008_vessels_org_scope.sql             ← DUPLICATE prefix 0008
0009_atlas_execution_runs.sql
0010_audit_events_policy_decisions.sql ← prefix 0010 THIRD occurrence across paths
0011_atlas_retention_indexes.sql
0012_drift_snapshots.sql
0013_command_inbox_alert_audit.sql
0014_decisions_runtime.sql
0015_on_call_schedules.sql
0015_team_pages.sql                    ← DUPLICATE prefix 0015
0016_gateway_event_latency.sql
0016_team_pages_mute_duplicates.sql    ← DUPLICATE prefix 0016
0017_on_call_handoff_notifications.sql
0018_agent_mesh_drift_rollback.sql
0019_constellation_views_sharing.sql
0020_terra_properties_natural_key_unique.sql
```

**Critical findings within `lib/db/migrations/`:**

| Issue | Files |
|-------|-------|
| Duplicate `0004` prefix | `0004_carlota_time_billing.sql`, `0004_signal_chain_executions.sql` |
| Duplicate `0008` prefix | `0008_notification_preferences_digest_config.sql`, `0008_vessels_org_scope.sql` |
| Duplicate `0015` prefix | `0015_on_call_schedules.sql`, `0015_team_pages.sql` |
| Duplicate `0016` prefix | `0016_gateway_event_latency.sql`, `0016_team_pages_mute_duplicates.sql` |

**These files are applied by a separate script/mechanism** (the `scripts/migrations/` path referenced in `MIGRATION_PATHS.scripts`), not by `drizzle-kit migrate`. There is no `__drizzle_migrations` row for any of them.

**Risk:** A fresh database bootstrapped only via `pnpm migrate` will be missing all 24 tables/changes in `lib/db/migrations/`. The application may silently work (all queries fall back gracefully) or break depending on which route is hit first.

**Action Required:** Adopt one of:
- **Option A (Recommended):** Port all `lib/db/migrations/` files into the Drizzle journal. Renumber to avoid collisions. Wrap each in `IF NOT EXISTS` / `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` so re-application is idempotent.
- **Option B:** Document and automate the two-step bootstrap (`pnpm migrate && pnpm migrate:manual`), and add a startup health check that verifies both migration sets have been applied.

---

## 5. Schema–Model Drift: Tables Present in ORM Without Migrations

The following tables appear in `lib/db/src/schema/` but have no identifiable migration file in either `lib/db/drizzle/` or `lib/db/migrations/`:

| Table / Schema File | Evidence |
|--------------------|---------|
| `onboarding_wizard_state` (in `0010_szl_saas_layer_tables.sql`) | Orphaned migration — see §2.1 |
| `org_notification_settings` | Same orphaned migration |
| `change_events` (in `change_events.ts`) | Referenced by `0028_crdt_change_events.sql` (orphaned) |
| `web_push_subscriptions` / `web_push.ts` | No corresponding migration found |
| `push_tokens` additions (nullable user) | Migration 0024 covers this — **OK** |
| `terra_portfolio_modules` | Seeded at boot; no DDL migration (table created via `drizzle push` or boot migration) |
| Tables in `prism_counsel_gc.ts`, `prism_counsel_omega.ts`, etc. | No corresponding migration file found — likely applied via `drizzle push` |

---

## 6. ORM Model vs Live Schema: Known Intentional Deviations

| Deviation | File | Notes |
|-----------|------|-------|
| `kg_entities_natural_key_idx` expression index | `knowledge_graph.ts` | Intentionally managed via SQL (see migration 0031). ORM schema comment acknowledges this. |
| `__drizzle_migrations` query in `migration-status.ts` | Uses non-standard column `id` | Drizzle stores the migration hash as the PK — querying by `id` may fail depending on Drizzle version |
| `terra_property_address_city_state_uniq` index | `terra-portfolio-modules.ts` migration | Created by hand migration 0020; Drizzle schema for `terra_properties` does NOT declare this unique constraint in the ORM model — **drift** |

---

## 7. Auto-Generated Migration Names

Two journal entries have auto-generated (meaningless) Drizzle-Kit names:

- Entry 45: `0045_eager_bloodstorm`
- Entry 46: `0046_sparkling_edwin_jarvis`

These names provide no information about what schema change they represent. The files should be inspected and the tags in `_journal.json` updated to descriptive names.

---

## 8. Summary Risk Table

| Issue | Severity | Environments Affected | Safe to Auto-Fix |
|-------|----------|----------------------|-----------------|
| `0010_szl_saas_layer_tables.sql` orphaned | CRITICAL | All fresh envs | No — requires renumber + journal update |
| `0028_crdt_change_events.sql` orphaned | CRITICAL | All fresh envs | No |
| `0028_multi_channel_notifications.sql` orphaned | CRITICAL | All fresh envs | No |
| `lib/db/migrations/` not in Drizzle journal | HIGH | All fresh envs | Partial — needs idempotent wrappers |
| Duplicate prefixes in `lib/db/migrations/` | HIGH | Fresh envs if script runs both | No |
| 13 gaps in journal sequence | MEDIUM | Unknown | Investigate before action |
| `0025_simulation_persistence` — duplicate name | MEDIUM | N/A (both registered) | Yes — rename tag only |
| `terra_property_address_city_state_uniq` ORM drift | MEDIUM | All envs | Yes — declare in ORM schema |
| Auto-named migrations 0045, 0046 | LOW | Ops/debugging | Yes — rename tags |

---

## 9. Appendix — Phase B Cross-Reference

Findings from the parallel Phase B audit that are subsumed or extended by the sections above:

### 9.1 Full Inventory of `lib/db/drizzle/` Duplicate-Numbered Files (25 files, 10 slots)

| Number | Files | Status |
|--------|-------|--------|
| `0010` | `0010_azure_tenants_dataverse.sql`, `0010_szl_saas_layer_tables.sql` | §2.1 — orphan resolved as `0091_register_szl_saas_layer_tables.sql` |
| `0028` | `0028_crdt_change_events.sql`, `0028_knowledge_graph_vector_embeddings.sql`, `0028_multi_channel_notifications.sql` | §2.2 — orphans resolved as `0092_register_crdt_change_events.sql`, `0093_register_multi_channel_notifications.sql` |
| `0044` | `0044_constellation_graph.sql`, `0044_trace_graph.sql` | Both registered — verify journal tags distinguish them |
| `0045` | `0045_deployments_registry.sql`, `0045_eager_bloodstorm.sql` | Auto-named — see §7 |
| `0046` | `0046_guardian_tool_mesh.sql`, `0046_sparkling_edwin_jarvis.sql` | Auto-named — see §7 |
| `0053` | `0053_fund_inbound_deals_attachments.sql`, `0053_lp_portal_data_room.sql`, `0053_ot_ics_decoder.sql` | Verify all three registered |
| `0060` | `0060_business_events_composite_idx.sql`, `0060_szl_decisioning_tables.sql` | Verify both registered |
| `0065` | `0065_session_lifecycle_hardening.sql`, `0065_signal_mesh_persistence.sql` | Verify both registered |
| `0068` | `0068_atlas_retention_indexes.sql`, `0068_atlas_tenant_isolation.sql`, `0068_self_healing_persistence.sql`, `0068_terra_portfolio_modules.sql`, `0068_vessels_bol_persistence.sql` | 5-way collision — verify journal tags |
| `0077` | `0077_carlota_advisory_data.sql`, `0077_carlota_radar_competitors.sql` | Verify both registered |

### 9.2 Bootstrap Script Risk

`package.json` exposes `"migrate": "pnpm --filter @szl-holdings/db run push-non-interactive"`. `drizzle-kit push` bypasses the journal entirely and applies schema diffs directly. This is the most likely root cause of the orphan files in §2 — they were applied via `push` rather than `migrate`, leaving no journal record.

**Recommendation:** Switch the production `migrate` script to use `drizzle-kit migrate` (journal-based). Reserve `push` for local development only.

### 9.3 Additional Tables Suspected to Lack a Migration

Spot-checked tables in the ORM that have no obvious creating migration:

- `mfa_secrets` (`auth.ts`)
- `nuro_mesh_*` (`nuro_mesh.ts`)
- `dreamscape_*` (`dreamscape.ts`)
- `lyte_surfaces_*` (`lyte_surfaces.ts`)

These should be confirmed by running `drizzle-kit introspect` against a fresh database and diffing against the ORM schema.

---

## 10. Phase 1 Status — Applied in this Audit

The following autonomous, non-destructive remediations have been applied to the live database and committed to `_journal.json` (entries 88–93). All file content is idempotent (`IF NOT EXISTS` guards):

| Migration | Idx | Purpose |
|-----------|-----|---------|
| `0088_missing_index_sweep.sql` | 88 | 30 missing indexes mirrored into ORM (`index(...)` declarations) — see `index-audit.md` |
| `0089_drop_duplicate_indexes.sql` | 89 | Removes redundant `azure_tenants_tenant_id_idx`, `scim_tokens_hash_idx` — ORM `uniqueIndex` declarations also removed |
| `0090_add_real_estate_ops_role.sql` | 90 | Adds `'real_estate_ops_user'` to `users.platform_role` enum — see `schema-audit.md §4.1` |
| `0091_register_szl_saas_layer_tables.sql` | 91 | Registers previously orphaned `0010_szl_saas_layer_tables.sql` |
| `0092_register_crdt_change_events.sql` | 92 | Registers previously orphaned `0028_crdt_change_events.sql` |
| `0093_register_multi_channel_notifications.sql` | 93 | Registers previously orphaned `0028_multi_channel_notifications.sql` |

Phases 2 (consolidation of duplicate entities) and 3 (multi-tenancy unification, soft-delete policy, audit trail unification) remain explicitly gated for human approval — see `consolidation-plan.md`.
