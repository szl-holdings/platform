import { useState } from 'react';
import { api } from '@/lib/api';

const T = {
  bg: '#060608',
  surface: 'rgba(255,255,255,0.025)',
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

interface Scenario {
  id: string;
  name: string;
  apt_profile: string;
  attack_techniques: string[];
  tactic: string;
  description: string;
  difficulty: 'low' | 'medium' | 'high' | 'critical';
  execution_mode: 'simulated' | 'sandboxed';
  expected_detections: string[];
  status: 'ready' | 'running' | 'complete' | 'awaiting-approval';
  last_run?: string;
  detections_fired?: number;
}

interface ExecutionStep {
  seq: number;
  label: string;
  technique: string;
  status: 'done' | 'running' | 'queued';
  detection_fired?: boolean;
  sensor?: string;
}

interface BlueSideEvent {
  id: string;
  rule: string;
  sensor: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ts: string;
  scenario_id: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'rt-001',
    name: 'APT29 — Credential Harvest + Lateral Movement',
    apt_profile: 'SVR / Cozy Bear',
    attack_techniques: ['T1087.002', 'T1550.002', 'T1021.001', 'T1078.002'],
    tactic: 'Credential Access + Lateral Movement',
    description: 'Emulates APT29\'s signature pass-the-hash lateral movement after service account credential harvest. Sandboxed against digital twin only.',
    difficulty: 'high',
    execution_mode: 'sandboxed',
    expected_detections: ['Sigma: PtH detection', 'EDR: suspicious NTLM auth', 'Identity: anomalous service account login'],
    status: 'complete',
    last_run: new Date(Date.now() - 2 * 3600000).toISOString(),
    detections_fired: 3,
  },
  {
    id: 'rt-002',
    name: 'Lazarus — Spear-Phish + Payload Execution',
    apt_profile: 'Lazarus Group / DPRK',
    attack_techniques: ['T1566.001', 'T1204.002', 'T1059.001', 'AML.T0048'],
    tactic: 'Initial Access + Execution',
    description: 'Simulates targeted spear-phishing campaign with macro-enabled payload delivery. Validates email gateway and sandbox detection coverage.',
    difficulty: 'medium',
    execution_mode: 'simulated',
    expected_detections: ['Email gateway: phishing indicator', 'Sandbox: macro execution blocked', 'EDR: suspicious PowerShell spawn'],
    status: 'running',
    last_run: new Date(Date.now() - 15 * 60000).toISOString(),
    detections_fired: 2,
  },
  {
    id: 'rt-003',
    name: 'FIN7 — Cloud Storage Exfiltration',
    apt_profile: 'FIN7 / Carbanak',
    attack_techniques: ['T1005', 'T1039', 'T1537', 'AML.T0037.000'],
    tactic: 'Collection + Exfiltration',
    description: 'Models FIN7 collection and cloud storage exfiltration path. Honeypot data seeded at target buckets. DLP rule validation included.',
    difficulty: 'high',
    execution_mode: 'sandboxed',
    expected_detections: ['DLP: sensitive data staging', 'CloudTrail: unusual bucket access', 'UEBA: bulk download pattern'],
    status: 'awaiting-approval',
    last_run: undefined,
    detections_fired: undefined,
  },
  {
    id: 'rt-004',
    name: 'Atomic: T1078 — Valid Account Abuse',
    apt_profile: 'Generic (Atomic Red Team)',
    attack_techniques: ['T1078.001', 'T1078.002', 'T1078.003'],
    tactic: 'Defense Evasion + Persistence',
    description: 'Atomic Red Team T1078 test — validates detection of valid account abuse across local, domain, and cloud tiers. Quick purple-team validation.',
    difficulty: 'low',
    execution_mode: 'simulated',
    expected_detections: ['SIEM: account used from new geo', 'Identity: impossible travel', 'EDR: lateral tool use'],
    status: 'ready',
    last_run: new Date(Date.now() - 24 * 3600000).toISOString(),
    detections_fired: 2,
  },
  {
    id: 'rt-005',
    name: 'Stratus: Cloud Privilege Escalation',
    apt_profile: 'Cloud-native adversary (Stratus Red Team)',
    attack_techniques: ['T1078.004', 'T1548.005', 'T1134.001'],
    tactic: 'Privilege Escalation (Cloud)',
    description: 'Cloud-specific privilege escalation against AWS/Azure role chain. Digital twin has synthetic cloud inventory seeded. Validates CSPM and CSDR coverage.',
    difficulty: 'critical',
    execution_mode: 'sandboxed',
    expected_detections: ['AWS GuardDuty: IAM anomaly', 'Prowler: privilege escalation finding', 'CSPM: policy violation'],
    status: 'ready',
    last_run: undefined,
    detections_fired: undefined,
  },
];

const ACTIVE_STEPS: ExecutionStep[] = [
  { seq: 1, label: 'Enumerate domain accounts', technique: 'T1087.002', status: 'done', detection_fired: false },
  { seq: 2, label: 'Extract NTLM hashes from twin', technique: 'T1550.002', status: 'done', detection_fired: false },
  { seq: 3, label: 'Pass-the-hash to admin host', technique: 'T1021.001', status: 'running', detection_fired: true, sensor: 'EDR: suspicious NTLM auth' },
  { seq: 4, label: 'Establish persistence', technique: 'T1053.005', status: 'queued' },
  { seq: 5, label: 'Covenant gate — escalation requires approval', technique: 'COVENANT-GATE', status: 'queued' },
];

const BLUE_EVENTS: BlueSideEvent[] = [
  { id: 'be-001', rule: 'Sigma: PtH lateral movement detected', sensor: 'Windows Event Log + EDR', severity: 'critical', ts: new Date(Date.now() - 5 * 60000).toISOString(), scenario_id: 'rt-001' },
  { id: 'be-002', rule: 'Identity: service account used from new workstation', sensor: 'IdP / Zero Trust Gateway', severity: 'high', ts: new Date(Date.now() - 10 * 60000).toISOString(), scenario_id: 'rt-001' },
  { id: 'be-003', rule: 'EDR: suspicious NTLM authentication chain', sensor: 'Endpoint Detection', severity: 'high', ts: new Date(Date.now() - 12 * 60000).toISOString(), scenario_id: 'rt-002' },
  { id: 'be-004', rule: 'Email gateway: phishing payload delivery attempt', sensor: 'Email Security Gateway', severity: 'medium', ts: new Date(Date.now() - 18 * 60000).toISOString(), scenario_id: 'rt-002' },
];

const DIFF_COLORS: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const STATUS_COLORS: Record<string, string> = { ready: '#8a8a8a', running: '#3b82f6', complete: '#22c55e', 'awaiting-approval': '#f97316' };
const STEP_COLORS: Record<string, string> = { done: '#22c55e', running: '#3b82f6', queued: '#5e5e5e' };
const SEV_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

export default function RedTeamHub() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [view, setView] = useState<'library' | 'execution' | 'purple-team'>('library');
  const [launchedScenarios, setLaunchedScenarios] = useState<Record<string, string>>({});
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-6" style={{ background: T.bg, color: T.text }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: T.accent }}>White-Hat Offensive</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: T.red }}>SIMULATED / SANDBOXED ONLY</span>
          </div>
          <h1 className="text-3xl font-light mb-2" style={{ color: T.text, letterSpacing: '-0.02em' }}>Red Team / Adversary Emulation Hub</h1>
          <p className="text-sm" style={{ color: T.dim, maxWidth: 680 }}>
            Launch structured adversary emulation scenarios modeled after Caldera, Atomic Red Team, and Stratus Red Team patterns. Every scenario executes in <strong style={{ color: T.text }}>simulated / sandboxed mode only</strong> — against the digital twin. Every launch is covenant-gated by a11oy (Article IX). Blue-team detections fire in real time, closing the purple-team loop.
          </p>
        </div>

        <div className="flex gap-1 mb-6">
          {(['library', 'execution', 'purple-team'] as const).map(tab => (
            <button key={tab} onClick={() => setView(tab)} className="px-4 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: view === tab ? 'rgba(239,68,68,0.1)' : T.surface, border: `1px solid ${view === tab ? 'rgba(239,68,68,0.2)' : T.border}`, color: view === tab ? T.red : T.muted, cursor: 'pointer' }}>
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {view === 'library' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 flex flex-col gap-3">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: T.muted }}>Scenario Library — mapped to MITRE ATT&CK + ATLAS</div>
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setSelectedScenario(s)} className="w-full text-left rounded-xl p-4 transition-all" style={{ background: selectedScenario.id === s.id ? 'rgba(239,68,68,0.04)' : T.surface, border: `1px solid ${selectedScenario.id === s.id ? 'rgba(239,68,68,0.2)' : T.border}`, cursor: 'pointer' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold" style={{ background: `${DIFF_COLORS[s.difficulty]}15`, color: DIFF_COLORS[s.difficulty] }}>
                      {s.difficulty[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold" style={{ color: T.text }}>{s.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[s.status]}15`, color: STATUS_COLORS[s.status] }}>{s.status.replace('-', ' ')}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{s.execution_mode}</span>
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: T.dim }}>{s.description}</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {s.attack_techniques.map(t => (
                          <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: T.blue }}>{t}</span>
                        ))}
                      </div>
                      <div className="text-[9px]" style={{ color: T.muted }}>APT Profile: {s.apt_profile}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {s.detections_fired !== undefined && (
                        <>
                          <div className="text-lg font-mono font-bold" style={{ color: s.detections_fired >= s.expected_detections.length ? T.green : T.orange }}>{s.detections_fired}/{s.expected_detections.length}</div>
                          <div className="text-[8px] font-mono" style={{ color: T.muted }}>detections</div>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="rounded-xl p-4" style={{ background: T.surface, border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.red }}>Selected Scenario</div>
                <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{selectedScenario.name}</div>
                <div className="text-[10px] mb-3" style={{ color: T.dim }}>{selectedScenario.tactic}</div>
                <div className="mb-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>Expected Detections</div>
                  <div className="flex flex-col gap-1">
                    {selectedScenario.expected_detections.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span style={{ color: T.green }}>◆</span>
                        <span style={{ color: T.dim }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2.5 rounded mb-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                  <div className="text-[9px] font-mono mb-1" style={{ color: T.accent }}>GOVERNED ADVERSARY LOOP</div>
                  <div className="text-[10px]" style={{ color: T.dim }}>Every launch goes through a11oy Approval Queue (Art. IX §1). Execution is sandboxed against the digital twin only. No live exploit code is generated.</div>
                </div>
                {(() => {
                  const liveStatus = launchedScenarios[selectedScenario.id] ?? selectedScenario.status;
                  if (liveStatus === 'ready') {
                    return (
                      <button
                        disabled={launching === selectedScenario.id}
                        onClick={async () => {
                          setLaunching(selectedScenario.id);
                          setLaunchError(null);
                          try {
                            const r = await api.redTeam.launch(selectedScenario.id, selectedScenario.name);
                            if (!r.ok) throw new Error(r.error?.message ?? 'Launch failed');
                            setLaunchedScenarios(s => ({ ...s, [selectedScenario.id]: 'awaiting-approval' }));
                          } catch (err) {
                            setLaunchError(err instanceof Error ? err.message : 'Launch failed');
                          } finally {
                            setLaunching(null);
                          }
                        }}
                        className="w-full py-2 rounded text-[10px] font-mono uppercase tracking-widest disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: T.red, cursor: launching === selectedScenario.id ? 'wait' : 'pointer' }}
                      >
                        {launching === selectedScenario.id ? 'Routing to a11oy…' : 'Launch (Requires a11oy Approval) →'}
                      </button>
                    );
                  }
                  if (liveStatus === 'awaiting-approval') {
                    return (
                      <div className="w-full py-2 rounded text-[10px] font-mono uppercase text-center" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', color: T.orange }}>
                        Awaiting a11oy Approval Queue…
                      </div>
                    );
                  }
                  return null;
                })()}
                {launchError && (
                  <div className="mt-2 text-[10px] font-mono p-2 rounded" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: T.red }}>
                    {launchError}
                  </div>
                )}
                {selectedScenario.status === 'running' && (
                  <div className="w-full py-2 rounded text-[10px] font-mono uppercase text-center animate-pulse" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: T.blue }}>
                    Executing in Sandbox…
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'execution' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Execution Timeline — Lazarus Spear-Phish (Active)</div>
              <div className="flex flex-col gap-2">
                {ACTIVE_STEPS.map((step, i) => (
                  <div key={step.seq}>
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: step.status === 'running' ? 'rgba(59,130,246,0.06)' : T.surface, border: `1px solid ${step.status === 'running' ? 'rgba(59,130,246,0.2)' : T.border}` }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-mono font-bold" style={{ background: `${STEP_COLORS[step.status]}15`, color: STEP_COLORS[step.status] }}>{step.seq}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: step.technique === 'COVENANT-GATE' ? T.orange : T.text }}>{step.label}</span>
                          {step.status === 'running' && <span className="text-[8px] animate-pulse" style={{ color: T.blue }}>● running</span>}
                        </div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: T.blue }}>{step.technique}</div>
                        {step.detection_fired && (
                          <div className="text-[9px] mt-1 px-1.5 py-0.5 rounded inline-block" style={{ background: 'rgba(34,197,94,0.08)', color: T.green }}>✓ Detection fired: {step.sensor}</div>
                        )}
                      </div>
                    </div>
                    {i < ACTIVE_STEPS.length - 1 && <div className="flex justify-start ml-6"><div className="w-px h-2" style={{ background: T.border }} /></div>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Blue Team — Live Detection Feed</div>
              <div className="flex flex-col gap-2">
                {BLUE_EVENTS.map(evt => (
                  <div key={evt.id} className="p-3 rounded-lg" style={{ background: T.surface, border: `1px solid ${SEV_COLORS[evt.severity]}25` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: SEV_COLORS[evt.severity] }} />
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${SEV_COLORS[evt.severity]}15`, color: SEV_COLORS[evt.severity] }}>{evt.severity}</span>
                      <span className="text-[9px] font-mono ml-auto" style={{ color: T.muted }}>{new Date(evt.ts).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs mb-1" style={{ color: T.text }}>{evt.rule}</div>
                    <div className="text-[9px]" style={{ color: T.muted }}>Sensor: {evt.sensor}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg text-[10px]" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', color: T.muted }}>
                Purple-team loop: red-team scenario fires → blue-team detection validates → gap analysis produced automatically by a11oy.
              </div>
            </div>
          </div>
        )}

        {view === 'purple-team' && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: T.muted }}>Purple-Team Coverage Matrix — Red vs. Blue</div>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Scenario', 'Techniques', 'Expected Detections', 'Fired', 'Gap', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCENARIOS.filter(s => s.status !== 'ready' || s.last_run).map(s => {
                    const fired = s.detections_fired ?? 0;
                    const expected = s.expected_detections.length;
                    const gap = expected - fired;
                    return (
                      <tr key={s.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                        <td className="px-4 py-2.5" style={{ color: T.text, maxWidth: 200 }}><div className="truncate">{s.name}</div></td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-0.5">
                            {s.attack_techniques.slice(0, 2).map(t => <span key={t} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: T.blue }}>{t}</span>)}
                            {s.attack_techniques.length > 2 && <span className="text-[8px] font-mono" style={{ color: T.muted }}>+{s.attack_techniques.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{expected}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: fired >= expected ? T.green : T.orange }}>{s.status === 'awaiting-approval' ? '—' : fired}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: gap > 0 ? T.red : T.green }}>{s.status === 'awaiting-approval' ? '—' : gap > 0 ? `${gap} gaps` : '✓ full'}</td>
                        <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[s.status]}15`, color: STATUS_COLORS[s.status] }}>{s.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-3 rounded-lg text-[10px] flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', color: T.muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.red }} />
          Red Team Hub — all scenarios execute in simulated/sandboxed mode only. No live exploit code. Every launch goes through a11oy Governed Adversary Loop (Article IX §1).
        </div>
      </div>
    </div>
  );
}
