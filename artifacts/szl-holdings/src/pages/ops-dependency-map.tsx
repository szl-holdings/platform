import { ArrowRight, GitBranch, Layers, Plus, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const BASE = '/api';

interface DepNode {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface DepEdge {
  id: number;
  source: string;
  target: string;
  type: string;
  isCritical: boolean;
  description: string | null;
}

interface DepGraph {
  nodes: DepNode[];
  edges: DepEdge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  service: '#3b82f6',
  database: '#8b5cf6',
  storage: '#10b981',
  ai_provider: '#ec4899',
  auth: '#f59e0b',
  queue: '#06b6d4',
};

const STATUS_COLORS: Record<string, string> = {
  operational: '#10b981',
  degraded: '#f59e0b',
  outage: '#ef4444',
};

const categoryColor = (c: string) => CATEGORY_COLORS[c] ?? '#6b7280';
const statusColor = (s: string) => STATUS_COLORS[s] ?? '#6b7280';

const CATEGORY_ICONS: Record<string, string> = {
  service: '⚙',
  database: '🗄',
  storage: '📦',
  ai_provider: '🤖',
  auth: '🔐',
  queue: '📬',
};

type LayoutNode = DepNode & { x: number; y: number; col: number; row: number };

function computeLayout(nodes: DepNode[], edges: DepEdge[]): LayoutNode[] {
  const edgeMap = new Map<string, string[]>();
  for (const e of edges) {
    const list = edgeMap.get(e.source) ?? [];
    list.push(e.target);
    edgeMap.set(e.source, list);
  }
  const inDeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const e of edges) inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);

  const cols: string[][] = [];
  const placed = new Set<string>();
  let frontier = nodes.filter((n) => (inDeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  while (frontier.length > 0) {
    cols.push(frontier);
    for (const id of frontier) placed.add(id);
    const next: string[] = [];
    for (const id of frontier) {
      for (const dep of edgeMap.get(id) ?? []) {
        if (!placed.has(dep) && !next.includes(dep)) next.push(dep);
      }
    }
    frontier = next;
  }
  const remaining = nodes.filter((n) => !placed.has(n.id)).map((n) => n.id);
  if (remaining.length > 0) cols.push(remaining);

  const _W = 180;
  const H = 80;
  const COL_GAP = 220;
  const ROW_GAP = 110;

  const layoutMap = new Map<string, LayoutNode>();
  for (let ci = 0; ci < cols.length; ci++) {
    const col = cols[ci]!;
    const totalH = col.length * H + (col.length - 1) * (ROW_GAP - H);
    const startY = -totalH / 2;
    for (let ri = 0; ri < col.length; ri++) {
      const id = col[ri]!;
      const node = nodes.find((n) => n.id === id)!;
      if (!node) continue;
      layoutMap.set(id, { ...node, x: ci * COL_GAP, y: startY + ri * ROW_GAP, col: ci, row: ri });
    }
  }
  return Array.from(layoutMap.values());
}

function AddDepModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    sourceId: '',
    sourceName: '',
    sourceCategory: 'service',
    targetId: '',
    targetName: '',
    targetCategory: 'service',
    depType: 'depends_on',
    isCritical: false,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const inputSt: React.CSSProperties = {
    width: '100%',
    background: 'hsl(210,12%,10%)',
    border: '1px solid hsla(0,0%,100%,0.1)',
    borderRadius: 6,
    padding: '0.5rem 0.75rem',
    color: 'hsl(38,12%,86%)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const save = async () => {
    setSaving(true);
    await fetch(`${BASE}/ops/service-deps`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'hsla(0,0%,0%,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'hsl(210,12%,7%)',
          borderRadius: 14,
          border: '1px solid hsla(0,0%,100%,0.08)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'hsl(38,12%,94%)' }}>
            Add Dependency
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(210,5%,50%)',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Source ID
              </label>
              <input
                style={inputSt}
                value={form.sourceId}
                onChange={(e) => set('sourceId', e.target.value)}
                placeholder="api"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Source Name
              </label>
              <input
                style={inputSt}
                value={form.sourceName}
                onChange={(e) => set('sourceName', e.target.value)}
                placeholder="API Server"
              />
            </div>
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Source Category
            </label>
            <select
              style={inputSt}
              value={form.sourceCategory}
              onChange={(e) => set('sourceCategory', e.target.value)}
            >
              {Object.keys(CATEGORY_COLORS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Target ID
              </label>
              <input
                style={inputSt}
                value={form.targetId}
                onChange={(e) => set('targetId', e.target.value)}
                placeholder="database"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Target Name
              </label>
              <input
                style={inputSt}
                value={form.targetName}
                onChange={(e) => set('targetName', e.target.value)}
                placeholder="PostgreSQL Database"
              />
            </div>
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Target Category
            </label>
            <select
              style={inputSt}
              value={form.targetCategory}
              onChange={(e) => set('targetCategory', e.target.value)}
            >
              {Object.keys(CATEGORY_COLORS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0.75rem',
              alignItems: 'end',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'hsl(210,5%,46%)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Dependency Type
              </label>
              <select
                style={inputSt}
                value={form.depType}
                onChange={(e) => set('depType', e.target.value)}
              >
                <option value="depends_on">depends_on</option>
                <option value="feeds_into">feeds_into</option>
                <option value="calls">calls</option>
                <option value="replicates_to">replicates_to</option>
              </select>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'hsl(38,12%,78%)',
                cursor: 'pointer',
                paddingBottom: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={form.isCritical}
                onChange={(e) => set('isCritical', e.target.checked)}
                style={{ accentColor: '#ef4444' }}
              />
              Critical path
            </label>
          </div>
          <div>
            <label
              style={{ fontSize: 11, color: 'hsl(210,5%,46%)', display: 'block', marginBottom: 4 }}
            >
              Description
            </label>
            <input
              style={inputSt}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Why this dependency exists"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 6,
                fontSize: 13,
                background: 'transparent',
                border: '1px solid hsla(0,0%,100%,0.1)',
                color: 'hsl(210,5%,52%)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                background: 'hsla(210,55%,52%,0.15)',
                border: '1px solid hsla(210,55%,52%,0.35)',
                color: 'hsl(210,55%,72%)',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Adding...' : 'Add Dependency'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpsDependencyMapPage() {
  const [graph, setGraph] = useState<DepGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<DepNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const load = useCallback(async () => {
    const res = await fetch(`${BASE}/ops/service-deps`, { credentials: 'include' });
    setGraph((await res.json()) as DepGraph);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const layoutNodes = graph ? computeLayout(graph.nodes, graph.edges) : [];
  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan((p) => ({
      x: p.x + (e.clientX - lastPos.current.x),
      y: p.y + (e.clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleSvgMouseUp = () => {
    dragging.current = false;
  };

  const canvasPad = 120;
  const xs = layoutNodes.map((n) => n.x);
  const ys = layoutNodes.map((n) => n.y);
  const minX = Math.min(...xs, 0) - canvasPad;
  const maxX = Math.max(...xs, 0) + canvasPad;
  const minY = Math.min(...ys, 0) - canvasPad;
  const maxY = Math.max(...ys, 0) + canvasPad;
  const _vw = maxX - minX + 180;
  const _vh = maxY - minY + 80;

  const deleteDep = async (id: number) => {
    await fetch(`${BASE}/ops/service-deps/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  };

  const connectedEdges = selected
    ? (graph?.edges ?? []).filter((e) => e.source === selected.id || e.target === selected.id)
    : [];
  const connectedNodes = selected
    ? connectedEdges.map((e) => (e.source === selected.id ? e.target : e.source))
    : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(210,12%,5%)',
        color: 'hsl(38,12%,90%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showAdd && <AddDepModal onClose={() => setShowAdd(false)} onCreated={load} />}

      <div style={{ padding: '2rem clamp(1rem,5vw,2.5rem) 1.25rem' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <GitBranch size={18} style={{ color: '#3b82f6' }} />
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'hsl(38,12%,94%)' }}>
                Service Dependency Map
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(210,5%,50%)' }}>
              Visualize how platform components relate and how failures propagate.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => load()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.5rem 0.875rem',
                borderRadius: 6,
                fontSize: 12,
                background: 'hsla(0,0%,100%,0.04)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                color: 'hsl(210,5%,52%)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.5rem 1rem',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                background: 'hsla(210,55%,52%,0.12)',
                border: '1px solid hsla(210,55%,52%,0.3)',
                color: 'hsl(210,55%,70%)',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              Add Dependency
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          minHeight: 0,
          padding: '0 clamp(1rem,5vw,2.5rem) 2rem',
        }}
      >
        {/* Graph Canvas */}
        <div
          style={{
            flex: 1,
            background: 'hsla(0,0%,100%,0.015)',
            border: '1px solid hsla(0,0%,100%,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            minHeight: 480,
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'hsl(210,5%,48%)',
              }}
            >
              Loading dependency map...
            </div>
          ) : (
            <svg
              ref={svgRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: 480,
                cursor: dragging.current ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
              onWheel={(e) => setZoom((z) => Math.max(0.4, Math.min(2, z - e.deltaY * 0.001)))}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="hsla(0,0%,100%,0.25)" />
                </marker>
                <marker
                  id="arrow-critical"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x + 80},${pan.y + 80}) scale(${zoom})`}>
                {/* Edges */}
                {(graph?.edges ?? []).map((e) => {
                  const src = nodeMap.get(e.source);
                  const tgt = nodeMap.get(e.target);
                  if (!src || !tgt) return null;
                  const NW = 160;
                  const NH = 60;
                  const sx = src.x + NW / 2,
                    sy = src.y + NH / 2;
                  const tx = tgt.x + NW / 2,
                    ty = tgt.y + NH / 2;
                  const midX = (sx + tx) / 2;
                  const isHighlit =
                    selected && (e.source === selected.id || e.target === selected.id);
                  return (
                    <g key={e.id}>
                      <path
                        d={`M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`}
                        fill="none"
                        stroke={
                          e.isCritical ? '#ef4444' : isHighlit ? '#3b82f6' : 'hsla(0,0%,100%,0.12)'
                        }
                        strokeWidth={e.isCritical ? 1.5 : 1}
                        strokeDasharray={e.type === 'feeds_into' ? '5,4' : undefined}
                        markerEnd={e.isCritical ? 'url(#arrow-critical)' : 'url(#arrow)'}
                        opacity={selected && !isHighlit ? 0.2 : 1}
                      />
                      {e.isCritical && (
                        <text
                          x={midX}
                          y={(sy + ty) / 2 - 5}
                          fontSize="8"
                          fill="#ef4444"
                          textAnchor="middle"
                          opacity={0.8}
                        >
                          critical
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {layoutNodes.map((node) => {
                  const NW = 160;
                  const NH = 60;
                  const cc = categoryColor(node.category);
                  const sc = statusColor(node.status);
                  const isHov = hovered === node.id;
                  const isSel = selected?.id === node.id;
                  const isConn = connectedNodes.includes(node.id);
                  const dimmed = selected && !isSel && !isConn;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(isSel ? null : node);
                      }}
                      onMouseEnter={() => setHovered(node.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1 }}
                    >
                      <rect
                        width={NW}
                        height={NH}
                        rx={8}
                        fill={
                          isSel
                            ? `${cc}20`
                            : isHov
                              ? 'hsla(0,0%,100%,0.06)'
                              : 'hsla(0,0%,100%,0.03)'
                        }
                        stroke={isSel ? cc : isConn ? '#3b82f6' : `${cc}40`}
                        strokeWidth={isSel ? 1.5 : isConn ? 1 : 1}
                      />
                      <circle cx={14} cy={14} r={4} fill={sc} />
                      <text x={26} y={18} fontSize="11" fill={cc} fontWeight="600">
                        {CATEGORY_ICONS[node.category] ?? '⚙'} {node.category}
                      </text>
                      <text x={10} y={38} fontSize="12.5" fill="hsl(38,12%,90%)" fontWeight="600">
                        {node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name}
                      </text>
                      <text
                        x={10}
                        y={52}
                        fontSize="9"
                        fill={sc}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {node.status}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Legend */}
          {!loading && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'hsla(0,0%,0%,0.6)',
                backdropFilter: 'blur(4px)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                border: '1px solid hsla(0,0%,100%,0.08)',
              }}
            >
              <div style={{ fontSize: 10, color: 'hsl(210,5%,42%)', marginBottom: 4 }}>LEGEND</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                  <span
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      color: 'hsl(210,5%,52%)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: c,
                        display: 'inline-block',
                      }}
                    />
                    {s}
                  </span>
                ))}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color: 'hsl(210,5%,52%)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 1.5,
                      background: '#ef4444',
                    }}
                  />
                  critical
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selected && (
          <div
            style={{
              width: 260,
              marginLeft: '1rem',
              background: 'hsla(0,0%,100%,0.02)',
              border: '1px solid hsla(0,0%,100%,0.07)',
              borderRadius: 12,
              padding: '1.25rem',
              flexShrink: 0,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: categoryColor(selected.category),
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {selected.category}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(38,12%,92%)' }}>
                  {selected.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: statusColor(selected.status),
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: statusColor(selected.status) }}>{selected.status}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(210,5%,46%)',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'hsl(210,5%,44%)',
                marginBottom: 8,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Connections ({connectedEdges.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {connectedEdges.map((e) => {
                const isOut = e.source === selected.id;
                const otherId = isOut ? e.target : e.source;
                const otherNode = nodeMap.get(otherId);
                return (
                  <div
                    key={e.id}
                    style={{
                      background: 'hsla(0,0%,100%,0.03)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: 7,
                      padding: '0.625rem 0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 3,
                        flexWrap: 'wrap',
                      }}
                    >
                      {isOut ? (
                        <ArrowRight size={10} style={{ color: '#3b82f6' }} />
                      ) : (
                        <ArrowRight
                          size={10}
                          style={{ color: '#10b981', transform: 'rotate(180deg)' }}
                        />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(38,12%,88%)' }}>
                        {otherNode?.name ?? otherId}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'hsl(210,5%,44%)', marginBottom: 4 }}>
                      {e.type.replace(/_/g, ' ')} · {isOut ? 'outbound' : 'inbound'}
                    </div>
                    {e.isCritical && (
                      <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                        ⚠ Critical path
                      </div>
                    )}
                    {e.description && (
                      <div style={{ fontSize: 10, color: 'hsl(210,5%,46%)', marginTop: 2 }}>
                        {e.description}
                      </div>
                    )}
                    <button
                      onClick={() => deleteDep(e.id)}
                      style={{
                        marginTop: 5,
                        fontSize: 10,
                        color: '#6b7280',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Node list table */}
      {graph && (
        <div style={{ padding: '0 clamp(1rem,5vw,2.5rem) 2rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(210,5%,46%)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.75rem',
              }}
            >
              <Layers size={12} style={{ display: 'inline', marginRight: 5 }} />
              Components ({graph.nodes.length})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {graph.nodes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.375rem 0.75rem',
                    borderRadius: 7,
                    background: 'hsla(0,0%,100%,0.03)',
                    border: '1px solid hsla(0,0%,100%,0.07)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: statusColor(n.status),
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'hsl(38,12%,80%)' }}>{n.name}</span>
                  <span style={{ fontSize: 10, color: categoryColor(n.category) }}>
                    {n.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
