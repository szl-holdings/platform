import { AlertTriangle, ExternalLink, Shield, } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export type PulseDomain =
  | 'maritime'
  | 'security'
  | 'real_estate'
  | 'legal'
  | 'financial'
  | 'platform'
  | 'executive';

export interface PulsePanelSection {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  confidence: number;
  riskLevel: string;
  keyJudgment: string;
  lastUpdated: string;
}

export interface PulsePanelAction {
  action: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  owner: string;
  dueBy: string;
}

export interface PulsePanelData {
  briefingId: string;
  briefingDate: string;
  overallRisk: string;
  overallConfidence: number;
  headline: string;
  domain: string;
  section: PulsePanelSection | null;
  relevantActions: PulsePanelAction[];
  pulseUrl: string;
}

export interface PulseBriefingPanelProps {
  domain: PulseDomain;
  apiBase?: string;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function getConfidenceInfo(score: number) {
  if (score >= 0.75)
    return {
      label: 'HC',
      color: '#4eca8b',
      bg: 'rgba(78,202,139,0.12)',
      border: 'rgba(78,202,139,0.3)',
    };
  if (score >= 0.5)
    return {
      label: 'MC',
      color: '#c8a84b',
      bg: 'rgba(200,168,75,0.12)',
      border: 'rgba(200,168,75,0.3)',
    };
  return {
    label: 'LC',
    color: '#e05050',
    bg: 'rgba(224,80,80,0.12)',
    border: 'rgba(224,80,80,0.3)',
  };
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'CRITICAL':
      return '#e05050';
    case 'HIGH':
      return '#e08c40';
    case 'MEDIUM':
      return '#c8a84b';
    default:
      return '#4eca8b';
  }
}

const AGENT_COLORS: Record<string, string> = {
  helmsman: '#5090e8',
  sentinel: '#e05050',
  terra: '#4eca8b',
  lexis: '#9b70e8',
  atlas: '#e08c40',
  beacon: '#40c8d8',
  alloy: '#c8a84b',
};

function usePulsePanel(domain: PulseDomain, apiBase: string) {
  const [data, setData] = useState<PulsePanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${apiBase}/pulse/domain-panel/${domain}`)
      .then((r) => r.json())
      .then((json: { success: boolean; panel: PulsePanelData | null }) => {
        if (!cancelled && json.success) {
          setData(json.panel);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load briefing');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domain, apiBase]);

  return { data, loading, error };
}

export function PulseBriefingPanel({
  domain,
  apiBase = '/api',
  compact = false,
  className,
  style,
}: PulseBriefingPanelProps) {
  const { data, loading, error } = usePulsePanel(domain, apiBase);

  const baseStyle: React.CSSProperties = {
    background: 'rgba(6,10,20,0.85)',
    border: '1px solid rgba(26,32,53,0.8)',
    borderRadius: 8,
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, sans-serif",
    ...style,
  };

  if (loading) {
    return (
      <div className={className} style={{ ...baseStyle, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid rgba(200,168,75,0.3)',
              borderTopColor: '#c8a84b',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '0.78rem', color: '#546078' }}>Loading briefing…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={className} style={{ ...baseStyle, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} color="#e05050" />
          <span style={{ fontSize: '0.78rem', color: '#8a96b0' }}>
            {error ?? 'No briefing available'}
          </span>
        </div>
      </div>
    );
  }

  const section = data.section;
  const conf = section
    ? getConfidenceInfo(section.confidence)
    : getConfidenceInfo(data.overallConfidence);
  const riskColor = getRiskColor(section?.riskLevel ?? data.overallRisk);
  const agentColor = section ? (AGENT_COLORS[section.agentId] ?? '#c8a84b') : '#c8a84b';
  const pulseUrl = data.pulseUrl || '/pulse/';

  return (
    <div className={className} style={baseStyle}>
      {/* Header */}
      <div
        style={{
          padding: compact ? '10px 14px' : '12px 16px',
          borderBottom: '1px solid rgba(26,32,53,0.6)',
          background: 'rgba(200,168,75,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#c8a84b',
              boxShadow: '0 0 6px rgba(200,168,75,0.6)',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#c8a84b',
            }}
          >
            LUMINA ·{' '}
            {new Date(data.briefingDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Shield size={10} color="rgba(200,168,75,0.5)" />
            <span
              style={{
                fontSize: '0.58rem',
                color: 'rgba(200,168,75,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              EXEC-RESTRICTED
            </span>
          </div>
        </div>
        <a
          href={pulseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.65rem',
            color: '#546078',
            textDecoration: 'none',
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(26,32,53,0.6)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#c8a84b')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#546078')}
        >
          <ExternalLink size={10} />
          Open in LUMINA
        </a>
      </div>

      {/* Section content */}
      <div style={{ padding: compact ? '10px 14px' : '14px 16px' }}>
        {section ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: compact ? 8 : 10,
              }}
            >
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: agentColor,
                  background: `${agentColor}15`,
                  border: `1px solid ${agentColor}35`,
                }}
              >
                {section.agentName}
              </span>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: conf.color,
                  background: conf.bg,
                  border: `1px solid ${conf.border}`,
                }}
              >
                {conf.label} · {Math.round(section.confidence * 100)}%
              </span>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: riskColor,
                  background: `${riskColor}15`,
                  border: `1px solid ${riskColor}35`,
                }}
              >
                {section.riskLevel}
              </span>
            </div>

            <p
              style={{
                fontSize: compact ? '0.8rem' : '0.85rem',
                color: '#d4d8e8',
                lineHeight: 1.55,
                fontFamily: "'Crimson Pro', Georgia, serif",
                marginBottom: data.relevantActions.length > 0 ? (compact ? 8 : 12) : 0,
              }}
            >
              {section.keyJudgment}
            </p>
          </>
        ) : (
          <p
            style={{
              fontSize: compact ? '0.8rem' : '0.85rem',
              color: '#8a96b0',
              lineHeight: 1.55,
              marginBottom: 8,
            }}
          >
            No domain-specific section for today's brief.
          </p>
        )}

        {/* Relevant actions */}
        {data.relevantActions.length > 0 && !compact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.relevantActions.map((action, i) => {
              const pColor =
                action.priority === 'P0'
                  ? '#e05050'
                  : action.priority === 'P1'
                    ? '#e08c40'
                    : '#c8a84b';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: 5,
                    background: 'rgba(0,0,0,0.2)',
                    borderLeft: `2px solid ${pColor}60`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: pColor,
                      background: `${pColor}18`,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {action.priority}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#e8edf8', lineHeight: 1.4 }}>
                      {action.action}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#546078', marginTop: 2 }}>
                      {action.dueBy}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(26,32,53,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.62rem', color: '#394560' }}>
          FORGE · {section?.agentName ?? 'FORGE'} ·{' '}
          {new Date(section?.lastUpdated ?? data.briefingDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <a
          href={pulseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.62rem', color: '#546078', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#c8a84b')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#546078')}
        >
          Full brief →
        </a>
      </div>
    </div>
  );
}

export default PulseBriefingPanel;
