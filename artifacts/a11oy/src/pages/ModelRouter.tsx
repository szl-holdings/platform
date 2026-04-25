import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI (compatible)', role: 'Primary reasoning', cost: '$5/M tokens', latency: '820ms avg', routed: 1204, domains: ['Revenue', 'Maritime'], status: 'active' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic (compatible)', role: 'Long-context analysis', cost: '$3/M tokens', latency: '640ms avg', routed: 876, domains: ['Legal', 'Defense'], status: 'active' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic (compatible)', role: 'Fast classification', cost: '$0.25/M tokens', latency: '180ms avg', routed: 3210, domains: ['Signal Mesh', 'Routing'], status: 'active' },
  { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'Sovereign / on-prem (future)', role: 'Air-gapped inference', cost: 'Self-hosted', latency: '2,400ms avg', routed: 0, domains: ['Defense (planned)'], status: 'roadmap' },
];

const ROUTING_RULES = [
  { condition: 'Input tokens > 100k', route: 'claude-3-5-sonnet', reason: 'Superior long-context handling' },
  { condition: 'Classification task (intent, severity)', route: 'claude-3-haiku', reason: 'Fast, cost-efficient' },
  { condition: 'Counterfactual or MirrorEval', route: 'gpt-4o', reason: 'Strong comparative reasoning' },
  { condition: 'Legal domain, discovery', route: 'claude-3-5-sonnet', reason: 'Document fidelity' },
  { condition: 'Defense domain (air-gapped)', route: 'llama-3-70b', reason: 'Sovereign inference (roadmap)' },
];

const STATUS_COLORS: Record<string, string> = { active: '#10b981', roadmap: '#9bacc4' };

export function ModelRouter() {
  return (
    <Layout>
      <PageHeader
        label="MODEL ROUTER"
        title="Inference Routing Layer"
        subtitle="A11oy routes inference tasks to the optimal model based on task type, domain, token budget, and latency requirements. No single-model dependency."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="MODELS REGISTERED" value="4" sub="3 active, 1 roadmap" accent="#3b82f6" />
        <KpiCard label="INFERENCES TODAY" value="5,290" sub="Demo estimate" accent="#10b981" />
        <KpiCard label="AVG LATENCY" value="510ms" sub="Weighted avg" accent="#b08d52" />
        <KpiCard label="COST TODAY" value="$0" sub="Demo mode — no real calls" accent="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Registered Models</SectionTitle>
          <div className="flex flex-col gap-3">
            {MODELS.map(m => (
              <Card key={m.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{m.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.provider}</div>
                  </div>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${STATUS_COLORS[m.status]}18`, color: STATUS_COLORS[m.status] }}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.role}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>cost</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.cost}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.latency}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>routed</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.routed.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.domains.map(d => (
                    <span key={d} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{d}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Routing Rules</SectionTitle>
          <div className="flex flex-col gap-2">
            {ROUTING_RULES.map((r, i) => (
              <Card key={i}>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-gold)' }}>IF: {r.condition}</div>
                <div className="text-xs mb-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>→ Route to: <span style={{ color: '#3b82f6' }}>{r.route}</span></div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Reason: {r.reason}</div>
              </Card>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            <DemoBadge /> All inference routing is illustrative. No real model API calls are made in demo mode. Recommendations are scripted demo content.
          </div>
        </div>
      </div>
    </Layout>
  );
}
