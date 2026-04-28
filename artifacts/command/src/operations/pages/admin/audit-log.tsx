import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Layers,
  Link2,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface ChainVerifyResult {
  intact: boolean;
  chainLength: number;
  brokenAt: number | null;
  verifiedAt: string;
}

function ChainIntegrityWidget() {
  const [result, setResult] = useState<ChainVerifyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exportingChain, setExportingChain] = useState<'csv' | 'json' | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/audit-chain/verify');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setResult(json.data ?? json);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportChain = async (format: 'csv' | 'json') => {
    setExportingChain(format);
    setErr(null);
    try {
      const r = await fetch(`/api/audit-chain/export?format=${format}`);
      if (!r.ok) {
        setErr(`Export failed: ${r.status}`);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-chain-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportingChain(null);
    }
  };

  const intact = result?.intact === true;
  const broken = result?.intact === false;

  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 flex-wrap">
      <Link2 className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-[180px]">
        <div className="text-xs font-semibold flex items-center gap-2">
          Tamper-Evident Chain
          {intact && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6b8f71]">
              <CheckCircle2 className="w-3 h-3" /> INTACT
            </span>
          )}
          {broken && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c45a4a]">
              <ShieldAlert className="w-3 h-3" /> BROKEN @ #{result?.brokenAt}
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {result
            ? `${result.chainLength} events · verified ${new Date(result.verifiedAt).toLocaleTimeString()}`
            : 'SHA-256 hash chain · click Verify to recompute every link'}
          {err && <span className="ml-2 text-[#c45a4a]">{err}</span>}
        </div>
      </div>
      <button
        onClick={run}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-50"
      >
        {busy ? 'Verifying…' : 'Verify Chain'}
      </button>
      <button
        onClick={() => exportChain('csv')}
        disabled={exportingChain !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-muted hover:bg-muted/70 text-foreground border border-border disabled:opacity-50"
      >
        {exportingChain === 'csv' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        Chain CSV
      </button>
      <button
        onClick={() => exportChain('json')}
        disabled={exportingChain !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-muted hover:bg-muted/70 text-foreground border border-border disabled:opacity-50"
      >
        {exportingChain === 'json' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        Chain JSON
      </button>
    </div>
  );
}

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function triggerExport(format: 'csv' | 'pdf', filters: Record<string, string>) {
  const r = await fetch('/api/exports/audit-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, ...filters }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error ?? `Export failed: ${r.status}`);
  }
  const blob = await r.blob();
  const exportId = r.headers.get('X-Export-Id') ?? 'export';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${exportId}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  result: string;
  details: string | null;
  ipAddress: string | null;
  orgName: string | null;
}

interface TenantGroup {
  orgName: string;
  count: number;
  logs: AuditEntry[];
}

interface AuditLogResponse {
  logs?: AuditEntry[];
  groups?: TenantGroup[];
  total: number;
}

const actionIcons: Record<string, typeof FileText> = {
  auth: Shield,
  user: User,
  system: Zap,
  data: FileText,
};

const resultColors: Record<string, string> = {
  success: 'text-[#6b8f71]',
  failure: 'text-[#c45a4a]',
  warning: 'text-[#d4a054]',
};

function getActionCategory(action: string): string {
  if (action.startsWith('user.') || action === 'login' || action === 'logout') return 'user';
  if (action.includes('auth') || action.includes('session')) return 'auth';
  if (action.includes('system') || action.includes('seed') || action.includes('retention')) return 'system';
  return 'data';
}

function OrgBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/8 text-primary/70 border border-primary/15 shrink-0">
      <Building className="w-2.5 h-2.5" />
      {name}
    </span>
  );
}

function AuditRow({ log }: { log: AuditEntry }) {
  const category = getActionCategory(log.action);
  const ActIcon = actionIcons[category] ?? FileText;
  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5 p-1.5 rounded-md text-muted-foreground bg-muted">
            <ActIcon className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{log.details ?? log.action}</span>
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-mono">
                {log.action}
              </span>
              <span className={`text-[10px] font-bold ${resultColors[log.result] ?? 'text-muted-foreground'}`}>
                {log.result}
              </span>
              {log.orgName && <OrgBadge name={log.orgName} />}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {log.actor}
              </span>
              <span>Target: {log.target}</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {new Date(log.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function TenantGroupSection({ group }: { group: TenantGroup }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted/70 transition-colors border-b border-border text-left"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <Building className="w-3.5 h-3.5 text-primary/60 shrink-0" />
        <span className="text-xs font-semibold flex-1">{group.orgName}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{group.count} events</span>
      </button>
      {!collapsed && (
        <div className="divide-y divide-border">
          {group.logs.map((log) => (
            <AuditRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [orgId, setOrgId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, error } = useStandardQuery<AuditLogResponse>({
    queryKey: ['audit-log', search, actionFilter, orgId, dateFrom, dateTo, grouped],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (actionFilter !== 'all') qs.set('action', actionFilter);
      if (orgId) qs.set('orgId', orgId);
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);
      if (grouped && !orgId) qs.set('grouped', 'true');
      return apiFetch(`/admin/audit-log${qs.toString() ? `?${qs}` : ''}`);
    },
    staleTime: 10000,
  });

  const logs = data?.logs ?? [];
  const groups = data?.groups ?? [];
  const isGroupedView = grouped && !orgId && groups.length > 0;

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(format);
    setExportError(null);
    try {
      const filters: Record<string, string> = {};
      if (search) filters.search = search;
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (orgId) filters.orgId = orgId;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      await triggerExport(format, filters);
    } catch (err) {
      setExportError(String(err));
    } finally {
      setExporting(null);
    }
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Audit Log
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete event history for security, compliance, and debugging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDateFilter((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${hasDateFilter ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-border hover:bg-muted'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Date Range
            {hasDateFilter && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />}
          </button>
          <button
            onClick={() => setGrouped((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${grouped ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-border hover:bg-muted'}`}
            title="Group events by tenant"
          >
            <Layers className="w-3.5 h-3.5" />
            Group by Tenant
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 text-foreground border border-border transition-colors disabled:opacity-50"
          >
            {exporting === 'csv' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exporting === 'csv' ? 'Exporting…' : 'CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors disabled:opacity-50"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
        </div>
      </div>

      {showDateFilter && (
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 text-xs bg-background rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 text-xs bg-background rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {hasDateFilter && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {exportError && (
        <div className="flex items-center gap-2 p-3 bg-[#c45a4a]/10 text-[#c45a4a] text-xs rounded-xl border border-[#c45a4a]/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {exportError}
          <button onClick={() => setExportError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <ChainIntegrityWidget />

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Audit log requires API connection</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {['all', 'auth', 'user', 'system', 'data'].map((act) => (
                <button
                  key={act}
                  onClick={() => setActionFilter(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionFilter === act ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {act === 'all' ? 'All' : act.charAt(0).toUpperCase() + act.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="Org ID filter…"
                className="w-28 px-2 py-1.5 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                title="Filter by org ID to scope results and CSV export"
              />
              {orgId && (
                <button
                  onClick={() => setOrgId('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {data?.total ?? 0} total events
                {orgId && (
                  <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    <Building className="w-2.5 h-2.5" /> Org {orgId}
                  </span>
                )}
                {grouped && !orgId && (
                  <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    <Layers className="w-2.5 h-2.5" /> Grouped
                  </span>
                )}
              </span>
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isGroupedView ? (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {groups.map((group) => (
                  <TenantGroupSection key={group.orgName} group={group} />
                ))}
                {groups.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No logs found</div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
                {logs.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No logs found</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
