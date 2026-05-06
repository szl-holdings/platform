import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Flag,
  Loader2,
  Radio,
  Shield,
  ShieldCheck,
  Swords,
  Users,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

interface Coalition {
  id: string;
  code: string;
  name: string;
  members: string[];
  aor: string;
  threatLevel: 'low' | 'med' | 'high' | 'critical';
}

interface Asset {
  id: string;
  hull: string;
  flag: string;
  type: string;
  status: string;
  rfPicture: string;
}

interface RoeRule {
  id: string;
  rule: string;
  source: string;
  required: boolean;
}

const COALITIONS: Coalition[] = [
  { id: 'CTF-150', code: 'CTF-150', name: 'Combined Task Force 150', members: ['US', 'UK', 'FR', 'AU', 'JP'], aor: 'Gulf of Aden · N Arabian Sea', threatLevel: 'high' },
  { id: 'SNMG2', code: 'SNMG2', name: 'Standing NATO Maritime Group 2', members: ['US', 'UK', 'TR', 'IT', 'GR'], aor: 'E Mediterranean · Black Sea approaches', threatLevel: 'critical' },
  { id: 'EUNAVFOR-ASPIDES', code: 'ASPIDES', name: 'EUNAVFOR Aspides', members: ['FR', 'IT', 'DE', 'GR', 'BE'], aor: 'Red Sea · Bab-el-Mandeb', threatLevel: 'critical' },
  { id: 'IPMDA', code: 'IPMDA', name: 'Indo-Pacific MDA Partnership', members: ['US', 'AU', 'JP', 'IN'], aor: 'Indo-Pacific · Taiwan Strait', threatLevel: 'high' },
];

const ASSETS_BY_COALITION: Record<string, Asset[]> = {
  'CTF-150': [
    { id: 'A1', hull: 'USS THE SULLIVANS', flag: 'US', type: 'DDG-68', status: 'on station', rfPicture: 'normal' },
    { id: 'A2', hull: 'HMS LANCASTER', flag: 'UK', type: 'F-79', status: 'on station', rfPicture: 'normal' },
    { id: 'A3', hull: 'FS LANGUEDOC', flag: 'FR', type: 'D-653', status: 'transit', rfPicture: 'normal' },
    { id: 'A4', hull: 'HMAS TOOWOOMBA', flag: 'AU', type: 'FFH-156', status: 'on station', rfPicture: 'jamming detected' },
  ],
  'SNMG2': [
    { id: 'B1', hull: 'USS PORTER', flag: 'US', type: 'DDG-78', status: 'on station', rfPicture: 'jamming detected' },
    { id: 'B2', hull: 'TCG GAZIANTEP', flag: 'TR', type: 'F-490', status: 'on station', rfPicture: 'normal' },
    { id: 'B3', hull: 'ITS MARGOTTINI', flag: 'IT', type: 'F-592', status: 'transit', rfPicture: 'normal' },
    { id: 'B4', hull: 'HS HYDRA', flag: 'GR', type: 'F-452', status: 'port call', rfPicture: 'spoofing suspected' },
  ],
  'EUNAVFOR-ASPIDES': [
    { id: 'C1', hull: 'FS ALSACE', flag: 'FR', type: 'D-656', status: 'on station', rfPicture: 'jamming detected' },
    { id: 'C2', hull: 'ITS DURAND DE LA PENNE', flag: 'IT', type: 'D-560', status: 'on station', rfPicture: 'normal' },
    { id: 'C3', hull: 'FGS HESSEN', flag: 'DE', type: 'F-221', status: 'on station', rfPicture: 'normal' },
  ],
  'IPMDA': [
    { id: 'D1', hull: 'USS DEWEY', flag: 'US', type: 'DDG-105', status: 'on station', rfPicture: 'normal' },
    { id: 'D2', hull: 'HMAS HOBART', flag: 'AU', type: 'DDG-39', status: 'on station', rfPicture: 'normal' },
    { id: 'D3', hull: 'JS YUDACHI', flag: 'JP', type: 'DD-103', status: 'transit', rfPicture: 'normal' },
  ],
};

const ROE_BY_COALITION: Record<string, RoeRule[]> = {
  'CTF-150': [
    { id: 'r1', rule: 'Visit, Board, Search and Seizure (VBSS) requires CTF Commander approval', source: 'CTF-150 SOP §4.2', required: true },
    { id: 'r2', rule: 'Lethal force only in self-defense or in defense of merchant vessel under attack', source: 'CMF Standing RoE', required: true },
    { id: 'r3', rule: 'No engagement of vessel flagged GCC member without national command authority', source: 'Coalition Annex A', required: true },
  ],
  'SNMG2': [
    { id: 'r1', rule: 'Russian Federation military assets — defensive posture only, no proactive engagement', source: 'NATO MC 362/2', required: true },
    { id: 'r2', rule: 'AIS spoofing event must be corroborated by 2 sensor sources before naval cue', source: 'SNMG2 RoE Annex C', required: true },
    { id: 'r3', rule: 'Boarding of Turkish-flagged vessels requires TCG approval', source: 'SNMG2 SOP §6.1', required: true },
  ],
  'EUNAVFOR-ASPIDES': [
    { id: 'r1', rule: 'Defensive force authorized vs Houthi UAS/USV in Red Sea AOR', source: 'EU Council Decision 2024/383', required: true },
    { id: 'r2', rule: 'Escort merchant traffic on transit corridor; no offensive land strikes', source: 'Aspides mandate', required: true },
    { id: 'r3', rule: 'Coordinate engagement zones with US CENTCOM via combined maritime ops cell', source: 'Coalition MOU', required: true },
  ],
  'IPMDA': [
    { id: 'r1', rule: 'Information-sharing focus — no kinetic actions under IPMDA framework', source: 'IPMDA charter §2', required: true },
    { id: 'r2', rule: 'Dark-vessel detections shared with affected coastal state within 6h', source: 'IPMDA SOP §3', required: true },
  ],
};

const PRISM_SCENARIOS = [
  { id: 's1', label: 'Adversary GPS spoofing of escort screen', impact: 'Escort track diverges 6–12nm; merchant convoy left exposed for 18 min', mitigation: 'Switch to inertial nav + RF triangulation; cue MIFC dissent vector' },
  { id: 's2', label: 'Coordinated USV swarm on convoy rear', impact: '3–5 USVs at 35kt closing from astern; 4 min to contact', mitigation: 'Aft escort assumes screen; CIWS authorized; merchant emergency turn 030°' },
  { id: 's3', label: 'AIS spoofing decoy convoy 80nm S of true position', impact: 'Coalition response capacity split; 30% of escort assets misallocated', mitigation: 'AAT twin generates truthful position; PCE-gated re-tasking order' },
];

export default function CortexCbNcmPage() {
  const [coalitionId, setCoalitionId] = useState(COALITIONS[0]!.id);
  const [planning, setPlanning] = useState(false);
  const [planMinted, setPlanMinted] = useState(false);
  const [scenarioId, setScenarioId] = useState(PRISM_SCENARIOS[0]!.id);
  const [sovereignMode, setSovereignMode] = useState(false);

  const coalition = useMemo(() => COALITIONS.find((c) => c.id === coalitionId)!, [coalitionId]);
  const assets = ASSETS_BY_COALITION[coalitionId] ?? [];
  const roe = ROE_BY_COALITION[coalitionId] ?? [];
  const scenario = useMemo(() => PRISM_SCENARIOS.find((s) => s.id === scenarioId)!, [scenarioId]);

  function planConvoy() {
    setPlanning(true);
    setPlanMinted(false);
    setTimeout(() => { setPlanning(false); setPlanMinted(true); }, 1100);
  }

  const threatColor = coalition.threatLevel === 'critical' ? '#c96070' : coalition.threatLevel === 'high' ? '#d97a4c' : coalition.threatLevel === 'med' ? '#c9a85c' : '#5baa8a';

  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
          <div className="border-l-2 pl-5" style={{ borderColor: ALLOY_GOLD }}>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: ALLOY_GOLD }}>
              Cortex · CB-NCM · Naval Coalition Mode
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Convoy Brain — Naval-grade coalition planning</h1>
            <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
              Multi-fleet, multi-flag coalition operations. RoE encoded as A11oy Constitutions; live RF
              threat picture from MIFC; PRISM-style adversary simulation; SeaVision / AMVER export.
              Sovereign Mode runs against a customer-supplied sensor mesh, air-gapped.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60 px-3 py-2 rounded-md" style={{ border: `1px solid ${sovereignMode ? ALLOY_GOLD + '40' : 'hsl(var(--border))'}`, background: sovereignMode ? `${ALLOY_GOLD}10` : 'hsl(var(--card))' }}>
            <input
              type="checkbox"
              checked={sovereignMode}
              onChange={(e) => setSovereignMode(e.target.checked)}
              className="accent-amber-400"
            />
            Sovereign Mode {sovereignMode && <ShieldCheck className="w-3 h-3 ml-1" style={{ color: ALLOY_GOLD }} />}
          </label>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 px-1">
              Coalitions
            </div>
            {COALITIONS.map((c) => {
              const isSel = c.id === coalitionId;
              const tc = c.threatLevel === 'critical' ? '#c96070' : c.threatLevel === 'high' ? '#d97a4c' : '#c9a85c';
              return (
                <button
                  key={c.id}
                  onClick={() => { setCoalitionId(c.id); setPlanMinted(false); }}
                  className="w-full text-left rounded-md border p-3 transition-colors"
                  style={{
                    background: isSel ? `${ALLOY_GOLD}08` : 'hsl(var(--card))',
                    borderColor: isSel ? `${ALLOY_GOLD}50` : 'hsl(var(--border))',
                  }}
                >
                  <div className="text-xs font-semibold text-white">{c.code}</div>
                  <div className="text-[10px] text-white/50 mt-0.5 leading-snug">{c.aor}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tc }} />
                    <span className="text-[10px] uppercase font-mono" style={{ color: tc }}>{c.threatLevel}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="col-span-12 md:col-span-9 space-y-5">
            <div
              className="rounded-lg border p-6"
              style={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderTop: `2px solid ${ALLOY_GOLD}`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                <div>
                  <div className="text-xl font-semibold text-white">{coalition.name}</div>
                  <div className="text-xs text-white/50 mt-1 font-mono">
                    AOR · {coalition.aor} · members {coalition.members.join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: threatColor }} />
                  <span className="text-xs font-mono uppercase" style={{ color: threatColor }}>
                    threat: {coalition.threatLevel}
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">Assets on station</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                {assets.map((a) => {
                  const rfWarn = a.rfPicture !== 'normal';
                  return (
                    <div
                      key={a.id}
                      className="rounded-md border p-3 flex items-start justify-between gap-3"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: rfWarn ? 'rgba(217,122,76,0.3)' : 'hsl(var(--border))',
                        borderLeft: rfWarn ? '2px solid #d97a4c' : `2px solid ${ALLOY_GOLD}40`,
                      }}
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{a.hull}</div>
                        <div className="text-[10px] text-white/40 font-mono mt-0.5">
                          {a.type} · <Flag className="w-2.5 h-2.5 inline mb-0.5" /> {a.flag}
                        </div>
                        <div className="text-[10px] text-white/50 mt-1 capitalize">{a.status}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: rfWarn ? '#d97a4c' : '#5baa8a' }}>
                        <Radio className="w-3 h-3" />
                        {a.rfPicture}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: ALLOY_GOLD }}>
                <Shield className="w-3 h-3" /> Constitution · Rules of Engagement
              </div>
              <div className="space-y-1.5">
                {roe.map((r) => (
                  <div key={r.id} className="rounded-md border p-3 text-xs" style={{ background: `${ALLOY_GOLD}06`, borderColor: `${ALLOY_GOLD}25` }}>
                    <div className="text-white/80">{r.rule}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/35 mt-1">
                      {r.source} · {r.required ? 'mandatory' : 'advisory'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg border p-6"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                  <span className="text-sm font-semibold text-white">PRISM · Adversary action simulator</span>
                </div>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="text-xs bg-transparent border rounded-md px-2 py-1.5 text-white/80"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  {PRISM_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md p-3" style={{ background: 'rgba(217,122,76,0.06)', border: '1px solid rgba(217,122,76,0.2)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Predicted impact
                  </div>
                  <div className="text-xs text-white/70 leading-relaxed">{scenario.impact}</div>
                </div>
                <div className="rounded-md p-3" style={{ background: 'rgba(91,170,138,0.06)', border: '1px solid rgba(91,170,138,0.2)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: '#5baa8a' }}>
                    <CheckCircle2 className="w-3 h-3" /> Mitigation
                  </div>
                  <div className="text-xs text-white/70 leading-relaxed">{scenario.mitigation}</div>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: planMinted ? `${ALLOY_GOLD}40` : 'hsl(var(--border))',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                  <span className="text-sm font-semibold text-white">Convoy plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={planConvoy}
                    disabled={planning}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                    style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
                  >
                    {planning ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <Activity className="w-3 h-3 inline mr-1" />}
                    {planning ? 'Planning…' : 'Generate plan'}
                  </button>
                  <button className="text-[11px] font-medium px-3 py-1.5 rounded-md text-white/60" style={{ border: '1px solid hsl(var(--border))' }}>
                    <Download className="w-3 h-3 inline mr-1" /> Export AMVER
                  </button>
                </div>
              </div>
              {planMinted && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ALLOY_GOLD }} />
                    <span className="text-xs text-white/80 font-mono">
                      Plan PP-CBNCM-{coalition.code}-{Date.now().toString().slice(-5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/55 leading-relaxed pl-5">
                    {assets.length} escorts assigned · {roe.length} RoE constraints checked · adversary scenario{' '}
                    <span className="font-mono text-white/75">{scenario.label}</span> simulated · {sovereignMode ? 'sealed in Sovereign Mode (air-gapped)' : 'visible to coalition member ops cells'}.
                  </div>
                </div>
              )}
              {!planMinted && !planning && (
                <p className="text-xs text-white/55">
                  Generates a SeaVision/AMVER-compatible plan with PCE-gated tasking orders. Each order
                  carries its constitutional citation; each escort cue carries its dissent vector.
                </p>
              )}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1 flex items-center gap-2">
              <Eye className="w-3 h-3" />
              {sovereignMode ? 'Sovereign Mode — no telemetry leaves the customer mesh' : 'Coalition mode — share to allied ops cells via SeaVision'} · governed by A11oy Constitutions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
