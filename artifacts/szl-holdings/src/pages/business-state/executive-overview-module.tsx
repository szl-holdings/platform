import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { ACCENT, BG_CARD, BORDER } from './constants';
import { EXEC_HEALTH } from './data';
import { DomainTag, SectionCard, SeverityDot, useLive } from './helpers';
import type { DomainId } from './types';

export function ExecutiveOverviewModule({ executiveMode }: { executiveMode: boolean }) {
  const live = useLive();
  const health = live?.execHealth ?? EXEC_HEALTH;
  const [period, setPeriod] = useState<'24h' | '7d'>('24h');
  const healthColor = health.score >= 80 ? '#22c55e' : health.score >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr 1fr',
          gap: '0.875rem',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            background: BG_CARD,
            border: `2px solid ${healthColor}35`,
            borderRadius: '1rem',
            padding: executiveMode ? '2rem 1.5rem' : '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: executiveMode ? '160px' : '130px',
          }}
        >
          <div
            style={{
              fontSize: executiveMode ? '3.5rem' : '2.75rem',
              fontWeight: 900,
              color: healthColor,
              letterSpacing: '-0.05em',
              lineHeight: 1,
            }}
          >
            {health.score}
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: healthColor,
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '0.5rem',
            }}
          >
            {health.score >= 80 ? 'Good' : health.score >= 65 ? 'Moderate' : 'At Risk'}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>
            Business Health
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '0.625rem',
              fontSize: '12px',
              fontWeight: 700,
              color: '#22c55e',
            }}
          >
            <TrendingUp style={{ width: 11, height: 11 }} />
            {health.delta}
          </div>
        </div>

        <SectionCard title="Top Issues" icon={AlertTriangle} accent="#ef4444">
          {health.topIssues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: i < 2 ? '0.625rem' : 0,
              }}
            >
              <SeverityDot level={issue.severity} />
              <span
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, flex: 1 }}
              >
                {issue.title}
              </span>
              {(issue.domain as DomainId) && <DomainTag domain={issue.domain as DomainId} />}
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Top Opportunities" icon={TrendingUp} accent="#22c55e">
          {health.topOpps.map((opp, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? '0.625rem' : 0 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, marginBottom: '2px' }}>
                {opp.title}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>{opp.value}</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Blocked Actions" icon={AlertTriangle} accent="#f97316">
          {health.blockedActions.map((action, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? '0.625rem' : 0 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{action.title}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{action.reason}</div>
              <div style={{ fontSize: '9px', color: '#f97316', marginTop: '1px' }}>{action.exposure}</div>
            </div>
          ))}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              What Changed
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['24h', '7d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: period === p ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                    border: `1px solid ${period === p ? 'hsla(0,0%,100%,0.12)' : 'transparent'}`,
                    color: period === p ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {(period === '24h' ? health.changesYesterday : health.changesLastWeek).map((change, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <ArrowRight style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{change}</span>
            </div>
          ))}
        </div>

        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.875rem', padding: '1rem' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Financial Exposure
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
            {health.exposure}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '0.875rem' }}>
            Total value at risk this period
          </div>
          {health.topIssues.slice(0, 3).map((issue, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.375rem 0', borderBottom: i < 2 ? '1px solid hsla(0,0%,100%,0.04)' : 'none' }}
            >
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', flex: 1 }}>
                {issue.title.slice(0, 32)}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                {issue.severity === 'high' ? 'High' : 'Med'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
