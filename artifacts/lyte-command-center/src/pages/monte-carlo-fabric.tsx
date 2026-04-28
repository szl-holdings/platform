import { cn } from '@szl-holdings/shared-ui/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ChevronDown,
  Dice5,
  Loader2,
  Play,
  Settings2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface DistributionConfig {
  type: string;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
  alpha?: number;
  beta?: number;
  lambda?: number;
  value?: number;
}

interface MonteCarloInput {
  id: string;
  label: string;
  distribution: DistributionConfig;
  unit?: string;
}

interface ProbabilityBand {
  label: string;
  lower: number;
  upper: number;
  probability: number;
  color: string;
}

interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
  density: number;
}

interface OutputDistribution {
  id: string;
  label: string;
  unit: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  percentiles: Record<string, number>;
  probabilityBands: ProbabilityBand[];
  histogram: HistogramBin[];
  cdf: { value: number; probability: number }[];
}

interface SensitivityEntry {
  inputId: string;
  inputLabel: string;
  lowImpact: number;
  highImpact: number;
  elasticity: number;
}

interface SimulationResult {
  simulationId: string;
  iterations: number;
  validIterations: number;
  constraintViolationRate: number;
  durationMs: number;
  inputs: MonteCarloInput[];
  outputs: OutputDistribution[];
  samplePaths: { step: number; value: number }[][];
  correlationMatrix: Record<string, Record<string, number>>;
  sensitivityTornado: SensitivityEntry[];
  timestamp: string;
}

interface PresetScenario {
  id: string;
  title: string;
  description: string;
  domain: string;
  inputCount: number;
  outputCount: number;
  inputs: MonteCarloInput[];
  outputs: { id: string; label: string; unit: string }[];
}

function fmt(n: number, unit: string): string {
  if (unit === '$M') return `$${n.toFixed(2)}M`;
  if (unit === '$K') return `$${n.toFixed(0)}K`;
  if (unit === '$/day') return `$${n.toLocaleString()}/day`;
  if (unit === '%') return `${n.toFixed(2)}%`;
  return n.toFixed(2) + (unit ? ` ${unit}` : '');
}

function HistogramChart({ bins, label }: { bins: HistogramBin[]; label: string }) {
  if (bins.length === 0) return null;
  const maxCount = Math.max(...bins.map((b) => b.count));
  const chartH = 100;
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{label} Distribution</p>
      <div className="flex items-end gap-px" style={{ height: chartH }}>
        {bins.map((b, i) => {
          const h = maxCount > 0 ? (b.count / maxCount) * chartH : 0;
          return (
            <div
              key={i}
              className="flex-1 bg-[#c9b787]/40 hover:bg-[#c9b787]/60 transition-colors rounded-t-sm"
              style={{ height: Math.max(1, h) }}
              title={`${b.binStart.toFixed(2)}–${b.binEnd.toFixed(2)}: ${b.count} iterations`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-white/20 font-mono">
        <span>{bins[0]?.binStart.toFixed(1)}</span>
        <span>{bins[bins.length - 1]?.binEnd.toFixed(1)}</span>
      </div>
    </div>
  );
}

function TornadoChart({ entries, baseValue }: { entries: SensitivityEntry[]; baseValue: number }) {
  if (entries.length === 0) return null;
  const maxRange = Math.max(...entries.map((e) => Math.abs(e.highImpact - e.lowImpact)));
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Sensitivity Tornado</p>
      {entries.slice(0, 8).map((e) => {
        const range = e.highImpact - e.lowImpact;
        const pct = maxRange > 0 ? (Math.abs(range) / maxRange) * 100 : 0;
        const leftPct = range >= 0 ? 50 : 50 - pct / 2;
        const widthPct = range >= 0 ? pct / 2 : pct / 2;
        return (
          <div key={e.inputId} className="space-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/50">{e.inputLabel}</span>
              <span className="text-white/30 font-mono">ε={e.elasticity.toFixed(2)}</span>
            </div>
            <div className="relative h-4 bg-white/[0.03] rounded">
              <div className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: '50%' }} />
              {range >= 0 ? (
                <div
                  className="absolute top-0.5 bottom-0.5 bg-emerald-500/40 rounded-sm"
                  style={{ left: '50%', width: `${widthPct}%` }}
                />
              ) : (
                <div
                  className="absolute top-0.5 bottom-0.5 bg-red-500/40 rounded-sm"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              )}
              <div className="absolute top-0 left-1 text-[8px] text-white/20 font-mono leading-4">
                {e.lowImpact.toFixed(1)}
              </div>
              <div className="absolute top-0 right-1 text-[8px] text-white/20 font-mono leading-4">
                {e.highImpact.toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BandChart({ bands }: { bands: ProbabilityBand[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Probability Bands</p>
      <div className="flex h-6 rounded overflow-hidden">
        {bands.map((b) => (
          <div
            key={b.label}
            className="h-full"
            style={{ width: `${b.probability * 100}%`, backgroundColor: b.color + '60' }}
            title={`${b.label}: ${b.lower.toFixed(2)} – ${b.upper.toFixed(2)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {bands.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 text-[9px]">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: b.color + '80' }} />
            <span className="text-white/40">{b.label}</span>
            <span className="text-white/50 font-mono ml-auto">{b.lower.toFixed(2)}–{b.upper.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CdfChart({ data }: { data: { value: number; probability: number }[] }) {
  if (data.length === 0) return null;
  const maxVal = data[data.length - 1]?.value ?? 1;
  const minVal = data[0]?.value ?? 0;
  const range = maxVal - minVal || 1;
  const h = 80;
  const w = 300;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - d.probability * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">CDF</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        <polyline points={points} fill="none" stroke="var(--gi-accent-amber)" strokeWidth="1.5" opacity="0.6" />
        <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} stroke="white" strokeWidth="0.5" opacity="0.1" strokeDasharray="4" />
        <text x="2" y={h * 0.5 - 2} fill="white" fontSize="8" opacity="0.2">P50</text>
      </svg>
      <div className="flex justify-between text-[9px] text-white/20 font-mono">
        <span>{minVal.toFixed(1)}</span>
        <span>{maxVal.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function MonteCarloFabricPage() {
  const [selectedScenario, setSelectedScenario] = useState('terra/cap-rate-forecast');
  const [iterations, setIterations] = useState(10000);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  const { data: scenariosData } = useQuery({
    queryKey: ['mc-fabric-scenarios'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/monte-carlo-fabric/scenarios`);
      if (!r.ok) throw new Error('Failed to load scenarios');
      const json = await r.json();
      return json.data.scenarios as PresetScenario[];
    },
    staleTime: 300_000,
  });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${BASE}/api/monte-carlo-fabric/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario, iterations }),
      });
      if (!r.ok) throw new Error('Failed to run simulation');
      const json = await r.json();
      return json.data.result as SimulationResult;
    },
    onSuccess: (data) => {
      if (data.outputs.length > 0 && !selectedOutput) {
        setSelectedOutput(data.outputs[0]!.id);
      }
    },
  });

  const result = simulateMutation.data;
  const scenarios = scenariosData ?? [];
  const currentScenario = scenarios.find((s) => s.id === selectedScenario);
  const activeOutput = result?.outputs.find((o) => o.id === selectedOutput) ?? result?.outputs[0];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-tight flex items-center gap-2">
          <Dice5 className="w-5 h-5 text-[var(--gi-accent-amber)]" />
          Monte Carlo Simulation Engine
        </h1>
        <p className="text-[11px] text-white/30 mt-0.5">
          Configurable stochastic simulation with probability-weighted outcome bands
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Configuration</p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Scenario</label>
              <div className="relative">
                <select
                  value={selectedScenario}
                  onChange={(e) => { setSelectedScenario(e.target.value); setSelectedOutput(null); }}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {currentScenario && (
                <p className="text-[10px] text-white/30">{currentScenario.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Iterations</label>
              <div className="relative">
                <select
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {[1000, 5000, 10000, 25000, 50000, 100000].map((n) => (
                    <option key={n} value={n}>{n.toLocaleString()} paths</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => simulateMutation.mutate()}
              disabled={simulateMutation.isPending}
              className="w-full h-9 rounded bg-[#c9b787]/20 border border-[#c9b787]/30 text-[var(--gi-accent-amber)] text-[12px] font-semibold hover:bg-[#c9b787]/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {simulateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run Simulation
            </button>
          </div>

          {currentScenario && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Input Distributions</p>
              {currentScenario.inputs.map((inp) => (
                <div key={inp.id} className="rounded border border-white/[0.04] bg-white/[0.01] p-2 space-y-0.5">
                  <p className="text-[11px] text-white/60">{inp.label}</p>
                  <p className="text-[9px] text-white/30 font-mono">
                    {inp.distribution.type}
                    {inp.distribution.mean !== undefined ? ` μ=${inp.distribution.mean}` : ''}
                    {inp.distribution.stdDev !== undefined ? ` σ=${inp.distribution.stdDev}` : ''}
                    {inp.distribution.min !== undefined ? ` min=${inp.distribution.min}` : ''}
                    {inp.distribution.max !== undefined ? ` max=${inp.distribution.max}` : ''}
                    {inp.distribution.mode !== undefined ? ` mode=${inp.distribution.mode}` : ''}
                    {inp.distribution.lambda !== undefined ? ` λ=${inp.distribution.lambda}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!result && !simulateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/20 text-[12px]">
              <Dice5 className="w-8 h-8 mb-2 text-[var(--gi-accent-amber)]/20" />
              Select a scenario and run a simulation
            </div>
          )}

          {simulateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Loader2 className="w-5 h-5 text-[var(--gi-accent-amber)] animate-spin" />
              <p className="text-[11px] text-white/30 mt-2">Running {iterations.toLocaleString()} iterations...</p>
            </div>
          )}

          {result && (
            <>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-white/50">
                  <span className="font-mono">{result.validIterations.toLocaleString()} / {result.iterations.toLocaleString()} valid paths</span>
                  <span className="text-white/20">|</span>
                  <span className="font-mono">{result.durationMs}ms</span>
                  <span className="text-white/20">|</span>
                  <span className="font-mono">{(result.constraintViolationRate * 100).toFixed(2)}% violations</span>
                </div>
                <span className="text-[9px] text-white/20 font-mono">{result.simulationId}</span>
              </div>

              {result.outputs.length > 1 && (
                <div className="flex gap-2">
                  {result.outputs.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOutput(o.id)}
                      className={cn(
                        'px-3 py-1.5 rounded text-[11px] font-medium border transition-colors',
                        selectedOutput === o.id || (!selectedOutput && o.id === result.outputs[0]?.id)
                          ? 'border-[#c9b787]/30 bg-[#c9b787]/10 text-[var(--gi-accent-amber)]'
                          : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/60',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {activeOutput && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">MEAN</p>
                      <p className="text-lg font-mono text-white/90 mt-0.5">{fmt(activeOutput.mean, activeOutput.unit)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">MEDIAN (P50)</p>
                      <p className="text-lg font-mono text-white/90 mt-0.5">{fmt(activeOutput.median, activeOutput.unit)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">STD DEV</p>
                      <p className="text-lg font-mono text-white/90 mt-0.5">{fmt(activeOutput.stdDev, activeOutput.unit)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">P5 (DOWNSIDE)</p>
                      <p className="text-lg font-mono text-red-400/80 mt-0.5">{fmt(activeOutput.percentiles.p5 ?? 0, activeOutput.unit)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">P95 (UPSIDE)</p>
                      <p className="text-lg font-mono text-emerald-400/80 mt-0.5">{fmt(activeOutput.percentiles.p95 ?? 0, activeOutput.unit)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">RANGE</p>
                      <p className="text-lg font-mono text-white/90 mt-0.5">{fmt(activeOutput.max - activeOutput.min, activeOutput.unit)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <HistogramChart bins={activeOutput.histogram} label={activeOutput.label} />
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <BandChart bands={activeOutput.probabilityBands} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <CdfChart data={activeOutput.cdf} />
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <TornadoChart entries={result.sensitivityTornado} baseValue={activeOutput.mean} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Percentile Table</p>
                    <div className="grid grid-cols-9 gap-2">
                      {Object.entries(activeOutput.percentiles).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <p className="text-[9px] text-white/30 font-mono uppercase">{key}</p>
                          <p className="text-[11px] font-mono text-white/70">{fmt(val, activeOutput.unit)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Distribution Metrics</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                      <div>
                        <p className="text-white/30">Skewness</p>
                        <p className="font-mono text-white/70 flex items-center gap-1">
                          {activeOutput.skewness > 0.1 ? <TrendingUp className="w-3 h-3 text-amber-400/60" /> : activeOutput.skewness < -0.1 ? <TrendingDown className="w-3 h-3 text-sky-400/60" /> : null}
                          {activeOutput.skewness.toFixed(3)}
                          <span className="text-white/20 ml-1">
                            ({activeOutput.skewness > 0.5 ? 'right-skewed' : activeOutput.skewness < -0.5 ? 'left-skewed' : 'symmetric'})
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-white/30">Kurtosis</p>
                        <p className="font-mono text-white/70">
                          {activeOutput.kurtosis.toFixed(3)}
                          <span className="text-white/20 ml-1">
                            ({activeOutput.kurtosis > 1 ? 'heavy tails' : activeOutput.kurtosis < -1 ? 'light tails' : 'mesokurtic'})
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-white/30">Coefficient of Variation</p>
                        <p className="font-mono text-white/70">
                          {activeOutput.mean !== 0 ? ((activeOutput.stdDev / Math.abs(activeOutput.mean)) * 100).toFixed(1) : '—'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-white/30">Inter-Quartile Range</p>
                        <p className="font-mono text-white/70">
                          {fmt((activeOutput.percentiles.p75 ?? 0) - (activeOutput.percentiles.p25 ?? 0), activeOutput.unit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
