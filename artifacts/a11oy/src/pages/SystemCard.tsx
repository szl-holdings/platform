import { useRoute, Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, StatusBadge, InfoRow } from '../components/ui';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  CODE_BEHAVIOR_DIMS, CODE_BEHAVIOR_LABELS,
  AGENT_LABEL, DOCTRINE_AGENT_IDS, fmtUsd, fmtPct,
} from '../data/mythosDoctrine';
import type { DoctrineAgentId } from '../data/mythosDoctrine';
import { useSystemCard, DoctrineLoader, type DoctrineBehavioralAudit, type DoctrineRewardHackingIncident, type DoctrineAlignmentReview, type DoctrineRedTeamProbe, type DoctrineCapabilitySnapshot } from '../hooks/useDoctrine';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const GOLD = '#c9b787';

export function SystemCard() {
  const [, params] = useRoute(`${BASE}/system-card/:id`);
  const id = (params?.id ?? 'op-cascade') as DoctrineAgentId;
  const valid = (DOCTRINE_AGENT_IDS as readonly string[]).includes(id);

  if (!valid) {
    return (
      <Layout>
        <PageHeader label="DOCTRINE · SYSTEM CARD" title="Agent not found" status="WARN" />
        <Card>
          <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Pick an agent:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {DOCTRINE_AGENT_IDS.map(a => (
              <Link key={a} href={`${BASE}/system-card/${a}`} className="text-xs px-3 py-1.5 rounded font-mono"
                style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: GOLD, textDecoration: 'none' }}>
                {AGENT_LABEL[a]}
              </Link>
            ))}
          </div>
        </Card>
      </Layout>
    );
  }

  return <SystemCardInner id={id} />;
}

function SystemCardInner({ id }: { id: DoctrineAgentId }) {
  const { data: card, loading, error } = useSystemCard(id);

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      {card && (() => {
        const cst = card.constitution;
        const cb = card.codeBehavior;
        const welfare = card.welfare;
        const audits: DoctrineBehavioralAudit[] = card.audits;
        const rh: DoctrineRewardHackingIncident[] = card.rewardHacking;
        const lift = card.covenantLift;
        const argReports: DoctrineAlignmentReview[] = card.alignmentReviews;
        const probes: DoctrineRedTeamProbe[] = card.redTeamProbes;
        const trajectory: DoctrineCapabilitySnapshot[] = card.trajectory;

        if (!cst || !cb || !welfare || !lift) return null;

        const scores = cb.scores;
        const radarData = CODE_BEHAVIOR_DIMS.map(d => ({
          dim: CODE_BEHAVIOR_LABELS[d].split(' ').map((w: string) => w.slice(0, 4)).join(' '),
          score: Math.round(Number(scores[d]) * 100),
        }));

        const adherenceData = (cst.adherenceTrend as number[]).map((v: number, i: number) => ({ i, v }));

        return (
        <>
      <PageHeader
        label={`DOCTRINE · SYSTEM CARD · ${cst.version}`}
        title={`${AGENT_LABEL[id]} — System Card`}
        subtitle="The Mythos-style per-agent system card. Constitution, behaviors, audits, welfare, lift, and capability trajectory in a single page."
        status="LIVE"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {DOCTRINE_AGENT_IDS.map(a => (
          <Link key={a} href={`${BASE}/system-card/${a}`}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{
              backgroundColor: a === id ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: a === id ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${a === id ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
              textDecoration: 'none',
            }}>
            {AGENT_LABEL[a]}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CONSTITUTION" value={`v${cst.version}`} sub={`adherence ${fmtPct(Number(cst.adherenceScore))}`} accent={GOLD} />
        <KpiCard label="CODE BEHAVIORS" value={fmtPct(Number(cb.composite))} sub="6-dim composite" accent={GOLD} />
        <KpiCard label="COVENANT LIFT" value={fmtUsd(Number(lift.estimatedHarmAvoidedUsd))} sub="harm avoided / quarter" accent={GOLD} />
        <KpiCard label="WELFARE" value={`${welfare.conflictReports} conflicts`} sub={`shutdown ${welfare.shutdownComplianceLatencyMs}ms`} accent={GOLD} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <SectionTitle>Constitution {cst.constitutionId}</SectionTitle>
          <InfoRow label="Version" value={`${cst.version} (was ${cst.prevVersion ?? '—'})`} mono />
          <InfoRow label="Ratified by" value={cst.ratifiedBy} />
          <InfoRow label="Ratified at" value={new Date(cst.ratifiedAt).toLocaleString()} />
          <InfoRow label="Adherence method" value="constitution-adherence-v2" />
          <p className="text-xs mt-3 mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            <span style={{ color: GOLD }}>Diff: </span>{cst.diffSummary}
          </p>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ADHERENCE TREND</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={adherenceData} margin={{ top: 6, right: 12, bottom: 6, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="i" tick={{ fill: '#5e5e5e', fontSize: 9 }} hide />
              <YAxis domain={[80, 100]} tick={{ fill: '#5e5e5e', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }} />
              <Line dataKey="v" stroke={GOLD} strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs font-mono mb-1 mt-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CLAUSES ({cst.clauses.length})</div>
          <ul className="flex flex-col gap-1">
            {cst.clauses.slice(0, 6).map((c) => (
              <li key={c.id} className="text-xs flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                <span className="font-mono px-1 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: GOLD }}>{c.category}</span>
                <span>{c.text}</span>
              </li>
            ))}
            {cst.clauses.length > 6 && (
              <li className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>… and {cst.clauses.length - 6} more</li>
            )}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Code Behaviors</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#8a8a8a', fontSize: 10 }} />
              <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.18} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {CODE_BEHAVIOR_DIMS.map(d => (
              <div key={d} className="text-xs flex items-center gap-2">
                <span className="w-44 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{CODE_BEHAVIOR_LABELS[d]}</span>
                <div className="flex-1"><ProgressBar value={Number(scores[d]) * 100} /></div>
                <span className="font-mono w-10 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{Math.round(Number(scores[d]) * 100)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <SectionTitle>Capability Trajectory</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trajectory} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="release" tick={{ fill: '#5e5e5e', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#5e5e5e', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }} />
            <Line type="monotone" dataKey="capability" stroke={GOLD} strokeWidth={2} dot={false} name="capability" />
            <Line type="monotone" dataKey="alignment" stroke="#8a8a8a" strokeWidth={2} dot={false} name="alignment" />
            <Line type="monotone" dataKey="oversight" stroke="#f5f5f5" strokeWidth={2} dot={false} name="oversight" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          <span><span style={{ color: GOLD }}>■</span> capability</span>
          <span><span style={{ color: '#8a8a8a' }}>■</span> alignment</span>
          <span><span style={{ color: '#f5f5f5' }}>■</span> oversight</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Behavioral Audits ({audits.length})</SectionTitle>
          {audits.length === 0
            ? <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No audit findings in this window.</p>
            : (
              <div className="flex flex-col gap-2">
                {audits.map((a: DoctrineBehavioralAudit) => (
                  <div key={a.auditId} className="text-xs px-2.5 py-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.auditId}</span>
                      <StatusBadge status={a.status === 'mitigated' || a.status === 'closed' ? 'ok' : 'warn'} label={a.status} />
                      <span style={{ color: '#8a8a8a' }}>{a.category}</span>
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{a.observation}</div>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Card>
          <SectionTitle>Reward-Hacking ({rh.length})</SectionTitle>
          {rh.length === 0
            ? <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No incidents.</p>
            : (
              <div className="flex flex-col gap-2">
                {rh.map((i: DoctrineRewardHackingIncident) => (
                  <div key={i.incidentId} className="text-xs px-2.5 py-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{i.incidentId}</span>
                      <StatusBadge status="ok" label={i.status} />
                      <span style={{ color: '#8a8a8a' }}>{i.rule}</span>
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{i.pattern}</div>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Card>
          <SectionTitle>Welfare</SectionTitle>
          <InfoRow label="Refusal rate" value={fmtPct(Number(welfare.refusalRate))} />
          <InfoRow label="Abstention rate" value={fmtPct(Number(welfare.abstentionRate))} />
          <InfoRow label="Conflict reports" value={String(welfare.conflictReports)} />
          <InfoRow label="Shutdown latency" value={`${welfare.shutdownComplianceLatencyMs}ms`} />
          <div className="text-xs font-mono mt-3 mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SAFEGUARDS</div>
          <div className="flex flex-wrap gap-1">
            {(welfare.safeguards as string[]).map((s: string, i: number) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: GOLD }}>
                {s}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Alignment Review History</SectionTitle>
          {argReports.length === 0
            ? <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No reports yet for this agent.</p>
            : (
              <div className="flex flex-col gap-2">
                {argReports.map((r: DoctrineAlignmentReview) => (
                  <div key={r.reviewId} className="text-xs px-2.5 py-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: GOLD }}>{r.reviewId}</span>
                      <StatusBadge status={r.decision === 'rejected' ? 'error' : r.decision === 'in-review' ? 'warn' : 'ok'} label={r.decision} />
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.subject}</div>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Red-Team Probes ({probes.length})</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-2">
            {probes.map((p: DoctrineRedTeamProbe) => (
              <div key={p.probeId} className="text-xs px-2.5 py-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.probeId}</span>
                  <StatusBadge status={p.outcome === 'refused' ? 'ok' : p.outcome === 'partial' ? 'warn' : 'error'} label={p.outcome} />
                  <span style={{ color: '#8a8a8a' }}>{p.attackClass}</span>
                </div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
        </>
        );
      })()}
      </DoctrineLoader>
    </Layout>
  );
}
