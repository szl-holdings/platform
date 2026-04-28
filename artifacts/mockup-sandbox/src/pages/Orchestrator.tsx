import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Gauge,
  Lightbulb,
  Loader,
  Play,
  RotateCw,
  Workflow,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { praxisApi } from '../lib/api';
import type { OrchestrationPlan, OrchestrationStep } from '../lib/types';

const EXAMPLE_INTENTS = [
  {
    label: 'Risk Brief',
    intent:
      "Summarize today's threat risk across PARAGON and SEXTANT, then draft an executive brief in Pulse format.",
  },
  {
    label: 'Portfolio Snapshot',
    intent:
      'Pull the latest KPIs from SZL Holdings, DOMAINE, and SEXTANT, and compile a cross-portfolio snapshot.',
  },
  {
    label: 'Compliance Check',
    intent:
      'Cross-reference Prism Counsel open matters against PARAGON threat intel and flag any intersecting risk vectors.',
  },
];

const APP_COLORS: Record<string, string> = {
  aegis: '#c96070',
  vessels: '#4d8fcc',
  terra: '#5baa8a',
  pulse: '#c9a85c',
  command: '#9b7cc8',
  'szl-holdings': '#22d3ee',
  'carlota-jo': '#f472b6',
  'prism-counsel': '#818cf8',
  lyte: '#fb923c',
  imperium: '#34d399',
};

const RATE_LIMITS: Record<string, { rpm: number; used: number; tpm: number; tUsed: number }> = {
  aegis: { rpm: 60, used: 14, tpm: 150000, tUsed: 28400 },
  vessels: { rpm: 60, used: 7, tpm: 150000, tUsed: 12800 },
  terra: { rpm: 60, used: 22, tpm: 150000, tUsed: 41200 },
  pulse: { rpm: 60, used: 4, tpm: 150000, tUsed: 8100 },
  command: { rpm: 60, used: 31, tpm: 150000, tUsed: 59600 },
  'szl-holdings': { rpm: 60, used: 9, tpm: 150000, tUsed: 17300 },
  'carlota-jo': { rpm: 60, used: 3, tpm: 150000, tUsed: 5200 },
  'prism-counsel': { rpm: 60, used: 18, tpm: 150000, tUsed: 34800 },
  lyte: { rpm: 60, used: 11, tpm: 150000, tUsed: 21900 },
  imperium: { rpm: 60, used: 5, tpm: 150000, tUsed: 9700 },
};

const STEP_EXPLANATIONS: Record<
  string,
  {
    why: string;
    how: string;
    alternatives: string[];
    confidence: number;
  }
> = {
  aegis: {
    why: 'PARAGON was selected first because the intent mentions threat risk — PARAGON owns the threat-intelligence domain and its output is required by the Pulse stitching step.',
    how: 'Dispatched `GET /api/aegis/threat-summary` with tenant-scoped auth. Response includes CVSS-weighted top threats, active incident count, and MITRE technique coverage.',
    alternatives: [
      'Pull from SEXTANT first (rejected — no threat context dependency)',
      'Use cached threat snapshot (rejected — staleness > 15 min at call time)',
    ],
    confidence: 0.94,
  },
  vessels: {
    why: 'SEXTANT was included because maritime risk is part of the SZL cross-portfolio surface area and the Fleet Command module has recent high-severity alerts.',
    how: 'Called `GET /api/vessels/fleet-risk` returning per-vessel risk scores and one port-call flag. Result fed into Pulse stitching alongside PARAGON output.',
    alternatives: [
      "Skip SEXTANT (rejected — user's portfolio includes maritime exposure)",
      'Use AIS snapshot (rejected — live position data available within rate limit)',
    ],
    confidence: 0.88,
  },
  terra: {
    why: 'DOMAINE distress signals are part of the SZL portfolio KPI roll-up. 3 properties crossed the distress threshold since last brief.',
    how: 'Called `GET /api/terra/distress-summary` with `?top=5&since=24h`. Returns property IDs, distress scores, and recommended actions.',
    alternatives: [
      'Use cached portfolio snapshot (rejected — 3 new distress signals since cache)',
      'Only return properties in active deal pipeline (rejected — monitors all holdings)',
    ],
    confidence: 0.91,
  },
  pulse: {
    why: 'Pulse is the final stitching step — it takes structured outputs from all domain agents and compiles the executive brief format.',
    how: "Called `POST /api/pulse/compile` with the structured domain outputs. Pulse applies BLUF ranking, deduplication, and the user's preferred brief format.",
    alternatives: [
      'Stitch inline in orchestrator (rejected — Pulse has the briefing schema and user preference model)',
      'Skip Pulse and return raw domain outputs (rejected — not exec-readable)',
    ],
    confidence: 0.96,
  },
  command: {
    why: 'Command provides the cross-domain correlation layer — it detects when signals from PARAGON and SEXTANT share a threat actor or geo region.',
    how: 'Called `GET /api/command/correlations?domains=aegis,vessels` with the current run ID. Returns correlated events with confidence scores.',
    alternatives: [
      'Manual correlation in stitching step (rejected — Command has pre-built correlation graph)',
      'Skip correlation (rejected — cross-domain insight is the core value here)',
    ],
    confidence: 0.89,
  },
  'szl-holdings': {
    why: 'SZL Holdings contains the consolidated KPI store — governance score, Counsel run metrics, and portfolio health index.',
    how: 'Called `GET /api/holdings/kpi-snapshot` returning the 12 canonical KPIs with trend deltas. Snapshot is tenant-scoped and auth-gated.',
    alternatives: [
      'Pull KPIs from individual domain APIs (rejected — Holdings aggregates and normalizes units)',
      'Use investor-facing snapshot (rejected — too high-level for operational brief)',
    ],
    confidence: 0.93,
  },
  'carlota-jo': {
    why: 'Carlota Jo client engagement data was requested as part of the advisory portfolio snapshot.',
    how: 'Called `GET /api/carlota-jo/engagement-summary` returning active engagements, upcoming deliverables, and open invoices.',
    alternatives: [
      'Skip (rejected — user explicitly requested advisory portfolio data)',
      'Use CRM export (rejected — less structured than the API response)',
    ],
    confidence: 0.82,
  },
  'prism-counsel': {
    why: 'Prism Counsel legal matters were included because the compliance check intent requires open matter cross-reference.',
    how: 'Called `GET /api/prism/matters?status=open` returning matter IDs, risk classifications, and associated entities.',
    alternatives: [
      'Use matter summary only (rejected — entity list needed for cross-reference)',
      'Pull full matter text (rejected — exceeds token budget; entity list is sufficient)',
    ],
    confidence: 0.87,
  },
};

function RateLimitMiniBar({ used, total }: { used: number; total: number }) {
  const pct = (used / total) * 100;
  const color = pct >= 95 ? '#c96070' : pct >= 80 ? '#c9a85c' : '#5baa8a';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-12 rounded-full bg-praxis-bg overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function ExplainPanel({ step, onClose }: { step: OrchestrationStep; onClose: () => void }) {
  const explanation = STEP_EXPLANATIONS[step.appSlug];
  const rl = RATE_LIMITS[step.appSlug];
  const color = APP_COLORS[step.appSlug] ?? '#8896aa';

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-praxis-surface border-l border-[#a3e635]/20 z-50 flex flex-col shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-praxis">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#a3e635]" />
          <span className="text-sm font-semibold">Explain this Decision</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-praxis-bg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {step.appSlug.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color }}>
              {step.app}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/50">{step.action}</div>
          </div>
        </div>

        {explanation ? (
          <>
            <div className="bg-praxis-bg rounded-lg p-3">
              <div className="text-[10px] font-mono text-[#a3e635] mb-1.5 uppercase tracking-widest">
                Why chosen
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{explanation.why}</p>
            </div>

            <div className="bg-praxis-bg rounded-lg p-3">
              <div className="text-[10px] font-mono text-praxis-cyan mb-1.5 uppercase tracking-widest">
                How it ran
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{explanation.how}</p>
            </div>

            <div className="bg-praxis-bg rounded-lg p-3">
              <div className="text-[10px] font-mono text-muted-foreground/40 mb-1.5 uppercase tracking-widest">
                Alternatives rejected
              </div>
              <ul className="space-y-1.5">
                {explanation.alternatives.map((alt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-praxis-red/50 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-muted-foreground/60 leading-relaxed">
                      {alt}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-praxis-bg rounded-lg p-3">
              <div className="text-[10px] font-mono text-praxis-amber mb-1.5 uppercase tracking-widest">
                Confidence
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-praxis-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-praxis-green"
                    style={{ width: `${explanation.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-praxis-green">
                  {(explanation.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-praxis-bg rounded-lg p-3">
            <p className="text-xs text-muted-foreground/50">
              No reasoning trace available for this step.
            </p>
          </div>
        )}

        {rl && (
          <div className="bg-praxis-bg rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="w-3 h-3 text-praxis-amber" />
              <span className="text-[10px] font-mono text-praxis-amber uppercase tracking-widest">
                Rate Limits
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    Requests / min
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    {rl.used} / {rl.rpm}
                  </span>
                </div>
                <RateLimitMiniBar used={rl.used} total={rl.rpm} />
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    Tokens / min
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    {rl.tUsed.toLocaleString()} / {rl.tpm.toLocaleString()}
                  </span>
                </div>
                <RateLimitMiniBar used={rl.tUsed} total={rl.tpm} />
              </div>
            </div>
          </div>
        )}

        {step.output && (
          <div className="bg-praxis-bg rounded-lg p-3">
            <div className="text-[10px] font-mono text-praxis-green mb-1.5 uppercase tracking-widest">
              Summary
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{step.output}</p>
            <div className="flex gap-3 mt-2 text-[9px] font-mono text-muted-foreground/40">
              {step.durationMs !== undefined && <span>{step.durationMs}ms</span>}
              {step.httpStatus !== undefined && step.httpStatus > 0 && (
                <span>HTTP {step.httpStatus}</span>
              )}
              {step.confidence !== undefined && (
                <span
                  className={
                    step.confidence >= 0.7
                      ? 'text-praxis-green'
                      : step.confidence >= 0.4
                        ? 'text-praxis-amber'
                        : 'text-praxis-red'
                  }
                >
                  conf {(step.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}

        {step.rawPayload && (
          <div className="bg-praxis-bg rounded-lg p-3">
            <div className="text-[10px] font-mono text-praxis-cyan mb-1.5 uppercase tracking-widest">
              Raw API Payload
            </div>
            <pre className="text-[9px] font-mono text-muted-foreground/80 leading-snug whitespace-pre-wrap break-words max-h-64 overflow-y-auto bg-[var(--gi-bg-base)] rounded p-2 border border-praxis">
              {step.rawPayload}
            </pre>
          </div>
        )}

        <div className="text-[9px] font-mono text-muted-foreground/30 space-y-0.5">
          <div>STEP ID: {step.id}</div>
          <div>ENDPOINT: {step.endpoint}</div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  onExplain,
}: {
  step: OrchestrationStep;
  onExplain: (s: OrchestrationStep) => void;
}) {
  const color = APP_COLORS[step.appSlug] ?? '#8896aa';
  const rl = RATE_LIMITS[step.appSlug];
  return (
    <div
      className={`rounded-lg border p-3 ${
        step.status === 'running'
          ? 'border-praxis-cyan/40 bg-praxis-cyan/05'
          : step.status === 'done'
            ? 'border-praxis-green/30 bg-praxis-green/04'
            : step.status === 'error'
              ? 'border-praxis-red/30'
              : 'border-praxis'
      } bg-praxis-surface`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {step.appSlug.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold" style={{ color }}>
            {step.app}
          </div>
          <div className="text-[10px] text-muted-foreground/70 font-mono truncate">
            {step.action}
          </div>
        </div>
        <div className="shrink-0">
          {step.status === 'running' ? (
            <Loader className="w-3.5 h-3.5 animate-spin text-praxis-cyan" />
          ) : step.status === 'done' ? (
            <CheckCircle className="w-3.5 h-3.5 text-praxis-green" />
          ) : step.status === 'error' ? (
            <XCircle className="w-3.5 h-3.5 text-praxis-red" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground/40 mb-1">{step.endpoint}</div>
      {step.output && (
        <div className="text-[10px] text-muted-foreground bg-praxis-bg rounded px-2 py-1.5 leading-relaxed mt-1">
          {step.output}
        </div>
      )}
      {(step.durationMs !== undefined ||
        step.confidence !== undefined ||
        (step.httpStatus !== undefined && step.httpStatus > 0)) &&
        step.status !== 'pending' && (
          <div className="flex gap-2 text-[9px] font-mono text-muted-foreground/40 mt-1">
            {step.durationMs !== undefined && <span>{step.durationMs}ms</span>}
            {step.httpStatus !== undefined && step.httpStatus > 0 && (
              <span>HTTP {step.httpStatus}</span>
            )}
            {step.confidence !== undefined && (
              <span
                className={
                  step.confidence >= 0.7
                    ? 'text-praxis-green'
                    : step.confidence >= 0.4
                      ? 'text-praxis-amber'
                      : 'text-praxis-red'
                }
              >
                conf {(step.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

      {rl && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-praxis">
          <Gauge className="w-2.5 h-2.5 text-muted-foreground/30" />
          <RateLimitMiniBar used={rl.used} total={rl.rpm} />
        </div>
      )}

      <button
        onClick={() => onExplain(step)}
        className="mt-2 flex items-center gap-1 text-[9px] font-mono text-[#a3e635]/60 hover:text-[#a3e635] transition-colors"
      >
        <Lightbulb className="w-2.5 h-2.5" />
        Explain this decision
        <ChevronRight className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default function Orchestrator() {
  const [intent, setIntent] = useState('');
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const [history, setHistory] = useState<OrchestrationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainStep, setExplainStep] = useState<OrchestrationStep | null>(null);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    praxisApi
      .listOrchestrations()
      .then(setHistory)
      .catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await praxisApi.getOrchestration(id);
        setPlan(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoading(false);
          praxisApi
            .listOrchestrations()
            .then(setHistory)
            .catch(() => {});
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setLoading(false);
      }
    }, 1200);
  }

  async function handleRun(i?: string) {
    const finalIntent = i ?? intent;
    if (!finalIntent.trim()) return;
    setError(null);
    setLoading(true);
    setPlan(null);
    setExplainStep(null);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const { id } = await praxisApi.orchestrate(finalIntent.trim());
      const initial = await praxisApi.getOrchestration(id);
      setPlan(initial);
      startPolling(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orchestration failed');
      setLoading(false);
    }
  }

  async function handleRetry(id: string) {
    setError(null);
    setRetrying(true);
    setLoading(true);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await praxisApi.retryOrchestration(id);
      const refreshed = await praxisApi.getOrchestration(id);
      setPlan(refreshed);
      startPolling(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
      setLoading(false);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="min-h-full bg-praxis-bg p-6">
      <div
        className={`max-w-5xl mx-auto transition-all duration-200 ${explainStep ? 'mr-[24rem]' : ''}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Workflow className="w-5 h-5 text-praxis-amber" />
          <div>
            <h1 className="text-lg font-semibold">Cross-App Orchestrator</h1>
            <p className="text-xs text-muted-foreground">
              Agent of agents · Routes to 10 SZL artifacts · Stitches results · Click any step to
              explain
            </p>
          </div>
        </div>

        <div className="bg-praxis-surface border border-praxis-amber/20 rounded-xl p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <textarea
              className="flex-1 bg-praxis-bg border border-praxis rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:border-praxis-amber/50 text-foreground placeholder:text-muted-foreground/40"
              rows={2}
              placeholder="Describe what you want across the SZL portfolio…"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
              }}
            />
            <button
              onClick={() => handleRun()}
              disabled={loading || !intent.trim()}
              className="px-4 py-2 rounded-lg bg-praxis-amber/10 border border-praxis-amber/30 text-praxis-amber text-sm font-medium hover:bg-praxis-amber/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground/50 self-center">Try:</span>
            {EXAMPLE_INTENTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setIntent(ex.intent);
                  handleRun(ex.intent);
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-praxis-bg border border-praxis text-muted-foreground/60 hover:text-muted-foreground hover:border-praxis-amber/20 transition-colors flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5 text-praxis-amber/60" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-praxis-red/10 border border-praxis-red/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-praxis-red shrink-0" />
            <p className="text-xs text-praxis-red">{error}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Orchestration Plan</h2>
              <div className="flex items-center gap-2">
                {plan.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(plan.id)}
                    disabled={retrying}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-praxis-amber/10 border border-praxis-amber/30 text-praxis-amber hover:bg-praxis-amber/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {retrying ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCw className="w-3 h-3" />
                    )}
                    Retry
                  </button>
                )}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    plan.status === 'completed'
                      ? 'bg-praxis-green/10 text-praxis-green'
                      : plan.status === 'running' || plan.status === 'planning'
                        ? 'bg-praxis-cyan/10 text-praxis-cyan'
                        : plan.status === 'failed'
                          ? 'bg-praxis-red/10 text-praxis-red'
                          : 'bg-praxis-surface text-muted-foreground'
                  }`}
                >
                  {plan.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="bg-praxis-surface border border-praxis-amber/20 rounded-lg px-4 py-2 text-sm font-mono text-praxis-amber">
              {plan.intent}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {plan.steps.map((step) => (
                <StepCard key={step.id} step={step} onExplain={setExplainStep} />
              ))}
            </div>

            {plan.stitchedOutput && (
              <div className="bg-praxis-surface border border-praxis-green/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-praxis-green" />
                  <h3 className="text-sm font-semibold text-praxis-green">Stitched Output</h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {plan.stitchedOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {!plan && history.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Recent Orchestrations
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="w-full bg-praxis-surface border border-praxis rounded-lg px-4 py-3 hover:border-praxis-amber/20 transition-colors"
                >
                  <button
                    className="w-full text-left"
                    onClick={async () => {
                      const p = await praxisApi.getOrchestration(h.id);
                      setPlan(p);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground/50">{h.id}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          h.status === 'completed'
                            ? 'text-praxis-green'
                            : h.status === 'failed'
                              ? 'text-praxis-red'
                              : 'text-praxis-cyan'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{h.intent}</p>
                    <div className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                      {h.steps.length} steps
                    </div>
                  </button>
                  {h.status === 'failed' && (
                    <div className="mt-2 pt-2 border-t border-praxis flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(h.id);
                        }}
                        disabled={retrying}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-praxis-amber/10 border border-praxis-amber/30 text-praxis-amber hover:bg-praxis-amber/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3 h-3" />
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!plan && history.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground/40">
            <Workflow className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No orchestrations yet.</p>
            <p className="text-xs mt-1">Try one of the example intents above.</p>
          </div>
        )}
      </div>

      {explainStep && <ExplainPanel step={explainStep} onClose={() => setExplainStep(null)} />}
    </div>
  );
}
