# SZL Holdings — Migration Integrity Audit

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Migration file inventory, naming, ordering, potential drift, and process integrity

---

## Summary

| Metric | Value |
|---|---|
| Total migrations | 139 |
| Drizzle-generated migrations | 115 (in `lib/db/drizzle/`) |
| Hand-authored migrations | 24 (in `lib/db/migrations/`) |
| Migration management | `@szl-holdings/db-migrations` package |
| ORM | Drizzle ORM v0.45.2 |
| Migration tool | Drizzle Kit |

---

## Migration File Structure

### Drizzle-Generated Migrations (`lib/db/drizzle/`)

Files follow `NNNN_descriptive_name.sql` format. Selected inventory:

| File | Description |
|---|---|
| `0000_wooden_proemial_gods.sql` | Initial schema creation |
| `0001_exotic_tony_stark.sql` | Schema expansion |
| `0002_cms_schema_and_product_tables.sql` | CMS + product tables |
| `0003_terra_distress_pipeline.sql` | Terra distress pipeline |
| `0004_alloy_canonical_schema.sql` | Alloy canonical schema |
| `0005_capital_certification_readiness.sql` | Capital readiness tables |
| `0006_platform_feature_flags_seed.sql` | Feature flags |
| `0007_terra_broker_schema.sql` | Terra broker |
| `0008_platform_ops_tables.sql` | Platform ops |
| `0009_firestorm_hardening_platform.sql` | Security hardening |
| `0010_azure_tenants_dataverse.sql` | Azure tenants |
| `0010_szl_saas_layer_tables.sql` | ⚠️ Duplicate 0010 prefix |
| `0011_lyte_dashboards.sql` | Lyte dashboards |
| `0012_export_jobs.sql` | Export jobs |
| `0013_feedback_tables.sql` | Feedback |
| `0014_org_invitations.sql` | Org invitations |
| `0015_org_members_unique_constraint.sql` | Org members constraint |
| `0016_alloy_governance_policies.sql` | Governance policies |
| `0017_terra_action_items.sql` | Terra action items |
| `0018_firestorm_tradecraft_tables.sql` | Firestorm tables |
| ... | (97 more through 0114+) |

### Hand-Authored Migrations (`lib/db/migrations/`)

| File | Description |
|---|---|
| `0001_add_tenant_id_to_rag_knowledge_chunks.sql` | Tenant isolation fix (KG015) |
| `0002_support_and_data_retention_tables.sql` | Support tickets + retention |
| `0003_skill_library_tables.sql` | Skill library |
| `0004_carlota_time_billing.sql` | Carlota time billing |
| `0004_signal_chain_executions.sql` | ⚠️ Duplicate 0004 prefix |
| `0005_page_view_events.sql` | Page view analytics |
| `0006_decision_receipts.sql` | Decision receipts |
| `0007_daily_briefings.sql` | Daily briefings |
| `0008_notification_preferences_digest_config.sql` | Notification prefs |
| `0008_vessels_org_scope.sql` | ⚠️ Duplicate 0008 prefix |
| `0009_atlas_execution_runs.sql` | Atlas execution |
| `0010_audit_events_policy_decisions.sql` | Audit events |
| `0011_atlas_retention_indexes.sql` | Atlas retention |
| `0012_drift_snapshots.sql` | Drift snapshots |
| `0013_command_inbox_alert_audit.sql` | Command inbox audit |
| `0014_decisions_runtime.sql` | Decision runtime |
| `0015_on_call_schedules.sql` | On-call schedules |
| `0015_team_pages.sql` | ⚠️ Duplicate 0015 prefix |
| `0016_gateway_event_latency.sql` | Gateway latency |
| `0016_team_pages_mute_duplicates.sql` | ⚠️ Duplicate 0016 prefix |
| ... | (4 more) |

---

## Integrity Findings

### ⚠️ Duplicate Migration Number Prefixes

Multiple migration files share the same numeric prefix in both the Drizzle and hand-authored directories:

| Directory | Conflicts |
|---|---|
| Drizzle migrations | `0010_azure_tenants_dataverse.sql`, `0010_szl_saas_layer_tables.sql` |
| Hand-authored | `0004_carlota_time_billing.sql` + `0004_signal_chain_executions.sql` |
| Hand-authored | `0008_notification_preferences_digest_config.sql` + `0008_vessels_org_scope.sql` |
| Hand-authored | `0015_on_call_schedules.sql` + `0015_team_pages.sql` |
| Hand-authored | `0016_gateway_event_latency.sql` + `0016_team_pages_mute_duplicates.sql` |

**Risk:** If migrations are applied by numeric order without deduplication, the ordering is ambiguous for these pairs. Drizzle Kit uses a journal file (`drizzle/meta/_journal.json`) to track applied migrations — verify the journal is authoritative and these conflicts are tracked.

**Recommended action:** Verify `lib/db/drizzle/meta/_journal.json` correctly sequences all migrations. For hand-authored migrations, verify the runner applies them in a deterministic order.

### Annotation Convention Compliance

The `@szl-holdings/db-migrations` package documents an annotation convention for retained raw SQL:
```
// raw-sql: <reason> — applied before Drizzle was adopted; schema locked
// raw-sql: performance — hand-tuned query
// raw-sql: migration — one-time data transformation
```

**Status:** Not verified whether all hand-authored migrations follow this convention. Recommend a sweep.

---

## Migration Process Health

| Process | Status | Notes |
|---|---|---|
| Migration execution | `pnpm migrate` | Runs `@szl-holdings/db run push-non-interactive` |
| Schema push (dev) | `pnpm db:migrate` | Drizzle Kit push |
| Demo reset | `pnpm db:reset:demo` | Migrate + seed |
| Migration status check | `getMigrationStatus()` from db-migrations | Available |

---

## Drift Risk Assessment

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Schema drift (production vs. migrations) | Medium | High | 139 migrations; no automated drift detection in CI |
| Duplicate migration ordering | Low | Medium | Drizzle journal should resolve; verify |
| Hand-authored migration completeness | Medium | Medium | 24 hand-authored migrations not managed by Drizzle Kit |

**Recommended action:** Add a CI step that runs `pnpm migrate --dry-run` (or equivalent) to detect schema drift before deployment.

---

*Indexing risk: `audit/db/indexing-and-query-risk.md`*  
*Schema inventory: `audit/db/schema-inventory.md`*
