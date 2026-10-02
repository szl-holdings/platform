import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';

const T = {
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
};

type FrameworkTarget = {
  name: string;
  intent: string;
  evidenceGate: string;
};

const FRAMEWORK_TARGETS: FrameworkTarget[] = [
  { name: 'SOC 2 Type II', intent: 'Readiness target', evidenceGate: 'Independent audit report and scope required before any attestation claim.' },
  { name: 'ISO/IEC 27001:2022', intent: 'Readiness target', evidenceGate: 'Accredited certificate and scope required before any certification claim.' },
  { name: 'ISO/IEC 42001:2023', intent: 'Evaluation target', evidenceGate: 'Audited AI management system evidence required.' },
  { name: 'EU AI Act', intent: 'Legal review target', evidenceGate: 'Product-specific obligation mapping and counsel review required.' },
  { name: 'NIST AI RMF 1.0', intent: 'Mapping target', evidenceGate: 'Dated control mapping and effectiveness evidence required.' },
  { name: 'CSA AI Controls Matrix', intent: 'Mapping target', evidenceGate: 'Completed control assessment and supporting evidence required.' },
  { name: 'HIPAA technical safeguards', intent: 'Legal review target', evidenceGate: 'Scoped PHI flows, safeguards assessment, and contract review required.' },
  { name: 'FedRAMP Moderate', intent: 'Future evaluation', evidenceGate: 'Authorization package and agency decision required before status claim.' },
];

type ControlTarget = {
  id: string;
  name: string;
  designGoal: string;
  evidenceNeeded: string;
};

const CONTROL_TARGETS: ControlTarget[] = [
  {
    id: 'crypto',
    name: 'Cryptography & Key Management',
    designGoal: 'Define transport, storage, signing, custody, and rotation controls for each deployed environment.',
    evidenceNeeded: 'Deployment-bound configuration, key inventory, and independent test results.',
  },
  {
    id: 'access',
    name: 'Identity & Access',
    designGoal: 'Define operator identity, least privilege, and approval boundaries.',
    evidenceNeeded: 'IdP configuration, role tests, and dated access review.',
  },
  {
    id: 'data',
    name: 'Data Handling & Residency',
    designGoal: 'Define tenant, region, retention, and deletion boundaries before customer use.',
    evidenceNeeded: 'Data-flow inventory, tenant isolation tests, and region-specific deployment records.',
  },
  {
    id: 'platform',
    name: 'Platform Security',
    designGoal: 'Run source and dependency checks for each release candidate.',
    evidenceNeeded: 'Exact-head CI runs, reviewed findings, and released artifact provenance.',
  },
  {
    id: 'agent',
    name: 'Agent Safety & Alignment',
    designGoal: 'Require policy and human review before an agent can make an external change.',
    evidenceNeeded: 'Fail-closed runtime tests and action receipts bound to the deployed revision.',
  },
  {
    id: 'incident',
    name: 'Incident Response & Disclosure',
    designGoal: 'Define intake, escalation, customer notice, and disclosure procedures.',
    evidenceNeeded: 'Approved runbooks, dated exercises, and applicable contract terms.',
  },
];

export function SecurityCompliance() {
  return (
    <Layout>
      <PageHeader
        label="TRUST · SECURITY & COMPLIANCE"
        title="Security and Compliance"
        subtitle="A11oy security and compliance design targets. Certification, runtime control effectiveness, incident SLAs, and customer-specific attestations require separate evidence."
        status="DEMO"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CERTIFICATIONS" value="UNAVAILABLE" sub="No certificate connected" accent={T.accent} />
        <KpiCard label="AUDIT OPINION" value="UNAVAILABLE" sub="No scoped report connected" accent={T.accent} />
        <KpiCard label="RUNTIME CONTROLS" value="UNAVAILABLE" sub="No deployed evidence feed" accent={T.accent} />
        <KpiCard label="INCIDENT SLA" value="UNAVAILABLE" sub="No verified service result" accent={T.accent} />
      </div>

      <Card className="mb-6">
        <p className="text-sm" style={{ color: T.text }}>
          This page is a readiness map for an active prototype. It does not assert SOC 2 or ISO
          certification, HIPAA compliance, FedRAMP authorization, legal conformance, or operation
          of the controls below. A route or source definition alone cannot establish those states.
        </p>
      </Card>

      <SectionTitle>Framework Evaluation Targets</SectionTitle>
      <div className="grid gap-2 mb-6 md:hidden">
        {FRAMEWORK_TARGETS.map(target => (
          <Card key={target.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase" style={{ color: T.textMuted }}>Framework</div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{target.name}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: T.textMuted }}>Status</div>
                <StatusBadge status="warn" label="UNVERIFIED" />
              </div>
            </div>
            <div className="mt-3 pt-3 grid gap-2 text-xs" style={{ borderTop: '1px solid ' + T.border }}>
              <div>
                <div className="text-[10px] font-mono uppercase" style={{ color: T.textMuted }}>Intent</div>
                <div style={{ color: T.textDim }}>{target.intent}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase" style={{ color: T.textMuted }}>Evidence required</div>
                <div style={{ color: T.textDim }}>{target.evidenceGate}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mb-6 hidden md:block">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid ' + T.border }}>
                {['Framework', 'Intent', 'Status', 'Evidence required'].map(heading => (
                  <th key={heading} style={{
                    textAlign: 'left', padding: '0.875rem 1rem',
                    fontFamily: T.mono, fontSize: '0.625rem',
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRAMEWORK_TARGETS.map(target => (
                <tr key={target.name} style={{ borderBottom: '1px solid ' + T.border }}>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: T.text, fontWeight: 500 }}>{target.name}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{target.intent}</td>
                  <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status="warn" label="UNVERIFIED" /></td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{target.evidenceGate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionTitle>Control Evidence Plan</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {CONTROL_TARGETS.map(target => (
          <Card key={target.id}>
            <div style={{ padding: '0.25rem 0.5rem' }}>
              <div style={{
                fontFamily: T.mono, fontSize: '0.625rem', letterSpacing: '0.14em',
                color: T.accent, textTransform: 'uppercase',
              }}>{target.id} · DESIGN TARGET</div>
              <h3 style={{ fontSize: '1.125rem', color: T.text, margin: '0.625rem 0' }}>{target.name}</h3>
              <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, marginBottom: '0.75rem' }}>
                {target.designGoal}
              </p>
              <div style={{ borderTop: '1px solid ' + T.border, paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', fontFamily: T.mono, color: T.accent }}>EVIDENCE NEEDED</span>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.55, color: T.text, marginTop: '0.25rem' }}>
                  {target.evidenceNeeded}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Disclosure Readiness</SectionTitle>
      <Card>
        <p className="text-sm" style={{ color: T.textDim }}>
          A disclosure intake and defender workflow are design targets. No active intake SLA,
          defender credit program, customer notification guarantee, or completed transparency
          report is evidenced on this page.
        </p>
      </Card>
    </Layout>
  );
}
