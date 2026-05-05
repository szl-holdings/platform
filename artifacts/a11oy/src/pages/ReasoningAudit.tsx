import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  gold: '#b08d52',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
};

type TracePhase = 'perceive' | 'orient' | 'plan' | 'execute' | 'verify' | 'reflect' | 'update_memory';
type TraceOutcome = 'approved' | 'rejected' | 'overridden' | 'deferred' | 'blocked';

interface ThinkingStep {
  phase: TracePhase;
  content: string;
  tokens: number;
  durationMs: number;
}

type ThinkingMode = 'think' | 'no-think';
type DualWitnessVerdict = 'consistent' | 'divergent' | 'insufficient_evidence';

interface ReasoningTrace {
  id: string;
  workcellId: string;
  workcellName: string;
  agentId: string;
  domain: string;
  decisionType: string;
  outcome: TraceOutcome;
  model: string;
  capturedAt: string;
  totalTokens: number;
  totalDurationMs: number;
  confidence: number;
  thinking: ThinkingStep[];
  proofHash: string;
  // ─── ouroboros-alloy + ouroboros-horizon ────────────
  thinkingMode?: ThinkingMode;
  thinkingRationale?: string;
  dualWitnessVerdict?: DualWitnessVerdict;
}

const MODE_STYLE: Record<ThinkingMode, { color: string; label: string }> = {
  'think':    { color: '#a78bfa', label: 'THINK' },
  'no-think': { color: '#5e5e5e', label: 'NO-THINK' },
};
const VERDICT_STYLE: Record<DualWitnessVerdict, { color: string; label: string }> = {
  consistent:              { color: '#22c55e', label: 'DUAL-WITNESS · CONSISTENT' },
  divergent:               { color: '#ef4444', label: 'DUAL-WITNESS · DIVERGENT' },
  insufficient_evidence:   { color: '#5e5e5e', label: 'DUAL-WITNESS · INSUFFICIENT' },
};

const PHASE_COLORS: Record<TracePhase, string> = {
  perceive: '#8a8a8a',
  orient: '#c9b787',
  plan: '#a78bfa',
  execute: '#38bdf8',
  verify: '#22c55e',
  reflect: '#f97316',
  update_memory: '#5e5e5e',
};

const OUTCOME_STYLE: Record<TraceOutcome, { color: string; label: string }> = {
  approved: { color: '#22c55e', label: 'APPROVED' },
  rejected: { color: '#ef4444', label: 'REJECTED' },
  overridden: { color: '#f97316', label: 'OVERRIDDEN' },
  deferred: { color: '#c9b787', label: 'DEFERRED' },
  blocked: { color: '#a78bfa', label: 'BLOCKED' },
};

const DOMAINS = ['all', 'maritime', 'legal', 'revenue', 'defense', 'real-estate'];

export function ReasoningAudit() {
  const [selectedTrace, setSelectedTrace] = useState<ReasoningTrace | null>(null);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState(false);
  const [diffTrace, setDiffTrace] = useState<string | null>(null);

  const endpoint = `/adaptive/reasoning/traces${filterDomain !== 'all' || filterOutcome !== 'all'
    ? `?domain=${filterDomain}&outcome=${filterOutcome}`
    : ''}`;
  const { data: traces, loading, meta } = useApiData<ReasoningTrace[]>(endpoint) as { data: ReasoningTrace[] | null; loading: boolean; meta: { avgTokens?: number } | null; error: string | null; source: 'api' | 'demo' };
  const { data: allTraces } = useApiData<ReasoningTrace[]>('/adaptive/reasoning/traces');

  const filtered = traces ?? [];
  const avgTokens = (meta as { avgTokens?: number } | null)?.avgTokens ?? (allTraces ? Math.round(allTraces.reduce((a, t) => a + t.totalTokens, 0) / Math.max(1, allTraces.length)) : 0);

  return (
    <Layout>
      <PageHeader
        label="INTELLIGENCE · REASONING AUDIT"
        title="Extended Thinking Traces"
        subtitle="Full chain-of-thought reasoning captured at every phase of the cognitive loop. Stored alongside proof packets. Browse, filter, and diff reasoning across agents, domains, and decisions."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TRACES CAPTURED" value="2,841" sub="last 30 days" accent="#c9b787" />
        <KpiCard label="AVG TOKENS / TRACE" value={avgTokens.toLocaleString()} sub="thinking chain" accent="#c9b787" />
        <KpiCard label="TRACES AUDITED" value="184" sub="operator reviewed" accent="#c9b787" />
        <KpiCard label="REASONING REGRESSIONS" value="3" sub="flagged this month" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Trace Library</SectionTitle>
            {loading && <span className="text-[10px] font-mono" style={{ color: T.muted }}>Loading…</span>}
          </div>

          <div className="flex flex-col gap-2 mb-3">
            <select
              value={filterDomain}
              onChange={e => { setFilterDomain(e.target.value); setSelectedTrace(null); }}
              className="text-xs font-mono px-2 py-1 rounded w-full"
              style={{ background: T.surface, color: T.dim, border: `1px solid ${T.border}` }}
            >
              {DOMAINS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Domains' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
            <select
              value={filterOutcome}
              onChange={e => { setFilterOutcome(e.target.value); setSelectedTrace(null); }}
              className="text-xs font-mono px-2 py-1 rounded w-full"
              style={{ background: T.surface, color: T.dim, border: `1px solid ${T.border}` }}
            >
              <option value="all">All Outcomes</option>
              {Object.entries(OUTCOME_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            {filtered.map(trace => {
              const os = OUTCOME_STYLE[trace.outcome];
              const isSelected = selectedTrace?.id === trace.id;
              return (
                <button
                  key={trace.id}
                  onClick={() => setSelectedTrace(isSelected ? null : trace)}
                  className="text-left w-full rounded p-3 transition-colors"
                  style={{ background: isSelected ? `${T.accent}12` : T.surface, border: `1px solid ${isSelected ? T.accent + '44' : T.border}` }}
                >
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <span className="text-[10px] font-mono" style={{ color: T.accent }}>{trace.domain}</span>
                    <div className="flex items-center gap-1">
                      {trace.thinkingMode && (
                        <span
                          className="text-[8px] font-mono px-1 py-0.5 rounded"
                          style={{ background: `${MODE_STYLE[trace.thinkingMode].color}22`, color: MODE_STYLE[trace.thinkingMode].color }}
                          title={trace.thinkingRationale ?? 'ouroboros-alloy@arbitrateThinking'}
                        >
                          {MODE_STYLE[trace.thinkingMode].label}
                        </span>
                      )}
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: `${os.color}18`, color: os.color }}>{os.label}</span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold mb-1 text-left" style={{ color: T.text }}>{trace.workcellName}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: T.muted }}>{trace.agentId}</span>
                    <span className="text-[10px] font-mono" style={{ color: T.muted }}>{trace.totalTokens.toLocaleString()} tok</span>
                  </div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: T.muted }}>{new Date(trace.capturedAt).toLocaleString()}</div>
                </button>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: T.muted }}>No traces match filters</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTrace ? (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <SectionTitle>Reasoning Trace — {selectedTrace.workcellName}</SectionTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiffMode(!diffMode)}
                    className="text-[10px] font-mono px-2 py-1 rounded"
                    style={{ background: diffMode ? `${T.accent}22` : T.surface, color: diffMode ? T.accent : T.dim, border: `1px solid ${diffMode ? T.accent + '44' : T.border}` }}
                  >
                    DIFF MODE
                  </button>
                </div>
              </div>

              <Card className="mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'AGENT', value: selectedTrace.agentId },
                    { label: 'MODEL', value: selectedTrace.model },
                    { label: 'CONFIDENCE', value: `${Math.round(selectedTrace.confidence * 100)}%` },
                    { label: 'OUTCOME', value: OUTCOME_STYLE[selectedTrace.outcome].label },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                      <div className="text-xs font-semibold" style={{ color: T.accent }}>{value}</div>
                    </div>
                  ))}
                </div>
                {(selectedTrace.thinkingMode || selectedTrace.dualWitnessVerdict) && (
                  <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: `1px solid ${T.border}` }}>
                    {selectedTrace.thinkingMode && (
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 rounded"
                        style={{ background: `${MODE_STYLE[selectedTrace.thinkingMode].color}22`, color: MODE_STYLE[selectedTrace.thinkingMode].color }}
                        title="ouroboros-alloy@arbitrateThinking"
                      >
                        MODE · {MODE_STYLE[selectedTrace.thinkingMode].label}
                      </span>
                    )}
                    {selectedTrace.dualWitnessVerdict && (
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 rounded"
                        style={{ background: `${VERDICT_STYLE[selectedTrace.dualWitnessVerdict].color}22`, color: VERDICT_STYLE[selectedTrace.dualWitnessVerdict].color }}
                        title="ouroboros-horizon@DualWitness (perceive vs verify complementarity)"
                      >
                        {VERDICT_STYLE[selectedTrace.dualWitnessVerdict].label}
                      </span>
                    )}
                    {selectedTrace.thinkingRationale && (
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{selectedTrace.thinkingRationale}</span>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: `1px solid ${T.border}` }}>
                  <span className="text-[9px] font-mono" style={{ color: T.muted }}>PROOF HASH</span>
                  <span className="text-[10px] font-mono" style={{ color: T.muted, fontFamily: T.mono }}>{selectedTrace.proofHash}</span>
                  <span className="text-[9px] font-mono ml-auto" style={{ color: T.muted }}>{selectedTrace.totalTokens.toLocaleString()} tokens · {selectedTrace.totalDurationMs}ms</span>
                </div>
              </Card>

              <div className="flex flex-col gap-3">
                {selectedTrace.thinking.map((step, i) => {
                  const phaseColor = PHASE_COLORS[step.phase] ?? T.dim;
                  const isExpanded = expandedPhase === `${selectedTrace.id}-${i}`;
                  return (
                    <Card key={i}>
                      <button
                        className="w-full text-left"
                        onClick={() => setExpandedPhase(isExpanded ? null : `${selectedTrace.id}-${i}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: phaseColor }} />
                            <span className="text-xs font-mono font-semibold uppercase" style={{ color: phaseColor }}>{step.phase.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono" style={{ color: T.muted }}>{step.tokens} tok · {step.durationMs}ms</span>
                            <span className="text-[10px]" style={{ color: T.muted }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                          <pre className="text-xs whitespace-pre-wrap" style={{ color: T.dim, lineHeight: 1.7, fontFamily: T.mono }}>{step.content}</pre>
                        </div>
                      )}
                      {!isExpanded && (
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: T.muted, lineHeight: 1.6 }}>{step.content.slice(0, 120)}…</p>
                      )}
                    </Card>
                  );
                })}
              </div>

              {diffMode && (
                <div className="mt-4">
                  <SectionTitle>Reasoning Diff — Similar Decisions</SectionTitle>
                  <Card>
                    <div className="text-xs mb-3" style={{ color: T.dim, lineHeight: 1.7 }}>
                      Reasoning diff shows how agent thinking evolved on similar problem types over time. Select a comparison trace to highlight changes in evidence weighting, confidence progression, and policy interpretation.
                    </div>
                    <div className="flex flex-col gap-2">
                      {(allTraces ?? []).filter(t => t.id !== selectedTrace.id && t.domain === selectedTrace.domain).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setDiffTrace(t.id === diffTrace ? null : t.id)}
                          className="text-left p-3 rounded"
                          style={{ background: t.id === diffTrace ? `${T.accent}12` : T.surface, border: `1px solid ${t.id === diffTrace ? T.accent + '33' : T.border}` }}
                        >
                          <div className="text-xs font-semibold" style={{ color: T.text }}>{t.workcellName}</div>
                          <div className="text-[10px] font-mono" style={{ color: T.muted }}>{t.agentId} · {new Date(t.capturedAt).toLocaleDateString()} · {Math.round(t.confidence * 100)}% confidence</div>
                        </button>
                      ))}
                      {(allTraces ?? []).filter(t => t.id !== selectedTrace.id && t.domain === selectedTrace.domain).length === 0 && (
                        <div className="text-xs text-center py-4" style={{ color: T.muted }}>No same-domain traces available for diff</div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="text-2xl mb-3" style={{ color: T.muted }}>◎</div>
                <div className="text-sm mb-2" style={{ color: T.dim }}>Select a trace to inspect extended thinking</div>
                <div className="text-xs" style={{ color: T.muted }}>Full chain-of-thought per cognitive phase, stored alongside proof packets</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
