/**
 * DigitalTwinCard — Reusable twin state visualization component
 * Displays current state, alerts, predicted states, and simulation trigger
 */

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

export interface TwinAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  triggeredAt: string;
}

export interface PredictedState {
  timeHorizon: string;
  state: Record<string, unknown>;
  confidence: number;
  drivingFactors: string[];
}

export interface TwinCardProps {
  twinId: string;
  entityName: string;
  twinType: 'vessel' | 'property' | 'posture';
  status: 'active' | 'degraded' | 'offline' | 'simulating';
  currentState: Record<string, unknown>;
  predictedStates: PredictedState[];
  alerts: TwinAlert[];
  confidenceScore: number;
  lastSyncedAt: string;
  accentColor?: string;
  onRunSimulation?: (twinId: string) => void;
  className?: string;
}

const STATUS_CONFIG = {
  active: { label: 'Live', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  degraded: { label: 'Degraded', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  offline: { label: 'Offline', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  simulating: { label: 'Simulating', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

const TYPE_LABELS = {
  vessel: 'Vessel Digital Twin',
  property: 'Property Digital Twin',
  posture: 'Security Posture Twin',
};

function AlertBadge({ alert }: { alert: TwinAlert }) {
  const colors = { info: '#60a5fa', warning: '#f59e0b', critical: '#ef4444' };
  const color = colors[alert.severity];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '6px 8px',
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: '6px',
        marginBottom: '4px',
      }}
    >
      <AlertTriangle size={11} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
        {alert.message}
      </span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: unknown }) {
  const display =
    typeof value === 'number'
      ? value > 100
        ? value.toLocaleString()
        : value.toFixed
          ? value.toFixed(2)
          : String(value)
      : String(value);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
        {display}
      </span>
    </div>
  );
}

function formatStateKeys(state: Record<string, unknown>): Array<{ label: string; value: unknown }> {
  const formatLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  const skipKeys = ['timestamp', 'generatedAt'];
  return Object.entries(state)
    .filter(([k]) => !skipKeys.includes(k))
    .slice(0, 8)
    .map(([k, v]) => ({ label: formatLabel(k), value: v }));
}

export function DigitalTwinCard({
  twinId,
  entityName,
  twinType,
  status,
  currentState,
  predictedStates,
  alerts,
  confidenceScore,
  lastSyncedAt,
  accentColor = '#a78bfa',
  onRunSimulation,
}: TwinCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const statusCfg = STATUS_CONFIG[status];
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const metrics = formatStateKeys(currentState);
  const syncedAgo = (() => {
    const ms = Date.now() - new Date(lastSyncedAt).getTime();
    if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    return `${Math.floor(ms / 3600000)}h ago`;
  })();

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${criticalAlerts.length > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
          <span
            style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.88)', flex: 1 }}
          >
            {entityName}
          </span>
          <div style={{ padding: '2px 8px', background: statusCfg.bg, borderRadius: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
            {TYPE_LABELS[twinType]}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>·</span>
          <Clock size={9} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{syncedAgo}</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
            Confidence: {(confidenceScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {criticalAlerts.slice(0, 2).map((a) => (
            <AlertBadge key={a.id} alert={a} />
          ))}
          {warningAlerts.slice(0, 1).map((a) => (
            <AlertBadge key={a.id} alert={a} />
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px' }}>
        {metrics.slice(0, expanded ? metrics.length : 5).map((m) => (
          <MetricRow key={m.label} label={m.label} value={m.value} />
        ))}
        {metrics.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '11px',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={11} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={11} /> +{metrics.length - 5} more metrics
              </>
            )}
          </button>
        )}
      </div>

      {predictedStates.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}>
          <button
            onClick={() => setShowPredictions(!showPredictions)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              width: '100%',
            }}
          >
            <TrendingUp size={11} color={accentColor} />
            <span style={{ flex: 1, textAlign: 'left' }}>Predicted States</span>
            {showPredictions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showPredictions && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {predictedStates.slice(0, 3).map((ps, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    padding: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}
                    >
                      T+{ps.timeHorizon}
                    </span>
                    <span style={{ fontSize: '10px', color: accentColor }}>
                      {(ps.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  {formatStateKeys(ps.state)
                    .slice(0, 3)
                    .map((m) => (
                      <MetricRow key={m.label} label={m.label} value={m.value} />
                    ))}
                  {ps.drivingFactors.length > 0 && (
                    <p
                      style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.3)',
                        margin: '4px 0 0',
                      }}
                    >
                      Driven by: {ps.drivingFactors.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onRunSimulation && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}>
          <button
            onClick={() => onRunSimulation(twinId)}
            style={{
              width: '100%',
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}40`,
              borderRadius: '7px',
              padding: '8px',
              cursor: 'pointer',
              color: accentColor,
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Play size={12} />
            Run What-If Simulation
          </button>
        </div>
      )}
    </div>
  );
}
