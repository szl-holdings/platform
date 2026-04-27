import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const API = `${BASE}/api`;

type DataDomain =
  | 'audit_events'
  | 'aegis_incidents'
  | 'vessels'
  | 'terra_deals'
  | 'lyte_signals'
  | 'msp_tickets'
  | 'usage_metering'
  | 'revenue_events';

interface ColumnDef {
  key: string;
  label: string;
  default?: boolean;
}

interface ExportHistoryItem {
  id: number;
  exportId: string;
  name: string;
  dataSource: string;
  format: 'csv' | 'pdf';
  status: 'processing' | 'completed' | 'failed';
  rowCount: number | null;
  fileSizeBytes: number | null;
  downloadToken: string;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  triggeredByEmail: string | null;
  scheduleFrequency: string | null;
}

const DATA_SOURCE_TO_DOMAIN: Record<string, DataDomain> = {
  audit_events: 'audit_events',
  firestorm_findings: 'aegis_incidents',
  vessels: 'vessels',
  terra_deals: 'terra_deals',
  lyte_signals: 'lyte_signals',
  msp_tickets: 'msp_tickets',
  metering_events: 'usage_metering',
  invoices: 'revenue_events',
};

const HISTORY_PAGE_SIZE = 20;

interface HistoryFilters {
  dataSource: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  page: number;
}

interface ExportHistoryResult {
  items: ExportHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

async function fetchExportHistoryItems(filters: HistoryFilters): Promise<ExportHistoryResult> {
  const params = new URLSearchParams();
  params.set('limit', String(HISTORY_PAGE_SIZE));
  params.set('page', String(filters.page));
  if (filters.dataSource) params.set('dataSource', filters.dataSource);
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.search) params.set('search', filters.search);
  const res = await fetch(`${API}/exports/history?${params}`, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 403) return { items: [], total: 0, page: 1, limit: HISTORY_PAGE_SIZE };
    throw new Error(`Failed to load export history (${res.status})`);
  }
  const json = await res.json();
  const items: ExportHistoryItem[] = Array.isArray(json.data) ? json.data : [];
  const meta = json.meta ?? {};
  return { items, total: meta.total ?? items.length, page: meta.page ?? 1, limit: meta.limit ?? HISTORY_PAGE_SIZE };
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const DOMAIN_CONFIGS: Record<
  DataDomain,
  { label: string; endpoint: string; color: string; columns: ColumnDef[] }
> = {
  audit_events: {
    label: 'Audit Logs',
    endpoint: '/exports/audit-log',
    color: '#c2a55a',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'createdAt', label: 'Timestamp', default: true },
      { key: 'action', label: 'Action', default: true },
      { key: 'entityType', label: 'Entity Type', default: true },
      { key: 'entityId', label: 'Entity ID', default: true },
      { key: 'userEmail', label: 'Actor Email', default: true },
      { key: 'userName', label: 'Actor Name' },
      { key: 'ipAddress', label: 'IP Address' },
      { key: 'userAgent', label: 'User Agent' },
    ],
  },
  aegis_incidents: {
    label: 'Aegis Incidents',
    endpoint: '/exports/aegis-incidents',
    color: '#06b6d4',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'createdAt', label: 'Created At', default: true },
      { key: 'title', label: 'Title', default: true },
      { key: 'severity', label: 'Severity', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'recommendation', label: 'Recommendation' },
    ],
  },
  vessels: {
    label: 'Vessels Fleet',
    endpoint: '/exports/vessels',
    color: '#3b82f6',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'name', label: 'Vessel Name', default: true },
      { key: 'mmsi', label: 'MMSI', default: true },
      { key: 'imo', label: 'IMO' },
      { key: 'type', label: 'Type', default: true },
      { key: 'flag', label: 'Flag' },
      { key: 'status', label: 'Status', default: true },
      { key: 'currentPort', label: 'Current Port' },
      { key: 'nextPort', label: 'Next Port' },
      { key: 'grossTonnage', label: 'Gross Tonnage' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
  terra_deals: {
    label: 'Terra Deals',
    endpoint: '/exports/terra-deals',
    color: '#22c55e',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'address', label: 'Address', default: true },
      { key: 'borough', label: 'Borough', default: true },
      { key: 'stage', label: 'Stage', default: true },
      { key: 'type', label: 'Deal Type', default: true },
      { key: 'price', label: 'Price', default: true },
      { key: 'askingPrice', label: 'Asking Price' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'clientName', label: 'Client' },
      { key: 'estimatedCloseDate', label: 'Est. Close Date' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
  lyte_signals: {
    label: 'Lyte Signals',
    endpoint: '/exports/lyte-signals',
    color: '#8b5cf6',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'title', label: 'Signal Title', default: true },
      { key: 'severity', label: 'Severity', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'source', label: 'Source', default: true },
      { key: 'sourceType', label: 'Source Type' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
  msp_tickets: {
    label: 'MSP Tickets',
    endpoint: '/exports/msp-tickets',
    color: '#f59e0b',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'ticketNumber', label: 'Ticket #', default: true },
      { key: 'subject', label: 'Subject', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'priority', label: 'Priority', default: true },
      { key: 'category', label: 'Category' },
      { key: 'clientName', label: 'Client' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'slaStatus', label: 'SLA Status' },
      { key: 'resolvedAt', label: 'Resolved At' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
  usage_metering: {
    label: 'Usage Metering',
    endpoint: '/exports/usage-metering',
    color: '#e879f9',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'orgId', label: 'Org ID', default: true },
      { key: 'featureKey', label: 'Feature', default: true },
      { key: 'product', label: 'Product', default: true },
      { key: 'quantity', label: 'Quantity', default: true },
      { key: 'unitLabel', label: 'Unit' },
      { key: 'occurredAt', label: 'Occurred At', default: true },
    ],
  },
  revenue_events: {
    label: 'Revenue Events',
    endpoint: '/exports/revenue-events',
    color: '#10b981',
    columns: [
      { key: 'id', label: 'ID', default: true },
      { key: 'orgId', label: 'Org ID', default: true },
      { key: 'stripeInvoiceId', label: 'Stripe Invoice', default: true },
      { key: 'amount', label: 'Amount', default: true },
      { key: 'currency', label: 'Currency', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'paidAt', label: 'Paid At' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
};

const STATUSES = ['all', 'active', 'completed', 'pending', 'draft', 'open', 'closed', 'canceled'];

interface ExportJob {
  exportId: string;
  name: string;
  dataSource: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rowCount: number | null;
  fileSizeBytes: number | null;
  expiresAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  triggeredByEmail: string | null;
  filterParams: string | null;
  downloadAvailable: boolean;
  expired?: boolean;
  createdAt: string;
}

interface ActiveExport {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  name: string;
  format: string;
  startedAt: number;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    failed: 'bg-red-950 text-red-400 border-red-800',
    processing: 'bg-blue-950 text-blue-400 border-blue-800',
    pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${colors[status] ?? colors.pending}`}
    >
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {status}
    </span>
  );
}

function ColumnToggle({
  col,
  enabled,
  onToggle,
}: {
  col: ColumnDef;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 group">
      <div
        className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
          enabled
            ? 'bg-[#c2a55a] border-[#c2a55a]'
            : 'border-zinc-600 bg-transparent hover:border-zinc-400'
        }`}
        onClick={onToggle}
      >
        {enabled && <span className="text-zinc-900 text-[10px] font-bold">✓</span>}
      </div>
      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
        {col.label}
      </span>
    </label>
  );
}

async function fetchPreviewData(domain: DataDomain, filters: Record<string, string>) {
  const params = new URLSearchParams({ domain, limit: '20' });
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.orgId) params.set('orgId', filters.orgId);
  const res = await fetch(`${API}/exports/preview?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

async function fetchExportHistory(): Promise<ExportJob[]> {
  const res = await fetch(`${API}/exports/history?limit=20`, { credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

async function pollJobStatus(exportId: string): Promise<ExportJob | null> {
  const res = await fetch(`${API}/exports/jobs/${exportId}`, { credentials: 'include' });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.data ?? json) as ExportJob;
}

export default function ExportBuilder() {
  const _queryClient = useQueryClient();
  const [domain, setDomain] = useState<DataDomain>('audit_events');
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: string;
    orgId?: string;
    schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
  }>({ schedule: 'once' });

  const config = DOMAIN_CONFIGS[domain];
  const [enabledColumns, setEnabledColumns] = useState<Set<string>>(
    new Set(config.columns.filter((c) => c.default).map((c) => c.key)),
  );

  const [activeExport, setActiveExport] = useState<ActiveExport | null>(null);
  const [exportMsg, setExportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reDownloadItem, setReDownloadItem] = useState<ExportHistoryItem | null>(null);

  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({
    dataSource: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1,
  });
  const [historySearchInput, setHistorySearchInput] = useState('');
  const historySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: historyResult,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistoryItems,
  } = useStandardQuery({
    queryKey: ['export-history-items', historyFilters],
    queryFn: () => fetchExportHistoryItems(historyFilters),
    refetchInterval: 30_000,
    retry: 1,
  });
  const exportHistory = historyResult?.items ?? [];
  const historyTotal = historyResult?.total ?? 0;
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / HISTORY_PAGE_SIZE));

  const { data: previewData, isLoading: previewLoading } = useStandardQuery({
    queryKey: ['export-preview', domain, filters],
    queryFn: () =>
      fetchPreviewData(domain, {
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
      }),
    enabled: previewMode,
  });

  const { data: historyData, refetch: refetchHistory } = useStandardQuery({
    queryKey: ['export-history'],
    queryFn: fetchExportHistory,
    enabled: showHistory,
    refetchInterval: activeExport ? 5000 : false,
  });

  const handleDomainChange = (d: DataDomain) => {
    setDomain(d);
    const newConfig = DOMAIN_CONFIGS[d];
    setEnabledColumns(new Set(newConfig.columns.filter((c) => c.default).map((c) => c.key)));
    setPreviewMode(false);
    setExportMsg(null);
  };

  const toggleColumn = (key: string) => {
    setEnabledColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!activeExport) return;
    if (activeExport.status === 'completed' || activeExport.status === 'failed') return;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const job = await pollJobStatus(activeExport.exportId);
      if (!job) return;

      const elapsed = (Date.now() - activeExport.startedAt) / 1000;
      const estimatedProgress = Math.min(90, elapsed * 15);

      if (job.status === 'completed') {
        if (pollRef.current) clearInterval(pollRef.current);
        setActiveExport((prev) => (prev ? { ...prev, status: 'completed', progress: 100 } : null));
        refetchHistory();
        refetchHistoryItems();
        await triggerDownload(activeExport.exportId, activeExport.format, activeExport.name);
        setTimeout(() => {
          setActiveExport(null);
          setExportMsg({
            type: 'success',
            text: `Export complete — ${job.rowCount?.toLocaleString() ?? 0} rows, ${formatBytes(job.fileSizeBytes)}`,
          });
        }, 600);
      } else if (job.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
        setActiveExport((prev) => (prev ? { ...prev, status: 'failed', progress: 0 } : null));
        setTimeout(() => {
          setActiveExport(null);
          setExportMsg({
            type: 'error',
            text: `Export failed: ${job.errorMessage ?? 'Unknown error'}`,
          });
        }, 600);
      } else {
        setActiveExport((prev) =>
          prev ? { ...prev, status: job.status, progress: estimatedProgress } : null,
        );
      }
    }, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeExport?.exportId]);

  async function triggerDownload(exportId: string, fmt: string, name: string) {
    try {
      const res = await fetch(`${API}/exports/jobs/${exportId}/download`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function handleReDownload(exportId: string, fmt: string, name: string) {
    setDownloadingId(exportId);
    try {
      await triggerDownload(exportId, fmt, name);
    } finally {
      setDownloadingId(null);
    }
  }

  const handleExport = async (override?: { domain?: DataDomain }) => {
    if (activeExport) return;
    setExportMsg(null);
    try {
      const exportDomain = override?.domain ?? domain;
      const exportConfig = DOMAIN_CONFIGS[exportDomain];
      const exportColumns = override?.domain
        ? exportConfig.columns.filter((c) => c.default).map((c) => c.key)
        : activeColumns.map((c) => c.key);
      const body: Record<string, unknown> = {
        domain: exportDomain,
        format,
        schedule: filters.schedule || 'once',
        columns: exportColumns,
      };
      if (filters.dateFrom) body.dateFrom = filters.dateFrom;
      if (filters.dateTo) body.dateTo = filters.dateTo;
      if (filters.search) body.search = filters.search;
      if (filters.status && filters.status !== 'all') body.status = filters.status;
      if (filters.orgId && !Number.isNaN(parseInt(filters.orgId, 10))) body.orgId = parseInt(filters.orgId, 10);

      const res = await fetch(`${API}/exports/enqueue`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const data = json.data ?? json;
      setActiveExport({
        exportId: data.exportId,
        status: 'pending',
        progress: 5,
        name: data.name,
        format: data.format,
        startedAt: Date.now(),
      });
      if (!showHistory) setShowHistory(true);
    } catch (err) {
      setExportMsg({ type: 'error', text: err instanceof Error ? err.message : 'Export failed' });
    }
  };

  const columns = config.columns;
  const activeColumns = columns.filter((c) => enabledColumns.has(c.key));

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <a
          href={`${BASE}/reports`}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Reports Hub
        </a>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-zinc-100">Data Export Builder</h1>
          <p className="text-xs text-zinc-500">
            Select data source, apply filters, pick columns, and export
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowHistory((s) => !s);
              refetchHistory();
            }}
            className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
              showHistory
                ? 'border-[#c2a55a] text-[#c2a55a] bg-[#c2a55a]/10'
                : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
            }`}
          >
            Export History
          </button>
          <a
            href={`${BASE}/reports/scheduled`}
            className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
          >
            Scheduled Reports
          </a>
        </div>
      </div>

      {/* Active export progress banner */}
      <AnimatePresence>
        {activeExport && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {activeExport.status !== 'failed' && activeExport.status !== 'completed' && (
                    <svg
                      className="animate-spin w-3.5 h-3.5 text-[#c2a55a]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  <span className="text-xs text-zinc-300 font-medium">
                    {activeExport.status === 'pending' && 'Queuing export…'}
                    {activeExport.status === 'processing' && `Generating ${activeExport.name}…`}
                    {activeExport.status === 'completed' && 'Export complete — downloading…'}
                    {activeExport.status === 'failed' && 'Export failed'}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">{Math.round(activeExport.progress)}%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: activeExport.status === 'failed' ? '#ef4444' : '#c2a55a',
                  }}
                  animate={{ width: `${activeExport.progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                {activeExport.status === 'pending' && 'Job queued — processing will begin shortly'}
                {activeExport.status === 'processing' && 'Querying database and building file…'}
                {activeExport.status === 'completed' && 'File ready — download starting'}
                {activeExport.status === 'failed' && 'Check the Export History for details'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {exportMsg && !activeExport && (
        <div
          className={`px-6 py-2 text-xs flex items-center justify-between ${exportMsg.type === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}
        >
          <span>{exportMsg.text}</span>
          <button onClick={() => setExportMsg(null)} className="opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: configuration */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950 overflow-y-auto shrink-0 p-4 space-y-5">
          {/* Data Domain */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Data Source</p>
            <div className="space-y-1">
              {(
                Object.entries(DOMAIN_CONFIGS) as [
                  DataDomain,
                  (typeof DOMAIN_CONFIGS)[DataDomain],
                ][]
              ).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleDomainChange(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    domain === key
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                  }`}
                  style={
                    domain === key
                      ? {
                          backgroundColor: `${cfg.color}18`,
                          borderLeft: `2px solid ${cfg.color}`,
                          paddingLeft: 10,
                        }
                      : {}
                  }
                >
                  <span style={domain === key ? { color: cfg.color } : {}}>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Filters</p>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value || undefined }))
                  }
                  placeholder="Search keywords..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Status</label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {(domain === 'usage_metering' || domain === 'revenue_events') && (
                <div>
                  <label className="text-xs text-zinc-600 block mb-1">
                    Organization ID <span className="text-zinc-700">(tenant filter)</span>
                  </label>
                  <input
                    type="number"
                    value={filters.orgId || ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, orgId: e.target.value || undefined }))
                    }
                    placeholder="e.g. 42 (leave blank for all)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Schedule</label>
                <select
                  value={filters.schedule || 'once'}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      schedule: e.target.value as 'once' | 'daily' | 'weekly' | 'monthly',
                    }))
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="once">Export Once</option>
                  <option value="daily">Daily Delivery</option>
                  <option value="weekly">Weekly Delivery</option>
                  <option value="monthly">Monthly Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Columns</p>
              <span className="text-xs text-zinc-600">
                {enabledColumns.size} / {columns.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {columns.map((col) => (
                <ColumnToggle
                  key={col.key}
                  col={col}
                  enabled={enabledColumns.has(col.key)}
                  onToggle={() => toggleColumn(col.key)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Format + actions bar */}
          <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4 bg-zinc-950 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Format:</span>
              <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                {(['csv', 'pdf'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      format === f
                        ? 'bg-[#c2a55a] text-zinc-900 font-medium'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                {previewMode ? 'Hide Preview' : 'Preview Data'}
              </button>
              <button
                onClick={() => handleExport()}
                disabled={!!activeExport}
                className="px-4 py-1.5 text-xs font-medium text-zinc-900 rounded-lg disabled:opacity-40 transition-colors"
                style={{ backgroundColor: config.color }}
              >
                {activeExport ? 'Exporting…' : `Export ${format.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Summary card */}
          <div className="p-6 space-y-4 flex-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${config.color}18` }}
                >
                  <span className="text-lg" style={{ color: config.color }}>
                    ⊞
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-zinc-100 mb-0.5">{config.label}</h2>
                  <p className="text-xs text-zinc-500">
                    {activeColumns.length} columns selected
                    {filters.dateFrom && ` · From ${filters.dateFrom}`}
                    {filters.dateTo && ` · To ${filters.dateTo}`}
                    {filters.search && ` · Search: "${filters.search}"`}
                    {filters.status && filters.status !== 'all' && ` · Status: ${filters.status}`}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: `${config.color}18`, color: config.color }}
                  >
                    {filters.schedule === 'once'
                      ? 'One-time export'
                      : `${filters.schedule} delivery`}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected columns preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Column Preview</p>
                <span className="text-xs text-zinc-600">{activeColumns.length} columns</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {activeColumns.map((col) => (
                        <th
                          key={col.key}
                          className="text-left px-4 py-2.5 text-zinc-500 font-medium whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((row) => (
                      <tr key={row} className="border-b border-zinc-800/50">
                        {activeColumns.map((col) => (
                          <td key={col.key} className="px-4 py-2 text-zinc-600 whitespace-nowrap">
                            <span className="inline-block w-16 h-2 bg-zinc-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-600 px-4 py-2 bg-zinc-900/50">
                Preview shows column structure. Click &quot;Export&quot; to generate the actual
                data.
              </p>
            </div>

            {/* Live preview for supported domains */}
            <AnimatePresence>
              {previewMode && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">
                      Live Data Preview (first 20 records)
                    </p>
                  </div>
                  {previewLoading ? (
                    <div className="px-4 py-8 text-center text-xs text-zinc-600">
                      Loading preview...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            {activeColumns.map((col) => (
                              <th
                                key={col.key}
                                className="text-left px-3 py-2 text-zinc-500 font-medium whitespace-nowrap"
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(previewData ?? [])
                            .slice(0, 20)
                            .map((row: Record<string, unknown>, i: number) => (
                              <tr
                                key={i}
                                className="border-b border-zinc-800/40 hover:bg-zinc-800/30"
                              >
                                {activeColumns.map((col) => (
                                  <td
                                    key={col.key}
                                    className="px-3 py-2 text-zinc-400 whitespace-nowrap max-w-[200px] truncate"
                                  >
                                    {String(row[col.key] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {(previewData ?? []).length === 0 && (
                        <p className="text-xs text-zinc-600 px-4 py-4 text-center">
                          No data found with current filters
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export History */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">
                      Export History
                    </p>
                    <button
                      onClick={() => refetchHistory()}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      ↺ Refresh
                    </button>
                  </div>

                  {!historyData || historyData.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-zinc-600">
                      No exports yet. Run your first export above.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {historyData.map((job: ExportJob) => (
                        <div
                          key={job.exportId}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs text-zinc-200 font-medium truncate">
                                {job.name}
                              </span>
                              <span className="text-[10px] text-zinc-600 uppercase font-medium shrink-0">
                                {job.format}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                              <span>{job.dataSource.replace(/_/g, ' ')}</span>
                              {job.rowCount != null && (
                                <span>{job.rowCount.toLocaleString()} rows</span>
                              )}
                              {job.fileSizeBytes != null && (
                                <span>{formatBytes(job.fileSizeBytes)}</span>
                              )}
                              <span>{formatRelative(job.createdAt)}</span>
                              {job.triggeredByEmail && (
                                <span className="text-zinc-600 truncate max-w-[120px]">
                                  {job.triggeredByEmail}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={job.status} />
                            {job.status === 'completed' &&
                              job.downloadAvailable &&
                              !job.expired && (
                                <button
                                  onClick={() =>
                                    handleReDownload(job.exportId, job.format, job.name)
                                  }
                                  disabled={downloadingId === job.exportId}
                                  className="px-2.5 py-1 text-[11px] border border-zinc-700 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors disabled:opacity-40"
                                >
                                  {downloadingId === job.exportId ? '…' : '↓ Download'}
                                </button>
                              )}
                            {job.status === 'completed' &&
                              (!job.downloadAvailable || job.expired) && (
                                <span
                                  className="text-[11px] text-zinc-700"
                                  title={
                                    job.expired
                                      ? 'Download link expired'
                                      : 'File no longer cached — re-export to download'
                                  }
                                >
                                  {job.expired ? 'Expired' : 'Cache miss'}
                                </span>
                              )}
                            {job.status === 'failed' && job.errorMessage && (
                              <span
                                className="text-[11px] text-red-500 max-w-[150px] truncate"
                                title={job.errorMessage}
                              >
                                {job.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-2 bg-zinc-900/50 text-[11px] text-zinc-600 flex items-center justify-between">
                    <span>Showing last 20 exports · Files available for 24h after generation</span>
                    <span>All exports are logged in the audit trail</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info box */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 font-medium mb-1">Export Info</p>
              <ul className="space-y-1 text-xs text-zinc-600">
                <li>
                  • Exports are queued and processed asynchronously — large datasets won&apos;t time
                  out
                </li>
                <li>• CSV exports up to 10,000 rows with all selected columns</li>
                <li>• PDF exports include branded header and pagination (up to 5,000 rows)</li>
                <li>• Download links expire after 24 hours for security</li>
                <li>
                  • All exports are logged in the audit trail with actor, domain, and row count
                </li>
              </ul>
            </div>

            {/* Export History */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Export History</p>
                <div className="flex items-center gap-2">
                  {historyTotal > 0 && (
                    <span className="text-xs text-zinc-600">{historyTotal.toLocaleString()} total</span>
                  )}
                  <button
                    onClick={() => refetchHistoryItems()}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    ↺ Refresh
                  </button>
                </div>
              </div>

              {/* Filter bar */}
              <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={historySearchInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHistorySearchInput(val);
                    if (historySearchRef.current) clearTimeout(historySearchRef.current);
                    historySearchRef.current = setTimeout(() => {
                      setHistoryFilters((f) => ({ ...f, search: val, page: 1 }));
                    }, 350);
                  }}
                  className="flex-1 min-w-[140px] bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <select
                  value={historyFilters.dataSource}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, dataSource: e.target.value, page: 1 }))}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
                >
                  <option value="">All domains</option>
                  {Object.entries(DATA_SOURCE_TO_DOMAIN).map(([src]) => (
                    <option key={src} value={src}>
                      {DOMAIN_CONFIGS[DATA_SOURCE_TO_DOMAIN[src]]?.label ?? src.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
                >
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <input
                  type="date"
                  value={historyFilters.dateFrom}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
                  title="From date"
                  className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
                <input
                  type="date"
                  value={historyFilters.dateTo}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
                  title="To date"
                  className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
                {(historyFilters.dataSource || historyFilters.status || historyFilters.dateFrom || historyFilters.dateTo || historyFilters.search) && (
                  <button
                    onClick={() => {
                      setHistoryFilters({ dataSource: '', status: '', dateFrom: '', dateTo: '', search: '', page: 1 });
                      setHistorySearchInput('');
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {historyLoading ? (
                <div className="px-4 py-6 text-center">
                  <div className="text-xs text-zinc-600">Loading export history...</div>
                </div>
              ) : historyError ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-red-500">
                    Could not load export history. Check your connection or permissions.
                  </p>
                </div>
              ) : exportHistory.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-zinc-600">
                    {historyFilters.dataSource || historyFilters.status || historyFilters.dateFrom || historyFilters.dateTo || historyFilters.search
                      ? 'No exports match your filters.'
                      : 'No exports yet. Run your first export above.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {exportHistory.map((item) => {
                    const isExpired = item.expiresAt
                      ? new Date(item.expiresAt) < new Date()
                      : false;
                    const mappedDomain: DataDomain | undefined =
                      DATA_SOURCE_TO_DOMAIN[item.dataSource];
                    const domainCfg = mappedDomain ? DOMAIN_CONFIGS[mappedDomain] : undefined;
                    const accentColor = domainCfg?.color ?? '#c2a55a';

                    return (
                      <div
                        key={item.exportId}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/20 transition-colors"
                      >
                        {/* Source color dot */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: accentColor }}
                        />

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-zinc-300 truncate">
                              {item.name}
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0"
                              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                            >
                              {item.format}
                            </span>
                            {item.status === 'processing' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 shrink-0">
                                processing
                              </span>
                            )}
                            {item.status === 'failed' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 shrink-0">
                                failed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-zinc-600">
                              {formatRelativeDate(item.createdAt)}
                            </span>
                            {item.rowCount != null && (
                              <span className="text-[10px] text-zinc-600">
                                {item.rowCount.toLocaleString()} rows
                              </span>
                            )}
                            {item.fileSizeBytes != null && (
                              <span className="text-[10px] text-zinc-600">
                                {formatBytes(item.fileSizeBytes)}
                              </span>
                            )}
                            {item.triggeredByEmail && (
                              <span className="text-[10px] text-zinc-700 truncate max-w-[140px]">
                                {item.triggeredByEmail}
                              </span>
                            )}
                            {isExpired && <span className="text-[10px] text-red-500">expired</span>}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="shrink-0">
                          {item.status === 'completed' && !isExpired ? (
                            <button
                              onClick={() => setReDownloadItem(item)}
                              className="px-2.5 py-1 text-[10px] font-medium rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors whitespace-nowrap"
                            >
                              Re-download
                            </button>
                          ) : item.status === 'completed' && isExpired ? (
                            mappedDomain ? (
                              <button
                                onClick={() => handleDomainChange(mappedDomain)}
                                title="This export has expired. Click to open the builder pre-set to this data source and run a new export."
                                className="px-2.5 py-1 text-[10px] font-medium rounded border border-zinc-700 text-amber-400 hover:border-amber-600 hover:text-amber-300 transition-colors whitespace-nowrap"
                              >
                                Open Builder
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-700 italic">expired</span>
                            )
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    disabled={historyFilters.page <= 1}
                    onClick={() => setHistoryFilters((f) => ({ ...f, page: f.page - 1 }))}
                    className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-[11px] text-zinc-600">
                    Page {historyFilters.page} of {historyTotalPages}
                  </span>
                  <button
                    disabled={historyFilters.page >= historyTotalPages}
                    onClick={() => setHistoryFilters((f) => ({ ...f, page: f.page + 1 }))}
                    className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className="px-4 py-2 bg-zinc-900/50 text-[11px] text-zinc-600 flex items-center justify-between">
                <span>
                  {historyTotal > 0
                    ? `Showing ${Math.min((historyFilters.page - 1) * HISTORY_PAGE_SIZE + 1, historyTotal)}–${Math.min(historyFilters.page * HISTORY_PAGE_SIZE, historyTotal)} of ${historyTotal.toLocaleString()}`
                    : 'No results'}
                  {' · Files available for 24h after generation'}
                </span>
                <span>All exports are logged in the audit trail</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Re-download summary modal */}
      <AnimatePresence>
        {reDownloadItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setReDownloadItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
            >
              {(() => {
                const item = reDownloadItem;
                const mappedDomain: DataDomain | undefined = DATA_SOURCE_TO_DOMAIN[item.dataSource];
                const domainCfg = mappedDomain ? DOMAIN_CONFIGS[mappedDomain] : undefined;
                const accentColor = domainCfg?.color ?? '#c2a55a';
                const expiryDate = item.expiresAt ? new Date(item.expiresAt) : null;
                const isExpired = expiryDate ? expiryDate < new Date() : false;
                return (
                  <>
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
                          Export Details
                        </p>
                        <h2 className="text-sm font-semibold text-zinc-100 truncate">
                          {item.name}
                        </h2>
                      </div>
                      <button
                        onClick={() => setReDownloadItem(null)}
                        className="text-zinc-500 hover:text-zinc-200 text-lg leading-none shrink-0"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Data Source
                          </p>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium"
                            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            {domainCfg?.label ?? item.dataSource}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Format
                          </p>
                          <span className="font-mono uppercase text-zinc-200">{item.format}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Row Count
                          </p>
                          <span className="text-zinc-200">
                            {item.rowCount != null ? item.rowCount.toLocaleString() : '—'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            File Size
                          </p>
                          <span className="text-zinc-200">{formatBytes(item.fileSizeBytes)}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Expires
                          </p>
                          <span className={isExpired ? 'text-red-400' : 'text-zinc-200'}>
                            {expiryDate
                              ? expiryDate.toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Triggered By
                          </p>
                          <span className="text-zinc-200 truncate block">
                            {item.triggeredByEmail ?? '—'}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          For security, export files aren't kept on our servers. To get a fresh
                          copy, regenerate the export below — it will run with the same data source.
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-end gap-2 bg-zinc-950/40">
                      <button
                        onClick={() => setReDownloadItem(null)}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          if (mappedDomain) {
                            handleDomainChange(mappedDomain);
                            setShowHistory(false);
                          }
                          setReDownloadItem(null);
                          if (mappedDomain) handleExport({ domain: mappedDomain });
                        }}
                        disabled={!mappedDomain || !!activeExport}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#c2a55a] text-zinc-900 hover:bg-[#d4b86c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {activeExport ? 'Export in progress…' : 'Regenerate Export'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
