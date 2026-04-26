import {
  Activity,
  AlertTriangle,
  Info,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface AtlasScenePanelProps {
  incidentId?: string;
  vesselId?: string;
  propertyId?: string;
  isDemo?: boolean;
}

const DEMO_TIMELINE = [
  {
    time: '14:02:11',
    event: 'Threat actor lateral movement detected — east network segment',
    type: 'critical',
  },
  {
    time: '14:04:33',
    event: 'MITRE ATT&CK T1021.002: SMB/Windows Admin Shares enumeration',
    type: 'warning',
  },
  {
    time: '14:07:19',
    event: 'Credential access attempt blocked — endpoint: WS-DEVOPS-04',
    type: 'warning',
  },
  { time: '14:09:48', event: 'Isolation policy applied — 4 hosts quarantined', type: 'info' },
  {
    time: '14:12:02',
    event: 'IR agent recommendation queued — awaiting CISO approval',
    type: 'info',
  },
  {
    time: '14:15:30',
    event: 'SIEM correlation rule triggered — campaign fingerprint match',
    type: 'critical',
  },
];

const DEMO_METRICS = [
  { label: 'Affected assets', value: '4', accent: '#f5f5f5' },
  { label: 'Attack vector', value: 'SMB', accent: '#c9b787' },
  { label: 'MITRE stage', value: 'Lateral Movement', accent: '#8a8a8a' },
  { label: 'Containment', value: 'Partial', accent: '#c9b787' },
  { label: 'Blast radius', value: 'Low', accent: '#c9b787' },
  { label: 'Conf. score', value: '94%', accent: '#c9b787' },
];

const TYPE_CONFIG = {
  critical: { icon: XCircle, color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)' },
  warning: { icon: AlertTriangle, color: '#c9b787', bg: 'rgba(201,183,135,0.08)' },
  info: { icon: Info, color: '#c9b787', bg: 'rgba(201,183,135,0.08)' },
} as const;

export function AtlasScenePanel({ incidentId, isDemo }: AtlasScenePanelProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'metrics'>('timeline');

  const displayId = incidentId ? `INC-${incidentId.slice(-6).toUpperCase()}` : 'INC-2409-DEMO';

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        background: 'rgba(96,165,250,0.03)',
        border: '1px solid rgba(96,165,250,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(96,165,250,0.1)',
          background: 'rgba(96,165,250,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={14} style={{ color: '#c9b787' }} />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#c9b787',
              letterSpacing: '0.04em',
            }}
          >
            ATLAS Scene — {displayId}
          </span>
          {isDemo && (
            <span
              style={{
                fontSize: '0.55rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '2rem',
                background: 'rgba(96,165,250,0.12)',
                color: '#c9b787',
                border: '1px solid rgba(96,165,250,0.25)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              DEMO
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Activity size={11} style={{ color: '#f5f5f5' }} />
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'monospace',
              color: '#f5f5f5',
              letterSpacing: '0.08em',
            }}
          >
            P1 · ACTIVE
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 1.125rem',
        }}
      >
        {(['timeline', 'metrics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 0.875rem 0.5rem 0',
              marginRight: '0.875rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'capitalize',
              color: activeTab === tab ? '#c9b787' : 'rgba(255,255,255,0.35)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #c9b787' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem 1.125rem' }}>
        {activeTab === 'timeline' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_TIMELINE.map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '0.375rem',
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}18`,
                  }}
                >
                  <Icon size={12} style={{ color: cfg.color, flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.82)',
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      {entry.event}
                    </p>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {entry.time} UTC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {DEMO_METRICS.map((m, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: m.accent,
                    margin: 0,
                  }}
                >
                  {m.value}
                </p>
                <p
                  style={{
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: 0,
                    marginTop: '0.25rem',
                  }}
                >
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
