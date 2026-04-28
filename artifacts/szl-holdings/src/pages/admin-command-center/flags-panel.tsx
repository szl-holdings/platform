import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { Edit2, Loader2, Plus, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { adminFetch, Badge, Drawer, EmptyState, SearchInput, SectionHeader } from './shared';
import type { FeatureFlag, FlagOverride } from './types';

function FlagOverridesEditor({ flagKey, onClose }: { flagKey: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ entityType: 'role' as 'user' | 'org' | 'role', entityId: '', isEnabled: true });

  const { data, isLoading } = useStandardQuery<{ overrides: FlagOverride[] }>({
    queryKey: ['admin-flag-overrides', flagKey],
    queryFn: () => adminFetch<{ overrides: FlagOverride[] }>(`/admin/feature-flags/${flagKey}/overrides`),
    enabled: !!flagKey,
  });

  const addMutation = useStandardMutation({
    mutationFn: (vals: typeof form) =>
      adminFetch(`/admin/feature-flags/${flagKey}/overrides`, { method: 'POST', body: JSON.stringify(vals) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flag-overrides', flagKey] });
      setForm({ entityType: 'role', entityId: '', isEnabled: true });
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: (overrideId: number) =>
      adminFetch(`/admin/feature-flags/${flagKey}/overrides/${overrideId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flag-overrides', flagKey] }),
  });

  const overrides = data?.overrides ?? [];

  return (
    <Drawer open={!!flagKey} onClose={onClose} title={`Overrides: ${flagKey}`}>
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-3">Add Override</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Entity Type</label>
                <select value={form.entityType} onChange={(e) => { const v = e.target.value; if (v === 'user' || v === 'org' || v === 'role') setForm((p) => ({ ...p, entityType: v })); }} className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                  <option value="role">Role</option>
                  <option value="org">Organization</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Enabled</label>
                <select value={String(form.isEnabled)} onChange={(e) => setForm((p) => ({ ...p, isEnabled: e.target.value === 'true' }))} className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                {form.entityType === 'role' ? 'Role Name (e.g. admin)' : form.entityType === 'org' ? 'Org ID' : 'User ID'}
              </label>
              <input value={form.entityId} onChange={(e) => setForm((p) => ({ ...p, entityId: e.target.value }))} placeholder={form.entityType === 'role' ? 'admin' : form.entityType === 'org' ? '42' : '123'} className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <button onClick={() => addMutation.mutate(form)} disabled={!form.entityId || addMutation.isPending} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Override
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Current Overrides ({overrides.length})</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : overrides.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No overrides configured.</p>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {overrides.map((ov) => (
                <div key={ov.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-foreground">
                      {ov.entityType}: <span className="font-mono">{ov.entityId}</span>
                    </div>
                    <Badge label={ov.isEnabled ? 'enabled' : 'disabled'} variant={ov.isEnabled ? 'green' : 'red'} />
                  </div>
                  <button onClick={() => deleteMutation.mutate(ov.id)} disabled={deleteMutation.isPending} className="text-xs text-red-500/70 hover:text-red-500 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export function FlagsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingRollout, setEditingRollout] = useState<string | null>(null);
  const [rolloutValue, setRolloutValue] = useState(0);
  const [overrideKey, setOverrideKey] = useState<string>('');

  const { data, isLoading, refetch } = useStandardQuery<{ flags: FeatureFlag[] }>({
    queryKey: ['admin-flags'],
    queryFn: () => adminFetch('/admin/feature-flags'),
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminFetch(`/admin/feature-flags/${key}`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-flags'] }); setToggling(null); },
    onError: () => setToggling(null),
  });

  const rolloutMutation = useStandardMutation({
    mutationFn: ({ key, rolloutPercentage }: { key: string; rolloutPercentage: number }) =>
      adminFetch(`/admin/feature-flags/${key}/rollout`, { method: 'PUT', body: JSON.stringify({ rolloutPercentage }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-flags'] }); setEditingRollout(null); },
  });

  const flags = (data?.flags ?? []).filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.key.includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <SectionHeader title="Feature Flag Management" subtitle={`${data?.flags?.length ?? 0} flags`} onRefresh={() => refetch()} loading={isLoading} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search flags..." />

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : flags.length === 0 ? (
        <EmptyState message={search ? 'No flags match your search.' : 'No feature flags found.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {flags.map((f) => (
            <div key={f.key} className="px-4 py-3 hover:bg-muted/10 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                    {f.rolloutPercentage < 100 && f.enabled && <Badge label={`${f.rolloutPercentage}% rollout`} variant="amber" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">{f.key}</p>

                  {editingRollout === f.key && (
                    <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <input type="range" min={0} max={100} value={rolloutValue} onChange={(e) => setRolloutValue(Number(e.target.value))} className="flex-1 accent-primary" />
                      <span className="text-xs font-mono w-8 text-center">{rolloutValue}%</span>
                      <button onClick={() => rolloutMutation.mutate({ key: f.key, rolloutPercentage: rolloutValue })} disabled={rolloutMutation.isPending} className="px-2 py-1 text-[10px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">Save</button>
                      <button onClick={() => setEditingRollout(null)} className="px-2 py-1 text-[10px] font-semibold bg-muted text-muted-foreground rounded-md hover:text-foreground transition-colors">Cancel</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setOverrideKey(f.key)} className="p-1.5 rounded-md text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors" title="Edit overrides">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setEditingRollout(f.key === editingRollout ? null : f.key); setRolloutValue(f.rolloutPercentage); }} className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors" title="Edit rollout %">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <span className={cn('text-[10px] font-semibold', f.enabled ? 'text-emerald-600' : 'text-muted-foreground')}>{f.enabled ? 'ON' : 'OFF'}</span>
                  <button onClick={() => { setToggling(f.key); toggleMutation.mutate({ key: f.key, enabled: !f.enabled }); }} disabled={toggling === f.key} className="relative flex-shrink-0">
                    {toggling === f.key ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : f.enabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FlagOverridesEditor flagKey={overrideKey} onClose={() => setOverrideKey('')} />
    </div>
  );
}
