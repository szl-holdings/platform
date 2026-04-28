import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Eye,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import {
  TIER_CONFIG,
  type PortfolioSanctionsHolding,
} from '@/data/sanctions-network-data';
import { useSanctionsPortfolio } from '@/hooks/use-vessels-data';

type TierFilter = 'all' | 'critical' | 'high' | 'watch' | 'clear';

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.clear!;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border',
        cfg.color,
        cfg.bg,
        cfg.border,
      )}
    >
      {tier === 'critical' || tier === 'high' ? (
        <ShieldAlert className="w-2.5 h-2.5" />
      ) : (
        <Shield className="w-2.5 h-2.5" />
      )}
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score, tier }: { score: number; tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.clear!;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: cfg.dot }}
        />
      </div>
      <span className={cn('text-xs font-mono font-bold w-7 text-right', cfg.color)}>{score}</span>
    </div>
  );
}

function HoldingRow({ holding }: { holding: PortfolioSanctionsHolding }) {
  const tierCfg = TIER_CONFIG[holding.tier] ?? TIER_CONFIG.clear!;
  const ago = (() => {
    const diff = Date.now() - new Date(holding.lastUpdated).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();

  return (
    <div
      data-testid={`holding-row-${holding.vesselId}`}
      data-tier={holding.tier}
      data-score={holding.score}
      className={cn(
        'grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 border-b border-slate-700/30 hover:bg-slate-700/10 transition-colors',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/vessel/${holding.vesselId}`}>
            <span className="text-sm font-semibold text-slate-100 hover:text-sky-300 transition-colors cursor-pointer">
              {holding.vesselName}
            </span>
          </Link>
          {holding.sanctionedNetworkNodes > 0 && (
            <Badge className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20 px-1">
              {holding.sanctionedNetworkNodes} sanctioned node{holding.sanctionedNetworkNodes > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-500 font-mono">{holding.imo}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[10px] text-slate-500">{holding.flag}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[10px] text-slate-500">{holding.vesselType}</span>
        </div>
      </div>

      <div>
        <TierBadge tier={holding.tier} />
      </div>

      <div className="pr-2">
        <ScoreBar score={holding.score} tier={holding.tier} />
      </div>

      <div className="text-xs text-slate-400 truncate">{holding.owner}</div>

      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] px-1 py-0.5 rounded',
            holding.dataSource === 'live'
              ? 'text-emerald-400'
              : 'text-amber-400',
          )}
        >
          {holding.dataSource === 'live' ? (
            <Radio className="w-2.5 h-2.5" />
          ) : (
            <Database className="w-2.5 h-2.5" />
          )}
          {holding.dataSource === 'live' ? 'Live' : 'Sim'}
        </div>
        <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />{ago}
        </span>
      </div>

      <div>
        <Link href={`/vessel/${holding.vesselId}`}>
          <button className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400/60 hover:text-sky-300 hover:bg-sky-500/20 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

function HeatCell({ score, tier, label }: { score: number; tier: string; label: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.clear!;
  const opacity = score === 0 ? 0.05 : 0.08 + (score / 100) * 0.55;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg p-2 border transition-all',
        cfg.border,
      )}
      style={{ backgroundColor: `${cfg.dot}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` }}
    >
      <div className={cn('text-lg font-bold font-mono', cfg.color)}>{score}</div>
      <div className="text-[9px] text-slate-400 text-center leading-tight mt-0.5">{label}</div>
    </div>
  );
}

export default function SanctionsHeatPage() {
  const [filter, setFilter] = useState<TierFilter>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  const { holdings, refetch, isLoading } = useSanctionsPortfolio();

  const filtered = holdings
    .filter((h) => filter === 'all' || h.tier === filter)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return a.vesselName.localeCompare(b.vesselName);
    });

  const criticalCount = holdings.filter((h) => h.tier === 'critical').length;
  const highCount = holdings.filter((h) => h.tier === 'high').length;
  const watchCount = holdings.filter((h) => h.tier === 'watch').length;
  const clearCount = holdings.filter((h) => h.tier === 'clear').length;
  const avgScore = Math.round(holdings.reduce((s, h) => s + h.score, 0) / holdings.length);
  const totalSanctionedNodes = holdings.reduce((s, h) => s + h.sanctionedNetworkNodes, 0);
  const portfolioHullValue = holdings.reduce((s, h) => s + h.hullValue, 0);
  const exposedHullValue = holdings
    .filter((h) => h.tier === 'critical' || h.tier === 'high')
    .reduce((s, h) => s + h.hullValue, 0);

  const TIER_FILTERS: { id: TierFilter; label: string }[] = [
    { id: 'all', label: 'All SEXTANT' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'watch', label: 'Watch' },
    { id: 'clear', label: 'Clear' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-sky-50 flex items-center gap-3">
            <Shield className="w-6 h-6 text-sky-400" />
            Sanctions Heat
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Portfolio-level sanctions exposure aggregated by vessel holding. Powered by the
            SEXTANT rules engine — OFAC SDN, EU Consolidated, UK OFSI, UN Security Council, and
            internal dark-fleet rules.
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-sky-400/60 hover:text-sky-300 px-2 py-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh scores
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5" />
            Portfolio Avg Score
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{avgScore}</div>
          <div className="text-[10px] text-slate-600">of 100 — {holdings.length} vessels</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5" />
            High/Critical
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {criticalCount + highCount}
          </div>
          <div className="text-[10px] text-slate-600">vessels requiring review</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            Sanctioned Network Nodes
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">{totalSanctionedNodes}</div>
          <div className="text-[10px] text-slate-600">across ownership chains</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Eye className="w-3.5 h-3.5" />
            Hull Value at Risk
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            ${(exposedHullValue / 1e6).toFixed(0)}M
          </div>
          <div className="text-[10px] text-slate-600">
            of ${(portfolioHullValue / 1e6).toFixed(0)}M total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {holdings.slice().sort((a, b) => b.score - a.score).map((h) => (
          <HeatCell
            key={h.vesselId}
            score={h.score}
            tier={h.tier}
            label={h.vesselName.split(' ')[0] ?? h.vesselName}
          />
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            {TIER_FILTERS.map((f) => {
              const count = f.id === 'all'
                ? holdings.length
                : holdings.filter((h) => h.tier === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg border transition-all',
                    filter === f.id
                      ? 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                      : 'border-slate-700/50 text-slate-400 hover:text-slate-300',
                  )}
                >
                  {f.label}
                  {count > 0 && (
                    <span className="ml-1 text-[10px] opacity-60">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Sort:</span>
            <button
              onClick={() => setSortBy('score')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded border transition-all',
                sortBy === 'score'
                  ? 'text-sky-300 border-sky-500/30 bg-sky-500/10'
                  : 'text-slate-500 border-slate-700/30',
              )}
            >
              Score
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded border transition-all',
                sortBy === 'name'
                  ? 'text-sky-300 border-sky-500/30 bg-sky-500/10'
                  : 'text-slate-500 border-slate-700/30',
              )}
            >
              Name
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-slate-700/30">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Vessel</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tier</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Owner</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Source</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500 text-sm">
            No vessels match this filter.
          </div>
        ) : (
          filtered.map((h) => <HoldingRow key={h.vesselId} holding={h} />)
        )}
      </div>

      <div className="flex items-start gap-3 bg-slate-800/40 border border-slate-700/40 rounded-lg px-4 py-3 text-[11px] text-slate-500">
        <Zap className="w-3.5 h-3.5 text-sky-500/60 shrink-0 mt-0.5" />
        <span>
          Sanctions Heat scores are computed by the SEXTANT rules engine every 15 minutes against
          OFAC SDN, EU Consolidated, UK OFSI, and UN Security Council lists. SEXTANT marked{' '}
          <span className="text-amber-400">Simulated</span> have not yet received a live AIS feed
          confirmation — scores derive from cached ownership intelligence. Scores above 70 should
          be reviewed by compliance before the next port call. Hits above 85 automatically open
          a Counsel matter for legal review when the Rules Studio integration is active.
        </span>
      </div>
    </div>
  );
}
