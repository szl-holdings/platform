/**
 * Decision Center — ranked recommendations surface for every app.
 * Evidence count · Source freshness · Confidence · Value at risk
 * Policy verdict · Proposed action · Autonomy mode
 * One-tap approve / reject / escalate / rollback
 */
import * as React from 'react';
import { AutonomyDial } from './AutonomyDial';
import type { Recommendation, RecommendationAction } from './os-layer';
import { AUTONOMY_LABELS } from './os-layer';
import { PolicyVerdictBadge } from './PolicyVerdictBadge';
import { cn } from './utils';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BG = { surface: '#0c1018', elevated: '#10141e', card: '#0f1420' };
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.07)',
  strong: 'rgba(255,255,255,0.10)',
};
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.16)',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#c45a4a',
  P1: '#c8953c',
  P2: '#d4a054',
  P3: '#4a90b8',
  P4: '#7c85a0',
};

const ACTION_BUTTON: Record<string, { color: string; bg: string; border: string; label: string }> =
  {
    approve: {
      color: '#6b8f71',
      bg: 'rgba(107,143,113,0.12)',
      border: 'rgba(107,143,113,0.28)',
      label: 'Approve',
    },
    reject: {
      color: '#c45a4a',
      bg: 'rgba(196,90,74,0.12)',
      border: 'rgba(196,90,74,0.28)',
      label: 'Reject',
    },
    escalate: {
      color: '#c8953c',
      bg: 'rgba(200,149,60,0.12)',
      border: 'rgba(200,149,60,0.28)',
      label: 'Escalate',
    },
    rollback: {
      color: '#7c85a0',
      bg: 'rgba(124,133,160,0.12)',
      border: 'rgba(124,133,160,0.28)',
      label: 'Rollback',
    },
    defer: {
      color: '#4a90b8',
      bg: 'rgba(74,144,184,0.12)',
      border: 'rgba(74,144,184,0.28)',
      label: 'Defer',
    },
  };

function currency(n: number) {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Evidence Drawer (inline) ─────────────────────────────────────────────────
function EvidenceInlineDrawer({ rec, onClose }: { rec: Recommendation; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ background: 'rgba(12,16,24,0.75)' }}
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col"
        style={{ background: BG.elevated, borderLeft: `1px solid ${BORDER.muted}` }}
        role="dialog"
        aria-label="Evidence"
        aria-modal="true"
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: TEXT.primary }}>
              Evidence
            </div>
            <div className="text-[11px] mt-0.5 leading-snug" style={{ color: TEXT.tertiary }}>
              {rec.title} — {rec.evidenceCount} source{rec.evidenceCount !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 transition-colors hover:bg-white/5"
            style={{ color: TEXT.tertiary }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div
            className="text-[10px] uppercase tracking-widest font-mono mb-3"
            style={{ color: TEXT.muted }}
          >
            Rationale
          </div>
          <p className="text-[12px] leading-relaxed mb-4" style={{ color: TEXT.secondary }}>
            {rec.rationale}
          </p>

          <div
            className="text-[10px] uppercase tracking-widest font-mono mb-2"
            style={{ color: TEXT.muted }}
          >
            Signal sources ({rec.evidence.length})
          </div>
          <div className="space-y-2">
            {rec.evidence.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg p-3"
                style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                      {ev.sourceName}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>
                      {ev.sourceType}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                      {Math.round(ev.confidence * 100)}% confidence
                    </div>
                    <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                      {ev.freshnessSeconds < 60
                        ? `${ev.freshnessSeconds}s`
                        : `${Math.round(ev.freshnessSeconds / 60)}m`}{' '}
                      ago
                    </div>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>
                  {ev.content}
                </p>
                {ev.lineage?.length ? (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    {ev.lineage.map((step, i) => (
                      <React.Fragment key={i}>
                        <span
                          className="text-[9px] font-mono rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(255,255,255,0.04)', color: TEXT.tertiary }}
                        >
                          {step}
                        </span>
                        {i < ev.lineage!.length - 1 && <span style={{ color: TEXT.muted }}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {rec.runId && (
            <div
              className="mt-4 rounded-lg px-3 py-2.5 flex items-center justify-between"
              style={{
                background: 'rgba(74,144,184,0.07)',
                border: '1px solid rgba(74,144,184,0.15)',
              }}
            >
              <div>
                <div
                  className="text-[10px] uppercase tracking-widest font-mono"
                  style={{ color: 'rgba(74,144,184,0.6)' }}
                >
                  Run
                </div>
                <div
                  className="text-[11px] font-mono mt-0.5"
                  style={{ color: 'rgba(74,144,184,0.9)' }}
                >
                  {rec.runId}
                </div>
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(74,144,184,0.6)' }}>
                View full run →
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Justification Modal ──────────────────────────────────────────────────────
function JustificationModal({
  action,
  onSubmit,
  onCancel,
}: {
  action: RecommendationAction;
  onSubmit: (justification: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = React.useState('');
  const cfg = ACTION_BUTTON[action]!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,16,24,0.85)' }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 space-y-4"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}` }}
      >
        <div className="text-sm font-semibold" style={{ color: TEXT.primary }}>
          Justification Required
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: TEXT.secondary }}>
          Policy requires a written justification for this action. It will be logged to the audit
          trail.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe why this override is warranted…"
          rows={4}
          className="w-full rounded-lg px-3 py-2.5 text-[12px] resize-none focus:outline-none"
          style={{
            background: BG.card,
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.primary,
            caretColor: cfg.color,
          }}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-[12px]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: TEXT.secondary,
              border: `1px solid ${BORDER.subtle}`,
            }}
          >
            Cancel
          </button>
          <button
            disabled={!text.trim()}
            onClick={() => onSubmit(text)}
            className="px-4 py-1.5 rounded text-[12px] font-medium transition-opacity disabled:opacity-40"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            Submit &amp; {cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
export interface RecommendationCardProps {
  rec: Recommendation;
  onAction?: (
    id: string,
    action: RecommendationAction,
    justification?: string,
  ) => void | Promise<void>;
  onOpenEvidence?: (rec: Recommendation) => void;
  onOpenRun?: (runId: string) => void;
  defaultExpanded?: boolean;
  accentColor?: string;
  className?: string;
}

export function RecommendationCard({
  rec,
  onAction,
  onOpenEvidence,
  onOpenRun,
  defaultExpanded = false,
  accentColor,
  className,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [pendingAction, setPendingAction] = React.useState<RecommendationAction | null>(null);
  const [acting, setActing] = React.useState(false);
  const [auditLog, setAuditLog] = React.useState<
    Array<{ action: string; justification?: string; at: string }>
  >([]);
  const priorityColor = PRIORITY_COLORS[rec.priority] ?? '#7c85a0';
  const verdict = rec.policyVerdict.verdict;
  // "red" = hard block requiring admin approval (same enforcement as "blocked")
  const isHardBlocked = verdict === 'blocked' || verdict === 'red';
  const isExecuted =
    rec.status === 'executed' || rec.status === 'rolled_back' || rec.status === 'expired';
  // "yellow" always mandates a written justification before actioning
  const mandatesJustification = verdict === 'yellow' || rec.policyVerdict.requiresJustification;

  async function handleAction(action: RecommendationAction, justification?: string) {
    if (!onAction) return;
    setActing(true);
    setPendingAction(null);
    try {
      await onAction(rec.id, action, justification);
      setAuditLog((prev) => [
        ...prev,
        {
          action,
          ...(justification !== undefined ? { justification } : {}),
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setActing(false);
    }
  }

  function requestAction(action: RecommendationAction) {
    // Reject never requires justification — operator can always decline
    if (mandatesJustification && action !== 'reject') {
      setPendingAction(action);
    } else {
      void handleAction(action);
    }
  }

  const accent = accentColor ?? priorityColor;

  return (
    <>
      <div
        className={cn('rounded-xl overflow-hidden transition-all', className)}
        style={{
          background: BG.card,
          border: `1px solid ${BORDER.subtle}`,
          boxShadow: expanded ? `0 0 0 1px ${accent}22` : 'none',
        }}
      >
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) =>
            e.key === 'Enter' || e.key === ' ' ? setExpanded(!expanded) : undefined
          }
        >
          {/* Priority + confidence */}
          <div className="shrink-0 mt-0.5 flex flex-col items-center gap-1.5">
            <span
              className="text-[9px] font-bold font-mono rounded px-1.5 py-0.5"
              style={{
                background: `${priorityColor}18`,
                color: priorityColor,
                border: `1px solid ${priorityColor}35`,
              }}
            >
              {rec.priority}
            </span>
            <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              {Math.round(rec.confidence * 100)}%
            </span>
          </div>

          {/* Title + summary */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold leading-snug" style={{ color: TEXT.primary }}>
              {rec.title}
            </div>
            <div
              className="text-[11px] mt-1 leading-snug line-clamp-2"
              style={{ color: TEXT.secondary }}
            >
              {rec.summary}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PolicyVerdictBadge
                verdict={rec.policyVerdict.verdict}
                detail={rec.policyVerdict}
                size="xs"
              />
              <AutonomyDial value={rec.autonomyMode} compact disabled />
              {rec.valueAtRisk != null && (
                <span className="text-[9px] font-mono" style={{ color: 'rgba(196,90,74,0.8)' }}>
                  VaR {currency(rec.valueAtRisk)}
                </span>
              )}
              {rec.opportunityValue != null && (
                <span className="text-[9px] font-mono" style={{ color: 'rgba(107,143,113,0.8)' }}>
                  Opp {currency(rec.opportunityValue)}
                </span>
              )}
              <span className="text-[9px] font-mono ml-auto" style={{ color: TEXT.muted }}>
                {timeAgo(rec.createdAt)}
              </span>
            </div>
          </div>

          <span className="shrink-0 text-[10px] mt-1" style={{ color: TEXT.muted }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
            {/* Proposed action */}
            <div className="px-4 pt-3 pb-2">
              <div
                className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                style={{ color: TEXT.muted }}
              >
                Proposed action
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {rec.proposedAction}
              </p>
            </div>

            {/* Evidence + Run links */}
            <div
              className="flex items-center gap-3 px-4 py-2"
              style={{ borderTop: `1px solid ${BORDER.subtle}` }}
            >
              <button
                type="button"
                onClick={() => onOpenEvidence?.(rec)}
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: TEXT.secondary,
                  border: `1px solid ${BORDER.subtle}`,
                }}
              >
                <span>Evidence</span>
                <span
                  className="rounded-full px-1 py-0.5 text-[9px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: TEXT.muted }}
                >
                  {rec.evidenceCount}
                </span>
              </button>

              {rec.runId && (
                <button
                  type="button"
                  onClick={() => onOpenRun?.(rec.runId!)}
                  className="flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: TEXT.secondary,
                    border: `1px solid ${BORDER.subtle}`,
                  }}
                >
                  Run trace
                </button>
              )}

              <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>
                {rec.tags?.join(' · ')}
              </span>
            </div>

            {/* Action buttons — conditional on status + policy verdict */}
            {onAction && (
              <div
                className="px-4 py-3 space-y-2"
                style={{ borderTop: `1px solid ${BORDER.subtle}` }}
              >
                {rec.status === 'executed' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => requestAction('rollback')}
                      className="rounded px-3 py-1.5 text-[11px] font-medium transition-opacity disabled:opacity-50"
                      style={{
                        background: ACTION_BUTTON.rollback!.bg,
                        color: ACTION_BUTTON.rollback!.color,
                        border: `1px solid ${ACTION_BUTTON.rollback!.border}`,
                      }}
                    >
                      Rollback
                    </button>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: TEXT.tertiary }}>
                      Status: {rec.status}
                    </span>
                  </div>
                ) : rec.status === 'rolled_back' || rec.status === 'expired' ? (
                  <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
                    Status: {rec.status}
                  </div>
                ) : isHardBlocked ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2.5 py-1 text-[10px] font-medium"
                      style={{
                        background: 'rgba(196,90,74,0.10)',
                        color: 'rgba(196,90,74,0.75)',
                        border: '1px solid rgba(196,90,74,0.25)',
                      }}
                    >
                      {verdict === 'red'
                        ? 'Red verdict — mandatory admin review'
                        : 'Blocked by policy — override requires administrator approval'}
                    </span>
                  </div>
                ) : (
                  <>
                    {mandatesJustification && (
                      <div
                        className="text-[9px] font-mono px-0.5"
                        style={{ color: 'rgba(200,149,60,0.7)' }}
                      >
                        Yellow verdict — written justification required before actioning
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {(['approve', 'reject', 'escalate'] as RecommendationAction[]).map(
                        (action) => {
                          const cfg = ACTION_BUTTON[action]!;
                          return (
                            <button
                              key={action}
                              type="button"
                              disabled={acting}
                              onClick={() => requestAction(action)}
                              className="rounded px-3 py-1.5 text-[11px] font-medium transition-opacity disabled:opacity-50"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.border}`,
                              }}
                            >
                              {cfg.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </>
                )}

                {/* Local audit log — actions taken this session */}
                {auditLog.length > 0 && (
                  <div
                    className="mt-2 space-y-1 pt-2"
                    style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                  >
                    {auditLog.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-[9px] font-mono"
                        style={{ color: TEXT.tertiary }}
                      >
                        <span style={{ color: ACTION_BUTTON[entry.action]?.color ?? TEXT.muted }}>
                          {entry.action}
                        </span>
                        <span>{new Date(entry.at).toLocaleTimeString()}</span>
                        {entry.justification && (
                          <span className="flex-1 truncate" style={{ color: TEXT.secondary }}>
                            "{entry.justification}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!onAction && isExecuted && (
              <div
                className="px-4 py-3 text-[11px] font-mono"
                style={{ borderTop: `1px solid ${BORDER.subtle}`, color: TEXT.tertiary }}
              >
                Status: {rec.status}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Justification modal */}
      {pendingAction && (
        <JustificationModal
          action={pendingAction}
          onSubmit={(j) => handleAction(pendingAction, j)}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </>
  );
}

// ─── Decision Center Page ─────────────────────────────────────────────────────
export interface DecisionCenterProps {
  variant: string;
  recommendations: Recommendation[];
  loading?: boolean;
  error?: string | null;
  onAction?: (
    id: string,
    action: RecommendationAction,
    justification?: string,
  ) => void | Promise<void>;
  onRefresh?: () => void;
  onAutonomyChange?: (recId: string, mode: import('./os-layer').AutonomyMode) => void;
  accentColor?: string;
  className?: string;
}

export function DecisionCenter({
  variant,
  recommendations,
  loading = false,
  error,
  onAction,
  onRefresh,
  accentColor,
  className,
}: DecisionCenterProps) {
  const [evidenceRec, setEvidenceRec] = React.useState<Recommendation | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'blocked' | 'executed'>('all');

  const filtered = recommendations.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'blocked')
      return r.policyVerdict.verdict === 'blocked' || r.policyVerdict.verdict === 'red';
    if (filter === 'executed') return r.status === 'executed' || r.status === 'approved';
    return true;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const blockedCount = recommendations.filter(
    (r) => r.policyVerdict.verdict === 'blocked' || r.policyVerdict.verdict === 'red',
  ).length;

  return (
    <div
      className={cn('min-h-full flex flex-col', className)}
      style={{ background: BG.surface, color: TEXT.primary }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: TEXT.primary }}>
                Decision Center
              </h1>
              {pendingCount > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: 'rgba(200,149,60,0.12)',
                    color: '#c8953c',
                    border: '1px solid rgba(200,149,60,0.25)',
                  }}
                >
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT.tertiary }}>
              {variant} · ranked recommendations with evidence, policy, and chain of custody
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: TEXT.tertiary,
                border: `1px solid ${BORDER.subtle}`,
              }}
            >
              Refresh
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1 mt-4">
          {(['all', 'pending', 'blocked', 'executed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded px-3 py-1 text-[11px] font-medium capitalize transition-colors"
              style={{
                background:
                  filter === f
                    ? accentColor
                      ? `${accentColor}18`
                      : 'rgba(255,255,255,0.07)'
                    : 'transparent',
                color: filter === f ? (accentColor ?? TEXT.primary) : TEXT.tertiary,
                border: `1px solid ${filter === f ? (accentColor ? `${accentColor}35` : BORDER.muted) : 'transparent'}`,
              }}
            >
              {f}
              {f === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
              {f === 'blocked' && blockedCount > 0 && ` (${blockedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl animate-pulse"
                style={{ background: BG.card }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-xl p-4 text-[12px]"
            style={{
              background: 'rgba(196,90,74,0.08)',
              color: '#c45a4a',
              border: '1px solid rgba(196,90,74,0.18)',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-2xl mb-3" style={{ color: TEXT.muted }}>
              ◎
            </div>
            <div className="text-sm font-medium mb-1" style={{ color: TEXT.secondary }}>
              {filter === 'all' ? 'No recommendations' : `No ${filter} recommendations`}
            </div>
            <div className="text-[12px]" style={{ color: TEXT.tertiary }}>
              {filter === 'all'
                ? 'The decision engine is monitoring signals. New recommendations surface automatically.'
                : 'Change the filter above to see other recommendations.'}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((rec, i) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                {...(onAction !== undefined ? { onAction } : {})}
                onOpenEvidence={setEvidenceRec}
                defaultExpanded={i === 0 && filter === 'pending'}
                {...(accentColor !== undefined ? { accentColor } : {})}
              />
            ))}
          </div>
        )}
      </div>

      {/* Evidence Drawer */}
      {evidenceRec && (
        <EvidenceInlineDrawer rec={evidenceRec} onClose={() => setEvidenceRec(null)} />
      )}
    </div>
  );
}
