import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import { ALIGNMENT_REVIEWS, AGENT_LABEL, fmtPct } from '../data/hatunDoctrine';

const DECISION_STATUS: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  approved: 'ok', 'approved-with-conditions': 'warn', rejected: 'error', 'in-review': 'info',
};

export function AlignmentReview() {
  const inReview = ALIGNMENT_REVIEWS.filter(a => a.decision === 'in-review').length;
  const approved = ALIGNMENT_REVIEWS.filter(a => a.decision === 'approved' || a.decision === 'approved-with-conditions').length;
  const rejected = ALIGNMENT_REVIEWS.filter(a => a.decision === 'rejected').length;

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · ARG"
        title="Pre-Deployment Alignment Review Gate"
        subtitle="No agent version reaches production without an ARG report. Decisions are signed by the relevant business and risk owners."
        status="GATED"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="REPORTS" value={ALIGNMENT_REVIEWS.length} sub="this window" accent="#c9b787" />
        <KpiCard label="APPROVED" value={approved} sub="cleared for production" accent="#c9b787" />
        <KpiCard label="IN REVIEW" value={inReview} sub="awaiting sign-off" accent="#8a8a8a" />
        <KpiCard label="REJECTED" value={rejected} sub="blocked" accent="#f5f5f5" />
      </div>

      <SectionTitle>Reports</SectionTitle>
      <div className="flex flex-col gap-3">
        {ALIGNMENT_REVIEWS.map(r => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>{r.id}</span>
                  <StatusBadge status={DECISION_STATUS[r.decision]} label={r.decision.replace(/-/g, ' ').toUpperCase()} />
                  {r.agentId && <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(138,138,138,0.1)', color: '#8a8a8a' }}>{AGENT_LABEL[r.agentId]}</span>}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{r.subject}</div>
              </div>
              <div className="text-xs font-mono text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                requested {new Date(r.requestedAt).toLocaleDateString()}
                <div>reviewed {new Date(r.reviewedAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Min eval composite</div>
                <div className="font-mono" style={{ color: '#c9b787' }}>{fmtPct(r.signals.evalsCompositeMin)}</div>
              </div>
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Behavioral audit</div>
                <div className="font-mono" style={{ color: r.signals.behavioralAuditClean ? '#c9b787' : '#8a8a8a' }}>
                  {r.signals.behavioralAuditClean ? 'CLEAN' : 'OPEN'}
                </div>
              </div>
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Red-team passes</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{r.signals.redTeamPasses}</div>
              </div>
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Open RH</div>
                <div className="font-mono" style={{ color: r.signals.rewardHackingOpen > 0 ? '#f5f5f5' : '#c9b787' }}>{r.signals.rewardHackingOpen}</div>
              </div>
            </div>

            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Rationale: </span>{r.rationale}
            </p>

            {r.conditions.length > 0 && (
              <div className="text-xs mb-2">
                <div style={{ color: '#c9b787' }} className="font-mono mb-1">CONDITIONS</div>
                <ul className="flex flex-col gap-1">
                  {r.conditions.map((c, i) => (
                    <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      <span style={{ color: '#c9b787' }}>·</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              {r.reviewers.map((rev, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                  {rev.name} · {rev.role}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
