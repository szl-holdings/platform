import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  GitCompare,
  Hash,
  Play,
  Shield,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';

const API = '/api/nexus-mcp';
const ACCENT = '#22d3ee';

interface McpSession {
  id: string;
  clientIdentity: string;
  clientType: string;
  serverIdentity: string;
  serverType: string;
  status: string;
  riskLevel: string;
  toolCallCount: number;
  errorCount: number;
  policyViolationCount: number;
  pendingApprovalCount: number;
  avgLatencyMs: number | null;
  proofHash: string | null;
  startedAt: string;
  endedAt: string | null;
}

interface ToolCall {
  id: string;
  sessionId: string;
  toolName: string;
  toolSource: string;
  inputParams: Record<string, unknown>;
  outputSummary: string | null;
  latencyMs: number | null;
  outcome: string;
  policyResult: string;
  policyReason: string | null;
  approvalStatus: string;
  errorMessage: string | null;
  sequenceIndex: number;
  occurredAt: string;
}

function outcomeColor(outcome: string): string {
  if (outcome === 'success') return '#22c55e';
  if (outcome === 'error') return '#ef4444';
  return '#f59e0b';
}

function policyColor(result: string): string {
  if (result === 'pass') return '#22c55e';
  if (result === 'block') return '#ef4444';
  return '#f59e0b';
}

function approvalColor(status: string): string {
  if (status === 'approved') return '#22c55e';
  if (status === 'rejected') return '#ef4444';
  if (status === 'pending') return '#f59e0b';
  return 'hsl(214,7%,35%)';
}

function ToolCallWaterfallItem({
  call,
  maxLatency,
  replayMode,
  replayIndex,
  index,
}: {
  call: ToolCall;
  maxLatency: number;
  replayMode: boolean;
  replayIndex: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const latencyPct = maxLatency > 0 ? Math.round(((call.latencyMs ?? 0) / maxLatency) * 100) : 0;
  const dimmed = replayMode && index > replayIndex;
  const color = outcomeColor(call.outcome);

  return (
    <div
      className="border-b transition-all"
      style={{
        borderColor: 'hsla(0,0%,100%,0.06)',
        opacity: dimmed ? 0.3 : 1,
        background: replayMode && index === replayIndex ? `${color}08` : 'transparent',
      }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/3"
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className="text-[9px] font-mono w-5 flex-shrink-0 mt-0.5 text-right"
          style={{ color: 'hsl(214,7%,35%)' }}
        >
          {call.sequenceIndex + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium" style={{ color: 'hsl(38,8%,92%)' }}>
              {call.toolName}
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: call.toolSource === 'external' ? '#8b5cf620' : `${ACCENT}15`,
                color: call.toolSource === 'external' ? '#8b5cf6' : ACCENT,
              }}
            >
              {call.toolSource === 'external' ? 'EXT' : 'INT'}
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${policyColor(call.policyResult)}20`, color: policyColor(call.policyResult) }}
            >
              {call.policyResult.toUpperCase()}
            </span>
            {call.approvalStatus !== 'not_required' && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: `${approvalColor(call.approvalStatus)}20`, color: approvalColor(call.approvalStatus) }}
              >
                {call.approvalStatus.toUpperCase()}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="h-1.5 rounded-full flex-1 overflow-hidden"
              style={{ background: 'hsla(0,0%,100%,0.06)', maxWidth: '120px' }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${latencyPct}%`, background: color }}
              />
            </div>
            <span className="text-[9px] font-mono" style={{ color: 'hsl(214,7%,45%)' }}>
              {call.latencyMs ?? '—'}ms
            </span>
            <span className="text-[9px]" style={{ color: 'hsl(214,7%,35%)' }}>
              {new Date(call.occurredAt).toLocaleTimeString()}
            </span>
          </div>

          {call.errorMessage && (
            <p className="text-[10px] mt-1.5" style={{ color: '#ef4444' }}>
              {call.errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {call.outcome === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
          ) : call.outcome === 'error' ? (
            <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          )}
          {expanded ? (
            <ChevronDown className="w-3 h-3" style={{ color: 'hsl(214,7%,35%)' }} />
          ) : (
            <ChevronRight className="w-3 h-3" style={{ color: 'hsl(214,7%,35%)' }} />
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: 'hsla(0,0%,100%,0.06)', background: 'hsla(0,0%,100%,0.02)' }}
        >
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,35%)' }}>
              Input Parameters
            </p>
            <pre
              className="text-[10px] font-mono p-2 rounded overflow-x-auto"
              style={{ background: 'hsl(214,12%,8%)', color: 'hsl(38,8%,85%)', maxHeight: '120px' }}
            >
              {JSON.stringify(call.inputParams, null, 2)}
            </pre>
          </div>
          {call.outputSummary && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,35%)' }}>
                Output Summary
              </p>
              <p className="text-xs" style={{ color: 'hsl(38,8%,85%)' }}>
                {call.outputSummary}
              </p>
            </div>
          )}
          {call.policyReason && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'hsl(214,7%,35%)' }}>
                Policy Evaluation
              </p>
              <p className="text-[10px]" style={{ color: policyColor(call.policyResult) }}>
                {call.policyReason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComparePanel({
  sessions,
  compareId,
  setCompareId,
}: {
  sessions: McpSession[];
  compareId: string;
  setCompareId: (id: string) => void;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}05` }}
    >
      <div className="px-4 py-3 flex items-center gap-2">
        <GitCompare className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        <span className="text-xs font-semibold" style={{ color: ACCENT }}>
          Compare Mode
        </span>
      </div>
      <div className="px-4 pb-4">
        <p className="text-[10px] mb-2" style={{ color: 'hsl(214,7%,45%)' }}>
          Select a session to compare side-by-side
        </p>
        <select
          value={compareId}
          onChange={(e) => setCompareId(e.target.value)}
          className="w-full text-xs rounded-md px-2 py-1.5"
          style={{
            background: 'hsl(214,12%,8%)',
            border: '1px solid hsla(0,0%,100%,0.1)',
            color: 'hsl(38,8%,92%)',
          }}
        >
          <option value="">Select session...</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.clientIdentity} → {s.serverIdentity} ({new Date(s.startedAt).toLocaleTimeString()})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function McpSessionDetail() {
  const params = useParams() as { id: string };
  const sessionId = params.id;
  const [session, setSession] = useState<McpSession | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayMode, setReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState('');
  const [allSessions, setAllSessions] = useState<McpSession[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json() as { data: { session: McpSession; toolCalls: ToolCall[] } };
        setSession(d.data.session);
        setToolCalls(d.data.toolCalls);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10_000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    if (compareMode && allSessions.length === 0) {
      fetch(`${API}/sessions?limit=20`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d: { data: { sessions: McpSession[] } }) => setAllSessions(d.data.sessions ?? []))
        .catch(() => {});
    }
  }, [compareMode, allSessions.length]);

  const maxLatency = Math.max(...toolCalls.map((c) => c.latencyMs ?? 0), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'hsl(214,16%,4%)' }}>
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: `${ACCENT}25`, borderTopColor: ACCENT }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'hsl(214,16%,4%)' }}>
        <p className="text-sm" style={{ color: 'hsl(214,7%,45%)' }}>Session not found</p>
        <Link href="/substrate/observatory">
          <a className="mt-3 text-xs" style={{ color: ACCENT }}>← Back to Observatory</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: 'hsl(214,16%,4%)', color: 'hsl(38,8%,92%)' }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'hsl(214,16%,4%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/substrate/observatory">
            <a className="p-1 rounded hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" style={{ color: 'hsl(214,7%,45%)' }} />
            </a>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold" style={{ color: ACCENT }}>
                {session.clientIdentity}
              </span>
              <span style={{ color: 'hsl(214,7%,35%)' }}>→</span>
              <span className="text-sm font-mono font-semibold">
                {session.serverIdentity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: session.status === 'active' ? '#22c55e20' : `${ACCENT}15`,
                  color: session.status === 'active' ? '#22c55e' : ACCENT,
                }}
              >
                {session.status.toUpperCase()}
              </span>
              <span className="text-[9px]" style={{ color: 'hsl(214,7%,35%)' }}>
                {session.toolCallCount} calls · {session.errorCount} errors · {session.policyViolationCount} violations
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
            style={{
              background: compareMode ? `${ACCENT}20` : 'transparent',
              border: `1px solid ${compareMode ? ACCENT : 'hsla(0,0%,100%,0.1)'}`,
              color: compareMode ? ACCENT : 'hsl(214,7%,45%)',
            }}
          >
            <GitCompare className="w-3 h-3" />
            Compare
          </button>
          {session.status === 'completed' && (
            <button
              onClick={() => {
                setReplayMode(true);
                setReplayIndex(0);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
              style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
            >
              <Play className="w-3 h-3" />
              Replay
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {compareMode && (
          <ComparePanel
            sessions={allSessions.filter((s) => s.id !== session.id)}
            compareId={compareId}
            setCompareId={setCompareId}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tool Calls', value: session.toolCallCount, icon: Activity, color: ACCENT },
            { label: 'Errors', value: session.errorCount, icon: XCircle, color: '#ef4444' },
            { label: 'Violations', value: session.policyViolationCount, icon: Shield, color: '#f59e0b' },
            { label: 'Avg Latency', value: session.avgLatencyMs ?? 0, icon: Clock, color: '#22c55e', unit: 'ms' },
          ].map(({ label, value, icon: Icon, color, unit }) => (
            <div
              key={label}
              className="rounded-lg p-3 border"
              style={{ background: 'hsl(214,12%,8%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(214,7%,45%)' }}>
                  {label}
                </span>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-xl font-bold font-mono" style={{ color }}>
                {value}{unit ? <span className="text-xs ml-1" style={{ color: 'hsl(214,7%,45%)' }}>{unit}</span> : null}
              </span>
            </div>
          ))}
        </div>

        {session.proofHash && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
            style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}05` }}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ACCENT }} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(214,7%,45%)' }}>
              Proof Hash
            </span>
            <span className="text-xs font-mono" style={{ color: ACCENT }}>
              {session.proofHash}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(session.proofHash ?? '')}
              className="ml-auto p-1 rounded hover:bg-white/5"
            >
              <Copy className="w-3 h-3" style={{ color: 'hsl(214,7%,35%)' }} />
            </button>
          </div>
        )}

        {replayMode && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border"
            style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}08` }}
          >
            <Play className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-xs font-semibold" style={{ color: ACCENT }}>
              Replay Mode
            </span>
            <span className="text-xs" style={{ color: 'hsl(214,7%,45%)' }}>
              Step {replayIndex + 1} of {toolCalls.length}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setReplayIndex((v) => Math.max(0, v - 1))}
                disabled={replayIndex === 0}
                className="px-2 py-1 rounded text-xs disabled:opacity-40"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setReplayIndex((v) => Math.min(toolCalls.length - 1, v + 1))}
                disabled={replayIndex >= toolCalls.length - 1}
                className="px-2 py-1 rounded text-xs disabled:opacity-40"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                Next →
              </button>
              <button
                onClick={() => setReplayMode(false)}
                className="px-2 py-1 rounded text-xs"
                style={{ background: '#ef444415', color: '#ef4444' }}
              >
                Exit
              </button>
            </div>
          </div>
        )}

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
          >
            <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-xs font-semibold">Tool Call Waterfall</span>
            <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
              {toolCalls.length} calls
            </span>
          </div>
          {toolCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-xs" style={{ color: 'hsl(214,7%,35%)' }}>
                No tool calls recorded yet
              </p>
            </div>
          ) : (
            <div>
              {toolCalls.map((call, index) => (
                <ToolCallWaterfallItem
                  key={call.id}
                  call={call}
                  maxLatency={maxLatency}
                  replayMode={replayMode}
                  replayIndex={replayIndex}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
