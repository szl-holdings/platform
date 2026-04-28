import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronRight,
  Database,
  Download,
  GitBranch,
  Globe,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const ACCENT = '#6366f1';

// ---------------------------------------------------------------------------
// Types — mirrored from intelligence-economics.ts response shapes
// ---------------------------------------------------------------------------

interface DimensionScore {
  name: string;
  score: number;
  color: string;
}

interface AgentSummary {
  name: string;
  domain: string;
  color: string;
  valueMM: number;
}

interface MoatSummaryItem {
  label: string;
  value: string;
  color: string;
}

interface OverviewResponse {
  ecosystemScore: number;
  totalValueMM: number;
  totalDecisions: number;
  avgCalibration: number;
  activeAgents: number;
  crossDomainChains: number;
  learningVelocityPct: number;
  dimensionScores: DimensionScore[];
  topAgents: AgentSummary[];
  moatSummary: MoatSummaryItem[];
}

interface AgentEconomyAgent {
  name: string;
  domain: string;
  color: string;
  role: string;
  valueMM: number;
  costSavedK: number;
  decisions: number;
  acceptanceRate: number;
}

interface AgentEconomyByDomain {
  domain: string;
  color: string;
  valueMM: number;
  decisions: number;
}

interface AgentEconomyResponse {
  range: string;
  summary: {
    totalValueMM: number;
    costAvoidedK: number;
    totalDecisions: number;
    acceptanceRate: number;
  };
  agents: AgentEconomyAgent[];
  byDomain: AgentEconomyByDomain[];
}

interface CompoundChainStep {
  domain: string;
  agent: string;
  action: string;
  valueAddK?: number;
}

interface CompoundChain {
  id: string;
  title: string;
  description: string;
  domains: string[];
  compoundValueK: number;
  compoundingFactor: number;
  steps: CompoundChainStep[];
  outcome: string;
  triggeredAt?: string;
  status?: string;
}

interface CompoundMapResponse {
  dataSource: 'live_database' | 'illustrative';
  summary: {
    activeChains: number;
    avgChainValueK: number;
    compoundingFactor: number;
  };
  chains: CompoundChain[];
}

interface CalibrationBand {
  label: string;
  predicted: number;
  actual: number;
}

interface CalibrationAgent {
  name: string;
  domain: string;
  calibrationScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  improvementPct: number;
  brierScore: string;
  eceScore: string;
  flag: string | null;
  bands: CalibrationBand[];
}

interface CalibrationResponse {
  summary: {
    avgCalibration: number;
    wellCalibratedCount: number;
    overconfidentCount: number;
    improvingCount: number;
  };
  agents: CalibrationAgent[];
}

interface Integration {
  name: string;
  type: 'feed' | 'mcp' | 'api';
  description: string;
  health: 'healthy' | 'degraded' | 'down';
  trustScore: number;
  uptimePct: number;
  latencyMs: number;
  signalCount: number;
  dataQuality: number;
  policyCompliance: number;
}

interface TrustRegistryResponse {
  dataSource: 'live_database' | 'illustrative';
  summary: {
    total: number;
    avgTrustScore: number;
    criticalIssues: number;
    signalSources: number;
  };
  integrations: Integration[];
}

interface HistoryPoint {
  period: string;
  entities?: number;
  rate?: number;
  overrideRate?: number;
  score?: number;
}

interface LearningVelocityResponse {
  summary: {
    memoryEntities: number;
    memoryGrowthPct: number;
    overrideDeclineRate: number;
    calibrationDelta: number;
    moatStatement: string;
  };
  memoryGrowth: Array<{ period: string; entities: number }>;
  acceptanceHistory: Array<{ period: string; rate: number }>;
  overrideHistory: Array<{ period: string; overrideRate: number }>;
  calibrationHistory: Array<{ period: string; score: number }>;
}

interface ProvenanceDecision {
  id: string;
  title: string;
  domain: string;
  description: string;
  status: string;
  decidedAt: string;
  provenanceItems: string[];
  eventHash?: string;
  dataSource?: 'live_database' | 'illustrative';
}

interface ProvenanceResponse {
  decisions: ProvenanceDecision[];
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

function fetchIE(path: string): Promise<unknown> {
  return fetch(`${BASE}/intelligence-economics${path}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function MetricTile({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ borderColor: `${color}20`, background: `${color}06` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
    </div>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ * 0.25}
            style={{ filter: `drop-shadow(0 0 8px ${scoreColor}60)` }} />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-white leading-none">{score}</span>
          <span className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${scoreColor}18`, color: scoreColor }}>
        {score >= 80 ? 'Elite' : score >= 60 ? 'Good' : 'Needs Attention'}
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function DataSourceBadge({ dataSource }: { dataSource?: 'live_database' | 'illustrative' }) {
  if (!dataSource) return null;
  const isLive = dataSource === 'live_database';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold border"
      style={{
        borderColor: isLive ? '#10b98130' : '#f59e0b30',
        background: isLive ? '#10b98108' : '#f59e0b08',
        color: isLive ? '#10b981' : '#f59e0b',
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: isLive ? '#10b981' : '#f59e0b' }} />
      {isLive ? 'Live data' : 'Illustrative'}
    </span>
  );
}

function TabLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

function getDomainColor(domain: string): string {
  const colors: Record<string, string> = {
    SEXTANT: '#4d8fcc', vessels: '#4d8fcc',
    DOMAINE: '#10b981', terra: '#10b981',
    PARAGON: '#ef4444', aegis: '#ef4444',
    Counsel: '#8b5cf6', counsel: '#8b5cf6',
    Sentra: '#f59e0b', sentra: '#f59e0b',
    KORA: '#6366f1', lyte: '#6366f1',
    Praxis: '#ec4899', praxis: '#ec4899',
  };
  return colors[domain] ?? '#6366f1';
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function OverviewTab({ data }: { data: OverviewResponse | undefined }) {
  if (!data) return <TabLoading />;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="rounded-2xl border p-8 flex flex-col items-center gap-4"
          style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}06`, minWidth: 200 }}>
          <ScoreRing score={data.ecosystemScore} label="Ecosystem Intelligence Score" />
          <div className="text-center text-[10px] max-w-[180px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Composite across 6 intelligence dimensions
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricTile label="Value Generated" value={`$${data.totalValueMM}M`} sub="Prevented losses & savings" color="#10b981" icon={TrendingUp} />
          <MetricTile label="Governed Decisions" value={data.totalDecisions.toLocaleString()} sub="This quarter" color={ACCENT} icon={Brain} />
          <MetricTile label="Avg Calibration" value={`${data.avgCalibration}%`} sub="Confidence accuracy" color="#f59e0b" icon={Target} />
          <MetricTile label="Active Agents" value={data.activeAgents} sub="Across all domains" color="var(--gi-accent-blue)" icon={Zap} />
          <MetricTile label="Intelligence Chains" value={data.crossDomainChains} sub="Multi-domain correlations" color="#8b5cf6" icon={GitBranch} />
          <MetricTile label="Learning Velocity" value={`+${data.learningVelocityPct}%`} sub="QoQ improvement" color="#ec4899" icon={Activity} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {data.dimensionScores.map((d) => (
          <div key={d.name} className="rounded-xl border p-3 flex flex-col gap-1.5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-[9px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{d.name}</div>
            <div className="text-xl font-bold" style={{ color: d.color }}>{d.score}</div>
            <MiniBar value={d.score} max={100} color={d.color} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            Top Value Generators
          </div>
          <div className="space-y-2">
            {data.topAgents.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">{a.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${a.color}15`, color: a.color }}>{a.domain}</span>
                </div>
                <span className="font-semibold text-emerald-400">${a.valueMM}M</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Intelligence Moat Summary
          </div>
          <div className="space-y-2 text-xs">
            {data.moatSummary.map((m) => (
              <div key={m.label} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: m.color }} />
                <div>
                  <span className="text-white/70">{m.label}</span>
                  <span className="ml-2 text-white/40">{m.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimeRange = '7d' | '30d' | '90d';

function AgentEconomyTab({
  data,
  range,
  onRangeChange,
}: {
  data: AgentEconomyResponse | undefined;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}) {
  if (!data) return <TabLoading />;
  const maxValue = Math.max(...data.agents.map((a) => a.valueMM), 0.1);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/40">Economic impact per agent — track ROI, acceptance rate, and decision velocity</div>
        <div className="flex items-center gap-1">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button key={r} onClick={() => onRangeChange(r)}
              className="px-2.5 py-1 rounded text-[10px] border transition-all"
              style={{
                borderColor: range === r ? `${ACCENT}40` : 'rgba(255,255,255,0.07)',
                background: range === r ? `${ACCENT}12` : 'transparent',
                color: range === r ? ACCENT : 'rgba(255,255,255,0.35)',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Total Value" value={`$${data.summary.totalValueMM}M`} sub="Revenue protected" color="#10b981" icon={TrendingUp} />
        <MetricTile label="Cost Avoided" value={`$${data.summary.costAvoidedK}K`} sub="Operational savings" color="#f59e0b" icon={Shield} />
        <MetricTile label="Decisions Made" value={data.summary.totalDecisions.toLocaleString()} color={ACCENT} icon={Brain} />
        <MetricTile label="Acceptance Rate" value={`${data.summary.acceptanceRate}%`} sub="Operator agreement" color="#ec4899" icon={CheckCircle} />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b text-xs font-medium text-white/50 flex items-center gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="flex-1">Agent</span>
          <span className="w-16 text-right">Value</span>
          <span className="w-20 text-right">Cost Saved</span>
          <span className="w-16 text-right">Decisions</span>
          <span className="w-20 text-right">Acceptance</span>
          <span className="w-24 text-right">ROI Bar</span>
        </div>
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
          {data.agents.map((agent) => (
            <div key={agent.name} className="px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-white">{agent.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${agent.color}15`, color: agent.color }}>
                    {agent.domain}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{agent.role}</span>
              </div>
              <span className="w-16 text-right text-xs font-semibold text-emerald-400">${agent.valueMM}M</span>
              <span className="w-20 text-right text-xs text-amber-400">${agent.costSavedK}K</span>
              <span className="w-16 text-right text-xs text-white/60">{agent.decisions.toLocaleString()}</span>
              <span className="w-20 text-right text-xs font-semibold"
                style={{ color: agent.acceptanceRate >= 80 ? '#10b981' : '#f59e0b' }}>
                {agent.acceptanceRate}%
              </span>
              <div className="w-24">
                <MiniBar value={agent.valueMM} max={maxValue} color={agent.color} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="text-xs font-medium text-white mb-3">Economic Impact by Domain</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.byDomain.map((d) => {
            const maxDomainValue = Math.max(...data.byDomain.map((x) => x.valueMM), 0.1);
            return (
              <div key={d.domain} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: d.color }}>{d.domain}</span>
                  <span className="font-semibold text-white">${d.valueMM}M</span>
                </div>
                <MiniBar value={d.valueMM} max={maxDomainValue} color={d.color} />
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{d.decisions.toLocaleString()} decisions</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompoundIntelligenceTab({ data }: { data: CompoundMapResponse | undefined }) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  if (!data) return <TabLoading />;
  const selected = data.chains.find((c) => c.id === selectedChainId);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="text-xs text-white/40 flex-1">
          Cross-domain intelligence chains — signals that flow across domains and compound into greater-than-sum-of-parts value
        </div>
        <DataSourceBadge dataSource={data.dataSource} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MetricTile label="Active Chains" value={data.summary.activeChains} sub="Multi-domain intelligence" color="#8b5cf6" icon={GitBranch} />
        <MetricTile label="Avg Chain Value" value={`$${data.summary.avgChainValueK}K`} sub="Compound vs. isolated" color="#10b981" icon={TrendingUp} />
        <MetricTile label="Compounding Factor" value={`${data.summary.compoundingFactor}×`} sub="Multiplier vs. single-domain" color="#f59e0b" icon={Zap} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          {data.chains.map((chain) => (
            <button key={chain.id} onClick={() => setSelectedChainId(selectedChainId === chain.id ? null : chain.id)}
              className="w-full text-left rounded-xl border p-4 transition-all hover:border-opacity-60"
              style={{
                borderColor: selectedChainId === chain.id ? `${ACCENT}50` : 'rgba(255,255,255,0.07)',
                background: selectedChainId === chain.id ? `${ACCENT}06` : 'rgba(255,255,255,0.02)',
              }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white mb-0.5">{chain.title}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{chain.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-emerald-400">${chain.compoundValueK}K</div>
                  <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{chain.compoundingFactor}× compound</div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {chain.domains.map((domain, i) => (
                  <div key={domain} className="flex items-center gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: getDomainColor(domain) + '18', color: getDomainColor(domain) }}>
                      {domain}
                    </span>
                    {i < chain.domains.length - 1 && (
                      <ArrowRight className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    )}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 rounded-xl border p-4 space-y-4"
            style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}04` }}>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              Chain Trace
            </div>
            <div className="space-y-2">
              {selected.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: getDomainColor(step.domain) }}>
                      {i + 1}
                    </div>
                    {i < selected.steps.length - 1 && (
                      <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold" style={{ color: getDomainColor(step.domain) }}>{step.domain}</span>
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{step.agent}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.action}</div>
                    {step.valueAddK != null && (
                      <div className="text-[9px] mt-0.5 text-emerald-400">+${step.valueAddK}K value added</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: '#10b98120', background: '#10b98106' }}>
              <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">Compound Outcome</div>
              <div className="text-xs text-white/70">{selected.outcome}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CalibrationTab({ data }: { data: CalibrationResponse | undefined }) {
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  if (!data) return <TabLoading />;
  const agent = data.agents.find((a) => a.name === selectedAgentName) ?? data.agents[0];
  return (
    <div className="space-y-5">
      <div className="text-xs text-white/40">
        Per-agent confidence calibration — predicted confidence vs. actual outcome accuracy. Well-calibrated agents are trustworthy agents.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Avg Calibration" value={`${data.summary.avgCalibration}%`} sub="Fleet-wide score" color={ACCENT} icon={Target} />
        <MetricTile label="Well-Calibrated" value={data.summary.wellCalibratedCount} sub="Agents in range" color="#10b981" icon={CheckCircle} />
        <MetricTile label="Overconfident" value={data.summary.overconfidentCount} color="#ef4444" icon={AlertTriangle} />
        <MetricTile label="Improving" value={data.summary.improvingCount} sub="vs last quarter" color="#f59e0b" icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <div className="text-[10px] uppercase tracking-widest font-medium mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Select Agent
          </div>
          {data.agents.map((a) => {
            const isSelected = a.name === (selectedAgentName ?? data.agents[0]?.name);
            const calibColor = a.calibrationScore >= 85 ? '#10b981' : a.calibrationScore >= 70 ? '#f59e0b' : '#ef4444';
            return (
              <button key={a.name} onClick={() => setSelectedAgentName(a.name)}
                className="w-full text-left rounded-lg border px-3 py-2.5 transition-all"
                style={{
                  borderColor: isSelected ? `${calibColor}40` : 'rgba(255,255,255,0.07)',
                  background: isSelected ? `${calibColor}06` : 'rgba(255,255,255,0.02)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">{a.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.domain}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: calibColor }}>{a.calibrationScore}%</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {a.trend === 'improving' ? '↑ Improving' : a.trend === 'degrading' ? '↓ Degrading' : '→ Stable'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {agent && (
          <div className="lg:col-span-3 rounded-xl border p-5 space-y-4"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-white">{agent.name}</div>
                <div className="text-[10px] text-white/40 mt-0.5">Confidence vs. Actual Outcomes</div>
              </div>
              <div className="text-[10px] px-2 py-1 rounded-full font-semibold"
                style={{
                  background: agent.calibrationScore >= 85 ? '#10b98118' : agent.calibrationScore >= 70 ? '#f59e0b18' : '#ef444418',
                  color: agent.calibrationScore >= 85 ? '#10b981' : agent.calibrationScore >= 70 ? '#f59e0b' : '#ef4444',
                }}>
                {agent.calibrationScore}% calibrated
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span>Confidence Band</span>
                <span>Predicted</span>
                <span>Actual</span>
                <span>Gap</span>
              </div>
              {agent.bands.map((band) => {
                const gap = band.predicted - band.actual;
                const gapColor = Math.abs(gap) <= 5 ? '#10b981' : Math.abs(gap) <= 10 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={band.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{band.label}</span>
                      <span className="text-white/60">{band.predicted}%</span>
                      <span className="text-white/60">{band.actual}%</span>
                      <span className="font-semibold" style={{ color: gapColor }}>{gap > 0 ? '+' : ''}{gap}%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-white/10" style={{ width: `${band.predicted}%` }} />
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${band.actual}%`, background: gapColor + '80' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs text-white/40 mb-1">Brier Score</div>
                <div className="text-lg font-bold text-white">{agent.brierScore}</div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Lower is better</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs text-white/40 mb-1">ECE Score</div>
                <div className="text-lg font-bold text-white">{agent.eceScore}</div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Expected calibration error</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs text-white/40 mb-1">3-Month Trend</div>
                <div className="text-lg font-bold" style={{ color: agent.trend === 'improving' ? '#10b981' : '#ef4444' }}>
                  {agent.improvementPct >= 0 ? '+' : ''}{agent.improvementPct}%
                </div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Calibration score delta</div>
              </div>
            </div>
            {agent.flag && (
              <div className="rounded-lg border p-3 flex items-start gap-2.5" style={{ borderColor: '#ef444430', background: '#ef444406' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <div className="text-[10px] text-red-300">{agent.flag}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrustRegistryTab({ data }: { data: TrustRegistryResponse | undefined }) {
  const [filter, setFilter] = useState<'all' | 'mcp' | 'api' | 'feed'>('all');
  if (!data) return <TabLoading />;
  const integrations = filter === 'all' ? data.integrations : data.integrations.filter((i) => i.type === filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="text-xs text-white/40 flex-1">
          Integration trust scores — every MCP server, API, and data feed rated on uptime, latency, data quality, and policy compliance
        </div>
        <DataSourceBadge dataSource={data.dataSource} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Total Integrations" value={data.summary.total} color={ACCENT} icon={Globe} />
        <MetricTile label="Avg Trust Score" value={`${data.summary.avgTrustScore}%`} sub="Fleet average" color="#10b981" icon={Shield} />
        <MetricTile label="Critical Issues" value={data.summary.criticalIssues} sub="Below threshold" color="#ef4444" icon={AlertTriangle} />
        <MetricTile label="Signal Sources" value={data.summary.signalSources} sub="Active contributors" color="#f59e0b" icon={Database} />
      </div>
      <div className="flex items-center gap-1.5">
        {(['all', 'mcp', 'api', 'feed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded text-[10px] border uppercase tracking-wider transition-all"
            style={{
              borderColor: filter === f ? `${ACCENT}40` : 'rgba(255,255,255,0.07)',
              background: filter === f ? `${ACCENT}12` : 'transparent',
              color: filter === f ? ACCENT : 'rgba(255,255,255,0.35)',
            }}>
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {integrations.map((integration) => {
          const trustColor = integration.trustScore >= 90 ? '#10b981' : integration.trustScore >= 70 ? '#f59e0b' : '#ef4444';
          return (
            <div key={integration.name} className="rounded-xl border p-4"
              style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{integration.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                      {integration.type}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{
                      background: integration.health === 'healthy' ? '#10b981' : integration.health === 'degraded' ? '#f59e0b' : '#ef4444'
                    }} />
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{integration.health}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mb-2">{integration.description}</div>
                  <div className="flex flex-wrap gap-3 text-[10px]">
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Uptime: <span className="text-white/60">{integration.uptimePct}%</span></span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Latency: <span className="text-white/60">{integration.latencyMs}ms</span></span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Signals: <span className="text-white/60">{integration.signalCount.toLocaleString()}</span></span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Data Quality: <span className="text-white/60">{integration.dataQuality}%</span></span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Compliance: <span style={{ color: integration.policyCompliance >= 95 ? '#10b981' : '#f59e0b' }}>{integration.policyCompliance}%</span></span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <div className="text-2xl font-bold" style={{ color: trustColor }}>{integration.trustScore}</div>
                  <div className="text-[9px] font-semibold" style={{ color: trustColor }}>Trust Score</div>
                  <div className="w-16"><MiniBar value={integration.trustScore} max={100} color={trustColor} /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LearningVelocityTab({ data }: { data: LearningVelocityResponse | undefined }) {
  if (!data) return <TabLoading />;
  const maxMemory = Math.max(...data.memoryGrowth.map((p) => p.entities), 1);
  return (
    <div className="space-y-5">
      <div className="text-xs text-white/40">
        System-wide improvement metrics — the quantified proof that SZL is building an intelligence moat faster than any competitor
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Memory Fabric" value={data.summary.memoryEntities.toLocaleString()} sub="Entities stored" color={ACCENT} icon={Database} />
        <MetricTile label="Memory Growth" value={`+${data.summary.memoryGrowthPct}%`} sub="This quarter" color="#8b5cf6" icon={TrendingUp} />
        <MetricTile label="Override Rate" value={`${data.summary.overrideDeclineRate}%`} sub="↓ Declining (good)" color="#10b981" icon={CheckCircle} />
        <MetricTile label="Calibration ΔQ" value={`+${data.summary.calibrationDelta}pts`} sub="Quarter-over-quarter" color="#f59e0b" icon={Target} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-4 flex items-center gap-2">
            <Database className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            Memory Fabric Growth
          </div>
          <div className="space-y-2">
            {data.memoryGrowth.map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="w-12 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{point.period}</span>
                <div className="flex-1"><MiniBar value={point.entities} max={maxMemory} color={ACCENT} /></div>
                <span className="w-16 text-right text-[10px] font-mono text-white/50">{point.entities.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Recommendation Acceptance Rate
          </div>
          <div className="space-y-2">
            {data.acceptanceHistory.map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="w-12 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{point.period}</span>
                <div className="flex-1"><MiniBar value={point.rate} max={100} color="#10b981" /></div>
                <span className="w-10 text-right text-[10px] font-mono text-white/50">{point.rate}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Operator Override Decline Curve
          </div>
          <div className="space-y-2">
            {data.overrideHistory.map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="w-12 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{point.period}</span>
                <div className="flex-1"><MiniBar value={point.overrideRate} max={40} color="#f59e0b" /></div>
                <span className="w-10 text-right text-[10px] font-mono text-white/50">{point.overrideRate}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-xs font-medium text-white mb-4 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            Calibration Trajectory
          </div>
          <div className="space-y-2">
            {data.calibrationHistory.map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="w-12 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{point.period}</span>
                <div className="flex-1"><MiniBar value={point.score} max={100} color="#8b5cf6" /></div>
                <span className="w-10 text-right text-[10px] font-mono text-white/50">{point.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border p-4" style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}04` }}>
        <div className="text-xs font-medium mb-2" style={{ color: ACCENT }}>Intelligence Moat Statement</div>
        <p className="text-sm text-white/70 leading-relaxed">{data.summary.moatStatement}</p>
      </div>
    </div>
  );
}

function ProvenanceExportTab({ data }: { data: ProvenanceResponse | undefined }) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());
  if (!data) return <TabLoading />;

  async function handleExport(decisionId: string) {
    setExporting(decisionId);
    try {
      const resp = await fetch(`${BASE}/intelligence-economics/provenance-export/${decisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `provenance-${decisionId}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExported((prev) => new Set([...prev, decisionId]));
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-white/40">
        Generate governed audit packages — legal-grade decision provenance from signal to outcome, suitable for regulators, auditors, and boards
      </div>
      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: '#f59e0b25', background: '#f59e0b06' }}>
        <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-200/70 leading-relaxed">
          <span className="font-semibold text-amber-300">Legal-Grade Provenance</span> — Each export contains the complete signal-to-outcome chain: original signals, context retrieved, simulation runs, policy gates, operator approvals, and execution proof. Timestamped and deterministically reproducible.
        </div>
      </div>
      <div className="space-y-3">
        {data.decisions.map((decision) => (
          <div key={decision.id} className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white">{decision.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: getDomainColor(decision.domain) + '18', color: getDomainColor(decision.domain) }}>
                    {decision.domain}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border font-medium"
                    style={{
                      borderColor: decision.status === 'completed' ? '#10b98130' : '#f59e0b30',
                      color: decision.status === 'completed' ? '#10b981' : '#f59e0b',
                    }}>
                    {decision.status}
                  </span>
                </div>
                <div className="text-[10px] text-white/40 mb-2">{decision.description}</div>
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {decision.provenanceItems.map((item) => (
                    <span key={item} className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <ChevronRight className="w-2.5 h-2.5" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{decision.decidedAt}</div>
                <button
                  onClick={() => handleExport(decision.id)}
                  disabled={exporting === decision.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-50"
                  style={{
                    borderColor: exported.has(decision.id) ? '#10b98140' : `${ACCENT}40`,
                    background: exported.has(decision.id) ? '#10b98110' : `${ACCENT}10`,
                    color: exported.has(decision.id) ? '#10b981' : ACCENT,
                  }}>
                  {exporting === decision.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : exported.has(decision.id) ? <CheckCircle className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                  {exported.has(decision.id) ? 'Exported' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'economy', label: 'Agent Economy', icon: TrendingUp },
  { id: 'compound', label: 'Intelligence Map', icon: GitBranch },
  { id: 'calibration', label: 'Calibration', icon: Target },
  { id: 'trust', label: 'Trust Registry', icon: Shield },
  { id: 'velocity', label: 'Learning Velocity', icon: Activity },
  { id: 'provenance', label: 'Provenance Export', icon: Download },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function IntelligenceExchangePage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [economyRange, setEconomyRange] = useState<TimeRange>('30d');

  const { data: overviewData, refetch: refetchOverview, isLoading: overviewLoading } = useStandardQuery<OverviewResponse>({
    queryKey: ['ie-overview'],
    queryFn: () => fetchIE('/overview') as Promise<OverviewResponse>,
    refetchInterval: 60000,
  });

  const { data: economyData } = useStandardQuery<AgentEconomyResponse>({
    queryKey: ['ie-economy', economyRange],
    queryFn: () => fetchIE(`/agent-economy?range=${economyRange}`) as Promise<AgentEconomyResponse>,
    enabled: tab === 'economy',
  });

  const { data: compoundData } = useStandardQuery<CompoundMapResponse>({
    queryKey: ['ie-compound'],
    queryFn: () => fetchIE('/compound-map') as Promise<CompoundMapResponse>,
    enabled: tab === 'compound',
  });

  const { data: calibrationData } = useStandardQuery<CalibrationResponse>({
    queryKey: ['ie-calibration'],
    queryFn: () => fetchIE('/calibration') as Promise<CalibrationResponse>,
    enabled: tab === 'calibration',
  });

  const { data: trustData } = useStandardQuery<TrustRegistryResponse>({
    queryKey: ['ie-trust'],
    queryFn: () => fetchIE('/trust-registry') as Promise<TrustRegistryResponse>,
    enabled: tab === 'trust',
  });

  const { data: velocityData } = useStandardQuery<LearningVelocityResponse>({
    queryKey: ['ie-velocity'],
    queryFn: () => fetchIE('/learning-velocity') as Promise<LearningVelocityResponse>,
    enabled: tab === 'velocity',
  });

  const { data: provenanceData } = useStandardQuery<ProvenanceResponse>({
    queryKey: ['ie-provenance'],
    queryFn: () => fetchIE('/provenance-decisions') as Promise<ProvenanceResponse>,
    enabled: tab === 'provenance',
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}>
              <Brain className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-white">PRAXIS Intelligence Exchange</h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{ background: `${ACCENT}18`, color: ACCENT }}>
                  v1
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Intelligence Economics Operating System — value generated, calibration, compound intelligence, and learning velocity across the SZL fleet
              </p>
            </div>
          </div>
          <button onClick={() => refetchOverview()}
            className="flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-0.5 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  color: tab === t.id ? 'white' : 'rgba(255,255,255,0.4)',
                  borderBottom: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                  marginBottom: -1,
                }}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div>
          {tab === 'overview' && <OverviewTab data={overviewData} />}
          {tab === 'economy' && (
            <AgentEconomyTab
              data={economyData}
              range={economyRange}
              onRangeChange={(r) => setEconomyRange(r)}
            />
          )}
          {tab === 'compound' && <CompoundIntelligenceTab data={compoundData} />}
          {tab === 'calibration' && <CalibrationTab data={calibrationData} />}
          {tab === 'trust' && <TrustRegistryTab data={trustData} />}
          {tab === 'velocity' && <LearningVelocityTab data={velocityData} />}
          {tab === 'provenance' && <ProvenanceExportTab data={provenanceData} />}
        </div>
      </div>
    </div>
  );
}
