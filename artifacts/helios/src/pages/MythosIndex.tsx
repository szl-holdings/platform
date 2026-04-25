import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Brain,
  Building2,
  Code2,
  FlaskConical,
  GitBranch,
  Search,
  User,
  Waves,
} from 'lucide-react';
import { useState } from 'react';
import { heliosApi, type MythosNode } from '../lib/api';

const NODE_META: Record<MythosNode['kind'], { color: string; bg: string; Icon: React.ElementType }> = {
  concept:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   Icon: Brain },
  repo:      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   Icon: Code2 },
  paper:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   Icon: BookOpen },
  vendor:    { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   Icon: Building2 },
  benchmark: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', Icon: FlaskConical },
  technique: { color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',  Icon: GitBranch },
  person:    { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  Icon: User },
};

const RELATION_COLORS: Record<string, string> = {
  'cites':          '#60a5fa',
  'implements':     '#34d399',
  'competes-with':  '#f87171',
  'benchmarked-on': '#a78bfa',
  'authored-by':    '#fb923c',
  'extends':        '#f59e0b',
};

function NodeCard({ node, onClick, selected }: { node: MythosNode; onClick: () => void; selected: boolean }) {
  const meta = NODE_META[node.kind];
  const { Icon } = meta;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
        background: selected ? meta.bg : 'var(--helios-card)',
        border: `1px solid ${selected ? meta.color + '40' : 'var(--helios-border)'}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: meta.bg, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--helios-text)', marginBottom: 2 }}>
            {node.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: meta.color }}>
              {node.kind}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--helios-text-muted)' }}>
              {node.linkedSignalCount} signals
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--helios-text-dim)', lineHeight: 1.4 }}>
            {node.description}
          </div>
          {node.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
              {node.tags.slice(0, 4).map((t) => (
                <span key={t} style={{ padding: '1px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, fontSize: '0.65rem', color: 'var(--helios-text-muted)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.67rem', color: meta.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
          {Math.round(node.relevanceScore * 100)}
        </div>
      </div>
    </div>
  );
}

function EdgeList({ edges }: { edges: Array<{ source: string; target: string; relation: string }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {edges.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ color: 'var(--helios-text-dim)', flex: 1, truncate: true }}>{e.source}</span>
          <span style={{ padding: '1px 6px', borderRadius: 3, background: `${RELATION_COLORS[e.relation] ?? '#888'}18`, color: RELATION_COLORS[e.relation] ?? '#888', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
            {e.relation}
          </span>
          <span style={{ color: 'var(--helios-text-dim)', flex: 1, textAlign: 'right' }}>{e.target}</span>
        </div>
      ))}
    </div>
  );
}

export default function MythosIndex() {
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<MythosNode | null>(null);
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mythos-search', submitted],
    queryFn: () => heliosApi.searchMythos(submitted),
    enabled: submitted.length > 0,
  });

  const { data: nodeDetail } = useQuery({
    queryKey: ['mythos-node', selectedNode?.id],
    queryFn: () => heliosApi.getMythosNode(selectedNode!.id),
    enabled: !!selectedNode,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    setSelectedNode(null);
  };

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Brain size={20} color="var(--helios-amber)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
            Mythos Index
          </h1>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Semantic knowledge graph — concepts, repos, papers, vendors, benchmarks, and techniques from the frontier. Query by meaning, traverse by relationship.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--helios-text-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "agentic reasoning", "ManipArena", "Credo Weaver", "sovereign AI"'
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                background: 'var(--helios-card)', border: '1px solid var(--helios-border)',
                borderRadius: 8, fontSize: '0.875rem', color: 'var(--helios-text)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '10px 18px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, fontSize: '0.825rem', color: 'var(--helios-amber)', cursor: 'pointer', fontWeight: 600,
          }}>
            Search
          </button>
        </div>
        {/* Quick suggestions */}
        {!submitted && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {['agentic AI', 'NVIDIA Vera Rubin', 'SWE-bench', 'MENA sovereign AI', 'embodied robotics', 'ManipArena'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuery(s); setSubmitted(s); }}
                style={{ padding: '4px 10px', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--helios-text-dim)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {submitted && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Results */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--helios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              {isLoading ? 'Searching…' : `${nodes.length} nodes for "${submitted}"`}
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="section-card" style={{ padding: 14, opacity: 0.5 }}>
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 3, width: '50%', marginBottom: 6 }} />
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 3, width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nodes.map((n) => (
                  <NodeCard key={n.id} node={n} selected={selectedNode?.id === n.id} onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)} />
                ))}
              </div>
            )}

            {/* Edges */}
            {edges.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--helios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Waves size={11} />
                  Graph Edges ({edges.length})
                </div>
                <div className="section-card" style={{ padding: 12 }}>
                  <EdgeList edges={edges} />
                </div>
              </div>
            )}
          </div>

          {/* Node detail panel */}
          {selectedNode && nodeDetail && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--helios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                1-Hop Neighbourhood
              </div>
              <div className="section-card" style={{ padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <NodeCard node={nodeDetail.node} selected={true} onClick={() => {}} />
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--helios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Neighbours ({nodeDetail.neighbors.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {nodeDetail.neighbors.map((n) => {
                    const edge = nodeDetail.edges.find(e => e.source === nodeDetail.node.id && e.target === n.id || e.target === nodeDetail.node.id && e.source === n.id);
                    return (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <NodeCard node={n} selected={false} onClick={() => setSelectedNode(n)} />
                        </div>
                        {edge && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: RELATION_COLORS[edge.relation] ?? '#888', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                            {edge.relation}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--helios-text-muted)' }}>
          <Brain size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.95rem' }}>
            Query the shared semantic layer
          </div>
          <div style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
            Search by concept, vendor, technique, or paper.<br/>
            Traverse the knowledge graph to discover relationships across the frontier.
          </div>
        </div>
      )}
    </div>
  );
}
