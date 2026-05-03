/**
 * OMNIA — Deployment / Health Context Surface
 * Phase 13 — UX Normalization
 *
 * Surfaces the current deployment and health context for any service or artifact.
 * Shows environment, version, deployment status, health probe status, and SLO posture.
 *
 * Shared across all SZL domain packs — domain-specific detail is injected via props.
 */

import React from 'react';
import { StatusChip, type StatusVariant } from './StatusChip.js';

export type DeploymentEnvironment = 'development' | 'staging' | 'production';
export type HealthStatus = 'passing' | 'failing' | 'unknown';

export interface ServiceHealthProbe {
  name: string;
  url: string;
  status: HealthStatus;
  latencyMs?: number;
  lastChecked?: string;
}

export interface DeploymentContextProps {
  serviceName: string;
  environment: DeploymentEnvironment;
  version?: string;
  deploymentStatus: 'deployed' | 'deploying' | 'rollback' | 'failed' | 'pending';
  healthProbes?: ServiceHealthProbe[];
  sloName?: string;
  sloTarget?: number;
  sloCurrent?: number;
  uptime?: number;
  lastDeployedAt?: string;
  deployedBy?: string;
  className?: string;
}

const ENV_CONFIG: Record<DeploymentEnvironment, { color: string; label: string }> = {
  development: { color: '#3b82f6', label: 'DEV' },
  staging: { color: '#f59e0b', label: 'STAGING' },
  production: { color: '#22c55e', label: 'PROD' },
};

const DEPLOY_STATUS_MAP: Record<DeploymentContextProps['deploymentStatus'], StatusVariant> = {
  deployed: 'healthy',
  deploying: 'pending',
  rollback: 'warning',
  failed: 'critical',
  pending: 'pending',
};

const HEALTH_STATUS_MAP: Record<HealthStatus, StatusVariant> = {
  passing: 'healthy',
  failing: 'critical',
  unknown: 'unknown',
};

function ProbeRow({ probe }: { probe: ServiceHealthProbe }) {
  const statusVariant = HEALTH_STATUS_MAP[probe.status];
  const latencyColor = (probe.latencyMs ?? 0) < 200 ? '#22c55e' : (probe.latencyMs ?? 0) < 1000 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 10px',
        background: 'rgba(255,255,255,0.025)',
        borderRadius: 5,
        marginBottom: 4,
      }}
    >
      <StatusChip status={statusVariant} size="sm" pulsing={probe.status === 'failing'} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', flex: 1 }}>{probe.name}</span>
      {probe.latencyMs !== undefined && (
        <span style={{ fontSize: 10, color: latencyColor, fontVariantNumeric: 'tabular-nums' }}>
          {probe.latencyMs}ms
        </span>
      )}
      {probe.lastChecked && (
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.20)' }}>
          {new Date(probe.lastChecked).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

function SloBar({ name, target, current }: { name: string; target: number; current: number }) {
  const pct = Math.max(0, Math.min(100, current));
  const met = current >= target;
  const color = met ? '#22c55e' : '#ef4444';

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>{name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>target {target}%</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{current.toFixed(2)}%</span>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      {!met && (
        <p style={{ fontSize: 9, color: '#ef4444', marginTop: 3 }}>
          SLO breach — {(target - current).toFixed(2)}% below target
        </p>
      )}
    </div>
  );
}

export function DeploymentContext({
  serviceName,
  environment,
  version,
  deploymentStatus,
  healthProbes = [],
  sloName,
  sloTarget,
  sloCurrent,
  uptime,
  lastDeployedAt,
  deployedBy,
  className,
}: DeploymentContextProps) {
  const envCfg = ENV_CONFIG[environment];
  const deployStatusVariant = DEPLOY_STATUS_MAP[deploymentStatus];

  return (
    <div
      className={className}
      style={{
        background: 'rgba(6,11,18,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.75)',
            flex: 1,
          }}
        >
          {serviceName}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: 3,
            background: `${envCfg.color}18`,
            color: envCfg.color,
            border: `1px solid ${envCfg.color}30`,
          }}
        >
          {envCfg.label}
        </span>
        <StatusChip status={deployStatusVariant} label={deploymentStatus} size="sm" />
      </div>

      {/* Version + deploy info */}
      {(version ?? lastDeployedAt ?? deployedBy) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {version && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
              v{version}
            </span>
          )}
          {lastDeployedAt && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              deployed{' '}
              {new Date(lastDeployedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {deployedBy && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>by {deployedBy}</span>
          )}
          {uptime !== undefined && (
            <span style={{ fontSize: 10, color: uptime >= 99.9 ? '#22c55e' : uptime >= 99 ? '#f59e0b' : '#ef4444' }}>
              {uptime.toFixed(2)}% uptime
            </span>
          )}
        </div>
      )}

      {/* Health probes */}
      {healthProbes.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.30)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Health Probes
          </span>
          {healthProbes.map((probe) => (
            <ProbeRow key={probe.name} probe={probe} />
          ))}
        </div>
      )}

      {/* SLO */}
      {sloName && sloTarget !== undefined && sloCurrent !== undefined && (
        <SloBar name={sloName} target={sloTarget} current={sloCurrent} />
      )}
    </div>
  );
}
