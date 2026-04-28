import { BG_CARD, BORDER } from './constants';
import { POLICIES_SUMMARY } from './data';
import { useLive } from './helpers';

export function PolicyComplianceModule() {
  const live = useLive();
  const policies = (live?.policiesSummary ?? POLICIES_SUMMARY) as typeof POLICIES_SUMMARY;
  const active = policies.filter((p) => p.status === 'active').length;
  const pending = policies.filter((p) => p.status === 'pending').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Active', value: active, color: '#22c55e' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Drafts', value: policies.filter((p) => p.status === 'draft').length, color: 'rgba(255,255,255,0.4)' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.625rem', padding: '0.75rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {policies.map((policy, i) => {
        const statusColor =
          policy.status === 'active'
            ? '#22c55e'
            : policy.status === 'pending'
              ? '#f59e0b'
              : 'rgba(255,255,255,0.3)';
        return (
          <div
            key={policy.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderBottom: i < policies.length - 1 ? `1px solid ${BORDER}` : 'none',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{policy.title}</span>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {policy.domains.slice(0, 2).map((d) => (
                <span key={d} style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'hsla(0,0%,100%,0.04)', color: 'rgba(255,255,255,0.35)' }}>
                  {d}
                </span>
              ))}
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{policy.owner}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', background: `${statusColor}20`, color: statusColor }}>
              {policy.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
