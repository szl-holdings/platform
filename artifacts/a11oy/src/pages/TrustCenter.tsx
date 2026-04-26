import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const API = '/api/a11oy';

interface TrustSection {
  status: string;
  description: string;
  controls?: string[];
  milestones?: string[];
}

interface TrustData {
  posture: string;
  sections: Record<string, TrustSection>;
  securityPosture: Record<string, boolean>;
}

const SECTION_LABELS: Record<string, string> = {
  humanGatedAutonomy: 'Human-Gated Autonomy',
  dataHandling: 'Data Handling',
  connectorFirewall: 'Connector Firewall',
  modelRouter: 'Model Router',
  evalLayer: 'Eval Layer (MirrorEval 2.0)',
  proofLedger: 'Proof Ledger',
  approvalControls: 'Approval Controls',
  auditability: 'Auditability',
  demoModeBoundaries: 'Demo Mode Boundaries',
  roadmapToEnterprise: 'Roadmap to Enterprise',
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  enforced: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'ENFORCED' },
  active: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'ACTIVE' },
  demo: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'DEMO' },
  roadmap: { color: '#5e5e5e', bg: 'rgba(155,172,196,0.08)', label: 'ROADMAP' },
  demo_operational: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'DEMO OPERATIONAL' },
};

export function TrustCenter() {
  const [data, setData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>('humanGatedAutonomy');

  useEffect(() => {
    fetch(`${API}/trust`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const securityItems = data ? [
    { label: 'No secrets hardcoded in source', pass: data.securityPosture.secretsInCode === false },
    { label: 'No lorem ipsum in seed data', pass: data.securityPosture.loremIpsum === false },
    { label: 'No fake partner claims', pass: data.securityPosture.fakeClaims === false },
    { label: 'No sensitive data exposed', pass: data.securityPosture.noSensitiveDataExposed },
    { label: 'All material actions gated', pass: data.securityPosture.allActionsGated },
  ] : [];

  return (
    <Layout>
      <PageHeader
        label="TRUST CENTER"
        title="Human-Gated Autonomy & Security Posture"
        subtitle="A11oy's complete governance, security, and compliance posture. Every claim is backed by a control and a proof — nothing is asserted without evidence."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading trust posture…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {securityItems.map(item => (
              <div key={item.label} className="p-3 rounded-lg border text-center" style={{ backgroundColor: item.pass ? 'rgba(201,183,135,0.04)' : 'rgba(245,245,245,0.04)', borderColor: item.pass ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)' }}>
                <div className="text-lg mb-1" style={{ color: item.pass ? '#c9b787' : '#f5f5f5' }}>{item.pass ? '✓' : '✗'}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <SectionTitle>Governance Controls</SectionTitle>
          <div className="flex flex-col gap-2 mb-8">
            {Object.entries(data.sections).map(([key, section]) => {
              const style = STATUS_STYLE[section.status] ?? STATUS_STYLE.demo;
              const isExpanded = expanded === key;
              return (
                <div key={key} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : key)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--color-a11oy-surface)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: style.color, backgroundColor: style.bg }}>{style.label}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{SECTION_LABELS[key] ?? key}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ backgroundColor: 'var(--color-a11oy-surface)' }}>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{section.description}</p>
                      {section.controls && (
                        <div className="space-y-1.5">
                          {section.controls.map(c => (
                            <div key={c} className="flex items-start gap-2 text-xs">
                              <span style={{ color: style.color, flexShrink: 0 }}>✓</span>
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {section.milestones && (
                        <div className="space-y-1.5">
                          {section.milestones.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span style={{ color: '#5e5e5e', flexShrink: 0 }}>→</span>
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <SectionTitle>What A11oy Claims vs. What Is Reality</SectionTitle>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { category: 'Built Today', status: 'LIVE' as const, items: ['Proof Ledger with SHA-256 hash chain', 'Policy gate (Covenant Layer) on all actions', 'Signal Mesh — multi-domain ingestion', 'MirrorEval 2.0 — 14-dimension scoring', 'Human approval gate — structural guarantee', 'Connector Firewall — default deny', 'Workcell replay — full audit trail'] },
              { category: 'Demo Mode', status: 'DEMO' as const, items: ['Live domain connector calls', 'Real-time AIS vessel tracking', 'Live CRM pipeline sync', 'Production LLM inference', 'Real matter management integration', 'Real vendor SLA data'] },
              { category: 'Roadmap', status: 'ROADMAP' as const, items: ['SOC 2 Type II certification', 'HIPAA attestation', 'FedRAMP Authorization', 'VPC-isolated deployment', 'Air-gapped on-premises posture', 'Local model inference (Llama 3)'] },
            ].map(col => (
              <Card key={col.category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{col.category}</div>
                  <StatusPill status={col.status} />
                </div>
                <div className="space-y-1.5">
                  {col.items.map(item => (
                    <div key={item} className="flex items-start gap-2 text-xs">
                      <span style={{ color: col.status === 'LIVE' ? '#c9b787' : col.status === 'DEMO' ? '#c9b787' : '#5e5e5e', flexShrink: 0 }}>
                        {col.status === 'LIVE' ? '✓' : col.status === 'DEMO' ? '◎' : '→'}
                      </span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Trust posture unavailable.</div>
      )}

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> All trust claims are explicitly labeled. Demo mode boundaries are enforced. No real data is processed.
      </div>
    </Layout>
  );
}
