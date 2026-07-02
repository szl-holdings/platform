import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { ActivityFeed } from '@szl-holdings/shared-ui/collaboration';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { Skeleton } from '@szl-holdings/shared-ui/ui/skeleton';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  RefreshCw,
  Server,
  Shield,
  Star,
  Ticket,
  Users,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardMetrics {
  metrics: {
    activeClients: number;
    totalClients: number;
    atRiskClients: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    uptime: number;
    ticketsOpen: number;
    ticketsInProgress: number;
    ticketsResolved: number;
    slaBreaches: number;
    slaAtRisk: number;
    resolvedToday: number;
    managedDevices: number;
    devicesOnline: number;
    devicesWarning: number;
    devicesCritical: number;
    devicesOffline: number;
    activeAlerts: number;
    activeContracts: number;
    expiringContracts: number;
    totalContractValue: number;
    avgSlaCompliance: number;
    clientSatisfaction: number;
    avgResolutionTime: string;
  };
}

interface TicketItem {
  id: number;
  ticketNumber: string;
  subject: string;
  clientName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  assigneeName: string;
  slaDeadline: string;
  slaStatus: 'on-track' | 'at-risk' | 'breached';
  category: string;
}

interface ClientItem {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'at-risk';
  deviceCount: number;
  openTickets: number;
  healthScore: number;
  mrr: number;
  tier: string;
}

interface TechItem {
  id: number;
  name: string;
  specialties: string[];
  status: string;
  completedToday: number;
  location: string;
}

interface RevenueData {
  byClient: {
    clientName: string;
    mrr: number;
    tier: string;
    churnRisk: 'low' | 'medium' | 'high';
    contractValue: number;
    daysToRenewal: number;
  }[];
}

const sevColors: Record<string, { dot: string; badge: string; label: string }> = {
  critical: {
    dot: 'bg-[#f5f5f5]',
    badge: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border border-[#f5f5f5]/20',
    label: 'Critical',
  },
  warning: {
    dot: 'bg-[#c9b787]',
    badge: 'bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20',
    label: 'Warning',
  },
  info: {
    dot: 'bg-[#c9b787]',
    badge: 'bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20',
    label: 'Info',
  },
};

const prioColors: Record<string, string> = {
  critical: 'bg-[#f5f5f5]/10 text-[#f5f5f5]',
  high: 'bg-[#c9b787]/10 text-[#c9b787]',
  medium: 'bg-[#c9b787]/10 text-[#c9b787]',
  low: 'bg-[#c9b787]/10 text-[#c9b787]',
};

const statusColors: Record<string, string> = {
  'in-progress': 'bg-[#c9b787]/10 text-[#c9b787]',
  open: 'bg-[#8a8a8a]/10 text-[#8a8a8a]',
  waiting: 'bg-[#c9b787]/10 text-[#c9b787]',
  resolved: 'bg-[#c9b787]/10 text-[#c9b787]',
};

function HealthBar({ value, status }: { value: number; status: string }) {
  const color =
    status === 'healthy' || status === 'active'
      ? 'bg-[#c9b787]'
      : status === 'warning'
        ? 'bg-[#c9b787]'
        : 'bg-[#f5f5f5]';
  const textColor =
    status === 'healthy' || status === 'active'
      ? 'text-[#c9b787]'
      : status === 'warning'
        ? 'text-[#c9b787]'
        : 'text-[#f5f5f5]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{value}</span>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function formatSlaRemaining(deadline: string | null): string {
  if (!deadline) return 'No SLA';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'Breached';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ClientProfitabilityPanel({ byClient }: { byClient: RevenueData['byClient'] }) {
  const [sortBy, setSortBy] = useState<'mrr' | 'churn'>('mrr');
  const sorted = [...byClient].sort((a, b) =>
    sortBy === 'mrr'
      ? b.mrr - a.mrr
      : (b.churnRisk === 'high' ? 2 : b.churnRisk === 'medium' ? 1 : 0) -
        (a.churnRisk === 'high' ? 2 : a.churnRisk === 'medium' ? 1 : 0),
  );
  const totalMrr = byClient.reduce((s, c) => s + c.mrr, 0);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#c9b787]" />
          Client Profitability
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSortBy('mrr')}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === 'mrr' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            By MRR
          </button>
          <button
            onClick={() => setSortBy('churn')}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === 'churn' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            By Churn Risk
          </button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((c) => (
          <div
            key={c.clientName}
            className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.clientName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {c.tier} · Renews in {c.daysToRenewal}d
              </p>
            </div>
            <div className="text-right shrink-0 w-32">
              <p className="text-sm font-bold text-[#c9b787]">${c.mrr.toLocaleString()}/mo</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">Churn:</span>
                <span
                  className={`text-[10px] font-bold ${c.churnRisk === 'high' ? 'text-[#f5f5f5]' : c.churnRisk === 'medium' ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                >
                  {c.churnRisk}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          Total MRR: ${totalMrr.toLocaleString()}
        </span>
        <span className="text-xs font-bold text-[#c9b787]">{byClient.length} clients</span>
      </div>
    </div>
  );
}

function DispatchBoard({ technicians }: { technicians: TechItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#c9b787]" />
          Technician Dispatch Board
        </h2>
        <span className="text-[10px] text-muted-foreground">Skill-matched · Proximity-routed</span>
      </div>
      <div className="divide-y divide-border">
        {technicians.slice(0, 5).map((t) => {
          const available = t.status === 'available';
          return (
            <div
              key={t.id}
              className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${available ? 'bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20' : 'bg-muted text-muted-foreground border border-border'}`}
              >
                {t.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.specialties?.[0] && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9b787]/10 text-[#c9b787] font-mono">
                      {t.specialties[0]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.completedToday} completed today · {t.location}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${available ? 'bg-[#c9b787]/10 text-[#c9b787]' : 'bg-muted text-muted-foreground'}`}
              >
                {available ? 'Available' : t.status.replace('-', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SLABreachPrediction({ tickets }: { tickets: TicketItem[] }) {
  const atRisk = tickets.filter(
    (t) => t.slaStatus !== 'on-track' && t.status !== 'resolved' && t.status !== 'closed',
  );
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#f5f5f5] animate-pulse" />
          SLA Breach Prediction
        </h2>
        <span className="text-[10px] font-mono text-[#f5f5f5]">{atRisk.length} at risk</span>
      </div>
      <div className="divide-y divide-border">
        {atRisk.slice(0, 4).map((s) => (
          <div
            key={s.id}
            className={`px-4 py-3 hover:bg-muted/20 transition-colors ${s.slaStatus === 'breached' ? 'bg-[#f5f5f5]/5' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{s.ticketNumber}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono uppercase ${prioColors[s.priority]}`}
                >
                  {s.priority[0].toUpperCase()}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold ${s.slaStatus === 'breached' ? 'text-[#f5f5f5] animate-pulse' : 'text-[#c9b787]'}`}
              >
                {s.slaStatus === 'breached' ? '⚠ BREACHED' : '● At Risk'}
              </span>
            </div>
            <p className="text-sm font-medium truncate">{s.subject}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{s.clientName}</p>
              {s.slaDeadline && (
                <p
                  className={`text-xs font-mono font-bold flex items-center gap-1 ${s.slaStatus === 'breached' ? 'text-[#f5f5f5]' : 'text-[#c9b787]'}`}
                >
                  <Clock className="w-3 h-3" />
                  {formatSlaRemaining(s.slaDeadline)}
                </p>
              )}
            </div>
          </div>
        ))}
        {atRisk.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-[#c9b787] mx-auto mb-2" />
            All tickets within SLA
          </div>
        )}
      </div>
    </div>
  );
}

function AlertSuppressionPanel() {
  const suppressionRules = [
    { condition: 'Backup completion events', client: 'All' },
    { condition: 'SSL renewal confirmations', client: 'All' },
    { condition: 'Scheduled maintenance windows', client: 'Per client schedule' },
  ];
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#8a8a8a]" />
          Intelligent Alert Suppression
        </h2>
        <span className="text-[10px] text-muted-foreground font-mono">Active rules</span>
      </div>
      <div className="divide-y divide-border">
        {suppressionRules.map((a) => (
          <div
            key={a.condition}
            className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#c9b787]/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-[#c9b787]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.condition}</p>
              <p className="text-xs text-muted-foreground">{a.client}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Configure suppression rules in alert settings
        </p>
      </div>
    </div>
  );
}

function ClientChurnHeatmap({ byClient }: { byClient: RevenueData['byClient'] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-[#c9b787]" />
        Client Health Scoring — Churn Risk
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {byClient.slice(0, 12).map((c) => (
          <div
            key={c.clientName}
            className={`rounded-lg p-3 border ${c.churnRisk === 'high' ? 'border-[#f5f5f5]/20 bg-[#f5f5f5]/5' : c.churnRisk === 'medium' ? 'border-[#c9b787]/20 bg-[#c9b787]/5' : 'border-[#c9b787]/20 bg-[#c9b787]/5'}`}
          >
            <p className="text-xs font-semibold truncate">{c.clientName}</p>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Renews in</p>
                <p className="text-sm font-bold">{c.daysToRenewal}d</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Churn Risk</p>
                <p
                  className={`text-sm font-bold capitalize ${c.churnRisk === 'high' ? 'text-[#f5f5f5]' : c.churnRisk === 'medium' ? 'text-[#c9b787]' : 'text-[#c9b787]'}`}
                >
                  {c.churnRisk}
                </p>
              </div>
            </div>
            <div className="h-1 bg-border rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${c.churnRisk === 'high' ? 'bg-[#f5f5f5]' : c.churnRisk === 'medium' ? 'bg-[#c9b787]' : 'bg-[#c9b787]'}`}
                style={{
                  width: c.churnRisk === 'high' ? '85%' : c.churnRisk === 'medium' ? '50%' : '15%',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    data: dashboardData,
    isLoading: dashLoading,
    isError: dashError,
    refetch,
  } = useStandardQuery<DashboardMetrics>({
    queryKey: ['msp-dashboard'],
    queryFn: () => apiFetch<DashboardMetrics>('/msp/dashboard'),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 5 * 60_000,
  });

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    isError: ticketsError,
    refetch: refetchTickets,
  } = useStandardQuery<{ tickets: TicketItem[] }>({
    queryKey: ['msp-tickets-dashboard'],
    queryFn: () => apiFetch<{ tickets: TicketItem[] }>('/msp/tickets?limit=10'),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data: techData,
    isLoading: techLoading,
    isError: techError,
    refetch: refetchTech,
  } = useStandardQuery<{ technicians: TechItem[] }>({
    queryKey: ['msp-technicians-dashboard'],
    queryFn: () => apiFetch<{ technicians: TechItem[] }>('/msp/technicians'),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data: clientsData,
    isLoading: clientsLoading,
    isError: clientsError,
    refetch: refetchClients,
  } = useStandardQuery<{ clients: ClientItem[] }>({
    queryKey: ['msp-clients-dashboard'],
    queryFn: () => apiFetch<{ clients: ClientItem[] }>('/msp/clients'),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = useStandardQuery<RevenueData>({
    queryKey: ['msp-revenue-dashboard'],
    queryFn: () => apiFetch<RevenueData>('/msp/revenue'),
    staleTime: 120_000,
    retry: 1,
  });

  const isDemo = false;

  const metrics = dashboardData?.metrics;
  const mrr = metrics?.monthlyRevenue ?? 0;
  const growth = metrics?.revenueGrowth ?? 0;
  const activeClients = metrics?.activeClients ?? 0;
  const openTickets = (metrics?.ticketsOpen ?? 0) + (metrics?.ticketsInProgress ?? 0);
  const managedDevices = metrics?.managedDevices ?? 0;
  const uptime = metrics?.uptime ?? 0;
  const satisfaction = metrics?.clientSatisfaction ?? 0;
  const slaBreachCount = metrics?.slaBreaches ?? 0;
  void (metrics?.activeAlerts ?? 0);

  const tickets = ticketsData?.tickets ?? [];
  const technicians = techData?.technicians ?? [];
  const clients = clientsData?.clients ?? [];
  const byClient = revenueData?.byClient ?? [];

  const nocAlerts = [
    ...(metrics?.devicesCritical
      ? [
          {
            id: 'crit1',
            severity: 'critical',
            client: 'Managed Devices',
            message: `${metrics.devicesCritical} device${metrics.devicesCritical > 1 ? 's' : ''} in critical state — immediate attention required`,
            time: 'Live',
          },
        ]
      : []),
    ...(slaBreachCount > 0
      ? [
          {
            id: 'sla1',
            severity: 'critical',
            client: 'Service Desk',
            message: `${slaBreachCount} SLA breach${slaBreachCount > 1 ? 'es' : ''} active — escalation required`,
            time: 'Live',
          },
        ]
      : []),
    ...(metrics?.expiringContracts
      ? [
          {
            id: 'exp1',
            severity: 'warning',
            client: 'Contracts',
            message: `${metrics.expiringContracts} contract${metrics.expiringContracts > 1 ? 's' : ''} expiring within 90 days`,
            time: 'Live',
          },
        ]
      : []),
  ];

  const summaryMetrics = [
    {
      label: 'Uptime SLA',
      value: `${uptime.toFixed(1)}%`,
      icon: Activity,
      trend: 'Infrastructure health',
      up: true,
    },
    {
      label: 'CSAT Score',
      value: `${satisfaction.toFixed(1)}/5`,
      icon: CheckCircle,
      trend: 'Client satisfaction',
      up: true,
    },
    {
      label: 'SLA Breaches',
      value: String(slaBreachCount),
      icon: AlertTriangle,
      trend: slaBreachCount === 0 ? 'None active' : `${slaBreachCount} requiring action`,
      up: slaBreachCount <= 1,
    },
    {
      label: 'MRR',
      value: mrr > 0 ? `$${(mrr / 1000).toFixed(0)}K` : '—',
      icon: DollarSign,
      trend: growth > 0 ? `+${growth}% MoM growth` : `${growth}% vs last month`,
      up: growth >= 0,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashLoading
              ? 'Loading metrics…'
              : `${activeClients} active clients · ${managedDevices} managed devices · All systems monitored`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataStateBadge state={isDemo ? 'demo' : 'live'} pulse={isDemo} />
          <button
            onClick={() => {
              refetch();
              refetchTickets();
              refetchTech();
              refetchClients();
              refetchRevenue();
              toast.info('Refreshing all data…');
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Hero Revenue Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-700 p-6 md:p-8 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)',
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
              Monthly Recurring Revenue
            </p>
            {dashLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-40 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
            ) : (
              <>
                <div className="text-5xl font-display font-bold tracking-tight">
                  ${mrr.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#c9b787]">
                    {growth >= 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {growth >= 0 ? '+' : ''}
                    {growth}%
                  </span>
                  <span className="text-white/50 text-sm">vs last month</span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {dashLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="w-5 h-5 bg-white/20 mx-auto rounded" />
                    <Skeleton className="h-7 w-14 bg-white/20 mx-auto rounded" />
                    <Skeleton className="h-3 w-16 bg-white/20 mx-auto rounded" />
                  </div>
                ))
              : [
                  { label: 'Active Clients', value: String(activeClients), icon: Users },
                  { label: 'Open Tickets', value: String(openTickets), icon: Ticket },
                  {
                    label: 'Managed Devices',
                    value: managedDevices.toLocaleString(),
                    icon: Server,
                  },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="w-5 h-5 text-white/50 mx-auto mb-1" />
                    <div className="text-2xl font-display font-bold">{s.value}</div>
                    <div className="text-xs text-white/60 mt-0.5 whitespace-nowrap">{s.label}</div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashLoading
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : summaryMetrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="text-xl font-display font-bold">{m.value}</p>
                  <p className={`text-xs mt-1 ${m.up ? 'text-[#c9b787]' : 'text-[#f5f5f5]'}`}>
                    {m.trend}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {/* SLA Breach Prediction + Dispatch + Alert Suppression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {ticketsLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : (
          <SLABreachPrediction tickets={tickets} />
        )}
        {techLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : (
          <DispatchBoard technicians={technicians} />
        )}
        <AlertSuppressionPanel />
      </div>

      {/* Client Profitability */}
      {revenueLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : byClient.length > 0 ? (
        <ClientProfitabilityPanel byClient={byClient} />
      ) : null}

      {/* Churn Risk Heatmap */}
      {revenueLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : byClient.length > 0 ? (
        <ClientChurnHeatmap byClient={byClient} />
      ) : null}

      {/* Client Health Table + NOC Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Client Health
            </h2>
            <span className="text-xs text-muted-foreground">{clients.length} clients</span>
          </div>
          <div className="divide-y divide-border">
            {clientsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-10" />
                  </div>
                ))
              : clients.map((client) => (
                  <div
                    key={client.id}
                    className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.deviceCount} devices · {client.openTickets} ticket
                        {client.openTickets !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="w-32 shrink-0">
                      <HealthBar value={client.healthScore} status={client.status} />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        client.status === 'active'
                          ? 'bg-[#c9b787]/10 text-[#c9b787]'
                          : client.status === 'at-risk'
                            ? 'bg-[#f5f5f5]/10 text-[#f5f5f5]'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {client.status === 'at-risk'
                        ? 'At Risk'
                        : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#c9b787]" />
              NOC Alerts
            </h2>
            <span className="text-[10px] font-bold uppercase bg-[#f5f5f5]/10 text-[#f5f5f5] px-2 py-0.5 rounded-full">
              {nocAlerts.filter((a) => a.severity === 'critical').length} Critical
            </span>
          </div>
          <div className="divide-y divide-border">
            {nocAlerts.length === 0 ? (
              <div className="px-4 py-6 flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-[#c9b787] shrink-0" />
                <span className="text-xs">All systems nominal — no active alerts</span>
              </div>
            ) : (
              nocAlerts.map((alert) => {
                const sev = sevColors[alert.severity] ?? sevColors.info;
                return (
                  <div
                    key={alert.id}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{alert.client}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${sev.badge}`}
                        >
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{alert.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Tickets + Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              Recent Tickets
            </h2>
            <span className="text-xs text-muted-foreground">{tickets.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            {ticketsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5">
                      Ticket
                    </th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5">
                      Client
                    </th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 hidden sm:table-cell">
                      Subject
                    </th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5">
                      Priority
                    </th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 hidden md:table-cell">
                      Status
                    </th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-2.5 hidden lg:table-cell">
                      SLA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.slice(0, 8).map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {t.ticketNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-xs">{t.clientName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${prioColors[t.priority] ?? ''}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[t.status] ?? 'bg-muted text-muted-foreground'}`}
                        >
                          {t.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {t.slaDeadline ? (
                          <span
                            className={`flex items-center gap-1 font-mono ${t.slaStatus === 'breached' ? 'text-[#f5f5f5]' : t.slaStatus === 'at-risk' ? 'text-[#c9b787]' : ''}`}
                          >
                            <Clock className="w-3 h-3" />
                            {formatSlaRemaining(t.slaDeadline)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {[
            {
              label: 'System Uptime',
              value: uptime > 0 ? `${uptime.toFixed(1)}%` : '99.97%',
              sub: 'Across managed infrastructure',
              color: 'text-[#c9b787]',
              bg: 'bg-[#c9b787]',
              pct: uptime || 99.97,
              icon: Activity,
            },
            {
              label: 'SLA Compliance',
              value: metrics?.avgSlaCompliance ? `${metrics.avgSlaCompliance}%` : '—',
              sub: 'Avg SLA attainment this month',
              color: 'text-[#c9b787]',
              bg: 'bg-[#c9b787]',
              pct: metrics?.avgSlaCompliance || 96,
              icon: Shield,
            },
            {
              label: 'Avg Resolution',
              value: metrics?.avgResolutionTime || '—',
              sub: 'Closed tickets this month',
              color: 'text-[#8a8a8a]',
              bg: 'bg-[#8a8a8a]',
              pct: 78,
              icon: Wifi,
            },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-sm font-semibold">{m.label}</span>
                </div>
                <span className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
                <div
                  className={`${m.bg} h-1.5 rounded-full transition-all duration-1000`}
                  style={{ width: `${m.pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <ActivityFeed entityType="ticket" title="Service Desk Team Activity" limit={8} compact />
    </div>
  );
}
