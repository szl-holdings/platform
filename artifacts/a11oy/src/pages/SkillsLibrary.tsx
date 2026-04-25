import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const SKILLS = [
  { id: 'sk-001', name: 'ETA Deviation Detector', domain: 'Maritime', category: 'Signal Processing', status: 'LIVE' as const, calls: 142, accuracy: '96%', description: 'Detects vessel ETA deviations from schedule, computes delay severity and demurrage exposure.' },
  { id: 'sk-002', name: 'Deadline Risk Scorer', domain: 'Legal', category: 'Risk Analysis', status: 'LIVE' as const, calls: 88, accuracy: '98%', description: 'Scores legal deadline breach risk based on outstanding tasks, days remaining, and historical completion rates.' },
  { id: 'sk-003', name: 'Pipeline Velocity Analyzer', domain: 'Revenue', category: 'Business Intelligence', status: 'LIVE' as const, calls: 214, accuracy: '91%', description: 'Monitors CRM pipeline velocity, identifies stall patterns, and forecasts quarter-end impact.' },
  { id: 'sk-004', name: 'Cap Rate Tracker', domain: 'Real Estate', category: 'Market Analysis', status: 'LIVE' as const, calls: 56, accuracy: '94%', description: 'Tracks capitalization rate movements across portfolio assets and identifies compression/expansion signals.' },
  { id: 'sk-005', name: 'Threat Tier Evaluator', domain: 'Defense', category: 'Threat Intelligence', status: 'LIVE' as const, calls: 312, accuracy: '99%', description: 'Evaluates threat actor activity patterns and assigns tiered posture classifications.' },
  { id: 'sk-006', name: 'Counterfactual Generator', domain: 'Cross-domain', category: 'MirrorEval', status: 'LIVE' as const, calls: 29, accuracy: '—', description: 'Generates structured counterfactual scenarios for MirrorEval comparison against recommended actions.' },
  { id: 'sk-007', name: 'Proof Hash Generator', domain: 'Alloy Core', category: 'Proof Ledger', status: 'LIVE' as const, calls: 1840, accuracy: '100%', description: 'Generates and verifies SHA-256 hash chains for Proof-Carrying Execution contracts.' },
  { id: 'sk-008', name: 'Policy Gate Evaluator', domain: 'Alloy Core', category: 'Governance', status: 'LIVE' as const, calls: 1840, accuracy: '100%', description: 'Evaluates proposed actions against the Covenant Layer policy registry before queuing for approval.' },
  { id: 'sk-009', name: 'Advisory Brief Generator', domain: 'Carlota Jo', category: 'Consulting', status: 'DEMO' as const, calls: 12, accuracy: 'N/A', description: 'Drafts client advisory briefs from signal summaries. Demo mode — outputs are scripted.' },
  { id: 'sk-010', name: 'AIS Stream Processor', domain: 'Maritime', category: 'Signal Processing', status: 'ROADMAP' as const, calls: 0, accuracy: 'N/A', description: 'Future: Real-time AIS vessel tracking stream processor. Connector target — not yet built.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Signal Processing': '#3b82f6',
  'Risk Analysis': '#ef4444',
  'Business Intelligence': '#f59e0b',
  'Market Analysis': '#10b981',
  'Threat Intelligence': '#8b5cf6',
  'MirrorEval': '#6366f1',
  'Proof Ledger': '#b08d52',
  'Governance': '#b08d52',
  'Consulting': '#ec4899',
};

export function SkillsLibrary() {
  return (
    <Layout>
      <PageHeader
        label="SKILLS LIBRARY"
        title="Operator Skill Registry"
        subtitle="Discrete, composable skills available to A11oy Operators. Each skill has a defined input schema, output contract, and proof trace."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="TOTAL SKILLS" value="10" sub="8 live, 1 demo, 1 roadmap" accent="#10b981" />
        <KpiCard label="CALLS TODAY" value="4,533" sub="Demo estimate" accent="#3b82f6" />
        <KpiCard label="DOMAINS" value="7" sub="All verticals covered" accent="#f59e0b" />
        <KpiCard label="AVG ACCURACY" value="97%" sub="Production targets" accent="#b08d52" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SKILLS.map(s => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{s.name}</span>
                  <StatusPill status={s.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${CATEGORY_COLORS[s.category] ?? '#9bacc4'}18`, color: CATEGORY_COLORS[s.category] ?? '#9bacc4' }}
                  >
                    {s.category}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.domain}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 text-xs">
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.calls.toLocaleString()} calls</div>
                <div style={{ color: '#10b981' }}>{s.accuracy}</div>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Call counts and accuracy figures are illustrative. Live skills run against real connector data.
      </div>
    </Layout>
  );
}
