import { color } from '@szl-holdings/design-system';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface ForceNode {
  id: string;
  type: 'vessel' | 'owner' | 'charterer' | 'port' | 'cargo';
  label: string;
  sanctionExposure?: boolean;
  hazardClass?: string;
  riskTier?: string;
}

export interface ForceEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface SimNode extends ForceNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fixed?: boolean;
}

interface Props {
  nodes: ForceNode[];
  edges: ForceEdge[];
  selectedId: string | null;
  onSelect: (node: ForceNode | null) => void;
  height?: number;
  typeColors: Record<string, string>;
}

const RISK_RING: Record<string, string> = {
  low: color.accent.green,
  medium: color.accent.amber,
  high: color.accent.amber,
  critical: color.accent.red,
};

function radiusFor(n: ForceNode): number {
  switch (n.type) {
    case 'owner':
      return 14;
    case 'vessel':
      return 11;
    case 'port':
      return 12;
    case 'charterer':
      return 10;
    case 'cargo':
      return 9;
    default:
      return 10;
  }
}

export function OwnerCargoForceGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  height = 520,
  typeColors,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<SimNode[]>([]);
  const alphaRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const [width, setWidth] = useState(800);
  const [, force] = useState(0);
  const [transform, setTransform] = useState({ k: 1, tx: 0, ty: 0 });
  const [hoverEdge, setHoverEdge] = useState<{ edge: ForceEdge; x: number; y: number } | null>(
    null,
  );
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // Filter edges to only include those whose endpoints are in the visible node set.
  const visibleEdges = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [nodes, edges]);

  // Resize observer.
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync simulation nodes with the input set, preserving positions when ids match.
  useEffect(() => {
    const cx = width / 2;
    const cy = height / 2;
    const ring = Math.min(width, height) * 0.34;
    const prev = new Map(simRef.current.map((n) => [n.id, n] as const));
    simRef.current = nodes.map((n, i) => {
      const existing = prev.get(n.id);
      if (existing) return { ...existing, ...n, r: radiusFor(n) };
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const j = 0.6 + Math.random() * 0.5;
      return {
        ...n,
        x: cx + Math.cos(angle) * ring * j,
        y: cy + Math.sin(angle) * ring * j,
        vx: 0,
        vy: 0,
        r: radiusFor(n),
      };
    });
    alphaRef.current = 1;
    force((x) => x + 1);
  }, [nodes, width, height]);

  // Force simulation tick loop.
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const sim = simRef.current;
      const alpha = alphaRef.current;
      if (alpha > 0.01 && sim.length > 0) {
        const map = new Map(sim.map((n) => [n.id, n] as const));
        // Spring forces along edges.
        for (const e of visibleEdges) {
          const a = map.get(e.source);
          const b = map.get(e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 120;
          const f = ((d - target) / d) * alpha * 0.04;
          if (!a.fixed) {
            a.vx += dx * f;
            a.vy += dy * f;
          }
          if (!b.fixed) {
            b.vx -= dx * f;
            b.vy -= dy * f;
          }
        }
        // Repulsion (O(n²) is fine for typical demo sizes <200).
        for (let i = 0; i < sim.length; i++) {
          const a = sim[i]!;
          for (let j = i + 1; j < sim.length; j++) {
            const b = sim[j]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d2 = dx * dx + dy * dy || 1;
            const d = Math.sqrt(d2);
            const k = (180 * alpha) / d2;
            const fx = (dx / d) * k;
            const fy = (dy / d) * k;
            if (!a.fixed) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (!b.fixed) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }
        // Centering + damping + integrate.
        const cx = width / 2;
        const cy = height / 2;
        for (const n of sim) {
          if (n.fixed) {
            n.vx = 0;
            n.vy = 0;
            continue;
          }
          n.vx += (cx - n.x) * 0.008 * alpha;
          n.vy += (cy - n.y) * 0.008 * alpha;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;
          const pad = n.r + 6;
          n.x = Math.max(pad, Math.min(width - pad, n.x));
          n.y = Math.max(pad, Math.min(height - pad, n.y));
        }
        alphaRef.current = alpha * 0.985;
        force((x) => x + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visibleEdges, width, height]);

  const reheat = () => {
    alphaRef.current = Math.max(alphaRef.current, 0.6);
  };

  // Pointer → SVG coordinate (account for zoom/pan).
  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left - transform.tx) / transform.k;
    const y = (clientY - rect.top - transform.ty) / transform.k;
    return { x, y };
  };

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { id, pointerId: e.pointerId };
    const n = simRef.current.find((s) => s.id === id);
    if (n) n.fixed = true;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const n = simRef.current.find((s) => s.id === dragRef.current?.id);
      if (n) {
        const p = toSvgCoords(e.clientX, e.clientY);
        n.x = p.x;
        n.y = p.y;
        n.vx = 0;
        n.vy = 0;
        reheat();
        force((x) => x + 1);
      }
    } else if (panRef.current) {
      const dx = e.clientX - panRef.current.x;
      const dy = e.clientY - panRef.current.y;
      setTransform((t) => ({ ...t, tx: (panRef.current?.tx ?? 0) + dx, ty: (panRef.current?.ty ?? 0) + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const n = simRef.current.find((s) => s.id === dragRef.current?.id);
      if (n) n.fixed = false;
      dragRef.current = null;
      reheat();
    }
    panRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const onBgPointerDown = (e: React.PointerEvent) => {
    panRef.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setTransform((t) => {
      const k = Math.max(0.3, Math.min(4, t.k * factor));
      const tx = mx - ((mx - t.tx) * k) / t.k;
      const ty = my - ((my - t.ty) * k) / t.k;
      return { k, tx, ty };
    });
  };

  const resetView = () => setTransform({ k: 1, tx: 0, ty: 0 });

  const sim = simRef.current;
  const nodeById = useMemo(() => new Map(sim.map((n) => [n.id, n] as const)), [sim, width, height]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        onPointerDown={onBgPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{
          display: 'block',
          cursor: panRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <defs>
          <radialGradient id="ocg-bg" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="rgba(14,165,233,0.06)" />
            <stop offset="100%" stopColor="rgba(10,22,40,0)" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width="100%" height={height} fill="url(#ocg-bg)" />
        <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.k})`}>
          {/* Edges */}
          {visibleEdges.map((e, i) => {
            const a = nodeById.get(e.source);
            const b = nodeById.get(e.target);
            if (!a || !b) return null;
            const isIncident =
              selectedId === e.source ||
              selectedId === e.target ||
              hoverNode === e.source ||
              hoverNode === e.target;
            const dim = (selectedId || hoverNode) && !isIncident;
            return (
              <line
                key={`e-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isIncident ? '#7dd3fc' : 'rgba(125,211,252,0.28)'}
                strokeOpacity={dim ? 0.08 : 1}
                strokeWidth={Math.max(0.6, Math.min(2.4, e.weight * 1.2)) * (isIncident ? 1.6 : 1)}
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onMouseMove={(ev) => {
                  const p = toSvgCoords(ev.clientX, ev.clientY);
                  setHoverEdge({
                    edge: e,
                    x: p.x * transform.k + transform.tx,
                    y: p.y * transform.k + transform.ty,
                  });
                }}
                onMouseLeave={() => setHoverEdge(null)}
              />
            );
          })}
          {/* Nodes */}
          {sim.map((n) => {
            const color = typeColors[n.type] ?? '#7dd3fc';
            const isSelected = selectedId === n.id;
            const isHover = hoverNode === n.id;
            const ring = n.sanctionExposure
              ? '#ef4444'
              : n.hazardClass
                ? '#fbbf24'
                : n.riskTier
                  ? (RISK_RING[n.riskTier] ?? 'rgba(255,255,255,0.2)')
                  : 'rgba(255,255,255,0.18)';
            const dim =
              (selectedId || hoverNode) &&
              !isSelected &&
              !isHover &&
              !visibleEdges.some(
                (e) =>
                  (e.source === n.id && (e.target === selectedId || e.target === hoverNode)) ||
                  (e.target === n.id && (e.source === selectedId || e.source === hoverNode)),
              );
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                style={{ cursor: 'pointer', opacity: dim ? 0.25 : 1 }}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(isSelected ? null : n);
                }}
                onMouseEnter={() => setHoverNode(n.id)}
                onMouseLeave={() => setHoverNode(null)}
              >
                {(isSelected || isHover) && (
                  <circle
                    r={n.r + 6}
                    fill="none"
                    stroke={color}
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                  />
                )}
                <circle r={n.r} fill={color} fillOpacity={0.85} stroke={ring} strokeWidth={2} />
                {n.sanctionExposure && (
                  <circle
                    r={n.r + 2}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}
                {(isSelected || isHover || transform.k > 1.2) && (
                  <text
                    y={n.r + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#e0f2fe"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {[
          { label: '+', op: () => setTransform((t) => ({ ...t, k: Math.min(4, t.k * 1.2) })) },
          { label: '−', op: () => setTransform((t) => ({ ...t, k: Math.max(0.3, t.k / 1.2) })) },
          { label: '⤾', op: resetView },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.op}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: '1px solid rgba(125,211,252,0.25)',
              background: 'rgba(10,22,40,0.85)',
              color: '#7dd3fc',
              fontSize: 13,
              cursor: 'pointer',
            }}
            aria-label={b.label}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Edge tooltip */}
      {hoverEdge && (
        <div
          style={{
            position: 'absolute',
            left: hoverEdge.x + 10,
            top: hoverEdge.y + 10,
            pointerEvents: 'none',
            background: 'rgba(10,22,40,0.95)',
            border: '1px solid rgba(125,211,252,0.3)',
            color: '#e0f2fe',
            fontSize: 10,
            padding: '4px 7px',
            borderRadius: 6,
            textTransform: 'capitalize',
            whiteSpace: 'nowrap',
            zIndex: 5,
          }}
        >
          {hoverEdge.edge.label.replace(/_/g, ' ')}
        </div>
      )}

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 8,
          fontSize: 9,
          color: 'rgba(125,211,252,0.5)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Drag nodes · Scroll to zoom · Drag background to pan · Click to inspect
      </div>
    </div>
  );
}
