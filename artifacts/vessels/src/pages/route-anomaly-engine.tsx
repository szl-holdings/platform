import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ACCENT = '#0ea5e9';
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    label: 'Critical',
  },
  high: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.20)',
    label: 'High',
  },
  medium: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.20)',
    label: 'Medium',
  },
  low: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.20)',
    label: 'Low',
  },
};

const ANOMALY_ICONS: Record<string, React.FC<any>> = {
  ais_gap: Radio,
  speed_deviation: TrendingUp,
  route_deviation: Navigation,
  heading_anomaly: Navigation,
  loitering: MapPin,
  sts_proximity: Zap,
  port_mismatch: AlertTriangle,
};

interface Alert {
  id: string;
  vesselName: string;
  vesselImo: string;
  vesselFlag: string;
  anomalyType: string;
  anomalyLabel: string;
  description: string;
  severity: string;
  corridor: string;
  driftNm: number;
  detectedAt: string;
  lastKnownPosition: { lat: number; lon: number };
  confidence: number;
  recommendedAction: string;
  status: string;
  provenance: {
    confidence: number;
    verifierApproved: boolean;
    attestation: string;
    freshness: { fetchedAt: string };
  };
}

interface AnomalyData {
  alerts: Alert[];
  summary: {
    total: number;
    open: number;
    acknowledged: number;
    uniqueVesselsAffected: number;
    bySeverity: Record<string, number>;
  };
  provenance: {
    confidence: number;
    verifierApproved: boolean;
    attestation: string;
    freshness: { fetchedAt: string };
  };
}

function AlertRow({
  alert,
  selected,
  onClick,
}: {
  alert: Alert;
  selected: boolean;
  onClick: () => void;
}) {
  const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.medium;
  const Icon = ANOMALY_ICONS[alert.anomalyType] ?? AlertTriangle;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-3.5 border transition-all',
        selected ? 'ring-1 ring-sky-400/40' : 'hover:border-sky-500/20',
      )}
      style={{
        background: selected ? sev.bg : 'rgba(10,22,40,0.7)',
        borderColor: selected ? sev.border : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg flex-shrink-0" style={{ background: sev.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: sev.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-medium text-sky-100">{alert.vesselName}</span>
            <span className="text-[9px] text-sky-400/40">{alert.vesselFlag}</span>
            <span className="text-[9px] text-sky-400/40">IMO {alert.vesselImo}</span>
            <span
              className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
              style={{ color: sev.color, borderColor: sev.border, background: sev.bg }}
            >
              {sev.label}
            </span>
          </div>
          <div className="text-[11px] text-sky-300/80 font-medium">{alert.anomalyLabel}</div>
          <div className="text-[10px] text-sky-400/50 mt-0.5 truncate">{alert.description}</div>
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-sky-400/40">
            <span>{alert.id}</span>
            <span>·</span>
            <span>{alert.corridor}</span>
            <span>·</span>
            <span>{new Date(alert.detectedAt).toLocaleTimeString()}</span>
            <span className="ml-auto flex items-center gap-1">
              {alert.status === 'acknowledged' ? (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/50" />
              ) : (
                <Clock className="w-2.5 h-2.5 text-amber-400/60" />
              )}
              <span className="capitalize">{alert.status}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function RouteAnomalyEnginePage() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/vessels/cognitive/route-anomalies`);
      if (r.ok) setData((await r.json()) as AnomalyData);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const alerts = data?.alerts ?? [];
  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Route Anomaly Engine</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">
              COGNITIVE RUNTIME
            </Badge>
          </div>
          <p className="text-xs text-sky-400/60">
            Detects deviations from expected voyage corridors, AIS gaps, and behavioral anomalies —
            ranked by risk.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-sky-400 border border-sky-500/20 hover:border-sky-500/40 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total Alerts', value: data.summary.total, color: ACCENT },
            { label: 'Open', value: data.summary.open, color: '#fbbf24' },
            { label: 'Critical', value: data.summary.bySeverity.critical ?? 0, color: '#ef4444' },
            { label: 'High', value: data.summary.bySeverity.high ?? 0, color: '#f87171' },
            {
              label: 'SEXTANT Affected',
              value: data.summary.uniqueVesselsAffected,
              color: '#a78bfa',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 border border-sky-500/10"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-1">
                {s.label}
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.provenance && (
        <div
          className="flex items-center gap-3 mb-5 px-3 py-2 rounded-lg border border-emerald-500/15"
          style={{ background: 'rgba(52,211,153,0.04)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-300/70 font-medium">
            {data.provenance.attestation}
          </span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/50">
            {Math.round(data.provenance.confidence * 100)}% confidence
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-3.5 h-3.5 text-sky-400/40" />
        <div className="flex gap-1.5">
          {['all', 'critical', 'high', 'medium'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] border transition-colors capitalize',
                severityFilter === s
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'border-sky-500/10 text-sky-400/50 hover:text-sky-300/70',
              )}
            >
              {s === 'all' ? 'All Severity' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-2">
          {['all', 'open', 'acknowledged'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] border transition-colors capitalize',
                statusFilter === s
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'border-sky-500/10 text-sky-400/50 hover:text-sky-300/70',
              )}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sky-400/40 text-sm">
              Loading anomaly alerts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-sky-400/40 text-sm">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400/30" />
              No alerts match current filters
            </div>
          ) : (
            filtered.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                selected={selected?.id === alert.id}
                onClick={() => setSelected(selected?.id === alert.id ? null : alert)}
              />
            ))
          )}
        </div>

        <div className="col-span-5">
          {selected ? (
            <div
              className="rounded-xl border border-sky-500/10 p-4 sticky top-4"
              style={{ background: 'rgba(10,22,40,0.9)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const sev = SEVERITY_CONFIG[selected.severity];
                  const Icon = ANOMALY_ICONS[selected.anomalyType] ?? AlertTriangle;
                  return (
                    <div className="p-2 rounded-lg" style={{ background: sev.bg }}>
                      <Icon className="w-4 h-4" style={{ color: sev.color }} />
                    </div>
                  );
                })()}
                <div>
                  <div className="text-sm font-semibold text-sky-100">{selected.anomalyLabel}</div>
                  <div className="text-[10px] text-sky-400/50">
                    {selected.vesselName} · {selected.id}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="text-[10px] text-sky-400/50 mb-1">Description</div>
                  <div className="text-[11px] text-sky-200">{selected.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-sky-400/50">Corridor</span>
                    <div className="text-sky-200 mt-0.5">{selected.corridor}</div>
                  </div>
                  <div>
                    <span className="text-sky-400/50">Drift</span>
                    <div className="text-sky-200 mt-0.5">{selected.driftNm} nm</div>
                  </div>
                  <div>
                    <span className="text-sky-400/50">Position</span>
                    <div className="text-sky-200 mt-0.5">
                      {selected.lastKnownPosition.lat.toFixed(2)}°,{' '}
                      {selected.lastKnownPosition.lon.toFixed(2)}°
                    </div>
                  </div>
                  <div>
                    <span className="text-sky-400/50">Confidence</span>
                    <div className="text-sky-200 mt-0.5">
                      {Math.round(selected.confidence * 100)}%
                    </div>
                  </div>
                </div>
                <div
                  className="p-2.5 rounded-lg border"
                  style={{
                    background: SEVERITY_CONFIG[selected.severity]?.bg,
                    borderColor: SEVERITY_CONFIG[selected.severity]?.border,
                  }}
                >
                  <div
                    className="text-[9px] uppercase tracking-wider mb-1"
                    style={{ color: SEVERITY_CONFIG[selected.severity]?.color }}
                  >
                    Recommended Action
                  </div>
                  <div className="text-[11px] text-sky-100">{selected.recommendedAction}</div>
                </div>
                <div className="pt-2 border-t border-sky-500/10">
                  <div className="text-[10px] text-sky-400/50 mb-1.5">Provenance</div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-sky-300/60">
                      {selected.provenance.attestation}
                    </span>
                  </div>
                  <div className="text-[10px] text-sky-400/40 mt-0.5">
                    Detected {new Date(selected.detectedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border border-sky-500/10 p-4"
              style={{ background: 'rgba(10,22,40,0.8)' }}
            >
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Eye className="w-6 h-6 text-sky-400/30 mb-2" />
                <p className="text-sky-400/40 text-sm">Select an alert to inspect</p>
                <p className="text-sky-400/25 text-xs mt-1">
                  View details, position, recommended action
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
