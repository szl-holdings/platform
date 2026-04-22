import { APPROVALS, formatCurrency } from '@szl-holdings/shared-ui/core-observability-data';
import { AlertTriangle, ArrowRight, CheckSquare, Clock, ExternalLink, User } from 'lucide-react';

export default function ApprovalsCenter() {
  const escalated = APPROVALS.filter((a) => a.status === 'escalated');
  const aging = APPROVALS.filter((a) => a.status === 'pending' && a.age_hours > 48);
  const normal = APPROVALS.filter((a) => a.status === 'pending' && a.age_hours <= 48);

  const allSorted = [...escalated, ...aging, ...normal];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare className="w-4 h-4" style={{ color: '#d4a054' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Approvals Center
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Approvals Center</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Pending and aging approvals with SLA status, impact estimates, and escalation
          recommendations.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Escalated', value: escalated.length, color: '#ec4899' },
          { label: 'Past 48h SLA', value: aging.length, color: '#c45a4a' },
          { label: 'Pending', value: normal.length, color: '#d4a054' },
          {
            label: 'Total Impact',
            value: formatCurrency(APPROVALS.reduce((s, a) => s + a.impact_estimate, 0)),
            color: '#6b8f71',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[10px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {allSorted.map((a) => {
          const isEscalated = a.status === 'escalated';
          const isAging = a.age_hours > 48;
          const borderColor = isEscalated
            ? 'rgba(236,72,153,0.2)'
            : isAging
              ? 'rgba(196,90,74,0.15)'
              : 'rgba(255,255,255,0.07)';
          const bgColor = isEscalated
            ? 'rgba(236,72,153,0.03)'
            : isAging
              ? 'rgba(196,90,74,0.02)'
              : 'rgba(255,255,255,0.01)';

          return (
            <div
              key={a.id}
              className="rounded-xl border p-5"
              style={{ borderColor, background: bgColor }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isEscalated && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          color: '#ec4899',
                          background: 'rgba(236,72,153,0.12)',
                          border: '1px solid rgba(236,72,153,0.25)',
                        }}
                      >
                        ESCALATED
                      </span>
                    )}
                    {isAging && !isEscalated && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          color: '#c45a4a',
                          background: 'rgba(196,90,74,0.12)',
                          border: '1px solid rgba(196,90,74,0.25)',
                        }}
                      >
                        SLA BREACHED
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">{a.title}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Workflow: {a.workflow_name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold mb-0.5" style={{ color: '#6b8f71' }}>
                    {formatCurrency(a.impact_estimate)}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    estimated impact
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-[10px] mb-4">
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <User className="w-3 h-3" />
                  {a.owner || <span style={{ color: '#c45a4a' }}>Unassigned</span>}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{a.team}</span>
                <span
                  className="flex items-center gap-1"
                  style={{
                    color: a.age_hours > 48 ? '#c45a4a' : a.age_hours > 24 ? '#c8953c' : '#d4a054',
                  }}
                >
                  <Clock className="w-3 h-3" />
                  {a.age_hours}h old
                </span>
                {a.escalation_recommended && (
                  <span className="flex items-center gap-1" style={{ color: '#ec4899' }}>
                    <AlertTriangle className="w-3 h-3" />
                    Escalation recommended
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    color: '#6b8f71',
                    background: 'rgba(107,143,113,0.1)',
                    border: '1px solid rgba(107,143,113,0.25)',
                  }}
                >
                  Approve
                </button>
                <button
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    color: '#c45a4a',
                    background: 'rgba(196,90,74,0.1)',
                    border: '1px solid rgba(196,90,74,0.25)',
                  }}
                >
                  Reject
                </button>
                <button
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    color: '#8b7ac8',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  Escalate
                </button>
                <button
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Defer
                </button>
                <a
                  href="/alloy"
                  className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1 ml-auto"
                  style={{
                    color: '#8b7ac8',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}
                >
                  <ExternalLink className="w-3 h-3" /> Alloy Rationale
                </a>
                <a
                  href="/intervention"
                  className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{
                    color: '#d4a054',
                    background: 'rgba(212,160,84,0.08)',
                    border: '1px solid rgba(212,160,84,0.15)',
                  }}
                >
                  Intervene <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
