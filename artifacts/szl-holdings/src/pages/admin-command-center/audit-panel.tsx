import { useStandardQuery } from '@szl-holdings/api-client-react';
import React, { useState } from 'react';
import { Building2, CheckCircle2, ChevronDown, ChevronRight, Download, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API, adminFetch, Drawer, EmptyState, SearchInput, SectionHeader } from './shared';
import type { AuditEntry, AuditGroup, Tenant } from './types';

export function AuditPanel() {
  const [search, setSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState({ action: '', dateFrom: '', dateTo: '', tenantFilter: '' });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const isAllTenants = !auditFilter.tenantFilter;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (auditFilter.action) params.set('action', auditFilter.action);
  if (auditFilter.dateFrom) params.set('dateFrom', auditFilter.dateFrom);
  if (auditFilter.dateTo) params.set('dateTo', auditFilter.dateTo);
  if (auditFilter.tenantFilter) params.set('orgId', auditFilter.tenantFilter);
  params.set('limit', '100');

  const { data, isLoading, refetch } = useStandardQuery<{ logs: AuditEntry[]; total: number }>({
    queryKey: ['admin-audit', search, auditFilter.action, auditFilter.dateFrom, auditFilter.dateTo, auditFilter.tenantFilter],
    queryFn: () => adminFetch(`/admin/audit-log?${params}`),
  });

  const auditGroups: AuditGroup[] = React.useMemo(() => {
    if (!isAllTenants || !data?.logs?.length) return [];
    const map = new Map<string, AuditEntry[]>();
    for (const entry of data.logs) {
      const key = entry.orgName ?? '(Platform / No Org)';
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
    return Array.from(map.entries())
      .map(([orgName, logs]) => ({ orgName, count: logs.length, logs }))
      .sort((a, b) => b.count - a.count);
  }, [isAllTenants, data?.logs]);

  const toggleGroup = (orgName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(orgName)) next.delete(orgName);
      else next.add(orgName);
      return next;
    });
  };

  const { data: tenantsData } = useStandardQuery<{ tenants: Tenant[] }>({
    queryKey: ['admin-tenants'],
    queryFn: () => adminFetch('/admin/orgs'),
  });

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    setExportSuccess(false);
    const csvParams = new URLSearchParams(params);
    csvParams.delete('limit');
    csvParams.set('format', 'csv');
    try {
      const res = await fetch(`${API}/admin/audit-log?${csvParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      const rows = [['ID', 'Action', 'Actor', 'Target', 'Result', 'IP', 'Timestamp', 'Details']];
      (data?.logs ?? []).forEach((l) => {
        rows.push([l.id, l.action, l.actor, l.target, l.result, l.ipAddress ?? '', l.timestamp, l.details ?? '']);
      });
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } finally {
      setExporting(false);
    }
  };

  const actionColors: Record<string, string> = {
    create: 'text-emerald-600 bg-emerald-500/10',
    update: 'text-blue-600 bg-blue-500/10',
    delete: 'text-red-600 bg-red-500/10',
    login: 'text-violet-600 bg-violet-500/10',
    export: 'text-amber-600 bg-amber-500/10',
    execute: 'text-cyan-600 bg-cyan-500/10',
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Audit Log Explorer" subtitle="Platform-wide audit trail" onRefresh={() => refetch()} loading={isLoading} />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user, action, or entity..." />
        </div>
        <input value={auditFilter.action} onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))} placeholder="Filter action..." className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <select value={auditFilter.tenantFilter} onChange={(e) => setAuditFilter((f) => ({ ...f, tenantFilter: e.target.value }))} className={cn('w-full pl-9 pr-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none', auditFilter.tenantFilter ? 'border-primary/50 text-foreground font-medium' : 'border-border')}>
            <option value="">All Tenants</option>
            {(tenantsData?.tenants ?? []).map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
        </div>
        <input type="date" value={auditFilter.dateFrom} onChange={(e) => setAuditFilter((f) => ({ ...f, dateFrom: e.target.value }))} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        <input type="date" value={auditFilter.dateTo} onChange={(e) => setAuditFilter((f) => ({ ...f, dateTo: e.target.value }))} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
      </div>

      {auditFilter.tenantFilter && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Building2 className="w-3.5 h-3.5" />
          <span className="font-medium">Showing events for: {tenantsData?.tenants.find((t) => String(t.id) === auditFilter.tenantFilter)?.name ?? 'selected tenant'}</span>
          <button onClick={() => setAuditFilter((f) => ({ ...f, tenantFilter: '' }))} className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      <div className="flex justify-end items-center gap-2">
        {exportSuccess && <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Downloaded</span>}
        <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</> : <><Download className="w-3.5 h-3.5" /> Export CSV</>}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data?.logs?.length ? (
        <EmptyState message="No audit events match your filters." />
      ) : isAllTenants ? (
        <div className="space-y-3">
          {auditGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.orgName);
            const isNoOrg = group.orgName === '(Platform / No Org)';
            return (
              <div key={group.orgName} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggleGroup(group.orgName)} className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left border-b border-border/50">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', isNoOrg ? 'bg-muted' : 'bg-violet-500/10')}>
                    <Building2 className={cn('w-3.5 h-3.5', isNoOrg ? 'text-muted-foreground' : 'text-violet-500')} />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1 truncate">{group.orgName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 border-violet-500/20 uppercase tracking-wider shrink-0">{group.count} {group.count === 1 ? 'event' : 'events'}</span>
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-border/50">
                    <div className="px-4 py-2 bg-muted/10 grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span className="col-span-3">Action</span><span className="col-span-3">Actor</span><span className="col-span-3">Target</span><span className="col-span-2">IP</span><span className="col-span-1 text-right">Time</span>
                    </div>
                    {group.logs.map((l) => {
                      const actionClass = actionColors[l.action.toLowerCase()] ?? 'text-muted-foreground bg-muted';
                      return (
                        <button key={l.id} onClick={() => setSelectedEntry(l)} className="w-full px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/10 transition-colors text-left">
                          <span className={cn('col-span-3 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block uppercase tracking-wider w-fit', actionClass)}>{l.action}</span>
                          <span className="col-span-3 text-xs text-foreground truncate font-medium">{l.actor}</span>
                          <span className="col-span-3 text-xs text-muted-foreground truncate">{l.target}</span>
                          <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{l.ipAddress ?? '—'}</span>
                          <span className="col-span-1 text-[10px] text-muted-foreground text-right">{new Date(l.timestamp).toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50 overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-2">Action</span><span className="col-span-2">Actor</span><span className="col-span-2">Org</span><span className="col-span-2">Target</span><span className="col-span-2">IP</span><span className="col-span-2 text-right">Time</span>
          </div>
          {data.logs.map((l) => {
            const actionClass = actionColors[l.action.toLowerCase()] ?? 'text-muted-foreground bg-muted';
            return (
              <button key={l.id} onClick={() => setSelectedEntry(l)} className="w-full px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/10 transition-colors text-left">
                <span className={cn('col-span-2 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block uppercase tracking-wider w-fit', actionClass)}>{l.action}</span>
                <span className="col-span-2 text-xs text-foreground truncate font-medium">{l.actor}</span>
                <span className="col-span-2">
                  {l.orgName ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 border-violet-500/20 uppercase tracking-wider truncate max-w-full"><Building2 className="w-2.5 h-2.5 shrink-0" />{l.orgName}</span> : <span className="text-[10px] text-muted-foreground/40">—</span>}
                </span>
                <span className="col-span-2 text-xs text-muted-foreground truncate">{l.target}</span>
                <span className="col-span-2 text-[10px] text-muted-foreground font-mono">{l.ipAddress ?? '—'}</span>
                <span className="col-span-2 text-[10px] text-muted-foreground text-right">{new Date(l.timestamp).toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      )}

      <Drawer open={selectedEntry != null} onClose={() => setSelectedEntry(null)} title="Audit Event Details">
        {selectedEntry && (
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                { label: 'Event ID', value: selectedEntry.id },
                { label: 'Action', value: selectedEntry.action },
                { label: 'Actor', value: selectedEntry.actor },
                { label: 'Org', value: selectedEntry.orgName ?? '—' },
                { label: 'Target', value: selectedEntry.target },
                { label: 'Result', value: selectedEntry.result },
                { label: 'IP Address', value: selectedEntry.ipAddress ?? '—' },
                { label: 'Timestamp', value: new Date(selectedEntry.timestamp).toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium text-foreground text-right break-all">{item.value}</span>
                </div>
              ))}
            </div>
            {selectedEntry.details && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">Full Payload</h4>
                <pre className="bg-muted/50 rounded-xl p-4 text-[10px] font-mono text-foreground overflow-auto whitespace-pre-wrap break-all">
                  {(() => { try { return JSON.stringify(JSON.parse(selectedEntry.details), null, 2); } catch { return selectedEntry.details; } })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
