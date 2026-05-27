import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  SettingsCard,
  SettingsRow,
  type SettingsSection,
  SettingsSectionPanel,
  SettingsShell,
} from '@szl-holdings/shared-ui/settings-shell';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Filter,
  Key,
  Loader2,
  Lock,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const VESSELS_ACCENT = '#38bdf8';

interface ResolvedSetting {
  value: unknown;
  tier: 'platform' | 'tenant' | 'user';
  namespace: string;
  key: string;
}

function useSettings(namespace: string) {
  return useStandardQuery({
    queryKey: ['settings', 'resolve', namespace],
    queryFn: () =>
      apiFetch<{ settings: ResolvedSetting[]; resolvedFor: { userId: number; orgId: number } }>(
        `/settings/resolve?namespace=${namespace}`,
      ),
    staleTime: 30_000,
  });
}

function getValue(settings: ResolvedSetting[], key: string): unknown {
  return settings.find((s) => s.key === key)?.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-panels
// ─────────────────────────────────────────────────────────────────────────────

function AccountPanel() {
  const { data: authData } = useStandardQuery({
    queryKey: ['auth-session'],
    queryFn: () => apiFetch<{ user?: { id: number; name?: string; email?: string } }>('/auth/me'),
    staleTime: 60_000,
  });

  const user = authData?.user;

  return (
    <SettingsSectionPanel title="Account" description="Your personal profile and session settings">
      <SettingsCard title="Profile">
        <SettingsRow label="Display Name" description="How your name appears to teammates">
          <p className="text-sm font-medium">{user?.name ?? '—'}</p>
        </SettingsRow>
        <SettingsRow label="Email" description="Your login email address">
          <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
        </SettingsRow>
        <SettingsRow label="User ID" description="Your unique platform identifier">
          <p className="text-xs font-mono text-muted-foreground">{user?.id ?? '—'}</p>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function TeamPanel() {
  const { data } = useStandardQuery({
    queryKey: ['org-members'],
    queryFn: () =>
      apiFetch<{
        members: Array<{
          id: number;
          role: string;
          joinedAt: string;
          user?: { name: string; email: string };
        }>;
      }>('/auth/org/members'),
    staleTime: 30_000,
  });

  const members = data?.members ?? [];

  return (
    <SettingsSectionPanel title="Team" description="Manage members and roles in your organization">
      <SettingsCard title="Members">
        {members.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No members found</p>
          </div>
        ) : (
          members.map((m) => (
            <SettingsRow
              key={m.id}
              label={m.user?.name ?? `Member #${m.id}`}
              description={m.user?.email}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground capitalize">
                  {m.role}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function NotificationsPanel() {
  const queryClient = useQueryClient();
  const { data } = useSettings('vessels.notifications');
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const items = [
    {
      key: 'alert_emails',
      label: 'Alert Emails',
      description: 'Receive email for critical fleet alerts',
    },
    {
      key: 'distress_push',
      label: 'Distress Signals',
      description: 'Push notifications for MAYDAY / distress signals',
    },
    {
      key: 'ais_blackout_alert',
      label: 'AIS Blackouts',
      description: 'Notify when a vessel loses AIS signal',
    },
    {
      key: 'sanctions_hit',
      label: 'Sanctions Screening Hits',
      description: 'Immediate notification on sanctions match',
    },
    {
      key: 'voyage_departure',
      label: 'Voyage Departure',
      description: 'Alert when a tracked vessel departs port',
    },
    {
      key: 'voyage_arrival',
      label: 'Voyage Arrival',
      description: 'Alert when a tracked vessel arrives at destination',
    },
  ];

  const toggle = async (key: string, current: boolean) => {
    setSaving(key);
    try {
      await apiFetch('/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: 'vessels.notifications',
          key,
          value: !current,
          valueType: 'boolean',
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'resolve', 'vessels.notifications'] });
    } finally {
      setSaving(null);
    }
  };

  return (
    <SettingsSectionPanel
      title="Notifications"
      description="Configure how and when Vessels alerts you"
    >
      <SettingsCard title="Alert Preferences">
        {items.map(({ key, label, description }) => {
          const val = getValue(settings, key);
          const enabled = val !== false;
          const isSaving = saving === key;

          return (
            <SettingsRow key={key} label={label} description={description}>
              <button
                onClick={() => toggle(key, enabled)}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                  enabled
                    ? 'bg-[#c9b787]/10 border-white/[0.08] text-[#c9b787]'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : enabled ? (
                  <Bell className="w-3 h-3" />
                ) : (
                  <BellOff className="w-3 h-3" />
                )}
                {enabled ? 'Enabled' : 'Disabled'}
              </button>
            </SettingsRow>
          );
        })}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function IntegrationsPanel() {
  const { data } = useStandardQuery({
    queryKey: ['vessels-integrations-health'],
    queryFn: () =>
      fetch('/api/services/health/app/vessels').then((r) => r.json()) as Promise<{
        services: Array<{ name: string; status: string; latencyMs?: number }>;
        summary: {
          total: number;
          liveConfigured: number;
          mockedDemoMode: number;
          manualRequired: number;
        };
      }>,
    staleTime: 30_000,
  });

  const services = data?.services ?? [];

  return (
    <SettingsSectionPanel
      title="Integrations"
      description="Status of live data connections powering Vessels"
    >
      <SettingsCard title="Data Sources">
        {services.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading service health...
          </div>
        ) : (
          services.map((svc) => (
            <SettingsRow key={svc.name} label={svc.name}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    svc.status === 'live'
                      ? 'bg-emerald-400'
                      : svc.status === 'mock'
                        ? 'bg-amber-400'
                        : 'bg-red-400',
                  )}
                />
                <span
                  className={cn(
                    'text-xs capitalize',
                    svc.status === 'live'
                      ? 'text-emerald-400'
                      : svc.status === 'mock'
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  {svc.status}
                </span>
                {svc.latencyMs != null && (
                  <span className="text-[10px] text-muted-foreground">{svc.latencyMs}ms</span>
                )}
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>

      <div className="mt-4 p-3 rounded-lg bg-[#c9b787]/8 border border-white/[0.08]">
        <p className="text-xs text-[#c9b787]/80">
          Configure AIS feed credentials, satellite data providers, and port authority connections
          from the API settings console.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

function SecurityPanel() {
  return (
    <SettingsSectionPanel
      title="Security"
      description="Authentication, access control, and session management"
    >
      <SettingsCard title="Session">
        <SettingsRow label="Authentication" description="Your current authentication method">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#c9b787]" />
            <span className="text-sm">Replit Auth (SSO)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Active
            </span>
          </div>
        </SettingsRow>
        <SettingsRow label="Session Security" description="Multi-factor and session controls">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Managed by platform SSO</span>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Access Control" className="mt-4">
        <SettingsRow label="Role" description="Your role within the organization">
          <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground capitalize">
            Member
          </span>
        </SettingsRow>
        <SettingsRow label="API Keys" description="Manage API keys for programmatic access">
          <button className="flex items-center gap-1.5 text-xs text-[#c9b787] hover:text-[#d4c598] transition-colors">
            <Key className="w-3 h-3" /> Manage API Keys
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function PreferencesPanel() {
  const queryClient = useQueryClient();
  const { data } = useSettings('vessels.prefs');
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const savePref = async (key: string, value: unknown, valueType = 'string') => {
    setSaving(key);
    try {
      await apiFetch('/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace: 'vessels.prefs', key, value, valueType }),
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'resolve', 'vessels.prefs'] });
    } finally {
      setSaving(null);
    }
  };

  const distanceUnit = (getValue(settings, 'distance_unit') as string) ?? 'nm';
  const speedUnit = (getValue(settings, 'speed_unit') as string) ?? 'knots';
  const mapStyle = (getValue(settings, 'map_style') as string) ?? 'dark';

  return (
    <SettingsSectionPanel title="Preferences" description="Personalize your Vessels experience">
      <SettingsCard title="Units & Display">
        <SettingsRow
          label="Distance Unit"
          description="Unit used throughout the fleet map and reports"
        >
          <div className="flex gap-2">
            {[
              { value: 'nm', label: 'Nautical Miles' },
              { value: 'km', label: 'Kilometres' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => savePref('distance_unit', opt.value)}
                disabled={saving === 'distance_unit'}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  distanceUnit === opt.value
                    ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#c9b787]'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {saving === 'distance_unit' && distanceUnit !== opt.value ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : null}
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Speed Unit" description="Unit for vessel speed display">
          <div className="flex gap-2">
            {[
              { value: 'knots', label: 'Knots' },
              { value: 'kmh', label: 'km/h' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => savePref('speed_unit', opt.value)}
                disabled={saving === 'speed_unit'}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  speedUnit === opt.value
                    ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#c9b787]'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Map Style" description="Default visual style for the fleet map">
          <div className="flex gap-2">
            {[
              { value: 'dark', label: 'Dark' },
              { value: 'satellite', label: 'Satellite' },
              { value: 'light', label: 'Light' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => savePref('map_style', opt.value)}
                disabled={saving === 'map_style'}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  mapStyle === opt.value
                    ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#c9b787]'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

function BillingPanel() {
  return (
    <SettingsSectionPanel
      title="Billing"
      description="Subscription plan and billing information for your Vessels account"
    >
      <SettingsCard title="Current Plan">
        <SettingsRow label="Plan">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#c9b787]" />
            <span className="text-sm">Managed via the SZL Holdings platform portal</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Invoices">
          <button className="flex items-center gap-1.5 text-xs text-[#c9b787] hover:text-[#d4c598] transition-colors">
            <FileText className="w-3 h-3" /> View Invoices
          </button>
        </SettingsRow>
      </SettingsCard>
      <div className="mt-4 p-3 rounded-lg bg-[#c9b787]/8 border border-white/[0.08]">
        <p className="text-xs text-[#a0a0a0]">
          Billing changes, plan upgrades, and invoice management are handled through the SZL
          Holdings platform admin panel.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

interface AuditEntry {
  id: number;
  tier: string;
  namespace: string;
  key: string;
  action: 'create' | 'update' | 'delete';
  oldValue: unknown;
  newValue: unknown;
  actorId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
}

const PAGE_SIZE = 25;

interface AuditPage {
  entries: AuditEntry[];
  total: number;
  offset: number;
  limit: number;
}

function AuditPanel() {
  const [filterForm, setFilterForm] = useState({ nsFilter: '', afterDate: '', beforeDate: '' });
  const [applied, setApplied] = useState({ ns: '', after: '', before: '' });
  const [offset, setOffset] = useState(0);
  const [allEntries, setAllEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const params = new URLSearchParams({
    namespace: applied.ns || 'vessels',
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  if (applied.after) params.set('after', applied.after);
  if (applied.before) params.set('before', applied.before);

  const { data, isLoading } = useStandardQuery({
    queryKey: ['vessels-settings-audit', applied, offset],
    queryFn: () => apiFetch<AuditPage>(`/settings/audit?${params.toString()}`),
    staleTime: 30_000,
  });

  const isFirstPage = offset === 0;

  useEffect(() => {
    if (!data || loadingMore) return;
    if (isFirstPage) {
      setTotal(data.total);
      setAllEntries(data.entries ?? []);
    }
  }, [data, isFirstPage, loadingMore]);

  const displayedEntries = isFirstPage && !loadingMore ? (data?.entries ?? allEntries) : allEntries;
  const hasMore = total !== null && displayedEntries.length < total;

  const loadMore = async () => {
    setLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;
    const moreParams = new URLSearchParams({
      namespace: applied.ns || 'vessels',
      limit: String(PAGE_SIZE),
      offset: String(nextOffset),
    });
    if (applied.after) moreParams.set('after', applied.after);
    if (applied.before) moreParams.set('before', applied.before);
    try {
      const page = await apiFetch<AuditPage>(`/settings/audit?${moreParams.toString()}`);
      setAllEntries((prev) => [...prev, ...(page.entries ?? [])]);
      setTotal(page.total);
      setOffset(nextOffset);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = () => {
    setOffset(0);
    setAllEntries([]);
    setTotal(null);
    setApplied({ ns: filterForm.nsFilter, after: filterForm.afterDate, before: filterForm.beforeDate });
  };
  const clearFilters = () => {
    setFilterForm({ nsFilter: '', afterDate: '', beforeDate: '' });
    setOffset(0);
    setAllEntries([]);
    setTotal(null);
    setApplied({ ns: '', after: '', before: '' });
  };

  return (
    <SettingsSectionPanel
      title="Settings Change History"
      description="Audit trail of settings changes in Vessels"
    >
      <p className="mb-4 text-xs text-[#6a6a6a]">
        Org admins and platform admins see the full team history. Other members see only their own
        changes.
      </p>
      <div className="mb-4 p-3 rounded-lg border border-white/[0.06] bg-[#c9b787]/8 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-[10px] text-[#9a9a9a] font-medium uppercase tracking-wide">
            Namespace prefix
          </label>
          <input
            type="text"
            value={filterForm.nsFilter}
            onChange={(e) => setFilterForm((f) => ({ ...f, nsFilter: e.target.value }))}
            placeholder="e.g. vessels.notifications"
            className="h-7 px-2 text-xs rounded border border-white/[0.08] bg-[#040c1a] text-[#f5f5f5] placeholder:text-[#5a5a5a] focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#9a9a9a] font-medium uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            value={filterForm.afterDate}
            onChange={(e) => setFilterForm((f) => ({ ...f, afterDate: e.target.value }))}
            className="h-7 px-2 text-xs rounded border border-white/[0.08] bg-[#040c1a] text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#9a9a9a] font-medium uppercase tracking-wide">
            To
          </label>
          <input
            type="date"
            value={filterForm.beforeDate}
            onChange={(e) => setFilterForm((f) => ({ ...f, beforeDate: e.target.value }))}
            className="h-7 px-2 text-xs rounded border border-white/[0.08] bg-[#040c1a] text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded bg-[#c9b787]/10 border border-white/[0.08] text-[#c9b787] hover:bg-[#c9b787]/16 transition-colors"
          >
            <Filter className="w-3 h-3" /> Apply
          </button>
          <button
            onClick={clearFilters}
            className="h-7 px-3 text-xs text-[#8a8a8a] hover:text-[#d4c598] border border-white/[0.06] rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {total !== null && (
        <p className="mb-3 text-xs text-[#8a8a8a]">
          Showing {displayedEntries.length} of {total} record{total !== 1 ? 's' : ''}
        </p>
      )}

      {isLoading && offset === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-[#c9b787]/8 animate-pulse rounded" />
          ))}
        </div>
      ) : displayedEntries.length === 0 ? (
        <div className="py-10 text-center">
          <FileText className="w-6 h-6 text-[#5a5a5a] mx-auto mb-2" />
          <p className="text-sm text-[#8a8a8a]">No settings changes found</p>
          <p className="text-xs text-[#5a5a5a] mt-1">
            Changes will appear here when settings are modified
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayedEntries.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-white/[0.06] bg-[#c9b787]/8 hover:bg-[#c9b787]/10 transition-colors px-3 py-2.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                    e.action === 'create'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : e.action === 'update'
                        ? 'bg-[#c9b787]/10 text-[#c9b787]'
                        : 'bg-red-500/10 text-red-400',
                  )}
                >
                  {e.action}
                </span>
                <span className="font-mono text-xs text-[#f5f5f5]">
                  {e.namespace}
                  <span className="text-[#6a6a6a]">.</span>
                  {e.key}
                </span>
                <span className="ml-auto text-[10px] text-[#8a8a8a] shrink-0">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                {e.actorName ? (
                  <span className="text-[#9a9a9a]">
                    by <span className="text-[#e0e0e0] font-medium">{e.actorName}</span>
                    {e.actorEmail && <span className="text-[#6a6a6a]"> ({e.actorEmail})</span>}
                  </span>
                ) : e.actorId ? (
                  <span className="text-[#8a8a8a]">by user #{e.actorId}</span>
                ) : (
                  <span className="text-[#5a5a5a] italic">system</span>
                )}
                {(e.oldValue != null || e.newValue != null) && (
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    {e.oldValue != null && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/20 text-red-400/70 line-through">
                        {JSON.stringify(e.oldValue)}
                      </span>
                    )}
                    {e.oldValue != null && e.newValue != null && (
                      <ChevronRight className="w-3 h-3 text-[#5a5a5a] shrink-0" />
                    )}
                    {e.newValue != null && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-emerald-400/70">
                        {JSON.stringify(e.newValue)}
                      </span>
                    )}
                  </span>
                )}
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#c9b787]/8 border border-white/[0.06] text-[#8a8a8a] capitalize">
                  {e.tier}
                </span>
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-lg border border-white/[0.06] bg-[#c9b787]/8 hover:bg-[#c9b787]/10 text-[#9a9a9a] hover:text-[#d4c598] transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {loadingMore ? 'Loading…' : `Load more (${total! - displayedEntries.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function VesselsSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  const panels: Record<SettingsSection, React.ReactNode> = {
    account: <AccountPanel />,
    workspace: <PreferencesPanel />,
    team: <TeamPanel />,
    notifications: <NotificationsPanel />,
    integrations: <IntegrationsPanel />,
    security: <SecurityPanel />,
    preferences: <PreferencesPanel />,
    billing: <BillingPanel />,
    audit: <AuditPanel />,
  };

  return (
    <div className="flex flex-col h-full bg-[#040c1a]">
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h1 className="text-lg font-semibold text-[#f5f5f5]">Settings</h1>
        <p className="text-sm text-[#8a8a8a] mt-0.5">
          Account, team, notifications, integrations &amp; more
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <SettingsShell
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          availableSections={[
            'account',
            'team',
            'notifications',
            'integrations',
            'security',
            'preferences',
            'billing',
            'audit',
          ]}
          accentColor={VESSELS_ACCENT}
          appName="Vessels"
        >
          {panels[activeSection]}
        </SettingsShell>
      </div>
    </div>
  );
}
