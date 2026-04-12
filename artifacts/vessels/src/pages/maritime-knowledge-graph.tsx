import { useState, useCallback, useRef, useEffect } from "react";
import { Ship, User, Package, Anchor, AlertTriangle, Shield, Search, X, ChevronRight, ExternalLink, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";
const BG = { page: "#060e1a", surface: "#08121f", elevated: "#0c1628" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.05)", muted: "rgba(255,255,255,0.09)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.90)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type NodeType = "vessel" | "owner" | "cargo" | "port" | "sanctions" | "insurer";

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  subLabel?: string;
  risk: "clear" | "watch" | "elevated" | "sanctioned";
  x: number;
  y: number;
  connections: string[];
  meta: Record<string, string>;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

const NODE_CONFIG: Record<NodeType, { color: string; icon: React.ElementType; size: number }> = {
  vessel: { color: "#4a9eff", icon: Ship, size: 22 },
  owner: { color: "#c8a060", icon: User, size: 20 },
  cargo: { color: "#22c55e", icon: Package, size: 16 },
  port: { color: "#a78bfa", icon: Anchor, size: 18 },
  sanctions: { color: "#ef4444", icon: AlertTriangle, size: 20 },
  insurer: { color: "#64748b", icon: Shield, size: 16 },
};

const RISK_CONFIG = {
  clear: { color: "#22c55e", bg: "#22c55e15", label: "Clear" },
  watch: { color: "#f59e0b", bg: "#f59e0b15", label: "Watch" },
  elevated: { color: "#f97316", bg: "#f9731615", label: "Elevated" },
  sanctioned: { color: "#ef4444", bg: "#ef444415", label: "Sanctioned" },
};

const NODES: GraphNode[] = [
  // Central vessels
  { id: "v1", type: "vessel", label: "MV ATLANTIS COMMAND", subLabel: "Container · IMO 9734219", risk: "clear", x: 400, y: 300, connections: ["o1", "c1", "p1", "i1"], meta: { Flag: "UK", DWT: "84,200t", Built: "2018", Class: "Lloyd's Register", Route: "Salalah → Port Said" } },
  { id: "v2", type: "vessel", label: "MT BOREAL SEA", subLabel: "Tanker · IMO 9642108", risk: "watch", x: 220, y: 200, connections: ["o1", "c2", "p2", "s1"], meta: { Flag: "Norway", DWT: "158,000t", Built: "2016", Class: "DNV GL", Route: "Jebel Ali → Rotterdam", Alert: "AIS blackout 14h" } },
  { id: "v3", type: "vessel", label: "CV STELLARIS", subLabel: "Container · IMO 9812744", risk: "elevated", x: 580, y: 200, connections: ["o2", "c3", "p3", "i2"], meta: { Flag: "Panama", DWT: "62,400t", Built: "2020", Class: "ABS", Route: "Shanghai → Hamburg", Alert: "Call at sanctioned-adjacent port" } },
  { id: "v4", type: "vessel", label: "MV NOVA ATLAS", subLabel: "Bulk · IMO 9553842", risk: "sanctioned", x: 400, y: 440, connections: ["o3", "c4", "p4", "s2"], meta: { Flag: "Togo", DWT: "76,000t", Built: "2012", Class: "BV", Route: "Unknown", Alert: "OFAC SDN match — beneficial owner" } },

  // Owners
  { id: "o1", type: "owner", label: "Atlantic Ridge Ltd", subLabel: "Bermuda · BVI structure", risk: "clear", x: 200, y: 340, connections: ["v1", "v2"], meta: { Jurisdiction: "Bermuda", UBO: "Disclosed", FATF: "Low risk", Vessels: "12 fleet" } },
  { id: "o2", type: "owner", label: "Coral Shipping Holdings", subLabel: "Cayman Islands", risk: "elevated", x: 640, y: 300, connections: ["v3"], meta: { Jurisdiction: "Cayman", UBO: "Partially disclosed", FATF: "Medium", Alert: "Director match on PEP list" } },
  { id: "o3", type: "owner", label: "Meridian Asset Co", subLabel: "Marshal Islands", risk: "sanctioned", x: 340, y: 500, connections: ["v4", "s2"], meta: { Jurisdiction: "Marshall Is.", UBO: "Concealed", FATF: "High risk", Alert: "OFAC SDN List — Iran nexus" } },

  // Cargo
  { id: "c1", type: "cargo", label: "Electronics — Mixed", subLabel: "22,400 TEU", risk: "clear", x: 520, y: 360, connections: ["v1", "p1"], meta: { Type: "Consumer electronics", Origin: "China", Declared: "Full manifest", HS: "8471–8544" } },
  { id: "c2", type: "cargo", label: "Crude Oil", subLabel: "140,000 MT", risk: "watch", x: 120, y: 280, connections: ["v2", "p2"], meta: { Grade: "Arabian Heavy", Origin: "UAE", Certificate: "Pending", Alert: "Origin verification pending" } },
  { id: "c3", type: "cargo", label: "Machinery Parts", subLabel: "Dual-use potential", risk: "elevated", x: 680, y: 160, connections: ["v3"], meta: { Type: "Industrial machinery", HS: "8428–8462", DualUse: "Potential — screening required", Origin: "China" } },
  { id: "c4", type: "cargo", label: "Undeclared", subLabel: "No manifest filed", risk: "sanctioned", x: 480, y: 500, connections: ["v4", "p4"], meta: { Type: "Unknown", Manifest: "Not filed", Alert: "OFAC concern — no bill of lading" } },

  // Ports
  { id: "p1", type: "port", label: "Port Said", subLabel: "Egypt · Major hub", risk: "clear", x: 540, y: 420, connections: ["v1", "c1"], meta: { Country: "Egypt", Status: "ISPS compliant", Volume: "Tier 1", Throughput: "5.2M TEU/yr" } },
  { id: "p2", type: "port", label: "Jebel Ali", subLabel: "UAE · Free zone", risk: "clear", x: 100, y: 380, connections: ["v2", "c2"], meta: { Country: "UAE", Status: "ISPS compliant", Volume: "Tier 1", Throughput: "14.1M TEU/yr" } },
  { id: "p3", type: "port", label: "Bandar Abbas", subLabel: "Iran · Restricted", risk: "sanctioned", x: 720, y: 260, connections: ["v3"], meta: { Country: "Iran", Status: "OFAC restricted", Alert: "Call within 90 days — reportable", Sanctions: "IRGC nexus" } },
  { id: "p4", type: "port", label: "Latakia", subLabel: "Syria · Sanctioned", risk: "sanctioned", x: 360, y: 580, connections: ["v4", "c4"], meta: { Country: "Syria", Status: "US/EU sanctioned", Alert: "Prohibited call — immediate escalation" } },

  // Sanctions
  { id: "s1", type: "sanctions", label: "OFAC Watch Notice", subLabel: "Iran shipping nexus", risk: "elevated", x: 80, y: 160, connections: ["v2"], meta: { Authority: "OFAC", Date: "2024-11-08", Type: "Watch", Reference: "OFAC-2024-IR-0814" } },
  { id: "s2", type: "sanctions", label: "OFAC SDN List", subLabel: "Full designation", risk: "sanctioned", x: 240, y: 560, connections: ["o3", "v4"], meta: { Authority: "OFAC", Date: "2025-03-22", Type: "Full SDN", Reference: "SDN-IRAN-0293", UNResolution: "2231" } },

  // Insurers
  { id: "i1", type: "insurer", label: "Lloyd's Syndicate 3124", subLabel: "P&I cover · $150M limit", risk: "clear", x: 620, y: 440, connections: ["v1"], meta: { Policy: "P&I + H&M", Limit: "$150M", Expires: "2027-02-28", Club: "UK P&I Club" } },
  { id: "i2", type: "insurer", label: "Gard AS", subLabel: "P&I cover — under review", risk: "watch", x: 720, y: 380, connections: ["v3"], meta: { Policy: "P&I", Limit: "$80M", Status: "Under review — port call concern", Club: "Gard" } },
];

const EDGES: GraphEdge[] = [
  { source: "v1", target: "o1", label: "owned by", weight: 3 },
  { source: "v2", target: "o1", label: "owned by", weight: 3 },
  { source: "v3", target: "o2", label: "owned by", weight: 3 },
  { source: "v4", target: "o3", label: "owned by", weight: 4 },
  { source: "v1", target: "c1", label: "carries", weight: 2 },
  { source: "v2", target: "c2", label: "carries", weight: 2 },
  { source: "v3", target: "c3", label: "carries", weight: 2 },
  { source: "v4", target: "c4", label: "carries", weight: 4 },
  { source: "v1", target: "p1", label: "calls at", weight: 1 },
  { source: "v2", target: "p2", label: "last port", weight: 1 },
  { source: "v3", target: "p3", label: "called at", weight: 4 },
  { source: "v4", target: "p4", label: "calls at", weight: 4 },
  { source: "v2", target: "s1", label: "flagged by", weight: 3 },
  { source: "o3", target: "s2", label: "designated", weight: 4 },
  { source: "v4", target: "s2", label: "linked to", weight: 4 },
  { source: "v1", target: "i1", label: "insured by", weight: 1 },
  { source: "v3", target: "i2", label: "insured by", weight: 2 },
  { source: "c1", target: "p1", label: "destined for", weight: 1 },
  { source: "c4", target: "p4", label: "bound for", weight: 4 },
];

export default function MaritimeKnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<NodeType | "all">("all");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const filteredNodes = NODES.filter(n => {
    if (filter !== "all" && n.type !== filter) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.subLabel?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const filteredIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = EDGES.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target));

  const connected = selectedNode ? new Set([selectedNode.id, ...selectedNode.connections]) : null;

  function handleNodeClick(n: GraphNode) {
    setSelectedNode(prev => prev?.id === n.id ? null : n);
  }

  function getEdgeColor(e: GraphEdge) {
    if (e.weight >= 4) return "rgba(239,68,68,0.6)";
    if (e.weight === 3) return "rgba(249,115,22,0.4)";
    if (e.weight === 2) return "rgba(100,116,139,0.4)";
    return "rgba(255,255,255,0.12)";
  }

  return (
    <div style={{ background: BG.page, height: "100vh", display: "flex", flexDirection: "column", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ship style={{ color: ACCENT, width: 16, height: 16 }} />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Maritime Knowledge Graph</h1>
          <p style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 1 }}>Entity relationships · Ownership chains · Sanctions exposure · Cargo linkage</p>
        </div>
        <div className="flex-1" />
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: TEXT.tertiary }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entities..."
            style={{ paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 7, border: `1px solid ${BORDER.muted}`, background: BG.surface, color: TEXT.primary, fontSize: 12, width: 200, outline: "none" }}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "vessel", "owner", "cargo", "port", "sanctions", "insurer"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 10px", borderRadius: 6, border: `1px solid ${filter === f ? ACCENT + "40" : BORDER.muted}`,
                background: filter === f ? `${ACCENT}12` : "transparent", fontSize: 11, cursor: "pointer",
                color: filter === f ? ACCENT : TEXT.secondary, fontWeight: filter === f ? 600 : 400, textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} style={{ padding: "5px", borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.secondary }}>
            <ZoomIn style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} style={{ padding: "5px", borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.secondary }}>
            <ZoomOut style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: "5px", borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.secondary }}>
            <RefreshCw style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Graph canvas */}
        <div
          style={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragging.current ? "grabbing" : "grab" }}
          onMouseDown={e => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
          onMouseMove={e => {
            if (!dragging.current) return;
            setPan(p => ({ x: p.x + (e.clientX - lastPos.current.x), y: p.y + (e.clientY - lastPos.current.y) }));
            lastPos.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
        >
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }} viewBox="0 0 820 640" preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {filteredEdges.map((e, i) => {
                const src = NODES.find(n => n.id === e.source)!;
                const tgt = NODES.find(n => n.id === e.target)!;
                if (!src || !tgt) return null;
                const dimmed = connected && (!connected.has(e.source) || !connected.has(e.target));
                const mx = (src.x + tgt.x) / 2;
                const my = (src.y + tgt.y) / 2;
                return (
                  <g key={i} opacity={dimmed ? 0.15 : 1}>
                    <line
                      x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke={getEdgeColor(e)}
                      strokeWidth={e.weight >= 3 ? 1.5 : 1}
                      strokeDasharray={e.weight >= 4 ? "5,3" : undefined}
                    />
                    <text x={mx} y={my - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={8}>{e.label}</text>
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const cfg = NODE_CONFIG[node.type];
                const riskCfg = RISK_CONFIG[node.risk];
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode === node.id;
                const dimmed = connected && !connected.has(node.id);
                const r = cfg.size / 2;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                    opacity={dimmed ? 0.2 : 1}
                  >
                    {/* Pulse ring for sanctioned/elevated */}
                    {(node.risk === "sanctioned" || node.risk === "elevated") && (
                      <circle r={r + 8} fill="none" stroke={riskCfg.color} strokeWidth={1} strokeOpacity={0.3} />
                    )}
                    {/* Selection ring */}
                    {isSelected && (
                      <circle r={r + 5} fill="none" stroke={cfg.color} strokeWidth={2} strokeOpacity={0.8} />
                    )}
                    {/* Main circle */}
                    <circle
                      r={r + (isHovered || isSelected ? 2 : 0)}
                      fill={`${cfg.color}22`}
                      stroke={isSelected ? cfg.color : riskCfg.color}
                      strokeWidth={node.risk !== "clear" ? 1.5 : 1}
                    />
                    {/* Icon placeholder — letter */}
                    <text textAnchor="middle" dy="0.35em" fill={cfg.color} fontSize={node.type === "vessel" ? 10 : 9} fontWeight={700}>
                      {node.type === "vessel" ? "⛵" : node.type === "owner" ? "○" : node.type === "cargo" ? "◈" : node.type === "port" ? "⚓" : node.type === "sanctions" ? "!" : "◇"}
                    </text>

                    {/* Label */}
                    <text textAnchor="middle" y={r + 14} fill={isSelected ? TEXT.primary : TEXT.secondary} fontSize={8.5} fontWeight={isSelected ? 700 : 400}>
                      {node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label}
                    </text>
                    {node.risk !== "clear" && (
                      <circle cx={r - 3} cy={-r + 3} r={4} fill={riskCfg.color} stroke={BG.page} strokeWidth={1} />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div style={{ position: "absolute", bottom: 16, left: 16, background: `${BG.surface}ee`, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Risk Level</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(RISK_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: TEXT.secondary, textTransform: "capitalize" }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Node type legend */}
          <div style={{ position: "absolute", bottom: 16, right: 16, background: `${BG.surface}ee`, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Entity Types</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: TEXT.secondary, textTransform: "capitalize" }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div style={{ width: 300, borderLeft: `1px solid ${BORDER.subtle}`, background: BG.surface, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${NODE_CONFIG[selectedNode.type].color}18`, border: `1px solid ${NODE_CONFIG[selectedNode.type].color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: NODE_CONFIG[selectedNode.type].color }}>
                  {selectedNode.type === "vessel" ? "⛵" : selectedNode.type === "owner" ? "○" : selectedNode.type === "cargo" ? "◈" : selectedNode.type === "port" ? "⚓" : selectedNode.type === "sanctions" ? "!" : "◇"}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, lineHeight: 1.3 }}>{selectedNode.label}</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 2 }}>{selectedNode.subLabel}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${NODE_CONFIG[selectedNode.type].color}15`, color: NODE_CONFIG[selectedNode.type].color, textTransform: "capitalize", fontWeight: 600 }}>
                    {selectedNode.type}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: RISK_CONFIG[selectedNode.risk].bg, color: RISK_CONFIG[selectedNode.risk].color, fontWeight: 600 }}>
                    {RISK_CONFIG[selectedNode.risk].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ color: TEXT.tertiary, cursor: "pointer", background: "none", border: "none", padding: 2 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Intelligence Data</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(selectedNode.meta).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${BORDER.subtle}`, paddingBottom: 6 }}>
                    <span style={{ fontSize: 11, color: TEXT.tertiary, flexShrink: 0, marginRight: 12 }}>{k}</span>
                    <span style={{ fontSize: 11, color: k === "Alert" ? "#f97316" : k === "Sanctions" ? "#ef4444" : TEXT.primary, textAlign: "right", lineHeight: 1.4 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "12px 18px", borderTop: `1px solid ${BORDER.subtle}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Connected Entities</div>
              {selectedNode.connections.map(cId => {
                const cn = NODES.find(n => n.id === cId);
                if (!cn) return null;
                const cfg = NODE_CONFIG[cn.type];
                return (
                  <div
                    key={cId}
                    onClick={() => handleNodeClick(cn)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: cfg.color }}>
                        {cn.type === "vessel" ? "⛵" : cn.type === "owner" ? "○" : cn.type === "cargo" ? "◈" : cn.type === "port" ? "⚓" : cn.type === "sanctions" ? "!" : "◇"}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cn.label}</div>
                      <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "capitalize" }}>{cn.type}</div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: RISK_CONFIG[cn.risk].color, flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
