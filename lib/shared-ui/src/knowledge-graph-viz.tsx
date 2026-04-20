/**
 * Knowledge Graph Visualization Components
 *
 * Force-directed, hierarchical, and timeline-based graph layouts
 * for exploring the cross-domain knowledge graph.
 */

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphVizNode {
  id: string;
  name: string;
  entityType: string;
  domain: string;
  description?: string | null;
  confidence?: number;
  degree?: number;
  centralityScore?: number;
  properties?: Record<string, unknown>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  pinned?: boolean;
}

export interface GraphVizEdge {
  id: string;
  fromId: string;
  toId: string;
  relationshipType: string;
  strength?: number;
  isCrossDomain?: boolean;
  fromDomain?: string;
  toDomain?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphVizNode[];
  edges: GraphVizEdge[];
}

export interface KnowledgeGraphVizProps {
  data: KnowledgeGraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphVizNode) => void;
  onEdgeClick?: (edge: GraphVizEdge) => void;
  highlightNodeId?: string;
  highlightPath?: string[];
  showLabels?: boolean;
  colorByDomain?: boolean;
  className?: string;
}

// ─── Domain Colour Palette ────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  prism: '#8B5CF6',
  vessels: '#0EA5E9',
  aegis: '#EF4444',
  terra: '#10B981',
  lyte: '#F59E0B',
  'carlota-jo': '#EC4899',
  stephen: '#6B7280',
  orchestration: '#1D4ED8',
  intelligence: '#DC2626',
  maritime: '#0284C7',
  legal: '#7C3AED',
  default: '#6B7280',
};

const ENTITY_TYPE_SHAPES: Record<string, string> = {
  person: 'circle',
  organization: 'rect',
  asset: 'diamond',
  threat: 'triangle',
  concept: 'hexagon',
  vessel: 'ship',
  default: 'circle',
};

function getDomainColor(domain: string): string {
  const lower = domain.toLowerCase();
  for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return DOMAIN_COLORS.default!;
}

// ─── Simple Force Simulation ──────────────────────────────────────────────────

function runForceSimulation(
  nodes: GraphVizNode[],
  edges: GraphVizEdge[],
  width: number,
  height: number,
  iterations = 300,
): GraphVizNode[] {
  const positioned = nodes.map((n) => ({
    ...n,
    x: n.x ?? Math.random() * width,
    y: n.y ?? Math.random() * height,
    vx: 0,
    vy: 0,
  }));

  const nodeMap = new Map(positioned.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i]!;
        const b = positioned[j]!;
        const dx = (b.x ?? 0) - (a.x ?? 0);
        const dy = (b.y ?? 0) - (a.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulse = (120 * 120) / dist;
        const fx = (dx / dist) * repulse * alpha * 0.02;
        const fy = (dy / dist) * repulse * alpha * 0.02;
        a.vx = (a.vx ?? 0) - fx;
        a.vy = (a.vy ?? 0) - fy;
        b.vx = (b.vx ?? 0) + fx;
        b.vy = (b.vy ?? 0) + fy;
      }
    }

    for (const edge of edges) {
      const from = nodeMap.get(edge.fromId);
      const to = nodeMap.get(edge.toId);
      if (!from || !to) continue;
      const dx = (to.x ?? 0) - (from.x ?? 0);
      const dy = (to.y ?? 0) - (from.y ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 120;
      const force = ((dist - targetDist) / dist) * alpha * 0.1;
      from.vx = (from.vx ?? 0) + dx * force;
      from.vy = (from.vy ?? 0) + dy * force;
      to.vx = (to.vx ?? 0) - dx * force;
      to.vy = (to.vy ?? 0) - dy * force;
    }

    const cx = width / 2;
    const cy = height / 2;
    for (const n of positioned) {
      if (n.pinned) continue;
      n.vx = ((n.vx ?? 0) + (cx - (n.x ?? cx)) * 0.005) * 0.9;
      n.vy = ((n.vy ?? 0) + (cy - (n.y ?? cy)) * 0.005) * 0.9;
      n.x = Math.max(20, Math.min(width - 20, (n.x ?? cx) + (n.vx ?? 0)));
      n.y = Math.max(20, Math.min(height - 20, (n.y ?? cy) + (n.vy ?? 0)));
    }
  }

  return positioned;
}

// ─── Force-Directed Layout ────────────────────────────────────────────────────

export function KnowledgeGraphViz({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  highlightNodeId,
  highlightPath,
  showLabels = true,
  colorByDomain = true,
  className = '',
}: KnowledgeGraphVizProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphVizNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );

  useEffect(() => {
    if (data.nodes.length === 0) {
      setNodes([]);
      return;
    }
    const positioned = runForceSimulation(data.nodes, data.edges, width, height);
    setNodes(positioned);
  }, [data.nodes.map((n) => n.id).join(','), data.edges.length, width, height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.2, Math.min(4, t.scale * scaleFactor)),
    }));
  }, []);

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).tagName === 'svg') {
        setPanStart({ x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y });
      }
    },
    [transform],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panStart) {
        setTransform((t) => ({
          ...t,
          x: panStart.tx + (e.clientX - panStart.x),
          y: panStart.ty + (e.clientY - panStart.y),
        }));
      }
      if (dragging) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging.nodeId
              ? {
                  ...n,
                  x: (n.x ?? 0) + (e.clientX - dragging.startX) / transform.scale,
                  y: (n.y ?? 0) + (e.clientY - dragging.startY) / transform.scale,
                  pinned: true,
                }
              : n,
          ),
        );
        setDragging((d) => (d ? { ...d, startX: e.clientX, startY: e.clientY } : null));
      }
    },
    [panStart, dragging, transform.scale],
  );

  const handleMouseUp = useCallback(() => {
    setPanStart(null);
    setDragging(null);
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDragging({ nodeId, startX: e.clientX, startY: e.clientY });
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const highlightSet = useMemo(() => new Set(highlightPath ?? []), [highlightPath]);

  const getNodeRadius = (node: GraphVizNode) => {
    const base = 8;
    const degree = node.degree ?? 0;
    return Math.min(24, base + degree * 1.5);
  };

  if (data.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ width, height }}
      >
        No graph data to display
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-950 rounded-lg border border-gray-800 ${className}`}
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: panStart ? 'grabbing' : 'grab' }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 Z" fill="#4B5563" />
          </marker>
          <marker
            id="arrowhead-highlight"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 Z" fill="#60A5FA" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {data.edges.map((edge) => {
            const from = nodeMap.get(edge.fromId);
            const to = nodeMap.get(edge.toId);
            if (!from || !to) return null;
            const isHighlighted = highlightSet.has(edge.fromId) && highlightSet.has(edge.toId);
            const isHovered = hoveredNode === edge.fromId || hoveredNode === edge.toId;
            return (
              <g key={edge.id} onClick={() => onEdgeClick?.(edge)} style={{ cursor: 'pointer' }}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    isHighlighted
                      ? '#60A5FA'
                      : isHovered
                        ? '#9CA3AF'
                        : edge.isCrossDomain
                          ? '#8B5CF6'
                          : '#374151'
                  }
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={edge.isCrossDomain ? '4 2' : undefined}
                  markerEnd={`url(#${isHighlighted ? 'arrowhead-highlight' : 'arrowhead'})`}
                  opacity={isHighlighted || isHovered ? 1 : 0.6}
                />
                {isHovered && (
                  <text
                    x={((from.x ?? 0) + (to.x ?? 0)) / 2}
                    y={((from.y ?? 0) + (to.y ?? 0)) / 2 - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#9CA3AF"
                  >
                    {edge.relationshipType}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const r = getNodeRadius(node);
            const color = colorByDomain ? getDomainColor(node.domain) : '#6B7280';
            const isHighlighted = highlightNodeId === node.id || highlightSet.has(node.id);
            const isHovered = hoveredNode === node.id;
            const opacity = highlightNodeId && !isHighlighted ? 0.3 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
                onClick={() => onNodeClick?.(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{ cursor: 'pointer' }}
                opacity={opacity}
              >
                <circle
                  r={r + (isHighlighted ? 3 : 0)}
                  fill={isHighlighted ? '#1E40AF' : 'transparent'}
                  stroke={color}
                  strokeWidth={isHighlighted ? 2.5 : isHovered ? 2 : 1.5}
                />
                <circle r={r - 2} fill={color} fillOpacity={0.25} />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill={color}
                  fontWeight="600"
                >
                  {node.entityType.slice(0, 2).toUpperCase()}
                </text>
                {(showLabels || isHovered) && (
                  <text
                    y={r + 10}
                    textAnchor="middle"
                    fontSize={isHovered ? '11' : '9'}
                    fill={isHovered ? '#E5E7EB' : '#9CA3AF'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.name.length > 18 ? node.name.slice(0, 18) + '…' : node.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {['+', '-', '⌂'].map((btn, i) => (
          <button
            key={btn}
            onClick={() => {
              if (i === 0) setTransform((t) => ({ ...t, scale: Math.min(4, t.scale * 1.2) }));
              if (i === 1) setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale * 0.8) }));
              if (i === 2) setTransform({ x: 0, y: 0, scale: 1 });
            }}
            className="w-6 h-6 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs border border-gray-700 flex items-center justify-center"
          >
            {btn}
          </button>
        ))}
      </div>

      <div className="absolute bottom-2 left-2 text-xs text-gray-600">
        {data.nodes.length} nodes · {data.edges.length} edges
      </div>
    </div>
  );
}

// ─── Hierarchical Graph Layout ────────────────────────────────────────────────

export interface HierarchicalGraphVizProps {
  data: KnowledgeGraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphVizNode) => void;
  highlightNodeId?: string;
  showLabels?: boolean;
  colorByDomain?: boolean;
  className?: string;
}

function buildHierarchicalLayout(
  nodes: GraphVizNode[],
  edges: GraphVizEdge[],
  width: number,
  height: number,
): GraphVizNode[] {
  if (nodes.length === 0) return nodes;

  const adjMap = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    adjMap.set(n.id, new Set());
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    adjMap.get(e.fromId)?.add(e.toId);
    inDegree.set(e.toId, (inDegree.get(e.toId) ?? 0) + 1);
  }

  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const starts =
    roots.length > 0
      ? roots
      : [nodes.reduce((a, b) => ((a.degree ?? 0) > (b.degree ?? 0) ? a : b))];

  const level = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = starts.map((n) => ({ id: n.id, depth: 0 }));
  for (const s of starts) level.set(s.id, 0);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const neighbor of adjMap.get(cur.id) ?? []) {
      if (!level.has(neighbor)) {
        level.set(neighbor, cur.depth + 1);
        queue.push({ id: neighbor, depth: cur.depth + 1 });
      }
    }
  }

  const maxLevel = Math.max(...Array.from(level.values()), 0);
  const byLevel = new Map<number, GraphVizNode[]>();
  for (const n of nodes) {
    const l = level.get(n.id) ?? maxLevel;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(n);
  }

  const levelCount = maxLevel + 1;
  const verticalStep = levelCount > 1 ? (height - 80) / (levelCount - 1) : 0;

  return nodes.map((n) => {
    const l = level.get(n.id) ?? maxLevel;
    const row = byLevel.get(l) ?? [n];
    const idx = row.indexOf(n);
    const rowWidth = row.length > 1 ? (width - 80) / (row.length - 1) : 0;
    return {
      ...n,
      x: row.length === 1 ? width / 2 : 40 + idx * rowWidth,
      y: 40 + l * verticalStep,
    };
  });
}

export function HierarchicalGraphViz({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  highlightNodeId,
  showLabels = true,
  colorByDomain = true,
  className = '',
}: HierarchicalGraphVizProps) {
  const nodes = useMemo(
    () => buildHierarchicalLayout(data.nodes, data.edges, width, height),
    [data.nodes.map((n) => n.id).join(','), data.edges.length, width, height],
  );
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (data.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ width, height }}
      >
        No graph data to display
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-950 rounded-lg border border-gray-800 ${className}`}
      style={{ width, height }}
    >
      <div className="absolute top-1 left-2 text-xs text-gray-600 font-medium">Hierarchical</div>
      <svg width={width} height={height}>
        <defs>
          <marker id="h-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 Z" fill="#4B5563" />
          </marker>
        </defs>
        {data.edges.map((edge) => {
          const from = nodeMap.get(edge.fromId);
          const to = nodeMap.get(edge.toId);
          if (!from || !to) return null;
          const midX = ((from.x ?? 0) + (to.x ?? 0)) / 2;
          const midY = ((from.y ?? 0) + (to.y ?? 0)) / 2;
          const isHovered = hoveredNode === edge.fromId || hoveredNode === edge.toId;
          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.isCrossDomain ? '#8B5CF6' : isHovered ? '#9CA3AF' : '#374151'}
                strokeWidth={isHovered ? 1.5 : 1}
                strokeDasharray={edge.isCrossDomain ? '4 2' : undefined}
                markerEnd="url(#h-arrow)"
                opacity={isHovered ? 1 : 0.6}
              />
              {isHovered && (
                <text x={midX} y={midY - 5} textAnchor="middle" fontSize="8" fill="#9CA3AF">
                  {edge.relationshipType}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((node) => {
          const color = colorByDomain ? getDomainColor(node.domain) : '#6B7280';
          const isHighlighted = highlightNodeId === node.id;
          const isHovered = hoveredNode === node.id;
          const r = Math.min(20, 8 + (node.degree ?? 0) * 1.2);
          return (
            <g
              key={node.id}
              transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
              onClick={() => onNodeClick?.(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={-r}
                y={-r / 1.4}
                width={r * 2}
                height={r * 1.4 * 1.4}
                rx={node.entityType === 'organization' ? 3 : r}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth={isHighlighted || isHovered ? 2 : 1.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill={color}
                fontWeight="600"
              >
                {node.entityType.slice(0, 2).toUpperCase()}
              </text>
              {(showLabels || isHovered) && (
                <text
                  y={r + 9}
                  textAnchor="middle"
                  fontSize="8"
                  fill={isHovered ? '#E5E7EB' : '#9CA3AF'}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name.length > 16 ? node.name.slice(0, 16) + '…' : node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-2 text-xs text-gray-600">
        {data.nodes.length} nodes · {data.edges.length} edges
      </div>
    </div>
  );
}

// ─── Timeline Graph Layout ─────────────────────────────────────────────────────
// Renders relationships on a horizontal time axis. Nodes are grouped by domain
// on the Y-axis. Edge x-position is derived from a `timestamp`, `createdAt`, or
// `date` property on the relationship; if none is present, edges are distributed
// evenly left-to-right in insertion order.

export interface TimelineGraphVizProps {
  data: KnowledgeGraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphVizNode) => void;
  onEdgeClick?: (edge: GraphVizEdge) => void;
  className?: string;
}

function extractEdgeTimestamp(edge: GraphVizEdge): number | null {
  const p = (edge as GraphVizEdge & { properties?: Record<string, unknown> }).properties;
  if (!p) return null;
  for (const key of ['timestamp', 'createdAt', 'created_at', 'date', 'occurred_at']) {
    const val = p[key];
    if (typeof val === 'string' || typeof val === 'number') {
      const ms = typeof val === 'number' ? val : Date.parse(val);
      if (!isNaN(ms)) return ms;
    }
  }
  return null;
}

export function TimelineGraphViz({
  data,
  width = 800,
  height = 400,
  onNodeClick,
  onEdgeClick,
  className = '',
}: TimelineGraphVizProps) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const PAD_L = 80,
    PAD_R = 20,
    PAD_T = 40,
    PAD_B = 32;
  const innerW = width - PAD_L - PAD_R;
  const innerH = height - PAD_T - PAD_B;

  const domains = useMemo(
    () => Array.from(new Set(data.nodes.map((n) => n.domain))).sort(),
    [data.nodes],
  );
  const domainY = useMemo(() => {
    const step = innerH / Math.max(domains.length, 1);
    return new Map(domains.map((d, i) => [d, PAD_T + step * i + step / 2]));
  }, [domains, innerH]);

  const nodeMap = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);

  const timestamps = useMemo(() => data.edges.map(extractEdgeTimestamp), [data.edges]);
  const hasTimestamps = timestamps.some((t) => t !== null);
  const minTs = hasTimestamps ? Math.min(...(timestamps.filter(Boolean) as number[])) : 0;
  const maxTs = hasTimestamps ? Math.max(...(timestamps.filter(Boolean) as number[])) : 1;
  const tsRange = maxTs - minTs || 1;

  const edgeX = (edge: GraphVizEdge, index: number): number => {
    const ts = extractEdgeTimestamp(edge);
    if (hasTimestamps && ts !== null) return PAD_L + ((ts - minTs) / tsRange) * innerW;
    return (
      PAD_L + (data.edges.length > 1 ? (index / (data.edges.length - 1)) * innerW : innerW / 2)
    );
  };

  if (data.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ width, height }}
      >
        No graph data to display
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-950 rounded-lg border border-gray-800 ${className}`}
      style={{ width, height }}
    >
      <div className="absolute top-1 left-2 text-xs text-gray-600 font-medium">Timeline</div>
      <svg width={width} height={height}>
        {domains.map((domain) => {
          const y = domainY.get(domain) ?? 0;
          return (
            <g key={domain}>
              <line x1={PAD_L} y1={y} x2={width - PAD_R} y2={y} stroke="#1F2937" strokeWidth={1} />
              <text
                x={PAD_L - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="9"
                fill={getDomainColor(domain)}
              >
                {domain.length > 10 ? domain.slice(0, 10) + '…' : domain}
              </text>
            </g>
          );
        })}

        {data.edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.fromId);
          const toNode = nodeMap.get(edge.toId);
          const x = edgeX(edge, i);
          const fromY = domainY.get(fromNode?.domain ?? '') ?? PAD_T + innerH / 2;
          const toY = domainY.get(toNode?.domain ?? '') ?? PAD_T + innerH / 2;
          const isHovered = hoveredEdge === edge.id;
          const color = edge.isCrossDomain ? '#8B5CF6' : '#374151';
          return (
            <g
              key={edge.id}
              onClick={() => onEdgeClick?.(edge)}
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              style={{ cursor: 'pointer' }}
            >
              <line
                x1={x}
                y1={fromY}
                x2={x}
                y2={toY}
                stroke={isHovered ? '#60A5FA' : color}
                strokeWidth={isHovered ? 2 : 1}
                strokeDasharray={edge.isCrossDomain ? '3 2' : undefined}
              />
              <circle
                cx={x}
                cy={fromY}
                r={4}
                fill={getDomainColor(fromNode?.domain ?? '')}
                opacity={isHovered ? 1 : 0.7}
              />
              <circle
                cx={x}
                cy={toY}
                r={4}
                fill={getDomainColor(toNode?.domain ?? '')}
                opacity={isHovered ? 1 : 0.7}
              />
              {isHovered && (
                <text x={x + 5} y={Math.min(fromY, toY) - 4} fontSize="8" fill="#9CA3AF">
                  {edge.relationshipType}
                </text>
              )}
            </g>
          );
        })}

        {data.edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.fromId);
          const x = edgeX(edge, i);
          const ts = extractEdgeTimestamp(edge);
          const label = ts
            ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : String(i + 1);
          return (
            <text
              key={`lbl-${edge.id}`}
              x={x}
              y={height - PAD_B + 12}
              textAnchor="middle"
              fontSize="7"
              fill="#4B5563"
              style={{ pointerEvents: 'none' }}
            >
              {fromNode?.name.slice(0, 6) ?? label}
            </text>
          );
        })}
      </svg>
      <div className="absolute bottom-2 right-2 text-xs text-gray-600">
        {data.edges.length} relationships · {hasTimestamps ? 'time-ordered' : 'insertion order'}
      </div>
    </div>
  );
}

// ─── Unified Graph View (layout switcher) ─────────────────────────────────────

export type GraphLayout = 'force' | 'hierarchical' | 'timeline';

export interface UnifiedKnowledgeGraphVizProps {
  data: KnowledgeGraphData;
  defaultLayout?: GraphLayout;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphVizNode) => void;
  className?: string;
}

export function UnifiedKnowledgeGraphViz({
  data,
  defaultLayout = 'force',
  width = 800,
  height = 600,
  onNodeClick,
  className = '',
}: UnifiedKnowledgeGraphVizProps) {
  const [layout, setLayout] = useState<GraphLayout>(defaultLayout);

  const layoutLabels: Record<GraphLayout, string> = {
    force: 'Force',
    hierarchical: 'Hierarchy',
    timeline: 'Timeline',
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex gap-1">
        {(Object.keys(layoutLabels) as GraphLayout[]).map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
              layout === l
                ? 'bg-blue-900 border-blue-700 text-blue-200'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {layoutLabels[l]}
          </button>
        ))}
      </div>
      {layout === 'force' && (
        <KnowledgeGraphViz
          data={data}
          width={width}
          height={height}
          {...(onNodeClick !== undefined ? { onNodeClick } : {})}
        />
      )}
      {layout === 'hierarchical' && (
        <HierarchicalGraphViz
          data={data}
          width={width}
          height={height}
          {...(onNodeClick !== undefined ? { onNodeClick } : {})}
        />
      )}
      {layout === 'timeline' && (
        <TimelineGraphViz
          data={data}
          width={width}
          height={height}
          {...(onNodeClick !== undefined ? { onNodeClick } : {})}
        />
      )}
    </div>
  );
}

// ─── Graph Legend ─────────────────────────────────────────────────────────────

export interface GraphLegendProps {
  domains: string[];
  className?: string;
}

export function GraphLegend({ domains, className = '' }: GraphLegendProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {domains.map((domain) => (
        <div key={domain} className="flex items-center gap-1.5 text-xs text-gray-400">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getDomainColor(domain), opacity: 0.7 }}
          />
          <span className="capitalize">{domain}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <div className="w-4 h-px border-dashed border-t border-purple-500" />
        <span>cross-domain</span>
      </div>
    </div>
  );
}

// ─── Node Detail Panel ────────────────────────────────────────────────────────

export interface NodeDetailPanelProps {
  node: GraphVizNode | null;
  onClose?: () => void;
  className?: string;
}

export function NodeDetailPanel({ node, onClose, className = '' }: NodeDetailPanelProps) {
  if (!node) return null;
  const color = getDomainColor(node.domain);

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-500 uppercase tracking-wide">{node.entityType}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500">{node.domain}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs">
            ✕
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white mb-2">{node.name}</h3>

      {node.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-3">{node.description}</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {node.degree != null && (
          <>
            <span className="text-gray-600">Connections</span>
            <span className="text-gray-300">{node.degree}</span>
          </>
        )}
        {node.confidence != null && (
          <>
            <span className="text-gray-600">Confidence</span>
            <span className="text-gray-300">{Math.round(node.confidence * 100)}%</span>
          </>
        )}
        {node.centralityScore != null && (
          <>
            <span className="text-gray-600">Centrality</span>
            <span className="text-gray-300">{Math.round(node.centralityScore * 100)}%</span>
          </>
        )}
      </div>

      {node.properties && Object.keys(node.properties).length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
            Properties
          </summary>
          <div className="mt-2 space-y-1">
            {Object.entries(node.properties)
              .slice(0, 6)
              .map(([key, val]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400 truncate">{String(val)}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Compact Graph Card ───────────────────────────────────────────────────────

export interface GraphStatsCardProps {
  totalEntities: number;
  totalRelationships: number;
  crossDomainLinks: number;
  byDomain?: Record<string, number>;
  className?: string;
}

export function GraphStatsCard({
  totalEntities,
  totalRelationships,
  crossDomainLinks,
  byDomain,
  className = '',
}: GraphStatsCardProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-3">Knowledge Graph</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Entities', value: totalEntities.toLocaleString() },
          { label: 'Relationships', value: totalRelationships.toLocaleString() },
          { label: 'Cross-Domain', value: crossDomainLinks.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      {byDomain && Object.keys(byDomain).length > 0 && (
        <div className="space-y-1.5">
          {Object.entries(byDomain)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([domain, count]) => {
              const max = Math.max(...Object.values(byDomain));
              const pct = Math.round((count / max) * 100);
              return (
                <div key={domain} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getDomainColor(domain) }}
                  />
                  <span className="text-xs text-gray-400 w-20 truncate capitalize">{domain}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getDomainColor(domain),
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
