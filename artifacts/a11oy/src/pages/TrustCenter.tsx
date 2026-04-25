import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const CLAIMS = [
  {
    category: 'Built Today',
    items: [
      { claim: 'Proof Ledger with cryptographic hash chain', status: 'LIVE' as const, detail: 'SHA-256 hashing on all execution contracts. Demo mode.' },
      { claim: 'Policy gate enforcement (no silent execution)', status: 'LIVE' as const, detail: 'Covenant Layer blocks all material actions without approval.' },
      { claim: 'Signal Mesh — 7 domain ingestion pipeline', status: 'LIVE' as const, detail: 'Operational in demo mode with seeded data.' },
      { claim: 'MirrorEval — recommended vs. counterfactual', status: 'LIVE' as const, detail: 'Running on scripted demo scenarios.' },
      { claim: 'Human approval gate on all actions', status: 'LIVE' as const, detail: 'Structural guarantee — not a config option.' },
      { claim: 'Workcell execution context tracking', status: 'LIVE' as const, detail: 'Demo workcells with full step tracing.' },
    ],
  },
  {
    category: 'Demo Mode',
    items: [
      { claim: 'Live domain connector integrations', status: 'DEMO' as const, detail: 'Compatible integration targets exist. Real credentials required.' },
      { claim: 'Real-time vessel AIS data', status: 'DEMO' as const, detail: 'Seeded maritime data. AIS connector is a future target.' },
      { claim: 'Live CRM pipeline sync', status: 'DEMO' as const, detail: 'Salesforce-compatible. OAuth required for live data.' },
      { claim: 'Real matter management integration', status: 'DEMO' as const, detail: 'iManage-compatible. API key required.' },
    ],
  },
  {
    category: 'Roadmap',
    items: [
      { claim: 'SOC 2 Type II certification', status: 'ROADMAP' as const, detail: 'Planned — not yet initiated. No current audit engagement.' },
      { claim: 'HIPAA compliance attestation', status: 'ROADMAP' as const, detail: 'Planned for healthcare vertical. Not current.' },
      { claim: 'FedRAMP Authorization', status: 'ROADMAP' as const, detail: 'Planned — defense/gov vertical. Long-lead process.' },
      { claim: 'ISO 27001 certification', status: 'ROADMAP' as const, detail: 'Planned. No current certification.' },
      { claim: 'Multi-tenant production deployment', status: 'ROADMAP' as const, detail: 'Architecture designed for multi-tenancy. Not deployed.' },
      { claim: 'On-premises sovereign deployment', status: 'ROADMAP' as const, detail: 'Sovereign architecture designed. Deployment is Phase 4.' },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Built Today': '#10b981',
  'Demo Mode': '#f59e0b',
  'Roadmap': '#9bacc4',
};

export function TrustCenter() {
  return (
    <Layout>
      <PageHeader
        label="TRUST CENTER"
        title="Honest Capability Registry"
        subtitle="A11oy distinguishes exactly what is built today, what runs in demo mode, and what is on the roadmap. No inflated claims. No fake certifications."
        status="DEMO"
      />

      <div className="p-4 rounded-lg mb-8 border" style={{ backgroundColor: 'rgba(176,141,82,0.06)', borderColor: 'rgba(176,141,82,0.25)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#b08d52' }}>Core Trust Principle</div>
        <div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          No material action executes without human approval. This is structurally enforced — not a configuration toggle. Every claim below is independently verifiable in this demo environment.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard label="BUILT TODAY" value="6" sub="Verifiable in demo" accent="#10b981" />
        <KpiCard label="DEMO MODE" value="4" sub="Require connectors" accent="#f59e0b" />
        <KpiCard label="ROADMAP" value="6" sub="Clearly labeled" accent="#9bacc4" />
      </div>

      <div className="flex flex-col gap-6">
        {CLAIMS.map(group => (
          <div key={group.category}>
            <SectionTitle>
              <span style={{ color: CATEGORY_COLORS[group.category] }}>{group.category}</span>
            </SectionTitle>
            <div className="flex flex-col gap-2">
              {group.items.map(item => (
                <Card key={item.claim}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{item.claim}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.detail}</div>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div className="text-xs font-mono mb-2" style={{ color: '#3b82f6' }}>THIRD-PARTY CLAIMS POLICY</div>
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          A11oy does not claim to be an "official partner" of any third-party vendor. All system references are "compatible integration target" or "future connector target." No customer logos, no revenue figures, no fake partner badges appear anywhere in this product.
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> This trust registry accurately reflects the state of A11oy as an active prototype.
      </div>
    </Layout>
  );
}
