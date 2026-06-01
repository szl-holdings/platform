import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const link = (path: string) => `${BASE}${path}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

type AuditScope = {
  id: string;
  name: string;
  whatYouSee: string[];
  surface: { label: string; href: string };
  cadence: string;
  selfServe: boolean;
};

const SCOPES: AuditScope[] = [
  {
    id: 'proof',
    name: 'Proof Ledger Inspection',
    whatYouSee: [
      'Every consequential action attributed to your tenancy',
      'Approver, model, evidence set, and outcome for each entry',
      'Cryptographic chain integrity from genesis to current head',
    ],
    surface: { label: 'Proof Ledger', href: '/proof' },
    cadence: 'Continuous · self-serve',
    selfServe: true,
  },
  {
    id: 'covenant',
    name: 'Covenant Policy Review',
    whatYouSee: [
      'Active policies governing your tenancy and any inherited covenants',
      'Amendment history with proposer, approver quorum, and rationale',
      'Pending policy changes awaiting quorum approval',
    ],
    surface: { label: 'Governance', href: '/governance' },
    cadence: 'Continuous · self-serve',
    selfServe: true,
  },
  {
    id: 'evals',
    name: 'Evaluation & Alignment Review',
    whatYouSee: [
      'MirrorEval results for every model in your tenancy',
      'Alignment Review Gate findings and remediation evidence',
      'Behavioral Audit and reward-hacking watchdog history',
    ],
    surface: { label: 'MirrorEval + Reasoning', href: '/evals' },
    cadence: 'Continuous · self-serve',
    selfServe: true,
  },
  {
    id: 'access',
    name: 'Access & Identity Logs',
    whatYouSee: [
      'Operator session history with authentication method and source',
      'Privilege elevations and the policies that authorized them',
      'Agent identity issuances and capability compartment assignments',
    ],
    surface: { label: 'Agent Identity', href: '/agent-identity' },
    cadence: 'Continuous · self-serve · 7-year retention',
    selfServe: true,
  },
  {
    id: 'subprocessor',
    name: 'Sub-processor Audit Pass-Through',
    whatYouSee: [
      'Most recent SOC 2 / ISO 27001 reports from sub-processors',
      'Sub-processor change history with 30-day notice records',
      'CycloneDX SBOMs and Agent-BOMs for every release in scope',
    ],
    surface: { label: 'Trust Exchange', href: '/trust-exchange' },
    cadence: 'On-demand · NDA',
    selfServe: false,
  },
  {
    id: 'incident',
    name: 'Incident Record & Post-Mortems',
    whatYouSee: [
      'Confirmed material incidents affecting your tenancy',
      'Detection, notification, containment, and remediation timeline',
      'Public PMIs for P1 incidents and internal RCAs on request',
    ],
    surface: { label: 'Public Trust Portal', href: '/trust-portal' },
    cadence: 'Public PMIs ≤ 14d · RCA on request',
    selfServe: false,
  },
  {
    id: 'onsite',
    name: 'On-site / Live Audit',
    whatYouSee: [
      'Walk-through of the runtime environment and physical hosting (where applicable)',
      'Live demonstration of any control claimed in this Trust Center',
      'Direct interview access to platform engineers and the security officer',
    ],
    surface: { label: 'Trust Center', href: '/trust' },
    cadence: 'Annual standing right · 30-day scheduling window',
    selfServe: false,
  },
  {
    id: 'regulator',
    name: 'Regulator & Court-Ordered Inspection',
    whatYouSee: [
      'Cooperative response to authorized regulatory or judicial inspection',
      'Customer notification before disclosure where lawfully permitted',
      'Scope-limited evidence collection with chain-of-custody record',
    ],
    surface: { label: 'Trust Center', href: '/trust' },
    cadence: 'On lawful order · customer notice as permitted',
    selfServe: false,
  },
];

type SLA = {
  step: string;
  window: string;
  detail: string;
};

const SLAS: SLA[] = [
  { step: 'Acknowledgement', window: '≤ 1 business day', detail: 'Audit request acknowledged; case ID issued; assigned audit liaison named.' },
  { step: 'Scope confirmation', window: '≤ 5 business days', detail: 'Scope, methodology, and evidence access plan confirmed in writing.' },
  { step: 'Self-serve access', window: 'Immediate', detail: 'Proof Ledger, Governance, MirrorEval, and Identity surfaces available to authenticated tenant operators with the Auditor role.' },
  { step: 'Sub-processor reports', window: '≤ 10 business days', detail: 'Most recent attestation reports delivered under NDA via Trust Exchange.' },
  { step: 'On-site / live audit', window: '≤ 30 calendar days', detail: 'Scheduling window from confirmed scope; one annual standing slot per tenant.' },
  { step: 'Findings response', window: '≤ 30 calendar days', detail: 'Written response to each finding with remediation plan or rationale for accepted risk.' },
  { step: 'Remediation evidence', window: 'As committed', detail: 'Remediation evidence anchored on the proof ledger and surfaced to the auditor.' },
];

export function RightToAudit() {
  const selfServe = SCOPES.filter((s) => s.selfServe).length;

  return (
    <Layout>
      <PageHeader
        label="TRUST · RIGHT TO AUDIT"
        title="Right to Audit"
        subtitle="A standing, contractual right held by every customer, regulator, and authorized auditor. Self-serve where the evidence is ours to release; coordinated where it is shared."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AUDIT SCOPES" value={SCOPES.length} accent={T.accent} />
        <KpiCard label="SELF-SERVE" value={selfServe} sub="no ticket required" accent={T.accent} />
        <KpiCard label="ACK SLA" value="≤ 1 day" sub="business" accent={T.accent} />
        <KpiCard label="ON-SITE" value="ANNUAL" sub="standing right" accent={T.accent} />
      </div>

      <Card className="mb-6">
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: T.serif, fontSize: '1rem', lineHeight: 1.7, color: T.text, margin: 0, marginBottom: '0.75rem' }}>
            The Constitution names audit as Article V. This page is the operating procedure that makes that article enforceable.
          </p>
          <p style={{ fontFamily: T.serif, fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            We honor every audit request inside the published response window without negotiation. Cross-tenant inspection is prohibited absent a recorded judicial order. Sub-processor findings are passed through where the customer is contractually entitled to them.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <StatusBadge status="ok" label="STANDING RIGHT · CONTRACTUAL" />
            <StatusBadge status="ok" label="NON-NEGOTIABLE WINDOW" />
            <StatusBadge status="info" label="SCOPED TO REQUESTING TENANT" />
          </div>
        </div>
      </Card>

      <SectionTitle>Audit Scopes</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {SCOPES.map((s) => (
          <Card key={s.id}>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{
                  fontFamily: T.mono, fontSize: '0.625rem', letterSpacing: '0.14em',
                  color: T.accent, textTransform: 'uppercase',
                }}>scope · {s.id}</span>
                <StatusBadge status={s.selfServe ? 'ok' : 'info'} label={s.selfServe ? 'SELF-SERVE' : 'COORDINATED'} />
              </div>
              <h3 style={{
                fontFamily: T.serif, fontSize: '1.125rem', fontWeight: 400,
                color: T.text, margin: 0, marginBottom: '0.875rem', letterSpacing: '-0.01em',
              }}>{s.name}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1rem' }}>
                {s.whatYouSee.map((line) => (
                  <li key={line} style={{
                    fontSize: '0.8125rem', lineHeight: 1.6, color: T.text,
                    paddingLeft: '0.875rem', position: 'relative', marginBottom: '0.375rem',
                  }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, color: T.accent }}>—</span>
                    {line}
                  </li>
                ))}
              </ul>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.625rem',
                paddingTop: '0.875rem', borderTop: `1px solid ${T.border}`,
              }}>
                <span style={{
                  fontFamily: T.mono, fontSize: '0.625rem', color: T.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                }}>{s.cadence}</span>
                <Link href={link(s.surface.href)} style={{
                  fontFamily: T.mono, fontSize: '0.6875rem', color: T.accent,
                  textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{s.surface.label} →</Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Response SLAs</SectionTitle>
      <Card className="mb-6">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Step', 'Window', 'Detail'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '0.875rem 1rem',
                    fontFamily: T.mono, fontSize: '0.625rem',
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLAS.map((s) => (
                <tr key={s.step} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: T.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{s.step}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.accent, fontFamily: T.mono, whiteSpace: 'nowrap' }}>{s.window}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim, lineHeight: 1.55 }}>{s.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionTitle>How to Request an Audit</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1.25rem' }}>
          <InfoRow label="1. Self-serve surfaces" value="Sign in with the Auditor role; the four self-serve scopes are immediately available without a ticket." />
          <InfoRow label="2. Coordinated scopes" value={<>Open a request through your account team or the <Link href={link('/trust')} style={{ color: T.accent, textDecoration: 'none' }}>Trust Center</Link>; acknowledged within 1 business day.</>} />
          <InfoRow label="3. NDA-gated evidence" value="Sub-processor reports and on-site walk-throughs are released under the platform NDA; we co-sign the standard ISDA/IAPP-aligned form." />
          <InfoRow label="4. Findings & remediation" value="Findings are returned through the same case; remediation evidence is anchored on the proof ledger and visible to the auditor." />
          <InfoRow label="5. Escalation" value="Disagreement on scope, response, or remediation escalates to the Constitutional Quorum; outcome recorded in the next 90-Day Transparency Report." />
        </div>
      </Card>

      <SectionTitle>Related Surfaces</SectionTitle>
      <Card>
        <div style={{ padding: '1.25rem' }}>
          <InfoRow label="Constitution · Article V" value={<Link href={link('/constitution')} style={{ color: T.accent, textDecoration: 'none' }}>The A11oy Constitution →</Link>} />
          <InfoRow label="Security & Compliance posture" value={<Link href={link('/security-compliance')} style={{ color: T.accent, textDecoration: 'none' }}>Security and Compliance →</Link>} />
          <InfoRow label="Trust Center" value={<Link href={link('/trust')} style={{ color: T.accent, textDecoration: 'none' }}>Trust Center →</Link>} />
          <InfoRow label="Public Trust Portal" value={<Link href={link('/trust-portal')} style={{ color: T.accent, textDecoration: 'none' }}>Public Trust Portal (no login) →</Link>} />
          <InfoRow label="Compliance Compass" value={<Link href={link('/compass')} style={{ color: T.accent, textDecoration: 'none' }}>Compass · framework control map →</Link>} />
          <InfoRow label="90-Day Transparency Report" value={<Link href={link('/transparency-report')} style={{ color: T.accent, textDecoration: 'none' }}>Public report stream →</Link>} />
        </div>
      </Card>
    </Layout>
  );
}
