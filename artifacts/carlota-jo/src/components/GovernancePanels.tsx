import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';

const C = {
  bg: 'var(--color-cream-warm, #f5efe5)',
  surface: 'var(--color-cream-light, #faf6ee)',
  border: 'var(--color-stone-200, rgba(0,0,0,0.08))',
  borderMuted: 'var(--color-stone-100, rgba(0,0,0,0.05))',
  ink: 'var(--color-ink-900, #1a1a1a)',
  inkBody: 'var(--color-ink-600, #4a4a4a)',
  inkMuted: 'var(--color-stone-500, #8a8378)',
  gold: 'var(--color-gold, #b89858)',
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
};

const REPLAY_ROOT_PREFIX = '1ed4d253';
const REPLAY_ROOT_FULL = '1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b';
const SZL_BRAND_SHA = 'd86a37d5305a30886f7884cc4114cda48a8a3402';
const LUTAR_LEAN_SHA = 'fcae1aed26a3d8b7fec8aa3dcbd4f334220efa09';
const ARXIV_SHA_PREFIX = '13ca4a06';

const sectionStyle: CSSProperties = {
  padding: '80px 24px',
  background: C.bg,
  borderTop: `1px solid ${C.border}`,
};

const cardStyle: CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: 24,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: C.mono,
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: C.gold,
  textTransform: 'uppercase',
  marginBottom: 12,
};

const cardTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.ink,
  letterSpacing: '-0.005em',
  marginBottom: 14,
  fontFamily: C.sans,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  padding: '8px 0',
  borderBottom: `1px solid ${C.borderMuted}`,
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  color: C.inkMuted,
  fontFamily: C.mono,
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const valueStyle: CSSProperties = {
  color: C.ink,
  fontFamily: C.mono,
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

export function CarlotaJoGovernancePanels() {
  return (
    <section style={sectionStyle}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 11,
              fontFamily: C.mono,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: C.gold,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            SZL Holdings governance · consulting engagement
          </p>
          <h3
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: C.ink,
              letterSpacing: '-0.01em',
              fontFamily: C.serif,
              maxWidth: 760,
              lineHeight: 1.25,
            }}
          >
            Advisory work delivered against the same provenance contract that
            governs every SZL Holdings artifact.
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
            <p
              style={{
                marginTop: 14,
                fontSize: 10,
                color: C.inkMuted,
                fontFamily: C.mono,
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
            <Row label="Engagement form" value="Consulting front" />
            <Row label="Brand source" value="szl-holdings/szl-brand" />
            <Row label="Brand HEAD" value={`${SZL_BRAND_SHA.slice(0, 12)}…`} />
            <Row label="Theory source" value="szl-holdings/lutar-lean" />
            <Row label="Lean HEAD" value={`${LUTAR_LEAN_SHA.slice(0, 12)}…`} />
            <Row label="Lean toolchain" value="leanprover/lean4 v4.13.0" />
            <Row label="DOI ledger" value="13 minted" />
            <Row label="Push queue" value={`Zenodo v14 · arXiv ${ARXIV_SHA_PREFIX}…`} />
            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: C.inkBody,
                lineHeight: 1.55,
                fontFamily: C.sans,
              }}
            >
              No dedicated repository — every advisory deliverable is anchored
              to the SZL Holdings brand registry and the machine-checked
              Lutar Invariant proofs.
            </p>
          </div>

          {/* Ownership */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Ownership</p>
            <h4 style={cardTitle}>Canonical byline</h4>
            <Row label="Author" value="Lutar, Stephen P." />
            <Row label="ORCID" value="0009-0001-0110-4173" />
            <Row label="Org" value="SZL Holdings" />
            <Row label="Engagement" value="Carlota Jo · consulting front" />
            <Row label="Anchor repo" value="szl-holdings/szl-brand" />
            <Row label="Visibility" value="Public · PUBLIC_ONLY" />
            <Row label="License" value="Apache-2.0 / CC-BY-4.0" />
            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: C.inkBody,
                lineHeight: 1.55,
                fontFamily: C.sans,
              }}
            >
              Doctrine V6 binds advisory output to the same author, ORCID,
              and ledger as every other shipped artifact.
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
                <StatusChip status="advisory" label="Consulting front" />
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
