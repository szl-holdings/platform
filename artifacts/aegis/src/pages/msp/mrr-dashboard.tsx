import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';

import { Skeleton } from '@szl-holdings/shared-ui/ui/skeleton';
import {
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RevenueData {
  summary: {
    mrr: number;
    arr: number;
    growth: number;
    churn: number;
    avgContractValue: number;
    totalClients: number;
    activeClients: number;
    ltv: number;
    nrr: number;
    grossMargin: number;
  };
  monthly: {
    month: string;
    mrr: number;
    newBusiness: number;
    churned: number;
    expansion: number;
  }[];
  byClient: {
    clientName: string;
    mrr: number;
    tier: string;
    churnRisk: 'low' | 'medium' | 'high';
    contractValue: number;
    daysToRenewal: number;
  }[];
}

const churnRiskBadgeVariant: Record<string, string> = {
  low: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  medium: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  high: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20',
};

export default function MRRDashboard() {
  const { data, isLoading, refetch } = useStandardQuery<RevenueData>({
    queryKey: ['msp-revenue'],
    queryFn: () => apiFetch<RevenueData>('/msp/revenue'),
    staleTime: 120_000,
  });

  const summary = data?.summary;
  const monthly = data?.monthly ?? [];
  const byClient = data?.byClient ?? [];

  // Build retention + expansion data from monthly
  const trendData = monthly.map((m) => ({
    month: m.month,
    mrr: m.mrr,
    newBusiness: m.newBusiness,
    expansion: m.expansion,
    churned: Math.abs(m.churned),
  }));

  const summaryCards = summary
    ? [
        {
          label: 'Current MRR',
          value: `$${(summary.mrr / 1000).toFixed(1)}K`,
          change: `${summary.growth >= 0 ? '+' : ''}${summary.growth}% MoM`,
          up: summary.growth >= 0,
          sub: `ARR: $${(summary.arr / 1000).toFixed(0)}K`,
          icon: DollarSign,
        },
        {
          label: 'Net Revenue Retention',
          value: `${summary.nrr}%`,
          change: summary.nrr >= 100 ? 'Expansion positive' : 'Below 100%',
          up: summary.nrr >= 100,
          sub: 'Ideal >100%',
          icon: TrendingUp,
        },
        {
          label: 'Churn Rate',
          value: `${summary.churn}%`,
          change: summary.churn <= 2 ? 'Within target' : 'Above target',
          up: summary.churn <= 2,
          sub: 'Target <2% monthly',
          icon: TrendingDown,
        },
        {
          label: 'Active Clients',
          value: `${summary.activeClients}/${summary.totalClients}`,
          change: `${summary.totalClients - summary.activeClients} at-risk`,
          up: summary.totalClients - summary.activeClients === 0,
          sub: `LTV: $${(summary.ltv / 1000).toFixed(0)}K avg`,
          icon: Users,
        },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">MRR Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly recurring revenue, retention trends, churn analytics, and per-client breakdown
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : summaryCards.map((card) => (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </p>
                    <card.icon
                      className={`w-4 h-4 ${card.up ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}
                    />
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {card.up ? (
                      <TrendingUp className="w-3 h-3 text-[#c9b787]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[#f5f5f5]" />
                    )}
                    <span className={`text-xs ${card.up ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}>
                      {card.change}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              MRR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9b787" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c9b787" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                    contentStyle={{
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#c9b787"
                    fill="url(#mrrGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#c9b787]" />
              Revenue Waterfall
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar
                    dataKey="newBusiness"
                    name="New"
                    fill="#c9b787"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="expansion"
                    name="Expansion"
                    fill="#c9b787"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar dataKey="churned" name="Churned" fill="#f5f5f5" radius={[0, 0, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8a8a8a]" />
              MRR by Client
            </CardTitle>
            <span className="text-xs text-muted-foreground">{byClient.length} clients</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {byClient.map((client, i) => {
                const pct = summary ? Math.round((client.mrr / summary.mrr) * 100 * 10) / 10 : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-2 border-b border-border/30 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {client.clientName.charAt(0)}
                    </div>
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium truncate">{client.clientName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{client.tier}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">
                          ${client.mrr.toLocaleString()}/mo
                        </span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${churnRiskBadgeVariant[client.churnRisk]}`}
                    >
                      {client.churnRisk}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {client.daysToRenewal}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
