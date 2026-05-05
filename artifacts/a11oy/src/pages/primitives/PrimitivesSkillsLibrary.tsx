import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type SkillType = 'Skill' | 'Hook' | 'Command' | 'Agent' | 'MemorySchema' | 'RAGStrategy' | 'Tool';

const TYPE_COLORS: Record<SkillType, string> = {
  Skill: '#4d8fcc', Hook: '#9b7cc8', Command: GOLD, Agent: '#5baa8a', MemorySchema: '#f472b6', RAGStrategy: '#22d3ee', Tool: '#fb923c',
};

interface PrimitiveSkill {
  id: string;
  type: SkillType;
  name: string;
  desc: string;
  from: string;
  diff?: string;
  tags: string[];
  tier: 'standard' | 'elevated';
}

const SKILLS: PrimitiveSkill[] = [
  { id: 'sk-1', type: 'Skill', name: 'extract_evidence', desc: 'Extract and cite evidence from document corpora with hallucination detection.', from: 'PRAXIS', diff: 'Added Proof Chain logging. Hallucination check threshold raised to 94%.', tags: ['evidence', 'legal', 'research'], tier: 'standard' },
  { id: 'sk-2', type: 'Skill', name: 'synthesize_research', desc: 'Merge outputs from multiple Research Swarm lanes into a coherent, cited synthesis.', from: 'PRAXIS', diff: 'Now integrates Memory Fabric episodic tier for historical context.', tags: ['synthesis', 'research', 'multi-lane'], tier: 'standard' },
  { id: 'sk-3', type: 'Skill', name: 'screen_sanctions', desc: 'Screen entities against OFAC, UN, EU sanctions lists in real-time via MCP adapter.', from: 'PRAXIS', diff: 'Added ANP notarization for every screening result. Previously unattested.', tags: ['compliance', 'sanctions', 'maritime'], tier: 'elevated' },
  { id: 'sk-4', type: 'Hook', name: 'on_approval_required', desc: 'Fires when a governed action requires human approval. Routes to approval gateway.', from: 'PRAXIS', diff: 'Added Covenant Lift $ attribution on approval event for ROI tracking.', tags: ['approval', 'governance', 'hook'], tier: 'elevated' },
  { id: 'sk-5', type: 'Hook', name: 'on_policy_block', desc: 'Fires when the Covenant Policy gate blocks an agent action.', from: 'PRAXIS', diff: 'Now emits a Proof Chain node on each block for audit trail.', tags: ['policy', 'block', 'hook'], tier: 'elevated' },
  { id: 'sk-6', type: 'Command', name: 'run_shadow_council', desc: 'Trigger a Shadow Council adversarial review for a recipe or decision.', from: 'A11oy (new)', tags: ['adversarial', 'pre-deploy', 'command'], tier: 'elevated' },
  { id: 'sk-7', type: 'Command', name: 'run_prism_simulation', desc: 'Run Decision-Twin PRISM simulation against historical decisions.', from: 'A11oy (new)', tags: ['simulation', 'prism', 'command'], tier: 'elevated' },
  { id: 'sk-8', type: 'Agent', name: 'research_swarm_agent', desc: 'Four-lane parallel research agent (gatherer, peer-reviewer, drafter, verifier).', from: 'PRAXIS', diff: 'Verifier lane now uses Shadow Council hallucination gate.', tags: ['research', 'multi-agent', 'swarm'], tier: 'standard' },
  { id: 'sk-9', type: 'Agent', name: 'cascade_navigator_agent', desc: 'Maritime command agent with domain expertise in voyage economics and demurrage.', from: 'A11oy (native)', tags: ['maritime', 'agent', 'domain'], tier: 'elevated' },
  { id: 'sk-10', type: 'MemorySchema', name: 'voyage_context_schema', desc: 'Memory schema for voyage planning context: vessel, route, cargo, charter party.', from: 'PRAXIS', diff: 'Added episodic tier index for historical voyage comparison.', tags: ['maritime', 'memory', 'schema'], tier: 'standard' },
  { id: 'sk-11', type: 'MemorySchema', name: 'legal_matter_schema', desc: 'Memory schema for legal matter context: matter ID, parties, deadlines, documents.', from: 'PRAXIS', diff: 'Added privilege flag for attorney-client privileged data handling.', tags: ['legal', 'memory', 'schema'], tier: 'elevated' },
  { id: 'sk-12', type: 'RAGStrategy', name: 'hybrid_semantic_bm25', desc: 'Hybrid retrieval: semantic vector search + BM25 keyword matching. Best for regulatory documents.', from: 'PRAXIS', diff: 'Added Proof Chain citation for each retrieved chunk.', tags: ['retrieval', 'RAG', 'semantic'], tier: 'standard' },
  { id: 'sk-13', type: 'RAGStrategy', name: 'late_chunking_mmr', desc: 'Late-chunking with Maximum Marginal Relevance for diverse, non-redundant document retrieval.', from: 'PRAXIS', tags: ['retrieval', 'RAG', 'mmr'], tier: 'standard' },
  { id: 'sk-14', type: 'Tool', name: 'ais_stream_adapter', desc: 'Real-time AIS stream ingestion via MCP. Vessel position, speed, status, port ETA.', from: 'PRAXIS', diff: 'Added cross-protocol correlation ID to every AIS event.', tags: ['maritime', 'ais', 'realtime', 'tool'], tier: 'standard' },
  { id: 'sk-15', type: 'Tool', name: 'covenant_gate_tool', desc: 'Evaluates agent actions against the active Constitution. Returns pass/block/escalate.', from: 'A11oy (new)', tags: ['governance', 'policy', 'tool'], tier: 'elevated' },
];

export function PrimitivesSkillsLibrary() {
  const [filterType, setFilterType] = useState<SkillType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SKILLS.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (search && ![s.name, s.desc, s.from, ...s.tags].join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allTypes = Object.keys(TYPE_COLORS) as SkillType[];

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / SKILLS LIBRARY"
        title="Skills Library"
        subtitle="50+ adapted primitive skills — each showing the original PRAXIS implementation alongside A11oy's adaptations. Skills are available to any Agent Recipe via the Foundry Catalog."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SKILLS TOTAL" value={String(SKILLS.length)} sub="in library" accent={GOLD} />
        <KpiCard label="PRAXIS PORTED" value={String(SKILLS.filter(s => s.from === 'PRAXIS').length)} sub="with diffs" accent={GOLD} />
        <KpiCard label="A11OY NATIVE" value={String(SKILLS.filter(s => s.from.startsWith('A11oy')).length)} sub="new primitives" accent="#22c55e" />
        <KpiCard label="TYPES" value={String(allTypes.length)} sub="Skill/Hook/Command/…" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills…"
          className="px-3 py-2 rounded-lg text-xs bg-transparent border outline-none flex-1 min-w-40"
          style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
        <button type="button" onClick={() => setFilterType('all')}
          className="px-3 py-2 rounded text-xs font-mono"
          style={{ background: filterType === 'all' ? 'rgba(201,183,135,0.12)' : 'transparent', color: filterType === 'all' ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterType === 'all' ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>All</button>
        {allTypes.map(t => (
          <button key={t} type="button" onClick={() => setFilterType(t)}
            className="px-3 py-2 rounded text-xs font-mono"
            style={{ background: filterType === t ? `${TYPE_COLORS[t]}18` : 'transparent', color: filterType === t ? TYPE_COLORS[t] : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterType === t ? `${TYPE_COLORS[t]}40` : 'transparent'}`, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Showing {filtered.length} of {SKILLS.length} skills</div>

      <div className="space-y-2">
        {filtered.map(sk => {
          const tc = TYPE_COLORS[sk.type];
          const isOpen = expanded === sk.id;
          return (
            <div key={sk.id} className="rounded-lg border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isOpen ? 'rgba(201,183,135,0.25)' : 'var(--color-a11oy-border)' }}
              onClick={() => setExpanded(isOpen ? null : sk.id)}>
              <div className="flex items-start gap-3 p-3">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ backgroundColor: `${tc}18`, color: tc }}>{sk.type}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sk.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sk.desc}</div>
                </div>
                <div className="text-right text-xs shrink-0">
                  <div style={{ color: sk.from.startsWith('A11oy') ? '#22c55e' : GOLD }}>{sk.from}</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sk.tier}</div>
                </div>
              </div>
              {isOpen && (
                <div className="px-3 pb-3 border-t pt-3 space-y-2" style={{ borderColor: 'var(--color-a11oy-border)' }} onClick={e => e.stopPropagation()}>
                  {sk.diff && (
                    <div className="p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)' }}>
                      <div className="font-mono mb-1" style={{ color: GOLD }}>A11oy Adaptation</div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sk.diff}</div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {sk.tags.map(tag => (
                      <span key={tag} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Skills Library ported from PRAXIS (/nexus/skills). Each entry shows the PRAXIS original and A11oy's adaptation diff. A11oy-native skills (marked in green) have no PRAXIS equivalent.
      </div>
    </Layout>
  );
}
