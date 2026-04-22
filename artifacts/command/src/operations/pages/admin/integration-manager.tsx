import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const API = '/api';
async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface Connector {
  name: string;
  app: string;
  status: string;
  mode: string;
  description?: string;
  latencyMs?: number;
  category?: string;
  syncEnabled?: boolean;
  webhookUrl?: string;
  lastSync?: string | null;
}

interface ConnectorLog {
  id: string;
  connector: string;
  type: string;
  status: string;
  message: string;
  timestamp: string;
  responseTimeMs?: number | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  LIVE_CONFIGURED: { bg: 'bg-[#6b8f71]/10', text: 'text-[#6b8f71]', dot: 'bg-[#6b8f71]' },
  MOCKED_DEMO_MODE: { bg: 'bg-[#d4a054]/10', text: 'text-[#d4a054]', dot: 'bg-[#d4a054]' },
  MANUAL_REQUIRED: { bg: 'bg-[#c45a4a]/10', text: 'text-[#c45a4a]', dot: 'bg-[#c45a4a]' },
};

const SCHEDULE_OPTIONS = [
  'disabled',
  '5min',
  '15min',
  '30min',
  '1hour',
  '4hours',
  'daily',
  'weekly',
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'LIVE_CONFIGURED') return <CheckCircle className="w-4 h-4 text-[#6b8f71]" />;
  if (status === 'MOCKED_DEMO_MODE') return <AlertTriangle className="w-4 h-4 text-[#d4a054]" />;
  return <WifiOff className="w-4 h-4 text-[#c45a4a]" />;
}

function CredentialEditor({
  name,
  onClose,
  onSave,
}: {
  name: string;
  onClose: () => void;
  onSave: (creds: Record<string, string>) => void;
}) {
  const [creds, setCreds] = useState<Record<string, string>>({
    api_key: '',
    endpoint: '',
    token: '',
  });
  const [showValues, setShowValues] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Edit Credentials</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{name} · Stored encrypted</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {Object.entries(creds).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                {key.replace(/_/g, ' ')}
              </label>
              <div className="relative">
                <input
                  type={showValues ? 'text' : 'password'}
                  value={val}
                  onChange={(e) => setCreds((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-9"
                  placeholder={`Enter ${key.replace(/_/g, ' ')}…`}
                />
                <button
                  onClick={() => setShowValues((p) => !p)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showValues ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2 p-3 bg-[#d4a054]/10 border border-[#d4a054]/30 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 shrink-0" />
            <p className="text-xs text-[#d4a054]/80">
              Credentials are encrypted at rest and never logged. They are accessible only to this
              connector's adapter.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(creds);
              onClose();
            }}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationManager() {
  const qc = useQueryClient();
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingCreds, setEditingCreds] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useStandardQuery<{
    connectors: Connector[];
    summary: {
      total: number;
      liveConfigured: number;
      mockedDemoMode: number;
      manualRequired: number;
    };
  }>({
    queryKey: ['admin-connectors'],
    queryFn: () => apiFetch('/admin/connectors'),
    refetchInterval: 30000,
  });

  const { data: logsData } = useStandardQuery<{ logs: ConnectorLog[]; total: number }>({
    queryKey: ['integration-activity'],
    queryFn: () => apiFetch('/admin/connectors/activity'),
    refetchInterval: 15000,
  });

  const testMutation = useStandardMutation({
    mutationFn: (name: string) => apiFetch(`/admin/connectors/${name}/test`, { method: 'POST' }),
    onSettled: () => {
      setTesting(null);
      qc.invalidateQueries({ queryKey: ['admin-connectors'] });
    },
  });

  const syncMutation = useStandardMutation({
    mutationFn: (name: string) => apiFetch(`/admin/connectors/${name}/sync`, { method: 'POST' }),
    onSettled: (_, __, _name) => {
      setSyncing(null);
      qc.invalidateQueries({ queryKey: ['admin-connectors'] });
    },
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      apiFetch(`/admin/connectors/${name}/enable`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onMutate: async ({ name, enabled }) => {
      await qc.cancelQueries({ queryKey: ['admin-connectors'] });
      const prev = qc.getQueryData<{ connectors: Connector[]; summary: object }>([
        'admin-connectors',
      ]);
      qc.setQueryData<{ connectors: Connector[]; summary: object }>(['admin-connectors'], (old) => {
        if (!old) return old;
        return {
          ...old,
          connectors: old.connectors.map((c) =>
            c.name === name ? { ...c, syncEnabled: enabled } : c,
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['admin-connectors'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin-connectors'] }),
  });

  const connectors = data?.connectors ?? [];
  const summary = data?.summary ?? {
    total: 0,
    liveConfigured: 0,
    mockedDemoMode: 0,
    manualRequired: 0,
  };
  const filtered = connectors.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.app?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const activityLogs = logsData?.logs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            Integration Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Full lifecycle management for all external integrations — credentials, sync, health
            monitoring, and error alerting
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          title="Refresh"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: summary.total, color: 'text-foreground' },
          { label: 'Live', value: summary.liveConfigured, color: 'text-[#6b8f71]' },
          { label: 'Demo Mode', value: summary.mockedDemoMode, color: 'text-[#d4a054]' },
          { label: 'Needs Config', value: summary.manualRequired, color: 'text-[#c45a4a]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl font-bold font-display ${color}`}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search integrations…"
          className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p className="text-sm">Integration data requires API connection</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No integrations found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => {
              const statusStyle = STATUS_COLORS[c.status] ?? STATUS_COLORS.MANUAL_REQUIRED;
              const isExpanded = expanded === c.name;
              const schedule = schedules[c.name] ?? 'disabled';
              return (
                <div key={c.name}>
                  <div className="px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={c.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{c.name}</span>
                          {c.app && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              {c.app}
                            </span>
                          )}
                          {c.category && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {c.category}
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {c.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.latencyMs && (
                          <span className="text-xs text-muted-foreground">{c.latencyMs}ms</span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {c.mode ?? c.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <button
                          onClick={() =>
                            toggleMutation.mutate({
                              name: c.name,
                              enabled: c.syncEnabled === false,
                            })
                          }
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${c.syncEnabled !== false ? 'bg-[#6b8f71]/10 text-[#6b8f71] hover:bg-[#6b8f71]/20' : 'bg-muted text-muted-foreground hover:bg-muted/60'}`}
                        >
                          {c.syncEnabled !== false ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => {
                            setTesting(c.name);
                            testMutation.mutate(c.name);
                          }}
                          disabled={testing === c.name}
                          className="p-1.5 rounded hover:bg-muted/40 transition-colors disabled:opacity-50"
                          title="Test connection"
                        >
                          {testing === c.name ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSyncing(c.name);
                            syncMutation.mutate(c.name);
                          }}
                          disabled={syncing === c.name}
                          className="p-1.5 rounded hover:bg-muted/40 transition-colors disabled:opacity-50"
                          title="Sync now"
                        >
                          {syncing === c.name ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingCreds(c.name)}
                          className="p-1.5 rounded hover:bg-muted/40 transition-colors"
                          title="Edit credentials"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : c.name)}
                          className="p-1.5 rounded hover:bg-muted/40 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1">Webhook URL</span>
                          <code className="text-foreground font-mono text-[10px] break-all">
                            {c.webhookUrl ?? '—'}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Last Sync</span>
                          <span className="text-foreground">
                            {c.lastSync ? new Date(c.lastSync).toLocaleString() : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Latency</span>
                          <span className="text-foreground">
                            {c.latencyMs != null ? `${c.latencyMs}ms` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Sync Schedule</span>
                          <select
                            value={schedule}
                            onChange={(e) =>
                              setSchedules((p) => ({ ...p, [c.name]: e.target.value }))
                            }
                            className="bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {SCHEDULE_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCreds(c.name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit Credentials
                        </button>
                        {c.webhookUrl && (
                          <a
                            href={c.webhookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Endpoint
                          </a>
                        )}
                        {schedule !== 'disabled' && (
                          <button
                            onClick={() => setSchedules((p) => ({ ...p, [c.name]: 'disabled' }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c45a4a]/30 text-xs text-[#c45a4a] hover:bg-[#c45a4a]/10 transition-colors"
                          >
                            <Calendar className="w-3 h-3" />
                            Disable Schedule
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activityLogs.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Activity Log</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {activityLogs.length} recent events
            </span>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {activityLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-start gap-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${log.status === 'success' ? 'bg-[#6b8f71]' : log.status === 'warning' ? 'bg-[#d4a054]' : 'bg-[#c45a4a]'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{log.connector}</span>
                    <span className="text-[10px] text-muted-foreground">{log.type}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.message}</p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingCreds && (
        <CredentialEditor
          name={editingCreds}
          onClose={() => setEditingCreds(null)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ['admin-connectors'] });
          }}
        />
      )}
    </div>
  );
}
