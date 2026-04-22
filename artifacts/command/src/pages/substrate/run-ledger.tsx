/**
 * Run Ledger — detail view for a single RunLedgerEntry.
 *
 * Shows: plan summary, sources + retrieval scores, tool calls with latency/
 * outcome, approval events, policy outcomes, eval scores, stage timings, and
 * the quality-gate result. Matched to the existing Command page design style.
 *
 * Route: /substrate/ledger/:runId  (or ?runId= for query param access)
 * Data source: GET /api/v1/runs/:runId/ledger
 */

import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Layers,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearch } from 'wouter';
import type {
  LedgerApprovalEvent,
  LedgerEvalScore,
  LedgerPolicyOutcome,
  LedgerSource,
  LedgerStageTiming,
  LedgerToolCall,
  QualityGateFailingGate,
  QualityGateResult,
  RunLedgerEntry,
} from './governance-types';
import { formatAge } from './layout';
import { useRunLedger, useRunLedgerList } from './use-governance';

const ACCENT = '#22d3ee';
const SUB = '/substrate';

const GATE_STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: typeof CheckCircle2 }
> = {
  complete: { color: '#22c55e', label: 'COMPLETE', icon: CheckCircle2 },
  degraded: { color: '#f59e0b', label: 'DEGRADED', icon: AlertTriangle },
  blocked: { color: '#ef4444', label: 'BLOCKED', icon: XCircle },
  pending: { color: 'rgba(255,255,255,0.3)', label: 'PENDING', icon: Clock },
};

const OUTCOME_COLORS: Record<string, string> = {
  success: '#22c55e',
  failure: '#ef4444',
  skipped: 'rgba(255,255,255,0.3)',
};

const POLICY_COLORS: Record<string, string> = {
  pass: '#22c55e',
  'require-approval': '#f59e0b',
  block: '#ef4444',
  pending: 'rgba(255,255,255,0.3)',
};

const VERDICT_COLORS: Record<string, string> = {
  approve: '#22c55e',
  deny: '#ef4444',
  escalate: '#f59e0b',
  timed_out: 'rgba(255,255,255,0.3)',
  pending: '#f59e0b',
};

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'hsl(214,10%,11%)', borderColor: 'hsla(0,0%,100%,0.10)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <Icon className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="text-sm font-medium flex-1" style={{ color: 'hsl(38,8%,92%)' }}>
          {title}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4" style={{ color: 'hsl(214,7%,35%)' }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: 'hsl(214,7%,35%)' }} />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
}

function ScoreBar({
  value,
  threshold,
  color,
}: {
  value: number;
  threshold: number;
  color: string;
}) {
  return (
    <div
      className="relative h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{ width: `${Math.min(value * 100, 100)}%`, background: color }}
      />
      <div
        className="absolute inset-y-0 w-px"
        style={{ left: `${threshold * 100}%`, background: 'rgba(255,255,255,0.25)' }}
      />
    </div>
  );
}

function GateResult({ result }: { result: QualityGateResult }) {
  const cfg = GATE_STATUS_CONFIG[result.status] ?? GATE_STATUS_CONFIG.pending!;
  const Icon = cfg.icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        <span className="text-sm font-semibold" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        <span className="text-xs" style={{ color: 'hsl(214,7%,45%)' }}>
          · evaluated {formatAge(Date.now() - result.evaluatedAt)} ago
        </span>
      </div>
      <p
        className="text-xs rounded p-2.5"
        style={{ background: 'rgba(255,255,255,0.03)', color: 'hsl(38,8%,80%)' }}
      >
        {result.recommendedNextAction}
      </p>
      {result.failingGates.length > 0 && (
        <div className="space-y-2">
          {result.failingGates.map((gate: QualityGateFailingGate, i) => (
            <div
              key={i}
              className="rounded p-2.5 border"
              style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: '#ef4444' }}
                />
                <div>
                  <p
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: '#ef4444' }}
                  >
                    {gate.gate}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(38,8%,80%)' }}>
                    {gate.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LedgerDetail({ entry }: { entry: RunLedgerEntry }) {
  const gateStatus = GATE_STATUS_CONFIG[entry.gateStatus] ?? GATE_STATUS_CONFIG.pending!;
  const GateIcon = gateStatus.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-xl border p-4"
        style={{ background: 'hsl(214,10%,11%)', borderColor: 'hsla(0,0%,100%,0.10)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-mono uppercase tracking-wider mb-1"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              Objective
            </p>
            <p className="text-sm font-medium" style={{ color: 'hsl(38,8%,92%)' }}>
              {entry.objective}
            </p>
            <div
              className="flex flex-wrap gap-3 mt-2 text-[10px]"
              style={{ color: 'hsl(214,7%,45%)' }}
            >
              <span>
                Run: <code className="font-mono">{entry.runId.slice(0, 12)}…</code>
              </span>
              {entry.traceId && (
                <span>
                  Trace: <code className="font-mono">{entry.traceId.slice(0, 12)}…</code>
                </span>
              )}
              {entry.tenantId && <span>Tenant: {entry.tenantId}</span>}
              {entry.actor && <span>Actor: {entry.actor}</span>}
              {entry.totalDurationMs && (
                <span>Duration: {entry.totalDurationMs.toLocaleString()}ms</span>
              )}
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: `${gateStatus.color}15` }}
          >
            <GateIcon className="w-4 h-4" style={{ color: gateStatus.color }} />
            <span className="text-xs font-semibold" style={{ color: gateStatus.color }}>
              {gateStatus.label}
            </span>
          </div>
        </div>
        {entry.planSummary && (
          <p
            className="text-xs mt-2 pt-2 border-t"
            style={{ borderColor: 'hsla(0,0%,100%,0.08)', color: 'hsl(214,7%,55%)' }}
          >
            Plan: {entry.planSummary} ({entry.planStepCount} steps)
          </p>
        )}
      </div>

      {/* Quality Gate */}
      {entry.gateResult && (
        <Section title="Quality Gate" icon={Shield}>
          <GateResult result={entry.gateResult as QualityGateResult} />
        </Section>
      )}

      {/* Sources */}
      {entry.sourcesConsulted.length > 0 && (
        <Section title={`Sources Consulted (${entry.sourcesConsulted.length})`} icon={Database}>
          <div className="space-y-2">
            {entry.sourcesConsulted.map((source: LedgerSource, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b last:border-0"
                style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono truncate"
                      style={{ color: 'hsl(38,8%,80%)' }}
                    >
                      {source.sourceId}
                    </span>
                    <span
                      className="px-1 py-0.5 rounded text-[9px]"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(214,7%,45%)' }}
                    >
                      {source.sourceType}
                    </span>
                  </div>
                  {source.summary && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'hsl(214,7%,45%)' }}>
                      {source.summary}
                    </p>
                  )}
                </div>
                <div className="w-20 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
                      SCORE
                    </span>
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: source.retrievalScore > 0.5 ? '#22c55e' : '#f59e0b' }}
                    >
                      {(source.retrievalScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ScoreBar
                    value={source.retrievalScore}
                    threshold={0.3}
                    color={source.retrievalScore > 0.5 ? '#22c55e' : '#f59e0b'}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tool Calls */}
      {entry.toolCalls.length > 0 && (
        <Section title={`Tool Calls (${entry.toolCalls.length})`} icon={Activity}>
          <div className="space-y-2">
            {entry.toolCalls.map((call: LedgerToolCall, i) => {
              const color = OUTCOME_COLORS[call.outcome] ?? 'rgba(255,255,255,0.3)';
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono truncate"
                        style={{ color: 'hsl(38,8%,80%)' }}
                      >
                        {call.toolId}
                      </span>
                      <span className="text-[9px]" style={{ color: 'hsl(214,7%,35%)' }}>
                        step:{call.stepId.slice(0, 8)}
                      </span>
                    </div>
                    {call.error && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#ef4444' }}>
                        {call.error}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-mono shrink-0"
                    style={{ color: 'hsl(214,7%,45%)' }}
                  >
                    {call.latencyMs}ms
                  </span>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color }}>
                    {call.outcome}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Approvals */}
      {entry.approvalEvents.length > 0 && (
        <Section title={`Approval Events (${entry.approvalEvents.length})`} icon={Shield}>
          <div className="space-y-2">
            {entry.approvalEvents.map((event: LedgerApprovalEvent, i) => {
              const color = VERDICT_COLORS[event.verdict] ?? 'rgba(255,255,255,0.3)';
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono" style={{ color: 'hsl(38,8%,80%)' }}>
                      {event.requestId.slice(0, 12)}…
                    </span>
                    {event.actor && (
                      <span className="text-[10px] ml-2" style={{ color: 'hsl(214,7%,45%)' }}>
                        by {event.actor}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color }}>
                    {event.verdict}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Policy Outcomes */}
      {entry.policyOutcomes.length > 0 && (
        <Section
          title={`Policy Outcomes (${entry.policyOutcomes.length})`}
          icon={Shield}
          defaultOpen={false}
        >
          <div className="space-y-2">
            {entry.policyOutcomes.map((outcome: LedgerPolicyOutcome, i) => {
              const color = POLICY_COLORS[outcome.result] ?? 'rgba(255,255,255,0.3)';
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: 'hsl(38,8%,80%)' }}>
                        {outcome.policyId}
                      </span>
                      {outcome.tier && (
                        <span
                          className="text-[9px] px-1 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(214,7%,45%)' }}
                        >
                          {outcome.tier}
                        </span>
                      )}
                    </div>
                    {outcome.reason && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
                        {outcome.reason}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color }}>
                    {outcome.result}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Eval Scores */}
      {entry.evalScores.length > 0 && (
        <Section
          title={`Eval Scores (${entry.evalScores.length})`}
          icon={BookOpen}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {entry.evalScores.map((score: LedgerEvalScore, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'hsl(38,8%,80%)' }}>
                    {score.metric}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono"
                      style={{ color: score.passed ? '#22c55e' : '#ef4444' }}
                    >
                      {(score.score * 100).toFixed(0)}%
                    </span>
                    {score.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                    )}
                  </div>
                </div>
                <ScoreBar
                  value={score.score}
                  threshold={score.threshold}
                  color={score.passed ? '#22c55e' : '#ef4444'}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Stage Timings */}
      {entry.stageTimings.length > 0 && (
        <Section title="Stage Timings" icon={Layers} defaultOpen={false}>
          <div className="space-y-1">
            {entry.stageTimings.map((timing: LedgerStageTiming, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-1.5 border-b last:border-0"
                style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
              >
                <span
                  className="text-xs font-mono w-32 shrink-0"
                  style={{ color: 'hsl(214,7%,55%)' }}
                >
                  {timing.phase}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((timing.durationMs / (entry.totalDurationMs || 1)) * 100, 100)}%`,
                      background: `${ACCENT}80`,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-mono shrink-0"
                  style={{ color: 'hsl(214,7%,45%)' }}
                >
                  {timing.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/** Full page: /substrate/ledger/:runId */
export function RunLedgerPage() {
  const params = useParams<{ runId?: string }>();
  const search = useSearch();
  const queryRunId = new URLSearchParams(search).get('runId');
  const runId = params.runId ?? queryRunId ?? null;

  const { entry, loading, error, refetch } = useRunLedger(runId);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(214,10%,9%)', color: 'hsl(38,8%,92%)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={SUB}>
            <a
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-white"
              style={{ color: 'hsl(214,7%,45%)' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Substrate
            </a>
          </Link>
          <span style={{ color: 'hsl(214,7%,30%)' }}>/</span>
          <span className="text-xs font-mono" style={{ color: 'hsl(214,7%,55%)' }}>
            Run Ledger
          </span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" style={{ color: ACCENT }} />
              Run Ledger
              {runId && (
                <span className="text-xs font-mono ml-1" style={{ color: 'hsl(214,7%,45%)' }}>
                  {runId.slice(0, 12)}…
                </span>
              )}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Governed run audit artifact with quality gate evaluation
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsl(214,7%,55%)' }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {!runId && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Database className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'hsl(214,7%,45%)' }}>
              No run ID specified
            </p>
            <p className="text-xs" style={{ color: 'hsl(214,7%,30%)' }}>
              Navigate here from a run detail page or pass ?runId=
            </p>
          </div>
        )}

        {runId && loading && !entry && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
          </div>
        )}

        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#ef4444',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {runId && !loading && !entry && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Database className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'hsl(214,7%,45%)' }}>
              No ledger entry found for this run
            </p>
            <p className="text-xs" style={{ color: 'hsl(214,7%,30%)' }}>
              The run may not have completed or may not use the governed ledger yet.
            </p>
          </div>
        )}

        {entry && <LedgerDetail entry={entry} />}
      </div>
    </div>
  );
}

/** Compact list widget: embeds a list of recent ledger entries. */
export function RunLedgerList() {
  const { entries, loading, error, refetch } = useRunLedgerList();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(214,10%,9%)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: 'hsl(38,8%,92%)' }}
          >
            <Database className="w-5 h-5" style={{ color: ACCENT }} />
            Run Ledger
          </h1>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsl(214,7%,55%)' }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#ef4444',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Database className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'hsl(214,7%,45%)' }}>
              No run ledger entries yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const gateStatus =
                GATE_STATUS_CONFIG[entry.gateStatus] ?? GATE_STATUS_CONFIG.pending!;
              const GateIcon = gateStatus.icon;
              return (
                <Link key={entry.ledgerId} href={`${SUB}/ledger/${entry.runId}`}>
                  <a
                    className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-white/20"
                    style={{ background: 'hsl(214,10%,11%)', borderColor: 'hsla(0,0%,100%,0.10)' }}
                  >
                    <GateIcon className="w-4 h-4 shrink-0" style={{ color: gateStatus.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'hsl(38,8%,92%)' }}>
                        {entry.objective}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
                        {entry.runId.slice(0, 10)}… · {formatAge(Date.now() - entry.createdAt)} ago
                        {entry.totalDurationMs
                          ? ` · ${entry.totalDurationMs.toLocaleString()}ms`
                          : ''}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold shrink-0"
                      style={{ color: gateStatus.color }}
                    >
                      {gateStatus.label}
                    </span>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
