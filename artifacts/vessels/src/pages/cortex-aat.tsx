import { useMemo, useState } from 'react';
import {
  Anchor,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  GitBranch,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Wind,
  Zap,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

interface DarkVessel {
  id: string;
  imo: string;
  name: string;
  flag: string;
  lastBroadcastAt: string;
  lastBroadcast: { lat: number; lon: number; label: string };
  spoofingPattern: 'BLACK_SEA' | 'HORMUZ' | 'VENEZUELA' | 'GUINEA' | 'KERCH';
  patternEvidence: string;
}

interface TwinPrediction {
  predictedLat: number;
  predictedLon: number;
  predictedLabel: string;
  confidence: number;
  rationale: string[];
  selfCritique: string[];
  inferenceClock: number;
  spoofingPattern: string;
  routePhysics: string;
  weather: string;
  econIntent: string;
  counterparty: string;
}

const DARK_VESSELS: DarkVessel[] = [
  {
    id: 'D-001',
    imo: '9821045',
    name: 'PACIFIC MERIDIAN',
    flag: 'Unknown',
    lastBroadcastAt: '14h 22m ago',
    lastBroadcast: { lat: 25.4, lon: 56.2, label: 'drifting · S Hormuz' },
    spoofingPattern: 'HORMUZ',
    patternEvidence: 'Repeat AIS off events at 25.0–25.5°N, vessel always re-emerges 30–50nm NE',
  },
  {
    id: 'D-002',
    imo: '9654321',
    name: 'CASPIAN PIONEER',
    flag: 'Comoros',
    lastBroadcastAt: '9h 11m ago',
    lastBroadcast: { lat: 37.8, lon: 23.1, label: 'underway · S Aegean' },
    spoofingPattern: 'BLACK_SEA',
    patternEvidence: 'AIS broadcast loops Aegean track recorded weekly during 2024–2025',
  },
  {
    id: 'D-003',
    imo: '9445566',
    name: 'ATLANTIC HARVESTER',
    flag: 'Cameroon',
    lastBroadcastAt: '21h 05m ago',
    lastBroadcast: { lat: -1.3, lon: 8.7, label: 'last fix · Gulf of Guinea' },
    spoofingPattern: 'GUINEA',
    patternEvidence: 'AIS off near Lomé, vessel returns at Calabar — STS pattern',
  },
];

function predictTwin(v: DarkVessel): TwinPrediction {
  const offsets: Record<DarkVessel['spoofingPattern'], { dLat: number; dLon: number; label: string; pattern: string }> = {
    HORMUZ: { dLat: 0.55, dLon: 0.45, label: 'inside Bandar Abbas anchorage', pattern: 'Hormuz STS loop · vessel goes dark for STS, returns broadcasting drift posture' },
    BLACK_SEA: { dLat: 5.7, dLon: 14.3, label: 'berthed Novorossiysk Pier 8', pattern: 'Black Sea sanctioned-buyer call · AIS replays prior Aegean loop while berthed' },
    VENEZUELA: { dLat: -1.4, dLon: -2.1, label: 'STS off Jose Terminal', pattern: 'Venezuela export STS · AIS off for 8–24h during transfer' },
    GUINEA: { dLat: 1.8, dLon: -1.6, label: 'STS off Lomé approaches', pattern: 'Gulf of Guinea STS · AIS off for 18–30h, fuel theft pattern' },
    KERCH: { dLat: 8.4, dLon: 13.2, label: 'transit Kerch Strait northbound', pattern: 'Kerch shadow-route · AIS off through Strait, returns Sea of Azov' },
  };
  const o = offsets[v.spoofingPattern];
  return {
    predictedLat: v.lastBroadcast.lat + o.dLat,
    predictedLon: v.lastBroadcast.lon + o.dLon,
    predictedLabel: o.label,
    confidence: 0.78,
    rationale: [
      `Spoofing-pattern library match: ${o.pattern}`,
      `Route physics: drift profile inconsistent with current state in region (current 1.2kt SE, vessel position would have changed)`,
      `Port economics: ${v.flag} flag + sanctions exposure → strong economic incentive for sanctioned-port call`,
      `Counterparty intent: prior 6 calls all aligned with sanctioned-buyer route`,
    ],
    selfCritique: [
      `Twin assumes the spoofing-pattern library reflects 2026 behavior; if the adversary has shifted to a new pattern this prediction is wrong`,
      `Confidence floor of 60% — analyst should challenge the Proof Packet before any naval cue is issued`,
      `Weather plausibility check passed but EO confirmation has not yet been requested for the predicted position`,
    ],
    inferenceClock: 0.9,
    spoofingPattern: o.pattern,
    routePhysics: 'Drift inconsistent with regional current/wind for >6h — vessel must be under power or anchored',
    weather: 'Current 1.2kt SE, wind 8kt N — predicted position has plausible holding ground',
    econIntent: 'Sanctioned-grade discount on prior 6 voyages (+$1.40/bbl spread)',
    counterparty: '3-shell-co. ownership, terminal BO sanctioned 2024-11',
  };
}

export default function CortexAatPage() {
  const [selectedId, setSelectedId] = useState(DARK_VESSELS[0]!.id);
  const [generating, setGenerating] = useState(false);
  const [twin, setTwin] = useState<TwinPrediction | null>(predictTwin(DARK_VESSELS[0]!));
  const [proofMinted, setProofMinted] = useState(false);
  const [challenge, setChallenge] = useState('');

  const selected = useMemo(() => DARK_VESSELS.find((v) => v.id === selectedId)!, [selectedId]);

  function generate() {
    setGenerating(true);
    setProofMinted(false);
    setTimeout(() => {
      setTwin(predictTwin(selected));
      setGenerating(false);
    }, 900);
  }

  function mintProof() {
    setProofMinted(true);
  }

  function pickVessel(id: string) {
    setSelectedId(id);
    setProofMinted(false);
    const v = DARK_VESSELS.find((x) => x.id === id)!;
    setTwin(predictTwin(v));
  }

  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="border-l-2 pl-5 mb-8" style={{ borderColor: ALLOY_GOLD }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5" style={{ color: ALLOY_GOLD }}>
            Cortex · AAT · Adversarial AIS Twin
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Truthful twin for every dark vessel</h1>
          <p className="text-sm text-white/50 mt-1.5 max-w-2xl">
            For each dark or spoofing vessel, MIFC spawns a twin that predicts where the vessel actually
            is — drawing on the spoofing-pattern library, route physics, weather, port economics and
            counterparty intent — and is required to justify itself. Every twin emits a Proof Packet an
            analyst (or a watch officer) can challenge.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2 px-1">
              Dark vessels
            </div>
            {DARK_VESSELS.map((v) => {
              const isSel = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  onClick={() => pickVessel(v.id)}
                  className="w-full text-left rounded-md border p-3 transition-colors"
                  style={{
                    background: isSel ? `${ALLOY_GOLD}08` : 'hsl(var(--card))',
                    borderColor: isSel ? `${ALLOY_GOLD}50` : 'hsl(var(--border))',
                  }}
                >
                  <div className="text-xs font-semibold text-white truncate">{v.name}</div>
                  <div className="text-[10px] text-white/40 font-mono mt-0.5">IMO {v.imo} · {v.flag}</div>
                  <div className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> dark for {v.lastBroadcastAt}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: ALLOY_GOLD }}>
                    {v.spoofingPattern} pattern
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
              <div className="flex items-start justify-between gap-6 mb-5 flex-wrap">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                    Subject
                  </div>
                  <div className="text-xl font-semibold text-white">{selected.name}</div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    Last broadcast: {selected.lastBroadcast.label} · {selected.lastBroadcastAt}
                  </div>
                </div>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}40` }}
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  {generating ? 'Generating twin…' : 'Regenerate twin'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="rounded-md p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">Broadcast posture (per AIS)</div>
                  <div className="text-sm text-white/70">{selected.lastBroadcast.label}</div>
                  <div className="text-[11px] text-white/40 font-mono mt-1">
                    {selected.lastBroadcast.lat.toFixed(2)}°N {selected.lastBroadcast.lon.toFixed(2)}°E
                  </div>
                </div>
                <div className="rounded-md p-4" style={{ background: `${ALLOY_GOLD}06`, border: `1px solid ${ALLOY_GOLD}30` }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: ALLOY_GOLD }}>
                    Twin prediction · {twin ? `${(twin.confidence * 100).toFixed(0)}% confidence` : '—'}
                  </div>
                  {twin && (
                    <>
                      <div className="text-sm text-white/85">{twin.predictedLabel}</div>
                      <div className="text-[11px] text-white/50 font-mono mt-1">
                        {twin.predictedLat.toFixed(2)}°N {twin.predictedLon.toFixed(2)}°E
                      </div>
                    </>
                  )}
                </div>
              </div>

              {twin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {[
                      { icon: GitBranch, label: 'Spoofing pattern', value: twin.spoofingPattern },
                      { icon: Compass, label: 'Route physics', value: twin.routePhysics },
                      { icon: Wind, label: 'Weather plausibility', value: twin.weather },
                      { icon: Anchor, label: 'Port economics', value: twin.econIntent },
                    ].map((p) => {
                      const I = p.icon;
                      return (
                        <div key={p.label} className="flex items-start gap-2 text-xs">
                          <I className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ALLOY_GOLD }} />
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-0.5">{p.label}</div>
                            <div className="text-white/70 leading-relaxed">{p.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-md p-4 mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: ALLOY_GOLD }}>
                      Justification
                    </div>
                    <ol className="space-y-1.5">
                      {twin.rationale.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/65 leading-relaxed">
                          <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: ALLOY_GOLD }}>{i + 1}.</span>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-md p-4" style={{ background: 'rgba(217,122,76,0.06)', border: '1px solid rgba(217,122,76,0.2)' }}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Constitutional self-critique
                    </div>
                    <ul className="space-y-1.5">
                      {twin.selfCritique.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400/60 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                background: 'hsl(var(--card))',
                borderColor: proofMinted ? `${ALLOY_GOLD}40` : 'hsl(var(--border))',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: ALLOY_GOLD }} />
                  <span className="text-sm font-semibold text-white">Proof Packet · A11oy PCE</span>
                </div>
                {!proofMinted && (
                  <button
                    onClick={mintProof}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-md"
                    style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}30` }}
                  >
                    <Zap className="w-3 h-3 inline mr-1" /> Mint Proof Packet
                  </button>
                )}
              </div>
              {proofMinted && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ALLOY_GOLD }} />
                    <span className="text-xs text-white/80 font-mono">
                      PP-AAT-{selected.imo}-{Date.now().toString().slice(-5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 leading-relaxed pl-5">
                    Twin prediction sealed · 4 prior factors hashed · self-critique attached · constitutional rule{' '}
                    <span className="font-mono text-white/70">vessels.aat.must_emit_self_critique</span> satisfied.
                  </div>
                </div>
              )}
              <div className="border-t pt-3" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
                  Challenge this twin (analyst override)
                </div>
                <div className="flex gap-2">
                  <input
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="Counter-evidence or alternative hypothesis…"
                    className="flex-1 text-xs bg-white/[0.03] border rounded-md px-3 py-2 text-white/85 outline-none"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                  <button
                    disabled={!challenge.trim()}
                    onClick={() => { setChallenge(''); }}
                    className="text-[11px] font-medium px-3 py-2 rounded-md disabled:opacity-40"
                    style={{ background: `${ALLOY_GOLD}10`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}25` }}
                  >
                    Submit challenge <ChevronRight className="w-3 h-3 inline" />
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-2">
                  Challenges open a new Workcell with the twin and override evidence side by side.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 px-1">
              Twin generated under constitution vessels.aat.v1 · gated by A11oy PCE Gate · spoofing library v2026.5
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
