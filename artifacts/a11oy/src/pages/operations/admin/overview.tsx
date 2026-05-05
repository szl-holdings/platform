import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { BillingHealthCard } from '../../../components/operations/BillingHealthCard';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Database,
  HardDrive,
  Layers,
  RefreshCw,
  Server,
  Users,
  Zap,
} from 'lucide-react';

interface AdminOverview {
  timestamp: string;
  system: {
    uptime: number;
    nodeVersion: string;
    memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
    platform: string;
  };
  database: { status: string; latency: number; connections: number; maxConnections: number };
  storage: { status: string; usedBytes: number; totalBytes: number };
  counts: {
    apps: number;
    activeApps: number;
    connectors: number;
    liveConnectors: number;
    users: number;
    activeUsers: number;
  };
  apps: { slug: string; title: string; status: string; kind: string }[];
}

function formatUptime(s: number) {
  const d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function formatBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(1)} GB`;
}

interface OrgOnboardingStatus {
  orgId: number;
  orgName: string;
  orgSlug: string;
  orgStatus: string;
  createdAt: string;
  onboardingStatus: 'completed' | 'in_progress' | 'not_started';
  completedAt: string | null;
  currentStep: string;
  completedSteps: string[];
  stepsTotal: number;
  stepsCompleted: number;
}
interface OnboardingStatusResponse {
  timestamp: string;
  summary: { total: number; completed: number; inProgress: number; notStarted: number };
  orgs: OrgOnboardingStatus[];
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'healthy' || status === 'active'
      ? 'bg-[#6b8f71]'
      : status === 'demo'
        ? 'bg-[#d4a054]'
        : 'bg-[#c45a4a]';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function AdminOverview() {
  const { data, isLoading, error } = useStandardQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => apiFetch('/admin/overview'),
    refetchInterval: 30000,
  });

  const onboardingQuery = useStandardQuery<OnboardingStatusResponse>({
    queryKey: ['admin-onboarding-status'],
    queryFn: () => apiFetch('/admin/orgs/onboarding-status'),
    refetchInterval: 60000,
  });

  const resetOnboarding = useStandardMutation({
    mutationFn: (orgId: number) =>
      apiFetch(`/admin/orgs/${orgId}/reset-onboarding`, { method: 'POST' }),
    onSuccess: (_result, orgId) => {
      toast.success(`Onboarding reset for org #${orgId}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to reset onboarding';
      toast.error(message);
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (error || !data)
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          Administration Overview
        </h1>
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Admin API unavailable — connect to the API server to view live data</p>
        </div>
      </div>
    );

  const mem = data.system.memoryUsage;
  const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  const storagePct = Math.round((data.storage.usedBytes / data.storage.totalBytes) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" /> Administration Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Runtime health, heap utilization, database connectivity, and app registry status
          </p>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <BillingHealthCard />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Layers,
            label: 'Apps',
            value: `${data.counts.activeApps}/${data.counts.apps}`,
            sub: 'active',
            color: 'text-primary',
          },
          {
            icon: Zap,
            label: 'Connectors',
            value: `${data.counts.liveConnectors}/${data.counts.connectors}`,
            sub: 'live',
            color: 'text-[#6b8f71]',
          },
          {
            icon: Users,
            label: 'Users',
            value: `${data.counts.activeUsers}/${data.counts.users}`,
            sub: 'active',
            color: 'text-[#4a90b8]',
          },
          {
            icon: Activity,
            label: 'Uptime',
            value: formatUptime(data.system.uptime),
            sub: data.system.platform,
            color: 'text-cyan-400',
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Database
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1.5">
                <StatusDot status={data.database.status} />
                {data.database.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency</span>
              <span>{data.database.latency}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span>
                {data.database.connections}/{data.database.maxConnections}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary" />
            Storage
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{formatBytes(data.storage.usedBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>{formatBytes(data.storage.totalBytes)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full mt-2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Memory
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heap Used</span>
              <span>{formatBytes(mem.heapUsed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heap Total</span>
              <span>{formatBytes(mem.heapTotal)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full mt-2">
              <div
                className={`h-full rounded-full ${heapPct > 80 ? 'bg-[#c45a4a]' : heapPct > 60 ? 'bg-[#d4a054]' : 'bg-[#6b8f71]'}`}
                style={{ width: `${heapPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Registered Applications ({data.apps.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {data.apps.map((app) => (
            <div key={app.slug} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={app.status} />
                <span className="text-sm font-medium">{app.title}</span>
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase">
                  {app.kind}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{app.slug}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Organization Onboarding Status
            {onboardingQuery.data && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({onboardingQuery.data.summary.completed}/{onboardingQuery.data.summary.total} completed)
              </span>
            )}
          </h3>
          {onboardingQuery.data && (
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-[#6b8f71]">
                <CheckCircle2 className="w-3 h-3" />
                {onboardingQuery.data.summary.completed} done
              </span>
              <span className="flex items-center gap-1 text-[#d4a054]">
                <Circle className="w-3 h-3" />
                {onboardingQuery.data.summary.inProgress} in progress
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Circle className="w-3 h-3" />
                {onboardingQuery.data.summary.notStarted} not started
              </span>
            </div>
          )}
        </div>
        {onboardingQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : onboardingQuery.isError || !onboardingQuery.data ? (
          <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />
            Unable to load onboarding status.
          </div>
        ) : onboardingQuery.data.orgs.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center py-6">
            No organizations found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {onboardingQuery.data.orgs.map((org) => {
              const statusColor =
                org.onboardingStatus === 'completed'
                  ? '#6b8f71'
                  : org.onboardingStatus === 'in_progress'
                    ? '#d4a054'
                    : 'rgba(255,255,255,0.3)';
              const pct = org.stepsTotal > 0 ? Math.round((org.stepsCompleted / org.stepsTotal) * 100) : 0;
              return (
                <div key={org.orgId} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: statusColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{org.orgName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{org.orgSlug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {org.onboardingStatus === 'not_started'
                          ? 'Not started'
                          : org.onboardingStatus === 'in_progress'
                            ? `Step: ${org.currentStep}`
                            : 'Completed'}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: statusColor }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {org.stepsCompleted}/{org.stepsTotal}
                        </span>
                      </div>
                    </div>
                    {org.onboardingStatus !== 'not_started' && (
                      <button
                        onClick={() => resetOnboarding.mutate(org.orgId)}
                        disabled={resetOnboarding.isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Reset onboarding wizard — org can restart from step 1"
                        data-testid={`button-reset-onboarding-${org.orgId}`}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
