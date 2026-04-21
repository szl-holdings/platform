# Database Redundancy Audit

Generated: 2026-04-20  
Phase: B (Code Quality & Database Audit)

---

## 1. Denormalized / Computed Fields Stored in Tables

### 1.1 `vessels_fleets.vesselCount` — Denormalized Count

```ts
vesselCount: integer("vessel_count").default(0),
```

`vessel_count` on the `vessels_fleets` table is a denormalized count of vessels in a fleet. The authoritative count is `COUNT(*) FROM vessels WHERE fleet_id = ?`. This field will drift from reality unless every insert/delete on `vessels` triggers an update to `vessels_fleets.vessel_count`.

**Options:**
1. Remove `vessel_count` and compute at query time (JOIN + COUNT)
2. Keep it but add a trigger or application-level increment/decrement to maintain consistency
3. Use a materialized view (not yet used anywhere in the schema)

**Recommendation:** Remove `vessel_count` and compute on demand. The fleet is not expected to have thousands of vessels; the JOIN cost is negligible.

---

### 1.2 `terra_agents` — Denormalized Metrics

```ts
activeListings: integer("active_listings").notNull().default(0),
closedDealsLtm: integer("closed_deals_ltm").notNull().default(0),
closeRatePct: numeric("close_rate_pct", ...),
avgDaysToContract: integer("avg_days_to_contract"),
inquiryConversionPct: numeric("inquiry_conversion_pct", ...),
```

These are aggregate metrics stored on the agent row. They will drift from the actual `terra_listings` and `terra_deals` data unless refreshed explicitly.

For a demo dataset this is acceptable (seed data sets these values). For production this creates data integrity risk.

**Recommendation:** If Terra is a live system, move these to a computed view or a materialized summary table that refreshes on schedule. For the current demo scope, document that these are manually maintained seed values.

---

### 1.3 `terra_brokerages` — Denormalized Metrics

```ts
headCount: integer("head_count").notNull().default(1),
activeListings: integer("active_listings").notNull().default(0),
closedVolumeLtm: numeric("closed_volume_ltm", ...),
```

Same pattern as `terra_agents`. These aggregate metrics on the brokerage row will drift from agent/listing data.

---

### 1.4 `alloy_workflows` and `alloy_platform.alloyWorkflowsTable` — `runCount` Denormalized

Both workflow tables have a `runCount` column:
```ts
runCount: integer("run_count").notNull().default(0),
```

The authoritative run count is `COUNT(*) FROM alloy_workflow_runs WHERE workflow_id = ?`. Denormalized counters drift if run insertions fail mid-transaction.

**Recommendation:** Remove `run_count` or maintain it via DB trigger. Prefer computing from the runs table.

---

## 2. Redundant Join Tables

### 2.1 `org_members` vs `organization_memberships`

See `schema-audit.md` §1.1. Two tables exist for the same membership relationship. One is redundant.

---

### 2.2 `user_roles` + `roles` vs `users.platformRole`

The schema has TWO role assignment mechanisms:

1. **`users.platformRole`** — an inline enum column on the user row (`anonymous_visitor`, `founder_admin`, etc.)
2. **`user_roles` + `roles`** — a proper join table with a separate `roles` table

This creates an inconsistency: some code may check `users.platform_role` while other code checks `user_roles`. The authoritative role source is ambiguous.

**Recommendation:** Pick one mechanism. If RBAC (role table + join table) is the target pattern, deprecate `users.platform_role` and migrate to querying `user_roles`. If the simple inline enum is sufficient, remove `user_roles` and `roles`. The inline enum has fewer moving parts for the current product scope.

**Risk:** High — impacts auth middleware. Flag for human review.

---

## 3. Redundant JSONB Fields

### 3.1 `firestorm_findings.auditTrail` — Inline JSONB Audit

```ts
auditTrail: jsonb("audit_trail").$type<Array<{ action: string; user: string; at: string }>>(),
```

This stores an audit history inline on the finding row. This is:
- Unbounded (will grow without limit)
- Not queryable efficiently
- Duplicates the purpose of `audit_logs`

**Recommendation:** Remove `findings.audit_trail` and route finding mutations through `audit_logs` with `entity_type = "firestorm_finding"` and `entity_id = finding.id`.

---

### 3.2 `alloy_workflow_runs.stateHistory` — Inline JSONB State Log

```ts
stateHistory: jsonb("state_history"),
```

Stores a history of state transitions inline. Same concerns as above.

**Recommendation:** Create a `alloy_workflow_run_events` table with `(run_id, from_state, to_state, transitioned_at, actor_id)`. This makes state history queryable and bounded.

---

### 3.3 `alloy_signals.tags` — JSONB Array

```ts
tags: jsonb("tags").default([]),
```

JSONB arrays for tags are acceptable for small sets and flexible tagging. However, if tag-based filtering is required, a `text[]` PostgreSQL array with a GIN index would be more efficient.

**Recommendation (low priority):** If tag filtering is a common query pattern, migrate to `text[]` with a GIN index.

---

## 4. Materialized Field Candidates

The following fields are good candidates for materialized views or computed columns:

| Table | Field(s) | Query to Materialize |
|-------|---------|----------------------|
| `vessels_fleets` | `vessel_count` | `COUNT(*) FROM vessels WHERE fleet_id = ?` |
| `terra_agents` | `active_listings`, `closed_deals_ltm`, `close_rate_pct` | Aggregate from `terra_listings`, `terra_deals` |
| `terra_brokerages` | `head_count`, `active_listings`, `closed_volume_ltm` | Aggregate from `terra_agents`, `terra_listings` |
| `alloy_workflows` | `run_count` | `COUNT(*) FROM alloy_workflow_runs WHERE workflow_id = ?` |

PostgreSQL materialized views or a scheduled refresh job could replace these denormalized fields cleanly.

---

## 5. JSONB vs Relational Tradeoffs

Multiple tables use JSONB heavily for flexible data storage:

| Table | JSONB Columns | Concern |
|-------|--------------|---------|
| `alloy_workflow_runs` | `input`, `output`, `stateHistory` | Unbounded; not queryable |
| `firestorm_findings` | `evidence`, `auditTrail` | Audit trail should be relational |
| `alloy_workflows` | `triggerConfig`, `steps` | Workflow steps as JSONB is acceptable for flexibility |
| `vessels_routes` | `waypoints` | Geographic data — GeoJSON JSONB is appropriate |
| `terra_properties` | `tags`, `rawData` | `rawData` is a catch-all — likely never queried |

**Recommendation:** `rawData` on `terra_properties` should be reviewed. If it's never queried or used in queries, remove it to save storage.
