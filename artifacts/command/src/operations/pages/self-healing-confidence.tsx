import { AmbientBar, type AmbientSignal } from '@szl-holdings/shared-ui/ambient-intelligence';
import {
  CorrelationFeed,
  type CrossDomainCorrelation,
} from '@szl-holdings/shared-ui/cross-domain-correlation';
import { type EnergyMetrics, EnergyPulse } from '@szl-holdings/shared-ui/energy-heartbeat';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMemo, useState } from 'react';

interface SelfHealingIncident {
  id: string;
  title: string;
  service: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  healingConfidence: number;
  autoResolved: boolean;
  resolvedAt?: number;
  timeSavedMinutes?: number;
  proofChainSteps: string[];
  humanRequired: boolean;
  humanReason?: string;
  detectedAt: number;
  category: string;
}

const DEMO_INCIDENTS: SelfHealingIncident[] = [
  {
    id: 'sh-001',
    title: 'Memory leak detected in payment-service pod',
    service: 'payment-service',
    severity: 'high',
    healingConfidence: 0.97,
    autoResolved: true,
    resolvedAt: Date.now() - 1800000,
    timeSavedMinutes: 35,
    humanRequired: false,
    detectedAt: Date.now() - 3600000,
    category: 'Memory',
    proofChainSteps: [
      'Anomaly detected via Prometheus (RSS > 2GB threshold)',
      'Correlated with deployment v3.14.2 rollout 2h ago',
      'Identified leak pattern matching known issue in connection pooling',
      'Executed pod restart with rolling strategy',
      'Memory normalized to 340MB within 90s',
      'Verified health endpoints responding 200',
    ],
  },
  {
    id: 'sh-002',
    title: 'Certificate expiry in 72h — api-gateway-prod',
    service: 'api-gateway',
    severity: 'medium',
    healingConfidence: 0.99,
    autoResolved: true,
    resolvedAt: Date.now() - 7200000,
    timeSavedMinutes: 45,
    humanRequired: false,
    detectedAt: Date.now() - 10800000,
    category: 'Certificate',
    proofChainSteps: [
      'Cert-watcher detected expiry within 72h window',
      "Requested renewal from Let's Encrypt via ACME",
      'New certificate validated (SHA-256 fingerprint logged)',
      'Hot-reloaded TLS config without downtime',
      'Verified TLS handshake with new cert',
    ],
  },
  {
    id: 'sh-003',
    title: 'Disk usage 92% on analytics-worker-03',
    service: 'analytics-worker',
    severity: 'high',
    healingConfidence: 0.91,
    autoResolved: true,
    resolvedAt: Date.now() - 14400000,
    timeSavedMinutes: 20,
    humanRequired: false,
    detectedAt: Date.now() - 18000000,
    category: 'Disk',
    proofChainSteps: [
      'Disk threshold alert triggered at 92%',
      'Identified 18GB of stale log files >7 days',
      'Ran log rotation and cleanup',
      'Disk usage reduced to 64%',
      'Alert resolved automatically',
    ],
  },
  {
    id: 'sh-004',
    title: 'Cascading timeout in order-processing pipeline',
    service: 'order-processor',
    severity: 'critical',
    healingConfidence: 0.42,
    autoResolved: false,
    humanRequired: true,
    humanReason:
      'Upstream database deadlock requires manual investigation of transaction isolation levels',
    detectedAt: Date.now() - 900000,
    category: 'Timeout',
    proofChainSteps: [
      'Timeout cascade detected across 3 services',
      'Root cause narrowed to database layer',
      'Deadlock pattern detected — requires human review',
    ],
  },
  {
    id: 'sh-005',
    title: 'DNS resolution failure for cache-cluster.internal',
    service: 'cache-cluster',
    severity: 'medium',
    healingConfidence: 0.88,
    autoResolved: true,
    resolvedAt: Date.now() - 28800000,
    timeSavedMinutes: 15,
    humanRequired: false,
    detectedAt: Date.now() - 32400000,
    category: 'DNS',
    proofChainSteps: [
      'DNS resolution failure detected for internal hostname',
      'Flushed local DNS cache',
      'Restarted CoreDNS pods',
      'Resolution restored within 8s',
    ],
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

export default function SelfHealingConfidence() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ambientSignals: AmbientSignal[] = [
    {
      id: 'sig-1',
      domain: 'lyte',
      title: 'Self-Healing Active',
      summary: '94% of P1 incidents resolved without human intervention',
      severity: 'info',
      score: 0.38,
      timestamp: Date.now(),
    },
  ];
  const energyMetrics: EnergyMetrics = {
    apiCallsPerMinute: 156,
    wsMessagesPerMinute: 420,
    chartRendersPerMinute: 32,
    dataRefreshesPerMinute: 24,
    activeSubscriptions: 56,
    deferredUpdates: 5,
    totalBudget: 120,
    usedBudget: 89,
  };
  const correlations: CrossDomainCorrelation[] = [
    {
      id: 'cor-1',
      title: 'Cyber Resilience ↔ AIOps Maturity',
      description: 'Subsidiaries with higher AIOps adoption resolve incidents 3x faster',
      domains: ['firestorm', 'lyte'],
      confidence: 0.91,
      timestamp: Date.now(),
      signals: [
        { domain: 'firestorm', event: 'MTTR decreased 42%', severity: 'medium' },
        { domain: 'lyte', event: 'Self-healing rate 94%', severity: 'info' },
      ],
      impact: 'high',
    },
  ];

  const stats = useMemo(() => {
    const resolved = DEMO_INCIDENTS.filter((i) => i.autoResolved);
    const totalSaved = resolved.reduce((s, i) => s + (i.timeSavedMinutes ?? 0), 0);
    const avgConfidence = Math.round(
      (resolved.reduce((s, i) => s + i.healingConfidence, 0) / (resolved.length || 1)) * 100,
    );
    return {
      resolved: resolved.length,
      pending: DEMO_INCIDENTS.length - resolved.length,
      totalSaved,
      avgConfidence,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="lyte" accentColor="#f59e0b" compact />
      <div>
        <h1 className="text-2xl font-bold text-white/90">Self-Healing Confidence</h1>
        <p className="text-sm text-white/40 mt-1">
          Quantified autonomous resolution confidence — operators only see incidents that genuinely
          require human judgment
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Auto-Resolved',
            value: stats.resolved.toString(),
            sub: 'incidents',
            color: '#10b981',
          },
          {
            label: 'Human Required',
            value: stats.pending.toString(),
            sub: 'incidents',
            color: '#f97316',
          },
          {
            label: 'Hours Saved',
            value: `${(stats.totalSaved / 60).toFixed(1)}h`,
            sub: `${stats.totalSaved} minutes`,
            color: '#3b82f6',
          },
          {
            label: 'Avg Confidence',
            value: `${stats.avgConfidence}%`,
            sub: 'auto-resolved',
            color: '#8b5cf6',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-white/20 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {DEMO_INCIDENTS.map((incident) => {
          const isExpanded = expandedId === incident.id;
          const confColor =
            incident.healingConfidence >= 0.85
              ? '#10b981'
              : incident.healingConfidence >= 0.6
                ? '#f59e0b'
                : '#ef4444';

          return (
            <div
              key={incident.id}
              className={cn(
                'rounded-xl border transition-all',
                incident.autoResolved
                  ? 'bg-white/[0.02] border-white/5'
                  : 'bg-red-500/[0.03] border-red-500/10',
              )}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : incident.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${confColor}20`, color: confColor }}
                    >
                      {Math.round(incident.healingConfidence * 100)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/85">{incident.title}</div>
                      <div className="text-[11px] text-white/40 flex items-center gap-2">
                        <span>{incident.service}</span>
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                          style={{
                            background: `${SEV_COLORS[incident.severity]}20`,
                            color: SEV_COLORS[incident.severity],
                          }}
                        >
                          {incident.severity}
                        </span>
                        <span>{incident.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {incident.autoResolved ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                        ✓ Auto-resolved • {incident.timeSavedMinutes}min saved
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400">
                        ⚠ Human Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      Healing Confidence
                    </span>
                    <div className="h-2 flex-1 max-w-xs bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${incident.healingConfidence * 100}%`,
                          background: confColor,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono" style={{ color: confColor }}>
                      {Math.round(incident.healingConfidence * 100)}%
                    </span>
                  </div>

                  {incident.humanReason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">
                        Why Human Required
                      </div>
                      <p className="text-xs text-white/60">{incident.humanReason}</p>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                      Proof Chain
                    </div>
                    <div className="space-y-1.5">
                      {incident.proofChainSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-white/20 font-mono shrink-0 w-4 text-right">
                            {i + 1}.
                          </span>
                          <span className="text-white/60">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed correlations={correlations} currentDomain="lyte" accentColor="#f59e0b" />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse
            metrics={energyMetrics}
            utilization={energyMetrics.usedBudget / energyMetrics.totalBudget}
            accentColor="#f59e0b"
          />
        </div>
      </div>
    </div>
  );
}
