import { useStandardQuery } from '@szl-holdings/api-client-react';

import {
  ChevronRight,
  Clock,
  Filter,
  GitBranch,
  Globe,
  Info,
  Layers,
  Radio,
  RefreshCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CognitiveLayout } from './cognitive-layout';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const ACCENT = '#8b7ac8';
const CARD = 'var(--color-surface-base)';
const BORDER = 'var(--color-surface-border)';
const FG = 'var(--color-fg-primary)';
const FG_MUT = 'var(--color-fg-muted)';

interface ConstellationNode {
  id: string;
  label: string;
  type: 'domain' | 'entity' | 'concept' | 'agent';
  domain: string;
  confidence: number;
  freshness: number;
  provenance: string[];
  description: string;
  lastSeen: string;
  /** Wall-clock timestamp the node was last observed. Used for live freshness decay. */
  lastSeenTs?: number;
  /** Wall-clock timestamp the node first appeared in the live stream. Used to animate it in. */
  discoveredTs?: number;
  x?: number;
  y?: number;
}

interface ConstellationEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'causal' | 'associative' | 'hierarchical' | 'temporal' | 'dependency';
  confidence: number;
  strength: number;
  lastActive: string;
  lastActiveTs?: number;
}

interface WorldModel {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  meta: { totalNodes: number; totalEdges: number; lastRefreshed: string; staleDomains: string[] };
}

const DOMAIN_COLORS: Record<string, string> = {
  vessels: '#0ea5e9',
  aegis: '#ef4444',
  terra: '#22c55e',
  prism: '#8b5cf6',
  lyte: '#f59e0b',
  carlota: '#ec4899',
  'szl-holdings': '#8b7ac8',
  cognitive: '#8b7ac8',
};

const EDGE_COLORS: Record<string, string> = {
  causal: '#ef4444',
  associative: '#3b82f6',
  hierarchical: '#22c55e',
  temporal: '#f59e0b',
  dependency: '#6b7280',
};

const DEMO_WORLD_MODEL: WorldModel = {
  meta: {
    totalNodes: 22,
    totalEdges: 24,
    lastRefreshed: new Date().toISOString(),
    staleDomains: ['carlota'],
  },
  nodes: [
    {
      id: 'd-vessels',
      label: 'SEXTANT',
      type: 'domain',
      domain: 'vessels',
      confidence: 0.91,
      freshness: 0.95,
      provenance: ['AIS feed', 'Charter DB'],
      description: 'Maritime operations domain covering fleet, voyages, and charters.',
      lastSeen: '1m ago',
    },
    {
      id: 'd-terra',
      label: 'DOMAINE',
      type: 'domain',
      domain: 'terra',
      confidence: 0.88,
      freshness: 0.92,
      provenance: ['Real estate DB', 'LP Reports'],
      description:
        'Real estate intelligence covering portfolio, distress signals, and LP relations.',
      lastSeen: '3m ago',
    },
    {
      id: 'd-aegis',
      label: 'PARAGON',
      type: 'domain',
      domain: 'aegis',
      confidence: 0.83,
      freshness: 0.89,
      provenance: ['MITRE ATT&CK', 'Threat feeds'],
      description: 'Security posture — threat intel, compliance, and vulnerability management.',
      lastSeen: '5m ago',
    },
    {
      id: 'd-lyte',
      label: 'KORA',
      type: 'domain',
      domain: 'lyte',
      confidence: 0.85,
      freshness: 0.88,
      provenance: ['API metrics', 'SLO dashboard'],
      description: 'AIOps platform — signals, SLOs, metrics, and operational health.',
      lastSeen: '2m ago',
    },
    {
      id: 'd-prism',
      label: 'PRAXIS',
      type: 'domain',
      domain: 'prism',
      confidence: 0.86,
      freshness: 0.9,
      provenance: ['CRM', 'Deal DB'],
      description: 'Commercial intelligence — deal flow, pipeline, and client relationships.',
      lastSeen: '4m ago',
    },
    {
      id: 'd-carlota',
      label: 'Carlota',
      type: 'domain',
      domain: 'carlota',
      confidence: 0.68,
      freshness: 0.22,
      provenance: ['CRM feed (stale)'],
      description: 'Consulting CRM — currently stale (3h42m). Data confidence degraded.',
      lastSeen: '3h42m ago',
    },
    {
      id: 'e-fleet',
      label: 'Active Fleet',
      type: 'entity',
      domain: 'vessels',
      confidence: 0.93,
      freshness: 0.96,
      provenance: ['AIS live feed'],
      description: '12 vessels in active transit. VYG-class anomaly detected on 2 voyages.',
      lastSeen: '30s ago',
    },
    {
      id: 'e-crm',
      label: 'CRM Pipeline',
      type: 'entity',
      domain: 'carlota',
      confidence: 0.62,
      freshness: 0.18,
      provenance: ['CRM (stale 3h42m)'],
      description: 'Carlota client pipeline data — severely stale. Freshness SLA breached.',
      lastSeen: '3h42m ago',
    },
    {
      id: 'e-lp',
      label: 'LP Portfolio',
      type: 'entity',
      domain: 'terra',
      confidence: 0.91,
      freshness: 0.94,
      provenance: ['LP Reports', 'Fund DB'],
      description: '$180M LP portfolio. Q1 rollup blocked pending CFO approval.',
      lastSeen: '8m ago',
    },
    {
      id: 'e-threat',
      label: 'Threat Intel',
      type: 'entity',
      domain: 'aegis',
      confidence: 0.8,
      freshness: 0.85,
      provenance: ['MITRE ATT&CK', 'External feeds'],
      description: 'Current external threat landscape. Bundle exposure flagged for CISO review.',
      lastSeen: '6m ago',
    },
    {
      id: 'e-slo',
      label: 'SLO State',
      type: 'entity',
      domain: 'lyte',
      confidence: 0.87,
      freshness: 0.92,
      provenance: ['API metrics (live)'],
      description: '5/8 SLAs healthy. P95 latency breach on distress engine — index missing.',
      lastSeen: '1m ago',
    },
    {
      id: 'e-deal',
      label: 'Deal Flow',
      type: 'entity',
      domain: 'prism',
      confidence: 0.89,
      freshness: 0.91,
      provenance: ['Deal DB', 'Pipeline CRM'],
      description: 'Active deal pipeline. 3 enterprise deals pending webhook feature.',
      lastSeen: '4m ago',
    },
    {
      id: 'c-risk',
      label: 'Cross-Domain Risk',
      type: 'concept',
      domain: 'szl-holdings',
      confidence: 0.81,
      freshness: 0.84,
      provenance: ['ATLAS synthesis'],
      description: 'Synthesized risk exposure across all domains. Updated after Carlota outage.',
      lastSeen: '5m ago',
    },
    {
      id: 'c-trust',
      label: 'Agent Trust State',
      type: 'concept',
      domain: 'cognitive',
      confidence: 0.81,
      freshness: 0.95,
      provenance: ['Self-model', 'Verifier log'],
      description: 'Aggregate trust state across all active agents. Maritime-AI recalibrating.',
      lastSeen: '30s ago',
    },
    {
      id: 'a-atlas',
      label: 'ATLAS-Core',
      type: 'agent',
      domain: 'cognitive',
      confidence: 0.88,
      freshness: 1.0,
      provenance: ['Self-model'],
      description: 'Primary synthesis agent. Running cross-domain risk synthesis (step 12).',
      lastSeen: 'just now',
    },
    {
      id: 'a-ops3',
      label: 'Ops-Agent-3',
      type: 'agent',
      domain: 'cognitive',
      confidence: 0.74,
      freshness: 1.0,
      provenance: ['Runtime state'],
      description: 'CRM recovery agent. Waiting on Ops Lead approval for credential rotation.',
      lastSeen: 'just now',
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'd-carlota',
      target: 'e-crm',
      label: 'owns',
      type: 'hierarchical',
      confidence: 0.68,
      strength: 0.8,
      lastActive: '3h42m ago',
    },
    {
      id: 'e2',
      source: 'e-crm',
      target: 'c-risk',
      label: 'inflates risk',
      type: 'causal',
      confidence: 0.78,
      strength: 0.9,
      lastActive: '5m ago',
    },
    {
      id: 'e3',
      source: 'd-lyte',
      target: 'e-slo',
      label: 'monitors',
      type: 'hierarchical',
      confidence: 0.87,
      strength: 0.9,
      lastActive: '1m ago',
    },
    {
      id: 'e4',
      source: 'e-slo',
      target: 'c-risk',
      label: 'SLA impact',
      type: 'associative',
      confidence: 0.72,
      strength: 0.6,
      lastActive: '2m ago',
    },
    {
      id: 'e5',
      source: 'd-vessels',
      target: 'e-fleet',
      label: 'operates',
      type: 'hierarchical',
      confidence: 0.93,
      strength: 0.95,
      lastActive: '30s ago',
    },
    {
      id: 'e6',
      source: 'd-terra',
      target: 'e-lp',
      label: 'manages',
      type: 'hierarchical',
      confidence: 0.91,
      strength: 0.9,
      lastActive: '8m ago',
    },
    {
      id: 'e7',
      source: 'd-aegis',
      target: 'e-threat',
      label: 'tracks',
      type: 'hierarchical',
      confidence: 0.83,
      strength: 0.85,
      lastActive: '6m ago',
    },
    {
      id: 'e8',
      source: 'd-prism',
      target: 'e-deal',
      label: 'tracks',
      type: 'hierarchical',
      confidence: 0.89,
      strength: 0.9,
      lastActive: '4m ago',
    },
    {
      id: 'e9',
      source: 'a-atlas',
      target: 'c-risk',
      label: 'synthesizes',
      type: 'causal',
      confidence: 0.88,
      strength: 0.9,
      lastActive: '5m ago',
    },
    {
      id: 'e10',
      source: 'a-ops3',
      target: 'e-crm',
      label: 'recovering',
      type: 'dependency',
      confidence: 0.74,
      strength: 0.7,
      lastActive: 'just now',
    },
    {
      id: 'e11',
      source: 'c-risk',
      target: 'e-lp',
      label: 'informs exposure',
      type: 'causal',
      confidence: 0.79,
      strength: 0.7,
      lastActive: '5m ago',
    },
    {
      id: 'e12',
      source: 'e-threat',
      target: 'c-risk',
      label: 'threat vector',
      type: 'associative',
      confidence: 0.75,
      strength: 0.65,
      lastActive: '6m ago',
    },
    {
      id: 'e13',
      source: 'c-trust',
      target: 'a-atlas',
      label: 'governs',
      type: 'dependency',
      confidence: 0.88,
      strength: 0.95,
      lastActive: 'just now',
    },
    {
      id: 'e14',
      source: 'c-trust',
      target: 'a-ops3',
      label: 'governs',
      type: 'dependency',
      confidence: 0.74,
      strength: 0.8,
      lastActive: 'just now',
    },
    {
      id: 'e15',
      source: 'e-deal',
      target: 'e-crm',
      label: 'depends on',
      type: 'dependency',
      confidence: 0.68,
      strength: 0.6,
      lastActive: '3h42m ago',
    },
  ],
};

function layoutNodes(
  nodes: ConstellationNode[],
  edges: ConstellationEdge[],
  w: number,
  h: number,
): ConstellationNode[] {
  const cx = w / 2,
    cy = h / 2;
  const domainR = Math.min(w, h) * 0.3;
  const entityR = Math.min(w, h) * 0.44;
  const conceptR = Math.min(w, h) * 0.2;
  const agentR = Math.min(w, h) * 0.13;

  const domains = nodes.filter((n) => n.type === 'domain');
  const entities = nodes.filter((n) => n.type === 'entity');
  const concepts = nodes.filter((n) => n.type === 'concept');
  const agents = nodes.filter((n) => n.type === 'agent');

  const placed = new Map<string, { x: number; y: number }>();

  domains.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / domains.length - Math.PI / 2;
    placed.set(n.id, { x: cx + domainR * Math.cos(angle), y: cy + domainR * Math.sin(angle) });
  });

  entities.forEach((n, i) => {
    const domain = domains.find((d) => d.domain === n.domain);
    if (domain && placed.has(domain.id)) {
      const dp = placed.get(domain.id)!;
      const angle = Math.atan2(dp.y - cy, dp.x - cx);
      const spread = (i % 3) * (Math.PI / 6) - Math.PI / 6;
      placed.set(n.id, {
        x: cx + entityR * Math.cos(angle + spread),
        y: cy + entityR * Math.sin(angle + spread),
      });
    } else {
      const angle = (2 * Math.PI * i) / entities.length;
      placed.set(n.id, { x: cx + entityR * Math.cos(angle), y: cy + entityR * Math.sin(angle) });
    }
  });

  concepts.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / concepts.length + Math.PI / 4;
    placed.set(n.id, { x: cx + conceptR * Math.cos(angle), y: cy + conceptR * Math.sin(angle) });
  });

  agents.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / agents.length + Math.PI;
    placed.set(n.id, { x: cx + agentR * Math.cos(angle), y: cy + agentR * Math.sin(angle) });
  });

  return nodes.map((n) => {
    const p = placed.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}

const DOMAIN_FILTER_OPTIONS = [
  'all',
  'vessels',
  'terra',
  'aegis',
  'lyte',
  'prism',
  'carlota',
  'cognitive',
];
const TYPE_OPTIONS: Array<ConstellationNode['type'] | 'all'> = [
  'all',
  'domain',
  'entity',
  'concept',
  'agent',
];
const FRESHNESS_OPTIONS = ['all', 'fresh', 'aging', 'stale'] as const;

function freshnessColor(f: number): string {
  return f >= 0.8 ? '#22c55e' : f >= 0.5 ? '#f59e0b' : '#ef4444';
}

function freshnessLabel(f: number): string {
  return f >= 0.8 ? 'Fresh' : f >= 0.5 ? 'Aging' : 'Stale';
}

export default function WorldModelExplorer() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 480 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{
    sx: number;
    sy: number;
    px: number;
    py: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [freshnessFilter, setFreshnessFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [sseConnected, setSseConnected] = useState(false);
  /** Nodes/edges added by the live SSE stream, layered on top of the polled snapshot. */
  const [liveNodes, setLiveNodes] = useState<ConstellationNode[]>([]);
  const [liveEdges, setLiveEdges] = useState<ConstellationEdge[]>([]);
  /** Tick counter that bumps every ~2s so freshness bars decay without a full refetch. */
  const [tick, setTick] = useState(0);

  // When SSE is connected we don't need the slow 60s polling refresh — the
  // stream is the source of truth. Falling back to polling only when SSE is
  // unavailable keeps the graph live while degrading gracefully.
  const {
    data: worldData,
    refetch,
    isFetching,
  } = useStandardQuery<WorldModel>({
    queryKey: ['cognitive', 'world-model'],
    queryFn: () =>
      fetch(`${BASE}/api/graph/entities`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() => DEMO_WORLD_MODEL),
    staleTime: 30_000,
    refetchInterval: sseConnected ? false : 60_000,
  });

  // Local re-render tick so freshness bars decay continuously without forcing
  // a network refetch.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 2_000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to /api/graph/stream for incremental entity & edge discoveries.
  // Auto-reconnects on error with a 5s backoff; the SSE indicator in the
  // toolbar reflects the current connection state.
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        es = new EventSource(`${BASE}/api/graph/stream`);
      } catch {
        retryTimer = setTimeout(connect, 5_000);
        return;
      }

      es.addEventListener('hello', () => {
        if (!cancelled) setSseConnected(true);
      });
      es.onopen = () => {
        if (!cancelled) setSseConnected(true);
      };

      es.addEventListener('entity.added', (e) => {
        if (cancelled) return;
        try {
          const node = JSON.parse((e as MessageEvent).data) as ConstellationNode;
          setLiveNodes((prev) => {
            if (prev.some((n) => n.id === node.id)) return prev;
            // Cap live additions to keep the canvas readable; drop the oldest.
            const next = [
              ...prev,
              {
                ...node,
                lastSeenTs: node.lastSeenTs ?? Date.now(),
                discoveredTs: node.discoveredTs ?? Date.now(),
              },
            ];
            return next.length > 12 ? next.slice(next.length - 12) : next;
          });
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('edge.added', (e) => {
        if (cancelled) return;
        try {
          const edge = JSON.parse((e as MessageEvent).data) as ConstellationEdge;
          setLiveEdges((prev) => {
            if (prev.some((x) => x.id === edge.id)) return prev;
            const next = [...prev, { ...edge, lastActiveTs: edge.lastActiveTs ?? Date.now() }];
            return next.length > 16 ? next.slice(next.length - 16) : next;
          });
        } catch {
          /* ignore */
        }
      });

      es.addEventListener('freshness.tick', () => {
        if (!cancelled) setTick((t) => (t + 1) % 1_000_000);
      });

      es.onerror = () => {
        if (cancelled) return;
        setSseConnected(false);
        es?.close();
        es = null;
        retryTimer = setTimeout(connect, 5_000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, []);

  interface SearchResult {
    nodeIds: string[];
    nodes?: ConstellationNode[];
  }
  const { data: searchData, isFetching: isSearching } = useStandardQuery<SearchResult>({
    queryKey: ['cognitive', 'graph-search', debouncedQuery],
    queryFn: () =>
      fetch(`${BASE}/api/graph/search?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: 'include',
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() => null),
    enabled: debouncedQuery.length >= 2,
    staleTime: 20_000,
  });

  const baseModel = worldData ?? DEMO_WORLD_MODEL;

  // Merge the polled snapshot with live SSE additions. Live nodes only render
  // when their reference (source/target) is satisfiable — orphan edges are
  // dropped in the visibility pass below.
  const model = useMemo<WorldModel>(() => {
    if (liveNodes.length === 0 && liveEdges.length === 0) return baseModel;
    const seen = new Set(baseModel.nodes.map((n) => n.id));
    const newNodes = liveNodes.filter((n) => !seen.has(n.id));
    const seenEdges = new Set(baseModel.edges.map((e) => e.id));
    const newEdges = liveEdges.filter((e) => !seenEdges.has(e.id));
    return {
      ...baseModel,
      nodes: [...baseModel.nodes, ...newNodes],
      edges: [...baseModel.edges, ...newEdges],
      meta: {
        ...baseModel.meta,
        totalNodes: baseModel.meta.totalNodes + newNodes.length,
        totalEdges: baseModel.meta.totalEdges + newEdges.length,
        lastRefreshed: sseConnected ? new Date().toISOString() : baseModel.meta.lastRefreshed,
      },
    };
  }, [baseModel, liveNodes, liveEdges, sseConnected]);

  /**
   * Live freshness: nodes that carry `lastSeenTs` (anything from the SSE
   * stream, plus existing nodes once we synthesize a baseline) decay smoothly
   * toward zero over a 10-minute TTL. Snapshot nodes without a timestamp keep
   * their static `freshness` value.
   *
   * The `tick` dependency causes a render every ~2s so the bars visibly slide
   * down without re-fetching the snapshot.
   */
  const FRESHNESS_TTL_MS = 10 * 60 * 1000;
  // Plain function (not useCallback): the component re-renders every ~2s via
  // the `tick` state, so each render naturally recomputes the decayed value.
  const computeLiveFreshness = (n: ConstellationNode): number => {
    if (n.lastSeenTs == null) return n.freshness;
    const age = Date.now() - n.lastSeenTs;
    const decayed = Math.max(0, 1 - age / FRESHNESS_TTL_MS);
    return Math.min(n.freshness, decayed);
  };
  // Reference `tick` so it's tracked as a render dependency for the inline
  // freshness computations below; the actual value is unused.
  void tick;

  const searchMatchIds: Set<string> | null = searchData?.nodeIds
    ? new Set(searchData.nodeIds)
    : debouncedQuery.length >= 2 && !searchData
      ? null
      : null;

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.max(440, e.contentRect.height) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const filteredNodes = model.nodes.filter((n) => {
    if (domainFilter !== 'all' && n.domain !== domainFilter) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    const f = computeLiveFreshness(n);
    if (freshnessFilter === 'fresh' && f < 0.8) return false;
    if (freshnessFilter === 'aging' && (f >= 0.8 || f < 0.5)) return false;
    if (freshnessFilter === 'stale' && f >= 0.5) return false;
    if (confidenceFilter === 'high' && n.confidence < 0.85) return false;
    if (confidenceFilter === 'medium' && (n.confidence < 0.7 || n.confidence >= 0.85)) return false;
    if (confidenceFilter === 'low' && n.confidence >= 0.7) return false;
    if (searchMatchIds) {
      return searchMatchIds.has(n.id);
    }
    if (
      debouncedQuery &&
      !n.label.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
      !n.description.toLowerCase().includes(debouncedQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const filteredIds = new Set(filteredNodes.map((n) => n.id));
  const visibleEdges = model.edges.filter(
    (e) => filteredIds.has(e.source) && filteredIds.has(e.target),
  );

  const laidOut = layoutNodes(filteredNodes, visibleEdges, dims.w, dims.h);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as SVGElement).closest('[data-node]')) return;
      setDragging({ sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y });
    },
    [pan],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({
        x: dragging.px + (e.clientX - dragging.sx),
        y: dragging.py + (e.clientY - dragging.sy),
      });
    },
    [dragging],
  );

  const onMouseUp = useCallback(() => setDragging(null), []);

  const nodeMap = new Map(laidOut.map((n) => [n.id, n]));

  const typeShape = (n: ConstellationNode, isSelected: boolean) => {
    const dc = DOMAIN_COLORS[n.domain] ?? ACCENT;
    const liveF = computeLiveFreshness(n);
    const fc = freshnessColor(liveF);
    const r = n.type === 'domain' ? 22 : n.type === 'entity' ? 14 : n.type === 'concept' ? 17 : 11;
    const strokeW = isSelected ? 2.5 : 1.5;
    const strokeColor = isSelected ? '#fff' : fc;
    const opacity = liveF >= 0.5 ? 1 : 0.55;

    // Newly discovered nodes (within the last 4s) get a one-shot fade/scale-in
    // animation plus a transient pulse ring so they're easy to spot.
    const ageMs = n.discoveredTs ? Date.now() - n.discoveredTs : Infinity;
    const isNew = ageMs < 4_000;
    const animation = isNew ? 'wm-node-appear 600ms ease-out both' : undefined;

    return (
      <g
        style={{ opacity, animation, transformOrigin: 'center', transformBox: 'fill-box' }}
        data-node="true"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(isSelected ? null : n);
        }}
      >
        {isNew && (
          <circle
            r={r}
            fill="none"
            stroke={dc}
            strokeWidth={1.5}
            style={{
              animation: 'wm-node-pulse 1500ms ease-out 2',
              transformOrigin: 'center',
              transformBox: 'fill-box',
            }}
          />
        )}
        {n.type === 'concept' ? (
          <polygon
            points={`0,-${r} ${r * 0.866},${r * 0.5} -${r * 0.866},${r * 0.5}`}
            fill={`${dc}20`}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
        ) : n.type === 'agent' ? (
          <rect
            x={-r}
            y={-r}
            width={r * 2}
            height={r * 2}
            rx={3}
            fill={`${dc}20`}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
        ) : (
          <circle r={r} fill={`${dc}20`} stroke={strokeColor} strokeWidth={strokeW} />
        )}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: n.type === 'domain' ? 8 : 7,
            fill: dc,
            fontWeight: 700,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {n.label.length > 9 ? n.label.slice(0, 8) + '…' : n.label}
        </text>
        {liveF < 0.5 && (
          <circle r={4} cx={r - 2} cy={-(r - 2)} fill="#ef4444" stroke="#080c14" strokeWidth={1} />
        )}
      </g>
    );
  };

  return (
    <CognitiveLayout>
      {/* Inline keyframes used by node-appear animations and the existing
          spinner. Scoped here to keep the page self-contained. */}
      <style>{`
        @keyframes wm-node-appear {
          from { opacity: 0; transform: scale(0.2); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes wm-node-pulse {
          from { opacity: 0.7; transform: scale(1); }
          to { opacity: 0; transform: scale(2.4); }
        }
        @keyframes wm-live-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              background: 'rgba(6,10,18,0.9)',
              backdropFilter: 'blur(8px)',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe style={{ width: 13, height: 13, color: ACCENT }} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: FG_MUT,
                }}
              >
                CONSTELLATION · World Model
              </span>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                style={{
                  width: 10,
                  height: 10,
                  color: isSearching ? ACCENT : FG_MUT,
                  position: 'absolute',
                  left: 8,
                  transition: 'color 0.2s',
                }}
              />
              <input
                placeholder="Search entities…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 24,
                  paddingRight: searchQuery ? 20 : 8,
                  height: 26,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${debouncedQuery.length >= 2 ? ACCENT + '60' : BORDER}`,
                  color: FG,
                  fontSize: 10,
                  outline: 'none',
                  width: 160,
                  transition: 'border-color 0.2s',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: FG_MUT,
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <X style={{ width: 9, height: 9 }} />
                </button>
              )}
            </div>
            {debouncedQuery.length >= 2 && (
              <span
                style={{
                  fontSize: '8px',
                  color: isSearching ? ACCENT : FG_MUT,
                  fontFamily: 'monospace',
                }}
              >
                {isSearching ? 'searching…' : `graph search: "${debouncedQuery}"`}
              </span>
            )}

            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <Filter style={{ width: 10, height: 10, color: FG_MUT }} />
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                style={{
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG,
                  fontSize: 9,
                  padding: '0 6px',
                  outline: 'none',
                }}
              >
                {DOMAIN_FILTER_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All domains' : d}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG,
                  fontSize: 9,
                  padding: '0 6px',
                  outline: 'none',
                }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All types' : t}
                  </option>
                ))}
              </select>
              <select
                value={freshnessFilter}
                onChange={(e) => setFreshnessFilter(e.target.value)}
                style={{
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG,
                  fontSize: 9,
                  padding: '0 6px',
                  outline: 'none',
                }}
              >
                <option value="all">Any freshness</option>
                <option value="fresh">Fresh (≥80%)</option>
                <option value="aging">Aging (50–80%)</option>
                <option value="stale">Stale (&lt;50%)</option>
              </select>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                style={{
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG,
                  fontSize: 9,
                  padding: '0 6px',
                  outline: 'none',
                }}
              >
                <option value="all">Any confidence</option>
                <option value="high">High (≥85%)</option>
                <option value="medium">Medium (70–85%)</option>
                <option value="low">Low (&lt;70%)</option>
              </select>
            </div>

            <div
              style={{ display: 'flex', gap: '0.375rem', marginLeft: 'auto', alignItems: 'center' }}
            >
              <div
                title={
                  sseConnected
                    ? 'Live SSE stream connected'
                    : 'SSE disconnected — falling back to 60s polling'
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 5,
                  background: sseConnected ? 'rgba(34,197,94,0.08)' : 'rgba(120,120,120,0.08)',
                  border: `1px solid ${sseConnected ? 'rgba(34,197,94,0.3)' : 'rgba(120,120,120,0.3)'}`,
                  fontSize: 9,
                  color: sseConnected ? '#22c55e' : FG_MUT,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}
              >
                <Radio style={{ width: 9, height: 9 }} />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: sseConnected ? '#22c55e' : '#6b7280',
                    animation: sseConnected ? 'wm-live-pulse 2s ease-in-out infinite' : undefined,
                  }}
                />
                {sseConnected ? 'Live' : 'Polling'}
              </div>
              {model.meta.staleDomains.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 5,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 9,
                    color: '#ef4444',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block',
                    }}
                  />
                  Stale: {model.meta.staleDomains.join(', ')}
                </div>
              )}
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG_MUT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ZoomIn style={{ width: 11, height: 11 }} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG_MUT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ZoomOut style={{ width: 11, height: 11 }} />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: FG_MUT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Reset view"
              >
                <Layers style={{ width: 11, height: 11 }} />
              </button>
              <button
                onClick={() => refetch()}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`,
                  color: isFetching ? ACCENT : FG_MUT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Refresh"
              >
                <RefreshCw
                  style={{
                    width: 11,
                    height: 11,
                    animation: isFetching ? 'spin 1s linear infinite' : undefined,
                  }}
                />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: dragging ? 'grabbing' : 'grab',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(139,122,200,0.03) 0%, transparent 70%)',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <svg
              ref={svgRef}
              width={dims.w}
              height={dims.h}
              style={{ position: 'absolute', inset: 0 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.2)" />
                </marker>
              </defs>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {visibleEdges.map((edge) => {
                  const src = nodeMap.get(edge.source);
                  const tgt = nodeMap.get(edge.target);
                  if (src?.x == null || src?.y == null || tgt?.x == null || tgt?.y == null)
                    return null;
                  const ec = EDGE_COLORS[edge.type] ?? '#6b7280';
                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;
                  const opacity =
                    edge.confidence >= 0.8 ? 0.55 : edge.confidence >= 0.6 ? 0.35 : 0.2;
                  return (
                    <g key={edge.id}>
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={ec}
                        strokeWidth={edge.strength * 2}
                        strokeOpacity={opacity}
                        strokeDasharray={
                          edge.type === 'temporal'
                            ? '4,3'
                            : edge.type === 'dependency'
                              ? '2,3'
                              : undefined
                        }
                        markerEnd="url(#arrowhead)"
                      />
                      {zoom > 0.8 && (
                        <text
                          x={midX}
                          y={midY - 4}
                          textAnchor="middle"
                          style={{
                            fontSize: 7,
                            fill: ec,
                            opacity: 0.55,
                            fontFamily: 'monospace',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {laidOut.map((node) => {
                  if (node.x == null || node.y == null) return null;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      style={{ cursor: 'pointer' }}
                    >
                      {typeShape(node, isSelected)}
                      {zoom > 0.7 && (
                        <text
                          y={
                            node.type === 'domain'
                              ? 30
                              : node.type === 'entity'
                                ? 22
                                : node.type === 'concept'
                                  ? 26
                                  : 18
                          }
                          textAnchor="middle"
                          style={{
                            fontSize: 7,
                            fill: FG_MUT,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {node.type}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Causal', color: EDGE_COLORS.causal },
                { label: 'Associative', color: EDGE_COLORS.associative },
                { label: 'Hierarchical', color: EDGE_COLORS.hierarchical },
                { label: 'Dependency', color: EDGE_COLORS.dependency },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 8,
                    color: FG_MUT,
                  }}
                >
                  <div style={{ width: 16, height: 1.5, background: item.color, opacity: 0.6 }} />
                  {item.label}
                </div>
              ))}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                fontSize: 8,
                color: 'rgba(255,255,255,0.15)',
                fontFamily: 'monospace',
              }}
            >
              {filteredNodes.length}N · {visibleEdges.length}E · {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>

        <div
          style={{
            width: 280,
            borderLeft: `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(6,10,18,0.95)',
            overflow: 'hidden',
          }}
        >
          {selectedNode ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: ACCENT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Entity Detail
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: FG_MUT,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
              <div style={{ padding: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.625rem',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: FG }}>
                    {selectedNode.label}
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: `${DOMAIN_COLORS[selectedNode.domain] ?? ACCENT}18`,
                      color: DOMAIN_COLORS[selectedNode.domain] ?? ACCENT,
                      fontWeight: 700,
                    }}
                  >
                    {selectedNode.domain}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '8px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`,
                    color: FG_MUT,
                  }}
                >
                  {selectedNode.type}
                </span>

                <p
                  style={{ fontSize: '10px', color: FG_MUT, margin: '0.75rem 0', lineHeight: 1.6 }}
                >
                  {selectedNode.description}
                </p>

                {(() => {
                  const liveSelF = computeLiveFreshness(selectedNode);
                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: FG_MUT,
                            marginBottom: '3px',
                          }}
                        >
                          Confidence
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 4,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${selectedNode.confidence * 100}%`,
                                height: '100%',
                                background:
                                  selectedNode.confidence >= 0.85
                                    ? '#22c55e'
                                    : selectedNode.confidence >= 0.7
                                      ? '#f59e0b'
                                      : '#ef4444',
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color:
                                selectedNode.confidence >= 0.85
                                  ? '#22c55e'
                                  : selectedNode.confidence >= 0.7
                                    ? '#f59e0b'
                                    : '#ef4444',
                            }}
                          >
                            {Math.round(selectedNode.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: FG_MUT,
                            marginBottom: '3px',
                          }}
                        >
                          Freshness ·{' '}
                          <span style={{ color: freshnessColor(liveSelF) }}>
                            {freshnessLabel(liveSelF)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 4,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${liveSelF * 100}%`,
                                height: '100%',
                                background: freshnessColor(liveSelF),
                                borderRadius: 2,
                                transition: 'width 1.5s linear',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: freshnessColor(liveSelF),
                            }}
                          >
                            {Math.round(liveSelF * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div
                  style={{
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: FG_MUT,
                    marginBottom: '0.375rem',
                  }}
                >
                  <Clock style={{ width: 9, height: 9, display: 'inline', marginRight: 3 }} />
                  Last Seen: <strong style={{ color: FG }}>{selectedNode.lastSeen}</strong>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: FG_MUT,
                      marginBottom: '0.375rem',
                    }}
                  >
                    Provenance
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {selectedNode.provenance.map((p, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '8px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${BORDER}`,
                          color: FG_MUT,
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.875rem' }}>
                  <div
                    style={{
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: FG_MUT,
                      marginBottom: '0.375rem',
                    }}
                  >
                    Connected Edges
                  </div>
                  {model.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .slice(0, 6)
                    .map((edge) => {
                      const other =
                        edge.source === selectedNode.id
                          ? nodeMap.get(edge.target)
                          : nodeMap.get(edge.source);
                      const ec = EDGE_COLORS[edge.type] ?? '#6b7280';
                      return (
                        <div
                          key={edge.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0',
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          <ChevronRight style={{ width: 8, height: 8, color: ec, flexShrink: 0 }} />
                          <span style={{ fontSize: '9px', color: ec, fontWeight: 600 }}>
                            {edge.label}
                          </span>
                          <span style={{ fontSize: '9px', color: FG_MUT }}>
                            → {other?.label ?? '?'}
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '8px',
                              color: FG_MUT,
                              fontFamily: 'monospace',
                            }}
                          >
                            {Math.round(edge.confidence * 100)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${BORDER}` }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: FG_MUT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  World Model Summary
                </span>
              </div>
              <div style={{ padding: '1rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  {(
                    [
                      {
                        label: 'Nodes',
                        value: filteredNodes.length + '/' + model.meta.totalNodes,
                        color: FG,
                      },
                      {
                        label: 'Edges',
                        value: visibleEdges.length + '/' + model.meta.totalEdges,
                        color: FG,
                      },
                      { label: 'Stale', value: model.meta.staleDomains.length, color: '#ef4444' },
                      {
                        label: 'Refreshed',
                        value: new Date(model.meta.lastRefreshed).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        color: FG,
                      },
                    ] as Array<{ label: string; value: string | number; color: string }>
                  ).map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{ fontSize: '13px', fontWeight: 800, color: s.color, lineHeight: 1 }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: '8px',
                          color: FG_MUT,
                          marginTop: '2px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '0.875rem' }}>
                  <div
                    style={{
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: FG_MUT,
                      marginBottom: '0.5rem',
                    }}
                  >
                    Domain Freshness
                  </div>
                  {Object.entries(DOMAIN_COLORS)
                    .filter(([d]) => d !== 'szl-holdings' && d !== 'cognitive')
                    .map(([domain, color]) => {
                      const domainNode = model.nodes.find(
                        (n) => n.type === 'domain' && n.domain === domain,
                      );
                      if (!domainNode) return null;
                      const liveDomF = computeLiveFreshness(domainNode);
                      return (
                        <div
                          key={domain}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.375rem',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '9px',
                              color: FG,
                              flex: 1,
                              textTransform: 'capitalize',
                            }}
                          >
                            {domain}
                          </span>
                          <div
                            style={{
                              width: 50,
                              height: 3,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${liveDomF * 100}%`,
                                height: '100%',
                                background: freshnessColor(liveDomF),
                                borderRadius: 2,
                                transition: 'width 1.5s linear',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '8px',
                              color: freshnessColor(liveDomF),
                              fontWeight: 700,
                              minWidth: 24,
                              textAlign: 'right',
                            }}
                          >
                            {Math.round(liveDomF * 100)}%
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: FG_MUT,
                      marginBottom: '0.375rem',
                    }}
                  >
                    Node Types
                  </div>
                  {(['domain', 'entity', 'concept', 'agent'] as const).map((type) => {
                    const count = filteredNodes.filter((n) => n.type === type).length;
                    const shapes: Record<string, string> = {
                      domain: '●',
                      entity: '○',
                      concept: '▲',
                      agent: '■',
                    };
                    return (
                      <div
                        key={type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span style={{ fontSize: 10, color: ACCENT }}>{shapes[type]}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: FG,
                            flex: 1,
                            textTransform: 'capitalize',
                          }}
                        >
                          {type}
                        </span>
                        <span style={{ fontSize: '9px', color: FG_MUT, fontWeight: 600 }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CognitiveLayout>
  );
}
