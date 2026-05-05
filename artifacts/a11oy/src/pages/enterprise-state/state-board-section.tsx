import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { BORDER, CARD, FG, FG_MUT } from './constants';
import { STATE_BOARD_KPIS } from './data';
import { useLive } from './shared';

export function StateBoardSection() {
  const live = useLive();
  const kpis = (live?.stateBoardKpis ?? STATE_BOARD_KPIS) as typeof STATE_BOARD_KPIS;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            borderTop: `2px solid ${kpi.color}60`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: FG_MUT,
              }}
            >
              {kpi.label}
            </span>
            {kpi.trend === 'up' ? (
              <TrendingUp style={{ width: 11, height: 11, color: '#22c55e' }} />
            ) : kpi.trend === 'down' ? (
              <TrendingDown style={{ width: 11, height: 11, color: '#ef4444' }} />
            ) : null}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: kpi.color,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {kpi.value}
            <span style={{ fontSize: '12px', fontWeight: 500, color: FG_MUT }}>{kpi.unit}</span>
          </div>
          <div
            style={{
              marginTop: '0.375rem',
              fontSize: '10px',
              fontWeight: 600,
              color: kpi.trend === 'up' ? '#22c55e' : kpi.trend === 'down' ? '#ef4444' : FG_MUT,
            }}
          >
            {kpi.delta}
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.5rem',
              background: 'hsla(0,0%,100%,0.02)',
              border: `1px solid ${BORDER}`,
              borderRadius: '0.375rem',
              display: 'flex',
              gap: '4px',
              alignItems: 'flex-start',
            }}
          >
            <Info style={{ width: 9, height: 9, color: FG_MUT, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '9px', color: FG_MUT, lineHeight: 1.5 }}>{kpi.causal}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
