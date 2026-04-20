import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ACCENT,
  AGENT_RUN_ATTRS,
  apiUrl,
  DOMAIN_COLORS,
  DOMAIN_ICONS,
  emitSpan,
  fetchJson,
} from './cognitive/shared';

function getCsrfToken(): string | undefined {
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? decodeURIComponent(match.trim().split('=').slice(1).join('=')) : undefined;
}

const OUTCOME_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  success: { color: '#22c55e', bg: '#22c55e18', label: 'Success' },
  partial: { color: '#f59e0b', bg: '#f59e0b18', label: 'Partial' },
  blocked: { color: '#ef4444', bg: '#ef444418', label: 'Blocked' },
  failed: { color: '#ef4444', bg: '#ef444418', label: 'Failed' },
};

const AUTONOMY_COLORS: Record<string, string> = {
  autonomous: '#22c55e',
  supervised: '#f59e0b',
  advisory: '#0ea5e9',
  'read-only': '#64748b',
};

interface RunSummary {
  runId: string;
  domain: string;
  agentId: string;
  userId: string;
  autonomyMode: string;
  objective: string;
  outcome: string;
  policyEvents: string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  costUsd: number;
  totalTokens: number;
  toolCallCount: number;
  evidenceCount: number;
  policyDecisionCount: number;
  approvalCount: number;
}

interface RunDetail extends RunSummary {
  toolCalls: { name: string; status: string }[];
  evidence: { kind: 'read' | 'write'; source: string; ref: string }[];
  policyDecisions: { policyId: string; decision: string; reason: string }[];
  approvals: { approvedBy: string; at: string; action: string }[];
  overrides: { overriddenBy?: string; at?: string; action?: string }[];
  spans: { spanId: string; name: string; latencyMs: number; status: string; model: string }[];
}

interface SpanDiff {
  spanId: string;
  name: string;
  originalLatencyMs: number;
  replayedLatencyMs: number;
  originalStatus: string;
  replayedStatus: string;
  changed: boolean;
}

interface ReplayResult {
  originalRunId: string;
  replayId: string;
  replayedAt: string;
  deterministicScore: number;
  diff: {
    spanDiffs: SpanDiff[];
    outcomeDiff: { original: string; replayed: string; changed: boolean };
    costDiff: { original: number; replayed: number };
  };
  replayedRun: RunDetail;
}

interface RunsApiResponse {
  runs: RunSummary[];
  total: number;
}

function fmt(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const s = OUTCOME_STYLES[outcome] ?? { color: '#64748b', bg: '#64748b18', label: outcome };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${s.color}40`,
      }}
    >
      {s.label.toUpperCase()}
    </span>
  );
}

function AutonomyBadge({ mode }: { mode: string }) {
  const color = AUTONOMY_COLORS[mode] ?? '#64748b';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: `${color}15`,
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${color}30`,
      }}
    >
      {mode}
    </span>
  );
}

function PolicyEventBadge({ event }: { event: string }) {
  const isBlock = event.includes('block') || event.includes('breach');
  const color = isBlock
    ? '#ef4444'
    : event.includes('approval') || event.includes('approved')
      ? '#22c55e'
      : '#0ea5e9';
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 600,
        color,
        background: `${color}12`,
        padding: '1px 6px',
        borderRadius: 3,
        border: `1px solid ${color}30`,
      }}
    >
      {event.replace(/_/g, ' ')}
    </span>
  );
}

function SpanBar({ spans, maxMs }: { spans: RunDetail['spans']; maxMs: number }) {
  if (!spans || spans.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
      {spans.map((s) => {
        const w = Math.max(3, (s.latencyMs / maxMs) * 100);
        const color = s.status === 'ok' ? ACCENT : s.status === 'blocked' ? '#ef4444' : '#f59e0b';
        return (
          <div key={s.spanId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 90,
                fontSize: 10,
                color: '#94a3b8',
                flexShrink: 0,
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 3,
                height: 14,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${w}%`,
                  background: color,
                  borderRadius: 3,
                  opacity: 0.7,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 9,
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                {fmt(s.latencyMs)}
              </span>
            </div>
            <div style={{ width: 60, fontSize: 10, color: '#64748b', flexShrink: 0 }}>
              {s.model}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiffPanel({ result, onClose }: { result: ReplayResult; onClose: () => void }) {
  const { diff } = result;
  const score = Math.round(result.deterministicScore * 100);
  const scoreColor = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${ACCENT}40`,
        borderRadius: 10,
        padding: 18,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Replay Diff</span>
          <span
            style={{
              fontSize: 11,
              color: scoreColor,
              background: `${scoreColor}15`,
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${scoreColor}30`,
              fontWeight: 700,
            }}
          >
            {score}% deterministic
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Original
          </div>
          <OutcomeBadge outcome={diff.outcomeDiff.original} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Cost: ${diff.costDiff.original.toFixed(5)}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${diff.outcomeDiff.changed ? '#f59e0b40' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Replayed
          </div>
          <OutcomeBadge outcome={diff.outcomeDiff.replayed} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Cost: ${diff.costDiff.replayed.toFixed(5)}
          </div>
          {diff.outcomeDiff.changed && (
            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>
              ⚠ Outcome changed
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
        Span-level diff
      </div>
      {diff.spanDiffs.map((sd) => (
        <div
          key={sd.spanId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '5px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ width: 80, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{sd.name}</div>
          <div style={{ flex: 1, display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ color: '#64748b' }}>{fmt(sd.originalLatencyMs)}</span>
            <span style={{ color: '#475569' }}>→</span>
            <span style={{ color: sd.changed ? '#f59e0b' : '#22c55e' }}>
              {fmt(sd.replayedLatencyMs)}
            </span>
          </div>
          <div style={{ width: 60, fontSize: 10 }}>
            {sd.originalStatus !== sd.replayedStatus ? (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{sd.replayedStatus}</span>
            ) : (
              <span style={{ color: '#22c55e' }}>✓ match</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RunDetailPanel({ run, onReplay }: { run: RunDetail; onReplay: (runId: string) => void }) {
  const totalMs = run.spans?.reduce((s, x) => s + x.latencyMs, 0) ?? 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Trace Timeline
        </div>
        <SpanBar spans={run.spans ?? []} maxMs={totalMs} />
      </div>

      {run.toolCalls && run.toolCalls.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Tool Calls
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {run.toolCalls.map((tc, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color:
                    tc.status === 'ok'
                      ? '#22c55e'
                      : tc.status === 'blocked'
                        ? '#ef4444'
                        : '#f59e0b',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '3px 10px',
                  borderRadius: 5,
                }}
              >
                {tc.name} <span style={{ opacity: 0.6 }}>({tc.status})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {run.evidence && run.evidence.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Evidence
          </div>
          {run.evidence.map((ev, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: ev.kind === 'read' ? '#0ea5e9' : '#a855f7',
                  background: ev.kind === 'read' ? '#0ea5e915' : '#a855f715',
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                {ev.kind.toUpperCase()}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{ev.source}</span>
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
                {ev.ref}
              </span>
            </div>
          ))}
        </div>
      )}

      {run.policyDecisions && run.policyDecisions.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Policy Decisions
          </div>
          {run.policyDecisions.map((pd, i) => {
            const decColor =
              pd.decision === 'allow' ? '#22c55e' : pd.decision === 'block' ? '#ef4444' : '#f59e0b';
            return (
              <div
                key={i}
                style={{
                  padding: '8px 10px',
                  background: `${decColor}08`,
                  border: `1px solid ${decColor}25`,
                  borderRadius: 7,
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: decColor,
                      background: `${decColor}18`,
                      padding: '1px 7px',
                      borderRadius: 3,
                    }}
                  >
                    {pd.decision.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                    {pd.policyId}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{pd.reason}</div>
              </div>
            );
          })}
        </div>
      )}

      {run.approvals && run.approvals.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Approvals
          </div>
          {run.approvals.map((ap, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 11, color: '#22c55e', flex: 1 }}>{ap.action}</span>
              <span style={{ fontSize: 10, color: '#475569' }}>
                {ap.approvedBy} · {new Date(ap.at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onReplay(run.runId)}
        style={{
          background: ACCENT,
          border: 'none',
          borderRadius: 7,
          padding: '10px 0',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        ▶ Replay Against Current Runtime
      </button>
    </div>
  );
}

export function RunConsole() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [replaying, setReplaying] = useState(false);

  const [filterDomain, setFilterDomain] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterAutonomy, setFilterAutonomy] = useState('all');
  const [filterPolicyBlock, setFilterPolicyBlock] = useState(false);

  const domains = ['all', 'aegis', 'terra', 'vessels', 'prism', 'pulse'];
  const outcomes = ['all', 'success', 'partial', 'blocked', 'failed'];
  const autonomyModes = ['all', 'autonomous', 'supervised', 'advisory', 'read-only'];

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const params = new URLSearchParams();
      if (filterDomain !== 'all') params.set('domain', filterDomain);
      if (filterOutcome !== 'all') params.set('outcome', filterOutcome);
      if (filterAutonomy !== 'all') params.set('autonomyMode', filterAutonomy);
      if (filterPolicyBlock) params.set('hasPolicyBlock', 'true');
      const qs = params.toString();
      const data = await fetchJson<RunsApiResponse>(apiUrl(`/runs${qs ? `?${qs}` : ''}`));
      setRuns(data.runs);
      setTotal(data.total);
      emitSpan({
        name: 'run_console.list',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: filterDomain,
          [AGENT_RUN_ATTRS.RUN_OUTCOME]: filterOutcome,
          [AGENT_RUN_ATTRS.RUN_AUTONOMY_MODE]: filterAutonomy,
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/runs',
          'run_console.results_count': data.total,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load runs';
      setError(msg.startsWith('HTTP 401') ? 'Sign in to view agent runs.' : msg);
      emitSpan({
        name: 'run_console.list',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: filterDomain,
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/runs',
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [filterDomain, filterOutcome, filterAutonomy, filterPolicyBlock]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  async function handleSelectRun(run: RunSummary) {
    setDetailLoading(true);
    setReplayResult(null);
    const start = performance.now();
    try {
      const data = await fetchJson<RunDetail>(apiUrl(`/runs/${run.runId}`));
      setSelectedRun(data);
      emitSpan({
        name: 'run_console.detail',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_ID]: data.runId,
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: data.domain,
          [AGENT_RUN_ATTRS.RUN_OUTCOME]: data.outcome,
          [AGENT_RUN_ATTRS.RUN_AUTONOMY_MODE]: data.autonomyMode,
          [AGENT_RUN_ATTRS.RUN_OBJECTIVE]: data.objective,
          [AGENT_RUN_ATTRS.RUN_LATENCY_MS]: data.latencyMs,
          [AGENT_RUN_ATTRS.RUN_COST_USD]: data.costUsd,
          [AGENT_RUN_ATTRS.RUN_TOTAL_TOKENS]: data.totalTokens,
          [AGENT_RUN_ATTRS.RUN_TOOL_CALL_COUNT]: data.toolCallCount,
          [AGENT_RUN_ATTRS.RUN_EVIDENCE_COUNT]: data.evidenceCount,
          [AGENT_RUN_ATTRS.RUN_POLICY_GATE_COUNT]: data.policyDecisionCount,
          [AGENT_RUN_ATTRS.RUN_APPROVAL_COUNT]: data.approvalCount,
          [AGENT_RUN_ATTRS.RUN_USER_ID]: data.userId,
          [AGENT_RUN_ATTRS.RUN_HAS_FAILURE]:
            data.outcome === 'failed' || data.outcome === 'blocked',
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
    } catch (err) {
      const summaryDetail: RunDetail = {
        ...run,
        toolCalls: [],
        evidence: [],
        policyDecisions: [],
        approvals: [],
        overrides: [],
        spans: [],
      };
      setSelectedRun(summaryDetail);
      emitSpan({
        name: 'run_console.detail',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_ID]: run.runId,
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: run.domain,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleReplay(runId: string) {
    setReplaying(true);
    setReplayResult(null);
    const start = performance.now();
    try {
      const csrfToken = getCsrfToken();
      const data = await fetchJson<ReplayResult>(apiUrl(`/runs/${runId}/replay`), {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
      });
      setReplayResult(data);
      emitSpan({
        name: 'run_console.replay',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_ID]: runId,
          [AGENT_RUN_ATTRS.RUN_OUTCOME]: data.replayedRun.outcome,
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: data.replayedRun.domain,
          [AGENT_RUN_ATTRS.RUN_LATENCY_MS]: data.replayedRun.latencyMs,
          [AGENT_RUN_ATTRS.RUN_COST_USD]: data.replayedRun.costUsd,
          [AGENT_RUN_ATTRS.RUN_RETRY_COUNT]: 1,
          'run_console.replay.id': data.replayId,
          'run_console.replay.deterministic_score': data.deterministicScore,
          'run_console.replay.outcome_changed': data.diff.outcomeDiff.changed,
          'run_console.replay.span_diff_count': data.diff.spanDiffs.filter((d) => d.changed).length,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'ok',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replay failed');
      emitSpan({
        name: 'run_console.replay',
        attributes: {
          [AGENT_RUN_ATTRS.RUN_ID]: runId,
        },
        durationMs: Math.round(performance.now() - start),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setReplaying(false);
    }
  }

  const successRate =
    runs.length > 0
      ? ((runs.filter((r) => r.outcome === 'success').length / runs.length) * 100).toFixed(0)
      : '—';
  const blockedCount = runs.filter((r) => r.outcome === 'blocked').length;
  const avgLatency =
    runs.length > 0
      ? fmt(Math.round(runs.reduce((s, r) => s + r.latencyMs, 0) / runs.length))
      : '—';
  const policyBlockRuns = runs.filter((r) => r.policyEvents.includes('policy_block')).length;

  return (
    <div
      style={{
        background: '#080c14',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Run Console</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}20`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              LIVE
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Inspect, trace, and replay every agent run end-to-end. Examine prompts, tool calls,
            evidence, policy decisions, approvals, and outcomes.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Total Runs', value: total, color: ACCENT },
            {
              label: `Pass Rate (${runs.length} shown)`,
              value: `${successRate}%`,
              color: '#22c55e',
            },
            { label: 'Blocked Runs', value: blockedCount, color: '#ef4444' },
            { label: 'Avg Latency', value: avgLatency, color: '#f59e0b' },
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
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <FilterSelect
            label="Domain"
            value={filterDomain}
            options={domains}
            onChange={setFilterDomain}
          />
          <FilterSelect
            label="Outcome"
            value={filterOutcome}
            options={outcomes}
            onChange={setFilterOutcome}
          />
          <FilterSelect
            label="Autonomy"
            value={filterAutonomy}
            options={autonomyModes}
            onChange={setFilterAutonomy}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            <input
              type="checkbox"
              checked={filterPolicyBlock}
              onChange={(e) => setFilterPolicyBlock(e.target.checked)}
              style={{ accentColor: '#ef4444' }}
            />
            Policy blocks only
          </label>
          {policyBlockRuns > 0 && (
            <span
              style={{
                fontSize: 11,
                color: '#ef4444',
                background: '#ef444415',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #ef444430',
              }}
            >
              {policyBlockRuns} policy block{policyBlockRuns !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {error && (
          <div
            style={{
              background: '#ef444418',
              border: '1px solid #ef444440',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              color: '#ef4444',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedRun ? '1fr 460px' : '1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div>
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
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
                Loading runs…
              </div>
            )}

            {!loading && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 90px 90px 60px 80px',
                    gap: 8,
                    padding: '6px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 4,
                  }}
                >
                  {['Run / Objective', 'Domain', 'Mode', 'Outcome', 'Latency', 'Policy'].map(
                    (h) => (
                      <div
                        key={h}
                        style={{
                          fontSize: 10,
                          color: '#475569',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </div>
                    ),
                  )}
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
                    No runs match the current filters
                  </div>
                )}
                {runs.map((run) => (
                  <div
                    key={run.runId}
                    onClick={() => void handleSelectRun(run)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 90px 90px 60px 80px',
                      gap: 8,
                      padding: '12px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: selectedRun?.runId === run.runId ? `${ACCENT}08` : 'transparent',
                      borderLeft:
                        selectedRun?.runId === run.runId
                          ? `2px solid ${ACCENT}`
                          : '2px solid transparent',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#e2e8f0',
                          marginBottom: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {run.objective}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569' }}>
                        {run.agentId} · {run.userId} · {new Date(run.startedAt).toLocaleString()}
                      </div>
                      {run.policyEvents.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {run.policyEvents.slice(0, 3).map((e) => (
                            <PolicyEventBadge key={e} event={e} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: DOMAIN_COLORS[run.domain] ?? DOMAIN_COLORS['default'],
                          background: `${DOMAIN_COLORS[run.domain] ?? DOMAIN_COLORS['default']}15`,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {DOMAIN_ICONS[run.domain] ?? DOMAIN_ICONS['default']} {run.domain}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <AutonomyBadge mode={run.autonomyMode} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <OutcomeBadge outcome={run.outcome} />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      {fmt(run.latencyMs)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >
                      {run.policyDecisionCount > 0 && <span>{run.policyDecisionCount}P</span>}
                      {run.approvalCount > 0 && (
                        <span style={{ color: '#22c55e' }}>+{run.approvalCount}A</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {selectedRun && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: 20,
                position: 'sticky',
                top: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#e2e8f0',
                      marginBottom: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedRun.objective}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <OutcomeBadge outcome={selectedRun.outcome} />
                    <AutonomyBadge mode={selectedRun.autonomyMode} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569' }}>
                    <span>⏱ {fmt(selectedRun.latencyMs)}</span>
                    <span>🪙 ${selectedRun.costUsd?.toFixed(5)}</span>
                    <span>◆ {selectedRun.totalTokens?.toLocaleString()} tok</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRun(null);
                    setReplayResult(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: 1,
                    marginLeft: 10,
                  }}
                >
                  ×
                </button>
              </div>

              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569' }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: `2px solid ${ACCENT}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto',
                    }}
                  />
                </div>
              ) : (
                <RunDetailPanel run={selectedRun} onReplay={(id) => void handleReplay(id)} />
              )}

              {replaying && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 0',
                    color: ACCENT,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: `2px solid ${ACCENT}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Replaying against current runtime…
                </div>
              )}

              {replayResult && !replaying && (
                <DiffPanel result={replayResult} onClose={() => setReplayResult(null)} />
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          color: '#e2e8f0',
          fontSize: 12,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: '#0f172a' }}>
            {o === 'all' ? `All ${label}s` : o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RunConsole;
