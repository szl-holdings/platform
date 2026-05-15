import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';

const T = {
  bg: '#0a0a0a',
  surface: '#121212',
  border: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.08)',
  text: '#ededed',
  textDim: '#888888',
  textMuted: '#666666',
  accent: '#c9b787',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

const REPLAY_ROOT_PREFIX = '1ed4d253';
const REPLAY_ROOT_FULL = '1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b';
const A11OY_COMMIT_SHA = '3d0f98412ee6738102634b47f7d8618a6e4cd2b5';
const A11OY_TAG_SHA = '284ab434eb52424b83499567f8cb8e0d780864d3';
const A11OY_TAG = 'v1.0.0-alpha';
const A11OY_PUSHED_AT = '2026-05-15T20:48:09Z';
const ARXIV_SHA_PREFIX = '13ca4a06';

const sectionStyle: CSSProperties = {
  padding: '80px clamp(2rem, 5vw, 4rem)',
  background: T.bg,
  borderTop: `1px solid ${T.border}`,
};

const cardStyle: CSSProperties = {
  background: '#0e0e0e',
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  padding: 24,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: T.mono,
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: T.accent,
  textTransform: 'uppercase',
  marginBottom: 12,
};

const cardTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: T.text,
  letterSpacing: '-0.005em',
  marginBottom: 14,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  padding: '8px 0',
  borderBottom: `1px solid ${T.border}`,
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  color: T.textDim,
  fontFamily: T.mono,
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const valueStyle: CSSProperties = {
  color: T.text,
  fontFamily: T.mono,
  fontSize: 11,
  textAlign: 'right',
  wordBreak: 'break-all',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

export function A11oyGovernancePanels() {
  return (
    <section style={sectionStyle}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 11,
              fontFamily: T.mono,
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: T.accent,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Governance posture · payload-grounded
          </p>
          <h3
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: T.text,
              letterSpacing: '-0.01em',
              fontFamily: T.sans,
              maxWidth: 760,
              lineHeight: 1.2,
            }}
          >
            Every governed action carries proof — and every claim on this page
            traces back to the canonical SZL Holdings payload.
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
            <Row label="HEAD" value={`${A11OY_COMMIT_SHA.slice(0, 12)}…`} />
            <p
              style={{
                marginTop: 14,
                fontSize: 10,
                color: T.textMuted,
                fontFamily: T.mono,
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
            <Row label="Tag" value={A11OY_TAG} />
            <Row label="Tag SHA" value={`${A11OY_TAG_SHA.slice(0, 12)}…`} />
            <Row label="Pushed" value={A11OY_PUSHED_AT.slice(0, 10)} />
            <Row label="Package" value="@szl-holdings/a11oy-knowledge" />
            <Row label="Version" value="0.3.0 (v0.4.0 in workspace)" />
            <Row label="Axioms" value="A1–A14 (14)" />
            <Row label="Theorems" value="TH1–TH3" />
            <Row label="Derivations" value="T1–T10" />
            <Row label="Constants" value="K01–K13" />
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
            <Row label="Repository" value="szl-holdings/a11oy" />
            <Row label="Default branch" value="main" />
            <Row label="Visibility" value="Public · PUBLIC_ONLY" />
            <Row label="License" value="Apache-2.0 + NOTICE" />
            <Row label="Citation" value="CITATION.cff" />
            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: T.textDim,
                lineHeight: 1.55,
                fontFamily: T.sans,
              }}
            >
              Doctrine V6 binds every shipped artifact to the same author,
              ledger, and replay root — there is no shadow attribution.
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
