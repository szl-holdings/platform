import { Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import type { KPIMetric } from './types';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

function severityStyles(severity?: KPIMetric['severity']) {
  if (severity === 'good') return { color: '#22c55e' };
  if (severity === 'bad') return { color: '#ef4444' };
  if (severity === 'warn') return { color: '#f59e0b' };
  return { color: 'rgba(255,255,255,0.85)' };
}

interface KPIBlockProps {
  metric: KPIMetric;
  large?: boolean;
  showCause?: boolean;
  accentColor?: string;
}

export function KPIBlock({ metric, large, showCause = true, accentColor }: KPIBlockProps) {
  const numSize = large ? '2.75rem' : '1.875rem';
  const sColor = accentColor ?? severityStyles(metric.severity).color;

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        padding: large ? '1.5rem' : '1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        borderTop: `2px solid ${sColor}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {metric.domain ?? ''} {metric.label}
        </span>
        {metric.trend === 'up' && (
          <TrendingUp style={{ width: 12, height: 12, color: '#22c55e' }} />
        )}
        {metric.trend === 'down' && (
          <TrendingDown style={{ width: 12, height: 12, color: '#ef4444' }} />
        )}
        {metric.trend === 'flat' && (
          <Minus style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
        <span
          style={{
            fontSize: numSize,
            fontWeight: 800,
            color: sColor,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {metric.value}
        </span>
        {metric.unit && (
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
            {metric.unit}
          </span>
        )}
      </div>

      {metric.delta && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color:
              metric.trend === 'up'
                ? '#22c55e'
                : metric.trend === 'down'
                  ? '#ef4444'
                  : 'rgba(255,255,255,0.4)',
          }}
        >
          {metric.delta}
        </span>
      )}

      {metric.target !== undefined && (
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
          Target:{' '}
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>
            {metric.target}
            {metric.unit ?? ''}
          </span>
        </div>
      )}

      {showCause && metric.causalExplanation && (
        <div
          style={{
            marginTop: '0.375rem',
            padding: '0.5rem 0.625rem',
            background: 'hsla(0,0%,100%,0.03)',
            border: '1px solid hsla(0,0%,100%,0.05)',
            borderRadius: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}
        >
          <Info
            style={{
              width: 11,
              height: 11,
              color: 'rgba(255,255,255,0.25)',
              flexShrink: 0,
              marginTop: 1,
            }}
          />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            {metric.causalExplanation}
          </span>
        </div>
      )}
    </div>
  );
}

interface KPIGridProps {
  metrics: KPIMetric[];
  columns?: 2 | 3 | 4;
  showCause?: boolean;
}

export function KPIGrid({ metrics, columns = 4, showCause = true }: KPIGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '0.875rem',
      }}
    >
      {metrics.map((m) => (
        <KPIBlock key={m.id} metric={m} showCause={showCause} />
      ))}
    </div>
  );
}
