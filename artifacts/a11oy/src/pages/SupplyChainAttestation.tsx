import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SUPPLY_CHAIN, DARPA_PROGRAMS, fmtPct, DARPA_VERSION } from '../data/darpaResilience';
import { DefenseCrossNav, DefenseLink, type DefensePageId } from '../components/DefenseCrossNav';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const TYPE_COLORS: Record<string, string> = {
  model: '#3b82f6', tool: '#10b981', connector: '#f59e0b', skill: '#8b5cf6', constitution: '#c9b787', runtime: '#06b6d4',
};

const ATTEST_COLORS: Record<string, string> = {
  attested: '#10b981', pending: '#f59e0b', failed: '#ef4444', exempt: '#8a8a8a',
};

interface SaaSAttackMetric {
  id: string;
  name: string;
  category: string;
  growthFactor: string;
  incidents2024: number;
  incidents2026: number;
  description: string;
  a11oyMitigation: string;
}

const SAAS_ATTACK_METRICS: SaaSAttackMetric[] = [
  { id: 'SAM-001', name: 'OAuth Token Hijacking', category: 'Credential Abuse', growthFactor: '4.2x', incidents2024: 847, incidents2026: 3557, description: 'Adversaries steal OAuth tokens from SaaS integrations to impersonate legitimate applications and access downstream APIs.', a11oyMitigation: 'Agent Zero Trust — ephemeral OAuth tokens with 1-hour max lifetime + continuous behavioral validation' },
  { id: 'SAM-002', name: 'API Key Exfiltration', category: 'Credential Abuse', growthFactor: '3.1x', incidents2024: 1243, incidents2026: 3853, description: 'Hardcoded or leaked API keys in CI/CD pipelines, repositories, and config files exploited for unauthorized access.', a11oyMitigation: 'Connector Firewall — API key rotation enforcement + secret scanning + vault-backed credential management' },
  { id: 'SAM-003', name: 'SaaS-to-SaaS Lateral Movement', category: 'Supply Chain', growthFactor: '5.7x', incidents2024: 312, incidents2026: 1778, description: 'Compromised SaaS application used as pivot point to access connected SaaS platforms through authorized integrations.', a11oyMitigation: 'Supply Chain Attestation — connector isolation + cross-service authorization gates + blast radius containment' },
  { id: 'SAM-004', name: 'Consent Phishing', category: 'OAuth Abuse', growthFactor: '3.8x', incidents2024: 567, incidents2026: 2155, description: 'Adversaries trick users into granting OAuth consent to malicious applications that then access organizational data.', a11oyMitigation: 'Covenant Gate — OAuth consent review gate + application allowlisting + scope limitation enforcement' },
  { id: 'SAM-005', name: 'Shadow SaaS Integration', category: 'Supply Chain', growthFactor: '2.9x', incidents2024: 892, incidents2026: 2587, description: 'Unauthorized SaaS integrations installed by employees bypass security controls and create unmonitored data flows.', a11oyMitigation: 'Connector inventory + continuous attestation pipeline — unapproved integrations blocked at registration' },
  { id: 'SAM-006', name: 'MCP Tool Server Compromise', category: 'Agent-Specific', growthFactor: '8.4x', incidents2024: 24, incidents2026: 202, description: 'Agentic AI tool servers compromised to inject malicious tool responses, redirect agent actions, or exfiltrate context.', a11oyMitigation: 'MCP token scoping + tool server attestation + response validation against behavioral baselines' },
];

interface VendorRisk {
  id: string;
  vendor: string;
  category: string;
  riskScore: number;
  oauthScopes: number;
  dataAccess: string;
  lastAttestation: string;
  complianceCerts: string[];
  status: 'approved' | 'review' | 'restricted' | 'blocked';
}

const VENDOR_RISKS: VendorRisk[] = [
  { id: 'VR-001', vendor: 'OpenAI API', category: 'AI/ML Provider', riskScore: 32, oauthScopes: 4, dataAccess: 'Prompt + Response', lastAttestation: '2026-04-25', complianceCerts: ['SOC2', 'ISO27001'], status: 'approved' },
  { id: 'VR-002', vendor: 'Anthropic API', category: 'AI/ML Provider', riskScore: 28, oauthScopes: 3, dataAccess: 'Prompt + Response', lastAttestation: '2026-04-24', complianceCerts: ['SOC2', 'ISO27001'], status: 'approved' },
  { id: 'VR-003', vendor: 'AIS Live Data', category: 'Maritime Intel', riskScore: 41, oauthScopes: 5, dataAccess: 'Vessel Positions + ETA', lastAttestation: '2026-04-20', complianceCerts: ['SOC2'], status: 'approved' },
  { id: 'VR-004', vendor: 'Bloomberg Terminal API', category: 'Financial Data', riskScore: 22, oauthScopes: 6, dataAccess: 'Market Data + News', lastAttestation: '2026-04-22', complianceCerts: ['SOC2', 'ISO27001', 'FINRA'], status: 'approved' },
  { id: 'VR-005', vendor: 'Salesforce CRM', category: 'CRM/Sales', riskScore: 38, oauthScopes: 12, dataAccess: 'Contacts + Deals + Pipeline', lastAttestation: '2026-04-18', complianceCerts: ['SOC2', 'ISO27001', 'StateRAMP'], status: 'approved' },
  { id: 'VR-006', vendor: 'GitHub Copilot', category: 'Dev Tools', riskScore: 45, oauthScopes: 8, dataAccess: 'Source Code + Repos', lastAttestation: '2026-04-15', complianceCerts: ['SOC2'], status: 'review' },
  { id: 'VR-007', vendor: 'Unknown MCP Server', category: 'Agent Tools', riskScore: 92, oauthScopes: 0, dataAccess: 'Unrestricted Tool Access', lastAttestation: '—', complianceCerts: [], status: 'blocked' },
  { id: 'VR-008', vendor: 'AWS Bedrock', category: 'AI/ML Provider', riskScore: 25, oauthScopes: 4, dataAccess: 'Inference Only', lastAttestation: '2026-04-23', complianceCerts: ['SOC2', 'ISO27001', 'StateRAMP', 'HIPAA'], status: 'approved' },
];

const ATTESTATION_PIPELINE = [
  { stage: 'Registration', description: 'New component or vendor registered in supply chain inventory', status: 'automated', checks: ['Identity verification', 'Initial risk scoring', 'Compliance cert validation'] },
  { stage: 'SBOM Generation', description: 'Software Bill of Materials generated and cryptographically signed', status: 'automated', checks: ['Dependency enumeration', 'License compliance', 'Known CVE scan'] },
  { stage: 'Multi-Signatory Attestation', description: 'Multiple authorized signatories verify component integrity', status: 'human-gated', checks: ['Code review sign-off', 'Security review sign-off', 'Compliance review sign-off'] },
  { stage: 'Continuous Monitoring', description: 'Real-time monitoring of attested components for drift or compromise', status: 'automated', checks: ['Hash verification (hourly)', 'Behavioral baseline comparison', 'CVE feed monitoring'] },
  { stage: 'Re-attestation', description: 'Periodic full re-attestation based on risk tier', status: 'scheduled', checks: ['Tier-1: 7-day cycle', 'Tier-2: 14-day cycle', 'Tier-3: 30-day cycle'] },
];

const VENDOR_STATUS_COLORS: Record<string, string> = { approved: '#10b981', review: '#f59e0b', restricted: '#f59e0b', blocked: '#ef4444' };

export function SupplyChainAttestation() {
  const [view, setView] = useState<'attestation' | 'saas-threats' | 'vendor-risk' | 'pipeline'>('attestation');

  const attested = SUPPLY_CHAIN.filter(c => c.attestationStatus === 'attested').length;
  const totalVulns = SUPPLY_CHAIN.reduce((a, c) => a + c.vulnerabilities.critical + c.vulnerabilities.high, 0);
  const avgIntegrity = SUPPLY_CHAIN.reduce((a, c) => a + c.integrityScore, 0) / SUPPLY_CHAIN.length;
  const totalSignatories = SUPPLY_CHAIN.reduce((a, c) => a + c.signatoryCount, 0);
  const socialCyber = DARPA_PROGRAMS.find(p => p.id === 'socialcyber')!;
  const totalSaaSIncidents = SAAS_ATTACK_METRICS.reduce((a, m) => a + m.incidents2026, 0);

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Supply Chain Attestation"
        subtitle="SocialCyber-inspired — dependency integrity graph, SBOM compliance, multi-signatory attestation, SaaS attack defense (3.8x growth), OAuth abuse tracking, and vendor risk scoring."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="ATTESTED" value={`${attested}/${SUPPLY_CHAIN.length}`} sub="components verified" accent={T.accent} />
        <KpiCard label="CRITICAL+HIGH" value={totalVulns.toString()} sub="open vulnerabilities" accent={totalVulns > 0 ? '#ef4444' : T.accent} />
        <KpiCard label="INTEGRITY" value={fmtPct(avgIntegrity)} sub="mean integrity score" accent={T.accent} />
        <KpiCard label="SAAS ATTACK GROWTH" value="3.8x" sub="since 2024" accent="#ef4444" />
        <KpiCard label="VENDOR RISK SCORES" value={VENDOR_RISKS.length.toString()} sub="vendors assessed" accent={T.accent} />
        <KpiCard label="SIGNATORIES" value={totalSignatories.toString()} sub="attestation signatures" accent={T.dim} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['attestation', 'saas-threats', 'vendor-risk', 'pipeline'] as const).map(tab => (
          <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {view === 'attestation' && (
        <>
          <Card className="mb-6 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T.accent }} />
              <span className="text-xs font-mono" style={{ color: T.dim }}>DARPA PROGRAM REFERENCE</span>
            </div>
            <div className="text-sm mb-1" style={{ color: T.text }}>{socialCyber.fullName}</div>
            <div className="text-xs" style={{ color: T.dim }}>Office: {socialCyber.office}</div>
            <div className="text-xs mt-2" style={{ color: T.muted }}>{socialCyber.innovation}</div>
          </Card>

          <SectionTitle>Component Type Distribution</SectionTitle>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            {Object.entries(TYPE_COLORS).map(([type, color]) => {
              const count = SUPPLY_CHAIN.filter(c => c.type === type).length;
              return (
                <Card key={type} className="p-3 text-center">
                  <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
                  <div className="text-xs font-mono" style={{ color }}>{type}</div>
                  <div className="text-lg font-mono font-bold mt-1" style={{ color: T.text }}>{count}</div>
                </Card>
              );
            })}
          </div>

          <SectionTitle>Attestation Chain</SectionTitle>
          <div className="space-y-3 mb-8">
            {SUPPLY_CHAIN.map(component => (
              <Card key={component.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono" style={{ color: T.dim }}>{component.id}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: TYPE_COLORS[component.type] + '15', color: TYPE_COLORS[component.type] }}>
                        {component.type}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: ATTEST_COLORS[component.attestationStatus] + '15', color: ATTEST_COLORS[component.attestationStatus] }}>
                        {component.attestationStatus}
                      </span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: T.text }}>{component.name}</div>
                    <div className="text-xs" style={{ color: T.dim }}>v{component.version}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-bold" style={{ color: component.integrityScore >= 0.99 ? T.accent : component.integrityScore >= 0.95 ? T.text : '#ef4444' }}>
                      {fmtPct(component.integrityScore)}
                    </div>
                    <div className="text-xs" style={{ color: T.dim }}>integrity</div>
                  </div>
                </div>

                <div className="p-3 rounded mb-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="text-xs font-mono" style={{ color: T.dim }}>PROVENANCE CHAIN</div>
                  <div className="text-xs font-mono mt-1" style={{ color: T.accent }}>{component.provenance}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs" style={{ color: T.dim }}>SBOM Hash</div>
                    <div className="text-xs font-mono" style={{ color: T.text }}>{component.sbomHash}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: T.dim }}>Signatories</div>
                    <div className="text-sm font-mono" style={{ color: T.text }}>{component.signatoryCount}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: T.dim }}>Last Audit</div>
                    <div className="text-sm font-mono" style={{ color: T.text }}>{component.lastAudit}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: T.dim }}>Vulnerabilities</div>
                    <div className="flex gap-2">
                      {component.vulnerabilities.critical > 0 && <span className="text-xs font-mono" style={{ color: '#ef4444' }}>C:{component.vulnerabilities.critical}</span>}
                      {component.vulnerabilities.high > 0 && <span className="text-xs font-mono" style={{ color: '#f59e0b' }}>H:{component.vulnerabilities.high}</span>}
                      {component.vulnerabilities.medium > 0 && <span className="text-xs font-mono" style={{ color: '#3b82f6' }}>M:{component.vulnerabilities.medium}</span>}
                      <span className="text-xs font-mono" style={{ color: T.dim }}>L:{component.vulnerabilities.low}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === 'saas-threats' && (
        <>
          <SectionTitle>SaaS Supply Chain Attack Metrics — 3.8x Growth</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            SaaS supply chain attacks have grown 3.8x since 2024, driven by OAuth token abuse, API key exfiltration, and shadow SaaS integrations. MCP tool server compromise is the fastest-growing vector at 8.4x.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-2xl font-mono font-bold" style={{ color: '#ef4444' }}>3.8x</div>
              <div className="text-xs font-medium" style={{ color: T.text }}>Overall SaaS Attack Growth</div>
              <div className="text-[9px] mt-1" style={{ color: T.muted }}>2024 → 2026 compound growth rate</div>
            </Card>
            <Card>
              <div className="text-2xl font-mono font-bold" style={{ color: '#ef4444' }}>{totalSaaSIncidents.toLocaleString()}</div>
              <div className="text-xs font-medium" style={{ color: T.text }}>Total SaaS Incidents (2026)</div>
              <div className="text-[9px] mt-1" style={{ color: T.muted }}>across {SAAS_ATTACK_METRICS.length} attack categories</div>
            </Card>
            <Card>
              <div className="text-2xl font-mono font-bold" style={{ color: '#ef4444' }}>8.4x</div>
              <div className="text-xs font-medium" style={{ color: T.text }}>MCP Server Compromise Growth</div>
              <div className="text-[9px] mt-1" style={{ color: T.muted }}>fastest-growing agent-specific vector</div>
            </Card>
          </div>

          <div className="space-y-3 mb-8">
            {SAAS_ATTACK_METRICS.map(metric => (
              <Card key={metric.id} style={{ borderLeft: `3px solid #ef4444` }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{metric.id}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{metric.category}</span>
                    </div>
                    <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{metric.name}</div>
                    <p className="text-[10px]" style={{ color: T.dim }}>{metric.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xl font-mono font-bold" style={{ color: '#ef4444' }}>{metric.growthFactor}</div>
                    <div className="text-[9px] font-mono" style={{ color: T.muted }}>growth</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div>
                    <div className="text-[9px] font-mono" style={{ color: T.muted }}>2024 INCIDENTS</div>
                    <div className="text-xs font-mono" style={{ color: T.dim }}>{metric.incidents2024.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono" style={{ color: T.muted }}>2026 INCIDENTS</div>
                    <div className="text-xs font-mono" style={{ color: '#ef4444' }}>{metric.incidents2026.toLocaleString()}</div>
                  </div>
                </div>
                <div className="p-2 rounded mt-2 flex items-start justify-between gap-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                  <div>
                    <span className="text-[9px] font-mono" style={{ color: T.accent }}>A11OY MITIGATION:</span>
                    <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{metric.a11oyMitigation}</span>
                  </div>
                  {(() => {
                    const target: DefensePageId | null =
                      /Agent Zero Trust|ephemeral|OAuth token/i.test(metric.a11oyMitigation) ? 'agent-zero-trust' :
                      /Connector Firewall|connector|MCP/i.test(metric.a11oyMitigation) ? 'agent-zero-trust' :
                      /attestation|inventory/i.test(metric.a11oyMitigation) ? 'atlas-shield' :
                      'adversarial';
                    const label =
                      target === 'agent-zero-trust' ? 'Agent Zero Trust →' :
                      target === 'atlas-shield' ? 'ATLAS Shield →' :
                      'Adversarial Resilience →';
                    return (
                      <DefenseLink to={target} title="View related defense page">
                        <span className="text-[9px] whitespace-nowrap">{label}</span>
                      </DefenseLink>
                    );
                  })()}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === 'vendor-risk' && (
        <>
          <SectionTitle>Vendor Dependency Risk Scores</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Every third-party vendor and SaaS integration is continuously scored for risk based on OAuth scope breadth, data access level, compliance certifications, and attestation freshness.
          </p>
          <div className="rounded-lg overflow-hidden mb-6" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Vendor', 'Category', 'Risk Score', 'OAuth Scopes', 'Data Access', 'Last Attested', 'Certs', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDOR_RISKS.map(vendor => (
                  <tr key={vendor.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: T.text }}>{vendor.vendor}</td>
                    <td className="px-3 py-2.5"><span className="text-[9px] font-mono" style={{ color: T.dim }}>{vendor.category}</span></td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold" style={{ color: vendor.riskScore >= 80 ? '#ef4444' : vendor.riskScore >= 50 ? '#f59e0b' : vendor.riskScore >= 30 ? T.accent : '#10b981' }}>{vendor.riskScore}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: vendor.oauthScopes >= 8 ? '#f59e0b' : T.dim }}>{vendor.oauthScopes}</td>
                    <td className="px-3 py-2.5 text-[10px]" style={{ color: T.dim }}>{vendor.dataAccess}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>{vendor.lastAttestation}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {vendor.complianceCerts.length > 0 ? vendor.complianceCerts.map(cert => (
                          <span key={cert} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{cert}</span>
                        )) : <span className="text-[8px] font-mono" style={{ color: '#ef4444' }}>none</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${VENDOR_STATUS_COLORS[vendor.status]}15`, color: VENDOR_STATUS_COLORS[vendor.status] }}>{vendor.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>OAUTH SCOPE GOVERNANCE</div>
            <div className="space-y-2 text-[10px]">
              {[
                'All OAuth integrations require explicit scope approval — no wildcard grants',
                'Scope creep detection: alerts when vendors request additional scopes beyond initial grant',
                'Dormant scope revocation: unused scopes automatically revoked after 30 days',
                'High-risk scopes (write access, admin) require CISO approval',
                'OAuth token lifetime enforced: maximum 1 hour for SaaS, 15 minutes for agent contexts',
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2">
                  <span style={{ color: T.accent }}>✓</span>
                  <span style={{ color: T.dim }}>{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {view === 'pipeline' && (
        <>
          <SectionTitle>Continuous Attestation Pipeline</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Every component in the execution chain passes through a 5-stage continuous attestation pipeline. Components that fail any stage are immediately quarantined.
          </p>
          <div className="flex flex-col gap-0 mb-8">
            {ATTESTATION_PIPELINE.map((stage, i) => (
              <div key={stage.stage}>
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-mono font-bold" style={{ background: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.2)', color: T.accent }}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium" style={{ color: T.text }}>{stage.stage}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: stage.status === 'automated' ? 'rgba(201,183,135,0.1)' : stage.status === 'human-gated' ? 'rgba(245,245,245,0.08)' : 'rgba(59,130,246,0.1)', color: stage.status === 'automated' ? T.accent : stage.status === 'human-gated' ? T.text : '#3b82f6' }}>{stage.status}</span>
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: T.dim }}>{stage.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {stage.checks.map(check => (
                          <span key={check} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{check}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
                {i < ATTESTATION_PIPELINE.length - 1 && (
                  <div className="flex justify-start ml-8 my-0">
                    <div className="w-px h-3" style={{ background: 'rgba(201,183,135,0.2)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> Supply Chain Attestation — SocialCyber-inspired integrity verification with SaaS attack defense, OAuth abuse tracking, vendor risk scoring, and continuous attestation pipeline.
      </div>

      <DefenseCrossNav
        currentId="supply-chain"
        related={[
          { id: 'agent-zero-trust', reason: 'Ephemeral OAuth + connector identity controls' },
          { id: 'weaponized-intel', reason: 'MCP server compromise threat patterns' },
          { id: 'atlas-shield', reason: 'OWASP Agentic + MITRE coverage mapping' },
          { id: 'cyber-resilience', reason: 'DARPA programs behind attestation' },
        ]}
      />
    </Layout>
  );
}
