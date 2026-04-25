import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const CONNECTORS = [
  { id: 'conn-001', name: 'Port Authority API', domain: 'Maritime', category: 'compatible integration target', status: 'demo', icon: '⚓', latency: 'N/A', uptime: 'N/A', note: 'Compatible integration target — real credentials required' },
  { id: 'conn-002', name: 'Matter Management (iManage)', domain: 'Legal', category: 'compatible integration target', status: 'demo', icon: '⚖', latency: 'N/A', uptime: 'N/A', note: 'Compatible integration target — API key required' },
  { id: 'conn-003', name: 'CRM Pipeline (Salesforce)', domain: 'Revenue', category: 'compatible integration target', status: 'demo', icon: '◈', latency: 'N/A', uptime: 'N/A', note: 'Compatible integration target — OAuth required' },
  { id: 'conn-004', name: 'Vessel Tracking (AIS)', domain: 'Maritime', category: 'future connector target', status: 'roadmap', icon: '🚢', latency: 'N/A', uptime: 'N/A', note: 'Future connector target — planned Phase 3' },
  { id: 'conn-005', name: 'CAD/GIS Feed', domain: 'Defense', category: 'future connector target', status: 'roadmap', icon: '◎', latency: 'N/A', uptime: 'N/A', note: 'Future connector target — SCIF-compliant implementation' },
  { id: 'conn-006', name: 'Proof Ledger (internal)', domain: 'Alloy Core', category: 'built', status: 'live', icon: '◇', latency: '8ms', uptime: '99.97%', note: 'Built — operational in demo mode' },
  { id: 'conn-007', name: 'Signal Mesh (internal)', domain: 'Alloy Core', category: 'built', status: 'live', icon: '⬡', latency: '12ms', uptime: '99.92%', note: 'Built — operational in demo mode' },
  { id: 'conn-008', name: 'Policy Engine (internal)', domain: 'Alloy Core', category: 'built', status: 'live', icon: '⚖', latency: '5ms', uptime: '100%', note: 'Built — operational in demo mode' },
];

const STATUS_LABELS: Record<string, 'LIVE' | 'DEMO' | 'ROADMAP'> = {
  live: 'LIVE', demo: 'DEMO', roadmap: 'ROADMAP',
};

const CATEGORY_COLORS: Record<string, string> = {
  'built': '#10b981',
  'compatible integration target': '#3b82f6',
  'future connector target': '#9bacc4',
};

export function ConnectorFirewall() {
  return (
    <Layout>
      <PageHeader
        label="CONNECTOR FIREWALL"
        title="Integration Registry"
        subtitle="All connectors are classified as Built, Compatible Integration Target, or Future Connector Target. No fake partner claims. No unofficial integrations."
        status="DEMO"
      />

      <div className="p-4 rounded-lg mb-8 border" style={{ backgroundColor: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div className="text-xs font-mono mb-1" style={{ color: '#3b82f6' }}>CLASSIFICATION POLICY</div>
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          A11oy does not claim official partnerships. Connectors are labeled: <span style={{ color: '#10b981' }}>Built</span> (operational today), <span style={{ color: '#3b82f6' }}>Compatible Integration Target</span> (API-compatible, requires credentials), or <span style={{ color: '#9bacc4' }}>Future Connector Target</span> (planned, not built).
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="BUILT" value="3" sub="Operational in demo" accent="#10b981" />
        <KpiCard label="COMPATIBLE TARGETS" value="3" sub="Require credentials" accent="#3b82f6" />
        <KpiCard label="FUTURE TARGETS" value="2" sub="Planned roadmap" accent="#9bacc4" />
        <KpiCard label="ACTIVE (DEMO)" value="3" sub="Internal fabric connectors" accent="#f59e0b" />
      </div>

      <div className="flex flex-col gap-3">
        {CONNECTORS.map(c => (
          <Card key={c.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-a11oy-muted)', color: CATEGORY_COLORS[c.category] ?? '#9bacc4' }}
                >
                  {c.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{c.name}</span>
                    <StatusPill status={STATUS_LABELS[c.status] ?? 'DEMO'} />
                    <DemoBadge />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.domain}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono" style={{ color: CATEGORY_COLORS[c.category] ?? '#9bacc4' }}>
                  {c.category}
                </div>
                {c.latency !== 'N/A' && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {c.latency} · {c.uptime}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.note}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Connector registry reflects demo classification only. Live data requires real credentials per connector.
      </div>
    </Layout>
  );
}
