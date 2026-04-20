import type { GraphEdge, GraphNode } from '@szl-holdings/design-system';
import type { Matter, Obligation, Party, PartyRole, ProofChainEntry } from '@/data/matters';
import { getObligationStatusColor } from '@/data/matters';

export const ACCENT = '#a78bfa';
export const FILING_COLOR = '#fbbf24';
export const CRITICAL_COLOR = '#ef4444';

export const ROLE_COLORS: Record<PartyRole, string> = {
  client: '#a78bfa',
  'opposing-counsel': '#f97316',
  regulator: '#ef4444',
  'third-party': '#6b7280',
  expert: '#38bdf8',
  'co-counsel': '#c4b5fd',
};

export type GraphNodeKind = 'party' | 'obligation' | 'filing';

export interface NodeData {
  kind: GraphNodeKind;
  party?: Party;
  obligation?: Obligation;
  filing?: ProofChainEntry;
}

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function computeLayout(
  nodeIds: string[],
  edges: { source: string; target: string }[],
  nodeKinds: Record<string, GraphNodeKind>,
  matterId: string,
): Record<string, { x: number; y: number }> {
  const rand = seededRand(hashStr(matterId));
  const sim: SimNode[] = nodeIds.map((id) => {
    const kind = nodeKinds[id];
    let baseX = 0.5;
    if (kind === 'party') baseX = 0.18;
    else if (kind === 'filing') baseX = 0.82;
    return {
      id,
      x: baseX + (rand() - 0.5) * 0.2,
      y: 0.1 + rand() * 0.8,
      vx: 0,
      vy: 0,
    };
  });

  const idx: Record<string, number> = {};
  sim.forEach((n, i) => (idx[n.id] = i));

  const REPULSION = 0.012;
  const SPRING = 0.04;
  const SPRING_LEN = 0.22;
  const CENTER = 0.002;
  const DAMP = 0.82;
  const ITER = 240;

  for (let it = 0; it < ITER; it++) {
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i];
        const b = sim[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 0.001;
        const f = REPULSION / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    for (const e of edges) {
      const a = sim[idx[e.source]];
      const b = sim[idx[e.target]];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
      const f = SPRING * (d - SPRING_LEN);
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const n of sim) {
      const kind = nodeKinds[n.id];
      const targetX = kind === 'party' ? 0.18 : kind === 'filing' ? 0.82 : 0.5;
      n.vx += (targetX - n.x) * (kind === 'obligation' ? CENTER : CENTER * 8);
      n.vy += (0.5 - n.y) * CENTER;

      n.vx *= DAMP;
      n.vy *= DAMP;
      n.x += n.vx;
      n.y += n.vy;

      n.x = Math.max(0.06, Math.min(0.94, n.x));
      n.y = Math.max(0.08, Math.min(0.92, n.y));
    }
  }

  const out: Record<string, { x: number; y: number }> = {};
  for (const n of sim) out[n.id] = { x: n.x, y: n.y };
  return out;
}

export function computeCriticalPath(obligations: Obligation[]): Set<string> {
  const critical = new Set<string>();
  const byId = new Map(obligations.map((o) => [o.id, o]));
  const dependents = new Map<string, string[]>();
  for (const o of obligations) {
    for (const dep of o.dependencies) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(o.id);
    }
  }

  const seeds = obligations.filter((o) => o.status === 'at-risk' || o.status === 'overdue');
  for (const seed of seeds) {
    const stackUp = [seed.id];
    while (stackUp.length) {
      const cur = stackUp.pop()!;
      if (critical.has(cur)) continue;
      critical.add(cur);
      const node = byId.get(cur);
      if (node) for (const d of node.dependencies) stackUp.push(d);
    }
    const stackDown = [seed.id];
    while (stackDown.length) {
      const cur = stackDown.pop()!;
      const kids = dependents.get(cur) ?? [];
      for (const k of kids) {
        if (!critical.has(k)) {
          critical.add(k);
          stackDown.push(k);
        }
      }
    }
  }
  return critical;
}

export interface BuiltGraph {
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  nodeData: Record<string, NodeData>;
  criticalIds: Set<string>;
}

export interface BuildGraphOptions {
  selectedId?: string | null;
  /** When true, emit smaller node radii and thinner labels for thumbnails. */
  compact?: boolean;
  /**
   * User-defined node positions (normalized 0..1) that take precedence over the
   * computed force-directed layout. Used by the full Obligation Graph view to
   * persist drag-to-reposition placements.
   */
  overrides?: Record<string, { x: number; y: number }>;
}

export function buildGraph(matter: Matter, options: BuildGraphOptions = {}): BuiltGraph {
  const { selectedId = null, compact = false, overrides = {} } = options;
  const filings = matter.proofChain.filter((p) => p.eventType === 'filing');
  const criticalObligIds = computeCriticalPath(matter.obligations);
  const criticalIds = new Set<string>();

  const nodeData: Record<string, NodeData> = {};
  const nodeKinds: Record<string, GraphNodeKind> = {};
  const ids: string[] = [];
  const edgesIn: { source: string; target: string }[] = [];

  for (const p of matter.parties) {
    const id = `party:${p.id}`;
    ids.push(id);
    nodeKinds[id] = 'party';
    nodeData[id] = { kind: 'party', party: p };
  }

  for (const o of matter.obligations) {
    const id = `oblig:${o.id}`;
    ids.push(id);
    nodeKinds[id] = 'obligation';
    nodeData[id] = { kind: 'obligation', obligation: o };
    if (criticalObligIds.has(o.id)) criticalIds.add(id);
  }

  for (const f of filings) {
    const id = `filing:${f.id}`;
    ids.push(id);
    nodeKinds[id] = 'filing';
    nodeData[id] = { kind: 'filing', filing: f };
  }

  for (const o of matter.obligations) {
    for (const dep of o.dependencies) {
      const src = `oblig:${dep}`;
      const tgt = `oblig:${o.id}`;
      if (nodeData[src] && nodeData[tgt]) {
        edgesIn.push({ source: src, target: tgt });
      }
    }
  }

  const client = matter.parties.find((p) => p.role === 'client');
  if (client) {
    const clientId = `party:${client.id}`;
    for (const o of matter.obligations) {
      if (o.dependencies.length === 0) {
        edgesIn.push({ source: clientId, target: `oblig:${o.id}` });
      }
    }
  }

  for (const p of matter.parties) {
    if (p.role !== 'regulator' && p.role !== 'opposing-counsel') continue;
    const partyId = `party:${p.id}`;
    let connected = false;
    for (const o of matter.obligations) {
      if (o.courtId && p.role === 'regulator') {
        edgesIn.push({ source: `oblig:${o.id}`, target: partyId });
        connected = true;
      }
    }
    if (!connected) {
      const firstFiling = filings[0];
      if (firstFiling) edgesIn.push({ source: partyId, target: `filing:${firstFiling.id}` });
    }
  }

  for (const p of matter.parties) {
    if (p.role !== 'expert' && p.role !== 'third-party' && p.role !== 'co-counsel') continue;
    const partyId = `party:${p.id}`;
    const target = matter.obligations.find(
      (o) => o.status === 'in-progress' || o.status === 'at-risk',
    );
    if (target) edgesIn.push({ source: partyId, target: `oblig:${target.id}` });
  }

  if (filings.length > 0) {
    const filingObligs = matter.obligations.filter((o) => o.filingRequired);
    filingObligs.forEach((o, i) => {
      const f = filings[i % filings.length];
      edgesIn.push({ source: `oblig:${o.id}`, target: `filing:${f.id}` });
    });
  }

  const layout = computeLayout(ids, edgesIn, nodeKinds, matter.id);

  const radiusScale = compact ? 0.5 : 1;

  const graphNodes: GraphNode[] = ids.map((id) => {
    const data = nodeData[id];
    const pos = layout[id];
    const isSelected = selectedId === id;
    const isCritical = criticalIds.has(id);

    if (data.kind === 'party') {
      const p = data.party!;
      const color = ROLE_COLORS[p.role];
      return {
        id,
        label: p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name,
        x: pos.x,
        y: pos.y,
        radius: (isSelected ? 12 : 9) * radiusScale,
        color,
        ringColor: isSelected ? color : undefined,
      };
    }
    if (data.kind === 'obligation') {
      const o = data.obligation!;
      const color = getObligationStatusColor(o.status);
      const ring = isCritical ? CRITICAL_COLOR : isSelected ? color : undefined;
      return {
        id,
        label: o.title.length > 26 ? o.title.slice(0, 24) + '…' : o.title,
        x: pos.x,
        y: pos.y,
        radius: (isSelected ? 13 : isCritical ? 11 : 9) * radiusScale,
        color,
        ringColor: ring,
      };
    }
    const f = data.filing!;
    return {
      id,
      label: f.title.length > 24 ? f.title.slice(0, 22) + '…' : f.title,
      x: pos.x,
      y: pos.y,
      radius: (isSelected ? 12 : 9) * radiusScale,
      color: FILING_COLOR,
      ringColor: isSelected ? FILING_COLOR : undefined,
    };
  });

  const graphEdges: GraphEdge[] = edgesIn.map((e, i) => {
    const srcKind = nodeData[e.source]?.kind;
    const tgtKind = nodeData[e.target]?.kind;
    const isDep = srcKind === 'obligation' && tgtKind === 'obligation';
    const isFilingFlow = srcKind === 'obligation' && tgtKind === 'filing';
    const isDirected = isDep || isFilingFlow;
    const onCritical = isDep && criticalIds.has(e.source) && criticalIds.has(e.target);
    return {
      id: `e${i}:${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      color: onCritical
        ? CRITICAL_COLOR
        : isDep
          ? 'rgba(167,139,250,0.55)'
          : isFilingFlow
            ? 'rgba(251,191,36,0.45)'
            : 'rgba(255,255,255,0.10)',
      weight: (onCritical ? 1.8 : isDep ? 1.3 : isFilingFlow ? 1.1 : 0.8) * (compact ? 0.7 : 1),
      dashed: !isDirected,
      directed: isDirected && !compact,
    };
  });

  return { graphNodes, graphEdges, nodeData, criticalIds };
}
