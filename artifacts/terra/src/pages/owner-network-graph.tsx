import { useState, useRef } from "react";
import { Network, Search, X, AlertTriangle, ChevronRight, Building, DollarSign, ZoomIn, ZoomOut, RefreshCw, Shield } from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type NodeKind = "owner" | "property" | "entity" | "lien" | "flag";

interface OwnerNode {
  id: string;
  kind: NodeKind;
  label: string;
  subLabel?: string;
  distressSignal: "none" | "watch" | "elevated" | "distressed";
  x: number;
  y: number;
  connections: string[];
  meta: Record<string, string>;
}

interface OwnerEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

const KIND_CONFIG: Record<NodeKind, { color: string; size: number }> = {
  owner: { color: ACCENT, size: 24 },
  property: { color: "#7ba3d4", size: 20 },
  entity: { color: "#a78bfa", size: 18 },
  lien: { color: "#ef4444", size: 14 },
  flag: { color: "#f97316", size: 14 },
};

const DISTRESS_CONFIG = {
  none: { color: "#22c55e", label: "Clean" },
  watch: { color: "#f59e0b", label: "Watch" },
  elevated: { color: "#f97316", label: "Elevated" },
  distressed: { color: "#ef4444", label: "Distressed" },
};

const NODES: OwnerNode[] = [
  // Central owner
  { id: "ow1", kind: "owner", label: "Meridian Capital Partners", subLabel: "71-unit portfolio · 7 properties", distressSignal: "elevated", x: 400, y: 300, connections: ["p1", "p2", "p3", "p4", "ent1"], meta: { Type: "Private equity", Jurisdiction: "Delaware LLC", Portfolio: "71 units / 7 properties", TotalDebt: "$18.4M", DSCR: "0.88x — below threshold", Alert: "3 properties below DSCR threshold" } },
  { id: "ent1", kind: "entity", label: "MCP Holdings LLC", subLabel: "Intermediate HoldCo", distressSignal: "watch", x: 200, y: 200, connections: ["ow1", "ow2"], meta: { Type: "HoldCo", Jurisdiction: "Marshall Islands", UBO: "Disclosed", Note: "Same UBO as Meridian Capital" } },
  { id: "ow2", kind: "owner", label: "Harbor View Real Estate", subLabel: "23-unit portfolio · 3 properties", distressSignal: "distressed", x: 100, y: 320, connections: ["p5", "p6", "ent1", "lien1"], meta: { Type: "Family office", Jurisdiction: "NY LLC", Portfolio: "23 units / 3 properties", TotalDebt: "$6.2M", DSCR: "0.72x", Alert: "2 tax delinquency notices Q4 2025", "Portfolio Issue": "Lien acceleration notice received" } },
  { id: "ow3", kind: "owner", label: "Flatbush Partners LLC", subLabel: "18 units · 2 properties", distressSignal: "watch", x: 600, y: 180, connections: ["p7", "p8", "flag1"], meta: { Type: "LLC", Jurisdiction: "New York", Portfolio: "18 units / 2 properties", TotalDebt: "$4.1M", Note: "3 months delinquent on note" } },

  // Properties
  { id: "p1", kind: "property", label: "247 W 116th St", subLabel: "18 units · Manhattan", distressSignal: "elevated", x: 520, y: 220, connections: ["ow1", "lien2"], meta: { Borough: "Manhattan", Units: "18", AVM: "$5.9M", Debt: "$3.84M", DSCR: "0.92x", "Mechanic Lien": "$128K (2025)", "Tax Status": "Current" } },
  { id: "p2", kind: "property", label: "854 Lincoln Ave", subLabel: "12 units · Bronx", distressSignal: "distressed", x: 560, y: 380, connections: ["ow1", "lien3"], meta: { Borough: "Bronx", Units: "12", AVM: "$1.8M", Debt: "$980K", DSCR: "0.84x", "Tax Arrears": "$180K", "Status": "Offer stage" } },
  { id: "p3", kind: "property", label: "1920 Flatbush Ave", subLabel: "24 units · Brooklyn", distressSignal: "watch", x: 500, y: 440, connections: ["ow1"], meta: { Borough: "Brooklyn", Units: "24", AVM: "$5.6M", Debt: "$4.1M", DSCR: "1.08x", Status: "Performing" } },
  { id: "p4", kind: "property", label: "73 Macon St", subLabel: "8 units · Brooklyn", distressSignal: "none", x: 360, y: 460, connections: ["ow1"], meta: { Borough: "Brooklyn", Units: "8", AVM: "$2.1M", Debt: "$1.2M", DSCR: "1.22x", Status: "Performing" } },
  { id: "p5", kind: "property", label: "412 E 148th St", subLabel: "10 units · Bronx", distressSignal: "distressed", x: 120, y: 450, connections: ["ow2", "lien1"], meta: { Borough: "Bronx", Units: "10", AVM: "$1.4M", Debt: "$1.1M", DSCR: "0.68x", "Tax Status": "DELINQUENT", Alert: "Foreclosure proceedings possible" } },
  { id: "p6", kind: "property", label: "228 W 145th St", subLabel: "13 units · Manhattan", distressSignal: "elevated", x: 60, y: 260, connections: ["ow2"], meta: { Borough: "Manhattan", Units: "13", AVM: "$3.2M", Debt: "$2.4M", DSCR: "0.81x", "Tax Status": "1yr delinquent" } },
  { id: "p7", kind: "property", label: "1920 Flatbush Ave", subLabel: "14 units · Brooklyn", distressSignal: "watch", x: 700, y: 280, connections: ["ow3"], meta: { Borough: "Brooklyn", Units: "14", AVM: "$3.8M", Debt: "$3.1M", DSCR: "0.97x", Note: "3 months arrears on note" } },
  { id: "p8", kind: "property", label: "45 Pulaski St", subLabel: "4 units · Brooklyn", distressSignal: "none", x: 720, y: 400, connections: ["ow3"], meta: { Borough: "Brooklyn", Units: "4", AVM: "$1.1M", Debt: "$620K", DSCR: "1.18x", Status: "Current" } },

  // Liens
  { id: "lien1", kind: "lien", label: "Tax Lien Notice", subLabel: "$340K · 2025", distressSignal: "distressed", x: 160, y: 520, connections: ["ow2", "p5"], meta: { Authority: "NYC DOF", Amount: "$340,000", Date: "Q4 2025", Status: "Active — acceleration imminent" } },
  { id: "lien2", kind: "lien", label: "Mechanic's Lien", subLabel: "$128K · 2025", distressSignal: "watch", x: 580, y: 160, connections: ["p1"], meta: { Filed: "June 2025", Amount: "$128,000", Contractor: "ABC Contractors LLC", Status: "Active" } },
  { id: "lien3", kind: "lien", label: "Tax Arrears Notice", subLabel: "$180K · NYC", distressSignal: "elevated", x: 660, y: 460, connections: ["p2"], meta: { Authority: "NYC DOF", Amount: "$180,000", Date: "2025-Q3", Status: "Arrears — no lien yet" } },

  // Flags
  { id: "flag1", kind: "flag", label: "Note Delinquency", subLabel: "3 months past due", distressSignal: "watch", x: 780, y: 220, connections: ["ow3"], meta: { Type: "Loan Delinquency", Lender: "Valley National Bank", Amount: "$3.1M", Status: "90-day notice issued" } },
];

const EDGES: OwnerEdge[] = [
  { source: "ow1", target: "p1", label: "owns", weight: 2 },
  { source: "ow1", target: "p2", label: "owns", weight: 3 },
  { source: "ow1", target: "p3", label: "owns", weight: 1 },
  { source: "ow1", target: "p4", label: "owns", weight: 1 },
  { source: "ow1", target: "ent1", label: "via", weight: 2 },
  { source: "ent1", target: "ow2", label: "connected", weight: 3 },
  { source: "ow2", target: "p5", label: "owns", weight: 4 },
  { source: "ow2", target: "p6", label: "owns", weight: 3 },
  { source: "ow2", target: "lien1", label: "faces", weight: 4 },
  { source: "p5", target: "lien1", label: "liens on", weight: 4 },
  { source: "p1", target: "lien2", label: "liens on", weight: 2 },
  { source: "p2", target: "lien3", label: "tax arrears", weight: 3 },
  { source: "ow3", target: "p7", label: "owns", weight: 2 },
  { source: "ow3", target: "p8", label: "owns", weight: 1 },
  { source: "ow3", target: "flag1", label: "flagged", weight: 2 },
];

export default function OwnerNetworkGraph() {
  const [selectedNode, setSelectedNode] = useState<OwnerNode | null>(NODES[0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [search, setSearch] = useState("");

  const connected = selectedNode ? new Set([selectedNode.id, ...selectedNode.connections]) : null;
  const filteredNodes = search ? NODES.filter(n => n.label.toLowerCase().includes(search.toLowerCase())) : NODES;
  const filteredIds = new Set(filteredNodes.map(n => n.id));

  function edgeColor(e: OwnerEdge) {
    if (e.weight >= 4) return "rgba(239,68,68,0.5)";
    if (e.weight === 3) return "rgba(249,115,22,0.35)";
    if (e.weight === 2) return "rgba(200,160,96,0.25)";
    return "rgba(255,255,255,0.10)";
  }

  const portfolioStats = {
    owners: NODES.filter(n => n.kind === "owner").length,
    properties: NODES.filter(n => n.kind === "property").length,
    distressed: NODES.filter(n => n.distressSignal === "distressed").length,
    liens: NODES.filter(n => n.kind === "lien").length,
  };

  return (
    <div style={{ background: BG.page, height: "100vh", display: "flex", flexDirection: "column", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Network style={{ color: ACCENT, width: 16, height: 16 }} />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Owner Network Graph</h1>
          <p style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 1 }}>Follow the LLCs · Hidden portfolios · Distress patterns across ownership chains</p>
        </div>

        {/* Stats */}
        <div className="flex gap-12 ml-6">
          {[
            { label: "Owners", value: portfolioStats.owners, color: ACCENT },
            { label: "Properties", value: portfolioStats.properties, color: "#7ba3d4" },
            { label: "Distressed", value: portfolioStats.distressed, color: "#ef4444" },
            { label: "Liens", value: portfolioStats.liens, color: "#f97316" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: TEXT.tertiary }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1" />
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, color: TEXT.tertiary }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 26, paddingRight: 8, height: 30, borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: BG.surface, color: TEXT.primary, fontSize: 11, width: 160, outline: "none" }} />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} style={{ padding: 5, borderRadius: 5, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.tertiary }}><ZoomIn style={{ width: 12, height: 12 }} /></button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} style={{ padding: 5, borderRadius: 5, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.tertiary }}><ZoomOut style={{ width: 12, height: 12 }} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: 5, borderRadius: 5, border: `1px solid ${BORDER.muted}`, background: BG.surface, cursor: "pointer", color: TEXT.tertiary }}><RefreshCw style={{ width: 12, height: 12 }} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Graph */}
        <div
          style={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragging.current ? "grabbing" : "grab" }}
          onMouseDown={e => { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
          onMouseMove={e => { if (!dragging.current) return; setPan(p => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y })); lastPos.current = { x: e.clientX, y: e.clientY }; }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
        >
          <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 840 620" preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {EDGES.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target)).map((e, i) => {
                const src = NODES.find(n => n.id === e.source)!;
                const tgt = NODES.find(n => n.id === e.target)!;
                if (!src || !tgt) return null;
                const dim = connected && (!connected.has(e.source) || !connected.has(e.target));
                const mx = (src.x + tgt.x) / 2;
                const my = (src.y + tgt.y) / 2;
                return (
                  <g key={i} opacity={dim ? 0.15 : 1}>
                    <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke={edgeColor(e)} strokeWidth={e.weight >= 3 ? 1.5 : 1} strokeDasharray={e.weight >= 4 ? "5,3" : undefined} />
                    <text x={mx} y={my - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8}>{e.label}</text>
                  </g>
                );
              })}

              {filteredNodes.map(node => {
                const cfg = KIND_CONFIG[node.kind];
                const dCfg = DISTRESS_CONFIG[node.distressSignal];
                const dim = connected && !connected.has(node.id);
                const isSelected = selectedNode?.id === node.id;
                const r = cfg.size / 2;
                return (
                  <g key={node.id} transform={`translate(${node.x},${node.y})`} onClick={() => setSelectedNode(p => p?.id === node.id ? null : node)} style={{ cursor: "pointer" }} opacity={dim ? 0.2 : 1}>
                    {(node.distressSignal !== "none") && <circle r={r + 7} fill="none" stroke={dCfg.color} strokeWidth={1} strokeOpacity={0.3} />}
                    {isSelected && <circle r={r + 4} fill="none" stroke={cfg.color} strokeWidth={2} strokeOpacity={0.9} />}
                    <circle r={r} fill={`${cfg.color}22`} stroke={node.distressSignal !== "none" ? dCfg.color : cfg.color} strokeWidth={1.5} />
                    <text textAnchor="middle" dy="0.35em" fill={cfg.color} fontSize={node.kind === "owner" ? 10 : 8} fontWeight={700}>
                      {node.kind === "owner" ? "○" : node.kind === "property" ? "◻" : node.kind === "entity" ? "◆" : node.kind === "lien" ? "!" : "⚑"}
                    </text>
                    <text textAnchor="middle" y={r + 12} fill={isSelected ? TEXT.primary : TEXT.secondary} fontSize={8.5} fontWeight={isSelected ? 700 : 400}>
                      {node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label}
                    </text>
                    {node.distressSignal !== "none" && <circle cx={r - 2} cy={-r + 2} r={4} fill={dCfg.color} stroke={BG.page} strokeWidth={1} />}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div style={{ position: "absolute", bottom: 16, left: 16, background: `${BG.surface}ee`, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Distress Level</div>
            {Object.entries(DISTRESS_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 mb-2">
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: v.color }} />
                <span style={{ fontSize: 10, color: TEXT.secondary }}>{v.label}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: 16, right: selectedNode ? "316px" : 16, background: `${BG.surface}ee`, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Entity Types</div>
            {Object.entries(KIND_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 mb-2">
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: v.color }} />
                <span style={{ fontSize: 10, color: TEXT.secondary, textTransform: "capitalize" }}>{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div style={{ width: 300, borderLeft: `1px solid ${BORDER.subtle}`, background: BG.surface, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${KIND_CONFIG[selectedNode.kind].color}18`, border: `1px solid ${KIND_CONFIG[selectedNode.kind].color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: KIND_CONFIG[selectedNode.kind].color }}>
                  {selectedNode.kind === "owner" ? "○" : selectedNode.kind === "property" ? "◻" : selectedNode.kind === "entity" ? "◆" : "!"}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, lineHeight: 1.3 }}>{selectedNode.label}</div>
                {selectedNode.subLabel && <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 2 }}>{selectedNode.subLabel}</div>}
                <div style={{ marginTop: 6, display: "flex", gap: 5 }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${KIND_CONFIG[selectedNode.kind].color}15`, color: KIND_CONFIG[selectedNode.kind].color, textTransform: "capitalize", fontWeight: 600 }}>{selectedNode.kind}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${DISTRESS_CONFIG[selectedNode.distressSignal].color}15`, color: DISTRESS_CONFIG[selectedNode.distressSignal].color, fontWeight: 600 }}>{DISTRESS_CONFIG[selectedNode.distressSignal].label}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ color: TEXT.tertiary, cursor: "pointer", background: "none", border: "none" }}><X style={{ width: 13, height: 13 }} /></button>
            </div>

            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Entity Data</div>
              {Object.entries(selectedNode.meta).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${BORDER.subtle}`, paddingBottom: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: TEXT.tertiary, flexShrink: 0, marginRight: 10 }}>{k}</span>
                  <span style={{ fontSize: 11, color: k === "Alert" || k === "Portfolio Issue" ? "#f97316" : TEXT.primary, textAlign: "right", lineHeight: 1.4 }}>{v}</span>
                </div>
              ))}
            </div>

            {selectedNode.connections.length > 0 && (
              <div style={{ padding: "0 18px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Connected Entities</div>
                {selectedNode.connections.map(cid => {
                  const cn = NODES.find(n => n.id === cid);
                  if (!cn) return null;
                  const kcfg = KIND_CONFIG[cn.kind];
                  return (
                    <div key={cid} onClick={() => setSelectedNode(cn)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: `${kcfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, color: kcfg.color }}>{cn.kind === "owner" ? "○" : cn.kind === "property" ? "◻" : "◆"}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cn.label}</div>
                        <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "capitalize" }}>{cn.kind}</div>
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: DISTRESS_CONFIG[cn.distressSignal].color, flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
