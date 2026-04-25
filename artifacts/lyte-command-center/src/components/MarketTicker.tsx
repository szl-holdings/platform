import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { MacroIndicator, MarketDataSnapshot } from '@/data/market-api';

interface MarketTickerProps {
  snapshot: MarketDataSnapshot;
  compact?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const CATEGORY_ORDER: MacroIndicator['category'][] = ['equity', 'fx', 'commodity', 'rates'];

const CATEGORY_LABEL: Record<MacroIndicator['category'], string> = {
  equity: 'Equities',
  fx: 'FX',
  commodity: 'Commodities',
  rates: 'Rates',
};

const DATA_QUALITY_BADGE: Record<MacroIndicator['dataQuality'], { label: string; color: string }> =
  {
    live: { label: 'Live', color: 'text-emerald-400' },
    delayed: { label: '15-min delay', color: 'text-amber-400' },
    eod: { label: 'EOD', color: 'text-sky-400' },
    monthly: { label: 'Monthly', color: 'text-purple-400' },
    seed: { label: 'Seed', color: 'text-slate-400' },
  };

function formatChange(change: number | null, changePct: number | null): string | null {
  if (change == null && changePct == null) return null;
  const pctStr = changePct != null ? `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%` : '';
  const valStr = change != null ? `${change > 0 ? '+' : ''}${change.toFixed(3)}` : '';
  if (pctStr && valStr) return `${valStr} (${pctStr})`;
  return pctStr || valStr;
}

function formatAsOf(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 1) return `${Math.floor(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function IndicatorPill({ ind }: { ind: MacroIndicator }) {
  const changeStr = formatChange(ind.change, ind.changePct);
  const isPositive = (ind.change ?? ind.changePct ?? 0) > 0;
  const isNegative = (ind.change ?? ind.changePct ?? 0) < 0;
  const changeColor = isPositive
    ? 'text-emerald-400'
    : isNegative
      ? 'text-red-400'
      : 'text-amber-400/60';
  const badge = DATA_QUALITY_BADGE[ind.dataQuality];

  return (
    <div
      className={`cockpit-panel px-3 py-2 flex flex-col gap-0.5 min-w-[130px] ${
        ind.isStale ? 'border border-red-500/30' : ''
      }`}
      title={`${ind.provider} · ${ind.delayWindow} · as of ${new Date(ind.asOf).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono text-amber-400/40 uppercase tracking-wide">
          {ind.label}
        </span>
        {ind.isStale && <AlertTriangle className="w-2.5 h-2.5 text-red-400" aria-label="stale" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-mono font-semibold text-amber-200">
          {ind.formattedValue}
        </span>
        {changeStr && (
          <span className={`text-[9px] font-mono ${changeColor}`}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" /> : isNegative ? <TrendingDown className="w-2.5 h-2.5 inline mr-0.5" /> : null}
            {changeStr}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-[8px] font-mono ${badge.color}`}>{ind.delayWindow}</span>
        <span className="text-[8px] font-mono text-amber-400/30">·</span>
        <span className="text-[8px] font-mono text-amber-400/30">{ind.provider}</span>
        <span className="text-[8px] font-mono text-amber-400/30">·</span>
        <span className="text-[8px] font-mono text-amber-400/30">{formatAsOf(ind.asOf)}</span>
      </div>
    </div>
  );
}

export function MarketTicker({
  snapshot,
  compact = false,
  onRefresh,
  isRefreshing,
}: MarketTickerProps) {
  const [activeCategory, setActiveCategory] = useState<MacroIndicator['category'] | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? snapshot.indicators
      : snapshot.indicators.filter((i) => i.category === activeCategory);

  const sorted = [...filtered].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  const staleCount = snapshot.indicators.filter((i) => i.isStale).length;
  const isSeedMode = snapshot.provider === 'seed';

  if (compact) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
        {snapshot.indicators.slice(0, 6).map((ind) => (
          <div
            key={ind.id}
            className="flex flex-col shrink-0"
            title={`${ind.provider} · ${ind.delayWindow} · as of ${new Date(ind.asOf).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET`}
            data-provider={ind.provider}
            data-delay-window={ind.delayWindow}
            data-as-of={ind.asOf}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-amber-400/50">{ind.label}</span>
              <span className="text-[9px] font-mono text-amber-200 font-semibold">
                {ind.formattedValue}
              </span>
              {ind.changePct != null && (
                <span
                  className={`text-[9px] font-mono ${
                    ind.changePct > 0
                      ? 'text-emerald-400'
                      : ind.changePct < 0
                        ? 'text-red-400'
                        : 'text-amber-400/50'
                  }`}
                >
                  {ind.changePct > 0 ? '+' : ''}
                  {ind.changePct.toFixed(2)}%
                </span>
              )}
              {ind.isStale && <AlertTriangle className="w-2.5 h-2.5 text-red-400" aria-label="stale" />}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-mono text-amber-400/25">{ind.delayWindow}</span>
              <span className="text-[7px] font-mono text-amber-400/20">·</span>
              <span className="text-[7px] font-mono text-amber-400/25">{ind.provider}</span>
              <span className="text-[7px] font-mono text-amber-400/20">·</span>
              <span className="text-[7px] font-mono text-amber-400/25">{formatAsOf(ind.asOf)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="cockpit-panel p-4 space-y-3">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-mono text-amber-400/40 uppercase tracking-widest">
            Macro Indicators
          </h3>
          {isSeedMode && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
              SEED · Configure ALPHA_VANTAGE_API_KEY
            </span>
          )}
          {staleCount > 0 && !isSeedMode && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/25">
              {staleCount} STALE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['all', ...CATEGORY_ORDER] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as typeof activeCategory)}
                className={`text-[8px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  activeCategory === cat
                    ? 'bg-amber-400/20 text-amber-300'
                    : 'text-amber-400/30 hover:text-amber-400/60'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABEL[cat as MacroIndicator['category']]}
              </button>
            ))}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-amber-400/30 hover:text-amber-400 transition-colors disabled:opacity-30"
              title="Refresh market data"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {sorted.map((ind) => (
          <IndicatorPill key={ind.id} ind={ind} />
        ))}
      </div>

      <footer className="flex items-center gap-2 text-[8px] font-mono text-amber-400/25">
        <span>
          {snapshot.providerConfigured ? snapshot.provider : 'Seed data'}
        </span>
        <span>·</span>
        <span>
          Refreshed {formatAsOf(snapshot.refreshedAt)}
        </span>
        {snapshot.cacheAgeSeconds > 0 && (
          <>
            <span>·</span>
            <span>Cache {Math.floor(snapshot.cacheAgeSeconds / 60)}m old</span>
          </>
        )}
      </footer>
    </section>
  );
}
