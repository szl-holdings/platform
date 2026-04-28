import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  GitBranch,
  Hash,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CausalDriver {
  id: string;
  label: string;
  assetClass: string;
  causalStrength: number;
  direction: 'positive' | 'negative' | 'non-linear';
  lag: string;
  mechanism: string;
  evidenceRefs: string[];
  lastUpdated: string;
}

interface Assumption {
  id: string;
  label: string;
  value: string;
  editedValue?: string;
  source: string;
  sensitivity: 'high' | 'medium' | 'low';
}

interface ProvenanceEnvelope {
  modelVersion: string;
  inferenceJob: string;
  dataAsOf: string;
  featureHash: string;
  observationWindow: string;
  approvedBy: string;
}

interface SuggestedScenario {
  id: string;
  name: string;
  rationale: string;
  historicalAnalogue: {
    period: string;
    summary: string;
    outcome: string;
  };
  drivers: string[];
  appliedShocks: { shockId: string; magnitude: number }[];
  horizonWeeks: number;
  confidenceLow: number;
  confidenceMid: number;
  confidenceHigh: number;
  confidenceScore: number;
  assumptions: Assumption[];
  provenance: ProvenanceEnvelope;
  suggestedAt: string;
  priority: 'critical' | 'high' | 'medium';
}

interface DriversResponse {
  drivers: CausalDriver[];
  modelVersion: string;
  dataAsOf: string;
  refreshCycle: string;
}

interface SuggestionsResponse {
  suggestions: SuggestedScenario[];
  generatedAt: string;
  refreshAt: string;
  modelVersion: string;
}

interface PromoteResult {
  promoted: boolean;
  suggestionId: string;
  scenarioResult: {
    name: string;
    portfolioPnLLow: number;
    portfolioPnLMid: number;
    portfolioPnLHigh: number;
    horizon: string;
    runAt: string;
    computedBy: string;
  };
  mergedAssumptions: Assumption[];
  promotedAt: string;
  provenance: ProvenanceEnvelope & { promotedBy: string; promotedAt: string };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API_BASE = (() => {
  const base = import.meta.env.BASE_URL ?? '/lyte/';
  return base.replace(/\/$/, '').replace('/lyte', '') + '/api';
})();

async function fetchDrivers(): Promise<DriversResponse> {
  const r = await fetch(`${API_BASE}/lyte/causal/drivers`);
  if (!r.ok) throw new Error('Failed to load causal drivers');
  return r.json();
}

async function fetchSuggestions(): Promise<SuggestionsResponse> {
  const r = await fetch(`${API_BASE}/lyte/causal/suggestions`);
  if (!r.ok) throw new Error('Failed to load scenario suggestions');
  return r.json();
}

async function promoteSuggestion(payload: {
  suggestionId: string;
  assumptionOverrides: Record<string, string>;
}): Promise<PromoteResult> {
  const csrfRes = await fetch(`${API_BASE}/csrf-token`).catch(() => null);
  const csrf = csrfRes ? await csrfRes.json().then((j: { csrfToken?: string }) => j.csrfToken ?? '').catch(() => '') : '';
  const r = await fetch(`${API_BASE}/lyte/causal/promote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Promotion failed');
  }
  const data = await r.json() as PromoteResult & { promoted?: boolean; error?: string };
  if (data.promoted === false) {
    throw new Error(data.error ?? 'Scenario Engine propagation failed');
  }
  return data;
}

// ---------------------------------------------------------------------------
// Micro-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' }) {
  const styles = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-[#c9b787]/10 text-[var(--gi-accent-amber)] border-[#c9b787]/20',
  };
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function ConfidenceBar({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? '#22c55e' : pct >= 60 ? 'var(--gi-accent-amber)' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="text-[9px] font-mono" style={{ color }}>{pct}%</span>}
    </div>
  );
}

function StrengthBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: `rgba(201,168,92,${0.4 + value * 0.6})` }}
        />
      </div>
      <span className="text-[9px] font-mono text-[var(--gi-accent-amber)] w-8 text-right">{pct}%</span>
    </div>
  );
}

function DirectionIcon({ direction }: { direction: 'positive' | 'negative' | 'non-linear' }) {
  if (direction === 'positive') return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (direction === 'negative') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <GitBranch className="w-3 h-3 text-[var(--gi-accent-amber)]" />;
}

function PnLBand({
  low,
  mid,
  high,
  compact = false,
}: {
  low: number;
  mid: number;
  high: number;
  compact?: boolean;
}) {
  const fmt = (v: number) => {
    const sign = v >= 0 ? '+' : '';
    return `${sign}$${Math.abs(v).toFixed(1)}M`;
  };
  const fmtColor = (v: number) => (v >= 0 ? '#22c55e' : '#ef4444');

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[10px] font-mono">
        <span className="text-[#5e5e5e]">Bear</span>
        <span style={{ color: fmtColor(low) }}>{fmt(low)}</span>
        <span className="text-[#5e5e5e]">Base</span>
        <span style={{ color: fmtColor(mid) }}>{fmt(mid)}</span>
        <span className="text-[#5e5e5e]">Bull</span>
        <span style={{ color: fmtColor(high) }}>{fmt(high)}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Bear', value: low, color: '#ef4444' },
        { label: 'Base', value: mid, color: 'var(--gi-accent-amber)' },
        { label: 'Bull', value: high, color: '#22c55e' },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
          <p className="text-[9px] font-mono text-[#5e5e5e] mb-1">{label}</p>
          <p className="text-sm font-semibold" style={{ color }}>
            {fmt(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SensitivityPill({ sensitivity }: { sensitivity: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-[var(--gi-accent-amber)] bg-[#c9b787]/10 border-[#c9b787]/20',
    low: 'text-[#5e5e5e] bg-white/[0.03] border-white/[0.06]',
  };
  return (
    <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${styles[sensitivity]}`}>
      {sensitivity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Causal Drivers Panel
// ---------------------------------------------------------------------------

function CausalDriversPanel({ drivers }: { drivers: CausalDriver[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const assetClasses = [...new Set(drivers.map((d) => d.assetClass))];

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-[var(--gi-accent-amber)]" />
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Inferred Causal Drivers</h2>
        <span className="ml-auto text-[9px] font-mono text-[#5e5e5e]">{drivers.length} drivers · daily refresh</span>
      </div>

      <div className="space-y-1">
        {assetClasses.map((cls) => {
          const clsDrivers = drivers.filter((d) => d.assetClass === cls);
          return (
            <div key={cls}>
              <p className="text-[9px] font-mono text-[#5e5e5e] uppercase tracking-widest px-1 py-1.5">{cls}</p>
              {clsDrivers.map((driver) => {
                const isOpen = expanded === driver.id;
                return (
                  <div
                    key={driver.id}
                    className="rounded-md border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors mb-1"
                  >
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : driver.id)}
                    >
                      <DirectionIcon direction={driver.direction} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[#e0e0e0] font-medium truncate">{driver.label}</span>
                        </div>
                        <StrengthBar value={driver.causalStrength} />
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[9px] font-mono text-[#5e5e5e]">lag {driver.lag}</span>
                        {isOpen ? (
                          <ChevronUp className="w-3 h-3 text-[#5e5e5e]" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-[#5e5e5e]" />
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-3 pb-3 border-t border-white/[0.04] pt-2.5 space-y-2">
                        <p className="text-[11px] text-[#8a8a8a] leading-relaxed">{driver.mechanism}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {driver.evidenceRefs.map((ref) => (
                            <span key={ref} className="text-[9px] font-mono text-[#5e5e5e] bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded">
                              {ref}
                            </span>
                          ))}
                          <span className="text-[9px] font-mono text-[#5e5e5e] ml-auto">
                            Updated {new Date(driver.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assumptions editor
// ---------------------------------------------------------------------------

function AssumptionsEditor({
  assumptions,
  overrides,
  onChange,
}: {
  assumptions: Assumption[];
  overrides: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {assumptions.map((a) => {
        const current = overrides[a.id] ?? a.value;
        const isDirty = overrides[a.id] !== undefined && overrides[a.id] !== a.value;
        return (
          <div key={a.id} className="rounded border border-white/[0.04] bg-white/[0.01] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-medium text-[#e0e0e0] flex-1">{a.label}</span>
              <SensitivityPill sensitivity={a.sensitivity} />
              {isDirty && (
                <span className="text-[8px] font-mono text-[var(--gi-accent-amber)] bg-[#c9b787]/10 border border-[#c9b787]/20 px-1 py-0.5 rounded">
                  edited
                </span>
              )}
            </div>
            <input
              type="text"
              value={current}
              onChange={(e) => onChange(a.id, e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-[#c9b787]/40 rounded px-2 py-1 text-[11px] text-[#f5f5f5] outline-none font-mono"
            />
            <p className="text-[9px] text-[#5e5e5e] mt-1 flex items-center gap-1">
              <Info className="w-2.5 h-2.5 shrink-0" />
              {a.source}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provenance panel
// ---------------------------------------------------------------------------

function ProvenancePanel({ prov }: { prov: ProvenanceEnvelope }) {
  return (
    <div className="rounded border border-white/[0.04] bg-white/[0.01] p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Hash className="w-3 h-3 text-[#5e5e5e]" />
        <span className="text-[9px] font-mono text-[#5e5e5e] uppercase tracking-wider">Provenance</span>
      </div>
      {[
        { label: 'Model', value: prov.modelVersion },
        { label: 'Job', value: prov.inferenceJob },
        { label: 'Data as of', value: prov.dataAsOf },
        { label: 'Feature hash', value: prov.featureHash },
        { label: 'Window', value: prov.observationWindow },
        { label: 'Approved by', value: prov.approvedBy },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#5e5e5e] w-20 shrink-0">{label}</span>
          <span className="text-[9px] font-mono text-[#8a8a8a] truncate">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario card
// ---------------------------------------------------------------------------

function ScenarioCard({
  scenario,
  drivers,
  onPromote,
}: {
  scenario: SuggestedScenario;
  drivers: CausalDriver[];
  onPromote: (id: string, overrides: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [showAnalogue, setShowAnalogue] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const dirtyCount = Object.keys(overrides).filter((k) => overrides[k] !== scenario.assumptions.find((a) => a.id === k)?.value).length;

  const relatedDrivers = drivers.filter((d) => scenario.drivers.includes(d.id));

  return (
    <div className={`rounded-lg border transition-colors ${scenario.priority === 'critical' ? 'border-red-500/20' : scenario.priority === 'high' ? 'border-orange-500/20' : 'border-white/[0.06]'} bg-white/[0.02]`}>
      {/* Header */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-7 h-7 rounded-md bg-[#c9b787]/10 border border-[#c9b787]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-[#f5f5f5]">{scenario.name}</h3>
            <PriorityBadge priority={scenario.priority} />
          </div>
          <p className="text-[11px] text-[#8a8a8a] leading-relaxed line-clamp-2">{scenario.rationale}</p>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <PnLBand low={scenario.confidenceLow} mid={scenario.confidenceMid} high={scenario.confidenceHigh} compact />
            <span className="text-[9px] font-mono text-[#5e5e5e]">{scenario.horizonWeeks}w horizon</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="w-24">
            <p className="text-[8px] font-mono text-[#5e5e5e] mb-0.5 text-right">model confidence</p>
            <ConfidenceBar value={scenario.confidenceScore} />
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#5e5e5e]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#5e5e5e]" />
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-4">
          {/* P&L band (full) */}
          <div>
            <p className="text-[10px] font-mono text-[#5e5e5e] mb-2">Portfolio P&L band · {scenario.horizonWeeks}-week horizon</p>
            <PnLBand low={scenario.confidenceLow} mid={scenario.confidenceMid} high={scenario.confidenceHigh} />
          </div>

          {/* Causal drivers */}
          {relatedDrivers.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#5e5e5e] mb-2 flex items-center gap-1.5">
                <Brain className="w-3 h-3" />
                Driving causal factors
              </p>
              <div className="space-y-2">
                {relatedDrivers.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded border border-white/[0.04] bg-white/[0.01]">
                    <DirectionIcon direction={d.direction} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#e0e0e0] truncate">{d.label}</p>
                      <div className="mt-0.5">
                        <StrengthBar value={d.causalStrength} />
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-[#5e5e5e] shrink-0">lag {d.lag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical analogue */}
          <div>
            <button
              onClick={() => setShowAnalogue(!showAnalogue)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-[#5e5e5e] hover:text-[var(--gi-accent-amber)] transition-colors w-full text-left"
            >
              <BookOpen className="w-3 h-3" />
              Historical analogue — {scenario.historicalAnalogue.period}
              {showAnalogue ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showAnalogue && (
              <div className="mt-2 rounded border border-white/[0.04] bg-white/[0.01] p-3 space-y-2">
                <p className="text-[11px] text-[#8a8a8a] leading-relaxed">{scenario.historicalAnalogue.summary}</p>
                <div className="border-t border-white/[0.04] pt-2">
                  <span className="text-[9px] font-mono text-[#5e5e5e]">Outcome: </span>
                  <span className="text-[11px] text-[#8a8a8a]">{scenario.historicalAnalogue.outcome}</span>
                </div>
              </div>
            )}
          </div>

          {/* Assumptions editor */}
          <div>
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-[#5e5e5e] hover:text-[var(--gi-accent-amber)] transition-colors w-full text-left"
            >
              <Edit3 className="w-3 h-3" />
              Assumptions
              {dirtyCount > 0 && (
                <span className="ml-1.5 text-[8px] font-mono text-[var(--gi-accent-amber)] bg-[#c9b787]/10 border border-[#c9b787]/20 px-1 py-0.5 rounded">
                  {dirtyCount} edited
                </span>
              )}
              {showAssumptions ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showAssumptions && (
              <div className="mt-2">
                <AssumptionsEditor
                  assumptions={scenario.assumptions}
                  overrides={overrides}
                  onChange={(id, value) => setOverrides((prev) => ({ ...prev, [id]: value }))}
                />
              </div>
            )}
          </div>

          {/* Provenance */}
          <div>
            <button
              onClick={() => setShowProvenance(!showProvenance)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-[#5e5e5e] hover:text-[var(--gi-accent-amber)] transition-colors w-full text-left"
            >
              <Hash className="w-3 h-3" />
              Provenance envelope
              {showProvenance ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showProvenance && (
              <div className="mt-2">
                <ProvenancePanel prov={scenario.provenance} />
              </div>
            )}
          </div>

          {/* Promote CTA */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onPromote(scenario.id, overrides)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#c9b787] text-[#0a0a0a] text-xs font-semibold hover:bg-[#d4c49a] transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Promote to Scenario Engine
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {dirtyCount > 0 && (
              <span className="text-[10px] text-[var(--gi-accent-amber)] font-mono">{dirtyCount} assumption override{dirtyCount > 1 ? 's' : ''} will be applied</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Promoted result modal
// ---------------------------------------------------------------------------

function PromotedResult({
  result,
  onClose,
}: {
  result: PromoteResult;
  onClose: () => void;
}) {
  const sr = result.scenarioResult;
  const fmt = (v: number) => {
    const sign = v >= 0 ? '+' : '';
    return `${sign}$${Math.abs(v).toFixed(1)}M`;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-xl border border-[#c9b787]/30 bg-[#0d0d0d] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-semibold text-[#f5f5f5]">Promoted to Scenario Engine</h3>
        </div>
        <p className="text-xs text-[#8a8a8a]">{sr.name}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Bear', value: sr.portfolioPnLLow, color: '#ef4444' },
            { label: 'Base', value: sr.portfolioPnLMid, color: 'var(--gi-accent-amber)' },
            { label: 'Bull', value: sr.portfolioPnLHigh, color: '#22c55e' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[9px] font-mono text-[#5e5e5e] mb-1">{label}</p>
              <p className="text-base font-semibold" style={{ color }}>{fmt(value)}</p>
            </div>
          ))}
        </div>
        <div className="rounded border border-white/[0.04] bg-white/[0.01] p-2.5 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#5e5e5e] w-16">horizon</span>
            <span className="text-[9px] font-mono text-[#8a8a8a]">{sr.horizon}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#5e5e5e] w-16">computed</span>
            <span className="text-[9px] font-mono text-[#8a8a8a]">{sr.computedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#5e5e5e] w-16">run at</span>
            <span className="text-[9px] font-mono text-[#8a8a8a]">{new Date(sr.runAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded border border-white/[0.08] bg-white/[0.02] text-xs text-[#8a8a8a] hover:text-[#e0e0e0] transition-colors"
          >
            Close
          </button>
          <a
            href="/scenarios"
            className="flex-1 py-2 rounded bg-[#c9b787]/10 border border-[#c9b787]/20 text-xs text-[var(--gi-accent-amber)] text-center hover:bg-[#c9b787]/20 transition-colors"
          >
            Open Scenario Composer
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CausalIntelligencePage() {
  const [promotedResult, setPromotedResult] = useState<PromoteResult | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const driversQ = useQuery<DriversResponse>({
    queryKey: ['lyte-causal-drivers'],
    queryFn: fetchDrivers,
    staleTime: 60 * 60 * 1000,
  });

  const suggestionsQ = useQuery<SuggestionsResponse>({
    queryKey: ['lyte-causal-suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 60 * 60 * 1000,
  });

  const promoteMutation = useMutation({
    mutationFn: promoteSuggestion,
    onSuccess: (data) => {
      setPromotedResult(data);
      setPromotingId(null);
    },
    onError: () => setPromotingId(null),
  });

  const handlePromote = (id: string, overrides: Record<string, string>) => {
    setPromotingId(id);
    promoteMutation.mutate({ suggestionId: id, assumptionOverrides: overrides });
  };

  const drivers = driversQ.data?.drivers ?? [];
  const suggestions = suggestionsQ.data?.suggestions ?? [];

  const isLoading = driversQ.isLoading || suggestionsQ.isLoading;
  const isError = driversQ.isError || suggestionsQ.isError;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--gi-accent-amber)]" />
            Causal Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Learned causal drivers from historical portfolio data, with auto-generated daily scenario suggestions and rationale.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {suggestionsQ.data && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5e5e5e]">
              <Clock className="w-3 h-3" />
              Refreshes {new Date(suggestionsQ.data.refreshAt).toLocaleDateString()}
            </div>
          )}
          <button
            onClick={() => { driversQ.refetch(); suggestionsQ.refetch(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/[0.08] bg-white/[0.03] text-[#8a8a8a] text-xs hover:text-[#e0e0e0] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {driversQ.isError ? 'Failed to load causal drivers.' : ''}
            {suggestionsQ.isError ? ' Failed to load scenario suggestions.' : ''}
            {' '}API server may be starting up — please refresh.
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-[var(--gi-accent-amber)] animate-spin" />
          <span className="ml-2 text-sm text-[#5e5e5e]">Running causal inference…</span>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* LEFT: Causal Drivers */}
          <div className="xl:col-span-1">
            <CausalDriversPanel drivers={drivers} />
            {driversQ.data && (
              <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-[#5e5e5e] px-1">
                <Hash className="w-2.5 h-2.5" />
                {driversQ.data.modelVersion} · {driversQ.data.refreshCycle}
              </div>
            )}
          </div>

          {/* RIGHT: Suggested Scenarios */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--gi-accent-amber)]" />
              <h2 className="text-xs font-semibold text-[#f5f5f5]">Suggested Scenarios</h2>
              <span className="text-[9px] font-mono text-[#5e5e5e]">
                {suggestions.length} suggestions · generated {suggestionsQ.data ? new Date(suggestionsQ.data.generatedAt).toLocaleString() : '—'}
              </span>
            </div>

            {promoteMutation.isError && (
              <div className="flex items-center gap-2 p-3 rounded border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {(promoteMutation.error as Error).message}
              </div>
            )}

            {promotingId && (
              <div className="flex items-center gap-2 p-3 rounded border border-[#c9b787]/20 bg-[#c9b787]/5 text-[var(--gi-accent-amber)] text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                Promoting scenario to engine…
              </div>
            )}

            {suggestions.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                drivers={drivers}
                onPromote={handlePromote}
              />
            ))}

            {suggestions.length === 0 && !isLoading && (
              <div className="border border-dashed border-white/[0.06] rounded-lg p-8 text-center">
                <Brain className="w-8 h-8 text-[#5e5e5e] mx-auto mb-2" />
                <p className="text-sm text-[#5e5e5e]">No suggestions generated yet.</p>
                <p className="text-xs text-[#5e5e5e] mt-1">The inference job runs daily at 04:00 UTC.</p>
              </div>
            )}

            {/* Inference metadata footer */}
            {suggestionsQ.data && (
              <div className="rounded border border-white/[0.04] bg-white/[0.01] p-3 space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash className="w-2.5 h-2.5 text-[#5e5e5e]" />
                  <span className="text-[9px] font-mono text-[#5e5e5e] uppercase tracking-wider">Inference Job Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    { label: 'Model version', value: suggestionsQ.data.modelVersion },
                    { label: 'Generated', value: new Date(suggestionsQ.data.generatedAt).toLocaleString() },
                    { label: 'Next refresh', value: new Date(suggestionsQ.data.refreshAt).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-[#5e5e5e] w-24 shrink-0">{label}</span>
                      <span className="text-[9px] font-mono text-[#8a8a8a] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promote result modal */}
      {promotedResult && (
        <PromotedResult result={promotedResult} onClose={() => setPromotedResult(null)} />
      )}
    </div>
  );
}
