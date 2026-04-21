import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface BusinessImpact {
  id: string;
  timestamp: number;
  service: string;
  event: string;
  eventType: 'latency' | 'error' | 'outage' | 'security' | 'capacity';
  revenuePerHour: number;
  affectedClients: number;
  slaBreachRisk: number;
  operationalCost: number;
  duration: number;
  status: 'active' | 'resolved';
  clientNames: string[];
}

interface RevenueStream {
  id: string;
  name: string;
  revenuePerHour: number;
  healthScore: number;
  affectedBy: string[];
  trend: number[];
}

const SEED_IMPACTS: BusinessImpact[] = [
  {
    id: 'bi1',
    timestamp: Date.now() - 120000,
    service: 'api-gateway',
    event: 'Latency spike P95 > 800ms',
    eventType: 'latency',
    revenuePerHour: 12500,
    affectedClients: 8,
    slaBreachRisk: 72,
    operationalCost: 1800,
    duration: 12,
    status: 'active',
    clientNames: ['Northgate Corp', 'Meridian Fund', 'Pacific Logistics', '+5'],
  },
  {
    id: 'bi2',
    timestamp: Date.now() - 300000,
    service: 'alloy-engine',
    event: 'Error rate surge: 4.2% → 12.1%',
    eventType: 'error',
    revenuePerHour: 8200,
    affectedClients: 4,
    slaBreachRisk: 55,
    operationalCost: 1200,
    duration: 28,
    status: 'active',
    clientNames: ['Coastal Finance', 'TechBridge Inc', '+2'],
  },
  {
    id: 'bi3',
    timestamp: Date.now() - 600000,
    service: 'ml-inference',
    event: 'GPU capacity limit reached',
    eventType: 'capacity',
    revenuePerHour: 5400,
    affectedClients: 6,
    slaBreachRisk: 38,
    operationalCost: 800,
    duration: 45,
    status: 'resolved',
    clientNames: ['BlueSky Ventures', 'Apex Systems', '+4'],
  },
  {
    id: 'bi4',
    timestamp: Date.now() - 900000,
    service: 'firestorm-soc',
    event: 'Security incident: lateral movement detected',
    eventType: 'security',
    revenuePerHour: 22000,
    affectedClients: 12,
    slaBreachRisk: 89,
    operationalCost: 4500,
    duration: 8,
    status: 'active',
    clientNames: ['Northgate Corp', 'Meridian Fund', '+10'],
  },
];

const REVENUE_STREAMS: RevenueStream[] = [
  {
    id: 'r1',
    name: 'Platform SaaS (MRR)',
    revenuePerHour: 18500,
    healthScore: 82,
    affectedBy: ['api-gateway'],
    trend: [18000, 18200, 18100, 18500, 18400, 18600, 18500],
  },
  {
    id: 'r2',
    name: 'AI Compute Billing',
    revenuePerHour: 9200,
    healthScore: 64,
    affectedBy: ['ml-inference', 'alloy-engine'],
    trend: [10000, 9800, 9500, 9200, 9100, 9200, 9200],
  },
  {
    id: 'r3',
    name: 'Managed Security (MSSP)',
    revenuePerHour: 12000,
    healthScore: 71,
    affectedBy: ['firestorm-soc'],
    trend: [11500, 11800, 12000, 11900, 12100, 12000, 12000],
  },
  {
    id: 'r4',
    name: 'Data Intelligence API',
    revenuePerHour: 4800,
    healthScore: 95,
    affectedBy: [],
    trend: [4600, 4700, 4700, 4800, 4800, 4850, 4800],
  },
];

function formatUSD(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  const w = 80,
    h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImpactCard({ impact }: { impact: BusinessImpact }) {
  const typeColors: Record<BusinessImpact['eventType'], string> = {
    latency: '#f59e0b',
    error: '#ef4444',
    outage: '#dc2626',
    security: '#8b5cf6',
    capacity: '#3b82f6',
  };
  const tc = typeColors[impact.eventType];
  const statusColor = impact.status === 'active' ? '#ef4444' : '#6b8f71';

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: `${tc}20`, background: `${tc}04` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
              style={{ background: `${tc}15`, color: tc }}
            >
              {impact.eventType}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: statusColor,
                boxShadow: impact.status === 'active' ? `0 0 6px ${statusColor}` : 'none',
              }}
            />
            <span className="text-[9px]" style={{ color: statusColor }}>
              {impact.status}
            </span>
          </div>
          <div className="text-[11px] font-bold text-white">{impact.service}</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {impact.event}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono" style={{ color: tc }}>
            {formatUSD(impact.revenuePerHour)}
            <span className="text-[9px] font-normal text-white/30">/hr</span>
          </div>
          <div className="text-[9px]" style={{ color: DS.text.muted }}>
            {Math.round((Date.now() - impact.timestamp) / 60000)}m ago
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Affected Clients', value: impact.affectedClients.toString(), color: '#f59e0b' },
          {
            label: 'SLA Breach Risk',
            value: `${impact.slaBreachRisk}%`,
            color: impact.slaBreachRisk > 70 ? '#ef4444' : '#f59e0b',
          },
          { label: 'Ops Cost', value: formatUSD(impact.operationalCost), color: GOLD },
        ].map((m) => (
          <div
            key={m.label}
            className="text-center p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="text-[11px] font-bold font-mono" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-[8px]" style={{ color: DS.text.muted }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {impact.clientNames.map((cn) => (
          <span
            key={cn}
            className="text-[8px] px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {cn}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BusinessSignalsIntelligence() {
  const [impacts, setImpacts] = useState<BusinessImpact[]>(SEED_IMPACTS);
  const [streams, setStreams] = useState<RevenueStream[]>(REVENUE_STREAMS);
  const [totalLoss, setTotalLoss] = useState(0);

  useEffect(() => {
    const active = impacts.filter((i) => i.status === 'active');
    setTotalLoss(active.reduce((s, i) => s + i.revenuePerHour, 0));
  }, [impacts]);

  useEffect(() => {
    const t = setInterval(() => {
      setStreams((prev) =>
        prev.map((s) => ({
          ...s,
          revenuePerHour: Math.max(1000, s.revenuePerHour + (Math.random() - 0.5) * 200),
          healthScore: Math.max(20, Math.min(100, s.healthScore + (Math.random() - 0.5) * 3)),
          trend: [...s.trend.slice(-6), s.revenuePerHour + (Math.random() - 0.5) * 300],
        })),
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const activeImpacts = impacts.filter((i) => i.status === 'active').length;
  const avgSlaRisk =
    impacts.filter((i) => i.status === 'active').reduce((s, i) => s + i.slaBreachRisk, 0) /
    Math.max(1, activeImpacts);
  const totalAffectedClients = impacts
    .filter((i) => i.status === 'active')
    .reduce((s, i) => s + i.affectedClients, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest font-mono"
            style={{ color: GOLD }}
          >
            Command · Business Signal Intelligence
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Business Signal Intelligence</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Real-time correlation of infrastructure events to revenue impact, SLA exposure, client
          health, and operational cost. Every incident shows its business cost.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Revenue at Risk / hr',
            value: formatUSD(totalLoss),
            color: '#ef4444',
            pulse: totalLoss > 0,
            icon: TrendingDown,
          },
          {
            label: 'Active Incidents',
            value: activeImpacts.toString(),
            color: GOLD,
            icon: AlertTriangle,
          },
          {
            label: 'Affected Clients',
            value: totalAffectedClients.toString(),
            color: '#f59e0b',
            icon: Users,
          },
          {
            label: 'Avg SLA Breach Risk',
            value: `${avgSlaRisk.toFixed(0)}%`,
            color: avgSlaRisk > 60 ? '#ef4444' : '#f59e0b',
            icon: Activity,
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border p-4"
              style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                <span className="text-[10px]" style={{ color: DS.text.muted }}>
                  {c.label}
                </span>
                {(c as { pulse?: boolean }).pulse && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto"
                    style={{ background: c.color }}
                  />
                )}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>
                {c.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: DS.text.muted }}
          >
            Active Business Impact Events
          </div>
          {impacts.map((impact) => (
            <ImpactCard key={impact.id} impact={impact} />
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ color: DS.text.muted }}
            >
              Revenue Streams
            </div>
            <div className="space-y-3">
              {streams.map((s) => {
                const healthColor =
                  s.healthScore > 80 ? '#6b8f71' : s.healthScore > 60 ? GOLD : '#ef4444';
                const isAffected =
                  s.affectedBy.length > 0 &&
                  impacts.some((i) => s.affectedBy.includes(i.service) && i.status === 'active');
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: isAffected ? '#ef444420' : DS.border,
                      background: isAffected ? '#ef44440a' : DS.surface,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-white/80 truncate flex-1">
                        {s.name}
                      </div>
                      {isAffected && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ml-2"
                          style={{ background: '#ef4444' }}
                        />
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div
                          className="text-lg font-bold font-mono"
                          style={{ color: isAffected ? '#ef4444' : GOLD }}
                        >
                          {formatUSD(s.revenuePerHour)}
                          <span className="text-[9px] font-normal text-white/30">/hr</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className="w-20 h-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.healthScore}%`, background: healthColor }}
                            />
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: healthColor }}>
                            {s.healthScore.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <MiniSparkline data={s.trend} color={isAffected ? '#ef4444' : '#6b8f71'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="text-[10px] font-bold text-white mb-3">Single-Pane Business Brief</div>
            <div className="space-y-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <p>
                🔴 <strong className="text-white/80">api-gateway latency spike</strong> → costing{' '}
                {formatUSD(12500)}/hr, 8 clients degraded, SLA breach imminent for Northgate Corp
              </p>
              <p>
                🟠 <strong className="text-white/80">alloy-engine errors</strong> →{' '}
                {formatUSD(8200)}/hr AI billing impact, Coastal Finance SLA at risk
              </p>
              <p>
                🔴 <strong className="text-white/80">Security incident</strong> → highest risk:{' '}
                {formatUSD(22000)}/hr exposure, 12 client SLAs affected, MSSP credits at risk
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
