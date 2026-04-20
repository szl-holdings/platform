/**
 * AgentRunCard — canonical agent run display for every surface.
 *
 * Shows: agent name, run ID, status, duration, tool calls, confidence,
 * policy verdict, evidence count, and expandable trace.
 *
 * Consumed by: Sentra, Vessels, Terra, Counsel, Command, Lyte, Pulse.
 */
import React, { useState } from 'react';
import { cn } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────

export type AgentRunStatus =
  | 'running'
  | 'success'
  | 'failed'
  | 'paused'
  | 'awaiting_approval'
  | 'cancelled'
  | 'rolled_back';

export type PolicyVerdict = 'allowed' | 'requires_approval' | 'blocked';

export interface AgentToolCall {
  id: string;
  name: string;
  durationMs: number;
  status: 'ok' | 'error' | 'skipped';
  output?: string;
}

export interface AgentRunData {
  id: string;
  runId: string;
  agentName: string;
  agentType?: string;
  status: AgentRunStatus;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  confidence?: number;
  policyVerdict?: PolicyVerdict;
  evidenceCount?: number;
  toolCalls?: AgentToolCall[];
  summary?: string;
  error?: string;
  triggeredBy?: string;
  tenantId?: string;
  surface?: string;
  tags?: string[];
}

export interface AgentRunCardProps {
  run: AgentRunData;
  accentColor?: string;
  compact?: boolean;
  showTrace?: boolean;
  onViewTrace?: (run: AgentRunData) => void;
  onRequestRollback?: (run: AgentRunData) => void;
  onApprove?: (run: AgentRunData) => void;
  onReject?: (run: AgentRunData) => void;
  className?: string;
}

// ─── Internal tokens ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentRunStatus, { label: string; color: string; dot: string }> = {
  running: { label: 'Running', color: '#3b82f6', dot: '#3b82f6' },
  success: { label: 'Success', color: '#22c55e', dot: '#22c55e' },
  failed: { label: 'Failed', color: '#ef4444', dot: '#ef4444' },
  paused: { label: 'Paused', color: '#f59e0b', dot: '#f59e0b' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#f59e0b', dot: '#f59e0b' },
  cancelled: { label: 'Cancelled', color: '#6b7280', dot: '#6b7280' },
  rolled_back: { label: 'Rolled Back', color: '#8b5cf6', dot: '#8b5cf6' },
};

const VERDICT_CONFIG: Record<PolicyVerdict, { label: string; color: string }> = {
  allowed: { label: 'Allowed', color: '#22c55e' },
  requires_approval: { label: 'Needs Approval', color: '#f59e0b' },
  blocked: { label: 'Blocked', color: '#ef4444' },
};

const BG = {
  card: 'rgba(13,18,32,0.9)',
  trace: 'rgba(9,12,22,0.95)',
  toolRow: 'rgba(255,255,255,0.025)',
} as const;

const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.52)',
  muted: 'rgba(255,255,255,0.28)',
  mono: 'rgba(255,255,255,0.42)',
} as const;

function duration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AgentRunStatus }) {
  const cfg = STATUS_CONFIG[status];
  const isRunning = status === 'running';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono"
      style={{
        background: `${cfg.color}12`,
        border: `1px solid ${cfg.color}30`,
        color: cfg.color,
      }}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isRunning && 'animate-pulse')}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────

function ConfidenceBar({ value, accentColor }: { value: number; accentColor: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color: TEXT.muted }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Tool Call Trace ──────────────────────────────────────────────────────

function ToolCallTrace({ toolCalls }: { toolCalls: AgentToolCall[] }) {
  return (
    <div className="mt-2 rounded-md overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <div
        className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest"
        style={{ background: BG.trace, borderBottom: `1px solid ${BORDER}`, color: TEXT.muted }}
      >
        Tool Trace — {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''}
      </div>
      {toolCalls.map((call, i) => (
        <div
          key={call.id}
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: i % 2 === 0 ? BG.toolRow : 'transparent',
            borderBottom: i < toolCalls.length - 1 ? `1px solid ${BORDER}` : undefined,
          }}
        >
          <span
            className="text-[9px] font-mono"
            style={{
              color:
                call.status === 'ok' ? '#22c55e' : call.status === 'error' ? '#ef4444' : TEXT.muted,
            }}
          >
            {call.status === 'ok' ? '✓' : call.status === 'error' ? '✗' : '—'}
          </span>
          <span className="text-[11px] font-mono flex-1" style={{ color: TEXT.primary }}>
            {call.name}
          </span>
          <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
            {duration(call.durationMs)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function AgentRunCard({
  run,
  accentColor = '#8b7ac8',
  compact = false,
  showTrace = false,
  onViewTrace,
  onRequestRollback,
  onApprove,
  onReject,
  className,
}: AgentRunCardProps) {
  const [expanded, setExpanded] = useState(showTrace);

  return (
    <article
      className={cn('rounded-xl overflow-hidden', className)}
      style={{
        background: BG.card,
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Main row */}
      <div className={cn('flex items-start gap-3', compact ? 'px-3 py-2.5' : 'px-4 py-3')}>
        {/* Agent type dot */}
        <div
          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
          style={{ background: accentColor }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn('font-semibold', compact ? 'text-[12px]' : 'text-[13px]')}
              style={{ color: TEXT.primary }}
            >
              {run.agentName}
            </span>
            {run.agentType && (
              <span
                className="text-[9px] font-mono uppercase tracking-wider"
                style={{ color: TEXT.muted }}
              >
                {run.agentType}
              </span>
            )}
            <StatusBadge status={run.status} />
          </div>

          {/* Run ID + meta */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] font-mono" style={{ color: TEXT.mono }}>
              {run.runId}
            </span>
            <span style={{ color: TEXT.muted }}>·</span>
            <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
              {timeAgo(run.startedAt)}
            </span>
            {run.durationMs !== undefined && (
              <>
                <span style={{ color: TEXT.muted }}>·</span>
                <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                  {duration(run.durationMs)}
                </span>
              </>
            )}
            {run.triggeredBy && (
              <>
                <span style={{ color: TEXT.muted }}>·</span>
                <span className="text-[10px]" style={{ color: TEXT.muted }}>
                  {run.triggeredBy}
                </span>
              </>
            )}
          </div>

          {/* Summary */}
          {run.summary && !compact && (
            <p className="text-[11px] mt-1.5 leading-snug" style={{ color: TEXT.secondary }}>
              {run.summary}
            </p>
          )}

          {/* Error */}
          {run.error && (
            <p
              className="text-[11px] mt-1.5 leading-snug px-2 py-1.5 rounded"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
            >
              {run.error}
            </p>
          )}

          {/* Metrics row */}
          {!compact && (
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {run.confidence !== undefined && (
                <ConfidenceBar value={run.confidence} accentColor={accentColor} />
              )}
              {run.policyVerdict && (
                <span
                  className="text-[10px] font-mono"
                  style={{ color: VERDICT_CONFIG[run.policyVerdict].color }}
                >
                  {VERDICT_CONFIG[run.policyVerdict].label}
                </span>
              )}
              {run.evidenceCount !== undefined && (
                <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                  {run.evidenceCount} evidence
                </span>
              )}
              {run.toolCalls && (
                <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                  {run.toolCalls.length} tool{run.toolCalls.length !== 1 ? 's' : ''}
                </span>
              )}
              {run.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.05)', color: TEXT.muted }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {!compact && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {run.status === 'awaiting_approval' && onApprove && (
              <button
                onClick={() => onApprove(run)}
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.30)',
                  color: '#22c55e',
                }}
              >
                Approve
              </button>
            )}
            {run.status === 'awaiting_approval' && onReject && (
              <button
                onClick={() => onReject(run)}
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#ef4444',
                }}
              >
                Reject
              </button>
            )}
            {run.status === 'success' && onRequestRollback && (
              <button
                onClick={() => onRequestRollback(run)}
                className="px-2.5 py-1 rounded text-[10px] font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(139,92,246,0.10)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#8b5cf6',
                }}
              >
                Rollback
              </button>
            )}
            {run.toolCalls && run.toolCalls.length > 0 && (
              <button
                onClick={() => {
                  setExpanded((v) => !v);
                  if (!expanded) onViewTrace?.(run);
                }}
                className="px-2 py-1 rounded text-[10px] font-mono transition-colors hover:opacity-80"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: TEXT.muted,
                }}
              >
                {expanded ? '▲ Hide' : '▼ Trace'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded trace */}
      {expanded && run.toolCalls && run.toolCalls.length > 0 && (
        <div className="px-4 pb-3">
          <ToolCallTrace toolCalls={run.toolCalls} />
        </div>
      )}
    </article>
  );
}

/**
 * AgentRunList — wraps multiple AgentRunCard with section header and empty state.
 */
export interface AgentRunListProps {
  runs: AgentRunData[];
  accentColor?: string;
  emptyMessage?: string;
  compact?: boolean;
  onViewTrace?: (run: AgentRunData) => void;
  onApprove?: (run: AgentRunData) => void;
  onReject?: (run: AgentRunData) => void;
  onRequestRollback?: (run: AgentRunData) => void;
  className?: string;
}

export function AgentRunList({
  runs,
  accentColor = '#8b7ac8',
  emptyMessage = 'No agent runs found.',
  compact = false,
  onViewTrace,
  onApprove,
  onReject,
  onRequestRollback,
  className,
}: AgentRunListProps) {
  if (runs.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${accentColor}10` }}
        >
          <span className="text-lg">🤖</span>
        </div>
        <p className="text-sm font-medium" style={{ color: TEXT.primary }}>
          {emptyMessage}
        </p>
        <p className="text-[11px] mt-1" style={{ color: TEXT.muted }}>
          Agent runs will appear here once the system processes events.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {runs.map((run) => (
        <AgentRunCard
          key={run.id}
          run={run}
          accentColor={accentColor}
          compact={compact}
          {...(onViewTrace !== undefined ? { onViewTrace } : {})}
          {...(onApprove !== undefined ? { onApprove } : {})}
          {...(onReject !== undefined ? { onReject } : {})}
          {...(onRequestRollback !== undefined ? { onRequestRollback } : {})}
        />
      ))}
    </div>
  );
}
