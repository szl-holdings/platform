import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const EVALS = [
  {
    id: 'eval-001', title: 'MV Cascade standby vs. rebooking', domain: 'Maritime',
    recommended: { action: 'Authorize 48h port standby', confidence: 91, cost: '$14,200/day', risk: 'medium' },
    counterfactual: { action: 'Rebook alternative berth T+6h', confidence: 78, cost: '$8,400 one-time', risk: 'high' },
    verdict: 'RECOMMENDED_PREFERRED', reasoning: 'Standby preserves optionality. Rebooking has 22% failure rate at Port Houston during peak.',
    citations: ['Port Authority SLA Model', 'Historical demurrage data', 'Cascade cargo manifest'],
  },
  {
    id: 'eval-002', title: 'Talbot escalation: lead vs. associate counsel', domain: 'Legal',
    recommended: { action: 'Escalate to lead counsel', confidence: 97, cost: 'Partner rate', risk: 'low' },
    counterfactual: { action: 'Associate-led with senior review', confidence: 61, cost: 'Associate rate', risk: 'critical' },
    verdict: 'RECOMMENDED_PREFERRED', reasoning: 'T-48h deadline with outstanding docs requires partner judgment. Associate path has 39% on-time completion.',
    citations: ['Matter deadline log', 'Historical discovery outcomes', 'Opposing counsel filing pattern'],
  },
  {
    id: 'eval-003', title: 'Q2 pipeline: direct intervention vs. automated nudge', domain: 'Revenue',
    recommended: { action: 'VP direct review call — 3 deals', confidence: 85, cost: '2h executive time', risk: 'low' },
    counterfactual: { action: 'Automated CRM nudge sequence', confidence: 54, cost: 'None', risk: 'high' },
    verdict: 'RECOMMENDED_PREFERRED', reasoning: 'Enterprise deals over $500k respond 3x better to executive outreach than automated sequences.',
    citations: ['12-month win/loss analysis', 'Deal size segmentation model', 'VP success rate history'],
  },
];

const VERDICT_STYLES: Record<string, { color: string; bg: string }> = {
  RECOMMENDED_PREFERRED: { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  COUNTERFACTUAL_PREFERRED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  INCONCLUSIVE: { color: '#9bacc4', bg: 'rgba(155,172,196,0.08)' },
};

export function MirrorEval() {
  return (
    <Layout>
      <PageHeader
        label="MIRROREVAL"
        title="Recommended vs. Counterfactual"
        subtitle="Every A11oy recommendation is tested against its counterfactual. MirrorEval surfaces the comparison, confidence delta, and reasoning chain for human review."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE EVALS" value="3" sub="Pending review" accent="#8b5cf6" />
        <KpiCard label="RECOMMENDED WIN" value="3/3" sub="Demo sample" accent="#10b981" />
        <KpiCard label="AVG CONFIDENCE DELTA" value="+19pt" sub="Recommended vs. counter" accent="#3b82f6" />
        <KpiCard label="CITATIONS" value="9" sub="Across 3 evals" accent="#b08d52" />
      </div>

      <div className="flex flex-col gap-6">
        {EVALS.map(e => {
          const vs = VERDICT_STYLES[e.verdict] ?? VERDICT_STYLES.INCONCLUSIVE;
          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.domain}</div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{e.title}</h3>
                </div>
                <span
                  className="text-xs font-mono px-2 py-1 rounded flex-shrink-0"
                  style={{ backgroundColor: vs.bg, color: vs.color }}
                >
                  {e.verdict.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <div className="text-xs font-mono mb-2" style={{ color: '#10b981' }}>RECOMMENDED</div>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{e.recommended.action}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>confidence</div>
                      <div style={{ color: '#10b981' }}>{e.recommended.confidence}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>cost</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.recommended.cost}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>risk</div>
                      <div style={{ color: e.recommended.risk === 'low' ? '#10b981' : e.recommended.risk === 'medium' ? '#f59e0b' : '#ef4444' }}>{e.recommended.risk}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' }}>
                  <div className="text-xs font-mono mb-2" style={{ color: '#ef4444' }}>COUNTERFACTUAL</div>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{e.counterfactual.action}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>confidence</div>
                      <div style={{ color: '#f59e0b' }}>{e.counterfactual.confidence}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>cost</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.counterfactual.cost}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>risk</div>
                      <div style={{ color: e.counterfactual.risk === 'low' ? '#10b981' : e.counterfactual.risk === 'medium' ? '#f59e0b' : '#ef4444' }}>{e.counterfactual.risk}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>REASONING</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.reasoning}</div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {e.citations.map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.1)', color: '#b08d52', border: '1px solid rgba(176,141,82,0.2)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> All eval results, confidence scores, and citations are illustrative demo content.
      </div>
    </Layout>
  );
}
