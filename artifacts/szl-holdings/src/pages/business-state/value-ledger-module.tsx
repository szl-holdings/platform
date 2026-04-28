import { Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { BORDER } from './constants';
import { VALUE_LEDGER } from './data';
import { DomainTag, useLive } from './helpers';
import type { DomainId } from './types';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

const typeConfig = {
  'at-risk': { label: 'At Risk', color: '#ef4444', bg: 'hsla(0,70%,14%,0.5)', icon: TrendingDown },
  protected: { label: 'Protected', color: '#22c55e', bg: 'hsla(160,60%,14%,0.5)', icon: Shield },
  created: { label: 'Created', color: '#a78bfa', bg: 'hsla(265,60%,14%,0.5)', icon: TrendingUp },
} as const;

export function ValueLedgerModule() {
  const live = useLive();
  const ledger = (live?.valueLedger ?? VALUE_LEDGER) as typeof VALUE_LEDGER;
  const atRisk = ledger.filter((v) => v.type === 'at-risk').reduce((s, v) => s + v.amount, 0);
  const protected_ = ledger.filter((v) => v.type === 'protected').reduce((s, v) => s + v.amount, 0);
  const created = ledger.filter((v) => v.type === 'created').reduce((s, v) => s + v.amount, 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {(
          [
            ['at-risk', atRisk],
            ['protected', protected_],
            ['created', created],
          ] as const
        ).map(([type, total]) => {
          const cfg = typeConfig[type];
          const Icon = cfg.icon;
          return (
            <div
              key={type}
              style={{ background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}
            >
              <Icon style={{ width: 16, height: 16, color: cfg.color, margin: '0 auto 0.375rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.color, letterSpacing: '-0.04em' }}>
                {fmt(total)}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                Value {cfg.label}
              </div>
            </div>
          );
        })}
      </div>

      {ledger.map((entry, i) => {
        const cfg = typeConfig[entry.type as keyof typeof typeConfig] ?? typeConfig['at-risk'];
        return (
          <div
            key={entry.id}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderBottom: i < ledger.length - 1 ? `1px solid ${BORDER}` : 'none' }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{entry.label}</div>
              {entry.note && (
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{entry.note}</div>
              )}
            </div>
            {entry.domain && <DomainTag domain={entry.domain as DomainId} />}
            <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
              {fmt(entry.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
