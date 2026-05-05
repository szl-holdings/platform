import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type CatalogKind = 'model' | 'tool' | 'skill' | 'protocol';

interface CatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  provider: string;
  desc: string;
  tags: string[];
  tier: 'standard' | 'elevated' | 'sovereign';
  status: 'live' | 'roadmap';
  protocols?: string[];
}

const CATALOG: CatalogItem[] = [
  { id: 'm1', kind: 'model', name: 'GPT-5.1', provider: 'OpenAI', desc: 'Frontier reasoning model for complex multi-step workflows and governance eval.', tags: ['reasoning', 'eval', 'long-context'], tier: 'elevated', status: 'live', protocols: ['REST', 'A2A'] },
  { id: 'm2', kind: 'model', name: 'Claude 4 Opus', provider: 'Anthropic', desc: 'Constitutional AI alignment. Best for privileged document analysis, legal, board-level synthesis.', tags: ['constitutional', 'legal', 'sovereign'], tier: 'sovereign', status: 'live', protocols: ['REST'] },
  { id: 'm3', kind: 'model', name: 'Claude 4 Sonnet', provider: 'Anthropic', desc: 'Fast, capable for most governed workflows. Strong instruction-following.', tags: ['fast', 'instruction-following'], tier: 'standard', status: 'live', protocols: ['REST', 'MCP'] },
  { id: 'm4', kind: 'model', name: 'Gemini 2.5 Pro', provider: 'Google', desc: 'Multi-modal specialist. Satellite imagery, documents, audio, and vision workflows.', tags: ['multimodal', 'vision', 'documents'], tier: 'elevated', status: 'live', protocols: ['REST', 'A2A'] },
  { id: 'm5', kind: 'model', name: 'o4-mini', provider: 'OpenAI', desc: 'Sub-500ms triage and classification. High-throughput workloads.', tags: ['fast-triage', 'classification', 'high-throughput'], tier: 'standard', status: 'live', protocols: ['REST'] },
  { id: 'm6', kind: 'model', name: 'Llama 4 Maverick', provider: 'Meta', desc: 'Open-weight model for sovereign air-gapped deployments. No external calls.', tags: ['open-weight', 'sovereign', 'air-gapped'], tier: 'sovereign', status: 'live', protocols: ['local'] },
  { id: 'm7', kind: 'model', name: 'DeepSeek V4-Pro', provider: 'DeepSeek', desc: '236B MoE (22B active). Mathematical reasoning and portfolio analytics.', tags: ['math', 'financial-modeling', 'MoE'], tier: 'elevated', status: 'live', protocols: ['REST'] },
  { id: 'm8', kind: 'model', name: 'KIMI-K2.5', provider: 'Moonshot', desc: 'Massive long-context specialist. Best for large document corpus synthesis.', tags: ['long-context', 'synthesis', 'research'], tier: 'standard', status: 'live', protocols: ['REST'] },
  { id: 't1', kind: 'tool', name: 'AIS Fleet Tracker', provider: 'Cascade Navigator', desc: 'Real-time AIS stream ingestion, vessel position, port congestion signals.', tags: ['maritime', 'AIS', 'realtime'], tier: 'standard', status: 'live', protocols: ['MCP'] },
  { id: 't2', kind: 'tool', name: 'Covenant Policy Gate', provider: 'A11oy Platform', desc: 'Evaluates every agent action against the active Constitution. Blocks on policy violation.', tags: ['governance', 'policy', 'covenant'], tier: 'elevated', status: 'live', protocols: ['A2A', 'ACP'] },
  { id: 't3', kind: 'tool', name: 'Proof Chain Recorder', provider: 'A11oy Platform', desc: 'Cryptographically hashes and attests every reasoning node in an execution.', tags: ['proof', 'attestation', 'audit'], tier: 'elevated', status: 'live', protocols: ['ACP'] },
  { id: 't4', kind: 'tool', name: 'Shadow Council Reviewer', provider: 'A11oy Platform', desc: 'Adversarial pre-deploy review panel. Runs 6 challenge classes before a Recipe goes live.', tags: ['adversarial', 'review', 'pre-deploy'], tier: 'elevated', status: 'live', protocols: ['internal'] },
  { id: 't5', kind: 'tool', name: 'Decision-Twin PRISM', provider: 'A11oy Platform', desc: 'Simulates agent decisions against historical data before live deployment.', tags: ['simulation', 'pre-deploy', 'PRISM'], tier: 'elevated', status: 'live', protocols: ['internal'] },
  { id: 't6', kind: 'tool', name: 'Sanctions Screen', provider: 'OFAC / UN', desc: 'Real-time entity screening against OFAC, UN, EU sanctions lists.', tags: ['compliance', 'sanctions', 'screening'], tier: 'elevated', status: 'live', protocols: ['MCP'] },
  { id: 's1', kind: 'skill', name: 'Parallel Research Swarm', provider: 'PRAXIS / A11oy', desc: 'Multi-agent research with gatherer, peer-reviewer, drafter, and verifier lanes.', tags: ['research', 'multi-agent', 'synthesis'], tier: 'standard', status: 'live', protocols: ['A2A'] },
  { id: 's2', kind: 'skill', name: 'Memory Fabric', provider: 'PRAXIS / A11oy', desc: 'Four-tier memory: working, session, episodic, semantic. Persistent across workcell runs.', tags: ['memory', 'persistence', 'semantic'], tier: 'standard', status: 'live', protocols: ['MCP'] },
  { id: 's3', kind: 'skill', name: 'Cross-App Orchestrator', provider: 'PRAXIS / A11oy', desc: 'Routes tasks across multiple A11oy agents with ExplainPanel attribution.', tags: ['orchestration', 'cross-app', 'explain'], tier: 'elevated', status: 'live', protocols: ['A2A', 'ACP'] },
  { id: 's4', kind: 'skill', name: 'Evidence Extractor', provider: 'A11oy', desc: 'Extracts and cites evidence from document corpora with hallucination detection.', tags: ['evidence', 'citations', 'legal'], tier: 'elevated', status: 'live', protocols: ['MCP'] },
  { id: 's5', kind: 'skill', name: 'Entity Graph Builder', provider: 'A11oy', desc: 'Constructs knowledge graphs from unstructured data. Detects relationship anomalies.', tags: ['graph', 'entities', 'knowledge'], tier: 'standard', status: 'live', protocols: ['MCP'] },
  { id: 'p1', kind: 'protocol', name: 'MCP', provider: 'Anthropic (open)', desc: 'Model Context Protocol. Connect tools and context sources to any model.', tags: ['context', 'tools', 'open'], tier: 'standard', status: 'live' },
  { id: 'p2', kind: 'protocol', name: 'A2A', provider: 'Google (open)', desc: 'Agent-to-Agent protocol for multi-agent coordination and task delegation.', tags: ['multi-agent', 'delegation', 'open'], tier: 'standard', status: 'live' },
  { id: 'p3', kind: 'protocol', name: 'ACP', provider: 'IBM (open)', desc: 'Agent Communication Protocol for enterprise agent interoperability.', tags: ['enterprise', 'interop', 'open'], tier: 'elevated', status: 'live' },
  { id: 'p4', kind: 'protocol', name: 'ANP', provider: 'A11oy', desc: 'Agent Notarization Protocol — A11oy-native protocol for attested, proof-bound agent calls.', tags: ['attestation', 'proof', 'native'], tier: 'sovereign', status: 'live' },
];

const KIND_LABELS: Record<CatalogKind, string> = { model: 'Model', tool: 'Tool', skill: 'Skill', protocol: 'Protocol' };
const KIND_COLORS: Record<CatalogKind, string> = { model: '#c9b787', tool: '#8a8a8a', skill: '#a78bfa', protocol: '#22c55e' };
const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  standard:  { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a' },
  elevated:  { bg: 'rgba(201,183,135,0.12)', color: '#c9b787' },
  sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

export function FoundryCatalog() {
  const [filterKind, setFilterKind] = useState<CatalogKind | 'all'>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const allProtocols = Array.from(new Set(CATALOG.flatMap(c => c.protocols ?? []))).sort();

  const filtered = CATALOG.filter(c => {
    if (filterKind !== 'all' && c.kind !== filterKind) return false;
    if (filterTier !== 'all' && c.tier !== filterTier) return false;
    if (filterProtocol !== 'all' && !(c.protocols ?? []).includes(filterProtocol)) return false;
    if (search && ![c.name, c.desc, c.provider, ...c.tags].join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / CATALOG"
        title="Capability Catalog"
        subtitle="Every model, tool, skill, and protocol available in Agent Foundry. Filter by kind, governance tier, or protocol to find the right capability for your Agent Recipe."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="MODELS" value={String(CATALOG.filter(c => c.kind === 'model').length)} sub="registered" accent={GOLD} />
        <KpiCard label="TOOLS" value={String(CATALOG.filter(c => c.kind === 'tool').length)} sub="available" accent={GOLD} />
        <KpiCard label="SKILLS" value={String(CATALOG.filter(c => c.kind === 'skill').length)} sub="primitives" accent="#a78bfa" />
        <KpiCard label="PROTOCOLS" value={String(CATALOG.filter(c => c.kind === 'protocol').length)} sub="MCP/A2A/ACP/ANP" accent="#22c55e" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search catalog…"
          className="px-3 py-2 rounded-lg text-xs bg-transparent border outline-none flex-1 min-w-48"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)', placeholderColor: 'var(--color-a11oy-text-ghost)' }}
        />
        {(['all', 'model', 'tool', 'skill', 'protocol'] as const).map(k => (
          <button key={k} type="button" onClick={() => setFilterKind(k)}
            className="px-3 py-2 rounded-lg text-xs font-mono transition-colors"
            style={{ background: filterKind === k ? 'rgba(201,183,135,0.12)' : 'transparent', color: filterKind === k ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterKind === k ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            {k === 'all' ? 'All' : KIND_LABELS[k]}
          </button>
        ))}
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs bg-transparent border outline-none"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
          <option value="all">All Tiers</option>
          <option value="standard">Standard</option>
          <option value="elevated">Elevated</option>
          <option value="sovereign">Sovereign</option>
        </select>
        <select value={filterProtocol} onChange={e => setFilterProtocol(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs bg-transparent border outline-none"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
          <option value="all">All Protocols</option>
          {allProtocols.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
        Showing {filtered.length} of {CATALOG.length} capabilities
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(item => {
          const tier = TIER_COLORS[item.tier];
          const isOpen = expanded === item.id;
          return (
            <div key={item.id}
              className="rounded-lg border p-4 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isOpen ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
              onClick={() => setExpanded(isOpen ? null : item.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${KIND_COLORS[item.kind]}18`, color: KIND_COLORS[item.kind] }}>
                    {KIND_LABELS[item.kind]}
                  </span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.color }}>
                    {item.tier}
                  </span>
                </div>
                {item.status === 'live' ? (
                  <span className="text-xs font-mono flex items-center gap-1" style={{ color: '#22c55e' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />LIVE
                  </span>
                ) : (
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ROADMAP</span>
                )}
              </div>
              <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{item.name}</div>
              <div className="text-xs mb-2" style={{ color: GOLD }}>{item.provider}</div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.6 }}>{item.desc}</p>
              {isOpen && (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => (
                      <span key={t} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>#{t}</span>
                    ))}
                  </div>
                  {item.protocols && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.protocols.map(p => (
                        <span key={p} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {isOpen ? '↑ collapse' : '↓ details'}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
