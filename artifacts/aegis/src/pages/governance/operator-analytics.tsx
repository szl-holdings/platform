import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Info,
  Lock,
  Minus,
  RefreshCw,
  Server,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'wouter';
import { api } from '@/lib/api';

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
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
  color = '#f59e0b',
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-400/10 border border-amber-400/20 text-xs text-amber-400 font-mono">
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
  const openCases =
    cases?.filter((c) => c.status === 'open' || c.status === 'in_progress')?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 size={22} className="text-amber-400" />
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
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${timeRange === r ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'text-[#8b9ab0] border border-[#1e2a3a] hover:text-white'}`}
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
            color="#f97316"
          />
          <MetricCard
            label="Policy Blocks (7d)"
            value="22"
            sub="3 cross-tenant blocked"
            trend="down"
            icon={Lock}
            color="#ef4444"
          />
          <MetricCard
            label="Active Incidents"
            value={activeIncidents}
            sub={`${totalIncidents} total`}
            trend="flat"
            icon={AlertTriangle}
            color="#ef4444"
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
                  stroke="#f59e0b"
                  fill="#f59e0b22"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  stroke="#ef4444"
                  fill="#ef444422"
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
                <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'p50', color: '#22c55e' },
                { label: 'p95', color: '#f59e0b' },
                { label: 'p99', color: '#ef4444' },
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
                <Bar dataKey="hitRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowConfidence" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
                <Bar dataKey="blocks" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                      <span className="text-amber-400">${m.cost.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
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
                              className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${impact === 'critical' ? 'bg-red-500/20 text-red-400' : impact === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}
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
                          <button className="ml-3 px-3 py-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs rounded font-mono hover:bg-amber-400/30 transition-colors whitespace-nowrap">
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
            color="#22c55e"
          />
          <MetricCard
            label="Model Cost (7d)"
            value="$41.82"
            sub="+6% vs prior week"
            trend="down"
            icon={Database}
            color="#f59e0b"
          />
          <MetricCard
            label="Retrieval Hit Rate"
            value="92.3%"
            sub="+1.2% vs 7d avg"
            trend="up"
            icon={Eye}
            color="#22c55e"
          />
          <MetricCard
            label="Failure Rate"
            value="1.9%"
            sub="-0.3% vs yesterday"
            trend="up"
            icon={AlertOctagon}
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  );
}
