import { PolicyModeBadge } from '@szl-holdings/design-system/proof/policy-mode-badge';
import { type CommandModeSignal, CommandModeSurface } from '@szl-holdings/shared-ui/command-mode';
import { PackBanner } from '@szl-holdings/shared-ui/pack-banner';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BookmarkCheck,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  DollarSign,
  EyeOff,
  FileSignature,
  Flame,
  GitBranch,
  Grid2X2,
  Layers,
  Minus,
  Navigation,
  RefreshCw,
  Shield,
  ShieldAlert,
  Ship,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import {
  useFleetExceptions,
  useMaintenance,
  useVessels,
  useVoyages,
} from '@/hooks/use-vessels-data';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  at_sea: {
    label: 'At Sea',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  in_port: {
    label: 'In Port',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    dot: 'bg-sky-400',
  },
  anchored: {
    label: 'Anchored',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    dot: 'bg-red-400',
  },
  under_maintenance: {
    label: 'Maintenance',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    dot: 'bg-red-400',
  },
  delayed: {
    label: 'Delayed',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-400',
  },
  loading: {
    label: 'Loading',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    dot: 'bg-violet-400',
  },
  risk_watch: {
    label: 'Risk Watch',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
  },
  exception_active: {
    label: 'Exception Active',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    dot: 'bg-red-400',
  },
};

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Critical' },
  high: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', label: 'High' },
  watch: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Watch' },
  medium: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Medium' },
  normal: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Normal' },
};

function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  trend,
  pulse,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl p-4 flex flex-col gap-2 transition-all overflow-hidden',
        accent,
      )}
      style={{ background: 'rgba(10,22,40,0.85)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, rgba(56,189,248,0.6), transparent)',
        }}
      />
      <div className="flex items-start justify-between">
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon className="w-3.5 h-3.5 text-sky-400/80 shrink-0" />
        </div>
        <div>
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
          {trend === 'neutral' && <Minus className="w-3 h-3 text-sky-400/40" />}
        </div>
      </div>
      <div>
        <p
          className={cn(
            'text-2xl font-bold font-display leading-none text-sky-100',
            pulse && 'animate-pulse',
          )}
        >
          {value}
        </p>
        <p className="text-[10px] text-sky-400/50 uppercase tracking-wider mt-1">{label}</p>
        {sub && <p className="text-[10px] text-sky-400/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

type ViewProps = {
  vessels: ReturnType<typeof useVessels>['vessels'];
  fleetExceptions: ReturnType<typeof useFleetExceptions>['fleetExceptions'];
  voyageEconomics: ReturnType<typeof useVoyages>['voyageEconomics'];
  maintenanceItems: ReturnType<typeof useMaintenance>['maintenanceItems'];
};

function ExecutiveView({ vessels, fleetExceptions, voyageEconomics }: ViewProps) {
  const activeVoyages = vessels.filter((v) =>
    ['at_sea', 'loading', 'exception_active'].includes(v.status),
  ).length;
  const totalVessels = vessels.length;
  const totalRevenue = voyageEconomics
    .filter((v) => v.status === 'active')
    .reduce((a, v) => a + v.estimatedRevenue, 0);
  const totalMargin = voyageEconomics
    .filter((v) => v.status === 'active')
    .reduce((a, v) => a + v.marginEstimate, 0);
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const criticalExc = fleetExceptions.filter(
    (e) => e.severity === 'critical' && e.status === 'active',
  ).length;
  const activeVessels = vessels.filter((v) => v.status !== 'maintenance');
  const fleetUtil =
    activeVessels.length > 0
      ? activeVessels.reduce((a, v) => a + (v.utilization ?? 0), 0) / activeVessels.length
      : 0;
  const utilizingVessels = vessels.filter((v) => (v.utilization ?? 0) > 0);
  const avgTCE =
    utilizingVessels.length > 0
      ? utilizingVessels.reduce((a, v) => a + (v.tce ?? 0), 0) / utilizingVessels.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Strategic Fleet Position
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Active Voyages"
            value={activeVoyages}
            sub={`of ${totalVessels} vessels`}
            accent="border-emerald-500/10"
            icon={Ship}
            trend="up"
          />
          <StatCard
            label="Fleet Utilization"
            value={`${fleetUtil.toFixed(1)}%`}
            sub="excluding maintenance"
            accent="border-sky-500/10"
            icon={Activity}
            trend="up"
          />
          <StatCard
            label="Avg TCE"
            value={`$${(avgTCE / 1000).toFixed(1)}K`}
            sub="per vessel/day"
            accent="border-violet-500/10"
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            label="Critical Exceptions"
            value={criticalExc}
            sub="require immediate action"
            accent="border-red-500/10"
            icon={AlertTriangle}
            pulse={criticalExc > 0}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Voyage P&amp;L Snapshot
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">
              Estimated Revenue
            </p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              ${(totalRevenue / 1e6).toFixed(1)}M
            </p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Active voyages combined</p>
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">Operating Cost</p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              ${((totalRevenue - totalMargin) / 1e6).toFixed(1)}M
            </p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Fuel, port, operating</p>
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">Margin Estimate</p>
            <p className="text-xl font-bold text-sky-300 mt-1">
              ${(totalMargin / 1e6).toFixed(1)}M{' '}
              <span className="text-sm text-sky-400/60">({avgMarginPct.toFixed(1)}%)</span>
            </p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Blended fleet average</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Fleet Status at a Glance
        </h3>
        <div className="space-y-2">
          {vessels.map((v) => {
            const sc = statusConfig[v.status] || {
              label: v.status,
              color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
              dot: 'bg-sky-400',
            };
            return (
              <Link key={v.id} href={`/vessel/${v.id}`}>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg hover:border-sky-500/20 hover:bg-sky-500/5 cursor-pointer transition-all">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', sc.dot)} />
                  <span className="text-xs font-medium text-sky-100 flex-1">{v.name}</span>
                  <span className="text-[10px] text-sky-400/50 font-mono">{v.type}</span>
                  <Badge variant="outline" className={cn('text-[9px] shrink-0', sc.color)}>
                    {sc.label}
                  </Badge>
                  <div className="text-[10px] text-sky-400/40 font-mono w-16 text-right">
                    {(v.utilization ?? 0) > 0 ? `${(v.tce ?? 0).toLocaleString()}/d` : '—'}
                  </div>
                  <ChevronRight className="w-3 h-3 text-sky-400/30 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OperationsView({ vessels, fleetExceptions, maintenanceItems }: ViewProps) {
  const activeExceptions = fleetExceptions.filter((e) => e.status === 'active');
  const maintenanceWatch = maintenanceItems.filter((m) =>
    ['overdue', 'in_progress', 'due_soon'].includes(m.status),
  );
  const maintenanceCount = maintenanceWatch.length;
  const delayedCount = vessels.filter((v) =>
    ['delayed', 'exception_active', 'anchored'].includes(v.status),
  ).length;
  const inPortCount = vessels.filter(
    (v) => v.status === 'in_port' || v.status === 'loading',
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Active Exceptions"
          value={activeExceptions.length}
          sub="require response"
          accent="border-red-500/10"
          icon={AlertTriangle}
          pulse={activeExceptions.some((e) => e.severity === 'critical')}
        />
        <StatCard
          label="Delayed / Disrupted"
          value={delayedCount}
          sub="vessels off schedule"
          accent="border-orange-500/10"
          icon={Clock}
        />
        <StatCard
          label="Maintenance Watch"
          value={maintenanceCount}
          sub="vessels in maintenance"
          accent="border-amber-500/10"
          icon={Wrench}
        />
        <StatCard
          label="In Port"
          value={inPortCount}
          sub="turnaround vessels"
          accent="border-sky-500/10"
          icon={Ship}
        />
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Exception Queue
        </h3>
        <div className="space-y-2">
          {activeExceptions.map((exc) => {
            const sc = severityConfig[exc.severity] ?? severityConfig.normal;
            const impact =
              (
                exc as {
                  estimatedImpactUSD?: number;
                  estimatedImpact?: number;
                  valueAtRiskUsd?: string;
                }
              ).estimatedImpactUSD ??
              ((exc as unknown as { valueAtRiskUsd?: string }).valueAtRiskUsd
                ? parseFloat((exc as unknown as { valueAtRiskUsd: string }).valueAtRiskUsd)
                : ((exc as { estimatedImpact?: number }).estimatedImpact ?? 0));
            return (
              <Link key={exc.id} href="/exceptions">
                <div className="px-4 py-3 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg hover:border-sky-500/20 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className={cn('text-[9px] shrink-0 mt-0.5', sc.color)}>
                      {sc.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sky-100">{exc.title}</p>
                      <p className="text-[10px] text-sky-400/50 mt-0.5">{exc.vesselName ?? ''}</p>
                    </div>
                    {impact > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-mono text-amber-400">
                          ${(impact / 1000).toFixed(0)}K
                        </p>
                        <p className="text-[9px] text-sky-400/40">exposure</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Maintenance Watch
        </h3>
        <div className="space-y-2">
          {maintenanceWatch.slice(0, 5).map((m) => {
            const mv = m as {
              id: number | string;
              name?: string;
              vesselName?: string;
              component?: string;
              vesselType?: string | null;
              flag?: string | null;
              priority?: string;
              status?: string;
              daysToDue?: number;
            };
            const label = mv.vesselName ?? mv.name ?? '—';
            const sub = mv.component ?? mv.vesselType ?? mv.flag ?? '';
            return (
              <div
                key={mv.id}
                className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg"
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    mv.status === 'overdue'
                      ? 'bg-red-400'
                      : mv.status === 'in_progress'
                        ? 'bg-amber-400'
                        : 'bg-sky-400',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sky-100 truncate">
                    {label}
                    {sub ? ` — ${sub}` : ''}
                  </p>
                  {mv.daysToDue !== undefined && (
                    <p className="text-[10px] text-sky-400/50">
                      {mv.status === 'overdue'
                        ? `${Math.abs(mv.daysToDue)}d overdue`
                        : `Due in ${mv.daysToDue}d`}
                    </p>
                  )}
                </div>
                {mv.priority && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px]',
                      mv.priority === 'critical'
                        ? 'text-red-400 border-red-500/20 bg-red-500/10'
                        : mv.priority === 'high'
                          ? 'text-orange-400 border-orange-500/20 bg-orange-500/10'
                          : 'text-amber-400 border-amber-500/20 bg-amber-500/10',
                    )}
                  >
                    {mv.priority}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CommercialView({ voyageEconomics }: ViewProps) {
  const activeVoyages = voyageEconomics.filter((v) => v.status === 'active');
  const underperforming = activeVoyages.filter((v) => (v.performanceVsBudget ?? 0) < -5);
  const overperforming = activeVoyages.filter((v) => (v.performanceVsBudget ?? 0) > 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Active Voyages"
          value={activeVoyages.length}
          sub="charters running"
          accent="border-emerald-500/10"
          icon={Ship}
        />
        <StatCard
          label="Beating Budget"
          value={overperforming.length}
          sub="voyages outperforming"
          accent="border-emerald-500/10"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Under Budget"
          value={underperforming.length}
          sub="voyages at risk"
          accent="border-red-500/10"
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          label="Delay Cost Exposure"
          value={`$${(activeVoyages.reduce((a, v) => a + v.delayCost, 0) / 1000).toFixed(0)}K`}
          sub="fleet-wide"
          accent="border-amber-500/10"
          icon={Clock}
        />
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">
          Voyage P&amp;L by Charter
        </h3>
        <div className="space-y-2">
          {activeVoyages.map((v) => {
            const perf = v.performanceVsBudget ?? 0;
            const isUp = perf > 0;
            return (
              <div
                key={v.voyageId}
                className="px-4 py-3 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-sky-100">{v.vesselName}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/60 border border-sky-500/10">
                        {v.charterType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{v.route}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-mono text-sky-100">
                      ${(v.marginEstimate / 1e6).toFixed(2)}M
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 justify-end text-[10px] font-mono',
                        isUp ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isUp ? '+' : ''}
                      {perf.toFixed(1)}% vs budget
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-sky-400/40">
                  <span>Rev: ${(v.estimatedRevenue / 1e6).toFixed(2)}M</span>
                  <span>Fuel: ${(v.fuelCost / 1e3).toFixed(0)}K</span>
                  <span>Port: ${(v.portCost / 1e3).toFixed(0)}K</span>
                  {v.delayCost > 0 && (
                    <span className="text-orange-400">
                      Delay: ${(v.delayCost / 1e3).toFixed(0)}K
                    </span>
                  )}
                  <span className="ml-auto">TCE: ${v.tce.toLocaleString()}/d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const SAVED_VIEWS = [
  { id: 'default', label: 'Default — All Fleet', description: 'All vessels, all layers' },
  { id: 'at-risk', label: 'Risk Watch', description: 'Delayed, exception-active, AIS dark' },
  { id: 'sanctions', label: 'Sanctions Screening', description: 'OFAC/EU SDN candidates only' },
  {
    id: 'port-approach',
    label: 'Port Approach',
    description: 'Vessels within 50nm of major ports',
  },
];

const LAYER_CONFIG = [
  { id: 'points', label: 'Vessel Positions', icon: Circle, defaultOn: true },
  { id: 'clusters', label: 'Traffic Clusters', icon: Grid2X2, defaultOn: true },
  { id: 'heat', label: 'Route Density Heat', icon: Flame, defaultOn: false },
  { id: 'arcs', label: 'Active Route Arcs', icon: GitBranch, defaultOn: true },
  { id: 'risk-zones', label: 'High-Risk Zones', icon: AlertTriangle, defaultOn: false },
];

const TIMELINE_PRESETS = [
  { id: '1h', label: '1h' },
  { id: '6h', label: '6h' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
];

function IntelControls({
  timeRange,
  setTimeRange,
  savedView,
  setSavedView,
  layers,
  setLayers,
}: {
  timeRange: string;
  setTimeRange: (t: string) => void;
  savedView: string;
  setSavedView: (v: string) => void;
  layers: Set<string>;
  setLayers: (l: Set<string>) => void;
}) {
  const [showViews, setShowViews] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const currentView = SAVED_VIEWS.find((v) => v.id === savedView) ?? SAVED_VIEWS[0];

  return (
    <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-sky-500/10 bg-sky-900/10">
      {/* Timeline brush */}
      <div className="flex items-center gap-1">
        <CalendarRange className="w-3.5 h-3.5 text-sky-400/50" />
        <span className="text-[10px] text-sky-400/50 font-mono uppercase tracking-wider mr-1">
          Window:
        </span>
        <div className="flex gap-0.5">
          {TIMELINE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setTimeRange(p.id)}
              className={cn(
                'px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors',
                timeRange === p.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-sky-400/40 hover:text-sky-300 hover:bg-sky-500/10',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-4 bg-sky-500/15 mx-1" />

      {/* Saved views */}
      <div className="relative">
        <button
          onClick={() => {
            setShowViews((v) => !v);
            setShowLayers(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/15 bg-sky-500/5 text-[10px] text-sky-300/70 hover:text-sky-200 hover:bg-sky-500/10 transition-colors font-mono"
        >
          <BookmarkCheck className="w-3 h-3" />
          {currentView.label}
          <ChevronDown className={cn('w-3 h-3 transition-transform', showViews && 'rotate-180')} />
        </button>
        {showViews && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-sky-500/15 bg-[#060e1e] shadow-xl shadow-black/40 z-20 overflow-hidden">
            {SAVED_VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSavedView(v.id);
                  setShowViews(false);
                }}
                className={cn(
                  'w-full flex flex-col px-3 py-2.5 text-left transition-colors hover:bg-sky-500/10',
                  savedView === v.id && 'bg-sky-500/10',
                )}
              >
                <span className="text-[11px] font-semibold text-sky-200">{v.label}</span>
                <span className="text-[10px] text-sky-400/50">{v.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer control */}
      <div className="relative">
        <button
          onClick={() => {
            setShowLayers((v) => !v);
            setShowViews(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/15 bg-sky-500/5 text-[10px] text-sky-300/70 hover:text-sky-200 hover:bg-sky-500/10 transition-colors font-mono"
        >
          <Layers className="w-3 h-3" />
          Layers ({layers.size}/{LAYER_CONFIG.length})
          <ChevronDown className={cn('w-3 h-3 transition-transform', showLayers && 'rotate-180')} />
        </button>
        {showLayers && (
          <div className="absolute top-full right-0 mt-1 w-52 rounded-xl border border-sky-500/15 bg-[#060e1e] shadow-xl shadow-black/40 z-20 overflow-hidden p-1">
            {LAYER_CONFIG.map((layer) => {
              const Icon = layer.icon;
              const isOn = layers.has(layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    const next = new Set(layers);
                    if (isOn) next.delete(layer.id);
                    else next.add(layer.id);
                    setLayers(next);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-sky-500/10',
                    isOn && 'bg-sky-500/5',
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded flex items-center justify-center',
                      isOn ? 'bg-sky-500/20' : 'bg-transparent border border-sky-500/20',
                    )}
                  >
                    {isOn && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                  </div>
                  <Icon className={cn('w-3 h-3', isOn ? 'text-sky-400/70' : 'text-sky-400/30')} />
                  <span
                    className={cn(
                      'text-[11px] font-mono',
                      isOn ? 'text-sky-200' : 'text-sky-400/40',
                    )}
                  >
                    {layer.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <span className="ml-auto text-[10px] font-mono text-sky-400/30">
        Entities sync with timeline
      </span>
    </div>
  );
}

type TabId = 'exec' | 'ops' | 'commercial';

export default function CommandOverviewPage() {
  const { user } = useAuth();
  const { vessels, isLive, refetch } = useVessels();
  const { fleetExceptions } = useFleetExceptions();
  const { voyageEconomics } = useVoyages();
  const { maintenanceItems } = useMaintenance();

  const qcVessels = useQueryClient();
  const { lastMessage: wsVesselMsg } = useRealtimeChannel('vessel-positions');
  useEffect(() => {
    if (!wsVesselMsg) return;
    qcVessels.invalidateQueries({ queryKey: ['vessels'] });
    qcVessels.invalidateQueries({ queryKey: ['vessels-dashboard'] });
    qcVessels.invalidateQueries({ queryKey: ['fleet-exceptions'] });
  }, [wsVesselMsg, qcVessels]);

  const [activeTab, setActiveTab] = useState<TabId>(
    user.role === 'exec' ? 'exec' : user.role === 'compliance' ? 'commercial' : 'ops',
  );
  const [timeRange, setTimeRange] = useState('24h');
  const [savedView, setSavedView] = useState('default');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(LAYER_CONFIG.filter((l) => l.defaultOn).map((l) => l.id)),
  );

  const viewProps: ViewProps = { vessels, fleetExceptions, voyageEconomics, maintenanceItems };

  const totalVessels = vessels.length;
  const atSea = vessels.filter((v) => v.status === 'at_sea').length;
  const delayed = vessels.filter(
    (v) => ['delayed', 'exception_active', 'anchored'].includes(v.status) && (v.etaDelta ?? 0) > 8,
  ).length;
  const inPort = vessels.filter((v) => v.status === 'in_port' || v.status === 'loading').length;
  const maintenanceCount = vessels.filter((v) => v.status === 'maintenance').length;
  const criticalExceptions = fleetExceptions.filter(
    (e) => e.severity === 'critical' && e.status === 'active',
  ).length;
  const weatherAffected = vessels.filter(
    (v) => v.status === 'exception_active' || (v.status === 'delayed' && (v.etaDelta ?? 0) > 12),
  ).length;
  const activeVessels = vessels.filter((v) => v.status !== 'maintenance');
  const fleetUtil =
    activeVessels.length > 0
      ? Math.round(
          activeVessels.reduce((a, v) => a + (v.utilization ?? 0), 0) / activeVessels.length,
        )
      : 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'exec', label: 'Executive' },
    { id: 'ops', label: 'Operations' },
    { id: 'commercial', label: 'Commercial' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-none">
      {/* Command Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-3.5 h-3.5 text-sky-400/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-sky-400/70">
              Vessels · Fleet Command
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-sky-50 tracking-tight">
            Fleet Command Overview
          </h1>
          <p className="text-[11px] text-sky-400/50 mt-0.5">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · All times UTC
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PolicyModeBadge product="vessels" />
          {!isLive && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DEMO
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400',
              )}
            />
            <span className="text-[10px] text-sky-400/60 font-mono">
              {isLive ? 'Live' : 'Demo'} · {totalVessels} vessels
            </span>
          </div>
        </div>
      </div>

      {/* Fleet status command strip */}
      {criticalExceptions > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          <span className="text-xs font-medium text-red-400">
            {criticalExceptions} critical exception{criticalExceptions > 1 ? 's' : ''} require
            immediate action
          </span>
          <Link href="/exceptions">
            <button className="ml-auto text-[10px] px-2.5 py-1 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Fleet metrics strip */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(14,165,233,0.12)', background: 'rgba(14,165,233,0.015)' }}
      >
        <div className="grid grid-cols-4 md:grid-cols-8">
          {[
            {
              label: 'Total',
              value: totalVessels,
              color: 'text-sky-400',
              borderColor: 'transparent',
            },
            {
              label: 'At Sea',
              value: atSea,
              color: 'text-emerald-400',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'In Port',
              value: inPort,
              color: 'text-sky-300',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'Delayed',
              value: delayed,
              color: 'text-orange-400',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'Maintenance',
              value: maintenanceCount,
              color: 'text-red-400',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'Exceptions',
              value: criticalExceptions,
              color: criticalExceptions > 0 ? 'text-red-400' : 'text-sky-400/40',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'Util.',
              value: `${fleetUtil}%`,
              color: 'text-violet-400',
              borderColor: 'rgba(14,165,233,0.08)',
            },
            {
              label: 'Weather',
              value: weatherAffected,
              color: 'text-amber-400',
              borderColor: 'rgba(14,165,233,0.08)',
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className="px-3 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(14,165,233,0.08)' : 'none' }}
            >
              <p className={cn('text-lg font-bold font-display leading-none', item.color)}>
                {item.value}
              </p>
              <p className="text-[9px] text-sky-400/40 mt-0.5 uppercase tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence controls */}
      <IntelControls
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        savedView={savedView}
        setSavedView={setSavedView}
        layers={activeLayers}
        setLayers={setActiveLayers}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-sky-500/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-sky-400/50 hover:text-sky-300',
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <Link href="/dashboard/fleet">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Fleet Map <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
          <Link href="/exceptions">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Exceptions <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {activeTab === 'exec' && <ExecutiveView {...viewProps} />}
      {activeTab === 'ops' && <OperationsView {...viewProps} />}
      {activeTab === 'commercial' && <CommercialView {...viewProps} />}

      <CommercialAndCompliancePanels />

      <div className="mt-6">
        <CommandModeSurface
          title="Command Mode — Fleet Signals"
          accentColor="#3b82f6"
          signals={FLEET_SIGNALS}
        />
      </div>

      <MaritimeIntelligencePanels />

      <div className="pb-2">
        <PackBanner
          vertical="Maritime Intelligence Pack"
          description="SEXTANT runs on the KORA + FORGE core — AIS processing, anomaly detection, sanctions screening, and route exception modeling all powered by the same intelligence fabric."
          accentColor="#0ea5e9"
        />
      </div>
    </div>
  );
}

function CommercialAndCompliancePanels() {
  const commercial = [
    {
      label: 'Open Charter Negotiations',
      value: 1,
      sub: 'draft + negotiated fixtures',
      href: '/charter-party',
      icon: FileSignature,
      tone: 'text-sky-300',
      ring: 'border-sky-500/15',
    },
    {
      label: 'Demurrage Accruing',
      value: '$38.8K',
      sub: 'across 2 ongoing/disputed cases',
      href: '/demurrage',
      icon: Clock,
      tone: 'text-amber-300',
      ring: 'border-amber-500/20',
    },
    {
      label: 'Fleet P&I Exposure',
      value: '$900K',
      sub: '2 open H&M / P&I claims',
      href: '/insurance-panel',
      icon: ShieldAlert,
      tone: 'text-orange-300',
      ring: 'border-orange-500/20',
    },
  ];

  const compliance = [
    {
      label: 'Expired STCW Certs',
      value: 2,
      sub: 'Master + Chief Engineer',
      href: '/crew-tracker',
      icon: Users,
      tone: 'text-red-300',
      ring: 'border-red-500/20',
    },
    {
      label: 'Rotations Due Soon',
      value: 1,
      sub: 'urgent — Chief Engineer',
      href: '/crew-tracker',
      icon: Anchor,
      tone: 'text-amber-300',
      ring: 'border-amber-500/20',
    },
    {
      label: 'High-Risk PSC Vessels',
      value: 2,
      sub: 'detentions or ≥5 deficiencies (90d)',
      href: '/psc-inspector',
      icon: Shield,
      tone: 'text-orange-300',
      ring: 'border-orange-500/20',
    },
  ];

  const Card = ({ item }: { item: (typeof commercial)[number] }) => {
    const Icon = item.icon;
    return (
      <Link href={item.href}>
        <div
          className={cn(
            'group rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all border',
            item.ring,
          )}
          style={{ background: 'rgba(10,22,40,0.65)' }}
        >
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.15)',
            }}
          >
            <Icon className="w-3.5 h-3.5 text-sky-300/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-lg font-bold font-display leading-none', item.tone)}>
              {item.value}
            </p>
            <p className="text-[10px] text-sky-400/60 uppercase tracking-wider mt-1">
              {item.label}
            </p>
            <p className="text-[10px] text-sky-400/40 mt-0.5 truncate">{item.sub}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-sky-400/30 group-hover:text-sky-300 shrink-0 transition-colors" />
        </div>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">
            Commercial Risk
          </h3>
          <Link href="/charter-party">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Charter Desk <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="space-y-2">
          {commercial.map((c) => (
            <Card key={c.label} item={c} />
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">
            Crew &amp; Compliance
          </h3>
          <Link href="/psc-inspector">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              PSC Inspector <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="space-y-2">
          {compliance.map((c) => (
            <Card key={c.label} item={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

const DARK_VESSEL_DETECTIONS = [
  {
    vessel: 'Atlantic Pioneer',
    imo: '9876543',
    flag: 'Panama',
    lastKnown: 'Gulf of Guinea',
    darkHours: 6,
    risk: 'high' as const,
    reason: 'AIS blackout in high-risk corridor',
  },
  {
    vessel: 'Eastern Sun',
    imo: '8765432',
    flag: 'Marshall Islands',
    lastKnown: 'Strait of Hormuz',
    darkHours: 3.5,
    risk: 'medium' as const,
    reason: 'Transponder off during STS transfer zone',
  },
  {
    vessel: 'Caspian Hawk',
    imo: '7654321',
    flag: 'Comoros',
    lastKnown: 'Red Sea approach',
    darkHours: 1.2,
    risk: 'low' as const,
    reason: 'Signal gap consistent with equipment issue',
  },
];

const SANCTIONS_FLAGS = [
  {
    vessel: 'Victory Star',
    imo: '6543210',
    flag: 'Togo',
    screen: 'OFAC SDN list match — flagged entity in ownership chain',
    severity: 'critical' as const,
    action: 'Escalate to compliance',
  },
  {
    vessel: 'Northern Passage',
    imo: '5432109',
    flag: 'Hong Kong',
    screen: 'EU restrictive measures — indirect connection via cargo recipient',
    severity: 'high' as const,
    action: 'Legal review required',
  },
  {
    vessel: 'Pacific Breeze',
    imo: '4321098',
    flag: 'Cyprus',
    screen: 'Prior call to sanctioned port — Bandar Abbas, 2024',
    severity: 'medium' as const,
    action: 'Due diligence review',
  },
];

const ROUTE_EXCEPTIONS = [
  {
    vessel: 'MV Northern Star',
    route: 'Hamburg → Singapore',
    deviation: '+34h',
    type: 'Weather routing',
    impact: '$180K demurrage risk',
    status: 'active' as const,
  },
  {
    vessel: 'Caspian Venture',
    route: 'Rotterdam → Gulf',
    deviation: '+8h',
    type: 'Piracy avoidance',
    impact: 'Optional reroute',
    status: 'watch' as const,
  },
  {
    vessel: 'Atlantic Pioneer',
    route: 'Houston → Rotterdam',
    deviation: 'Unknown',
    type: 'Dark vessel — AIS out',
    impact: '$2.1M cargo',
    status: 'critical' as const,
  },
];

function MaritimeIntelligencePanels() {
  const [activePanel, setActivePanel] = useState<'dark' | 'sanctions' | 'routes'>('dark');

  const riskColors = {
    critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
    high: { text: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.15)' },
    medium: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
    low: {
      text: 'rgba(255,255,255,0.4)',
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
    },
    watch: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
    active: { text: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.15)' },
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'rgba(14,165,233,0.10)', background: 'rgba(14,165,233,0.015)' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{
          borderBottom: '1px solid rgba(14,165,233,0.08)',
          background: 'rgba(14,165,233,0.03)',
        }}
      >
        <Navigation className="w-3.5 h-3.5 text-sky-400/70" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400/70">
          Maritime Intelligence
        </span>
        <span
          className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide"
          style={{
            color: 'rgba(245,158,11,0.6)',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.12)',
          }}
        >
          Demo Scenario
        </span>
        <div className="ml-auto flex items-center gap-1">
          {[
            { id: 'dark' as const, label: 'Dark Vessel', icon: EyeOff },
            { id: 'sanctions' as const, label: 'Sanctions', icon: ShieldAlert },
            { id: 'routes' as const, label: 'Route Exceptions', icon: Navigation },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                background: activePanel === id ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: activePanel === id ? '#38bdf8' : 'rgba(148,196,222,0.4)',
                border:
                  activePanel === id ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activePanel === 'dark' && (
          <div className="space-y-2">
            <p
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              AIS Blackout Detection — Vessels with signal gaps in risk corridors
            </p>
            {DARK_VESSEL_DETECTIONS.map((d, i) => {
              const rc = riskColors[d.risk];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <EyeOff className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: rc.text }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-sky-100">{d.vessel}</span>
                      <span className="text-[9px] font-mono text-sky-400/40">IMO {d.imo}</span>
                      <span className="text-[9px] text-sky-400/30">· {d.flag}</span>
                    </div>
                    <p className="text-[10px] text-sky-400/50">{d.reason}</p>
                    <p className="text-[9px] text-sky-400/35 mt-0.5">Last known: {d.lastKnown}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-bold" style={{ color: rc.text }}>
                      {d.darkHours}h dark
                    </div>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase"
                      style={{
                        color: rc.text,
                        background: rc.bg,
                        border: `1px solid ${rc.border}`,
                      }}
                    >
                      {d.risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activePanel === 'sanctions' && (
          <div className="space-y-2">
            <p
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Sanctions Screening — Compliance flags requiring action
            </p>
            {SANCTIONS_FLAGS.map((s, i) => {
              const rc = riskColors[s.severity];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: rc.text }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-sky-100">{s.vessel}</span>
                      <span className="text-[9px] font-mono text-sky-400/40">IMO {s.imo}</span>
                      <span className="text-[9px] text-sky-400/30">· {s.flag}</span>
                    </div>
                    <p className="text-[10px] text-sky-400/50">{s.screen}</p>
                    <p className="text-[9px] mt-1 font-medium" style={{ color: rc.text }}>
                      {s.action}
                    </p>
                  </div>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 mt-0.5"
                    style={{ color: rc.text, background: rc.bg, border: `1px solid ${rc.border}` }}
                  >
                    {s.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activePanel === 'routes' && (
          <div className="space-y-2">
            <p
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Route Exception Modeling — Deviations from planned voyage parameters
            </p>
            {ROUTE_EXCEPTIONS.map((r, i) => {
              const rc = riskColors[r.status];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <Navigation className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: rc.text }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-sky-100">{r.vessel}</span>
                      <span className="text-[9px] text-sky-400/40">{r.route}</span>
                    </div>
                    <p className="text-[10px] text-sky-400/50">
                      {r.type} · deviation: {r.deviation}
                    </p>
                    <p className="text-[9px] mt-0.5 font-mono" style={{ color: rc.text }}>
                      {r.impact}
                    </p>
                  </div>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 mt-0.5"
                    style={{ color: rc.text, background: rc.bg, border: `1px solid ${rc.border}` }}
                  >
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const FLEET_SIGNALS: CommandModeSignal[] = [
  {
    id: 'vs-001',
    level: 'critical',
    what: 'Atlantic Pioneer — AIS transponder silent for 6h in high-risk corridor',
    why: 'Vessel last reported position in Gulf of Guinea. No signal for 6 hours exceeds 4h threshold. Pattern consistent with dark vessel behaviour or equipment failure.',
    owner: 'Operations Desk',
    next: 'Initiate contact via satellite phone. Alert flag state if no response within 2h.',
    valueAtRisk: '$2.1M cargo',
    category: 'Dark Vessel',
  },
  {
    id: 'vs-002',
    level: 'high',
    what: 'MV Northern Star — ETA deviation of 34h on Hamburg–Singapore route',
    why: 'Weather system in Indian Ocean forcing reroute. Fuel burn increase of ~18%. Charter party deadline at risk — demurrage clause activates after 48h delay.',
    owner: 'Captain Rodrigues',
    next: 'Reroute via Alloy weather model. Notify charterer of revised ETA.',
    valueAtRisk: '$180K demurrage',
    category: 'Voyage',
  },
  {
    id: 'vs-003',
    level: 'high',
    what: 'Pacific Meridian — main engine overdue for 500h inspection by 120h',
    why: 'Class society inspection window expired. Continued operation risks insurance coverage lapse and port state detention at next call.',
    owner: 'Fleet Technical',
    next: 'Schedule emergency dry dock at next port of call (Singapore ETA 3 days)',
    category: 'Maintenance',
  },
  {
    id: 'vs-004',
    level: 'medium',
    what: 'Caspian Venture — bunker fuel quality below ISO 8217 threshold',
    why: 'Lab results from Rotterdam bunkering show sulphur content at 0.52% vs 0.50% MARPOL limit. Non-compliance risk at next ECA transit.',
    owner: 'Bunker Desk',
    next: 'Switch to compliant tank before Dover Strait ECA entry',
    category: 'Compliance',
  },
];
