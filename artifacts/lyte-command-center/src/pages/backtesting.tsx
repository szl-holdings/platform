import { cn } from '@szl-holdings/shared-ui/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  Loader2,
  Play,
  Target,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface HistoricalEvent {
  id: string;
  date: string;
  shockId: string;
  shockName: string;
  actualMagnitude: number;
  unit: string;
  description: string;
  outcomeCount: number;
}

interface BacktestPrediction {
  entityId: string;
  entityLabel: string;
  domain: string;
  metricLabel: string;
  predictedDelta: number;
  actualDelta: number;
  error: number;
  errorPct: number;
  direction: 'correct' | 'incorrect' | 'both_zero';
}

interface BacktestResult {
  eventId: string;
  date: string;
  shockName: string;
  shockMagnitude: number;
  predictions: BacktestPrediction[];
  overallAccuracy: number;
  meanAbsoluteError: number;
  directionalAccuracy: number;
}

interface BacktestSummary {
  totalEvents: number;
  overallAccuracy: number;
  meanAbsoluteErrorM: number;
  directionalAccuracy: number;
  byShockType: Record<string, { eventCount: number; avgAccuracy: number; avgMAE: number; directionalAccuracy: number }>;
  results: BacktestResult[];
  modelVersion: string;
}

function AccuracyBadge({ accuracy }: { accuracy: number }) {
  const pct = (accuracy * 100).toFixed(0);
  const color = accuracy >= 0.8 ? 'text-emerald-400 bg-emerald-500/10' : accuracy >= 0.6 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';
  return <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', color)}>{pct}%</span>;
}

function DirectionIcon({ direction }: { direction: BacktestPrediction['direction'] }) {
  if (direction === 'correct') return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
  if (direction === 'incorrect') return <XCircle className="w-3 h-3 text-red-400" />;
  return <span className="w-3 h-3 text-white/20">—</span>;
}

function DomainBadge({ domain }: { domain: string }) {
  const colors: Record<string, string> = {
    vessels: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    terra: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    counsel: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    aegis: 'text-red-400 bg-red-500/10 border-red-500/20',
    szl: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  const c = colors[domain] ?? colors.szl;
  return <span className={cn('text-[9px] font-mono px-1 py-0.5 rounded border', c)}>{domain}</span>;
}

function GaugeRing({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100);
  const circum = 2 * Math.PI * 28;
  const offset = circum * (1 - value);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
        <circle
          cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circum} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="38" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace" opacity="0.8">
          {pct}%
        </text>
      </svg>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}

export default function BacktestingPage() {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [horizonWeeks, setHorizonWeeks] = useState(12);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const { data: eventsData } = useQuery({
    queryKey: ['backtest-events'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/scenarios/backtest/events`);
      if (!r.ok) throw new Error('Failed to load events');
      const json = await r.json();
      return json.data.events as HistoricalEvent[];
    },
    staleTime: 300_000,
  });

  const backtestMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { horizonWeeks };
      if (selectedEvents.length > 0) body.eventIds = selectedEvents;
      const r = await fetch(`${BASE}/api/scenarios/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Failed to run backtest');
      const json = await r.json();
      return json.data as BacktestSummary;
    },
  });

  const summary = backtestMutation.data;
  const events = eventsData ?? [];

  function toggleEvent(id: string) {
    setSelectedEvents((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-tight flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-[#c9b787]" />
          Causal Scenario Backtesting
        </h1>
        <p className="text-[11px] text-white/30 mt-0.5">
          Validate the scenario engine's predictions against historical shock events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Configuration</p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Horizon (weeks)</label>
              <div className="relative">
                <select
                  value={horizonWeeks}
                  onChange={(e) => setHorizonWeeks(Number(e.target.value))}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {[4, 8, 12, 26, 52].map((w) => (
                    <option key={w} value={w}>{w} weeks ({Math.round(w / 4.3)} months)</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50">Events ({selectedEvents.length === 0 ? 'all' : selectedEvents.length})</label>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    className={cn(
                      'w-full text-left rounded p-2 border transition-colors',
                      selectedEvents.includes(ev.id)
                        ? 'border-[#c9b787]/30 bg-[#c9b787]/5'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]',
                    )}
                  >
                    <p className="text-[11px] text-white/70 font-medium">{ev.shockName}</p>
                    <p className="text-[9px] text-white/30 font-mono">{ev.date} · {ev.actualMagnitude} {ev.unit}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => backtestMutation.mutate()}
              disabled={backtestMutation.isPending}
              className="w-full h-9 rounded bg-[#c9b787]/20 border border-[#c9b787]/30 text-[#c9b787] text-[12px] font-semibold hover:bg-[#c9b787]/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {backtestMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run Backtest
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!summary && !backtestMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/20 text-[12px]">
              <FlaskConical className="w-8 h-8 mb-2 text-[#c9b787]/20" />
              Select events and run a backtest to validate model accuracy
            </div>
          )}

          {backtestMutation.isPending && (
            <div className="flex items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Loader2 className="w-5 h-5 text-[#c9b787] animate-spin" />
            </div>
          )}

          {summary && (
            <>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Model Performance</p>
                  <span className="text-[10px] text-white/30 font-mono">{summary.modelVersion} · {summary.totalEvents} events</span>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <GaugeRing value={summary.overallAccuracy} label="Overall Accuracy" color="#c9b787" />
                  <GaugeRing value={summary.directionalAccuracy} label="Directional Accuracy" color="#4ade80" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[72px] h-[72px] rounded-full border-4 border-white/[0.04] flex items-center justify-center">
                      <span className="text-sm font-mono text-white/80">${summary.meanAbsoluteErrorM.toFixed(1)}M</span>
                    </div>
                    <span className="text-[10px] text-white/40">MAE</span>
                  </div>
                </div>
              </div>

              {Object.keys(summary.byShockType).length > 0 && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">By Shock Type</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(summary.byShockType).map(([key, val]) => (
                      <div key={key} className="rounded border border-white/[0.04] bg-white/[0.01] p-3 space-y-1">
                        <p className="text-[11px] text-white/60 font-medium">{key.replace(/-/g, ' ')}</p>
                        <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
                          <span>{val.eventCount} events</span>
                          <AccuracyBadge accuracy={val.avgAccuracy} />
                          <span>MAE ${val.avgMAE.toFixed(1)}M</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Event Results</p>
                {summary.results.map((r) => {
                  const expanded = expandedResult === r.eventId;
                  return (
                    <div key={r.eventId} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <button
                        onClick={() => setExpandedResult(expanded ? null : r.eventId)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.01] transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-white/70 font-medium">{r.shockName}</span>
                            <span className="text-[10px] text-white/30 font-mono">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30 font-mono">
                            <span>Magnitude: {r.shockMagnitude}</span>
                            <span>{r.predictions.length} predictions</span>
                          </div>
                        </div>
                        <AccuracyBadge accuracy={r.overallAccuracy} />
                        <div className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                          <Target className="w-3 h-3" />
                          {(r.directionalAccuracy * 100).toFixed(0)}% dir
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-white/20 transition-transform', expanded && 'rotate-180')} />
                      </button>

                      {expanded && (
                        <div className="border-t border-white/[0.04] p-3">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="text-white/30 border-b border-white/[0.04]">
                                <th className="text-left pb-1.5 font-medium">Entity</th>
                                <th className="text-left pb-1.5 font-medium">Domain</th>
                                <th className="text-right pb-1.5 font-medium">Predicted</th>
                                <th className="text-right pb-1.5 font-medium">Actual</th>
                                <th className="text-right pb-1.5 font-medium">Error</th>
                                <th className="text-center pb-1.5 font-medium">Dir</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.predictions.map((p) => (
                                <tr key={p.entityId} className="border-b border-white/[0.02]">
                                  <td className="py-1.5 text-white/60">{p.entityLabel}</td>
                                  <td className="py-1.5"><DomainBadge domain={p.domain} /></td>
                                  <td className="py-1.5 text-right font-mono">
                                    <span className={p.predictedDelta < 0 ? 'text-red-400/70' : 'text-emerald-400/70'}>
                                      {p.predictedDelta >= 0 ? '+' : ''}{p.predictedDelta.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-right font-mono">
                                    <span className={p.actualDelta < 0 ? 'text-red-400/70' : 'text-emerald-400/70'}>
                                      {p.actualDelta >= 0 ? '+' : ''}{p.actualDelta.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-right font-mono text-white/40">{p.error.toFixed(2)}</td>
                                  <td className="py-1.5 text-center"><DirectionIcon direction={p.direction} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
