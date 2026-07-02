import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  FileDown,
  FileText,
  Fuel,
  Loader2,
  Ship,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useVoyageEconomicsAnalytics, useVoyages, type VoyageRow } from '@/hooks/use-vessels-data';
import {
  compareVoyageToBenchmark,
  inferVesselClassFromCargo,
  useFreightBenchmarks,
  type VesselClassKey,
} from '../lib/freight-benchmarks';
import { exportVoyagesToCsv, exportVoyagesToPdf } from '../lib/voyage-export';

const charterColors: Record<string, string> = {
  time_charter: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  voyage_charter: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  spot: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  bareboat: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const statusColors: Record<string, string> = {
  at_sea: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  loading: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  completed: 'text-sky-300 bg-sky-500/5 border-sky-500/10',
  planned: 'text-sky-400/50 bg-sky-500/5 border-sky-500/10',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function CostBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-sky-400/50">{label}</span>
        <span className="text-[10px] font-mono text-sky-300">
          ${(value / 1000).toFixed(0)}K <span className="text-sky-400/40">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VoyageCard({ voyage }: { voyage: VoyageRow }) {
  const [expanded, setExpanded] = useState(false);
  const marginPct = voyage.marginPct * 100;
  const isPositiveMargin = voyage.marginEstimate > 0;
  const totalCosts = voyage.operatingCost || 0;
  const fuelCost = voyage.fuelCost || 0;
  const portCost = voyage.portCost || 0;
  const delayCost = voyage.delayCost || 0;

  // Freight benchmarking — same live market comparison used on Voyage P&L.
  const { data: benchmarkSnapshot } = useFreightBenchmarks();
  // Prefer the actual vessel class from the API; only fall back to a
  // cargo-based heuristic when the class is genuinely unknown.
  const vesselClass: VesselClassKey | null =
    (voyage.vesselClass as VesselClassKey | null | undefined) ??
    inferVesselClassFromCargo(voyage.cargoType);
  const benchmark = compareVoyageToBenchmark(benchmarkSnapshot, vesselClass, voyage.tce || 0);

  return (
    <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden hover:border-sky-500/20 transition-all">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-sky-100">
                  {voyage.voyageRef || `Voyage #${voyage.voyageId}`}
                </p>
                <Badge
                  variant="outline"
                  className={cn('text-[9px]', charterColors[voyage.charterType] ?? '')}
                >
                  {voyage.charterType?.replace('_', ' ')}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-[9px]', statusColors[voyage.status] ?? '')}
                >
                  {voyage.status?.replace('_', ' ')}
                </Badge>
                {voyage.delayHours > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] text-orange-400 bg-orange-500/10 border-orange-500/20"
                  >
                    +{Math.round(voyage.delayHours)}h delay
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-sky-400/50 mt-0.5">{voyage.route}</p>
              <p className="text-[10px] text-sky-400/30 mt-0.5">
                {voyage.cargoType}
                {voyage.distanceNm ? ` · ${Math.round(voyage.distanceNm).toLocaleString()} nm` : ''}
                {voyage.durationDays ? ` · ${Number(voyage.durationDays).toFixed(1)} days` : ''}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-sky-100">
                {voyage.estimatedRevenue > 0
                  ? `$${(voyage.estimatedRevenue / 1e6).toFixed(2)}M`
                  : '—'}
              </p>
              <p className="text-[10px] text-sky-400/50">
                {marginPct > 0 ? `${marginPct.toFixed(1)}% margin` : 'margin n/a'}
              </p>
              {voyage.marginEstimate !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-1 justify-end mt-1 text-[10px] font-mono',
                    isPositiveMargin ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {isPositiveMargin ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isPositiveMargin ? '+' : ''}
                  {(voyage.marginEstimate / 1000).toFixed(0)}K net
                </div>
              )}
              {benchmark && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1 justify-end mt-1 px-1.5 py-0.5 rounded border text-[10px] font-mono',
                    benchmark.aboveMarket
                      ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5'
                      : 'text-red-300 border-red-500/20 bg-red-500/5',
                  )}
                  title={`Voyage TCE $${(benchmark.voyageTce / 1000).toFixed(1)}K/day vs Baltic ${benchmark.classKey} $${(benchmark.benchmark.tce / 1000).toFixed(1)}K/day`}
                >
                  <Activity className="w-3 h-3" />
                  vs Market: {benchmark.aboveMarket ? '+' : ''}
                  {benchmark.deltaPct.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {[
              {
                label: 'Revenue',
                value:
                  voyage.estimatedRevenue > 0
                    ? `$${(voyage.estimatedRevenue / 1e6).toFixed(2)}M`
                    : '—',
                icon: DollarSign,
                color: 'text-emerald-400',
              },
              {
                label: 'Total Cost',
                value: totalCosts > 0 ? `$${(totalCosts / 1e6).toFixed(2)}M` : '—',
                icon: BarChart3,
                color: 'text-amber-400',
              },
              {
                label: 'TCE/day',
                value: voyage.tce > 0 ? `$${(voyage.tce / 1000).toFixed(1)}K` : '—',
                icon: TrendingUp,
                color: 'text-sky-400',
              },
              {
                label: 'Fuel Cost',
                value: fuelCost > 0 ? `$${(fuelCost / 1000).toFixed(0)}K` : '—',
                icon: Fuel,
                color: 'text-violet-400',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10"
              >
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
                <p className={cn('text-xs font-mono font-bold mt-0.5', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-4 space-y-4">
          {totalCosts > 0 && (
            <div>
              <h4 className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3">
                Cost Breakdown
              </h4>
              <div className="space-y-2">
                <CostBar label="Fuel" value={fuelCost} total={totalCosts} color="bg-amber-400" />
                <CostBar
                  label="Port Costs"
                  value={portCost}
                  total={totalCosts}
                  color="bg-sky-400"
                />
                {delayCost > 0 && (
                  <CostBar
                    label="Delay Impact"
                    value={delayCost}
                    total={totalCosts}
                    color="bg-orange-400"
                  />
                )}
                <CostBar
                  label="Other Op Ex"
                  value={Math.max(totalCosts - fuelCost - portCost - delayCost, 0)}
                  total={totalCosts}
                  color="bg-violet-400"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Fuel Impact</p>
              <p className="text-xs font-mono text-amber-400 mt-1">
                ${(fuelCost / 1000).toFixed(0)}K
              </p>
              <p className="text-[9px] text-sky-400/40">fuel cost</p>
            </div>
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Port Cost</p>
              <p className="text-xs font-mono text-sky-300 mt-1">
                ${(portCost / 1000).toFixed(0)}K
              </p>
              <p className="text-[9px] text-sky-400/40">incl. dues and fees</p>
            </div>
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Delay Impact</p>
              <p
                className={cn(
                  'text-xs font-mono mt-1',
                  delayCost > 0 ? 'text-orange-400' : 'text-emerald-400',
                )}
              >
                {delayCost > 0 ? `$${(delayCost / 1000).toFixed(0)}K` : 'None'}
              </p>
              <p className="text-[9px] text-sky-400/40">
                {voyage.delayHours > 0 ? `${Math.round(voyage.delayHours)}h delay` : 'On schedule'}
              </p>
            </div>
          </div>

          {marginPct !== 0 && (
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
                Margin Performance
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      marginPct >= 30
                        ? 'bg-emerald-400'
                        : marginPct >= 10
                          ? 'bg-sky-400'
                          : 'bg-red-400',
                    )}
                    style={{ width: `${Math.min(Math.max(marginPct * 2, 5), 95)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-mono font-bold shrink-0',
                    isPositiveMargin ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {marginPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] text-sky-400/40 mt-1">
                {marginPct > 30
                  ? 'Strong margin — outperforming benchmark'
                  : marginPct > 10
                    ? 'Acceptable margin'
                    : marginPct > 0
                      ? 'Thin margin — monitor closely'
                      : 'Loss voyage — review required'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoyageEconomicsPage() {
  const { voyageEconomics, isLive, isLoading } = useVoyages();
  const { data: analytics } = useVoyageEconomicsAnalytics();
  const [sortBy, setSortBy] = useState<'margin' | 'tce' | 'revenue'>('margin');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered =
    statusFilter === 'all'
      ? voyageEconomics
      : voyageEconomics.filter((v) => v.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'margin') return (b.marginEstimate || 0) - (a.marginEstimate || 0);
    if (sortBy === 'tce') return (b.tce || 0) - (a.tce || 0);
    return (b.estimatedRevenue || 0) - (a.estimatedRevenue || 0);
  });

  const totalRevenue = voyageEconomics.reduce((a, v) => a + (v.estimatedRevenue || 0), 0);
  const totalMargin = voyageEconomics.reduce((a, v) => a + (v.marginEstimate || 0), 0);
  const totalFuel = voyageEconomics.reduce((a, v) => a + (v.fuelCost || 0), 0);
  const totalDelay = voyageEconomics.reduce((a, v) => a + (v.delayCost || 0), 0);
  const tceVoyages = voyageEconomics.filter((v) => v.tce > 0);
  const avgTCE =
    tceVoyages.length > 0 ? tceVoyages.reduce((a, v) => a + v.tce, 0) / tceVoyages.length : 0;

  const statusCounts = voyageEconomics.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const exportContext = {
    voyages: sorted,
    filter: statusFilter,
    sort: sortBy,
    totals: {
      revenue: totalRevenue,
      margin: totalMargin,
      fuelCost: totalFuel,
      delayCost: totalDelay,
      avgTce: avgTCE,
      voyageCount: sorted.length,
    },
    topRoutes: analytics?.topRoutes,
  };

  const handleExportCsv = () => exportVoyagesToCsv(exportContext);
  const handleExportPdf = () => exportVoyagesToPdf(exportContext);
  const exportDisabled = isLoading || sorted.length === 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50">Voyage Economics</h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            {isLive
              ? `${voyageEconomics.length} voyages from live database`
              : 'Revenue, margin, and cost performance'}{' '}
            across fleet operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportDisabled}
            data-testid="voyage-export-csv"
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all',
              'bg-sky-500/10 border-sky-500/30 text-sky-200 hover:bg-sky-500/20',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            title={`Export ${sorted.length} voyages to CSV`}
          >
            <FileDown className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportDisabled}
            data-testid="voyage-export-pdf"
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all',
              'bg-violet-500/10 border-violet-500/30 text-violet-200 hover:bg-violet-500/20',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            title="Open printable summary (Save as PDF from print dialog)"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Fleet Revenue',
            value: `$${(totalRevenue / 1e6).toFixed(1)}M`,
            color: 'text-emerald-400',
            icon: DollarSign,
            sub: `${voyageEconomics.length} voyages`,
          },
          {
            label: 'Fleet Margin',
            value: `$${(totalMargin / 1e6).toFixed(1)}M`,
            color: 'text-sky-300',
            icon: TrendingUp,
            sub: totalRevenue > 0 ? `${((totalMargin / totalRevenue) * 100).toFixed(1)}% avg` : '—',
          },
          {
            label: 'Avg Fleet TCE',
            value: avgTCE > 0 ? `$${(avgTCE / 1000).toFixed(1)}K/d` : '—',
            color: 'text-violet-400',
            icon: BarChart3,
            sub: 'per vessel/day',
          },
          {
            label: 'Delay Exposure',
            value: `$${(totalDelay / 1000).toFixed(0)}K`,
            color: 'text-orange-400',
            icon: Clock,
            sub: 'fleet-wide cost',
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={cn('w-4 h-4', s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {analytics?.revenueByMonth && analytics.revenueByMonth.length > 0 && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-4">
            Monthly Revenue vs Cost (12-Month Rolling)
          </h3>
          <div className="flex items-end gap-1 h-24">
            {analytics.revenueByMonth
              .slice(-12)
              .map((month: { month: string; revenue: number; costs: number }) => {
                const maxVal = Math.max(
                  ...analytics.revenueByMonth.map((m: { revenue: number }) => m.revenue),
                );
                const revH = maxVal > 0 ? (month.revenue / maxVal) * 100 : 0;
                const costH = maxVal > 0 ? (month.costs / maxVal) * 100 : 0;
                return (
                  <div key={month.month} className="flex-1 flex items-end gap-0.5 group">
                    <div
                      className="flex-1 bg-emerald-500/20 rounded-t"
                      style={{ height: `${revH}%` }}
                      title={`Revenue: $${(month.revenue / 1e6).toFixed(1)}M`}
                    />
                    <div
                      className="flex-1 bg-red-500/20 rounded-t"
                      style={{ height: `${costH}%` }}
                      title={`Cost: $${(month.costs / 1e6).toFixed(1)}M`}
                    />
                  </div>
                );
              })}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] text-sky-400/40">
                <span className="w-2 h-2 rounded-sm bg-emerald-500/40 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1 text-[9px] text-sky-400/40">
                <span className="w-2 h-2 rounded-sm bg-red-500/40 inline-block" />
                Cost
              </span>
            </div>
            <span className="text-[9px] text-sky-400/30">
              {analytics.revenueByMonth.length} months of data
            </span>
          </div>
        </div>
      )}

      {analytics?.topRoutes && analytics.topRoutes.length > 0 && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-4">
            Top Routes by Revenue
          </h3>
          <div className="space-y-3">
            {analytics.topRoutes.slice(0, 8).map(
              (
                r: {
                  route: string;
                  voyages: number;
                  totalRevenue: number;
                  avgTce: number;
                  avgMargin: number;
                },
                i: number,
              ) => {
                const maxRev = analytics.topRoutes[0]?.totalRevenue || 1;
                return (
                  <div key={r.route} className="flex items-center gap-3">
                    <span className="text-[10px] text-sky-400/30 w-4 shrink-0">{i + 1}</span>
                    <div className="w-40 shrink-0">
                      <p className="text-[10px] text-sky-200 truncate">{r.route}</p>
                      <p className="text-[9px] text-sky-400/40">{r.voyages} voyages</p>
                    </div>
                    <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: `${(r.totalRevenue / maxRev) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 w-16 text-right">
                      ${(r.totalRevenue / 1e6).toFixed(1)}M
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 w-12 text-right">
                      {r.avgMargin > 0 ? `+$${(r.avgMargin / 1000).toFixed(0)}K` : '—'}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-sky-400/40">Filter:</span>
          {[
            { id: 'all', label: `All (${voyageEconomics.length})` },
            { id: 'at_sea', label: `At Sea (${statusCounts.at_sea || 0})` },
            { id: 'completed', label: `Completed (${statusCounts.completed || 0})` },
            { id: 'planned', label: `Planned (${statusCounts.planned || 0})` },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={cn(
                'text-[10px] px-2.5 py-1.5 rounded-lg border transition-all',
                statusFilter === opt.id
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-sky-400/40">Sort by:</span>
          {[
            { id: 'margin', label: 'Margin' },
            { id: 'tce', label: 'TCE/day' },
            { id: 'revenue', label: 'Revenue' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id as typeof sortBy)}
              className={cn(
                'text-[10px] px-2.5 py-1.5 rounded-lg border transition-all',
                sortBy === opt.id
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin mr-2" />
          <span className="text-sm text-sky-400/50">Loading voyage economics...</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <Ship className="w-8 h-8 text-sky-400/20 mx-auto mb-2" />
          <p className="text-sm text-sky-400/40">No voyages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 30).map((v) => (
            <VoyageCard key={v.voyageId} voyage={v} />
          ))}
          {sorted.length > 30 && (
            <p className="text-center text-[10px] text-sky-400/30 py-2">
              Showing 30 of {sorted.length} voyages
            </p>
          )}
        </div>
      )}
    </div>
  );
}
