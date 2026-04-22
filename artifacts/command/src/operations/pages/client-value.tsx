import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type HealthStatus = 'healthy' | 'at_risk' | 'critical';
type Tier = 'enterprise' | 'growth' | 'starter';

interface Client {
  id: string;
  name: string;
  tier: Tier;
  health: HealthStatus;
  healthScore: number;
  mrr: number;
  costToServe: number;
  margin: number;
  incidentsThisMonth: number;
  slaBreaches: number;
  uptimePct: number;
  openTickets: number;
  npsScore: number | null;
  trend: 'up' | 'down' | 'flat';
  riskFlags: string[];
  services: string[];
}

const TIER_COLOR: Record<Tier, string> = {
  enterprise: GOLD,
  growth: '#3b82f6',
  starter: '#6b7280',
};

const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy: '#10b981',
  at_risk: '#f59e0b',
  critical: '#ef4444',
};

const CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Northgate Corporation',
    tier: 'enterprise',
    health: 'at_risk',
    healthScore: 68,
    mrr: 42000,
    costToServe: 8200,
    margin: 80.5,
    incidentsThisMonth: 8,
    slaBreaches: 2,
    uptimePct: 99.1,
    openTickets: 6,
    npsScore: 42,
    trend: 'down',
    riskFlags: ['SLA breach × 2 this month', 'Latency complaints in support tickets'],
    services: ['api-gateway', 'ml-inference', 'auth-service'],
  },
  {
    id: 'c2',
    name: 'Meridian Fund Partners',
    tier: 'enterprise',
    health: 'healthy',
    healthScore: 94,
    mrr: 38500,
    costToServe: 6100,
    margin: 84.2,
    incidentsThisMonth: 1,
    slaBreaches: 0,
    uptimePct: 99.98,
    openTickets: 1,
    npsScore: 71,
    trend: 'up',
    riskFlags: [],
    services: ['api-gateway', 'data-pipeline'],
  },
  {
    id: 'c3',
    name: 'Pacific Logistics Group',
    tier: 'enterprise',
    health: 'critical',
    healthScore: 41,
    mrr: 29800,
    costToServe: 11400,
    margin: 61.7,
    incidentsThisMonth: 14,
    slaBreaches: 5,
    uptimePct: 97.4,
    openTickets: 12,
    npsScore: 18,
    trend: 'down',
    riskFlags: [
      '5 SLA breaches — penalty exposure $41k',
      'NPS dropped 32pts in 30d',
      'Renewal at risk — CSM flag',
    ],
    services: ['api-gateway', 'ml-inference', 'data-pipeline', 'auth-service'],
  },
  {
    id: 'c4',
    name: 'BlueSky Ventures',
    tier: 'growth',
    health: 'healthy',
    healthScore: 88,
    mrr: 14200,
    costToServe: 2800,
    margin: 80.3,
    incidentsThisMonth: 2,
    slaBreaches: 0,
    uptimePct: 99.85,
    openTickets: 2,
    npsScore: 68,
    trend: 'up',
    riskFlags: [],
    services: ['api-gateway', 'ml-inference'],
  },
  {
    id: 'c5',
    name: 'Apex Systems',
    tier: 'growth',
    health: 'at_risk',
    healthScore: 72,
    mrr: 11600,
    costToServe: 3400,
    margin: 70.7,
    incidentsThisMonth: 5,
    slaBreaches: 1,
    uptimePct: 99.3,
    openTickets: 4,
    npsScore: 34,
    trend: 'flat',
    riskFlags: ['High cost-to-serve eroding margin', 'Support volume 3× peers'],
    services: ['data-pipeline', 'auth-service'],
  },
  {
    id: 'c6',
    name: 'TechBridge Inc',
    tier: 'growth',
    health: 'healthy',
    healthScore: 91,
    mrr: 8900,
    costToServe: 1600,
    margin: 82.0,
    incidentsThisMonth: 0,
    slaBreaches: 0,
    uptimePct: 100,
    openTickets: 0,
    npsScore: 78,
    trend: 'up',
    riskFlags: [],
    services: ['api-gateway'],
  },
  {
    id: 'c7',
    name: 'Redwood Capital',
    tier: 'starter',
    health: 'healthy',
    healthScore: 85,
    mrr: 3200,
    costToServe: 820,
    margin: 74.4,
    incidentsThisMonth: 1,
    slaBreaches: 0,
    uptimePct: 99.9,
    openTickets: 1,
    npsScore: null,
    trend: 'flat',
    riskFlags: [],
    services: ['api-gateway'],
  },
];

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function HealthDot({ status }: { status: HealthStatus }) {
  const c = HEALTH_COLOR[status];
  return (
    <span className="relative flex w-2 h-2 shrink-0">
      {status !== 'healthy' && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
          style={{ background: c }}
        />
      )}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: c }} />
    </span>
  );
}

function ClientRow({
  client,
  onClick,
  expanded,
}: {
  client: Client;
  onClick: () => void;
  expanded: boolean;
}) {
  const tc = TIER_COLOR[client.tier];
  const hc = HEALTH_COLOR[client.health];
  const profitColor = client.margin > 78 ? '#10b981' : client.margin > 65 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <tr
        onClick={onClick}
        className="cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{ borderBottom: `1px solid ${DS.border}` }}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <HealthDot status={client.health} />
            <div>
              <div className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>
                {client.name}
              </div>
              <div className="text-[9px] mt-0.5 capitalize" style={{ color: tc }}>
                {client.tier}
              </div>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="text-[11px] font-mono font-semibold" style={{ color: GOLD }}>
            {fmt$(client.mrr)}
          </div>
          <div className="text-[8px]" style={{ color: DS.text.muted }}>
            /mo
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="text-[11px] font-mono" style={{ color: DS.text.secondary }}>
            {fmt$(client.costToServe)}
          </div>
          <div className="text-[8px]" style={{ color: DS.text.muted }}>
            /mo
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="text-[11px] font-mono font-semibold" style={{ color: profitColor }}>
            {client.margin.toFixed(1)}%
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="text-[11px] font-mono" style={{ color: hc }}>
            {client.healthScore}
          </div>
          <div className="text-[8px]" style={{ color: DS.text.muted }}>
            / 100
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div
            className="text-[11px] font-mono"
            style={{ color: client.slaBreaches > 0 ? '#ef4444' : DS.text.muted }}
          >
            {client.slaBreaches}
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <div
            className="text-[11px] font-mono"
            style={{
              color:
                client.npsScore !== null
                  ? client.npsScore >= 50
                    ? '#10b981'
                    : client.npsScore >= 20
                      ? '#f59e0b'
                      : '#ef4444'
                  : DS.text.muted,
            }}
          >
            {client.npsScore !== null ? client.npsScore : '—'}
          </div>
        </td>
        <td className="py-3 px-4 text-center">
          {expanded ? (
            <ChevronUp className="w-3 h-3 mx-auto" style={{ color: DS.text.muted }} />
          ) : (
            <ChevronDown className="w-3 h-3 mx-auto" style={{ color: DS.text.muted }} />
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
          <td colSpan={8} className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest font-medium mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Operational Details
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span style={{ color: DS.text.muted }}>Uptime this month</span>
                    <span className="font-mono" style={{ color: DS.text.secondary }}>
                      {client.uptimePct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: DS.text.muted }}>Incidents this month</span>
                    <span
                      className="font-mono"
                      style={{
                        color: client.incidentsThisMonth > 5 ? '#ef4444' : DS.text.secondary,
                      }}
                    >
                      {client.incidentsThisMonth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: DS.text.muted }}>Open tickets</span>
                    <span
                      className="font-mono"
                      style={{ color: client.openTickets > 3 ? '#f59e0b' : DS.text.secondary }}
                    >
                      {client.openTickets}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: DS.text.muted }}>Services subscribed</span>
                    <span className="font-mono" style={{ color: DS.text.secondary }}>
                      {client.services.length}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest font-medium mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Active Services
                </div>
                <div className="flex flex-wrap gap-1">
                  {client.services.map((s) => (
                    <span
                      key={s}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        background: DS.surface,
                        color: DS.text.muted,
                        border: `1px solid ${DS.border}`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                {client.riskFlags.length > 0 ? (
                  <>
                    <div
                      className="text-[9px] uppercase tracking-widest font-medium mb-2"
                      style={{ color: DS.text.muted }}
                    >
                      Risk Flags
                    </div>
                    <div className="space-y-1.5">
                      {client.riskFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px]">
                          <AlertTriangle
                            className="w-2.5 h-2.5 shrink-0 mt-0.5"
                            style={{ color: '#f59e0b' }}
                          />
                          <span style={{ color: DS.text.secondary }}>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: '#10b981' }}>
                    <Activity className="w-3 h-3" />
                    <span>No risk flags — healthy account</span>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ClientValuePage() {
  const [expandedId, setExpandedId] = useState<string | null>('c3');
  const [sortBy, setSortBy] = useState<'mrr' | 'margin' | 'health'>('mrr');
  const [filterTier, setFilterTier] = useState<'all' | Tier>('all');

  const filtered = CLIENTS.filter((c) => filterTier === 'all' || c.tier === filterTier);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'mrr') return b.mrr - a.mrr;
    if (sortBy === 'margin') return b.margin - a.margin;
    return b.healthScore - a.healthScore;
  });

  const totalMrr = CLIENTS.reduce((s, c) => s + c.mrr, 0);
  const totalCts = CLIENTS.reduce((s, c) => s + c.costToServe, 0);
  const avgMargin = CLIENTS.reduce((s, c) => s + c.margin, 0) / CLIENTS.length;
  const atRiskClients = CLIENTS.filter((c) => c.health !== 'healthy').length;

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              Client Value Dashboard
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Client health, revenue, cost-to-serve, and profitability — making MSP client economics
            visible.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Total MRR',
            value: fmt$(totalMrr),
            sub: `${CLIENTS.length} clients`,
            color: GOLD,
            icon: DollarSign,
          },
          {
            label: 'Total Cost to Serve',
            value: fmt$(totalCts),
            sub: 'Monthly ops cost',
            color: '#3b82f6',
            icon: Activity,
          },
          {
            label: 'Avg Margin',
            value: `${avgMargin.toFixed(1)}%`,
            sub: 'Blended gross margin',
            color: '#10b981',
            icon: TrendingUp,
          },
          {
            label: 'At Risk',
            value: String(atRiskClients),
            sub: 'Clients needing attention',
            color: '#ef4444',
            icon: AlertTriangle,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${DS.border}`, background: DS.surface }}
        >
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>
              Client Register
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {(['all', 'enterprise', 'growth', 'starter'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className="text-[9px] px-2 py-1 rounded capitalize transition-all"
                  style={{
                    background: filterTier === t ? 'rgba(212,160,84,0.1)' : 'transparent',
                    color: filterTier === t ? GOLD : DS.text.muted,
                    border: `1px solid ${filterTier === t ? 'rgba(212,160,84,0.2)' : 'transparent'}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="w-px" style={{ background: DS.border }} />
            <div className="flex gap-1">
              {(['mrr', 'margin', 'health'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="text-[9px] px-2 py-1 rounded capitalize transition-all"
                  style={{
                    background: sortBy === s ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: sortBy === s ? DS.text.secondary : DS.text.muted,
                  }}
                >
                  ↕ {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {[
                  'Client',
                  'MRR',
                  'Cost to Serve',
                  'Margin',
                  'Health',
                  'SLA Breaches',
                  'NPS',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-[8px] uppercase tracking-widest font-medium px-4 py-2 text-right first:text-left last:text-center"
                    style={{ color: DS.text.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <ClientRow
                  key={c.id}
                  client={c}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  expanded={expandedId === c.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div className="text-[10px] font-medium mb-3" style={{ color: DS.text.secondary }}>
          Revenue vs. Cost-to-Serve by Client
        </div>
        <div className="space-y-2">
          {[...CLIENTS]
            .sort((a, b) => b.mrr - a.mrr)
            .map((c) => {
              const maxMrr = Math.max(...CLIENTS.map((x) => x.mrr));
              const mrrPct = (c.mrr / maxMrr) * 100;
              const ctsPct = (c.costToServe / c.mrr) * 100;
              return (
                <div key={c.id}>
                  <div
                    className="flex justify-between text-[9px] mb-1"
                    style={{ color: DS.text.muted }}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono">
                      {fmt$(c.mrr)} MRR · {c.margin.toFixed(0)}% margin
                    </span>
                  </div>
                  <div
                    className="relative h-3 rounded overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded"
                      style={{ width: `${mrrPct}%`, background: `${TIER_COLOR[c.tier]}30` }}
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded"
                      style={{ width: `${mrrPct * (ctsPct / 100)}%`, background: '#3b82f630' }}
                    />
                  </div>
                </div>
              );
            })}
          <div className="flex gap-4 text-[8px] mt-2" style={{ color: DS.text.muted }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded inline-block" style={{ background: `${GOLD}30` }} />
              MRR
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded inline-block" style={{ background: '#3b82f630' }} />
              Cost to serve
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
