import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, StatusPill } from '../components/ui';
import {
  TRUST_ATTESTATIONS,
  CONTROL_MAPPINGS,
  type ControlMapping,
} from '../data/complianceFabric';

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
  governedEnvironment: 'Governed Environment Boundaries',
  roadmapToEnterprise: 'Roadmap to Enterprise Grade',
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  demo: { color: '#d4d4d4', bg: 'rgba(138,138,138,0.18)', label: 'MODELED' },
  roadmap: { color: '#a3a3a3', bg: 'rgba(155,172,196,0.08)', label: 'ROADMAP' },
};

const TRUST_DATA: TrustData = {
  posture: 'prototype',
  securityPosture: {
    secretsInCode: false,
    loremIpsum: false,
    fakeClaims: false,
    noSensitiveDataExposed: true,
    allActionsGated: true,
  },
  sections: {
    humanGatedAutonomy: {
      status: 'demo',
      description:
        'The prototype models a policy in which material actions remain blocked until a named human approval fixture is present. The page demonstrates the intended contract; it does not prove operational enforcement.',
      controls: [
        'Modeled PCE gate requires a fixture approval record',
        'Tier 1 fixture: informational action with no external call',
        'Tier 2 fixture: manager-review workflow',
        'Tier 3 fixture: executive-review workflow',
        'Demo approval record is linked to the seeded receipt shape',
      ],
    },
    dataHandling: {
      status: 'demo',
      description:
        'This prototype surface uses synthetic repository fixtures. Authenticated customer-data handling and production connector controls are unavailable here.',
      controls: [
        'Synthetic, non-sensitive seed data only',
        'Modeled PII-redaction control',
        'Modeled data-minimization control',
        'Modeled connector-consent gate',
      ],
    },
    connectorFirewall: {
      status: 'demo',
      description:
        'Repository fixtures illustrate a default-deny connector-firewall design. No authenticated connector call is observed on this page.',
      controls: [
        'Modeled default-deny registry',
        'Modeled schema-validation step',
        'Modeled consent and tool-allowlist gates',
        'Modeled prompt-injection and output-sanitization stages',
      ],
    },
    modelRouter: {
      status: 'demo',
      description:
        'The prototype illustrates a multi-provider routing contract. It does not demonstrate an authenticated provider call, air-gapped runtime, or production failover.',
      controls: [
        'Modeled provider-selection fields',
        'Modeled task-type routing rule',
        'Modeled token-budget and evaluation gates',
        'Fixture model-call metadata in demo receipts',
      ],
    },
    evalLayer: {
      status: 'demo',
      description:
        'Seed records demonstrate a fourteen-dimension evaluation shape and a modeled block disposition. They do not establish a running evaluation service.',
      controls: [
        'Modeled groundedness and evidence-coverage fields',
        'Modeled action-safety and policy checks',
        'Modeled tool-risk and approval-alignment fields',
        'Modeled output-safety and bias-review fields',
      ],
    },
    proofLedger: {
      status: 'demo',
      description:
        'Seed receipts illustrate SHA-256-shaped references and linked nodes. The fixture ledger is not an immutable, externally attested, or operational record.',
      controls: [
        'Fixture hash-link fields',
        'Browser-local replay presentation',
        'Fixture evidence, approval, and evaluation references',
        'No external signature or persistence witness',
      ],
    },
    approvalControls: {
      status: 'demo',
      description:
        'The prototype models tiered routing to named approver fixtures. It does not contact a real approver or authorize an external action.',
      controls: [
        'Modeled authority-tier selection',
        'Named fixture approver field',
        'Modeled deadline, delegation, and decision-history fields',
      ],
    },
    auditability: {
      status: 'demo',
      description:
        'The UI demonstrates an audit-record shape over repository fixtures. It does not establish complete logging, tamper evidence, or an authenticated audit export.',
      controls: [
        'Fixture Workcell replay',
        'Fixture model, connector, approval, and evaluation references',
        'No observed telemetry-span or compliance-export service',
      ],
    },
    governedEnvironment: {
      status: 'demo',
      description:
        'This local artifact renders stable repository seed data. It makes no real connector call, model-provider call, approval request, or destructive external action.',
      controls: [
        'Synthetic repository fixtures',
        'Browser-local connector and approval simulation',
        'Precomputed demonstration outputs',
        'Production operations unavailable on this surface',
      ],
    },
    roadmapToEnterprise: {
      status: 'roadmap',
      description:
        'These are roadmap targets only. No certification, authorization, production deployment, delivery date, or audit engagement is claimed.',
      milestones: [
        'SOC 2 Type II readiness target',
        'HIPAA posture target',
        'FedRAMP authorization target',
        'ISO 27001 readiness target',
        'VPC-isolated deployment target',
        'Air-gapped deployment target',
        'Local-model inference target',
      ],
    },
  },
};

export function TrustCenter() {
  const [data] = useState<TrustData>(TRUST_DATA);
  const [expanded, setExpanded] = useState<string | null>('humanGatedAutonomy');

  const securityItems = [
    {
      label: 'No secrets hardcoded in source fixtures',
      pass: data.securityPosture.secretsInCode === false,
    },
    { label: 'No lorem ipsum in seed data', pass: data.securityPosture.loremIpsum === false },
    { label: 'No fake partner claims', pass: data.securityPosture.fakeClaims === false },
    { label: 'No sensitive data exposed', pass: data.securityPosture.noSensitiveDataExposed },
    { label: 'All material actions gated', pass: data.securityPosture.allActionsGated },
  ];

  return (
    <Layout>
      <PageHeader
        label="TRUST CENTER"
        title="Prototype Trust & Control Model"
        subtitle="Inspect modeled governance controls, repository fixtures, unavailable integrations, and roadmap items without treating them as production attestations."
        status="DEMO"
      />

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Evidence boundary:</strong> this page
        renders a prototype control model and static repository data. Labels and control
        descriptions express intended design, not observed production enforcement, certification,
        customer operation, or external attestation.
      </div>

      <SectionTitle>Modeled Fixture Flags (Static Only)</SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {securityItems.map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-lg border text-center"
            style={{
              backgroundColor: item.pass ? 'rgba(201,183,135,0.04)' : 'rgba(245,245,245,0.04)',
              borderColor: item.pass ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)',
            }}
          >
              <div
                className="text-xs font-mono mb-1"
                style={{ color: item.pass ? '#c9b787' : '#f5f5f5' }}
              >
                {item.pass ? 'MODELED' : 'UNVERIFIED'}
              </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Modeled Governance Controls</SectionTitle>
      <div className="flex flex-col gap-2 mb-8">
        {Object.entries(data.sections).map(([key, section]) => {
          const style = section.status === 'roadmap' ? STATUS_STYLE.roadmap : STATUS_STYLE.demo;
          const isExpanded = expanded === key;
          return (
            <div
              key={key}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--color-a11oy-border)' }}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full min-h-11 text-left p-4 flex items-center justify-between gap-3"
                aria-expanded={isExpanded}
                style={{ backgroundColor: 'var(--color-a11oy-surface)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ color: style.color, backgroundColor: style.bg }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-a11oy-text)' }}
                  >
                    {SECTION_LABELS[key] ?? key}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
              {isExpanded && (
                <div
                  className="px-4 pb-4"
                  style={{ backgroundColor: 'var(--color-a11oy-surface)' }}
                >
                  <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {section.description}
                  </p>
                  {section.controls && (
                    <div className="space-y-1.5">
                      {section.controls.map((c) => (
                        <div key={c} className="flex items-start gap-2 text-xs">
                          <span style={{ color: style.color, flexShrink: 0 }}>✓</span>
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.milestones && (
                    <div className="space-y-1.5">
                      {section.milestones.map((m) => (
                        <div key={m} className="flex items-start gap-2 text-xs">
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
          {
            category: 'Prototype Surfaces',
            status: 'DEMO' as const,
            items: [
              'Seed proof-chain renderer',
              'Modeled policy-gate interface',
              'Seed signal and Workcell registries',
              'Fixture evaluation dimensions',
              'Browser-local approval interactions',
              'Modeled connector firewall controls',
              'Deterministic replay fixtures',
              'Seed business-twin registry',
              'Named skill definitions',
              'Seed board-packet examples',
            ],
          },
          {
            category: 'Unavailable Operations',
            status: 'UNAVAILABLE' as const,
            items: [
              'Authenticated domain connector calls',
              'Observed real-time vessel tracking',
              'Authenticated CRM synchronization',
              'Observed production inference',
              'Operational matter-management integration',
              'Observed vendor SLA feeds',
              'Observed market-data feed',
              'Observed court-docket synchronization',
            ],
          },
          {
            category: 'Roadmap',
            status: 'ROADMAP' as const,
            items: [
              'SOC 2 Type II certification',
              'HIPAA attestation',
              'FedRAMP Authorization',
              'VPC-isolated deployment',
              'Air-gapped on-premises posture',
              'Local model inference (Llama 3)',
              'ISO 27001 certification',
              'CMMC Level 3 (defense)',
            ],
          },
        ].map((col) => (
          <Card key={col.category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>
                {col.category}
              </div>
              <StatusPill status={col.status} />
            </div>
            <div className="space-y-1.5">
              {col.items.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs">
                  <span
                    style={{
                      color:
                        col.status === 'DEMO'
                          ? '#d4d4d4'
                          : col.status === 'UNAVAILABLE'
                            ? '#f5f5f5'
                            : '#a3a3a3',
                      flexShrink: 0,
                    }}
                  >
                    {col.status === 'DEMO' ? '◇' : col.status === 'UNAVAILABLE' ? '—' : '→'}
                  </span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Compliance Fabric — Regulatory Posture</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>
              Framework Coverage
            </div>
            <StatusPill status="DEMO" />
          </div>
          {(() => {
            const frameworks = [
              { id: 'eu-ai-act', name: 'EU AI Act', desc: 'Articles 9-72, Annex IV' },
              { id: 'nist-ai-rmf', name: 'NIST AI RMF', desc: '1.0 + CSA Agentic' },
              { id: 'iso-42001', name: 'ISO 42001', desc: 'Annex A Controls' },
              { id: 'csa-agentic', name: 'CSA Agentic', desc: 'v1.0 Profile' },
            ];
            return (
              <div className="space-y-2">
                {frameworks.map((fw) => {
                  const controls = CONTROL_MAPPINGS.filter(
                    (c: ControlMapping) => c.framework === fw.id,
                  );
                  const satisfied = controls.filter(
                    (c: ControlMapping) => c.evidenceStatus === 'fresh',
                  ).length;
                  const pct =
                    controls.length > 0 ? Math.round((satisfied / controls.length) * 100) : 0;
                  return (
                    <div
                      key={fw.id}
                      className="flex items-center justify-between text-xs p-2 rounded"
                      style={{
                        backgroundColor: 'var(--color-a11oy-deep)',
                        border: '1px solid var(--color-a11oy-border)',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--color-a11oy-text)' }}>{fw.name}</div>
                        <div
                          className="font-mono"
                          style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}
                        >
                          {fw.desc}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="font-mono font-bold"
                          style={{ color: pct === 100 ? '#22c55e' : '#c9b787' }}
                        >
                          {pct}%
                        </div>
                        <div
                          className="font-mono"
                          style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}
                        >
                          {satisfied}/{controls.length}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <Link
            href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/compass`}
            className="inline-flex min-h-11 w-full items-center justify-center text-center text-xs mt-3 px-3 py-2 rounded font-medium"
            style={{
              color: '#c9b787',
              backgroundColor: 'rgba(201,183,135,0.08)',
              border: '1px solid rgba(201,183,135,0.15)',
              textDecoration: 'none',
            }}
          >
            Open Compass Dashboard →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>
              Federated Trust Exchange Fixture
            </div>
            <StatusPill status="DEMO" />
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Seed records illustrate posture-bracket exchange fields; they are not
            cross-organizational attestations or observed partner traffic.
          </p>
          <div className="space-y-2 mb-3">
            {TRUST_ATTESTATIONS.filter((a) => a.status === 'active').map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between text-xs p-2 rounded"
                style={{
                  backgroundColor: 'var(--color-a11oy-deep)',
                  border: '1px solid var(--color-a11oy-border)',
                }}
              >
                <div>
                  <div style={{ color: 'var(--color-a11oy-text)' }}>{att.partnerName}</div>
                  <div
                    className="font-mono"
                    style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}
                  >
                    {att.direction} · {att.partnerOrgId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono" style={{ color: '#a3a3a3', fontSize: 10 }}>
                    {att.adversarialRobustnessBracket}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/trust-exchange`}
            className="inline-flex min-h-11 w-full items-center justify-center text-center text-xs px-3 py-2 rounded font-medium"
            style={{
              color: '#c9b787',
              backgroundColor: 'rgba(201,183,135,0.08)',
              border: '1px solid rgba(201,183,135,0.15)',
              textDecoration: 'none',
            }}
          >
            Open Trust Exchange →
          </Link>
        </Card>
      </div>

      <div
        className="p-3 rounded-lg text-xs flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.15)',
          color: 'var(--color-a11oy-text-ghost)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Prototype
        boundary — this page renders repository fixtures and modeled controls. It is not an
        independent attestation, certification, deployment witness, or production-data record.
      </div>
    </Layout>
  );
}
