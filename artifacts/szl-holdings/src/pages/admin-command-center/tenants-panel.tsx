import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { AnimatePresence, m } from 'framer-motion';
import { Eye, Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { adminFetch, Badge, Drawer, EmptyState, SearchInput, SectionHeader, StatusDot } from './shared';
import type { Tenant, TenantDetail } from './types';

function TenantDetailDrawer({ tenantId, onClose }: { tenantId: number | null; onClose: () => void }) {
  const { data, isLoading } = useStandardQuery<TenantDetail>({
    queryKey: ['admin-tenant-detail', tenantId],
    queryFn: () => adminFetch<TenantDetail>(`/admin/orgs/${tenantId}`),
    enabled: tenantId != null,
  });

  return (
    <Drawer open={tenantId != null} onClose={onClose} title="Tenant Details">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? null : (
        <div className="space-y-5">
          <div>
            <div className="text-base font-semibold text-foreground">{data.tenant.name}</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{data.tenant.slug}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge label={data.tenant.isActive ? 'active' : 'suspended'} variant={data.tenant.isActive ? 'green' : 'red'} />
              {data.subscription && <Badge label={data.subscription.status} variant={data.subscription.status === 'active' ? 'blue' : 'amber'} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{data.tenant.memberCount}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Members</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{data.usage.reduce((s, u) => s + u.total, 0).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Total Events</div>
            </div>
          </div>

          {data.subscription && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-foreground mb-2">Subscription</h4>
              {[
                { label: 'Status', value: data.subscription.status },
                { label: 'Plan ID', value: String(data.subscription.planId) },
                { label: 'Period Start', value: new Date(data.subscription.currentPeriodStart).toLocaleDateString() },
                { label: 'Period End', value: new Date(data.subscription.currentPeriodEnd).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {data.usage.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Usage by Feature</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {data.usage.map((u) => (
                  <div key={u.featureKey} className="flex justify-between items-center px-3 py-2 text-xs">
                    <span className="text-muted-foreground font-mono">{u.featureKey}</span>
                    <span className="font-semibold text-foreground">{u.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.members.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Members ({data.members.length})</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {data.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-foreground">{m.displayName ?? m.email}</div>
                      <div className="text-[10px] text-muted-foreground">{m.email}</div>
                    </div>
                    <Badge label={m.role} variant="neutral" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export function TenantsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ tenants: Tenant[]; total: number }>({
    queryKey: ['admin-tenants'],
    queryFn: () => adminFetch('/admin/orgs'),
  });

  const suspendMutation = useStandardMutation({
    mutationFn: ({ id, suspended }: { id: number; suspended: boolean }) =>
      adminFetch(`/admin/orgs/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tenants'] }),
  });

  const createMutation = useStandardMutation({
    mutationFn: (vals: { name: string; slug: string }) =>
      adminFetch('/admin/orgs', { method: 'POST', body: JSON.stringify(vals) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      setCreating(false);
      setForm({ name: '', slug: '' });
    },
  });

  const tenants = (data?.tenants ?? []).filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <SectionHeader title="Tenant Management" subtitle={`${data?.total ?? 0} organizations`} onRefresh={() => refetch()} loading={isLoading} />
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tenants..." />
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Tenant
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState message={search ? 'No tenants match your search.' : 'No tenants yet.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {tenants.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <StatusDot status={t.isActive ? 'active' : 'down'} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.slug} · {t.memberCount} member{t.memberCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.subscription && <Badge label={t.subscription.status} variant={t.subscription.status === 'active' ? 'green' : 'neutral'} />}
                <Badge label={t.isActive ? 'active' : 'suspended'} variant={t.isActive ? 'green' : 'red'} />
                <button onClick={() => setSelectedTenantId(t.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View details">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => suspendMutation.mutate({ id: t.id, suspended: t.isActive })}
                  disabled={suspendMutation.isPending}
                  className={cn('text-xs px-2 py-1 rounded-md font-medium transition-colors', t.isActive ? 'text-amber-600 hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-500/10')}
                >
                  {t.isActive ? 'Suspend' : 'Restore'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TenantDetailDrawer tenantId={selectedTenantId} onClose={() => setSelectedTenantId(null)} />

      <AnimatePresence>
        {creating && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-foreground">Create New Tenant</h3>
                <button onClick={() => setCreating(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organization Name</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="acme-corp" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setCreating(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.slug || createMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Tenant
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
