import { ChevronDown, ChevronRight, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { Recommendation } from './types';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

function impactColor(level: string) {
  if (level === 'high') return '#22c55e';
  if (level === 'medium') return '#f59e0b';
  return '#6b7280';
}

function effortColor(level: string) {
  if (level === 'low') return '#22c55e';
  if (level === 'medium') return '#f59e0b';
  return '#ef4444';
}

function statusStyles(status?: string): { bg: string; color: string; label: string } {
  switch (status) {
    case 'acknowledged':
      return { bg: 'hsla(214,70%,18%,0.6)', color: '#60a5fa', label: 'Acknowledged' };
    case 'in-progress':
      return { bg: 'hsla(38,80%,14%,0.6)', color: '#f59e0b', label: 'In Progress' };
    case 'done':
      return { bg: 'hsla(160,60%,14%,0.6)', color: '#22c55e', label: 'Done' };
    default:
      return { bg: 'hsla(265,50%,14%,0.6)', color: '#a78bfa', label: 'New' };
  }
}

interface RecommendationQueueProps {
  recommendations: Recommendation[];
  title?: string;
  onAcknowledge?: (id: string) => void;
  onAction?: (id: string) => void;
}

export function RecommendationQueue({
  recommendations,
  title = 'Recommendation Queue',
  onAcknowledge,
  onAction,
}: RecommendationQueueProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  function toggle(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '20px',
            background: 'hsla(265,50%,18%,0.6)',
            color: '#a78bfa',
            fontWeight: 600,
          }}
        >
          {recommendations.length} items
        </span>
      </div>

      <div>
        {recommendations.map((rec, i) => {
          const isExpanded = expanded.includes(rec.id);
          const st = statusStyles(rec.status);

          return (
            <div
              key={rec.id}
              style={{
                borderBottom: i < recommendations.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}
            >
              <div
                style={{
                  padding: '0.875rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onClick={() => toggle(rec.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'hsla(0,0%,100%,0.04)',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '9px',
                      fontWeight: 800,
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {rec.rank}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.85)',
                        }}
                      >
                        {rec.title}
                      </span>
                      {rec.domainColor && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: `${rec.domainColor}20`,
                            color: rec.domainColor,
                          }}
                        >
                          {rec.domain}
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '1px 8px',
                          borderRadius: '12px',
                          background: st.bg,
                          color: st.color,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp
                          style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }}
                        />
                        <span
                          style={{
                            fontSize: '10px',
                            color: impactColor(rec.impact),
                            fontWeight: 600,
                          }}
                        >
                          {rec.impact} impact
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
                        <span
                          style={{
                            fontSize: '10px',
                            color: effortColor(rec.effort),
                            fontWeight: 600,
                          }}
                        >
                          {rec.effort} effort
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown
                      style={{
                        width: 12,
                        height: 12,
                        color: 'rgba(255,255,255,0.25)',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  ) : (
                    <ChevronRight
                      style={{
                        width: 12,
                        height: 12,
                        color: 'rgba(255,255,255,0.25)',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 1.25rem 1rem 3.5rem' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.6,
                      marginBottom: '0.625rem',
                    }}
                  >
                    <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Why now:</strong> {rec.why}
                  </p>
                  {rec.signals && rec.signals.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.375rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {rec.signals.map((s, si) => (
                        <span
                          key={si}
                          style={{
                            fontSize: '9px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'hsla(0,0%,100%,0.04)',
                            border: '1px solid hsla(0,0%,100%,0.07)',
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {(onAcknowledge || onAction) && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {onAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction(rec.id);
                          }}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '5px 14px',
                            borderRadius: '6px',
                            background: '#7c3aed',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {rec.action ?? 'Take Action'}
                        </button>
                      )}
                      {onAcknowledge && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledge(rec.id);
                          }}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '5px 14px',
                            borderRadius: '6px',
                            background: 'hsla(0,0%,100%,0.05)',
                            border: '1px solid hsla(0,0%,100%,0.08)',
                            color: 'rgba(255,255,255,0.55)',
                            cursor: 'pointer',
                          }}
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
