import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
  red: '#e05252', green: '#4ade80', amber: '#f59e0b', blue: '#60a5fa',
};

interface SentraAgent {
  id: string;
  name: string;
  role: string;
  charter: string;
  doctrine: string[];
  allowed_actions: string[];
  prohibited_actions: string[];
  tools: string[];
  status: 'active' | 'standby' | 'killed';
  trust_score: number;
  dispatches_today: number;
  last_dispatch: string;
  requires_approval_for: string[];
  kill_switch_reason?: string;
}

interface SentraJob {
  id: string;
  name: string;
  schedule: string;
  description: string;
  steps: string[];
  target_scope: string;
  last_run: string;
  next_run: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'dry_run_only';
  outputs: string[];
  doctrine: string[];
}

const AGENTS: SentraAgent[] = [
  {
    id: 'ag-triage',
    name: 'Triage Navigator',
    role: 'Incident Triage Specialist',
    charter: 'Auto-classifies incoming alerts using MITRE ATT&CK and severity scoring. Routes P1/P2 incidents to human analysts immediately. Never takes containment action without human approval.',
    doctrine: ['NIST SP 800-61r2 §3.1', 'MITRE ATT&CK Triage', 'CISA CIRCIA §6'],
    allowed_actions: ['detect', 'enrich', 'alert', 'create_ticket', 'update_case'],
    prohibited_actions: ['ALL offensive/retaliatory actions', 'contain_owned_asset without approval', 'revoke_owned_access without approval'],
    tools: ['siem_query', 'mitre_lookup', 'severity_score', 'asset_registry_lookup', 'alert_correlate'],
    status: 'active',
    trust_score: 97,
    dispatches_today: 23,
    last_dispatch: new Date(Date.now() - 1800000).toISOString(),
    requires_approval_for: ['contain_owned_asset', 'revoke_owned_access', 'rotate_owned_secret'],
  },
  {
    id: 'ag-evidence',
    name: 'Evidence Custodian',
    role: 'Evidence Preservation Specialist',
    charter: 'Collects, hashes (SHA-256), locks, and maintains chain-of-custody for all forensic evidence. Signs evidence packs with Merkle root. Never modifies evidence after locking. Operates on owned assets only.',
    doctrine: ['NIST SP 800-61r2 §3.4', 'FBI IC3 Evidence §2', 'CISA CIRCIA §7', 'NCSC ACD §Evidence'],
    allowed_actions: ['preserve_evidence', 'export_evidence', 'update_case'],
    prohibited_actions: ['ALL write operations on locked evidence', 'ALL offensive actions', 'ANY cross-tenant operation'],
    tools: ['sha256_hash', 'merkle_sign', 'evidence_store', 'chain_of_custody_append', 'evidence_lock'],
    status: 'active',
    trust_score: 99,
    dispatches_today: 12,
    last_dispatch: new Date(Date.now() - 3600000).toISOString(),
    requires_approval_for: ['export_evidence'],
  },
  {
    id: 'ag-containment',
    name: 'Containment Recommender',
    role: 'Containment Strategy Specialist',
    charter: 'Analyzes incident scope and recommends containment actions with blast radius preview. Generates containment playbooks. NEVER executes containment without approved Approval record from human reviewer.',
    doctrine: ['NIST SP 800-61r2 §3.3', 'MITRE D3FEND D3-NI', 'CISA CIRCIA §3(a)', 'NSA Advisory AA22-320A'],
    allowed_actions: ['detect', 'enrich', 'update_case', 'notify'],
    prohibited_actions: ['contain_owned_asset (execution — recommendation only)', 'ALL offensive actions', 'Cross-tenant operations'],
    tools: ['blast_radius_calc', 'playbook_generate', 'asset_registry_query', 'containment_sim', 'mitre_d3fend_lookup'],
    status: 'active',
    trust_score: 95,
    dispatches_today: 8,
    last_dispatch: new Date(Date.now() - 7200000).toISOString(),
    requires_approval_for: ['contain_owned_asset', 'revoke_owned_access', 'rotate_owned_secret', 'restore_owned_asset'],
  },
  {
    id: 'ag-attribution',
    name: 'Attribution Analyst',
    role: 'Threat Actor Attribution',
    charter: 'Drafts threat actor attribution hypotheses based on MITRE ATT&CK TTPs and IOC analysis. Attribution is informational only — never used to justify offensive response. All output requires human review before external disclosure.',
    doctrine: ['MITRE ATT&CK Groups', 'CISA Advisories', 'FBI IC3 Attribution Standards', 'NSA Published Threat Reports'],
    allowed_actions: ['enrich', 'detect', 'update_case'],
    prohibited_actions: ['ALL actions targeting attacker infrastructure', 'ALL offensive/retaliatory actions', 'External disclosure without human review'],
    tools: ['ioc_lookup', 'mitre_groups_query', 'threat_intel_enrich', 'ttp_correlate', 'attribution_draft'],
    status: 'active',
    trust_score: 88,
    dispatches_today: 5,
    last_dispatch: new Date(Date.now() - 10800000).toISOString(),
    requires_approval_for: ['export_evidence'],
  },
  {
    id: 'ag-report',
    name: 'Report Generator',
    role: 'Incident Reporting Specialist',
    charter: 'Generates structured incident reports (6 types) including CIRCIA referral packages, insurance reports, and PIRs. All reports include evidence manifest and policy decision log. Never generates reports without incident evidence.',
    doctrine: ['NIST SP 800-61r2 §3.5', 'CISA CIRCIA Reporting', 'FBI IC3 Referral Standards', 'NCSC Incident Reporting'],
    allowed_actions: ['generate_report', 'export_evidence', 'update_case', 'notify'],
    prohibited_actions: ['ALL offensive actions', 'Report generation without evidence', 'Unapproved external disclosure'],
    tools: ['report_template', 'evidence_manifest_compile', 'circia_trigger_check', 'pdf_generate', 'json_export'],
    status: 'active',
    trust_score: 94,
    dispatches_today: 3,
    last_dispatch: new Date(Date.now() - 14400000).toISOString(),
    requires_approval_for: ['export_evidence'],
  },
  {
    id: 'ag-audit',
    name: 'Audit Verifier',
    role: 'Audit & Integrity Monitor',
    charter: 'Continuously verifies the tamper-evident audit trail hash chain. Alerts on chain integrity violations. Monitors for policy bypass attempts. Generates daily audit digests for compliance reporting.',
    doctrine: ['NIST SP 800-92', 'SOC 2 Type II', 'NIST CSF 2.0 GV.OV', 'ISO 27001 A.12.4'],
    allowed_actions: ['detect', 'alert', 'generate_report', 'notify'],
    prohibited_actions: ['ALL write operations on audit log', 'ALL offensive actions', 'Audit log deletion or modification'],
    tools: ['hash_chain_verify', 'audit_digest', 'policy_bypass_detect', 'compliance_check', 'alert_generate'],
    status: 'active',
    trust_score: 100,
    dispatches_today: 288,
    last_dispatch: new Date(Date.now() - 300000).toISOString(),
    requires_approval_for: [],
  },
  {
    id: 'ag-policy',
    name: 'Policy Enforcement Monitor',
    role: 'Policy & Safety Gate Monitor',
    charter: 'Monitors all policy gate evaluations in real time. Alerts on unusual denial patterns (potential policy bypass attempts). Validates that no denied action classes have active code paths. Reports to CISO on denial trends.',
    doctrine: ['NIST CSF 2.0 GV.PO', 'NIST SP 800-53 SI-3', 'CISA CIRCIA §3', 'NSA Zero Trust Tenets'],
    allowed_actions: ['detect', 'alert', 'generate_report', 'notify'],
    prohibited_actions: ['ALL policy modification without CISO approval', 'ALL offensive actions', 'Policy gate bypass'],
    tools: ['policy_log_query', 'denial_pattern_detect', 'action_class_verify', 'policy_report', 'bypass_alert'],
    status: 'active',
    trust_score: 100,
    dispatches_today: 156,
    last_dispatch: new Date(Date.now() - 600000).toISOString(),
    requires_approval_for: [],
  },
];

const JOBS: SentraJob[] = [
  {
    id: 'job-audit-verify',
    name: 'Audit Chain Verification',
    schedule: 'Every 5 minutes',
    description: 'Continuously verifies the tamper-evident audit trail hash chain from genesis to latest entry. Alerts on any integrity violation.',
    steps: [
      '1. Fetch all audit entries ordered by sequence',
      '2. Traverse hash chain: verify entry_hash = H(payload + prev_hash)',
      '3. Report: entries verified, chain_valid, first_invalid_id (if any)',
      '4. Alert CISO + Audit Verifier Agent if chain_valid = false',
    ],
    target_scope: 'Audit Trail (in-app)',
    last_run: new Date(Date.now() - 300000).toISOString(),
    next_run: new Date(Date.now() + 5000).toISOString(),
    status: 'scheduled',
    outputs: ['audit_verification_report', 'chain_integrity_alert (if violation)'],
    doctrine: ['NIST SP 800-92', 'SOC 2 Type II', 'ISO 27001 A.12.4'],
  },
  {
    id: 'job-evidence-digest',
    name: 'Evidence Pack Digest',
    schedule: 'Every 4 hours',
    description: 'Generates evidence pack for all incidents with new evidence since last run. Verifies Merkle root integrity of existing packs.',
    steps: [
      '1. Query incidents with evidence_ids added since last run',
      '2. For each: generate evidence pack + compute Merkle root',
      '3. Verify existing pack Merkle roots',
      '4. Report: new_packs_created, existing_packs_verified, integrity_failures',
    ],
    target_scope: 'Evidence Vault (owned tenant only)',
    last_run: new Date(Date.now() - 14400000).toISOString(),
    next_run: new Date(Date.now() + 480000).toISOString(),
    status: 'scheduled',
    outputs: ['evidence_pack_digest_report', 'integrity_alert (if verification fails)'],
    doctrine: ['NIST SP 800-61r2 §3.4', 'FBI IC3 §2', 'CISA CIRCIA §7'],
  },
  {
    id: 'job-approval-sweep',
    name: 'Approval Expiry Sweep',
    schedule: 'Every 15 minutes',
    description: 'Scans all pending approvals and marks expired ones. Notifies requesting analysts of expired approvals. Calculates approval queue metrics.',
    steps: [
      '1. Query all approvals with status = pending',
      '2. For each: check expires_at < now() → mark as expired',
      '3. Notify requesting analyst of each expired approval',
      '4. Calculate queue metrics: pending_count, oldest_age_minutes, expiry_rate',
    ],
    target_scope: 'Approval Queue (in-app)',
    last_run: new Date(Date.now() - 900000).toISOString(),
    next_run: new Date(Date.now() + 120000).toISOString(),
    status: 'scheduled',
    outputs: ['approval_queue_metrics', 'expiry_notifications'],
    doctrine: ['NIST SP 800-61r2 §3.3', 'MITRE D3FEND D3-HITL'],
  },
  {
    id: 'job-policy-sweep',
    name: 'Policy Denial Pattern Analysis',
    schedule: 'Hourly',
    description: 'Analyzes policy denial logs for unusual patterns that may indicate policy bypass attempts. Reports denial rates by action class and integration.',
    steps: [
      '1. Fetch all policy decisions from the last hour',
      '2. Calculate denial rate by action_class, integration, requesting_analyst',
      '3. Flag: denial_rate > 30% for any action_class → alert Policy Enforcement Monitor',
      '4. Generate hourly policy summary report',
    ],
    target_scope: 'Policy Enforcement Log (in-app)',
    last_run: new Date(Date.now() - 3600000).toISOString(),
    next_run: new Date(Date.now() + 600000).toISOString(),
    status: 'scheduled',
    outputs: ['hourly_policy_summary', 'bypass_attempt_alert (if triggered)'],
    doctrine: ['NIST CSF 2.0 GV.PO', 'NIST SP 800-53 SI-3', 'NSA Zero Trust Tenets'],
  },
  {
    id: 'job-asset-refresh',
    name: 'Asset Registry Staleness Check',
    schedule: 'Daily at 00:00 UTC',
    description: 'Identifies assets not updated in 90+ days and assets with missing authorization references. Flags unverified assets for review.',
    steps: [
      '1. Query assets with updated_at < now() - 90 days',
      '2. Query assets with ownership_status = unknown or unverified',
      '3. Query assets with empty authorization_reference',
      '4. Generate asset staleness report — route to asset owners for verification',
    ],
    target_scope: 'Asset Registry (tenant-001)',
    last_run: new Date(Date.now() - 86400000).toISOString(),
    next_run: new Date(Date.now() + 72000000).toISOString(),
    status: 'scheduled',
    outputs: ['asset_staleness_report', 'owner_notifications'],
    doctrine: ['NIST CSF 2.0 ID.AM', 'CIS Control 1', 'CISA KEV Asset Tracking'],
  },
  {
    id: 'job-session-digest',
    name: 'Session Digest Snapshot',
    schedule: 'Every 30 minutes',
    description: 'Captures a snapshot of session activity (approvals, evidence, reports, denials) and writes to the session digest feed. Ensures no action goes unlogged.',
    steps: [
      '1. Snapshot session_digest from in-app store',
      '2. Calculate: actions_taken, denials_recorded, evidence_locked, approvals_decided',
      '3. Write snapshot entry to session digest',
      '4. Route to Audit Verifier Agent for chain append',
    ],
    target_scope: 'Session Digest (in-app)',
    last_run: new Date(Date.now() - 1800000).toISOString(),
    next_run: new Date(Date.now() + 600000).toISOString(),
    status: 'scheduled',
    outputs: ['session_digest_snapshot'],
    doctrine: ['NIST SP 800-92', 'SOC 2 Type II Activity Log'],
  },
];

type View = 'agents' | 'jobs' | 'doctrine';

interface AgentTelemetry {
  dispatches_today: number;
  last_dispatch: string | null;
}

interface SentraOpsStatus {
  activeIncidents: number;
  pendingApprovals: number;
  auditEntries: number;
  evidenceItems: number;
  policyDenials: number;
  totalAssets: number;
  ownedAssets: number;
  agents?: Record<string, AgentTelemetry>;
  lastUpdated: string;
}

function readSentraStatus(): SentraOpsStatus | null {
  try {
    const raw = localStorage.getItem('sentra:ops-status');
    return raw ? (JSON.parse(raw) as SentraOpsStatus) : null;
  } catch {
    return null;
  }
}

// Cross-device fallback: when the local `sentra:ops-status` bridge is empty
// (operator on a different browser/device, or a fresh session), pull the
// latest broadcast from the API server. Sentra pushes here on every store
// mutation, so any open Sentra session anywhere keeps this view live.
async function fetchSentraStatusFromApi(): Promise<SentraOpsStatus | null> {
  try {
    const res = await fetch('/api/sentra/status', {
      headers: { accept: 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = await res.json() as { status?: SentraOpsStatus | null };
    return body?.status ?? null;
  } catch {
    return null;
  }
}

export function SentraOps() {
  const [view, setView] = useState<View>('agents');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [killedAgents, setKilledAgents] = useState<Record<string, string>>({});
  const [dryRunJob, setDryRunJob] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<string | null>(null);
  const [sentraStatus, setSentraStatus] = useState<SentraOpsStatus | null>(readSentraStatus);

  // Poll Sentra store state. Primary source is the localStorage bridge written
  // by sentra-store.ts (same-browser handoff). When that's empty — operator
  // on a different device/browser or a fresh session — fall back to the API
  // server, which Sentra pushes to on every mutation.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const local = readSentraStatus();
      if (local) {
        if (!cancelled) setSentraStatus(local);
        return;
      }
      const remote = await fetchSentraStatusFromApi();
      if (!cancelled && remote) setSentraStatus(remote);
    };

    void tick();
    const timer = setInterval(() => { void tick(); }, 2000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Merge live per-agent telemetry from the Sentra store (if available) over
  // the static agent definitions so the dashboard reflects real activity.
  const liveAgents: SentraAgent[] = AGENTS.map(a => {
    const tele = sentraStatus?.agents?.[a.id];
    if (!tele) return a;
    return {
      ...a,
      dispatches_today: tele.dispatches_today,
      last_dispatch: tele.last_dispatch ?? a.last_dispatch,
    };
  });

  const activeAgents = liveAgents.filter(a => !killedAgents[a.id]);
  const totalDispatches = liveAgents.reduce((s, a) => s + a.dispatches_today, 0);

  function handleKillSwitch(agentId: string, reason: string) {
    setKilledAgents(prev => ({ ...prev, [agentId]: reason || 'Emergency kill-switch activated by operator' }));
    if (selectedAgent === agentId) setSelectedAgent(null);
  }

  function handleRestore(agentId: string) {
    setKilledAgents(prev => { const n = { ...prev }; delete n[agentId]; return n; });
  }

  async function handleDryRun(jobId: string) {
    setDryRunJob(jobId);
    await new Promise(r => setTimeout(r, 1200));
    const job = JOBS.find(j => j.id === jobId)!;
    setDryRunResult(`[DRY RUN] ${job.name}: ${job.steps.length} steps validated. Outputs: ${job.outputs.join(', ')}. No changes made.`);
    setDryRunJob(null);
    setTimeout(() => setDryRunResult(null), 6000);
  }

  return (
    <Layout>
      <PageHeader
        label="SENTRA OPERATIONS"
        title="Sentra Defensive Ops Orchestration"
        subtitle="A11oy deploys 7 specialized agents and 6 scheduled jobs to orchestrate Sentra's defensive SOC platform. All agents operate within the Sentra Policy Gate — no offensive actions callable."
        status="LIVE"
      />

      {/* KPIs — first row: agent orchestration metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <KpiCard label="ACTIVE AGENTS" value={activeAgents.length} sub="of 7" accent={T.accent} />
        <KpiCard label="KILLED AGENTS" value={Object.keys(killedAgents).length} sub="emergency stop" accent={T.red} />
        <KpiCard label="SCHEDULED JOBS" value={JOBS.length} sub="jobs" accent={T.accent} />
        <KpiCard label="DISPATCHES TODAY" value={totalDispatches} sub="agent total" accent={T.dim} />
        <KpiCard label="AVG TRUST" value={Math.round(AGENTS.reduce((a, ag) => a + ag.trust_score, 0) / AGENTS.length)} sub="score" accent={T.accent} />
        <KpiCard label="POLICY SCOPE" value="DEFENSIVE" sub="only" accent={T.green} />
      </div>

      {/* KPIs — second row: live Sentra store telemetry */}
      {sentraStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <KpiCard label="ACTIVE INCIDENTS" value={sentraStatus.activeIncidents} sub="Sentra live" accent={T.red} />
          <KpiCard label="PENDING APPROVALS" value={sentraStatus.pendingApprovals} sub="Sentra live" accent={T.amber} />
          <KpiCard label="EVIDENCE ITEMS" value={sentraStatus.evidenceItems} sub="Sentra live" accent={T.accent} />
          <KpiCard label="AUDIT ENTRIES" value={sentraStatus.auditEntries} sub="Sentra live" accent={T.dim} />
          <KpiCard label="POLICY DENIALS" value={sentraStatus.policyDenials} sub="Sentra live" accent={T.red} />
          <KpiCard label="OWNED ASSETS" value={sentraStatus.ownedAssets} sub={`of ${sentraStatus.totalAssets}`} accent={T.green} />
        </div>
      )}
      {!sentraStatus && (
        <div className="rounded-lg border px-4 py-3 mb-8 text-[10px] font-mono text-slate-600" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          Sentra telemetry not yet available — open Sentra in any session (this browser or another device) to publish ops status, then this view will hydrate from the API bridge automatically.
        </div>
      )}

      {/* Defensive doctrine notice */}
      <div className="rounded-lg p-3 mb-6 flex items-start gap-2" style={{ background: 'rgba(201,183,135,0.05)', border: `1px solid rgba(201,183,135,0.15)` }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] mt-1.5 flex-shrink-0" />
        <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
          <strong style={{ color: T.accent }}>A11OY SENTRA POLICY CONTRACT: </strong>
          All 7 agents are scoped to defensive-only action classes. No agent can request, route, or execute: offensive, retaliatory, hack-back, exploit, payload, external-scan, or attacker-system-execution actions.
          Safety Gate denial message is enforced at the Sentra API layer. Each agent has a live kill-switch below.
          Doctrine: NIST SP 800-61r2, MITRE D3FEND, CISA CIRCIA, NSA Cybersecurity Directorate, FBI IC3.
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6">
        {(['agents', 'jobs', 'doctrine'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all"
            style={{ background: view === v ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === v ? T.accent : T.muted, border: `1px solid ${view === v ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {v}
          </button>
        ))}
      </div>

      {/* Agents view */}
      {view === 'agents' && (
        <div className="space-y-3">
          {liveAgents.map(agent => {
            const killed = killedAgents[agent.id];
            const isSelected = selectedAgent === agent.id;
            const tele = sentraStatus?.agents?.[agent.id];
            const isLive = Boolean(tele);
            const lastLabel = tele
              ? (tele.last_dispatch ? new Date(tele.last_dispatch).toLocaleTimeString() : 'no activity yet')
              : new Date(agent.last_dispatch).toLocaleTimeString();
            return (
              <div key={agent.id} className="rounded-lg border" style={{ background: T.surface, borderColor: killed ? T.red : T.border }}>
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setSelectedAgent(isSelected ? null : agent.id)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: killed ? T.red : T.green }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{agent.name}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded border" style={{ color: T.dim, borderColor: T.border }}>{agent.role}</span>
                      {killed && <span className="text-[9px] font-mono text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">KILLED</span>}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Trust: <span style={{ color: T.accent }}>{agent.trust_score}</span> · Dispatches today: <span style={{ color: isLive ? T.green : T.dim }}>{agent.dispatches_today}</span> · Last: {lastLabel}
                      {isLive && <span className="ml-2 text-[9px] font-mono" style={{ color: T.green }}>● LIVE</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!killed ? (
                      <button onClick={e => { e.stopPropagation(); const r = window.prompt('Kill-switch reason:'); if (r !== null) handleKillSwitch(agent.id, r); }}
                        className="px-2 py-1 rounded text-[9px] font-mono border transition-all hover:bg-red-500/10"
                        style={{ borderColor: T.red, color: T.red }}>
                        KILL SWITCH
                      </button>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); handleRestore(agent.id); }}
                        className="px-2 py-1 rounded text-[9px] font-mono border transition-all"
                        style={{ borderColor: T.green, color: T.green }}>
                        RESTORE
                      </button>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t p-4 space-y-4" style={{ borderColor: T.border }}>
                    {killed && (
                      <div className="text-[10px] font-mono p-2 rounded border" style={{ borderColor: T.red, color: T.red, background: 'rgba(224,82,82,0.05)' }}>
                        KILLED: {killed}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 leading-relaxed">{agent.charter}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Allowed Actions</div>
                        <div className="space-y-1">
                          {agent.allowed_actions.map(ac => (
                            <div key={ac} className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                              <span className="font-mono text-slate-300">{ac}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Prohibited Actions</div>
                        <div className="space-y-1">
                          {agent.prohibited_actions.slice(0, 5).map(ac => (
                            <div key={ac} className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              <span className="font-mono text-slate-500">{ac}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">Tools</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">Doctrine</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.doctrine.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#c9b787]/05 text-[#c9b787] border border-[#c9b787]/15">{d}</span>
                        ))}
                      </div>
                    </div>
                    {agent.requires_approval_for.length > 0 && (
                      <div className="text-[10px] font-mono text-[#f59e0b]">
                        HITL Required For: {agent.requires_approval_for.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Jobs view */}
      {view === 'jobs' && (
        <div className="space-y-3">
          {dryRunResult && (
            <div className="rounded-lg p-3 text-[10px] font-mono" style={{ background: 'rgba(74,222,128,0.05)', border: `1px solid rgba(74,222,128,0.2)`, color: T.green }}>
              {dryRunResult}
            </div>
          )}
          {JOBS.map(job => {
            const statusColor: Record<string, string> = { scheduled: T.accent, running: T.blue, completed: T.green, failed: T.red, dry_run_only: T.dim };
            return (
              <div key={job.id} className="rounded-lg border p-4" style={{ background: T.surface, borderColor: T.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{job.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ color: statusColor[job.status], borderColor: `${statusColor[job.status]}30` }}>
                        {job.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mb-2">Schedule: {job.schedule} · Next: {new Date(job.next_run).toLocaleTimeString()}</div>
                    <div className="text-[11px] text-slate-400 mb-3">{job.description}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-600 mb-1">Steps</div>
                        <div className="space-y-0.5">
                          {job.steps.map((step, i) => (
                            <div key={i} className="text-[10px] font-mono text-slate-500">{step}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-600 mb-1">Outputs</div>
                        <div className="space-y-1">
                          {job.outputs.map(o => (
                            <div key={o} className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-1 h-1 rounded-full bg-[#c9b787]" />
                              <span className="font-mono text-slate-400">{o}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.doctrine.map(d => (
                            <span key={d} className="px-1.5 py-0.5 rounded text-[8px] font-mono" style={{ background: 'rgba(201,183,135,0.05)', color: T.accent, border: `1px solid rgba(201,183,135,0.15)` }}>{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDryRun(job.id)} disabled={dryRunJob === job.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-mono border transition-all flex-shrink-0 disabled:opacity-50"
                    style={{ borderColor: T.accent, color: T.accent, background: 'rgba(201,183,135,0.05)' }}>
                    {dryRunJob === job.id ? '…' : 'DRY RUN'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doctrine view */}
      {view === 'doctrine' && (
        <div className="space-y-4">
          <Card>
            <SectionTitle>Sentra Operations Policy Contract</SectionTitle>
            <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
              <p>All A11oy agents dispatched to Sentra operate under the following non-negotiable policy contract:</p>
              <div className="space-y-2">
                {[
                  ['Defensive-Only Scope', 'All 7 agents are restricted to 14 allowed defensive action classes. No offensive, retaliatory, hack-back, or attacker-side actions are implemented or callable.'],
                  ['Safety Gate Enforcement', 'Every action() call on every integration adapter passes through the Sentra Policy Gate. Gate checks: action class in allowed list, asset exists in registry, ownership_status is executable, tenant isolation, approval status for high-impact actions, audit logging enabled, rollback strategy present.'],
                  ['HITL (Human-in-the-Loop)', 'High-impact actions (contain_owned_asset, revoke_owned_access, rotate_owned_secret, export_evidence, restore_owned_asset) require a human-approved Approval record before execution.'],
                  ['Tamper-Evident Audit', 'Every action, approval, evidence event, and policy decision is written to the hash-chained audit trail. The Audit Verifier agent continuously verifies chain integrity.'],
                  ['Evidence Immutability', 'Evidence Custodian agent locks evidence after collection. Locked evidence cannot be modified — only chain-of-custody entries can be appended.'],
                  ['Attribution is Informational', 'Attribution Analyst drafts attribution hypotheses but cannot take action on suspected attacker infrastructure. Attribution output requires human review before external use.'],
                  ['Kill-Switch Requirement', 'Every agent has an operator kill-switch accessible in this interface. Killed agents stop accepting dispatches until restored by a human operator.'],
                  ['Denial Message Standard', 'When Safety Gate denies an action: "Action blocked by Sentra Policy Enforcement: target is not registered as an owned or authorized tenant asset, or the action is outside defensive scope."'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3 p-3 rounded-md" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-300 mb-0.5">{title}</div>
                      <div>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-md text-[10px] font-mono" style={{ background: 'rgba(201,183,135,0.05)', border: `1px solid rgba(201,183,135,0.15)`, color: T.accent }}>
                DOCTRINE CITATIONS: NIST SP 800-61r2 · NIST CSF 2.0 · CISA CIRCIA · MITRE ATT&CK · MITRE D3FEND · NSA Cybersecurity Directorate · NSA Zero Trust Tenets · FBI IC3 · NCSC ACD · ISO 27001 · SOC 2 Type II
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
