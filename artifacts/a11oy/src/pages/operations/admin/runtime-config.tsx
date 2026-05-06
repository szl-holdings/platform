import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Lock, RefreshCw, Search, Sliders, X } from 'lucide-react';
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

export default function RuntimeConfigAdmin() {
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useStandardQuery<ListResponse>({
    queryKey: ['runtime-config'],
    queryFn: () => apiFetch('/runtime-config?limit=200'),
  });

  const updateMutation = useStandardMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiFetch(`/runtime-config/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      }),
    onSuccess: async (_res, { key }) => {
      setEditingKey(null);
      setSaveError(null);
      try {
        await apiFetch('/runtime-config/invalidate-cache', {
          method: 'POST',
          body: JSON.stringify({ key }),
        });
      } catch {
        // best-effort cache bust — backend already invalidates locally
      }
      qc.invalidateQueries({ queryKey: ['runtime-config'] });
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
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
    if (row.valueType === 'number' && !Number.isFinite(Number(draftValue))) {
      setSaveError('Value must be a valid number');
      return;
    }
    if (row.valueType === 'boolean' && !['true', 'false', '1', '0'].includes(draftValue.trim())) {
      setSaveError('Value must be true/false');
      return;
    }
    if (row.valueType === 'json') {
      try {
        JSON.parse(draftValue);
      } catch {
        setSaveError('Value must be valid JSON');
        return;
      }
    }
    updateMutation.mutate({ key: row.key, value: draftValue });
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
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
                              <button
                                onClick={() => startEdit(row)}
                                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/40 text-foreground"
                              >
                                Edit
                              </button>
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
    </div>
  );
}
