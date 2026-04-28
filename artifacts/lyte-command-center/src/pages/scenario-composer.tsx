import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShockDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  defaultMagnitude: number;
  unit: string;
  minMagnitude: number;
  maxMagnitude: number;
  affectedDomains: string[];
}

interface AppliedShock {
  shockId: string;
  magnitude: number;
  label?: string;
}

interface EntityDelta {
  entityId: string;
  entityLabel: string;
  domain: string;
  domainIcon: string;
  domainColor: string;
  metricLabel: string;
  absoluteDelta: number;
  percentDelta: number;
  confidence: number;
  direction: 'up' | 'down' | 'flat';
  narrativeLines: string[];
}

interface SensitivityCell {
  shock: string;
  domain: string;
  sensitivity: number;
}

interface ScenarioResult {
  scenarioId: string;
  name: string;
  shocks: AppliedShock[];
  horizon: string;
  entityDeltas: EntityDelta[];
  portfolioPnLLow: number;
  portfolioPnLMid: number;
  portfolioPnLHigh: number;
  topMovers: { label: string; delta: string; direction: 'up' | 'down' }[];
  sensitivityMap: SensitivityCell[];
  runAt: string;
  computedBy: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API_BASE = (() => {
  const base = import.meta.env.BASE_URL ?? '/lyte/';
  return base.replace(/\/$/, '').replace('/lyte', '') + '/api';
})();

async function fetchLibrary(): Promise<ShockDefinition[]> {
  const r = await fetch(`${API_BASE}/scenarios/library`);
  if (!r.ok) throw new Error('Failed to load shock library');
  const j = await r.json();
  return j.shocks ?? [];
}

async function getCsrfToken(base: string): Promise<string> {
  const r = await fetch(`${base}/csrf-token`);
  if (!r.ok) return '';
  const j = await r.json();
  return j.token ?? '';
}

async function runScenario(payload: {
  name: string;
  shocks: AppliedShock[];
  horizonWeeks: number;
}): Promise<ScenarioResult> {
  const csrf = await getCsrfToken(API_BASE);
  const r = await fetch(`${API_BASE}/scenarios/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error ?? 'Scenario run failed');
  }
  return r.json() as Promise<ScenarioResult>;
}

// ---------------------------------------------------------------------------
// WORKED EXAMPLE
// ---------------------------------------------------------------------------

const WORKED_EXAMPLE: { name: string; shocks: AppliedShock[]; horizonWeeks: number } = {
  name: 'Strait Closure + 50 bps + EU Sanctions',
  horizonWeeks: 8,
  shocks: [
    { shockId: 'strait-closure', magnitude: 6 },
    { shockId: 'rate-hike', magnitude: 50 },
    { shockId: 'eu-sanctions', magnitude: 3 },
    { shockId: 'oil-spike', magnitude: 22 },
  ],
};

// ---------------------------------------------------------------------------
// Micro-components
// ---------------------------------------------------------------------------

function CategoryPill({ cat }: { cat: string }) {
  const map: Record<string, string> = {
    commodity: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    rates: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    geopolitical: 'bg-red-500/10 text-red-300 border-red-500/20',
    fx: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    real_estate: 'bg-green-500/10 text-green-300 border-green-500/20',
    sanctions: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  };
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${map[cat] ?? 'bg-white/[0.04] text-[#8a8a8a] border-white/[0.08]'}`}>
      {cat.replace('_', ' ')}
    </span>
  );
}

function DirectionIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (direction === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-[#5e5e5e]" />;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 65 ? 'var(--gi-accent-amber)' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-mono text-[#5e5e5e]">{pct}%</span>
    </div>
  );
}

function SensitivityHeatMap({
  cells,
  shocks,
}: {
  cells: SensitivityCell[];
  shocks: string[];
}) {
  const domains = ['SEXTANT', 'DOMAINE', 'SZL Holdings', 'Counsel', 'PARAGON'];
  if (cells.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="text-left font-mono text-[#5e5e5e] py-1.5 pr-3 whitespace-nowrap">
              Shock ↓ / Domain →
            </th>
            {domains.map((d) => (
              <th key={d} className="text-center font-mono text-[#5e5e5e] py-1.5 px-2 whitespace-nowrap">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shocks.map((shock) => (
            <tr key={shock} className="border-t border-white/[0.04]">
              <td className="py-1.5 pr-3 text-[#8a8a8a] whitespace-nowrap font-mono">{shock}</td>
              {domains.map((domain) => {
                const cell = cells.find((c) => c.shock === shock && c.domain === domain);
                const v = cell?.sensitivity ?? 0;
                const opacity = Math.round(v * 90);
                return (
                  <td key={domain} className="py-1.5 px-2 text-center">
                    <div
                      className="mx-auto w-7 h-5 rounded flex items-center justify-center text-[9px] font-mono"
                      style={{
                        backgroundColor: `rgba(201,168,92,${v * 0.7})`,
                        color: opacity > 50 ? '#f5f5f5' : '#5e5e5e',
                      }}
                    >
                      {v.toFixed(2)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ScenarioComposerPage() {
  const [scenarioName, setScenarioName] = useState('');
  const [horizonWeeks, setHorizonWeeks] = useState(12);
  const [activeShocks, setActiveShocks] = useState<AppliedShock[]>([]);
  const [expandedShock, setExpandedShock] = useState<string | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const { data: library = [], isLoading: libraryLoading } = useQuery<ShockDefinition[]>({
    queryKey: ['scenarios-library'],
    queryFn: fetchLibrary,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: runScenario,
    onSuccess: (data) => setResult(data),
  });

  const addShock = useCallback(
    (def: ShockDefinition) => {
      if (activeShocks.find((s) => s.shockId === def.id)) return;
      setActiveShocks((prev) => [
        ...prev,
        { shockId: def.id, magnitude: def.defaultMagnitude },
      ]);
    },
    [activeShocks],
  );

  const removeShock = useCallback((id: string) => {
    setActiveShocks((prev) => prev.filter((s) => s.shockId !== id));
  }, []);

  const updateMagnitude = useCallback((id: string, val: number) => {
    setActiveShocks((prev) =>
      prev.map((s) => (s.shockId === id ? { ...s, magnitude: val } : s)),
    );
  }, []);

  const handleRun = () => {
    if (activeShocks.length === 0) return;
    mutation.mutate({
      name: scenarioName.trim() || 'Ad-hoc scenario',
      shocks: activeShocks,
      horizonWeeks,
    });
  };

  const loadWorkedExample = () => {
    setScenarioName(WORKED_EXAMPLE.name);
    setHorizonWeeks(WORKED_EXAMPLE.horizonWeeks);
    setActiveShocks(WORKED_EXAMPLE.shocks);
    setResult(null);
  };

  const reset = () => {
    setActiveShocks([]);
    setScenarioName('');
    setHorizonWeeks(12);
    setResult(null);
  };

  const HORIZON_OPTIONS = [4, 8, 12, 26, 52];
  const uniqueShockNames = [...new Set((result?.sensitivityMap ?? []).map((c) => c.shock))];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[var(--gi-accent-amber)]" />
            Scenario Composer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stack cross-portfolio shocks and propagate their impact across DOMAINE, SEXTANT, KORA, and SZL Holdings through the entity graph.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadWorkedExample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#c9b787]/30 bg-[#c9b787]/5 text-[var(--gi-accent-amber)] text-xs hover:bg-[#c9b787]/10 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Load worked example
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-[#8a8a8a] text-xs hover:text-[#e0e0e0] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Shock library */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
            <h2 className="text-xs font-semibold text-[#f5f5f5]">Shock Library</h2>
            <span className="text-[9px] font-mono text-[#5e5e5e]">{library.length} events</span>
          </div>

          {libraryLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg border border-white/[0.06] bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          )}

          {library.map((def) => {
            const applied = activeShocks.find((s) => s.shockId === def.id);
            const isOpen = expandedShock === def.id;
            return (
              <div
                key={def.id}
                className={`rounded-lg border transition-colors ${
                  applied
                    ? 'border-[#c9b787]/30 bg-[#c9b787]/5'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]'
                }`}
              >
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
                  onClick={() => setExpandedShock(isOpen ? null : def.id)}
                >
                  <span className="text-base">{def.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-[#f5f5f5] truncate">{def.name}</span>
                      <CategoryPill cat={def.category} />
                    </div>
                    <p className="text-[10px] text-[#5e5e5e] mt-0.5 truncate">{def.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {applied ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeShock(def.id); }}
                        className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); addShock(def); }}
                        className="p-1 rounded bg-[#c9b787]/10 text-[var(--gi-accent-amber)] hover:bg-[#c9b787]/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-3 h-3 text-[#5e5e5e]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-[#5e5e5e]" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 border-t border-white/[0.06] pt-2.5 space-y-2">
                    <p className="text-[10px] text-[#8a8a8a]">{def.description}</p>
                    {applied && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#5e5e5e] font-mono">Magnitude</span>
                          <span className="text-[10px] text-[var(--gi-accent-amber)] font-mono">
                            {applied.magnitude} {def.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={def.minMagnitude}
                          max={def.maxMagnitude}
                          step={(def.maxMagnitude - def.minMagnitude) / 40}
                          value={applied.magnitude}
                          onChange={(e) => updateMagnitude(def.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 accent-[#c9b787]"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-[#5e5e5e]">
                          <span>{def.minMagnitude}</span>
                          <span>{def.maxMagnitude}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-mono text-[#5e5e5e]">Affected: </span>
                      <span className="text-[9px] text-[#8a8a8a]">
                        {def.affectedDomains.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Composer + Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scenario config */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
              <h2 className="text-xs font-semibold text-[#f5f5f5]">Compose Scenario</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-mono text-[#5e5e5e] mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Strait Closure + 50bps + EU Sanctions"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2 text-xs text-[#f5f5f5] placeholder-[#5e5e5e] outline-none focus:border-[#c9b787]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#5e5e5e] mb-1">
                  Time Horizon
                </label>
                <div className="flex gap-1.5">
                  {HORIZON_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setHorizonWeeks(w)}
                      className={`flex-1 py-1.5 rounded text-[10px] font-mono border transition-colors ${
                        horizonWeeks === w
                          ? 'border-[#c9b787]/40 bg-[#c9b787]/10 text-[var(--gi-accent-amber)]'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#5e5e5e] hover:text-[#8a8a8a]'
                      }`}
                    >
                      {w}w
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active shocks stack */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#5e5e5e]">
                  Active shocks ({activeShocks.length})
                </span>
                {activeShocks.length > 0 && (
                  <span className="text-[9px] font-mono text-[var(--gi-accent-amber)]">
                    {activeShocks.length} event{activeShocks.length > 1 ? 's' : ''} stacked
                  </span>
                )}
              </div>

              {activeShocks.length === 0 && (
                <div className="border border-dashed border-white/[0.08] rounded-lg p-6 text-center">
                  <p className="text-xs text-[#5e5e5e]">
                    Add shocks from the library or{' '}
                    <button
                      onClick={loadWorkedExample}
                      className="text-[var(--gi-accent-amber)] underline underline-offset-2"
                    >
                      load the worked example
                    </button>
                    .
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {activeShocks.map((s) => {
                  const def = library.find((d) => d.id === s.shockId);
                  if (!def) return null;
                  return (
                    <div
                      key={s.shockId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#c9b787]/20 bg-[#c9b787]/5"
                    >
                      <span className="text-sm">{def.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#f5f5f5]">{def.name}</span>
                          <CategoryPill cat={def.category} />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="range"
                            min={def.minMagnitude}
                            max={def.maxMagnitude}
                            step={(def.maxMagnitude - def.minMagnitude) / 40}
                            value={s.magnitude}
                            onChange={(e) => updateMagnitude(def.id, parseFloat(e.target.value))}
                            className="w-24 h-1 accent-[#c9b787]"
                          />
                          <span className="text-[10px] font-mono text-[var(--gi-accent-amber)]">
                            {s.magnitude % 1 === 0 ? s.magnitude : s.magnitude.toFixed(1)} {def.unit}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeShock(s.shockId)}
                        className="p-1 rounded text-[#5e5e5e] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleRun}
                disabled={activeShocks.length === 0 || mutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#c9b787] text-[#0a0a0a] text-xs font-semibold hover:bg-[#d4c49a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Propagating…' : 'Run scenario'}
              </button>
              {mutation.isError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {(mutation.error as Error).message}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Portfolio P&L band */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">◆</span>
                  <h3 className="text-xs font-semibold text-[#f5f5f5]">Portfolio P&L Band</h3>
                  <span className="ml-auto text-[9px] font-mono text-[#5e5e5e]">
                    {result.horizon} horizon · {result.computedBy}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Bear', value: result.portfolioPnLLow, color: '#ef4444' },
                    { label: 'Base', value: result.portfolioPnLMid, color: 'var(--gi-accent-amber)' },
                    { label: 'Bull', value: result.portfolioPnLHigh, color: '#22c55e' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded border border-white/[0.06] bg-white/[0.02] p-3 text-center"
                    >
                      <p className="text-[9px] font-mono text-[#5e5e5e] mb-1">{label}</p>
                      <p className="text-sm font-semibold" style={{ color }}>
                        {value >= 0 ? '+' : ''}${value.toFixed(1)}M
                      </p>
                    </div>
                  ))}
                </div>

                {/* Top movers */}
                {result.topMovers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-[9px] font-mono text-[#5e5e5e] mb-2">TOP MOVERS</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {result.topMovers.map((m) => (
                        <div
                          key={m.label}
                          className="flex items-center justify-between px-2 py-1.5 rounded border border-white/[0.04] bg-white/[0.02]"
                        >
                          <span className="text-[10px] text-[#8a8a8a] truncate">{m.label}</span>
                          <span
                            className={`text-[10px] font-mono ml-2 shrink-0 ${
                              m.direction === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {m.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Entity delta table */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-xs font-semibold text-[#f5f5f5] mb-3">Per-Entity Impact</h3>
                <div className="space-y-2">
                  {result.entityDeltas.map((delta) => {
                    const isOpen = expandedEntity === delta.entityId;
                    return (
                      <div
                        key={delta.entityId}
                        className="rounded border border-white/[0.06] overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                          onClick={() => setExpandedEntity(isOpen ? null : delta.entityId)}
                        >
                          <span className="text-sm shrink-0">{delta.domainIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[#f5f5f5] truncate">
                                {delta.entityLabel}
                              </span>
                              <span
                                className="text-[9px] font-mono px-1 py-0.5 rounded"
                                style={{
                                  color: delta.domainColor,
                                  backgroundColor: `${delta.domainColor}18`,
                                }}
                              >
                                {delta.domain}
                              </span>
                            </div>
                            <div className="mt-1">
                              <ConfidenceBar value={delta.confidence} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <DirectionIcon direction={delta.direction} />
                            <div className="text-right">
                              <p
                                className={`text-xs font-semibold font-mono ${
                                  delta.direction === 'up'
                                    ? 'text-green-400'
                                    : delta.direction === 'down'
                                      ? 'text-red-400'
                                      : 'text-[#5e5e5e]'
                                }`}
                              >
                                {delta.percentDelta >= 0 ? '+' : ''}
                                {delta.percentDelta.toFixed(1)}%
                              </p>
                              <p className="text-[9px] font-mono text-[#5e5e5e]">
                                {delta.metricLabel}
                              </p>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="w-3 h-3 text-[#5e5e5e]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[#5e5e5e]" />
                            )}
                          </div>
                        </div>
                        {isOpen && delta.narrativeLines.length > 0 && (
                          <div className="px-3 pb-3 pt-2 border-t border-white/[0.04] space-y-1 bg-white/[0.01]">
                            {delta.narrativeLines.map((line, i) => (
                              <p key={i} className="text-[10px] text-[#8a8a8a] leading-relaxed">
                                • {line}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sensitivity heat map */}
              {uniqueShockNames.length > 0 && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <h3 className="text-xs font-semibold text-[#f5f5f5] mb-1">Sensitivity Heat Map</h3>
                  <p className="text-[10px] text-[#5e5e5e] mb-3">
                    Cell value = normalised transmission coefficient (0 = no link, 1 = direct).
                  </p>
                  <SensitivityHeatMap cells={result.sensitivityMap} shocks={uniqueShockNames} />
                </div>
              )}

              <p className="text-[9px] font-mono text-[#5e5e5e] text-right">
                Scenario ID: {result.scenarioId} · Run at: {new Date(result.runAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
