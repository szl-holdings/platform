import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Activity, BarChart3, Building2, DollarSign, Flag, HeadphonesIcon, Loader2, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { adminFetch, SectionHeader, StatCard } from './shared';
import type { AnalyticsData } from './types';

export function AnalyticsPanel() {
  const { data, isLoading, refetch } = useStandardQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: () => adminFetch<AnalyticsData>('/admin/analytics'),
    refetchInterval: 60000,
  });

  const uptimeHours = Math.floor((data?.uptime ?? 0) / 3600);
  const topTenants = data?.topTenants ?? [];
  const maxUsage = topTenants.length > 0 ? Math.max(...topTenants.map((t) => t.totalUsage)) : 1;

  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Analytics" subtitle="Key platform metrics, top tenants, and API performance" onRefresh={() => refetch()} loading={isLoading} />
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Users" value={data?.platform?.totalUsers ?? 0} sub={`${data?.platform?.activeUsers ?? 0} active`} color="text-blue-500" />
            <StatCard icon={Building2} label="Active Tenants" value={data?.platform?.totalTenants ?? 0} color="text-violet-500" />
            <StatCard icon={Flag} label="Active Flags" value={data?.platform?.activeFlags ?? 0} color="text-amber-500" />
            <StatCard icon={Shield} label="Audit Events" value={(data?.platform?.totalAuditEvents ?? 0).toLocaleString()} color="text-emerald-500" />
            <StatCard icon={HeadphonesIcon} label="Support Tickets" value={data?.platform?.openSupportTickets ?? 0} color="text-rose-500" />
            <StatCard icon={Activity} label="Uptime" value={`${uptimeHours}h`} color="text-cyan-500" />
          </div>

          {topTenants.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Top Tenants by Usage
              </h3>
              <div className="space-y-3">
                {topTenants.map((t, i) => (
                  <div key={t.orgId ?? i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[60%]">{t.name}</span>
                      <span className="text-muted-foreground">{(t.totalUsage ?? 0).toLocaleString()} events</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(((t.totalUsage ?? 0) / maxUsage) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.billing && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Billing Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[
                  { label: 'Plan', value: data.billing.plan ?? '—' },
                  { label: 'Status', value: data.billing.status ?? '—' },
                  { label: 'Monthly Amount', value: data.billing.monthlyAmount != null ? `${data.billing.currency?.toUpperCase() ?? 'USD'} ${(data.billing.monthlyAmount / 100).toFixed(2)}` : '—' },
                  { label: 'Seats', value: data.billing.seats?.toLocaleString() ?? '—' },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold text-foreground capitalize">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> API Performance
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: 'Total Requests', value: (data?.api?.requestCount ?? 0).toLocaleString() },
                { label: 'Error Rate', value: `${((data?.api?.errorRate ?? 0) * 100).toFixed(1)}%` },
                { label: 'P95 Latency', value: `${data?.api?.p95Latency ?? 0}ms` },
                { label: 'Auth Failures', value: (data?.api?.authFailures ?? 0).toLocaleString() },
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
