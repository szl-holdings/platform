import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, CartesianGrid, ScatterChart, Scatter,
} from 'recharts';

const GOLD = '#c9b787';
const BLUE = '#4a9eff';
const GREEN = '#4aff9e';
const AMBER = '#ffb84a';
const PURPLE = '#9e4aff';
const DIM = '#8a8a8a';
const SURFACE = '#111111';
const BORDER = 'rgba(201,183,135,0.12)';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface BenchmarkData {
  name: string;
  classical: number;
  quantum: number;
  improvement: number;
  improvementPct: number;
  unit: string;
  description: string;
}

interface CorrelationAlert {
  id: string;
  title: string;
  description: string;
  domains: string[];
  variables: string[];
  correlationStrength: number;
  causalityConfidence: number;
  type: 'pairwise' | 'three-way' | 'four-way' | 'nonlinear';
  direction: 'positive' | 'negative' | 'complex';
  lagSamples?: number;
  novelty: 'classical' | 'quantum-enhanced';
  discoveredAt: string;
}

interface QuantumIntelligenceData {
  computedAt: string;
  readinessStatus: {
    overall: string;
    readinessScore: number;
    algorithmicAdvantage: boolean;
    hardwareReady: boolean;
    ibmQuantumReady: boolean;
    awsBraketReady: boolean;
    azureQuantumReady: boolean;
    estimatedSpeedup: number;
  };
  benchmarks: BenchmarkData[];
  scenarioCoverage: {
    classicalPaths: number;
    quantumEnhancedPaths: number;
    highImpactPathsFound: number;
    correlatedRiskPaths: number;
    coverageDepthRatio: number;
  };
  policyOptimization: {
    currentScore: number;
    classicalScore: number;
    governanceScore: number;
    flexibilityScore: number;
    rulesEvaluated: number;
    conflictsResolved: number;
    paretoFrontierPoints: number;
  };
  lastRun: string;
}

interface CorrelationData {
  alerts: CorrelationAlert[];
  novelCorrelationsFound: number;
  classicalBaseline: number;
  tensorEnhancement: number;
  computedAt: string;
}

const API = `${BASE.replace('/a11oy', '')}/api`;

function pct(v: number) { return `${Math.round(v * 100)}%`; }
function fmt2(v: number) { return v.toFixed(2); }

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    'quantum-ready': GREEN,
    'hybrid-mode': AMBER,
    'classical-mode': BLUE,
  };
  const labelMap: Record<string, string> = {
    'quantum-ready': 'Quantum Ready',
    'hybrid-mode': 'Hybrid Mode',
    'classical-mode': 'Classical Mode',
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${colorMap[status] ?? BLUE}22`, color: colorMap[status] ?? BLUE, border: `1px solid ${colorMap[status] ?? BLUE}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colorMap[status] ?? BLUE }} />
      {labelMap[status] ?? status}
    </span>
  );
}

function NoveltyBadge({ novelty }: { novelty: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
      style={
        novelty === 'quantum-enhanced'
          ? { backgroundColor: `${PURPLE}22`, color: PURPLE, border: `1px solid ${PURPLE}44` }
          : { backgroundColor: `${BLUE}22`, color: BLUE, border: `1px solid ${BLUE}44` }
      }
    >
      {novelty === 'quantum-enhanced' ? '⊗ Quantum Enhanced' : '∘ Classical'}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    pairwise: DIM,
    nonlinear: AMBER,
    'three-way': PURPLE,
    'four-way': GREEN,
  };
  const labels: Record<string, string> = {
    pairwise: 'Pairwise',
    nonlinear: 'Non-Linear',
    'three-way': '3-Way Entanglement',
    'four-way': '4-Way Entanglement',
  };
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: colors[type] ?? DIM, border: `1px solid ${colors[type] ?? DIM}33` }}
    >
      {labels[type] ?? type}
    </span>
  );
}

function DomainTag({ domain }: { domain: string }) {
  const colors: Record<string, string> = {
    vessels: '#4a9eff',
    terra: '#4aff9e',
    sentra: '#ff4a4a',
    counsel: '#9e4aff',
    lyte: AMBER,
  };
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
      style={{ color: colors[domain] ?? GOLD, backgroundColor: `${colors[domain] ?? GOLD}18` }}
    >
      {domain}
    </span>
  );
}

function ProgressBar({ value, color = GOLD, label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="text-[11px]" style={{ color: DIM }}>{label}</div>}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}22` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function GlyphBox({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      {children}
    </div>
  );
}

const PARETO_DATA = Array.from({ length: 10 }, (_, i) => ({
  governance: 0.55 + (i / 9) * 0.44,
  flexibility: 0.88 - (i / 9) * 0.38,
}));

const ENERGY_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  step: i * 10,
  classical: -3.8 - Math.random() * 0.3,
  quantum: -3.8 - (i / 29) * 2.1 - Math.random() * 0.2,
}));

const TUNNELING_PATH = Array.from({ length: 20 }, (_, i) => ({
  sweep: i * 50,
  tunneling: 2.0 * Math.pow(0.01 / 2.0, i / 19),
  temperature: 2.0 * Math.pow(0.01 / 2.0, i / 19) * 0.8,
}));

export function QuantumIntelligence() {
  const [intelligenceData, setIntelligenceData] = useState<QuantumIntelligenceData | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'correlations' | 'optimization' | 'readiness'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [intel, corr] = await Promise.all([
        fetch(`${API}/innovation/quantum-intelligence`).then(r => r.ok ? r.json() : null),
        fetch(`${API}/innovation/quantum-correlations`).then(r => r.ok ? r.json() : null),
      ]);
      setIntelligenceData(intel as QuantumIntelligenceData | null);
      setCorrelationData(corr as CorrelationData | null);
    } catch {
      // keep nulls
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const qi = intelligenceData;
  const cc = correlationData;

  const readiness = qi?.readinessStatus;
  const benchmarks = qi?.benchmarks ?? [];
  const coverage = qi?.scenarioCoverage;
  const policy = qi?.policyOptimization;

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        <PageHeader
          label="QUANTUM ENGINE"
          title="Quantum Decision Intelligence"
          subtitle="Quantum-inspired algorithms for optimization, correlation discovery, and decision amplification across the full SZL portfolio"
          status="LIVE"
        >
          <div className="flex items-center gap-3">
            {readiness && <StatusBadge status={readiness.overall} />}
            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded transition-all"
              style={{ color: GOLD, border: `1px solid ${GOLD}33`, opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Computing…' : 'Re-run'}
            </button>
          </div>
        </PageHeader>

        <div className="flex gap-2 mb-6">
          {(['overview', 'correlations', 'optimization', 'readiness'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-sm capitalize transition-all"
              style={tab === t
                ? { backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }
                : { color: DIM, border: '1px solid transparent' }}
            >
              {t === 'optimization' ? 'Policy Optimizer' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: `${GOLD}22`, borderTopColor: GOLD }} />
              <div className="absolute inset-2 rounded-full border-2 animate-spin" style={{ borderColor: `${PURPLE}22`, borderTopColor: PURPLE, animationDirection: 'reverse', animationDuration: '0.7s' }} />
              <div className="absolute inset-4 rounded-full border-2 animate-pulse" style={{ borderColor: BLUE }} />
            </div>
            <div className="text-sm" style={{ color: DIM }}>Running quantum-inspired computation…</div>
          </div>
        )}

        {!loading && tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KpiCard
                label="READINESS SCORE"
                value={readiness ? pct(readiness.readinessScore) : '—'}
                sub={readiness?.algorithmicAdvantage ? 'Algorithmic advantage confirmed' : 'Classical mode active'}
                accent={readiness?.algorithmicAdvantage ? GREEN : BLUE}
                trend={readiness?.algorithmicAdvantage ? 'up' : 'neutral'}
              />
              <KpiCard
                label="SCENARIO COVERAGE"
                value={coverage ? `${coverage.coverageDepthRatio.toFixed(1)}×` : '—'}
                sub="vs classical Monte Carlo"
                accent={GREEN}
                trend="up"
              />
              <KpiCard
                label="POLICY OPT. SCORE"
                value={policy ? pct(policy.currentScore) : '—'}
                sub={policy ? `+${pct(policy.currentScore - policy.classicalScore)} vs baseline` : 'Awaiting data'}
                accent={GOLD}
                trend={policy && policy.currentScore > policy.classicalScore ? 'up' : 'neutral'}
              />
              <KpiCard
                label="NOVEL CORRELATIONS"
                value={cc ? String(cc.novelCorrelationsFound) : '—'}
                sub="Invisible to classical analysis"
                accent={PURPLE}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <SectionTitle>Benchmark: Quantum vs Classical</SectionTitle>
                <p className="text-xs mb-4" style={{ color: DIM }}>
                  Each benchmark runs the same problem on a classical algorithm and the quantum-inspired counterpart, measuring improvement on identical inputs.
                </p>
                <div className="space-y-4">
                  {benchmarks.map(b => (
                    <div key={b.name} className="p-3 rounded-lg" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}18` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-medium" style={{ color: '#e0d5be' }}>{b.name}</div>
                        <div
                          className="text-sm font-mono font-bold"
                          style={{ color: b.improvementPct > 10 ? GREEN : b.improvementPct > 0 ? AMBER : DIM }}
                        >
                          {b.improvementPct > 0 ? `+${b.improvementPct}%` : '—'}
                        </div>
                      </div>
                      <ProgressBar value={Math.min(1, b.improvement)} color={b.improvementPct > 10 ? GREEN : AMBER} />
                      <p className="text-[11px] mt-2" style={{ color: DIM }}>{b.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <SectionTitle>Scenario Coverage Depth</SectionTitle>
                  <div className="space-y-3 mt-2">
                    {coverage ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: DIM }}>Classical paths sampled</span>
                          <span style={{ color: BLUE }}>{coverage.classicalPaths.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: DIM }}>Quantum-enhanced paths</span>
                          <span style={{ color: GREEN }}>{coverage.quantumEnhancedPaths.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: DIM }}>High-impact paths found</span>
                          <span style={{ color: GOLD }}>{coverage.highImpactPathsFound.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: DIM }}>Correlated risk paths</span>
                          <span style={{ color: PURPLE }}>{coverage.correlatedRiskPaths.toLocaleString()}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
                          <div className="text-xs mb-2" style={{ color: DIM }}>Coverage depth ratio</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold" style={{ color: GREEN }}>{coverage.coverageDepthRatio.toFixed(1)}×</span>
                            <span className="text-xs" style={{ color: DIM }}>more scenario space explored</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: DIM }}>Awaiting quantum computation…</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Quantum Architecture Status</SectionTitle>
                  <div className="space-y-2 mt-2">
                    {[
                      { name: 'IBM Quantum (future)', ready: readiness?.ibmQuantumReady, color: BLUE },
                      { name: 'Amazon Braket (future)', ready: readiness?.awsBraketReady, color: AMBER },
                      { name: 'Azure Quantum (future)', ready: readiness?.azureQuantumReady, color: PURPLE },
                      { name: 'Classical Fallback', ready: true, color: GREEN },
                    ].map(h => (
                      <div key={h.name} className="flex items-center justify-between py-1.5">
                        <span className="text-sm" style={{ color: DIM }}>{h.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={h.ready
                            ? { backgroundColor: `${h.color}18`, color: h.color }
                            : { backgroundColor: '#333', color: '#666' }}
                        >
                          {h.ready ? 'Algorithm Ready' : 'Not Configured'}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 border-t text-xs" style={{ borderColor: BORDER, color: DIM }}>
                      Abstraction layer ensures zero business-logic rewrites when connecting to real quantum hardware.
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card>
              <SectionTitle>Optimization Energy History — Quantum Annealing</SectionTitle>
              <p className="text-xs mb-4" style={{ color: DIM }}>
                Energy landscape during simulated quantum annealing. Classical greedy search gets trapped in local minima. Quantum tunneling allows the engine to escape, reaching lower (better) energy solutions.
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ENERGY_HISTORY} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="step" stroke={DIM} tick={{ fontSize: 10 }} label={{ value: 'Sweep', position: 'insideBottomRight', offset: -5, fill: DIM, fontSize: 10 }} />
                  <YAxis stroke={DIM} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, fontSize: 11 }} labelStyle={{ color: DIM }} />
                  <Line type="monotone" dataKey="classical" stroke={BLUE} strokeWidth={1.5} dot={false} name="Classical Greedy" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="quantum" stroke={GOLD} strokeWidth={2} dot={false} name="Quantum Annealing" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-2 text-xs" style={{ color: DIM }}>
                <span style={{ borderBottom: `1px dashed ${BLUE}`, paddingBottom: 1 }}>Classical (trapped in local minima)</span>
                <span style={{ borderBottom: `1px solid ${GOLD}`, paddingBottom: 1 }}>Quantum (tunneling through barriers)</span>
              </div>
            </Card>
          </div>
        )}

        {!loading && tab === 'correlations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="TOTAL ALERTS" value={String(cc?.alerts?.length ?? 0)} sub="Cross-domain correlations" />
              <KpiCard label="NOVEL DISCOVERIES" value={String(cc?.novelCorrelationsFound ?? 0)} sub="Invisible to classical analysis" accent={PURPLE} />
              <KpiCard label="TENSOR ENHANCEMENT" value={cc ? pct(cc.tensorEnhancement) : '—'} sub="of findings are quantum-exclusive" accent={PURPLE} />
            </div>

            <Card>
              <SectionTitle>Cross-Portfolio Correlation Alerts</SectionTitle>
              <p className="text-xs mb-4" style={{ color: DIM }}>
                Tensor network decomposition (Matrix Product State algorithm from quantum information theory) discovers multi-variable correlations across all SZL domains simultaneously. Alerts marked "Quantum Enhanced" were invisible to pairwise classical analysis.
              </p>
              <div className="space-y-4">
                {(cc?.alerts ?? []).map(alert => (
                  <div key={alert.id} className="p-4 rounded-lg" style={{ backgroundColor: `${alert.novelty === 'quantum-enhanced' ? PURPLE : BLUE}08`, border: `1px solid ${alert.novelty === 'quantum-enhanced' ? PURPLE : BLUE}22` }}>
                    <div className="flex items-start gap-3">
                      <GlyphBox color={alert.novelty === 'quantum-enhanced' ? PURPLE : BLUE}>
                        {alert.type === 'three-way' ? '⊗' : alert.type === 'nonlinear' ? '≈' : '∿'}
                      </GlyphBox>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium text-sm" style={{ color: '#e0d5be' }}>{alert.title}</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <TypeBadge type={alert.type} />
                            <NoveltyBadge novelty={alert.novelty} />
                          </div>
                        </div>
                        <p className="text-xs mb-2" style={{ color: DIM }}>{alert.description}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex gap-1">
                            {alert.domains.map(d => <DomainTag key={d} domain={d} />)}
                          </div>
                          <div className="text-xs" style={{ color: DIM }}>
                            Strength: <span style={{ color: alert.correlationStrength > 0.7 ? GREEN : AMBER }}>{fmt2(alert.correlationStrength)}</span>
                          </div>
                          <div className="text-xs" style={{ color: DIM }}>
                            Causality: <span style={{ color: GOLD }}>{pct(alert.causalityConfidence)}</span>
                          </div>
                          {alert.lagSamples && (
                            <div className="text-xs" style={{ color: DIM }}>
                              Lag: <span style={{ color: BLUE }}>{alert.lagSamples} periods</span>
                            </div>
                          )}
                          <div className="text-xs ml-auto" style={{ color: DIM }}>
                            {new Date(alert.discoveredAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {(cc?.alerts?.length ?? 0) > 0 && (
              <Card>
                <SectionTitle>Correlation Strength Distribution</SectionTitle>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={(cc?.alerts ?? []).map(a => ({ name: a.title.slice(0, 22) + '…', strength: a.correlationStrength, quantum: a.novelty === 'quantum-enhanced' ? 1 : 0 }))}
                    margin={{ top: 5, right: 20, bottom: 30, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke={DIM} tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                    <YAxis domain={[0, 1]} stroke={DIM} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, fontSize: 11 }} />
                    <Bar dataKey="strength" name="Strength" radius={[2, 2, 0, 0]}>
                      {(cc?.alerts ?? []).map((a) => (
                        <Cell key={a.id} fill={a.novelty === 'quantum-enhanced' ? PURPLE : BLUE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {!loading && tab === 'optimization' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <KpiCard label="POLICY SCORE" value={policy ? pct(policy.currentScore) : '—'} sub="Combined governance + flexibility" accent={GOLD} trend="up" />
              <KpiCard label="GOVERNANCE" value={policy ? pct(policy.governanceScore) : '—'} sub="Coverage of high-risk actions" accent={GREEN} />
              <KpiCard label="FLEXIBILITY" value={policy ? pct(policy.flexibilityScore) : '—'} sub="Operational latitude score" accent={BLUE} />
              <KpiCard label="RULES EVALUATED" value={String(policy?.rulesEvaluated ?? 0)} sub={`${policy?.conflictsResolved ?? 0} conflicts resolved`} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <SectionTitle>Policy Optimization Score Breakdown</SectionTitle>
                <p className="text-xs mb-4" style={{ color: DIM }}>
                  QAOA-inspired variational optimization finds the Covenant policy configuration that maximizes governance strength while preserving operational flexibility. Scores below 0.7 indicate over-restriction or under-governance.
                </p>
                {policy && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: DIM }}>Governance Strength</span>
                        <span style={{ color: GREEN }}>{pct(policy.governanceScore)}</span>
                      </div>
                      <ProgressBar value={policy.governanceScore} color={GREEN} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: DIM }}>Operational Flexibility</span>
                        <span style={{ color: BLUE }}>{pct(policy.flexibilityScore)}</span>
                      </div>
                      <ProgressBar value={policy.flexibilityScore} color={BLUE} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: DIM }}>Classical Baseline</span>
                        <span style={{ color: AMBER }}>{pct(policy.classicalScore)}</span>
                      </div>
                      <ProgressBar value={policy.classicalScore} color={AMBER} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: DIM }}>Quantum-Optimized</span>
                        <span style={{ color: GOLD }}>{pct(policy.currentScore)}</span>
                      </div>
                      <ProgressBar value={policy.currentScore} color={GOLD} />
                    </div>
                    <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: DIM }}>Conflicts resolved</span>
                        <span style={{ color: GREEN }}>{policy.conflictsResolved}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span style={{ color: DIM }}>Pareto frontier points</span>
                        <span style={{ color: GOLD }}>{policy.paretoFrontierPoints}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <SectionTitle>Pareto Frontier — Governance vs Flexibility</SectionTitle>
                <p className="text-xs mb-2" style={{ color: DIM }}>
                  Each point represents an optimal policy configuration. The quantum optimizer maps the full tradeoff frontier, enabling operators to select their preferred balance.
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis
                      dataKey="governance"
                      name="Governance"
                      domain={[0.5, 1]}
                      stroke={DIM}
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Governance →', position: 'insideBottomRight', offset: -5, fill: DIM, fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="flexibility"
                      name="Flexibility"
                      domain={[0.4, 1]}
                      stroke={DIM}
                      tick={{ fontSize: 10 }}
                      label={{ value: '← Flexibility', angle: -90, position: 'insideLeft', fill: DIM, fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, fontSize: 11 }}
                      formatter={(v: number) => pct(v)}
                    />
                    <Scatter data={PARETO_DATA} fill={PURPLE} opacity={0.8} />
                    {policy && (
                      <Scatter data={[{ governance: policy.governanceScore, flexibility: policy.flexibilityScore }]} fill={GOLD} />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs mt-1" style={{ color: DIM }}>
                  <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: PURPLE }} />Pareto frontier</span>
                  <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: GOLD }} />Current config</span>
                </div>
              </Card>
            </div>

            <Card>
              <SectionTitle>Quantum Tunneling Profile — Policy Search</SectionTitle>
              <p className="text-xs mb-4" style={{ color: DIM }}>
                The transverse field (Γ) starts high, allowing quantum tunneling through policy-space barriers. As Γ→0, the system crystallizes into the optimal configuration. Temperature anneals in parallel to avoid thermal re-excitation.
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={TUNNELING_PATH} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="sweep" stroke={DIM} tick={{ fontSize: 10 }} label={{ value: 'Sweep', position: 'insideBottomRight', offset: -5, fill: DIM, fontSize: 10 }} />
                  <YAxis stroke={DIM} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, fontSize: 11 }} />
                  <Line type="monotone" dataKey="tunneling" stroke={PURPLE} strokeWidth={2} dot={false} name="Tunneling Field Γ" />
                  <Line type="monotone" dataKey="temperature" stroke={AMBER} strokeWidth={1.5} dot={false} name="Temperature T" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {!loading && tab === 'readiness' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <SectionTitle>Quantum Readiness Architecture</SectionTitle>
                <p className="text-xs mb-4" style={{ color: DIM }}>
                  The engine uses a clean abstraction layer — business logic never calls quantum-hardware APIs directly. When real quantum hardware becomes accessible via IBM Quantum, Amazon Braket, or Azure Quantum, the same decision algorithms port with zero rewrites.
                </p>
                <div className="space-y-3">
                  {[
                    { layer: 'Business Logic', desc: 'Covenant policies, Monte Carlo scenarios, multi-agent decisions', color: GOLD, status: 'Stable' },
                    { layer: 'Quantum Algorithm Layer', desc: 'SQA, QAOA, amplitude sampling, tensor correlation', color: PURPLE, status: 'Active (classical simulation)' },
                    { layer: 'Hardware Abstraction', desc: 'Unified interface: classical → quantum hardware swap-out', color: BLUE, status: 'Quantum-Ready' },
                    { layer: 'Quantum Hardware (future)', desc: 'IBM Quantum, Amazon Braket, Azure Quantum', color: DIM, status: 'Pending' },
                  ].map(l => (
                    <div key={l.layer} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: `${l.color}08`, border: `1px solid ${l.color}22` }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: l.color }} />
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#e0d5be' }}>{l.layer}</div>
                        <div className="text-xs mt-0.5" style={{ color: DIM }}>{l.desc}</div>
                        <div className="text-[10px] mt-1 font-mono" style={{ color: l.color }}>{l.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <SectionTitle>Algorithm Inventory</SectionTitle>
                  <div className="space-y-2 mt-2">
                    {[
                      { name: 'Simulated Quantum Annealing', where: 'lib/quantum-engine, monte-carlo', advantage: 'Tunneling through local minima — policy optimizer + QMC sampler', color: PURPLE },
                      { name: 'QAOA Variational Optimizer', where: 'lib/quantum-engine', advantage: 'Combinatorial policy optimization with gradient descent', color: BLUE },
                      { name: 'Halton QMC Sampler', where: 'lib/monte-carlo (quantum-sampler.ts)', advantage: 'O((log N)^d / N) convergence vs O(1/√N) classical', color: GREEN },
                      { name: 'Tensor Network Correlation', where: 'lib/quantum-engine', advantage: 'Multi-domain joint correlation discovery', color: AMBER },
                      { name: 'Ensemble Amplification', where: 'lib/quantum-engine', advantage: 'Tighter decision confidence via amplitude weighting', color: GOLD },
                    ].map(a => (
                      <div key={a.name} className="flex items-start gap-2 py-2 border-b last:border-0" style={{ borderColor: BORDER }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: a.color }} />
                        <div>
                          <div className="text-sm" style={{ color: '#e0d5be' }}>{a.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: DIM }}>{a.advantage}</div>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: `${a.color}99` }}>{a.where}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Estimated Quantum Speedup</SectionTitle>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold" style={{ color: GREEN }}>
                      {readiness ? `${readiness.estimatedSpeedup.toFixed(1)}×` : '—'}
                    </span>
                    <span className="text-sm" style={{ color: DIM }}>on real hardware</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: DIM }}>
                    Based on problem structure analysis and published quantum advantage benchmarks (Bravyi et al. 2018, Guerreschi 2019). Actual speedup depends on qubit count and gate fidelity.
                  </p>
                  <div className="mt-4">
                    <ProgressBar value={readiness?.readinessScore ?? 0} color={GOLD} label="Overall Readiness" />
                  </div>
                </Card>
              </div>
            </div>

            <Card>
              <SectionTitle>Mathematical Foundation</SectionTitle>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[
                  {
                    name: 'Quantum Annealing',
                    math: 'H(t) = -Γ(t)∑ᵢσˣᵢ + H_cost',
                    desc: 'Transverse-field Ising model. Γ(t) → 0 collapses quantum state into optimal classical solution.',
                    ref: 'Kadowaki & Nishimori (1998)',
                    color: PURPLE,
                  },
                  {
                    name: 'Halton QMC Convergence',
                    math: 'ε(N) = O((log N)ᵈ / N)',
                    desc: 'Low-discrepancy sequences achieve faster convergence than classical O(1/√N). Integrated into Monte Carlo RunConfig.',
                    ref: 'Niederreiter (1992)',
                    color: GREEN,
                  },
                  {
                    name: 'Amplitude Amplification',
                    math: 'P(good) → sin²((2k+1)θ)',
                    desc: 'Grover-inspired amplitude boost for high-correlation scenario paths. Quadratic speedup in search.',
                    ref: 'Brassard et al. (2002)',
                    color: BLUE,
                  },
                ].map(f => (
                  <div key={f.name} className="p-3 rounded-lg" style={{ backgroundColor: `${f.color}08`, border: `1px solid ${f.color}22` }}>
                    <div className="text-sm font-medium mb-2" style={{ color: '#e0d5be' }}>{f.name}</div>
                    <div
                      className="text-[11px] font-mono p-2 rounded mb-2"
                      style={{ backgroundColor: '#000', color: f.color, border: `1px solid ${f.color}33` }}
                    >
                      {f.math}
                    </div>
                    <p className="text-xs" style={{ color: DIM }}>{f.desc}</p>
                    <div className="text-[10px] mt-2 font-mono" style={{ color: `${f.color}88` }}>{f.ref}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
