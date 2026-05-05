import { useState, useEffect, useCallback } from 'react';
import { useApiQuery } from '@/lib/use-api-query';
import { api } from '@/lib/api';

const T = {
  bg: '#060608',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f0',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  red: '#ef4444',
  orange: '#f97316',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
};

type Horizon = '24h' | '72h' | '168h';

interface AttackPath {
  id: string;
  rank: number;
  horizon: Horizon;
  threat_actor: string;
  apt_profile: string;
  likelihood: number;
  impact: number;
  time_to_exploit_hours: number;
  composite_score: number;
  kill_chain_phase: string;
  attack_techniques: string[];
  target_layer: 'perimeter' | 'identity' | 'workload' | 'data';
  countermove_proposed: boolean;
  countermove_status: 'pending' | 'approved' | 'denied' | 'staged';
  constitutional_clause: string;
  swarm_run_id: string;
  predicted_at: string;
  summary: string;
  intercept_layer: string;
  ttl_hours: number;
}

interface SwarmRun {
  id: string;
  agent_name: string;
  apt_profile: string;
  steps: { seq: number; action: string; result: string; technique: string; ts: string }[];
  duration_secs: number;
  covenant_gates_passed: number;
  proof_id: string;
}

interface Countermove {
  id: string;
  path_id: string;
  type: 'deception' | 'hardening' | 'detection-rule' | 'isolation' | 'on-call-brief';
  description: string;
  constitutional_clause: string;
  approval_status: 'pending' | 'approved' | 'denied';
  proof_id: string;
}

const SEED_PATHS: AttackPath[] = [
  {
    id: 'fth-001', rank: 1, horizon: '24h',
    threat_actor: 'APT29 (Cozy Bear)', apt_profile: 'russian-svr-apt29',
    likelihood: 0.87, impact: 0.94, time_to_exploit_hours: 6,
    composite_score: 94,
    kill_chain_phase: 'Lateral Movement',
    attack_techniques: ['T1550.002', 'T1021.001', 'AML.T0043'],
    target_layer: 'identity',
    countermove_proposed: true, countermove_status: 'pending',
    constitutional_clause: 'Article IX, §2 — Swarm may propose identity hardening; requires operator approval',
    swarm_run_id: 'swarm-run-0041',
    predicted_at: new Date(Date.now() - 18 * 60000).toISOString(),
    summary: 'Adversary swarm discovered a pass-the-hash path via service account with stale NTLM credentials. Identity intercept at Layer 2 (Identity) is pre-empted with 6h window.',
    intercept_layer: 'Identity Layer (Layer 2)',
    ttl_hours: 24,
  },
  {
    id: 'fth-002', rank: 2, horizon: '24h',
    threat_actor: 'Lazarus Group', apt_profile: 'dprk-lazarus',
    likelihood: 0.79, impact: 0.88, time_to_exploit_hours: 11,
    composite_score: 87,
    kill_chain_phase: 'Initial Access',
    attack_techniques: ['T1566.001', 'T1204.002', 'AML.T0048'],
    target_layer: 'workload',
    countermove_proposed: true, countermove_status: 'approved',
    constitutional_clause: 'Article IX, §1 — Perimeter deception placement pre-approved tier',
    swarm_run_id: 'swarm-run-0039',
    predicted_at: new Date(Date.now() - 45 * 60000).toISOString(),
    summary: 'Spear-phishing campaign targeting engineering team detected via swarm email behavioral simulation. Deception inbox pre-staged. Real phishing will land in controlled environment.',
    intercept_layer: 'Perimeter Layer (Layer 1)',
    ttl_hours: 24,
  },
  {
    id: 'fth-003', rank: 3, horizon: '72h',
    threat_actor: 'FIN7', apt_profile: 'fin7-carbanak',
    likelihood: 0.71, impact: 0.82, time_to_exploit_hours: 38,
    composite_score: 78,
    kill_chain_phase: 'Collection',
    attack_techniques: ['T1005', 'T1039', 'AML.T0037.000'],
    target_layer: 'data',
    countermove_proposed: true, countermove_status: 'pending',
    constitutional_clause: 'Article IX, §3 — Data exfiltration prevention; pre-staging detection rules allowed',
    swarm_run_id: 'swarm-run-0037',
    predicted_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    summary: 'Swarm modeled FIN7 collection TTP against cloud storage. 38h window before likely exploitation. Detection rule pre-staging and honeypot data seeding proposed.',
    intercept_layer: 'Data Layer (Layer 4)',
    ttl_hours: 72,
  },
  {
    id: 'fth-004', rank: 4, horizon: '72h',
    threat_actor: 'APT41 (Double Dragon)', apt_profile: 'china-apt41',
    likelihood: 0.65, impact: 0.91, time_to_exploit_hours: 52,
    composite_score: 72,
    kill_chain_phase: 'Privilege Escalation',
    attack_techniques: ['T1068', 'T1134.001', 'AML.T0044'],
    target_layer: 'workload',
    countermove_proposed: false, countermove_status: 'pending',
    constitutional_clause: 'Article IX, §2 — Awaiting countermove generation',
    swarm_run_id: 'swarm-run-0035',
    predicted_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    summary: 'Privilege escalation path via vulnerable kernel module identified in containerized workload. Patch pre-staging and microsegmentation countermove being generated.',
    intercept_layer: 'Workload Layer (Layer 3)',
    ttl_hours: 72,
  },
  {
    id: 'fth-005', rank: 5, horizon: '168h',
    threat_actor: 'Sandworm', apt_profile: 'russia-sandworm',
    likelihood: 0.58, impact: 0.97, time_to_exploit_hours: 96,
    composite_score: 68,
    kill_chain_phase: 'Impact',
    attack_techniques: ['T1485', 'T1491.002', 'AML.T0036'],
    target_layer: 'data',
    countermove_proposed: true, countermove_status: 'staged',
    constitutional_clause: 'Article IX, §4 — Destructive impact prevention; backup pre-staging auto-approved',
    swarm_run_id: 'swarm-run-0031',
    predicted_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    summary: 'Wiper-style impact scenario modeled against critical data stores. 96h window. Immutable backup pre-staging auto-approved per Article IX §4. Response playbook queued.',
    intercept_layer: 'Data Layer (Layer 4) + Response Layer (Layer 5)',
    ttl_hours: 168,
  },
];

const SEED_SWARM_RUN: SwarmRun = {
  id: 'swarm-run-0041',
  agent_name: 'APT29 Shadow Agent',
  apt_profile: 'russian-svr-apt29',
  duration_secs: 847,
  covenant_gates_passed: 7,
  proof_id: 'proof-swarm-2941a4f',
  steps: [
    { seq: 1, action: 'Reconnaissance — enumerate domain service accounts', result: 'Found 12 service accounts with weak credentials', technique: 'T1087.002', ts: new Date(Date.now() - 900000).toISOString() },
    { seq: 2, action: 'Credential Access — attempt NTLM hash extraction from twin', result: 'NTLM hashes retrieved from 3 stale accounts', technique: 'T1550.002', ts: new Date(Date.now() - 840000).toISOString() },
    { seq: 3, action: 'Lateral Movement — pass-the-hash to admin workstation', result: 'Lateral movement succeeded — twin admin access obtained', technique: 'T1021.001', ts: new Date(Date.now() - 780000).toISOString() },
    { seq: 4, action: 'Persistence — establish scheduled task', result: 'Persistence mechanism planted in twin', technique: 'T1053.005', ts: new Date(Date.now() - 720000).toISOString() },
    { seq: 5, action: 'Covenant Gate — impact proposal requires approval', result: 'BLOCKED by Article IX, §2 — escalating to countermove proposer', technique: 'COVENANT-GATE', ts: new Date(Date.now() - 660000).toISOString() },
    { seq: 6, action: 'Countermove generated — credential rotation + deception identity', result: 'Proposal queued in a11oy Approval Queue', technique: 'COUNTERMOVE', ts: new Date(Date.now() - 600000).toISOString() },
  ],
};

const SEED_COUNTERMOVES: Countermove[] = [
  { id: 'cm-001', path_id: 'fth-001', type: 'hardening', description: 'Force NTLM credential rotation for 3 service accounts with stale hashes. Enforce Kerberos-only authentication on affected endpoints.', constitutional_clause: 'Article IX, §2 — Identity hardening pre-approved for credential age > 90 days', approval_status: 'pending', proof_id: 'proof-cm-001a' },
  { id: 'cm-002', path_id: 'fth-001', type: 'deception', description: 'Deploy honeypot identity clone of highest-value service account along predicted lateral movement path.', constitutional_clause: 'Article IX, §2 — Deception assets may be placed without impact on production systems', approval_status: 'pending', proof_id: 'proof-cm-002a' },
  { id: 'cm-003', path_id: 'fth-002', type: 'detection-rule', description: 'Pre-stage Sigma rule for spear-phishing payload delivery pattern detected by swarm. Rule pushed to SIEM in simulation mode.', constitutional_clause: 'Article IX, §1 — Detection rule pre-staging is pre-approved tier', approval_status: 'approved', proof_id: 'proof-cm-003a' },
];

const HORIZON_COLORS: Record<Horizon, string> = { '24h': '#ef4444', '72h': '#f97316', '168h': '#f59e0b' };
const STATUS_COLORS: Record<string, string> = { pending: '#f97316', approved: '#22c55e', denied: '#ef4444', staged: '#c9b787' };
const CM_TYPE_ICONS: Record<string, string> = { deception: '◈', hardening: '⬡', 'detection-rule': '◆', isolation: '⊘', 'on-call-brief': '◎' };
const LAYER_COLORS: Record<string, string> = { perimeter: '#ef4444', identity: '#f59e0b', workload: '#3b82f6', data: '#8b5cf6', response: '#22c55e' };

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color: T.dim }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function FutureThreatHorizon() {
  const [selectedHorizon, setSelectedHorizon] = useState<Horizon | 'all'>('all');
  const [selectedPath, setSelectedPath] = useState<AttackPath | null>(null);
  const [showSwarmReplay, setShowSwarmReplay] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [tick, setTick] = useState(0);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, string>>({});
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  interface PredictionsData { predictions: AttackPath[]; total: number; horizons: Record<string, number>; }
  const PREDICTIONS_FALLBACK: PredictionsData = { predictions: SEED_PATHS, total: SEED_PATHS.length, horizons: {} };

  const { data: cortexData, reload: reloadPredictions } = useApiQuery<PredictionsData>(
    () => api.cortex.predictions(),
    'data',
    PREDICTIONS_FALLBACK
  );
  const apiPaths: AttackPath[] = cortexData.predictions ?? SEED_PATHS;

  const handleCountermoveAction = useCallback(async (pathId: string, action: 'approve' | 'deny' | 'stage') => {
    const key = `${pathId}-${action}`;
    setActionInFlight(key);
    const statusMap: Record<string, string> = { approve: 'approved', deny: 'denied', stage: 'staged' };
    setLocalStatusOverrides(prev => ({ ...prev, [pathId]: statusMap[action] }));
    try {
      await api.cortex.approveCountermove(pathId, action);
      reloadPredictions();
    } catch {
      setLocalStatusOverrides(prev => { const n = { ...prev }; delete n[pathId]; return n; });
    } finally {
      setActionInFlight(null);
    }
  }, [reloadPredictions]);

  const displayPaths: AttackPath[] = apiPaths.map(p => ({
    ...p,
    countermove_status: (localStatusOverrides[p.id] ?? p.countermove_status) as AttackPath['countermove_status'],
  }));

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!showSwarmReplay) { setReplayStep(0); return; }
    const iv = setInterval(() => {
      setReplayStep(s => Math.min(s + 1, SEED_SWARM_RUN.steps.length - 1));
    }, 1200);
    return () => clearInterval(iv);
  }, [showSwarmReplay]);

  const filteredPaths = selectedHorizon === 'all' ? displayPaths : displayPaths.filter(p => p.horizon === selectedHorizon);
  // Resolve the live (post-action) version of the selected path so countermove
  // status, AMI gate, and risk tier stay in sync after approve/deny/stage.
  const currentPath = selectedPath
    ? displayPaths.find(p => p.id === selectedPath.id) ?? selectedPath
    : null;
  // Map countermove approval_status onto the live path status so the
  // countermove rail and the path card never disagree.
  const pathStatusToApproval = (s: string): Countermove['approval_status'] => {
    if (s === 'approved' || s === 'staged') return 'approved';
    if (s === 'denied') return 'denied';
    return 'pending';
  };
  const countermovesForPath = currentPath
    ? SEED_COUNTERMOVES
        .filter(c => c.path_id === currentPath.id)
        .map(c => ({ ...c, approval_status: pathStatusToApproval(currentPath.countermove_status) }))
    : [];

  return (
    <div className="min-h-screen p-6" style={{ background: T.bg, color: T.text }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: T.accent }}>Predictive Defense Cortex</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded animate-pulse" style={{ background: 'rgba(201,183,135,0.1)', color: T.accent }}>LIVE SWARM ACTIVE</span>
          </div>
          <h1 className="text-3xl font-light mb-2" style={{ color: T.text, letterSpacing: '-0.02em' }}>Future Threat Horizon</h1>
          <p className="text-sm" style={{ color: T.dim, maxWidth: 680 }}>
            The a11oy adversary swarm runs 24/7 against your digital twin — time-compressed, governed by Adversarial Covenants. Below are the attack paths your swarm has discovered that <em style={{ color: T.text }}>will be</em> neutralized over the next 24, 72, and 168 hours. Not what happened yesterday — what will land tomorrow.
          </p>

          <div className="mt-4 p-3 rounded-lg flex items-center gap-4 flex-wrap" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)' }}>
            {[
              { label: 'Swarm Agents Active', value: '12', color: T.accent },
              { label: 'Twin Fidelity', value: '97.3%', color: T.green },
              { label: 'Predictions (24h)', value: displayPaths.filter(p => p.horizon === '24h').length, color: T.red },
              { label: 'Predictions (72h)', value: displayPaths.filter(p => p.horizon === '72h').length, color: T.orange },
              { label: 'Predictions (168h)', value: displayPaths.filter(p => p.horizon === '168h').length, color: '#f59e0b' },
              { label: 'Countermoves Staged', value: displayPaths.filter(p => p.countermove_status === 'staged' || p.countermove_status === 'approved').length, color: T.green },
              { label: 'Awaiting Approval', value: displayPaths.filter(p => p.countermove_status === 'pending').length, color: T.orange },
            ].map(kpi => (
              <div key={kpi.label} className="text-center">
                <div className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: T.muted }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', '24h', '72h', '168h'] as const).map(h => (
            <button key={h} onClick={() => setSelectedHorizon(h)} className="px-4 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: selectedHorizon === h ? (h === 'all' ? 'rgba(201,183,135,0.12)' : `${HORIZON_COLORS[h as Horizon]}18`) : T.surface, border: `1px solid ${selectedHorizon === h ? (h === 'all' ? 'rgba(201,183,135,0.3)' : `${HORIZON_COLORS[h as Horizon]}40`) : T.border}`, color: selectedHorizon === h ? (h === 'all' ? T.accent : HORIZON_COLORS[h as Horizon]) : T.muted, cursor: 'pointer' }}>
              {h === 'all' ? 'All horizons' : `Next ${h}`}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: T.muted }}>Predicted Attack Paths — ranked by likelihood × impact × time-to-exploit</div>
            {filteredPaths.map((path) => (
              <button key={path.id} onClick={() => { setSelectedPath(path); setShowSwarmReplay(false); }} className="w-full text-left rounded-xl p-4 transition-all" style={{ background: selectedPath?.id === path.id ? 'rgba(201,183,135,0.05)' : T.surface, border: `1px solid ${selectedPath?.id === path.id ? 'rgba(201,183,135,0.25)' : T.border}`, cursor: 'pointer' }}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold" style={{ background: `${HORIZON_COLORS[path.horizon]}15`, border: `1px solid ${HORIZON_COLORS[path.horizon]}30`, color: HORIZON_COLORS[path.horizon] }}>
                      #{path.rank}
                    </div>
                    <span className="text-[8px] font-mono" style={{ color: HORIZON_COLORS[path.horizon] }}>{path.horizon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold" style={{ color: T.text }}>{path.threat_actor}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${LAYER_COLORS[path.target_layer]}15`, color: LAYER_COLORS[path.target_layer] }}>{path.target_layer}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{path.kill_chain_phase}</span>
                      {path.countermove_status === 'staged' && <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: T.green }}>✓ STAGED</span>}
                      {path.countermove_status === 'approved' && <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: T.green }}>✓ APPROVED</span>}
                      {path.countermove_status === 'pending' && <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.08)', color: T.orange }}>⏳ AWAITING APPROVAL</span>}
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: T.dim }}>{path.summary}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {path.attack_techniques.map(t => (
                        <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: T.blue }}>{t}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[9px]">
                      <div>
                        <div style={{ color: T.muted }}>Likelihood</div>
                        <ScoreBar value={path.likelihood} color={HORIZON_COLORS[path.horizon]} />
                      </div>
                      <div>
                        <div style={{ color: T.muted }}>Impact</div>
                        <ScoreBar value={path.impact} color={T.red} />
                      </div>
                      <div>
                        <div style={{ color: T.muted }}>Time to Exploit</div>
                        <div className="font-mono font-bold text-[11px]" style={{ color: path.time_to_exploit_hours < 12 ? T.red : path.time_to_exploit_hours < 48 ? T.orange : T.dim }}>{path.time_to_exploit_hours}h</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-2xl font-mono font-bold" style={{ color: path.composite_score >= 90 ? T.red : path.composite_score >= 75 ? T.orange : T.accent }}>{path.composite_score}</div>
                    <div className="text-[8px] font-mono" style={{ color: T.muted }}>CORTEX SCORE</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {selectedPath ? (
              <>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.accent }}>Selected Prediction — #{selectedPath.rank}</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{selectedPath.threat_actor}</div>
                  <div className="text-[10px] mb-3" style={{ color: T.dim }}>{selectedPath.intercept_layer}</div>
                  <div className="p-2 rounded text-[10px] mb-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                    <div className="text-[9px] font-mono mb-1" style={{ color: T.accent }}>CONSTITUTIONAL CITATION</div>
                    <div style={{ color: T.dim }}>{selectedPath.constitutional_clause}</div>
                  </div>
                  <button
                    onClick={() => setShowSwarmReplay(r => !r)}
                    className="w-full py-2 rounded text-[10px] font-mono uppercase tracking-widest transition-all"
                    style={{ background: showSwarmReplay ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showSwarmReplay ? 'rgba(59,130,246,0.3)' : T.border}`, color: showSwarmReplay ? T.blue : T.dim, cursor: 'pointer' }}
                  >
                    {showSwarmReplay ? '▶ Replaying Swarm Run…' : '▶ Replay Swarm Run'}
                  </button>
                </div>

                {showSwarmReplay && (
                  <div className="rounded-xl p-4" style={{ background: '#050508', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.blue }}>Swarm Run Replay — {SEED_SWARM_RUN.agent_name}</div>
                    <div className="flex flex-col gap-2">
                      {SEED_SWARM_RUN.steps.slice(0, replayStep + 1).map((step, i) => (
                        <div key={step.seq} className="flex gap-2 items-start text-[10px]" style={{ opacity: i === replayStep ? 1 : 0.5 }}>
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-mono font-bold" style={{ background: step.technique === 'COVENANT-GATE' ? 'rgba(249,115,22,0.15)' : step.technique === 'COUNTERMOVE' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.1)', color: step.technique === 'COVENANT-GATE' ? T.orange : step.technique === 'COUNTERMOVE' ? T.green : T.blue }}>
                            {step.seq}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ color: step.technique === 'COVENANT-GATE' ? T.orange : step.technique === 'COUNTERMOVE' ? T.green : T.text }}>{step.action}</div>
                            <div style={{ color: T.muted }}>{step.result}</div>
                            <div className="font-mono" style={{ color: T.blue, fontSize: '8px' }}>{step.technique}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>Proof: {SEED_SWARM_RUN.proof_id}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.accent }}>{SEED_SWARM_RUN.covenant_gates_passed} covenant gates passed</span>
                    </div>
                  </div>
                )}

                {countermovesForPath.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.accent }}>Pre-emptive Countermoves</div>
                    <div className="flex flex-col gap-3">
                      {countermovesForPath.map(cm => (
                        <div key={cm.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${STATUS_COLORS[cm.approval_status]}25` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm" style={{ color: T.accent }}>{CM_TYPE_ICONS[cm.type]}</span>
                            <span className="text-[9px] font-mono uppercase" style={{ color: T.accent }}>{cm.type.replace('-', ' ')}</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded ml-auto" style={{ background: `${STATUS_COLORS[cm.approval_status]}15`, color: STATUS_COLORS[cm.approval_status] }}>{cm.approval_status}</span>
                          </div>
                          <p className="text-[10px] mb-2" style={{ color: T.dim }}>{cm.description}</p>
                          <div className="text-[9px]" style={{ color: T.muted }}>{cm.constitutional_clause}</div>
                          {cm.approval_status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <button
                                disabled={actionInFlight !== null}
                                onClick={() => handleCountermoveAction(cm.path_id, 'approve')}
                                className="flex-1 py-1 rounded text-[9px] font-mono uppercase transition-all"
                                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: T.green, cursor: actionInFlight ? 'not-allowed' : 'pointer', opacity: actionInFlight === `${cm.path_id}-approve` ? 0.6 : 1 }}
                              >
                                {actionInFlight === `${cm.path_id}-approve` ? '…' : 'Approve'}
                              </button>
                              <button
                                disabled={actionInFlight !== null}
                                onClick={() => handleCountermoveAction(cm.path_id, 'deny')}
                                className="flex-1 py-1 rounded text-[9px] font-mono uppercase transition-all"
                                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: T.red, cursor: actionInFlight ? 'not-allowed' : 'pointer', opacity: actionInFlight === `${cm.path_id}-deny` ? 0.6 : 1 }}
                              >
                                {actionInFlight === `${cm.path_id}-deny` ? '…' : 'Deny'}
                              </button>
                              <button
                                disabled={actionInFlight !== null}
                                onClick={() => handleCountermoveAction(cm.path_id, 'stage')}
                                className="flex-1 py-1 rounded text-[9px] font-mono uppercase transition-all"
                                style={{ background: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)', color: T.accent, cursor: actionInFlight ? 'not-allowed' : 'pointer', opacity: actionInFlight === `${cm.path_id}-stage` ? 0.6 : 1 }}
                              >
                                {actionInFlight === `${cm.path_id}-stage` ? '…' : 'Stage'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl p-3 text-[9px] font-mono" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', color: T.muted }}>
                  <span style={{ color: '#8b5cf6' }}>a11oy Brain</span> — APT29 Shadow Agent is currently reasoning about this prediction. Proof chain: {selectedPath.swarm_run_id} → Approval Queue → Sentra execution.
                </div>
              </>
            ) : (
              <div className="rounded-xl p-8 text-center flex flex-col items-center justify-center" style={{ background: T.surface, border: `1px solid ${T.border}`, minHeight: 200 }}>
                <div className="text-3xl mb-3 opacity-20">◈</div>
                <div className="text-xs" style={{ color: T.muted }}>Select a predicted attack path to inspect the swarm run, countermoves, and constitutional proof packet.</div>
              </div>
            )}

            <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8b5cf6' }}>a11oy Brain — Live Reasoning</div>
              <div className="flex flex-col gap-2 text-[10px]">
                {[
                  { agent: 'APT29 Shadow Agent', status: 'Executing lateral movement sequence #7 against twin', color: T.red },
                  { agent: 'Lazarus Shadow Agent', status: 'Phishing simulation step 3 complete — deception response staged', color: T.orange },
                  { agent: 'Cortex Prediction Engine', status: 'Aggregating swarm outcomes → updating 72h horizon', color: '#8b5cf6' },
                  { agent: 'Covenant Gate', status: 'Reviewing countermove proposal for fth-001 — Art. IX §2', color: T.accent },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 animate-pulse" style={{ background: item.color }} />
                    <div>
                      <span className="font-mono" style={{ color: item.color }}>{item.agent}: </span>
                      <span style={{ color: T.muted }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 rounded-lg text-[10px] flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
          Future Threat Horizon — every prediction is produced by a covenant-gated adversary swarm running against your digital twin. The attack lands in a place we already control — or it never lands.
          <span className="ml-auto font-mono" style={{ color: T.muted }}>Powered by a11oy Predictive Defense Cortex · Art. IX</span>
        </div>
      </div>
    </div>
  );
}
