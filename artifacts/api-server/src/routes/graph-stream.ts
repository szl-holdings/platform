import { Router, type IRouter, type Request, type Response } from "express";

/**
 * SSE stream of incremental World Model graph updates.
 *
 * Mounted as `/api/graph/stream`. Auth-optional and tenant-scope-bypassed so
 * the CONSTELLATION World Model can render live updates even in the demo /
 * unauthenticated dev preview. Authenticated callers see the same stream —
 * the events are derived from a curated demo pool of entities and edges that
 * rotate in/out so the graph feels alive without running an expensive
 * change-data-capture pipeline against the cst_* tables.
 *
 * Wire format (text/event-stream):
 *   event: hello          // connection established + server time
 *   event: entity.added   // payload is a single ConstellationNode
 *   event: edge.added     // payload is a single ConstellationEdge
 *   event: freshness.tick // payload: { now } — clients re-render decay bars
 *   : heartbeat           // 25s no-op keepalive comment
 */

const router: IRouter = Router();

interface CandidateNode {
  id: string;
  label: string;
  type: "domain" | "entity" | "concept" | "agent";
  domain: string;
  confidence: number;
  freshness: number;
  provenance: string[];
  description: string;
}

interface CandidateEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: "causal" | "associative" | "hierarchical" | "temporal" | "dependency";
  confidence: number;
  strength: number;
}

const CANDIDATE_NODES: CandidateNode[] = [
  { id: "e-voyage-vyg-217", label: "VYG-217", type: "entity", domain: "vessels", confidence: 0.92, freshness: 1.0, provenance: ["AIS live"], description: "New voyage VYG-217 — Singapore → Rotterdam, ETA 14d." },
  { id: "e-asset-dfw-19", label: "DFW-19", type: "entity", domain: "terra", confidence: 0.86, freshness: 1.0, provenance: ["LP Reports"], description: "Industrial asset DFW-19 onboarded into Q2 portfolio rollup." },
  { id: "e-cve-2026-441", label: "CVE-2026-441", type: "entity", domain: "aegis", confidence: 0.88, freshness: 1.0, provenance: ["NVD feed"], description: "New CVE flagged — affects two production services. CISO review pending." },
  { id: "e-slo-distress", label: "Distress SLO", type: "entity", domain: "lyte", confidence: 0.84, freshness: 1.0, provenance: ["API metrics"], description: "Distress engine SLO recovered — P95 back below 250ms after index rebuild." },
  { id: "e-deal-q2-7", label: "Deal Q2-07", type: "entity", domain: "prism", confidence: 0.79, freshness: 1.0, provenance: ["CRM"], description: "Enterprise deal Q2-07 advanced to legal review stage." },
  { id: "c-supply-risk", label: "Supply-Chain Risk", type: "concept", domain: "szl-holdings", confidence: 0.77, freshness: 1.0, provenance: ["ATLAS synthesis"], description: "Newly synthesized concept linking port congestion to LP-portfolio exposure." },
  { id: "a-recon-2", label: "Recon-Agent-2", type: "agent", domain: "cognitive", confidence: 0.71, freshness: 1.0, provenance: ["Self-model"], description: "Spawned by ATLAS to enrich CVE-2026-441 context. Running step 4 of 9." },
  { id: "e-fleet-charter-88", label: "Charter-88", type: "entity", domain: "vessels", confidence: 0.83, freshness: 1.0, provenance: ["Charter DB"], description: "New charter executed — adds two vessels to active fleet for 90 days." },
  { id: "c-cyber-financial", label: "Cyber→Financial", type: "concept", domain: "szl-holdings", confidence: 0.74, freshness: 1.0, provenance: ["ATLAS synthesis"], description: "Cross-domain concept linking Aegis posture to LP capital-call timing." },
  { id: "a-counsel-7", label: "Counsel-Agent-7", type: "agent", domain: "cognitive", confidence: 0.69, freshness: 1.0, provenance: ["Runtime state"], description: "Reviewing Deal Q2-07 contract clauses. Awaiting counsel approval." },
];

const CANDIDATE_EDGES: CandidateEdge[] = [
  { id: "se-1", source: "e-voyage-vyg-217", target: "d-vessels", label: "operates", type: "hierarchical", confidence: 0.92, strength: 0.9 },
  { id: "se-2", source: "e-asset-dfw-19", target: "e-lp", label: "rolls into", type: "hierarchical", confidence: 0.86, strength: 0.85 },
  { id: "se-3", source: "e-cve-2026-441", target: "e-threat", label: "added to", type: "associative", confidence: 0.84, strength: 0.7 },
  { id: "se-4", source: "e-cve-2026-441", target: "c-risk", label: "elevates", type: "causal", confidence: 0.78, strength: 0.8 },
  { id: "se-5", source: "a-recon-2", target: "e-cve-2026-441", label: "enriching", type: "dependency", confidence: 0.74, strength: 0.7 },
  { id: "se-6", source: "c-supply-risk", target: "c-risk", label: "feeds", type: "causal", confidence: 0.73, strength: 0.65 },
  { id: "se-7", source: "e-fleet-charter-88", target: "e-fleet", label: "extends", type: "hierarchical", confidence: 0.83, strength: 0.8 },
  { id: "se-8", source: "a-counsel-7", target: "e-deal-q2-7", label: "reviewing", type: "dependency", confidence: 0.69, strength: 0.7 },
  { id: "se-9", source: "c-cyber-financial", target: "e-lp", label: "informs timing", type: "causal", confidence: 0.74, strength: 0.6 },
  { id: "se-10", source: "e-slo-distress", target: "c-risk", label: "reduces", type: "associative", confidence: 0.7, strength: 0.55 },
];

router.get("/graph/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown): void => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* ignore write errors */
    }
  };

  send("hello", { now: Date.now() });

  // Per-connection randomized order so two viewers see slightly different
  // sequences and the demo doesn't feel scripted.
  const order = [...Array(CANDIDATE_NODES.length).keys()].sort(() => Math.random() - 0.5);
  const edgeOrder = [...Array(CANDIDATE_EDGES.length).keys()].sort(() => Math.random() - 0.5);
  let nodeIdx = 0;
  let edgeIdx = 0;

  // Map candidate template id -> the runtime (suffixed) id last emitted on
  // this connection. Used to rewrite edge endpoints so they point at the
  // entities the client actually received, instead of the unsuffixed
  // template ids that would be orphaned and dropped by the canvas filter.
  const candidateTemplateIds = new Set(CANDIDATE_NODES.map((n) => n.id));
  const runtimeIdByTemplate = new Map<string, string>();

  const emitEntity = (): void => {
    const tpl = CANDIDATE_NODES[order[nodeIdx % order.length]];
    nodeIdx++;
    const runtimeId = `${tpl.id}-${Date.now().toString(36)}`;
    runtimeIdByTemplate.set(tpl.id, runtimeId);
    send("entity.added", {
      ...tpl,
      // Per-connection unique id so reconnects don't collide on the client.
      id: runtimeId,
      lastSeen: "just now",
      lastSeenTs: Date.now(),
      discoveredTs: Date.now(),
    });
  };

  // Resolve an edge endpoint to either a previously-emitted runtime id (for
  // candidate-pool nodes) or pass through as-is (for static seed nodes such
  // as `e-lp`, `c-risk`, `e-threat`, `e-fleet`, `d-vessels` that the client
  // already has in its base graph).
  const resolveEndpoint = (endpoint: string): string | null => {
    if (candidateTemplateIds.has(endpoint)) {
      return runtimeIdByTemplate.get(endpoint) ?? null;
    }
    return endpoint;
  };

  const emitEdge = (): void => {
    // Walk the edge order until we find one whose endpoints are both
    // resolvable on the client. If none qualify yet (e.g. early in the
    // connection before candidate entities have been emitted), skip this
    // tick — the next entity emission will unlock more edges.
    for (let attempts = 0; attempts < edgeOrder.length; attempts++) {
      const tpl = CANDIDATE_EDGES[edgeOrder[(edgeIdx + attempts) % edgeOrder.length]];
      const source = resolveEndpoint(tpl.source);
      const target = resolveEndpoint(tpl.target);
      if (source && target) {
        edgeIdx = edgeIdx + attempts + 1;
        send("edge.added", {
          ...tpl,
          id: `${tpl.id}-${Date.now().toString(36)}`,
          source,
          target,
          lastActive: "just now",
          lastActiveTs: Date.now(),
        });
        return;
      }
    }
  };

  // First entity arrives quickly so the user immediately sees the stream is
  // live; subsequent entities space out so the graph doesn't stampede.
  const firstTimer = setTimeout(emitEntity, 2_000);
  const entityTimer = setInterval(emitEntity, 9_000);
  const edgeTimer = setInterval(emitEdge, 11_000);
  const decayTimer = setInterval(() => send("freshness.tick", { now: Date.now() }), 5_000);
  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(": heartbeat\n\n");
  }, 25_000);

  const cleanup = (): void => {
    clearTimeout(firstTimer);
    clearInterval(entityTimer);
    clearInterval(edgeTimer);
    clearInterval(decayTimer);
    clearInterval(heartbeat);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
});

export default router;
