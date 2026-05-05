import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Flag, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  ui: 'text-[#4a90b8] bg-[#4a90b8]/10',
  security: 'text-[#c45a4a] bg-[#c45a4a]/10',
  analytics: 'text-violet-400 bg-violet-500/10',
  infrastructure: 'text-[#d4a054] bg-[#d4a054]/10',
  experimental: 'text-pink-400 bg-pink-500/10',
};

export default function FeatureFlags() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading, error } = useStandardQuery<{ flags: FeatureFlag[] }>({
    queryKey: ['feature-flags'],
    queryFn: () => apiFetch('/admin/feature-flags'),
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiFetch(`/admin/feature-flags/${key}`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    onMutate: async ({ key, enabled }) => {
      await qc.cancelQueries({ queryKey: ['feature-flags'] });
      const prev = qc.getQueryData<{ flags: FeatureFlag[] }>(['feature-flags']);
      qc.setQueryData<{ flags: FeatureFlag[] }>(['feature-flags'], (old) =>
        old
          ? { ...old, flags: old.flags.map((f) => (f.key === key ? { ...f, enabled } : f)) }
          : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['feature-flags'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  const flags = data?.flags ?? [];
  const filtered = search
    ? flags.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.key.toLowerCase().includes(search.toLowerCase()),
      )
    : flags;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary" />
          Feature Flags
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Feature rollout controls with per-category targeting and percentage-based gates
        </p>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Feature flags require API connection</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Flags', value: flags.length, color: 'text-foreground' },
              {
                label: 'Enabled',
                value: flags.filter((f) => f.enabled).length,
                color: 'text-[#6b8f71]',
              },
              {
                label: 'Disabled',
                value: flags.filter((f) => !f.enabled).length,
                color: 'text-muted-foreground',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className={`text-2xl font-bold font-display ${color}`}>
                  {isLoading ? '—' : value}
                </div>
              </div>
            ))}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flags..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              filtered.map((flag) => (
                <div
                  key={flag.key}
                  className="px-4 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{flag.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[flag.category] ?? 'text-muted-foreground bg-muted'}`}
                      >
                        {flag.category}
                      </span>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        {flag.key}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                    {flag.rolloutPercentage < 100 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${flag.rolloutPercentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {flag.rolloutPercentage}% rollout
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                    disabled={toggleMutation.isPending}
                    className="shrink-0 transition-colors"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No flags found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
