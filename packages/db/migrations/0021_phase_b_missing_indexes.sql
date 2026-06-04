-- Migration: 0021_phase_b_missing_indexes
-- Phase B Series A hardening — safe additive index additions
-- All indexes use IF NOT EXISTS and are non-blocking (no data loss, no locks on insert/update).
-- Generated: 2026-04-20

-- ── audit_logs ───────────────────────────────────────────────────────────────
-- High-priority: append-only event log grows rapidly; tenant-scoped queries must not full-scan.
CREATE INDEX IF NOT EXISTS audit_logs_org_id_idx        ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_type_idx   ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx   ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx    ON audit_logs(created_at DESC);
-- Composite: org-scoped audit log paging (most common query pattern)
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx   ON audit_logs(organization_id, created_at DESC);

-- ── vessels_positions ────────────────────────────────────────────────────────
-- Critical: high-volume AIS append table; vessel history queries degrade without these.
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_id_idx      ON vessels_positions(vessel_id);
CREATE INDEX IF NOT EXISTS vessels_positions_recorded_at_idx    ON vessels_positions(recorded_at DESC);
-- Composite: vessel history queries (vessel_id + time range)
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_recorded_idx ON vessels_positions(vessel_id, recorded_at DESC);

-- ── vessels_cargo ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vessels_cargo_vessel_id_idx ON vessels_cargo(vessel_id);

-- ── vessels_routes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vessels_routes_vessel_id_idx ON vessels_routes(vessel_id);

-- ── vessels_alerts ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vessels_alerts_vessel_id_idx ON vessels_alerts(vessel_id);
CREATE INDEX IF NOT EXISTS vessels_alerts_rule_id_idx   ON vessels_alerts(rule_id);
CREATE INDEX IF NOT EXISTS vessels_alerts_status_idx    ON vessels_alerts(status);
CREATE INDEX IF NOT EXISTS vessels_alerts_triggered_idx ON vessels_alerts(triggered_at DESC);

-- ── sessions ─────────────────────────────────────────────────────────────────
-- Session invalidation and listing by user requires index on user_id.
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- ── firestorm_findings ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS firestorm_findings_assessment_id_idx ON firestorm_findings(assessment_id);
CREATE INDEX IF NOT EXISTS firestorm_findings_severity_idx      ON firestorm_findings(severity);
CREATE INDEX IF NOT EXISTS firestorm_findings_status_idx        ON firestorm_findings(status);
-- Composite: open critical findings per assessment
CREATE INDEX IF NOT EXISTS firestorm_findings_assess_sev_idx    ON firestorm_findings(assessment_id, severity);

-- ── firestorm_simulation_runs ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS firestorm_simulation_runs_assessment_id_idx ON firestorm_simulation_runs(assessment_id);
CREATE INDEX IF NOT EXISTS firestorm_simulation_runs_scenario_id_idx   ON firestorm_simulation_runs(scenario_id);

-- ── org_members ──────────────────────────────────────────────────────────────
-- Listing all orgs for a user (user → orgs join direction) requires standalone user_id index.
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON org_members(user_id);
