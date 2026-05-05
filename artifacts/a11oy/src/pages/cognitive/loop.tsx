import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { ApiError, apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  GitBranch,
  History,
  Layers,
  Lightbulb,
  Play,
  RefreshCw,
  Repeat,
  Target,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CognitiveLayout } from './cognitive-layout';

const ACCENT = '#8b7ac8';
const BG_PANEL = 'rgba(13,17,28,0.7)';
const BORDER = 'rgba(139,122,200,0.18)';
const FG = 'rgba(255,255,255,0.9)';
const FG_MUT = 'rgba(255,255,255,0.55)';
const FG_DIM = 'rgba(255,255,255,0.32)';

const LOOP_PHASES = [
  { id: 'perceive', label: 'Perceive', icon: Eye },
  { id: 'orient', label: 'Orient', icon: Target },
  { id: 'plan', label: 'Plan', icon: GitBranch },
  { id: 'execute', label: 'Execute', icon: Play },
  { id: 'verify', label: 'Verify', icon: CheckCircle2 },
  { id: 'reflect', label: 'Reflect', icon: Lightbulb },
  { id: 'update_self_model', label: 'Update Self', icon: Brain },
  { id: 'update_memory', label: 'Update Memory', icon: Layers },
] as const;

type PhaseId = (typeof LOOP_PHASES)[number]['id'];

interface PhaseResult {
  phase: string;
  status: 'ok' | 'error' | 'skipped' | 'blocked';
  durationMs?: number;
}

interface RunResult {
  runId: string;
  traceId?: string;
  status: string;
  success: boolean;
  summary?: string;
  durationMs?: number;
  phases: PhaseResult[];
  planId?: string;
  planRevisions: number;
  verifyRevisions: number;
  reflectionId?: string;
  memoryIds: string[];
  worldModelUpdate?: {
    noveltyScore?: number;
    riskScore?: number;
    uncertaintyScore?: number;
    detectedAnomalies?: string[];
  };
  error?: string;
}

interface CheckpointEntry {
  ref: string;
  runId: string;
  agentId: string;
  phase: string;
  stepIndex: number;
  createdAt: string;
  expiresAt?: string;
}

interface CheckpointDetail extends CheckpointEntry {
  objective: string;
  snapshotPhases: string[];
}

function fmtMs(ms?: number): string {
  if (ms === undefined || ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'ok':
    case 'completed':
      return '#22c55e';
    case 'running':
      return '#3b82f6';
    case 'error':
    case 'failed':
      return '#ef4444';
    case 'blocked':
    case 'guardian_blocked':
      return '#f97316';
    case 'pending_approval':
    case 'checkpointed':
      return '#f59e0b';
    case 'skipped':
      return FG_DIM;
    default:
      return FG_MUT;
  }
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: `${c}1a`,
        color: c,
        border: `1px solid ${c}30`,
      }}
    >
      {status}
    </span>
  );
}

function PhaseTrack({ run }: { run: RunResult }) {
  const phaseMap = useMemo(() => {
    const m = new Map<string, PhaseResult>();
    for (const p of run.phases) m.set(p.phase, p);
    return m;
  }, [run.phases]);

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${LOOP_PHASES.length}, 1fr)`, gap: 6 }}
    >
      {LOOP_PHASES.map((p) => {
        const r = phaseMap.get(p.id);
        const Icon = p.icon;
        const c = r ? statusColor(r.status) : FG_DIM;
        const ran = !!r;
        return (
          <div
            key={p.id}
            style={{
              background: BG_PANEL,
              border: `1px solid ${ran ? `${c}40` : BORDER}`,
              borderRadius: 8,
              padding: '10px 8px',
              textAlign: 'center',
              opacity: ran ? 1 : 0.6,
            }}
          >
            <Icon style={{ width: 14, height: 14, color: c, marginBottom: 4 }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: FG,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {p.label}
            </div>
            <div
              style={{
                fontSize: 9,
                color: FG_MUT,
                marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {ran ? fmtMs(r.durationMs) : '—'}
            </div>
            {ran && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 8,
                  fontWeight: 700,
                  color: c,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {r.status}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RunForm({
  onRun,
  busy,
}: {
  onRun: (objective: string, agentTier: string, dryRun: boolean) => void;
  busy: boolean;
}) {
  const [objective, setObjective] = useState('');
  const [agentTier, setAgentTier] = useState<'assistant' | 'analyst' | 'operator' | 'autonomous'>(
    'analyst',
  );
  const [dryRun, setDryRun] = useState(true);

  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Activity style={{ width: 14, height: 14, color: ACCENT }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: FG,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Trigger Cognitive Loop
        </span>
      </div>
      <textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Describe the objective. Example: Synthesize Q1 portfolio risk for the CFO morning briefing."
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.3)',
          color: FG,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          fontSize: 12,
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: 10,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label
          style={{ fontSize: 11, color: FG_MUT, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Agent tier
          <select
            value={agentTier}
            onChange={(e) => setAgentTier(e.target.value as typeof agentTier)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              color: FG,
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 11,
            }}
          >
            <option value="assistant">assistant</option>
            <option value="analyst">analyst</option>
            <option value="operator">operator</option>
            <option value="autonomous">autonomous</option>
          </select>
        </label>
        <label
          style={{ fontSize: 11, color: FG_MUT, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry run (no side effects)
        </label>
        <button
          type="button"
          disabled={busy || !objective.trim()}
          onClick={() => onRun(objective.trim(), agentTier, dryRun)}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: busy || !objective.trim() ? 'rgba(139,122,200,0.2)' : ACCENT,
            color: busy || !objective.trim() ? FG_MUT : '#0b0e16',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: busy || !objective.trim() ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {busy ? (
            <RefreshCw style={{ width: 12, height: 12 }} className="animate-spin" />
          ) : (
            <Play style={{ width: 12, height: 12 }} />
          )}
          {busy ? 'Running' : 'Run loop'}
        </button>
      </div>
    </div>
  );
}

function RunSummary({ run }: { run: RunResult }) {
  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <Brain style={{ width: 14, height: 14, color: ACCENT }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: FG,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Latest Run
        </span>
        <StatusBadge status={run.status} />
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: FG_DIM }}>
          run {run.runId.slice(0, 8)}…
        </span>
        {run.traceId && (
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: FG_DIM }}>
            trace {run.traceId.slice(0, 8)}…
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: FG_MUT }}>
          <Clock style={{ width: 10, height: 10, display: 'inline', marginRight: 3 }} />
          {fmtMs(run.durationMs)}
        </span>
      </div>

      <PhaseTrack run={run} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginTop: 14,
        }}
      >
        {[
          { label: 'Plan revisions', value: run.planRevisions, color: ACCENT },
          { label: 'Verify revisions', value: run.verifyRevisions, color: '#f59e0b' },
          { label: 'Memory writes', value: run.memoryIds.length, color: '#22c55e' },
          { label: 'Reflection', value: run.reflectionId ? 'logged' : '—', color: '#8b7ac8' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: FG_DIM,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {run.summary && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.25)',
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: FG_DIM,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            Reflection summary
          </div>
          <div style={{ fontSize: 12, color: FG, lineHeight: 1.5 }}>{run.summary}</div>
        </div>
      )}

      {run.worldModelUpdate && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.18)',
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 10, color: FG_MUT }}>
            Novelty{' '}
            <strong style={{ color: FG }}>
              {((run.worldModelUpdate.noveltyScore ?? 0) * 100).toFixed(0)}%
            </strong>
          </span>
          <span style={{ fontSize: 10, color: FG_MUT }}>
            Risk{' '}
            <strong style={{ color: FG }}>
              {((run.worldModelUpdate.riskScore ?? 0) * 100).toFixed(0)}%
            </strong>
          </span>
          <span style={{ fontSize: 10, color: FG_MUT }}>
            Uncertainty{' '}
            <strong style={{ color: FG }}>
              {((run.worldModelUpdate.uncertaintyScore ?? 0) * 100).toFixed(0)}%
            </strong>
          </span>
          {(run.worldModelUpdate.detectedAnomalies?.length ?? 0) > 0 && (
            <span style={{ fontSize: 10, color: '#f97316' }}>
              {run.worldModelUpdate.detectedAnomalies?.length} anomaly
              {(run.worldModelUpdate.detectedAnomalies?.length ?? 0) > 1 ? 'ies' : ''}
            </span>
          )}
        </div>
      )}

      {run.error && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 11,
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />
          <span>{run.error}</span>
        </div>
      )}
    </div>
  );
}

function CheckpointList({
  checkpoints,
  onSelect,
  onRefresh,
  loading,
}: {
  checkpoints: CheckpointEntry[];
  onSelect: (ref: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <History style={{ width: 14, height: 14, color: ACCENT }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: FG,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Checkpoints
        </span>
        <span style={{ fontSize: 10, color: FG_DIM }}>({checkpoints.length})</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            color: FG_MUT,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          <RefreshCw
            style={{ width: 10, height: 10 }}
            className={loading ? 'animate-spin' : undefined}
          />
          Refresh
        </button>
      </div>

      {checkpoints.length === 0 ? (
        <div style={{ fontSize: 11, color: FG_DIM, padding: '16px 4px', textAlign: 'center' }}>
          No checkpoints yet. Trigger a loop above to create one.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {checkpoints.map((cp) => (
            <button
              key={cp.ref}
              type="button"
              onClick={() => onSelect(cp.ref)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.18)',
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                color: FG,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <StatusBadge status={cp.phase} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: FG, fontFamily: 'monospace' }}>
                  {cp.ref}
                </div>
                <div style={{ fontSize: 9, color: FG_MUT, marginTop: 2 }}>
                  step {cp.stepIndex} · run {cp.runId.slice(0, 8)}… · agent {cp.agentId} ·{' '}
                  {fmtTime(cp.createdAt)}
                </div>
              </div>
              <ChevronRight style={{ width: 12, height: 12, color: FG_DIM }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckpointDrawer({
  detail,
  loading,
  error,
  onClose,
  onResume,
  resuming,
}: {
  detail: CheckpointDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onResume: (ref: string) => void;
  resuming: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,4,10,0.6)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          height: '100%',
          background: '#0a0e18',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 18px',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <History style={{ width: 14, height: 14, color: ACCENT }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>Checkpoint trace</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              color: FG_MUT,
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {loading && <div style={{ color: FG_MUT, fontSize: 12 }}>Loading checkpoint…</div>}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6,
                color: '#fca5a5',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
          {detail && (
            <>
              <div
                style={{
                  fontSize: 10,
                  color: FG_DIM,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Checkpoint ref
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: FG,
                  marginBottom: 12,
                  wordBreak: 'break-all',
                }}
              >
                {detail.ref}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: FG_DIM,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Run
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: FG }}>
                    {detail.runId}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: FG_DIM,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Agent
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: FG }}>
                    {detail.agentId}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: FG_DIM,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Phase
                  </div>
                  <StatusBadge status={detail.phase} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: FG_DIM,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Step
                  </div>
                  <div style={{ fontSize: 11, color: FG }}>{detail.stepIndex}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: FG_DIM,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Created
                  </div>
                  <div style={{ fontSize: 11, color: FG }}>{fmtTime(detail.createdAt)}</div>
                </div>
                {detail.expiresAt && (
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: FG_DIM,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Expires
                    </div>
                    <div style={{ fontSize: 11, color: FG }}>{fmtTime(detail.expiresAt)}</div>
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: 9,
                  color: FG_DIM,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Objective
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: FG,
                  marginBottom: 14,
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.25)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  lineHeight: 1.5,
                }}
              >
                {detail.objective}
              </div>

              <div
                style={{
                  fontSize: 9,
                  color: FG_DIM,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Trace replay — phases captured
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                {detail.snapshotPhases.length === 0 ? (
                  <div style={{ fontSize: 11, color: FG_DIM }}>No phases captured yet.</div>
                ) : (
                  detail.snapshotPhases.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.18)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 4,
                      }}
                    >
                      <span
                        style={{ fontSize: 9, color: FG_DIM, fontFamily: 'monospace', width: 18 }}
                      >
                        {i + 1}.
                      </span>
                      <StatusBadge status={p} />
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => onResume(detail.ref)}
                disabled={resuming}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: ACCENT,
                  color: '#0b0e16',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: resuming ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  opacity: resuming ? 0.6 : 1,
                }}
              >
                {resuming ? (
                  <RefreshCw style={{ width: 12, height: 12 }} className="animate-spin" />
                ) : (
                  <Repeat style={{ width: 12, height: 12 }} />
                )}
                Resume from checkpoint
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CognitiveLoopPage() {
  const [latestRun, setLatestRun] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const checkpointsQuery = useStandardQuery({
    queryKey: ['cognitive-runtime', 'checkpoints'],
    queryFn: () =>
      apiFetch<{ data: { checkpoints: CheckpointEntry[]; total: number } }>(
        '/cognitive-runtime/checkpoints',
      ).then((r) => r.data ?? { checkpoints: [], total: 0 }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const checkpointDetailQuery = useStandardQuery({
    queryKey: ['cognitive-runtime', 'checkpoint', selectedRef],
    queryFn: async () => {
      if (!selectedRef) return null;
      const res = await apiFetch<{ data: CheckpointDetail }>(
        `/cognitive-runtime/checkpoint/${encodeURIComponent(selectedRef)}`,
      );
      return res.data ?? null;
    },
    enabled: !!selectedRef,
  });

  const runMutation = useStandardMutation({
    mutationFn: (vars: { objective: string; agentTier: string; dryRun: boolean }) =>
      apiFetch<{ data: RunResult }>('/cognitive-runtime/run', {
        method: 'POST',
        body: JSON.stringify({
          objective: vars.objective,
          context: { agentTier: vars.agentTier, dryRun: vars.dryRun },
        }),
      }).then((r) => r.data),
    onSuccess: (data) => {
      setLatestRun(data);
      setRunError(null);
      checkpointsQuery.refetch();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : String(err);
      setRunError(msg);
    },
  });

  const resumeMutation = useStandardMutation({
    mutationFn: (ref: string) =>
      apiFetch<{ data: RunResult }>('/cognitive-runtime/resume', {
        method: 'POST',
        body: JSON.stringify({ checkpointRef: ref }),
      }).then((r) => r.data),
    onSuccess: (data) => {
      setLatestRun(data);
      setRunError(null);
      setSelectedRef(null);
      checkpointsQuery.refetch();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : String(err);
      setDrawerError(msg);
    },
  });

  const handleRun = (objective: string, agentTier: string, dryRun: boolean) => {
    setRunError(null);
    runMutation.mutate({ objective, agentTier, dryRun });
  };

  const handleSelect = (ref: string) => {
    setDrawerError(null);
    setSelectedRef(ref);
  };

  const checkpoints = checkpointsQuery.data?.checkpoints ?? [];

  return (
    <CognitiveLayout
      title="Live Cognitive Loop"
      subtitle="Trigger PERCEIVE → ORIENT → PLAN → EXECUTE → VERIFY → REFLECT → UPDATE runs and inspect checkpoint traces."
    >
      <RunForm onRun={handleRun} busy={runMutation.isPending} />

      {runError && (
        <div
          style={{
            padding: '10px 12px',
            marginBottom: 16,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 12,
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />
          <span>{runError}</span>
        </div>
      )}

      {latestRun && <RunSummary run={latestRun} />}

      <CheckpointList
        checkpoints={checkpoints}
        loading={checkpointsQuery.isFetching}
        onSelect={handleSelect}
        onRefresh={() => checkpointsQuery.refetch()}
      />

      {selectedRef && (
        <CheckpointDrawer
          detail={checkpointDetailQuery.data ?? null}
          loading={checkpointDetailQuery.isFetching}
          error={
            drawerError ??
            (checkpointDetailQuery.error
              ? checkpointDetailQuery.error instanceof Error
                ? checkpointDetailQuery.error.message
                : String(checkpointDetailQuery.error)
              : null)
          }
          onClose={() => {
            setSelectedRef(null);
            setDrawerError(null);
          }}
          onResume={(ref) => resumeMutation.mutate(ref)}
          resuming={resumeMutation.isPending}
        />
      )}
    </CognitiveLayout>
  );
}
