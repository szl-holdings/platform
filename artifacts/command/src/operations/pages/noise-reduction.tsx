import {
  Brain,
  Filter,
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

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface AlertGroup {
  id: string;
  title: string;
  rootCause: string;
  severity: Severity;
  alertCount: number;
  dedupedFrom: number;
  services: string[];
  firstSeen: number;
  lastSeen: number;
  status: 'active' | 'acknowledged' | 'resolved';
  assignee?: string;
  fatigueScore: number;
  correlationReason: string;
}

interface OperatorFatigueScore {
  operator: string;
  score: number;
  alertsToday: number;
  trend: 'up' | 'down' | 'stable';
}

const SEV_COLOR: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: GOLD,
  low: '#3b82f6',
};

const ALERT_GROUPS: AlertGroup[] = [
  {
    id: 'SIT-0041',
    title: 'Database Saturation Incident',
    rootCause:
      'PostgreSQL primary disk I/O saturation causing cascading write timeouts across all dependent services',
    severity: 'critical',
    alertCount: 3,
    dedupedFrom: 247,
    services: ['postgres-primary', 'order-processor', 'api-gateway', 'payment-processor'],
    firstSeen: Date.now() - 1000 * 60 * 28,
    lastSeen: Date.now() - 1000 * 45,
    status: 'active',
    assignee: 'Jordan Lee',
    fatigueScore: 8,
    correlationReason:
      'All 247 alerts share root write-timeout error code (PGWRITE_ERR_5504) from the same primary node',
  },
  {
    id: 'SIT-0040',
    title: 'Queue Consumer Performance Degradation',
    rootCause:
      'v2.14.1 consumer memory regression causing slow processing and cascading backlog across order, notification, and shipping queues',
    severity: 'high',
    alertCount: 2,
    dedupedFrom: 189,
    services: ['order-processor', 'notification-service', 'shipping-service'],
    firstSeen: Date.now() - 1000 * 60 * 45,
    lastSeen: Date.now() - 1000 * 60 * 5,
    status: 'acknowledged',
    assignee: 'Marcus Webb',
    fatigueScore: 6,
    correlationReason:
      'All alerts correlate with v2.14.1 deploy at 13:42 — consumer CPU profiles show identical GC pause pattern',
  },
  {
    id: 'SIT-0039',
    title: 'CDN Edge Node Flapping',
    rootCause:
      '3 CDN PoP nodes intermittently failing health checks — causing origin failback and elevated latency in EU-West',
    severity: 'medium',
    alertCount: 1,
    dedupedFrom: 84,
    services: ['cdn-eu-west', 'api-gateway'],
    firstSeen: Date.now() - 1000 * 60 * 12,
    lastSeen: Date.now() - 1000 * 60 * 2,
    status: 'active',
    fatigueScore: 4,
    correlationReason:
      '84 health-check-failed alerts from 3 PoPs — all share same AWS region failure signature',
  },
  {
    id: 'SIT-0038',
    title: 'SSL Certificate Expiry Warning',
    rootCause:
      '3 internal service certificates expiring within 7 days — alerting systems generating repeated warnings',
    severity: 'medium',
    alertCount: 1,
    dedupedFrom: 36,
    services: ['internal-auth', 'metrics-collector', 'log-aggregator'],
    firstSeen: Date.now() - 1000 * 60 * 60 * 18,
    lastSeen: Date.now() - 1000 * 60 * 30,
    status: 'acknowledged',
    assignee: 'Sam Torres',
    fatigueScore: 2,
    correlationReason:
      '36 cert-expiry alerts from same certificate authority — same renewal policy needed',
  },
  {
    id: 'SIT-0037',
    title: 'Disk Space Warning — Logging Cluster',
    rootCause:
      'Elasticsearch logging cluster disk at 84% — triggering repeated low-disk warnings across 12 nodes',
    severity: 'low',
    alertCount: 1,
    dedupedFrom: 156,
    services: ['elasticsearch-cluster', 'log-aggregator'],
    firstSeen: Date.now() - 1000 * 60 * 60 * 6,
    lastSeen: Date.now() - 1000 * 60 * 15,
    status: 'resolved',
    fatigueScore: 9,
    correlationReason:
      '156 disk-space alerts from 12 identical nodes — single shared storage volume issue',
  },
];

const FATIGUE_SCORES: OperatorFatigueScore[] = [
  { operator: 'Jordan Lee', score: 87, alertsToday: 234, trend: 'up' },
  { operator: 'Marcus Webb', score: 64, alertsToday: 178, trend: 'stable' },
  { operator: 'Priya Nair', score: 41, alertsToday: 89, trend: 'down' },
  { operator: 'Sam Torres', score: 28, alertsToday: 52, trend: 'down' },
];

function FatigueBar({ score }: { score: number }) {
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 30 ? GOLD : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono w-6 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function NoiseReduction() {
  const [selected, setSelected] = useState<AlertGroup>(ALERT_GROUPS[0]);
  const [showResolved, setShowResolved] = useState(false);
  const [_ticker, setTicker] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const totalRaw = ALERT_GROUPS.reduce((a, g) => a + g.dedupedFrom, 0);
  const totalActionable = ALERT_GROUPS.reduce((a, g) => a + g.alertCount, 0);
  const noiseReduction = Math.round((1 - totalActionable / totalRaw) * 100);
  const filtered = ALERT_GROUPS.filter((g) => showResolved || g.status !== 'resolved');

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Noise Reduction & Alert Correlation
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              ML deduplication · root-cause grouping · alert fatigue scoring · one situation, not
              500 symptoms
            </p>
          </div>
          <button
            onClick={() => setShowResolved((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium"
            style={{
              background: showResolved ? `${GOLD}10` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showResolved ? `${GOLD}30` : DS.border}`,
              color: showResolved ? GOLD : DS.text.secondary,
            }}
          >
            <Filter className="w-3 h-3" />
            {showResolved ? 'Showing All' : 'Active Only'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Raw Alerts', value: totalRaw.toLocaleString(), color: '#f97316' },
            { label: 'Actionable Situations', value: totalActionable, color: GOLD },
            { label: 'Noise Reduction', value: `${noiseReduction}%`, color: '#10b981' },
            {
              label: 'At-Risk Operators',
              value: FATIGUE_SCORES.filter((f) => f.score >= 75).length,
              color: '#ef4444',
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: k.color }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          {/* Situation list */}
          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-widest px-1 mb-2"
              style={{ color: DS.text.muted }}
            >
              Correlated Situations — {filtered.length} active
            </div>
            {filtered.map((g) => {
              const since = Math.floor((Date.now() - g.firstSeen) / 60000);
              return (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selected.id === g.id ? `${SEV_COLOR[g.severity]}08` : DS.surface,
                    border: `1px solid ${selected.id === g.id ? `${SEV_COLOR[g.severity]}30` : DS.border}`,
                  }}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ background: SEV_COLOR[g.severity] }}
                    />
                    <div className="flex-1">
                      <div
                        className="text-[10px] font-semibold mb-0.5"
                        style={{ color: DS.text.primary }}
                      >
                        {g.title}
                      </div>
                      <div
                        className="flex items-center gap-2 text-[9px]"
                        style={{ color: DS.text.muted }}
                      >
                        <span>{since}m ago</span>
                        <span>·</span>
                        <span style={{ color: '#10b981' }}>
                          {g.dedupedFrom}→{g.alertCount} alerts
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize"
                        style={{
                          background: `${SEV_COLOR[g.severity]}12`,
                          color: SEV_COLOR[g.severity],
                        }}
                      >
                        {g.severity}
                      </span>
                      {g.status !== 'active' && (
                        <span
                          className="text-[8px] font-mono capitalize"
                          style={{ color: DS.text.muted }}
                        >
                          {g.status}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Operator fatigue */}
            <div
              className="rounded-lg p-3 mt-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-3"
                style={{ color: DS.text.muted }}
              >
                Operator Alert Fatigue
              </div>
              <div className="space-y-3">
                {FATIGUE_SCORES.map((f) => (
                  <div key={f.operator}>
                    <div className="flex justify-between text-[9px] mb-1">
                      <span style={{ color: DS.text.secondary }}>{f.operator}</span>
                      <span style={{ color: DS.text.muted }}>{f.alertsToday} alerts/day</span>
                    </div>
                    <FatigueBar score={f.score} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Situation detail */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="p-4 border-b" style={{ borderColor: DS.border }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
                  {selected.id}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize"
                  style={{
                    background: `${SEV_COLOR[selected.severity]}15`,
                    color: SEV_COLOR[selected.severity],
                  }}
                >
                  {selected.severity}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize"
                  style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                >
                  {selected.status}
                </span>
              </div>
              <h2 className="text-sm font-semibold mb-2" style={{ color: DS.text.primary }}>
                {selected.title}
              </h2>

              <div
                className="flex items-center gap-2 p-2 rounded"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}
              >
                <Brain className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                <div>
                  <div
                    className="text-[8px] uppercase tracking-wider mb-0.5"
                    style={{ color: '#10b981' }}
                  >
                    ML Deduplication
                  </div>
                  <div className="text-[10px]" style={{ color: DS.text.secondary }}>
                    <span className="font-mono font-bold" style={{ color: '#10b981' }}>
                      {selected.dedupedFrom} raw alerts
                    </span>{' '}
                    collapsed to{' '}
                    <span className="font-mono font-bold" style={{ color: '#10b981' }}>
                      {selected.alertCount} actionable situation{selected.alertCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Root Cause
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: DS.text.secondary }}>
                  {selected.rootCause}
                </p>
              </div>

              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Correlation Reason
                </div>
                <div
                  className="p-3 rounded"
                  style={{
                    background: 'rgba(139,92,200,0.06)',
                    border: '1px solid rgba(139,92,200,0.15)',
                  }}
                >
                  <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                    {selected.correlationReason}
                  </p>
                </div>
              </div>

              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Affected Services
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.services.map((s) => (
                    <span
                      key={s}
                      className="text-[9px] px-2 py-0.5 rounded font-mono"
                      style={{
                        background: `${SEV_COLOR[selected.severity]}08`,
                        color: SEV_COLOR[selected.severity],
                        border: `1px solid ${SEV_COLOR[selected.severity]}20`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    k: 'First Seen',
                    v: `${Math.floor((Date.now() - selected.firstSeen) / 60000)}m ago`,
                  },
                  {
                    k: 'Last Event',
                    v: `${Math.floor((Date.now() - selected.lastSeen) / 1000)}s ago`,
                  },
                  { k: 'Assignee', v: selected.assignee ?? 'Unassigned' },
                  {
                    k: 'Fatigue Score',
                    v: `${selected.fatigueScore}/10`,
                    color:
                      selected.fatigueScore >= 8
                        ? '#ef4444'
                        : selected.fatigueScore >= 5
                          ? '#f97316'
                          : '#10b981',
                  },
                ].map((r) => (
                  <div
                    key={r.k}
                    className="p-2 rounded"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      {r.k}
                    </div>
                    <div
                      className="text-[11px] font-mono"
                      style={{ color: (r as any).color ?? DS.text.primary }}
                    >
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded text-[10px] font-medium"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                  }}
                >
                  Acknowledge
                </button>
                <button
                  className="flex-1 py-2 rounded text-[10px] font-medium"
                  style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, color: GOLD }}
                >
                  Auto-Remediate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
