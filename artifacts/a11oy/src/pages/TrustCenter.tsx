import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle, StatusPill } from '../components/ui';
import {
  CONTROL_MAPPINGS,
  type ControlMapping,
  TRUST_ATTESTATIONS,
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
  demo: { color: '#e5d29e', bg: 'rgba(229,210,158,0.08)', label: 'DEMO' },
  roadmap: { color: '#5e5e5e', bg: 'rgba(155,172,196,0.08)', label: 'ROADMAP' },
};

const TRUST_DATA: TrustData = {
  posture: 'active prototype',
  securityPosture: {
    secretsInCode: false,
    blockedFillerCopy: false,
    fakeClaims: false,
    noSensitiveDataExposed: true,
    allActionsGated: true,
  },
  sections: {
    humanGatedAutonomy: {
      status: 'demo',
      description:
        'Repository fixtures model a human-approval boundary for material demo actions. The current UI records local decisions only and does not authorize an external operation.',
      controls: [
        'Demo contract: seeded Workcells carry an approval tier',
        'Demo Tier 1: informational fixture with no external call',
        'Demo Tier 2: manager-review interaction represented locally',
        'Demo Tier 3: executive-review interaction represented locally',
        'Demo approval choices remain local UI state',
        'Demo MirrorEval score is shown before the approval interaction',
        'Design target: persist expiry and escalation evidence in an authenticated runtime',
      ],
    },
    dataHandling: {
      status: 'demo',
      description:
        'The displayed Workcells use synthetic repository seed data. Production data handling, consent, retention, and connector enforcement require separate deployed evidence.',
      controls: [
        'Demo boundary: no customer record is used by these fixtures',
        'Design target: minimize fields admitted to a skill context',
        'Design target: require consent before processing personal data',
        'Design target: sanitize connector output before model admission',
        'Design target: verify retention behavior in the deployed data plane',
        'Current presentation: synthetic, non-sensitive seed data',
      ],
    },
    connectorFirewall: {
      status: 'demo',
      description:
        'Policy fixtures demonstrate the intended default-deny connector boundary. No authenticated connector exchange or firewall enforcement is claimed by this page.',
      controls: [
        'Demo policy shape: connector starts untrusted',
        'Design target: validate schema before connector admission',
        'Design target: bind personal-data access to consent evidence',
        'Design target: scan untrusted output for prompt injection',
        'Design target: enforce a per-connector tool allowlist',
        'Design target: sanitize connector responses before context admission',
      ],
    },
    modelRouter: {
      status: 'demo',
      description:
        'The prototype describes a provider-neutral routing contract. The deterministic Workcell experience does not call a model provider or prove deployed routing.',
      controls: [
        'Architecture target: provider-neutral inference adapters',
        'Architecture target: task-specific evaluation routing',
        'Architecture target: per-skill token and cost limits',
        'Architecture target: evaluation before action authorization',
        'Architecture target: source-bound model-call evidence',
        'Roadmap target: separately verified local inference posture',
      ],
    },
    evalLayer: {
      status: 'demo',
      description:
        'MirrorEval fixtures show how an action brief can carry dimension scores before review. The displayed scores are seed data, not authenticated evaluation results.',
      controls: [
        'Demo dimension: groundedness references',
        'Demo dimension: evidence coverage',
        'Demo dimension: action safety',
        'Demo dimension: unsupported-claim risk',
        'Demo dimension: policy alignment',
        'Demo dimension: tool risk',
        'Demo dimension: proof completeness',
        'Demo dimension: approval-tier alignment',
        'Demo dimension: context fidelity',
        'Demo dimension: reasoning quality',
        'Demo dimension: output safety',
        'Demo dimension: bias review',
        'Demo dimension: stated-principle alignment',
        'Demo dimension: adversarial review',
      ],
    },
    proofLedger: {
      status: 'demo',
      description:
        'Demo proof packets expose hash and parent-reference fields for inspection. Repository fixtures do not establish an immutable external ledger, durable storage, or authorized audit access.',
      controls: [
        'Demo record: illustrative digest and parent-reference labels',
        'Demo record: no durable-storage guarantee',
        'Demo replay: seeded Workcell steps',
        'Demo record: fixture evidence references',
        'Demo record: local approval representation',
        'Demo record: seeded MirrorEval score',
        'Design target: independently witnessed integrity monitoring',
      ],
    },
    approvalControls: {
      status: 'demo',
      description:
        'The UI demonstrates approval tiers and named-reviewer fields. It does not authenticate an approver, persist a decision, or execute an action.',
      controls: [
        'Demo field: approval tier',
        'Demo field: named-reviewer target',
        'Design target: authenticated expiry enforcement',
        'Demo view: action brief and evidence context',
        'Design target: non-bypassable human decision boundary',
        'Design target: source-bound delegation evidence',
        'Design target: durable decision log with actor identity',
      ],
    },
    auditability: {
      status: 'demo',
      description:
        'Seed traces show the intended evidence shape for actions, evaluations, and approvals. They do not prove complete runtime logging, external telemetry, or a tamper-evident store.',
      controls: [
        'Demo replay: deterministic Workcell steps',
        'Demo field: model-call fixture',
        'Demo field: connector-call fixture',
        'Demo field: approval decision fixture',
        'Demo field: evaluation dimensions',
        'No authenticated telemetry count is claimed',
        'Design target: governed evidence export',
      ],
    },
    governedEnvironment: {
      status: 'demo',
      description:
        'The displayed Workcells use fixed repository seed data and local interaction state. They do not make an authenticated connector call, invoke a model for skill execution, or perform an external mutation.',
      controls: [
        'Presentation input: synthetic repository seed data',
        'Presentation input: connector fixtures',
        'Presentation output: precomputed deterministic values',
        'Interaction state: local approval demonstration',
        'Presentation boundary: no model call for the displayed skill result',
        'Production posture remains unavailable without deployed evidence',
      ],
    },
    roadmapToEnterprise: {
      status: 'roadmap',
      description:
        'Enterprise deployment and compliance outcomes are roadmap targets. This prototype does not claim a certification, attestation, authorization, or production deployment.',
      milestones: [
        'Target: complete an independent SOC 2 audit; no certification claimed',
        'Target: assess healthcare controls; no HIPAA attestation claimed',
        'Target: evaluate government controls; no FedRAMP authorization claimed',
        'Target: assess ISO 27001 readiness; no certification claimed',
        'Target architecture: separately verified VPC-isolated deployment',
        'Target architecture: separately verified on-premises deployment',
        'Target architecture: separately verified local inference',
      ],
    },
  },
};

export function TrustCenter() {
  const [data] = useState<TrustData>(TRUST_DATA);
  const [expanded, setExpanded] = useState<string | null>('humanGatedAutonomy');

  const securityItems = [
    { label: 'No secrets hardcoded in source', pass: data.securityPosture.secretsInCode === false },
    {
      label: 'No blocked filler copy in seed data',
      pass: data.securityPosture.blockedFillerCopy === false,
    },
    { label: 'No fake partner claims', pass: data.securityPosture.fakeClaims === false },
    {
      label: 'No sensitive data in displayed seed fixtures',
      pass: data.securityPosture.noSensitiveDataExposed,
    },
    { label: 'Seed actions model approval tiers', pass: data.securityPosture.allActionsGated },
  ];

  return (
    <Layout>
      <PageHeader
        label="TRUST CENTER"
        title="Human-Gated Autonomy & Security Posture"
        subtitle="Source-backed prototype controls, demonstration evidence, governed-environment boundaries, and roadmap claims are separated explicitly."
        status="DEMO"
      />

      <div
        className="mb-8 rounded-lg border p-4 text-sm"
        style={{
          backgroundColor: 'rgba(229,210,158,0.05)',
          borderColor: 'rgba(229,210,158,0.22)',
          color: 'var(--color-a11oy-text-sub)',
        }}
      >
        Evidence boundary: this page documents prototype source and seeded demonstrations. It is not
        a certification, production control attestation, or external audit opinion.
      </div>

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
            <div className="text-lg mb-1" style={{ color: item.pass ? '#c9b787' : '#f5f5f5' }}>
              {item.pass ? '✓' : '✗'}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Governance Controls</SectionTitle>
      <div className="flex flex-col gap-2 mb-8">
        {Object.entries(data.sections).map(([key, section]) => {
          const style = STATUS_STYLE[section.status] ?? STATUS_STYLE.demo;
          const isExpanded = expanded === key;
          return (
            <div
              key={key}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--color-a11oy-border)' }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="min-h-11 w-full text-left p-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--color-a11oy-surface)' }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ color: style.color, backgroundColor: style.bg }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="min-w-0 text-sm font-medium break-words"
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

      <SectionTitle>Evidence Classification</SectionTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            category: 'Implemented Prototype',
            status: 'DEMO' as const,
            items: [
              'Proof Ledger demonstration with illustrative digest fields',
              'Policy-gate demonstration (Covenant Layer)',
              'Seeded multi-domain Signal Mesh',
              'MirrorEval scoring demonstration',
              'Human approval-gate UI and contracts',
              'Connector Firewall policy design',
              'Deterministic Workcell replay',
              'Seeded business-twin registry',
              'Named skill registry demonstration',
              'Seeded boardroom packet synthesis',
            ],
          },
          {
            category: 'Unavailable External Operations',
            status: 'UNAVAILABLE' as const,
            items: [
              'Authenticated domain connector readback — unavailable',
              'Authenticated AIS vessel telemetry — unavailable',
              'Authenticated CRM pipeline synchronization — unavailable',
              'Authenticated model inference — unavailable',
              'Authenticated matter-management integration — unavailable',
              'Authenticated vendor SLA data — unavailable',
              'Authenticated market-data feed — unavailable',
              'Authenticated court-docket synchronization — unavailable',
            ],
          },
          {
            category: 'Roadmap',
            status: 'ROADMAP' as const,
            items: [
              'Target: independent SOC 2 audit; no certification claimed',
              'Target: healthcare control assessment; no attestation claimed',
              'Target: government control assessment; no authorization claimed',
              'Target: separately verified VPC-isolated deployment',
              'Target: separately verified on-premises posture',
              'Target: separately verified local model inference',
              'Target: ISO 27001 readiness; no certification claimed',
              'Target: defense control assessment; no certification claimed',
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
                          ? '#e5d29e'
                          : col.status === 'UNAVAILABLE'
                            ? '#a8a8a8'
                            : '#5e5e5e',
                      flexShrink: 0,
                    }}
                  >
                    {col.status === 'DEMO' ? '◇' : col.status === 'UNAVAILABLE' ? '⊘' : '→'}
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
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ color: '#e5d29e', backgroundColor: 'rgba(229,210,158,0.08)' }}
            >
              DEMO
            </span>
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
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded py-2 text-center text-xs font-medium"
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
              Seeded Trust Exchange Fixture
            </div>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ color: '#c9b787', backgroundColor: 'rgba(201,183,135,0.08)' }}
            >
              DEMO
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Synthetic organization records demonstrate an attestation-exchange shape. No named
            organization below is represented as a real partner or external attestor.
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
                  <div style={{ color: 'var(--color-a11oy-text)' }}>
                    Synthetic organization · {att.partnerName}
                  </div>
                  <div
                    className="font-mono"
                    style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}
                  >
                    {att.direction} · {att.partnerOrgId}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-mono"
                    style={{
                      color:
                        att.adversarialRobustnessBracket === 'exceptional' ? '#22c55e' : '#c9b787',
                      fontSize: 10,
                    }}
                  >
                    {att.adversarialRobustnessBracket}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/trust-exchange`}
            className="flex min-h-11 w-full items-center justify-center rounded py-2 text-center text-xs font-medium"
            style={{
              color: '#c9b787',
              backgroundColor: 'rgba(201,183,135,0.08)',
              border: '1px solid rgba(201,183,135,0.15)',
              textDecoration: 'none',
            }}
          >
            Open demo Trust Exchange →
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
        boundary — displayed records are synthetic fixtures and are labeled DEMO, UNAVAILABLE, or
        ROADMAP. They do not establish external audit, deployment, or production evidence.
      </div>
    </Layout>
  );
}
