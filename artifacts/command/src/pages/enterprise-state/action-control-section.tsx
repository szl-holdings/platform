import { CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useActionStore } from './action-store';
import { ACCENT, BORDER, FG, FG_MUT } from './constants';
import { ACTIONS } from './data';
import { DomainBadge, useLive } from './shared';
import { ToastContainer, useToasts } from './toast';

const RISK_ID_TO_ACTION_ID: Record<string, string> = {
  r1: 'a1',
  r2: 'a2',
};

export function ActionControlSection() {
  const live = useLive();
  const actionsData = (live?.actions ?? ACTIONS) as typeof ACTIONS;
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const { store } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const pending = actionsData.filter((a) => a.status === 'pending').length;

  function handleApprove(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: 'approved' }));
    show('Action approved and queued for execution.', 'success');
  }
  function handleReject(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: 'rejected' }));
    show('Action rejected.', 'info');
  }

  function getEffectiveOwner(action: (typeof ACTIONS)[number]) {
    const riskId = Object.entries(RISK_ID_TO_ACTION_ID).find(([, aid]) => aid === action.id)?.[0];
    if (riskId && store.riskOwners[riskId])
      return { owner: store.riskOwners[riskId], synced: true };
    return { owner: action.owner, synced: false };
  }

  function getSyncedRiskAction(action: (typeof ACTIONS)[number]) {
    const riskId = Object.entries(RISK_ID_TO_ACTION_ID).find(([, aid]) => aid === action.id)?.[0];
    if (!riskId) return null;
    return store.riskActions[riskId] ?? null;
  }

  const priorityColor = (p: string) =>
    p === 'urgent' ? '#ef4444' : p === 'high' ? '#f97316' : p === 'medium' ? '#f59e0b' : '#6b7280';

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Pending', count: pending, color: '#f59e0b' },
          {
            label: 'Blocked',
            count: actionsData.filter((a) => a.status === 'blocked').length,
            color: '#f97316',
          },
          {
            label: 'Auto-Executed',
            count: actionsData.filter((a) => a.status === 'auto-executed').length,
            color: ACCENT,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '0.5rem 0.875rem',
              background: `${s.color}10`,
              border: `1px solid ${s.color}25`,
              borderRadius: '0.625rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div
              style={{
                fontSize: '9px',
                color: s.color,
                opacity: 0.75,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {actionsData.map((action, i) => {
          const overrideState = actionStates[action.id];
          const syncedRiskAction = getSyncedRiskAction(action);
          const effectiveStatus =
            syncedRiskAction?.status === 'done' ? 'resolved' : (overrideState ?? action.status);
          const pColor = priorityColor(action.priority);
          const stColors: Record<string, string> = {
            pending: '#f59e0b',
            approved: '#22c55e',
            rejected: '#ef4444',
            blocked: '#f97316',
            'auto-executed': ACCENT,
            resolved: '#22c55e',
          };
          const stColor = stColors[effectiveStatus] ?? '#6b7280';
          const ownerInfo = getEffectiveOwner(action);

          return (
            <div
              key={action.id}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: i < actionsData.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: `3px solid ${pColor}60`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
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
                      {action.title}
                    </span>
                    <DomainBadge domain={action.domain} />
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: `${stColor}18`,
                        color: stColor,
                        border: `1px solid ${stColor}25`,
                        textTransform: 'capitalize',
                      }}
                    >
                      {effectiveStatus.replace('-', ' ')}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: FG_MUT,
                      lineHeight: 1.5,
                      marginBottom: '0.375rem',
                    }}
                  >
                    {action.description}
                  </p>

                  {syncedRiskAction?.status === 'done' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.625rem',
                        background: 'hsla(160,60%,5%,0.5)',
                        border: '1px solid #22c55e20',
                        borderRadius: '0.375rem',
                        fontSize: '10px',
                        color: '#22c55e',
                        marginBottom: '0.375rem',
                      }}
                    >
                      <CheckCircle2 style={{ width: 11, height: 11, flexShrink: 0 }} />
                      {syncedRiskAction.type === 'playbook'
                        ? `Playbook resolved: ${syncedRiskAction.result}`
                        : `Ticket ${syncedRiskAction.ticketId} created from Business State`}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '10px',
                      color: FG_MUT,
                      marginBottom:
                        action.status === 'pending' && !overrideState && !syncedRiskAction?.status
                          ? '0.5rem'
                          : 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <UserCheck style={{ width: 9, height: 9 }} />
                      Owner:{' '}
                      <span style={{ color: ownerInfo.synced ? '#22c55e' : FG }}>
                        {ownerInfo.owner}
                      </span>
                      {ownerInfo.synced && (
                        <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: 600 }}>
                          synced
                        </span>
                      )}
                    </span>
                    {action.approver && (
                      <span>
                        Approver: <span style={{ color: FG }}>{action.approver}</span>
                      </span>
                    )}
                    {action.due && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock style={{ width: 9, height: 9 }} />
                        <span style={{ color: action.due.includes('Today') ? '#f59e0b' : FG }}>
                          {action.due}
                        </span>
                      </span>
                    )}
                    {action.exposure && <span style={{ color: '#f97316' }}>{action.exposure}</span>}
                  </div>
                  {'blockedReason' in action && action.blockedReason && (
                    <div
                      style={{
                        padding: '0.375rem 0.625rem',
                        background: 'hsla(24,80%,8%,0.6)',
                        border: `1px solid #f9731620`,
                        borderRadius: '0.375rem',
                        fontSize: '10px',
                        color: '#f97316',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Blocked: {action.blockedReason}
                    </div>
                  )}
                  {action.status === 'pending' && !overrideState && !syncedRiskAction?.status && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                      <button
                        onClick={() => handleApprove(action.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: '#22c55e',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 style={{ width: 11, height: 11 }} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: 'hsla(0,0%,100%,0.04)',
                          border: `1px solid ${BORDER}`,
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
