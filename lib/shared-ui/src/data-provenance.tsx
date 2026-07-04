import React, { useState } from 'react';
import { CONFIDENCE_CONFIG, type DataProvenanceInfo, FRESHNESS_CONFIG } from './ontology';

interface DataProvenanceProps {
  provenance: DataProvenanceInfo;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const STATE_DOT: Record<string, string> = {
  live: '#6b8f71',
  demo: '#4a90b8',
  simulated: '#8b7ac8',
  cached: '#d4a054',
};

const STATE_LABEL: Record<string, string> = {
  live: 'Live',
  demo: 'Demo',
  simulated: 'Simulated',
  cached: 'Cached',
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function DataProvenance({ provenance, compact, className, style }: DataProvenanceProps) {
  const [expanded, setExpanded] = useState(false);
  const fresh = FRESHNESS_CONFIG[provenance.freshness];
  const conf = CONFIDENCE_CONFIG[provenance.confidence];
  const dotColor = STATE_DOT[provenance.dataState] || '#6b7280';
  const stateLabel = STATE_LABEL[provenance.dataState] || provenance.dataState;

  if (compact) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
          ...style,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: provenance.dataState === 'live' ? `0 0 6px ${dotColor}` : 'none',
          }}
        />
        {stateLabel} · {fresh.label} · {provenance.source}
      </span>
    );
  }

  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        overflow: 'hidden',
        fontSize: '11px',
        fontFamily: 'monospace',
        ...style,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            boxShadow: provenance.dataState === 'live' ? `0 0 6px ${dotColor}` : 'none',
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{stateLabel}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
        <span>{provenance.source}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
        <span style={{ color: fresh.color }}>{fresh.label}</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: '8px 12px 10px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px 16px',
          }}
        >
          <div>
            <span
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Source
            </span>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{provenance.source}</div>
          </div>
          <div>
            <span
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Last Updated
            </span>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {timeAgo(provenance.lastUpdated)}
            </div>
          </div>
          <div>
            <span
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Confidence
            </span>
            <div style={{ color: conf.color, marginTop: 2 }}>{conf.label}</div>
          </div>
          <div>
            <span
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Freshness
            </span>
            <div style={{ color: fresh.color, marginTop: 2 }}>{fresh.label}</div>
          </div>
          {provenance.owner && (
            <div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Owner
              </span>
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{provenance.owner}</div>
            </div>
          )}
          {provenance.nextRefresh && (
            <div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Next Refresh
              </span>
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {provenance.nextRefresh}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionLoopProps {
  actions: Array<{
    id: string;
    label: string;
    type: 'remediate' | 'approve' | 'escalate' | 'assign' | 'investigate' | 'dismiss';
    severity?: 'critical' | 'high' | 'medium' | 'low';
    onAction?: () => void;
  }>;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ACTION_ICONS: Record<string, string> = {
  remediate: '⚡',
  approve: '✓',
  escalate: '↑',
  assign: '→',
  investigate: '🔍',
  dismiss: '✕',
};

const ACTION_COLORS: Record<string, string> = {
  remediate: '#6b8f71',
  approve: '#6b8f71',
  escalate: '#c45a4a',
  assign: '#4a90b8',
  investigate: '#8b7ac8',
  dismiss: '#6b7280',
};

export function ActionLoop({ actions, title, className, style }: ActionLoopProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        padding: '12px',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '10px',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {actions.map((action) => {
          const color = ACTION_COLORS[action.type] || '#6b7280';
          return (
            <button
              key={action.id}
              onClick={action.onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: `${color}14`,
                border: `1px solid ${color}30`,
                color,
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = `${color}25`;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = `${color}14`;
              }}
            >
              <span style={{ fontSize: '12px' }}>{ACTION_ICONS[action.type]}</span>
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RoleSelectorProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  roles?: Array<{ id: string; label: string; description: string }>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_ROLES = [
  {
    id: 'executive',
    label: 'Executive',
    description: 'Strategic overview, value at risk, portfolio health',
  },
  {
    id: 'operator',
    label: 'Operator',
    description: 'Tactical queues, active incidents, pending actions',
  },
  { id: 'analyst', label: 'Analyst', description: 'Deep data, trends, investigation tools' },
  { id: 'admin', label: 'Admin', description: 'System health, configuration, audit logs' },
  {
    id: 'buyer',
    label: 'Buyer / Demo',
    description: 'Product overview, capabilities, sample data',
  },
];

export function RoleSelector({
  currentRole,
  onRoleChange,
  roles,
  className,
  style,
}: RoleSelectorProps) {
  const roleList = roles || DEFAULT_ROLES;
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '4px',
        padding: '3px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        ...style,
      }}
    >
      {roleList.map((role) => (
        <button
          key={role.id}
          onClick={() => onRoleChange(role.id)}
          title={role.description}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            background: currentRole === role.id ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: currentRole === role.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
            fontSize: '11px',
            fontWeight: currentRole === role.id ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
