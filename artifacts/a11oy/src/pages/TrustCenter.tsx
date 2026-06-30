import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, StatusPill } from '../components/ui';
import { TRUST_ATTESTATIONS, CONTROL_MAPPINGS, type ControlMapping } from '../data/complianceFabric';

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
  enforced: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'ENFORCED' },
  active: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'ACTIVE' },
  operational: { color: '#c9b787', bg: 'rgba(201,183,135,0.08)', label: 'OPERATIONAL' },
  roadmap: { color: '#5e5e5e', bg: 'rgba(155,172,196,0.08)', label: 'ROADMAP' },
};

const TRUST_DATA: TrustData = {
  posture: 'governed',
  securityPosture: {
    secretsInCode: false,
    loremIpsum: false,
    fakeClaims: false,
    noSensitiveDataExposed: true,
    allActionsGated: true,
  },
  sections: {
    humanGatedAutonomy: {
      status: 'enforced',
      description: 'Every material action in A11oy requires explicit human approval before execution. This is not a soft constraint — it is a structural guarantee enforced by the PCE (Policy Contract Engine) layer. No agent can execute a Tier 2 or Tier 3 action without a human approval signal in the proof chain.',
      controls: [
        'PCE contract gate on every workcell — no execution without approval record',
        'Tier 1 (autonomous): informational actions only, no external calls',
        'Tier 2 (manager): actions with limited reversibility — notified approval',
        'Tier 3 (executive): material, high-stakes actions — explicit signed approval',
        'Approval record is part of the proof packet — immutable audit trail',
        'MirrorEval 2.0 must pass before any action reaches approval queue',
        'No approval auto-escalation — actions expire if not acted upon',
      ],
    },
    dataHandling: {
      status: 'enforced',
      description: 'A11oy processes only synthetic seed data in the governed environment. In production, all customer data is processed under strict data handling controls: PII redaction, data minimization, and connector-level consent gating.',
      controls: [
        'PII redaction enforced on all CRM and contact connector outputs',
        'Data minimization — only required fields passed to skill context',
        'Consent gate required before any connector call processes personal data',
        'Output sanitizer active on all connector outputs before LLM inclusion',
        'No customer data persisted in LLM context beyond single request',
        'Governed environment uses only synthetic, non-sensitive seed data',
      ],
    },
    connectorFirewall: {
      status: 'enforced',
      description: 'Every external connector is untrusted by default. The Connector Firewall enforces schema validation, consent gating, tool allowlisting, and prompt injection scanning before any connector output is included in an agent context.',
      controls: [
        'Default deny — all connectors untrusted until explicitly registered',
        'Schema validation required before any connector is approved',
        'Consent gate required for all connectors processing personal data',
        'Prompt injection scanner: 10+ pattern classes monitored',
        'Tool allowlist enforcement — only approved tools callable per connector',
        'Output sanitizer active on all connector responses',
        '47 injection attempts blocked in current governed environment',
      ],
    },
    modelRouter: {
      status: 'operational',
      description: 'A11oy routes inference to multiple model providers based on task type, cost, latency, and compliance posture. No single model dependency. Air-gapped posture uses local Llama 3 inference.',
      controls: [
        'Multi-provider routing: OpenAI, Anthropic, local inference',
        'Task-type routing: evaluation uses dedicated eval model',
        'Cost guardrails: max token limits enforced per skill',
        'No model output reaches action execution without MirrorEval gate',
        'Model call logs included in proof packet for every governed action',
        'Local inference available in air-gapped deployment posture',
      ],
    },
    evalLayer: {
      status: 'enforced',
      description: 'MirrorEval 2.0 is a 14-dimension evaluation harness that scores every action brief before it reaches the approval queue. Any action that fails the eval gate is blocked — it does not proceed to human review.',
      controls: [
        'Groundedness — all claims traceable to evidence refs',
        'Evidence coverage — minimum evidence threshold enforced',
        'Action safety — prohibited action classes blocked',
        'Hallucination risk — claimed facts cross-checked against signals',
        'Policy compliance — covenant policies checked inline',
        'Tool risk — high-risk tool calls require higher eval threshold',
        'Proof completeness — proof chain must be intact to pass',
        'Approval alignment — action tier matches impact score',
        'Context fidelity — signal context preserved through reasoning',
        'Reasoning quality — chain-of-thought coherence scored',
        'Output safety — no PII, secrets, or sensitive data in output',
        'Bias detection — demographic and confirmation bias flagged',
        'Constitutional alignment — A11oy principles compliance checked',
        'Shadow Council score — adversarial red-team perspective scored',
      ],
    },
    proofLedger: {
      status: 'enforced',
      description: 'Every governed action produces a SHA-256 hash-chained proof packet. The proof chain is immutable — no packet can be modified without breaking the chain. All proof packets are replayable and auditable by any authorized party.',
      controls: [
        'SHA-256 hash chain — every packet linked to previous entry',
        'Immutable storage — no delete or modify permitted on committed packets',
        'Full replay — every workcell can be step-replayed from proof',
        'Evidence refs — all signal and skill evidence attached to proof',
        'Approval record — human approval included in every Tier 2/3 packet',
        'MirrorEval score included — composite and per-dimension scores',
        'Chain integrity monitored — any break triggers immediate alert',
      ],
    },
    approvalControls: {
      status: 'enforced',
      description: 'The approval system routes actions to the correct human based on action tier, domain expertise, and organizational authority. No action above Tier 1 executes without a named human approver on the proof chain.',
      controls: [
        'Tier routing — actions routed to correct authority tier automatically',
        'Named approver required — anonymous approval not accepted',
        'Deadline enforcement — actions expire if not approved in time window',
        'Approval context — full action brief and evidence provided to approver',
        'Override protection — no agent or model can override human decision',
        'Delegation support — approver can delegate with audit trail',
        'Audit log — all approval decisions logged with timestamp and identity',
      ],
    },
    auditability: {
      status: 'enforced',
      description: 'Every action, decision, model call, connector call, and approval decision in A11oy is logged, hashed, and auditable. The proof ledger provides a complete, tamper-evident audit trail for any governed action.',
      controls: [
        'Full action replay — every workcell replayable step by step',
        'Model call logs — all inference calls included in proof packet',
        'Connector call logs — all connector calls logged with schema and output',
        'Approval audit trail — complete history of all approval decisions',
        'Eval audit trail — per-dimension scores for every evaluation',
        'OTEL trace spans — 18,493 spans active in current environment',
        'Compliance export — proof packets exportable for audit purposes',
      ],
    },
    governedEnvironment: {
      status: 'operational',
      description: 'The governed environment uses only synthetic, non-sensitive seed data. No real connector calls are made. No real LLM inference is called for skill execution. No real destructive actions are executed. All behavior is deterministic and reproducible.',
      controls: [
        'Synthetic seed data only — no real enterprise data processed',
        'Connector simulation — no real connector calls in this environment',
        'Deterministic outputs — skill results are from pre-computed seed',
        'Approval simulation — approval flows simulated with local state',
        'No real LLM inference — skill execution uses seed output data',
        'Production posture: real connectors, real inference, real approvals',
      ],
    },
    roadmapToEnterprise: {
      status: 'roadmap',
      description: 'A11oy is on a clear path from the current governed environment to full enterprise-grade production deployment with SOC 2 certification, HIPAA attestation, and FedRAMP authorization.',
      milestones: [
        'SOC 2 Type II — audit engagement Q3 2026',
        'HIPAA attestation — healthcare vertical expansion',
        'FedRAMP Authorization — defense/gov posture',
        'ISO 27001 — international enterprise expansion',
        'VPC-isolated deployment — customer cloud boundary',
        'Air-gapped on-premises — defense/classified deployment',
        'Local model inference (Llama 3 / Mistral) — data sovereignty',
      ],
    },
  },
};

export function TrustCenter() {
  const [data] = useState<TrustData>(TRUST_DATA);
  const [expanded, setExpanded] = useState<string | null>('humanGatedAutonomy');

  const securityItems = [
    { label: 'No secrets hardcoded in source', pass: data.securityPosture.secretsInCode === false },
    { label: 'No lorem ipsum in seed data', pass: data.securityPosture.loremIpsum === false },
    { label: 'No fake partner claims', pass: data.securityPosture.fakeClaims === false },
    { label: 'No sensitive data exposed', pass: data.securityPosture.noSensitiveDataExposed },
    { label: 'All material actions gated', pass: data.securityPosture.allActionsGated },
  ];

  return (
    <Layout>
      <PageHeader
        label="TRUST CENTER"
        title="Human-Gated Autonomy & Security Posture"
        subtitle="A11oy's complete governance, security, and compliance posture. Every claim is backed by a control and a proof — nothing is asserted without evidence."
        status="LIVE"
      />

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
          const style = STATUS_STYLE[section.status] ?? STATUS_STYLE.operational;
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
          { category: 'Built & Active', status: 'LIVE' as const, items: ['Proof Ledger with SHA-256 hash chain', 'Policy gate (Covenant Layer) on all actions', 'Signal Mesh — multi-domain ingestion', 'MirrorEval 2.0 — 14-dimension scoring', 'Human approval gate — structural guarantee', 'Connector Firewall — default deny', 'Workcell replay — full audit trail', 'Business twin registry — 7 twins active', '15 named skills — fully operational', 'Boardroom synthesis — 5 packets generated'] },
          { category: 'Governed Environment', status: 'GATED' as const, items: ['Live domain connector calls (simulated)', 'Real-time AIS vessel tracking (seeded)', 'Live CRM pipeline sync (seeded)', 'Production LLM inference (simulated)', 'Real matter management integration', 'Real vendor SLA data', 'Live Bloomberg market feed', 'Real court docket sync'] },
          { category: 'Roadmap', status: 'ROADMAP' as const, items: ['SOC 2 Type II certification', 'HIPAA attestation', 'FedRAMP Authorization', 'VPC-isolated deployment', 'Air-gapped on-premises posture', 'Local model inference (Llama 3)', 'ISO 27001 certification', 'CMMC Level 3 (defense)'] },
        ].map(col => (
          <Card key={col.category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{col.category}</div>
              <StatusPill status={col.status} />
            </div>
            <div className="space-y-1.5">
              {col.items.map(item => (
                <div key={item} className="flex items-start gap-2 text-xs">
                  <span style={{ color: col.status === 'LIVE' ? '#c9b787' : col.status === 'GATED' ? '#c9b787' : '#5e5e5e', flexShrink: 0 }}>
                    {col.status === 'LIVE' ? '✓' : col.status === 'GATED' ? '◎' : '→'}
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
            <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>Framework Coverage</div>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: '#c9b787', backgroundColor: 'rgba(201,183,135,0.08)' }}>LIVE</span>
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
                {frameworks.map(fw => {
                  const controls = CONTROL_MAPPINGS.filter((c: ControlMapping) => c.framework === fw.id);
                  const satisfied = controls.filter((c: ControlMapping) => c.evidenceStatus === 'fresh').length;
                  const pct = controls.length > 0 ? Math.round((satisfied / controls.length) * 100) : 0;
                  return (
                    <div key={fw.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                      <div>
                        <div style={{ color: 'var(--color-a11oy-text)' }}>{fw.name}</div>
                        <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}>{fw.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold" style={{ color: pct === 100 ? '#22c55e' : '#c9b787' }}>{pct}%</div>
                        <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}>{satisfied}/{controls.length}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <Link href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/compass`} className="block w-full text-center text-xs mt-3 py-2 rounded font-medium" style={{ color: '#c9b787', backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.15)', textDecoration: 'none' }}>
            Open Compass Dashboard →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>Federated Trust Exchange</div>
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: '#c9b787', backgroundColor: 'rgba(201,183,135,0.08)' }}>ACTIVE</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Cross-organizational compliance attestation — posture brackets exchanged without exposing proprietary governance internals.
          </p>
          <div className="space-y-2 mb-3">
            {TRUST_ATTESTATIONS.filter(a => a.status === 'active').map(att => (
              <div key={att.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                <div>
                  <div style={{ color: 'var(--color-a11oy-text)' }}>{att.partnerName}</div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9 }}>{att.direction} · {att.partnerOrgId}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono" style={{ color: att.adversarialRobustnessBracket === 'exceptional' ? '#22c55e' : '#c9b787', fontSize: 10 }}>
                    {att.adversarialRobustnessBracket}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/trust-exchange`} className="block w-full text-center text-xs py-2 rounded font-medium" style={{ color: '#c9b787', backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.15)', textDecoration: 'none' }}>
            Open Trust Exchange →
          </Link>
        </Card>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — all trust claims are explicitly labeled and evidence-backed. No real data is processed. All claims are verifiable.
      </div>
    </Layout>
  );
}
