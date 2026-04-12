import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch, Zap, Clock, DollarSign,
  Target, BarChart3, Bell, Shield,
  RefreshCw, ArrowRight, Flame, Star
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ? `${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api` : "/api";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type RiskLevel = "critical" | "high" | "moderate" | "low" | "healthy";
type NodeType = "property" | "entity" | "lender" | "guarantor";

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  riskLevel: RiskLevel;
  distressScore: number;
  contagionProb: number;
  address?: string;
  borough?: string;
  dscr?: number;
  taxDelinquency?: number;
  avm?: number;
  units?: number;
  isSource?: boolean;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "ownership" | "cross-collateral" | "shared-lender" | "guarantor" | "co-management";
  weight: number;
  contagionWeight: number;
}

interface ContagionNetwork {
  id: string;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  networkRiskScore: number;
  totalAVM: number;
  activeDistressNodes: number;
  predictedContagionTargets: number;
  sourcePropertyId: string;
}

interface DominoAlert {
  id: string;
  networkId: string;
  networkName: string;
  sourceAddress: string;
  targetAddress: string;
  trigger: string;
  contagionProbability: number;
  timeToContagion: string;
  timestamp: string;
  severity: "critical" | "high" | "moderate";
}

interface FirstMoverOpportunity {
  id: string;
  address: string;
  borough: string;
  avm: number;
  predictedDistressWindow: string;
  contagionProbability: number;
  acquisitionAttractiveness: number;
  networkName: string;
  distressTrigger: string;
  estimatedDiscount: number;
  daysToAct: number;
}

interface HistoricalEvent {
  id: string;
  year: number;
  networkName: string;
  sourceAddress: string;
  cascadeDepth: number;
  affectedProperties: number;
  totalValueAtRisk: number;
  predictionAccuracy: number;
  timeToContagion: string;
}

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  critical: { color: "#ef4444", bg: "#ef444418", label: "Critical" },
  high: { color: "#f97316", bg: "#f9731618", label: "High" },
  moderate: { color: "#f59e0b", bg: "#f59e0b18", label: "Moderate" },
  low: { color: "#c8a060", bg: "#c8a06018", label: "Low Risk" },
  healthy: { color: "#22c55e", bg: "#22c55e18", label: "Healthy" },
};

const NODE_TYPE_CONFIG: Record<NodeType, { color: string; symbol: string }> = {
  property: { color: "#c8a060", symbol: "□" },
  entity: { color: "#7ba3d4", symbol: "◇" },
  lender: { color: "#a78bfa", symbol: "△" },
  guarantor: { color: "#64748b", symbol: "○" },
};

const EDGE_TYPE_CONFIG: Record<GraphEdge["type"], { color: string; dash: string; label: string }> = {
  ownership: { color: "#c8a060", dash: "none", label: "Ownership" },
  "cross-collateral": { color: "#ef4444", dash: "6,3", label: "Cross-Collateral" },
  "shared-lender": { color: "#a78bfa", dash: "3,3", label: "Shared Lender" },
  guarantor: { color: "#f59e0b", dash: "8,4", label: "Guarantor" },
  "co-management": { color: "#64748b", dash: "2,4", label: "Co-Management" },
};

const NETWORKS: ContagionNetwork[] = [
  {
    id: "net-harbor",
    name: "Harbor View RE Network",
    networkRiskScore: 87,
    totalAVM: 9_800_000,
    activeDistressNodes: 2,
    predictedContagionTargets: 3,
    sourcePropertyId: "n-p1",
    nodes: [
      { id: "n-e1", label: "Harbor View RE LLC", type: "entity", riskLevel: "critical", distressScore: 89, contagionProb: 100, x: 400, y: 220 },
      { id: "n-p1", label: "412 E 148th St", type: "property", riskLevel: "critical", distressScore: 94, contagionProb: 100, address: "412 E 148th St", borough: "Bronx", dscr: 0.68, taxDelinquency: 340000, avm: 1_400_000, units: 10, isSource: true, x: 200, y: 120 },
      { id: "n-p2", label: "228 W 145th St", type: "property", riskLevel: "high", distressScore: 64, contagionProb: 82, address: "228 W 145th St", borough: "Manhattan", dscr: 0.81, taxDelinquency: 140000, avm: 3_200_000, units: 13, x: 600, y: 120 },
      { id: "n-p3", label: "811 E 163rd St", type: "property", riskLevel: "moderate", distressScore: 51, contagionProb: 67, address: "811 E 163rd St", borough: "Bronx", dscr: 1.04, taxDelinquency: 0, avm: 2_100_000, units: 9, x: 700, y: 340 },
      { id: "n-l1", label: "Arbor Realty Trust", type: "lender", riskLevel: "healthy", distressScore: 0, contagionProb: 0, x: 120, y: 340 },
      { id: "n-g1", label: "Michael Harmon", type: "guarantor", riskLevel: "high", distressScore: 71, contagionProb: 0, x: 380, y: 400 },
      { id: "n-p4", label: "73 Macon St", type: "property", riskLevel: "critical", distressScore: 83, contagionProb: 74, address: "73 Macon St", borough: "Brooklyn", dscr: 0, taxDelinquency: 0, avm: 890_000, units: 8, x: 250, y: 400 },
    ],
    edges: [
      { source: "n-e1", target: "n-p1", type: "ownership", weight: 1, contagionWeight: 1 },
      { source: "n-e1", target: "n-p2", type: "ownership", weight: 1, contagionWeight: 0.82 },
      { source: "n-e1", target: "n-p3", type: "ownership", weight: 1, contagionWeight: 0.67 },
      { source: "n-e1", target: "n-p4", type: "ownership", weight: 1, contagionWeight: 0.74 },
      { source: "n-p1", target: "n-p2", type: "cross-collateral", weight: 0.9, contagionWeight: 0.85 },
      { source: "n-l1", target: "n-p1", type: "shared-lender", weight: 0.6, contagionWeight: 0.4 },
      { source: "n-l1", target: "n-p2", type: "shared-lender", weight: 0.6, contagionWeight: 0.4 },
      { source: "n-g1", target: "n-e1", type: "guarantor", weight: 0.8, contagionWeight: 0.6 },
    ],
  },
  {
    id: "net-lincoln",
    name: "Lincoln Holdings Trust Network",
    networkRiskScore: 73,
    totalAVM: 5_200_000,
    activeDistressNodes: 1,
    predictedContagionTargets: 2,
    sourcePropertyId: "lh-p1",
    nodes: [
      { id: "lh-e1", label: "Lincoln Holdings Trust", type: "entity", riskLevel: "high", distressScore: 76, contagionProb: 100, x: 350, y: 200 },
      { id: "lh-p1", label: "854 Lincoln Ave", type: "property", riskLevel: "high", distressScore: 78, contagionProb: 100, address: "854 Lincoln Ave", borough: "Bronx", dscr: 0.84, taxDelinquency: 180000, avm: 1_800_000, units: 12, isSource: true, x: 180, y: 100 },
      { id: "lh-p2", label: "907 Prospect Ave", type: "property", riskLevel: "moderate", distressScore: 55, contagionProb: 71, address: "907 Prospect Ave", borough: "Bronx", dscr: 1.1, taxDelinquency: 0, avm: 1_600_000, units: 8, x: 550, y: 100 },
      { id: "lh-p3", label: "1245 Grand Concourse", type: "property", riskLevel: "moderate", distressScore: 48, contagionProb: 58, address: "1245 Grand Concourse", borough: "Bronx", dscr: 1.18, taxDelinquency: 0, avm: 1_800_000, units: 11, x: 600, y: 320 },
      { id: "lh-l1", label: "Valley National Bank", type: "lender", riskLevel: "healthy", distressScore: 0, contagionProb: 0, x: 100, y: 320 },
    ],
    edges: [
      { source: "lh-e1", target: "lh-p1", type: "ownership", weight: 1, contagionWeight: 1 },
      { source: "lh-e1", target: "lh-p2", type: "ownership", weight: 1, contagionWeight: 0.71 },
      { source: "lh-e1", target: "lh-p3", type: "ownership", weight: 1, contagionWeight: 0.58 },
      { source: "lh-p1", target: "lh-p2", type: "cross-collateral", weight: 0.8, contagionWeight: 0.7 },
      { source: "lh-l1", target: "lh-p1", type: "shared-lender", weight: 0.5, contagionWeight: 0.3 },
      { source: "lh-l1", target: "lh-p2", type: "shared-lender", weight: 0.5, contagionWeight: 0.3 },
    ],
  },
];

const DOMINO_ALERTS: DominoAlert[] = [
  {
    id: "da-001", networkId: "net-harbor", networkName: "Harbor View RE", sourceAddress: "412 E 148th St",
    targetAddress: "228 W 145th St", trigger: "Cross-collateral breach — 412 E 148th acceleration triggers 228 W 145th covenant violation",
    contagionProbability: 82, timeToContagion: "30–60 days", timestamp: "2 hours ago", severity: "critical",
  },
  {
    id: "da-002", networkId: "net-harbor", networkName: "Harbor View RE", sourceAddress: "412 E 148th St",
    targetAddress: "73 Macon St", trigger: "Shared guarantor personal guarantee will be called — cascades to Macon asset",
    contagionProbability: 74, timeToContagion: "60–90 days", timestamp: "2 hours ago", severity: "high",
  },
  {
    id: "da-003", networkId: "net-lincoln", networkName: "Lincoln Holdings Trust", sourceAddress: "854 Lincoln Ave",
    targetAddress: "907 Prospect Ave", trigger: "Cross-collateral note acceleration — owner liquidity exhaustion likely",
    contagionProbability: 71, timeToContagion: "45–75 days", timestamp: "6 hours ago", severity: "high",
  },
  {
    id: "da-004", networkId: "net-harbor", networkName: "Harbor View RE", sourceAddress: "412 E 148th St",
    targetAddress: "811 E 163rd St", trigger: "LLC entity distress spreading — owner cannot service multiple notes simultaneously",
    contagionProbability: 67, timeToContagion: "90–120 days", timestamp: "2 hours ago", severity: "high",
  },
];

const FIRST_MOVER_QUEUE: FirstMoverOpportunity[] = [
  {
    id: "fm-001", address: "228 W 145th St", borough: "Manhattan", avm: 3_200_000,
    predictedDistressWindow: "30–60 days", contagionProbability: 82, acquisitionAttractiveness: 91,
    networkName: "Harbor View RE", distressTrigger: "Cross-collateral cascade from 412 E 148th",
    estimatedDiscount: 18, daysToAct: 45,
  },
  {
    id: "fm-002", address: "73 Macon St", borough: "Brooklyn", avm: 890_000,
    predictedDistressWindow: "60–90 days", contagionProbability: 74, acquisitionAttractiveness: 84,
    networkName: "Harbor View RE", distressTrigger: "Guarantor call triggers portfolio liquidation",
    estimatedDiscount: 22, daysToAct: 70,
  },
  {
    id: "fm-003", address: "907 Prospect Ave", borough: "Bronx", avm: 1_600_000,
    predictedDistressWindow: "45–75 days", contagionProbability: 71, acquisitionAttractiveness: 79,
    networkName: "Lincoln Holdings Trust", distressTrigger: "Cross-collateral note acceleration",
    estimatedDiscount: 16, daysToAct: 55,
  },
  {
    id: "fm-004", address: "811 E 163rd St", borough: "Bronx", avm: 2_100_000,
    predictedDistressWindow: "90–120 days", contagionProbability: 67, acquisitionAttractiveness: 73,
    networkName: "Harbor View RE", distressTrigger: "Entity-level distress contagion",
    estimatedDiscount: 14, daysToAct: 100,
  },
  {
    id: "fm-005", address: "1245 Grand Concourse", borough: "Bronx", avm: 1_800_000,
    predictedDistressWindow: "75–105 days", contagionProbability: 58, acquisitionAttractiveness: 68,
    networkName: "Lincoln Holdings Trust", distressTrigger: "Owner liquidity exhaustion cascade",
    estimatedDiscount: 12, daysToAct: 85,
  },
];

const HISTORICAL_EVENTS: HistoricalEvent[] = [
  { id: "he-001", year: 2023, networkName: "Signature Bank CRE Portfolio", sourceAddress: "1407 Broadway, Manhattan", cascadeDepth: 4, affectedProperties: 23, totalValueAtRisk: 340_000_000, predictionAccuracy: 94, timeToContagion: "28 days" },
  { id: "he-002", year: 2022, networkName: "Clipper Equity Holdings", sourceAddress: "1500 Bushwick Ave, Brooklyn", cascadeDepth: 3, affectedProperties: 11, totalValueAtRisk: 87_000_000, predictionAccuracy: 88, timeToContagion: "44 days" },
  { id: "he-003", year: 2020, networkName: "GFI Management Network", sourceAddress: "310 W 52nd St, Manhattan", cascadeDepth: 5, affectedProperties: 34, totalValueAtRisk: 520_000_000, predictionAccuracy: 91, timeToContagion: "62 days" },
  { id: "he-004", year: 2019, networkName: "Pinnacle Group LLC Network", sourceAddress: "820 Grand Concourse, Bronx", cascadeDepth: 2, affectedProperties: 7, totalValueAtRisk: 48_000_000, predictionAccuracy: 86, timeToContagion: "38 days" },
  { id: "he-005", year: 2018, networkName: "Domain Companies Portfolio", sourceAddress: "225 Eastern Pkwy, Brooklyn", cascadeDepth: 3, affectedProperties: 9, totalValueAtRisk: 72_000_000, predictionAccuracy: 79, timeToContagion: "51 days" },
];

type ActiveTab = "graph" | "alerts" | "first-mover" | "history";

function NodeCircle({ node, isSelected, onClick }: { node: GraphNode; isSelected: boolean; onClick: () => void }) {
  const cfg = RISK_CONFIG[node.riskLevel];
  const typeCfg = NODE_TYPE_CONFIG[node.type];
  const r = node.type === "property" ? 24 : node.type === "entity" ? 20 : 14;

  return (
    <g transform={`translate(${node.x},${node.y})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {node.isSource && (
        <circle r={r + 10} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.6}>
          <animate attributeName="r" values={`${r + 8};${r + 14};${r + 8}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {node.contagionProb > 0 && node.contagionProb < 100 && (
        <circle r={r + 6} fill="none" stroke={cfg.color} strokeWidth={1} opacity={0.3} strokeDasharray="3,2" />
      )}
      <circle r={r} fill={cfg.bg} stroke={isSelected ? "#fff" : cfg.color} strokeWidth={isSelected ? 2 : 1.5} />
      <text textAnchor="middle" dominantBaseline="central" fill={typeCfg.color} fontSize={node.type === "property" ? 13 : 10} fontWeight={700}>
        {node.type === "property" ? String(node.distressScore) : node.type === "entity" ? "LLC" : node.type === "lender" ? "$" : "G"}
      </text>
      {node.contagionProb > 0 && node.contagionProb < 100 && (
        <text y={r + 10} textAnchor="middle" fill={cfg.color} fontSize={8} fontWeight={600}>{node.contagionProb}%</text>
      )}
      <text y={r + (node.contagionProb > 0 && node.contagionProb < 100 ? 20 : 12)} textAnchor="middle" fill={TEXT.secondary} fontSize={8} fontWeight={500} style={{ maxWidth: "80px" }}>
        {node.label.length > 14 ? node.label.slice(0, 12) + "…" : node.label}
      </text>
    </g>
  );
}

function EdgeLine({ edge, nodes }: { edge: GraphEdge; nodes: GraphNode[] }) {
  const src = nodes.find(n => n.id === edge.source);
  const tgt = nodes.find(n => n.id === edge.target);
  if (!src || !tgt) return null;

  const cfg = EDGE_TYPE_CONFIG[edge.type];
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / dist;
  const normY = dy / dist;
  const srcR = src.type === "property" ? 24 : src.type === "entity" ? 20 : 14;
  const tgtR = tgt.type === "property" ? 24 : tgt.type === "entity" ? 20 : 14;

  const x1 = src.x + normX * srcR;
  const y1 = src.y + normY * srcR;
  const x2 = tgt.x - normX * tgtR;
  const y2 = tgt.y - normY * tgtR;

  const opacity = 0.3 + edge.contagionWeight * 0.5;

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={cfg.color}
      strokeWidth={1 + edge.contagionWeight * 1.5}
      strokeDasharray={cfg.dash}
      opacity={opacity}
      markerEnd={`url(#arrow-${edge.type.replace("-", "")})`}
    />
  );
}

function ContagionGraph({ network, selectedNodeId, onSelectNode }: {
  network: ContagionNetwork;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: BG.page, borderRadius: 12, border: `1px solid ${BORDER.muted}`, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 800 480" style={{ display: "block" }}>
        <defs>
          {(Object.entries(EDGE_TYPE_CONFIG) as [GraphEdge["type"], typeof EDGE_TYPE_CONFIG[GraphEdge["type"]]][]).map(([type, cfg]) => (
            <marker
              key={type}
              id={`arrow-${type.replace("-", "")}`}
              markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={cfg.color} opacity={0.6} />
            </marker>
          ))}
          <radialGradient id="glow-critical" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {network.nodes.filter(n => n.isSource).map(n => (
          <circle key={`glow-${n.id}`} cx={n.x} cy={n.y} r={60} fill="url(#glow-critical)" />
        ))}

        {network.edges.map((edge, i) => (
          <EdgeLine key={i} edge={edge} nodes={network.nodes} />
        ))}
        {network.nodes.map(node => (
          <NodeCircle
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onClick={() => onSelectNode(selectedNodeId === node.id ? null : node.id)}
          />
        ))}
      </svg>

      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6, background: BG.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER.muted}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Legend</div>
        {(Object.entries(EDGE_TYPE_CONFIG) as [GraphEdge["type"], typeof EDGE_TYPE_CONFIG[GraphEdge["type"]]][]).map(([type, cfg]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={28} height={8}>
              <line x1={0} y1={4} x2={28} y2={4} stroke={cfg.color} strokeWidth={1.5} strokeDasharray={cfg.dash} opacity={0.8} />
            </svg>
            <span style={{ fontSize: 9, color: TEXT.tertiary }}>{cfg.label}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${BORDER.subtle}`, marginTop: 4, paddingTop: 6 }}>
          {(["critical", "high", "moderate", "healthy"] as RiskLevel[]).map(lvl => (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: RISK_CONFIG[lvl].color }} />
              <span style={{ fontSize: 9, color: TEXT.tertiary }}>{RISK_CONFIG[lvl].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
        <div style={{ background: BG.surface, borderRadius: 8, padding: "6px 10px", border: `1px solid ${BORDER.muted}`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} className="animate-pulse" />
          <span style={{ fontSize: 10, color: TEXT.secondary }}>Active distress source</span>
        </div>
        <div style={{ background: BG.surface, borderRadius: 8, padding: "6px 10px", border: `1px solid ${BORDER.muted}` }}>
          <span style={{ fontSize: 10, color: TEXT.secondary }}>Network Score: </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: network.networkRiskScore >= 70 ? "#ef4444" : "#f97316" }}>{network.networkRiskScore}</span>
        </div>
      </div>
    </div>
  );
}

function NodeDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const cfg = RISK_CONFIG[node.riskLevel];
  return (
    <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.muted}`, padding: "16px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{node.label}</span>
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
        </div>
        <button onClick={onClose} style={{ fontSize: 11, color: TEXT.tertiary, cursor: "pointer", background: "none", border: "none", padding: 0 }}>✕</button>
      </div>
      {node.type === "property" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Distress Score", value: `${node.distressScore}/100`, color: node.distressScore >= 70 ? "#ef4444" : node.distressScore >= 40 ? "#f59e0b" : "#22c55e" },
            { label: "Contagion Probability", value: node.isSource ? "Source" : `${node.contagionProb}%`, color: node.contagionProb >= 70 ? "#ef4444" : node.contagionProb >= 40 ? "#f59e0b" : "#22c55e" },
            { label: "AVM", value: node.avm ? `$${(node.avm / 1e6).toFixed(2)}M` : "N/A", color: TEXT.primary },
            { label: "Units", value: node.units ? String(node.units) : "N/A", color: TEXT.primary },
            { label: "DSCR", value: node.dscr !== undefined ? (node.dscr > 0 ? `${node.dscr}x` : "N/A") : "N/A", color: node.dscr !== undefined && node.dscr < 1 ? "#ef4444" : TEXT.primary },
            { label: "Tax Arrears", value: node.taxDelinquency ? `$${(node.taxDelinquency / 1000).toFixed(0)}K` : "None", color: node.taxDelinquency ? "#ef4444" : "#22c55e" },
          ].map(m => (
            <div key={m.label} style={{ background: BG.elevated, borderRadius: 7, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
      {node.type === "entity" && (
        <div style={{ fontSize: 12, color: TEXT.secondary }}>Entity node — primary ownership vehicle. Distress in this LLC propagates to all owned properties simultaneously.</div>
      )}
      {node.type === "lender" && (
        <div style={{ fontSize: 12, color: TEXT.secondary }}>Shared lender — when any property in this portfolio defaults, lender exposure triggers review of all co-financed assets.</div>
      )}
      {node.type === "guarantor" && (
        <div style={{ fontSize: 12, color: TEXT.secondary }}>Personal guarantor — if called on any note, the guarantor's personal liquidity impacts all guaranteed assets.</div>
      )}
    </div>
  );
}

function ContagionRiskBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#ef4444" : score >= 60 ? "#f97316" : score >= 40 ? "#f59e0b" : "#22c55e";
  const label = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Moderate" : "Low";
  const circumference = 2 * Math.PI * 20;
  const progress = (score / 100) * circumference;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle
          cx={26} cy={26} r={20} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform="rotate(-90 26 26)"
        />
        <text x={26} y={29} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>{score}</text>
      </svg>
      <span style={{ fontSize: 8, color, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

interface ApiDominoAlert {
  networkId: string;
  networkName: string;
  sourceAddress: string;
  targetAddress: string;
  contagionProbability: number;
  severity: string;
  estimatedTimeframeDays: number;
  primaryLinkageFactors?: string[];
}

interface ApiFirstMoverItem {
  networkId: string;
  address: string;
  borough: string;
  avm: number;
  contagionProbability: number;
  acquisitionAttractiveness: number;
  networkName: string;
  estimatedDiscount: number;
  predictedWindowDays: number;
  distressTrigger?: string;
}

interface ApiNetworkSummary {
  id: string;
  name: string;
  networkRiskScore: number;
  totalAVM: number;
  activeDistressNodes: number;
  predictedContagionTargets: number;
}

interface ApiContagionData {
  status: string;
  modelVersion?: string;
  contagionFactorWeights?: Record<string, number>;
  networks: ApiNetworkSummary[];
  dominoAlerts: ApiDominoAlert[];
  firstMoverQueue: ApiFirstMoverItem[];
  historicalBacktest?: {
    eventsModeled: number;
    avgPredictionAccuracy: number;
    avgTimeToContagionDays: number;
    totalPropertiesInCascades: number;
  };
  fetchedAt: string;
}

export default function DistressContagionGraph() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("graph");
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(NETWORKS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<"all" | "critical" | "high" | "moderate">("all");

  const { data: liveData, isSuccess: liveDataLoaded } = useQuery<{ data: ApiContagionData }>({
    queryKey: ["terra-contagion-networks"],
    queryFn: () => fetch(`/api/terra/contagion/networks`).then(r => r.json()),
    staleTime: 120_000,
    retry: 1,
  });

  const liveNetworksList = liveData?.data?.networks ?? [];
  const liveAlertsList: ApiDominoAlert[] = liveData?.data?.dominoAlerts ?? [];
  const liveFirstMoverList: ApiFirstMoverItem[] = liveData?.data?.firstMoverQueue ?? [];
  const liveHistoricalBacktest = liveData?.data?.historicalBacktest;
  const isLiveMode = liveDataLoaded && liveData?.data?.status === "computed" && liveNetworksList.length > 0;

  const selectedNetwork = NETWORKS.find(n => n.id === selectedNetworkId) ?? NETWORKS[0];
  const selectedNode = selectedNodeId ? selectedNetwork.nodes.find(n => n.id === selectedNodeId) ?? null : null;

  type NormalizedAlert = {
    id: string;
    networkId: string;
    networkName: string;
    sourceAddress: string;
    targetAddress: string;
    trigger: string;
    contagionProbability: number;
    timeToContagion: string;
    timestamp: string;
    severity: "critical" | "high" | "moderate";
    primaryLinkageFactors?: string[];
  };

  type NormalizedFirstMover = {
    id: string;
    address: string;
    borough: string;
    avm: number;
    predictedDistressWindow: string;
    contagionProbability: number;
    acquisitionAttractiveness: number;
    networkName: string;
    distressTrigger: string;
    estimatedDiscount: number;
    daysToAct: number;
  };

  const normalizedAlerts: NormalizedAlert[] = (isLiveMode && liveAlertsList.length > 0
    ? liveAlertsList.map((a, i) => ({
        id: `live-alert-${i}`,
        networkId: a.networkId,
        networkName: a.networkName,
        sourceAddress: a.sourceAddress,
        targetAddress: a.targetAddress,
        trigger: a.primaryLinkageFactors?.join("; ") ?? `Network contagion: ${a.sourceAddress} → ${a.targetAddress}`,
        contagionProbability: a.contagionProbability,
        timeToContagion: `${a.estimatedTimeframeDays} days`,
        timestamp: "Live",
        severity: (a.severity as "critical" | "high" | "moderate") ?? "high",
        primaryLinkageFactors: a.primaryLinkageFactors,
      }))
    : DOMINO_ALERTS.map(a => ({ ...a, primaryLinkageFactors: undefined })));

  const normalizedFirstMover: NormalizedFirstMover[] = (isLiveMode && liveFirstMoverList.length > 0
    ? liveFirstMoverList.map((f, i) => ({
        id: `live-fm-${i}`,
        address: f.address,
        borough: f.borough,
        avm: f.avm,
        predictedDistressWindow: `~${f.predictedWindowDays} days`,
        contagionProbability: f.contagionProbability,
        acquisitionAttractiveness: f.acquisitionAttractiveness,
        networkName: f.networkName,
        distressTrigger: f.distressTrigger ?? `Contagion from ${f.networkName}`,
        estimatedDiscount: f.estimatedDiscount,
        daysToAct: f.predictedWindowDays,
      }))
    : FIRST_MOVER_QUEUE);

  const filteredAlerts = normalizedAlerts.filter(a =>
    alertSeverityFilter === "all" || a.severity === alertSeverityFilter
  );

  const avgAccuracy = liveHistoricalBacktest?.avgPredictionAccuracy ?? Math.round(HISTORICAL_EVENTS.reduce((s, e) => s + e.predictionAccuracy, 0) / HISTORICAL_EVENTS.length);
  const avgTimeToContagion = liveHistoricalBacktest ? `${liveHistoricalBacktest.avgTimeToContagionDays} days` : "41 days";

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ef444415", border: "1px solid #ef444428", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GitBranch style={{ color: "#ef4444", width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Distress Contagion Graph</h1>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#ef444418", color: "#ef4444", fontWeight: 700, border: "1px solid #ef444428" }}>LIVE</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${ACCENT}12`, color: ACCENT, fontWeight: 700, border: `1px solid ${ACCENT}28` }}>First Mover Intelligence</span>
            </div>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 3 }}>
              Cascading default prediction · Entity network topology · Cross-collateral contagion paths · 3–6 month first-mover deal identification
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT.tertiary }}>
              <RefreshCw style={{ width: 11, height: 11 }} />
              Model updated 47 min ago
            </div>
            <div style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: isLiveMode ? "#22c55e18" : `${ACCENT}12`, color: isLiveMode ? "#22c55e" : ACCENT, fontWeight: 700, border: `1px solid ${isLiveMode ? "#22c55e28" : ACCENT + "28"}` }}>
              {isLiveMode ? "LIVE DATA" : "DEMO MODE"}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {[
            { label: "Active Networks", value: isLiveMode ? String(liveNetworksList.length) : "2", sub: isLiveMode ? "live from database" : "under surveillance", color: ACCENT, icon: <GitBranch style={{ width: 14, height: 14 }} /> },
            { label: "Distress Sources", value: isLiveMode ? String(liveNetworksList.reduce((s, n) => s + n.activeDistressNodes, 0)) : "2", sub: "properties in active distress", color: "#ef4444", icon: <Flame style={{ width: 14, height: 14 }} /> },
            { label: "Domino Alerts", value: String(normalizedAlerts.length), sub: "high-probability cascade events", color: "#f97316", icon: <Bell style={{ width: 14, height: 14 }} /> },
            { label: "First Mover Deals", value: String(normalizedFirstMover.length), sub: "3–6 month acquisition targets", color: "#22c55e", icon: <Target style={{ width: 14, height: 14 }} /> },
            { label: "Model Accuracy", value: `${avgAccuracy}%`, sub: "backtested prediction accuracy", color: "#7ba3d4", icon: <BarChart3 style={{ width: 14, height: 14 }} /> },
          ].map(k => (
            <div key={k.label} style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: k.color }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, opacity: 0.7 }}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${BORDER.subtle}`, padding: "0 28px", display: "flex", gap: 2 }}>
        {([
          { id: "graph" as const, label: "Contagion Graph", icon: <GitBranch style={{ width: 12, height: 12 }} /> },
          { id: "alerts" as const, label: "Domino Alerts", icon: <Bell style={{ width: 12, height: 12 }} />, badge: normalizedAlerts.length },
          { id: "first-mover" as const, label: "First Mover Queue", icon: <Target style={{ width: 12, height: 12 }} />, badge: normalizedFirstMover.length },
          { id: "history" as const, label: "Historical Validation", icon: <BarChart3 style={{ width: 12, height: 12 }} /> },
        ] as { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 14px", cursor: "pointer", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? ACCENT : "transparent"}`,
              color: activeTab === tab.id ? ACCENT : TEXT.tertiary,
              display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
              transition: "all 0.15s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: activeTab === tab.id ? `${ACCENT}20` : "rgba(255,255,255,0.06)", color: activeTab === tab.id ? ACCENT : TEXT.tertiary, fontWeight: 700 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 28px" }}>

        {/* GRAPH TAB */}
        {activeTab === "graph" && (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, minHeight: "calc(100vh - 320px)" }}>
            {/* Network selector + risk panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entity Networks</div>
              {NETWORKS.map(net => {
                const isSelected = net.id === selectedNetworkId;
                const color = net.networkRiskScore >= 80 ? "#ef4444" : "#f97316";
                return (
                  <button
                    key={net.id}
                    onClick={() => { setSelectedNetworkId(net.id); setSelectedNodeId(null); }}
                    style={{
                      background: isSelected ? `${color}10` : BG.surface, border: `1px solid ${isSelected ? color + "30" : BORDER.muted}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <ContagionRiskBadge score={net.networkRiskScore} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary, lineHeight: 1.3 }}>{net.name}</div>
                        <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{net.nodes.length} nodes · {net.edges.length} connections</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Portfolio AVM", value: `$${(net.totalAVM / 1e6).toFixed(1)}M` },
                        { label: "Active Distress", value: String(net.activeDistressNodes) },
                        { label: "Contagion Targets", value: String(net.predictedContagionTargets) },
                        { label: "Source", value: "1 property" },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: 8, color: TEXT.tertiary }}>{m.label}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.secondary }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}

              {/* Contagion path details */}
              <div style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Contagion Path
                </div>
                {selectedNetwork.nodes
                  .filter(n => !n.isSource && n.contagionProb > 0 && n.type === "property")
                  .sort((a, b) => b.contagionProb - a.contagionProb)
                  .map(n => {
                    const cfg = RISK_CONFIG[n.riskLevel];
                    return (
                      <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 8px", borderRadius: 7, background: BG.elevated }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.primary }}>{n.label}</div>
                          <div style={{ fontSize: 9, color: TEXT.tertiary }}>{n.borough}</div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{n.contagionProb}%</div>
                      </div>
                    );
                  })}
                <div style={{ fontSize: 9, color: TEXT.tertiary, marginTop: 6, fontStyle: "italic" }}>
                  % = probability of contagion spreading from distress source
                </div>
              </div>

              {selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />}
            </div>

            {/* Graph visualization */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{selectedNetwork.name}</div>
                  <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 2 }}>
                    Click any node to drill into risk factors · Animated pulse = active distress source
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ padding: "5px 10px", borderRadius: 7, background: "#ef444418", border: "1px solid #ef444428", fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                    {selectedNetwork.activeDistressNodes} Active Distress
                  </div>
                  <div style={{ padding: "5px 10px", borderRadius: 7, background: "#f9731618", border: "1px solid #f9731628", fontSize: 11, color: "#f97316", fontWeight: 600 }}>
                    {selectedNetwork.predictedContagionTargets} Contagion Targets
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 460 }}>
                <ContagionGraph
                  network={selectedNetwork}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>

              {/* Financial interdependence summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Cross-Collateralization", value: "2 linkages", detail: "Foreclosure on source triggers covenant review on linked assets", color: "#ef4444", icon: <Zap style={{ width: 12, height: 12 }} /> },
                  { label: "Shared Lender Exposure", value: "1 lender", detail: "Lender will review all co-financed properties upon first default", color: "#a78bfa", icon: <DollarSign style={{ width: 12, height: 12 }} /> },
                  { label: "Guarantor at Risk", value: "1 personal guarantee", detail: "Personal guarantor call will force distressed sale across portfolio", color: "#f59e0b", icon: <Shield style={{ width: 12, height: 12 }} /> },
                ].map(item => (
                  <div key={item.label} style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: item.color, marginBottom: 6 }}>
                      {item.icon}
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: TEXT.tertiary, lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOMINO ALERTS TAB */}
        {activeTab === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>Active Domino Alerts</div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {(["all", "critical", "high", "moderate"] as const).map(sev => {
                  const cfg = sev === "all" ? { color: TEXT.secondary, label: "All" } : { color: RISK_CONFIG[sev].color, label: RISK_CONFIG[sev].label };
                  const count = sev === "all" ? normalizedAlerts.length : normalizedAlerts.filter(a => a.severity === sev).length;
                  return (
                    <button
                      key={sev}
                      onClick={() => setAlertSeverityFilter(sev)}
                      style={{
                        padding: "5px 11px", borderRadius: 7, border: `1px solid ${alertSeverityFilter === sev ? cfg.color + "40" : BORDER.muted}`,
                        background: alertSeverityFilter === sev ? `${cfg.color}12` : BG.surface, cursor: "pointer",
                        fontSize: 11, fontWeight: alertSeverityFilter === sev ? 700 : 500,
                        color: alertSeverityFilter === sev ? cfg.color : TEXT.secondary,
                      }}
                    >
                      {cfg.label} <span style={{ opacity: 0.6 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredAlerts.map(alert => {
                const cfg = RISK_CONFIG[alert.severity];
                return (
                  <div key={alert.id} style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${cfg.color}28`, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Bell style={{ color: cfg.color, width: 16, height: 16 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 700 }}>{cfg.label} Contagion</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT.primary }}>{alert.sourceAddress}</span>
                          <ArrowRight style={{ width: 12, height: 12, color: cfg.color }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{alert.targetAddress}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, color: TEXT.tertiary }}>{alert.timestamp}</span>
                        </div>
                        <p style={{ fontSize: 12, color: TEXT.secondary, lineHeight: 1.6, marginBottom: 10 }}>{alert.trigger}</p>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {[
                            { label: "Network", value: alert.networkName, color: TEXT.primary },
                            { label: "Contagion Probability", value: `${alert.contagionProbability}%`, color: cfg.color },
                            { label: "Time to Contagion", value: alert.timeToContagion, color: "#f59e0b" },
                          ].map(m => (
                            <div key={m.label}>
                              <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
                            </div>
                          ))}
                          <div style={{ marginLeft: "auto" }}>
                            <button style={{
                              padding: "6px 14px", borderRadius: 7, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                              color: cfg.color, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>
                              View Contagion Path
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAlerts.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: TEXT.tertiary, fontSize: 13 }}>
                No alerts matching selected severity
              </div>
            )}
          </div>
        )}

        {/* FIRST MOVER QUEUE TAB */}
        {activeTab === "first-mover" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>First Mover Deal Queue</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 2 }}>
                  Properties predicted to enter distress within 3–6 months via contagion, ranked by acquisition attractiveness
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <div style={{ padding: "6px 12px", borderRadius: 7, background: "#22c55e18", border: "1px solid #22c55e28", fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
                  {normalizedFirstMover.length} targets identified
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...normalizedFirstMover].sort((a, b) => b.acquisitionAttractiveness - a.acquisitionAttractiveness).map((opp, i) => {
                const attractColor = opp.acquisitionAttractiveness >= 85 ? "#22c55e" : opp.acquisitionAttractiveness >= 70 ? ACCENT : "#f59e0b";
                const probColor = opp.contagionProbability >= 75 ? "#ef4444" : opp.contagionProbability >= 60 ? "#f97316" : "#f59e0b";
                return (
                  <div key={opp.id} style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.muted}`, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${attractColor}18`, border: `1px solid ${attractColor}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: attractColor }}>
                          {i + 1}
                        </div>
                        {i === 0 && <Star style={{ width: 12, height: 12, color: ACCENT }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{opp.address}</span>
                          <span style={{ fontSize: 10, color: TEXT.tertiary }}>{opp.borough}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${attractColor}18`, color: attractColor, fontWeight: 700 }}>
                            Score: {opp.acquisitionAttractiveness}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
                          {[
                            { label: "AVM", value: `$${(opp.avm / 1e6).toFixed(2)}M`, color: TEXT.primary },
                            { label: "Est. Discount", value: `–${opp.estimatedDiscount}%`, color: "#22c55e" },
                            { label: "Contagion Prob.", value: `${opp.contagionProbability}%`, color: probColor },
                            { label: "Days to Act", value: `~${opp.daysToAct}d`, color: "#f59e0b" },
                          ].map(m => (
                            <div key={m.label} style={{ background: BG.elevated, borderRadius: 7, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>Distress Trigger (via {opp.networkName})</div>
                            <div style={{ fontSize: 11, color: TEXT.secondary }}>{opp.distressTrigger}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>Predicted Window</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock style={{ width: 10, height: 10 }} />
                              {opp.predictedDistressWindow}
                            </div>
                          </div>
                        </div>

                        {/* Attractiveness bar */}
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: TEXT.tertiary }}>Acquisition Attractiveness</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: attractColor }}>{opp.acquisitionAttractiveness}/100</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ width: `${opp.acquisitionAttractiveness}%`, height: "100%", borderRadius: 2, background: attractColor, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORICAL VALIDATION TAB */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, marginBottom: 4 }}>Historical Contagion Analysis</div>
              <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                Backtested prediction accuracy across 5 confirmed cascading default events in the NYC CRE market
              </div>
            </div>

            {/* Accuracy summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Average Model Accuracy", value: `${avgAccuracy}%`, sub: "across 5 backtested events", color: "#22c55e" },
                { label: "Properties Modeled", value: liveHistoricalBacktest ? String(liveHistoricalBacktest.totalPropertiesInCascades) : String(HISTORICAL_EVENTS.reduce((s, e) => s + e.affectedProperties, 0)), sub: "confirmed contagion targets", color: ACCENT },
                { label: "Avg. Time to Contagion", value: avgTimeToContagion, sub: "source distress → cascade", color: "#f59e0b" },
                { label: "CRE Debt Maturing", value: "$2.8T", sub: "through 2028 — contagion risk", color: "#ef4444" },
              ].map(m => (
                <div key={m.label} style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: TEXT.secondary, marginTop: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Historical events table */}
            <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.muted}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER.subtle}`, display: "grid", gridTemplateColumns: "50px 1fr 120px 100px 120px 110px 100px", gap: 12, alignItems: "center" }}>
                {["Year", "Network / Source", "Time to Cascade", "Depth", "Properties", "Value at Risk", "Accuracy"].map(h => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
                ))}
              </div>
              {HISTORICAL_EVENTS.map((event, i) => (
                <div
                  key={event.id}
                  style={{
                    padding: "14px 18px", borderBottom: i < HISTORICAL_EVENTS.length - 1 ? `1px solid ${BORDER.subtle}` : "none",
                    display: "grid", gridTemplateColumns: "50px 1fr 120px 100px 120px 110px 100px", gap: 12, alignItems: "center",
                    background: i % 2 === 0 ? "transparent" : BG.elevated,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.tertiary }}>{event.year}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{event.networkName}</div>
                    <div style={{ fontSize: 10, color: TEXT.tertiary }}>{event.sourceAddress}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock style={{ width: 10, height: 10 }} />{event.timeToContagion}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: event.cascadeDepth }).map((_, d) => (
                      <div key={d} style={{ width: 10, height: 10, borderRadius: 2, background: d === 0 ? "#ef4444" : d === 1 ? "#f97316" : d === 2 ? "#f59e0b" : "#c8a060" }} />
                    ))}
                    <span style={{ fontSize: 10, color: TEXT.tertiary, marginLeft: 4 }}>{event.cascadeDepth} levels</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{event.affectedProperties} properties</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT.secondary }}>${(event.totalValueAtRisk / 1e6).toFixed(0)}M</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: event.predictionAccuracy >= 90 ? "#22c55e" : ACCENT }}>{event.predictionAccuracy}%</div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 3 }}>
                      <div style={{ width: `${event.predictionAccuracy}%`, height: "100%", borderRadius: 2, background: event.predictionAccuracy >= 90 ? "#22c55e" : ACCENT }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Methodology note */}
            <div style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Contagion Model Methodology
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Network Topology Analysis", detail: "Maps LLC ownership trees, cross-collateral agreements, shared lender pools, and personal guarantor exposure to model financial interdependence between entities." },
                  { label: "Contagion Probability Scoring", detail: "Bayesian network model that weights edge types — cross-collateral (highest), shared lender, guarantor, co-management — against node distress signals to calculate cascade probability." },
                  { label: "Threshold Events", detail: "DSCR breach below 1.0x, tax delinquency >90 days, mechanic lien >$50K, or mortgage default triggers contagion path activation across all connected nodes." },
                  { label: "First Mover Timing", detail: "Combines contagion probability with time-to-default estimates and acquisition attractiveness scoring (AVM discount, liquidity, hold duration) to rank deal opportunities." },
                ].map(m => (
                  <div key={m.label} style={{ background: BG.elevated, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT.secondary, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: TEXT.tertiary, lineHeight: 1.6 }}>{m.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
