import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Network, Activity, AlertTriangle, Clock, ArrowRight, Pause, Play,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, Filter, Info, ChevronRight
} from "lucide-react";

interface AgentNode {
  id: string;
  name: string;
  domain: string;
  status: "active" | "idle" | "processing" | "error" | "delegating";
  currentTask: string;
  latency: number;
  runCount: number;
  errorRate: number;
  x: number;
  y: number;
  size: number;
}

interface DataEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  latency: number;
  dataRate: number;
  type: "delegation" | "data" | "validation" | "feedback";
  active: boolean;
}

interface SwarmEvent {
  timestamp: string;
  type: string;
  message: string;
  agentId?: string;
}

const INITIAL_NODES: AgentNode[] = [
  { id: "alloy", name: "Alloy", domain: "Orchestrator", status: "processing", currentTask: "Routing multi-agent maritime investigation", latency: 120, runCount: 1842, errorRate: 0.2, x: 320, y: 200, size: 24 },
  { id: "helmsman", name: "Helmsman v3", domain: "Maritime", status: "active", currentTask: "Analyzing AIS gap for MV Aurora Star", latency: 890, runCount: 6180, errorRate: 2.7, x: 180, y: 100, size: 18 },
  { id: "sentinel", name: "Sentinel v4", domain: "Security", status: "processing", currentTask: "OFAC secondary screening — 3 entities", latency: 680, runCount: 8240, errorRate: 0.9, x: 460, y: 100, size: 18 },
  { id: "docminer", name: "DocMiner v2", domain: "Legal", status: "idle", currentTask: "Awaiting document queue", latency: 1840, runCount: 11420, errorRate: 5.2, x: 140, y: 310, size: 16 },
  { id: "beacon", name: "Beacon v3", domain: "Analytics", status: "active", currentTask: "Anomaly detection on KPI streams", latency: 440, runCount: 14800, errorRate: 1.6, x: 500, y: 310, size: 16 },
  { id: "oracle", name: "Oracle v1", domain: "Analytics", status: "idle", currentTask: "Forecasting standby", latency: 3200, runCount: 1840, errorRate: 10.3, x: 320, y: 360, size: 14 },
  { id: "zeus", name: "Zeus v3", domain: "Infra", status: "error", currentTask: "Accuracy SLA breach — auto-remediation in progress", latency: 1920, runCount: 4820, errorRate: 11.8, x: 220, y: 380, size: 14 },
];

const INITIAL_EDGES: DataEdge[] = [
  { id: "e1", from: "alloy", to: "helmsman", label: "Delegate: AIS investigation", latency: 24, dataRate: 1.2, type: "delegation", active: true },
  { id: "e2", from: "alloy", to: "sentinel", label: "Delegate: OFAC screening", latency: 18, dataRate: 0.8, type: "delegation", active: true },
  { id: "e3", from: "helmsman", to: "sentinel", label: "Entity list: 4 companies", latency: 340, dataRate: 0.3, type: "data", active: true },
  { id: "e4", from: "sentinel", to: "beacon", label: "Risk metrics: composite score", latency: 210, dataRate: 0.2, type: "data", active: false },
  { id: "e5", from: "sentinel", to: "alloy", label: "Result: CRITICAL — SDN match", latency: 890, dataRate: 0.5, type: "feedback", active: true },
  { id: "e6", from: "helmsman", to: "alloy", label: "Result: AIS anomaly confirmed", latency: 1240, dataRate: 0.4, type: "feedback", active: false },
  { id: "e7", from: "alloy", to: "docminer", label: "Queue: 2 BVI filings", latency: 15, dataRate: 1.1, type: "delegation", active: false },
  { id: "e8", from: "beacon", to: "alloy", label: "Telemetry: latency alert", latency: 180, dataRate: 0.1, type: "feedback", active: true },
];

const EVENTS: SwarmEvent[] = [
  { timestamp: "10:44:02", type: "delegation", message: "Alloy delegated OFAC screening to Sentinel v4", agentId: "sentinel" },
  { timestamp: "10:44:08", type: "data", message: "Helmsman sent entity list (4 companies) to Sentinel", agentId: "helmsman" },
  { timestamp: "10:44:21", type: "result", message: "Sentinel: CRITICAL — secondary SDN connection detected", agentId: "sentinel" },
  { timestamp: "10:44:29", type: "alert", message: "Zeus v3: SLA breach — accuracy below 95% threshold", agentId: "zeus" },
  { timestamp: "10:44:35", type: "remediation", message: "Zeus v3: Auto-remediation triggered — model swap initiated", agentId: "zeus" },
  { timestamp: "10:44:41", type: "delegation", message: "Alloy queued DocMiner for BVI corporate filings", agentId: "docminer" },
  { timestamp: "10:44:48", type: "telemetry", message: "Beacon: Anomaly detected in KPI stream — notifying Alloy", agentId: "beacon" },
];

const STATUS_COLOR: Record<AgentNode["status"], string> = {
  active: "#22c55e",
  idle: "hsl(238,10%,35%)",
  processing: "hsl(258,80%,62%)",
  error: "#f43f5e",
  delegating: "#f59e0b",
};

const EDGE_COLOR: Record<DataEdge["type"], string> = {
  delegation: "hsl(258,80%,62%)",
  data: "#3b82f6",
  validation: "#22d3ee",
  feedback: "#f59e0b",
};

const DOMAIN_COLOR: Record<string, string> = {
  Orchestrator: "hsl(258,80%,62%)",
  Maritime: "#3b82f6",
  Security: "#f43f5e",
  Legal: "#f59e0b",
  Analytics: "#10b981",
  Infra: "#f97316",
};

const EVENT_COLOR: Record<string, string> = {
  delegation: "text-[hsl(258,80%,72%)]",
  data: "text-blue-400",
  result: "text-emerald-400",
  alert: "text-red-400",
  remediation: "text-amber-400",
  telemetry: "text-cyan-400",
};

function ForceGraph({ nodes, edges, selectedId, onSelect, paused }: {
  nodes: AgentNode[]; edges: DataEdge[]; selectedId: string | null;
  onSelect: (id: string | null) => void; paused: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animOffset, setAnimOffset] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setAnimOffset(o => (o + 1) % 100), 50);
    return () => clearInterval(timer);
  }, [paused]);

  const W = 640, H = 480;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ background: "hsl(228,25%,4%)" }}
      onClick={() => onSelect(null)}
    >
      <defs>
        {Object.entries(EDGE_COLOR).map(([type, color]) => (
          <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={color} opacity="0.8" />
          </marker>
        ))}
      </defs>

      {/* Grid */}
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsla(0,0%,100%,0.02)" strokeWidth="1" />
      </pattern>
      <rect width={W} height={H} fill="url(#grid)" />

      {/* Edges */}
      {edges.map(edge => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (!from || !to) return null;
        const color = EDGE_COLOR[edge.type];
        const selected = selectedId === edge.from || selectedId === edge.to;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len;
        const lineStart = { x: from.x + ux * (from.size + 2), y: from.y + uy * (from.size + 2) };
        const lineEnd = { x: to.x - ux * (to.size + 8), y: to.y - uy * (to.size + 8) };

        return (
          <g key={edge.id} opacity={selected ? 1 : (selectedId ? 0.2 : (edge.active ? 0.8 : 0.3))}>
            <line
              x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y}
              stroke={color} strokeWidth={selected ? 2 : 1}
              strokeDasharray={edge.active ? "4 3" : ""}
              strokeDashoffset={edge.active ? -animOffset : 0}
              markerEnd={`url(#arrow-${edge.type})`}
            />
            {selected && (
              <text x={midX} y={midY - 8} textAnchor="middle" fontSize="9" fill={color} opacity="0.9">
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const color = STATUS_COLOR[node.status];
        const domColor = DOMAIN_COLOR[node.domain] || "hsl(258,80%,62%)";
        const selected = selectedId === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            onClick={e => { e.stopPropagation(); onSelect(node.id); }}
            style={{ cursor: "pointer" }}
            opacity={selectedId && !selected ? 0.4 : 1}
          >
            {selected && (
              <circle r={node.size + 8} fill={domColor} opacity="0.1" />
            )}
            {node.status === "processing" && (
              <circle r={node.size + 4} fill="none" stroke={color} strokeWidth="1" opacity="0.3">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              r={node.size}
              fill={`${domColor}22`}
              stroke={selected ? domColor : color}
              strokeWidth={selected ? 2 : 1.5}
            />
            <circle r={node.size * 0.4} fill={color} />
            {node.status === "error" && (
              <text y={-node.size - 6} textAnchor="middle" fontSize="12" fill="#f43f5e">!</text>
            )}
            <text y={node.size + 14} textAnchor="middle" fontSize="10" fill="hsla(0,0%,100%,0.8)" fontFamily="monospace">
              {node.name}
            </text>
            <text y={node.size + 24} textAnchor="middle" fontSize="8" fill="hsla(0,0%,100%,0.4)" fontFamily="monospace">
              {node.latency}ms
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AgentSwarm() {
  const [nodes] = useState<AgentNode[]>(INITIAL_NODES);
  const [edges] = useState<DataEdge[]>(INITIAL_EDGES);
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeEvents, setActiveEvents] = useState<SwarmEvent[]>(EVENTS.slice(0, 3));
  const [showEdgeType, setShowEdgeType] = useState<string | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveEvents(prev => {
        const nextIdx = prev.length % EVENTS.length;
        return [...prev.slice(-6), EVENTS[nextIdx]!];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [paused]);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const connectedEdges = edges.filter(e => e.from === selectedId || e.to === selectedId);

  const displayEdges = showEdgeType ? edges.filter(e => e.type === showEdgeType) : edges;

  const bottlenecks = nodes.filter(n => n.errorRate > 8 || n.status === "error");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Graph area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[hsl(226_24%_4%)]">
          <Network className="w-4 h-4 text-[hsl(258,80%,62%)]" />
          <span className="font-display font-bold text-sm text-foreground">Agent Swarm — Live A2A Network</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {Object.entries(EDGE_COLOR).map(([type, color]) => (
                <button
                  key={type}
                  onClick={() => setShowEdgeType(showEdgeType === type ? null : type)}
                  className={cn("flex items-center gap-1 px-2 py-0.5 rounded capitalize transition-colors text-xs", showEdgeType === type ? "bg-white/10 text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  <div className="w-2 h-0.5" style={{ backgroundColor: color }} />
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPaused(!paused)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all", paused ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}
            >
              {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <div className={cn("w-2 h-2 rounded-full", paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse")} />
          </div>
        </div>
        <div className="flex-1 relative">
          <ForceGraph
            nodes={nodes}
            edges={displayEdges}
            selectedId={selectedId}
            onSelect={setSelectedId}
            paused={paused}
          />
          {bottlenecks.length > 0 && (
            <div className="absolute top-3 right-3 space-y-1.5">
              {bottlenecks.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-red-500/15 border border-red-500/25 rounded text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {b.name}: {b.errorRate}% error rate
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 border-l border-border flex flex-col bg-[hsl(226_24%_4%)]">
        {selectedNode ? (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[selectedNode.status] }} />
                <div className="text-sm font-semibold text-foreground">{selectedNode.name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{selectedNode.domain} · {selectedNode.status}</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-[hsl(228,20%,7%)] rounded-lg text-xs space-y-2">
                <div className="text-muted-foreground font-medium mb-1">Current Task</div>
                <div className="text-foreground leading-relaxed">{selectedNode.currentTask}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Latency", value: `${selectedNode.latency}ms` },
                  { label: "Runs", value: selectedNode.runCount.toLocaleString() },
                  { label: "Error Rate", value: `${selectedNode.errorRate}%` },
                  { label: "Domain", value: selectedNode.domain },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[hsl(228,20%,7%)] rounded-lg p-2 text-center">
                    <div className="text-xs font-mono font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {connectedEdges.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Connections</div>
                  <div className="space-y-1.5">
                    {connectedEdges.map(edge => {
                      const partner = nodes.find(n => n.id === (edge.from === selectedId ? edge.to : edge.from));
                      const dir = edge.from === selectedId ? "→" : "←";
                      return (
                        <button
                          key={edge.id}
                          onClick={() => setSelectedId(edge.from === selectedId ? edge.to : edge.from)}
                          className={cn("w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-secondary/30 text-left transition-colors", edge.active ? "opacity-100" : "opacity-40")}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EDGE_COLOR[edge.type] }} />
                          <span className="text-muted-foreground">{dir} {partner?.name}</span>
                          <span className="ml-auto text-muted-foreground font-mono">{edge.latency}ms</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Swarm Status</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Active", count: nodes.filter(n => n.status === "active" || n.status === "processing").length, color: "#22c55e" },
                { label: "Idle", count: nodes.filter(n => n.status === "idle").length, color: "hsl(238,10%,35%)" },
                { label: "Error", count: nodes.filter(n => n.status === "error").length, color: "#f43f5e" },
                { label: "Flows", count: edges.filter(e => e.active).length, color: "hsl(258,80%,62%)" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-[hsl(228,20%,7%)] rounded-lg p-2 text-center">
                  <div className="text-lg font-display font-bold" style={{ color }}>{count}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Click a node to inspect</div>
          </div>
        )}

        {/* Live event stream */}
        <div className="border-t border-border">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[hsl(258,80%,62%)]" />
            <span className="text-xs font-medium text-foreground">Live Event Stream</span>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto max-h-64">
            {[...activeEvents].reverse().map((ev, i) => (
              <div key={i} className={cn("flex items-start gap-2 text-xs py-1 animate-fade-in", i === 0 ? "opacity-100" : "opacity-60")}>
                <span className="font-mono text-muted-foreground flex-shrink-0">{ev.timestamp}</span>
                <span className={cn("leading-snug", EVENT_COLOR[ev.type] ?? "text-foreground")}>{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
