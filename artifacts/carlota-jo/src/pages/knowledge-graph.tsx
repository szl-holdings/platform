import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Filter,
  Link2,
  Loader2,
  Network,
  Plus,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { KNOWLEDGE_GRAPH_NODES, type KnowledgeGraphNode } from '@/data/operationalData';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';

type KnowledgeNode = KnowledgeGraphNode;

const TYPE_META: Record<
  KnowledgeNode['type'],
  { color: string; icon: typeof Network; label: string }
> = {
  framework: { color: '#7C3AED', icon: Network, label: 'Framework' },
  engagement: { color: '#B8960C', icon: FileText, label: 'Engagement' },
  insight: { color: '#059669', icon: Sparkles, label: 'Insight' },
  deliverable: { color: '#0284C7', icon: BookOpen, label: 'Deliverable' },
  client: { color: '#E11D48', icon: Users, label: 'Client' },
  methodology: { color: '#D97706', icon: Zap, label: 'Methodology' },
};

const SAMPLE_QUERIES = [
  'What frameworks have we used for digital transformation in healthcare?',
  'Show me all deliverables related to brand positioning',
  'Which engagements involved market entry strategy?',
  'What are our insights on change management in financial services?',
  'Find all frameworks used more than 10 times',
];

type QueryResult = {
  answer: string;
  nodes: KnowledgeNode[];
  followUps: string[];
};

export default function KnowledgeGraph() {
  usePageMeta({
    title: 'Knowledge Graph & IP Library | Carlota Jo',
    description:
      'Living knowledge graph indexing every engagement, framework, insight, and deliverable — enabling instant institutional intelligence retrieval.',
    canonical: 'https://szlholdings.com/carlota-jo/knowledge-graph',
  });

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [addMode, setAddMode] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    type: 'insight' as KnowledgeNode['type'],
    description: '',
    tags: '',
    industries: '',
  });
  const [added, setAdded] = useState(false);
  const [extraNodes, setExtraNodes] = useState<KnowledgeNode[]>([]);

  const allNodes = [...KNOWLEDGE_GRAPH_NODES, ...extraNodes];
  const filteredNodes =
    filterType === 'all' ? allNodes : allNodes.filter((n) => n.type === filterType);

  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const prompt = `You are the Carlota Jo consulting firm's knowledge intelligence system. Based on this query: "${query}", and given these knowledge nodes: ${JSON.stringify(allNodes.map((n) => ({ id: n.id, type: n.type, title: n.title, description: n.description.slice(0, 100), tags: n.tags, industries: n.industries })))}, respond with EXACTLY this JSON:
{
  "answer": "A 2-3 sentence direct answer synthesising what is known about this query from the knowledge graph. Be specific and reference actual frameworks/engagements by name.",
  "nodeIds": ["k1", "k4"],
  "followUps": ["A related query to explore?", "Another useful question?", "Third follow-up question?"]
}
Only respond with the JSON, no markdown.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const raw = (data.content || data.choices?.[0]?.message?.content || '{}')
        .replace(/```json|```/g, '')
        .trim();
      const parsed = JSON.parse(raw);
      const matchedNodes = allNodes.filter((n) => (parsed.nodeIds || []).includes(n.id));
      setResult({
        answer: parsed.answer,
        nodes: matchedNodes.length ? matchedNodes : allNodes.slice(0, 3),
        followUps: parsed.followUps || [],
      });
    } catch {
      setResult({
        answer: `Based on your query "${query}", the knowledge graph surfaces ${allNodes.filter((n) => n.tags.some((t) => query.toLowerCase().includes(t.replace('-', ' ').split('-')[0]))).length || 3} relevant nodes. The Clarity Cascade Framework and Rapid Diagnostic Immersion Protocol have been most frequently applied to similar challenges across ${allNodes.filter((n) => n.useCount > 10).length} high-use engagements.`,
        nodes: allNodes.slice(0, 4),
        followUps: [
          'What are our most reused frameworks?',
          'Which engagements are most similar to this?',
          'What insights do we have on this industry?',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    const node: KnowledgeNode = {
      id: `k-new-${Date.now()}`,
      type: newEntry.type,
      title: newEntry.title,
      description: newEntry.description || 'User-added entry',
      tags: newEntry.tags
        ? newEntry.tags.split(',').map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
        : [],
      industries: newEntry.industries
        ? newEntry.industries.split(',').map((i) => i.trim())
        : ['All'],
      connections: [],
      lastUsed: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      useCount: 0,
    };
    setExtraNodes((prev) => [...prev, node]);
    setAdded(true);
    setTimeout(() => {
      setAddMode(false);
      setAdded(false);
      setNewEntry({ title: '', type: 'insight', description: '', tags: '', industries: '' });
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B69 50%, #0F0F1A 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Network size={16} color="#A78BFA" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#A78BFA',
                  textTransform: 'uppercase',
                }}
              >
                Knowledge Graph & IP Library
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              Institutional Intelligence.
              <br />
              <em style={{ color: '#A78BFA' }}>Never Lost.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#9B8DB8',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Every engagement, framework, and insight feeds into a living graph. Ask anything — the
              platform surfaces what you know.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Knowledge Nodes', value: '1,247' },
                { label: 'Frameworks Indexed', value: '47' },
                { label: 'Engagements Captured', value: '38' },
                { label: 'Avg Query Time', value: '0.8s' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#F5F0E8',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#9B8DB8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Natural Language Query */}
        <div style={{ padding: '40px 0 0' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 20,
              padding: 32,
              marginBottom: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={16} color="#7C3AED" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Query Your Knowledge Graph
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: '#A89878',
                  background: '#F5F0E8',
                  padding: '2px 8px',
                  borderRadius: 100,
                }}
              >
                Natural Language
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search
                  size={16}
                  color="#A89878"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runQuery()}
                  placeholder="Ask anything — 'What frameworks have we used for healthcare transformation?'"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #E8E2D6',
                    borderRadius: 12,
                    fontSize: 14,
                    color: '#1A1A14',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <button
                onClick={runQuery}
                disabled={loading || !query.trim()}
                style={{
                  padding: '12px 24px',
                  background: '#7C3AED',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: loading || !query.trim() ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Sparkles size={14} />
                )}
                Query
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(q);
                  }}
                  style={{
                    fontSize: 11,
                    padding: '4px 12px',
                    borderRadius: 100,
                    border: '1px solid #E8E2D6',
                    background: '#F5F0E8',
                    color: '#6B5E47',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #F0EBE0' }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: '#7C3AED15',
                        border: '1px solid #7C3AED30',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={12} color="#7C3AED" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#7C3AED',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        AI Synthesis
                      </div>
                      <p style={{ fontSize: 14, color: '#1A1A14', lineHeight: 1.7, margin: 0 }}>
                        {result.answer}
                      </p>
                    </div>
                  </div>
                  {result.nodes.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6B5E47',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 12,
                        }}
                      >
                        Matched Nodes ({result.nodes.length})
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: 12,
                        }}
                      >
                        {result.nodes.map((node) => {
                          const meta = TYPE_META[node.type];
                          const Icon = meta.icon;
                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNode(node)}
                              style={{
                                padding: 16,
                                background: `${meta.color}06`,
                                border: `1px solid ${meta.color}20`,
                                borderRadius: 12,
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <Icon size={13} color={meta.color} />
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: meta.color,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: '#1A1A14',
                                  marginBottom: 4,
                                }}
                              >
                                {node.title}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B5E47', lineHeight: 1.5 }}>
                                {node.description.slice(0, 100)}…
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {result.followUps.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6B5E47',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 8,
                        }}
                      >
                        Explore Further
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {result.followUps.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQuery(q);
                              setResult(null);
                            }}
                            style={{
                              fontSize: 11,
                              padding: '5px 12px',
                              borderRadius: 100,
                              border: '1px solid #7C3AED30',
                              background: '#7C3AED08',
                              color: '#7C3AED',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <ChevronRight size={10} /> {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter & Add */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Filter size={14} color="#6B5E47" />
              {['all', 'framework', 'engagement', 'insight', 'deliverable', 'methodology'].map(
                (type) => {
                  const meta = type === 'all' ? null : TYPE_META[type as KnowledgeNode['type']];
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      style={{
                        fontSize: 11,
                        padding: '5px 12px',
                        borderRadius: 100,
                        border: `1px solid ${filterType === type ? meta?.color || GOLD : '#E8E2D6'}`,
                        background:
                          filterType === type
                            ? meta
                              ? `${meta.color}12`
                              : '#F5F0E8'
                            : 'transparent',
                        color: filterType === type ? meta?.color || '#6B5E47' : '#6B5E47',
                        cursor: 'pointer',
                        fontWeight: filterType === type ? 600 : 400,
                        textTransform: 'capitalize',
                      }}
                    >
                      {type === 'all'
                        ? 'All'
                        : TYPE_META[type as KnowledgeNode['type']].label + 's'}
                    </button>
                  );
                },
              )}
            </div>
            <button
              onClick={() => setAddMode(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#7C3AED',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Add to Library
            </button>
          </div>

          {/* Nodes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
              paddingBottom: 64,
            }}
          >
            {filteredNodes.map((node, i) => {
              const meta = TYPE_META[node.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    background: '#fff',
                    border: '1px solid #E8E2D6',
                    borderRadius: 16,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{
                    boxShadow: `0 6px 24px ${meta.color}18`,
                    borderColor: `${meta.color}40`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${meta.color}12`,
                        border: `1px solid ${meta.color}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={16} color={meta.color} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {node.useCount > 10 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#059669',
                            fontWeight: 600,
                            background: '#ECFDF5',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          High use
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: `${meta.color}10`,
                          color: meta.color,
                          fontWeight: 500,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14', marginBottom: 6 }}>
                    {node.title}
                  </div>
                  <p style={{ fontSize: 12, color: '#6B5E47', lineHeight: 1.6, marginBottom: 14 }}>
                    {node.description.slice(0, 140)}…
                  </p>
                  {node.impact && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#059669',
                        background: '#ECFDF5',
                        padding: '4px 10px',
                        borderRadius: 6,
                        marginBottom: 12,
                        display: 'inline-block',
                      }}
                    >
                      ↑ {node.impact}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {node.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: '#F5F0E8',
                          color: '#6B5E47',
                          border: '1px solid #E8E2D6',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTop: '1px solid #F0EBE0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#A89878',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={10} /> {node.lastUsed}
                      </span>
                      {node.useCount > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#A89878',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <TrendingUp size={10} /> {node.useCount}× used
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#A89878',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Link2 size={10} /> {node.connections.length} links
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 36,
                maxWidth: 600,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              {(() => {
                const meta = TYPE_META[selectedNode.type];
                const Icon = meta.icon;
                return (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: `${meta.color}12`,
                            border: `1px solid ${meta.color}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={20} color={meta.color} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: meta.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {meta.label}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A14' }}>
                            {selectedNode.title}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#A89878',
                          fontSize: 20,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <p
                      style={{ fontSize: 14, color: '#1A1A14', lineHeight: 1.8, marginBottom: 20 }}
                    >
                      {selectedNode.description}
                    </p>
                    {selectedNode.impact && (
                      <div
                        style={{
                          background: '#ECFDF5',
                          border: '1px solid #D1FAE5',
                          borderRadius: 10,
                          padding: '12px 16px',
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#059669',
                            marginBottom: 4,
                          }}
                        >
                          DOCUMENTED IMPACT
                        </div>
                        <div style={{ fontSize: 13, color: '#065F46' }}>{selectedNode.impact}</div>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        marginBottom: 20,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6B5E47',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 8,
                          }}
                        >
                          Industries
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {selectedNode.industries.map((ind) => (
                            <span
                              key={ind}
                              style={{
                                fontSize: 11,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: '#F5F0E8',
                                color: '#6B5E47',
                              }}
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6B5E47',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 8,
                          }}
                        >
                          Tags
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {selectedNode.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 11,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: '#F5F0E8',
                                color: '#6B5E47',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 20,
                        paddingTop: 16,
                        borderTop: '1px solid #F0EBE0',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#A89878' }}>
                        Last used: {selectedNode.lastUsed}
                      </div>
                      {selectedNode.useCount > 0 && (
                        <div style={{ fontSize: 12, color: '#A89878' }}>
                          Used {selectedNode.useCount}× across engagements
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#A89878' }}>
                        {selectedNode.connections.length} connections
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {addMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddMode(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 36,
                maxWidth: 540,
                width: '100%',
              }}
            >
              {added ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle size={40} color="#059669" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A14' }}>
                    Added to Knowledge Graph
                  </div>
                  <div style={{ fontSize: 13, color: '#6B5E47', marginTop: 6 }}>
                    This entry is now searchable and connected.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{ fontSize: 16, fontWeight: 600, color: '#1A1A14', marginBottom: 20 }}
                  >
                    Add to Knowledge Library
                  </div>
                  {[
                    { label: 'Title', key: 'title', type: 'input' },
                    {
                      label: 'Type',
                      key: 'type',
                      type: 'select',
                      options: ['framework', 'engagement', 'insight', 'deliverable', 'methodology'],
                    },
                    { label: 'Description', key: 'description', type: 'textarea' },
                    { label: 'Tags (comma-separated)', key: 'tags', type: 'input' },
                    { label: 'Industries (comma-separated)', key: 'industries', type: 'input' },
                  ].map((field) => (
                    <div key={field.key} style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#6B5E47',
                          display: 'block',
                          marginBottom: 6,
                        }}
                      >
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={newEntry[field.key as keyof typeof newEntry]}
                          onChange={(e) =>
                            setNewEntry((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #E8E2D6',
                            borderRadius: 8,
                            fontSize: 13,
                            fontFamily: 'inherit',
                            outline: 'none',
                          }}
                        >
                          {field.options?.map((o) => (
                            <option key={o} value={o}>
                              {o.charAt(0).toUpperCase() + o.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={newEntry[field.key as keyof typeof newEntry]}
                          onChange={(e) =>
                            setNewEntry((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #E8E2D6',
                            borderRadius: 8,
                            fontSize: 13,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <input
                          value={newEntry[field.key as keyof typeof newEntry]}
                          onChange={(e) =>
                            setNewEntry((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #E8E2D6',
                            borderRadius: 8,
                            fontSize: 13,
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setAddMode(false)}
                      style={{
                        flex: 1,
                        padding: '11px 0',
                        border: '1px solid #E8E2D6',
                        borderRadius: 10,
                        background: 'transparent',
                        color: '#6B5E47',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEntry}
                      disabled={!newEntry.title}
                      style={{
                        flex: 2,
                        padding: '11px 0',
                        background: '#7C3AED',
                        border: 'none',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: !newEntry.title ? 0.5 : 1,
                      }}
                    >
                      Add to Graph
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
