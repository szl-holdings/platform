import { AlertTriangle, Check, Clock, Pause, Play, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { ActionItem, ActionStatus } from './types';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

function priorityColor(p: ActionItem['priority']) {
  switch (p) {
    case 'urgent':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}

function statusMeta(s: ActionStatus) {
  switch (s) {
    case 'approved':
      return { label: 'Approved', color: '#22c55e', bg: 'hsla(160,60%,14%,0.6)' };
    case 'rejected':
      return { label: 'Rejected', color: '#ef4444', bg: 'hsla(0,70%,14%,0.6)' };
    case 'auto-executed':
      return { label: 'Auto-Executed', color: '#a78bfa', bg: 'hsla(265,60%,14%,0.6)' };
    case 'blocked':
      return { label: 'Blocked', color: '#f97316', bg: 'hsla(24,80%,14%,0.6)' };
    default:
      return { label: 'Pending', color: '#f59e0b', bg: 'hsla(38,80%,14%,0.6)' };
  }
}

interface ActionControlPanelProps {
  actions: ActionItem[];
  title?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onExecute?: (id: string) => void;
}

export function ActionControlPanel({
  actions,
  title = 'Action Control Center',
  onApprove,
  onReject,
  onExecute,
}: ActionControlPanelProps) {
  const [filter, setFilter] = useState<'all' | ActionStatus>('all');

  const filtered = filter === 'all' ? actions : actions.filter((a) => a.status === filter);
  const pending = actions.filter((a) => a.status === 'pending').length;

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {title}
        </span>
        {pending > 0 && (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'hsla(38,80%,14%,0.6)',
              color: '#f59e0b',
              fontWeight: 700,
              border: '1px solid #f59e0b30',
            }}
          >
            {pending} pending
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.375rem' }}>
          {(['all', 'pending', 'approved', 'blocked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: '9px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: filter === f ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                border: `1px solid ${filter === f ? 'hsla(0,0%,100%,0.12)' : 'transparent'}`,
                color: filter === f ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        {filtered.map((action, i) => {
          const pColor = priorityColor(action.priority);
          const st = statusMeta(action.status);

          return (
            <div
              key={action.id}
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: `3px solid ${pColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span
                      style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}
                    >
                      {action.title}
                    </span>
                    {action.domainColor && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: `${action.domainColor}20`,
                          color: action.domainColor,
                        }}
                      >
                        {action.domain}
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: st.bg,
                        color: st.color,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.45)',
                      lineHeight: 1.5,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {action.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {action.owner && (
                      <span>
                        Owner:{' '}
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{action.owner}</span>
                      </span>
                    )}
                    {action.approver && (
                      <span>
                        Approver:{' '}
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{action.approver}</span>
                      </span>
                    )}
                    {action.requiredBy && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock style={{ width: 9, height: 9 }} />
                        Due: <span style={{ color: '#f59e0b' }}>{action.requiredBy}</span>
                      </span>
                    )}
                    {action.financialExposure && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle style={{ width: 9, height: 9, color: '#f97316' }} />
                        <span style={{ color: '#f97316' }}>{action.financialExposure}</span>
                      </span>
                    )}
                  </div>

                  {action.blockedReason && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.375rem 0.625rem',
                        background: 'hsla(24,80%,10%,0.6)',
                        border: '1px solid #f9731630',
                        borderRadius: '0.375rem',
                        fontSize: '10px',
                        color: '#f97316',
                      }}
                    >
                      Blocked: {action.blockedReason}
                    </div>
                  )}

                  {action.status === 'pending' && (onApprove || onReject || onExecute) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
                      {onApprove && (
                        <button
                          onClick={() => onApprove(action.id)}
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
                          <Check style={{ width: 10, height: 10 }} /> Approve
                        </button>
                      )}
                      {onReject && (
                        <button
                          onClick={() => onReject(action.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: 'hsla(0,0%,100%,0.05)',
                            border: '1px solid hsla(0,0%,100%,0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          <X style={{ width: 10, height: 10 }} /> Reject
                        </button>
                      )}
                      {onExecute && (
                        <button
                          onClick={() => onExecute(action.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: 'hsla(265,60%,18%,0.6)',
                            border: '1px solid #a78bfa30',
                            color: '#a78bfa',
                            cursor: 'pointer',
                          }}
                        >
                          <Play style={{ width: 10, height: 10 }} /> Execute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.2)',
              fontSize: '12px',
            }}
          >
            No actions match this filter
          </div>
        )}
      </div>
    </div>
  );
}
