import type { CSSProperties } from 'react';
import { StatusChip, StatusChipGroup } from '@szl-holdings/omnia-shell';
import { THESIS_LINEAGE, THESIS_PAPERS } from '@szl-holdings/payload';

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

import {
  ARXIV_SHA_SHORT,
  DOCTRINE,
  PANEL_FACTS,
  V7_PANEL_FACTS,
  getRepoFacts,
} from '@szl-holdings/payload';

const REPLAY_ROOT_FULL = DOCTRINE.replayRoot;
const SZL_BRAND_SHA = getRepoFacts('szl-brand').latestCommitSha;
const LUTAR_LEAN_SHA = getRepoFacts('lutar-lean').latestCommitSha;

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

type AuditLink = { label: string; href: string; title?: string };

function AuditLinks({ links }: { links: ReadonlyArray<AuditLink> }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, marginLeft: 8, flexWrap: 'wrap' }}>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          title={l.title ?? l.label}
          style={{
            fontFamily: C.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.gold,
            border: `1px solid rgba(0,0,0,0.15)`,
            background: 'rgba(0,0,0,0.03)',
            padding: '1px 6px',
            borderRadius: 2,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          ↗ {l.label}
        </a>
      ))}
    </span>
  );
}

function Row({
  label,
  value,
  links,
}: {
  label: string;
  value: React.ReactNode;
  links?: ReadonlyArray<AuditLink>;
}) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>
        {value}
        {links && links.length > 0 ? <AuditLinks links={links} /> : null}
      </span>
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
            <Row label="DOI ledger" value={PANEL_FACTS.doiMintedText} />
            <Row label="Push queue" value={`Zenodo ${PANEL_FACTS.zenodoText.split(' ')[0]} · arXiv ${ARXIV_SHA_SHORT}`} />
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
            <Row label="Author" value={PANEL_FACTS.authorText} />
            <Row label="ORCID" value={PANEL_FACTS.orcidText} />
            <Row label="Org" value={PANEL_FACTS.affiliationText} />
            <Row label="Engagement" value="Carlota Jo · consulting front" />
            <Row label="Anchor repo" value="szl-holdings/szl-brand" />
            <Row label="Visibility" value={`Public · ${PANEL_FACTS.ingestionPolicyText}`} />
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
            <Row
              label="Latest audit"
              value={V7_PANEL_FACTS.latestAuditText}
              links={[
                {
                  label: 'PR triage',
                  href: V7_PANEL_FACTS.prTriageDocHref,
                  title: V7_PANEL_FACTS.prTriageDocTitle,
                },
                {
                  label: 'PM decisions',
                  href: V7_PANEL_FACTS.pmDecisionsDocHref,
                  title: V7_PANEL_FACTS.pmDecisionsDocTitle,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
