import { Link } from 'wouter';
import { useStats } from '@/lib/api-hooks';
import { Badge, Button } from '@/components/ui';
import { formatDate, formatDuration } from '@/lib/utils';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  PlayCircle,
  Plus,
  RefreshCcw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-[#5a8a6e]" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-[#b85450]" />;
    case 'running':
      return <RefreshCcw className="w-4 h-4 text-[#c9b787] animate-spin" />;
    case 'partial':
      return <CheckCircle2 className="w-4 h-4 text-[#d4a853]" />;
    default:
      return <Clock className="w-4 h-4 text-[#666]" />;
  }
}

function UsageGauge({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-[#8a8a8a]">{label}</span>
        <span className="text-xs font-mono text-[#666]">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-mono font-bold text-[#f5f5f5]">{value.toLocaleString()}</span>
        <span className="text-xs text-[#666]">/ {max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}

function AnomalyScore({ score, trend }: { score: number; trend: 'stable' | 'rising' | 'falling' }) {
  const color = score < 30 ? '#5a8a6e' : score < 60 ? '#c9b787' : score < 85 ? '#d4a853' : '#b85450';
  const trendIcon = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">{score}</span>
      </div>
      <div>
        <p className="text-sm font-medium">Anomaly Score</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{trendIcon}</span> {trend}
        </p>
      </div>
    </div>
  );
}

const COMPUTE_NODES = [
  { name: 'gpu-0', type: 'H100', util: 87, status: 'active', vram: '72/80 GB' },
  { name: 'gpu-1', type: 'A100', util: 62, status: 'active', vram: '48/80 GB' },
  { name: 'cpu-k8s', type: 'K8s', util: 41, status: 'active', vram: '—' },
  { name: 'slurm-0', type: 'Slurm', util: 93, status: 'active', vram: '—' },
];

const THROUGHPUT_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  rows: Math.floor(Math.random() * 50000 + 10000 + Math.sin(i / 3) * 20000),
  latency: Math.floor(Math.random() * 80 + 20 + Math.cos(i / 4) * 30),
}));

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold tracking-tight">Compute Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton-conduit stagger-1" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className="h-96 skeleton-conduit stagger-5" />
      </div>
    );
  }

  const chartData = stats?.recentRuns.slice().reverse().map((run, i) => ({
    name: i,
    rows: run.rowsWritten,
    status: run.status
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <p className="label-mono mb-1">AMARU · COMPUTE · USAGE</p>
          <h1 className="text-2xl font-display font-bold tracking-tight text-[#f5f5f5]">Compute Usage</h1>
          <p className="text-sm text-[#8a8a8a] mt-1">Real-time pipeline telemetry, resource utilization, and anomaly detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/compute">
            <Button variant="outline" className="gap-2 font-mono text-xs border-[rgba(255,255,255,0.08)] text-[#8a8a8a] hover:text-[#c9b787] hover:border-[rgba(201,183,135,0.3)]">
              <Cpu className="w-4 h-4" />
              ORCHESTRATION
            </Button>
          </Link>
          <Link href="/syncs/new">
            <Button className="gap-2 font-mono text-xs bg-[#c9b787] text-[#0a0a0a] hover:bg-[#a89868]">
              <Plus className="w-4 h-4" />
              NEW SYNC
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="conduit-stat p-4 space-y-1 stagger-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#666]">Active Syncs</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-[#f5f5f5]">{stats?.activeSyncs || 0}</span>
            <span className="text-xs text-[#666] font-mono">/ {stats?.totalSyncs || 0}</span>
          </div>
          <Activity className="w-3.5 h-3.5 text-[#c9b787] opacity-60" />
        </div>
        <div className="conduit-stat p-4 space-y-1 stagger-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#666]">Success Rate</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-[#5a8a6e]">
              {stats?.successRate ? (stats.successRate * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#5a8a6e] opacity-60" />
        </div>
        <div className="conduit-stat p-4 space-y-1 stagger-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#666]">Total Runs</span>
          <span className="text-2xl font-mono font-bold text-[#f5f5f5]">{stats?.totalRuns?.toLocaleString() || 0}</span>
          <PlayCircle className="w-3.5 h-3.5 text-[#c9b787] opacity-60" />
        </div>
        <div className="conduit-stat p-4 space-y-1 stagger-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#666]">Rows Written</span>
          <span className="text-2xl font-mono font-bold text-[#f5f5f5]">{stats?.totalRowsWritten?.toLocaleString() || 0}</span>
          <Database className="w-3.5 h-3.5 text-[#c9b787] opacity-60" />
        </div>
        <div className="conduit-stat p-4 space-y-1 stagger-4 border-l-2 border-l-[rgba(201,183,135,0.3)]">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#666]">Anomaly</span>
          <AnomalyScore score={23} trend="stable" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 conduit-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#f5f5f5]">Pipeline Throughput</h2>
              <p className="text-xs text-[#666] mt-0.5">24h rolling window · rows/hr + latency</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(201,183,135,0.3)] text-[#c9b787] bg-[rgba(201,183,135,0.06)]">LIVE</span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={THROUGHPUT_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9b787" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c9b787" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono"
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="rounded p-2 text-xs font-mono shadow-xl" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[#f5f5f5] font-bold">{Number(payload[0].value).toLocaleString()} rows</p>
                        <p className="text-[#8a8a8a]">{payload[0].payload.latency}ms avg</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="rows" stroke="#c9b787" strokeWidth={1.5} fillOpacity={1} fill="url(#colorThroughput)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="conduit-card p-5 space-y-4">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#f5f5f5]">Resource Utilization</h2>
          <UsageGauge label="GPU Compute" value={74} max={100} unit="%" color="#c9b787" />
          <UsageGauge label="Memory" value={12.4} max={16} unit="GB" color="#a78bfa" />
          <UsageGauge label="Storage I/O" value={340} max={500} unit="MB/s" color="#5a8a6e" />
          <UsageGauge label="Network" value={89} max={100} unit="Gbps" color="#d4a853" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="conduit-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#f5f5f5]">Compute Nodes</h2>
            <Link href="/compute" className="text-xs text-[#c9b787] flex items-center gap-1 font-mono hover:underline">
              ALL <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {COMPUTE_NODES.map(n => (
              <div key={n.name} className="flex items-center justify-between p-2.5 rounded border" style={{ background: '#121212', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#5a8a6e] animate-pulse" />
                  <div>
                    <p className="text-xs font-mono font-bold text-[#f5f5f5]">{n.name}</p>
                    <p className="text-[10px] text-[#666] font-mono">{n.type} · {n.vram}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold" style={{ color: n.util > 80 ? '#d4a853' : '#5a8a6e' }}>
                    {n.util}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 conduit-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#f5f5f5]">Write Volume</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(255,255,255,0.08)] text-[#8a8a8a]">Last 50 runs</span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono"
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="rounded p-2 text-xs font-mono shadow-xl" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="font-bold text-[#f5f5f5]">{payload[0].value} rows</p>
                        <p className="text-[#8a8a8a] capitalize">{payload[0].payload.status}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="rows" radius={[2, 2, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.status === 'success' ? '#c9b787' : d.status === 'failed' ? '#b85450' : '#d4a853'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="conduit-card flex flex-col">
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c9b787]" />
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#f5f5f5]">Recent Pipeline Activity</h2>
          </div>
          <Link href="/runs" className="text-xs text-[#c9b787] hover:underline flex items-center gap-1 font-mono">
            ALL RUNS <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {!stats?.recentRuns?.length ? (
            <div className="p-8 flex flex-col items-center justify-center text-[#8a8a8a] text-center">
              <Server className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-mono">No recent sync runs.</p>
              <p className="text-xs text-[#666] mt-1">Create a sync to start moving data.</p>
            </div>
          ) : (
            stats.recentRuns.slice(0, 6).map((run) => (
              <Link key={run.id} href={`/runs/${run.id}`}>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getStatusIcon(run.status)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium truncate group-hover:text-[#c9b787] transition-colors text-[#f5f5f5]">
                        {run.syncName || run.sync?.name || 'Unknown Sync'}
                      </p>
                      <p className="text-[10px] text-[#666] mt-0.5 flex items-center gap-2 font-mono">
                        <span>{formatDate(run.startedAt)}</span>
                        <span className="opacity-40">·</span>
                        <span>{formatDuration(run.durationMs)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                    <span className="text-xs font-mono text-[#8a8a8a]">{run.rowsWritten.toLocaleString()} rows</span>
                    <Badge variant={run.status as any} className="capitalize text-[10px] font-mono">
                      {run.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
