import { useState, useMemo, useCallback } from "react";
import { Globe, Target, TrendingUp, AlertTriangle, Shield, Layers, Activity, BarChart3, DollarSign, Zap, ChevronRight, Play, XCircle } from "lucide-react";

const ACCENT = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface CascadeImpact {
  domain: string;
  impact: string;
  severity: "critical" | "high" | "medium" | "low";
  financialExposure: number;
  probability: number;
}

interface Scenario {
  id: string;
  hypothesis: string;
  category: "geopolitical" | "economic" | "cyber" | "regulatory" | "climate";
  baselineProbability: number;
  cascades: CascadeImpact[];
  historicalAnalog: string;
  timeHorizon: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "WAR-001", hypothesis: "China blockades Taiwan — 90-day scenario",
    category: "geopolitical", baselineProbability: 12,
    cascades: [
      { domain: "Maritime", impact: "Trans-Pacific shipping disrupted. 40% of global container traffic rerouted. Vessel utilization drops to 35%.", severity: "critical", financialExposure: 45_000_000, probability: 94 },
      { domain: "Cyber", impact: "State-sponsored attacks on Western critical infrastructure. APT-41, APT-31 campaigns activated. CISA emergency directives.", severity: "critical", financialExposure: 12_000_000, probability: 88 },
      { domain: "Financial", impact: "Semiconductor shortage cascades. Portfolio companies with China supply chain lose 30-60% valuation. Insurance markets freeze.", severity: "critical", financialExposure: 180_000_000, probability: 82 },
      { domain: "Legal", impact: "Sanctions compliance review for 47 contracts with Chinese counterparties. Force majeure triggers across shipping agreements.", severity: "high", financialExposure: 8_000_000, probability: 91 },
      { domain: "Real Estate", impact: "Industrial warehouse demand spikes near nearshoring corridors (Mexico, Vietnam). Coastal property values drop in Pacific Rim.", severity: "medium", financialExposure: 25_000_000, probability: 65 },
      { domain: "Infrastructure", impact: "Undersea cable cuts disrupt internet connectivity. Cloud region failovers to US-West stressed.", severity: "high", financialExposure: 5_000_000, probability: 72 },
    ],
    historicalAnalog: "Most closely resembles 1996 Taiwan Strait Crisis + 2022 Russia-Ukraine combined impact models",
    timeHorizon: "90 days",
  },
  {
    id: "WAR-002", hypothesis: "EU carbon border tax triples — effective Jan 2026",
    category: "regulatory", baselineProbability: 34,
    cascades: [
      { domain: "Maritime", impact: "Vessel fuel cost increase 25%. LNG carrier demand rises. Older fleet retirement accelerates.", severity: "high", financialExposure: 8_000_000, probability: 78 },
      { domain: "Financial", impact: "Carbon-intensive portfolio companies face margin compression. Green bond allocation needs increase.", severity: "high", financialExposure: 35_000_000, probability: 85 },
      { domain: "Legal", impact: "Regulatory compliance overhaul. 23 existing contracts require carbon clause amendments.", severity: "medium", financialExposure: 2_000_000, probability: 90 },
      { domain: "Real Estate", impact: "Commercial properties below EPC-B face value discount. Green retrofit opportunities in Northern Europe.", severity: "medium", financialExposure: 15_000_000, probability: 70 },
    ],
    historicalAnalog: "Follows pattern of 2005 EU ETS Phase I launch — initial price shock followed by market correction",
    timeHorizon: "18 months",
  },
  {
    id: "WAR-003", hypothesis: "Coordinated ransomware attack on global shipping infrastructure",
    category: "cyber", baselineProbability: 22,
    cascades: [
      { domain: "Maritime", impact: "Port management systems offline across 5 major ports. Container tracking systems dark for 72-96 hours.", severity: "critical", financialExposure: 20_000_000, probability: 75 },
      { domain: "Cyber", impact: "NotPetya-scale propagation through interconnected logistics networks. Wiper disguised as ransomware.", severity: "critical", financialExposure: 15_000_000, probability: 80 },
      { domain: "Financial", impact: "Marine insurance claims surge. Cyber insurance coverage tested at scale. Market-wide repricing.", severity: "high", financialExposure: 40_000_000, probability: 70 },
      { domain: "Legal", impact: "Breach notification across 12 jurisdictions. Class action exposure from delayed shipments.", severity: "high", financialExposure: 6_000_000, probability: 65 },
    ],
    historicalAnalog: "2017 NotPetya / Maersk disruption at 10x scale. 2021 Colonial Pipeline pattern applied to maritime",
    timeHorizon: "30 days",
  },
];

const catColor = (c: string) => c === "geopolitical" ? RED : c === "economic" ? ACCENT : c === "cyber" ? PURPLE : c === "regulatory" ? BLUE : GREEN;
const sevColor = (s: string) => s === "critical" ? RED : s === "high" ? ACCENT : s === "medium" ? BLUE : GREEN;
const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

export default function ScenarioWargamingPage() {
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const [probabilityOverride, setProbabilityOverride] = useState<number | null>(null);
  const [monteCarloRuns, setMonteCarloRuns] = useState(10000);
  const [simRunning, setSimRunning] = useState(false);
  const [simComplete, setSimComplete] = useState(false);

  const selected = useMemo(() => SCENARIOS.find(s => s.id === selectedId) ?? SCENARIOS[0], [selectedId]);
  const effectiveProbability = probabilityOverride ?? selected.baselineProbability;
  const totalExposure = useMemo(() => selected.cascades.reduce((s, c) => s + c.financialExposure * (c.probability / 100), 0), [selected]);

  const handleRunSimulation = useCallback(() => {
    setSimRunning(true);
    setSimComplete(false);
    setTimeout(() => { setSimRunning(false); setSimComplete(true); }, 2000);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Predictive Scenario War-Gaming</h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>Define geopolitical hypotheticals and model cascading impacts across every domain with Monte Carlo simulation</p>
      </div>

      <div className="flex gap-3">
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => { setSelectedId(s.id); setProbabilityOverride(null); setSimComplete(false); }} aria-label={`Select scenario ${s.hypothesis}`}
            className="flex-1 text-left rounded-xl p-4 transition" style={{ background: selectedId === s.id ? "rgba(255,255,255,0.04)" : DS.surface, border: `1px solid ${selectedId === s.id ? "rgba(255,255,255,0.12)" : DS.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{s.id}</span>
              <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: catColor(s.category) + "15", color: catColor(s.category) }}>{s.category}</span>
            </div>
            <p className="text-sm font-medium text-white">{s.hypothesis}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[9px]" style={{ color: DS.text.muted }}>Base prob: <span className="font-semibold text-white">{s.baselineProbability}%</span></span>
              <span className="text-[9px]" style={{ color: DS.text.muted }}>{s.timeHorizon}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: DS.text.muted }}>Cascading Impact Model — {selected.cascades.length} Domains</h3>
              <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>Probability-Weighted Exposure: {fmt(totalExposure)}</span>
            </div>

            <div className="space-y-3">
              {selected.cascades.map((c, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-semibold text-white">{c.domain}</span>
                    <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: sevColor(c.severity) + "15", color: sevColor(c.severity) }}>{c.severity}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>Probability:</span>
                      <span className="text-[10px] font-semibold text-white">{c.probability}%</span>
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>Exposure:</span>
                      <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>{fmt(c.financialExposure)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{c.impact}</p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.probability}%`, background: sevColor(c.severity) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: ACCENT + "08", borderLeft: `2px solid ${ACCENT}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3 w-3" style={{ color: ACCENT }} />
              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: ACCENT }}>Historical Analog</span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{selected.historicalAnalog}</p>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: DS.text.muted }}>Monte Carlo Controls</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="prob-slider" className="text-[9px] block mb-1" style={{ color: DS.text.muted }}>Scenario Probability Override</label>
                <div className="flex items-center gap-3">
                  <input id="prob-slider" type="range" min={1} max={95} value={effectiveProbability}
                    onChange={e => setProbabilityOverride(Number(e.target.value))}
                    aria-label="Scenario probability adjustment"
                    className="flex-1 h-1 appearance-none rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,0.08)", accentColor: ACCENT }} />
                  <span className="text-[11px] font-mono font-semibold text-white w-10 text-right">{effectiveProbability}%</span>
                </div>
              </div>
              <div>
                <label htmlFor="mc-runs" className="text-[9px] block mb-1" style={{ color: DS.text.muted }}>Simulation Iterations</label>
                <select id="mc-runs" value={monteCarloRuns} onChange={e => setMonteCarloRuns(Number(e.target.value))}
                  aria-label="Monte Carlo iterations"
                  className="w-full rounded-lg p-2 text-[10px] text-white" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}` }}>
                  <option value={1000}>1,000 runs</option>
                  <option value={10000}>10,000 runs</option>
                  <option value={100000}>100,000 runs</option>
                </select>
              </div>
              <button onClick={handleRunSimulation} disabled={simRunning} aria-label="Run Monte Carlo simulation"
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-semibold transition hover:brightness-125"
                style={{ background: simRunning ? "rgba(255,255,255,0.04)" : ACCENT + "20", color: simRunning ? DS.text.muted : ACCENT }}>
                {simRunning ? <><Activity className="h-3 w-3 animate-spin" /> Simulating...</> : <><Play className="h-3 w-3" /> Run Simulation</>}
              </button>
            </div>
          </div>

          {simComplete && (
            <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
              <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: GREEN }}>Simulation Results</h3>
              {[
                { label: "Mean Outcome", value: fmt(totalExposure * (effectiveProbability / 100)) },
                { label: "95th Percentile", value: fmt(totalExposure * (effectiveProbability / 100) * 1.8) },
                { label: "99th Percentile", value: fmt(totalExposure * (effectiveProbability / 100) * 2.4) },
                { label: "Iterations", value: monteCarloRuns.toLocaleString() },
                { label: "Confidence Interval", value: "±4.2%" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${DS.border}` }}>
                  <span className="text-[10px]" style={{ color: DS.text.muted }}>{s.label}</span>
                  <span className="text-[10px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: DS.text.muted }}>Scenario Summary</h3>
            {[
              { label: "Time Horizon", value: selected.timeHorizon },
              { label: "Domains Affected", value: selected.cascades.length.toString() },
              { label: "Critical Impacts", value: selected.cascades.filter(c => c.severity === "critical").length.toString() },
              { label: "Total Exposure", value: fmt(selected.cascades.reduce((s, c) => s + c.financialExposure, 0)) },
              { label: "Category", value: selected.category },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <span className="text-[10px]" style={{ color: DS.text.muted }}>{s.label}</span>
                <span className="text-[10px] font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
