import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const SOVEREIGN_MODES = [
  {
    id: 'cloud-managed', name: 'Cloud Managed', status: 'LIVE' as const,
    description: 'A11oy hosted infrastructure. Model calls via API. Proof Ledger on managed store.',
    pros: ['Fastest deployment', 'Automatic updates', 'No infra overhead'],
    cons: ['Data leaves premises', 'API key dependency', 'Shared tenancy'],
    current: true,
  },
  {
    id: 'vpc-isolated', name: 'VPC Isolated', status: 'ROADMAP' as const,
    description: 'A11oy deployed in customer VPC. Data stays within cloud boundary. Model calls internal.',
    pros: ['Data sovereignty within cloud', 'Private endpoints', 'Network isolation'],
    cons: ['Infra management required', 'Higher cost', 'Deployment complexity'],
    current: false,
  },
  {
    id: 'on-prem', name: 'On-Premises / Air-Gapped', status: 'ROADMAP' as const,
    description: 'Full on-premises deployment. No external network calls. Local model inference (Llama 3 or equivalent).',
    pros: ['True data sovereignty', 'No external deps', 'Defense/gov certified posture'],
    cons: ['Highest complexity', 'GPU infra required', 'Manual update cycle'],
    current: false,
  },
];

const DATA_CLASSIFICATION = [
  { label: 'Signal data', classification: 'Stays within workcell boundary', sovereign: true },
  { label: 'Proof Ledger entries', classification: 'Immutable, tenant-isolated store', sovereign: true },
  { label: 'Model inference payloads', classification: 'Transmitted to model API (cloud mode)', sovereign: false },
  { label: 'Approval records', classification: 'Stays within workcell boundary', sovereign: true },
  { label: 'Policy configurations', classification: 'Stays within workcell boundary', sovereign: true },
];

export function Sovereign() {
  return (
    <Layout>
      <PageHeader
        label="SOVEREIGN"
        title="On-Premises & Air-Gapped Posture"
        subtitle="A11oy's sovereignty roadmap — from cloud-managed to fully air-gapped deployment. Defense and government clients require full on-premises posture."
        status="DEMO"
      />

      <div className="p-4 rounded-lg mb-8 border" style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.25)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#8b5cf6' }}>Current Deployment Mode</div>
        <div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          This prototype runs in cloud-managed mode with demo data. VPC-isolated and on-premises deployment modes are on the roadmap — explicitly labeled, not claimed as current capability.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard label="CLOUD MANAGED" value="LIVE" sub="Current demo posture" accent="#10b981" />
        <KpiCard label="VPC ISOLATED" value="ROADMAP" sub="Phase 3" accent="#9bacc4" />
        <KpiCard label="AIR-GAPPED" value="ROADMAP" sub="Phase 4" accent="#9bacc4" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {SOVEREIGN_MODES.map(mode => (
          <Card key={mode.id} className={mode.current ? 'ring-1 ring-blue-500/30' : ''}>
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{mode.name}</div>
              <StatusPill status={mode.status} />
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{mode.description}</p>
            <div className="space-y-1">
              {mode.pros.map(p => (
                <div key={p} className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#10b981' }}>+</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{p}</span>
                </div>
              ))}
              {mode.cons.map(c => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#f59e0b' }}>−</span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Data Classification</SectionTitle>
      <div className="flex flex-col gap-2 mb-6">
        {DATA_CLASSIFICATION.map(d => (
          <Card key={d.label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{d.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.classification}</div>
              </div>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                style={{
                  backgroundColor: d.sovereign ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: d.sovereign ? '#10b981' : '#f59e0b',
                }}
              >
                {d.sovereign ? 'stays local' : 'leaves boundary'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Sovereign deployment modes are roadmap items. Current prototype is cloud-managed with demo data.
      </div>
    </Layout>
  );
}
