import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';
import {
  DOCTRINE,
  PANEL_FACTS,
  V7_PANEL_FACTS,
  panelRepoFacts,
  ARXIV_SHA_SHORT,
  THESIS_LINEAGE,
  THESIS_PAPERS,
} from '@szl-holdings/payload';

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

const REPLAY_ROOT_FULL = DOCTRINE.replayRoot;

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
  const repo = panelRepoFacts('a11oy');
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
            <Row label="Replay root" value={PANEL_FACTS.replayRootShort} />
            <Row label="Byte-identical replays" value={PANEL_FACTS.byteIdenticalReplaysOfText} />
            <Row label="Λ floor" value={PANEL_FACTS.lambdaFloorParenText} />
            <Row label="moralGrounding" value={PANEL_FACTS.moralGroundingGteText} />
            <Row label="measurabilityHonesty" value={PANEL_FACTS.measurabilityHonestyGteText} />
            <Row label="Ingestion" value={PANEL_FACTS.ingestionPolicyText} />
            <Row
              label="License allowlist"
              value={PANEL_FACTS.licenseAllowlistShortText}
            />
            <Row label="HEAD" value={repo.commitShort} />
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
            <Row label="Tag" value={repo.latestTag} />
            <Row label="Tag SHA" value={repo.tagShaShort} />
            <Row label="Pushed" value={repo.pushedAtUtcText.slice(0, 10)} />
            <Row label="Package" value="@szl-holdings/a11oy-knowledge" />
            <Row label="Version" value="0.3.0 (v0.4.0 in workspace)" />
            <Row label="Axioms" value="A1–A14 (14)" />
            <Row label="Theorems" value="TH1–TH3" />
            <Row label="Derivations" value="T1–T10" />
            <Row label="Constants" value="K01–K13" />
            <Row label="DOI ledger" value={PANEL_FACTS.doiMintedText} />
            <Row label="Push queue" value={`Zenodo ${PANEL_FACTS.zenodoText.split(' ')[0]} · arXiv ${ARXIV_SHA_SHORT}`} />
          </div>

          {/* Ownership */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Ownership</p>
            <h4 style={cardTitle}>Canonical byline</h4>
            <Row label="Author" value={PANEL_FACTS.authorText} />
            <Row label="ORCID" value={PANEL_FACTS.orcidText} />
            <Row label="Org" value={PANEL_FACTS.affiliationText} />
            <Row label="Repository" value={repo.fullName} />
            <Row label="Default branch" value={repo.defaultBranch} />
            <Row label="Visibility" value={`Public · ${PANEL_FACTS.ingestionPolicyText}`} />
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
            <Row label="Repos" value={PANEL_FACTS.reposCountText} />
            <Row label="CI failing" value={PANEL_FACTS.ciFailingText} />
            <Row label="Scorecard avg" value={PANEL_FACTS.scorecardAvgText} />
            <Row label="BP-strict" value={PANEL_FACTS.branchProtectionStrictText} />
            <Row label="Dependabot high/crit" value={PANEL_FACTS.dependabotHighCritPairText} />
            <Row label="Replays required" value={PANEL_FACTS.byteIdenticalReplaysShort} />
            <Row label="Λ axes" value={PANEL_FACTS.lambdaAxesShortText} />
          </div>

          {/* Thesis lineage TH1→TH8 */}
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Thesis lineage</p>
            <h4 style={cardTitle}>TH1 → TH8 chain</h4>
            <div style={{ marginBottom: 12 }}>
              <StatusChipGroup>
                {THESIS_PAPERS.map((p) => (
                  <StatusChip
                    key={p.key}
                    status={p.status.includes('published') ? 'approved' : 'enforced'}
                    label={`${p.key} ${p.version}`}
                  />
                ))}
                <StatusChip
                  status={THESIS_LINEAGE.audit.leanSorriesOpen === 0 ? 'healthy' : 'enforced'}
                  label={`TH8 sorries ${THESIS_LINEAGE.audit.leanSorriesOpen}/${THESIS_LINEAGE.audit.leanTheorems}`}
                />
              </StatusChipGroup>
            </div>
            {THESIS_PAPERS.map((p) => (
              <Row key={p.key} label={`${p.key} · ${p.version}`} value={p.status} />
            ))}
            <Row label="Closed in mirror" value={`${THESIS_LINEAGE.audit.leanSorriesClosed.length}`} />
            <Row label="arXiv target" value={`${THESIS_LINEAGE.arxiv.status} → ${THESIS_LINEAGE.arxiv.targetVenue}`} />
            <Row label="Zenodo target" value={`${THESIS_LINEAGE.zenodo.status} (${THESIS_LINEAGE.zenodo.targetVersion})`} />
            <Row label="Fly-High audit" value={`doctrine ${THESIS_LINEAGE.audit.doctrine} · P0 ${THESIS_LINEAGE.audit.p0Fixes} · beautify ${THESIS_LINEAGE.audit.beautifyAvg}`} />
            <Row label="Lineage updated" value={THESIS_LINEAGE.audit.updatedAt} />
            <Row label="Lineage source" value="@szl-holdings/payload" />
            <Row label="Latest audit" value={V7_PANEL_FACTS.latestAuditText} />
          </div>
        </div>
      </div>
    </section>
  );
}
