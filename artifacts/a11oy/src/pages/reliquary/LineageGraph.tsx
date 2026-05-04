import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';
const GOLD = '#c9b787';

const TYPE_COLORS: Record<string, string> = {
  model: '#60a5fa',
  prompt: '#a78bfa',
  agent: '#34d399',
  dataset: '#fb923c',
  embedding: '#f472b6',
  report: '#facc15',
  bundle: '#94a3b8',
};

interface CatalogEntry {
  id: number;
  contentHash: string;
  artifactType: string;
  label: string;
  covenantHash: string;
  createdAt: string;
}

interface LineageData {
  contentHash: string;
  parents: string[];
  children: string[];
  depth: number;
}

interface GraphNode {
  hash: string;
  label: string;
  type: string;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

function short(hash: string) { return hash.slice(0, 8) + '…'; }

function buildGraph(
  root: string,
  lineage: LineageData,
  catalog: CatalogEntry[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const catalogMap = new Map(catalog.map(c => [c.contentHash, c]));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  const allHashes = [root, ...lineage.parents, ...lineage.children];

  const levels: Map<string, number> = new Map();
  lineage.parents.forEach(h => levels.set(h, 0));
  levels.set(root, lineage.parents.length > 0 ? 1 : 0);
  lineage.children.forEach(h => levels.set(h, (levels.get(root) ?? 0) + 1));

  const levelGroups: Map<number, string[]> = new Map();
  for (const [h, l] of levels) {
    if (!levelGroups.has(l)) levelGroups.set(l, []);
    levelGroups.get(l)!.push(h);
  }

  const W = 700;
  const H = 400;
  const levelCount = Math.max(...Array.from(levels.values())) + 1;
  const xStep = levelCount > 1 ? W / (levelCount + 1) : W / 2;

  for (const [level, hashes] of levelGroups) {
    const yStep = H / (hashes.length + 1);
    hashes.forEach((h, i) => {
      if (seen.has(h)) return;
      seen.add(h);
      const entry = catalogMap.get(h);
      nodes.push({
        hash: h,
        label: entry?.label ?? short(h),
        type: entry?.artifactType ?? 'unknown',
        x: xStep * (level + 1),
        y: yStep * (i + 1),
        level,
      });
    });
  }

  lineage.parents.forEach(p => edges.push({ from: p, to: root }));
  lineage.children.forEach(c => edges.push({ from: root, to: c }));

  return { nodes, edges };
}

export function LineageGraph() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [selectedHash, setSelectedHash] = useState<string>('');
  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/reliquary/catalog`)
      .then(r => r.json())
      .then(j => setCatalog(j.data ?? []))
      .catch(() => {});
  }, []);

  const loadLineage = useCallback(async (hash: string) => {
    if (!hash) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/reliquary/lineage/${hash}?depth=3`);
      const j = await r.json();
      setLineage(j.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedHash) loadLineage(selectedHash);
  }, [selectedHash, loadLineage]);

  const graph = lineage && selectedHash
    ? buildGraph(selectedHash, lineage, catalog)
    : null;

  const selectedEntry = catalog.find(c => c.contentHash === selectedHash);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            Reliquary
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Lineage Graph</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Parent/child provenance DAG for any cached artifact
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Select Artifact</label>
          <select
            value={selectedHash}
            onChange={e => setSelectedHash(e.target.value)}
            style={{ width: '100%', background: '#111', border: '1px solid #1e293b', borderRadius: 6, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
          >
            <option value="">— Choose an artifact to trace lineage —</option>
            {catalog.map(e => (
              <option key={e.contentHash} value={e.contentHash}>
                [{e.artifactType}] {e.label} — {short(e.contentHash)}
              </option>
            ))}
          </select>
        </div>

        {selectedEntry && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Type', value: selectedEntry.artifactType },
              { label: 'Content Hash', value: short(selectedEntry.contentHash) },
              { label: 'Covenant Hash', value: short(selectedEntry.covenantHash) },
            ].map(k => (
              <div key={k.label} style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: '#475569' }}>Loading lineage DAG…</div>
          )}

          {!loading && !graph && (
            <div style={{ padding: 60, textAlign: 'center', color: '#475569' }}>
              {catalog.length === 0
                ? 'No artifacts in Reliquary. Use the Vault Browser to seed demo data first.'
                : 'Select an artifact above to render its provenance DAG.'}
            </div>
          )}

          {!loading && graph && (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {graph.nodes.length} nodes · {graph.edges.length} edges
                </span>
                <span style={{ fontSize: 12, color: lineage?.parents.length ? '#60a5fa' : '#475569' }}>
                  {lineage?.parents.length ?? 0} parent(s)
                </span>
                <span style={{ fontSize: 12, color: lineage?.children.length ? '#34d399' : '#475569' }}>
                  {lineage?.children.length ?? 0} child(ren)
                </span>
              </div>
              <svg width="100%" viewBox="0 0 740 440" style={{ display: 'block', padding: '20px 0' }}>
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
                  </marker>
                  <marker id="arrow-gold" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill={GOLD} />
                  </marker>
                </defs>

                {graph.edges.map((edge, i) => {
                  const fromNode = graph.nodes.find(n => n.hash === edge.from);
                  const toNode = graph.nodes.find(n => n.hash === edge.to);
                  if (!fromNode || !toNode) return null;
                  const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
                  return (
                    <line
                      key={i}
                      x1={fromNode.x + 20} y1={fromNode.y + 14}
                      x2={toNode.x + 20} y2={toNode.y + 14}
                      stroke={isHighlighted ? GOLD : '#1e293b'}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                      markerEnd={isHighlighted ? 'url(#arrow-gold)' : 'url(#arrow)'}
                      style={{ transition: 'stroke 0.2s' }}
                    />
                  );
                })}

                {graph.nodes.map(node => {
                  const isRoot = node.hash === selectedHash;
                  const color = TYPE_COLORS[node.type] ?? '#94a3b8';
                  const isHovered = hoveredNode === node.hash;
                  return (
                    <g
                      key={node.hash}
                      transform={`translate(${node.x - 50}, ${node.y - 14})`}
                      onMouseEnter={() => setHoveredNode(node.hash)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        width={120} height={32} rx={6}
                        fill={isRoot ? `${color}22` : '#0f172a'}
                        stroke={isRoot ? color : isHovered ? '#334155' : '#1e293b'}
                        strokeWidth={isRoot ? 2 : 1}
                      />
                      <text x={8} y={11} fontSize={8} fill={color} fontFamily="monospace">{node.type}</text>
                      <text x={8} y={24} fontSize={10} fill={isRoot ? '#f1f5f9' : '#94a3b8'} fontFamily="monospace">
                        {node.label.length > 14 ? node.label.slice(0, 14) + '…' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </>
          )}
        </div>

        {lineage && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Parents (Inputs)</div>
              {lineage.parents.length === 0 ? (
                <div style={{ fontSize: 13, color: '#334155' }}>No recorded parents — genesis artifact</div>
              ) : lineage.parents.map(h => {
                const e = catalog.find(c => c.contentHash === h);
                return (
                  <div key={h} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }} onClick={() => setSelectedHash(h)}>
                    <div style={{ fontSize: 12, color: '#60a5fa' }}>← {e?.label ?? short(h)}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>{short(h)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: '#111', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Children (Derived)</div>
              {lineage.children.length === 0 ? (
                <div style={{ fontSize: 13, color: '#334155' }}>No recorded children — leaf artifact</div>
              ) : lineage.children.map(h => {
                const e = catalog.find(c => c.contentHash === h);
                return (
                  <div key={h} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a', cursor: 'pointer' }} onClick={() => setSelectedHash(h)}>
                    <div style={{ fontSize: 12, color: '#34d399' }}>→ {e?.label ?? short(h)}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>{short(h)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
