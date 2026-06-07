import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Eye,
  Info,
  Lock,
  Minus,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'wouter';
import { api } from '@/lib/api';

const _COLORS = {
  critical: '#f5f5f5',
  high: '#c9b787',
  medium: '#c9b787',
  low: '#c9b787',
  info: '#6b7280',
};

interface Incident {
  id: number;
  status: string;
  severity: string;
}
interface Case {
  id: number;
  status: string;
}
interface Decision {
  id: number;
  objectId?: string;
  decisionType?: string;
  recommendedAction?: string;
  summary?: string;
  impactLevel?: string;
  urgency?: string;
  approvalRequired?: boolean;
  humanReviewRequired?: boolean;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  caseId?: string;
  incidentId?: string;
  createdAt?: string;
  modelRoute?: string;
}

function MetricCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  color = '#c9b787',
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#c9b787' : trend === 'down' ? '#f5f5f5' : '#6b7280';
  return (
    <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono">{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div className="text-3xl font-bold text-white font-mono">{value}</div>
      {sub && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendIcon size={12} color={trendColor} />
          <span style={{ color: trendColor }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

const AGENT_RUN_DATA = [
  { time: '00:00', runs: 12, failures: 1, pending: 2 },
  { time: '03:00', runs: 8, failures: 0, pending: 1 },
  { time: '06:00', runs: 15, failures: 2, pending: 3 },
  { time: '09:00', runs: 42, failures: 3, pending: 8 },
  { time: '12:00', runs: 67, failures: 5, pending: 12 },
  { time: '15:00', runs: 58, failures: 4, pending: 9 },
  { time: '18:00', runs: 45, failures: 2, pending: 6 },
  { time: '21:00', runs: 28, failures: 1, pending: 4 },
];

const LATENCY_DATA = [
  { time: '00:00', p50: 120, p95: 340, p99: 780 },
  { time: '03:00', p50: 95, p95: 280, p99: 620 },
  { time: '06:00', p50: 140, p95: 390, p99: 890 },
  { time: '09:00', p50: 210, p95: 560, p99: 1240 },
  { time: '12:00', p50: 185, p95: 480, p99: 1050 },
  { time: '15:00', p50: 165, p95: 420, p99: 940 },
  { time: '18:00', p50: 145, p95: 380, p99: 840 },
  { time: '21:00', p50: 115, p95: 310, p99: 690 },
];

const MODEL_USAGE = [
  { name: 'claude-3-5-sonnet', calls: 1240, cost: 18.42, pct: 51 },
  { name: 'gpt-4o', calls: 680, cost: 14.76, pct: 28 },
  { name: 'gemini-1.5-pro', calls: 320, cost: 6.12, pct: 13 },
  { name: 'llama-3.1-70b', calls: 180, cost: 2.34, pct: 7.4 },
  { name: 'grok-2', calls: 8, cost: 0.18, pct: 0.3 },
];

const POLICY_BLOCKS_DATA = [
  { day: 'Mon', blocks: 3, type: 'cross_tenant' },
  { day: 'Tue', blocks: 5, type: 'high_risk_gate' },
  { day: 'Wed', blocks: 2, type: 'rbac' },
  { day: 'Thu', blocks: 7, type: 'high_risk_gate' },
  { day: 'Fri', blocks: 4, type: 'cost_ceiling' },
  { day: 'Sat', blocks: 1, type: 'rbac' },
  { day: 'Sun', blocks: 0, type: 'none' },
];

const RETRIEVAL_QUALITY = [
  { day: 'Mon', hitRate: 91, missRate: 9, lowConfidence: 4 },
  { day: 'Tue', hitRate: 88, missRate: 12, lowConfidence: 6 },
  { day: 'Wed', hitRate: 93, missRate: 7, lowConfidence: 3 },
  { day: 'Thu', hitRate: 87, missRate: 13, lowConfidence: 7 },
  { day: 'Fri', hitRate: 94, missRate: 6, lowConfidence: 2 },
  { day: 'Sat', hitRate: 96, missRate: 4, lowConfidence: 1 },
  { day: 'Sun', hitRate: 95, missRate: 5, lowConfidence: 2 },
];

function DemoDataBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20 text-xs text-[#c9b787] font-mono">
      <Info size={12} />
      <span>{label} — seeded pilot data, not yet wired to live pipeline</span>
    </div>
  );
}

export default function OperatorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { data: incidents } = useStandardQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => api.incidents.list(),
  });
  const { data: cases } = useStandardQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: () => api.cases.list(),
  });
  const { data: decisions } = useStandardQuery<Decision[]>({
    queryKey: ['tradecraft-decisions'],
    queryFn: () => api.tradecraft.decisions(),
  });

  const totalIncidents = incidents?.length ?? 0;
  const activeIncidents = incidents?.filter((i) => !['closed'].includes(i.status))?.length ?? 0;
  const pendingApprovals = Array.isArray(decisions)
    ? decisions.filter(
        (d) => (d.approvalRequired || d.humanReviewRequired) && !d.approvedAt && !d.rejectedAt,
      ).length
    : 0;
  const _openCases =
    cases?.filter((c) => c.status === 'open' || c.status === 'in_progress')?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 size={22} className="text-[#c9b787]" />
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">
                Operator Analytics
              </h1>
            </div>
            <p className="text-xs text-[#8b9ab0] font-mono">
              Agent runs · Approvals · Policy blocks · Retrieval · Model usage · Latency
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${timeRange === r ? 'bg-[#c9b787]/20 text-[#c9b787] border border-[#c9b787]/40' : 'text-[#8b9ab0] border border-[#1e2a3a] hover:text-white'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Agent Runs (24h)"
            value="428"
            sub="+12% vs yesterday"
            trend="up"
            icon={Activity}
          />
          <MetricCard
            label="Pending Approvals"
            value={pendingApprovals}
            sub={`${pendingApprovals} awaiting action`}
            trend={pendingApprovals > 3 ? 'down' : 'flat'}
            icon={Clock}
            color="#c9b787"
          />
          <MetricCard
            label="Policy Blocks (7d)"
            value="22"
            sub="3 cross-tenant blocked"
            trend="down"
            icon={Lock}
            color="#f5f5f5"
          />
          <MetricCard
            label="Active Incidents"
            value={activeIncidents}
            sub={`${totalIncidents} total`}
            trend="flat"
            icon={AlertTriangle}
            color="#f5f5f5"
          />
        </div>

        <DemoDataBanner label="Agent runs, latency, retrieval quality, policy blocks, model usage" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Agent Runs & Failures — 24h
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={AGENT_RUN_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="#c9b787"
                  fill="#c9b78722"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  stroke="#f5f5f5"
                  fill="#f5f5f522"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Response Latency — p50 / p95 / p99 (ms)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={LATENCY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="time" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="p50" stroke="#c9b787" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="#c9b787" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p99" stroke="#f5f5f5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'p50', color: '#c9b787' },
                { label: 'p95', color: '#c9b787' },
                { label: 'p99', color: '#f5f5f5' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-0.5" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-[#8b9ab0]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Retrieval Quality — Hit / Miss Rate (%)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={RETRIEVAL_QUALITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="day" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="hitRate" fill="#c9b787" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missRate" fill="#f5f5f5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowConfidence" fill="#c9b787" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Policy Blocks — 7 days
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={POLICY_BLOCKS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="day" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="blocks" fill="#f5f5f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Model Usage & Cost
            </h3>
            <div className="space-y-3">
              {MODEL_USAGE.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-mono">{m.name}</span>
                    <div className="flex gap-3 text-xs text-[#8b9ab0] font-mono">
                      <span>{m.calls.toLocaleString()} calls</span>
                      <span className="text-[#c9b787]">${m.cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c9b787] rounded-full"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-2">
              Pending Approvals Queue
            </h3>
            <p className="text-xs text-[#8b9ab0] mb-4 font-mono">
              Live from tradecraft decisions API
            </p>
            <div className="space-y-3">
              {pendingApprovals === 0 && (
                <p className="text-xs text-[#8b9ab0] font-mono">No pending approvals in queue</p>
              )}
              {Array.isArray(decisions) &&
                decisions
                  .filter(
                    (d) =>
                      (d.approvalRequired || d.humanReviewRequired) &&
                      !d.approvedAt &&
                      !d.rejectedAt,
                  )
                  .slice(0, 5)
                  .map((a: Decision) => {
                    const impact = a.impactLevel ?? 'medium';
                    return (
                      <div
                        key={a.id ?? a.objectId}
                        className="flex items-start justify-between p-3 bg-[#0a0f16] border border-[#1e2a3a] rounded-lg"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${impact === 'critical' ? 'bg-[#f5f5f5]/20 text-[#f5f5f5]' : impact === 'high' ? 'bg-[#c9b787]/20 text-[#c9b787]' : 'bg-[#c9b787]/20 text-[#c9b787]'}`}
                            >
                              {String(impact).toUpperCase()}
                            </span>
                            <span className="text-xs text-[#8b9ab0] font-mono">
                              {a.objectId ?? String(a.id)}
                            </span>
                          </div>
                          <p className="text-xs text-white truncate">
                            {a.recommendedAction ??
                              a.summary ??
                              a.decisionType ??
                              'Decision pending review'}
                          </p>
                          <p className="text-xs text-[#8b9ab0] font-mono">
                            {a.modelRoute ?? 'alloy'} · {a.caseId ?? a.incidentId ?? '—'}
                          </p>
                        </div>
                        <Link href="/response-orchestration">
                          <button className="ml-3 px-3 py-1.5 bg-[#c9b787]/20 border border-[#c9b787]/40 text-[#c9b787] text-xs rounded font-mono hover:bg-[#c9b787]/30 transition-colors whitespace-nowrap">
                            Review
                          </button>
                        </Link>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Avg p50 Latency"
            value="148ms"
            sub="-12ms vs yesterday"
            trend="up"
            icon={Zap}
            color="#c9b787"
          />
          <MetricCard
            label="Model Cost (7d)"
            value="$41.82"
            sub="+6% vs prior week"
            trend="down"
            icon={Database}
            color="#c9b787"
          />
          <MetricCard
            label="Retrieval Hit Rate"
            value="92.3%"
            sub="+1.2% vs 7d avg"
            trend="up"
            icon={Eye}
            color="#c9b787"
          />
          <MetricCard
            label="Failure Rate"
            value="1.9%"
            sub="-0.3% vs yesterday"
            trend="up"
            icon={AlertOctagon}
            color="#f5f5f5"
          />
        </div>
      </div>
    </div>
  );
}
