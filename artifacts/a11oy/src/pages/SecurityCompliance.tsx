import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = '/api';
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

type Cert = {
  name: string;
  framework: string;
  status: 'in-place' | 'attested' | 'in-progress' | 'roadmap';
  scope: string;
  refresh: string;
  evidence: string;
};

const CERTS: Cert[] = [
  { name: 'SOC 2 Type II', framework: 'AICPA TSC', status: 'attested', scope: 'Security · Availability · Confidentiality', refresh: 'Annual · next 2026-09', evidence: 'Trust Exchange · NDA' },
  { name: 'ISO/IEC 27001:2022', framework: 'ISO', status: 'attested', scope: 'A11oy platform · sub-processors', refresh: 'Surveillance audit annual', evidence: 'Trust Exchange · NDA' },
  { name: 'ISO/IEC 42001:2023', framework: 'ISO AI Management', status: 'in-progress', scope: 'A11oy AI management system', refresh: 'Stage-2 audit Q3 2026', evidence: 'Compass dashboard' },
  { name: 'EU AI Act conformance', framework: 'Regulation (EU) 2024/1689', status: 'in-place', scope: 'High-risk + GPAI obligations', refresh: 'Continuous control mapping', evidence: 'Compass · Trust Exchange' },
  { name: 'NIST AI RMF 1.0', framework: 'NIST', status: 'in-place', scope: 'Govern · Map · Measure · Manage', refresh: 'Quarterly self-attestation', evidence: 'Compass dashboard' },
  { name: 'CSA AI Trustworthy Pledge', framework: 'CSA AICM', status: 'attested', scope: 'Agentic profile control set', refresh: 'Annual self-assessment', evidence: 'Public Trust Portal' },
  { name: 'HIPAA technical safeguards', framework: 'HHS 45 CFR 164.312', status: 'in-place', scope: 'PHI-handling tenants only', refresh: 'BAA on file · annual review', evidence: 'Trust Exchange · BAA' },
  { name: 'StateRAMP Moderate alignment', framework: 'StateRAMP', status: 'in-progress', scope: 'GovCloud isolation tenancy', refresh: '3PAO assessment Q4 2026', evidence: 'Sovereign tenancy briefing' },
];

type ControlDomain = {
  id: string;
  name: string;
  posture: string;
  controls: { name: string; detail: string }[];
};

const DOMAINS: ControlDomain[] = [
  {
    id: 'crypto',
    name: 'Cryptography & Key Management',
    posture: 'Hybrid-PQC by default; classical fallback only on legacy connectors with recorded exceptions.',
    controls: [
      { name: 'Data at rest', detail: 'AES-256-GCM with envelope encryption; per-tenant data-encryption keys.' },
      { name: 'Data in transit', detail: 'TLS 1.3; ML-KEM-1024 hybrid where peer supports; mTLS for agent-to-agent.' },
      { name: 'Secrets', detail: 'Sealed in HSM-backed vault; access requires authenticated session + covenant policy.' },
      { name: 'Signing', detail: 'ML-DSA-65 for proof-ledger signatures (hybrid w/ Ed25519 during transition).' },
      { name: 'Key rotation', detail: 'Tenant DEK ≤ 90 days · KEK ≤ 365 days · platform signing ≤ 180 days; rotation events on the proof ledger.' },
    ],
  },
  {
    id: 'access',
    name: 'Identity & Access',
    posture: 'Zero-trust by construction. No agent or operator carries standing credentials beyond compartment scope.',
    controls: [
      { name: 'Operator MFA', detail: 'WebAuthn required; TOTP fallback with session-scoped policy override.' },
      { name: 'SSO', detail: 'SAML 2.0 + OIDC; SCIM 2.0 for provisioning.' },
      { name: 'Agent identity', detail: 'Workload identities issued via Agent Identity Registry; PUF-bound on hardware-trust tier.' },
      { name: 'Just-in-time elevation', detail: 'Operator privilege escalations require typed approval and expire ≤ 4h.' },
      { name: 'Session', detail: 'Server-side revocation; toast-driven client refresh; idle ≤ 30m, hard ceiling 12h.' },
    ],
  },
  {
    id: 'data',
    name: 'Data Handling & Residency',
    posture: 'Data residency is contractual. No cross-region replication without an authored covenant policy.',
    controls: [
      { name: 'Regions', detail: 'us-east, us-gov, eu-central, ap-southeast; Sovereign tenancy is single-region.' },
      { name: 'Tenant isolation', detail: 'Per-tenant DEK, per-tenant connector firewall scopes, hardware compartment on premium tier.' },
      { name: 'PII tagging', detail: 'Automatic detection on ingress; redaction policies enforced before model invocation.' },
      { name: 'Retention', detail: 'Configurable 30 days – 7 years; legal hold supported.' },
      { name: 'Deletion', detail: 'Right-to-delete fulfilled within 30 days; tombstone retained on the proof ledger.' },
    ],
  },
  {
    id: 'platform',
    name: 'Platform Security',
    posture: 'Defense in depth across host, network, application, and agent compartment layers.',
    controls: [
      { name: 'Network', detail: 'Egress allow-list per connector; private endpoints for sub-processors.' },
      { name: 'Container', detail: 'Distroless images, signed via cosign, attested in supply-chain ledger.' },
      { name: 'Vuln management', detail: 'CVE SLA · critical 24h, high 7d, medium 30d; auto-PR via Dependabot/Renovate.' },
      { name: 'SAST/DAST', detail: 'Pre-merge SAST + secret scan; nightly DAST with proof-ledger-anchored findings.' },
      { name: 'SBOM', detail: 'CycloneDX SBOM published per release; Agent-BOM published per agent class.' },
    ],
  },
  {
    id: 'agent',
    name: 'Agent Safety & Alignment',
    posture: 'No model runs in production without passing the Alignment Review Gate. Bypass is impossible.',
    controls: [
      { name: 'Pre-promotion eval', detail: 'MirrorEval, Robustness Wall, Constitution test suite required to pass.' },
      { name: 'Reward-hacking watchdog', detail: 'Behavioral Audit + Verifier Agent flag deceptive or shortcut reasoning.' },
      { name: 'Red-team', detail: 'Continuous adversarial probes; findings anchored on the proof ledger.' },
      { name: 'Welfare', detail: 'Agent telemetry monitored; intervention playbooks on signal thresholds.' },
      { name: 'Kill-switch', detail: 'Per-agent and platform-wide; recorded on actuation; no silent reactivation.' },
    ],
  },
  {
    id: 'incident',
    name: 'Incident Response & Disclosure',
    posture: 'Acknowledge fast, communicate often, disclose under embargo only when there is an active in-the-wild exploit.',
    controls: [
      { name: 'Detection', detail: '24/7 SOC; mean time to detect P1 ≤ 15 minutes (rolling 90-day).' },
      { name: 'Notification SLA', detail: 'Customer notification within 24h of confirmed material incident; written follow-up within 72h.' },
      { name: 'Coordinated disclosure', detail: 'CAVD anchored intake within 24h; staged public disclosure on remediation.' },
      { name: 'Post-mortem', detail: 'Public-facing PMI within 14d for P1; internal RCA within 7d for all severities.' },
      { name: 'Drills', detail: 'Quarterly tabletop + annual chaos exercise; results in 90-Day Transparency Report.' },
    ],
  },
];

const STATUS_LABELS: Record<Cert['status'], { label: string; status: 'ok' | 'info' | 'warn' }> = {
  attested: { label: 'ATTESTED', status: 'ok' },
  'in-place': { label: 'IN PLACE', status: 'ok' },
  'in-progress': { label: 'IN PROGRESS', status: 'info' },
  roadmap: { label: 'ROADMAP', status: 'warn' },
};

interface PQCStatus {
  signingMode?: string;
  algorithms?: { classical: string; postQuantum: string; hybrid: string };
  ca?: { certificates?: { totalActive: number } };
}

export function SecurityCompliance() {
  const attested = CERTS.filter((c) => c.status === 'attested' || c.status === 'in-place').length;
  const [pqcStatus, setPqcStatus] = useState<PQCStatus | null>(null);
  const [vspCoverage, setVspCoverage] = useState<{
    spansEmittedLastHour: number;
    coveragePercentLastHour: number | null;
    otlpExportHealth: string;
    spansFailedLastHour: number;
  } | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [coverage, setCoverage] = useState<{
    totalEvents: number;
    totalAttested: number;
    totalLegacySigned: number;
    totalQuarantined: number;
    coveragePct: number;
    updatedAt?: string;
  } | null>(null);
  const [quarantineRows, setQuarantineRows] = useState<Array<{
    id: number;
    eventId: number;
    orgId: number | null;
    failureReason: string;
    decision: string;
    quarantinedAt: string;
  }>>([]);

  useEffect(() => {
    fetch(`${API_BASE}/pqc/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.data) setPqcStatus(data.data); })
      .catch(() => {});
    fetch(`${API_BASE}/audit-chain/attestation/coverage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.data) setCoverage(data.data); })
      .catch(() => {});
    fetch(`${API_BASE}/audit-chain/attestation/quarantine?decision=pending&limit=10`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.data?.rows) setQuarantineRows(data.data.rows); })
      .catch(() => {});
    fetch(`${API_BASE}/vsp/coverage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.data) setVspCoverage(data.data); })
      .catch(() => {});
  }, []);

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const body: Record<string, string> = {};
      if (verifyInput.startsWith('did:')) body.did = verifyInput;
      else if (verifyInput.startsWith('cert-')) body.certId = verifyInput;
      else body.certThumbprint = verifyInput;
      const r = await fetch(`${API_BASE}/pqc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      setVerifyResult(data?.data ?? data);
    } catch {
      setVerifyResult({ error: 'Verification request failed' });
    }
    setVerifyLoading(false);
  };

  return (
    <Layout>
      <PageHeader
        label="TRUST · SECURITY & COMPLIANCE"
        title="Security and Compliance"
        subtitle="The runtime posture of the A11oy platform. Frameworks, controls, and SLAs the platform commits to and the surfaces where each commitment is observable."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="ATTESTATIONS" value={`${attested}/${CERTS.length}`} sub="active or in-place" accent={T.accent} />
        <KpiCard label="P1 NOTIFY SLA" value="≤ 24h" sub="confirmed material" accent={T.accent} />
        <KpiCard label="CVE · CRITICAL" value="≤ 24h" sub="patch SLA" accent={T.accent} />
        <KpiCard label="SIGNING" value={pqcStatus?.signingMode?.toUpperCase() ?? 'HYBRID-PQC'} sub="Ed25519 + ML-DSA-65" accent={T.accent} />
        <KpiCard
          label="VSP COVERAGE"
          value={vspCoverage?.coveragePercentLastHour != null ? `${vspCoverage.coveragePercentLastHour}%` : '—'}
          sub="Λ-gate spans verified · 1h"
          accent={T.accent}
        />
        <KpiCard
          label="VSP SPANS · 1H"
          value={vspCoverage ? String(vspCoverage.spansEmittedLastHour) : '—'}
          sub={vspCoverage ? `${vspCoverage.spansFailedLastHour} failed · OTLP ${vspCoverage.otlpExportHealth}` : 'OTel GenAI v1.37 emitted'}
          accent={T.accent}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="HYBRID COVERAGE"
          value={coverage ? `${coverage.coveragePct.toFixed(1)}%` : '—'}
          sub={coverage ? `${coverage.totalAttested.toLocaleString()} attested / ${coverage.totalEvents.toLocaleString()} events` : 'loading'}
          accent={T.accent}
        />
        <KpiCard
          label="LEGACY HYBRID"
          value={coverage ? coverage.totalLegacySigned.toLocaleString() : '—'}
          sub="events natively hybrid-signed"
          accent={T.accent}
        />
        <KpiCard
          label="BACKFILLED"
          value={coverage ? coverage.totalAttested.toLocaleString() : '—'}
          sub="parallel attestation appended"
          accent={T.accent}
        />
        <KpiCard
          label="QUARANTINE"
          value={coverage ? coverage.totalQuarantined.toLocaleString() : '—'}
          sub={quarantineRows.length > 0 ? `${quarantineRows.length} pending review` : 'awaiting operator review'}
          accent={T.accent}
        />
      </div>

      {quarantineRows.length > 0 && (
        <>
          <SectionTitle>Attestation Quarantine</SectionTitle>
          <Card className="mb-6">
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontFamily: T.serif, fontSize: '0.875rem', color: T.textDim, margin: 0 }}>
                Historical audit_chain_events rows that failed the integrity guard during hybrid backfill.
                Each row needs an admin decision: <strong>accepted</strong> (with justification),
                <strong> known_bad</strong>, or <strong>escalated</strong>. Quarantined rows are never silently attested.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Event', 'Org', 'Failure', 'Decision', 'Quarantined'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0.75rem 1rem',
                        fontFamily: T.mono, fontSize: '0.625rem',
                        color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quarantineRows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: T.text, fontFamily: T.mono }}>#{r.eventId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{r.orgId ?? 'platform'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: T.textDim, fontFamily: T.mono }}>{r.failureReason}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <StatusBadge status={r.decision === 'pending' ? 'warn' : 'info'} label={r.decision.toUpperCase()} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono }}>
                        {new Date(r.quarantinedAt).toISOString().slice(0, 19).replace('T', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <SectionTitle>Verifiable Span Protocol (VSP)</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontFamily: T.serif, fontSize: '0.9375rem', lineHeight: 1.7, color: T.text, margin: 0, marginBottom: '0.75rem' }}>
            Every Λ-gate evaluation emits an OpenTelemetry GenAI v1.37 span whose
            <code style={{ fontFamily: T.mono, fontSize: '0.8125rem', color: T.accent, padding: '0 0.25rem' }}>trace_id</code>
            is derived from the proof-chain receipt hash. Anyone holding a receipt can verify
            the trace against the public verification API — without access to SZL internal systems.
          </p>
          <InfoRow label="Span schema" value="OpenTelemetry GenAI Semantic Conventions v1.37" />
          <InfoRow label="Trace identity" value="trace_id = receipt_hash[:16]" />
          <InfoRow label="Λ-vector axes" value="9 axes stamped as gen_ai.lambda.* attributes" />
          <InfoRow label="ρ-closure event" value="byte_identical + chain_root recorded as span event" />
          <InfoRow label="Library" value="@szl-holdings/vsp-otel (TypeScript + Python verifier)" />
          <InfoRow label="Supported sinks" value="Langfuse · Arize Phoenix · Honeycomb · Datadog (OTLP/gRPC + OTLP/HTTP)" />
        </div>
      </Card>

      <Card className="mb-6">
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: T.serif, fontSize: '1rem', lineHeight: 1.7, color: T.text, margin: 0, marginBottom: '0.75rem' }}>
            Security is not a posture page. It is the runtime layer between every signal and every executed decision.
          </p>
          <p style={{ fontFamily: T.serif, fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
            Each control below is observable on a runtime surface. Each framework below is mapped, control-by-control, in the Compliance Compass. Customers may inspect their own evidence at any time through the Right to Audit.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <Link href={link('/compass')} style={{ textDecoration: 'none' }}>
              <StatusBadge status="ok" label="COMPASS · CONTROL MAP" />
            </Link>
            <Link href={link('/right-to-audit')} style={{ textDecoration: 'none' }}>
              <StatusBadge status="info" label="RIGHT TO AUDIT" />
            </Link>
            <Link href={link('/trust-portal')} style={{ textDecoration: 'none' }}>
              <StatusBadge status="info" label="PUBLIC TRUST PORTAL" />
            </Link>
          </div>
        </div>
      </Card>

      <SectionTitle>Attestations & Frameworks</SectionTitle>
      <Card className="mb-6">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Standard', 'Framework', 'Status', 'Scope', 'Refresh', 'Evidence'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '0.875rem 1rem',
                    fontFamily: T.mono, fontSize: '0.625rem',
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CERTS.map((c) => {
                const sl = STATUS_LABELS[c.status];
                return (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: T.text, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{c.framework}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={sl.status} label={sl.label} /></td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{c.scope}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{c.refresh}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: T.textDim }}>{c.evidence}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionTitle>Control Domains</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {DOMAINS.map((d) => (
          <Card key={d.id}>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span style={{
                  fontFamily: T.mono, fontSize: '0.625rem', letterSpacing: '0.14em',
                  color: T.accent, textTransform: 'uppercase',
                }}>{d.id}</span>
              </div>
              <h3 style={{
                fontFamily: T.serif, fontSize: '1.1875rem', fontWeight: 400,
                color: T.text, margin: 0, marginBottom: '0.625rem', letterSpacing: '-0.01em',
              }}>{d.name}</h3>
              <p style={{
                fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim,
                margin: 0, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${T.border}`,
              }}>{d.posture}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {d.controls.map((c) => (
                  <div key={c.name}>
                    <div style={{
                      fontFamily: T.mono, fontSize: '0.625rem', color: T.accent,
                      textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.1875rem',
                    }}>{c.name}</div>
                    <div style={{ fontSize: '0.8125rem', lineHeight: 1.55, color: T.text }}>{c.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>PQC Identity Verification</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0, marginBottom: '1rem' }}>
            Verify a proof, certificate, or DID against the live PQC identity stack. Enter a DID (did:web:... or did:key:...), certificate ID (cert-...), or certificate thumbprint.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="did:key:z... or cert-... or thumbprint"
              style={{
                flex: 1, padding: '0.625rem 0.875rem',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.text, fontFamily: T.mono, fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleVerify}
              disabled={verifyLoading || !verifyInput.trim()}
              style={{
                padding: '0.625rem 1.25rem', background: 'rgba(201,183,135,0.12)',
                border: `1px solid rgba(201,183,135,0.3)`, borderRadius: 8,
                fontFamily: T.mono, fontSize: '0.6875rem', color: T.accent,
                textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
                opacity: verifyLoading ? 0.5 : 1,
              }}
            >
              {verifyLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {verifyResult && (
            <pre style={{
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '1rem', overflow: 'auto', maxHeight: '300px',
              fontFamily: T.mono, fontSize: '0.75rem', color: T.textDim,
            }}>
              {JSON.stringify(verifyResult, null, 2)}
            </pre>
          )}
        </div>
      </Card>

      {pqcStatus && (
        <>
          <SectionTitle>PQC Stack Status</SectionTitle>
          <Card className="mb-6">
            <div style={{ padding: '1.25rem' }}>
              <InfoRow label="Signing mode" value={pqcStatus.signingMode ?? 'hybrid'} />
              <InfoRow label="Classical algorithm" value={pqcStatus.algorithms?.classical ?? 'Ed25519'} />
              <InfoRow label="Post-quantum algorithm" value={pqcStatus.algorithms?.postQuantum ?? 'ML-DSA-65 (FIPS 204)'} />
              <InfoRow label="Hybrid scheme" value={pqcStatus.algorithms?.hybrid ?? 'Ed25519 + ML-DSA-65 concatenated'} />
              <InfoRow label="Active certificates" value={String(pqcStatus.ca?.certificates?.totalActive ?? 0)} />
            </div>
          </Card>
        </>
      )}

      <SectionTitle>Sub-processors & Supply Chain</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1.25rem' }}>
          <InfoRow label="Sub-processor list" value={<Link href={link('/agent-bom')} style={{ color: T.accent, textDecoration: 'none' }}>Agent-BOM (CycloneDX) →</Link>} />
          <InfoRow label="Sub-processor change notice" value="30 days advance written notice to customers; right of objection per DPA" />
          <InfoRow label="Hardware-trust posture" value={<Link href={link('/compartments')} style={{ color: T.accent, textDecoration: 'none' }}>Capability Compartments →</Link>} />
          <InfoRow label="Connector firewall scopes" value={<Link href={link('/connectors')} style={{ color: T.accent, textDecoration: 'none' }}>Connector Firewall →</Link>} />
          <InfoRow label="Supply-chain attestation" value={<Link href={link('/supply-chain')} style={{ color: T.accent, textDecoration: 'none' }}>Supply Chain →</Link>} />
        </div>
      </Card>

      <SectionTitle>Coordinated Disclosure & Defender Program</SectionTitle>
      <Card>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.text, margin: 0, marginBottom: '1rem' }}>
            Vulnerabilities, model failures, and policy circumventions are intake under the Coordinated Agent Vulnerability Disclosure (CAVD) program. Anchored intake within 24 hours; staged public disclosure on remediation; defender credit pool active.
          </p>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link href={link('/cavd')} style={{
              padding: '0.625rem 1rem', background: 'rgba(201,183,135,0.08)',
              border: `1px solid rgba(201,183,135,0.25)`, borderRadius: 8,
              fontFamily: T.mono, fontSize: '0.6875rem', color: T.accent,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>CAVD Intake →</Link>
            <Link href={link('/defender-credits')} style={{
              padding: '0.625rem 1rem', background: 'transparent',
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontFamily: T.mono, fontSize: '0.6875rem', color: T.text,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>Defender Credit Pool →</Link>
            <Link href={link('/transparency-report')} style={{
              padding: '0.625rem 1rem', background: 'transparent',
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontFamily: T.mono, fontSize: '0.6875rem', color: T.text,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>90-Day Report →</Link>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
