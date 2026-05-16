import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Clock,
  History,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface RuntimeConfigRow {
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  defaultValue: string | null;
  category: string;
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  data: RuntimeConfigRow[];
  meta: { page: number; limit: number; offset: number };
}

interface HistoryEntry {
  id: number;
  key: string | null;
  action: string;
  actor: string;
  actorEmail: string | null;
  actorName: string | null;
  description: string | null;
  metadata: {
    previousValue?: string | null;
    newValue?: string | null;
    changedFields?: string[];
    [k: string]: unknown;
  } | null;
  createdAt: string;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(then)) return iso;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

const actionColors: Record<string, string> = {
  create: 'text-[#6b8f71] bg-[#6b8f71]/10',
  update: 'text-[#4a90b8] bg-[#4a90b8]/10',
  delete: 'text-[#c45a4a] bg-[#c45a4a]/10',
};

const VALUE_TYPES = ['string', 'number', 'boolean', 'json'] as const;
const CATEGORIES = [
  'general',
  'rate_limits',
  'circuit_breaker',
  'slo',
  'jobs',
  'load_shedder',
  'feature_flags',
  'runtime_config',
] as const;

const categoryColors: Record<string, string> = {
  rate_limits: 'text-[#4a90b8] bg-[#4a90b8]/10',
  circuit_breaker: 'text-[#c45a4a] bg-[#c45a4a]/10',
  slo: 'text-violet-400 bg-violet-500/10',
  jobs: 'text-[#d4a054] bg-[#d4a054]/10',
  load_shedder: 'text-pink-400 bg-pink-500/10',
  feature_flags: 'text-[#6b8f71] bg-[#6b8f71]/10',
  runtime_config: 'text-[#8b7ac8] bg-[#8b7ac8]/10',
  general: 'text-muted-foreground bg-muted',
};

const REDACTED = '[redacted]';

interface CreateDraft {
  key: string;
  value: string;
  valueType: (typeof VALUE_TYPES)[number];
  category: (typeof CATEGORIES)[number];
  description: string;
  isSensitive: boolean;
}

const EMPTY_DRAFT: CreateDraft = {
  key: '',
  value: '',
  valueType: 'string',
  category: 'general',
  description: '',
  isSensitive: false,
};

function validateValue(value: string, valueType: CreateDraft['valueType']): string | null {
  if (valueType === 'number' && !Number.isFinite(Number(value))) {
    return 'Value must be a valid number';
  }
  if (valueType === 'boolean' && !['true', 'false', '1', '0'].includes(value.trim())) {
    return 'Value must be true/false';
  }
  if (valueType === 'json') {
    try {
      JSON.parse(value);
    } catch {
      return 'Value must be valid JSON';
    }
  }
  return null;
}

function HistoryDrawer({ configKey, onClose }: { configKey: string; onClose: () => void }) {
  const { data, isLoading, error } = useStandardQuery<{ data: HistoryEntry[] }>({
    queryKey: ['runtime-config-history', configKey],
    queryFn: () =>
      apiFetch(`/runtime-config/_history?key=${encodeURIComponent(configKey)}&limit=50`),
  });
  const entries = data?.data ?? [];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-card border border-border rounded-xl shadow-xl"
      >
        <div className="flex items-start justify-between gap-2 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-base font-display font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Change history
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 break-all">
              <code className="font-mono">{configKey}</code> — last 50 entries
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <AlertTriangle className="w-5 h-5 text-[#d4a054] mx-auto mb-2" />
              Failed to load history
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recorded changes for this key
            </div>
          ) : (
            <ol className="divide-y divide-border">
              {entries.map((entry) => {
                const prev = entry.metadata?.previousValue;
                const next = entry.metadata?.newValue;
                return (
                  <li key={entry.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${actionColors[entry.action] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {entry.action}
                      </span>
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <User className="w-3 h-3" />
                        {entry.actor}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-muted-foreground ml-auto"
                        title={new Date(entry.createdAt).toLocaleString()}
                      >
                        <Clock className="w-3 h-3" />
                        {formatRelative(entry.createdAt)}
                      </span>
                    </div>
                    {(prev !== undefined || next !== undefined) && (
                      <div className="mt-1.5 text-[11px] flex items-center gap-2 flex-wrap">
                        {prev !== undefined && (
                          <span className="text-muted-foreground">
                            from{' '}
                            <code className="font-mono break-all bg-muted/50 px-1 py-0.5 rounded">
                              {prev === null || prev === '' ? '∅' : String(prev)}
                            </code>
                          </span>
                        )}
                        {next !== undefined && (
                          <span className="text-muted-foreground">
                            to{' '}
                            <code className="font-mono break-all bg-muted/50 px-1 py-0.5 rounded">
                              {next === null || next === '' ? '∅' : String(next)}
                            </code>
                          </span>
                        )}
                      </div>
                    )}
                    {entry.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RuntimeConfigAdmin() {
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(EMPTY_DRAFT);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useStandardQuery<ListResponse>({
    queryKey: ['runtime-config'],
    queryFn: () => apiFetch('/runtime-config?limit=200'),
  });

  // Recent activity across all runtime_config writes — used to attach a
  // "last changed by X, Ys ago" badge to each row without firing one request
  // per row.
  const { data: historyData } = useStandardQuery<{ data: HistoryEntry[] }>({
    queryKey: ['runtime-config-history'],
    queryFn: () => apiFetch('/runtime-config/_history?limit=300'),
  });

  const latestByKey = useMemo(() => {
    const map = new Map<string, HistoryEntry>();
    for (const entry of historyData?.data ?? []) {
      if (!entry.key) continue;
      if (!map.has(entry.key)) map.set(entry.key, entry);
    }
    return map;
  }, [historyData]);

  const invalidateAndRefresh = async (key?: string) => {
    try {
      await apiFetch('/runtime-config/invalidate-cache', {
        method: 'POST',
        body: JSON.stringify(key ? { key } : {}),
      });
    } catch {
      // best-effort cache bust — backend already invalidates locally
    }
    qc.invalidateQueries({ queryKey: ['runtime-config'] });
    qc.invalidateQueries({ queryKey: ['runtime-config-history'] });
    if (key) qc.invalidateQueries({ queryKey: ['runtime-config-history', key] });
  };

  const updateMutation = useStandardMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiFetch(`/runtime-config/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      }),
    onSuccess: async (_res, { key }) => {
      setEditingKey(null);
      setSaveError(null);
      await invalidateAndRefresh(key);
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    },
  });

  const createMutation = useStandardMutation({
    mutationFn: (payload: {
      key: string;
      value: string;
      valueType: string;
      category: string;
      description?: string;
      isSensitive: boolean;
    }) =>
      apiFetch('/runtime-config', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: async (_res, payload) => {
      setShowCreate(false);
      setCreateDraft(EMPTY_DRAFT);
      setCreateError(null);
      await invalidateAndRefresh(payload.key);
    },
    onError: (err: unknown) => {
      setCreateError(err instanceof Error ? err.message : 'Create failed');
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: (key: string) =>
      apiFetch(`/runtime-config/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      }),
    onSuccess: async (_res, key) => {
      setDeleteKey(null);
      setDeleteError(null);
      await invalidateAndRefresh(key);
    },
    onError: (err: unknown) => {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    },
  });

  const rows = data?.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, RuntimeConfigRow[]>();
    for (const r of filtered) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const startEdit = (row: RuntimeConfigRow) => {
    if (row.isSensitive) {
      setDraftValue('');
    } else {
      setDraftValue(row.value);
    }
    setSaveError(null);
    setEditingKey(row.key);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setSaveError(null);
  };

  const saveEdit = (row: RuntimeConfigRow) => {
    const err = validateValue(draftValue, row.valueType);
    if (err) {
      setSaveError(err);
      return;
    }
    updateMutation.mutate({ key: row.key, value: draftValue });
  };

  const submitCreate = () => {
    if (!createDraft.key.trim()) {
      setCreateError('Key is required');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(createDraft.key)) {
      setCreateError('Key must be lowercase alphanumeric with underscores');
      return;
    }
    const err = validateValue(createDraft.value, createDraft.valueType);
    if (err) {
      setCreateError(err);
      return;
    }
    createMutation.mutate({
      key: createDraft.key.trim(),
      value: createDraft.value,
      valueType: createDraft.valueType,
      category: createDraft.category,
      description: createDraft.description.trim() || undefined,
      isSensitive: createDraft.isSensitive,
    });
  };

  const openCreate = () => {
    setCreateDraft(EMPTY_DRAFT);
    setCreateError(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError(null);
  };

  const requestDelete = (key: string) => {
    setDeleteKey(key);
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setDeleteKey(null);
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (deleteKey) deleteMutation.mutate(deleteKey);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Runtime Config
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Operator-tunable parameters — rate limits, SLO targets, breaker thresholds and job
            intervals. Changes take effect within the cache TTL.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New entry
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Runtime config requires API connection (ops or admin role)</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Entries', value: rows.length, color: 'text-foreground' },
              {
                label: 'Categories',
                value: new Set(rows.map((r) => r.category)).size,
                color: 'text-[#4a90b8]',
              },
              {
                label: 'Sensitive',
                value: rows.filter((r) => r.isSensitive).length,
                color: 'text-[#c45a4a]',
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
              placeholder="Search by key, description, category..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">
              No config entries found
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([category, entries]) => (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wide ${categoryColors[category] ?? categoryColors.general}`}
                    >
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{entries.length}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border">
                    {entries.map((row) => {
                      const isEditing = editingKey === row.key;
                      const displayValue = row.isSensitive ? REDACTED : row.value;
                      return (
                        <div
                          key={row.key}
                          className="px-4 py-3 grid grid-cols-12 gap-3 items-start hover:bg-muted/20 transition-colors"
                        >
                          <div className="col-span-5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs font-mono font-semibold text-foreground break-all">
                                {row.key}
                              </code>
                              {row.isSensitive && (
                                <span
                                  title="Sensitive — value is masked"
                                  className="inline-flex items-center gap-1 text-[10px] text-[#c45a4a] bg-[#c45a4a]/10 px-1.5 py-0.5 rounded"
                                >
                                  <Lock className="w-3 h-3" /> sensitive
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {row.valueType}
                              </span>
                            </div>
                            {row.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {row.description}
                              </p>
                            )}
                            {row.defaultValue !== null && row.defaultValue !== row.value && (
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                default: <code className="font-mono">{row.defaultValue}</code>
                              </p>
                            )}
                            {(() => {
                              const latest = latestByKey.get(row.key);
                              if (!latest) return null;
                              const prev = latest.metadata?.previousValue;
                              return (
                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${actionColors[latest.action] ?? 'bg-muted text-muted-foreground'}`}
                                  >
                                    {latest.action}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {latest.actor}
                                  </span>
                                  <span
                                    className="inline-flex items-center gap-1"
                                    title={new Date(latest.createdAt).toLocaleString()}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {formatRelative(latest.createdAt)}
                                  </span>
                                  {prev !== undefined && prev !== null && prev !== '' && (
                                    <span className="text-muted-foreground/70">
                                      was{' '}
                                      <code className="font-mono break-all">
                                        {String(prev)}
                                      </code>
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="col-span-5">
                            {isEditing ? (
                              <div className="space-y-1">
                                {row.valueType === 'json' ? (
                                  <textarea
                                    value={draftValue}
                                    onChange={(e) => setDraftValue(e.target.value)}
                                    rows={4}
                                    className="w-full px-2 py-1 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                ) : row.valueType === 'boolean' ? (
                                  <select
                                    value={draftValue}
                                    onChange={(e) => setDraftValue(e.target.value)}
                                    className="w-full px-2 py-1 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                  </select>
                                ) : (
                                  <input
                                    type={row.valueType === 'number' ? 'number' : 'text'}
                                    value={draftValue}
                                    onChange={(e) => setDraftValue(e.target.value)}
                                    placeholder={row.isSensitive ? 'Enter new value' : ''}
                                    className="w-full px-2 py-1 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                )}
                                {saveError && (
                                  <p className="text-[10px] text-[#c45a4a]">{saveError}</p>
                                )}
                              </div>
                            ) : (
                              <code className="text-xs font-mono text-foreground break-all">
                                {displayValue || <span className="text-muted-foreground">—</span>}
                              </code>
                            )}
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(row)}
                                  disabled={updateMutation.isPending}
                                  title="Save"
                                  className="p-1.5 rounded hover:bg-[#6b8f71]/10 text-[#6b8f71] disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={updateMutation.isPending}
                                  title="Cancel"
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setHistoryKey(row.key)}
                                  title="View change history"
                                  className="p-1.5 rounded hover:bg-muted/40 text-muted-foreground"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEdit(row)}
                                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/40 text-foreground"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => requestDelete(row.key)}
                                  title="Delete"
                                  className="p-1.5 rounded hover:bg-[#c45a4a]/10 text-[#c45a4a]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={closeCreate}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card border border-border rounded-xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-display font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  New config entry
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Add a new operator-tunable parameter.
                </p>
              </div>
              <button
                onClick={closeCreate}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Key
                </label>
                <input
                  value={createDraft.key}
                  onChange={(e) => setCreateDraft({ ...createDraft, key: e.target.value })}
                  placeholder="lowercase_with_underscores"
                  className="w-full px-2 py-1.5 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={createDraft.valueType}
                    onChange={(e) =>
                      setCreateDraft({
                        ...createDraft,
                        valueType: e.target.value as CreateDraft['valueType'],
                        value:
                          e.target.value === 'boolean' ? 'false' : createDraft.value,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {VALUE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={createDraft.category}
                    onChange={(e) =>
                      setCreateDraft({
                        ...createDraft,
                        category: e.target.value as CreateDraft['category'],
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Value
                </label>
                {createDraft.valueType === 'json' ? (
                  <textarea
                    value={createDraft.value}
                    onChange={(e) => setCreateDraft({ ...createDraft, value: e.target.value })}
                    rows={4}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : createDraft.valueType === 'boolean' ? (
                  <select
                    value={createDraft.value || 'false'}
                    onChange={(e) => setCreateDraft({ ...createDraft, value: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={createDraft.valueType === 'number' ? 'number' : 'text'}
                    value={createDraft.value}
                    onChange={(e) => setCreateDraft({ ...createDraft, value: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <input
                  value={createDraft.description}
                  onChange={(e) =>
                    setCreateDraft({ ...createDraft, description: e.target.value })
                  }
                  placeholder="Optional — what does this control?"
                  className="w-full px-2 py-1.5 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDraft.isSensitive}
                  onChange={(e) =>
                    setCreateDraft({ ...createDraft, isSensitive: e.target.checked })
                  }
                  className="accent-primary"
                />
                <Lock className="w-3 h-3 text-[#c45a4a]" />
                Mark as sensitive (value will be masked in listings)
              </label>

              {createError && (
                <p className="text-[11px] text-[#c45a4a] bg-[#c45a4a]/10 rounded px-2 py-1.5">
                  {createError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={closeCreate}
                disabled={createMutation.isPending}
                className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={submitCreate}
                disabled={createMutation.isPending}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyKey && (
        <HistoryDrawer configKey={historyKey} onClose={() => setHistoryKey(null)} />
      )}

      {deleteKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card border border-border rounded-xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-[#c45a4a]/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-[#c45a4a]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-display font-bold">Delete config entry?</h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  This removes <code className="font-mono break-all">{deleteKey}</code> and resets
                  it to the code default. This cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-[11px] text-[#c45a4a] bg-[#c45a4a]/10 rounded px-2 py-1.5">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={cancelDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs rounded bg-[#c45a4a] text-white hover:bg-[#c45a4a]/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
