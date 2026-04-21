# Migration Drift Report

Generated: 2026-04-20  
Phase: B (Code Quality & Database Audit)

Migration paths:
- `lib/db/drizzle/` — Drizzle Kit generated migrations (107 files)
- `lib/db/migrations/` — Hand-authored migrations (24 files)

---

## 1. Critical: Duplicate Migration Numbers

### 1.1 Drizzle Migrations — 10 Collision Numbers (25 Files)

Drizzle relies on sequential numbering to determine application order. Multiple files sharing the same prefix number means:
1. Drizzle cannot determine which to apply first
2. Without a journal file (see §3), the runner has no record of which were applied
3. Schema drift between environments is near-certain

| Number | Files | Risk |
|--------|-------|------|
| `0010` | `0010_azure_tenants_dataverse.sql`, `0010_szl_saas_layer_tables.sql` | **Critical** |
| `0028` | `0028_crdt_change_events.sql`, `0028_knowledge_graph_vector_embeddings.sql`, `0028_multi_channel_notifications.sql` | **Critical** |
| `0044` | `0044_constellation_graph.sql`, `0044_trace_graph.sql` | **Critical** |
| `0045` | `0045_deployments_registry.sql`, `0045_eager_bloodstorm.sql` | **Critical** |
| `0046` | `0046_guardian_tool_mesh.sql`, `0046_sparkling_edwin_jarvis.sql` | **Critical** |
| `0053` | `0053_fund_inbound_deals_attachments.sql`, `0053_lp_portal_data_room.sql`, `0053_ot_ics_decoder.sql` | **Critical** |
| `0060` | `0060_business_events_composite_idx.sql`, `0060_szl_decisioning_tables.sql` | **Critical** |
| `0065` | `0065_session_lifecycle_hardening.sql`, `0065_signal_mesh_persistence.sql` | **Critical** |
| `0068` | `0068_atlas_retention_indexes.sql`, `0068_atlas_tenant_isolation.sql`, `0068_self_healing_persistence.sql`, `0068_terra_portfolio_modules.sql`, `0068_vessels_bol_persistence.sql` | **Critical** |
| `0077` | `0077_carlota_advisory_data.sql`, `0077_carlota_radar_competitors.sql` | **Critical** |

**Total: 25 conflicting files across 10 number slots.**

**Root Cause:** Multiple developers (or agents) generated migrations concurrently, each starting from the same highest number. Without a shared journal to lock sequence numbers, collisions accumulate.

**Recommended Fix (requires human coordination):**
1. Freeze all migration generation
2. List all 107 migrations in intended application order
3. Renumber sequentially in that order
4. Regenerate the Drizzle journal from the renumbered files
5. **Do not apply to production** until the renumbering is verified in staging

This is a high-risk operation requiring human approval. Not applied this phase.

---

### 1.2 Hand-authored Migrations — 4 Collision Numbers (8 Files)

`lib/db/migrations/` also has duplicate-numbered files:

| Number | Files |
|--------|-------|
| `0004` | `0004_carlota_time_billing.sql`, `0004_signal_chain_executions.sql` |
| `0008` | `0008_notification_preferences_digest_config.sql`, `0008_vessels_org_scope.sql` |
| `0015` | `0015_on_call_schedules.sql`, `0015_team_pages.sql` |
| `0016` | `0016_gateway_event_latency.sql`, `0016_team_pages_mute_duplicates.sql` |

Same issue as drizzle migrations. Same fix required.

---

## 2. Missing Drizzle Journal

`lib/db/drizzle/meta/journal.json` does not exist.

The Drizzle journal tracks which migrations have been applied and in what order. Without it:
- `drizzle-kit migrate` cannot determine what is applied vs pending
- Each developer may apply a different subset of migrations
- There is no reliable way to know the current migration state in any environment

**How it was likely applied:** The codebase uses `drizzle-kit push` (non-interactive schema push) rather than the journal-based migration runner. This is confirmed by the `package.json` script:
```json
"migrate": "pnpm --filter @szl-holdings/db run push-non-interactive"
```

**Risk:** Schema push is not safe for production — it applies all pending changes without a transaction boundary and without a rollback path.

**Recommendation:** 
1. Generate a journal by running `drizzle-kit generate` against the current schema
2. Switch from `push` to `migrate` for production deployments
3. Never use `push-non-interactive` against a database with live user data

---

## 3. ORM Schema vs Migration Drift

### 3.1 Tables in ORM Schema with No Confirmed Migration

The following tables are defined in the Drizzle ORM schema but their creation was not found in any migration file (spot-checked by table name):

| Table | Schema File | Migration Status |
|-------|-------------|-----------------|
| `mfa_secrets` | `auth.ts` | **Not found in any migration** |
| `api_keys` | `api_keys.ts` | Likely in migration but not confirmed |
| `knowledge_graph` | Multiple files | Partially in `0028_knowledge_graph_vector_embeddings.sql` |
| `nuro_mesh_*` | `nuro_mesh.ts` | Not confirmed |
| `dreamscape_*` | `dreamscape.ts` | Not confirmed |
| `lyte_surfaces_*` | `lyte_surfaces.ts` | Not confirmed |

**These tables may have been created via `drizzle-kit push` without a corresponding migration file.**

### 3.2 Tables in Migrations Not in ORM Schema

The migration files were added faster than the ORM schema was updated in some cases. Cross-referencing migration SQL with the current `index.ts` exports:

- `0045_eager_bloodstorm.sql` — the "bloodstorm" naming suggests this may be an auto-generated Drizzle Kit migration name for an ad-hoc change. Verify what it creates.
- `0046_sparkling_edwin_jarvis.sql` — same pattern. These Drizzle Kit auto-named migrations often represent schema pushes captured after the fact.

---

## 4. Orphaned Migrations

Migrations whose target tables are no longer in the ORM schema (schema was rolled back but migration was not):

**Method:** Cross-referenced `CREATE TABLE` statements in migration SQL with table exports in `lib/db/src/schema/index.ts`. Full analysis requires running the migrations against a fresh DB and comparing with the current schema.

**Manual spot-check findings:**
- `lib/db/src/schema/skill_library.ts` is excluded from `index.ts` (dead schema file). If a migration created these tables, they exist in the DB but are no longer referenced by the ORM.
- Several `prism_counsel_*` migrations may create tables that are duplicated across the variant schema files.

**Recommendation:** Run `drizzle-kit check` or `drizzle-kit introspect` against a fresh DB to generate a diff between the current DB state and the ORM schema.

---

## 5. Migration Naming Conventions

Two naming conventions are mixed in `lib/db/drizzle/`:

1. **Semantic names:** `0002_cms_schema_and_product_tables.sql`, `0009_firestorm_hardening_platform.sql`
2. **Drizzle Kit auto-generated names:** `0001_exotic_tony_stark.sql`, `0045_eager_bloodstorm.sql`, `0046_sparkling_edwin_jarvis.sql`

Auto-generated names provide no signal about what the migration does. This makes it hard to audit which migrations are safe to apply to production and which are destructive.

**Recommendation:** Rename auto-generated migration files to semantic names after reviewing their content. Part of the renumbering operation recommended in §1.

---

## 6. Summary of Required Human Actions

| Issue | Risk | Action Required |
|-------|------|----------------|
| 25 duplicate-numbered drizzle migrations | **Critical** | Renumber all migrations sequentially; regenerate journal |
| 8 duplicate-numbered hand-authored migrations | **Critical** | Renumber; audit for ordering dependencies |
| Missing Drizzle journal | **Critical** | Generate via `drizzle-kit generate`; switch to `migrate` runner |
| `mfa_secrets` table with no migration | High | Create a migration for this table |
| `push-non-interactive` in production path | High | Replace with `drizzle-kit migrate` |
| Auto-named migrations (`exotic_tony_stark`, etc.) | Medium | Rename to semantic names as part of renumbering |

**None of the above were applied this phase. All require human review and coordination.**
