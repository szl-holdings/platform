import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  SettingsCard,
  SettingsRow,
  type SettingsSection,
  SettingsSectionPanel,
  SettingsShell,
} from '@szl-holdings/shared-ui/settings-shell';
import { useUserPreferences } from '@szl-holdings/shared-ui/use-user-preferences';
import { formatDateTime } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Key,
  Layers,
  Loader2,
  Lock,
  Mail,
  Maximize2,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Rows3,
  Save,
  Shield,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const API = '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

interface ResolvedSetting {
  value: unknown;
  tier: 'platform' | 'tenant' | 'user';
  namespace: string;
  key: string;
}

function getValue(settings: ResolvedSetting[], key: string): unknown {
  return settings.find((s) => s.key === key)?.value;
}

interface PlatformSetting {
  id: number;
  namespace: string;
  key: string;
  value: unknown;
  valueType: string;
  label: string | null;
  description: string | null;
  category: string;
}

interface AuditEntry {
  id: number;
  tier: string;
  namespace: string;
  key: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  actorId: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Panel
// ─────────────────────────────────────────────────────────────────────────────

function AccountPanel() {
  const { data } = useStandardQuery({
    queryKey: ['auth-me'],
    queryFn: () =>
      apiFetch<{ user?: { id: number; name?: string; email?: string; roles?: string[] } }>(
        '/auth/me',
      ),
    staleTime: 60_000,
  });

  const user = data?.user;

  return (
    <SettingsSectionPanel
      title="Account"
      description="Your personal profile on the SZL Holdings platform"
    >
      <SettingsCard title="Profile">
        <SettingsRow label="Name" description="Your display name">
          <p className="text-sm">{user?.name ?? '—'}</p>
        </SettingsRow>
        <SettingsRow label="Email">
          <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
        </SettingsRow>
        <SettingsRow label="Roles" description="Platform roles assigned to your account">
          <div className="flex flex-wrap gap-1.5">
            {(user?.roles ?? []).map((r) => (
              <span
                key={r}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize"
              >
                {r}
              </span>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Team Panel
// ─────────────────────────────────────────────────────────────────────────────

function TeamPanel() {
  const { data } = useStandardQuery({
    queryKey: ['team-members'],
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
    <SettingsSectionPanel title="Team" description="Members of your organization and their roles">
      <SettingsCard title={`Members (${members.length})`}>
        {members.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No members found</div>
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
                  {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications Panel
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsPanel() {
  const queryClient = useQueryClient();
  const { data } = useStandardQuery({
    queryKey: ['user-settings', 'szl.notifications'],
    queryFn: () =>
      apiFetch<{ settings: ResolvedSetting[] }>('/settings/resolve?namespace=szl.notifications'),
    staleTime: 30_000,
  });
  const settings = data?.settings ?? [];
  const [saving, setSaving] = useState<string | null>(null);

  const togglePref = async (key: string, current: boolean) => {
    setSaving(key);
    try {
      await apiFetch('/settings/user', {
        method: 'POST',
        body: JSON.stringify({
          namespace: 'szl.notifications',
          key,
          value: !current,
          valueType: 'boolean',
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['user-settings', 'szl.notifications'] });
    } finally {
      setSaving(null);
    }
  };

  const items = [
    {
      key: 'platform_updates',
      label: 'Platform Updates',
      description: 'New features and product announcements',
    },
    {
      key: 'billing_alerts',
      label: 'Billing Alerts',
      description: 'Invoice and payment reminders',
    },
    { key: 'security_alerts', label: 'Security Alerts', description: 'Login and access anomalies' },
    {
      key: 'team_invitations',
      label: 'Team Invitations',
      description: 'When new members join or are invited',
    },
    {
      key: 'weekly_digest',
      label: 'Weekly Digest',
      description: 'Platform activity summary every Monday',
    },
  ];

  return (
    <SettingsSectionPanel
      title="Notifications"
      description="Control what notifications you receive"
    >
      <SettingsCard title="Email & Push Preferences">
        {items.map(({ key, label, description }) => {
          const val = getValue(settings, key);
          const enabled = val !== false;
          return (
            <SettingsRow key={key} label={label} description={description}>
              <button
                onClick={() => togglePref(key, enabled)}
                disabled={saving === key}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                  enabled
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {saving === key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : enabled ? (
                  <Bell className="w-3 h-3" />
                ) : (
                  <BellOff className="w-3 h-3" />
                )}
                {enabled ? 'On' : 'Off'}
              </button>
            </SettingsRow>
          );
        })}
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Integrations Panel
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationsPanel() {
  const { data } = useStandardQuery({
    queryKey: ['szl-integrations'],
    queryFn: () =>
      apiFetch<{
        integrations: Array<{
          id: number;
          provider: string;
          status: string;
          lastSuccess: string | null;
          lastError: string | null;
        }>;
      }>('/distribution-os/integrations'),
    staleTime: 30_000,
  });

  const integrations = data?.integrations ?? [];

  return (
    <SettingsSectionPanel title="Integrations" description="Connected platforms and data sources">
      <SettingsCard title="Distribution OS Integrations">
        {integrations.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No integrations configured
          </div>
        ) : (
          integrations.map((int) => (
            <SettingsRow
              key={int.id}
              label={int.provider}
              description={
                int.lastError
                  ? `Error: ${int.lastError}`
                  : int.lastSuccess
                    ? `Last sync: ${new Date(int.lastSuccess).toLocaleString()}`
                    : undefined
              }
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    int.status === 'connected'
                      ? 'bg-emerald-400'
                      : int.status === 'mock'
                        ? 'bg-amber-400'
                        : 'bg-red-400',
                  )}
                />
                <span
                  className={cn(
                    'text-xs capitalize',
                    int.status === 'connected'
                      ? 'text-emerald-400'
                      : int.status === 'mock'
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  {int.status}
                </span>
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsCard>

      <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
        <p className="text-xs text-amber-400/70">
          For full integration configuration (X/Twitter, Substack, email, Linktree), visit the
          Distribution OS settings panel.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security Panel
// ─────────────────────────────────────────────────────────────────────────────

function SecurityPanel() {
  return (
    <SettingsSectionPanel
      title="Security"
      description="Authentication, access control, and session settings"
    >
      <SettingsCard title="Authentication">
        <SettingsRow label="Auth Method" description="Your current sign-in method">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Platform SSO</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Active
            </span>
          </div>
        </SettingsRow>
        <SettingsRow label="Session Management" description="Active session security settings">
          <span className="text-sm text-muted-foreground">Managed by platform SSO provider</span>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Admin Access" className="mt-4">
        <SettingsRow label="Admin PIN" description="Required to confirm destructive actions">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Configured via ADMIN_PIN secret</span>
          </div>
        </SettingsRow>
        <SettingsRow label="API Keys" description="Service-to-service authentication keys">
          <button className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            <Key className="w-3 h-3" /> Manage API Keys
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform Settings Panel (super_admin)
// ─────────────────────────────────────────────────────────────────────────────

function PlatformSettingsPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useStandardQuery({
    queryKey: ['platform-settings'],
    queryFn: () => apiFetch<PlatformSetting[]>('/settings/platform'),
    staleTime: 30_000,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = (data ?? []).reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    const g = s.category ?? 'general';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const saveSetting = async (setting: PlatformSetting) => {
    setSaving(true);
    try {
      await apiFetch('/settings/platform', {
        method: 'POST',
        body: JSON.stringify({
          namespace: setting.namespace,
          key: setting.key,
          value: editValue,
          valueType: setting.valueType,
          label: setting.label,
          category: setting.category,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSectionPanel
      title="Platform Defaults"
      description="Global defaults applied to all tenants unless overridden"
    >
      {isLoading ? (
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No platform defaults configured yet. POST to /settings/platform to add.
        </div>
      ) : (
        Object.entries(grouped).map(([category, settings]) => (
          <SettingsCard
            key={category}
            title={category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            className="mb-4"
          >
            {settings.map((s) => (
              <SettingsRow key={s.id} label={s.label ?? s.key} description={s.description ?? s.key}>
                {editingId === s.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:border-amber-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => saveSetting(s)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {String(s.value ?? '—')}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setEditValue(String(s.value ?? ''));
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Edit
                    </button>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded border',
                        'bg-muted border-border text-muted-foreground',
                      )}
                    >
                      platform
                    </span>
                  </div>
                )}
              </SettingsRow>
            ))}
          </SettingsCard>
        ))
      )}
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Panel
// ─────────────────────────────────────────────────────────────────────────────

function AuditLogPanel() {
  const { data, isLoading } = useStandardQuery({
    queryKey: ['settings-audit'],
    queryFn: () => apiFetch<AuditEntry[]>('/settings/audit?limit=50'),
    staleTime: 30_000,
  });

  const entries = data ?? [];

  const tierColor: Record<string, string> = {
    platform: 'text-amber-400',
    tenant: 'text-sky-400',
    user: 'text-violet-400',
  };

  const actionColor: Record<string, string> = {
    create: 'text-emerald-400',
    update: 'text-sky-400',
    delete: 'text-red-400',
  };

  return (
    <SettingsSectionPanel
      title="Audit Log"
      description="Every settings change with actor, timestamp, and before/after values"
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No settings changes logged yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase',
                      tierColor[entry.tier] ?? 'text-muted-foreground',
                    )}
                  >
                    {entry.tier}
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {entry.namespace}.{entry.key}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase',
                      actionColor[entry.action] ?? 'text-muted-foreground',
                    )}
                  >
                    {entry.action}
                  </span>
                </div>
                {(entry.oldValue != null || entry.newValue != null) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.oldValue != null && (
                      <span className="text-[10px] font-mono text-muted-foreground line-through">
                        {JSON.stringify(entry.oldValue)}
                      </span>
                    )}
                    {entry.newValue != null && (
                      <span className="text-[10px] font-mono text-foreground">
                        → {JSON.stringify(entry.newValue)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {formatDateTime(entry.createdAt, { withSeconds: false })}
              </span>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App Preferences Panel — user-level UI preferences persisted to the API
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_COLOR_PRESETS: Array<{ value: string; label: string }> = [
  { value: '#f59e0b', label: 'Amber' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#38bdf8', label: 'Sky' },
  { value: '#22c55e', label: 'Emerald' },
  { value: '#ef4444', label: 'Crimson' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#94a3b8', label: 'Slate' },
];

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const COMMON_TIME_ZONES: Array<{ value: string; label: string }> = [
  { value: 'America/New_York', label: 'New York (Eastern)' },
  { value: 'America/Chicago', label: 'Chicago (Central)' },
  { value: 'America/Denver', label: 'Denver (Mountain)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'UTC', label: 'UTC' },
];

function AccentColorControl({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const browserAccent = '#8b7ac8';
  const current = value ?? '';
  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex flex-wrap gap-1.5 justify-end max-w-[260px]">
        {ACCENT_COLOR_PRESETS.map((p) => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              aria-label={`Set accent color to ${p.label}`}
              aria-pressed={active}
              className={cn(
                'w-6 h-6 rounded-md border transition-all',
                active
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/40 scale-110'
                  : 'border-border/60 hover:scale-105',
              )}
              style={{ background: p.value }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => onChange(null)}
          title={`Use workspace default (${browserAccent})`}
          aria-label="Reset accent color to workspace default"
          aria-pressed={value === null}
          className={cn(
            'h-6 px-2 inline-flex items-center gap-1 rounded-md border text-[10px] font-medium transition-colors',
            value === null
              ? 'bg-muted border-border text-foreground'
              : 'border-border/60 text-muted-foreground hover:text-foreground',
          )}
        >
          <X className="w-2.5 h-2.5" /> Default
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={current || browserAccent}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="w-7 h-7 p-0 border border-border rounded cursor-pointer bg-transparent"
          aria-label="Custom accent color"
        />
        <input
          type="text"
          value={current}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (v === '') {
              onChange(null);
            } else if (HEX_COLOR_RE.test(v)) {
              onChange(v.toLowerCase());
            }
          }}
          placeholder="#rrggbb"
          maxLength={7}
          className="w-[88px] px-2 py-1 text-[11px] font-mono bg-muted rounded-lg border border-border focus:outline-none focus:border-amber-500/50"
        />
      </div>
    </div>
  );
}

function DensityControl({
  value,
  onChange,
}: {
  value: 'comfortable' | 'compact';
  onChange: (next: 'comfortable' | 'compact') => void;
}) {
  const opts: Array<{ value: 'comfortable' | 'compact'; label: string; icon: React.ReactNode }> = [
    { value: 'comfortable', label: 'Comfortable', icon: <Maximize2 className="w-3 h-3" /> },
    { value: 'compact', label: 'Compact', icon: <Rows3 className="w-3 h-3" /> },
  ];
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-muted border border-border">
      {opts.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors',
              active
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TimeZoneControl({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const browserZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  })();
  const current = value ?? '';
  return (
    <select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : v);
      }}
      className="px-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:border-amber-500/50 max-w-[260px]"
      aria-label="Select preferred time zone"
    >
      <option value="">Browser default ({browserZone})</option>
      {COMMON_TIME_ZONES.map((z) => (
        <option key={z.value} value={z.value}>
          {z.label}
        </option>
      ))}
    </select>
  );
}

function AppPreferencesPanel() {
  const { prefs, setPreference, isLoaded } = useUserPreferences();

  const toggles = [
    {
      key: 'sidebar_collapsed' as const,
      label: 'Collapsed Sidebar',
      description: 'Start with the navigation sidebar collapsed on all workspaces',
      onIcon: <PanelLeftClose className="w-3 h-3" />,
      offIcon: <PanelLeftOpen className="w-3 h-3" />,
      onLabel: 'Collapsed',
      offLabel: 'Expanded',
    },
    {
      key: 'notification_sound' as const,
      label: 'Notification Sound',
      description: 'Play a soft audio cue when new notifications arrive in the platform',
      onIcon: <Volume2 className="w-3 h-3" />,
      offIcon: <VolumeX className="w-3 h-3" />,
      onLabel: 'On',
      offLabel: 'Off',
    },
  ];

  return (
    <SettingsSectionPanel
      title="Preferences"
      description="Personal UI preferences that travel with your account across all SZL workspaces"
    >
      <SettingsCard title="Layout & Sound">
        {isLoaded ? (
          <>
            {toggles.map(({ key, label, description, onIcon, offIcon, onLabel, offLabel }) => {
              const enabled = prefs[key];
              return (
                <SettingsRow key={key} label={label} description={description}>
                  <button
                    onClick={() => setPreference(key, !enabled)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      enabled
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {enabled ? onIcon : offIcon}
                    {enabled ? onLabel : offLabel}
                  </button>
                </SettingsRow>
              );
            })}
            <SettingsRow
              label="Density"
              description="Tighten or relax spacing across every workspace"
            >
              <DensityControl value={prefs.density} onChange={(v) => setPreference('density', v)} />
            </SettingsRow>
          </>
        ) : (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Theme" className="mt-4">
        {isLoaded ? (
          <SettingsRow
            label="Accent Color"
            description="Override the workspace accent with your own color across the navigation chrome"
          >
            <AccentColorControl
              value={prefs.accent_color}
              onChange={(v) => setPreference('accent_color', v)}
            />
          </SettingsRow>
        ) : (
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
        )}
      </SettingsCard>

      <SettingsCard title="Localization" className="mt-4">
        {isLoaded ? (
          <SettingsRow
            label="Time Zone"
            description="Used to format timestamps consistently across every workspace"
          >
            <TimeZoneControl
              value={prefs.time_zone}
              onChange={(v) => setPreference('time_zone', v)}
            />
          </SettingsRow>
        ) : (
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
        )}
      </SettingsCard>

      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          Preferences are saved to your account and applied automatically the next time you sign in
          on any device.
        </p>
      </div>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing Panel
// ─────────────────────────────────────────────────────────────────────────────

function BillingPanel() {
  return (
    <SettingsSectionPanel
      title="Billing & Subscription"
      description="Manage subscription plan, payment methods, and invoices for your organization."
    >
      <SettingsCard title="Current Plan">
        <SettingsRow label="Plan" description="Your active subscription tier">
          <span className="text-sm font-medium">Enterprise</span>
        </SettingsRow>
        <SettingsRow label="Billing Cycle" description="Next invoice date">
          <span className="text-sm text-muted-foreground">Monthly — renews May 1, 2026</span>
        </SettingsRow>
        <SettingsRow label="Seats" description="Licensed user seats">
          <span className="text-sm text-muted-foreground">Unlimited</span>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard title="Payment Method">
        <SettingsRow label="Default Card" description="Used for automatic payments">
          <span className="text-sm text-muted-foreground">•••• •••• •••• 4242 (Visa)</span>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard title="Invoices">
        <div className="py-3 text-sm text-muted-foreground">
          Invoice history is managed via the finance portal. Contact your account manager for
          copies.
        </div>
      </SettingsCard>
    </SettingsSectionPanel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function UnifiedSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  const panels: Partial<Record<SettingsSection, React.ReactNode>> = {
    account: <AccountPanel />,
    team: <TeamPanel />,
    notifications: <NotificationsPanel />,
    integrations: <IntegrationsPanel />,
    security: <SecurityPanel />,
    billing: <BillingPanel />,
    preferences: <AppPreferencesPanel />,
    audit: <AuditLogPanel />,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unified settings — platform defaults, tenant overrides, and user preferences
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
            'billing',
            'preferences',
            'audit',
          ]}
          isAdmin
          appName="SZL Holdings"
        >
          {panels[activeSection] ?? (
            <div className="p-6 text-sm text-muted-foreground">
              This section is not yet configured.
            </div>
          )}
        </SettingsShell>
      </div>
    </div>
  );
}
