import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

const GOLD = '#c9b787';

type ProvenanceNodeKind = 'base_model' | 'dataset' | 'fine_tuned_model' | 'evaluation' | 'deployment' | 'agent';
type ProvenanceEdgeRelation = 'trained_on' | 'evaluated_by' | 'deployed_under' | 'accessed_by' | 'fine_tuned_from' | 'derived_from';

interface ProvenanceNode {
  id: string;
  kind: ProvenanceNodeKind;
  label: string;
  description: string;
  proofHash: string;
  metadata: Record<string, string>;
  createdAt: string;
}

interface ProvenanceEdge {
  id: string;
  source: string;
  target: string;
  relation: ProvenanceEdgeRelation;
  timestamp: string;
  proofHash: string;
  metadata: Record<string, string>;
}

interface AccessRecord {
  id: string;
  agentId: string;
  agentName: string;
  resourceUri: string;
  resourceType: string;
  purpose: string;
  timestamp: string;
  durationMs: number;
  success: boolean;
  proofHash: string;
}

interface ReputationScore {
  agentId: string;
  agentName: string;
  overallScore: number;
  successfulDeployments: number;
  totalDeployments: number;
  evaluationPassRate: number;
  governanceComplianceRate: number;
  costEfficiency: number;
  provenanceDepth: number;
  computedAt: string;
}

const NODE_COLORS: Record<ProvenanceNodeKind, string> = {
  base_model: '#6b8aad',
  dataset: '#8fbc8f',
  fine_tuned_model: GOLD,
  evaluation: '#b39ddb',
  deployment: '#22c55e',
  agent: '#e57373',
};

const NODE_LABELS: Record<ProvenanceNodeKind, string> = {
  base_model: 'BASE MODEL',
  dataset: 'DATASET',
  fine_tuned_model: 'FINE-TUNED',
  evaluation: 'EVALUATION',
  deployment: 'DEPLOYMENT',
  agent: 'AGENT',
};

const EDGE_LABELS: Record<ProvenanceEdgeRelation, string> = {
  trained_on: 'trained on',
  evaluated_by: 'evaluated by',
  deployed_under: 'deployed under',
  accessed_by: 'accessed by',
  fine_tuned_from: 'fine-tuned from',
  derived_from: 'derived from',
};

const EDGE_COLORS: Record<ProvenanceEdgeRelation, string> = {
  trained_on: '#8fbc8f',
  evaluated_by: '#b39ddb',
  deployed_under: '#22c55e',
  accessed_by: '#e57373',
  fine_tuned_from: '#6b8aad',
  derived_from: '#8a8a8a',
};

const DEMO_DATA = {
  nodes: [] as ProvenanceNode[],
  edges: [] as ProvenanceEdge[],
};

const DEMO_ZERO_TRUST = {
  accessAuditLog: [] as AccessRecord[],
  reputationScores: [] as ReputationScore[],
  cryptoIdentities: [] as unknown[],
};

interface LayoutNode extends ProvenanceNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function forceDirectedLayout(nodes: ProvenanceNode[], edges: ProvenanceEdge[], width: number, height: number, iterations = 80): LayoutNode[] {
  if (nodes.length === 0) return [];

  const kindOrder: ProvenanceNodeKind[] = ['base_model', 'dataset', 'fine_tuned_model', 'evaluation', 'deployment', 'agent'];
  const kindIndex = new Map(kindOrder.map((k, i) => [k, i]));

  const layoutNodes: LayoutNode[] = nodes.map((node, i) => {
    const ki = kindIndex.get(node.kind) ?? 3;
    const laneX = 80 + (ki / (kindOrder.length - 1)) * (width - 160);
    const sameKind = nodes.filter(n => n.kind === node.kind);
    const idxInKind = sameKind.indexOf(node);
    const laneY = 80 + ((idxInKind + 1) / (sameKind.length + 1)) * (height - 160);
    return { ...node, x: laneX + (Math.random() - 0.5) * 40, y: laneY + (Math.random() - 0.5) * 40, vx: 0, vy: 0 };
  });

  const nodeIdx = new Map(layoutNodes.map((n, i) => [n.id, i]));
  const repulsion = 12000;
  const attraction = 0.008;
  const damping = 0.85;
  const minDist = 50;

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 1 - iter / iterations;

    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const a = layoutNodes[i]!;
        const b = layoutNodes[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (repulsion * temp) / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx -= dx;
        a.vy -= dy;
        b.vx += dx;
        b.vy += dy;
      }
    }

    for (const edge of edges) {
      const ai = nodeIdx.get(edge.source);
      const bi = nodeIdx.get(edge.target);
      if (ai === undefined || bi === undefined) continue;
      const a = layoutNodes[ai]!;
      const b = layoutNodes[bi]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = attraction * (dist - 120) * temp;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const node of layoutNodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(30, Math.min(width - 30, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
    }

    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const a = layoutNodes[i]!;
        const b = layoutNodes[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = (dx / dist) * overlap;
          const ny = (dy / dist) * overlap;
          a.x -= nx;
          a.y -= ny;
          b.x += nx;
          b.y += ny;
        }
      }
    }
  }

  return layoutNodes;
}

const API_BASE = '/api/a11oy';

export function ModelProvenance() {
  const { data: graphData } = useApiData<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }>('/pages/model-provenance', DEMO_DATA);
  const { data: ztData } = useApiData<{ accessAuditLog: AccessRecord[]; reputationScores: ReputationScore[] }>('/pages/identity-zero-trust', DEMO_ZERO_TRUST);
  const [activeTab, setActiveTab] = useState<'graph' | 'audit' | 'reputation'>('graph');
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ProvenanceEdge | null>(null);
  const [auditFilter, setAuditFilter] = useState<{ agent: string; resourceType: string }>({ agent: '', resourceType: '' });
  const [query, setQuery] = useState('');
  const [queryInterpretation, setQueryInterpretation] = useState('');
  const [queryResultNodes, setQueryResultNodes] = useState<ProvenanceNode[] | null>(null);
  const [queryResultEdges, setQueryResultEdges] = useState<ProvenanceEdge[] | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgWidth = 960;
  const svgHeight = 520;

  const displayNodes = queryResultNodes ?? graphData.nodes;
  const displayEdges = queryResultEdges ?? graphData.edges;

  const layoutNodes = useRef<LayoutNode[]>([]);
  const layoutKey = displayNodes.map(n => n.id).sort().join(',');
  const prevLayoutKey = useRef('');
  if (layoutKey !== prevLayoutKey.current) {
    layoutNodes.current = forceDirectedLayout(displayNodes, displayEdges, svgWidth, svgHeight);
    prevLayoutKey.current = layoutKey;
  }

  const nodeMap = new Map(layoutNodes.current.map(n => [n.id, n]));

  const filteredAudit = ztData.accessAuditLog.filter(r => {
    if (auditFilter.agent && r.agentId !== auditFilter.agent) return false;
    if (auditFilter.resourceType && r.resourceType !== auditFilter.resourceType) return false;
    return true;
  });

  const executeQuery = useCallback(async (q: string) => {
    if (!q.trim()) {
      setQueryResultNodes(null);
      setQueryResultEdges(null);
      setQueryInterpretation('');
      return;
    }
    setQueryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pages/model-provenance/query?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setQueryResultNodes(json.data.nodes);
        setQueryResultEdges(json.data.edges);
        setQueryInterpretation(json.data.interpretation || '');
      }
    } catch {
      setQueryResultNodes(null);
      setQueryResultEdges(null);
      setQueryInterpretation('Query failed');
    } finally {
      setQueryLoading(false);
    }
  }, []);

  return (
    <Layout>
      <PageHeader
        label="MODEL PROVENANCE GRAPH"
        title="Zero-Trust Model Lineage"
        subtitle="Cryptographically verifiable model provenance — every model's complete lineage from base model through fine-tuning, evaluation, and deployment. Each node is a proof-carrying artifact."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="MODELS" value={displayNodes.filter(n => n.kind === 'base_model' || n.kind === 'fine_tuned_model').length} sub={queryResultNodes ? 'matched' : 'tracked'} accent="#6b8aad" />
        <KpiCard label="DATASETS" value={displayNodes.filter(n => n.kind === 'dataset').length} sub={queryResultNodes ? 'matched' : 'linked'} accent="#8fbc8f" />
        <KpiCard label="DEPLOYMENTS" value={displayNodes.filter(n => n.kind === 'deployment').length} sub={queryResultNodes ? 'matched' : 'active'} accent="#22c55e" />
        <KpiCard label="EVALUATIONS" value={displayNodes.filter(n => n.kind === 'evaluation').length} sub={queryResultNodes ? 'matched' : 'completed'} accent="#b39ddb" />
        <KpiCard label="EDGES" value={displayEdges.length} sub="relationships" accent={GOLD} />
        <KpiCard label="AUDIT ENTRIES" value={ztData.accessAuditLog.length} sub="logged" accent="#e57373" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['graph', 'audit', 'reputation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedNode(null); setSelectedEdge(null); }}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              backgroundColor: activeTab === tab ? `${GOLD}18` : 'transparent',
              color: activeTab === tab ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${activeTab === tab ? `${GOLD}30` : 'transparent'}`,
            }}
          >
            {tab === 'graph' ? 'Provenance Graph' : tab === 'audit' ? 'Access Audit Log' : 'Agent Reputation'}
          </button>
        ))}
      </div>

      {activeTab === 'graph' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionTitle>Model Lineage Graph</SectionTitle>
            <Card>
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') executeQuery(query); }}
                    placeholder='Query: "models trained on Maritime" or "agents deployed Cascade" or "lineage of Guardian"'
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
                    style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
                  />
                  <button
                    onClick={() => executeQuery(query)}
                    disabled={queryLoading}
                    className="px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider"
                    style={{ backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}
                  >
                    {queryLoading ? 'Querying...' : 'Query'}
                  </button>
                  {queryResultNodes && (
                    <button
                      onClick={() => { setQuery(''); setQueryResultNodes(null); setQueryResultEdges(null); setQueryInterpretation(''); }}
                      className="px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {queryInterpretation && (
                  <div className="mt-2 px-2 py-1.5 rounded text-[10px] font-mono" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, color: GOLD }}>
                    {queryInterpretation} — {displayNodes.length} nodes, {displayEdges.length} edges
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minHeight: 400 }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={GOLD} fillOpacity={0.4} />
                    </marker>
                  </defs>
                  {displayEdges.map(edge => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;
                    const isSelected = selectedEdge?.id === edge.id;
                    return (
                      <g key={edge.id} onClick={() => { setSelectedEdge(isSelected ? null : edge); setSelectedNode(null); }} style={{ cursor: 'pointer' }}>
                        <line
                          x1={src.x} y1={src.y}
                          x2={tgt.x} y2={tgt.y}
                          stroke={EDGE_COLORS[edge.relation]}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                          strokeOpacity={isSelected ? 0.9 : 0.35}
                          markerEnd="url(#arrow)"
                        />
                        {isSelected && (
                          <text
                            x={(src.x + tgt.x) / 2}
                            y={(src.y + tgt.y) / 2 - 6}
                            textAnchor="middle"
                            fill={EDGE_COLORS[edge.relation]}
                            fontSize={7}
                            fontFamily="ui-monospace, monospace"
                          >
                            {EDGE_LABELS[edge.relation]}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {layoutNodes.current.map(node => {
                    const color = NODE_COLORS[node.kind];
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <g
                        key={node.id}
                        onClick={() => { setSelectedNode(isSelected ? null : node); setSelectedEdge(null); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={node.x} cy={node.y}
                          r={isSelected ? 22 : 18}
                          fill="#0a0a0a"
                          stroke={color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        <circle cx={node.x} cy={node.y} r={isSelected ? 26 : 0} fill="none" stroke={`${color}30`} strokeWidth={1} />
                        <text x={node.x} y={node.y - 3} textAnchor="middle" fill={color} fontSize={7} fontFamily="ui-monospace, monospace" fontWeight={700}>
                          {NODE_LABELS[node.kind]}
                        </text>
                        <text x={node.x} y={node.y + 7} textAnchor="middle" fill="#8a8a8a" fontSize={5} fontFamily="ui-monospace, monospace">
                          {node.label.length > 16 ? node.label.slice(0, 14) + '..' : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-a11oy-border)' }}>
                {Object.entries(NODE_COLORS).map(([kind, color]) => (
                  <div key={kind} className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: '#8a8a8a' }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {NODE_LABELS[kind as ProvenanceNodeKind]}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            {selectedNode && (
              <>
                <SectionTitle>Node Detail — {NODE_LABELS[selectedNode.kind]}</SectionTitle>
                <Card>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LABEL</div>
                      <div className="font-semibold" style={{ color: NODE_COLORS[selectedNode.kind] }}>{selectedNode.label}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DESCRIPTION</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedNode.description}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROOF HASH</div>
                      <div className="font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD, fontSize: 10, wordBreak: 'break-all' }}>{selectedNode.proofHash}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CREATED</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(selectedNode.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>METADATA</div>
                      <div className="space-y-1">
                        {Object.entries(selectedNode.metadata).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between py-1 px-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                            <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k}</span>
                            <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CONNECTED EDGES</div>
                      <div className="space-y-1">
                        {displayEdges
                          .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                          .map(e => {
                            const other = e.source === selectedNode.id ? nodeMap.get(e.target) : nodeMap.get(e.source);
                            return (
                              <div key={e.id} className="flex items-center justify-between py-1 px-2 rounded text-[10px] cursor-pointer" style={{ backgroundColor: 'var(--color-a11oy-deep)' }} onClick={() => { setSelectedEdge(e); setSelectedNode(null); }}>
                                <span style={{ color: EDGE_COLORS[e.relation] }}>{EDGE_LABELS[e.relation]}</span>
                                <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{other?.label ?? '?'}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
            {selectedEdge && (
              <>
                <SectionTitle>Edge Detail</SectionTitle>
                <Card>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RELATION</div>
                      <div className="font-semibold" style={{ color: EDGE_COLORS[selectedEdge.relation] }}>{EDGE_LABELS[selectedEdge.relation]}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SOURCE</div>
                        <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{nodeMap.get(selectedEdge.source)?.label ?? selectedEdge.source}</div>
                      </div>
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TARGET</div>
                        <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{nodeMap.get(selectedEdge.target)?.label ?? selectedEdge.target}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROOF HASH</div>
                      <div className="font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD, fontSize: 10 }}>{selectedEdge.proofHash}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TIMESTAMP</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(selectedEdge.timestamp).toLocaleString()}</div>
                    </div>
                    {Object.keys(selectedEdge.metadata).length > 0 && (
                      <div>
                        <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>METADATA</div>
                        <div className="space-y-1">
                          {Object.entries(selectedEdge.metadata).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between py-1 px-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                              <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k}</span>
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
            {!selectedNode && !selectedEdge && (
              <>
                <SectionTitle>Provenance Legend</SectionTitle>
                <Card>
                  <div className="space-y-3 text-xs">
                    <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>NODE TYPES</div>
                    {Object.entries(NODE_COLORS).map(([kind, color]) => (
                      <div key={kind} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div>
                          <div className="font-mono" style={{ color }}>{NODE_LABELS[kind as ProvenanceNodeKind]}</div>
                        </div>
                      </div>
                    ))}
                    <div className="font-mono mt-4 mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EDGE TYPES</div>
                    {Object.entries(EDGE_COLORS).map(([rel, color]) => (
                      <div key={rel} className="flex items-center gap-2">
                        <span className="w-4 h-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-mono" style={{ color }}>{EDGE_LABELS[rel as ProvenanceEdgeRelation]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
                    Every node is a proof-carrying artifact with a cryptographic hash. Click any node or edge to inspect its lineage and verification details.
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <>
          <SectionTitle>HuggingFace Access Audit Log</SectionTitle>
          <div className="flex gap-3 mb-4">
            <select
              value={auditFilter.agent}
              onChange={e => setAuditFilter(f => ({ ...f, agent: e.target.value }))}
              className="px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              <option value="">All agents</option>
              {[...new Set(ztData.accessAuditLog.map(r => r.agentId))].map(id => (
                <option key={id} value={id}>{ztData.accessAuditLog.find(r => r.agentId === id)?.agentName ?? id}</option>
              ))}
            </select>
            <select
              value={auditFilter.resourceType}
              onChange={e => setAuditFilter(f => ({ ...f, resourceType: e.target.value }))}
              className="px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              <option value="">All resource types</option>
              <option value="model">Models</option>
              <option value="dataset">Datasets</option>
              <option value="space">Spaces</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredAudit.map(record => (
              <Card key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: GOLD }}>{record.agentName}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
                        backgroundColor: record.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: record.success ? '#22c55e' : '#ef4444',
                      }}>
                        {record.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                        {record.resourceType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono truncate mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{record.resourceUri}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{record.purpose}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(record.timestamp).toLocaleTimeString()}</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{record.durationMs}ms</div>
                    <div className="text-[9px] font-mono mt-1" style={{ color: GOLD }}>{record.proofHash}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'reputation' && (
        <>
          <SectionTitle>Agent Reputation Scores</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ztData.reputationScores.map(score => (
              <Card key={score.agentId}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{score.agentName}</div>
                  <div className="text-lg font-bold font-mono" style={{ color: score.overallScore >= 95 ? '#22c55e' : score.overallScore >= 85 ? GOLD : '#f97316' }}>
                    {score.overallScore}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Deployments', value: `${score.successfulDeployments}/${score.totalDeployments}`, pct: score.successfulDeployments / Math.max(score.totalDeployments, 1), color: '#22c55e' },
                    { label: 'Eval Pass Rate', value: `${(score.evaluationPassRate * 100).toFixed(0)}%`, pct: score.evaluationPassRate, color: '#b39ddb' },
                    { label: 'Governance', value: `${(score.governanceComplianceRate * 100).toFixed(0)}%`, pct: score.governanceComplianceRate, color: GOLD },
                    { label: 'Cost Efficiency', value: `${(score.costEfficiency * 100).toFixed(0)}%`, pct: score.costEfficiency, color: '#6b8aad' },
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{metric.label}</span>
                        <span className="font-mono" style={{ color: metric.color }}>{metric.value}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                        <div className="h-full rounded-full" style={{ width: `${metric.pct * 100}%`, backgroundColor: metric.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  <span>Provenance depth: {score.provenanceDepth}</span>
                  <span>Updated: {new Date(score.computedAt).toLocaleTimeString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Model provenance is cryptographically verifiable. Every node carries a SHA-256 proof hash, and every edge is signed with the agent's Ed25519 key.
      </div>
    </Layout>
  );
}
