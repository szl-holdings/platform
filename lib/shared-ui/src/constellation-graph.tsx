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
  /** Total internal edges across the whole domain (ignores limit/offset). */
  totalInternalEdgeCount?: number;
  /** Total cross-domain edges across the whole domain (ignores limit/offset). */
  totalCrossDomainEdgeCount?: number;
  /** Total edges across the whole domain (ignores limit/offset). */
  totalEdgeCount?: number;
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

/** Hop-distance ring colors used during a multi-hop trace. Index = hops from origin. */
const DISTANCE_COLORS: string[] = [
  "#ffffff", // 0 — origin
  "#22d3ee", // 1 hop
  "#a855f7", // 2 hops
  "#f59e0b", // 3 hops
  "#ef4444", // 4+ hops
];

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

function initSim(
  nodes: ConstellationGraphNode[],
  w: number,
  h: number,
  prev?: SimNode[],
): SimNode[] {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  // Preserve positions of nodes that were already in the simulation so newly
  // added neighbors ease into place around them rather than the whole graph
  // re-shuffling.
  const prevById = new Map((prev ?? []).map((p) => [p.id, p] as const));
  return nodes.map((n, i) => {
    const radius = 9 + Math.min((n.confidence ?? 0.5) * 8, 8);
    const existing = prevById.get(n.id);
    if (existing) {
      return { ...existing, ref: n, radius };
    }
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const jitter = 0.6 + Math.random() * 0.5;
    return {
      id: n.id,
      ref: n,
      x: cx + Math.cos(angle) * r * jitter,
      y: cy + Math.sin(angle) * r * jitter,
      vx: 0,
      vy: 0,
      radius,
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

function FilterChip({
  label,
  active,
  onClick,
  accentColor,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accentColor: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      data-active={active ? "true" : "false"}
      style={{
        fontSize: 10,
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${active ? accentColor : "rgba(255,255,255,0.12)"}`,
        background: active ? `${accentColor}25` : "rgba(255,255,255,0.03)",
        color: active ? accentColor : "#cbd5e1",
        cursor: "pointer",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontWeight: active ? 600 : 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
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
  const [extraPages, setExtraPages] = useState<ConstellationGraphResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCross, setShowCross] = useState(true);
  const [selected, setSelected] = useState<ConstellationGraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [width, setWidth] = useState(640);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [sinceWindow, setSinceWindow] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [seenTypes, setSeenTypes] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(120);
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
    setLoadMoreError(null);
    const params = new URLSearchParams();
    params.set("includeCross", String(showCross));
    params.set("limit", String(pageSize));
    params.set("offset", "0");
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    // Only constrain when "Active only" is on. When off the user wants to see
    // all statuses, so we omit the param (server returns inactive-only when
    // isActive=false is sent).
    if (activeOnly) params.set("isActive", "true");
    const url = `/domains/${encodeURIComponent(domain)}/graph?${params.toString()}`;
    apiFetch<{ data?: ConstellationGraphResponse } | ConstellationGraphResponse>(url)
      .then((res) => {
        if (cancelled) return;
        // sendSuccess wraps payloads in { data, ... } — handle either shape
        const payload = (res as { data?: ConstellationGraphResponse }).data ?? (res as ConstellationGraphResponse);
        setFetched(payload);
        // Reset any accumulated additional pages whenever a new first page
        // arrives — filter/page-size changes start the pagination over.
        setExtraPages([]);
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
  }, [domain, data, showCross, entityTypeFilter, activeOnly, pageSize, reload.current]);

  // Merge the first-page payload with any additional pages loaded via the
  // "Load more" control so the canvas keeps growing as the operator pages
  // through large domains. Stats from the first page reflect the *total* node
  // count (server runs count(*) ignoring limit/offset), so we keep them.
  const graph = useMemo<ConstellationGraphResponse | null>(() => {
    if (data) return data;
    if (!fetched) return null;
    if (extraPages.length === 0) return fetched;
    const nodeMap = new Map<string, ConstellationGraphNode>();
    for (const n of fetched.nodes) nodeMap.set(n.id, n);
    const edgeMap = new Map<string, ConstellationGraphEdge>();
    for (const e of fetched.edges) edgeMap.set(e.id, e);
    for (const page of extraPages) {
      for (const n of page.nodes) nodeMap.set(n.id, n);
      for (const e of page.edges) edgeMap.set(e.id, e);
    }
    // Recompute cross/internal edge counts from the deduped merged edge set so
    // edges that show up in multiple pages (because the API returns edges
    // touching that page's nodeIds) aren't double-counted. An edge is internal
    // when both endpoints belong to the host domain's loaded node set.
    const mergedEdges = Array.from(edgeMap.values());
    const hostInternalIds = new Set<string>();
    for (const n of nodeMap.values()) {
      // Nodes returned by /domains/:domain/graph have no `domain` field set
      // (the server omits it because it's implied), so missing domain ===
      // host-domain. Cross-domain neighbors loaded via expand always carry an
      // explicit non-host domain.
      if (!n.domain || n.domain === fetched.domain) hostInternalIds.add(n.id);
    }
    let crossDomainEdgeCount = 0;
    let internalEdgeCount = 0;
    for (const e of mergedEdges) {
      const fromInternal = hostInternalIds.has(e.fromNodeId);
      const toInternal = hostInternalIds.has(e.toNodeId);
      if (fromInternal && toInternal) internalEdgeCount += 1;
      else crossDomainEdgeCount += 1;
    }
    return {
      ...fetched,
      nodes: Array.from(nodeMap.values()),
      edges: mergedEdges,
      stats: {
        // First page returns the true total node count via count(*) — keep it.
        nodeCount: fetched.stats.nodeCount,
        edgeCount: mergedEdges.length,
        crossDomainEdgeCount,
        internalEdgeCount,
      },
    };
  }, [data, fetched, extraPages]);
  const hostDomain = graph?.domain ?? domain ?? "platform";

  // Number of nodes the operator has actually loaded onto the canvas (sum of
  // unique nodes from the first page + every "Load more" page that succeeded).
  const loadedNodeCount = useMemo(() => {
    if (data) return data.nodes.length;
    if (!fetched) return 0;
    if (extraPages.length === 0) return fetched.nodes.length;
    const seen = new Set<string>();
    for (const n of fetched.nodes) seen.add(n.id);
    for (const page of extraPages) for (const n of page.nodes) seen.add(n.id);
    return seen.size;
  }, [data, fetched, extraPages]);

  const totalNodeCount = graph?.stats.nodeCount ?? 0;
  const hasMore = !data && fetched !== null && loadedNodeCount < totalNodeCount;

  const loadMore = useCallback(() => {
    if (!domain || data || !fetched || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    const params = new URLSearchParams();
    params.set("includeCross", String(showCross));
    params.set("limit", String(pageSize));
    params.set("offset", String(loadedNodeCount));
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    if (activeOnly) params.set("isActive", "true");
    const url = `/domains/${encodeURIComponent(domain)}/graph?${params.toString()}`;
    apiFetch<{ data?: ConstellationGraphResponse } | ConstellationGraphResponse>(url)
      .then((res) => {
        const payload = (res as { data?: ConstellationGraphResponse }).data ?? (res as ConstellationGraphResponse);
        setExtraPages((prev) => [...prev, payload]);
        // Re-energize the simulation so freshly-loaded nodes ease into place
        alphaRef.current = 1;
      })
      .catch((err) => {
        setLoadMoreError((err as Error)?.message ?? "Failed to load more entities");
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [
    domain,
    data,
    fetched,
    loadingMore,
    hasMore,
    showCross,
    pageSize,
    loadedNodeCount,
    entityTypeFilter,
    activeOnly,
  ]);

  // Cache of enriched cross-domain entities (id -> full node), filled lazily
  const [externalCache, setExternalCache] = useState<Record<string, ConstellationGraphNode>>({});

  // Operator-driven "expand neighbor" additions: merged into the rendered graph
  // whenever a node is expanded via the detail panel.
  const [expandedNodes, setExpandedNodes] = useState<Record<string, ConstellationGraphNode>>({});
  const [expandedEdges, setExpandedEdges] = useState<Record<string, ConstellationGraphEdge>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [expanding, setExpanding] = useState<string | null>(null);
  const [expandError, setExpandError] = useState<string | null>(null);
  // Remember the node that failed so the Retry button can re-issue the same
  // request even if the operator briefly clicks elsewhere in the panel.
  const expandErrorNodeRef = useRef<ConstellationGraphNode | null>(null);
  const [expandLimit, setExpandLimit] = useState<25 | 50 | 100 | 200>(25);

  // Multi-hop trace state. `traceOriginId` anchors the distance scale visible
  // on the canvas; `traceDistances` maps node id -> shortest hop count from
  // that origin. `traceDepth` is the user's chosen radius for the next trace.
  const [traceDepth, setTraceDepth] = useState(2);
  const [traceOriginId, setTraceOriginId] = useState<string | null>(null);
  const [traceDistances, setTraceDistances] = useState<Record<string, number>>({});
  const [traceTruncated, setTraceTruncated] = useState(false);

  // Reset operator expansions whenever the host graph changes (new domain or
  // refreshed payload) so fragments from a previous view never leak into the
  // next one.
  const graphKey = data ? "__data__" : `${domain ?? ""}#${reload.current}`;
  useEffect(() => {
    setExpandedNodes({});
    setExpandedEdges({});
    setExpandedIds(new Set());
    setExpanding(null);
    setExpandError(null);
    setSelected(null);
    setTraceOriginId(null);
    setTraceDistances({});
    setTraceTruncated(false);
  }, [graphKey]);

  // Compute the cutoff time for the freshness window filter
  const sinceCutoff = useMemo(() => {
    if (sinceWindow === "all") return null;
    const ms =
      sinceWindow === "24h" ? 24 * 60 * 60 * 1000
      : sinceWindow === "7d" ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    return Date.now() - ms;
  }, [sinceWindow]);

  // Resolve which nodes are inside vs. outside the host domain
  const { nodes, edges, internalIds, externalIds } = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], internalIds: new Set<string>(), externalIds: new Set<string>() };
    }
    // Original (pre-since-filter) internal IDs — used to identify which edge
    // endpoints are truly external vs. just filtered out by the freshness
    // window. Without this distinction, filtered-out internal nodes would be
    // re-added as "external" placeholders.
    const originalInternal = new Set(graph.nodes.map((n) => n.id));
    // Apply client-side "since" freshness filter to internal nodes
    const filteredInternal = sinceCutoff === null
      ? graph.nodes
      : graph.nodes.filter((n) => {
          const f = n.freshness ?? n.updatedAt;
          if (!f) return true; // keep nodes without a freshness timestamp
          const t = Date.parse(f);
          return Number.isNaN(t) ? true : t >= sinceCutoff;
        });
    const internal = new Set(filteredInternal.map((n) => n.id));

    // Merge edges: API-supplied + operator-expanded (deduped by id)
    const allEdgesMap = new Map<string, ConstellationGraphEdge>();
    for (const e of graph.edges) allEdgesMap.set(e.id, e);
    for (const e of Object.values(expandedEdges)) allEdgesMap.set(e.id, e);
    const allEdges = Array.from(allEdgesMap.values());

    // Drop edges that reference an internal node hidden by the freshness
    // filter — without this they'd be re-introduced as external placeholders.
    const expandedNodeIds = new Set(Object.keys(expandedNodes));
    const sinceVisibleEdges = allEdges.filter((e) => {
      const fromHidden =
        originalInternal.has(e.fromNodeId) && !internal.has(e.fromNodeId);
      const toHidden =
        originalInternal.has(e.toNodeId) && !internal.has(e.toNodeId);
      return !fromHidden && !toHidden;
    });

    // Known node ids from the (filtered) graph payload + any nodes the
    // operator has loaded via expand-neighbors.
    const knownIds = new Set<string>(internal);
    for (const id of expandedNodeIds) knownIds.add(id);

    // External nodes referenced by visible edges but not in any known node list
    const external = new Set<string>();
    for (const e of sinceVisibleEdges) {
      if (!knownIds.has(e.fromNodeId)) external.add(e.fromNodeId);
      if (!knownIds.has(e.toNodeId)) external.add(e.toNodeId);
    }

    const allNodes: ConstellationGraphNode[] = [
      // Preserve any existing domain on the node; default to host domain only
      // when the API didn't supply one (current /domains/:domain/graph contract).
      ...filteredInternal.map((n) => ({ ...n, domain: n.domain ?? hostDomain })),
      // Operator-expanded neighbors (any domain) — skip ones already shown as
      // visible internal nodes.
      ...Object.values(expandedNodes).filter((n) => !internal.has(n.id)),
      // Remaining placeholders for unresolved cross-domain references
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
      ? sinceVisibleEdges
      : sinceVisibleEdges.filter(
          (e) => internal.has(e.fromNodeId) && internal.has(e.toNodeId),
        );
    return { nodes: allNodes, edges: visibleEdges, internalIds: internal, externalIds: external };
  }, [graph, hostDomain, showCross, externalCache, sinceCutoff, expandedNodes, expandedEdges]);

  // Track entity types we've seen so the type chips remain stable when a type
  // filter is active (which would otherwise reduce the chip set).
  useEffect(() => {
    if (!graph) return;
    const fresh = new Set<string>();
    for (const n of graph.nodes) fresh.add(n.entityType);
    setSeenTypes((prev) => {
      const merged = new Set(prev);
      let changed = false;
      for (const t of fresh) {
        if (!merged.has(t)) {
          merged.add(t);
          changed = true;
        }
      }
      return changed ? Array.from(merged).sort() : prev;
    });
  }, [graph]);

  // Search highlighting — case-insensitive match on name or canonicalId
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const matches = new Set<string>();
    for (const n of nodes) {
      const name = (n.name ?? "").toLowerCase();
      const cid = (n.canonicalId ?? "").toLowerCase();
      if (name.includes(q) || cid.includes(q) || n.id.toLowerCase().includes(q)) {
        matches.add(n.id);
      }
    }
    return matches;
  }, [nodes, searchQuery]);

  const expandNeighbors = useCallback(
    async (node: ConstellationGraphNode) => {
      if (!node?.id || expanding === node.id) return;
      setExpanding(node.id);
      setExpandError(null);
      expandErrorNodeRef.current = null;
      try {
        const res = await apiFetch<
          | { data?: { node: ConstellationGraphNode; neighbors: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] } }
          | { node: ConstellationGraphNode; neighbors: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] }
        >(`/graph/entities/${encodeURIComponent(node.id)}/neighbors?limit=${expandLimit}`);
        const payload =
          (res as { data?: { node: ConstellationGraphNode; neighbors: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] } }).data ??
          (res as { node: ConstellationGraphNode; neighbors: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] });
        if (!payload?.node) throw new Error("Empty response");
        // Merge the canonical node itself (so placeholders get real data) and its neighbors.
        setExpandedNodes((prev) => {
          const next = { ...prev, [payload.node.id]: payload.node };
          for (const n of payload.neighbors ?? []) next[n.id] = n;
          return next;
        });
        setExpandedEdges((prev) => {
          const next = { ...prev };
          for (const e of payload.edges ?? []) next[e.id] = e;
          return next;
        });
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(node.id);
          return next;
        });
        // Keep the selected node in sync with the freshly-loaded canonical entity
        setSelected((prev) => (prev?.id === payload.node.id ? payload.node : prev));
        // Re-energize the simulation so new nodes ease into place
        alphaRef.current = 1;
      } catch (err) {
        expandErrorNodeRef.current = node;
        setExpandError((err as Error)?.message ?? "Failed to expand neighbors");
      } finally {
        setExpanding((cur) => (cur === node.id ? null : cur));
      }
    },
    [expanding, expandLimit],
  );

  // Build a portable bundle of the currently-traced subgraph: every node that
  // has a hop distance from the trace origin, every edge whose endpoints are
  // both in that set, plus origin metadata so the file is self-describing.
  const buildTraceBundle = useCallback(() => {
    if (!traceOriginId) return null;
    const traceNodeIds = new Set(Object.keys(traceDistances));
    if (!traceNodeIds.has(traceOriginId)) traceNodeIds.add(traceOriginId);
    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
    const origin = nodeById.get(traceOriginId) ?? null;
    const traceNodes = Array.from(traceNodeIds)
      .map((id) => {
        const node = nodeById.get(id);
        if (!node) return null;
        return {
          id: node.id,
          canonicalId: node.canonicalId ?? null,
          entityType: node.entityType,
          name: node.name,
          domain: node.domain ?? hostDomain,
          hopDistance: traceDistances[id] ?? (id === traceOriginId ? 0 : null),
          confidence: node.confidence ?? null,
          sensitivityTier: node.sensitivityTier ?? null,
          isActive: node.isActive ?? null,
          freshness: node.freshness ?? null,
          description: node.description ?? null,
          labels: node.labels ?? [],
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .sort((a, b) => (a.hopDistance ?? 99) - (b.hopDistance ?? 99));
    const traceEdges = edges
      .filter((e) => traceNodeIds.has(e.fromNodeId) && traceNodeIds.has(e.toNodeId))
      .map((e) => ({
        id: e.id,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        relationshipType: e.relationshipType,
        confidence: e.confidence ?? null,
        active: e.active ?? null,
      }));
    return {
      generatedAt: new Date().toISOString(),
      hostDomain,
      origin: origin
        ? {
            id: origin.id,
            canonicalId: origin.canonicalId ?? null,
            entityType: origin.entityType,
            name: origin.name,
            domain: origin.domain ?? hostDomain,
          }
        : { id: traceOriginId },
      depth: traceDepth,
      truncated: traceTruncated,
      nodeCount: traceNodes.length,
      edgeCount: traceEdges.length,
      nodes: traceNodes,
      edges: traceEdges,
    };
  }, [traceOriginId, traceDistances, nodes, edges, hostDomain, traceDepth, traceTruncated]);

  const exportTrace = useCallback(
    (format: "json" | "csv") => {
      const bundle = buildTraceBundle();
      if (!bundle) return;
      const slug = (bundle.origin.name ?? bundle.origin.id ?? "trace")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "trace";
      const ts = bundle.generatedAt.replace(/[:.]/g, "-");
      const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Defer revoke so the browser has time to start the download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      if (format === "json") {
        const blob = new Blob([JSON.stringify(bundle, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `trace-${slug}-${ts}.json`);
        return;
      }
      // CSV: single file containing a header block, then a NODES section and
      // an EDGES section so a reviewer can open it directly in a spreadsheet.
      const csvEscape = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        const s = Array.isArray(v) ? v.join("|") : String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines: string[] = [];
      lines.push(`# Constellation trace export`);
      lines.push(`# generated_at,${csvEscape(bundle.generatedAt)}`);
      lines.push(`# host_domain,${csvEscape(bundle.hostDomain)}`);
      lines.push(`# origin_id,${csvEscape(bundle.origin.id)}`);
      lines.push(`# origin_name,${csvEscape(bundle.origin.name ?? "")}`);
      lines.push(`# depth,${bundle.depth}`);
      lines.push(`# truncated,${bundle.truncated}`);
      lines.push(`# node_count,${bundle.nodeCount}`);
      lines.push(`# edge_count,${bundle.edgeCount}`);
      lines.push("");
      lines.push("# NODES");
      lines.push(
        [
          "id",
          "canonical_id",
          "entity_type",
          "name",
          "domain",
          "hop_distance",
          "confidence",
          "sensitivity_tier",
          "is_active",
          "freshness",
          "labels",
          "description",
        ].join(","),
      );
      for (const n of bundle.nodes) {
        lines.push(
          [
            n.id,
            n.canonicalId,
            n.entityType,
            n.name,
            n.domain,
            n.hopDistance,
            n.confidence,
            n.sensitivityTier,
            n.isActive,
            n.freshness,
            n.labels,
            n.description,
          ]
            .map(csvEscape)
            .join(","),
        );
      }
      lines.push("");
      lines.push("# EDGES");
      lines.push(
        ["id", "from_node_id", "to_node_id", "relationship_type", "confidence", "active"].join(","),
      );
      for (const e of bundle.edges) {
        lines.push(
          [e.id, e.fromNodeId, e.toNodeId, e.relationshipType, e.confidence, e.active]
            .map(csvEscape)
            .join(","),
        );
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      downloadBlob(blob, `trace-${slug}-${ts}.csv`);
    },
    [buildTraceBundle],
  );

  const tracePath = useCallback(
    async (node: ConstellationGraphNode, depth: number) => {
      if (!node?.id || expanding === node.id) return;
      setExpanding(node.id);
      setExpandError(null);
      try {
        const res = await apiFetch<
          | {
              data?: {
                origin: ConstellationGraphNode;
                depth: number;
                truncated: boolean;
                distances: Record<string, number>;
                nodes: (ConstellationGraphNode & { distance?: number | null })[];
                edges: ConstellationGraphEdge[];
              };
            }
          | {
              origin: ConstellationGraphNode;
              depth: number;
              truncated: boolean;
              distances: Record<string, number>;
              nodes: (ConstellationGraphNode & { distance?: number | null })[];
              edges: ConstellationGraphEdge[];
            }
        >(
          `/graph/entities/${encodeURIComponent(node.id)}/subgraph?depth=${depth}&maxNodes=75`,
        );
        const payload =
          (res as { data?: { origin: ConstellationGraphNode; depth: number; truncated: boolean; distances: Record<string, number>; nodes: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] } }).data ??
          (res as { origin: ConstellationGraphNode; depth: number; truncated: boolean; distances: Record<string, number>; nodes: ConstellationGraphNode[]; edges: ConstellationGraphEdge[] });
        if (!payload?.origin) throw new Error("Empty response");
        setExpandedNodes((prev) => {
          const next = { ...prev };
          for (const n of payload.nodes ?? []) next[n.id] = n;
          return next;
        });
        setExpandedEdges((prev) => {
          const next = { ...prev };
          for (const e of payload.edges ?? []) next[e.id] = e;
          return next;
        });
        setExpandedIds((prev) => {
          const next = new Set(prev);
          for (const n of payload.nodes ?? []) next.add(n.id);
          return next;
        });
        setTraceOriginId(payload.origin.id);
        setTraceDistances(payload.distances ?? {});
        setTraceTruncated(!!payload.truncated);
        setSelected((prev) => (prev?.id === payload.origin.id ? payload.origin : prev));
        alphaRef.current = 1;
      } catch (err) {
        setExpandError((err as Error)?.message ?? "Failed to trace path");
      } finally {
        setExpanding((cur) => (cur === node.id ? null : cur));
      }
    },
    [expanding],
  );

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

  // Init simulation when nodes change — preserve existing positions so
  // newly-loaded neighbors slot in without re-shuffling the whole graph.
  useEffect(() => {
    simRef.current = initSim(nodes, W, H, simRef.current);
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

      {showControls && !data && (
        <div
          data-testid="constellation-filters"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Type
            </span>
            <FilterChip
              label="All"
              active={entityTypeFilter === null}
              onClick={() => setEntityTypeFilter(null)}
              accentColor={accentColor}
            />
            {seenTypes.map((t) => (
              <FilterChip
                key={t}
                label={`${TYPE_GLYPH[t] ?? "◆"} ${t}`}
                active={entityTypeFilter === t}
                onClick={() => setEntityTypeFilter(entityTypeFilter === t ? null : t)}
                accentColor={accentColor}
                testId={`constellation-type-chip-${t}`}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Status
            </span>
            <FilterChip
              label="Active only"
              active={activeOnly}
              onClick={() => setActiveOnly((v) => !v)}
              accentColor={accentColor}
              testId="constellation-active-chip"
            />
            <span
              style={{
                fontSize: 10,
                color: "#64748b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginLeft: 8,
              }}
            >
              Since
            </span>
            {(["24h", "7d", "30d", "all"] as const).map((w) => (
              <FilterChip
                key={w}
                label={w === "all" ? "All time" : `Last ${w}`}
                active={sinceWindow === w}
                onClick={() => setSinceWindow(w)}
                accentColor={accentColor}
                testId={`constellation-since-chip-${w}`}
              />
            ))}
            <span
              style={{
                fontSize: 10,
                color: "#64748b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginLeft: 8,
              }}
            >
              Per page
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              data-testid="constellation-page-size"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#e8edf8",
                outline: "none",
              }}
            >
              {[60, 120, 240, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or canonical ID…"
              data-testid="constellation-search"
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#e8edf8",
                minWidth: 220,
                outline: "none",
              }}
            />
            {searchQuery && (
              <span style={{ fontSize: 10, color: "#94a3b8" }} data-testid="constellation-search-count">
                {searchMatches?.size ?? 0} match{(searchMatches?.size ?? 0) === 1 ? "" : "es"}
              </span>
            )}
          </div>
        </div>
      )}

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
              const selHighlight =
                selected && (e.fromNodeId === selected.id || e.toNodeId === selected.id);
              const searchHighlight =
                searchMatches !== null &&
                (searchMatches.has(e.fromNodeId) || searchMatches.has(e.toNodeId));
              const highlight = selHighlight || searchHighlight;
              const dim =
                (selected && !selHighlight) ||
                (searchMatches !== null && !searchHighlight);
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
              const isSearchMatch = searchMatches !== null && searchMatches.has(n.id);
              const dim =
                (selected && !isSelected && !isNeighbor) ||
                (searchMatches !== null && !isSearchMatch);
              const r = isSelected || isSearchMatch
                ? s.radius * 1.4
                : isHovered
                ? s.radius * 1.2
                : s.radius;
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
                  {(isSelected || isHovered || isSearchMatch) && (
                    <circle
                      r={r + 5}
                      fill={isSearchMatch ? "#fbbf24" : color}
                      fillOpacity={isSearchMatch ? 0.32 : 0.18}
                    />
                  )}
                  {isSearchMatch && (
                    <circle
                      r={r + 3}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={1.5}
                    />
                  )}
                  {/* Distance ring: when a multi-hop trace is active, draw a
                      thin halo around each node colored by hop count so the
                      operator can see how far each entity sits from the
                      trace origin at a glance. */}
                  {traceOriginId && traceDistances[n.id] !== undefined && (
                    <circle
                      r={r + 3}
                      fill="none"
                      stroke={DISTANCE_COLORS[Math.min(traceDistances[n.id], DISTANCE_COLORS.length - 1)]}
                      strokeWidth={n.id === traceOriginId ? 2.5 : 1.5}
                      strokeOpacity={0.85}
                    />
                  )}
                  <circle
                    r={r}
                    fill={isExternal ? "#1e293b" : color}
                    fillOpacity={isExternal ? 0.85 : 0.85}
                    stroke={isExternal ? "#fbbf24" : color}
                    strokeWidth={isExternal ? 1.5 : 0}
                    strokeDasharray={isExternal ? "3 2" : undefined}
                  />
                  {traceOriginId && traceDistances[n.id] !== undefined && n.id !== traceOriginId && (
                    <text
                      x={r + 4}
                      y={-r}
                      textAnchor="start"
                      fill={DISTANCE_COLORS[Math.min(traceDistances[n.id], DISTANCE_COLORS.length - 1)]}
                      fontSize={9}
                      fontWeight={700}
                      style={{ pointerEvents: "none" }}
                    >
                      {traceDistances[n.id]}h
                    </text>
                  )}
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
          {traceOriginId && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "3px 0" }} />
              <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Hops from origin
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {DISTANCE_COLORS.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", border: `1.5px solid ${c}` }} />
                    <span style={{ fontSize: 9, color: "#cbd5e1" }}>{i === 4 ? "4+" : i}</span>
                  </div>
                ))}
              </div>
              {traceTruncated && (
                <div style={{ fontSize: 9, color: "#fbbf24" }} data-testid="constellation-trace-truncated">
                  Result truncated by node/edge cap
                </div>
              )}
            </>
          )}
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
            <span
              data-testid="constellation-stats-nodes"
              title="loaded / total nodes in this domain"
            >
              {data
                ? `${stats.nodeCount} nodes`
                : `${loadedNodeCount} / ${stats.nodeCount} nodes`}
            </span>
            <span>·</span>
            <span
              title={
                stats.totalInternalEdgeCount !== undefined
                  ? "loaded / total internal edges in this domain"
                  : undefined
              }
            >
              {stats.internalEdgeCount}
              {stats.totalInternalEdgeCount !== undefined
                ? ` / ${stats.totalInternalEdgeCount}`
                : ""}{" "}
              internal
            </span>
            <span>·</span>
            <span
              style={{ color: "#fbbf24" }}
              title={
                stats.totalCrossDomainEdgeCount !== undefined
                  ? "loaded / total cross-domain edges in this domain"
                  : undefined
              }
            >
              {stats.crossDomainEdgeCount}
              {stats.totalCrossDomainEdgeCount !== undefined
                ? ` / ${stats.totalCrossDomainEdgeCount}`
                : ""}{" "}
              cross-domain
            </span>
          </div>
        )}
      </div>

      {/* Load more / pagination footer */}
      {showControls && !data && fetched && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            fontSize: 11,
            color: "#94a3b8",
          }}
          data-testid="constellation-pagination"
        >
          <span data-testid="constellation-pagination-status">
            Loaded {loadedNodeCount} of {totalNodeCount} entities
            {totalNodeCount > 0
              ? ` (${Math.round((loadedNodeCount / totalNodeCount) * 100)}%)`
              : ""}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loadMoreError && (
              <span style={{ color: "#ef4444", fontSize: 10 }}>{loadMoreError}</span>
            )}
            <button
              onClick={loadMore}
              disabled={!hasMore || loadingMore}
              data-testid="constellation-load-more"
              style={{
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 4,
                border: `1px solid ${hasMore ? `${accentColor}60` : "rgba(255,255,255,0.1)"}`,
                background: hasMore && !loadingMore ? `${accentColor}18` : "rgba(255,255,255,0.03)",
                color: hasMore && !loadingMore ? accentColor : "#64748b",
                cursor: hasMore && !loadingMore ? "pointer" : "default",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {loadingMore
                ? "Loading…"
                : hasMore
                ? `Load ${Math.min(pageSize, totalNodeCount - loadedNodeCount)} more`
                : "All loaded"}
            </button>
          </div>
        </div>
      )}

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
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <label style={{ fontSize: 10, color: "#94a3b8" }} htmlFor="constellation-trace-depth">
                  hops
                </label>
                <select
                  id="constellation-trace-depth"
                  value={traceDepth}
                  onChange={(e) => setTraceDepth(Number(e.target.value))}
                  style={{
                    fontSize: 11,
                    padding: "3px 6px",
                    borderRadius: 4,
                    border: `1px solid ${accentColor}40`,
                    background: "rgba(10,15,28,0.7)",
                    color: "#e8edf8",
                  }}
                  data-testid="constellation-trace-depth"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
                <button
                  onClick={() => tracePath(selected, traceDepth)}
                  disabled={expanding === selected.id}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 4,
                    border: `1px solid ${accentColor}60`,
                    background: expanding === selected.id ? "rgba(255,255,255,0.04)" : `${accentColor}28`,
                    color: expanding === selected.id ? "#64748b" : accentColor,
                    cursor: expanding === selected.id ? "default" : "pointer",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                  data-testid="constellation-trace-path"
                  title={`Walk up to ${traceDepth} hops out from this node`}
                >
                  {expanding === selected.id ? "Tracing…" : `↳ Trace ${traceDepth} hops`}
                </button>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 4 }}
                data-testid="constellation-export-controls"
              >
                <button
                  onClick={() => exportTrace("json")}
                  disabled={!traceOriginId}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 4,
                    border: `1px solid ${traceOriginId ? `${accentColor}60` : "rgba(255,255,255,0.15)"}`,
                    background: traceOriginId ? `${accentColor}18` : "rgba(255,255,255,0.04)",
                    color: traceOriginId ? accentColor : "#64748b",
                    cursor: traceOriginId ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                  data-testid="constellation-export-trace-json"
                  title={
                    traceOriginId
                      ? "Download the traced subgraph as JSON"
                      : "Run a trace first to enable export"
                  }
                >
                  ⬇ Export trace · JSON
                </button>
                <button
                  onClick={() => exportTrace("csv")}
                  disabled={!traceOriginId}
                  style={{
                    fontSize: 11,
                    padding: "5px 8px",
                    borderRadius: 4,
                    border: `1px solid ${traceOriginId ? `${accentColor}60` : "rgba(255,255,255,0.15)"}`,
                    background: traceOriginId ? `${accentColor}10` : "rgba(255,255,255,0.04)",
                    color: traceOriginId ? accentColor : "#64748b",
                    cursor: traceOriginId ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                  data-testid="constellation-export-trace-csv"
                  title={
                    traceOriginId
                      ? "Download the traced subgraph as CSV"
                      : "Run a trace first to enable export"
                  }
                >
                  CSV
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  onClick={() => expandNeighbors(selected)}
                  disabled={expanding === selected.id}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 4,
                    border: `1px solid ${accentColor}60`,
                    background: expanding === selected.id ? "rgba(255,255,255,0.04)" : `${accentColor}18`,
                    color: expanding === selected.id ? "#64748b" : accentColor,
                    cursor: expanding === selected.id ? "default" : "pointer",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                  data-testid="constellation-expand-neighbors"
                  title={`Fetch this node's 1-hop neighbors across all domains (up to ${expandLimit})`}
                >
                  {expanding === selected.id
                    ? "Expanding…"
                    : expandedIds.has(selected.id)
                    ? `Re-expand neighbors ↻`
                    : `+ Expand neighbors`}
                </button>
                <select
                  value={expandLimit}
                  onChange={(e) => setExpandLimit(Number(e.target.value) as 25 | 50 | 100 | 200)}
                  disabled={expanding === selected.id}
                  aria-label="Maximum neighbors to load per expansion"
                  title="Maximum neighbors to load per expansion"
                  data-testid="constellation-expand-limit"
                  style={{
                    fontSize: 11,
                    padding: "5px 6px",
                    borderRadius: 4,
                    border: `1px solid ${accentColor}40`,
                    background: "rgba(15,23,42,0.8)",
                    color: "#cbd5e1",
                    cursor: expanding === selected.id ? "default" : "pointer",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
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
          {expandError && (
            <div
              role="alert"
              data-testid="constellation-expand-error"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 6,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.45)",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1, color: "#ef4444" }}>⚠</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fecaca" }}>
                  Couldn’t expand neighbors
                </div>
                <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 3, wordBreak: "break-word" }}>
                  {expandError}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = expandErrorNodeRef.current ?? selected;
                  if (target) void expandNeighbors(target);
                }}
                disabled={expanding === (expandErrorNodeRef.current?.id ?? selected?.id)}
                data-testid="constellation-expand-retry"
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 4,
                  border: "1px solid rgba(239,68,68,0.6)",
                  background: "rgba(239,68,68,0.18)",
                  color: "#fecaca",
                  cursor:
                    expanding === (expandErrorNodeRef.current?.id ?? selected?.id)
                      ? "default"
                      : "pointer",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {expanding === (expandErrorNodeRef.current?.id ?? selected?.id)
                  ? "Retrying…"
                  : "Retry expansion"}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes constellation-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
