import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Filter,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
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
    throw new Error(j.error ?? `API error ${res.status}`);
  }
  const j = await res.json();
  return j.data ?? j;
}

interface AzureTenant {
  id: number;
  azureTenantId: string;
  displayName: string;
  domain: string | null;
  status: 'pending' | 'active' | 'suspended';
  adminConsentGranted: 'pending' | 'granted' | 'revoked';
  organizationId: number | null;
  userCount: number;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TenantsResponse {
  count: number;
  tenants: AzureTenant[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    suspended: { label: 'Suspended', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
    granted: { label: 'Granted', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    revoked: { label: 'Revoked', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };
  const config = map[status] ?? {
    label: status,
    cls: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        config.cls,
      )}
    >
      {config.label}
    </span>
  );
}

interface DataverseConnection {
  id: number;
  orgUrl: string;
  orgName: string | null;
  authMethod: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  entitySyncCounts: Record<string, number> | null;
}

function TenantDetailPanel({ tenant, onClose }: { tenant: AzureTenant; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);

  const { data: tenantDetail } = useStandardQuery<{
    tenant: AzureTenant;
    dataverseConnections: DataverseConnection[];
  }>({
    queryKey: ['azure-tenant-detail', tenant.id],
    queryFn: () => apiFetch(`/admin/tenants/${tenant.id}`),
    retry: 1,
  });

  const dvConnections = tenantDetail?.dataverseConnections ?? [];
  const activeConnections = dvConnections.filter((c) => c.status === 'active');
  const lastSync = dvConnections
    .flatMap((c) => (c.lastSyncAt ? [new Date(c.lastSyncAt)] : []))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const totalSynced = dvConnections.reduce((sum, c) => {
    const counts = c.entitySyncCounts ?? {};
    return sum + Object.values(counts).reduce((s, n) => s + n, 0);
  }, 0);

  const updateStatus = useStandardMutation({
    mutationFn: (body: { status?: string; adminConsentGranted?: string }) =>
      apiFetch(`/admin/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['azure-tenants'] }),
  });

  const fetchConsentUrl = async () => {
    setLoadingConsent(true);
    try {
      const data = await apiFetch<{ adminConsentUrl: string }>(
        `/admin/tenants/${tenant.id}/admin-consent-url`,
      );
      setConsentUrl(data.adminConsentUrl);
    } catch {
      /* ignore */
    } finally {
      setLoadingConsent(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="border border-border rounded-2xl bg-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div>
          <div className="text-sm font-semibold text-foreground">{tenant.displayName}</div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {tenant.azureTenantId}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Status
            </div>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Admin Consent
            </div>
            <StatusBadge status={tenant.adminConsentGranted} />
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Domain
            </div>
            <div className="text-xs font-medium text-foreground">{tenant.domain ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Provisioned
            </div>
            <div className="text-xs font-medium text-foreground">
              {tenant.provisionedAt
                ? new Date(tenant.provisionedAt).toLocaleDateString()
                : 'Pending'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">Tenant ID</div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <code className="text-[11px] text-muted-foreground font-mono flex-1">
              {tenant.azureTenantId}
            </code>
            <button
              onClick={() => handleCopy(tenant.azureTenantId)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">Actions</div>
          <Link href={`/admin/tenant-branding/${tenant.id}`}>
            <a className="flex items-center gap-1.5 w-full mb-2 py-2 rounded-xl bg-violet-500/10 text-violet-500 text-xs font-medium hover:bg-violet-500/20 transition-colors border border-violet-500/20 justify-center">
              <Palette className="w-3.5 h-3.5" /> Manage Branding
            </a>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            {tenant.status === 'pending' && (
              <button
                onClick={() =>
                  updateStatus.mutate({ status: 'active', adminConsentGranted: 'granted' })
                }
                disabled={updateStatus.isPending}
                className="py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                {updateStatus.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Activate
              </button>
            )}
            {tenant.status === 'active' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'suspended' })}
                disabled={updateStatus.isPending}
                className="py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center justify-center gap-1.5"
              >
                <CircleOff className="w-3.5 h-3.5" /> Suspend
              </button>
            )}
            {tenant.status === 'suspended' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'active' })}
                disabled={updateStatus.isPending}
                className="py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate
              </button>
            )}
            <button
              onClick={fetchConsentUrl}
              disabled={loadingConsent}
              className="py-2 rounded-xl bg-muted/40 text-foreground text-xs font-medium hover:bg-muted/60 transition-colors border border-border flex items-center justify-center gap-1.5"
            >
              {loadingConsent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              Consent URL
            </button>
            {tenant.adminConsentGranted === 'pending' && (
              <button
                onClick={() => updateStatus.mutate({ adminConsentGranted: 'granted' })}
                disabled={updateStatus.isPending}
                className="py-2 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Mark Granted
              </button>
            )}
          </div>
        </div>

        {consentUrl && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground">Admin Consent URL</div>
            <div className="rounded-lg border border-border bg-muted/20 p-2.5 flex items-start gap-2">
              <code className="text-[10px] text-primary break-all flex-1">{consentUrl}</code>
              <button
                onClick={() => handleCopy(consentUrl)}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <a
              href={consentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Open in browser
            </a>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">Health Indicators</div>
          {[
            {
              label: 'SSO Login',
              icon: Shield,
              status: tenant.adminConsentGranted === 'granted' ? 'ok' : 'warn',
              detail:
                tenant.adminConsentGranted === 'granted' ? 'Consent granted' : 'Pending consent',
            },
            {
              label: 'Admin Consent',
              icon: Check,
              status: tenant.adminConsentGranted === 'granted' ? 'ok' : 'pending',
              detail: tenant.adminConsentGranted,
            },
            {
              label: 'Dataverse Connections',
              icon: Database,
              status:
                dvConnections.length === 0
                  ? 'pending'
                  : activeConnections.length > 0
                    ? 'ok'
                    : 'warn',
              detail:
                dvConnections.length === 0
                  ? 'Not configured'
                  : `${activeConnections.length}/${dvConnections.length} active`,
            },
            {
              label: 'Last Sync',
              icon: Activity,
              status: lastSync ? 'ok' : dvConnections.length > 0 ? 'warn' : 'pending',
              detail: lastSync
                ? lastSync.toLocaleString()
                : dvConnections.length > 0
                  ? 'Sync pending'
                  : 'No connections',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2"
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  item.status === 'ok'
                    ? 'bg-emerald-400'
                    : item.status === 'warn'
                      ? 'bg-amber-400'
                      : 'bg-muted-foreground/30',
                )}
              />
              <item.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-foreground flex-1">{item.label}</span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  item.status === 'ok'
                    ? 'text-emerald-500'
                    : item.status === 'warn'
                      ? 'text-amber-500'
                      : 'text-muted-foreground',
                )}
              >
                {item.detail}
              </span>
            </div>
          ))}
          {totalSynced > 0 && (
            <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2">
              <div className="text-[10px] text-muted-foreground mb-1">
                Records synced from Dataverse
              </div>
              <div className="text-xs font-bold text-foreground">
                {totalSynced.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}

export default function AzureTenantDashboardPage() {
  const [selectedTenant, setSelectedTenant] = useState<AzureTenant | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch, isFetching } = useStandardQuery<TenantsResponse>({
    queryKey: ['azure-tenants'],
    queryFn: () => apiFetch('/admin/tenants'),
    retry: 1,
  });

  const tenants = data?.tenants ?? [];
  const filtered = tenants.filter((t) => {
    const matchSearch =
      !search ||
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      t.azureTenantId.includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: Building2, color: 'text-blue-500' },
    {
      label: 'Active',
      value: tenants.filter((t) => t.status === 'active').length,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      label: 'Pending Consent',
      value: tenants.filter((t) => t.adminConsentGranted === 'pending').length,
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      label: 'Suspended',
      value: tenants.filter((t) => t.status === 'suspended').length,
      icon: AlertCircle,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <a className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </a>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-foreground font-medium">Azure AD Tenants</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          </button>
          <Link href="/admin/azure-onboarding">
            <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Onboard Tenant
            </a>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Azure AD Tenant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage enterprise Azure AD tenants provisioned for SZL platform access.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <m.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                    s.color.replace('text-', 'bg-') + '/10',
                  )}
                >
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </m.div>
            );
          })}
        </div>

        <div
          className={cn(
            'grid gap-6 transition-all',
            selectedTenant ? 'grid-cols-1 md:grid-cols-[1fr_380px]' : 'grid-cols-1',
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tenants..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <div className="text-sm font-medium text-foreground mb-1">
                  Failed to load tenants
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'API error'}
                </div>
                <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-12 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <div className="text-sm font-medium text-foreground mb-1">No tenants found</div>
                <p className="text-xs text-muted-foreground mb-6">
                  {search || statusFilter !== 'all'
                    ? 'Adjust your filters'
                    : 'Onboard your first enterprise Azure AD tenant to get started.'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Link href="/admin/azure-onboarding">
                    <a className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Onboard First Tenant
                    </a>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Organization</span>
                  <span>Status</span>
                  <span>Consent</span>
                  <span>Users</span>
                  <span>Health</span>
                  <span></span>
                </div>
                {filtered.map((tenant) => (
                  <m.div
                    key={tenant.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedTenant((t) => (t?.id === tenant.id ? null : tenant))}
                    className={cn(
                      'grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/20 transition-colors',
                      selectedTenant?.id === tenant.id &&
                        'bg-primary/5 border-l-2 border-l-primary',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {tenant.displayName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {tenant.domain ?? tenant.azureTenantId.slice(0, 20) + '…'}
                      </div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                        Added {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <StatusBadge status={tenant.status} />
                    <StatusBadge status={tenant.adminConsentGranted} />

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{tenant.userCount}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[
                        {
                          color: tenant.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400',
                          label: 'SSO',
                        },
                        {
                          color:
                            tenant.adminConsentGranted === 'granted'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400/60',
                          label: 'Consent',
                        },
                        { color: 'bg-muted-foreground/30', label: 'SCIM' },
                      ].map((h) => (
                        <div
                          key={h.label}
                          title={h.label}
                          className={cn('w-2 h-2 rounded-full', h.color)}
                        />
                      ))}
                    </div>

                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-muted-foreground/50 transition-transform',
                        selectedTenant?.id === tenant.id && 'rotate-90',
                      )}
                    />
                  </m.div>
                ))}
              </div>
            )}
          </div>

          {selectedTenant && (
            <TenantDetailPanel tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
