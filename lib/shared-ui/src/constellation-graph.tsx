import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { apiFetch } from "./api-fetch";
import { cn } from "./utils";

/**
 * ConstellationGraph — visual relationship map for the GET /domains/:domain/graph endpoint.
 *
 * Renders nodes and edges from the Constellation entity model with cross-domain edges
 * visually distinct (dashed amber lines vs. solid same-domain lines). Clicking a node
 * shows entity details and provides a deep-link to the owning domain app.
 */

export interface ConstellationGraphNode {
  id: string;
  canonicalId?: string | null;
  entityType: string;
  name: string;
  description?: string | null;
  labels?: string[] | null;
  confidence?: number | null;
  sensitivityTier?: string | null;
  isActive?: boolean;
  freshness?: string | null;
  extensions?: Record<string, unknown> | null;
  domain?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConstellationGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: string;
  confidence?: number | null;
  active?: boolean;
}

export interface ConstellationGraphStats {
  nodeCount: number;
  edgeCount: number;
  crossDomainEdgeCount: number;
  internalEdgeCount: number;
}

export interface ConstellationGraphResponse {
  domain: string;
  nodes: ConstellationGraphNode[];
  edges: ConstellationGraphEdge[];
  stats: ConstellationGraphStats;
}

/** Public preview path for each known domain. */
const DOMAIN_BASE_PATH: Record<string, string> = {
  terra: "/terra",
  vessels: "/vessels",
  aegis: "/aegis",
  prism: "/aegis", // Prism Counsel currently surfaces inside Aegis Command
  lyte: "/aegis",
  imperium: "/command",
  "carlota-jo": "/carlota-jo",
  platform: "/",
};

const DOMAIN_LABEL: Record<string, string> = {
  terra: "Terra",
  vessels: "Vessels",
  aegis: "Aegis",
  prism: "Prism Counsel",
  lyte: "Lyte",
  imperium: "Command",
  "carlota-jo": "Carlota Jo",
  platform: "Platform",
};

const DOMAIN_COLORS: Record<string, string> = {
  terra: "#22c55e",
  vessels: "#0ea5e9",
  aegis: "#ef4444",
  prism: "#a855f7",
  lyte: "#f59e0b",
  imperium: "#c9a84c",
  "carlota-jo": "#ec4899",
  platform: "#94a3b8",
};

const TYPE_GLYPH: Record<string, string> = {
  person: "◉",
  organization: "⬡",
  vessel: "⚓",
  property: "⬢",
  case: "⚖",
  threat: "⚠",
  signal: "◈",
  asset: "◆",
  port: "⚑",
  jurisdiction: "⊕",
  document: "▤",
  agent: "✦",
};

interface SimNode {
  id: string;
  ref: ConstellationGraphNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function initSim(nodes: ConstellationGraphNode[], w: number, h: number): SimNode[] {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  return nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const jitter = 0.6 + Math.random() * 0.5;
    return {
      id: n.id,
      ref: n,
      x: cx + Math.cos(angle) * r * jitter,
      y: cy + Math.sin(angle) * r * jitter,
      vx: 0,
      vy: 0,
      radius: 9 + Math.min((n.confidence ?? 0.5) * 8, 8),
    };
  });
}

function tickSim(
  sim: SimNode[],
  edges: ConstellationGraphEdge[],
  w: number,
  h: number,
  alpha: number,
): void {
  const map = new Map(sim.map((n) => [n.id, n] as const));
  for (const e of edges) {
    const a = map.get(e.fromNodeId);
    const b = map.get(e.toNodeId);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const target = 110;
    const f = ((d - target) / d) * alpha * 0.35;
    a.vx += dx * f;
    a.vy += dy * f;
    b.vx -= dx * f;
    b.vy -= dy * f;
  }
  for (let i = 0; i < sim.length; i++) {
    const a = sim[i];
    for (let j = i + 1; j < sim.length; j++) {
      const b = sim[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const min = a.radius + b.radius + 28;
      if (d < min) {
        const f = ((min - d) / d) * alpha * 0.5;
        a.vx -= dx * f;
        a.vy -= dy * f;
        b.vx += dx * f;
        b.vy += dy * f;
      }
    }
  }
  const cx = w / 2;
  const cy = h / 2;
  for (const n of sim) {
    n.vx += (cx - n.x) * 0.012 * alpha;
    n.vy += (cy - n.y) * 0.012 * alpha;
    n.vx *= 0.82;
    n.vy *= 0.82;
    n.x += n.vx;
    n.y += n.vy;
    n.x = Math.max(n.radius + 8, Math.min(w - n.radius - 8, n.x));
    n.y = Math.max(n.radius + 8, Math.min(h - n.radius - 8, n.y));
  }
}

export interface ConstellationGraphProps {
  /** Domain to fetch via /api/domains/:domain/graph. Ignored if `data` provided. */
  domain?: string;
  /** Pre-fetched graph data (overrides `domain` fetch). */
  data?: ConstellationGraphResponse;
  /** Visual accent for the host domain. */
  accentColor?: string;
  /** Override base paths for each domain (for navigation on node click). */
  domainBasePaths?: Record<string, string>;
  /** Custom click handler — when provided, default navigation is suppressed. */
  onNodeClick?: (node: ConstellationGraphNode) => void;
  /** Render height in px. Width fills the container. */
  height?: number;
  /** Optional class name for the root wrapper. */
  className?: string;
  /** Optional title shown in the header. */
  title?: string;
  /** Show extra controls (refresh / cross-domain toggle). */
  showControls?: boolean;
}

export function ConstellationGraph({
  domain,
  data,
  accentColor = "#c9a84c",
  domainBasePaths,
  onNodeClick,
  height = 460,
  className,
  title,
  showControls = true,
}: ConstellationGraphProps) {
  const [fetched, setFetched] = useState<ConstellationGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCross, setShowCross] = useState(true);
  const [selected, setSelected] = useState<ConstellationGraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [width, setWidth] = useState(640);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<SimNode[]>([]);
  const alphaRef = useRef(1);
  const [, force] = useState(0);
  const reload = useRef(0);

  const refresh = useCallback(() => {
    reload.current += 1;
    force((x) => x + 1);
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fetch graph when domain changes (or refresh requested)
  useEffect(() => {
    if (data || !domain) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `/domains/${encodeURIComponent(domain)}/graph?includeCross=${showCross}&limit=120`;
    apiFetch<{ data?: ConstellationGraphResponse } | ConstellationGraphResponse>(url)
      .then((res) => {
        if (cancelled) return;
        // sendSuccess wraps payloads in { data, ... } — handle either shape
        const payload = (res as { data?: ConstellationGraphResponse }).data ?? (res as ConstellationGraphResponse);
        setFetched(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load Constellation graph");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [domain, data, showCross, reload.current]);

  const graph = data ?? fetched;
  const hostDomain = graph?.domain ?? domain ?? "platform";

  // Cache of enriched cross-domain entities (id -> full node), filled lazily
  const [externalCache, setExternalCache] = useState<Record<string, ConstellationGraphNode>>({});

  // Resolve which nodes are inside vs. outside the host domain
  const { nodes, edges, internalIds, externalIds } = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], internalIds: new Set<string>(), externalIds: new Set<string>() };
    }
    const internal = new Set(graph.nodes.map((n) => n.id));
    // External nodes referenced by edges but not in the node list
    const external = new Set<string>();
    for (const e of graph.edges) {
      if (!internal.has(e.fromNodeId)) external.add(e.fromNodeId);
      if (!internal.has(e.toNodeId)) external.add(e.toNodeId);
    }
    const allNodes: ConstellationGraphNode[] = [
      // Preserve any existing domain on the node; default to host domain only
      // when the API didn't supply one (current /domains/:domain/graph contract).
      ...graph.nodes.map((n) => ({ ...n, domain: n.domain ?? hostDomain })),
      ...Array.from(external).map<ConstellationGraphNode>((id) => {
        const cached = externalCache[id];
        if (cached) return cached;
        return {
          id,
          entityType: "external",
          name: "Cross-domain entity",
          domain: undefined, // unknown until enriched — disables navigation until then
        };
      }),
    ];
    const visibleEdges = showCross
      ? graph.edges
      : graph.edges.filter((e) => internal.has(e.fromNodeId) && internal.has(e.toNodeId));
    return { nodes: allNodes, edges: visibleEdges, internalIds: internal, externalIds: external };
  }, [graph, hostDomain, showCross, externalCache]);

  // Lazily enrich cross-domain placeholder nodes via /graph/entities/:id so we
  // can show real names/types and resolve their owning domain for navigation.
  useEffect(() => {
    if (!graph) return;
    const missing = Array.from(externalIds).filter((id) => !externalCache[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    // Cap concurrency to avoid storming the API for huge graphs
    const toFetch = missing.slice(0, 40);
    Promise.all(
      toFetch.map((id) =>
        apiFetch<{ data?: { node: ConstellationGraphNode } } | { node: ConstellationGraphNode }>(
          `/graph/entities/${encodeURIComponent(id)}`,
        )
          .then((res) => {
            const payload =
              (res as { data?: { node: ConstellationGraphNode } }).data ??
              (res as { node: ConstellationGraphNode });
            return payload?.node ? { id, node: payload.node } : null;
          })
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, ConstellationGraphNode> = {};
      for (const r of results) {
        if (r) next[r.id] = r.node;
      }
      if (Object.keys(next).length > 0) {
        setExternalCache((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [graph, externalIds, externalCache]);

  const W = Math.max(width, 320);
  const H = height;

  // Init simulation when nodes change
  useEffect(() => {
    simRef.current = initSim(nodes, W, H);
    alphaRef.current = 1;
  }, [nodes, W, H]);

  // Run animation loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (alphaRef.current > 0.01) {
        tickSim(simRef.current, edges, W, H, alphaRef.current);
        alphaRef.current *= 0.985;
      }
      force((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [edges, W, H]);

  const nodeMap = useMemo(() => new Map(simRef.current.map((s) => [s.id, s])), [simRef.current.length, nodes]);

  const navigateToOwner = useCallback(
    (node: ConstellationGraphNode) => {
      if (!node.domain) return; // unknown owner — wait for enrichment
      const paths = { ...DOMAIN_BASE_PATH, ...(domainBasePaths ?? {}) };
      const base = paths[node.domain] ?? `/${node.domain}`;
      // Drop existing artifact base path and route to the target domain root
      window.location.href = `${base.replace(/\/$/, "")}/`;
    },
    [domainBasePaths],
  );

  const handleNode = useCallback(
    (n: ConstellationGraphNode) => {
      // First click: select & show details. Second click on the already-selected
      // node: navigate to the owning app. Custom onNodeClick suppresses default.
      if (onNodeClick) {
        setSelected(n);
        onNodeClick(n);
        return;
      }
      if (selected?.id === n.id && n.domain) {
        navigateToOwner(n);
      } else {
        setSelected(n);
      }
    },
    [onNodeClick, selected, navigateToOwner],
  );

  const handleNodeDoubleClick = useCallback(
    (n: ConstellationGraphNode) => {
      if (n.domain) navigateToOwner(n);
    },
    [navigateToOwner],
  );

  const stats = graph?.stats;

  return (
    <div
      className={cn(className)}
      style={{ fontFamily: "system-ui, sans-serif", color: "#e8edf8" }}
      data-testid="constellation-graph"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor }}>
            {title ?? "Constellation Graph"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {DOMAIN_LABEL[hostDomain] ?? hostDomain} · entity relationship map
          </div>
        </div>
        {showControls && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showCross}
                onChange={(e) => setShowCross(e.target.checked)}
                style={{ accentColor }}
              />
              Show cross-domain edges
            </label>
            {!data && (
              <button
                onClick={refresh}
                style={{
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: `1px solid ${accentColor}40`,
                  background: `${accentColor}10`,
                  color: accentColor,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
                data-testid="constellation-refresh"
              >
                Refresh
              </button>
            )}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, #060912 0%, #0a0f1c 100%)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${accentColor}30`,
                borderTopColor: accentColor,
                animation: "constellation-spin 0.8s linear infinite",
              }}
            />
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Loading Constellation…</div>
          </div>
        ) : error ? (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: 20 }}>
            <div style={{ fontSize: 22, color: "#ef4444" }}>⚠</div>
            <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>
            <button
              onClick={refresh}
              style={{
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 4,
                border: `1px solid ${accentColor}40`,
                background: "transparent",
                color: accentColor,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 28 }}>◈</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>No entities in this Constellation subgraph yet.</div>
          </div>
        ) : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
            <defs>
              <marker id="arrow-internal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={accentColor} opacity="0.55" />
              </marker>
              <marker id="arrow-cross" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" opacity="0.85" />
              </marker>
            </defs>
            {edges.map((e) => {
              const a = simRef.current.find((n) => n.id === e.fromNodeId);
              const b = simRef.current.find((n) => n.id === e.toNodeId);
              if (!a || !b) return null;
              const isCross = !internalIds.has(e.fromNodeId) || !internalIds.has(e.toNodeId);
              const highlight =
                selected && (e.fromNodeId === selected.id || e.toNodeId === selected.id);
              const dim = selected && !highlight;
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isCross ? "#fbbf24" : accentColor}
                  strokeWidth={highlight ? 2 : isCross ? 1.4 : 1}
                  strokeOpacity={dim ? 0.12 : isCross ? 0.7 : 0.45}
                  strokeDasharray={isCross ? "6 4" : undefined}
                  markerEnd={isCross ? "url(#arrow-cross)" : "url(#arrow-internal)"}
                >
                  <title>
                    {e.relationshipType}
                    {isCross ? "  (cross-domain)" : ""}
                  </title>
                </line>
              );
            })}
            {simRef.current.map((s) => {
              const n = s.ref;
              const color = DOMAIN_COLORS[n.domain ?? hostDomain] ?? "#94a3b8";
              const isExternal = n.domain === "external" || externalIds.has(n.id);
              const isSelected = selected?.id === n.id;
              const isHovered = hovered === n.id;
              const isNeighbor =
                selected && edges.some(
                  (e) =>
                    (e.fromNodeId === selected.id && e.toNodeId === n.id) ||
                    (e.toNodeId === selected.id && e.fromNodeId === n.id),
                );
              const dim = selected && !isSelected && !isNeighbor;
              const r = isSelected ? s.radius * 1.4 : isHovered ? s.radius * 1.2 : s.radius;
              return (
                <g
                  key={n.id}
                  transform={`translate(${s.x},${s.y})`}
                  style={{ cursor: "pointer", opacity: dim ? 0.3 : 1, transition: "opacity 120ms" }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNode(n);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleNodeDoubleClick(n);
                  }}
                  data-testid={`constellation-node-${n.id}`}
                >
                  {(isSelected || isHovered) && (
                    <circle r={r + 5} fill={color} fillOpacity={0.18} />
                  )}
                  <circle
                    r={r}
                    fill={isExternal ? "#1e293b" : color}
                    fillOpacity={isExternal ? 0.85 : 0.85}
                    stroke={isExternal ? "#fbbf24" : color}
                    strokeWidth={isExternal ? 1.5 : 0}
                    strokeDasharray={isExternal ? "3 2" : undefined}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={Math.min(r, 11)}
                    style={{ pointerEvents: "none" }}
                  >
                    {TYPE_GLYPH[n.entityType] ?? "◆"}
                  </text>
                  {(r > 9 || isSelected || isHovered) && (
                    <text
                      y={r + 11}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? "#ffffff" : "#94a3b8"}
                      fontSize={10}
                      style={{ pointerEvents: "none" }}
                    >
                      {(n.name ?? n.id).slice(0, 18)}
                      {(n.name ?? n.id).length > 18 ? "…" : ""}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "rgba(10,15,28,0.7)",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="22" height="6">
              <line x1="0" y1="3" x2="22" y2="3" stroke={accentColor} strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: 10, color: "#cbd5e1" }}>Internal edge</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="22" height="6">
              <line x1="0" y1="3" x2="22" y2="3" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
            </svg>
            <span style={{ fontSize: 10, color: "#cbd5e1" }}>Cross-domain</span>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 12,
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "monospace",
              display: "flex",
              gap: 12,
            }}
          >
            <span>{stats.nodeCount} nodes</span>
            <span>·</span>
            <span>{stats.internalEdgeCount} internal</span>
            <span>·</span>
            <span style={{ color: "#fbbf24" }}>{stats.crossDomainEdgeCount} cross-domain</span>
          </div>
        )}
      </div>

      {/* Details panel */}
      {selected && (
        <div
          style={{
            marginTop: 10,
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${DOMAIN_COLORS[selected.domain ?? hostDomain] ?? "rgba(255,255,255,0.12)"}`,
          }}
          data-testid="constellation-details"
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ fontSize: 18, lineHeight: 1 }}>{TYPE_GLYPH[selected.entityType] ?? "◆"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {selected.entityType}
                {selected.domain ? ` · ${DOMAIN_LABEL[selected.domain] ?? selected.domain}` : ""}
                {selected.canonicalId ? ` · ${selected.canonicalId}` : ""}
              </div>
              {selected.description && (
                <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>{selected.description}</div>
              )}
              {selected.labels && selected.labels.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {selected.labels.map((l) => (
                    <span
                      key={l}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.06)",
                        color: "#cbd5e1",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              {selected.confidence !== null && selected.confidence !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.05)",
                    color: "#cbd5e1",
                  }}
                >
                  conf {Math.round((selected.confidence ?? 0) * 100)}%
                </span>
              )}
              <button
                onClick={() => navigateToOwner(selected)}
                disabled={!selected.domain}
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 4,
                  border: `1px solid ${selected.domain ? accentColor : "rgba(255,255,255,0.15)"}`,
                  background: selected.domain ? `${accentColor}20` : "rgba(255,255,255,0.04)",
                  color: selected.domain ? accentColor : "#64748b",
                  cursor: selected.domain ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
                data-testid="constellation-open-owner"
              >
                {selected.domain
                  ? `Open in ${DOMAIN_LABEL[selected.domain] ?? selected.domain} →`
                  : "Resolving owner…"}
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes constellation-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
