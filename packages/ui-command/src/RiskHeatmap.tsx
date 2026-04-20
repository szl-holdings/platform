import React, { useState } from 'react';
import type { OpportunityItem, RiskItem } from './types';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

function riskColor(level: string) {
  switch (level) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    default:
      return '#22c55e';
  }
}

function oppColor(level: string) {
  switch (level) {
    case 'high':
      return '#22c55e';
    case 'medium':
      return '#0ea5e9';
    default:
      return '#6b7280';
  }
}

interface RiskHeatmapProps {
  risks: RiskItem[];
  opportunities?: OpportunityItem[];
  title?: string;
  mode?: 'risk' | 'opportunity' | 'both';
}

export function RiskHeatmap({
  risks,
  opportunities = [],
  title = 'Risk / Opportunity Matrix',
  mode = 'both',
}: RiskHeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const showRisks = mode === 'risk' || mode === 'both';
  const showOpps = mode === 'opportunity' || mode === 'both';

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: '1rem',
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: 'relative',
          height: '220px',
          background: 'hsla(0,0%,100%,0.02)',
          border: '1px solid hsla(0,0%,100%,0.05)',
          borderRadius: '0.5rem',
          overflow: 'visible',
        }}
      >
        {[0.25, 0.5, 0.75].map((v) => (
          <React.Fragment key={v}>
            <div
              style={{
                position: 'absolute',
                left: `${v * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'hsla(0,0%,100%,0.04)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: `${v * 100}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'hsla(0,0%,100%,0.04)',
              }}
            />
          </React.Fragment>
        ))}

        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '4px',
            fontSize: '8px',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          High Impact →
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '4px',
            fontSize: '8px',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          High Probability →
        </div>

        {showRisks &&
          risks.map((risk) => {
            const x = risk.probability;
            const y = 1 - risk.impact;
            const color = riskColor(risk.level);
            const isHov = hovered === risk.id;

            return (
              <div
                key={risk.id}
                onMouseEnter={() => setHovered(risk.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isHov ? '14px' : '10px',
                  height: isHov ? '14px' : '10px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 ${isHov ? 12 : 6}px ${color}80`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: isHov ? 10 : 1,
                }}
              >
                {isHov && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: 'calc(100% + 8px)',
                      transform: 'translateX(-50%)',
                      background: '#1a1d2e',
                      border: `1px solid ${color}40`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      width: '160px',
                      zIndex: 20,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                        marginBottom: '2px',
                      }}
                    >
                      {risk.title}
                    </div>
                    <div style={{ fontSize: '9px', color: color, fontWeight: 600 }}>
                      {risk.domain}
                    </div>
                    {risk.mitigation && (
                      <div
                        style={{
                          fontSize: '9px',
                          color: 'rgba(255,255,255,0.4)',
                          marginTop: '3px',
                        }}
                      >
                        {risk.mitigation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {showOpps &&
          opportunities.map((opp) => {
            const x = opp.probability;
            const y = 1 - opp.value / 100;
            const color = oppColor(opp.level);
            const isHov = hovered === opp.id;

            return (
              <div
                key={opp.id}
                onMouseEnter={() => setHovered(opp.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${Math.max(0, Math.min(95, y * 100))}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isHov ? '14px' : '10px',
                  height: isHov ? '14px' : '10px',
                  borderRadius: '2px',
                  background: color,
                  boxShadow: `0 0 ${isHov ? 12 : 6}px ${color}80`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: isHov ? 10 : 1,
                }}
              >
                {isHov && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: 'calc(100% + 8px)',
                      transform: 'translateX(-50%)',
                      background: '#1a1d2e',
                      border: `1px solid ${color}40`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      width: '160px',
                      zIndex: 20,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                        marginBottom: '2px',
                      }}
                    >
                      {opp.title}
                    </div>
                    <div style={{ fontSize: '9px', color: color, fontWeight: 600 }}>
                      {opp.domain}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {showRisks && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Risks</span>
          </div>
        )}
        {showOpps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#22c55e' }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Opportunities</span>
          </div>
        )}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
          X: Probability · Y: Impact
        </span>
      </div>

      {(showRisks ? risks : []).length > 0 && (
        <div
          style={{
            marginTop: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
          }}
        >
          {risks.slice(0, 4).map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.375rem 0',
                borderBottom: '1px solid hsla(0,0%,100%,0.04)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: riskColor(r.level),
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                {r.title}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: `${riskColor(r.level)}20`,
                  color: riskColor(r.level),
                }}
              >
                {r.level}
              </span>
              {r.owner && (
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{r.owner}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
