-- Migration 0069: Missing index sweep
-- Adds high-priority indexes identified in audit/db/index-audit.md.
-- All statements use CREATE INDEX IF NOT EXISTS — safe to re-run.

--> statement-breakpoint
-- Auth: sessions
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_revoked_at_idx ON sessions (revoked_at);

--> statement-breakpoint
-- Auth: api_keys
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS api_keys_org_id_idx ON api_keys (org_id);

--> statement-breakpoint
-- Auth: org_invitations
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON org_invitations (email);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS org_invitations_org_id_idx ON org_invitations (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON org_invitations (status);

--> statement-breakpoint
-- Org: members
CREATE INDEX IF NOT EXISTS org_members_org_id_idx ON org_members (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON org_members (user_id);

--> statement-breakpoint
-- Audit logs (currently zero indexes beyond PK — every query is a full scan)
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs (actor_user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_org_id_idx ON audit_logs (organization_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

--> statement-breakpoint
-- Notifications
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, is_read);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);

--> statement-breakpoint
-- Billing: subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON subscriptions (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON subscriptions (stripe_subscription_id);

--> statement-breakpoint
-- Billing: invoices
CREATE INDEX IF NOT EXISTS invoices_org_id_idx ON invoices (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS invoices_stripe_id_idx ON invoices (stripe_invoice_id);

--> statement-breakpoint
-- Billing: usage_events
CREATE INDEX IF NOT EXISTS usage_events_org_feature_idx ON usage_events (org_id, feature_key, recorded_at DESC);

--> statement-breakpoint
-- Vessels
CREATE INDEX IF NOT EXISTS vessels_status_idx ON vessels (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_org_id_idx ON vessels (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_positions_vessel_recorded_idx ON vessels_positions (vessel_id, recorded_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_alerts_vessel_id_idx ON vessels_alerts (vessel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_alerts_status_idx ON vessels_alerts (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_events_vessel_id_occurred_idx ON vessels_events (vessel_id, occurred_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vessels_events_status_idx ON vessels_events (status);

--> statement-breakpoint
-- Prism Counsel: FK-backing indexes for child tables (all FK-backed scans)
CREATE INDEX IF NOT EXISTS pc_matters_org_id_idx ON pc_matters (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_matters_status_idx ON pc_matters (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_deadlines_matter_id_idx ON pc_deadlines (matter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_deadlines_due_date_idx ON pc_deadlines (due_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_parties_matter_id_idx ON pc_parties (matter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_claims_matter_id_idx ON pc_claims (matter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_offers_matter_id_idx ON pc_offers (matter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_medical_events_matter_id_idx ON pc_medical_events (matter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS pc_damages_matter_id_idx ON pc_damages (matter_id);
