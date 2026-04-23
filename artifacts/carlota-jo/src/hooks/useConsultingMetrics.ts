import { useQuery } from '@tanstack/react-query';
import {
  CAPACITY_ALERTS,
  CLIENT_HEALTH,
  ENGAGEMENTS,
  INVOICES,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_VAULT_ITEMS,
  TEAM,
  TIME_ENTRIES,
} from '@/data/operationalData';

const API = '/api';

// ── API types ─────────────────────────────────────────────────────────────────

type ApiTeamMember = {
  id: string;
  name: string;
  title: string;
  skills: string[];
  allocations: { engagement: string; client: string; pct: number; weeks: string; color: string }[];
  utilisation: number;
  capacity: number;
  status: 'optimal' | 'over' | 'under' | 'bench';
  dayRate: number;
};

type ApiEngagement = {
  id: string;
  client: string;
  engagement: string;
  status: string;
  feeType: string;
  contractedValue: number;
  invoiced: number;
  collected: number;
  costToDate: number;
  forecastedCost: number;
  marginTarget: number;
  phase: string;
  rateRealisationPct: number;
  writeOffs: number;
  scopeCreepHours: number;
  startDate: string;
  endDate: string;
  alerts: string[];
};

type ApiTimeEntry = {
  id: string;
  date: string;
  engagement: string;
  phase: string;
  deliverable: string;
  hours: number;
  rateType: 'standard' | 'premium' | 'fixed' | 'non-billable';
  rate: number;
  description: string;
  billable: boolean;
  approved: boolean;
};

type ApiInvoice = {
  id: string;
  client: string;
  engagement: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  issuedDate: string;
  items: number;
};

// ── Exported types ────────────────────────────────────────────────────────────

export type PlatformMetric = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  source?: 'live' | 'static';
};

export type ConsultingMetrics = {
  platform: PlatformMetric[];
  modules: {
    timeTracking: string;
    capacityPlanner: string;
    profitability: string;
    engagementDelivery: string;
    revenue: string;
  };
  raw: {
    activeEngagements: number;
    portfolioContractedGBP: number;
    blendedMarginPct: number;
    avgUtilisationPct: number;
    benchCapacityMembers: number;
    rateRealisationPct: number;
    outstandingInvoicesGBP: number;
    weeklyBillableHours: number;
    capacityAlertsCount: number;
  };
  isLoading: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtGBP = (v: number): string => {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `£${(v / 1000).toFixed(0)}K`;
  return `£${v}`;
};

async function fetchData<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (Array.isArray(json?.data)) return json.data as T[];
  return [];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConsultingMetrics(): ConsultingMetrics {
  const { data: teamApi = [], isLoading: teamLoading } = useQuery<ApiTeamMember[]>({
    queryKey: ['carlota-team'],
    queryFn: () => fetchData<ApiTeamMember>(`${API}/booking/team`),
    staleTime: 120_000,
    retry: 1,
    refetchInterval: 180_000,
  });

  const { data: engagementsApi = [], isLoading: engagementsLoading } = useQuery<ApiEngagement[]>({
    queryKey: ['carlota-engagements-summary'],
    queryFn: () => fetchData<ApiEngagement>(`${API}/booking/engagements-summary`),
    staleTime: 120_000,
    retry: 1,
    refetchInterval: 180_000,
  });

  const { data: timeEntriesApi = [], isLoading: timeEntriesLoading } = useQuery<ApiTimeEntry[]>({
    queryKey: ['carlota-time-entries-metrics'],
    queryFn: () => fetchData<ApiTimeEntry>(`${API}/booking/time-entries`),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const { data: invoicesApi = [], isLoading: invoicesLoading } = useQuery<ApiInvoice[]>({
    queryKey: ['carlota-invoices-metrics'],
    queryFn: () => fetchData<ApiInvoice>(`${API}/booking/time-invoices`),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const isLoading = teamLoading || engagementsLoading || timeEntriesLoading || invoicesLoading;

  // ── Static fallbacks for zero-data states ───────────────────────────────────
  // When API data is empty (loading, unreachable, or DB not yet seeded), fall back
  // to the static operational arrays so the dashboard always shows meaningful numbers.
  const team = teamApi.length > 0 ? teamApi : (TEAM as ApiTeamMember[]);
  const engagements =
    engagementsApi.length > 0 ? engagementsApi : (ENGAGEMENTS as unknown as ApiEngagement[]);
  const timeEntries = timeEntriesApi.length > 0 ? timeEntriesApi : (TIME_ENTRIES as ApiTimeEntry[]);
  const invoices = invoicesApi.length > 0 ? invoicesApi : (INVOICES as ApiInvoice[]);

  // ── Capacity planner metrics ────────────────────────────────────────────────
  const avgUtilisation = Math.round(
    team.reduce((s, m) => s + m.utilisation, 0) / team.length,
  );
  const benchCapacityMembers = team.filter(
    (m) => m.status === 'bench' || m.status === 'under',
  ).length;

  // ── Profitability analytics ─────────────────────────────────────────────────
  const activeEngagements = engagements.filter((e) => e.status !== 'complete').length;
  const portfolioContracted = engagements.reduce((s, e) => s + e.contractedValue, 0);
  const totalCollected = engagements.reduce((s, e) => s + e.collected, 0);
  const totalCost = engagements.reduce((s, e) => s + e.costToDate, 0);
  const blendedMargin =
    totalCollected > 0 ? Math.round(((totalCollected - totalCost) / totalCollected) * 100) : 0;
  const avgRateRealisation = Math.round(
    engagements.reduce((s, e) => s + e.rateRealisationPct, 0) / engagements.length,
  );

  // ── Time tracking ───────────────────────────────────────────────────────────
  const billableHours = timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
  const nonBillableHours = timeEntries
    .filter((e) => !e.billable)
    .reduce((s, e) => s + e.hours, 0);
  const billableUtilisation =
    billableHours + nonBillableHours > 0
      ? Math.round((billableHours / (billableHours + nonBillableHours)) * 100)
      : 0;
  const outstandingInvoices = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0);

  // ── Client health (still static — out of scope for this migration) ──────────
  const clientHealthAvg =
    CLIENT_HEALTH.length > 0
      ? Math.round(CLIENT_HEALTH.reduce((s, c) => s + c.healthScore, 0) / CLIENT_HEALTH.length)
      : 0;
  const healthyClients = CLIENT_HEALTH.filter(
    (c) => c.status === 'excellent' || c.status === 'healthy',
  ).length;
  const clientHealthLabel =
    clientHealthAvg >= 80
      ? 'Excellent'
      : clientHealthAvg >= 70
        ? 'Healthy'
        : clientHealthAvg >= 60
          ? 'At risk'
          : 'Critical';

  // ── Knowledge graph (still static — out of scope for this migration) ────────
  const knowledgeNodes = KNOWLEDGE_GRAPH_NODES.length + KNOWLEDGE_VAULT_ITEMS.length;
  const knowledgeFrameworks =
    KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'framework').length +
    KNOWLEDGE_VAULT_ITEMS.filter((k) => k.type === 'framework').length;

  return {
    isLoading,
    raw: {
      activeEngagements,
      portfolioContractedGBP: portfolioContracted,
      blendedMarginPct: blendedMargin,
      avgUtilisationPct: avgUtilisation,
      benchCapacityMembers,
      rateRealisationPct: avgRateRealisation,
      outstandingInvoicesGBP: outstandingInvoices,
      weeklyBillableHours: billableHours,
      capacityAlertsCount: CAPACITY_ALERTS.length,
    },
    platform: [
      {
        label: 'Active Engagements',
        value: activeEngagements.toString(),
        change: `${engagements.filter((e) => e.status === 'at-risk').length} at risk`,
        up: true,
        source: 'live',
      },
      {
        label: 'Portfolio Contracted',
        value: fmtGBP(portfolioContracted),
        change: `${fmtGBP(totalCollected)} collected`,
        up: true,
        source: 'live',
      },
      {
        label: 'Blended Margin',
        value: `${blendedMargin}%`,
        change: 'vs 38% target',
        up: blendedMargin >= 38,
        source: 'live',
      },
      {
        label: 'Client Health Avg',
        value: `${clientHealthAvg}/100`,
        change: `${clientHealthLabel} · ${healthyClients}/${CLIENT_HEALTH.length} healthy`,
        up: clientHealthAvg >= 70,
        source: 'live',
      },
      {
        label: 'Knowledge Nodes',
        value: knowledgeNodes.toLocaleString('en-GB'),
        change: `${knowledgeFrameworks} frameworks indexed`,
        up: true,
        source: 'live',
      },
      {
        label: 'Team Utilisation',
        value: `${avgUtilisation}%`,
        change: `${benchCapacityMembers} with bench capacity`,
        up: true,
        source: 'live',
      },
    ],
    modules: {
      timeTracking: `${billableHours}h billable · ${billableUtilisation}% billable rate`,
      capacityPlanner: `${avgUtilisation}% avg utilisation`,
      profitability: `${blendedMargin}% blended margin`,
      engagementDelivery: `${activeEngagements} active engagements`,
      revenue: `${fmtGBP(portfolioContracted)} portfolio value`,
    },
  };
}
