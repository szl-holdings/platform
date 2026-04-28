import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Activity, Database, Globe, Loader2, Users } from 'lucide-react';
import { adminFetch, SectionHeader, StatCard } from './shared';
import type { OverviewData } from './types';

export function OverviewPanel() {
  const { data, isLoading, refetch } = useStandardQuery<OverviewData>({
    queryKey: ['admin-overview'],
    queryFn: () => adminFetch<OverviewData>('/admin/overview'),
    refetchInterval: 30000,
  });

  const uptime = data?.system?.uptime ?? 0;
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMin = Math.floor((uptime % 3600) / 60);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Command Center Overview"
        subtitle="Real-time platform health and key metrics"
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={data?.counts?.users ?? 0} sub={`${data?.counts?.activeUsers ?? 0} active`} color="text-blue-500" />
            <StatCard icon={Globe} label="Registered Apps" value={data?.counts?.apps ?? 0} color="text-violet-500" />
            <StatCard icon={Database} label="Database" value={data?.database?.status ?? '—'} sub={`${data?.database?.latency ?? 0}ms`} color="text-emerald-500" />
            <StatCard icon={Activity} label="Uptime" value={`${uptimeHours}h ${uptimeMin}m`} color="text-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Database
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Status</span>
                  <span className="text-foreground font-medium">{data?.database?.status}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Latency</span>
                  <span className="text-foreground font-medium">{data?.database?.latency}ms</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Memory
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>RSS</span>
                  <span className="text-foreground font-medium">
                    {Math.round((data?.system?.memoryUsage?.rss ?? 0) / 1024 / 1024)}MB
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Heap Used</span>
                  <span className="text-foreground font-medium">
                    {Math.round((data?.system?.memoryUsage?.heapUsed ?? 0) / 1024 / 1024)}MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
