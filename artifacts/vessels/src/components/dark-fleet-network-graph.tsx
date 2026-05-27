import { cn } from '@szl-holdings/shared-ui/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ENTITY_TYPE_CONFIG,
  TIER_CONFIG,
  type EntityNode,
  type EntityNodeType,
  type RelationshipEdge,
} from '@/data/sanctions-network-data';

interface SimNode extends EntityNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fixed?: boolean;
}

interface Props {
  nodes: EntityNode[];
  edges: RelationshipEdge[];
  selectedId: string | null;
  onSelect: (node: EntityNode | null) => void;
  height?: number;
}

function radiusFor(n: EntityNode): number {
  switch (n.type) {
    case 'vessel':
      return 18;
    case 'beneficial_owner':
      return 14;
    case 'registered_owner':
      return 13;
    case 'ship_manager':
      return 12;
    case 'counterparty':
      return 12;
    case 'charterer':
      return 11;
    case 'insurer':
      return 10;
    case 'flag_state':
      return 10;
    case 'port_agent':
      return 9;
    default:
      return 10;
  }
}

function nodeColor(n: EntityNode): string {
  if (n.sanctioned) return '#ef4444';
  return ENTITY_TYPE_CONFIG[n.type]?.color ?? 'var(--gi-text-muted)';
}

function tierRingColor(tier: EntityNode['riskTier']): string {
  return TIER_CONFIG[tier]?.dot ?? 'var(--gi-text-muted)';
}

const SANCTION_LIST_ABBR: Record<string, string> = {
  OFAC_SDN: 'SDN',
  EU_CONSOLIDATED: 'EU',
  UK_OFSI: 'OFSI',
  UN_SECURITY_COUNCIL: 'UN',
};

export function DarkFleetNetworkGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  height = 480,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<SimNode[]>([]);
  const alphaRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const [width, setWidth] = useState(800);
  const [, force] = useState(0);
  const [transform, setTransform] = useState({ k: 1, tx: 0, ty: 0 });
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: EntityNode; x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const visibleEdges = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [nodes, edges]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cx = width / 2;
    const cy = height / 2;
    const ring = Math.min(width, height) * 0.32;
    const prev = new Map(simRef.current.map((n) => [n.id, n] as const));
    simRef.current = nodes.map((n, i) => {
      const existing = prev.get(n.id);
      if (existing) return { ...existing, ...n, r: radiusFor(n) };
      const isVessel = n.type === 'vessel';
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      return {
        ...n,
        x: isVessel ? cx : cx + Math.cos(angle) * ring * (0.7 + Math.random() * 0.4),
        y: isVessel ? cy : cy + Math.sin(angle) * ring * (0.7 + Math.random() * 0.4),
        vx: 0,
        vy: 0,
        r: radiusFor(n),
        fixed: isVessel,
      };
    });
    alphaRef.current = 1;
    force((x) => x + 1);
  }, [nodes, width, height]);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const sim = simRef.current;
      const alpha = alphaRef.current;
      if (alpha > 0.01 && sim.length > 0) {
        const map = new Map(sim.map((n) => [n.id, n] as const));
        for (const e of visibleEdges) {
          const a = map.get(e.source);
          const b = map.get(e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 130;
          const f = ((d - target) / d) * alpha * 0.035;
          if (!a.fixed) { a.vx += dx * f; a.vy += dy * f; }
          if (!b.fixed) { b.vx -= dx * f; b.vy -= dy * f; }
        }
        for (let i = 0; i < sim.length; i++) {
          const a = sim[i]!;
          for (let j = i + 1; j < sim.length; j++) {
            const b = sim[j]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d2 = dx * dx + dy * dy || 1;
            const d = Math.sqrt(d2);
            const k = (200 * alpha) / d2;
            const fx = (dx / d) * k;
            const fy = (dy / d) * k;
            if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
            if (!b.fixed) { b.vx += fx; b.vy += fy; }
          }
        }
        const cx = width / 2;
        const cy = height / 2;
        for (const n of sim) {
          if (n.fixed) continue;
          n.vx += (cx - n.x) * alpha * 0.003;
          n.vy += (cy - n.y) * alpha * 0.003;
          n.vx *= 0.88;
          n.vy *= 0.88;
          n.x += n.vx;
          n.y += n.vy;
        }
        alphaRef.current *= 0.97;
        force((x) => x + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [visibleEdges, width, height]);

  const simNodes = simRef.current;
  const nodeMap = new Map(simNodes.map((n) => [n.id, n] as const));

  function toSvg(cx: number, cy: number) {
    return {
      x: (cx - transform.tx) / transform.k,
      y: (cy - transform.ty) / transform.k,
    };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const tgt = e.target as SVGElement;
    const nodeId = tgt.closest('[data-nodeid]')?.getAttribute('data-nodeid');
    if (nodeId) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { id: nodeId, pointerId: e.pointerId };
      return;
    }
    panRef.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (dragRef.current) {
      const node = simRef.current.find((n) => n.id === dragRef.current!.id);
      if (node) {
        const rect = e.currentTarget.getBoundingClientRect();
        const sx = (e.clientX - rect.left - transform.tx) / transform.k;
        const sy = (e.clientY - rect.top - transform.ty) / transform.k;
        node.x = sx;
        node.y = sy;
        node.vx = 0;
        node.vy = 0;
        alphaRef.current = 0.3;
        force((x) => x + 1);
      }
      return;
    }
    if (panRef.current) {
      const dx = e.clientX - panRef.current.x;
      const dy = e.clientY - panRef.current.y;
      setTransform((t) => ({ ...t, tx: panRef.current!.tx + dx, ty: panRef.current!.ty + dy }));
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (dragRef.current) {
      const node = simRef.current.find((n) => n.id === dragRef.current!.id);
      if (node) node.fixed = false;
      dragRef.current = null;
    }
    panRef.current = null;
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((t) => {
      const newK = Math.max(0.3, Math.min(3, t.k * factor));
      const scale = newK / t.k;
      return {
        k: newK,
        tx: mx - (mx - t.tx) * scale,
        ty: my - (my - t.ty) * scale,
      };
    });
  }

  function onNodeClick(node: EntityNode) {
    onSelect(selectedId === node.id ? null : node);
  }

  function onNodeHover(e: React.MouseEvent, node: EntityNode | null) {
    if (node) {
      setHoverNode(node.id);
      setTooltip({ node, x: e.clientX, y: e.clientY });
    } else {
      setHoverNode(null);
      setTooltip(null);
    }
  }

  const edgeTypeStyle: Record<string, { stroke: string; dash: string }> = {
    owned_by: { stroke: '#818cf8', dash: '' },
    managed_by: { stroke: '#34d399', dash: '4 2' },
    flagged_under: { stroke: '#94a3b8', dash: '2 4' },
    contracted_with: { stroke: '#fb923c', dash: '6 3' },
    insured_by: { stroke: '#06b6d4', dash: '3 3' },
    chartered_to: { stroke: '#f59e0b', dash: '5 2' },
    crewed_by: { stroke: 'var(--gi-text-muted)', dash: '2 2' },
    agent_in: { stroke: 'var(--gi-text-muted)', dash: '2 2' },
  };

  return (
    <div ref={wrapRef} data-testid="entity-network-graph" className="relative w-full select-none" style={{ height }}>
      <svg
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <marker id="dfng-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#334155" />
          </marker>
          {Object.entries(edgeTypeStyle).map(([type, s]) => (
            <marker
              key={`arrow-${type}`}
              id={`dfng-arrow-${type}`}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={s.stroke} opacity={0.6} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}>
          {visibleEdges.map((e, i) => {
            const a = nodeMap.get(e.source);
            const b = nodeMap.get(e.target);
            if (!a || !b) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / d;
            const uy = dy / d;
            const x1 = a.x + ux * a.r;
            const y1 = a.y + uy * a.r;
            const x2 = b.x - ux * (b.r + 8);
            const y2 = b.y - uy * (b.r + 8);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 18;
            const style = edgeTypeStyle[e.type] ?? { stroke: '#475569', dash: '' };
            const isSelected = selectedId === e.source || selectedId === e.target;
            return (
              <g key={`edge-${i}`}>
                <path
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={isSelected ? 2 : 1.2}
                  strokeDasharray={style.dash}
                  opacity={isSelected ? 0.85 : 0.4}
                  markerEnd={`url(#dfng-arrow-${e.type})`}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fill={style.stroke}
                  fontSize={9}
                  opacity={isSelected ? 0.9 : 0.45}
                  className="pointer-events-none"
                >
                  {e.label}
                  {e.confidence < 1 ? ` (${Math.round(e.confidence * 100)}%)` : ''}
                </text>
              </g>
            );
          })}

          {simNodes.map((n) => {
            const cfg = ENTITY_TYPE_CONFIG[n.type as EntityNodeType] ?? { color: 'var(--gi-text-muted)', abbr: '?' };
            const fill = nodeColor(n);
            const ring = tierRingColor(n.riskTier);
            const isSelected = selectedId === n.id;
            const isHover = hoverNode === n.id;
            return (
              <g
                key={n.id}
                data-nodeid={n.id}
                transform={`translate(${n.x},${n.y})`}
                onClick={() => onNodeClick(n)}
                onMouseEnter={(e) => onNodeHover(e, n)}
                onMouseLeave={(e) => onNodeHover(e, null)}
                style={{ cursor: 'pointer' }}
              >
                {(n.riskTier !== 'clear' || isSelected) && (
                  <circle
                    r={n.r + 5}
                    fill="none"
                    stroke={ring}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={isSelected ? 0.9 : 0.5}
                    strokeDasharray={n.sanctioned ? '' : '3 2'}
                  />
                )}
                <circle
                  r={n.r}
                  fill={fill}
                  fillOpacity={isHover || isSelected ? 0.9 : 0.65}
                  stroke={isSelected ? '#fff' : fill}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={0.8}
                />
                {n.sanctioned && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={n.r * 0.85}
                    fill="#fff"
                    className="pointer-events-none font-bold"
                  >
                    !
                  </text>
                )}
                {!n.sanctioned && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    fill="#fff"
                    className="pointer-events-none font-mono"
                  >
                    {cfg.abbr}
                  </text>
                )}
                <text
                  y={n.r + 12}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill={isSelected ? 'var(--gi-text-primary)' : '#94a3b8'}
                  className="pointer-events-none"
                >
                  {n.label.length > 22 ? n.label.slice(0, 20) + '…' : n.label}
                </text>
                {n.sanctionLists && n.sanctionLists.length > 0 && (
                  <text
                    y={n.r + 24}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#ef4444"
                    className="pointer-events-none"
                  >
                    {n.sanctionLists.map((l) => SANCTION_LIST_ABBR[l] ?? l).join(' · ')}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl text-xs max-w-[220px]"
          style={{
            left: Math.min(tooltip.x + 12, width - 230),
            top: Math.min(tooltip.y - 20, height - 120),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: nodeColor(tooltip.node) }}
            />
            <span className="font-semibold text-slate-100">{tooltip.node.label}</span>
          </div>
          <div className="text-slate-400 space-y-0.5">
            <div>
              Type:{' '}
              <span className="text-slate-300">
                {ENTITY_TYPE_CONFIG[tooltip.node.type]?.label ?? tooltip.node.type}
              </span>
            </div>
            <div>
              Country: <span className="text-slate-300">{tooltip.node.country}</span>
            </div>
            <div>
              Risk:{' '}
              <span className={TIER_CONFIG[tooltip.node.riskTier]?.color ?? 'text-slate-300'}>
                {TIER_CONFIG[tooltip.node.riskTier]?.label}
              </span>
            </div>
            <div>
              Confidence:{' '}
              <span className="text-slate-300">{Math.round(tooltip.node.confidence * 100)}%</span>
            </div>
            {tooltip.node.sanctioned && (
              <div className="text-red-400 font-semibold mt-1">
                SANCTIONED —{' '}
                {tooltip.node.sanctionLists?.map((l) => SANCTION_LIST_ABBR[l] ?? l).join(', ')}
              </div>
            )}
            {tooltip.node.details && (
              <div className="text-slate-400 mt-1 italic">{tooltip.node.details}</div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 select-none">
        Drag nodes · Scroll to zoom · Click to inspect
      </div>
    </div>
  );
}

export function NetworkLegend({ nodes }: { nodes: EntityNode[] }) {
  const presentTypes = [...new Set(nodes.map((n) => n.type as EntityNodeType))];
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {presentTypes.map((t) => {
        const cfg = ENTITY_TYPE_CONFIG[t];
        return (
          <div key={t} className="flex items-center gap-1 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cfg.color }}
            />
            {cfg.label}
          </div>
        );
      })}
      <div className="flex items-center gap-1 text-xs text-red-400 ml-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-500" />
        Sanctioned Entity
      </div>
    </div>
  );
}
