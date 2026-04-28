import { useStandardQuery } from '@szl-holdings/api-client-react';
import { type AuditEvent, AuditRail } from '@szl-holdings/design-system/cockpit/audit-rail';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Cpu,
  DollarSign,
  FlaskConical,
  GitCompare,
  Play,
  Shield,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  ACCENT,
  AGENT_RUN_ATTRS,
  apiUrl,
  emitSpan,
  fetchJson,
  tracedFetch,
} from './cognitive/shared';

function getCsrfToken(): string | undefined {
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? decodeURIComponent(match.trim().split('=').slice(1).join('=')) : undefined;
}

type Tab = 'suites' | 'results' | 'compare';

const EVAL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  rule: { icon: <Shield className="h-3.5 w-3.5" />, color: '#8b7ac8', label: 'Rule Eval' },
  simulation: { icon: <Brain className="h-3.5 w-3.5" />, color: 'var(--gi-accent-blue)', label: 'Simulation' },
  'recommendation-quality': {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: '#22c55e',
    label: 'Rec Quality',
  },
  hallucination: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: '#ef4444',
    label: 'Hallucination',
  },
  'latency-cost': {
    icon: <DollarSign className="h-3.5 w-3.5" />,
    color: '#f59e0b',
    label: 'Latency/Cost',
  },
  'policy-compliance': {
    icon: <Shield className="h-3.5 w-3.5" />,
    color: '#f97316',
    label: 'Policy Compliance',
  },
  'operator-acceptance': {
    icon: <Cpu className="h-3.5 w-3.5" />,
    color: '#a855f7',
    label: 'Operator Acceptance',
  },
};

function getTypeConfig(evalType: string) {
  return (
    EVAL_TYPE_CONFIG[evalType] ?? {
      icon: <FlaskConical className="h-3.5 w-3.5" />,
      color: '#475569',
      label: evalType,
    }
  );
}

interface EvalSuiteConfig {
  suiteId: string;
  name: string;
  domain: string;
  caseCount: number;
  redTeamCount: number;
  evalType: string;
  version: number;
  tags: string[];
  description: string;
  graderTypes: string[];
}

interface EvalRunSummary {
  runId: string;
  suiteId: string;
  suiteName: string;
  domain: string;
  passRate: number;
  avgScore: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression: boolean;
  regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
  regressionNotes: string[];
  improvementNotes: string[];
  runAt: string;
  triggeredBy: string;
  avgLatencyMs: number;
  totalCostUsd: number;
}

interface EvalsApiResponse {
  suites: EvalSuiteConfig[];
  recentRuns: EvalRunSummary[];
  domains: string[];
  evalTypes: string[];
  totalSuites: number;
  totalRuns: number;
}

function RegressionBadge({ severity }: { severity: EvalRunSummary['regressionSeverity'] }) {
  const map: Record<string, { color: string; label: string }> = {
    none: { color: '#22c55e', label: 'No regression' },
    minor: { color: '#f59e0b', label: 'Minor regression' },
    major: { color: '#f97316', label: 'Major regression' },
    critical: { color: '#ef4444', label: 'Critical regression' },
  };
  const { color, label } = map[severity] ?? map.none!;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: `${color}18`,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

function SuiteCard({
  suite,
  selected,
  onSelect,
  onRun,
  running,
}: {
  suite: EvalSuiteConfig;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  running: boolean;
}) {
  const typeConfig = getTypeConfig(suite.evalType);

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? `${ACCENT}0a` : 'rgba(255,255,255,0.02)',
        border: selected ? `1px solid ${ACCENT}50` : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                color: typeConfig.color,
                background: `${typeConfig.color}15`,
                padding: '2px 8px',
                borderRadius: 4,
                border: `1px solid ${typeConfig.color}30`,
              }}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            {suite.domain && (
              <span
                style={{
                  fontSize: 10,
                  color: '#475569',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 7px',
                  borderRadius: 3,
                }}
              >
                {suite.domain}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: 4 }}>
            {suite.name}
          </div>
          <p style={{ fontSize: 12, color: 'var(--gi-text-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
            {suite.description}
          </p>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#475569' }}>
            <span>{suite.caseCount} cases</span>
            {suite.redTeamCount > 0 && (
              <span style={{ color: '#ef4444' }}>⚔ {suite.redTeamCount} red-team</span>
            )}
            {suite.graderTypes.slice(0, 2).map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          disabled={running}
          style={{
            flexShrink: 0,
            background: running ? 'rgba(255,255,255,0.05)' : ACCENT,
            color: running ? '#475569' : '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {running ? (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  border: '2px solid #fff4',
                  borderTop: '2px solid #fff8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Running…
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface VariantRunResult {
  runId: string;
  suiteId: string;
  suiteName: string;
  domain: string;
  passRate: number;
  avgScore: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression: boolean;
  regressionSeverity: EvalRunSummary['regressionSeverity'];
  regressionNotes: string[];
  improvementNotes: string[];
  runAt: string;
  avgLatencyMs: number;
  totalCostUsd: number;
  triggeredBy: string;
}

interface VariantCaseEvent {
  caseId: string;
  label: string;
  domain: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  costUsd: number;
  tokensUsed: number;
  failureReason?: string;
  progress: { completed: number; total: number };
}

function VariantComparePanel({ runs }: { runs: EvalRunSummary[] }) {
  const [baselineId, setBaselineId] = useState<string | null>(null);
  const [variant, setVariant] = useState({
    model: 'gpt-4o-mini',
    strategy: 'default',
    prompt: 'v2',
  });
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<{
    baseline: EvalRunSummary;
    variant: VariantRunResult;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveCases, setLiveCases] = useState<VariantCaseEvent[]>([]);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet', 'claude-3-haiku', 'gemini-1.5-pro'];
  const STRATEGIES = ['default', 'chain-of-thought', 'react', 'reflection', 'multi-agent'];
  const PROMPTS = ['v2', 'v1', 'v3-compressed', 'v3-verbose', 'zero-shot'];

  const baseline = runs.find((r) => r.runId === baselineId) ?? null;
  const canRun = !!baseline && !comparing;

  async function runVariantReplay() {
    if (!baseline) return;
    setComparing(true);
    setError(null);
    setCompareResult(null);
    setLiveCases([]);
    setProgress({ completed: 0, total: 0 });
    const start = performance.now();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const csrfToken = getCsrfToken();
      const url = apiUrl(`/evals/suites/${encodeURIComponent(baseline.suiteId)}/runs/variant`);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          model: variant.model,
          strategy: variant.strategy,
          promptId: variant.prompt,
          baselineRunId: baseline.runId,
          triggeredBy: 'variant-compare',
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completePayload: any = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const block of events) {
          let eventName = 'message';
          let dataLine = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          let parsed: any;
          try {
            parsed = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventName === 'start') {
            setProgress({ completed: 0, total: parsed.totalCases ?? 0 });
          } else if (eventName === 'case') {
            setLiveCases((prev) => [...prev, parsed as VariantCaseEvent]);
            if (parsed.progress) setProgress(parsed.progress);
          } else if (eventName === 'complete') {
            completePayload = parsed;
          } else if (eventName === 'error') {
            streamError = parsed.message ?? 'Variant replay failed';
          }
        }
      }

      if (streamError) throw new Error(streamError);
      if (!completePayload) throw new Error('Stream ended before completion');

      const variantRun: VariantRunResult = {
        runId: completePayload.runId,
        suiteId: completePayload.suiteId,
        suiteName: completePayload.suiteName,
        domain: completePayload.domain,
        passRate: completePayload.passRate,
        avgScore: completePayload.avgScore,
        totalCases: completePayload.totalCases,
        passed: completePayload.passed,
        failed: completePayload.failed,
        hasRegression: completePayload.hasRegression ?? false,
        regressionSeverity: completePayload.regressionSeverity ?? 'none',
        regressionNotes: completePayload.regressionNotes ?? [],
        improvementNotes: completePayload.improvementNotes ?? [],
        runAt: completePayload.runAt,
        avgLatencyMs: completePayload.avgLatencyMs ?? 0,
        totalCostUsd: completePayload.totalCostUsd ?? 0,
        triggeredBy: completePayload.triggeredBy ?? 'variant-compare',
      };

      emitSpan({
        name: 'eval_studio.variant_replay',
        attributes: {
          [AGENT_RUN_ATTRS.EVAL_SUITE_ID]: baseline.suiteId,
          [AGENT_RUN_ATTRS.EVAL_RUN_ID]: variantRun.runId,
          'agent.eval.baseline_run_id': baseline.runId,
          [AGENT_RUN_ATTRS.EVAL_PASS_RATE]: variantRun.passRate,
          [AGENT_RUN_ATTRS.EVAL_AVG_SCORE]: variantRun.avgScore,
          'agent.eval.avg_latency_ms': variantRun.avgLatencyMs,
          'agent.eval.total_cost_usd': variantRun.totalCostUsd,
          [AGENT_RUN_ATTRS.EVAL_HAS_REGRESSION]: variantRun.hasRegression,
          'agent.eval.regression_severity': variantRun.regressionSeverity,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_MODEL]: variant.model,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_STRATEGY]: variant.strategy,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_PROMPT]: variant.prompt,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
      setCompareResult({ baseline, variant: variantRun });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      emitSpan({
        name: 'eval_studio.variant_replay',
        attributes: {
          [AGENT_RUN_ATTRS.EVAL_SUITE_ID]: baseline.suiteId,
          'agent.eval.baseline_run_id': baseline.runId,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_MODEL]: variant.model,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_STRATEGY]: variant.strategy,
          [AGENT_RUN_ATTRS.EVAL_VARIANT_PROMPT]: variant.prompt,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setComparing(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          1. Select a baseline run
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 70px 70px 100px 120px',
              gap: 8,
              padding: '8px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {['', 'Suite', 'Pass%', 'Score', 'Latency', 'Regression'].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {runs.slice(0, 20).map((run) => {
            const isBaseline = baselineId === run.runId;
            return (
              <div
                key={run.runId}
                onClick={() => setBaselineId(isBaseline ? null : run.runId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 70px 70px 100px 120px',
                  gap: 8,
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  background: isBaseline ? `${ACCENT}0a` : 'transparent',
                  borderLeft: isBaseline ? `2px solid ${ACCENT}` : '2px solid transparent',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${isBaseline ? ACCENT : '#334155'}`,
                    background: isBaseline ? ACCENT : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isBaseline && (
                    <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>●</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gi-text-primary)' }}>
                    {run.suiteName}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569' }}>
                    {run.domain} · {new Date(run.runAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      run.passRate >= 0.85
                        ? '#22c55e'
                        : run.passRate >= 0.7
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                >
                  {(run.passRate * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {(run.avgScore * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {run.avgLatencyMs > 0 ? `${run.avgLatencyMs.toFixed(0)}ms` : '—'}
                </div>
                <RegressionBadge severity={run.regressionSeverity} />
              </div>
            );
          })}

          {runs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>
              No runs available — run an eval suite first
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            2. Configure Variant
          </div>
          <div style={{ fontSize: 11, color: '#334155', marginBottom: 14 }}>
            A new eval run is dispatched against the baseline suite using the selected model,
            strategy, and prompt. Results are compared in real time.
          </div>

          {baseline && (
            <div
              style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}30`,
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 14,
                fontSize: 11,
              }}
            >
              <span style={{ color: '#475569' }}>Baseline: </span>
              <span style={{ color: 'var(--gi-text-primary)', fontWeight: 500 }}>{baseline.suiteName}</span>
              <span style={{ color: '#475569' }}>
                {' '}
                · {(baseline.passRate * 100).toFixed(1)}% pass
              </span>
            </div>
          )}

          {[
            { key: 'model', label: 'Model', options: MODELS },
            { key: 'strategy', label: 'Orchestration Strategy', options: STRATEGIES },
            { key: 'prompt', label: 'Prompt Version', options: PROMPTS },
          ].map(({ key, label, options }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>{label}</div>
              <select
                value={variant[key as keyof typeof variant]}
                onChange={(e) => setVariant((v) => ({ ...v, [key]: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#e2e8f0',
                  fontSize: 12,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {options.map((o) => (
                  <option key={o} value={o} style={{ background: 'var(--gi-bg-base)' }}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {error && (
            <div
              style={{
                background: '#ef444418',
                border: '1px solid #ef444440',
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 10,
                color: '#ef4444',
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => void runVariantReplay()}
              disabled={!canRun}
              style={{
                flex: 1,
                background: canRun ? ACCENT : 'rgba(255,255,255,0.05)',
                color: canRun ? '#fff' : '#475569',
                border: 'none',
                borderRadius: 7,
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 600,
                cursor: canRun ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: canRun ? `0 2px 12px ${ACCENT}30` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {comparing ? (
                <>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid #fff8',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  {progress && progress.total > 0
                    ? `Running ${progress.completed}/${progress.total}…`
                    : 'Running variant…'}
                </>
              ) : (
                <>
                  <GitCompare className="h-3.5 w-3.5" />
                  {canRun ? 'Run Variant Replay' : 'Select a baseline run'}
                </>
              )}
            </button>
          </div>
        </div>

        {(comparing || liveCases.length > 0) && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Live variant cases
              </div>
              <div style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>
                {liveCases.filter((c) => c.passed).length} pass ·{' '}
                {liveCases.filter((c) => !c.passed).length} fail
              </div>
            </div>
            {progress && progress.total > 0 && (
              <div
                style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: `${(progress.completed / progress.total) * 100}%`,
                    height: '100%',
                    background: ACCENT,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {liveCases
                .slice(-30)
                .reverse()
                .map((c) => (
                  <div
                    key={c.caseId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '10px 1fr 60px 60px',
                      gap: 6,
                      padding: '4px 6px',
                      fontSize: 10,
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: c.passed ? '#22c55e' : '#ef4444',
                      }}
                    />
                    <span
                      style={{
                        color: '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.label}
                    </span>
                    <span style={{ color: 'var(--gi-text-muted)', textAlign: 'right' }}>
                      {(c.score * 100).toFixed(0)}%
                    </span>
                    <span style={{ color: 'var(--gi-text-muted)', textAlign: 'right' }}>{c.latencyMs}ms</span>
                  </div>
                ))}
              {liveCases.length === 0 && (
                <div
                  style={{ fontSize: 10, color: '#475569', padding: '6px 0', textAlign: 'center' }}
                >
                  Waiting for first case…
                </div>
              )}
            </div>
          </div>
        )}

        {compareResult && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${ACCENT}40`,
              borderRadius: 10,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gi-text-primary)', marginBottom: 4 }}>
              Variant vs Baseline
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>
              {compareResult.variant.suiteName} · {variant.model} ·{' '}
              {new Date(compareResult.variant.runAt).toLocaleDateString()}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 80px 80px 70px',
                gap: 4,
                padding: '4px 0 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 4,
              }}
            >
              {['Metric', 'Baseline', 'Variant', 'Delta'].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {[
              {
                label: 'Pass Rate',
                a: compareResult.baseline.passRate,
                b: compareResult.variant.passRate,
                format: (v: number) => `${(v * 100).toFixed(1)}%`,
                higherBetter: true,
              },
              {
                label: 'Avg Score',
                a: compareResult.baseline.avgScore,
                b: compareResult.variant.avgScore,
                format: (v: number) => `${(v * 100).toFixed(1)}%`,
                higherBetter: true,
              },
              {
                label: 'Latency',
                a: compareResult.baseline.avgLatencyMs,
                b: compareResult.variant.avgLatencyMs,
                format: (v: number) => (v > 0 ? `${v.toFixed(0)}ms` : '—'),
                higherBetter: false,
              },
              {
                label: 'Cost',
                a: compareResult.baseline.totalCostUsd,
                b: compareResult.variant.totalCostUsd,
                format: (v: number) => `$${v.toFixed(5)}`,
                higherBetter: false,
              },
            ].map(({ label, a, b, format, higherBetter }) => {
              const delta = b - a;
              const improved = higherBetter ? delta > 0.005 : delta < -0.001;
              const regressed = higherBetter ? delta < -0.005 : delta > 0.001;
              const deltaColor = improved ? '#22c55e' : regressed ? '#ef4444' : 'var(--gi-text-muted)';
              const deltaLabel =
                Math.abs(delta) < 0.001
                  ? '—'
                  : `${delta > 0 ? '▲' : '▼'} ${higherBetter ? `${(Math.abs(delta) * 100).toFixed(1)}pp` : label === 'Latency' ? `${Math.abs(delta).toFixed(0)}ms` : `$${Math.abs(delta).toFixed(5)}`}`;
              return (
                <div
                  key={label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 80px 80px 70px',
                    gap: 4,
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 11,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#475569' }}>{label}</span>
                  <span style={{ color: 'var(--gi-text-muted)' }}>{format(a)}</span>
                  <span style={{ color: 'var(--gi-text-primary)', fontWeight: 500 }}>{format(b)}</span>
                  <span style={{ color: deltaColor, fontWeight: 700 }}>{deltaLabel}</span>
                </div>
              );
            })}

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {[
                { label: 'Model / Strategy', value: `${variant.model} / ${variant.strategy}` },
                { label: 'Prompt version', value: variant.prompt },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#334155', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvalStudio() {
  const [tab, setTab] = useState<Tab>('suites');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<EvalSuiteConfig | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const pageLoadRef = useRef(performance.now());
  useEffect(() => {
    const loadedAt = performance.now();
    emitSpan({
      name: 'page.load',
      attributes: {
        [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/eval-studio',
        [AGENT_RUN_ATTRS.PAGE_LOAD_LATENCY_MS]: Math.round(loadedAt - pageLoadRef.current),
      },
      durationMs: Math.round(loadedAt - pageLoadRef.current),
      status: 'ok',
    });
  }, []);

  const { data, isLoading, error, refetch } = useStandardQuery<EvalsApiResponse>({
    queryKey: ['eval-studio', 'all'],
    queryFn: () =>
      tracedFetch<EvalsApiResponse>('eval_studio.suites.fetch', apiUrl('/evals'), {
        [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/eval-studio',
      }),
    staleTime: 60_000,
  });

  const suites = data?.suites ?? [];
  const runs = data?.recentRuns ?? [];

  const evalTypes = ['all', ...Object.keys(EVAL_TYPE_CONFIG)];

  const filteredSuites =
    filterType === 'all' ? suites : suites.filter((s) => s.evalType === filterType);

  const totalCases = suites.reduce((s, x) => s + x.caseCount, 0);
  const totalRedTeam = suites.reduce((s, x) => s + x.redTeamCount, 0);
  const avgPassRate = runs.length > 0 ? runs.reduce((s, r) => s + r.passRate, 0) / runs.length : 0;
  const regressionCount = runs.filter((r) => r.hasRegression).length;
  const criticalRegressionCount = runs.filter((r) => r.regressionSeverity === 'critical').length;

  async function handleRunSuite(suite: EvalSuiteConfig) {
    setRunningId(suite.suiteId);
    const start = performance.now();
    try {
      const csrfToken = getCsrfToken();
      const result = await fetchJson<{
        runId?: string;
        passRate?: number;
        avgScore?: number;
        hasRegression?: boolean;
        regressionSeverity?: string;
      }>(apiUrl('/evals/run'), {
        method: 'POST',
        body: JSON.stringify({ suiteId: suite.suiteId, triggeredBy: 'eval-studio' }),
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
      });
      emitSpan({
        name: 'eval_studio.suite_run',
        attributes: {
          [AGENT_RUN_ATTRS.EVAL_SUITE_ID]: suite.suiteId,
          [AGENT_RUN_ATTRS.EVAL_RUN_ID]: result?.runId ?? '',
          [AGENT_RUN_ATTRS.EVAL_PASS_RATE]: result?.passRate ?? 0,
          [AGENT_RUN_ATTRS.EVAL_AVG_SCORE]: result?.avgScore ?? 0,
          [AGENT_RUN_ATTRS.EVAL_HAS_REGRESSION]: result?.hasRegression ?? false,
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/eval-studio',
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
      await refetch();
      setTab('results');
    } catch (err) {
      emitSpan({
        name: 'eval_studio.suite_run',
        attributes: {
          [AGENT_RUN_ATTRS.EVAL_SUITE_ID]: suite.suiteId,
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/eval-studio',
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRunningId(null);
    }
  }

  const auditEvents: AuditEvent[] = runs.slice(0, 20).map((r) => ({
    eventId: r.runId,
    kind: r.hasRegression ? 'policy-gate' : 'system',
    actor: r.triggeredBy ?? 'system',
    actorType: r.triggeredBy?.startsWith('eval') ? 'human' : 'system',
    action: `Eval run: ${r.suiteName}`,
    detail: r.hasRegression
      ? `Regression detected — ${r.regressionSeverity}`
      : `Pass rate ${(r.passRate * 100).toFixed(1)}%`,
    timestamp: r.runAt,
    outcome: r.hasRegression
      ? r.regressionSeverity === 'critical'
        ? 'failure'
        : 'blocked'
      : 'success',
  }));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'suites', label: 'Eval Suites' },
    { id: 'results', label: `Results (${runs.length})` },
    { id: 'compare', label: 'Variant Compare' },
  ];

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>Eval Studio</span>
            <span
              style={{
                fontSize: 11,
                color: '#4d8fcc',
                background: '#4d8fcc20',
                padding: '2px 10px',
                borderRadius: 20,
                border: '1px solid #4d8fcc40',
                fontWeight: 600,
              }}
            >
              BETA
            </span>
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Run and compare evaluations across rule, simulation, recommendation quality,
            hallucination, latency/cost, policy compliance, and operator acceptance suites. Replay
            runs against variant models, prompts, and orchestration strategies.
          </p>
        </div>

        {!isLoading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: 'Eval Suites', value: suites.length, color: ACCENT },
              { label: 'Total Cases', value: totalCases, color: 'var(--gi-accent-blue)' },
              { label: 'Red-Team Cases', value: totalRedTeam, color: '#ef4444' },
              {
                label: 'Avg Pass Rate',
                value: `${(avgPassRate * 100).toFixed(1)}%`,
                color: '#22c55e',
              },
              {
                label: 'Regressions',
                value: regressionCount,
                color: criticalRegressionCount > 0 ? '#ef4444' : '#f59e0b',
              },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: `2px solid ${ACCENT}`,
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <div style={{ color: '#475569', fontSize: 13 }}>Loading eval suites…</div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#ef444418',
              border: '1px solid #ef444440',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#ef4444',
              fontSize: 13,
            }}
          >
            {error instanceof Error ? error.message : 'Failed to load eval data'}
          </div>
        )}

        {!isLoading && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 4,
                }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      background: tab === t.id ? ACCENT : 'transparent',
                      color: tab === t.id ? '#fff' : '#4a6070',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 18px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'suites' && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {evalTypes.map((et) => {
                    const cfg =
                      et === 'all' ? { color: '#475569', label: 'All' } : getTypeConfig(et);
                    const isActive = filterType === et;
                    return (
                      <button
                        key={et}
                        onClick={() => setFilterType(et)}
                        style={{
                          background: isActive ? cfg.color : 'rgba(255,255,255,0.04)',
                          color: isActive ? '#fff' : '#4a6070',
                          border: 'none',
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {tab === 'suites' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 340px',
                  gap: 20,
                  alignItems: 'start',
                }}
              >
                <div>
                  {filteredSuites.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#475569',
                        fontSize: 13,
                      }}
                    >
                      No eval suites found
                    </div>
                  )}
                  {filteredSuites.map((suite) => (
                    <SuiteCard
                      key={suite.suiteId}
                      suite={suite}
                      selected={selectedSuite?.suiteId === suite.suiteId}
                      onSelect={() => setSelectedSuite(suite)}
                      onRun={() => void handleRunSuite(suite)}
                      running={runningId === suite.suiteId}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedSuite && (
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10,
                        padding: 18,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#e2e8f0',
                          marginBottom: 10,
                        }}
                      >
                        {selectedSuite.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          marginBottom: 14,
                        }}
                      >
                        {[
                          { label: 'Type', value: getTypeConfig(selectedSuite.evalType).label },
                          { label: 'Cases', value: selectedSuite.caseCount },
                          { label: 'Red-team', value: selectedSuite.redTeamCount },
                          { label: 'Version', value: `v${selectedSuite.version}` },
                          { label: 'Graders', value: selectedSuite.graderTypes.join(', ') || '—' },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: '#475569' }}>{label}</span>
                            <span style={{ color: 'var(--gi-text-primary)' }}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => void handleRunSuite(selectedSuite)}
                        disabled={!!runningId}
                        style={{
                          width: '100%',
                          background: runningId ? 'rgba(255,255,255,0.05)' : ACCENT,
                          color: runningId ? '#475569' : '#fff',
                          border: 'none',
                          borderRadius: 7,
                          padding: '10px 0',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: runningId ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        {runningId === selectedSuite.suiteId ? 'Running…' : '▶ Run Suite Now'}
                      </button>
                    </div>
                  )}

                  <AuditRail events={auditEvents.slice(0, 10)} maxHeight="320px" relative />
                </div>
              </div>
            )}

            {tab === 'results' && (
              <div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px 80px 100px 120px',
                      gap: 8,
                      padding: '8px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {['Suite', 'Pass%', 'Score', 'Cases', 'Latency', 'Status'].map((h) => (
                      <div
                        key={h}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#334155',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  {runs.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#475569',
                        fontSize: 13,
                      }}
                    >
                      No eval results yet — run an evaluation suite
                    </div>
                  )}

                  {runs.map((r) => (
                    <div key={r.runId}>
                      <div
                        onClick={() => setExpandedRun(expandedRun === r.runId ? null : r.runId)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 80px 80px 80px 100px 120px',
                          gap: 8,
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          alignItems: 'center',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {expandedRun === r.runId ? (
                              <ChevronDown className="h-3 w-3 text-[#475569]" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-[#475569]" />
                            )}
                            {r.suiteName ?? r.suiteId}
                          </div>
                          <div style={{ fontSize: 10, color: '#475569', marginLeft: 15 }}>
                            {r.domain ?? '—'} · {new Date(r.runAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              r.passRate >= 0.85
                                ? '#22c55e'
                                : r.passRate >= 0.7
                                  ? '#f59e0b'
                                  : '#ef4444',
                          }}
                        >
                          {(r.passRate * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {(r.avgScore * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {r.passed}/{r.totalCases}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {r.avgLatencyMs > 0 ? `${r.avgLatencyMs.toFixed(0)}ms` : '—'}
                        </div>
                        <RegressionBadge severity={r.regressionSeverity ?? 'none'} />
                      </div>

                      {expandedRun === r.runId && (
                        <div
                          style={{
                            padding: '12px 16px 16px',
                            background: 'rgba(255,255,255,0.01)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            {r.regressionNotes.length > 0 && (
                              <div
                                style={{
                                  background: '#ef444408',
                                  border: '1px solid #ef444425',
                                  borderRadius: 7,
                                  padding: 10,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#ef4444',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 6,
                                  }}
                                >
                                  Regressions
                                </div>
                                {r.regressionNotes.map((n, i) => (
                                  <div
                                    key={i}
                                    style={{ fontSize: 11, color: '#f87171', lineHeight: 1.5 }}
                                  >
                                    {n}
                                  </div>
                                ))}
                              </div>
                            )}
                            {r.improvementNotes.length > 0 && (
                              <div
                                style={{
                                  background: '#22c55e08',
                                  border: '1px solid #22c55e25',
                                  borderRadius: 7,
                                  padding: 10,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#22c55e',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 6,
                                  }}
                                >
                                  Improvements
                                </div>
                                {r.improvementNotes.map((n, i) => (
                                  <div
                                    key={i}
                                    style={{ fontSize: 11, color: '#86efac', lineHeight: 1.5 }}
                                  >
                                    {n}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#475569' }}>
                            <span>Cost: ${r.totalCostUsd.toFixed(5)}</span>
                            <span>Triggered by: {r.triggeredBy}</span>
                            <span>
                              Run ID:{' '}
                              <span style={{ fontFamily: 'monospace' }}>
                                {r.runId.slice(0, 16)}…
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'compare' && <VariantComparePanel runs={runs} />}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
