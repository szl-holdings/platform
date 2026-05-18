import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard } from '../components/ui';

/**
 * VesselsOps — a11oy's orchestration surface for the Vessels product.
 *
 * Mirrors SentraOps. Reads live KPIs from the `vessels:ops-status`
 * localStorage payload published by Vessels' own `vessels-store.ts`
 * (which polls `/api/vessels/ops-core/snapshot`). Static charter/doctrine
 * for each `vsl-*` agent is defined inline below — exact same pattern as
 * the `ag-*` agents in SentraOps.
 */

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  red: '#e05252',
  green: '#4ade80',
  amber: '#f59e0b',
  blue: '#60a5fa',
};

interface VesselsAgent {
  id: string;
  name: string;
  role: string;
  charter: string;
  doctrine: string[];
  allowed_actions: string[];
  prohibited_actions: string[];
  tools: string[];
  trust_score: number;
  dispatches_today: number;
  last_dispatch: string | null;
  requires_approval_for: string[];
}

const AGENTS: VesselsAgent[] = [
  {
    id: 'vsl-voyage-risk',
    name: 'Voyage Risk Composer',
    role: 'Voyage Risk Analyst',
    charter:
      'Composes the Λ normalized-risk score for each active voyage (severity × likelihood × value-at-risk, capped). Surfaces high-severity voyages to the operator. Never modifies routes — read-only.',
    doctrine: ['Λ thesis §5.2', 'IMO MSC.1/Circ.1389', 'Vessels Formula Registry'],
    allowed_actions: ['compute_risk', 'flag_voyage', 'update_dashboard'],
    prohibited_actions: ['route_change', 'charter_modification', 'cargo_release'],
    tools: ['risk_score', 'drift_kl', 'voyage_lookup', 'fleet_query'],
    trust_score: 96,
    dispatches_today: 0,
    last_dispatch: null,
    requires_approval_for: [],
  },
  {
    id: 'vsl-psc',
    name: 'PSC Checklist Steward',
    role: 'Port State Control Specialist',
    charter:
      'Maintains the Paris/Tokyo MoU port-state-control inspection checklist per vessel. Auto-pre-populates known deficiencies, surfaces overdue items. Never closes an inspection without operator sign-off.',
    doctrine: ['Paris MoU 2024', 'Tokyo MoU 2024', 'IMO Res. A.1052(27)'],
    allowed_actions: ['update_checklist', 'flag_overdue', 'attach_evidence'],
    prohibited_actions: ['close_inspection_without_signoff', 'modify_deficiency_history'],
    tools: ['psc_lookup', 'checklist_writer', 'mou_registry'],
    trust_score: 94,
    dispatches_today: 0,
    last_dispatch: null,
    requires_approval_for: ['close_inspection'],
  },
  {
    id: 'vsl-formula',
    name: 'Formula Closure Auditor',
    role: 'Formula Thesis Custodian',
    charter:
      'Runs the 4 canonical formula pillars (Λ, drift, proof-closure, voyage MC) on a schedule and on demand. Emits drift alerts when output divergence exceeds threshold. All runs are receipt-signed.',
    doctrine: ['Λ thesis §5–§7', 'docs/thesis/v10-canonical.md', 'CPS run-receipt'],
    allowed_actions: ['execute_formula', 'emit_drift_alert', 'sign_receipt'],
    prohibited_actions: ['mutate_thesis_constants', 'skip_receipt_signing'],
    tools: ['formula_runner', 'monte_carlo', 'receipt_signer', 'kl_divergence'],
    trust_score: 99,
    dispatches_today: 0,
    last_dispatch: null,
    requires_approval_for: [],
  },
  {
    id: 'vsl-sanctions',
    name: 'Sanctions Network Screener',
    role: 'OFAC / EU / UN Sanctions Specialist',
    charter:
      'Screens vessel ownership graphs against OFAC SDN, EU consolidated, and UN sanctions lists nightly and on registration. Flags second-degree ownership exposure. Never blocks a voyage without operator approval.',
    doctrine: ['OFAC Recordkeeping 31 CFR §501.601', 'EU 269/2014', 'UN Res. 1267 family'],
    allowed_actions: ['screen_owner', 'screen_charterer', 'emit_match_evidence'],
    prohibited_actions: ['block_voyage_without_approval', 'modify_sanctions_list'],
    tools: ['sdn_lookup', 'graph_traverse', 'evidence_pack', 'match_score'],
    trust_score: 98,
    dispatches_today: 0,
    last_dispatch: null,
    requires_approval_for: ['block_voyage', 'freeze_charter'],
  },
  {
    id: 'vsl-dark-detection',
    name: 'Dark-Vessel Detector',
    role: 'AIS Anomaly Specialist',
    charter:
      'Detects AIS gaps, manipulated positions, and identity spoofing using satellite RF + ownership signals. Cross-references with cognitive vessel-identity model. Never asserts identity without dual-witness signal.',
    doctrine: ['IHO S-58', 'IMO Res. A.1106(29)', 'Vessels Cognitive thesis'],
    allowed_actions: ['detect_gap', 'flag_spoofing', 'request_satellite_pass'],
    prohibited_actions: ['assert_identity_without_dual_witness', 'auto_alert_external_authority'],
    tools: ['ais_replay', 'rf_correlate', 'identity_graph', 'dual_witness'],
    trust_score: 93,
    dispatches_today: 0,
    last_dispatch: null,
    requires_approval_for: ['notify_external_authority'],
  },
];

interface VesselsAgentTelemetry {
  dispatches_today: number;
  last_dispatch: string | null;
}

interface VesselsModuleHealth {
  id: string;
  mounted: boolean;
  ok: boolean;
}

interface VesselsOpsStatus {
  vesselsTracked: number;
  anomaliesOpen: number;
  anomaliesTotal: number;
  riskHistoryRows: number;
  orgScoped: boolean;
  dbOk: boolean;
  modulesTotal: number;
  modulesHealthy: number;
  modules: VesselsModuleHealth[];
  agents?: Record<string, VesselsAgentTelemetry>;
  lastUpdated: string;
  reachable: boolean;
}

function readVesselsStatus(): VesselsOpsStatus | null {
  try {
    const raw = localStorage.getItem('vessels:ops-status');
    return raw ? (JSON.parse(raw) as VesselsOpsStatus) : null;
  } catch {
    return null;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t === 0) return 'never';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

type View = 'agents' | 'modules' | 'doctrine';

export function VesselsOps() {
  const [view, setView] = useState<View>('agents');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [vesselsStatus, setVesselsStatus] = useState<VesselsOpsStatus | null>(readVesselsStatus);

  // Poll the Vessels bridge written by `vessels-store.ts` every 2s — same
  // cadence as SentraOps so a11oy feels uniform across products.
  useEffect(() => {
    setVesselsStatus(readVesselsStatus());
    const timer = setInterval(() => setVesselsStatus(readVesselsStatus()), 2000);
    return () => clearInterval(timer);
  }, []);

  // Merge live per-agent telemetry from the bridge over the static charter.
  const liveAgents: VesselsAgent[] = AGENTS.map((a) => {
    const tele = vesselsStatus?.agents?.[a.id];
    if (!tele) return a;
    return {
      ...a,
      dispatches_today: tele.dispatches_today,
      last_dispatch: tele.last_dispatch,
    };
  });

  const totalDispatches = liveAgents.reduce((s, a) => s + a.dispatches_today, 0);
  const avgTrust = Math.round(AGENTS.reduce((s, a) => s + a.trust_score, 0) / AGENTS.length);

  return (
    <Layout>
      <PageHeader
        label="VESSELS OPERATIONS"
        title="Vessels Maritime Ops Orchestration"
        subtitle="A11oy deploys 5 specialized agents to orchestrate Vessels' maritime-intelligence platform. All agents operate within the Vessels Formula Thesis and the Λ-gated policy contract — no agent may mutate route, cargo, or charter state."
        status="LIVE"
      />

      {/* KPIs — first row: agent orchestration metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <KpiCard label="ACTIVE AGENTS" value={AGENTS.length} sub="charter live" accent={T.accent} />
        <KpiCard label="DISPATCHES TODAY" value={totalDispatches} sub="agent total" accent={T.dim} />
        <KpiCard label="AVG TRUST" value={avgTrust} sub="score" accent={T.accent} />
        <KpiCard label="HITL GATES" value={AGENTS.filter((a) => a.requires_approval_for.length > 0).length} sub="of 5" accent={T.amber} />
        <KpiCard label="POLICY SCOPE" value="READ + FLAG" sub="no mutation" accent={T.green} />
        <KpiCard
          label="BRIDGE"
          value={vesselsStatus?.reachable ? 'LIVE' : 'STALE'}
          sub={vesselsStatus ? formatRelative(vesselsStatus.lastUpdated) : 'no data'}
          accent={vesselsStatus?.reachable ? T.green : T.amber}
        />
      </div>

      {/* KPIs — second row: live Vessels store telemetry */}
      {vesselsStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <KpiCard label="VESSELS TRACKED" value={vesselsStatus.vesselsTracked} sub="risk surveillance" accent={T.blue} />
          <KpiCard label="ANOMALIES OPEN" value={vesselsStatus.anomaliesOpen} sub={`of ${vesselsStatus.anomaliesTotal}`} accent={T.red} />
          <KpiCard label="RISK HISTORY" value={vesselsStatus.riskHistoryRows} sub="rows persisted" accent={T.dim} />
          <KpiCard
            label="MODULES HEALTHY"
            value={vesselsStatus.modulesHealthy}
            sub={`of ${vesselsStatus.modulesTotal}`}
            accent={vesselsStatus.modulesHealthy === vesselsStatus.modulesTotal ? T.green : T.amber}
          />
          <KpiCard label="DB" value={vesselsStatus.dbOk ? 'OK' : 'DEGRADED'} sub="persistence" accent={vesselsStatus.dbOk ? T.green : T.red} />
          <KpiCard label="ORG SCOPE" value={vesselsStatus.orgScoped ? 'BOUND' : 'PUBLIC'} sub="tenant binding" accent={T.dim} />
        </div>
      )}
      {!vesselsStatus && (
        <div className="rounded-lg border px-4 py-3 mb-8 text-[10px] font-mono text-slate-600" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          Vessels telemetry not yet available — open Vessels to initialize the bridge, then return here for live data.
        </div>
      )}

      {/* Formula contract notice */}
      <div className="rounded-lg p-3 mb-6 flex items-start gap-2" style={{ background: 'rgba(201,183,135,0.05)', border: `1px solid rgba(201,183,135,0.15)` }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] mt-1.5 flex-shrink-0" />
        <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
          <strong style={{ color: T.accent }}>A11OY VESSELS POLICY CONTRACT: </strong>
          All 5 agents are scoped to read-and-flag classes within the Vessels Formula Thesis. No agent can mutate route,
          charter, cargo, or sanctions state. Λ-gate, dual-witness, and receipt-chain mechanisms enforced at the api-server layer.
          Doctrine: Lutar Invariant Λ, Paris/Tokyo MoU, OFAC SDN, IMO MSC, IHO S-58.
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6">
        {(['agents', 'modules', 'doctrine'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all"
            style={{
              background: view === v ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: view === v ? T.accent : T.muted,
              border: `1px solid ${view === v ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Agents view */}
      {view === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {liveAgents.map((agent) => {
            const expanded = selectedAgent === agent.id;
            return (
              <div
                key={agent.id}
                className="rounded-lg p-4 transition-all cursor-pointer"
                style={{
                  background: T.surface,
                  border: `1px solid ${expanded ? 'rgba(201,183,135,0.25)' : T.border}`,
                }}
                onClick={() => setSelectedAgent(expanded ? null : agent.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono uppercase text-[#c9b787] mb-1">{agent.id}</div>
                    <div className="text-sm text-slate-200 font-medium truncate">{agent.name}</div>
                    <div className="text-[11px] text-slate-500">{agent.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono text-[#c9b787]">{agent.trust_score}</div>
                    <div className="text-[9px] font-mono uppercase text-slate-500">trust</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mb-2">
                  <span>
                    <span className="text-slate-300">{agent.dispatches_today}</span> today
                  </span>
                  <span>·</span>
                  <span>last: {formatRelative(agent.last_dispatch)}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{agent.charter}</div>

                {expanded && (
                  <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: T.border }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Allowed Actions</div>
                        <div className="space-y-1">
                          {agent.allowed_actions.map((ac) => (
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
                          {agent.prohibited_actions.map((ac) => (
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
                        {agent.tools.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">Doctrine</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.doctrine.map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#c9b787]/05 text-[#c9b787] border border-[#c9b787]/15">
                            {d}
                          </span>
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

      {/* Modules view — live module-health snapshot from /api/vessels/ops-core */}
      {view === 'modules' && (
        <div className="space-y-2">
          {(vesselsStatus?.modules ?? []).length === 0 && (
            <div className="text-[11px] font-mono text-slate-500">No module telemetry yet — bridge has not received a snapshot.</div>
          )}
          {(vesselsStatus?.modules ?? []).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md px-3 py-2 text-[11px] font-mono"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.ok ? T.green : T.red }} />
                <span className="text-slate-300">{m.id}</span>
              </div>
              <div className="text-slate-500">
                {m.mounted ? 'mounted' : 'unmounted'} · {m.ok ? 'healthy' : 'degraded'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctrine view */}
      {view === 'doctrine' && (
        <div className="space-y-3 text-[12px] text-slate-300 leading-relaxed">
          <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-[10px] font-mono uppercase text-[#c9b787] mb-2">Formula Thesis</div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Λ — Normalized Risk Composite (docs/thesis/v10-canonical.md §5.2)</li>
              <li>Drift — KL Divergence (§5.4)</li>
              <li>Λ₁₀ — Proof Closure (§6.1)</li>
              <li>Voyage Cost — Monte Carlo (§7.3)</li>
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-[10px] font-mono uppercase text-[#c9b787] mb-2">Maritime Doctrine</div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Paris MoU 2024 / Tokyo MoU 2024 — port state control</li>
              <li>IMO Res. A.1052(27) / A.1106(29) — PSC + AIS</li>
              <li>OFAC SDN, EU 269/2014, UN Res. 1267 family — sanctions screening</li>
              <li>IHO S-58 — AIS data quality</li>
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="text-[10px] font-mono uppercase text-[#c9b787] mb-2">A11oy Mechanisms (inherited)</div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
              <li>Λ-gate · receipt-chain · Bekenstein gate</li>
              <li>Dual-witness · witness diversity · ref-vector parity</li>
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
