# Index Audit

Generated: 2026-04-20  
Phase: B (Code Quality & Database Audit)

---

## 1. Missing Indexes on High-Cardinality FK Columns

The following tables have FK columns with no index defined in the Drizzle schema. In PostgreSQL, FK columns are NOT automatically indexed — they must be declared explicitly.

### `audit_logs`

| Column | FK Target | Index? | Impact |
|--------|-----------|--------|--------|
| `actor_user_id` | `users(id)` | **MISSING** | Queries filtering by user actor will scan full table |
| `organization_id` | `organizations(id)` | **MISSING** | Tenant-scoped audit queries will full-scan |
| `action_type` | (enum, no FK) | **MISSING** | Filtering by action type is a common query pattern |
| `entity_type` | (text, no FK) | **MISSING** | Filtering by entity type is a common query pattern |
| `created_at` | — | **MISSING** | Time-range queries on the append-only log |

`audit_logs` is the most critical table missing indexes. As the append-only event log it will grow rapidly, making full scans expensive.

**Migration (safe — additive):** See `cleanup-migrations/` for the proposed migration.

---

### `vessels_positions`

| Column | FK Target | Index? | Impact |
|--------|-----------|--------|--------|
| `vessel_id` | `vessels(id)` | **MISSING** | Every position lookup by vessel scans the full table |
| `recorded_at` | — | **MISSING** | Time-range position history queries |

`vessels_positions` is a high-volume append table (one row per AIS ping). Missing indexes on `vessel_id` and `recorded_at` will cause severe performance degradation at scale.

**Priority: Critical.**

---

### `vessels_cargo`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `vessel_id` | `vessels(id)` | **MISSING** |

---

### `vessels_routes`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `vessel_id` | `vessels(id)` | **MISSING** |

---

### `vessels_alerts`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `rule_id` | `vessels_alert_rules(id)` | **MISSING** |
| `vessel_id` | `vessels(id)` | **MISSING** |
| `status` | (enum) | **MISSING** — filtering active alerts is common |
| `triggered_at` | — | **MISSING** |

---

### `vessels_weather_snapshots`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `route_id` | `vessels_routes(id)` | **MISSING** |

---

### `sessions`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `user_id` | `users(id)` | **MISSING** | Session invalidation by user requires a full scan |

`sessions.token` has a unique index (correct). But listing all sessions for a user requires scanning every session row without a `user_id` index.

---

### `user_roles`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `user_id` | `users(id)` | Has `user_role_unique` composite index | OK |
| `role_id` | `roles(id)` | No standalone index (composite covers it partially) | Acceptable |

---

### `org_members`

| Column | FK Target | Index? |
|--------|-----------|--------|
| `org_id` | `organizations(id)` | Has `org_members_org_user_uq` composite unique | OK |
| `user_id` | `users(id)` | No standalone index | **MISSING** — listing all orgs for a user requires scan |

---

### `firestorm_assessments`, `firestorm_findings`, `firestorm_simulation_runs`

| Table | Column | Index? |
|-------|--------|--------|
| `firestorm_findings` | `assessment_id` | **MISSING** |
| `firestorm_findings` | `severity` | **MISSING** |
| `firestorm_findings` | `status` | **MISSING** |
| `firestorm_simulation_runs` | `assessment_id` | **MISSING** |
| `firestorm_simulation_runs` | `scenario_id` | **MISSING** |

---

### `alloy_workflow_runs` (alloy.ts: `alloyWorkflowRuns`)

| Column | Index? |
|--------|--------|
| `workflow_id` | **MISSING** |
| `status` | **MISSING** |
| `created_at` | **MISSING** |

---

## 2. Potentially Duplicate Indexes

### `terra_properties` — Over-indexed for Development

`terra_properties` declares 8 indexes including a unique composite:
```
terra_property_type_idx, terra_property_submarket_idx, terra_property_zip_idx,
terra_property_active_idx, terra_property_owner_idx, terra_property_owner_type_idx,
terra_property_created_idx, terra_property_address_city_state_uniq
```

For a demo/seed dataset of a few hundred properties, this level of indexing adds write overhead without benefiting query performance meaningfully. However, for production scale these indexes are appropriate.

**Recommendation:** Keep all terra_properties indexes for production. No removals recommended.

---

### `terra_agents` — 4 Indexes

`terra_agent_brokerage_idx`, `terra_agent_status_idx`, `terra_agent_specialty_idx`, `terra_agent_created_idx` — appropriate for production.

---

### `alloy.ts` — `dedupeKey` Unique on `alloy_signals`

`alloySignals` has `dedupeKey: text("dedupe_key")` — nullable with no unique index declared in the schema. If deduplication is enforced at application level, this is fine. If it should be enforced at DB level, add a `UNIQUE` index on `dedupe_key` where `dedupe_key IS NOT NULL`.

---

## 3. Composite Index Opportunities

The following query patterns are common but no composite index covers them:

| Table | Suggested Composite Index | Common Query Pattern |
|-------|--------------------------|---------------------|
| `audit_logs` | `(organization_id, created_at)` | Org-scoped audit log paging |
| `vessels_positions` | `(vessel_id, recorded_at DESC)` | Position history for a vessel |
| `firestorm_findings` | `(assessment_id, severity)` | Open critical findings per assessment |
| `alloy_workflow_runs` | `(workflow_id, state, created_at)` | Workflow run status queries |

---

## 4. Proposed Safe Index Migrations

The following indexes are safe to add (purely additive, no data loss):

```sql
-- audit_logs
CREATE INDEX IF NOT EXISTS audit_logs_org_id_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_type_idx ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);

-- vessels_positions
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_id_idx ON vessels_positions(vessel_id);
CREATE INDEX IF NOT EXISTS vessels_positions_recorded_at_idx ON vessels_positions(recorded_at DESC);
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_recorded_idx ON vessels_positions(vessel_id, recorded_at DESC);

-- vessels_cargo
CREATE INDEX IF NOT EXISTS vessels_cargo_vessel_id_idx ON vessels_cargo(vessel_id);

-- vessels_routes
CREATE INDEX IF NOT EXISTS vessels_routes_vessel_id_idx ON vessels_routes(vessel_id);

-- vessels_alerts
CREATE INDEX IF NOT EXISTS vessels_alerts_vessel_id_idx ON vessels_alerts(vessel_id);
CREATE INDEX IF NOT EXISTS vessels_alerts_rule_id_idx ON vessels_alerts(rule_id);
CREATE INDEX IF NOT EXISTS vessels_alerts_status_idx ON vessels_alerts(status);

-- sessions
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- firestorm_findings
CREATE INDEX IF NOT EXISTS firestorm_findings_assessment_id_idx ON firestorm_findings(assessment_id);
CREATE INDEX IF NOT EXISTS firestorm_findings_severity_idx ON firestorm_findings(severity);
CREATE INDEX IF NOT EXISTS firestorm_findings_status_idx ON firestorm_findings(status);

-- firestorm_simulation_runs
CREATE INDEX IF NOT EXISTS firestorm_simulation_runs_assessment_id_idx ON firestorm_simulation_runs(assessment_id);
```

These are written as a Drizzle migration in `lib/db/migrations/0021_phase_b_missing_indexes.sql`.  
See `cleanup-migrations/` for the full file.
