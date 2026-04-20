import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const API = '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as Record<string, string>).error ?? `API error ${res.status}`);
  }
  const j = await res.json();
  return (j.data ?? j) as T;
}

interface AzureTenant {
  id: number;
  azureTenantId: string;
  displayName: string;
  domain: string | null;
  status: string;
  organizationId: number | null;
  provisionedAt: string | null;
  createdAt: string;
}

interface ScimToken {
  id: number;
  label: string;
  tokenPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ProvisionedUser {
  id: number;
  userId: number;
  displayName: string;
  email: string | null;
  scimUserName: string;
  externalId: string | null;
  active: boolean;
  provisionedRole: string;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncActivity {
  id: number;
  operation: string;
  resourceType: string;
  status: string;
  externalId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface ScimDashboardData {
  tenantId: string;
  tenantName: string;
  scim: {
    enabled: boolean;
    lastSyncAt: string | null;
    lastTokenUsedAt: string | null;
    provisionedUsersCount: number;
    activeUsersCount: number;
    inactiveUsersCount: number;
    errorCount: number;
  };
  provisionedUsers: ProvisionedUser[];
  errorLog: SyncActivity[];
  recentActivity: SyncActivity[];
}

interface TokensResponse {
  tenantId: string;
  tenantName: string;
  count: number;
  tokens: ScimToken[];
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        active
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          : 'bg-red-500/10 text-red-500 border-red-500/20',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function TenantStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        map[status] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {status}
    </span>
  );
}

function OperationBadge({ op, status }: { op: string; status: string }) {
  const isError = status === 'error';
  return (
    <span
      className={cn(
        'text-[10px] font-mono px-2 py-0.5 rounded border',
        isError
          ? 'bg-red-500/10 text-red-500 border-red-500/20'
          : 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      )}
    >
      {op}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CreateTokenModal({
  tenantId,
  onClose,
  onCreated,
}: {
  tenantId: number;
  onClose: () => void;
  onCreated: (token: { rawToken: string; label: string; prefix: string }) => void;
}) {
  const [label, setLabel] = useState('default');
  const [expiry, setExpiry] = useState('');

  const mutation = useStandardMutation({
    mutationFn: () =>
      apiFetch(`/admin/tenants/${tenantId}/scim/tokens`, {
        method: 'POST',
        body: JSON.stringify({ label, expiresInDays: expiry ? parseInt(expiry, 10) : undefined }),
      }),
    onSuccess: (data: unknown) => {
      const d = data as { rawToken: string; token: { label: string; tokenPrefix: string } };
      onCreated({ rawToken: d.rawToken, label: d.token.label, prefix: d.token.tokenPrefix });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">Create SCIM Token</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a bearer token for IdP SCIM provisioning
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Token Label
            </label>
            <input
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. azure-ad-production"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Expiry (days, optional)
            </label>
            <input
              type="number"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="Leave empty for no expiry"
              min={1}
              max={3650}
            />
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-600">
              The raw token is shown only once after creation. Store it securely.
            </p>
          </div>

          {mutation.error && (
            <p className="text-xs text-red-500">{(mutation.error as Error).message}</p>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !label.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Create Token
          </button>
        </div>
      </m.div>
    </div>
  );
}

function NewTokenDisplay({
  rawToken,
  label,
  onClose,
}: {
  rawToken: string;
  label: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Token Created</h3>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-4">
          <p className="text-xs font-semibold text-amber-600 mb-2">
            Store this token now — it will not be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-foreground bg-black/20 rounded px-2 py-1.5 overflow-hidden">
              {visible ? rawToken : rawToken.slice(0, 12) + '•'.repeat(40)}
            </code>
            <button
              onClick={() => setVisible(!visible)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={copy} className="text-muted-foreground hover:text-foreground p-1">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 mb-4">
          <p className="text-xs font-medium text-foreground mb-1">
            Usage in your IdP configuration:
          </p>
          <code className="text-xs font-mono text-muted-foreground">
            Authorization: Bearer {rawToken.slice(0, 12)}…
          </code>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Done — I have saved the token
        </button>
      </m.div>
    </div>
  );
}

function TenantScimPanel({ tenant }: { tenant: AzureTenant }) {
  const queryClient = useQueryClient();
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [newToken, setNewToken] = useState<{
    rawToken: string;
    label: string;
    prefix: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'activity'>('users');

  const { data: dashboard, isLoading: dashLoading } = useStandardQuery<ScimDashboardData>({
    queryKey: ['scim-dashboard', tenant.id],
    queryFn: () => apiFetch(`/admin/tenants/${tenant.id}/scim/provisioned-users`),
    refetchInterval: 30000,
  });

  const { data: tokensData, isLoading: tokensLoading } = useStandardQuery<TokensResponse>({
    queryKey: ['scim-tokens', tenant.id],
    queryFn: () => apiFetch(`/admin/tenants/${tenant.id}/scim/tokens`),
  });

  const syncMutation = useStandardMutation({
    mutationFn: () => apiFetch(`/admin/tenants/${tenant.id}/scim/sync`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scim-dashboard', tenant.id] }),
  });

  const revokeTokenMutation = useStandardMutation({
    mutationFn: (tokenId: number) =>
      apiFetch(`/admin/tenants/${tenant.id}/scim/tokens/${tokenId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scim-tokens', tenant.id] }),
  });

  const scim = dashboard?.scim;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Provisioned Users',
            value: scim?.provisionedUsersCount ?? '–',
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Active',
            value: scim?.activeUsersCount ?? '–',
            icon: UserCheck,
            color: 'emerald',
          },
          {
            label: 'Inactive',
            value: scim?.inactiveUsersCount ?? '–',
            icon: UserX,
            color: 'amber',
          },
          { label: 'Sync Errors', value: scim?.errorCount ?? '–', icon: AlertCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-muted/40 border border-border/50 rounded-xl p-4">
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center mb-2',
                color === 'blue'
                  ? 'bg-blue-500/10'
                  : color === 'emerald'
                    ? 'bg-emerald-500/10'
                    : color === 'amber'
                      ? 'bg-amber-500/10'
                      : 'bg-red-500/10',
              )}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5',
                  color === 'blue'
                    ? 'text-blue-500'
                    : color === 'emerald'
                      ? 'text-emerald-500'
                      : color === 'amber'
                        ? 'text-amber-500'
                        : 'text-red-500',
                )}
              />
            </div>
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {(['users', 'tokens', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                activeTab === tab
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'users'
                ? 'Provisioned Users'
                : tab === 'tokens'
                  ? 'SCIM Tokens'
                  : 'Sync Activity'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {scim?.lastSyncAt && (
            <span className="text-xs text-muted-foreground">
              Last sync {timeAgo(scim.lastSyncAt)}
            </span>
          )}
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', syncMutation.isPending && 'animate-spin')} />
            Sync Now
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div>
          {dashLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !dashboard?.provisionedUsers.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No users provisioned yet</p>
              <p className="text-xs mt-1">
                Configure your IdP to push users via SCIM to this tenant
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      SCIM Username
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Last Sync
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.provisionedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{u.displayName}</div>
                        <div className="text-muted-foreground text-xs">{u.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-muted-foreground">
                          {u.scimUserName}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono">
                          {u.provisionedRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={u.active} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.lastSyncAt ? timeAgo(u.lastSyncAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tokens' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowCreateToken(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3 h-3" />
              New Token
            </button>
          </div>

          {tokensLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !tokensData?.tokens.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No SCIM tokens yet</p>
              <p className="text-xs mt-1">
                Create a bearer token to authenticate your IdP SCIM client
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Label
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Prefix
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Last Used
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Expires
                    </th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tokensData.tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-xs text-foreground">{t.label}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-muted-foreground">
                          {t.tokenPrefix}…
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={t.isActive} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.lastUsedAt ? timeAgo(t.lastUsedAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        {t.isActive && (
                          <button
                            onClick={() => revokeTokenMutation.mutate(t.id)}
                            disabled={revokeTokenMutation.isPending}
                            className="text-red-500 hover:text-red-600 p-1 transition-colors"
                            title="Revoke token"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          {dashLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !dashboard?.recentActivity.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sync activity yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {dashboard.recentActivity.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 rounded-lg',
                    a.status === 'error' ? 'bg-red-500/5' : 'hover:bg-muted/20',
                  )}
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                      a.status === 'success'
                        ? 'bg-emerald-500'
                        : a.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-amber-500',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <OperationBadge op={a.operation} status={a.status} />
                      <span className="text-xs text-muted-foreground">{a.resourceType}</span>
                      {a.externalId && (
                        <code className="text-xs font-mono text-muted-foreground opacity-60">
                          {a.externalId}
                        </code>
                      )}
                    </div>
                    {a.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">{a.errorMessage}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateToken && (
        <CreateTokenModal
          tenantId={tenant.id}
          onClose={() => setShowCreateToken(false)}
          onCreated={(token) => {
            setShowCreateToken(false);
            setNewToken(token);
            queryClient.invalidateQueries({ queryKey: ['scim-tokens', tenant.id] });
          }}
        />
      )}

      {newToken && (
        <NewTokenDisplay
          rawToken={newToken.rawToken}
          label={newToken.label}
          onClose={() => setNewToken(null)}
        />
      )}
    </div>
  );
}

export default function ScimProvisioningPage() {
  const [selectedTenant, setSelectedTenant] = useState<AzureTenant | null>(null);
  const [search, setSearch] = useState('');

  const { data: tenantsData, isLoading } = useStandardQuery<{
    count: number;
    tenants: AzureTenant[];
  }>({
    queryKey: ['azure-tenants'],
    queryFn: () => apiFetch('/admin/tenants'),
  });

  const tenants = (tenantsData?.tenants ?? []).filter(
    (t) =>
      !search ||
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      t.domain?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">SCIM 2.0 Provisioning</h1>
              <p className="text-xs text-muted-foreground">Enterprise IdP auto-sync dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {selectedTenant ? (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedTenant(null)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                All Tenants
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium text-foreground">
                {selectedTenant.displayName}
              </span>
              <TenantStatusBadge status={selectedTenant.status} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-foreground">{selectedTenant.displayName}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTenant.domain ?? selectedTenant.azureTenantId}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-mono opacity-60">{selectedTenant.azureTenantId}</div>
                  {selectedTenant.provisionedAt && (
                    <div className="mt-0.5">
                      Provisioned {new Date(selectedTenant.provisionedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <TenantScimPanel tenant={selectedTenant} />
            </div>
          </m.div>
        ) : (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Enterprise Tenants</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select a tenant to manage SCIM provisioning and IdP sync
                </p>
              </div>
              <Link href="/admin/azure-tenants">
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Manage Tenants <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            <div className="relative mb-4">
              <input
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search tenants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !tenants.length ? (
              <div className="text-center py-20 text-muted-foreground">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No tenants found</p>
                <p className="text-xs mt-1">
                  <Link href="/admin/azure-onboarding">
                    <span className="text-primary hover:underline cursor-pointer">
                      Provision a tenant
                    </span>
                  </Link>{' '}
                  to enable SCIM provisioning
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tenants.map((tenant) => (
                  <m.button
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
                    whileHover={{ scale: 1.005 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {tenant.displayName}
                            </span>
                            <TenantStatusBadge status={tenant.status} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {tenant.domain ?? tenant.azureTenantId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted-foreground">
                          {tenant.provisionedAt
                            ? `Provisioned ${new Date(tenant.provisionedAt).toLocaleDateString()}`
                            : 'Not provisioned'}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </m.button>
                ))}
              </div>
            )}
          </m.div>
        )}
      </div>
    </div>
  );
}
