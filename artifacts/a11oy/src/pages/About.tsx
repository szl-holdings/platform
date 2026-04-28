import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle } from '../components/ui';

const FABRIC_LAYERS = [
  { n: 1, name: 'Signal Mesh', desc: 'Ingests, normalizes, and routes business signals from all connected sources.' },
  { n: 2, name: 'Causal Core', desc: 'Builds evidence graphs and traces signal causality across domains.' },
  { n: 3, name: 'Context Engine', desc: 'Assembles enriched context packs for each workcell.' },
  { n: 4, name: 'Workcell Engine', desc: 'Provisions and executes governed, traceable workcells.' },
  { n: 5, name: 'Covenant Layer', desc: 'Enforces policy gates — no material action without approval.' },
  { n: 6, name: 'MirrorEval', desc: 'Compares recommendations against counterfactuals with citations.' },
  { n: 7, name: 'Proof Ledger', desc: 'Appends immutable, cryptographic proof for every governed execution.' },
  { n: 8, name: 'Doctrine Layer (Mythos)', desc: 'Frontier-grade alignment governance — constitutions, behavioral audit, reward-hacking watchdog, red-team probes, agent welfare telemetry, per-agent system cards, and Glasswing transparency. Open Spec published under CC-BY-4.0.' },
  { n: 9, name: 'Compliance Fabric', desc: 'Compliance-as-Runtime — maps every A11oy primitive to EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile controls. Compass dashboard, Agent-BOM (CycloneDX), Delegation Chain governance, Federated Trust Exchange, and CARE (Continuous Audit Readiness Engine).' },
];

const VERTICALS = [
  { label: 'SEXTANT Maritime', color: '#8a8a8a', ops: 'Fleet ops, port scheduling, demurrage risk' },
  { label: 'KORA Revenue', color: '#c9b787', ops: 'Pipeline velocity, deal health, CRM signals' },
  { label: 'Counsel', color: '#8a8a8a', ops: 'Matter tracking, discovery deadlines, litigation risk' },
  { label: 'DOMAINE Real Estate', color: '#c9b787', ops: 'Cap rate monitoring, portfolio valuation' },
  { label: 'PARAGON Defense', color: '#f5f5f5', ops: 'Threat intel, posture assessment, SIGINT' },
  { label: 'Carlota Jo', color: '#c9b787', ops: 'Advisory matters, client signals, brief generation' },
  { label: 'Alloy Core', color: '#8a8a8a', ops: 'Fabric health, proof integrity, operator performance' },
];

const PRINCIPLES = [
  { title: 'No Silent Execution', body: 'No material action executes without explicit human approval. The APPROVE stage in the fabric pipeline is structural — it cannot be bypassed by configuration, prompt injection, or agent escalation.' },
  { title: 'Proof-Carrying Execution', body: 'Every governed workcell produces a Proof-Carrying Execution (PCE) contract — a cryptographic record of the originating signal, policy evaluation, approval actor, and output hash. The board-level audit trail is not compliance theater.' },
  { title: 'MirrorEval', body: 'Every recommendation is tested against its counterfactual. A11oy does not present a single answer — it presents the recommended path, the alternative, and the confidence delta between them. You choose.' },
  { title: 'No Single-Model Dependency', body: 'A11oy routes inference tasks to the optimal model based on task type, domain, token budget, and latency requirements. No lock-in to any single provider. Sovereign inference (air-gapped) is on the roadmap for defense use.' },
  { title: 'Domain-Specialized Operators', body: 'Each vertical has dedicated agent operators with domain-specific skills, tool access, and policy constraints. Operators cannot exceed their provisioned scope. Every skill call is logged.' },
  { title: 'Governed Autonomy', body: 'A11oy is not autonomous by default. It is governed-autonomous — it can sense, reason, and recommend at machine speed, but execution authority remains with human operators. Autonomy expands incrementally as trust is earned and proven.' },
  { title: 'Glasswing Transparency', body: 'The Glasswing distinction layer makes governance verifiable from the outside. Public trust portal, CAVD coordinated agent-vulnerability disclosure, 90-day transparency reports, adversarial robustness wall, and constitution-as-code DSL — all published under the Mythos Doctrine Open Spec (CC-BY-4.0). Every claim backed by an artifact.' },
];

const TEAM_CREDITS = [
  { role: 'Fabric Architecture', note: 'Seven-layer governed execution design' },
  { role: 'MirrorEval Framework', note: 'Recommendation vs. counterfactual evaluation' },
  { role: 'Covenant Layer', note: 'Constitutional policy gate enforcement' },
  { role: 'PCE Contracts', note: 'Proof-carrying execution formalism' },
  { role: 'Domain Signal Schemas', note: 'Cross-vertical signal normalization' },
];

export function About() {
  return (
    <Layout>
      <PageHeader
        label="ABOUT A11OY"
        title="A11oy — Live Enterprise Execution Fabric"
        subtitle="A11oy (pronounced Alloy) is a governed autonomous AI layer for complex enterprise operations. It senses, structures, correlates, explains, recommends, governs, executes, verifies, and proves — across any enterprise vertical."
        status="LIVE"
      />

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* What A11oy is */}
        <div>
          <SectionTitle>What A11oy Is</SectionTitle>
          <Card>
            <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: '1.8' }}>
              A11oy is the execution fabric that sits between your enterprise data and your decision-makers. It continuously monitors signals across all your verticals, assembles causal context, evaluates recommended actions against counterfactuals, gates every material action through human approval, and produces a cryptographic proof trail for every decision.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: '1.8' }}>
              A11oy is not a chatbot. It is not a workflow automation tool. It is not another dashboard. It is the operational intelligence layer that transforms your enterprise signals into governed, provable actions — at machine speed, with human authority.
            </p>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
              The pipeline: Sense → Structure → Correlate → Explain → Recommend → <span style={{ color: '#8a8a8a' }}>Approve</span> → Execute → Verify → Prove
            </div>
          </Card>
        </div>

        {/* Fabric Layers */}
        <div>
          <SectionTitle>The Nine Fabric Layers</SectionTitle>
          <div className="flex flex-col gap-2">
            {FABRIC_LAYERS.map(layer => (
              <div key={layer.n} className="flex items-start gap-3 p-3 rounded border" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ backgroundColor: 'rgba(138,138,138,0.15)', color: '#8a8a8a' }}>
                  {layer.n}
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{layer.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{layer.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Design Principles */}
      <SectionTitle>Design Principles</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PRINCIPLES.map(p => (
          <Card key={p.title}>
            <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{p.title}</div>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: '1.7' }}>{p.body}</p>
          </Card>
        ))}
      </div>

      {/* Verticals */}
      <SectionTitle>Enterprise Verticals</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {VERTICALS.map(v => (
          <div key={v.label} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${v.color}` }}>
            <div className="font-medium text-sm mb-1" style={{ color: v.color }}>{v.label}</div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{v.ops}</div>
          </div>
        ))}
      </div>

      {/* Technical Stack Credits */}
      <SectionTitle>Technical Foundation</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {TEAM_CREDITS.map(c => (
          <Card key={c.role} className="text-xs">
            <div className="font-medium mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{c.role}</div>
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.note}</div>
          </Card>
        ))}
      </div>

    </Layout>
  );
}
