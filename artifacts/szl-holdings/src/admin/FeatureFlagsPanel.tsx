import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  Shield,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetchAdmin } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  scope: string;
  updatedAt: string;
}

interface Override {
  id: number;
  flagId: number;
  entityType: 'user' | 'org' | 'role';
  entityId: string;
  isEnabled: boolean;
}

interface CheckLog {
  id: number;
  flagKey: string;
  userId: number | null;
  orgId: number | null;
  result: boolean;
  source: string;
  callerTag: string | null;
  checkedAt: string;
}

interface Exposure {
  key: string;
  globallyEnabled: boolean;
  rolloutPercentage: number;
  effectiveForAll: boolean;
  overrides: {
    total: number;
    enabled: Override[];
    disabled: Override[];
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SOURCE_COLORS: Record<string, string> = {
  override: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  rollout: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  global: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

// ─── Override Row ─────────────────────────────────────────────────────────────

function OverrideRow({
  flagKey,
  override,
  onDelete,
}: {
  flagKey: string;
  override: Override;
  onDelete: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetchAdmin(
        `/admin/feature-flags/${encodeURIComponent(flagKey)}/overrides/${override.id}`,
        { method: 'DELETE' },
      );
      onDelete(override.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-mono text-muted-foreground">{override.entityType}</span>
        <span className="text-foreground font-medium">{override.entityId}</span>
        <span
          className={cn(
            'px-1.5 py-0.5 rounded border text-[10px] font-semibold',
            override.isEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20',
          )}
        >
          {override.isEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </div>
  );
}

// ─── Add Override Form ────────────────────────────────────────────────────────

function AddOverrideForm({
  flagKey,
  onAdded,
}: {
  flagKey: string;
  onAdded: (override: Override) => void;
}) {
  const [entityType, setEntityType] = useState<'org' | 'user' | 'role'>('org');
  const [entityId, setEntityId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiFetchAdmin<{ override: Override }>(
        `/admin/feature-flags/${encodeURIComponent(flagKey)}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify({ entityType, entityId: entityId.trim(), isEnabled }),
        },
      );
      onAdded(result.override);
      setEntityId('');
    } catch {
      setError('Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 flex-wrap">
      <select
        value={entityType}
        onChange={(e) => setEntityType(e.target.value as 'org' | 'user' | 'role')}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="org">org</option>
        <option value="user">user</option>
        <option value="role">role</option>
      </select>
      <input
        value={entityId}
        onChange={(e) => setEntityId(e.target.value)}
        placeholder="ID or name"
        className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
      />
      <select
        value={isEnabled ? 'on' : 'off'}
        onChange={(e) => setIsEnabled(e.target.value === 'on')}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="on">ON</option>
        <option value="off">OFF</option>
      </select>
      <button
        type="submit"
        disabled={saving || !entityId.trim()}
        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
      >
        {saving && <Loader2 className="w-3 h-3 animate-spin" />} Add
      </button>
      {error && <p className="text-red-400 text-[10px] w-full">{error}</p>}
    </form>
  );
}

// ─── Flag Row ─────────────────────────────────────────────────────────────────

function FlagRow({ flag, onUpdated }: { flag: FeatureFlag; onUpdated: (f: FeatureFlag) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [rollout, setRollout] = useState(flag.rolloutPercentage);
  const [savingRollout, setSavingRollout] = useState(false);
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [exposure, setExposure] = useState<Exposure | null>(null);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const updated = await apiFetchAdmin<FeatureFlag>(
        `/admin/feature-flags/${encodeURIComponent(flag.key)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ enabled: !flag.enabled }),
        },
      );
      onUpdated({ ...flag, enabled: updated.enabled, updatedAt: updated.updatedAt });
      setExposure(null);
    } catch {
      /* no-op */
    } finally {
      setToggling(false);
    }
  };

  const handleRolloutSave = async () => {
    setSavingRollout(true);
    try {
      await apiFetchAdmin(`/admin/feature-flags/${encodeURIComponent(flag.key)}/rollout`, {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: rollout }),
      });
      onUpdated({ ...flag, rolloutPercentage: rollout });
      setExposure(null);
    } catch {
      /* no-op */
    } finally {
      setSavingRollout(false);
    }
  };

  const handleExpandOverrides = async () => {
    if (!expanded) {
      if (overrides === null) {
        setLoadingOverrides(true);
        try {
          const [overridesData, exposureData] = await Promise.all([
            apiFetchAdmin<{ overrides: Override[] }>(
              `/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides`,
            ),
            apiFetchAdmin<Exposure>(
              `/admin/feature-flags/${encodeURIComponent(flag.key)}/exposure`,
            ),
          ]);
          setOverrides(overridesData.overrides);
          setExposure(exposureData);
        } catch {
          setOverrides([]);
        } finally {
          setLoadingOverrides(false);
        }
      }
    }
    setExpanded((v) => !v);
  };

  const refreshExposure = async () => {
    try {
      const exposureData = await apiFetchAdmin<Exposure>(
        `/admin/feature-flags/${encodeURIComponent(flag.key)}/exposure`,
      );
      setExposure(exposureData);
    } catch {
      /* no-op */
    }
  };

  const handleOverrideDelete = async (id: number) => {
    setOverrides((prev) => prev?.filter((o) => o.id !== id) ?? null);
    void refreshExposure();
  };

  const handleOverrideAdded = (override: Override) => {
    setOverrides((prev) => {
      const existing = prev ?? [];
      const idx = existing.findIndex(
        (o) => o.entityType === override.entityType && o.entityId === override.entityId,
      );
      if (idx >= 0) {
        const next = [...existing];
        next[idx] = override;
        return next;
      }
      return [...existing, override];
    });
    void refreshExposure();
  };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          aria-label={flag.enabled ? 'Disable flag' : 'Enable flag'}
        >
          {toggling ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : flag.enabled ? (
            <ToggleRight className="w-5 h-5 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-zinc-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{flag.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{flag.key}</span>
          </div>
          {flag.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {flag.description}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Updated {fmtDate(flag.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {flag.enabled && flag.rolloutPercentage < 100 && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
              {flag.rolloutPercentage}%
            </span>
          )}
          <button
            type="button"
            onClick={handleExpandOverrides}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/8 px-3 py-3 space-y-3 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Sliders className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <label className="text-xs text-muted-foreground w-24 shrink-0">
              Rollout %
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={rollout}
              onChange={(e) => setRollout(parseInt(e.target.value, 10))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-foreground font-mono w-8 text-right">{rollout}%</span>
            <button
              type="button"
              onClick={handleRolloutSave}
              disabled={savingRollout || rollout === flag.rolloutPercentage}
              className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 disabled:opacity-40 transition-colors"
            >
              {savingRollout ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
          </div>

          {exposure && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span>Current Audience</span>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-xs space-y-1.5">
                {exposure.effectiveForAll ? (
                  <p className="text-emerald-400 font-semibold">✓ Enabled for all users (100% rollout, no overrides)</p>
                ) : !exposure.globallyEnabled ? (
                  <p className="text-zinc-400">Flag is globally OFF. Only explicit ON overrides below are active.</p>
                ) : (
                  <p className="text-amber-400">
                    Enabled for ~{exposure.rolloutPercentage}% of users by rollout bucket
                    {exposure.overrides.total > 0 && ` + ${exposure.overrides.enabled.length} explicit ON override(s)`}
                  </p>
                )}
                {exposure.overrides.enabled.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Explicitly ON</p>
                    {exposure.overrides.enabled.map((o) => (
                      <div key={o.id} className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground">{o.entityType}:</span>
                        <span className="text-foreground">{o.entityId}</span>
                      </div>
                    ))}
                  </div>
                )}
                {exposure.overrides.disabled.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Explicitly OFF</p>
                    {exposure.overrides.disabled.map((o) => (
                      <div key={o.id} className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground">{o.entityType}:</span>
                        <span className="text-foreground line-through opacity-60">{o.entityId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>Overrides</span>
              {loadingOverrides && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </div>
            {overrides && overrides.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 pl-1">No overrides yet.</p>
            )}
            {overrides?.map((o) => (
              <OverrideRow key={o.id} flagKey={flag.key} override={o} onDelete={handleOverrideDelete} />
            ))}
            <AddOverrideForm flagKey={flag.key} onAdded={handleOverrideAdded} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Check Logs Tab ───────────────────────────────────────────────────────────

function CheckLogsTab() {
  const [logs, setLogs] = useState<CheckLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterKey, setFilterKey] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = filterKey.trim() ? `?key=${encodeURIComponent(filterKey.trim())}` : '';
      const data = await apiFetchAdmin<{ logs: CheckLog[] }>(
        `/admin/feature-flags/check-logs${qs}`,
      );
      setLogs(data.logs);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
          placeholder="Filter by flag key…"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Load
        </button>
      </div>

      {logs === null && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Click Load to view recent flag check audit logs.
        </div>
      )}

      {logs !== null && logs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No logs found.</p>
      )}

      {logs && logs.length > 0 && (
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs"
            >
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded border text-[10px] font-semibold shrink-0',
                  log.result
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20',
                )}
              >
                {log.result ? 'ON' : 'OFF'}
              </span>
              <span className="font-mono text-muted-foreground shrink-0 max-w-[200px] truncate">
                {log.flagKey}
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded border text-[10px] shrink-0',
                  SOURCE_COLORS[log.source] ?? SOURCE_COLORS.default,
                )}
              >
                {log.source}
              </span>
              {log.orgId && (
                <span className="text-muted-foreground/60">org:{log.orgId}</span>
              )}
              {log.userId && (
                <span className="text-muted-foreground/60">user:{log.userId}</span>
              )}
              {log.callerTag && (
                <span className="text-muted-foreground/60 italic">{log.callerTag}</span>
              )}
              <span className="ml-auto text-muted-foreground/50 shrink-0">
                {fmtDate(log.checkedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Feature Flags Panel ──────────────────────────────────────────────────────

type Tab = 'flags' | 'logs';

export function FeatureFlagsPanel() {
  const [tab, setTab] = useState<Tab>('flags');
  const [flags, setFlags] = useState<FeatureFlag[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchAdmin<{ flags: FeatureFlag[] }>('/admin/feature-flags');
      setFlags(data.flags);
    } catch {
      setError('Failed to load feature flags.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagUpdated = (updated: FeatureFlag) => {
    setFlags((prev) =>
      prev ? prev.map((f) => (f.key === updated.key ? { ...f, ...updated } : f)) : prev,
    );
  };

  const filtered = flags
    ? flags.filter(
        (f) =>
          !search ||
          f.key.includes(search.toLowerCase()) ||
          f.name.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  const enabledCount = flags?.filter((f) => f.enabled).length ?? 0;
  const totalCount = flags?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Feature Flags
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage staged rollouts, kill-switches, and per-tenant overrides.
          </p>
        </div>
        <button
          type="button"
          onClick={loadFlags}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {flags !== null && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 text-center">
            <div className="text-2xl font-black text-foreground">{totalCount}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Total Flags</div>
          </div>
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-center">
            <div className="text-2xl font-black text-emerald-400">{enabledCount}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Enabled</div>
          </div>
          <div className="rounded-xl bg-zinc-500/5 border border-zinc-500/15 p-3 text-center">
            <div className="text-2xl font-black text-zinc-400">{totalCount - enabledCount}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Disabled</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-white/8 pb-0">
        {(['flags', 'logs'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize',
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'flags' ? 'All Flags' : 'Audit Logs'}
          </button>
        ))}
      </div>

      {tab === 'flags' && (
        <div className="space-y-4">
          {flags === null ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mb-3">
                Click Refresh to load feature flags.
              </p>
              <button
                type="button"
                onClick={loadFlags}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading…' : 'Load Flags'}
              </button>
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flags…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered?.map((flag) => (
                  <FlagRow key={flag.key} flag={flag} onUpdated={handleFlagUpdated} />
                ))}
                {filtered?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No flags match your search.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'logs' && <CheckLogsTab />}
    </div>
  );
}
