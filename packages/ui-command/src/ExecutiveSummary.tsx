import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React from 'react';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

export interface ExecSummaryConfig {
  businessHealthScore: number;
  businessHealthDelta: string;
  businessHealthTrend: 'up' | 'down' | 'flat';
  topIssues: {
    title: string;
    severity: 'critical' | 'high' | 'medium';
    domain: string;
    domainColor: string;
  }[];
  topOpportunities: { title: string; value: string; domain: string; domainColor: string }[];
  blockedActions: { title: string; blockedReason: string; financialExposure?: string }[];
  financialExposure: string;
  ownerAccountability: { owner: string; openItems: number; overdueItems: number }[];
  changesSinceYesterday?: string[];
  changesSinceLastWeek?: string[];
}

function healthColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#f59e0b';
  return '#ef4444';
}

function healthLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 65) return 'Moderate';
  if (score >= 50) return 'At Risk';
  return 'Critical';
}

interface ExecutiveSummaryProps {
  config: ExecSummaryConfig;
  period?: 'yesterday' | 'last-week';
  onPeriodChange?: (p: 'yesterday' | 'last-week') => void;
}

export function ExecutiveSummary({
  config,
  period = 'yesterday',
  onPeriodChange,
}: ExecutiveSummaryProps) {
  const hColor = healthColor(config.businessHealthScore);

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
            background: BG,
            border: `2px solid ${hColor}40`,
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '140px',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: hColor,
              letterSpacing: '-0.05em',
              lineHeight: 1,
            }}
          >
            {config.businessHealthScore}
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: hColor,
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '0.375rem',
            }}
          >
            {healthLabel(config.businessHealthScore)}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>
            Business Health
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              marginTop: '0.5rem',
              fontSize: '11px',
              fontWeight: 700,
              color:
                config.businessHealthTrend === 'up'
                  ? '#22c55e'
                  : config.businessHealthTrend === 'down'
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.4)',
            }}
          >
            {config.businessHealthTrend === 'up' ? (
              <TrendingUp style={{ width: 11, height: 11 }} />
            ) : config.businessHealthTrend === 'down' ? (
              <TrendingDown style={{ width: 11, height: 11 }} />
            ) : null}
            {config.businessHealthDelta}
          </div>
        </div>

        <div
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.875rem',
            padding: '1rem',
            borderTop: '2px solid #ef444460',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}
          >
            Top Issues
          </div>
          {config.topIssues.slice(0, 3).map((issue, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: i < 2 ? '0.5rem' : 0,
              }}
            >
              <AlertTriangle
                style={{
                  width: 10,
                  height: 10,
                  color: issue.severity === 'critical' ? '#ef4444' : '#f59e0b',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                {issue.title}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: `${issue.domainColor}20`,
                  color: issue.domainColor,
                  flexShrink: 0,
                }}
              >
                {issue.domain}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.875rem',
            padding: '1rem',
            borderTop: '2px solid #22c55e60',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#22c55e',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}
          >
            Top Opportunities
          </div>
          {config.topOpportunities.slice(0, 3).map((opp, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: i < 2 ? '0.5rem' : 0,
              }}
            >
              <CheckCircle2
                style={{ width: 10, height: 10, color: '#22c55e', flexShrink: 0, marginTop: 2 }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {opp.title}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                {opp.value}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.875rem',
            padding: '1rem',
            borderTop: '2px solid #f9731660',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#f97316',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}
          >
            Blocked Actions
          </div>
          {config.blockedActions.slice(0, 3).map((action, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? '0.5rem' : 0 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>
                {action.title}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                {action.blockedReason}
              </div>
              {action.financialExposure && (
                <div style={{ fontSize: '9px', color: '#f97316', marginTop: '1px' }}>
                  {action.financialExposure}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.875rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              What Changed
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['yesterday', 'last-week'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange?.(p)}
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: period === p ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                    border: `1px solid ${period === p ? 'hsla(0,0%,100%,0.12)' : 'transparent'}`,
                    color: period === p ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p === 'yesterday' ? '24h' : '7d'}
                </button>
              ))}
            </div>
          </div>
          {(period === 'yesterday'
            ? config.changesSinceYesterday
            : config.changesSinceLastWeek
          )?.map((change, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.375rem',
              }}
            >
              <ArrowRight
                style={{
                  width: 10,
                  height: 10,
                  color: 'rgba(255,255,255,0.25)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                {change}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.875rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            Owner Accountability
          </div>
          {config.ownerAccountability.map((o, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.375rem 0',
                borderBottom:
                  i < config.ownerAccountability.length - 1
                    ? '1px solid hsla(0,0%,100%,0.04)'
                    : 'none',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'hsla(265,60%,18%,0.6)',
                  border: '1px solid #a78bfa30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#a78bfa',
                }}
              >
                {o.owner.charAt(0)}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', flex: 1 }}>
                {o.owner}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                {o.openItems} open
              </span>
              {o.overdueItems > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                  {o.overdueItems} overdue
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
