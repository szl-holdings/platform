import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';

const LAYERS = [
  { id: 1, name: 'Signal Mesh', description: 'Ingests, normalizes, deduplicates, and routes business signals from all connected sources.', status: 'operational', latency: '12ms', throughput: '2,400 events/hr', health: 99, color: '#8a8a8a' },
  { id: 2, name: 'Causal Core', description: 'Traces signal causality, builds evidence graphs, and surfaces correlated events for operator review.', status: 'operational', latency: '28ms', throughput: '840 graphs/hr', health: 98, color: '#c9b787' },
  { id: 3, name: 'Context Engine', description: 'Assembles context packs for workcells — enriches signals with historical data, domain schemas, and operator instructions.', status: 'operational', latency: '45ms', throughput: '420 packs/hr', health: 97, color: '#8a8a8a' },
  { id: 4, name: 'Workcell Engine', description: 'Provisions, executes, and monitors governed workcells. Binds agents, tools, policies, and proof trails.', status: 'operational', latency: '820ms avg', throughput: '48 cells/hr', health: 96, color: '#8a8a8a' },
  { id: 5, name: 'Covenant Layer', description: 'Policy gate enforcement — every action passes through the Covenant Layer before execution. Non-bypassable.', status: 'operational', latency: '8ms', throughput: 'all actions', health: 100, color: '#b08d52' },
  { id: 6, name: 'MirrorEval', description: 'Evaluates recommendations against counterfactuals, computes confidence delta, and generates reasoning chains.', status: 'operational', latency: '1.2s avg', throughput: '240 evals/hr', health: 95, color: '#c9b787' },
  { id: 7, name: 'Proof Ledger', description: 'Appends immutable proof entries for every governed execution. SHA-256 hash chain — no tampering, no silent deletions.', status: 'operational', latency: '4ms', throughput: 'all executions', health: 100, color: '#c9b787' },
];

const CONNECTOR_TARGETS = [
  { name: 'Port Authority API', domain: 'Maritime', status: 'demo', note: 'Compatible target — real credentials required' },
  { name: 'AIS Vessel Tracker', domain: 'Maritime', status: 'demo', note: 'Stream adapter ready — partner integration target' },
  { name: 'Salesforce CRM', domain: 'Revenue', status: 'demo', note: 'Compatible target — OAuth connector needed' },
  { name: 'Clio / LexisNexis', domain: 'Legal', status: 'demo', note: 'Matter data adapter — partner scoping active' },
  { name: 'CoStar / MSCI RCA', domain: 'Real Estate', status: 'demo', note: 'Cap rate feed adapter — data license needed' },
  { name: 'OSINT / SIGINT feeds', domain: 'Defense', status: 'roadmap', note: 'Sovereign air-gapped deployment target' },
];

const MODEL_ROUTES = [
  { condition: 'Classification / intent', model: 'claude-3-haiku', cost: '$0.25/M', latency: '180ms' },
  { condition: 'Primary reasoning', model: 'gpt-4o', cost: '$5/M', latency: '820ms' },
  { condition: 'Long-context analysis', model: 'claude-3.5-sonnet', cost: '$3/M', latency: '640ms' },
  { condition: 'Counterfactual (MirrorEval)', model: 'gpt-4o', cost: '$5/M', latency: '980ms' },
  { condition: 'Defense (air-gapped)', model: 'llama-3-70b (planned)', cost: 'self-hosted', latency: 'TBD' },
];

export function Fabric() {
  return (
    <Layout>
      <PageHeader
        label="FABRIC ARCHITECTURE"
        title="A11oy Execution Fabric"
        subtitle="Seven-layer governed execution fabric. Signal ingestion through proof-carrying execution — every layer monitored, every action traceable."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="FABRIC LAYERS" value={7} sub="all operational" accent="#c9b787" />
        <KpiCard label="AVG HEALTH" value="98%" sub="across all layers" accent="#c9b787" />
        <KpiCard label="AVG LATENCY" value="302ms" sub="end-to-end" accent="#c9b787" />
        <KpiCard label="PROOF INTEGRITY" value="100%" sub="chain intact" accent="#b08d52" />
      </div>

      {/* Layer Architecture */}
      <SectionTitle>Seven Fabric Layers</SectionTitle>
      <div className="flex flex-col gap-3 mb-8">
        {LAYERS.map(layer => (
          <div key={layer.id} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderLeft: `3px solid ${layer.color}` }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ backgroundColor: `${layer.color}18`, color: layer.color }}>
                  {layer.id}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{layer.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>{layer.status}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{layer.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 text-xs">
                <div className="font-mono" style={{ color: layer.color }}>{layer.health}%</div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{layer.latency}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={layer.health} max={100} color={layer.color} />
              <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{layer.throughput}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connector Targets */}
        <div>
          <SectionTitle>Connector Targets</SectionTitle>
          <div className="flex flex-col gap-2">
            {CONNECTOR_TARGETS.map(c => (
              <Card key={c.name} className="text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{c.name}</div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.note}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: c.status === 'demo' ? 'rgba(201,183,135,0.12)' : 'rgba(155,172,196,0.1)', color: c.status === 'demo' ? '#c9b787' : '#5e5e5e' }}>
                      {c.status}
                    </span>
                    <div className="mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.domain}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-3 text-xs p-3 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            All connectors are integration targets. No live data in demo mode. Real connectors require credentials and partner agreements.
          </div>
        </div>

        {/* Model Router */}
        <div>
          <SectionTitle>Model Router</SectionTitle>
          <div className="flex flex-col gap-2 mb-4">
            {MODEL_ROUTES.map((r, i) => (
              <Card key={i} className="text-xs">
                <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-gold)' }}>IF: {r.condition}</div>
                <div className="mb-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>→ {r.model}</div>
                <div className="flex items-center gap-4">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.cost}</span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.latency}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Proof-Carrying Execution explanation */}
          <SectionTitle>Proof-Carrying Execution</SectionTitle>
          <Card className="text-xs">
            <p className="mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Every A11oy workcell is bound by a Proof-Carrying Execution (PCE) contract. The contract specifies: the originating signal, the policy evaluation result, the approval tier, the approved actor, and a cryptographic hash of the complete execution context.
            </p>
            <div className="flex flex-col gap-1.5">
              {['Signal reference', 'Policy clause evaluation', 'Approval actor and timestamp', 'Execution output hash', 'Verification result'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span style={{ color: '#c9b787' }}>✓</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 font-mono text-xs p-2 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.08)', color: '#b08d52', border: '1px solid rgba(176,141,82,0.2)' }}>
              No material action executes without a valid PCE contract.
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
