// @ts-nocheck
import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';
import { THESIS_LINEAGE, THESIS_PAPERS } from '@szl-holdings/payload';

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

import {
  DOCTRINE,
  PANEL_FACTS,
  panelRepoFacts,
  ARXIV_SHA_SHORT,
} from '@szl-holdings/payload';

const REPLAY_ROOT_FULL = DOCTRINE.replayRoot;

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
  const repo = panelRepoFacts('terra');
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
            <Row label="Tag" value={repo.latestTag} />
            <Row label="Tag SHA" value={repo.tagShaShort} />
            <Row label="Pushed" value={repo.pushedAtUtcText.slice(0, 10)} />
            <Row label="Repository" value={repo.fullName} />
            <Row label="Latest commit" value={repo.commitShort} />
            <Row label="Citation" value="CITATION.cff" />
            <Row label="Notice" value="NOTICE + LICENSE" />
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
          </div>
        </div>
      </div>
    </section>
  );
}
