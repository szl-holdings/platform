import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { SUPPLY_CHAIN, DARPA_PROGRAMS, fmtPct, DARPA_VERSION } from '../data/darpaResilience';

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

export function SupplyChainAttestation() {
  const attested = SUPPLY_CHAIN.filter(c => c.attestationStatus === 'attested').length;
  const totalVulns = SUPPLY_CHAIN.reduce((a, c) => a + c.vulnerabilities.critical + c.vulnerabilities.high, 0);
  const avgIntegrity = SUPPLY_CHAIN.reduce((a, c) => a + c.integrityScore, 0) / SUPPLY_CHAIN.length;
  const totalSignatories = SUPPLY_CHAIN.reduce((a, c) => a + c.signatoryCount, 0);
  const socialCyber = DARPA_PROGRAMS.find(p => p.id === 'socialcyber')!;

  return (
    <Layout>
      <PageHeader
        label={`DARPA RESILIENCE · v${DARPA_VERSION}`}
        title="Supply Chain Attestation"
        subtitle="SocialCyber-inspired — dependency integrity graph, SBOM compliance, and multi-signatory attestation for the full execution chain."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="ATTESTED" value={`${attested}/${SUPPLY_CHAIN.length}`} sub="components verified" accent={T.accent} />
        <KpiCard label="CRITICAL+HIGH" value={totalVulns.toString()} sub="open vulnerabilities" accent={totalVulns > 0 ? '#ef4444' : T.accent} />
        <KpiCard label="INTEGRITY" value={fmtPct(avgIntegrity)} sub="mean integrity score" accent={T.accent} />
        <KpiCard label="SIGNATORIES" value={totalSignatories.toString()} sub="total attestation signatures" accent={T.accent} />
      </div>

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
    </Layout>
  );
}
