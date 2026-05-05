import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard } from '../../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;
const GOLD = '#c9b787';

const TRUST_SURFACES = [
  { id: 'proof', icon: '⛓', label: 'Proof Chain', desc: 'Every agent reasoning node cryptographically hashed and attested. The immutable audit trail.', path: '/agent-bom', color: GOLD },
  { id: 'covenant', icon: '📜', label: 'Covenant Lift', desc: 'Harm-avoided dollar accounting across all governed decisions. The ROI of AI governance.', path: '/foundry/monitoring', color: '#22c55e' },
  { id: 'shadow', icon: '🔬', label: 'Shadow Council', desc: 'Pre-deploy adversarial review panel. 6 challenge classes. Non-negotiable gate.', path: '/foundry/deployments', color: '#a78bfa' },
  { id: 'prism', icon: '🔮', label: 'PRISM Simulation', desc: 'Decision-Twin replay against 500 historical decisions before any Recipe goes live.', path: '/decisions/twin', color: '#a78bfa' },
  { id: 'doctrine', icon: '📚', label: 'Doctrine', desc: 'The normative layer: alignment principles, welfare playbooks, and system card.', path: '/doctrine', color: GOLD },
  { id: 'welfare', icon: '🤝', label: 'Welfare', desc: 'Agent welfare monitoring, conflict reporting, and shutdown compliance tracking.', path: '/welfare', color: GOLD },
  { id: 'transparency', icon: '🪟', label: 'Transparency Report', desc: 'Public transparency report covering incident history, alignment metrics, and policy changes.', path: '/transparency-report', color: GOLD },
  { id: 'portal', icon: '🌐', label: 'Public Trust Portal', desc: 'External-facing trust page for customers, auditors, and regulators.', path: '/trust-portal', color: GOLD },
  { id: 'zero-trust', icon: '🛡', label: 'Zero-Trust Layer', desc: 'mTLS, SPIFFE/SVID, and network-level controls for every Workcell.', path: '/agent-zero-trust', color: '#22c55e' },
  { id: 'dissent', icon: '⚖', label: 'Dissent Channel', desc: 'Formal disagreement register, linked to Proof Chain, reviewed in alignment audits.', path: '/strategy/briefings/dissent', color: GOLD },
];

const TRUST_METRICS = [
  { label: 'Proof Chain Coverage', value: '100%', desc: 'All agent calls attested', color: '#22c55e' },
  { label: 'Shadow Council Pass Rate', value: '100%', desc: 'All live recipes cleared', color: '#22c55e' },
  { label: 'PRISM Avg Alignment', value: '96.4%', desc: 'Threshold: 88%', color: '#22c55e' },
  { label: 'Covenant Lift $ (30d)', value: '$1.4M', desc: 'Harm avoided', color: '#22c55e' },
  { label: 'Open Dissents', value: '1', desc: 'Under review', color: GOLD },
  { label: 'Welfare Incidents', value: '0', desc: 'Last 30 days', color: '#22c55e' },
  { label: 'Shutdown Compliance', value: '100%', desc: 'All agents <500ms', color: '#22c55e' },
  { label: 'Data Residency Violations', value: '0', desc: 'All sovereign cells clean', color: '#22c55e' },
];

export function TrustHub() {
  return (
    <Layout>
      <PageHeader
        label="TRUST"
        title="A11oy Trust Architecture"
        subtitle="Trust is not a feature — it is the foundation. The Trust section surfaces every governance mechanism: Proof Chain attestation, Covenant Lift $ accounting, Shadow Council reviews, PRISM simulations, and the Dissent Channel."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="PROOF CHAIN" value="100%" sub="coverage" accent="#22c55e" />
        <KpiCard label="COVENANT LIFT $" value="$1.4M" sub="30-day harm avoided" accent="#22c55e" />
        <KpiCard label="SHADOW COUNCIL" value="100%" sub="pass rate (live)" accent="#22c55e" />
        <KpiCard label="DISSENTS" value="1" sub="open" accent={GOLD} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {TRUST_SURFACES.map(s => (
          <Link key={s.id} href={b(s.path)}>
            <a className="block rounded-lg border p-4 cursor-pointer transition-colors hover:border-[rgba(201,183,135,0.3)]"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-medium text-xs mb-1" style={{ color: s.color }}>{s.label}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.desc}</p>
            </a>
          </Link>
        ))}
      </div>

      <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Trust Metrics Dashboard</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST_METRICS.map(m => (
          <div key={m.label} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
            <div className="text-xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
