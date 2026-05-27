import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  CheckCircle,
  Clock,
  Globe,
  Map,
  RefreshCw,
  Ship,
  TrendingUp,
} from 'lucide-react';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

interface MapVessel {
  imo?: string; name?: string; lat?: number; lng?: number; speed?: number;
  heading?: number; status?: string; flag?: string; vesselType?: string;
}
interface MapPort {
  id?: string | number; name?: string; locode?: string; lat?: number; lng?: number;
  country?: string; congestionLevel?: string;
}
interface MapException {
  id?: string | number; type?: string; severity?: string; lat?: number; lng?: number;
  description?: string;
}
interface PriorityException {
  id?: string | number; vesselName?: string; type?: string; exceptionType?: string;
  title?: string; severity?: string; description?: string;
  valueAtRiskUsd?: number; detectedAt?: string; createdAt?: string;
}
interface MaintenanceVessel {
  id?: string | number; imo?: string; name?: string; vesselType?: string;
  age?: number; status?: string; nextServiceDue?: string;
  criticalSystemAlert?: string; daysOverdue?: number;
}
interface Corridor {
  id?: string | number; name?: string; riskLevel?: string; riskScore?: number;
  activeConflict?: boolean; chokePointAlert?: boolean; description?: string;
}
interface EtaDriftAlert {
  id?: string | number; vesselName?: string; voyageNumber?: string;
  driftHours?: number; driftDirection?: string; cause?: string; port?: string;
}

interface DashboardData {
  fleetSummary: {
    total: number;
    atSea: number;
    inPort: number;
    maintenance: number;
    anchored: number;
    active: number;
    utilizationRate: number;
  };
  mapPayload: {
    vessels: MapVessel[];
    ports: MapPort[];
    exceptions: MapException[];
  };
  exceptionQueue: {
    total: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    totalValueAtRiskUsd: number;
    priorityQueue: PriorityException[];
  };
  maintenanceWatch: {
    activeMaintenanceCount: number;
    atRiskVessels: MaintenanceVessel[];
    maintenanceVessels: MaintenanceVessel[];
  };
  corridorIntelligence: {
    totalCorridors: number;
    highRiskCount: number;
    activeConflictCount: number;
    riskDistribution: { critical: number; high: number; moderate: number; low: number };
    corridors?: Corridor[];
  };
  etaDriftAlerts: EtaDriftAlert[];
  voyageSummary: { total: number; active: number; planned: number; completed: number };
  readinessScore: number;
}

const MetricCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  pulse,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  pulse?: boolean;
}) => (
  <div
    className="rounded-xl border p-4"
    style={{ borderColor: `${accent}20`, background: `${accent}06` }}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      <span className="text-[10px] uppercase tracking-wider" style={{ color: `${accent}80` }}>
        {label}
      </span>
      {pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ml-auto"
          style={{ background: accent }}
        />
      )}
    </div>
    <p className="text-2xl font-bold font-mono" style={{ color: accent }}>
      {value}
    </p>
    {sub && (
      <p className="text-[10px] mt-0.5" style={{ color: `${accent}60` }}>
        {sub}
      </p>
    )}
  </div>
);

export default function Platform() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<DashboardData>('/api/vessels/platform/dashboard');
      setData(res);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const fleet = data?.fleetSummary;
  const mapPayload = data?.mapPayload;
  const exceptionQueue = data?.exceptionQueue;
  const corridorIntel = data?.corridorIntelligence;
  const voyageSummary = data?.voyageSummary;
  const maintenanceWatch = data?.maintenanceWatch;
  const readinessScore = data?.readinessScore ?? 0;
  const etaDrifts = data?.etaDriftAlerts ?? [];

  const ports = mapPayload?.ports ?? [];
  const priorityExceptions = exceptionQueue?.priorityQueue ?? [];
  const criticalExceptions = exceptionQueue?.bySeverity?.critical ?? 0;

  return (
    <div
      className="min-h-screen overflow-auto text-sky-50"
      style={{ background: 'linear-gradient(180deg, #060e1a 0%, #0a1628 100%)' }}
    >
      {/* Header */}
      <div className="border-b border-sky-500/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: 'rgba(6,14,26,0.95)', backdropFilter: 'blur(8px)' }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Anchor className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-mono text-sky-400/60 uppercase tracking-widest">
              Vessels Platform
            </span>
            {!loading && !error && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-sky-50">Maritime Operations Dashboard</h1>
          <p className="text-xs text-sky-400/40 mt-0.5">
            Last refreshed {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-500/20 text-sky-400/60 hover:text-sky-300 hover:border-sky-500/40 text-xs transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Fleet Size"
            value={loading ? '—' : (fleet?.total ?? 0)}
            sub={`${fleet?.atSea ?? 0} at sea · ${fleet?.utilizationRate ?? 0}% utilization`}
            icon={Ship}
            accent="#38bdf8"
            pulse={!loading}
          />
          <MetricCard
            label="Active Voyages"
            value={loading ? '—' : (voyageSummary?.active ?? 0)}
            sub={`${voyageSummary?.completed ?? 0} completed · ${voyageSummary?.planned ?? 0} planned`}
            icon={Map}
            accent="#22c55e"
          />
          <MetricCard
            label="Open Exceptions"
            value={loading ? '—' : (exceptionQueue?.total ?? 0)}
            sub={criticalExceptions > 0 ? `${criticalExceptions} critical` : 'None critical'}
            icon={AlertTriangle}
            accent={criticalExceptions > 0 ? '#ef4444' : '#f59e0b'}
            pulse={criticalExceptions > 0}
          />
          <MetricCard
            label="Readiness Score"
            value={loading ? '—' : `${readinessScore}%`}
            sub={readinessScore >= 80 ? 'Operational' : readinessScore >= 60 ? 'Caution' : 'At risk'}
            icon={Activity}
            accent={readinessScore >= 80 ? '#22c55e' : readinessScore >= 60 ? '#f59e0b' : '#ef4444'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fleet Status Breakdown */}
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-sky-100">Fleet Status</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">{fleet?.total ?? 0} vessels</span>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-7 bg-sky-500/10 rounded" />
                ))}
              </div>
            ) : fleet ? (
              <div className="space-y-3">
                {([
                  ['at_sea', fleet.atSea, '#38bdf8'],
                  ['in_port', fleet.inPort, '#c9b787'],
                  ['anchored', fleet.anchored, '#f59e0b'],
                  ['maintenance', fleet.maintenance, '#8a8a8a'],
                  ['active', fleet.active, '#22c55e'],
                ] as [string, number, string][])
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count, color]) => {
                    const pct = fleet.total > 0 ? Math.round((count / fleet.total) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] capitalize text-sky-300/70">
                            {status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] font-mono font-bold" style={{ color }}>
                            {count}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-sky-500/10">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {fleet.total === 0 && (
                  <p className="text-xs text-sky-400/40 text-center py-4">No vessels registered</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-sky-400/40 text-center py-8">No fleet data</p>
            )}
          </div>

          {/* Voyage Summary */}
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-sky-100">Voyage Summary</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">
                {voyageSummary?.total ?? 0} total
              </span>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-10 bg-sky-500/10 rounded" />
                ))}
              </div>
            ) : voyageSummary ? (
              <div className="space-y-2">
                {([
                  ['Active', voyageSummary.active, '#22c55e'],
                  ['Planned', voyageSummary.planned, '#38bdf8'],
                  ['Completed', voyageSummary.completed, '#c9b787'],
                ] as [string, number, string][]).map(([label, count, color]) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-sky-500/10 bg-sky-500/5 px-3 py-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-sky-200 flex-1">{label}</span>
                    <span className="text-lg font-bold font-mono shrink-0" style={{ color }}>{count}</span>
                  </div>
                ))}
                {etaDrifts.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 mt-2">
                    <p className="text-[10px] text-amber-400/80 font-medium">
                      {etaDrifts.length} voyage{etaDrifts.length > 1 ? 's' : ''} with ETA drift &gt;6h
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-sky-400/40 text-center py-8">No voyage data</p>
            )}
          </div>

          {/* Priority Exceptions */}
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-sky-100">Priority Exceptions</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">
                {exceptionQueue?.total ?? 0} open
              </span>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-sky-500/10 rounded" />
                ))}
              </div>
            ) : priorityExceptions.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {priorityExceptions.slice(0, 8).map((e: PriorityException) => {
                  const sevColor =
                    e.severity === 'critical' ? '#ef4444' :
                    e.severity === 'high' ? '#f59e0b' : '#38bdf8';
                  return (
                    <div key={e.id} className="rounded-lg border p-2.5"
                      style={{ borderColor: `${sevColor}20`, background: `${sevColor}05` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono capitalize shrink-0"
                          style={{ background: `${sevColor}15`, color: sevColor }}>
                          {e.severity ?? 'medium'}
                        </span>
                        <p className="text-[11px] text-sky-200 truncate">
                          {e.title ?? e.exceptionType ?? 'Exception'}
                        </p>
                      </div>
                      <p className="text-[10px] text-sky-400/40 mt-1">
                        {e.vesselName ?? '—'} · {new Date(e.detectedAt ?? e.createdAt ?? Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-xs text-sky-400/40">No open exceptions</p>
              </div>
            )}
          </div>
        </div>

        {/* Ports + Corridor Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ports */}
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Anchor className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-sky-100">Ports in Network</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">{ports.length} registered</span>
            </div>
            {loading ? (
              <div className="animate-pulse h-20 bg-sky-500/10 rounded" />
            ) : ports.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {ports.slice(0, 24).map((p: MapPort) => (
                  <span key={p.id}
                    className="text-[10px] px-2 py-0.5 rounded border border-sky-500/15 text-sky-300/60 bg-sky-500/5">
                    {p.locode ?? p.name ?? `PORT-${String(p.id).slice(0, 4)}`}
                  </span>
                ))}
                {ports.length > 24 && (
                  <span className="text-[10px] text-sky-400/30">+{ports.length - 24} more</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-sky-400/40 text-center py-8">No ports registered</p>
            )}
          </div>

          {/* Corridor Intelligence */}
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-sky-100">Corridor Intelligence</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">
                {corridorIntel?.totalCorridors ?? 0} corridors
              </span>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-8 bg-sky-500/10 rounded" />
                ))}
              </div>
            ) : corridorIntel ? (
              <div className="space-y-3">
                {corridorIntel.highRiskCount > 0 && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-300">
                      {corridorIntel.highRiskCount} high-risk corridor{corridorIntel.highRiskCount > 1 ? 's' : ''} active
                    </p>
                  </div>
                )}
                {corridorIntel.activeConflictCount > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      {corridorIntel.activeConflictCount} corridor{corridorIntel.activeConflictCount > 1 ? 's' : ''} with active conflicts
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {([
                    ['Critical', corridorIntel.riskDistribution.critical, '#ef4444'],
                    ['High', corridorIntel.riskDistribution.high, '#f59e0b'],
                    ['Moderate', corridorIntel.riskDistribution.moderate, '#c9b787'],
                    ['Low', corridorIntel.riskDistribution.low, '#22c55e'],
                  ] as [string, number, string][]).map(([label, count, color]) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold font-mono" style={{ color }}>{count}</p>
                      <p className="text-[9px] text-sky-400/50 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {corridorIntel.totalCorridors === 0 && (
                  <p className="text-xs text-sky-400/40 text-center py-2">No corridors configured</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-sky-400/40 text-center py-8">No corridor data</p>
            )}
          </div>
        </div>

        {/* Maintenance Watch */}
        {maintenanceWatch && (maintenanceWatch.activeMaintenanceCount > 0 || maintenanceWatch.atRiskVessels.length > 0) && (
          <div className="rounded-xl border border-sky-500/10 bg-sky-500/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-sky-100">Maintenance Watch</h2>
              <span className="ml-auto text-[10px] text-sky-400/40">
                {maintenanceWatch.activeMaintenanceCount} in maintenance
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {maintenanceWatch.maintenanceVessels.length > 0 && (
                <div>
                  <p className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-2">Currently in maintenance</p>
                  <div className="space-y-1.5">
                    {maintenanceWatch.maintenanceVessels.slice(0, 4).map((v: MaintenanceVessel) => (
                      <div key={v.id} className="flex items-center gap-2 rounded border border-sky-500/10 bg-sky-500/5 px-2.5 py-1.5">
                        <Ship className="w-3 h-3 text-sky-400/40 shrink-0" />
                        <span className="text-[11px] text-sky-200 truncate">{v.name}</span>
                        <span className="text-[9px] text-sky-400/40 shrink-0">{v.vesselType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {maintenanceWatch.atRiskVessels.length > 0 && (
                <div>
                  <p className="text-[10px] text-sky-400/50 uppercase tracking-wider mb-2">Age-risk flagged</p>
                  <div className="space-y-1.5">
                    {maintenanceWatch.atRiskVessels.slice(0, 4).map((v: MaintenanceVessel) => (
                      <div key={v.id} className="flex items-center gap-2 rounded border border-amber-500/15 bg-amber-500/5 px-2.5 py-1.5">
                        <Ship className="w-3 h-3 text-amber-400/60 shrink-0" />
                        <span className="text-[11px] text-sky-200 truncate">{v.name}</span>
                        {v.age && <span className="text-[9px] text-amber-400/60 shrink-0">{v.age}y</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
