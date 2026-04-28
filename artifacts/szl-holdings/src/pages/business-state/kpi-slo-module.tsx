import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { BORDER } from './constants';
import { DOMAINS, KPI_HEALTH_DATA } from './data';
import { DomainTag, useLive } from './helpers';
import type { DomainId } from './types';

export function KPISLOModule() {
  const live = useLive();
  const kpiData = (live?.kpiHealth ?? KPI_HEALTH_DATA) as typeof KPI_HEALTH_DATA;
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'breach' | 'healthy'>('all');

  const filtered = kpiData.filter(
    (k) =>
      (domainFilter === 'all' || k.domain === domainFilter) &&
      (statusFilter === 'all' || k.status === statusFilter),
  );

  const breachCount = kpiData.filter((k) => k.status === 'breach').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['all', 'breach', 'healthy'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                background:
                  statusFilter === s
                    ? s === 'breach'
                      ? 'hsla(0,70%,14%,0.6)'
                      : s === 'healthy'
                        ? 'hsla(160,60%,14%,0.6)'
                        : 'hsla(0,0%,100%,0.08)'
                    : 'transparent',
                border: `1px solid ${statusFilter === s ? (s === 'breach' ? '#ef444430' : s === 'healthy' ? '#22c55e30' : 'hsla(0,0%,100%,0.12)') : 'transparent'}`,
                color:
                  statusFilter === s
                    ? s === 'breach'
                      ? '#ef4444'
                      : s === 'healthy'
                        ? '#22c55e'
                        : 'rgba(255,255,255,0.65)'
                    : 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s} {s === 'breach' ? `(${breachCount})` : ''}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {(['all', ...Object.keys(DOMAINS)] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d as DomainId | 'all')}
              style={{
                fontSize: '9px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                background:
                  domainFilter === d
                    ? d === 'all'
                      ? 'hsla(0,0%,100%,0.06)'
                      : `${DOMAINS[d as DomainId]?.color}20`
                    : 'transparent',
                border: `1px solid ${domainFilter === d ? (d === 'all' ? 'hsla(0,0%,100%,0.12)' : `${DOMAINS[d as DomainId]?.color}30`) : 'transparent'}`,
                color:
                  domainFilter === d
                    ? d === 'all'
                      ? 'rgba(255,255,255,0.65)'
                      : DOMAINS[d as DomainId]?.color
                    : 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
              }}
            >
              {d === 'all' ? 'All' : DOMAINS[d as DomainId]?.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {filtered.map((kpi, i) => {
          const domain = DOMAINS[kpi.domain as DomainId] ?? { name: kpi.domain, color: '#8b7ac8' };
          const isBreach = kpi.status === 'breach';
          return (
            <div
              key={kpi.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.75rem 0.875rem',
                background: isBreach ? 'hsla(0,70%,5%,0.3)' : 'transparent',
                borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: isBreach ? '2px solid #ef444460' : `2px solid ${domain.color}40`,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{kpi.name}</span>
                  {DOMAINS[kpi.domain as DomainId] && <DomainTag domain={kpi.domain as DomainId} />}
                  {isBreach && (
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: 'hsla(0,70%,14%,0.6)', color: '#ef4444' }}>
                      BREACH
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info style={{ width: 9, height: 9 }} />
                  {kpi.causal}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: isBreach ? '#ef4444' : '#22c55e', letterSpacing: '-0.02em' }}>
                  {kpi.current}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>target: {kpi.target}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {kpi.trend === 'up' ? (
                  <TrendingUp style={{ width: 12, height: 12, color: isBreach ? '#ef4444' : '#22c55e' }} />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown style={{ width: 12, height: 12, color: isBreach ? '#22c55e' : '#ef4444' }} />
                ) : (
                  <div style={{ width: 12, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>

              <div style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: isBreach ? 'hsla(0,70%,14%,0.6)' : 'hsla(160,60%,14%,0.6)', color: isBreach ? '#ef4444' : '#22c55e' }}>
                {isBreach ? 'Breach' : 'Healthy'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
