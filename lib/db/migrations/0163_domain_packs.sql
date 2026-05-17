-- Domain Packs — Vertical Orchestrator persistence layer
-- Migration 0163: domain_packs, domain_pack_revisions, domain_pack_audit_events
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

CREATE TABLE IF NOT EXISTS "domain_packs" (
  "id"                    SERIAL PRIMARY KEY,
  "slug"                  TEXT NOT NULL UNIQUE,
  "name"                  TEXT NOT NULL,
  "description"           TEXT NOT NULL DEFAULT '',
  "industry"              TEXT NOT NULL DEFAULT '',
  "ui_shell_template"     TEXT NOT NULL DEFAULT 'standard',
  "pack_json"             JSONB NOT NULL,
  "lifecycle"             TEXT NOT NULL DEFAULT 'draft'
                          CHECK (lifecycle IN ('draft','pending_activation','active','rejected','archived')),
  "activation_decision_id" TEXT,
  "rejection_reason"      TEXT,
  "activated_at"          TIMESTAMPTZ,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_domain_packs_lifecycle"   ON "domain_packs" ("lifecycle");
CREATE INDEX IF NOT EXISTS "idx_domain_packs_created_at"  ON "domain_packs" ("created_at" DESC);

-- Immutable revision history — one row per pack mutation
CREATE TABLE IF NOT EXISTS "domain_pack_revisions" (
  "id"         SERIAL PRIMARY KEY,
  "slug"       TEXT NOT NULL,
  "lifecycle"  TEXT NOT NULL,
  "pack_json"  JSONB NOT NULL,
  "actor_id"   TEXT NOT NULL DEFAULT 'system',
  "note"       TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_dpack_revisions_slug"       ON "domain_pack_revisions" ("slug");
CREATE INDEX IF NOT EXISTS "idx_dpack_revisions_created_at" ON "domain_pack_revisions" ("created_at" DESC);

-- Immutable audit log — activation transitions + other governance events
CREATE TABLE IF NOT EXISTS "domain_pack_audit_events" (
  "id"         SERIAL PRIMARY KEY,
  "slug"       TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "actor_id"   TEXT NOT NULL DEFAULT 'system',
  "outcome"    TEXT NOT NULL,
  "detail"     JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_dpack_audit_slug"       ON "domain_pack_audit_events" ("slug");
CREATE INDEX IF NOT EXISTS "idx_dpack_audit_created_at" ON "domain_pack_audit_events" ("created_at" DESC);

-- Seed the six reference packs as active records.
-- Each INSERT is skipped if the slug already exists (idempotent ON CONFLICT DO NOTHING).

INSERT INTO "domain_packs" ("slug","name","description","industry","ui_shell_template","lifecycle","activated_at","pack_json")
VALUES
  ('counsel',
   'Counsel — Legal Matter Command',
   'Governed decision intelligence for legal matter management.',
   'Legal', 'legal', 'active', NOW(),
   '{"slug":"counsel","name":"Counsel — Legal Matter Command","description":"Governed decision intelligence for legal matter management: discovery tracking, deadline monitoring, privilege gate, and escalation routing.","industry":"Legal","uiShellTemplate":"legal","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"V","version":"v4.2.0"}],"dataSources":[{"connectorId":"court-docket-api","displayName":"Court Docket API","riskLevel":"low","allowedTools":["docket_search","deadline_monitor","document_retrieve"],"blockedTools":["filing_submit","document_modify"]}],"evaluators":[{"evaluatorId":"mirroreval-counsel","displayName":"MirrorEval — Legal","passThreshold":0.90,"dimensions":["groundedness","policy_compliance","evidence_coverage","hallucination_risk"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"General Counsel"},{"riskTier":"high","requiresApprover":"Senior Counsel","autoApproveBelow":0.70},{"riskTier":"medium","requiresApprover":"Matter Lead","autoApproveBelow":0.60}],"selfOptimization":{"rewardSignals":["acceptance_rate","deadline_miss_rate"],"lockedParameters":["privilege_gate_threshold"]},"learningLoop":{"calibrationMetric":"legal_outcome_accuracy","driftThresholdPct":2.0,"recalibrationTrigger":"auto"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb),
  ('vessels',
   'Vessels — Maritime Intelligence',
   'Governed maritime decision intelligence.',
   'Maritime', 'maritime', 'active', NOW(),
   '{"slug":"vessels","name":"Vessels — Maritime Intelligence","description":"Governed maritime decision intelligence: AIS tracking, port congestion, demurrage optimization, and route advisory.","industry":"Maritime","uiShellTemplate":"maritime","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"}],"dataSources":[{"connectorId":"ais-live-api","displayName":"AIS Live API","riskLevel":"low","allowedTools":["vessel_track","eta_lookup","port_congestion"],"blockedTools":["cargo_manifest_write","flag_state_modify"]}],"evaluators":[{"evaluatorId":"mirroreval-maritime","displayName":"MirrorEval — Maritime","passThreshold":0.88,"dimensions":["groundedness","action_safety","stale_context","evidence_coverage"]}],"approvalRules":[{"riskTier":"high","requiresApprover":"VP Operations"},{"riskTier":"medium","requiresApprover":"Fleet Manager","autoApproveBelow":0.60},{"riskTier":"low","requiresApprover":"Duty Officer","autoApproveBelow":0.40}],"selfOptimization":{"rewardSignals":["demurrage_avoided","eta_accuracy"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"port_call_outcome_accuracy","driftThresholdPct":2.5,"recalibrationTrigger":"auto"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb),
  ('terra',
   'Terra — Real Estate Intelligence',
   'Governed real estate decision intelligence.',
   'Real Estate', 'real-estate', 'active', NOW(),
   '{"slug":"terra","name":"Terra — Real Estate Intelligence","description":"Governed real estate decision intelligence: cap rate analysis, LOI routing, portfolio risk, and acquisition advisory.","industry":"Real Estate","uiShellTemplate":"real-estate","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"VI","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-terra","displayName":"MirrorEval — Real Estate","passThreshold":0.85,"dimensions":["groundedness","evidence_coverage","approval_alignment","counterfactual_strength"]}],"approvalRules":[{"riskTier":"high","requiresApprover":"Investment Committee Chair"},{"riskTier":"medium","requiresApprover":"Portfolio Manager"},{"riskTier":"low","requiresApprover":"Asset Manager","autoApproveBelow":0.50}],"selfOptimization":{"rewardSignals":["cap_rate_accuracy","acquisition_outcome"],"lockedParameters":["cap_rate_compression_threshold"]},"learningLoop":{"calibrationMetric":"asset_valuation_accuracy","driftThresholdPct":3.0,"recalibrationTrigger":"auto"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb),
  ('sentra',
   'Sentra — Cyber Resilience Command',
   'Governed cyber defense intelligence.',
   'Cybersecurity', 'defense', 'active', NOW(),
   '{"slug":"sentra","name":"Sentra — Cyber Resilience Command","description":"Governed cyber defense intelligence: threat detection, adversarial simulation, incident response routing, and CISO escalation.","industry":"Cybersecurity","uiShellTemplate":"defense","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"III","version":"v4.2.0"},{"articleId":"IX","version":"v4.2.0"}],"dataSources":[{"connectorId":"defense-intel-feed","displayName":"Defense Intelligence Feed","riskLevel":"low","allowedTools":["threat_lookup","indicator_enrich","cve_query"],"blockedTools":["classified_retrieve","cisa_report_submit"]}],"evaluators":[{"evaluatorId":"mirroreval-sentra","displayName":"MirrorEval — Defense","passThreshold":0.95,"dimensions":["groundedness","action_safety","policy_compliance","scope_adherence","proof_completeness"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"CISO"},{"riskTier":"high","requiresApprover":"Incident Commander"},{"riskTier":"medium","requiresApprover":"SOC Lead","autoApproveBelow":0.65}],"selfOptimization":{"rewardSignals":["detection_latency","false_positive_rate"],"lockedParameters":["threat_escalation_confidence","privilege_escalation_threshold"]},"learningLoop":{"calibrationMetric":"threat_classification_accuracy","driftThresholdPct":1.0,"recalibrationTrigger":"manual"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb),
  ('aegis',
   'Aegis — Defense & Intelligence',
   'Governed defense intelligence for investor and portfolio risk.',
   'Defense & Intelligence', 'defense', 'active', NOW(),
   '{"slug":"aegis","name":"Aegis — Defense & Intelligence","description":"Governed defense intelligence for investor and portfolio risk: threat modeling, scenario analysis, and strategic advisory.","industry":"Defense & Intelligence","uiShellTemplate":"defense","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"III","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-aegis","displayName":"MirrorEval — Defense Intelligence","passThreshold":0.95,"dimensions":["groundedness","action_safety","policy_compliance","proof_completeness"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"Board Intelligence Committee"},{"riskTier":"high","requiresApprover":"Senior Analyst"},{"riskTier":"medium","requiresApprover":"Intelligence Lead","autoApproveBelow":0.65}],"selfOptimization":{"rewardSignals":["scenario_accuracy","analyst_acceptance"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"threat_scenario_accuracy","driftThresholdPct":1.5,"recalibrationTrigger":"manual"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb),
  ('command',
   'Command — Unified Command Center',
   'Governed cross-vertical orchestration and executive briefing.',
   'Enterprise Command', 'standard', 'active', NOW(),
   '{"slug":"command","name":"Command — Unified Command Center","description":"Governed command intelligence for cross-vertical orchestration: signal aggregation, cross-domain routing, and executive briefing.","industry":"Enterprise Command","uiShellTemplate":"standard","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"IV","version":"v4.2.0"},{"articleId":"VIII","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-command","displayName":"MirrorEval — Command","passThreshold":0.90,"dimensions":["groundedness","evidence_coverage","approval_alignment","policy_compliance"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"C-Suite"},{"riskTier":"high","requiresApprover":"VP Level"},{"riskTier":"medium","requiresApprover":"Director","autoApproveBelow":0.60}],"selfOptimization":{"rewardSignals":["cross_vertical_routing_accuracy","executive_acceptance"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"cross_domain_outcome_accuracy","driftThresholdPct":2.0,"recalibrationTrigger":"auto"},"lifecycle":"active","createdAt":"2026-01-15T00:00:00Z","updatedAt":"2026-04-20T00:00:00Z","activatedAt":"2026-01-15T00:00:00Z"}'::jsonb)
ON CONFLICT ("slug") DO NOTHING;

-- Seed audit events for the reference packs
INSERT INTO "domain_pack_audit_events" ("slug","action","actor_id","outcome","detail")
SELECT slug, 'seed_activated', 'migration-0163', 'success', jsonb_build_object('note','Reference pack seeded by migration 0163')
FROM (VALUES ('counsel'),('vessels'),('terra'),('sentra'),('aegis'),('command')) AS s(slug)
WHERE NOT EXISTS (
  SELECT 1 FROM "domain_pack_audit_events" WHERE "slug" = s.slug AND "action" = 'seed_activated'
);
