import { BellOff, CheckCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ACCENT, BORDER } from './constants';
import { OPP_REGISTER } from './data';
import { DomainTag, useLive } from './helpers';
import { useActionStore } from './action-store';
import { ToastContainer, useToasts } from './toast';
import { CURRENT_ACTOR } from './constants';
import type { DomainId } from './types';

export function OpportunityModule() {
  const live = useLive();
  const opps = (live?.oppRegister ?? OPP_REGISTER) as typeof OPP_REGISTER;
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [snoozeInput, setSnoozeInput] = useState<{ reason: string; duration: string }>({ reason: '', duration: '7d' });
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  function handleAccept(oppId: string, title: string) {
    patch({ oppDecisions: { [oppId]: { decision: 'accept', at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" accepted — added to sprint backlog.`, 'success');
  }

  function handleRejectSubmit(oppId: string, title: string) {
    if (!rejectReason.trim()) return;
    patch({ oppDecisions: { [oppId]: { decision: 'reject', reason: rejectReason.trim(), at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" rejected.`, 'info');
    setRejectTarget(null);
    setRejectReason('');
  }

  function handleSnoozeSubmit(oppId: string, title: string) {
    patch({ oppDecisions: { [oppId]: { decision: 'snooze', reason: snoozeInput.reason, snoozeUntil: snoozeInput.duration, at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" snoozed for ${snoozeInput.duration}${snoozeInput.reason ? ` — ${snoozeInput.reason}` : ''}.`, 'info');
    setSnoozeTarget(null);
    setSnoozeInput({ reason: '', duration: '7d' });
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {opps.map((opp, i) => {
          const color = opp.level === 'high' ? '#22c55e' : '#4d8fcc';
          const decision = store.oppDecisions[opp.id];
          const isSnoozing = snoozeTarget === opp.id;
          const isRejecting = rejectTarget === opp.id;

          return (
            <div
              key={opp.id}
              style={{
                borderBottom: i < opps.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: `3px solid ${color}50`,
                opacity: decision?.decision === 'reject' ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', padding: '0.875rem 0.875rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{opp.title}</span>
                    {opp.domain && <DomainTag domain={opp.domain as DomainId} />}
                    {decision && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px',
                        background: decision.decision === 'accept' ? '#22c55e20' : decision.decision === 'reject' ? '#ef444420' : '#f59e0b20',
                        color: decision.decision === 'accept' ? '#22c55e' : decision.decision === 'reject' ? '#ef4444' : '#f59e0b',
                      }}>
                        {decision.decision === 'accept' ? 'Accepted' : decision.decision === 'reject' ? 'Rejected' : `Snoozed ${decision.snoozeUntil}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '0.25rem' }}>{opp.action}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: decision ? 0 : '0.625rem' }}>
                    Owner: {opp.owner} · P: {Math.round(opp.probability * 100)}%
                  </div>

                  {!decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <button onClick={() => handleAccept(opp.id, opp.title)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px', background: '#22c55e20', border: '1px solid #22c55e40', color: '#22c55e', cursor: 'pointer' }}>
                        <CheckCheck style={{ width: 9, height: 9 }} /> Accept
                      </button>
                      <button onClick={() => { setSnoozeTarget(opp.id); setRejectTarget(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px', background: '#f59e0b10', border: '1px solid #f59e0b30', color: '#f59e0b', cursor: 'pointer' }}>
                        <BellOff style={{ width: 9, height: 9 }} /> Snooze
                      </button>
                      <button onClick={() => { setRejectTarget(opp.id); setSnoozeTarget(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, padding: '3px 9px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                        <XCircle style={{ width: 9, height: 9 }} /> Reject
                      </button>
                    </div>
                  )}

                  {isSnoozing && (
                    <div style={{ marginTop: '0.5rem', padding: '0.625rem', background: 'hsla(38,80%,5%,0.5)', border: '1px solid #f59e0b20', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select value={snoozeInput.duration} onChange={(e) => setSnoozeInput((p) => ({ ...p, duration: e.target.value }))}
                          style={{ fontSize: '10px', background: 'hsla(0,0%,100%,0.05)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '2px 6px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                          <option value="3d">3 days</option>
                          <option value="7d">7 days</option>
                          <option value="14d">14 days</option>
                          <option value="30d">30 days</option>
                        </select>
                        <input value={snoozeInput.reason} onChange={(e) => setSnoozeInput((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)"
                          style={{ flex: 1, fontSize: '10px', background: 'hsla(0,0%,100%,0.04)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '2px 6px', color: 'rgba(255,255,255,0.7)', outline: 'none' }} />
                        <button onClick={() => handleSnoozeSubmit(opp.id, opp.title)} style={{ fontSize: '9px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: '#f59e0b', border: 'none', color: '#000', cursor: 'pointer' }}>Snooze</button>
                        <button onClick={() => setSnoozeTarget(null)} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {isRejecting && (
                    <div style={{ marginTop: '0.5rem', padding: '0.625rem', background: 'hsla(0,60%,5%,0.5)', border: '1px solid #ef444420', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection…"
                        style={{ flex: 1, fontSize: '10px', background: 'hsla(0,0%,100%,0.04)', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '2px 6px', color: 'rgba(255,255,255,0.7)', outline: 'none' }} />
                      <button onClick={() => handleRejectSubmit(opp.id, opp.title)} disabled={!rejectReason.trim()}
                        style={{ fontSize: '9px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: rejectReason.trim() ? '#ef4444' : '#ef444450', border: 'none', color: '#fff', cursor: rejectReason.trim() ? 'pointer' : 'default' }}>
                        Reject
                      </button>
                      <button onClick={() => setRejectTarget(null)} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{opp.value}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', background: `${color}20`, color, marginTop: '4px', display: 'inline-block' }}>
                    {opp.level}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
