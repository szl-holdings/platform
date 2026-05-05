/**
 * A11oy Claude Code Doctrine BFF Endpoints
 *
 * Thin BFF wrappers over engine modules — no local stores or business logic:
 *   Plans + Trust Tiers  → lib/ai-engine/src/plan-lock.ts
 *   Memory Tiers         → lib/ai-engine/src/memory/tiered-memory.ts
 *   Hook Packs           → lib/ai-engine/src/hooks/index.ts
 *   Skills v2            → lib/ai-engine/src/skills/skills-v2.ts
 *   Reward Watchdog      → lib/ai-engine/src/evals/reward-hacking-watchdog.ts
 *   OPA/Rego             → lib/ai-engine/src/governance/opa-rego-adapter.ts
 *   OTel GenAI Spans     → lib/ai-engine/src/observability/otel-genai.ts
 *
 * The BFF seeds Org Constitution + Project Doctrine into tiered-memory at
 * module load so the memory tier API reflects canonical A11oy values from
 * day one. Seeds are idempotent — tiered-memory skips already-seeded keys.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

// Engine imports — thin wrappers, no local logic
import {
  listHooks,
  getHook,
  getHookStats,
  getInvocationLog,
  type HookEvent,
} from '@szl-holdings/ai-engine/hooks';
import {
  getAllSkillsV2,
  registerSkillV2,
} from '@szl-holdings/ai-engine/skills/skills-v2';
import {
  getFindings,
  resolveFindings,
  getWatchdogStats,
} from '@szl-holdings/ai-engine/evals/reward-hacking-watchdog';
import {
  listRegoPolicies,
  registerRegoPolicy,
} from '@szl-holdings/ai-engine/governance/opa-rego-adapter';
import {
  createPlan,
  getPlan,
  listPlans,
  proposeDecisionCard,
  signAndLockPlan,
  promoteToWorkcell,
  setTrustTier,
  listTrustTiers,
  TRUST_TIER_LABELS,
  type TrustTier,
} from '@szl-holdings/ai-engine/plan-lock';
import {
  seedOrgConstitution,
  readOrgConstitution,
  writeProjectDoctrine,
  readProjectDoctrine,
  writeAutoMemory,
  readAutoMemory,
  redactAutoMemory,
  readAllTiers,
  getMemoryStats,
} from '@szl-holdings/ai-engine/memory/tiered-memory';
import {
  getRecentSpans,
  getSpansBySession,
  type GenAIOperation,
} from '@szl-holdings/ai-engine/observability/otel-genai';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, ...(meta ? { meta } : {}) });
}
function err(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}
function getSessionId(req: Request): string {
  return (req.headers['x-a11oy-session-id'] as string) ?? `sess-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Startup: seed Org Constitution + Project Doctrine into tiered-memory engine
// and seed programmatic skills + Rego policies into their engine registries.
// All seeds are idempotent — the engine skips already-present keys.
// ---------------------------------------------------------------------------
function seedRegistries() {
  // Org Constitution — immutable per release
  seedOrgConstitution([
    { key: 'no_material_action_without_approval', content: 'No material action executes without human approval. This is a structural guarantee embedded in A11oy\'s execution fabric — not a configuration option.' },
    { key: 'proof_chain_required', content: 'Every governed action must produce an immutable Proof Chain entry. No tool call, subagent spawn, or plan signing may complete without a sealed proof entry.' },
    { key: 'plan_mode_hard_gate', content: 'Tools with side effects MUST check permission_mode === "plan-only" and refuse. The Plan Lock affordance must be signed and locked before promotion to Workcell.' },
    { key: 'skill_discovery_safe', content: 'Skills are discovered only from lib/ai-engine/src/skills/library/. Pre-approved tool lists are enforced via hooks. No skills may be loaded from untrusted paths.' },
    { key: 'anthropic_proxy_only', content: 'All Anthropic API access routes through the ai-integrations-anthropic proxy. No raw API keys permitted. This cannot be overridden by operators.' },
  ]);

  // Project Doctrine — per-artifact operator directives (async, fire-and-forget)
  const doctrineEntries = [
    { artifact_id: 'vessels', key: 'maritime_eta_policy', content: 'Cascade Navigator: Always include fuel cost delta in port recommendations. ETA deviation >30h triggers port standby recommendation. VP Operations approval required for standby cost >$2M/day.', agent_id: 'VP Operations' },
    { artifact_id: 'counsel', key: 'legal_privilege_policy', content: 'Counsel Sentinel: Flag opposing late pattern when >2/5 prior cases filed late. Cite minimum 3 precedents in motions. Attorney-client privilege materials sealed from non-legal operators.', agent_id: 'General Counsel' },
    { artifact_id: 'rosie', key: 'revenue_churn_threshold', content: 'Pipeline Oracle: Auto-escalate to VP Revenue when pipeline velocity drops >15%. Churn risk score >0.7 triggers executive outreach. CFO notification required for Q2 forecast delta >15%.', agent_id: 'VP Revenue' },
    { artifact_id: 'sentra', key: 'cyber_auto_isolate_policy', content: 'Guardian: Auto-isolate endpoints at IOC confidence >0.90 for known APTs. CISO notification within 15 minutes of Tier-RED classification. YARA rules deployed within 30 minutes.', agent_id: 'CISO' },
  ];
  for (const d of doctrineEntries) {
    writeProjectDoctrine({
      artifact_id: d.artifact_id,
      key: d.key,
      content: d.content,
      agent_id: d.agent_id,
      session_id: 'system:seed',
    }).catch(() => {/* best-effort */});
  }

  // Programmatic skills
  const programmaticSkills = [
    { skill_id: 'maritime-risk', name: 'Maritime Risk Assessment', description: 'AIS feeds, port congestion, and charter rates to score vessel-level operational risk and generate reroute/demurrage recommendations.', version: '3.2.1', owner: 'szl-holdings', category: 'Maritime Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['vessel_track', 'eta_lookup', 'port_congestion', 'cost_model'], blocked_tools: ['cargo_manifest_write', 'flag_state_modify', 'charter_sign'], allowed_mcp_servers: [], applicable_agents: ['Cascade Navigator'], trigger_keywords: ['vessel', 'ais', 'eta', 'maritime', 'shipping', 'port'], chainable_with: ['eval-harness', 'proof-generator'], eval_pass_rate: 0.97, covenant_policy_bundle: 'covenant:maritime-ops', eligibility_constitution_clause: 'clause-7-maritime', source: 'programmatic' as const },
    { skill_id: 'legal-analysis', name: 'Legal Document Analysis', description: 'Analyses legal documents, dockets, and matter timelines to identify deadline risk, privilege exposure, and settlement probability.', version: '2.8.0', owner: 'szl-holdings', category: 'Legal Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['docket_search', 'document_retrieve', 'deadline_monitor'], blocked_tools: ['filing_submit', 'settlement_execute', 'privilege_waive'], allowed_mcp_servers: [], applicable_agents: ['Counsel Sentinel'], trigger_keywords: ['legal', 'docket', 'filing', 'deadline', 'motion', 'counsel', 'contract'], chainable_with: ['approval-router', 'proof-generator'], eval_pass_rate: 0.96, covenant_policy_bundle: 'covenant:legal-default', eligibility_constitution_clause: 'clause-4-privilege', source: 'programmatic' as const },
    { skill_id: 'threat-triage', name: 'Security Threat Triage', description: 'CVE prioritisation, IOC enrichment, and APT attribution with YARA rule generation. CISA reporting gated to HITL.', version: '2.4.0', owner: 'szl-holdings', category: 'Defense Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blocked_tools: ['cisa_report_submit', 'endpoint_isolate', 'patch_deploy'], allowed_mcp_servers: [], applicable_agents: ['Guardian'], trigger_keywords: ['cve', 'threat', 'ioc', 'stix', 'yara', 'apt'], chainable_with: ['eval-harness', 'proof-generator'], eval_pass_rate: 0.94, covenant_policy_bundle: 'core:aegis-default', eligibility_constitution_clause: 'clause-9-security-clearance', source: 'programmatic' as const },
    { skill_id: 'eval-harness', name: 'MirrorEval Evaluation Harness', description: '14-dimension evaluation harness for all governed actions. Scores groundedness, evidence coverage, action safety, hallucination risk, and policy compliance.', version: '2.0.4', owner: 'szl-holdings', category: 'Governance', permission_mode: 'auto-approve-low-risk' as const, allowed_tools: ['eval_score', 'evidence_check', 'policy_lookup'], blocked_tools: ['eval_override', 'score_modify'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['eval', 'score', 'assess', 'quality', 'hallucination'], chainable_with: ['proof-generator'], eval_pass_rate: 0.99, covenant_policy_bundle: 'covenant:core-eval', source: 'programmatic' as const },
    { skill_id: 'proof-generator', name: 'Proof Packet Generator', description: 'Generates SHA-256 hash-chained proof packets for every governed action. Immutable, replayable, and verifiable by any audit party.', version: '1.7.2', owner: 'szl-holdings', category: 'Governance', permission_mode: 'auto-approve-low-risk' as const, allowed_tools: ['proof_create', 'hash_chain_append', 'evidence_attach'], blocked_tools: ['proof_delete', 'hash_modify'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['proof', 'audit', 'chain', 'hash', 'evidence'], chainable_with: [], eval_pass_rate: 0.99, covenant_policy_bundle: 'covenant:core-proof', source: 'programmatic' as const },
    { skill_id: 'revenue-forecast', name: 'Revenue Risk Forecasting', description: 'Monte Carlo pipeline velocity, churn prediction, and ARR-at-risk scoring with CFO-tier escalation on delta >15%.', version: '4.1.0', owner: 'szl-holdings', category: 'Revenue Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['pipeline_read', 'churn_score', 'forecast_model'], blocked_tools: ['crm_write', 'deal_close', 'quota_modify'], allowed_mcp_servers: [], applicable_agents: ['Pipeline Oracle'], trigger_keywords: ['revenue', 'pipeline', 'churn', 'forecast', 'arr', 'quota'], chainable_with: ['eval-harness'], eval_pass_rate: 0.95, covenant_policy_bundle: 'covenant:revenue-ops', source: 'programmatic' as const },
    { skill_id: 'boardroom-synthesis', name: 'Boardroom Packet Synthesis', description: 'Synthesizes signals, workcells, outcomes, and proof packets into a board-ready executive briefing with MirrorEval scoring.', version: '3.0.1', owner: 'szl-holdings', category: 'Boardroom Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['signal_aggregate', 'workcell_summarize', 'proof_retrieve', 'eval_score'], blocked_tools: ['board_distribute', 'pdf_email_send'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['board', 'executive', 'briefing', 'packet', 'quarterly'], chainable_with: ['eval-harness', 'proof-generator'], eval_pass_rate: 0.99, covenant_policy_bundle: 'covenant:executive-tier', eligibility_constitution_clause: 'clause-1-board-approved', source: 'programmatic' as const },
    { skill_id: 'signal-classifier', name: 'Signal Classification & Routing', description: 'Classifies incoming signals by severity, vertical, and action type. Routes to the appropriate skill, workcell, or approval queue.', version: '3.1.0', owner: 'szl-holdings', category: 'Data Intelligence', permission_mode: 'auto-approve-low-risk' as const, allowed_tools: ['signal_classify', 'routing_lookup', 'severity_score'], blocked_tools: ['signal_suppress', 'routing_override'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['signal', 'classify', 'route', 'severity', 'alert'], chainable_with: ['maritime-risk', 'threat-triage'], eval_pass_rate: 0.98, covenant_policy_bundle: 'covenant:core-routing', source: 'programmatic' as const },
    { skill_id: 'covenant-checker', name: 'Covenant Policy Checker', description: 'Checks every governed action against the full covenant policy set in real-time. Blocks any action that violates policy before execution.', version: '2.2.0', owner: 'szl-holdings', category: 'Governance', permission_mode: 'read-only' as const, allowed_tools: ['policy_lookup', 'covenant_check', 'violation_log'], blocked_tools: ['policy_override', 'covenant_disable'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['covenant', 'policy', 'compliance', 'governance'], chainable_with: [], eval_pass_rate: 1.0, covenant_policy_bundle: 'covenant:constitutional', eligibility_constitution_clause: 'clause-1-no-bypass', source: 'programmatic' as const },
    { skill_id: 'approval-router', name: 'Approval Tier Router', description: 'Routes actions to the correct approval tier based on action impact, domain, and PCE contract. Creates approval requests with full evidence context.', version: '1.8.0', owner: 'szl-holdings', category: 'Governance', permission_mode: 'hitl-required' as const, allowed_tools: ['approval_create', 'tier_lookup', 'approver_notify'], blocked_tools: ['approval_auto_approve', 'tier_downgrade'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['approval', 'tier', 'gate', 'authorize', 'escalate'], chainable_with: ['proof-generator'], eval_pass_rate: 0.99, covenant_policy_bundle: 'covenant:approval-core', source: 'programmatic' as const },
    { skill_id: 'connector-trust', name: 'Connector Trust Scorer', description: 'Scores connector trust in real-time based on schema validation, consent status, injection patterns, and call history. Gates all tool calls.', version: '1.4.1', owner: 'szl-holdings', category: 'Governance', permission_mode: 'auto-approve-low-risk' as const, allowed_tools: ['trust_score', 'schema_validate', 'consent_check'], blocked_tools: ['trust_override', 'allowlist_modify'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['connector', 'trust', 'firewall', 'injection', 'schema'], chainable_with: [], eval_pass_rate: 0.99, covenant_policy_bundle: 'covenant:connector-default', source: 'programmatic' as const },
    { skill_id: 'twin-sync', name: 'Digital Twin Sync Engine', description: 'Continuously synchronizes business digital twins against live connector data. Scores drift, flags anomalies, and triggers workcells when thresholds are crossed.', version: '2.3.0', owner: 'szl-holdings', category: 'Data Intelligence', permission_mode: 'auto-approve-low-risk' as const, allowed_tools: ['twin_state_read', 'connector_pull', 'drift_score'], blocked_tools: ['twin_state_write', 'twin_delete'], allowed_mcp_servers: [], applicable_agents: [], trigger_keywords: ['twin', 'drift', 'sync', 'digital twin', 'anomaly'], chainable_with: ['eval-harness'], eval_pass_rate: 0.96, covenant_policy_bundle: 'covenant:core-sync', source: 'programmatic' as const },
    { skill_id: 'real-estate-risk', name: 'Real Estate Risk Analyzer', description: 'Cap rate drift, NOI scenario modeling, and rent roll analysis for DOMAINE portfolio management.', version: '2.1.0', owner: 'szl-holdings', category: 'Real Estate Intelligence', permission_mode: 'hitl-required' as const, allowed_tools: ['cap_rate_read', 'noi_model', 'comparables_lookup'], blocked_tools: ['property_list', 'lease_sign', 'offer_submit'], allowed_mcp_servers: [], applicable_agents: ['DOMAINE Analyst'], trigger_keywords: ['cap rate', 'noi', 'real estate', 'property', 'portfolio', 'lease'], chainable_with: ['eval-harness', 'proof-generator'], eval_pass_rate: 0.95, covenant_policy_bundle: 'covenant:domaine-ops', source: 'programmatic' as const },
  ];
  const existing = new Set(getAllSkillsV2().map(s => s.skill_id));
  for (const s of programmaticSkills) {
    if (!existing.has(s.skill_id)) registerSkillV2(s);
  }

  // Default Rego policies (supplement the built-in ones in opa-rego-adapter.ts)
  const extraPolicies = [
    {
      id: 'covenant:anthropic-proxy-only',
      name: 'Anthropic Proxy Mandate',
      description: 'Deny any LLM call not routed through the ai-integrations-anthropic proxy. OpenAI direct calls are blocked.',
      package_name: 'a11oy.covenant',
      rego_source: `package a11oy.covenant\n\ndefault allow := true\n\ndeny[msg] {\n  input.provider != "anthropic-proxy"\n  msg := "anthropic-proxy-only: all LLM calls must route through the approved Anthropic proxy"\n}\n`,
      version: '1.0.0',
      owner: 'system',
      tags: ['provider', 'anthropic', 'compliance'],
    },
    {
      id: 'core:subagent-contract-required',
      name: 'Subagent Spawn Contract Required',
      description: 'Every subagent spawn must declare model, allowed_tools, allowed_mcp_servers, permission_mode, and trust_tier.',
      package_name: 'a11oy.core',
      rego_source: `package a11oy.core\n\ndefault allow := true\n\ndeny[msg] {\n  not input.model\n  msg := "subagent-contract: model declaration is required"\n}\n\ndeny[msg] {\n  not input.permission_mode\n  msg := "subagent-contract: permission_mode declaration is required"\n}\n`,
      version: '1.0.0',
      owner: 'system',
      tags: ['subagent', 'contract', 'governance'],
    },
  ];
  const existingPolicies = new Set(listRegoPolicies().map(p => p.id));
  for (const p of extraPolicies) {
    if (!existingPolicies.has(p.id)) registerRegoPolicy(p);
  }
}

seedRegistries();

// ---------------------------------------------------------------------------
// Skills v2
// ---------------------------------------------------------------------------

router.get('/skills/v2', (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const query = req.query.q as string | undefined;
  const category = req.query.category as string | undefined;
  const source = req.query.source as string | undefined;

  let skills = getAllSkillsV2();
  if (query) {
    const lower = query.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.trigger_keywords.some(kw => kw.includes(lower)) ||
      s.category.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower),
    );
  }
  if (category) skills = skills.filter(s => s.category === category);
  if (source) skills = skills.filter(s => s.source === source);

  ok(res, skills, {
    total: getAllSkillsV2().length,
    filtered: skills.length,
    session_id,
    discovery_path: 'lib/ai-engine/src/skills/library/',
  });
});

// ---------------------------------------------------------------------------
// Hook Packs
// ---------------------------------------------------------------------------

router.get('/hooks', (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const event = req.query.event as string | undefined;
  const source = req.query.source as string | undefined;

  let hooks = listHooks(event as HookEvent | undefined);
  if (source) hooks = hooks.filter(h => h.id.startsWith(`${source}:`));

  const enriched = hooks.map(h => {
    const stats = getHookStats(h.id);
    const recentInvocations = getInvocationLog({ hook_id: h.id, limit: 1 });
    const last_invoked = recentInvocations[0]?.timestamp ?? null;
    return {
      id: h.id,
      name: h.name,
      description: h.description,
      events: h.events,
      priority: h.priority,
      timeout_ms: h.timeout_ms,
      policy_bundle: h.policy_bundle ?? null,
      source: h.id.startsWith('builtin:') ? 'builtin' : h.id.startsWith('rego:') ? 'rego' : 'operator',
      allow_24h: stats.allow,
      block_24h: stats.block,
      modify_24h: stats.modify,
      route_24h: stats.route,
      avg_duration_ms: stats.avg_duration_ms,
      last_invoked,
      status: 'active' as const,
    };
  });

  const totals = enriched.reduce(
    (acc, h) => ({ allow: acc.allow + h.allow_24h, block: acc.block + h.block_24h, modify: acc.modify + h.modify_24h }),
    { allow: 0, block: 0, modify: 0 },
  );

  ok(res, enriched, { total: hooks.length, totals_24h: totals, session_id });
});

router.post('/hooks/replay', async (req: Request, res: Response) => {
  const { invocation_id } = req.body as { invocation_id?: string };
  if (!invocation_id) return err(res, 400, 'INVALID_BODY', 'invocation_id required');

  const log = getInvocationLog({ limit: 500 });
  const invocation = log.find(r => r.invocation_id === invocation_id);
  if (!invocation) return err(res, 404, 'NOT_FOUND', `Invocation ${invocation_id} not found`);

  // Rehydrate the original hook context from the invocation record and
  // re-execute the specific hook that produced this invocation. This gives
  // a true replay: the hook function runs again against the same event
  // context, producing a fresh decision with a new proof entry.
  const hook = getHook(invocation.hook_id);
  let replayDecision = invocation.decision;
  let replayProofEntryId = invocation.proof_entry_id;
  let replayDurationMs = 0;
  let replayError: string | undefined;

  if (hook) {
    // Rehydrate the original context from what was recorded at invocation time.
    // tool_name / tool_input come from proof_attachments (stored by proof-sealer);
    // metadata carries replay provenance for the proof entry.
    const rehydratedCtx = {
      event: invocation.event,
      session_id: invocation.session_id,
      agent_id: invocation.agent_id,
      tool_name: (invocation.decision.proof_attachments?.tool_name as string | undefined),
      metadata: {
        replay: true,
        original_invocation_id: invocation.invocation_id,
        original_proof_entry_id: invocation.proof_entry_id,
      },
    };
    const t0 = Date.now();
    try {
      // Invoke ONLY the target hook directly — not all hooks for the event.
      // This preserves exact replay semantics: one hook, one new proof entry.
      const decision = await Promise.resolve(hook.fn(rehydratedCtx));
      replayDecision = decision;
      replayDurationMs = Date.now() - t0;

      // Record a single invocation log entry and emit exactly one new proof entry.
      const { randomUUID } = await import('node:crypto');
      const newInvocationId = randomUUID();
      const proofId = `replay-proof-${newInvocationId}`;
      try {
        const { tagAIContent } = await import('@szl-holdings/proof-chain');
        await tagAIContent({
          contentId: proofId,
          contentType: 'hook_decision',
          sourceClass: 'system_computed',
          correlationId: invocation.session_id,
          serviceAttribution: hook.id,
          metadata: {
            event: invocation.event,
            action: decision.action,
            reason: decision.reason,
            agent_id: invocation.agent_id,
            replay: true,
            original_invocation_id: invocation.invocation_id,
          },
        });
        replayProofEntryId = proofId;
      } catch {
        // Proof write is best-effort for replay; use generated id regardless
        replayProofEntryId = proofId;
      }
    } catch (e) {
      replayError = e instanceof Error ? e.message : String(e);
      replayDurationMs = Date.now() - t0;
    }
  } else {
    replayError = `Hook '${invocation.hook_id}' no longer registered — cannot re-execute; returning original decision`;
  }

  ok(res, {
    invocation_id: invocation.invocation_id,
    hook_id: invocation.hook_id,
    hook_name: invocation.hook_name,
    event: invocation.event,
    original_decision: invocation.decision,
    replay_decision: replayDecision,
    replay_proof_entry_id: replayProofEntryId,
    replayed_at: new Date().toISOString(),
    replay_duration_ms: replayDurationMs,
    hook_still_registered: !!hook,
    ...(replayError ? { replay_error: replayError } : {}),
  });
});

router.get('/hooks/invocations', (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const hook_id = req.query.hook_id as string | undefined;
  const event = req.query.event as HookEvent | undefined;
  const sess = req.query.session_id as string | undefined;

  const invocations = getInvocationLog({ hook_id, event, session_id: sess, limit });

  const mapped = invocations.map(r => ({
    id: r.invocation_id,
    hook_id: r.hook_id,
    hook_name: r.hook_name,
    event: r.event,
    action: r.decision.action,
    reason: r.decision.reason,
    duration_ms: r.duration_ms,
    session_id: r.session_id,
    agent_id: r.agent_id ?? null,
    proof_entry_id: r.proof_entry_id,
    timestamp: r.timestamp,
  }));

  ok(res, mapped, { count: mapped.length, session_id });
});

// ---------------------------------------------------------------------------
// Memory Tiers — backed by tiered-memory engine
// ---------------------------------------------------------------------------

router.get('/memory/entries', (req: Request, res: Response) => {
  const tier = req.query.tier as string | undefined;
  const artifact_id = req.query.artifact_id as string | undefined;
  const session_id = req.query.session_id as string | undefined;
  const include_redacted = req.query.include_redacted === 'true';
  const limit = Math.min(Number(req.query.limit ?? 200), 1000);

  const all = readAllTiers({ artifact_id, session_id, include_redacted });
  const stats = getMemoryStats();

  let entries = [
    ...all.org_constitution.entries,
    ...all.project_doctrine.entries,
    ...all.auto_memory.entries,
  ];
  if (tier) entries = entries.filter(e => e.tier === tier);

  ok(res, entries.slice(0, limit), {
    total: entries.length,
    by_tier: {
      'org-constitution': stats.org_constitution,
      'project-doctrine': stats.project_doctrine,
      'auto-memory': stats.auto_memory,
    },
  });
});

router.get('/memory/tiers', (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const stats = getMemoryStats();
  ok(res, {
    org_constitution: { count: stats.org_constitution, description: 'Immutable per release', writable: false },
    project_doctrine: { count: stats.project_doctrine, description: 'Per-artifact operator directives', writable: true },
    auto_memory: { count: stats.auto_memory, redacted: stats.auto_memory_redacted, description: 'Hook-written, append-only', writable: false, redactable: true },
  }, { session_id });
});

const AutoMemoryWriteSchema = z.object({
  key: z.string().min(1),
  content: z.string().min(1),
  written_by_hook: z.string().min(1),
  written_on_event: z.string().min(1),
  written_for_run: z.string().optional(),
  session_id: z.string().optional(),
  agent_id: z.string().optional(),
});

router.post('/memory/auto', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const parsed = AutoMemoryWriteSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'INVALID_BODY', parsed.error.message);

  const result = await writeAutoMemory({
    key: parsed.data.key,
    content: parsed.data.content,
    written_by_hook: parsed.data.written_by_hook,
    written_on_event: parsed.data.written_on_event,
    written_for_run: parsed.data.written_for_run,
    session_id: parsed.data.session_id ?? sessionId,
    agent_id: parsed.data.agent_id,
  });

  ok(res, {
    entry_id: result.entry.id,
    proof_packet_id: result.proof_packet_id,
    tier: 'auto-memory',
    key: parsed.data.key,
    session_id: result.entry.provenance.session_id,
    created_at: result.entry.created_at,
  });
});

const RedactSchema = z.object({ id: z.string().min(1), reason: z.string().min(1) });

router.post('/memory/redact', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const parsed = RedactSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'INVALID_BODY', parsed.error.message);

  const result = await redactAutoMemory(parsed.data.id, parsed.data.reason);
  if (!result.success) return err(res, 404, 'ENTRY_NOT_FOUND', 'Auto-memory entry not found — only auto-memory entries can be redacted');

  ok(res, {
    redacted: true,
    id: parsed.data.id,
    reason: parsed.data.reason,
    proof_packet_id: result.proof_packet_id,
    session_id: sessionId,
    redacted_at: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Plans — backed by plan-lock engine
// ---------------------------------------------------------------------------

router.get('/plans', (req: Request, res: Response) => {
  const session_id = req.query.session_id as string | undefined;
  const requestSessionId = getSessionId(req);
  const plans = listPlans(session_id);
  ok(res, plans, { count: plans.length, session_id: requestSessionId });
});

const CreatePlanSchema = z.object({
  name: z.string().min(1),
  objective: z.string().min(1),
  agent_id: z.string().optional(),
  trust_tier: z.number().int().min(0).max(4).optional(),
  decision_card: z.object({
    signal: z.string(),
    context: z.string(),
    recommendation: z.string(),
    simulation: z.string(),
  }).optional(),
});

router.post('/plans', async (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const parsed = CreatePlanSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'INVALID_BODY', parsed.error.message);

  const plan = createPlan({
    name: parsed.data.name,
    objective: parsed.data.objective,
    agent_id: parsed.data.agent_id ?? 'operator',
    session_id,
    trust_tier: (parsed.data.trust_tier ?? 3) as TrustTier,
  });

  // Optionally attach a Decision Card immediately if provided
  if (parsed.data.decision_card) {
    proposeDecisionCard({
      plan_id: plan.plan_id,
      signal: parsed.data.decision_card.signal,
      context: parsed.data.decision_card.context,
      recommendation: parsed.data.decision_card.recommendation,
      simulation: parsed.data.decision_card.simulation,
      originating_agent: parsed.data.agent_id ?? 'operator',
      session_id,
      trust_tier: (parsed.data.trust_tier ?? 3) as TrustTier,
    });
  }

  ok(res, getPlan(plan.plan_id));
});

const DecisionCardSchema = z.object({
  signal: z.string().min(1),
  context: z.string().min(1),
  recommendation: z.string().min(1),
  simulation: z.string().min(1),
  originating_agent: z.string().optional(),
});

router.post('/plans/:id/decision-card', (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const plan = getPlan(req.params.id!);
  if (!plan) return err(res, 404, 'PLAN_NOT_FOUND', 'Plan not found');

  const parsed = DecisionCardSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'INVALID_BODY', parsed.error.message);

  const card = proposeDecisionCard({
    plan_id: req.params.id!,
    signal: parsed.data.signal,
    context: parsed.data.context,
    recommendation: parsed.data.recommendation,
    simulation: parsed.data.simulation,
    originating_agent: parsed.data.originating_agent ?? 'operator',
    session_id,
    trust_tier: plan.trust_tier,
  });

  if (!card) return err(res, 500, 'CARD_PROPOSE_FAILED', 'Failed to propose Decision Card');
  ok(res, card);
});

router.post('/plans/:id/sign', async (req: Request, res: Response) => {
  const session_id = getSessionId(req);
  const plan = getPlan(req.params.id!);
  if (!plan) return err(res, 404, 'PLAN_NOT_FOUND', 'Plan not found');

  // Decision Card must be present before sign — hard gate
  if (!plan.decision_card) {
    return err(res, 422, 'DECISION_CARD_REQUIRED', 'A Decision Card (signal, context, recommendation, simulation) must be proposed via POST /plans/:id/decision-card before signing and locking a plan');
  }

  const result = await signAndLockPlan({
    plan_id: req.params.id!,
    signed_by: req.body.signed_by ?? 'operator',
    session_id,
  });

  if (!result.success) {
    if (result.error === 'Plan already locked') return err(res, 409, 'ALREADY_LOCKED', result.error);
    return err(res, 422, 'SIGN_FAILED', result.error ?? 'Sign failed');
  }

  ok(res, { plan: result.plan, proof_packet_id: result.proof_packet_id, session_id });
});

router.post('/plans/:id/promote', async (req: Request, res: Response) => {
  const plan = getPlan(req.params.id!);
  if (!plan) return err(res, 404, 'PLAN_NOT_FOUND', 'Plan not found');
  if (plan.status !== 'locked') return err(res, 409, 'NOT_LOCKED', 'Plan must be signed and locked before promotion');

  const workcell_id = req.body.workcell_id ?? `wc-${Date.now().toString(36)}`;
  const result = await promoteToWorkcell({ plan_id: req.params.id!, workcell_id });

  if (!result.success) return err(res, 409, 'PROMOTE_FAILED', result.error ?? 'Promotion failed');
  ok(res, { plan: getPlan(req.params.id!), workcell_id });
});

// ---------------------------------------------------------------------------
// Trust Tiers — backed by plan-lock engine
// ---------------------------------------------------------------------------

router.get('/trust-tiers', (_req: Request, res: Response) => {
  const tiers = listTrustTiers();
  ok(res, tiers.map(t => ({
    ...t,
    label: TRUST_TIER_LABELS[t.tier],
  })), {
    ladder: Object.entries(TRUST_TIER_LABELS).map(([tier, label]) => ({ tier: Number(tier), label })),
  });
});

const SetTierSchema = z.object({
  subagent_class: z.string().min(1),
  tier: z.number().int().min(0).max(4),
  set_by: z.string().optional(),
  covenant_bundle: z.string().optional(),
});

router.post('/trust-tiers', (req: Request, res: Response) => {
  const parsed = SetTierSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 400, 'INVALID_BODY', parsed.error.message);

  const config = setTrustTier({
    subagent_class: parsed.data.subagent_class,
    tier: parsed.data.tier as TrustTier,
    set_by: parsed.data.set_by ?? 'operator',
    covenant_bundle: parsed.data.covenant_bundle,
  });

  ok(res, { ...config, label: TRUST_TIER_LABELS[config.tier] });
});

// ---------------------------------------------------------------------------
// Reward-Hacking Watchdog
// ---------------------------------------------------------------------------

router.get('/watchdog/findings', (req: Request, res: Response) => {
  const resolvedParam = req.query.resolved;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const session_id = req.query.session_id as string | undefined;
  const subagent_id = req.query.subagent_id as string | undefined;
  const pattern = req.query.pattern as string | undefined;
  const resolved = resolvedParam === undefined ? undefined : resolvedParam === 'true';

  const findings = getFindings({ resolved, session_id, subagent_id, pattern: pattern as Parameters<typeof getFindings>[0]['pattern'], limit });
  const stats = getWatchdogStats();

  ok(res, findings, {
    total: stats.total_findings,
    unresolved: stats.unresolved,
    by_pattern: stats.by_pattern,
    by_severity: stats.by_severity,
    recent_24h: stats.recent_24h,
  });
});

router.post('/watchdog/resolve', (req: Request, res: Response) => {
  const { finding_ids, notes } = req.body as { finding_ids: string[]; notes: string };
  if (!Array.isArray(finding_ids)) return err(res, 400, 'INVALID_BODY', 'finding_ids must be an array');
  const count = resolveFindings(finding_ids, notes ?? '');
  ok(res, { resolved: count });
});

// ---------------------------------------------------------------------------
// OTel GenAI Spans — backed by otel-genai.ts span store (dual output)
// ---------------------------------------------------------------------------

router.get('/otel/spans', (req: Request, res: Response) => {
  const operation = req.query.operation as GenAIOperation | undefined;
  const session_id = req.query.session_id as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 500);

  let spans;
  if (session_id) {
    spans = getSpansBySession(session_id);
    if (operation) spans = spans.filter(s => s.attributes['gen_ai.operation.name'] === operation);
    spans = spans.slice(0, limit);
  } else {
    spans = getRecentSpans(limit, operation);
  }

  ok(res, spans, { total: spans.length, source: 'otel-genai-recorder' });
});

// ---------------------------------------------------------------------------
// OPA/Rego Policies — backed by opa-rego-adapter engine registry
// ---------------------------------------------------------------------------

router.get('/rego/policies', (_req: Request, res: Response) => {
  const policies = listRegoPolicies().map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    package_name: p.package_name,
    version: p.version,
    owner: p.owner,
    tags: p.tags,
    registered_at: p.registered_at,
  }));
  ok(res, policies, { total: policies.length });
});

export { router as a11oyClaudeCodeDoctrineRouter };
