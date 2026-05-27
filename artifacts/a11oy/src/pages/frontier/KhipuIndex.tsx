// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierCard,
  FrontierCitationBanner,
  FrontierMonoBadge,
  FrontierSectionLabel,
  FrontierCrossLinks,
} from './FrontierPrimitives';
import { KHIPU_IDEAS, KHIPU_ACTORS } from '@szl-holdings/frontier-khipu';
import { KhipuGraphCanvas } from './KhipuGraphCanvas';

const API = '/api/a11oy/frontier';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE, MONO } = FRONTIER_TOKENS;

type NodeKind = 'concept' | 'repo' | 'paper' | 'vendor' | 'benchmark' | 'technique' | 'person';

interface KhipuNode {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  tags: string[];
  relevanceScore: number;
  linkedSignalCount: number;
  sourceUrl?: string;
  sourceName?: string;
}

interface KhipuEdge {
  source: string;
  target: string;
  relation: string;
}

const KIND_COLOR: Record<NodeKind, string> = {
  concept: '#8de3b5',
  repo: '#6b8de3',
  paper: '#c9b787',
  vendor: '#e3a66b',
  benchmark: '#e3d36b',
  technique: '#b5e3e3',
  person: '#e36bc9',
};

const FRAMEWORK_CITATIONS: Citation[] = [
  {
    id: 'cit-khipu-aisi', lab: 'UK AI Safety Institute', kind: 'standard',
    title: 'Model Evaluation Standards — Capability Assessment Framework',
    sourceUrl: 'https://www.gov.uk/government/organisations/ai-safety-institute',
    sourceName: 'AISI / DSIT',
    excerpt: 'Structured evaluation protocols for frontier AI capability assessment. Provides the epistemic framework for capability taxonomy used in the Khipu index.',
    date: 'May 2026',
  },
  {
    id: 'cit-khipu-crfm', lab: 'Stanford CRFM', kind: 'lab',
    title: 'HELM: Holistic Evaluation of Language Models',
    sourceUrl: 'https://crfm.stanford.edu/helm',
    sourceName: 'Stanford CRFM',
    excerpt: 'Comprehensive benchmark suite covering accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency. The primary benchmark taxonomy source for the Khipu graph.',
    date: 'May 2026',
  },
  {
    id: 'cit-khipu-deepmind', lab: 'DeepMind Safety Team', kind: 'lab',
    title: 'Specification Gaming: The Flip Side of AI Ingenuity',
    sourceUrl: 'https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/',
    sourceName: 'DeepMind Blog',
    excerpt: 'Taxonomy of reward hacking and specification gaming cases — the primary source for the threat node cluster in the Khipu graph.',
    date: 'May 2026',
  },
];

function buildVendorCitations(nodes: KhipuNode[]): Citation[] {
  return nodes
    .filter(n => (n.kind === 'vendor' || n.kind === 'person') && n.sourceUrl)
    .map(n => ({
      id: `cit-node-${n.id}`,
      lab: n.label,
      kind: (n.kind === 'vendor' ? 'company' : 'academic') as Citation['kind'],
      title: n.description.slice(0, 100) + (n.description.length > 100 ? '…' : ''),
      sourceUrl: n.sourceUrl!,
      sourceName: n.sourceName ?? n.label,
      excerpt: n.description,
      date: 'May 2026',
    }));
}

// Derive doctrine-linked citations from the typed KHIPU_ACTORS package.
// These appear in the "Frontier Leader Index" citation panel so the full
// leader set is surfaced as a first-class indexed entry tied to doctrine.
const KIND_TO_CITATION: Record<string, Citation['kind']> = {
  'foundation-lab': 'lab',
  'applied-agent': 'company',
  academic: 'academic',
  hardware: 'standard',
};
const ACTOR_CITATIONS: Citation[] = KHIPU_ACTORS.map(actor => ({
  id: `cit-actor-${actor.id}`,
  lab: actor.archetypeLabel,
  kind: (KIND_TO_CITATION[actor.kind] ?? 'lab') as Citation['kind'],
  title: actor.thesis.slice(0, 120) + (actor.thesis.length > 120 ? '…' : ''),
  sourceUrl: 'https://szl.ai/frontier/doctrine',
  sourceName: 'A11oy Frontier Doctrine',
  excerpt: actor.a11oyImplication,
  date: 'May 2026',
}));

export function KhipuIndex() {
  const [nodes, setNodes] = useState<KhipuNode[]>([]);
  const [edges, setEdges] = useState<KhipuEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [selected, setSelected] = useState<KhipuNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<{ node: KhipuNode; neighbors: KhipuNode[]; edges: KhipuEdge[] } | null>(null);
  const [allCitations, setAllCitations] = useState<Citation[]>(FRAMEWORK_CITATIONS);
  const [view, setView] = useState<'grid' | 'graph'>('grid');
  const [clusterByKind, setClusterByKind] = useState(false);

  // Build canonical nodes from the shared frontier-khipu package.
  // This is the single source of truth for all Khipu Index content.
  const SIGNAL_WEIGHT_SCORE: Record<string, number> = {
    'Very High': 0.95, High: 0.85, 'Medium-High': 0.75, Medium: 0.65,
  };
  const packageNodes: KhipuNode[] = [
    ...KHIPU_IDEAS.map(idea => ({
      id: idea.id,
      kind: idea.kind as NodeKind,
      label: idea.label,
      description: idea.description,
      tags: idea.tags,
      relevanceScore: idea.relevanceScore,
      linkedSignalCount: 0,
    })),
    ...KHIPU_ACTORS.map(actor => ({
      id: actor.id,
      kind: 'concept' as NodeKind,
      label: actor.archetypeLabel,
      description: actor.thesis,
      tags: actor.capabilityDimensions,
      relevanceScore: SIGNAL_WEIGHT_SCORE[actor.signalWeight] ?? 0.7,
      linkedSignalCount: 0,
    })),
  ];

  useEffect(() => {
    // Seed from the shared package immediately — no network wait needed
    setNodes(packageNodes);
    setLoading(false);

    // Enrich with live signal counts and edges from the API
    fetch(`${API}/khipu`)
      .then(r => r.json())
      .then(d => {
        const apiNodes: KhipuNode[] = d.nodes ?? [];
        // Merge: package is canonical for labels/descriptions; API provides signal counts
        const enriched = packageNodes.map(n => {
          const match = apiNodes.find(a => a.id === n.id);
          return match ? { ...n, linkedSignalCount: match.linkedSignalCount } : n;
        });
        setNodes(enriched);
        setEdges(d.edges ?? []);
      })
      .catch(() => {}); // Package data already shown; API enrichment is best-effort
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setNodes(packageNodes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function selectNode(node: KhipuNode) {
    setSelected(node);
    fetch(`${API}/khipu/nodes/${node.id}`)
      .then(r => r.json())
      .then(d => setNodeDetail(d))
      .catch(() => setNodeDetail(null));
  }

  const kinds = Array.from(new Set(nodes.map(n => n.kind))) as NodeKind[];
  const filtered = nodes.filter(n => {
    if (kindFilter !== 'all' && n.kind !== kindFilter) return false;
    return true;
  });

  const isCitedKind = (kind: NodeKind) => kind === 'vendor' || kind === 'person';

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Khipu Index"
          title="Khipu Index"
          description="Knowledge graph of capability concepts, benchmarks, techniques, and research artifacts that shape A11oy's frontier doctrine."
        />

        <FrontierCitationBanner message="Vendor and person nodes in this graph represent externally-cited sources. All such names appear formally in the Research Citation Panel below this index." />

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search concepts, benchmarks, techniques…"
                style={{
                  flex: 1, minWidth: 200, padding: '7px 12px', fontSize: 12,
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 6, color: '#f5f5f5', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['all', ...kinds].map(k => (
                  <button key={k} type="button" onClick={() => setKindFilter(k)} style={{
                    padding: '5px 10px', fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 4, cursor: 'pointer',
                    background: kindFilter === k ? (k === 'all' ? GOLD : KIND_COLOR[k as NodeKind]) : 'transparent',
                    color: kindFilter === k ? '#0a0a0a' : DIM,
                    border: `1px solid ${kindFilter === k ? (k === 'all' ? GOLD : KIND_COLOR[k as NodeKind]) : BORDER}`,
                    transition: 'all 0.15s',
                  }}>
                    {k}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                {filtered.length} nodes · {edges.length} edges
              </span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                {view === 'graph' && (
                  <button
                    type="button"
                    onClick={() => setClusterByKind(v => !v)}
                    aria-pressed={clusterByKind}
                    title="Cluster nodes of the same kind toward a shared anchor"
                    data-testid="toggle-cluster-by-kind"
                    style={{
                      padding: '5px 12px', fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                      background: clusterByKind ? GOLD : 'transparent',
                      color: clusterByKind ? '#0a0a0a' : DIM,
                      border: `1px solid ${clusterByKind ? GOLD : BORDER}`, borderRadius: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    cluster by kind
                  </button>
                )}
                <div style={{ display: 'flex', gap: 0, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' }}>
                  {(['grid', 'graph'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      style={{
                        padding: '5px 12px', fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                        letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                        background: view === v ? GOLD : 'transparent',
                        color: view === v ? '#0a0a0a' : DIM,
                        border: 'none', transition: 'all 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                Loading Khipu index…
              </div>
            )}
            {error && (
              <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
                {error}
              </div>
            )}

            {!loading && !error && view === 'graph' && (
              <KhipuGraphCanvas
                nodes={filtered}
                edges={edges}
                kindColor={KIND_COLOR}
                clusterByKind={clusterByKind}
                selectedId={selected?.id ?? null}
                onSelect={(n) => {
                  const full = nodes.find(x => x.id === n.id);
                  if (full) selectNode(full);
                }}
              />
            )}

            {!loading && !error && view === 'grid' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {filtered.map(node => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => selectNode(node)}
                    style={{
                      textAlign: 'left', padding: '12px 14px',
                      border: `1px solid ${selected?.id === node.id ? `${KIND_COLOR[node.kind]}60` : BORDER}`,
                      borderRadius: 8, background: selected?.id === node.id ? `${KIND_COLOR[node.kind]}10` : SURFACE,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: KIND_COLOR[node.kind], background: `${KIND_COLOR[node.kind]}18`,
                        border: `1px solid ${KIND_COLOR[node.kind]}40`,
                        padding: '2px 6px', borderRadius: 3,
                      }}>
                        {node.kind}
                      </span>
                      {isCitedKind(node.kind) && (
                        <span style={{
                          fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
                          color: GOLD, background: `${GOLD}15`,
                          border: `1px solid ${GOLD}30`,
                          padding: '1px 5px', borderRadius: 3,
                        }}>
                          cited source
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginLeft: 'auto' }}>
                        {node.linkedSignalCount} signals
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>{node.label}</div>
                    <div style={{ fontSize: 11, color: DIM, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {node.description}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${node.relevanceScore * 100}%`, height: '100%', background: KIND_COLOR[node.kind], borderRadius: 2 }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <FrontierCrossLinks
              base={BASE}
              links={[
                { label: 'Recommendations', path: '/recommendations', desc: 'Khipu concepts surface in recommendation rationale and evidence chains' },
                { label: 'Constitution', path: '/constitution', desc: 'Dual-use knowledge nodes are routed to the Constitution dual-use review queue' },
                { label: 'Learning Loop', path: '/learning', desc: 'Khipu idea relevance scoring feeds the frontier capability learning pipeline' },
                { label: 'Self-Optimization', path: '/self-optimization', desc: 'Khipu actor capability gaps drive optimization target selection' },
              ]}
            />
            <ResearchCitationPanel citations={allCitations} title="Khipu index source citations — vendor and person nodes are externally-cited sources" />
            <ResearchCitationPanel citations={ACTOR_CITATIONS} title="Frontier Leader Index — archetype entries linked to doctrine" collapsed />
          </div>

          {selected && (
            <div style={{ border: `1px solid ${KIND_COLOR[selected.kind]}40`, borderRadius: 10, padding: 20, background: SURFACE, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: KIND_COLOR[selected.kind], background: `${KIND_COLOR[selected.kind]}18`,
                    border: `1px solid ${KIND_COLOR[selected.kind]}40`,
                    padding: '3px 8px', borderRadius: 4,
                  }}>
                    {selected.kind}
                  </span>
                  {isCitedKind(selected.kind) && (
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
                      color: GOLD, background: `${GOLD}15`,
                      border: `1px solid ${GOLD}30`,
                      padding: '3px 8px', borderRadius: 4,
                    }}>
                      cited source
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => { setSelected(null); setNodeDetail(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f5', margin: '0 0 10px', lineHeight: 1.3 }}>
                {selected.label}
              </h2>
              <p style={{ fontSize: 12, color: DIM, lineHeight: 1.6, margin: '0 0 16px' }}>{selected.description}</p>

              {isCitedKind(selected.kind) && selected.sourceUrl && (
                <div style={{
                  background: `${GOLD}08`, border: `1px solid ${GOLD}25`,
                  borderRadius: 6, padding: '10px 12px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Cited source
                  </div>
                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: GOLD, fontFamily: 'var(--font-mono, monospace)', textDecoration: 'none', display: 'block', lineHeight: 1.4 }}
                  >
                    {selected.sourceName ?? selected.label} →
                  </a>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 4, fontFamily: 'var(--font-mono, monospace)' }}>
                    All assertions about this entity reference this source
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {selected.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                    padding: '2px 7px', borderRadius: 3,
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: DIM,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Relevance</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{Math.round(selected.relevanceScore * 100)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Linked signals</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f5' }}>{selected.linkedSignalCount}</div>
                </div>
              </div>
              {nodeDetail && nodeDetail.neighbors.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Connected nodes ({nodeDetail.neighbors.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {nodeDetail.neighbors.slice(0, 8).map(n => {
                      const edge = nodeDetail.edges.find(e => (e.source === selected.id && e.target === n.id) || (e.target === selected.id && e.source === n.id));
                      return (
                        <button key={n.id} type="button" onClick={() => selectNode(n)} style={{
                          textAlign: 'left', padding: '8px 10px', border: `1px solid ${BORDER}`,
                          borderRadius: 6, background: 'rgba(0,0,0,0.2)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{
                            fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
                            color: KIND_COLOR[n.kind], background: `${KIND_COLOR[n.kind]}18`,
                            border: `1px solid ${KIND_COLOR[n.kind]}40`,
                            padding: '2px 5px', borderRadius: 3, flexShrink: 0,
                          }}>
                            {n.kind}
                          </span>
                          <span style={{ fontSize: 11, color: '#e0e0e0' }}>{n.label}</span>
                          {edge && (
                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginLeft: 'auto', flexShrink: 0 }}>
                              {edge.relation}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
