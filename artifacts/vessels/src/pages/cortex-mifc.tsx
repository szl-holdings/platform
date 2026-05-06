import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  GitBranch,
  Layers,
  Loader2,
  Radio,
  Satellite,
  ShieldCheck,
  Target,
  Waves,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

type IntSource = 'AIS' | 'SAR' | 'RF' | 'EO' | 'ACOUSTIC' | 'OWNERSHIP' | 'SANCTIONS' | 'ECON';

interface IntReading {
  source: IntSource;
  agrees: boolean;
  weight: number;
  confidence: number;
  evidence: string;
  vendor: string;
}

interface VesselCase {
  id: string;
  imo: string;
  name: string;
  flag: string;
  broadcast: string;
  realityScore: number;
  ci: [number, number];
  dissent: string;
  pceState: 'pending' | 'gate-passed' | 'gate-blocked';
  workcellId: string;
  readings: IntReading[];
}

const CASES: VesselCase[] = [
  {
    id: 'C-001',
    imo: '9821045',
    name: 'PACIFIC MERIDIAN',
    flag: 'Unknown',
    broadcast: 'Drifting — Strait of Hormuz, 25.4°N 56.2°E',
    realityScore: 0.18,
    ci: [0.12, 0.27],
    dissent: 'SAR + RF disagree with broadcast position by ~38nm',
    pceState: 'gate-blocked',
    workcellId: 'WC-MIFC-184f2',
    readings: [
      { source: 'AIS', agrees: true, weight: 0.20, confidence: 0.90, evidence: 'Class-A static report 14h old', vendor: 'Spire' },
      { source: 'SAR', agrees: false, weight: 0.30, confidence: 0.92, evidence: 'Sentinel-1 IW frame 2026-05-06T07:42Z — vessel 38nm NE of broadcast', vendor: 'ESA' },
      { source: 'RF', agrees: false, weight: 0.20, confidence: 0.85, evidence: 'X-band radar emission cluster matches SAR detection', vendor: 'HawkEye 360' },
      { source: 'EO', agrees: false, weight: 0.10, confidence: 0.78, evidence: 'BlackSky Gen-3 chip confirms hull at SAR position', vendor: 'BlackSky' },
      { source: 'ACOUSTIC', agrees: false, weight: 0.05, confidence: 0.55, evidence: 'Hydrophone signature at 28°N consistent with Aframax', vendor: 'Sovereign mesh' },
      { source: 'OWNERSHIP', agrees: true, weight: 0.05, confidence: 0.70, evidence: 'BO obscured via 3 shell co.', vendor: 'IHS Markit' },
      { source: 'SANCTIONS', agrees: true, weight: 0.05, confidence: 0.95, evidence: 'Vessel on OFAC SDN since 2024-11', vendor: 'OFAC' },
      { source: 'ECON', agrees: false, weight: 0.05, confidence: 0.66, evidence: 'Last 6 calls all in sanctioned-buyer ports', vendor: 'Kpler' },
    ],
  },
  {
    id: 'C-002',
    imo: '9654321',
    name: 'CASPIAN PIONEER',
    flag: 'Comoros',
    broadcast: 'Underway — Aegean, 37.8°N 23.1°E',
    realityScore: 0.42,
    ci: [0.35, 0.51],
    dissent: 'AIS plausible but SAR shows 9h gap at sanctioned berth',
    pceState: 'pending',
    workcellId: 'WC-MIFC-184f3',
    readings: [
      { source: 'AIS', agrees: true, weight: 0.20, confidence: 0.88, evidence: 'Position fix consistent with route', vendor: 'Spire' },
      { source: 'SAR', agrees: false, weight: 0.30, confidence: 0.81, evidence: 'Capella stripmap 2026-05-06T03:11Z places vessel berthed Novorossiysk', vendor: 'Capella Space' },
      { source: 'RF', agrees: false, weight: 0.20, confidence: 0.74, evidence: 'Unseenlabs detection cluster at Black Sea pier', vendor: 'Unseenlabs' },
      { source: 'EO', agrees: true, weight: 0.10, confidence: 0.50, evidence: 'No EO chip — cloud cover', vendor: 'Planet Labs' },
      { source: 'ACOUSTIC', agrees: true, weight: 0.05, confidence: 0.30, evidence: 'No hydrophone in region', vendor: '—' },
      { source: 'OWNERSHIP', agrees: true, weight: 0.05, confidence: 0.85, evidence: 'Single-vessel SPV registered Comoros 2023-Q4', vendor: 'IHS Markit' },
      { source: 'SANCTIONS', agrees: true, weight: 0.05, confidence: 0.92, evidence: 'BO on EU consolidated list', vendor: 'EU' },
      { source: 'ECON', agrees: false, weight: 0.05, confidence: 0.71, evidence: 'Spot freight differential matches sanctioned-grade discount', vendor: 'Internal' },
    ],
  },
  {
    id: 'C-003',
    imo: '9987654',
    name: 'GULF VOYAGER',
    flag: 'Tanzania',
    broadcast: 'Anchored — Gulf of Aden, 12.7°N 44.9°E',
    realityScore: 0.71,
    ci: [0.62, 0.79],
    dissent: 'Mostly consistent — minor RF discrepancy from coastal jamming',
    pceState: 'gate-passed',
    workcellId: 'WC-MIFC-184f4',
    readings: [
      { source: 'AIS', agrees: true, weight: 0.20, confidence: 0.93, evidence: 'Anchor watch transmissions every 3min', vendor: 'Spire' },
      { source: 'SAR', agrees: true, weight: 0.30, confidence: 0.88, evidence: 'ICEYE strip confirms hull at anchor', vendor: 'ICEYE' },
      { source: 'RF', agrees: false, weight: 0.20, confidence: 0.45, evidence: 'Region-wide jamming reduces RF confidence', vendor: 'HawkEye 360' },
      { source: 'EO', agrees: true, weight: 0.10, confidence: 0.82, evidence: 'BlackSky chip matches', vendor: 'BlackSky' },
      { source: 'ACOUSTIC', agrees: true, weight: 0.05, confidence: 0.40, evidence: 'No nearby hydrophone', vendor: '—' },
      { source: 'OWNERSHIP', agrees: true, weight: 0.05, confidence: 0.88, evidence: 'Tier-2 owner, no sanctions hits', vendor: 'IHS Markit' },
      { source: 'SANCTIONS', agrees: true, weight: 0.05, confidence: 0.96, evidence: 'No matches on any list', vendor: 'OFAC/EU/UK/UN' },
      { source: 'ECON', agrees: true, weight: 0.05, confidence: 0.75, evidence: 'Charter pattern consistent with declared trade', vendor: 'Internal' },
    ],
  },
];

const SOURCE_CONFIG: Record<IntSource, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  AIS: { icon: Radio, label: 'AIS broadcast' },
  SAR: { icon: Satellite, label: 'SAR' },
  RF: { icon: Activity, label: 'RF geolocation' },
  EO: { icon: Eye, label: 'EO' },
  ACOUSTIC: { icon: Waves, label: 'Acoustic' },
  OWNERSHIP: { icon: GitBranch, label: 'Ownership' },
  SANCTIONS: { icon: ShieldCheck, label: 'Sanctions' },
  ECON: { icon: Target, label: 'Econ priors' },
};

function tier(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'Trusted', color: '#5baa8a' };
  if (score >= 0.5) return { label: 'Plausible', color: '#c9a85c' };
  if (score >= 0.3) return { label: 'Suspect', color: '#d97a4c' };
  return { label: 'Adversarial', color: '#c96070' };
}

export default function CortexMifcPage() {
  const [selectedId, setSelectedId] = useState<string>(CASES[0]!.id);
  const [running, setRunning] = useState(false);
  const [proofState, setProofState] = useState<'idle' | 'minted'>('idle');

  const selected = useMemo(() => CASES.find((c) => c.id === selectedId)!, [selectedId]);
  const t = tier(selected.realityScore);

  function runFusion() {
    setRunning(true);
    setProofState('idle');
    setTimeout(() => {
      setRunning(false);
      setProofState('minted');
    }, 1100);
  }

  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
          <div className="border-l-2 pl-5" style={{ borderColor: ALLOY_GOLD }}>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: ALLOY_GOLD }}>
              Cortex · MIFC · Multi-INT Fusion
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Vessel Reality Engine</h1>
            <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
              One probabilistic answer per vessel. AIS, SAR, RF, EO, acoustic, ownership and economic
              priors fused into a Reality Score with a 95% confidence interval, a dissent vector, and a
              PCE-gated Proof Packet before any alert leaves the building.
            </p>
          </div>
          <button
            onClick={runFusion}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            {running ? 'Fusing 8 sources…' : 'Re-run fusion'}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 px-1">
              Active cases
            </div>
            {CASES.map((c) => {
              const ct = tier(c.realityScore);
              const isSel = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setProofState('idle'); }}
                  className="w-full text-left rounded-md border p-3 transition-colors"
                  style={{
                    background: isSel ? `${ALLOY_GOLD}08` : 'hsl(var(--card))',
                    borderColor: isSel ? `${ALLOY_GOLD}50` : 'hsl(var(--border))',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: ct.color }}>
                      {(c.realityScore * 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">IMO {c.imo} · {c.flag}</div>
                  <div className="text-[10px] mt-1" style={{ color: ct.color }}>{ct.label}</div>
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
              <div className="flex items-start justify-between gap-6 flex-wrap mb-5">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                    Subject vessel
                  </div>
                  <div className="text-xl font-semibold text-white">{selected.name}</div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    IMO {selected.imo} · flag {selected.flag} · broadcast: {selected.broadcast}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                    Reality Score
                  </div>
                  <div className="text-4xl font-mono font-bold leading-none" style={{ color: t.color }}>
                    {(selected.realityScore * 100).toFixed(0)}
                  </div>
                  <div className="text-[10px] text-white/40 font-mono mt-1">
                    95% CI [{(selected.ci[0] * 100).toFixed(0)} – {(selected.ci[1] * 100).toFixed(0)}]
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: t.color }}>{t.label}</div>
                </div>
              </div>

              <div className="rounded-md p-3 mb-4" style={{ background: 'rgba(217,122,76,0.06)', border: '1px solid rgba(217,122,76,0.18)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-0.5">
                      Dissent vector
                    </div>
                    <div className="text-xs text-white/70">{selected.dissent}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selected.readings.map((r) => {
                  const cfg = SOURCE_CONFIG[r.source];
                  const I = cfg.icon;
                  return (
                    <div
                      key={r.source}
                      className="rounded-md border p-3"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: r.agrees ? 'rgba(91,170,138,0.2)' : 'rgba(217,122,76,0.25)',
                        borderLeft: `2px solid ${r.agrees ? '#5baa8a' : '#d97a4c'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <I className="w-3.5 h-3.5" style={{ color: ALLOY_GOLD }} />
                          <span className="text-xs font-medium text-white">{cfg.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/40">
                          w {(r.weight * 100).toFixed(0)} · c {(r.confidence * 100).toFixed(0)}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/55 leading-relaxed">{r.evidence}</div>
                      <div className="text-[9px] text-white/30 font-mono mt-1.5 uppercase tracking-wider">
                        {r.vendor} · {r.agrees ? 'agrees' : 'dissents'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: proofState === 'minted' ? `${ALLOY_GOLD}40` : 'hsl(var(--border))',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                  <span className="text-sm font-semibold text-white">A11oy PCE Gate</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={
                      selected.pceState === 'gate-passed'
                        ? { background: 'rgba(91,170,138,0.12)', color: '#5baa8a', border: '1px solid rgba(91,170,138,0.25)' }
                        : selected.pceState === 'gate-blocked'
                        ? { background: 'rgba(201,96,112,0.12)', color: '#c96070', border: '1px solid rgba(201,96,112,0.25)' }
                        : { background: `${ALLOY_GOLD}12`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}30` }
                    }
                  >
                    {selected.pceState.replace('-', ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/40">{selected.workcellId}</span>
              </div>
              {proofState === 'idle' && (
                <p className="text-xs text-white/55">
                  Reality Score and dissent vector are computed but no Proof Packet has been minted for
                  this fusion run. Click <span className="text-white/80">Re-run fusion</span> to gate the
                  decision through PCE.
                </p>
              )}
              {proofState === 'minted' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ALLOY_GOLD }} />
                    <span className="text-xs text-white/80">
                      Proof Packet <span className="font-mono">PP-{selected.workcellId.slice(-5)}-r{Date.now().toString().slice(-4)}</span> minted
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 leading-relaxed pl-5">
                    Inputs hashed · 8 source readings sealed · dissent vector preserved · constitutional
                    rule <span className="font-mono text-white/70">vessels.alert.must_pass_dissent_floor</span>{' '}
                    {selected.realityScore < 0.3 ? 'flagged for analyst override' : 'satisfied'}.
                  </div>
                  <button
                    className="text-[11px] flex items-center gap-1 mt-2"
                    style={{ color: ALLOY_GOLD }}
                  >
                    Open in Trust & Provenance <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1">
              Decisions gated by A11oy PCE Gate · Workcell {selected.workcellId} · upstream fusion contract: vessels.mifc.v1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
