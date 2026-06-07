-- Alloy Runtime Agents Registry
-- Creates the alloy_runtime_agents and alloy_runtime_agent_versions tables
-- required for the AI Model Registry governance page at /intel/models
-- Also seeds the 7 canonical Aegis platform agents so the registry shows
-- live data on any fresh migrated environment (ON CONFLICT DO NOTHING is safe
-- for re-runs and environments where rows already exist).

CREATE TABLE IF NOT EXISTS "alloy_runtime_agents" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL UNIQUE,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "domain" text NOT NULL DEFAULT 'general',
  "policy_tier" text NOT NULL DEFAULT 'internal-workflow',
  "default_model" text,
  "capabilities" jsonb DEFAULT '[]'::jsonb,
  "tool_access" jsonb DEFAULT '[]'::jsonb,
  "max_cost_per_run_usd" numeric(10,4),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "alloy_runtime_agent_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "version" text NOT NULL,
  "changelog" text,
  "snapshot" jsonb NOT NULL,
  "is_deployed" boolean NOT NULL DEFAULT false,
  "deployed_at" timestamp,
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "alloy_agent_org_idx" ON "alloy_runtime_agents"("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_agent_domain_idx" ON "alloy_runtime_agents"("domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_agent_active_idx" ON "alloy_runtime_agents"("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_agent_ver_agent_idx" ON "alloy_runtime_agent_versions"("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_agent_ver_deployed_idx" ON "alloy_runtime_agent_versions"("is_deployed");--> statement-breakpoint

-- Ensure the demo org (id=1) exists so FK references below do not fail on a
-- fresh database. ON CONFLICT DO NOTHING makes this safe for re-runs.
INSERT INTO "organizations" (id, name, slug, org_type, plan)
VALUES (1, 'SZL Holdings (Demo)', 'szl-holdings-demo', 'internal', 'enterprise')
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

-- Advance the organizations sequence so the next default INSERT doesn't collide
-- with id=1. GREATEST(..., 1) makes this safe for both fresh and existing DBs.
SELECT setval(
  pg_get_serial_sequence('organizations', 'id'),
  GREATEST((SELECT MAX(id) FROM organizations), 1)
);--> statement-breakpoint

-- Seed the 7 canonical Aegis platform agents.
-- ON CONFLICT (agent_id) DO NOTHING ensures idempotent re-runs.
INSERT INTO "alloy_runtime_agents"
  (agent_id, org_id, name, description, domain, policy_tier, default_model, capabilities, tool_access, max_cost_per_run_usd, is_active, metadata)
VALUES
(
  'aegis-sentinel', 1, 'Sentinel',
  'Real-time cyber threat detection and incident triage agent. Continuously monitors telemetry streams, correlates SIEM events, and escalates high-confidence threats to the SOC.',
  'cybersecurity', 'tier-1-critical', 'anthropic/claude-sonnet-4-5',
  '["threat-detection","siem-correlation","incident-triage","alert-scoring"]'::jsonb,
  '["firestorm-alerts","mitre-lookup","asset-registry","soar-playbooks"]'::jsonb,
  0.50, true,
  '{"version":"3.2.1","confidenceBaseline":0.94,"framework":"MITRE ATT&CK v14","lastAudit":"2026-03-15","deployedRegions":["us-east-1","eu-west-1"]}'::jsonb
),
(
  'aegis-quipu', 1, 'Quipu',
  'Structured intelligence record-keeping and evidence chain agent. Maintains tamper-evident audit trails for all AI-generated decisions, evidence collections, and case linkages across Aegis.',
  'intelligence', 'tier-2-sensitive', 'anthropic/claude-sonnet-4-5',
  '["evidence-chain","audit-trail","case-linkage","structured-recall"]'::jsonb,
  '["audit-log","case-memory","vector-store","evidence-index"]'::jsonb,
  0.25, true,
  '{"version":"2.4.0","confidenceBaseline":0.98,"storageBackend":"pgvector","retentionPolicy":"immutable-7yr","lastAudit":"2026-04-01"}'::jsonb
),
(
  'aegis-willaq-umu', 1, 'Willaq-Umu',
  'Predictive oracle agent for threat forecasting and adversary behaviour modelling. Synthesises open-source intelligence, STIX feeds, and historical campaign data to generate probabilistic attack projections.',
  'threat-intelligence', 'tier-2-sensitive', 'anthropic/claude-opus-4-5',
  '["threat-forecasting","adversary-modelling","stix-synthesis","campaign-attribution"]'::jsonb,
  '["taxii-feeds","stix-objects","mitre-coverage","historical-campaigns"]'::jsonb,
  1.20, true,
  '{"version":"1.8.3","confidenceBaseline":0.87,"forecastHorizonDays":30,"attributionModels":["apt29","lazarus","sandworm"],"lastAudit":"2026-02-28"}'::jsonb
),
(
  'aegis-dual-mind', 1, 'Dual-Mind',
  'Dual-mode decision orchestration agent that operates both autonomously and under human-in-the-loop oversight depending on threat severity and policy tier.',
  'decision-orchestration', 'tier-1-critical', 'anthropic/claude-sonnet-4-5',
  '["mode-switching","approval-routing","policy-evaluation","human-in-the-loop"]'::jsonb,
  '["alloy-approvals","policy-engine","workflow-router","audit-log"]'::jsonb,
  0.40, true,
  '{"version":"2.1.0","confidenceBaseline":0.91,"autonomousThreshold":0.95,"humanReviewThreshold":0.75,"lastAudit":"2026-03-22"}'::jsonb
),
(
  'aegis-chasqui', 1, 'Chasqui',
  'High-speed intelligence relay and inter-agent messaging agent. Ensures reliable, ordered delivery of signals, alerts, and decision payloads between Aegis sub-agents and external platform connectors.',
  'communications', 'internal-workflow', 'openai/gpt-4o-mini',
  '["signal-relay","message-ordering","retry-logic","connector-bridge"]'::jsonb,
  '["pubsub-bridge","websocket-broadcast","alloy-signals","connector-registry"]'::jsonb,
  0.05, true,
  '{"version":"1.5.2","confidenceBaseline":0.99,"maxThroughputMsgSec":5000,"deliveryGuarantee":"at-least-once","lastAudit":"2026-04-10"}'::jsonb
),
(
  'aegis-nexus', 1, 'Nexus',
  'Unified agentic integration layer that bridges Aegis with all external SZL platform services (Terra, Vessels, PRISM Counsel, Pulse). Manages cross-domain context propagation and shared knowledge graphs.',
  'integration', 'tier-2-sensitive', 'anthropic/claude-sonnet-4-5',
  '["cross-domain-context","knowledge-graph-sync","api-federation","semantic-routing"]'::jsonb,
  '["constellation-graph","cross-domain-registry","api-gateway","context-store"]'::jsonb,
  0.60, true,
  '{"version":"4.0.1","confidenceBaseline":0.92,"connectedDomains":["terra","vessels","counsel","pulse","command"],"graphNodes":142800,"lastAudit":"2026-04-12"}'::jsonb
),
(
  'aegis-inca-lab', 1, 'INCA Lab',
  'Experimental research and red-team simulation agent. Runs adversarial simulations, tabletop exercises, and novel technique evaluations in a sandboxed environment to stress-test Aegis defences.',
  'research', 'sandboxed-research', 'anthropic/claude-opus-4-5',
  '["red-team-simulation","tabletop-exercise","novel-technique-eval","sandbox-execution"]'::jsonb,
  '["simulation-runtime","sandbox-env","scenario-library","firestorm-scenarios"]'::jsonb,
  2.00, true,
  '{"version":"0.9.4","confidenceBaseline":0.82,"sandboxIsolation":"full","allowedInProduction":false,"activeExperiments":3,"lastAudit":"2026-03-30"}'::jsonb
)
ON CONFLICT (agent_id) DO NOTHING;--> statement-breakpoint

-- Seed the deployed version record for each agent.
INSERT INTO "alloy_runtime_agent_versions"
  (agent_id, version, changelog, snapshot, is_deployed, deployed_at)
VALUES
(
  'aegis-sentinel', '3.2.1',
  'Upgraded to Claude Sonnet 4.5. Improved lateral movement detection precision by 18%.',
  '{"name":"Sentinel","domain":"cybersecurity","policyTier":"tier-1-critical","defaultModel":"anthropic/claude-sonnet-4-5","confidenceBaseline":0.94}'::jsonb,
  true, now()
),
(
  'aegis-quipu', '2.4.0',
  'Added pgvector semantic recall. Evidence index latency reduced from 840ms to 120ms.',
  '{"name":"Quipu","domain":"intelligence","policyTier":"tier-2-sensitive","defaultModel":"anthropic/claude-sonnet-4-5","confidenceBaseline":0.98}'::jsonb,
  true, now()
),
(
  'aegis-willaq-umu', '1.8.3',
  'Added Sandworm attribution model. Forecast horizon extended to 30 days. Claude Opus upgrade.',
  '{"name":"Willaq-Umu","domain":"threat-intelligence","policyTier":"tier-2-sensitive","defaultModel":"anthropic/claude-opus-4-5","confidenceBaseline":0.87}'::jsonb,
  true, now()
),
(
  'aegis-dual-mind', '2.1.0',
  'Introduced adaptive threshold tuning. Autonomous path approval latency cut to < 200ms.',
  '{"name":"Dual-Mind","domain":"decision-orchestration","policyTier":"tier-1-critical","defaultModel":"anthropic/claude-sonnet-4-5","confidenceBaseline":0.91}'::jsonb,
  true, now()
),
(
  'aegis-chasqui', '1.5.2',
  'Switched to GPT-4o Mini for routing classification. Throughput increased 3x.',
  '{"name":"Chasqui","domain":"communications","policyTier":"internal-workflow","defaultModel":"openai/gpt-4o-mini","confidenceBaseline":0.99}'::jsonb,
  true, now()
),
(
  'aegis-nexus', '4.0.1',
  'Graph now covers 142,800 nodes across 5 domains. Added semantic routing for ambiguous queries.',
  '{"name":"Nexus","domain":"integration","policyTier":"tier-2-sensitive","defaultModel":"anthropic/claude-sonnet-4-5","confidenceBaseline":0.92}'::jsonb,
  true, now()
),
(
  'aegis-inca-lab', '0.9.4',
  'Beta: added tabletop exercise generator. Sandbox isolation hardened to prevent leakage.',
  '{"name":"INCA Lab","domain":"research","policyTier":"sandboxed-research","defaultModel":"anthropic/claude-opus-4-5","confidenceBaseline":0.82}'::jsonb,
  true, now()
)
ON CONFLICT DO NOTHING;
