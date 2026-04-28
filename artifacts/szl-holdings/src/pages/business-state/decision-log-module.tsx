import { Clock, History, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { ACCENT, BORDER } from './constants';
import { OPP_REGISTER, RISK_REGISTER } from './data';
import { useLive } from './helpers';
import { useActionStore } from './action-store';
import type { LogEntry } from './types';

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const catColor: Record<LogEntry['category'], string> = {
  Risk: '#ef4444',
  Opportunity: '#4d8fcc',
  Recommendation: ACCENT,
};

export function DecisionLogModule() {
  const live = useLive();
  const { store } = useActionStore();
  const [filter, setFilter] = useState<'all' | 'Risk' | 'Opportunity' | 'Recommendation'>('all');

  const risks = (live?.riskRegister ?? RISK_REGISTER) as typeof RISK_REGISTER;
  const opps = (live?.oppRegister ?? OPP_REGISTER) as typeof OPP_REGISTER;
  const riskTitle = (id: string) => risks.find((r) => r.id === id)?.title ?? id;
  const oppTitle = (id: string) => opps.find((o) => o.id === id)?.title ?? id;

  const entries: LogEntry[] = [];

  Object.entries(store.riskActions ?? {}).forEach(([id, a]) => {
    if (!a.at) return;
    const decision =
      a.type === 'playbook'
        ? a.status === 'done'
          ? 'Playbook executed'
          : 'Playbook started'
        : `Ticket ${a.ticketId ?? 'created'}`;
    entries.push({
      key: `risk-${id}-${a.at}`,
      at: a.at,
      category: 'Risk',
      title: riskTitle(id),
      decision,
      decisionColor: a.status === 'done' ? '#22c55e' : '#f59e0b',
      detail: a.result,
      actor: a.actor ?? '—',
    });
  });

  Object.entries(store.oppDecisions ?? {}).forEach(([id, d]) => {
    if (!d.at) return;
    const label =
      d.decision === 'accept'
        ? 'Accepted'
        : d.decision === 'reject'
          ? 'Rejected'
          : `Snoozed ${d.snoozeUntil ?? ''}`.trim();
    const color =
      d.decision === 'accept' ? '#22c55e' : d.decision === 'reject' ? '#ef4444' : '#f59e0b';
    entries.push({
      key: `opp-${id}-${d.at}`,
      at: d.at,
      category: 'Opportunity',
      title: oppTitle(id),
      decision: label,
      decisionColor: color,
      reason: d.reason,
      actor: d.actor ?? '—',
    });
  });

  Object.entries(store.recDecisions ?? {}).forEach(([id, d]) => {
    if (!d.at) return;
    const label =
      d.decision === 'accept'
        ? 'Accepted'
        : d.decision === 'reject'
          ? 'Rejected'
          : `Snoozed ${d.snoozeUntil ?? ''}`.trim();
    const color =
      d.decision === 'accept' ? '#22c55e' : d.decision === 'reject' ? '#ef4444' : '#f59e0b';
    entries.push({
      key: `rec-${id}-${d.at}`,
      at: d.at,
      category: 'Recommendation',
      title: `Recommendation ${id}`,
      decision: label,
      decisionColor: color,
      reason: d.reason,
      actor: d.actor ?? '—',
    });
  });

  const sorted = entries
    .filter((e) => filter === 'all' || e.category === filter)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const counts = {
    all: entries.length,
    Risk: entries.filter((e) => e.category === 'Risk').length,
    Opportunity: entries.filter((e) => e.category === 'Opportunity').length,
    Recommendation: entries.filter((e) => e.category === 'Recommendation').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['all', 'Risk', 'Opportunity', 'Recommendation'] as const).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                background: active ? `${ACCENT}18` : 'transparent',
                border: `1px solid ${active ? `${ACCENT}40` : 'hsla(0,0%,100%,0.08)'}`,
                color: active ? ACCENT : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f}{' '}
              <span style={{ fontWeight: 800, color: active ? ACCENT : 'rgba(255,255,255,0.3)' }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
          <History style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.5rem', display: 'block' }} />
          No decisions logged yet. Accept, reject, or snooze items in the Risk Register or Opportunities to see them here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sorted.map((e, i) => (
            <div
              key={e.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 90px 1fr auto auto',
                gap: '0.875rem',
                alignItems: 'center',
                padding: '0.625rem 0.875rem',
                borderBottom: i < sorted.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: `3px solid ${catColor[e.category]}40`,
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', background: `${catColor[e.category]}20`, color: catColor[e.category], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {e.category}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', background: `${e.decisionColor}20`, color: e.decisionColor, textAlign: 'center' }}>
                {e.decision}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.title}
                </div>
                {(e.reason || e.detail) && (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', lineHeight: 1.4 }}>
                    {e.reason ? `Reason: ${e.reason}` : e.detail}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck style={{ width: 10, height: 10 }} /> {e.actor}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 10, height: 10 }} /> {formatTime(e.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
