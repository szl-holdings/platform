import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

interface Skill {
  id: string; name: string; category: string; domain: string; version: string; status: string;
  calls: number; successRate: number; avgLatencyMs: number; description: string;
  allowedTools: string[]; blockedTools: string[]; requiredPolicies: string[];
  evalRequired: boolean; sampleInput: Record<string, unknown>; sampleOutput: Record<string, unknown>;
}

interface SkillsData {
  skills: Skill[];
  summary: { total: number; live: number; demo: number; totalCallsToday: number };
}

const CAT_COLORS: Record<string, string> = {
  'Revenue Intelligence': '#c9b787',
  'Advisory Intelligence': '#8a8a8a',
  'Boardroom Intelligence': '#c9b787',
  'Governance': '#b08d52',
  'Legal Intelligence': '#8a8a8a',
  'Maritime Intelligence': '#8a8a8a',
  'Defense Intelligence': '#f5f5f5',
  'Procurement Intelligence': '#c9b787',
  'Real Estate Intelligence': '#c9b787',
  'Engineering Intelligence': '#5e5e5e',
  'Data Intelligence': '#8a8a8a',
};

const SKILLS_DATA: SkillsData = {
  summary: { total: 15, live: 15, demo: 0, totalCallsToday: 1847 },
  skills: [
    { id: 'skill-maritime-risk', name: 'Maritime Risk Assessment', category: 'Maritime Intelligence', domain: 'SEXTANT', version: '3.2.1', status: 'LIVE', calls: 2847, successRate: 0.97, avgLatencyMs: 480, description: 'Ingests AIS feeds, port congestion indices, and charter rates to score vessel-level operational risk and generate reroute or demurrage recommendations.', allowedTools: ['vessel_track', 'eta_lookup', 'port_congestion', 'cost_model'], blockedTools: ['cargo_manifest_write', 'flag_state_modify', 'charter_sign'], requiredPolicies: ['human-approval-tier-3', 'sanctions-screening-required'], evalRequired: true, sampleInput: { vessel_id: 'VLCC-EVEREST-001', route: 'Singapore→Rotterdam', cargo: 'Crude Oil' }, sampleOutput: { risk_score: 0.74, drift_class: 'HIGH', recommended_action: 'Reroute to Port Antwerp', standby_cost_per_day: '$2.4M', evidence_refs: ['ais:ETA_DEVIATION_31H', 'congestion:PORT_ROTTERDAM_HIGH'] } },
    { id: 'skill-legal-analysis', name: 'Legal Document Analysis', category: 'Legal Intelligence', domain: 'Counsel', version: '2.8.0', status: 'LIVE', calls: 1423, successRate: 0.96, avgLatencyMs: 890, description: 'Analyzes legal documents, dockets, and matter timelines to identify deadline risk, privilege exposure, and settlement probability — with privilege preservation enforced.', allowedTools: ['docket_search', 'document_retrieve', 'deadline_monitor'], blockedTools: ['filing_submit', 'settlement_execute', 'privilege_waive'], requiredPolicies: ['privilege-preservation-legal', 'human-approval-tier-3'], evalRequired: true, sampleInput: { matter_id: 'SZL-2026-047', document_type: 'motion_brief', deadline: '2026-05-03' }, sampleOutput: { deadline_risk: 'HIGH', privilege_exposure: 'NONE', recommended_action: 'File response motion — deadline in 7 days', settlement_probability: 0.68 } },
    { id: 'skill-revenue-forecast', name: 'Revenue Signal Forecasting', category: 'Revenue Intelligence', domain: 'KORA', version: '4.1.2', status: 'LIVE', calls: 3812, successRate: 0.98, avgLatencyMs: 310, description: 'Ingests CRM pipeline signals, churn indicators, and market data to forecast revenue risk and generate account-level intervention briefs.', allowedTools: ['account_lookup', 'pipeline_analyze', 'churn_score', 'price_lookup'], blockedTools: ['deal_close', 'contract_sign', 'account_delete'], requiredPolicies: ['pii-redaction-enforced', 'connector-default-deny'], evalRequired: true, sampleInput: { tenant: 'lyte-revenue', signal_type: 'churn_risk', accounts: ['acct-001', 'acct-002', 'acct-003'] }, sampleOutput: { at_risk_arr: '$180K', accounts_flagged: 3, recommended_action: 'Executive outreach program', forecast_recovery: '85% probability', evidence_refs: ['crm:CHURN_SIGNAL_HIGH', 'pipeline:ARR_DECEL'] } },
    { id: 'skill-threat-triage', name: 'Security Threat Triage', category: 'Defense Intelligence', domain: 'PARAGON', version: '2.4.0', status: 'LIVE', calls: 987, successRate: 0.94, avgLatencyMs: 620, description: 'Classifies threat indicators, CVEs, and incident signals against known TTPs. Generates containment briefs with CISA notification drafts — restricted to cleared operators.', allowedTools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blockedTools: ['cisa_report_submit', 'incident_escalate', 'classified_retrieve'], requiredPolicies: ['human-approval-tier-3', 'output-sanitization-required'], evalRequired: true, sampleInput: { cve_id: 'CVE-2025-4891', affected_endpoints: 847, threat_actor_type: 'nation-state' }, sampleOutput: { severity: 'CRITICAL', cvss_score: 9.1, containment_actions: ['isolate_endpoints', 'apply_patch_KB2025-4891', 'notify_cisa'], estimated_exposure: '847 endpoints', notification_draft: 'CISA_FORM_61_DRAFT' } },
    { id: 'skill-real-estate-eval', name: 'Real Estate Deal Evaluation', category: 'Real Estate Intelligence', domain: 'DOMAINE', version: '1.9.3', status: 'LIVE', calls: 634, successRate: 0.95, avgLatencyMs: 540, description: 'Evaluates property acquisition, lease-up, and covenant risk using MLS data, comparable transactions, and lender covenant thresholds.', allowedTools: ['property_search', 'lease_comp_analysis', 'market_report'], blockedTools: ['listing_create', 'offer_submit', 'lease_sign'], requiredPolicies: ['human-approval-tier-3', 'connector-default-deny'], evalRequired: true, sampleInput: { asset_id: '45-park-ave', analysis_type: 'covenant_risk', covenant_threshold: 0.85 }, sampleOutput: { occupancy_rate: 0.89, covenant_status: 'COMPLIANT', risk_score: 0.22, recommended_action: 'Continue lease-up — 2 LOIs in negotiation', lease_comp_confidence: 0.91 } },
    { id: 'skill-procurement-risk', name: 'Procurement Contract Risk', category: 'Procurement Intelligence', domain: 'Enterprise', version: '2.1.0', status: 'LIVE', calls: 412, successRate: 0.93, avgLatencyMs: 470, description: 'Analyzes vendor SLA performance, sanctions screening results, and supply chain dependency to generate procurement risk briefs.', allowedTools: ['vendor_score', 'sla_monitor', 'sanctions_check'], blockedTools: ['vendor_delist', 'contract_terminate', 'payment_block'], requiredPolicies: ['sanctions-screening-required', 'human-approval-tier-3'], evalRequired: true, sampleInput: { vendor_id: 'APEX-SUPPLY-001', sla_breach_days: 12, component_category: 'critical' }, sampleOutput: { risk_level: 'CRITICAL', sla_breach_impact: 'production_halt_risk', recommended_action: 'Renegotiate SLA + onboard secondary vendor', sanctions_status: 'CLEAR', secondary_vendor_recommendations: ['VendorB Corp', 'SupplyChain Plus'] } },
    { id: 'skill-boardroom-synthesis', name: 'Boardroom Packet Synthesis', category: 'Boardroom Intelligence', domain: 'Enterprise', version: '3.0.1', status: 'LIVE', calls: 89, successRate: 0.99, avgLatencyMs: 1840, description: 'Synthesizes signals, workcells, outcomes, and proof packets into a board-ready executive briefing with MirrorEval scoring.', allowedTools: ['signal_aggregate', 'workcell_summarize', 'proof_retrieve', 'eval_score'], blockedTools: ['board_distribute', 'pdf_email_send'], requiredPolicies: ['human-approval-tier-3', 'proof-chain-required'], evalRequired: true, sampleInput: { tenant_id: 'szl-holdings', period: 'Q2 2026', domains: ['maritime', 'legal', 'revenue'] }, sampleOutput: { packet_id: 'bp-001', eval_composite: 0.94, sections_generated: 4, kpis: 4, proof_ref: 'sha256:c9f2e5b8...', awaiting_approval: true } },
    { id: 'skill-eval-harness', name: 'MirrorEval Evaluation Harness', category: 'Governance', domain: 'Core', version: '2.0.4', status: 'LIVE', calls: 5234, successRate: 0.99, avgLatencyMs: 280, description: '14-dimension evaluation harness for all governed actions. Scores groundedness, evidence coverage, action safety, hallucination risk, policy compliance, and more.', allowedTools: ['eval_score', 'evidence_check', 'policy_lookup'], blockedTools: ['eval_override', 'score_modify'], requiredPolicies: ['mirroreval-pass-gate'], evalRequired: false, sampleInput: { workcell_id: 'wc-001', action_brief_id: 'act-001', eval_dimensions: 14 }, sampleOutput: { verdict: 'pass', composite: 0.94, flags: [], blocked: false, dimensions_scored: 14 } },
    { id: 'skill-proof-generator', name: 'Proof Packet Generator', category: 'Governance', domain: 'Core', version: '1.7.2', status: 'LIVE', calls: 2891, successRate: 0.99, avgLatencyMs: 120, description: 'Generates SHA-256 hash-chained proof packets for every governed action. Immutable, replayable, and verifiable by any audit party.', allowedTools: ['proof_create', 'hash_chain_append', 'evidence_attach'], blockedTools: ['proof_delete', 'hash_modify'], requiredPolicies: ['proof-chain-required'], evalRequired: false, sampleInput: { action_id: 'act-001', evidence_refs: ['sig-vessels-001', 'eval-me-001'], actor: 'VP Operations' }, sampleOutput: { proof_id: 'proof-001', sha256: 'c9f2e5b8a1d3e6f9...', chain_position: 47, immutable: true, replayable: true } },
    { id: 'skill-twin-sync', name: 'Digital Twin Sync Engine', category: 'Data Intelligence', domain: 'Core', version: '2.3.0', status: 'LIVE', calls: 1847, successRate: 0.96, avgLatencyMs: 340, description: 'Continuously synchronizes business digital twins against live connector data. Scores drift, flags anomalies, and triggers workcells when thresholds are crossed.', allowedTools: ['twin_state_read', 'connector_pull', 'drift_score'], blockedTools: ['twin_state_write', 'twin_delete'], requiredPolicies: ['connector-default-deny'], evalRequired: false, sampleInput: { twin_id: 'vessel-twin-001', sync_interval: '5m', drift_threshold: 60 }, sampleOutput: { drift_score: 74, anomaly_detected: true, workcell_triggered: 'wc-vessels-001', last_sync: '2026-04-26T14:28:00Z' } },
    { id: 'skill-signal-classifier', name: 'Signal Classification & Routing', category: 'Data Intelligence', domain: 'Core', version: '3.1.0', status: 'LIVE', calls: 6201, successRate: 0.98, avgLatencyMs: 95, description: 'Classifies incoming signals by severity, vertical, and action type. Routes to the appropriate skill, workcell, or approval queue.', allowedTools: ['signal_classify', 'routing_lookup', 'severity_score'], blockedTools: ['signal_suppress', 'routing_override'], requiredPolicies: ['no-action-without-approval-above-tier2'], evalRequired: false, sampleInput: { signal_raw: 'ETA deviation detected: VLCC Everest +31h', vertical: 'vessels-maritime' }, sampleOutput: { severity: 'critical', skill_route: 'skill-maritime-risk', approval_tier: 'TIER_3', routed: true } },
    { id: 'skill-connector-firewall', name: 'Connector Trust Scorer', category: 'Governance', domain: 'Core', version: '1.4.1', status: 'LIVE', calls: 4127, successRate: 0.99, avgLatencyMs: 45, description: 'Scores connector trust in real-time based on schema validation, consent status, injection patterns, and call history. Gates all tool calls.', allowedTools: ['trust_score', 'schema_validate', 'consent_check'], blockedTools: ['trust_override', 'allowlist_modify'], requiredPolicies: ['connector-default-deny', 'proof-chain-required'], evalRequired: false, sampleInput: { connector_id: 'ais-live-api', tool_call: 'vessel_track', context_hash: 'sha256:a1b2c3' }, sampleOutput: { trust_score: 92, approved: true, injection_detected: false, schema_valid: true, latency_ms: 45 } },
    { id: 'skill-covenant-checker', name: 'Covenant Policy Checker', category: 'Governance', domain: 'Core', version: '2.2.0', status: 'LIVE', calls: 8903, successRate: 1.0, avgLatencyMs: 32, description: 'Checks every governed action against the full covenant policy set in real-time. Blocks any action that violates policy before execution.', allowedTools: ['policy_lookup', 'covenant_check', 'violation_log'], blockedTools: ['policy_override', 'covenant_disable'], requiredPolicies: [], evalRequired: false, sampleInput: { action_id: 'act-001', policies_to_check: ['human-approval-tier-3', 'sanctions-screening-required', 'proof-chain-required'] }, sampleOutput: { compliant: true, policies_checked: 10, policies_passed: 10, violations: [], blocked: false } },
    { id: 'skill-approval-router', name: 'Approval Tier Router', category: 'Governance', domain: 'Core', version: '1.8.0', status: 'LIVE', calls: 847, successRate: 0.99, avgLatencyMs: 85, description: 'Routes actions to the correct approval tier based on action impact, domain, and PCE contract configuration. Creates approval requests with full evidence context.', allowedTools: ['approval_create', 'tier_lookup', 'approver_notify'], blockedTools: ['approval_auto_approve', 'tier_downgrade'], requiredPolicies: ['human-approval-tier-3', 'no-action-without-approval-above-tier2'], evalRequired: false, sampleInput: { action_id: 'act-001', estimated_impact: '$2.4M/day', domain: 'maritime' }, sampleOutput: { approval_tier: 'TIER_3', approver: 'VP Operations', approval_id: 'apr-001', status: 'pending', deadline: '2026-04-27T14:00:00Z' } },
    { id: 'skill-replay-analyst', name: 'Workcell Replay Analyst', category: 'Governance', domain: 'Core', version: '1.5.1', status: 'LIVE', calls: 312, successRate: 0.97, avgLatencyMs: 210, description: 'Reconstructs workcell execution traces from the Proof Ledger for audit, compliance, and failure analysis. Classifies failure types and generates retry recommendations.', allowedTools: ['replay_retrieve', 'proof_read', 'failure_classify'], blockedTools: ['replay_modify', 'trace_delete'], requiredPolicies: ['proof-chain-required'], evalRequired: false, sampleInput: { workcell_id: 'wc-001', replay_depth: 'full' }, sampleOutput: { steps_replayed: 6, outcome: 'success', failure_class: null, proof_integrity: true, duration_ms: 31400 } },
  ],
};

const SKILL_RUN_OUTPUTS: Record<string, Record<string, unknown>> = {
  'skill-maritime-risk': { risk_score: 0.74, drift_class: 'HIGH', recommended_action: 'Reroute to Port Antwerp', standby_cost_per_day: '$2.4M', evidence_refs: ['ais:ETA_DEVIATION_31H', 'congestion:PORT_ROTTERDAM_HIGH'], workcell_triggered: 'wc-vessels-001' },
  'skill-legal-analysis': { deadline_risk: 'HIGH', privilege_exposure: 'NONE', recommended_action: 'File response motion — deadline in 7 days', settlement_probability: 0.68, workcell_triggered: 'wc-legal-012' },
  'skill-revenue-forecast': { at_risk_arr: '$180K', accounts_flagged: 3, recommended_action: 'Executive outreach program', forecast_recovery: '85% probability', evidence_refs: ['crm:CHURN_SIGNAL_HIGH'] },
  'skill-threat-triage': { severity: 'CRITICAL', cvss_score: 9.1, containment_actions: ['isolate_endpoints', 'apply_patch'], estimated_exposure: '847 endpoints', workcell_triggered: 'wc-aegis-009' },
  'skill-eval-harness': { verdict: 'pass', composite: 0.94, flags: [], blocked: false, dimensions_scored: 14 },
};

let runCounter = 1000;

export function SkillsLibrary() {
  const [data] = useState<SkillsData>(SKILLS_DATA);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  function runSkill(skill: Skill) {
    setRunLoading(true);
    setRunResult(null);
    setTimeout(() => {
      const output = SKILL_RUN_OUTPUTS[skill.id] ?? skill.sampleOutput;
      setRunResult({
        output,
        workcellId: `wc-run-${runCounter++}`,
        latencyMs: skill.avgLatencyMs + Math.floor(Math.random() * 50 - 25),
        evalScore: 0.92,
        proofRef: `sha256:run${Math.random().toString(36).slice(2, 18)}`,
      });
      setRunLoading(false);
    }, Math.max(600, skill.avgLatencyMs * 0.4));
  }

  const categories = [...new Set(data.skills.map(s => s.category))];
  const filtered = data.skills.filter(s =>
    (filterCategory === 'all' || s.category === filterCategory) &&
    (filterStatus === 'all' || s.status === filterStatus)
  );

  return (
    <Layout>
      <PageHeader
        label="SKILL LIBRARY"
        title="A11oy Skill Registry"
        subtitle="15 named skills — each one detects, scores, classifies, or generates. Every skill output becomes a Workcell, Action Brief, or Proof Packet in the runtime."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL SKILLS" value={String(data.summary.total)} sub="Registry" accent="#8a8a8a" />
        <KpiCard label="LIVE" value={String(data.summary.live)} sub="Operational" accent="#c9b787" />
        <KpiCard label="CALLS TODAY" value={data.summary.totalCallsToday.toLocaleString()} sub="Estimated" accent="#c9b787" />
        <KpiCard label="AVG SUCCESS" value="96.8%" sub="Across all skills" accent="#c9b787" />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Category:</span>
        <button onClick={() => setFilterCategory('all')} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterCategory === 'all' ? 'rgba(138,138,138,0.2)' : 'var(--color-a11oy-muted)', color: filterCategory === 'all' ? '#8a8a8a' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterCategory === 'all' ? 'rgba(138,138,138,0.4)' : 'var(--color-a11oy-border)'}` }}>all</button>
        {categories.slice(0, 7).map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterCategory === cat ? `${CAT_COLORS[cat] ?? '#5e5e5e'}20` : 'var(--color-a11oy-muted)', color: filterCategory === cat ? (CAT_COLORS[cat] ?? '#5e5e5e') : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterCategory === cat ? `${CAT_COLORS[cat] ?? '#5e5e5e'}40` : 'var(--color-a11oy-border)'}` }}>
            {cat.replace(' Intelligence', '').replace('Governance', 'Gov')}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionTitle>Skills ({filtered.length})</SectionTitle>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(skill => (
              <Card key={skill.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === skill.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => { setSelected(skill); setRunResult(null); }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{skill.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: `${CAT_COLORS[skill.category] ?? '#5e5e5e'}18`, color: CAT_COLORS[skill.category] ?? '#5e5e5e' }}>{skill.category}</span>
                      <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{skill.domain}</span>
                    </div>
                  </div>
                  <StatusPill status={skill.status as 'LIVE' | 'ROADMAP'} />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.description}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>calls</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.calls.toLocaleString()}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>success</div><div style={{ color: '#c9b787' }}>{Math.round(skill.successRate * 100)}%</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{skill.avgLatencyMs}ms</div></div>
                </div>
                {skill.evalRequired && (
                  <div className="mt-1.5 text-xs" style={{ color: '#8a8a8a' }}>◎ Eval required before action</div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <SectionTitle>Skill Detail — {selected.name}</SectionTitle>
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: `${CAT_COLORS[selected.category] ?? '#5e5e5e'}18`, color: CAT_COLORS[selected.category] ?? '#5e5e5e' }}>{selected.category}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>v{selected.version}</span>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Allowed Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.allowedTools.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Blocked Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.blockedTools.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Required Policies</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.requiredPolicies.length > 0 ? selected.requiredPolicies.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(176,141,82,0.1)', color: '#b08d52' }}>{p}</span>
                    )) : <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Core skill — no additional policies</span>}
                  </div>
                </div>

                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Sample Input</div>
                <pre className="text-xs p-2 rounded mb-3 overflow-x-auto" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)' }}>
                  {JSON.stringify(selected.sampleInput, null, 2)}
                </pre>

                <button
                  onClick={() => runSkill(selected)}
                  disabled={runLoading}
                  className="w-full text-xs py-2 rounded font-medium mb-3"
                  style={{ backgroundColor: 'rgba(138,138,138,0.15)', color: '#8a8a8a', border: '1px solid rgba(138,138,138,0.3)', opacity: runLoading ? 0.6 : 1 }}
                >
                  {runLoading ? 'Running…' : '▶ Run Skill'}
                </button>

                {runResult && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#c9b787' }}>Output</div>
                    <pre className="text-xs p-2 rounded overflow-x-auto" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}>
                      {JSON.stringify(runResult.output, null, 2)}
                    </pre>
                    <div className="mt-1.5 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Workcell: {runResult.workcellId as string} · {runResult.latencyMs as number}ms · eval: {Math.round((runResult.evalScore as number) * 100)}%
                    </div>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <>
              <SectionTitle>Category Distribution</SectionTitle>
              <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className="flex items-center justify-between text-xs p-2 rounded hover:opacity-80"
                    style={{ backgroundColor: filterCategory === cat ? `${CAT_COLORS[cat] ?? '#5e5e5e'}18` : 'transparent' }}
                  >
                    <span style={{ color: CAT_COLORS[cat] ?? '#5e5e5e' }}>{cat}</span>
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {data.skills.filter(s => s.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a skill to view details and run it.</div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — all skill runs are proof-chained, eval-scored, and policy-gated. No destructive tool calls are made without human approval.
      </div>
    </Layout>
  );
}
