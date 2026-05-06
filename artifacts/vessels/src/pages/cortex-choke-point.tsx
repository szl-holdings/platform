import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowRight,
  CheckCircle2,
  Compass,
  DollarSign,
  Loader2,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

interface ChokePoint {
  id: string;
  name: string;
  region: string;
  dailyTransits: number;
  pctGlobalTrade: number;
  disruptionProb: number;
  status: 'normal' | 'elevated' | 'disrupted';
  primaryThreat: string;
  altRoute: { name: string; addedDays: number; addedCostPctBbl: number };
  warRiskPremiumBps: number;
  recentEvents: { ts: string; label: string }[];
}

const POINTS: ChokePoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf',
    dailyTransits: 110,
    pctGlobalTrade: 21,
    disruptionProb: 0.34,
    status: 'elevated',
    primaryThreat: 'Iran small-boat & drone harassment',
    altRoute: { name: 'East-Med pipeline + Saudi land bridge (partial)', addedDays: 12, addedCostPctBbl: 8.4 },
    warRiskPremiumBps: 65,
    recentEvents: [
      { ts: '2h ago', label: 'IRGC fast-boat shadowed Aframax in EEZ' },
      { ts: '11h ago', label: '2 vessels reported GPS spoofing' },
      { ts: '1d ago', label: 'Iranian drone overflight near Larak Island' },
    ],
  },
  {
    id: 'bab',
    name: 'Bab-el-Mandeb',
    region: 'Red Sea',
    dailyTransits: 75,
    pctGlobalTrade: 12,
    disruptionProb: 0.78,
    status: 'disrupted',
    primaryThreat: 'Houthi UAS / USV / ASBM strikes',
    altRoute: { name: 'Cape of Good Hope', addedDays: 14, addedCostPctBbl: 18.2 },
    warRiskPremiumBps: 220,
    recentEvents: [
      { ts: '40m ago', label: 'USV intercepted by EUNAVFOR Aspides escort' },
      { ts: '3h ago', label: 'Houthi statement: targeting US-linked tonnage' },
      { ts: '8h ago', label: 'Container ship CHARLIE diverted to Cape route' },
    ],
  },
  {
    id: 'malacca',
    name: 'Malacca Strait',
    region: 'SE Asia',
    dailyTransits: 230,
    pctGlobalTrade: 25,
    disruptionProb: 0.08,
    status: 'normal',
    primaryThreat: 'Piracy spike risk + congestion',
    altRoute: { name: 'Sunda + Lombok Straits', addedDays: 3, addedCostPctBbl: 1.8 },
    warRiskPremiumBps: 12,
    recentEvents: [
      { ts: '6h ago', label: 'ReCAAP advisory: petty theft uptick at Singapore anchorage' },
    ],
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    region: 'Egypt',
    dailyTransits: 50,
    pctGlobalTrade: 12,
    disruptionProb: 0.41,
    status: 'elevated',
    primaryThreat: 'Red Sea diversion impact, regional escalation',
    altRoute: { name: 'Cape of Good Hope', addedDays: 14, addedCostPctBbl: 18.2 },
    warRiskPremiumBps: 95,
    recentEvents: [
      { ts: '2d ago', label: 'SCA: northbound transits down 32% YoY' },
    ],
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    region: 'Central America',
    dailyTransits: 36,
    pctGlobalTrade: 6,
    disruptionProb: 0.22,
    status: 'elevated',
    primaryThreat: 'Drought-driven draft restrictions',
    altRoute: { name: 'US East-West rail land bridge', addedDays: 6, addedCostPctBbl: 5.4 },
    warRiskPremiumBps: 8,
    recentEvents: [
      { ts: '1d ago', label: 'ACP: max draft reduced to 13.4m for May' },
    ],
  },
  {
    id: 'bosporus',
    name: 'Bosporus / Dardanelles',
    region: 'Turkey',
    dailyTransits: 130,
    pctGlobalTrade: 4,
    disruptionProb: 0.18,
    status: 'normal',
    primaryThreat: 'Sanctions-evasion AIS spoofing',
    altRoute: { name: 'No alt — Black Sea is fully enclosed', addedDays: 0, addedCostPctBbl: 0 },
    warRiskPremiumBps: 35,
    recentEvents: [
      { ts: '4h ago', label: 'AAT twin: 2 dark vessels predicted Novorossiysk berth' },
    ],
  },
  {
    id: 'taiwan',
    name: 'Taiwan Strait',
    region: 'NE Asia',
    dailyTransits: 290,
    pctGlobalTrade: 22,
    disruptionProb: 0.16,
    status: 'elevated',
    primaryThreat: 'PLAN exercise / quarantine scenario',
    altRoute: { name: 'East of Taiwan via Luzon Strait', addedDays: 1, addedCostPctBbl: 1.2 },
    warRiskPremiumBps: 28,
    recentEvents: [
      { ts: '7h ago', label: 'PLAN training area declared 50nm SW of Taiwan' },
    ],
  },
  {
    id: 'denmark',
    name: 'Denmark Strait',
    region: 'GIUK Gap',
    dailyTransits: 40,
    pctGlobalTrade: 2,
    disruptionProb: 0.05,
    status: 'normal',
    primaryThreat: 'Russian SSN transit & seabed cable risk',
    altRoute: { name: 'Faroe-Iceland gap', addedDays: 1, addedCostPctBbl: 0.6 },
    warRiskPremiumBps: 22,
    recentEvents: [
      { ts: '3d ago', label: 'NATO MARCOM: increased SSN transit reporting' },
    ],
  },
];

function statusColor(s: ChokePoint['status']): string {
  return s === 'disrupted' ? '#c96070' : s === 'elevated' ? '#d97a4c' : '#5baa8a';
}

export default function CortexChokePointPage() {
  const [selectedId, setSelectedId] = useState(POINTS[0]!.id);
  const [running, setRunning] = useState(false);
  const [twinMinted, setTwinMinted] = useState(false);

  const selected = useMemo(() => POINTS.find((p) => p.id === selectedId)!, [selectedId]);
  const sc = statusColor(selected.status);

  function runDecisionTwin() {
    setRunning(true);
    setTwinMinted(false);
    setTimeout(() => { setRunning(false); setTwinMinted(true); }, 950);
  }

  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="border-l-2 pl-5 mb-8" style={{ borderColor: ALLOY_GOLD }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: ALLOY_GOLD }}>
            Cortex · PRISM · Choke Point Decision Twin
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Eight chokepoints, one decision twin</h1>
          <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
            For each maritime chokepoint: live disruption probability, alt-routing, freight rate and
            war-risk-premium impact. Every re-route is a Workcell with a PCE-gated decision and a Proof
            Packet a charterer can show their P&I club.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {POINTS.map((p) => {
            const isSel = p.id === selectedId;
            const c = statusColor(p.status);
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setTwinMinted(false); }}
                className="text-left rounded-md border p-3 transition-colors"
                style={{
                  background: isSel ? `${ALLOY_GOLD}08` : 'hsl(var(--card))',
                  borderColor: isSel ? `${ALLOY_GOLD}50` : 'hsl(var(--border))',
                  borderTop: `2px solid ${c}`,
                }}
              >
                <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{p.region}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono uppercase" style={{ color: c }}>{p.status}</span>
                  <span className="text-[11px] font-mono text-white/70">P{(p.disruptionProb * 100).toFixed(0)}%</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-7 space-y-5">
            <div
              className="rounded-lg border p-6"
              style={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderTop: `2px solid ${ALLOY_GOLD}`,
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <div className="text-2xl font-semibold text-white">{selected.name}</div>
                  <div className="text-xs text-white/50 mt-1 font-mono">
                    {selected.region} · {selected.dailyTransits} transits/day · {selected.pctGlobalTrade}% global trade
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Disruption probability</div>
                  <div className="text-3xl font-mono font-bold leading-none mt-1" style={{ color: sc }}>
                    {(selected.disruptionProb * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-mono uppercase mt-1" style={{ color: sc }}>{selected.status}</div>
                </div>
              </div>

              <div className="rounded-md p-3 mb-4" style={{ background: 'rgba(217,122,76,0.06)', border: '1px solid rgba(217,122,76,0.2)' }}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" /> Primary threat
                </div>
                <div className="text-sm text-white/75">{selected.primaryThreat}</div>
              </div>

              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">Recent events</div>
              <div className="space-y-1.5 mb-4">
                {selected.recentEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-[10px] font-mono text-white/35 w-14 shrink-0">{e.ts}</span>
                    <span className="text-white/65">{e.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 space-y-4">
            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: ALLOY_GOLD }}>
                <Compass className="w-3 h-3" /> Alt-route option
              </div>
              <div className="text-sm font-semibold text-white mb-3">{selected.altRoute.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Added days</div>
                  <div className="text-base font-mono text-white mt-1">+{selected.altRoute.addedDays}</div>
                </div>
                <div className="rounded-md p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Cost / bbl</div>
                  <div className="text-base font-mono text-white mt-1">+{selected.altRoute.addedCostPctBbl.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: ALLOY_GOLD }}>
                <DollarSign className="w-3 h-3" /> Insurance signal
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-mono text-white">{selected.warRiskPremiumBps}</div>
                <div className="text-xs text-white/50">bps war-risk premium</div>
              </div>
              <div className="text-[11px] text-white/45 mt-1.5 leading-relaxed">
                Lloyd's market estimate for hull war-risk on transit · refreshed hourly from broker quotes.
              </div>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: twinMinted ? `${ALLOY_GOLD}40` : 'hsl(var(--border))',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                  <span className="text-sm font-semibold text-white">Decision twin</span>
                </div>
                <button
                  onClick={runDecisionTwin}
                  disabled={running}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
                  style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
                >
                  {running ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <ArrowRight className="w-3 h-3 inline mr-1" />}
                  {running ? 'Running…' : 'Run re-route'}
                </button>
              </div>
              {twinMinted && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ALLOY_GOLD }} />
                    <span className="text-xs text-white/80 font-mono">
                      PP-PRISM-{selected.id}-{Date.now().toString().slice(-5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/55 leading-relaxed pl-5">
                    Re-route Workcell created · {selected.altRoute.addedDays}d / +{selected.altRoute.addedCostPctBbl.toFixed(1)}% delta locked · war-risk +{selected.warRiskPremiumBps}bps · share to charterer & P&I.
                  </div>
                </div>
              )}
              {!twinMinted && (
                <p className="text-[11px] text-white/55">
                  Generates a one-page Proof Packet with current routing, alt option, $/bbl impact and
                  insurance delta — gated by A11oy PCE Gate.
                </p>
              )}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Disruption priors refreshed every 15 min · gated by A11oy PCE Gate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
