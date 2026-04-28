import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AlertCircle, CheckCircle2, Loader2, Lock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { adminFetch, Badge, SectionHeader } from './shared';
import type { HealthCheck } from './types';

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground">You need admin privileges to access the Command Center.</p>
      </div>
    </div>
  );
}

export function HealthPanel() {
  const [categoryFilter, setCategoryFilter] = useState('All');

  const { data, isLoading, refetch } = useStandardQuery<{
    timestamp: string;
    status: string;
    checks: HealthCheck[];
    summary: { total: number; healthy: number; degraded: number; down: number };
  }>({
    queryKey: ['admin-health'],
    queryFn: () => adminFetch('/admin/system-health'),
    refetchInterval: 30000,
  });

  const categories = ['All', ...Array.from(new Set(data?.checks?.map((c) => c.category) ?? []))];
  const checks = (data?.checks ?? []).filter((c) => categoryFilter === 'All' || c.category === categoryFilter);

  const statusIcon = (s: string) => {
    if (s === 'healthy') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === 'degraded') return <AlertCircle className="w-4 h-4 text-amber-400" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="System Health" subtitle="Live service health matrix" onRefresh={() => refetch()} loading={isLoading} />

      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-foreground">{data.summary.total}</div>
            <div className="text-[10px] text-muted-foreground font-medium">Checks</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-600">{data.summary.healthy}</div>
            <div className="text-[10px] text-emerald-600/80 font-medium">Healthy</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-600">{data.summary.degraded}</div>
            <div className="text-[10px] text-amber-600/80 font-medium">Degraded</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-500">{data.summary.down}</div>
            <div className="text-[10px] text-red-500/80 font-medium">Down</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', categoryFilter === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
              <div className="mt-0.5 shrink-0">{statusIcon(c.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <Badge label={c.category} variant="neutral" />
                  {c.latencyMs !== null && <span className="text-[10px] text-muted-foreground">{c.latencyMs}ms</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
