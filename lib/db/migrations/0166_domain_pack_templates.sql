-- Domain Pack Templates — library of archived-vertical blueprints
-- Migration 0166: domain_pack_templates (library), capability_proposal_log (cross-pack learning loop bridge)
-- Idempotent: all statements use IF NOT EXISTS / ON CONFLICT DO NOTHING.

CREATE TABLE IF NOT EXISTS "domain_pack_templates" (
  "id"            SERIAL PRIMARY KEY,
  "slug"          TEXT NOT NULL UNIQUE,
  "name"          TEXT NOT NULL,
  "description"   TEXT NOT NULL DEFAULT '',
  "industry"      TEXT NOT NULL DEFAULT '',
  "origin"        TEXT NOT NULL DEFAULT 'archived_vertical',
  "tags"          JSONB NOT NULL DEFAULT '[]'::jsonb,
  "template_json" JSONB NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_domain_pack_templates_origin" ON "domain_pack_templates" ("origin");

-- Bridge table — records each capability proposal emission so the orchestrator
-- can show its own audit trail of what was sent to the #4385 frontier inbox.
-- The proposal *itself* lives in frontier_artifacts/frontier_inbox; this table
-- just records the orchestrator-side reference so the UI doesn't have to JOIN
-- across worlds.
CREATE TABLE IF NOT EXISTS "capability_proposal_log" (
  "id"               SERIAL PRIMARY KEY,
  "source_pack_slug" TEXT NOT NULL,
  "artifact_id"      TEXT NOT NULL,
  "inbox_id"         TEXT,
  "title"            TEXT NOT NULL,
  "summary"          TEXT,
  "evidence"         JSONB,
  "actor_id"         TEXT NOT NULL DEFAULT 'system',
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_cap_proposal_src" ON "capability_proposal_log" ("source_pack_slug");
CREATE INDEX IF NOT EXISTS "idx_cap_proposal_created" ON "capability_proposal_log" ("created_at" DESC);

-- Seed six archived-vertical templates. These are *library blueprints*, not
-- live packs — instantiating one materializes a new draft in domain_packs.
INSERT INTO "domain_pack_templates" ("slug","name","description","industry","origin","tags","template_json")
VALUES
  ('tpl-counsel',
   'Counsel — Legal Matter Command',
   'Discovery tracking, deadline monitoring, privilege gate, escalation routing.',
   'Legal', 'archived_vertical',
   '["legal","discovery","privilege","matter-management"]'::jsonb,
   '{"name":"Counsel — Legal Matter Command","description":"Governed decision intelligence for legal matter management.","industry":"Legal","uiShellTemplate":"legal","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"V","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-legal","displayName":"MirrorEval — Legal","passThreshold":0.90,"dimensions":["groundedness","policy_compliance","evidence_coverage","hallucination_risk"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"General Counsel"},{"riskTier":"high","requiresApprover":"Senior Counsel"},{"riskTier":"medium","requiresApprover":"Matter Lead"}],"selfOptimization":{"rewardSignals":["acceptance_rate","deadline_miss_rate"],"lockedParameters":["privilege_gate_threshold"]},"learningLoop":{"calibrationMetric":"legal_outcome_accuracy","driftThresholdPct":2.0,"recalibrationTrigger":"auto"}}'::jsonb),
  ('tpl-terra',
   'Terra — Real Estate Intelligence',
   'Cap rate analysis, LOI routing, portfolio risk, acquisition advisory.',
   'Real Estate', 'archived_vertical',
   '["real-estate","cap-rate","acquisition","portfolio"]'::jsonb,
   '{"name":"Terra — Real Estate Intelligence","description":"Governed real estate decision intelligence.","industry":"Real Estate","uiShellTemplate":"real-estate","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"VI","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-standard","displayName":"MirrorEval Standard","passThreshold":0.85,"dimensions":["groundedness","evidence_coverage","approval_alignment"]}],"approvalRules":[{"riskTier":"high","requiresApprover":"Investment Committee Chair"},{"riskTier":"medium","requiresApprover":"Portfolio Manager"},{"riskTier":"low","requiresApprover":"Asset Manager"}],"selfOptimization":{"rewardSignals":["cap_rate_accuracy","acquisition_outcome"],"lockedParameters":["cap_rate_compression_threshold"]},"learningLoop":{"calibrationMetric":"asset_valuation_accuracy","driftThresholdPct":3.0,"recalibrationTrigger":"auto"}}'::jsonb),
  ('tpl-command',
   'Command — Unified Command Center',
   'Cross-vertical orchestration, signal aggregation, executive briefing.',
   'Enterprise Command', 'archived_vertical',
   '["command","cross-vertical","executive","briefing"]'::jsonb,
   '{"name":"Command — Unified Command Center","description":"Governed cross-vertical orchestration.","industry":"Enterprise Command","uiShellTemplate":"standard","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"IV","version":"v4.2.0"},{"articleId":"VIII","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-standard","displayName":"MirrorEval Standard","passThreshold":0.90,"dimensions":["groundedness","evidence_coverage","approval_alignment","policy_compliance"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"C-Suite"},{"riskTier":"high","requiresApprover":"VP Level"},{"riskTier":"medium","requiresApprover":"Director"}],"selfOptimization":{"rewardSignals":["cross_vertical_routing_accuracy","executive_acceptance"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"cross_domain_outcome_accuracy","driftThresholdPct":2.0,"recalibrationTrigger":"auto"}}'::jsonb),
  ('tpl-lyte',
   'Lyte — Energy Trading Floor',
   'Power curve forecasting, congestion modeling, governed dispatch advisory.',
   'Energy', 'archived_vertical',
   '["energy","power","trading","dispatch"]'::jsonb,
   '{"name":"Lyte — Energy Trading Floor","description":"Governed energy market decision intelligence.","industry":"Energy","uiShellTemplate":"standard","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"III","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-strict","displayName":"MirrorEval Strict","passThreshold":0.92,"dimensions":["groundedness","action_safety","policy_compliance","scope_adherence"]}],"approvalRules":[{"riskTier":"critical","requiresApprover":"Head of Trading"},{"riskTier":"high","requiresApprover":"Desk Lead"},{"riskTier":"medium","requiresApprover":"Senior Trader"}],"selfOptimization":{"rewardSignals":["pnl_attribution","dispatch_accuracy"],"lockedParameters":["max_position_size","price_collar_threshold"]},"learningLoop":{"calibrationMetric":"forecast_calibration","driftThresholdPct":1.5,"recalibrationTrigger":"auto"}}'::jsonb),
  ('tpl-pulse',
   'Pulse — Briefing Distribution',
   'Editorial newsroom for AI-generated, human-approved client briefings.',
   'Media & Briefings', 'archived_vertical',
   '["pulse","briefings","editorial","distribution"]'::jsonb,
   '{"name":"Pulse — Briefing Distribution","description":"Governed editorial briefing distribution.","industry":"Media & Briefings","uiShellTemplate":"standard","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"IV","version":"v4.2.0"},{"articleId":"V","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-standard","displayName":"MirrorEval Standard","passThreshold":0.88,"dimensions":["groundedness","evidence_coverage","hallucination_risk"]}],"approvalRules":[{"riskTier":"high","requiresApprover":"Editor-in-Chief"},{"riskTier":"medium","requiresApprover":"Section Editor"},{"riskTier":"low","requiresApprover":"Desk Editor"}],"selfOptimization":{"rewardSignals":["reader_engagement","correction_rate"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"editorial_acceptance_rate","driftThresholdPct":2.5,"recalibrationTrigger":"auto"}}'::jsonb),
  ('tpl-carlota-jo',
   'Carlota Jo — Founder Operating System',
   'Founder-operator OS: weekly cadence, KPI watch, governed decision tee-ups.',
   'Founder Ops', 'archived_vertical',
   '["carlota-jo","founder","cadence","operating-system"]'::jsonb,
   '{"name":"Carlota Jo — Founder Operating System","description":"Governed founder operating cadence.","industry":"Founder Ops","uiShellTemplate":"standard","constitution":[{"articleId":"I","version":"v4.2.0"},{"articleId":"II","version":"v4.2.0"},{"articleId":"IV","version":"v4.2.0"}],"dataSources":[],"evaluators":[{"evaluatorId":"mirroreval-standard","displayName":"MirrorEval Standard","passThreshold":0.85,"dimensions":["groundedness","evidence_coverage","approval_alignment"]}],"approvalRules":[{"riskTier":"high","requiresApprover":"Founder"},{"riskTier":"medium","requiresApprover":"Chief of Staff"}],"selfOptimization":{"rewardSignals":["decision_velocity","operator_acceptance"],"lockedParameters":[]},"learningLoop":{"calibrationMetric":"weekly_cadence_adherence","driftThresholdPct":3.0,"recalibrationTrigger":"manual"}}'::jsonb)
ON CONFLICT ("slug") DO NOTHING;
