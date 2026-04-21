import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { EmptyState as SharedEmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { useRole } from '@szl-holdings/shared-ui/use-role';
import { useUserPreferences } from '@szl-holdings/shared-ui/use-user-preferences';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Database,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  Flag,
  Globe,
  HeadphonesIcon,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Tag,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  UserX,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const API = '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function adminFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tenant {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
  memberCount: number;
  subscription: { status: string; planId: number } | null;
  createdAt: string;
  updatedAt: string | null;
}
interface TenantDetail {
  tenant: Tenant & { memberCount: number };
  members: {
    id: number;
    email: string;
    displayName: string | null;
    role: string;
    joinedAt: string;
  }[];
  subscription: {
    id: number;
    status: string;
    planId: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
  usage: { featureKey: string; total: number }[];
}
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
}
interface UserDetail {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: number; name: string }[];
  organizations: { id: number; name: string; slug: string; role: string }[];
}
interface PlatformRole {
  id: number;
  name: string;
  description: string | null;
}
interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  result: string;
  timestamp: string;
  details: string | null;
  ipAddress: string | null;
  entityType?: string;
  entityId?: string;
  orgId?: number;
}
interface FeatureFlag {
  key: string;
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  updatedAt: string;
}
interface FlagOverride {
  id: number;
  flagId: number;
  entityType: 'user' | 'org' | 'role';
  entityId: string;
  isEnabled: boolean;
}
interface HealthCheck {
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  details: string;
}
interface SupportTicket {
  id: number;
  formKey: string;
  fullName: string;
  email: string;
  company?: string;
  message?: string;
  createdAt: string;
  status?: string;
  notes?: string;
  ownerUserId?: number | null;
  leadStatusId?: number | null;
  submissionStatus?: 'open' | 'resolved';
  resolvedAt?: string | null;
}
interface OverviewData {
  counts: {
    users: number;
    activeUsers: number;
    apps: number;
    connectors: number;
    liveConnectors: number;
  };
  database: { status: string; latency: number };
  system: { uptime: number; memoryUsage: { rss: number; heapUsed: number } };
}
interface AnalyticsData {
  platform: {
    totalUsers: number;
    activeUsers: number;
    totalTenants: number;
    activeFlags: number;
    totalAuditEvents: number;
    openSupportTickets: number;
  };
  topTenants: { orgId: number | null; name: string; totalUsage: number }[];
  billing: {
    plan: string;
    status: string;
    monthlyAmount: number;
    currency: string;
    seats: number;
  } | null;
  api: {
    requestCount: number;
    errorRate: number;
    p95Latency: number;
    throughputPerHour: number;
    authFailures: number;
  };
  uptime: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'support', label: 'Support Queue', icon: HeadphonesIcon },
  { id: 'audit', label: 'Audit Log', icon: Shield },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
  { id: 'health', label: 'System Health', icon: Activity },
] as const;

type Section = (typeof NAV_ITEMS)[number]['id'];

// ─── Shared Components ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'healthy' || s === 'active' || s === 'pass' || s === 'true')
    return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />;
  if (s === 'degraded' || s === 'warning' || s === 'new' || s === 'contacted')
    return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
}

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'neutral';

function Badge({ label, variant = 'neutral' }: { label: string; variant?: BadgeVariant }) {
  const cls = {
    green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  }[variant];
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        cls,
      )}
    >
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          color.replace('text-', 'bg-') + '/10',
        )}
      >
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search...'}
        className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <SharedEmptyState headline={message} compact />;
}

function SectionHeader({
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      )}
    </div>
  );
}

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel() {
  const { data, isLoading, refetch } = useStandardQuery<OverviewData>({
    queryKey: ['admin-overview'],
    queryFn: () => adminFetch<OverviewData>('/admin/overview'),
    refetchInterval: 30000,
  });

  const uptime = data?.system?.uptime ?? 0;
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMin = Math.floor((uptime % 3600) / 60);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Command Center Overview"
        subtitle="Real-time platform health and key metrics"
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={data?.counts?.users ?? 0}
              sub={`${data?.counts?.activeUsers ?? 0} active`}
              color="text-blue-500"
            />
            <StatCard
              icon={Globe}
              label="Registered Apps"
              value={data?.counts?.apps ?? 0}
              color="text-violet-500"
            />
            <StatCard
              icon={Database}
              label="Database"
              value={data?.database?.status ?? '—'}
              sub={`${data?.database?.latency ?? 0}ms`}
              color="text-emerald-500"
            />
            <StatCard
              icon={Activity}
              label="Uptime"
              value={`${uptimeHours}h ${uptimeMin}m`}
              color="text-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Database
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Status</span>
                  <span className="text-foreground font-medium">{data?.database?.status}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Latency</span>
                  <span className="text-foreground font-medium">{data?.database?.latency}ms</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Memory
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>RSS</span>
                  <span className="text-foreground font-medium">
                    {Math.round((data?.system?.memoryUsage?.rss ?? 0) / 1024 / 1024)}MB
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Heap Used</span>
                  <span className="text-foreground font-medium">
                    {Math.round((data?.system?.memoryUsage?.heapUsed ?? 0) / 1024 / 1024)}MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel() {
  const { data, isLoading, refetch } = useStandardQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: () => adminFetch<AnalyticsData>('/admin/analytics'),
    refetchInterval: 60000,
  });

  const uptimeHours = Math.floor((data?.uptime ?? 0) / 3600);
  const topTenants = data?.topTenants ?? [];
  const maxUsage = topTenants.length > 0 ? Math.max(...topTenants.map((t) => t.totalUsage)) : 1;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform Analytics"
        subtitle="Key platform metrics, top tenants, and API performance"
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={data?.platform?.totalUsers ?? 0}
              sub={`${data?.platform?.activeUsers ?? 0} active`}
              color="text-blue-500"
            />
            <StatCard
              icon={Building2}
              label="Active Tenants"
              value={data?.platform?.totalTenants ?? 0}
              color="text-violet-500"
            />
            <StatCard
              icon={Flag}
              label="Active Flags"
              value={data?.platform?.activeFlags ?? 0}
              color="text-amber-500"
            />
            <StatCard
              icon={Shield}
              label="Audit Events"
              value={(data?.platform?.totalAuditEvents ?? 0).toLocaleString()}
              color="text-emerald-500"
            />
            <StatCard
              icon={HeadphonesIcon}
              label="Support Tickets"
              value={data?.platform?.openSupportTickets ?? 0}
              color="text-rose-500"
            />
            <StatCard
              icon={Activity}
              label="Uptime"
              value={`${uptimeHours}h`}
              color="text-cyan-500"
            />
          </div>

          {topTenants.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Top Tenants by Usage
              </h3>
              <div className="space-y-3">
                {topTenants.map((t, i) => (
                  <div key={t.orgId ?? i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[60%]">
                        {t.name}
                      </span>
                      <span className="text-muted-foreground">
                        {(t.totalUsage ?? 0).toLocaleString()} events
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round(((t.totalUsage ?? 0) / maxUsage) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.billing && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Billing Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {[
                  { label: 'Plan', value: data.billing.plan ?? '—' },
                  { label: 'Status', value: data.billing.status ?? '—' },
                  {
                    label: 'Monthly Amount',
                    value:
                      data.billing.monthlyAmount != null
                        ? `${data.billing.currency?.toUpperCase() ?? 'USD'} ${(data.billing.monthlyAmount / 100).toFixed(2)}`
                        : '—',
                  },
                  { label: 'Seats', value: data.billing.seats?.toLocaleString() ?? '—' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold text-foreground capitalize">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> API Performance
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: 'Total Requests', value: (data?.api?.requestCount ?? 0).toLocaleString() },
                {
                  label: 'Error Rate',
                  value: `${((data?.api?.errorRate ?? 0) * 100).toFixed(1)}%`,
                },
                { label: 'P95 Latency', value: `${data?.api?.p95Latency ?? 0}ms` },
                { label: 'Auth Failures', value: (data?.api?.authFailures ?? 0).toLocaleString() },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tenant Detail Drawer ─────────────────────────────────────────────────────

function TenantDetailDrawer({
  tenantId,
  onClose,
}: {
  tenantId: number | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useStandardQuery<TenantDetail>({
    queryKey: ['admin-tenant-detail', tenantId],
    queryFn: () => adminFetch<TenantDetail>(`/admin/orgs/${tenantId}`),
    enabled: tenantId != null,
  });

  return (
    <Drawer open={tenantId != null} onClose={onClose} title="Tenant Details">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? null : (
        <div className="space-y-5">
          <div>
            <div className="text-base font-semibold text-foreground">{data.tenant.name}</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{data.tenant.slug}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge
                label={data.tenant.isActive ? 'active' : 'suspended'}
                variant={data.tenant.isActive ? 'green' : 'red'}
              />
              {data.subscription && (
                <Badge
                  label={data.subscription.status}
                  variant={data.subscription.status === 'active' ? 'blue' : 'amber'}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{data.tenant.memberCount}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Members</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">
                {data.usage.reduce((s, u) => s + u.total, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">Total Events</div>
            </div>
          </div>

          {data.subscription && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-foreground mb-2">Subscription</h4>
              {[
                { label: 'Status', value: data.subscription.status },
                { label: 'Plan ID', value: String(data.subscription.planId) },
                {
                  label: 'Period Start',
                  value: new Date(data.subscription.currentPeriodStart).toLocaleDateString(),
                },
                {
                  label: 'Period End',
                  value: new Date(data.subscription.currentPeriodEnd).toLocaleDateString(),
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {data.usage.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Usage by Feature</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {data.usage.map((u) => (
                  <div
                    key={u.featureKey}
                    className="flex justify-between items-center px-3 py-2 text-xs"
                  >
                    <span className="text-muted-foreground font-mono">{u.featureKey}</span>
                    <span className="font-semibold text-foreground">
                      {u.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.members.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">
                Members ({data.members.length})
              </h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {data.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        {m.displayName ?? m.email}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{m.email}</div>
                    </div>
                    <Badge label={m.role} variant="neutral" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ─── Tenant Panel ─────────────────────────────────────────────────────────────

function TenantsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ tenants: Tenant[]; total: number }>({
    queryKey: ['admin-tenants'],
    queryFn: () => adminFetch('/admin/orgs'),
  });

  const suspendMutation = useStandardMutation({
    mutationFn: ({ id, suspended }: { id: number; suspended: boolean }) =>
      adminFetch(`/admin/orgs/${id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tenants'] }),
  });

  const createMutation = useStandardMutation({
    mutationFn: (vals: { name: string; slug: string }) =>
      adminFetch('/admin/orgs', { method: 'POST', body: JSON.stringify(vals) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      setCreating(false);
      setForm({ name: '', slug: '' });
    },
  });

  const tenants = (data?.tenants ?? []).filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Tenant Management"
        subtitle={`${data?.total ?? 0} organizations`}
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tenants..." />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Tenant
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState message={search ? 'No tenants match your search.' : 'No tenants yet.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusDot status={t.isActive ? 'active' : 'down'} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.slug} · {t.memberCount} member{t.memberCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.subscription && (
                  <Badge
                    label={t.subscription.status}
                    variant={t.subscription.status === 'active' ? 'green' : 'neutral'}
                  />
                )}
                <Badge
                  label={t.isActive ? 'active' : 'suspended'}
                  variant={t.isActive ? 'green' : 'red'}
                />
                <button
                  onClick={() => setSelectedTenantId(t.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => suspendMutation.mutate({ id: t.id, suspended: t.isActive })}
                  disabled={suspendMutation.isPending}
                  className={cn(
                    'text-xs px-2 py-1 rounded-md font-medium transition-colors',
                    t.isActive
                      ? 'text-amber-600 hover:bg-amber-500/10'
                      : 'text-emerald-600 hover:bg-emerald-500/10',
                  )}
                >
                  {t.isActive ? 'Suspend' : 'Restore'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TenantDetailDrawer tenantId={selectedTenantId} onClose={() => setSelectedTenantId(null)} />

      <AnimatePresence>
        {creating && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-foreground">Create New Tenant</h3>
                <button
                  onClick={() => setCreating(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Organization Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="acme-corp"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.name || !form.slug || createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Tenant
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({ userId, onClose }: { userId: number | null; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: detail, isLoading } = useStandardQuery<UserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminFetch<UserDetail>(`/admin/users/${userId}/detail`),
    enabled: userId != null,
  });

  const { data: rolesData } = useStandardQuery<{ roles: PlatformRole[] }>({
    queryKey: ['admin-roles'],
    queryFn: () => adminFetch<{ roles: PlatformRole[] }>('/admin/roles'),
    enabled: userId != null,
  });

  const roleMutation = useStandardMutation({
    mutationFn: ({ roleId, action }: { roleId: number; action: 'add' | 'remove' }) =>
      adminFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId, action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const userRoleIds = new Set((detail?.roles ?? []).map((r) => r.id));

  return (
    <Modal open={userId != null} onClose={onClose} title="User Profile">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !detail ? null : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {(detail.displayName ?? detail.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {detail.displayName ?? detail.email}
              </div>
              <div className="text-xs text-muted-foreground">{detail.email}</div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <Badge
                  label={detail.isActive ? 'active' : 'inactive'}
                  variant={detail.isActive ? 'green' : 'red'}
                />
                {detail.roles.map((r) => (
                  <Badge key={r.id} label={r.name} variant="blue" />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-foreground">{detail.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">
                {new Date(detail.createdAt).toLocaleDateString()}
              </span>
            </div>
            {detail.lastLoginAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login</span>
                <span className="text-foreground">
                  {new Date(detail.lastLoginAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {detail.organizations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Organizations</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {detail.organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">{org.name}</span>
                    <Badge label={org.role} variant="neutral" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {rolesData && rolesData.roles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Platform Roles</h4>
              <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                {rolesData.roles.map((role) => {
                  const hasRole = userRoleIds.has(role.id);
                  return (
                    <div key={role.id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-foreground capitalize">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-[10px] text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          roleMutation.mutate({
                            roleId: role.id,
                            action: hasRole ? 'remove' : 'add',
                          })
                        }
                        disabled={roleMutation.isPending}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
                          hasRole
                            ? 'bg-blue-500/10 text-blue-600 hover:bg-red-500/10 hover:text-red-500'
                            : 'bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600',
                        )}
                      >
                        {hasRole ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Change Role Modal ────────────────────────────────────────────────────────

function ChangeRoleModal({
  userId,
  userName,
  onClose,
}: {
  userId: number | null;
  userName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: detailData, isLoading: detailLoading } = useStandardQuery<UserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminFetch<UserDetail>(`/admin/users/${userId}/detail`),
    enabled: userId != null,
  });

  const { data: rolesData, isLoading: rolesLoading } = useStandardQuery<{ roles: PlatformRole[] }>({
    queryKey: ['admin-roles'],
    queryFn: () => adminFetch<{ roles: PlatformRole[] }>('/admin/roles'),
    enabled: userId != null,
  });

  const roleMutation = useStandardMutation({
    mutationFn: ({ roleId, action }: { roleId: number; action: 'add' | 'remove' }) =>
      adminFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId, action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const userRoleIds = new Set((detailData?.roles ?? []).map((r) => r.id));
  const isLoading = detailLoading || rolesLoading;

  return (
    <Modal open={userId != null} onClose={onClose} title={`Change Role — ${userName}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Current Roles</div>
            {detailData && detailData.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detailData.roles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium"
                  >
                    {r.name}
                    <button
                      onClick={() => roleMutation.mutate({ roleId: r.id, action: 'remove' })}
                      disabled={roleMutation.isPending}
                      className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                      title={`Remove ${r.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No roles assigned.</p>
            )}
          </div>

          <div className="border-t border-border/50 pt-4">
            <div className="text-xs font-semibold text-foreground mb-2">Assign Role</div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {(rolesData?.roles ?? []).map((role) => {
                const hasRole = userRoleIds.has(role.id);
                return (
                  <div key={role.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <div className="text-xs font-medium text-foreground capitalize">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-[10px] text-muted-foreground">{role.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        roleMutation.mutate({ roleId: role.id, action: hasRole ? 'remove' : 'add' })
                      }
                      disabled={roleMutation.isPending}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-md font-medium transition-colors min-w-[60px] text-center',
                        hasRole
                          ? 'bg-blue-500/10 text-blue-600 hover:bg-red-500/10 hover:text-red-500'
                          : 'bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600',
                      )}
                    >
                      {roleMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                      ) : hasRole ? (
                        'Remove'
                      ) : (
                        'Assign'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Users Panel ──────────────────────────────────────────────────────────────

function UsersPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading, refetch } = useStandardQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users'],
    queryFn: () => adminFetch('/admin/users'),
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => {
      const numId = id.replace('usr_', '');
      return adminFetch(`/admin/users/${numId}/deactivate`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = (data?.users ?? []).filter(
    (u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        subtitle={`${data?.total ?? 0} platform users`}
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      <SearchInput value={search} onChange={setSearch} placeholder="Search by email or name..." />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState message={search ? 'No users match your search.' : 'No users found.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {users.map((u) => {
            const numId = parseInt(u.id.replace('usr_', ''), 10);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {(u.name ?? u.email ?? '?')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {u.name ?? u.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.roles.map((r) => (
                    <Badge
                      key={r}
                      label={r}
                      variant={r === 'admin' || r === 'super_admin' ? 'blue' : 'neutral'}
                    />
                  ))}
                  <Badge label={u.status} variant={u.status === 'active' ? 'green' : 'red'} />
                  <button
                    onClick={() =>
                      setChangeRoleUser({ id: numId, name: u.name ?? u.email ?? 'User' })
                    }
                    className="p-1.5 rounded-md text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                    title="Change role"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedUserId(numId)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View profile & manage roles"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ id: u.id, active: u.status !== 'active' })
                    }
                    disabled={toggleMutation.isPending}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      u.status === 'active'
                        ? 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                        : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10',
                    )}
                    title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {u.status === 'active' ? (
                      <UserX className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      <ChangeRoleModal
        userId={changeRoleUser?.id ?? null}
        userName={changeRoleUser?.name ?? ''}
        onClose={() => setChangeRoleUser(null)}
      />
    </div>
  );
}

// ─── Support Queue Panel ──────────────────────────────────────────────────────

const TICKET_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

const statusConfig: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'blue' },
  contacted: { label: 'Contacted', variant: 'amber' },
  qualified: { label: 'Qualified', variant: 'violet' },
  closed: { label: 'Closed', variant: 'green' },
  lost: { label: 'Lost', variant: 'red' },
};

interface ReplyModal {
  ticketId: number;
  email: string;
  name: string;
  subject: string;
  body: string;
}

function SupportPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assignInputs, setAssignInputs] = useState<Record<number, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [replyModal, setReplyModal] = useState<ReplyModal | null>(null);
  const [replySending, setReplySending] = useState(false);
  const [replyResult, setReplyResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );

  const { data, isLoading, refetch } = useStandardQuery<{
    tickets: SupportTicket[];
    total: number;
    openTotal: number;
  }>({
    queryKey: ['admin-support', showResolved],
    queryFn: () => adminFetch(`/admin/support-queue${showResolved ? '?includeResolved=true' : ''}`),
    refetchInterval: 60000,
  });

  const statusMutation = useStandardMutation({
    mutationFn: ({
      id,
      status,
      ownerUserId,
    }: {
      id: number;
      status: string;
      ownerUserId?: number;
    }) =>
      adminFetch(`/admin/support-queue/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, ownerUserId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const assignMutation = useStandardMutation({
    mutationFn: ({ id, ownerUserId }: { id: number; ownerUserId: number }) =>
      adminFetch(`/admin/support-queue/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'contacted', ownerUserId }),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-support'] });
      setAssignInputs((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    },
  });

  const noteMutation = useStandardMutation({
    mutationFn: ({ id, notes, status }: { id: number; notes: string; status: string }) =>
      adminFetch(`/admin/support-queue/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-support'] });
      setNoteInputs((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    },
  });

  const resolveMutation = useStandardMutation({
    mutationFn: ({ id }: { id: number }) =>
      adminFetch(`/admin/support-queue/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const reopenMutation = useStandardMutation({
    mutationFn: ({ id }: { id: number }) =>
      adminFetch(`/admin/support-queue/${id}/reopen`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support'] }),
  });

  const handleSendReply = async () => {
    if (!replyModal) return;
    setReplySending(true);
    setReplyResult(null);
    try {
      const result = await adminFetch<{ success: boolean; sent: boolean; error?: string }>(
        `/admin/support-queue/${replyModal.ticketId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ subject: replyModal.subject, body: replyModal.body }),
        },
      );
      if (result.sent) {
        setReplyResult({ success: true, message: 'Reply sent successfully.' });
        setTimeout(() => {
          setReplyModal(null);
          setReplyResult(null);
        }, 1500);
      } else {
        setReplyResult({
          success: false,
          message: result.error ?? 'Email delivery unavailable — no provider configured.',
        });
      }
    } catch {
      setReplyResult({ success: false, message: 'Failed to send reply. Please try again.' });
    } finally {
      setReplySending(false);
    }
  };

  const tickets = (data?.tickets ?? []).filter((t) => {
    const s = t.status ?? 'new';
    const matchStatus = statusFilter === 'all' || s === statusFilter;
    const matchSearch =
      !search ||
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.formKey.includes(search);
    return matchStatus && matchSearch;
  });

  const formKeyLabel: Record<
    string,
    { label: string; variant: 'blue' | 'green' | 'amber' | 'neutral' }
  > = {
    szl_contact: { label: 'General', variant: 'blue' },
    vessels_demo: { label: 'Vessels Demo', variant: 'green' },
    prism_counsel_access: { label: 'Counsel Access', variant: 'amber' },
    carlota_private_inquiry: { label: 'Carlota Jo', variant: 'neutral' },
    stephen_contact: { label: 'Stephen', variant: 'neutral' },
  };

  const exportCsv = async () => {
    const csvParams = new URLSearchParams();
    if (showResolved) csvParams.set('includeResolved', 'true');
    if (search) csvParams.set('search', search);
    if (statusFilter && statusFilter !== 'all') csvParams.set('status', statusFilter);
    csvParams.set('format', 'csv');
    try {
      const res = await fetch(`${API}/admin/support-queue?${csvParams}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support-queue.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const rows = [['ID', 'Name', 'Email', 'Form', 'Company', 'Status', 'Message', 'Date']];
      tickets.forEach((t) => {
        rows.push([
          String(t.id),
          t.fullName,
          t.email,
          t.formKey,
          t.company ?? '',
          t.status ?? 'new',
          (t.message ?? '').replace(/\n/g, ' '),
          new Date(t.createdAt).toLocaleDateString(),
        ]);
      });
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support-queue.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-5">
      {replyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            if (!replySending) {
              setReplyModal(null);
              setReplyResult(null);
            }
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Reply to {replyModal.name}</p>
                <p className="text-xs text-muted-foreground">{replyModal.email}</p>
              </div>
              <button
                onClick={() => {
                  setReplyModal(null);
                  setReplyResult(null);
                }}
                disabled={replySending}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  value={replyModal.subject}
                  onChange={(e) =>
                    setReplyModal((m) => (m ? { ...m, subject: e.target.value } : m))
                  }
                  className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  disabled={replySending}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  rows={7}
                  value={replyModal.body}
                  onChange={(e) => setReplyModal((m) => (m ? { ...m, body: e.target.value } : m))}
                  placeholder="Write your reply…"
                  className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                  disabled={replySending}
                />
              </div>
              {replyResult && (
                <div
                  className={cn(
                    'text-xs px-3 py-2 rounded-lg',
                    replyResult.success
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20',
                  )}
                >
                  {replyResult.message}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 pb-4">
              <button
                onClick={() => {
                  setReplyModal(null);
                  setReplyResult(null);
                }}
                disabled={replySending}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={replySending || !replyModal.subject.trim() || !replyModal.body.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {replySending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" /> Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Support Queue"
        subtitle={
          showResolved
            ? `${data?.total ?? 0} total submissions`
            : `${data?.openTotal ?? 0} open · ${data?.total ?? 0} total`
        }
        onRefresh={() => refetch()}
        loading={isLoading}
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or form..."
          />
        </div>
        <button
          onClick={() => setShowResolved((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors',
            showResolved
              ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />{' '}
          {showResolved ? 'Hiding resolved' : 'Show resolved'}
        </button>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All' },
          ...TICKET_STATUSES.map((s) => ({ id: s, label: statusConfig[s].label })),
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setStatusFilter(opt.id)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              statusFilter === opt.id
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          message={search ? 'No tickets match your search.' : 'No support tickets yet.'}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {tickets.map((t) => {
            const fk = formKeyLabel[t.formKey] ?? { label: t.formKey, variant: 'neutral' as const };
            const isExpanded = expanded === t.id;
            const currentStatus = (t.status ?? 'new') as TicketStatus;
            const sc = statusConfig[currentStatus] ?? statusConfig.new;
            return (
              <div key={t.id} className="transition-colors hover:bg-muted/10">
                <button
                  onClick={() => setExpanded(isExpanded ? null : t.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {t.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.email}
                        {t.company ? ` · ${t.company}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.submissionStatus === 'resolved' && (
                      <Badge label="Resolved" variant="green" />
                    )}
                    <Badge label={sc.label} variant={sc.variant} />
                    <Badge label={fk.label} variant={fk.variant} />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 bg-muted/10 border-t border-border/30 space-y-3">
                        {t.message ? (
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                            {t.message}
                          </p>
                        ) : (
                          <p className="text-xs italic text-muted-foreground/60">
                            No message provided.
                          </p>
                        )}
                        {t.notes && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                            <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Notes</p>
                            <p className="text-xs text-foreground">{t.notes}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/60">
                          Submitted {new Date(t.createdAt).toLocaleString()}
                          {t.resolvedAt
                            ? ` · Resolved ${new Date(t.resolvedAt).toLocaleString()}`
                            : ''}
                        </p>

                        <div
                          className="flex items-center gap-2 flex-wrap pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setReplyModal({
                                ticketId: t.id,
                                email: t.email,
                                name: t.fullName,
                                subject: `Re: Your inquiry`,
                                body: '',
                              })
                            }
                            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Mail className="w-3 h-3" /> Reply
                          </button>
                          {t.submissionStatus === 'resolved' ? (
                            <button
                              onClick={() => reopenMutation.mutate({ id: t.id })}
                              disabled={reopenMutation.isPending}
                              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                            >
                              <Circle className="w-3 h-3" />{' '}
                              {reopenMutation.isPending ? 'Reopening…' : 'Reopen'}
                            </button>
                          ) : (
                            <button
                              onClick={() => resolveMutation.mutate({ id: t.id })}
                              disabled={resolveMutation.isPending}
                              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-semibold border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                            >
                              <CheckCircle2 className="w-3 h-3" />{' '}
                              {resolveMutation.isPending ? 'Resolving…' : 'Resolve'}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">
                            Update status:
                          </span>
                          {TICKET_STATUSES.filter((s) => s !== currentStatus).map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: t.id, status: s });
                              }}
                              disabled={statusMutation.isPending}
                              className={cn(
                                'text-[10px] px-2 py-1 rounded-md font-medium border transition-colors',
                                s === 'closed'
                                  ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                                  : s === 'lost'
                                    ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                              )}
                            >
                              {statusConfig[s].label}
                            </button>
                          ))}
                        </div>

                        <div
                          className="flex items-center gap-2 pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.ownerUserId ? (
                            <span className="text-[10px] text-muted-foreground">
                              Assigned to user{' '}
                              <span className="font-mono text-foreground">#{t.ownerUserId}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Unassigned</span>
                          )}
                          <span className="text-muted-foreground/40">·</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="User ID"
                              value={assignInputs[t.id] ?? ''}
                              onChange={(e) =>
                                setAssignInputs((p) => ({ ...p, [t.id]: e.target.value }))
                              }
                              className="w-20 px-2 py-0.5 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <button
                              onClick={() => {
                                const uid = parseInt(assignInputs[t.id] ?? '', 10);
                                if (!isNaN(uid) && uid > 0)
                                  assignMutation.mutate({ id: t.id, ownerUserId: uid });
                              }}
                              disabled={!assignInputs[t.id] || assignMutation.isPending}
                              className="text-[10px] px-2 py-0.5 rounded font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                            >
                              {assignMutation.isPending ? 'Saving…' : 'Assign'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[10px] font-semibold text-muted-foreground">
                            Internal Notes (reply thread)
                          </div>
                          <textarea
                            rows={3}
                            value={noteInputs[t.id] ?? t.notes ?? ''}
                            onChange={(e) =>
                              setNoteInputs((p) => ({ ...p, [t.id]: e.target.value }))
                            }
                            placeholder="Add an internal note or reply…"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                const note = noteInputs[t.id];
                                if (note !== undefined && note !== t.notes) {
                                  noteMutation.mutate({
                                    id: t.id,
                                    notes: note,
                                    status: t.status ?? 'new',
                                  });
                                }
                              }}
                              disabled={
                                noteInputs[t.id] === undefined ||
                                noteInputs[t.id] === t.notes ||
                                noteMutation.isPending
                              }
                              className="text-[10px] px-3 py-1 rounded font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                            >
                              {noteMutation.isPending ? 'Saving…' : 'Save Note'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Panel ──────────────────────────────────────────────────────────

function AuditPanel() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (action) params.set('action', action);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  if (tenantFilter) params.set('orgId', tenantFilter);
  params.set('limit', '100');

  const { data, isLoading, refetch } = useStandardQuery<{ logs: AuditEntry[]; total: number }>({
    queryKey: ['admin-audit', search, action, dateFrom, dateTo, tenantFilter],
    queryFn: () => adminFetch(`/admin/audit-log?${params}`),
  });

  const { data: tenantsData } = useStandardQuery<{ tenants: Tenant[] }>({
    queryKey: ['admin-tenants'],
    queryFn: () => adminFetch('/admin/orgs'),
  });

  const exportCsv = async () => {
    const csvParams = new URLSearchParams(params);
    csvParams.delete('limit');
    csvParams.set('format', 'csv');
    try {
      const res = await fetch(`${API}/admin/audit-log?${csvParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const rows = [['ID', 'Action', 'Actor', 'Target', 'Result', 'IP', 'Timestamp', 'Details']];
      (data?.logs ?? []).forEach((l) => {
        rows.push([
          l.id,
          l.action,
          l.actor,
          l.target,
          l.result,
          l.ipAddress ?? '',
          l.timestamp,
          l.details ?? '',
        ]);
      });
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const actionColors: Record<string, string> = {
    create: 'text-emerald-600 bg-emerald-500/10',
    update: 'text-blue-600 bg-blue-500/10',
    delete: 'text-red-600 bg-red-500/10',
    login: 'text-violet-600 bg-violet-500/10',
    export: 'text-amber-600 bg-amber-500/10',
    execute: 'text-cyan-600 bg-cyan-500/10',
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Audit Log Explorer"
        subtitle="Platform-wide audit trail"
        onRefresh={() => refetch()}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by user, action, or entity..."
          />
        </div>
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filter action..."
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none',
              tenantFilter ? 'border-primary/50 text-foreground font-medium' : 'border-border',
            )}
          >
            <option value="">All Tenants</option>
            {(tenantsData?.tenants ?? []).map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      {tenantFilter && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Building2 className="w-3.5 h-3.5" />
          <span className="font-medium">
            Showing events for:{' '}
            {tenantsData?.tenants.find((t) => String(t.id) === tenantFilter)?.name ??
              'selected tenant'}
          </span>
          <button
            onClick={() => setTenantFilter('')}
            className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.logs?.length ? (
        <EmptyState message="No audit events match your filters." />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50 overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-2">Action</span>
            <span className="col-span-3">Actor</span>
            <span className="col-span-3">Target</span>
            <span className="col-span-2">IP</span>
            <span className="col-span-2 text-right">Time</span>
          </div>
          {data.logs.map((l) => {
            const actionClass =
              actionColors[l.action.toLowerCase()] ?? 'text-muted-foreground bg-muted';
            return (
              <button
                key={l.id}
                onClick={() => setSelectedEntry(l)}
                className="w-full px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/10 transition-colors text-left"
              >
                <span
                  className={cn(
                    'col-span-2 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block uppercase tracking-wider w-fit',
                    actionClass,
                  )}
                >
                  {l.action}
                </span>
                <span className="col-span-3 text-xs text-foreground truncate font-medium">
                  {l.actor}
                </span>
                <span className="col-span-3 text-xs text-muted-foreground truncate">
                  {l.target}
                </span>
                <span className="col-span-2 text-[10px] text-muted-foreground font-mono">
                  {l.ipAddress ?? '—'}
                </span>
                <span className="col-span-2 text-[10px] text-muted-foreground text-right">
                  {new Date(l.timestamp).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Drawer
        open={selectedEntry != null}
        onClose={() => setSelectedEntry(null)}
        title="Audit Event Details"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                { label: 'Event ID', value: selectedEntry.id },
                { label: 'Action', value: selectedEntry.action },
                { label: 'Actor', value: selectedEntry.actor },
                { label: 'Target', value: selectedEntry.target },
                { label: 'Result', value: selectedEntry.result },
                { label: 'IP Address', value: selectedEntry.ipAddress ?? '—' },
                { label: 'Timestamp', value: new Date(selectedEntry.timestamp).toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-muted-foreground shrink-0">{item.label}</span>
                  <span className="font-medium text-foreground text-right break-all">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            {selectedEntry.details && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">Full Payload</h4>
                <pre className="bg-muted/50 rounded-xl p-4 text-[10px] font-mono text-foreground overflow-auto whitespace-pre-wrap break-all">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedEntry.details), null, 2);
                    } catch {
                      return selectedEntry.details;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ─── Feature Flag Overrides Editor ────────────────────────────────────────────

function FlagOverridesEditor({ flagKey, onClose }: { flagKey: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    entityType: 'role' as 'user' | 'org' | 'role',
    entityId: '',
    isEnabled: true,
  });

  const { data, isLoading } = useStandardQuery<{ overrides: FlagOverride[] }>({
    queryKey: ['admin-flag-overrides', flagKey],
    queryFn: () =>
      adminFetch<{ overrides: FlagOverride[] }>(`/admin/feature-flags/${flagKey}/overrides`),
    enabled: !!flagKey,
  });

  const addMutation = useStandardMutation({
    mutationFn: (vals: typeof form) =>
      adminFetch(`/admin/feature-flags/${flagKey}/overrides`, {
        method: 'POST',
        body: JSON.stringify(vals),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flag-overrides', flagKey] });
      setForm({ entityType: 'role', entityId: '', isEnabled: true });
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: (overrideId: number) =>
      adminFetch(`/admin/feature-flags/${flagKey}/overrides/${overrideId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flag-overrides', flagKey] }),
  });

  const overrides = data?.overrides ?? [];

  return (
    <Drawer open={!!flagKey} onClose={onClose} title={`Overrides: ${flagKey}`}>
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-3">Add Override</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                  Entity Type
                </label>
                <select
                  value={form.entityType}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'user' || v === 'org' || v === 'role')
                      setForm((p) => ({ ...p, entityType: v }));
                  }}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="role">Role</option>
                  <option value="org">Organization</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                  Enabled
                </label>
                <select
                  value={String(form.isEnabled)}
                  onChange={(e) => setForm((p) => ({ ...p, isEnabled: e.target.value === 'true' }))}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                {form.entityType === 'role'
                  ? 'Role Name (e.g. admin)'
                  : form.entityType === 'org'
                    ? 'Org ID'
                    : 'User ID'}
              </label>
              <input
                value={form.entityId}
                onChange={(e) => setForm((p) => ({ ...p, entityId: e.target.value }))}
                placeholder={
                  form.entityType === 'role' ? 'admin' : form.entityType === 'org' ? '42' : '123'
                }
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => addMutation.mutate(form)}
              disabled={!form.entityId || addMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add Override
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">
            Current Overrides ({overrides.length})
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : overrides.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No overrides configured.
            </p>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
              {overrides.map((ov) => (
                <div key={ov.id} className="flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground font-mono">
                      {ov.entityId}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{ov.entityType}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      label={ov.isEnabled ? 'on' : 'off'}
                      variant={ov.isEnabled ? 'green' : 'red'}
                    />
                    <button
                      onClick={() => deleteMutation.mutate(ov.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Feature Flags Panel ──────────────────────────────────────────────────────

function FlagsPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingRollout, setEditingRollout] = useState<string | null>(null);
  const [rolloutValue, setRolloutValue] = useState(0);
  const [overrideKey, setOverrideKey] = useState<string>('');

  const { data, isLoading, refetch } = useStandardQuery<{ flags: FeatureFlag[] }>({
    queryKey: ['admin-flags'],
    queryFn: () => adminFetch('/admin/feature-flags'),
  });

  const toggleMutation = useStandardMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminFetch(`/admin/feature-flags/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flags'] });
      setToggling(null);
    },
    onError: () => setToggling(null),
  });

  const rolloutMutation = useStandardMutation({
    mutationFn: ({ key, rolloutPercentage }: { key: string; rolloutPercentage: number }) =>
      adminFetch(`/admin/feature-flags/${key}/rollout`, {
        method: 'PUT',
        body: JSON.stringify({ rolloutPercentage }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flags'] });
      setEditingRollout(null);
    },
  });

  const flags = (data?.flags ?? []).filter(
    (f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Feature Flag Management"
        subtitle={`${data?.flags?.length ?? 0} flags`}
        onRefresh={() => refetch()}
        loading={isLoading}
      />
      <SearchInput value={search} onChange={setSearch} placeholder="Search flags..." />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : flags.length === 0 ? (
        <EmptyState message={search ? 'No flags match your search.' : 'No feature flags found.'} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {flags.map((f) => (
            <div key={f.key} className="px-4 py-3 hover:bg-muted/10 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                    {f.rolloutPercentage < 100 && f.enabled && (
                      <Badge label={`${f.rolloutPercentage}% rollout`} variant="amber" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {f.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">{f.key}</p>

                  {editingRollout === f.key && (
                    <div
                      className="flex items-center gap-2 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={rolloutValue}
                        onChange={(e) => setRolloutValue(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-mono w-8 text-center">{rolloutValue}%</span>
                      <button
                        onClick={() =>
                          rolloutMutation.mutate({ key: f.key, rolloutPercentage: rolloutValue })
                        }
                        disabled={rolloutMutation.isPending}
                        className="px-2 py-1 text-[10px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRollout(null)}
                        className="px-2 py-1 text-[10px] font-semibold bg-muted text-muted-foreground rounded-md hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setOverrideKey(f.key);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                    title="Edit overrides"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingRollout(f.key === editingRollout ? null : f.key);
                      setRolloutValue(f.rolloutPercentage);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                    title="Edit rollout %"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      f.enabled ? 'text-emerald-600' : 'text-muted-foreground',
                    )}
                  >
                    {f.enabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={() => {
                      setToggling(f.key);
                      toggleMutation.mutate({ key: f.key, enabled: !f.enabled });
                    }}
                    disabled={toggling === f.key}
                    className="relative flex-shrink-0"
                  >
                    {toggling === f.key ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : f.enabled ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FlagOverridesEditor flagKey={overrideKey} onClose={() => setOverrideKey('')} />
    </div>
  );
}

// ─── System Health Panel ──────────────────────────────────────────────────────

function HealthPanel() {
  const [categoryFilter, setCategoryFilter] = useState('All');

  const { data, isLoading, refetch } = useStandardQuery<{
    timestamp: string;
    status: string;
    checks: HealthCheck[];
    summary: { total: number; healthy: number; degraded: number; down: number };
  }>({
    queryKey: ['admin-health'],
    queryFn: () => adminFetch('/admin/system-health'),
    refetchInterval: 30000,
  });

  const categories = ['All', ...Array.from(new Set(data?.checks?.map((c) => c.category) ?? []))];
  const checks = (data?.checks ?? []).filter(
    (c) => categoryFilter === 'All' || c.category === categoryFilter,
  );

  const statusIcon = (s: string) => {
    if (s === 'healthy') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === 'degraded') return <AlertCircle className="w-4 h-4 text-amber-400" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="System Health"
        subtitle="Live service health matrix"
        onRefresh={() => refetch()}
        loading={isLoading}
      />

      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-foreground">{data.summary.total}</div>
            <div className="text-[10px] text-muted-foreground font-medium">Checks</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-600">{data.summary.healthy}</div>
            <div className="text-[10px] text-emerald-600/80 font-medium">Healthy</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-600">{data.summary.degraded}</div>
            <div className="text-[10px] text-amber-600/80 font-medium">Degraded</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-500">{data.summary.down}</div>
            <div className="text-[10px] text-red-500/80 font-medium">Down</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              categoryFilter === cat
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
          {checks.map((c, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{statusIcon(c.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <Badge label={c.category} variant="neutral" />
                  {c.latencyMs !== null && (
                    <span className="text-[10px] text-muted-foreground">{c.latencyMs}ms</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Access Denied ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You need admin privileges to access the Command Center.
        </p>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function AdminCommandCenter() {
  const [section, setSection] = useState<Section>('overview');
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarOpen, setSidebarOpen] = useState(() => !prefs.sidebar_collapsed);
  const userOverriddenRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !userOverriddenRef.current) {
      setSidebarOpen(!prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const { isAdmin, roles, isLoading: roleLoading } = useRole();
  const hasSuperAdmin = roles.includes('super_admin');
  const hasAdminAccess = isAdmin || hasSuperAdmin;

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAdminAccess) return <AccessDenied />;

  const currentNav = NAV_ITEMS.find((n) => n.id === section)!;

  const renderPanel = () => {
    switch (section) {
      case 'overview':
        return <OverviewPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'tenants':
        return <TenantsPanel />;
      case 'users':
        return <UsersPanel />;
      case 'support':
        return <SupportPanel />;
      case 'audit':
        return <AuditPanel />;
      case 'flags':
        return <FlagsPanel />;
      case 'health':
        return <HealthPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          'flex-shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200',
          sidebarOpen ? 'w-56' : 'w-14',
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
            <Terminal className="w-3.5 h-3.5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">Command Center</div>
              <div className="text-[10px] text-muted-foreground">Admin Portal</div>
            </div>
          )}
          <button
            onClick={() => {
              userOverriddenRef.current = true;
              setSidebarOpen((p) => {
                const next = !p;
                setPreference('sidebar_collapsed', !next);
                return next;
              });
            }}
            className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight
              className={cn('w-3.5 h-3.5 transition-transform', sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate text-xs">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border/50 space-y-0.5">
          {sidebarOpen && (
            <div className="px-2.5 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Platform Admin
            </div>
          )}
          <Link
            href="/admin/platform-settings"
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            title={!sidebarOpen ? 'Platform Settings' : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="truncate text-xs">Platform Settings</span>}
          </Link>
          <Link
            href="/admin/tenant-health"
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            title={!sidebarOpen ? 'Tenant Health' : undefined}
          >
            <Activity className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="truncate text-xs">Tenant Health</span>}
          </Link>
          <div className={cn('flex items-center gap-2 px-2.5 py-2 rounded-lg')}>
            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {sidebarOpen && (
              <span className="text-[10px] text-muted-foreground font-medium truncate">
                Admin Access
              </span>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50 px-6 py-3 flex items-center gap-2">
          <currentNav.icon className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">{currentNav.label}</h1>
        </div>
        <div className="p-6 max-w-5xl">
          <AnimatePresence mode="wait">
            <m.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderPanel()}
            </m.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
