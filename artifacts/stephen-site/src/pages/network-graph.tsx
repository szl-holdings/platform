import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Network, Building2, Briefcase, Users, ArrowRight, Info } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface NetworkNode {
  id: string;
  name: string;
  role: string;
  org: string;
  type: "co-investor" | "board" | "advisor" | "media" | "operator" | "partner";
  strength: number;
  x: number;
  y: number;
  connections: string[];
  tags: string[];
}

interface NetworkEdge {
  source: string;
  target: string;
  type: "co-investment" | "board" | "advisory" | "collaboration" | "media";
  label?: string;
}

const NODES: NetworkNode[] = [
  { id: "stephen", name: "Stephen Lutar", role: "Founder & CEO", org: "SZL Holdings", type: "operator", strength: 100, x: 50, y: 50, connections: ["dk", "mj", "rl", "sr", "aw", "jf", "tc", "pb", "eg", "ht", "ns"], tags: [] },
  { id: "dk", name: "David K.", role: "Managing Partner", org: "Andreessen Horowitz", type: "co-investor", strength: 92, x: 20, y: 25, connections: ["stephen", "mj", "rl"], tags: ["co-investment", "advisory"] },
  { id: "mj", name: "Marcus J.", role: "Partner", org: "Blackrock Alternatives", type: "co-investor", strength: 88, x: 78, y: 20, connections: ["stephen", "dk"], tags: ["advisory"] },
  { id: "rl", name: "Rachel L.", role: "Chief Digital Officer", org: "DP World", type: "partner", strength: 85, x: 15, y: 60, connections: ["stephen", "dk", "ht"], tags: ["vessels", "maritime"] },
  { id: "sr", name: "Simon R.", role: "CTO", org: "Lloyd's of London", type: "partner", strength: 82, x: 82, y: 42, connections: ["stephen", "jf"], tags: ["vessels", "maritime", "advisory"] },
  { id: "aw", name: "Amanda W.", role: "Editor, Technology", org: "Financial Times", type: "media", strength: 74, x: 30, y: 78, connections: ["stephen", "tc"], tags: ["media", "articles"] },
  { id: "jf", name: "James F.", role: "CEO", org: "CrowdStrike", type: "partner", strength: 80, x: 68, y: 78, connections: ["stephen", "sr", "ns"], tags: ["aegis", "advisory"] },
  { id: "tc", name: "Thomas C.", role: "Senior Partner", org: "McKinsey & Company", type: "advisor", strength: 76, x: 10, y: 42, connections: ["stephen", "aw"], tags: ["advisory", "strategy"] },
  { id: "pb", name: "Priya B.", role: "Managing Director", org: "Goldman Sachs TMP", type: "co-investor", strength: 78, x: 85, y: 62, connections: ["stephen", "eg"], tags: ["advisory", "capital"] },
  { id: "eg", name: "Elena G.", role: "Chief AI Officer", org: "Microsoft Azure", type: "partner", strength: 72, x: 60, y: 20, connections: ["stephen", "pb", "ns"], tags: ["lyte", "technology"] },
  { id: "ht", name: "Henry T.", role: "Founder", org: "VesselTrack AI", type: "co-investor", strength: 88, x: 35, y: 18, connections: ["stephen", "rl"], tags: ["vessels", "co-investment"] },
  { id: "ns", name: "Nadia S.", role: "CEO", org: "Sentinel Labs", type: "partner", strength: 76, x: 88, y: 30, connections: ["stephen", "jf", "eg"], tags: ["aegis", "security"] },
];

const EDGES: NetworkEdge[] = [
  { source: "stephen", target: "dk", type: "co-investment", label: "VesselTrack Series B" },
  { source: "stephen", target: "mj", type: "advisory", label: "Blackrock AI Advisory" },
  { source: "stephen", target: "rl", type: "collaboration", label: "Vessels × DP World" },
  { source: "stephen", target: "sr", type: "board", label: "Lloyd's AI Working Group" },
  { source: "stephen", target: "aw", type: "media", label: "FT Series + Op-Eds" },
  { source: "stephen", target: "jf", type: "advisory", label: "Aegis × CrowdStrike" },
  { source: "stephen", target: "tc", type: "advisory", label: "McKinsey Advisor" },
  { source: "stephen", target: "pb", type: "co-investment", label: "Goldman Co-Sponsor" },
  { source: "stephen", target: "eg", type: "collaboration", label: "Azure × Lyte" },
  { source: "stephen", target: "ht", type: "co-investment", label: "VesselTrack Founding" },
  { source: "stephen", target: "ns", type: "collaboration", label: "Aegis × Sentinel" },
];

const typeConfig: Record<NetworkNode["type"], { color: string; bg: string; border: string; label: string }> = {
  "co-investor": { color: "text-primary", bg: "bg-primary/20", border: "border-primary/40", label: "Co-Investor" },
  board: { color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40", label: "Board" },
  advisor: { color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", label: "Advisor" },
  media: { color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/40", label: "Media" },
  operator: { color: "text-white", bg: "bg-white/10", border: "border-white/30", label: "You" },
  partner: { color: "text-sky-400", bg: "bg-sky-500/20", border: "border-sky-500/40", label: "Partner" },
};

const edgeTypeColor: Record<NetworkEdge["type"], string> = {
  "co-investment": "stroke-primary",
  board: "stroke-amber-500",
  advisory: "stroke-emerald-500",
  collaboration: "stroke-sky-500",
  media: "stroke-rose-500",
};

const FILTERS: NetworkNode["type"][] = ["co-investor", "board", "advisor", "media", "operator", "partner"];

function getEdgeKey(a: string, b: string) { return [a, b].sort().join("—"); }

export default function NetworkGraph() {
  usePageMeta({
    title: "Network Graph | Stephen Lutar",
    description: "Visual map of professional relationships, co-investments, shared board seats, and collaboration history.",
    canonical: "https://szlholdings.com/stephen/network",
  });

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<NetworkNode["type"]>>(new Set(FILTERS));

  function toggleFilter(type: NetworkNode["type"]) {
    if (type === "operator") return;
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  const visibleNodes = NODES.filter(n => activeFilters.has(n.type));
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = EDGES.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

  const selectedEdges = selectedNode
    ? visibleEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const nodeById = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            Network Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Professional relationships, co-investments, board seats, and collaboration history</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.filter(f => f !== "operator").map(f => {
            const cfg = typeConfig[f];
            const active = activeFilters.has(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize ${active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-muted/20 border-border text-muted-foreground"}`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Connections", value: String(NODES.length - 1), icon: Users, color: "text-primary" },
          { label: "Co-Investments", value: String(NODES.filter(n => n.type === "co-investor").length), icon: Briefcase, color: "text-primary" },
          { label: "Strategic Partners", value: String(NODES.filter(n => n.type === "partner").length), icon: Building2, color: "text-sky-400" },
          { label: "Active Collaborations", value: String(EDGES.filter(e => e.type === "collaboration").length), icon: Network, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><p className="text-xs text-muted-foreground">{label}</p></div><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ paddingBottom: "66%" }}>
                <svg
                  viewBox="0 0 100 66"
                  className="absolute inset-0 w-full h-full"
                  style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.04) 0%, transparent 70%)" }}
                >
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="0.4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {visibleEdges.map(edge => {
                    const s = nodeById[edge.source];
                    const t = nodeById[edge.target];
                    if (!s || !t) return null;
                    const key = getEdgeKey(edge.source, edge.target);
                    const isHighlighted = hoveredEdge === key || selectedEdges.some(se => getEdgeKey(se.source, se.target) === key);
                    return (
                      <line
                        key={key}
                        x1={`${s.x}`} y1={`${s.y * 0.66}`}
                        x2={`${t.x}`} y2={`${t.y * 0.66}`}
                        className={`${edgeTypeColor[edge.type]} transition-all`}
                        strokeWidth={isHighlighted ? "0.5" : "0.2"}
                        strokeOpacity={isHighlighted ? 0.8 : 0.25}
                        strokeDasharray={edge.type === "media" ? "1 1" : edge.type === "advisory" ? "0.5 0.5" : undefined}
                        onMouseEnter={() => setHoveredEdge(key)}
                        onMouseLeave={() => setHoveredEdge(null)}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  })}

                  {visibleNodes.map(node => {
                    const cfg = typeConfig[node.type];
                    const isSelected = selectedNode?.id === node.id;
                    const isConnected = selectedNode ? selectedNode.connections.includes(node.id) || node.connections.includes(selectedNode.id) : false;
                    const dimmed = selectedNode && !isSelected && !isConnected;
                    const r = node.id === "stephen" ? 3.5 : 1.8 + (node.strength / 100) * 1.2;

                    return (
                      <g key={node.id} style={{ cursor: "pointer" }} onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}>
                        <circle
                          cx={`${node.x}`}
                          cy={`${node.y * 0.66}`}
                          r={r + 1}
                          fill="transparent"
                          className="stroke-primary/0 hover:stroke-primary/30"
                          strokeWidth="0.4"
                        />
                        <circle
                          cx={`${node.x}`}
                          cy={`${node.y * 0.66}`}
                          r={r}
                          className={`${cfg.bg.replace("bg-", "fill-").replace("/20", "/40")} transition-all`}
                          strokeWidth={isSelected ? "0.5" : "0.2"}
                          stroke={isSelected ? "white" : dimmed ? "transparent" : "rgba(255,255,255,0.2)"}
                          opacity={dimmed ? 0.3 : 1}
                          filter={isSelected || isConnected ? "url(#glow)" : undefined}
                        />
                        {node.id === "stephen" && (
                          <text
                            x={`${node.x}`}
                            y={`${node.y * 0.66 + 0.5}`}
                            textAnchor="middle"
                            fontSize="1.8"
                            fill="white"
                            fontWeight="bold"
                            style={{ userSelect: "none" }}
                          >SL</text>
                        )}
                        <text
                          x={`${node.x}`}
                          y={`${node.y * 0.66 + r + 1.4}`}
                          textAnchor="middle"
                          fontSize={node.id === "stephen" ? "1.6" : "1.2"}
                          fill={dimmed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)"}
                          style={{ userSelect: "none" }}
                        >
                          {node.name.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap">
                <Info className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Click any node to explore connections. Edge types: </span>
                {Object.entries({ "co-investment": "—", advisory: "·—", collaboration: "—", media: "···" }).map(([type, dash]) => (
                  <span key={type} className={`text-[10px] ${edgeTypeColor[type as NetworkEdge["type"]].replace("stroke-", "text-")}`}>{dash} {type}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedNode && selectedNode.id !== "stephen" ? (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${typeConfig[selectedNode.type].color} ${typeConfig[selectedNode.type].border} ${typeConfig[selectedNode.type].bg}`}>
                    {typeConfig[selectedNode.type].label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Strength: <span className="text-primary font-bold">{selectedNode.strength}</span></span>
                </div>
                <CardTitle className="text-base">{selectedNode.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{selectedNode.role} · {selectedNode.org}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship</p>
                  <div className="space-y-1.5">
                    {selectedEdges.map(edge => (
                      <div key={getEdgeKey(edge.source, edge.target)} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${edgeTypeColor[edge.type].replace("stroke-", "bg-")}`} />
                        <span className="text-xs text-muted-foreground capitalize">{edge.type}</span>
                        {edge.label && <span className="text-[10px] text-foreground/60">· {edge.label}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedNode.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Context</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[9px] capitalize">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Shared Connections</p>
                  <div className="space-y-1">
                    {NODES.filter(n => n.id !== "stephen" && n.id !== selectedNode.id && n.connections.includes(selectedNode.id)).map(shared => (
                      <button
                        key={shared.id}
                        onClick={() => setSelectedNode(shared)}
                        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-left"
                      >
                        <span>{shared.name} · <span className="text-[10px]">{shared.org}</span></span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                    {NODES.filter(n => n.id !== "stephen" && n.id !== selectedNode.id && n.connections.includes(selectedNode.id)).length === 0 && (
                      <p className="text-[10px] text-muted-foreground/50">No shared second-degree connections</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Relationship Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FILTERS.filter(f => f !== "operator").map(f => {
                  const cfg = typeConfig[f];
                  const count = NODES.filter(n => n.type === f).length;
                  return (
                    <div key={f} className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold ${cfg.color} w-20`}>{cfg.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.bg.replace("/20", "/60")} rounded-full`} style={{ width: `${(count / (NODES.length - 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Key Relationships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {NODES.filter(n => n.id !== "stephen" && n.strength >= 82).map(n => {
                const cfg = typeConfig[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${selectedNode?.id === n.id ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10 hover:border-muted-foreground/20"}`}
                  >
                    <div className={`w-6 h-6 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center text-[8px] font-bold ${cfg.color} shrink-0`}>
                      {n.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{n.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{n.org}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-primary font-bold">{n.strength}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
