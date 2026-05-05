import { Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { ACCENT, BORDER, CARD, FG_MUT } from './constants';
import type { DomainKey } from './constants';
import { DomainBadge } from './shared';

export function ValueWidgets() {
  const widgets = [
    {
      label: 'Value at Risk',
      value: '$8.4M',
      color: '#ef4444',
      icon: TrendingDown,
      breakdown: [
        { label: 'Carlota data pipeline', amount: '$380K', domain: 'carlota' as DomainKey },
        { label: 'Lyte SLA penalties', amount: '$420K', domain: 'lyte' as DomainKey },
        { label: 'Aegis bundle degradation', amount: '$280K', domain: 'aegis' as DomainKey },
      ],
    },
    {
      label: 'Value Protected',
      value: '$1.54M',
      color: '#22c55e',
      icon: Shield,
      breakdown: [
        { label: 'Automated incident response', amount: '$1.2M', domain: 'aegis' as DomainKey },
        { label: 'AI deal pre-triage (Terra)', amount: '$340K', domain: 'terra' as DomainKey },
      ],
    },
    {
      label: 'Value Created',
      value: '$960K',
      color: ACCENT,
      icon: TrendingUp,
      breakdown: [
        { label: 'Lyte Signal Summarizer ARR', amount: '$820K', domain: 'lyte' as DomainKey },
        { label: 'Terra borough filter', amount: '$140K', domain: 'terra' as DomainKey },
      ],
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
      {widgets.map((w) => {
        const Icon = w.icon;
        return (
          <div
            key={w.label}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: '0.75rem',
              padding: '1.125rem',
              borderTop: `2px solid ${w.color}50`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <Icon style={{ width: 14, height: 14, color: w.color }} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: FG_MUT,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {w.label}
              </span>
            </div>
            <div
              style={{
                fontSize: '1.625rem',
                fontWeight: 900,
                color: w.color,
                letterSpacing: '-0.04em',
                marginBottom: '0.75rem',
              }}
            >
              {w.value}
            </div>
            {w.breakdown.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0',
                  borderBottom: i < w.breakdown.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}
              >
                <DomainBadge domain={b.domain} />
                <span style={{ fontSize: '10px', color: FG_MUT, flex: 1 }}>{b.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: w.color }}>
                  {b.amount}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
