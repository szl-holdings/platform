/**
 * Correlation Map
 *
 * Returns entity relationship graph data — nodes (entities across domains)
 * and edges (correlations/connections) for rendering as an interactive
 * network diagram in the Command Portal.
 *
 * Routes:
 *   GET /correlation-map          — full graph data (nodes + edges)
 *   GET /correlation-map/live     — live-updating snapshot with scoring
 */

import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";

const router: IRouter = Router();

interface GraphNode {
  id: string;
  label: string;
  type: "domain" | "entity" | "signal";
  domain: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  value?: number;
  description?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
  type: "causal" | "correlative" | "escalation" | "dependency";
  description: string;
  lastActive: number;
}

function buildGraph() {
  const nodes: GraphNode[] = [
    { id: "domain-vessels", label: "Vessels", type: "domain", domain: "vessels", value: 0.75, description: "Maritime intelligence & fleet tracking" },
    { id: "domain-aegis", label: "Aegis", type: "domain", domain: "aegis", severity: "critical", value: 0.91, description: "Cyber security operations" },
    { id: "domain-terra", label: "Terra", type: "domain", domain: "terra", severity: "high", value: 0.68, description: "Real estate intelligence" },
    { id: "domain-prism", label: "PRISM", type: "domain", domain: "prism", severity: "high", value: 0.72, description: "Legal & counsel operations" },
    { id: "domain-lyte", label: "Lyte", type: "domain", domain: "lyte", value: 0.35, description: "Infrastructure & observability" },
    { id: "domain-holdings", label: "Holdings", type: "domain", domain: "szl-holdings", severity: "medium", value: 0.62, description: "Portfolio & fund management" },
    { id: "domain-carlota", label: "Carlota Jo", type: "domain", domain: "carlota", value: 0.2, description: "Consulting & advisory" },

    { id: "entity-vessel-pacific", label: "MV Pacific Star", type: "entity", domain: "vessels", severity: "high", description: "IMO 9876543 — delayed 32h at Shanghai" },
    { id: "entity-port-shanghai", label: "Port of Shanghai", type: "entity", domain: "vessels", severity: "high", description: "Congestion index +18%; 5 vessels queued" },
    { id: "entity-apt41", label: "APT-41 Campaign", type: "entity", domain: "aegis", severity: "critical", description: "Nation-state threat actor — active lateral movement" },
    { id: "entity-incident-0412", label: "INC-2026-0412", type: "entity", domain: "aegis", severity: "critical", description: "Critical cyber incident — 47 assets affected" },
    { id: "entity-pudong-props", label: "Pudong Properties", type: "entity", domain: "terra", severity: "high", description: "12 properties with active construction timelines" },
    { id: "entity-contracts-mm", label: "8 Maritime Contracts", type: "entity", domain: "prism", severity: "high", description: "Contracts with delivery milestone clauses — force-majeure review" },
    { id: "entity-legal-hold", label: "Legal Hold — Cyber", type: "entity", domain: "prism", severity: "critical", description: "23 artifact sets under legal hold" },
    { id: "entity-fund3-lps", label: "Fund III LPs", type: "entity", domain: "szl-holdings", description: "87% LP confidence score — monitoring" },
    { id: "entity-nav", label: "Portfolio NAV", type: "entity", domain: "szl-holdings", severity: "medium", description: "$2.3B NAV — compound risk scenario active" },

    { id: "signal-port-delay", label: "Port Delay +32h", type: "signal", domain: "vessels", severity: "high", description: "Threshold exceeded — signal chain active" },
    { id: "signal-apt-detected", label: "APT-41 Detected", type: "signal", domain: "aegis", severity: "critical", description: "Critical threshold crossed — legal cascade triggered" },
    { id: "signal-volatility", label: "Volatility 0.72", type: "signal", domain: "szl-holdings", severity: "medium", description: "Market volatility above rebalance threshold" },
    { id: "signal-distress-spike", label: "18 Properties Distressed", type: "signal", domain: "terra", severity: "high", description: "Distress score spike from rate sensitivity" },
  ];

  const edges: GraphEdge[] = [
    { id: "e1", source: "entity-vessel-pacific", target: "entity-port-shanghai", label: "delayed at", strength: 0.95, type: "dependency", description: "MV Pacific Star is queued at Shanghai with 32h delay", lastActive: Date.now() - 3600000 },
    { id: "e2", source: "entity-port-shanghai", target: "entity-pudong-props", label: "supply chain risk →", strength: 0.87, type: "causal", description: "Port congestion delays construction materials for Pudong logistics corridor properties", lastActive: Date.now() - 3600000 },
    { id: "e3", source: "entity-port-shanghai", target: "entity-contracts-mm", label: "triggers review →", strength: 0.82, type: "causal", description: "Delay above threshold triggers force-majeure review in 8 maritime contracts", lastActive: Date.now() - 3600000 },
    { id: "e4", source: "signal-port-delay", target: "domain-terra", label: "cascades to", strength: 0.84, type: "escalation", description: "Maritime delay signal propagates to Terra domain via signal chain", lastActive: Date.now() - 3600000 },
    { id: "e5", source: "signal-port-delay", target: "domain-prism", label: "cascades to", strength: 0.80, type: "escalation", description: "Maritime delay signal triggers legal review chain in PRISM", lastActive: Date.now() - 3600000 },

    { id: "e6", source: "entity-apt41", target: "entity-incident-0412", label: "caused", strength: 0.99, type: "causal", description: "APT-41 is the attributed threat actor for the active incident", lastActive: Date.now() - 1800000 },
    { id: "e7", source: "entity-incident-0412", target: "entity-legal-hold", label: "triggered", strength: 0.95, type: "escalation", description: "Cyber incident triggered legal hold on all forensic artifacts", lastActive: Date.now() - 7200000 },
    { id: "e8", source: "signal-apt-detected", target: "domain-prism", label: "legal cascade →", strength: 0.91, type: "escalation", description: "APT-41 detection triggered security→legal signal chain", lastActive: Date.now() - 1800000 },
    { id: "e9", source: "signal-apt-detected", target: "entity-nav", label: "risk impact →", strength: 0.73, type: "correlative", description: "Cyber incident elevated portfolio risk score from 72→81", lastActive: Date.now() - 1800000 },

    { id: "e10", source: "signal-volatility", target: "domain-terra", label: "distress trigger →", strength: 0.78, type: "causal", description: "Market volatility triggered accelerated distress scoring refresh", lastActive: Date.now() - 3600000 },
    { id: "e11", source: "signal-volatility", target: "domain-vessels", label: "voyage economics →", strength: 0.65, type: "correlative", description: "Rate environment impacts trade route economics for fleet", lastActive: Date.now() - 3600000 },
    { id: "e12", source: "signal-distress-spike", target: "entity-fund3-lps", label: "sentiment risk →", strength: 0.6, type: "correlative", description: "Property distress levels may affect LP confidence in real estate thesis", lastActive: Date.now() - 7200000 },

    { id: "e13", source: "domain-lyte", target: "domain-aegis", label: "supports defense →", strength: 0.72, type: "dependency", description: "Lyte infrastructure health underpins Aegis SOC tooling and detection pipeline", lastActive: Date.now() - 14400000 },
    { id: "e14", source: "domain-aegis", target: "entity-nav", label: "risk factor →", strength: 0.68, type: "correlative", description: "Security posture is a direct input to portfolio risk scoring", lastActive: Date.now() - 3600000 },
    { id: "e15", source: "domain-prism", target: "entity-fund3-lps", label: "protects →", strength: 0.55, type: "dependency", description: "Legal team manages LP agreement compliance and dispute resolution", lastActive: Date.now() - 86400000 },
    { id: "e16", source: "domain-carlota", target: "entity-nav", label: "advisory alpha →", strength: 0.42, type: "correlative", description: "Consulting insights from Carlota Jo inform strategic portfolio decisions", lastActive: Date.now() - 86400000 },
  ];

  const stats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    criticalNodes: nodes.filter((n) => n.severity === "critical").length,
    highNodes: nodes.filter((n) => n.severity === "high").length,
    activeEdges: edges.filter((e) => e.lastActive > Date.now() - 86400000).length,
    strongCorrelations: edges.filter((e) => e.strength > 0.8).length,
    generatedAt: Date.now(),
  };

  return { nodes, edges, stats };
}

router.get(
  "/correlation-map",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (_req, res) => {
    const graph = buildGraph();
    res.json({ success: true, ...graph });
  }
);

router.get(
  "/correlation-map/live",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (_req, res) => {
    const graph = buildGraph();

    const jitter = () => (Math.random() - 0.5) * 0.04;
    graph.edges = graph.edges.map((e) => ({
      ...e,
      strength: Math.min(1, Math.max(0.1, e.strength + jitter())),
    }));

    res.json({ success: true, ...graph });
  }
);

export default router;
