// @ts-nocheck
import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';

const DS = {
  page: '#08090e',
  surface: 'rgba(255,255,255,0.025)',
  surfaceSolid: '#0d0e14',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.03)',
  gold: '#b8943c',
  goldDim: 'rgba(184,148,60,0.7)',
  text: 'rgba(255,255,255,0.85)',
  textDim: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

const REPLAY_ROOT_PREFIX = '1ed4d253';
const REPLAY_ROOT_FULL = '1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b';
const TERRA_COMMIT_SHA = '2ffac59c45550220772602f974fc95293a6754a2';
const TERRA_TAG_SHA = 'c45d6ca2861fe7623056264566c8dc2ce93f9c59';
const TERRA_TAG = 'v1.0.0-alpha';
const TERRA_PUSHED_AT = '2026-05-15T14:40:14Z';
const ARXIV_SHA_PREFIX = '13ca4a06';

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  borderTop: `1px solid ${DS.border}`,
  background: DS.page,
};

const cardStyle: CSSProperties = {
  background: DS.surfaceSolid,
  border: `1px solid ${DS.border}`,
  borderRadius: 4,
  padding: 24,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: DS.mono,
  fontWeight: 600,
  letterSpacing: '0.16em',
  color: DS.gold,
  textTransform: 'uppercase' as const,
  marginBottom: 12,
};

const cardTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: DS.text,
  letterSpacing: '-0.005em',
  marginBottom: 14,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  padding: '8px 0',
  borderBottom: `1px solid ${DS.borderMuted}`,
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  color: DS.textDim,
  fontFamily: DS.mono,
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

const valueStyle: CSSProperties = {
  color: DS.text,
  fontFamily: DS.mono,
  fontSize: 11,
  textAlign: 'right' as const,
  wordBreak: 'break-all' as const,
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

export function TerraGovernancePanels() {
  return (
    <section style={sectionStyle}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 11,
              fontFamily: DS.mono,
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: DS.goldDim,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Governance posture · payload-grounded
          </p>
          <h3
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: DS.text,
              letterSpacing: '-0.01em',
              fontFamily: DS.sans,
              maxWidth: 720,
              lineHeight: 1.2,
            }}
          >
            Real-estate intelligence with the same provenance contract as the
            rest of the SZL Holdings stack.
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {/* Provenance */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Provenance</p>
            <h4 style={cardTitle}>Replay root &amp; invariant</h4>
            <Row label="Replay root" value={`${REPLAY_ROOT_PREFIX}…`} />
            <Row label="Byte-identical replays" value="5 of 5" />
            <Row label="Λ floor" value="0.90 (9-axis ∧)" />
            <Row label="moralGrounding" value="≥ 0.95" />
            <Row label="measurabilityHonesty" value="≥ 0.95" />
            <Row label="Ingestion" value="PUBLIC_ONLY" />
            <Row
              label="License allowlist"
              value="Apache-2.0 · MIT · BSD-3 · CC-BY-4.0"
            />
            <Row label="HEAD" value={`${TERRA_COMMIT_SHA.slice(0, 12)}…`} />
            <p
              style={{
                marginTop: 14,
                fontSize: 10,
                color: DS.textMuted,
                fontFamily: DS.mono,
                lineHeight: 1.6,
                wordBreak: 'break-all',
              }}
            >
              {REPLAY_ROOT_FULL}
            </p>
          </div>

          {/* Evidence Ledger */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Evidence Ledger</p>
            <h4 style={cardTitle}>13-DOI ledger · Zenodo v14</h4>
            <Row label="Tag" value={TERRA_TAG} />
            <Row label="Tag SHA" value={`${TERRA_TAG_SHA.slice(0, 12)}…`} />
            <Row label="Pushed" value={TERRA_PUSHED_AT.slice(0, 10)} />
            <Row label="Repository" value="szl-holdings/terra" />
            <Row label="Latest commit" value={`${TERRA_COMMIT_SHA.slice(0, 12)}…`} />
            <Row label="Citation" value="CITATION.cff" />
            <Row label="Notice" value="NOTICE + LICENSE" />
            <Row label="DOI ledger" value="13 minted" />
            <Row label="Push queue" value={`Zenodo v14 · arXiv ${ARXIV_SHA_PREFIX}…`} />
          </div>

          {/* Ownership */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Ownership</p>
            <h4 style={cardTitle}>Canonical byline</h4>
            <Row label="Author" value="Lutar, Stephen P." />
            <Row label="ORCID" value="0009-0001-0110-4173" />
            <Row label="Org" value="SZL Holdings" />
            <Row label="Repository" value="szl-holdings/terra" />
            <Row label="Default branch" value="main" />
            <Row label="Visibility" value="Public · PUBLIC_ONLY" />
            <Row label="License" value="See LICENSE + NOTICE" />
            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: DS.textDim,
                lineHeight: 1.55,
                fontFamily: DS.sans,
              }}
            >
              Underwriting recommendations on this surface inherit the same
              attribution chain as every other Doctrine V6 artifact.
            </p>
          </div>

          {/* SLO / Status */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>SLO &amp; Status</p>
            <h4 style={cardTitle}>Org posture · 16 repos</h4>
            <div style={{ marginBottom: 14 }}>
              <StatusChipGroup>
                <StatusChip status="healthy" label="CI 0 failing" pulsing />
                <StatusChip status="approved" label="BP-strict 10/16" />
                <StatusChip status="enforced" label="Λ floor 0.90" />
                <StatusChip status="healthy" label="Dependabot 0 high" />
                <StatusChip status="approved" label="PUBLIC_ONLY" />
              </StatusChipGroup>
            </div>
            <Row label="Repos" value="16" />
            <Row label="CI failing" value="0" />
            <Row label="Scorecard avg" value="6.62 / 10" />
            <Row label="BP-strict" value="10 / 16" />
            <Row label="Dependabot high/crit" value="0 / 0" />
            <Row label="Replays required" value="5 byte-identical" />
            <Row label="Λ axes" value="9 conjunctive ∧" />
          </div>
        </div>
      </div>
    </section>
  );
}
