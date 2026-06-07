import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from './utils';

export interface EntityGraphNode {
  id: string;
  label: string;
  type: string;
  domain: string;
  riskScore: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface EntityGraphEdge {
  source: string;
  target: string;
  type: string;
  strength?: 'weak' | 'moderate' | 'strong';
}

export interface EntityGraphMeta {
  totalNodes: number;
  totalEdges: number;
  domain: string;
  graphStats?: { totalEntities: number; totalRelationships: number };
}

export interface SnapshotInfo {
  id: string;
  label?: string | null;
  snapshotAt: string | Date;
  expiresAt: string | Date;
  retentionDays: number;
  meta?: Record<string, unknown>;
}

export interface APEXEntityGraphProps {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  meta?: EntityGraphMeta;
  accentColor?: string;
  className?: string;
  width?: number;
  height?: number;
  onNodeClick?: (node: EntityGraphNode) => void;
  loading?: boolean;
  filterDomain?: string;
  onFilterDomain?: (domain: string | undefined) => void;
  sinceHours?: number;
  onSinceHoursChange?: (hours: number | undefined) => void;
  minRisk?: number;
  onMinRiskChange?: (minRisk: number) => void;
  viewMode?: 'live' | 'snapshot';
  onViewModeChange?: (mode: 'live' | 'snapshot') => void;
  snapshots?: SnapshotInfo[];
  activeSnapshotId?: string;
  onSnapshotSelect?: (snapshotId: string) => void;
  onSnapshotCapture?: () => void;
  snapshotLoading?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  vessels: '#0ea5e9',
  firestorm: '#ef4444',
  aegis: '#ef4444',
  terra: '#22c55e',
  lyte: '#f59e0b',
  prism: '#a855f7',
  'szl-holdings': '#c9a84c',
  szl: '#c9a84c',
  inca: '#8b5cf6',
  msp: '#6366f1',
};

const TYPE_ICONS: Record<string, string> = {
  person: '◉',
  organization: '⬡',
  vessel: '⚓',
  property: '⬢',
  case: '⚖',
  threat: '⚠',
  signal: '◈',
  asset: '◆',
  port: '⚑',
  jurisdiction: '⊕',
};

interface SimNode extends EntityGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned?: boolean;
}

interface SimEdge {
  source: string;
  target: string;
  type: string;
  strength?: string;
}

function initSimulation(nodes: EntityGraphNode[], width: number, height: number): SimNode[] {
  const cx = width / 2;
  const cy = height / 2;
  return nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.3;
    return {
      ...n,
      x: cx + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
      y: cy + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5),
      vx: 0,
      vy: 0,
      radius: 6 + Math.min((n.riskScore ?? 0) * 8, 12),
    };
  });
}

function tickSimulation(
  simNodes: SimNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  alpha: number,
): void {
  const nodeMap = new Map<string, SimNode>(simNodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const targetLen = edge.strength === 'strong' ? 80 : edge.strength === 'moderate' ? 110 : 150;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = ((dist - targetLen) / dist) * alpha * 0.4;

    if (!src.pinned) {
      src.vx += dx * force;
      src.vy += dy * force;
    }
    if (!tgt.pinned) {
      tgt.vx -= dx * force;
      tgt.vy -= dy * force;
    }
  }

  for (let i = 0; i < simNodes.length; i++) {
    const ni = simNodes[i]!;
    for (let j = i + 1; j < simNodes.length; j++) {
      const nj = simNodes[j]!;
      const dx = nj.x - ni.x;
      const dy = nj.y - ni.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = ni.radius + nj.radius + 30;
      if (dist < minDist) {
        const force = ((minDist - dist) / dist) * alpha * 0.5;
        if (!ni.pinned) {
          ni.vx -= dx * force;
          ni.vy -= dy * force;
        }
        if (!nj.pinned) {
          nj.vx += dx * force;
          nj.vy += dy * force;
        }
      }
    }
  }

  const cx = width / 2;
  const cy = height / 2;
  for (const n of simNodes) {
    if (n.pinned) continue;

    n.vx += (cx - n.x) * 0.01 * alpha;
    n.vy += (cy - n.y) * 0.01 * alpha;

    n.vx *= 0.85;
    n.vy *= 0.85;
    n.x += n.vx;
    n.y += n.vy;

    n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
    n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
  }
}

const ENTITY_TYPES = ['all', 'person', 'organization', 'vessel', 'property', 'case', 'threat'];
const DOMAINS_LIST = ['all', 'vessels', 'firestorm', 'terra', 'prism', 'szl', 'lyte'];

export function APEXEntityGraph({
  nodes,
  edges,
  meta,
  accentColor = '#c9a84c',
  className,
  width: propWidth,
  height: propHeight = 420,
  onNodeClick,
  loading,
  filterDomain,
  onFilterDomain,
  sinceHours,
  onSinceHoursChange,
  minRisk = 0,
  onMinRiskChange,
  viewMode = 'live',
  onViewModeChange,
  snapshots,
  activeSnapshotId,
  onSnapshotSelect,
  onSnapshotCapture,
  snapshotLoading,
}: APEXEntityGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const alphaRef = useRef(1);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [localMinRisk, setLocalMinRisk] = useState(minRisk);
  const [canvasWidth, setCanvasWidth] = useState(propWidth ?? 600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry?.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const W = canvasWidth;
  const H = propHeight;

  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (typeFilter !== 'all') result = result.filter((n) => n.type === typeFilter);
    if (filterDomain && filterDomain !== 'all')
      result = result.filter((n) => n.domain === filterDomain);
    if (localMinRisk > 0) result = result.filter((n) => (n.riskScore ?? 0) >= localMinRisk / 100);
    if (sinceHours) {
      const cutoff = Date.now() - sinceHours * 3600 * 1000;
      result = result.filter((n) => {
        const lastSeen = (n as EntityGraphNode & { lastSeen?: string }).lastSeen;
        if (!lastSeen) return true;
        return new Date(lastSeen).getTime() >= cutoff;
      });
    }
    return result;
  }, [nodes, typeFilter, filterDomain, localMinRisk, sinceHours]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [edges, filteredNodes]);

  useEffect(() => {
    simNodesRef.current = initSimulation(filteredNodes, W, H);
    alphaRef.current = 1;
  }, [filteredNodes, W, H]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const simNodes = simNodesRef.current;
    const nodeMap = new Map<string, SimNode>(simNodes.map((n) => [n.id, n]));

    for (const edge of filteredEdges) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;

      const isHighlighted =
        selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted ? `${accentColor}80` : '#ffffff15';
      ctx.lineWidth = isHighlighted ? 1.5 : 0.8;
      ctx.stroke();
    }

    for (const node of simNodes) {
      const color = DOMAIN_COLORS[node.domain] ?? '#6b7280';
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isNeighbor = selectedNode
        ? filteredEdges.some(
            (e) =>
              (e.source === selectedNode.id && e.target === node.id) ||
              (e.target === selectedNode.id && e.source === node.id),
          )
        : false;

      const opacity = selectedNode && !isSelected && !isNeighbor ? 0.3 : 1;
      const radius = isSelected ? node.radius * 1.4 : isHovered ? node.radius * 1.2 : node.radius;

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${color}25`;
        ctx.fill();
      }

      if (node.riskScore >= 0.7) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}40`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? color : `${color}cc`;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.min(radius, 10)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TYPE_ICONS[node.type] ?? '◆', node.x, node.y);

      if (radius > 8 || isSelected || isHovered) {
        ctx.font = '10px system-ui';
        ctx.fillStyle = isSelected || isHovered ? '#ffffff' : '#ffffffa0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
          node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label,
          node.x,
          node.y + radius + 3,
        );
      }

      ctx.globalAlpha = 1;
    }
  }, [filteredEdges, selectedNode, hoveredNode, accentColor, W, H]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (alphaRef.current > 0.005) {
        tickSimulation(simNodesRef.current, filteredEdges, W, H, alphaRef.current);
        alphaRef.current *= 0.98;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    animFrameRef.current = frame;
    return () => cancelAnimationFrame(frame);
  }, [filteredEdges, draw, W, H]);

  const getNodeAtPoint = useCallback((x: number, y: number): SimNode | null => {
    for (const node of simNodesRef.current) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 4) return node;
    }
    return null;
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAtPoint(x, y);
      setSelectedNode((prev) => (prev?.id === node?.id ? null : (node ?? null)));
      if (node) onNodeClick?.(node);
    },
    [getNodeAtPoint, onNodeClick],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAtPoint(x, y);
      setHoveredNode(node);
      canvas.style.cursor = node ? 'pointer' : 'default';
    },
    [getNodeAtPoint],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div className={cn(className)} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          flexWrap: 'wrap' as const,
        }}
      >
        <div
          style={{
            display: 'flex',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid #ffffff18',
          }}
        >
          {(['live', 'snapshot'] as const).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange?.(mode)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 14px',
                  border: 'none',
                  background: isActive
                    ? mode === 'live'
                      ? '#22c55e20'
                      : '#a78bfa20'
                    : 'transparent',
                  color: isActive ? (mode === 'live' ? '#22c55e' : '#a78bfa') : '#ffffff40',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {mode === 'live' ? '◉ Live' : '◷ Snapshot'}
              </button>
            );
          })}
        </div>

        {viewMode === 'live' && onSnapshotCapture && (
          <button
            onClick={onSnapshotCapture}
            disabled={snapshotLoading}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '4px 11px',
              borderRadius: 5,
              border: '1px solid #ffffff20',
              background: snapshotLoading ? '#ffffff08' : '#ffffff0a',
              color: snapshotLoading ? '#ffffff30' : '#ffffff60',
              cursor: snapshotLoading ? 'default' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {snapshotLoading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    border: '1.5px solid #ffffff30',
                    borderTopColor: '#ffffff80',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    verticalAlign: 'middle',
                    marginRight: 4,
                  }}
                />
                Capturing…
              </>
            ) : '⊕ Capture Snapshot'}
          </button>
        )}

        {viewMode === 'snapshot' && snapshots && snapshots.length > 0 && (
          <select
            value={activeSnapshotId ?? ''}
            onChange={(e) => onSnapshotSelect?.(e.target.value)}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 5,
              border: '1px solid #ffffff20',
              background: '#0d0d0d',
              color: '#ffffff80',
              cursor: 'pointer',
              maxWidth: 260,
            }}
          >
            <option value="" disabled>
              Select snapshot…
            </option>
            {snapshots.map((s) => {
              const d = new Date(s.snapshotAt);
              const label = s.label
                ? s.label
                : d.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
              return (
                <option key={s.id} value={s.id}>
                  {label}
                </option>
              );
            })}
          </select>
        )}

        {viewMode === 'snapshot' && (!snapshots || snapshots.length === 0) && (
          <span style={{ fontSize: 11, color: '#ffffff30', fontStyle: 'italic' }}>
            No snapshots yet — switch to Live and capture one
          </span>
        )}

        {viewMode === 'snapshot' &&
          activeSnapshotId &&
          snapshots &&
          (() => {
            const snap = snapshots.find((s) => s.id === activeSnapshotId);
            if (!snap) return null;
            const expiresAt = new Date(snap.expiresAt);
            return (
              <span style={{ fontSize: 10, color: '#ffffff30', marginLeft: 'auto' }}>
                Expires {expiresAt.toLocaleDateString()}
              </span>
            );
          })()}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
        {DOMAINS_LIST.map((d) => {
          const color = DOMAIN_COLORS[d] ?? '#ffffff';
          const active = (filterDomain ?? 'all') === d;
          return (
            <button
              key={d}
              onClick={() => onFilterDomain?.(d === 'all' ? undefined : d)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 4,
                border: `1px solid ${active ? color : '#ffffff20'}`,
                background: active ? `${color}20` : 'transparent',
                color: active ? color : '#ffffff50',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}
            >
              {d === 'all' ? 'All Domains' : d === 'firestorm' ? 'Aegis' : d.toUpperCase()}
            </button>
          );
        })}
        <div style={{ width: 1, height: 20, background: '#ffffff15', margin: '0 2px' }} />
        {ENTITY_TYPES.slice(0, 5).map((t) => {
          const active = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 4,
                border: `1px solid ${active ? accentColor : '#ffffff20'}`,
                background: active ? `${accentColor}20` : 'transparent',
                color: active ? accentColor : '#ffffff50',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {t === 'all' ? 'All Types' : `${TYPE_ICONS[t] ?? ''} ${t}`}
            </button>
          );
        })}
        <div style={{ width: 1, height: 20, background: '#ffffff15', margin: '0 2px' }} />
        {[
          { label: 'All Time', hours: undefined },
          { label: '24h', hours: 24 },
          { label: '7d', hours: 168 },
          { label: '30d', hours: 720 },
        ].map(({ label, hours }) => {
          const active = (sinceHours ?? undefined) === hours;
          return (
            <button
              key={label}
              onClick={() => onSinceHoursChange?.(hours)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 4,
                border: `1px solid ${active ? '#a78bfa' : '#ffffff20'}`,
                background: active ? '#a78bfa20' : 'transparent',
                color: active ? '#a78bfa' : '#ffffff50',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </button>
          );
        })}
        <div style={{ width: 1, height: 20, background: '#ffffff15', margin: '0 2px' }} />
        {[
          { label: 'Any Risk', value: 0 },
          { label: 'Risk ≥50%', value: 50 },
          { label: 'Risk ≥75%', value: 75 },
        ].map(({ label, value }) => {
          const active = localMinRisk === value;
          return (
            <button
              key={label}
              onClick={() => {
                setLocalMinRisk(value);
                onMinRiskChange?.(value);
              }}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 4,
                border: `1px solid ${active ? '#f97316' : '#ffffff20'}`,
                background: active ? '#f9731620' : 'transparent',
                color: active ? '#f97316' : '#ffffff50',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #ffffff12',
          background: '#0a0a0a',
        }}
      >
        {loading ? (
          <div
            style={{
              height: H,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: `2px solid ${accentColor}40`,
                borderTopColor: accentColor,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontSize: 13, color: '#ffffff40' }}>Loading entity graph…</p>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div
            style={{
              height: H,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 28 }}>◈</p>
            <p style={{ margin: 0, fontSize: 13, color: '#ffffff40' }}>
              No entities found for the selected filters
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ display: 'block', width: '100%', height: H }}
          />
        )}

        {meta && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              display: 'flex',
              gap: 10,
              fontSize: 10,
              color: '#ffffff40',
              fontFamily: 'monospace',
            }}
          >
            <span>{filteredNodes.length} nodes</span>
            <span>·</span>
            <span>{filteredEdges.length} edges</span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 3,
          }}
        >
          {Object.entries(DOMAIN_COLORS)
            .filter(([d]) => filteredNodes.some((n) => n.domain === d))
            .slice(0, 6)
            .map(([d, c]) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }}
                />
                <span style={{ fontSize: 10, color: '#ffffff60', fontFamily: 'system-ui' }}>
                  {d === 'firestorm' ? 'Aegis' : d === 'szl-holdings' ? 'Portfolio' : d}
                </span>
              </div>
            ))}
        </div>
      </div>

      {selectedNode && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: '#ffffff06',
            border: `1px solid ${DOMAIN_COLORS[selectedNode.domain] ?? '#ffffff20'}`,
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{TYPE_ICONS[selectedNode.type] ?? '◆'}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                {selectedNode.label}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#ffffff60' }}>
                {selectedNode.type} · {selectedNode.domain}
              </p>
            </div>
            {selectedNode.riskScore > 0 && (
              <div style={{ marginLeft: 'auto' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: selectedNode.riskScore >= 0.7 ? '#ef444420' : '#f59e0b20',
                    color: selectedNode.riskScore >= 0.7 ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${selectedNode.riskScore >= 0.7 ? '#ef444440' : '#f59e0b40'}`,
                  }}
                >
                  Risk: {Math.round(selectedNode.riskScore * 100)}%
                </span>
              </div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#ffffff50' }}>
            Connected to{' '}
            {
              filteredEdges.filter(
                (e) => e.source === selectedNode.id || e.target === selectedNode.id,
              ).length
            }{' '}
            entities in this view. Click another node or click again to deselect.
          </p>
          {selectedNode.tags && selectedNode.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginTop: 6 }}>
              {selectedNode.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: '#ffffff08',
                    color: '#ffffff60',
                    border: '1px solid #ffffff15',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
