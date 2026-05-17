import {
  ORG_SUMMARY,
  PANEL_FACTS,
  V7_PANEL_FACTS,
  panelRepoFacts,
  THESIS_LINEAGE,
  THESIS_PAPERS,
} from '@szl-holdings/payload';

const PALETTE = {
  card: '#0e0e0e',
  cardAlt: '#1a1814',
  gold: '#c9b787',
  body: '#ededed',
  bodyStrong: '#f5f5f5',
  muted: '#888',
  rule: 'rgba(255,255,255,0.04)',
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type ChipTone = 'gold' | 'ok' | 'warn' | 'muted';
const TONE: Record<ChipTone, { fg: string; border: string; bg: string }> = {
  gold: { fg: PALETTE.gold, border: 'rgba(201,183,135,0.30)', bg: 'rgba(201,183,135,0.06)' },
  ok: { fg: '#7fb893', border: 'rgba(127,184,147,0.28)', bg: 'rgba(127,184,147,0.05)' },
  warn: { fg: '#d4a853', border: 'rgba(212,168,83,0.28)', bg: 'rgba(212,168,83,0.05)' },
  muted: { fg: PALETTE.muted, border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.02)' },
};

function Chip({
  tone = 'gold',
  label,
  href,
  title,
}: {
  tone?: ChipTone;
  label: string;
  href?: string;
  title?: string;
}) {
  const t = TONE[tone];
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 8px',
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: t.fg,
    border: `1px solid ${t.border}`,
    background: t.bg,
    borderRadius: 2,
    textDecoration: 'none' as const,
    cursor: href ? ('pointer' as const) : ('default' as const),
  };
  const inner = (
    <>
      <span style={{ width: 4, height: 4, borderRadius: 999, background: t.fg }} />
      {label}
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title ?? label} style={style}>
        {inner}
      </a>
    );
  }
  return <span style={style}>{inner}</span>;
}

function PanelCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.rule}`,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.24em',
            color: PALETTE.gold,
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </p>
        <h4
          style={{
            margin: '4px 0 0',
            fontSize: 14,
            fontWeight: 500,
            color: PALETTE.bodyStrong,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

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
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: PALETTE.gold,
            border: `1px solid rgba(201,183,135,0.30)`,
            background: 'rgba(201,183,135,0.06)',
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
  mono,
  links,
}: {
  label: string;
  value: string;
  mono?: boolean;
  links?: ReadonlyArray<AuditLink>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 10,
        paddingBottom: 6,
        borderBottom: `1px solid ${PALETTE.rule}`,
      }}
    >
      <span style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: '0.02em' }}>{label}</span>
      <span
        style={{
          fontSize: mono ? 10 : 11,
          color: PALETTE.body,
          fontFamily: mono ? MONO : 'inherit',
          textAlign: 'right',
        }}
      >
        {value}
        {links && links.length > 0 ? <AuditLinks links={links} /> : null}
      </span>
    </div>
  );
}

export function ConduitGovernancePanels() {
  const amaru = panelRepoFacts('amaru');
  return (
    <section
      className="mt-6"
      style={{
        padding: 22,
        background: '#0a0a0a',
        border: `1px solid ${PALETTE.rule}`,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.25em',
            color: PALETTE.gold,
            textTransform: 'uppercase',
          }}
        >
          Governance posture · Doctrine V6
        </p>
        <h3
          style={{
            margin: '6px 0 4px',
            fontSize: 18,
            fontWeight: 500,
            color: PALETTE.bodyStrong,
          }}
        >
          Every relay recommendation is replay-anchored
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: PALETTE.muted, maxWidth: 620 }}>
          Amaru (artifact: {amaru.fullName}) inherits the SZL Holdings audit chain.
          The figures below are pulled from the public org inventory and the shared
          Doctrine V6 floor — not from product copy.
        </p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip
          tone="gold"
          label={V7_PANEL_FACTS.latestAuditLabel}
          href={V7_PANEL_FACTS.prTriageDocHref}
          title={V7_PANEL_FACTS.prTriageDocTitle}
        />
        <Chip tone="gold" label={`Λ floor ${PANEL_FACTS.lambdaFloorAndText}`} />
        <Chip tone="ok" label={`CI ${PANEL_FACTS.ciFailingText} failing`} />
        <Chip tone="ok" label={`Dependabot ${PANEL_FACTS.dependabotHighCritText} H/C`} />
        <Chip tone="gold" label={`Scorecard ${ORG_SUMMARY.scorecardAvg.toFixed(2)}`} />
        <Chip tone="muted" label={PANEL_FACTS.ingestionPolicyText} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        <PanelCard kicker="01 · Provenance" title="Replay-anchored, conjunctive Λ">
          <Row label="Replay root" value={PANEL_FACTS.replayRootShort} mono />
          <Row label="Byte-identical replays" value={PANEL_FACTS.byteIdenticalReplaysRequiredText} />
          <Row label="Λ floor" value={PANEL_FACTS.lambdaFloorAndText} />
          <Row label="Moral grounding" value={PANEL_FACTS.moralGroundingFloorText} />
          <Row label="Latest commit" value={amaru.commitShort} mono />
          <Row label="Licenses" value={PANEL_FACTS.licenseAllowlistShortText} />
          <Row label="Ingestion" value={PANEL_FACTS.ingestionPolicyText} />
        </PanelCard>

        <PanelCard kicker="02 · Evidence ledger" title="Citable artifacts, public lineage">
          <Row label="Repository" value={amaru.fullName} mono />
          <Row label="Latest tag" value={amaru.latestTag ?? '—'} />
          <Row label="Tag SHA" value={amaru.tagShaShort ?? '—'} mono />
          <Row label="Pushed at (UTC)" value={amaru.pushedAtUtcText} />
          <Row label="Hygiene" value="LICENSE · CITATION.cff · SECURITY.md" />
          <Row label="Doctrine ledger" value={PANEL_FACTS.doiLedgerEvidenceText} />
          <Row label="Zenodo deposit" value={PANEL_FACTS.zenodoText} />
          <Row label="arXiv submission" value={PANEL_FACTS.arxivShaShortText} />
        </PanelCard>

        <PanelCard kicker="03 · Ownership" title="Canonical SZL Holdings byline">
          <Row label="Author" value={PANEL_FACTS.authorText} />
          <Row label="ORCID" value={PANEL_FACTS.orcidText} mono />
          <Row label="Affiliation" value={PANEL_FACTS.affiliationText} />
          <Row label="GitHub org" value={PANEL_FACTS.githubOrgText} mono />
          <Row label="Repository" value={amaru.fullName} mono />
          <Row label="Default branch" value={amaru.defaultBranch} />
          <Row label="Doctrine version" value={PANEL_FACTS.doctrineVersionText} />
          <Row label="Byline scope" value="Convergent multi-source data sync" />
        </PanelCard>

        <PanelCard kicker="05 · Thesis lineage" title="TH1 → TH8 chain">
          {THESIS_PAPERS.map((p) => (
            <Row key={p.key} label={`${p.key} · ${p.version}`} value={p.status} />
          ))}
          <Row label="TH8 sorries open" value={`${THESIS_LINEAGE.audit.leanSorriesOpen} of ${THESIS_LINEAGE.audit.leanTheorems}`} />
          <Row label="Closed in mirror" value={`${THESIS_LINEAGE.audit.leanSorriesClosed.length}`} />
          <Row label="arXiv target" value={`${THESIS_LINEAGE.arxiv.status} → ${THESIS_LINEAGE.arxiv.targetVenue}`} />
          <Row label="Zenodo target" value={`${THESIS_LINEAGE.zenodo.status} (${THESIS_LINEAGE.zenodo.targetVersion})`} />
          <Row label="Fly-High audit" value={`doctrine ${THESIS_LINEAGE.audit.doctrine} · P0 ${THESIS_LINEAGE.audit.p0Fixes} · beautify ${THESIS_LINEAGE.audit.beautifyAvg}`} />
          <Row label="Lineage updated" value={THESIS_LINEAGE.audit.updatedAt} mono />
          <Row label="Lineage source" value="@szl-holdings/payload" mono />
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
        </PanelCard>

        <PanelCard kicker="04 · SLO / status" title="Org posture, live counters">
          <Row label="Repos in org" value={PANEL_FACTS.reposCountText} />
          <Row label="CI failing" value={PANEL_FACTS.ciFailingText} />
          <Row label="Open dependabot (H/C)" value={PANEL_FACTS.dependabotHighCritText} />
          <Row label="Code-scanning alerts" value={PANEL_FACTS.codeScanningOrgWideText} />
          <Row label="Scorecard average" value={PANEL_FACTS.scorecardAvgText} />
          <Row label="Branch protection — strict" value={PANEL_FACTS.branchProtectionStrictText} />
          <Row label="Push queue — ready" value={PANEL_FACTS.pushQueueReadyText} />
          <Row label="One-way doors" value={PANEL_FACTS.oneWayDoorsText} />
        </PanelCard>
      </div>
    </section>
  );
}
