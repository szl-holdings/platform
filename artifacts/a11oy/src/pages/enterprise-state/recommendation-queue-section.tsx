import { BellOff, CheckCheck, ChevronRight, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ACCENT, BORDER, FG, FG_MUT } from './constants';
import { RECOMMENDATIONS } from './data';
import { DomainBadge, useLive } from './shared';
import { ToastContainer, useToasts } from './toast';
import { useActionStore } from './action-store';
import type { RecDecision } from './action-store';
import { CURRENT_ACTOR } from './constants';

export function RecommendationQueueSection() {
  const live = useLive();
  const recs = (live?.recommendations ?? RECOMMENDATIONS) as typeof RECOMMENDATIONS;
  const [expanded, setExpanded] = useState<string[]>([]);
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [snoozeInput, setSnoozeInput] = useState<{ reason: string; duration: string }>({
    reason: '',
    duration: '7d',
  });
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  function handleAccept(recId: string, title: string) {
    patch({
      recDecisions: {
        [recId]: { decision: 'accept', at: new Date().toISOString(), actor: CURRENT_ACTOR },
      },
    });
    show(`Recommendation accepted — "${title}" queued for execution.`, 'success');
  }

  function handleRejectSubmit(recId: string, _title: string) {
    if (!rejectReason.trim()) return;
    patch({
      recDecisions: {
        [recId]: {
          decision: 'reject',
          reason: rejectReason.trim(),
          at: new Date().toISOString(),
          actor: CURRENT_ACTOR,
        },
      },
    });
    show(`Recommendation rejected.`, 'info');
    setRejectTarget(null);
    setRejectReason('');
  }

  function handleSnoozeSubmit(recId: string, _title: string) {
    patch({
      recDecisions: {
        [recId]: {
          decision: 'snooze',
          reason: snoozeInput.reason,
          snoozeUntil: snoozeInput.duration,
          at: new Date().toISOString(),
          actor: CURRENT_ACTOR,
        },
      },
    });
    show(
      `Snoozed for ${snoozeInput.duration}${snoozeInput.reason ? ` — ${snoozeInput.reason}` : ''}.`,
      'info',
    );
    setSnoozeTarget(null);
    setSnoozeInput({ reason: '', duration: '7d' });
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {recs.map((rec, i) => {
          const isExp = expanded.includes(rec.id);
          const impactColor = rec.impact === 'high' ? '#22c55e' : '#f59e0b';
          const effortColor =
            rec.effort === 'low' ? '#22c55e' : rec.effort === 'medium' ? '#f59e0b' : '#ef4444';
          const decision = store.recDecisions[rec.id] as RecDecision | undefined;
          const isSnoozing = snoozeTarget === rec.id;
          const isRejecting = rejectTarget === rec.id;

          return (
            <div
              key={rec.id}
              style={{
                borderBottom: i < recs.length - 1 ? `1px solid ${BORDER}` : 'none',
                opacity: decision?.decision === 'reject' ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.875rem',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setExpanded((prev) =>
                    prev.includes(rec.id) ? prev.filter((x) => x !== rec.id) : [...prev, rec.id],
                  )
                }
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      decision?.decision === 'accept' ? '#22c55e20' : 'hsla(0,0%,100%,0.04)',
                    border: `1px solid ${decision?.decision === 'accept' ? '#22c55e40' : BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: decision?.decision === 'accept' ? '#22c55e' : FG_MUT,
                    flexShrink: 0,
                  }}
                >
                  {decision?.decision === 'accept' ? (
                    <CheckCheck style={{ width: 10, height: 10 }} />
                  ) : (
                    rec.rank
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: FG }}>
                      {rec.title}
                    </span>
                    <DomainBadge domain={rec.domain} />
                    {decision && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background:
                            decision.decision === 'accept'
                              ? '#22c55e20'
                              : decision.decision === 'reject'
                                ? '#ef444420'
                                : '#f59e0b20',
                          color:
                            decision.decision === 'accept'
                              ? '#22c55e'
                              : decision.decision === 'reject'
                                ? '#ef4444'
                                : '#f59e0b',
                        }}
                      >
                        {decision.decision === 'accept'
                          ? 'Accepted'
                          : decision.decision === 'reject'
                            ? `Rejected${decision.reason ? ` — ${decision.reason}` : ''}`
                            : `Snoozed ${decision.snoozeUntil}`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '10px' }}>
                    <span style={{ color: impactColor, fontWeight: 600 }}>{rec.impact} impact</span>
                    <span style={{ color: effortColor, fontWeight: 600 }}>{rec.effort} effort</span>
                  </div>
                </div>
                <ChevronRight
                  style={{
                    width: 12,
                    height: 12,
                    color: FG_MUT,
                    transform: isExp ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                />
              </div>
              {isExp && (
                <div style={{ padding: '0 0.875rem 0.875rem 3.5rem' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: FG_MUT,
                      lineHeight: 1.6,
                      marginBottom: '0.625rem',
                    }}
                  >
                    <strong style={{ color: FG }}>Why now:</strong> {rec.why}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {rec.signals.map((s, si) => (
                      <span
                        key={si}
                        style={{
                          fontSize: '9px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'hsla(0,0%,100%,0.03)',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {!decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(rec.id, rec.title);
                        }}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '5px 14px',
                          borderRadius: '6px',
                          background: ACCENT,
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <CheckCheck style={{ width: 11, height: 11 }} /> Accept — {rec.action}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSnoozeTarget(rec.id);
                          setRejectTarget(null);
                        }}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: '#f59e0b10',
                          border: '1px solid #f59e0b30',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <BellOff style={{ width: 11, height: 11 }} /> Snooze
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectTarget(rec.id);
                          setSnoozeTarget(null);
                        }}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <XCircle style={{ width: 11, height: 11 }} /> Reject
                      </button>
                    </div>
                  )}

                  {isSnoozing && (
                    <div
                      style={{
                        padding: '0.625rem',
                        background: 'hsla(38,80%,5%,0.5)',
                        border: '1px solid #f59e0b20',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <select
                        value={snoozeInput.duration}
                        onChange={(e) =>
                          setSnoozeInput((p) => ({ ...p, duration: e.target.value }))
                        }
                        style={{
                          fontSize: '10px',
                          background: 'hsla(0,0%,100%,0.05)',
                          border: `1px solid ${BORDER}`,
                          borderRadius: '4px',
                          padding: '3px 8px',
                          color: 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="3d">3 days</option>
                        <option value="7d">7 days</option>
                        <option value="14d">14 days</option>
                        <option value="30d">30 days</option>
                      </select>
                      <input
                        value={snoozeInput.reason}
                        onChange={(e) => setSnoozeInput((p) => ({ ...p, reason: e.target.value }))}
                        placeholder="Reason required…"
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          fontSize: '10px',
                          background: 'hsla(0,0%,100%,0.04)',
                          border: `1px solid ${snoozeInput.reason.trim() ? BORDER : '#f59e0b40'}`,
                          borderRadius: '4px',
                          padding: '3px 8px',
                          color: 'rgba(255,255,255,0.7)',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleSnoozeSubmit(rec.id, rec.title)}
                        disabled={!snoozeInput.reason.trim()}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '5px',
                          background: snoozeInput.reason.trim() ? '#f59e0b' : '#f59e0b50',
                          border: 'none',
                          color: '#000',
                          cursor: snoozeInput.reason.trim() ? 'pointer' : 'default',
                        }}
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => setSnoozeTarget(null)}
                        style={{
                          fontSize: '10px',
                          padding: '4px 10px',
                          borderRadius: '5px',
                          background: 'transparent',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isRejecting && (
                    <div
                      style={{
                        padding: '0.625rem',
                        background: 'hsla(0,60%,5%,0.5)',
                        border: '1px solid #ef444420',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection…"
                        style={{
                          flex: 1,
                          fontSize: '10px',
                          background: 'hsla(0,0%,100%,0.04)',
                          border: `1px solid ${BORDER}`,
                          borderRadius: '4px',
                          padding: '3px 8px',
                          color: 'rgba(255,255,255,0.7)',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleRejectSubmit(rec.id, rec.title)}
                        disabled={!rejectReason.trim()}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '5px',
                          background: rejectReason.trim() ? '#ef4444' : '#ef444450',
                          border: 'none',
                          color: '#fff',
                          cursor: rejectReason.trim() ? 'pointer' : 'default',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setRejectTarget(null)}
                        style={{
                          fontSize: '10px',
                          padding: '4px 10px',
                          borderRadius: '5px',
                          background: 'transparent',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: FG_MUT }}>
                        {decision.decision === 'accept'
                          ? 'Accepted and queued.'
                          : decision.decision === 'reject'
                            ? `Rejected${decision.reason ? `: "${decision.reason}"` : ''}`
                            : `Snoozed for ${decision.snoozeUntil}${decision.reason ? ` — ${decision.reason}` : ''}`}
                      </span>
                      <button
                        onClick={() => patch({ recDecisions: { [rec.id]: null } })}
                        style={{
                          fontSize: '9px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                          cursor: 'pointer',
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
