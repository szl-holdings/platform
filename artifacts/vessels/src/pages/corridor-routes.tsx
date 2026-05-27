import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Clock,
  Minus,
  Navigation,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { api, type Corridor } from '@/lib/api';

const weatherRiskColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  severe: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const congestionColors: Record<string, string> = {
  low: 'text-emerald-400',
  moderate: 'text-amber-400',
  high: 'text-orange-400',
};

const trendIcons: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-[#8a8a8a]',
};

function getNum(val: string | number | undefined, def: number): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    return Number.isNaN(n) ? def : n;
  }
  return def;
}

export default function CorridorRoutesPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const {
    data: liveCorridor = [],
    isLoading,
    refetch,
  } = useStandardQuery({
    queryKey: ['vessels-corridors'],
    queryFn: () => api.corridors.list(),
    refetchInterval: 120_000,
  });

  const corridors: Corridor[] = liveCorridor;

  const selectedCorridor = selected ? corridors.find((c) => String(c.id) === selected) : undefined;
  const avgDelay =
    corridors.length > 0
      ? corridors.reduce((a, c) => a + getNum(c.delayRate, 0), 0) / corridors.length
      : 0;
  const highAlerts = corridors.filter((c) => c.activeAlerts > 0).length;
  const isLive = liveCorridor.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-[#f5f5f5]">Corridor Routes</h1>
            {isLive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono uppercase">
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-[#8a8a8a] mt-0.5">
            Global shipping corridor analysis — delay rates, profitability, and risk conditions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-white/[0.06] text-[#8a8a8a] hover:text-[#d4c598] hover:border-white/[0.08] transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Corridors',
            value: corridors.length,
            color: 'text-[#c9b787]',
            icon: Navigation,
          },
          {
            label: 'Corridors with Alerts',
            value: highAlerts,
            color: highAlerts > 0 ? 'text-orange-400' : 'text-emerald-400',
            icon: AlertTriangle,
          },
          {
            label: 'Avg Delay Rate',
            value: `${avgDelay.toFixed(1)}%`,
            color: avgDelay > 20 ? 'text-orange-400' : 'text-emerald-400',
            icon: Clock,
          },
          {
            label: 'Total Alert Count',
            value: corridors.reduce((a, c) => a + c.activeAlerts, 0),
            color: 'text-violet-400',
            icon: Activity,
            sub: 'across all corridors',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3"
          >
            <s.icon className={cn('w-5 h-5 shrink-0', s.color)} />
            <div>
              <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
              <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider">
            Corridor Performance
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-[#c9b787]/8 border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : (
            [...corridors]
              .sort((a, b) => getNum(b.profitabilityIndex, 50) - getNum(a.profitabilityIndex, 50))
              .map((corridor) => {
                const profitIdx = getNum(corridor.profitabilityIndex, 50);
                const delayRate = getNum(corridor.delayRate, 0);
                const trend = corridor.trend in trendIcons ? corridor.trend : 'stable';
                const TrendIcon = trendIcons[trend];
                const isSelected = selected === String(corridor.id);
                return (
                  <button
                    key={corridor.id}
                    onClick={() => setSelected(isSelected ? null : String(corridor.id))}
                    className={cn(
                      'w-full text-left bg-white/[0.02] border rounded-xl p-4 hover:border-white/[0.08] transition-all',
                      isSelected ? 'border-[#c9b787]/24 bg-[#c9b787]/8' : 'border-white/[0.06]',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#f5f5f5]">{corridor.name}</p>
                          {corridor.activeAlerts > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-orange-400 bg-orange-500/10 border-orange-500/20"
                            >
                              {corridor.activeAlerts} alert{corridor.activeAlerts > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px]',
                              weatherRiskColors[corridor.weatherRisk] ?? 'text-[#c9b787]',
                            )}
                          >
                            {corridor.weatherRisk} weather
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#8a8a8a] mt-0.5">
                          {corridor.origin} → {corridor.destination}
                        </p>
                        {(corridor.commodity || corridor.region) && (
                          <p className="text-[10px] text-[#5a5a5a] mt-0.5">
                            {corridor.commodity} · {corridor.region}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            'text-lg font-bold font-mono',
                            profitIdx >= 70
                              ? 'text-emerald-400'
                              : profitIdx >= 50
                                ? 'text-amber-400'
                                : 'text-red-400',
                          )}
                        >
                          {profitIdx}
                        </p>
                        <p className="text-[9px] text-[#6a6a6a]">profit index</p>
                        <div
                          className={cn(
                            'flex items-center gap-1 justify-end mt-1',
                            trendColors[trend],
                          )}
                        >
                          <TrendIcon className="w-3 h-3" />
                          <span className="text-[9px] capitalize">{trend}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                      <div className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]">
                        <p className="text-[9px] text-[#5a5a5a]">Vessels</p>
                        <p className="text-[11px] font-mono text-[#d4c598]">{corridor.vesselCount}</p>
                      </div>
                      <div className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]">
                        <p className="text-[9px] text-[#5a5a5a]">Transit</p>
                        <p className="text-[11px] font-mono text-[#d4c598]">
                          {corridor.avgTransitDays ?? '—'}d
                        </p>
                      </div>
                      <div className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]">
                        <p className="text-[9px] text-[#5a5a5a]">Delay</p>
                        <p
                          className={cn(
                            'text-[11px] font-mono',
                            delayRate >= 30
                              ? 'text-red-400'
                              : delayRate >= 15
                                ? 'text-amber-400'
                                : 'text-emerald-400',
                          )}
                        >
                          {delayRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]">
                        <p className="text-[9px] text-[#5a5a5a]">Congestion</p>
                        <p
                          className={cn(
                            'text-[11px] font-mono capitalize',
                            congestionColors[corridor.portCongestionRisk] ?? 'text-[#d4c598]',
                          )}
                        >
                          {corridor.portCongestionRisk}
                        </p>
                      </div>
                      <div className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]">
                        <p className="text-[9px] text-[#5a5a5a]">Vol/wk</p>
                        <p className="text-[11px] font-mono text-[#d4c598]">
                          {corridor.weeklyVolume ?? '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
          )}
        </div>

        <div className="space-y-4">
          {selectedCorridor ? (
            <>
              <h2 className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider">
                Corridor Detail
              </h2>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-sm font-bold text-[#f5f5f5]">{selectedCorridor.name}</p>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5">
                    {selectedCorridor.origin} → {selectedCorridor.destination}
                  </p>
                </div>

                {(() => {
                  const pi = getNum(selectedCorridor.profitabilityIndex, 50);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-[#6a6a6a]">Profitability Index</p>
                        <p
                          className={cn(
                            'text-sm font-bold font-mono',
                            pi >= 70 ? 'text-emerald-400' : 'text-amber-400',
                          )}
                        >
                          {pi}
                        </p>
                      </div>
                      <div className="h-2 bg-[#c9b787]/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            pi >= 70 ? 'bg-emerald-400' : 'bg-amber-400',
                          )}
                          style={{ width: `${pi}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Avg Transit',
                      value: `${selectedCorridor.avgTransitDays ?? '—'} days`,
                    },
                    {
                      label: 'Delay Rate',
                      value: `${getNum(selectedCorridor.delayRate, 0).toFixed(1)}%`,
                    },
                    { label: 'Weather Risk', value: selectedCorridor.weatherRisk, cap: true },
                    { label: 'Congestion', value: selectedCorridor.portCongestionRisk, cap: true },
                    { label: 'Commodity', value: selectedCorridor.commodity ?? '—' },
                    { label: 'Region', value: selectedCorridor.region ?? '—' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-[#c9b787]/8 rounded p-2 border border-white/[0.06]"
                    >
                      <p className="text-[9px] text-[#5a5a5a]">{item.label}</p>
                      <p
                        className={cn(
                          'text-[10px] font-mono text-[#e0e0e0] mt-0.5',
                          item.cap && 'capitalize',
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedCorridor.activeAlerts > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/15 rounded p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      <p className="text-[11px] font-medium text-orange-300">
                        {selectedCorridor.activeAlerts} active alert
                        {selectedCorridor.activeAlerts > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-[10px] text-orange-300/50 mt-1">
                      Elevated risk conditions on this corridor
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider">
                Corridor Summary
              </h2>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[11px] text-[#6a6a6a] mb-3">Select a corridor to see detail</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[9px] text-[#6a6a6a] mb-1">Profitability Spread</p>
                    <div className="space-y-1">
                      {[...corridors]
                        .sort(
                          (a, b) =>
                            getNum(b.profitabilityIndex, 50) - getNum(a.profitabilityIndex, 50),
                        )
                        .map((c) => {
                          const pi = getNum(c.profitabilityIndex, 50);
                          return (
                            <div key={c.id} className="flex items-center gap-2">
                              <span className="text-[9px] text-[#e0e0e0]/50 w-24 truncate">
                                {c.name.split(' ').slice(0, 2).join(' ')}
                              </span>
                              <div className="flex-1 h-1 bg-[#c9b787]/10 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    pi >= 70
                                      ? 'bg-emerald-400'
                                      : pi >= 50
                                        ? 'bg-amber-400'
                                        : 'bg-orange-400',
                                  )}
                                  style={{ width: `${pi}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  'text-[9px] font-mono w-6 text-right',
                                  pi >= 70
                                    ? 'text-emerald-400'
                                    : pi >= 50
                                      ? 'text-amber-400'
                                      : 'text-orange-400',
                                )}
                              >
                                {pi}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-3">
                  Weather Risk by Corridor
                </p>
                <div className="space-y-2">
                  {corridors
                    .filter((c) => c.weatherRisk !== 'low')
                    .map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            c.weatherRisk === 'severe'
                              ? 'bg-red-400'
                              : c.weatherRisk === 'high'
                                ? 'bg-orange-400'
                                : 'bg-amber-400',
                          )}
                        />
                        <span className="text-[10px] text-[#e0e0e0]/60 flex-1 truncate">
                          {c.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-[8px]', weatherRiskColors[c.weatherRisk])}
                        >
                          {c.weatherRisk}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
