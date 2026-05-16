import { PANEL_FACTS, panelRepoFacts } from '@szl-holdings/payload';

const PALETTE = {
  bg: '#0a0a0a',
  card: '#0e0e0e',
  cardAlt: '#1a1814',
  gold: '#c9b787',
  body: '#ededed',
  bodyStrong: '#f5f5f5',
  muted: '#888',
  mutedDeep: '#555',
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

function Chip({ tone = 'gold', label }: { tone?: ChipTone; label: string }) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: t.fg,
        border: `1px solid ${t.border}`,
        background: t.bg,
        borderRadius: 2,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: t.fg }} />
      {label}
    </span>
  );
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
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
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
            margin: '6px 0 0',
            fontSize: 15,
            fontWeight: 500,
            color: PALETTE.bodyStrong,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        paddingBottom: 8,
        borderBottom: `1px solid ${PALETTE.rule}`,
      }}
    >
      <span style={{ fontSize: 11, color: PALETTE.muted, letterSpacing: '0.02em' }}>{label}</span>
      <span
        style={{
          fontSize: mono ? 11 : 12,
          color: PALETTE.body,
          fontFamily: mono ? MONO : 'inherit',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function CounselGovernancePanels() {
  const repo = panelRepoFacts('counsel');
  return (
    <section
      style={{
        padding: '80px 24px',
        borderTop: `1px solid ${PALETTE.rule}`,
        background: PALETTE.bg,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
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
              margin: '8px 0 6px',
              fontSize: 26,
              fontWeight: 500,
              color: PALETTE.bodyStrong,
              letterSpacing: '-0.012em',
            }}
          >
            Every drafted clause carries its proof chain
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: PALETTE.muted, maxWidth: 640 }}>
            Counsel inherits the SZL Holdings replay-anchored audit chain. The governance
            facts below are pulled directly from the public org inventory for this artifact
            and the shared Doctrine V6 floor.
          </p>
        </div>

        <div style={{ marginBottom: 22, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Chip tone="gold" label="Λ floor 0.90 · 9-axis AND" />
          <Chip tone="ok" label="CI 0 failing · 16 repos" />
          <Chip tone="ok" label="Dependabot 0 high/critical" />
          <Chip tone="gold" label="Scorecard 6.62 · BP 10/16" />
          <Chip tone="muted" label="Ingest PUBLIC_ONLY" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <PanelCard kicker="01 · Provenance" title="Replay-anchored, conjunctive Λ">
            <Row label="Replay root" value={PANEL_FACTS.replayRootShort} mono />
            <Row label="Byte-identical replays" value={PANEL_FACTS.byteIdenticalReplaysRequiredText} />
            <Row label="Λ floor (conjunctive AND)" value={PANEL_FACTS.lambdaFloorConjAndText} />
            <Row label="Moral grounding floor" value={PANEL_FACTS.moralGroundingFloorText} />
            <Row label="Measurability honesty" value={PANEL_FACTS.measurabilityHonestyText} />
            <Row label="Latest commit" value={repo.commitShort} mono />
            <Row label="License allowlist" value={PANEL_FACTS.licenseAllowlistShortText} />
            <Row label="Ingestion policy" value={PANEL_FACTS.ingestionPolicyText} />
          </PanelCard>

          <PanelCard kicker="02 · Evidence ledger" title="Citable artifacts, public lineage">
            <Row label="Repository" value={repo.fullName} mono />
            <Row label="Latest tag" value={repo.latestTag} />
            <Row label="Tag SHA" value={repo.tagShaShort} mono />
            <Row label="Pushed at (UTC)" value={repo.pushedAtUtcText} />
            <Row label="Hygiene files" value="LICENSE · NOTICE · CITATION.cff · SECURITY.md" />
            <Row label="Doctrine ledger" value={PANEL_FACTS.doiLedgerEvidenceText} />
            <Row label="Zenodo deposit" value={PANEL_FACTS.zenodoText} />
            <Row label="arXiv submission" value={PANEL_FACTS.arxivShaShortQueuedText} />
          </PanelCard>

          <PanelCard kicker="03 · Ownership" title="Canonical SZL Holdings byline">
            <Row label="Author" value={PANEL_FACTS.authorText} />
            <Row label="ORCID" value={PANEL_FACTS.orcidText} mono />
            <Row label="Affiliation" value={PANEL_FACTS.affiliationText} />
            <Row label="GitHub org" value={PANEL_FACTS.githubOrgText} mono />
            <Row label="Repository full name" value={repo.fullName} mono />
            <Row label="Default branch" value={repo.defaultBranch} />
            <Row label="Doctrine version" value={PANEL_FACTS.doctrineVersionText} />
            <Row label="Byline scope" value="Legal matter command" />
          </PanelCard>

          <PanelCard kicker="04 · SLO / status" title="Org posture, live counters">
            <Row label="Repos in org" value={PANEL_FACTS.reposCountText} />
            <Row label="CI failing" value={PANEL_FACTS.ciFailingText} />
            <Row label="Open dependabot (high/critical)" value={PANEL_FACTS.dependabotHighCritText} />
            <Row label="Open code-scanning alerts" value={PANEL_FACTS.codeScanningOrgWideText} />
            <Row label="Scorecard average" value={PANEL_FACTS.scorecardAvgText} />
            <Row label="Branch protection — strict" value={PANEL_FACTS.branchProtectionStrictText} />
            <Row label="Push queue — ready" value={PANEL_FACTS.pushQueueReadyText} />
            <Row label="One-way doors" value={PANEL_FACTS.oneWayDoorsText} />
          </PanelCard>
        </div>
      </div>
    </section>
  );
}
