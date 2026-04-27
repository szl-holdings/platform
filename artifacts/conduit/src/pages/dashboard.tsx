import { Link } from 'wouter';
import { useStats } from '@/lib/api-hooks';
import { Badge, Button } from '@/components/ui';
import { formatDate, formatDuration } from '@/lib/utils';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  PlayCircle,
  Plus,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'running':
      return <RefreshCcw className="w-4 h-4 text-yellow-500 animate-spin" />;
    case 'partial':
      return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold tracking-tight">Overview</h1>
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
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">System Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time telemetry and synchronization status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/connections/new">
            <Button variant="outline" className="gap-2">
              <Database className="w-4 h-4" />
              New Connection
            </Button>
          </Link>
          <Link href="/syncs/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Sync
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="conduit-stat p-5 space-y-2 stagger-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium uppercase tracking-wider">Active Syncs</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">{stats?.activeSyncs || 0}</span>
            <span className="text-sm text-muted-foreground">/ {stats?.totalSyncs || 0} total</span>
          </div>
        </div>
        <div className="conduit-stat p-5 space-y-2 stagger-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">
              {stats?.successRate ? (stats.successRate * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
        <div className="conduit-stat p-5 space-y-2 stagger-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium uppercase tracking-wider">Total Runs</span>
            <PlayCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">{stats?.totalRuns.toLocaleString() || 0}</span>
          </div>
        </div>
        <div className="conduit-stat p-5 space-y-2 stagger-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium uppercase tracking-wider">Rows Written</span>
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">{stats?.totalRowsWritten.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 conduit-card p-6 stagger-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold">Write Volume</h2>
            <Badge variant="default" className="text-xs font-mono">Last 50 runs</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                          <p className="font-semibold">{payload[0].value} rows</p>
                          <p className="text-muted-foreground capitalize text-xs mt-1">Status: {payload[0].payload.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rows"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRows)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="conduit-card flex flex-col stagger-6">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
            <Link href="/runs" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!stats?.recentRuns?.length ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No recent sync runs.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {stats.recentRuns.slice(0, 8).map((run) => (
                  <Link key={run.id} href={`/runs/${run.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">{getStatusIcon(run.status)}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {run.syncName || run.sync?.name || 'Unknown Sync'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{formatDate(run.startedAt)}</span>
                            <span>•</span>
                            <span>{formatDuration(run.durationMs)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <Badge variant={run.status as any} className="capitalize">
                          {run.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {run.rowsWritten.toLocaleString()} w
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
