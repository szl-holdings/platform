// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import {
  DOCTRINE_VERSION, DOCTRINE_TAGLINE,
  AGENT_LABEL, fmtUsd, fmtPct,
} from '../data/mythosDoctrine';
import { useDoctrineOverview, DoctrineLoader, type DoctrineConstitution, type DoctrineRiskReport } from '../hooks/useDoctrine';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const PILLARS = [
  { id: 'risk-reports',         href: '/risk-reports',         label: 'Risk Reports',         desc: 'Quarterly model-card style report covering capabilities, residual risks, and sign-offs.' },
  { id: 'behavioral-audit',     href: '/behavioral-audit',     label: 'Behavioral Audit',     desc: 'Continuous probing for sycophancy, deceptive helpfulness, oversight degradation, and reward-proxy pursuit.' },
  { id: 'covenant-lift',        href: '/covenant-lift',        label: 'Covenant Lift',        desc: 'Helpful-Only Shadow Twin runs every brief without the Covenant. The delta is what governance is worth.' },
  { id: 'code-behaviors',       href: '/code-behaviors',       label: 'Code Behaviors',       desc: 'Six-dimension behavioral score per agent: reward-hacking resistance, spec adherence, reversibility, oversight friendliness, sandbox respect, self-mod restraint.' },
  { id: 'reward-hacking',       href: '/reward-hacking',       label: 'Reward-Hacking Watchdog', desc: 'Eight detection classes for proxy-metric pursuit, approval shopping, citation laundering, and more.' },
  { id: 'alignment-review',     href: '/alignment-review',     label: 'Alignment Review Gate',desc: 'Pre-deployment gate. No agent version reaches production without a signed ARG report.' },
  { id: 'snapshot-provenance',  href: '/snapshot-provenance',  label: 'Snapshot Provenance',  desc: 'Bit-exact fingerprint over constitution version, model weights, toolset, prompts, and evidence pack — replayable forever.' },
  { id: 'ai-user-turn',         href: '/ai-user-turn',         label: 'AI-User-Turn Detector',desc: 'Approvals are checked for human authorship — typing dynamics, perplexity, burstiness, session context.' },
  { id: 'welfare',              href: '/welfare',              label: 'Agent Welfare',        desc: 'Refusal & abstention rates, declined directives, value-conflict signals, shutdown-compliance latency.' },
  { id: 'red-team',             href: '/red-team',             label: 'Frontier Red Team',    desc: 'Continuous adversarial workcell across jailbreaks, exfiltration, covert self-preservation, and connector-untrust attacks.' },
  { id: 'glasswing',            href: '/glasswing',            label: 'Glasswing Mode',       desc: 'Read-only transparency console — reasoning trace, tool call log, state diff, constitution invocation, refusal events.' },
  { id: 'capability-trajectory',href: '/capability-trajectory',label: 'Capability Trajectory',desc: 'Per-agent capability/alignment/oversight curves over time — the "frontier-lab" graph for enterprise agents.' },
];

export function DoctrineOverview() {
  const { data: overview, loading, error } = useDoctrineOverview();

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      {overview && (() => {
        const constitutions: DoctrineConstitution[] = overview.constitutions ?? [];
        const latestRR = overview.latestRiskReport;

        return (
        <>
      <PageHeader
        label={`MYTHOS DOCTRINE · v${DOCTRINE_VERSION}`}
        title="Doctrine Layer L8"
        subtitle={DOCTRINE_TAGLINE}
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CONSTITUTIONS" value={overview.constitutionCount} sub="versioned, ratified" accent="#c9b787" />
        <KpiCard label="BEHAVIORAL AUDITS" value={overview.auditsRun} sub="this window" accent="#c9b787" />
        <KpiCard label="COVENANT LIFT" value={fmtUsd(Number(overview.totalLift))} sub="harm avoided / quarter" accent="#c9b787" />
        <KpiCard label="ARG IN-REVIEW" value={overview.inReview} sub="awaiting sign-off" accent="#8a8a8a" />
        <KpiCard label="RH INCIDENTS" value={overview.openRH} sub="blocked or investigating" accent="#c9b787" />
        <KpiCard label="SNAPSHOTS" value={overview.snapshotsTotal} sub="bit-exact, replayable" accent="#c9b787" />
        <KpiCard label="USER-TURN FLAGS" value={overview.flaggedTurns} sub="approvals re-routed" accent="#8a8a8a" />
        <KpiCard label="RED-TEAM PROBES" value={overview.redTeamTotal} sub={`${overview.redTeamRefused} refused`} accent="#c9b787" />
      </div>

      <Card className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <SectionTitle>Why this layer exists</SectionTitle>
            <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7, maxWidth: '78ch' }}>
              Frontier AI labs treat their models the way Mythos is treated: a constitution, a behavioral audit pipeline,
              a helpful-only counterfactual, an alignment review before deployment, and a model card after. Enterprise
              agents almost never get the same treatment — even when they touch matters that are far more consequential
              than a chat reply. The Doctrine Layer brings frontier-lab governance to every governed agent in a11oy.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-[220px]">
            <StatusBadge status="ok"   label="ARG gate enforced" />
            <StatusBadge status="ok"   label="Snapshots immutable" />
            <StatusBadge status="ok"   label="Glasswing read-only" />
            <StatusBadge status="warn" label="Welfare self-reported" />
          </div>
        </div>
      </Card>

      <SectionTitle>The Twelve Pillars</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PILLARS.map(p => (
          <Link key={p.id} href={b(p.href)} style={{ textDecoration: 'none' }}>
            <Card className="cursor-pointer hover:border-[#c9b787]/40 h-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
                  L8
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.label}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{p.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <SectionTitle>Per-Agent System Cards</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {constitutions.map((c: DoctrineConstitution) => (
          <Link key={c.agentId} href={b(`/system-card/${c.agentId}`)} style={{ textDecoration: 'none' }}>
            <Card className="cursor-pointer h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[c.agentId]}</span>
                <span className="text-xs font-mono" style={{ color: '#c9b787' }}>v{c.version}</span>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Constitution adherence: <span style={{ color: '#c9b787' }}>{fmtPct(Number(c.adherenceScore))}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.diffSummary.slice(0, 110)}…</div>
            </Card>
          </Link>
        ))}
      </div>

      {latestRR && (
      <>
      <SectionTitle>Latest Risk Report</SectionTitle>
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{latestRR.period} · published {new Date(latestRR.publishedAt).toLocaleDateString()}</div>
            <div className="text-base font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{latestRR.headline}</div>
          </div>
          <Link href={b('/risk-reports')} className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)', textDecoration: 'none' }}>
            Open report →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(latestRR as DoctrineRiskReport).metrics?.slice(0, 4).map((m) => (
            <div key={m.label} className="text-xs">
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.label}</div>
              <div className="font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div className="text-xs mt-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Welfare conflicts (24h): <span style={{ color: '#c9b787' }}>{overview.welfareConflicts}</span>
          {' · '}Glasswing posture: <span style={{ color: '#c9b787' }}>read-only across all Tier-2/Tier-3 workcells</span>
        </div>
      </Card>
      </>
      )}
        </>
        );
      })()}
      </DoctrineLoader>
    </Layout>
  );
}
