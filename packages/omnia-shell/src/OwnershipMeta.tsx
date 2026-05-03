/**
 * OMNIA — Ownership Metadata Display
 * Phase 13 — UX Normalization
 *
 * Renders the ownership and provenance metadata for any SZL governed resource:
 * owner team, system, domain, lifecycle, health endpoint, runbook link.
 *
 * Shared across all domain packs. Per-pack overrides are scoped via props.
 */

import React from 'react';

export interface OwnershipMetaProps {
  ownerTeam: string;
  system?: string;
  domain?: string;
  lifecycle?: 'production' | 'experimental' | 'deprecated';
  healthEndpoint?: string;
  runbookUrl?: string;
  scorecardScore?: number;
  tier?: 'tier-0' | 'tier-1' | 'tier-2';
  lastDeploy?: string;
  className?: string;
}

const LIFECYCLE_CONFIG: Record<NonNullable<OwnershipMetaProps['lifecycle']>, { color: string; label: string }> = {
  production: { color: '#22c55e', label: 'Production' },
  experimental: { color: '#f59e0b', label: 'Experimental' },
  deprecated: { color: '#6b7280', label: 'Deprecated' },
};

function MetaRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 14, textAlign: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 80 }}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', flex: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.90)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
        >
          {value}
        </a>
      ) : (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', flex: 1 }}>{value}</span>
      )}
    </div>
  );
}

function ScorecardBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 14, textAlign: 'center' }}>◈</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 80 }}>Scorecard</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{pct}</span>
      </div>
    </div>
  );
}

export function OwnershipMeta({
  ownerTeam,
  system,
  domain,
  lifecycle,
  healthEndpoint,
  runbookUrl,
  scorecardScore,
  tier,
  lastDeploy,
  className,
}: OwnershipMetaProps) {
  const lifecycleCfg = lifecycle ? LIFECYCLE_CONFIG[lifecycle] : null;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.40)',
          }}
        >
          Ownership
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tier && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.30)',
              }}
            >
              {tier}
            </span>
          )}
          {lifecycleCfg && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: lifecycleCfg.color,
              }}
            >
              {lifecycleCfg.label}
            </span>
          )}
        </div>
      </div>

      <MetaRow icon="◎" label="Owner" value={ownerTeam} />
      {system && <MetaRow icon="⊞" label="System" value={system} />}
      {domain && <MetaRow icon="◈" label="Domain" value={domain} />}
      {healthEndpoint && (
        <MetaRow icon="♥" label="Health" value={healthEndpoint} href={healthEndpoint} />
      )}
      {runbookUrl && (
        <MetaRow icon="⊙" label="Runbook" value="View runbook →" href={runbookUrl} />
      )}
      {scorecardScore !== undefined && <ScorecardBar score={scorecardScore} />}
      {lastDeploy && (
        <MetaRow
          icon="↑"
          label="Last deploy"
          value={new Date(lastDeploy).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        />
      )}
    </div>
  );
}
