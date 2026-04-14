import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Brain, Clock, Pin, Trash2, Network, ChevronDown, ChevronUp,
  Database, Layers, TrendingUp, Search
} from "lucide-react";

interface MemoryNode {
  id: string;
  label: string;
  type: "fact" | "context" | "instruction" | "relationship";
  weight: number;
  lastAccessed: string;
  formed: string;
  connections: string[];
}

interface AgentMemory {
  agentId: string;
  agentName: string;
  domain: string;
  totalFacts: number;
  utilization: number;
  nodes: MemoryNode[];
}

interface MemoryViewerProps {
  agentId?: string | null;
  onClose?: () => void;
}

const AGENT_MEMORIES: Record<string, AgentMemory> = {
  alloy: {
    agentId: "alloy", agentName: "Alloy", domain: "orchestration",
    totalFacts: 142, utilization: 68,
    nodes: [
      { id: "n1", label: "SZL Holdings org structure", type: "fact", weight: 0.95, lastAccessed: "2026-04-13T10:42:00Z", formed: "2026-01-08T09:00:00Z", connections: ["n2", "n3"] },
      { id: "n2", label: "Cross-agent routing policy", type: "instruction", weight: 0.92, lastAccessed: "2026-04-13T10:30:00Z", formed: "2026-02-15T14:00:00Z", connections: ["n1", "n4"] },
      { id: "n3", label: "High-stakes escalation thresholds", type: "instruction", weight: 0.88, lastAccessed: "2026-04-12T18:00:00Z", formed: "2026-03-01T10:00:00Z", connections: ["n1", "n5"] },
      { id: "n4", label: "Sentinel maker-checker protocol", type: "context", weight: 0.85, lastAccessed: "2026-04-13T09:00:00Z", formed: "2026-02-20T08:00:00Z", connections: ["n2"] },
      { id: "n5", label: "Fleet emergency contact chain", type: "relationship", weight: 0.79, lastAccessed: "2026-04-11T16:00:00Z", formed: "2026-01-20T12:00:00Z", connections: ["n3"] },
    ],
  },
  helmsman: {
    agentId: "helmsman", agentName: "Helmsman", domain: "maritime",
    totalFacts: 287, utilization: 81,
    nodes: [
      { id: "n1", label: "Active vessel: MV Kestrel Bay", type: "context", weight: 0.97, lastAccessed: "2026-04-13T11:00:00Z", formed: "2026-04-10T06:00:00Z", connections: ["n2", "n3"] },
      { id: "n2", label: "Route: Singapore → Rotterdam", type: "fact", weight: 0.94, lastAccessed: "2026-04-13T10:55:00Z", formed: "2026-04-10T06:10:00Z", connections: ["n1", "n4"] },
      { id: "n3", label: "Crew manifest (12 persons)", type: "fact", weight: 0.88, lastAccessed: "2026-04-13T08:00:00Z", formed: "2026-04-10T06:15:00Z", connections: ["n1"] },
      { id: "n4", label: "Suez Canal passage timing", type: "instruction", weight: 0.82, lastAccessed: "2026-04-12T20:00:00Z", formed: "2026-04-11T14:00:00Z", connections: ["n2", "n5"] },
      { id: "n5", label: "Sanctions watchlist: 3 ports", type: "instruction", weight: 0.91, lastAccessed: "2026-04-13T07:00:00Z", formed: "2026-03-15T09:00:00Z", connections: ["n4"] },
      { id: "n6", label: "Weather pattern: Bay of Biscay advisory", type: "context", weight: 0.75, lastAccessed: "2026-04-12T22:00:00Z", formed: "2026-04-12T18:00:00Z", connections: ["n2"] },
    ],
  },
  sentinel: {
    agentId: "sentinel", agentName: "Sentinel", domain: "security",
    totalFacts: 412, utilization: 74,
    nodes: [
      { id: "n1", label: "CVE-2026-1847 — Critical RCE", type: "fact", weight: 0.99, lastAccessed: "2026-04-13T10:58:00Z", formed: "2026-04-13T08:00:00Z", connections: ["n2", "n3"] },
      { id: "n2", label: "Affected: nginx < 1.25.4", type: "fact", weight: 0.98, lastAccessed: "2026-04-13T10:58:00Z", formed: "2026-04-13T08:05:00Z", connections: ["n1", "n4"] },
      { id: "n3", label: "Patch schedule: 2026-04-15", type: "instruction", weight: 0.95, lastAccessed: "2026-04-13T09:00:00Z", formed: "2026-04-13T08:10:00Z", connections: ["n1"] },
      { id: "n4", label: "Zeus infra exposure surface", type: "relationship", weight: 0.87, lastAccessed: "2026-04-13T10:30:00Z", formed: "2026-04-12T16:00:00Z", connections: ["n2", "n5"] },
      { id: "n5", label: "Incident response runbook v4", type: "instruction", weight: 0.90, lastAccessed: "2026-04-13T06:00:00Z", formed: "2026-03-01T09:00:00Z", connections: ["n4"] },
    ],
  },
  inca: {
    agentId: "inca", agentName: "INCA", domain: "research",
    totalFacts: 198, utilization: 55,
    nodes: [
      { id: "n1", label: "Current project: Agent eval framework", type: "context", weight: 0.92, lastAccessed: "2026-04-13T10:15:00Z", formed: "2026-04-01T10:00:00Z", connections: ["n2", "n3"] },
      { id: "n2", label: "LangSmith comparison benchmark", type: "fact", weight: 0.85, lastAccessed: "2026-04-13T09:30:00Z", formed: "2026-04-05T14:00:00Z", connections: ["n1"] },
      { id: "n3", label: "arXiv papers queued: 14", type: "fact", weight: 0.78, lastAccessed: "2026-04-13T10:00:00Z", formed: "2026-04-13T08:00:00Z", connections: ["n1", "n4"] },
      { id: "n4", label: "HuggingFace model shortlist (Qwen3)", type: "fact", weight: 0.82, lastAccessed: "2026-04-12T15:00:00Z", formed: "2026-04-10T11:00:00Z", connections: ["n3"] },
    ],
  },
};

function nodeTypeColor(type: MemoryNode["type"]) {
  if (type === "fact") return "bg-blue-500/15 border-blue-500/30 text-blue-400";
  if (type === "instruction") return "bg-violet-500/15 border-violet-500/30 text-violet-400";
  if (type === "context") return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
  return "bg-amber-500/15 border-amber-500/30 text-amber-400";
}

function nodeTypeDot(type: MemoryNode["type"]) {
  if (type === "fact") return "bg-blue-400";
  if (type === "instruction") return "bg-violet-400";
  if (type === "context") return "bg-emerald-400";
  return "bg-amber-400";
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

export function AgentMemoryViewer({ agentId, onClose }: MemoryViewerProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>(agentId ?? "alloy");
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const memory = AGENT_MEMORIES[selectedAgent];
  if (!memory) return null;

  const filteredNodes = memory.nodes.filter(n =>
    !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedNodes = [...filteredNodes].sort((a, b) => b.weight - a.weight);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent Memory Viewer</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Persistent memory visualization — facts, context, and relationships each agent carries across sessions.
        </p>
      </div>

      {/* Agent selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.values(AGENT_MEMORIES).map(a => (
          <button
            key={a.agentId}
            onClick={() => setSelectedAgent(a.agentId)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              selectedAgent === a.agentId
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {a.agentName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Memory Stats */}
        <div className="lg:col-span-1 space-y-3">
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Memory Profile</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-semibold text-foreground">{memory.agentName}</div>
                <div className="text-xs text-muted-foreground capitalize">{memory.domain} domain</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Memory Utilization</span>
                  <span className="text-foreground font-mono">{memory.utilization}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${memory.utilization}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Facts</span>
                <span className="text-foreground font-mono">{memory.totalFacts}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active Nodes</span>
                <span className="text-foreground font-mono">{memory.nodes.length}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Node Types</div>
              <div className="space-y-1.5">
                {(["fact", "instruction", "context", "relationship"] as const).map(type => {
                  const count = memory.nodes.filter(n => n.type === type).length;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", nodeTypeDot(type))} />
                      <span className="text-xs text-muted-foreground capitalize flex-1">{type}</span>
                      <span className="text-xs text-foreground font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Actions</div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors">
                <Pin className="w-3.5 h-3.5" /> Pin Key Context
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear Stale Memories
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                <Database className="w-3.5 h-3.5" /> Export Memory Snapshot
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Graph + Nodes */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memory nodes..."
              className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Knowledge Graph Visual */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Knowledge Graph</div>
            </div>
            <div className="relative h-40 bg-background/60 rounded-lg overflow-hidden border border-border/50">
              <svg width="100%" height="100%" viewBox="0 0 600 160">
                {/* Connection lines */}
                {sortedNodes.map((node, i) => {
                  const x = 60 + (i % 5) * 110;
                  const y = i < 5 ? 50 : 110;
                  return node.connections.map(connId => {
                    const connIdx = sortedNodes.findIndex(n => n.id === connId);
                    if (connIdx === -1) return null;
                    const cx = 60 + (connIdx % 5) * 110;
                    const cy = connIdx < 5 ? 50 : 110;
                    return (
                      <line key={`${node.id}-${connId}`} x1={x} y1={y} x2={cx} y2={cy}
                        stroke="hsla(262,82%,62%,0.2)" strokeWidth="1" strokeDasharray="4 3" />
                    );
                  });
                })}
                {/* Nodes */}
                {sortedNodes.map((node, i) => {
                  const x = 60 + (i % 5) * 110;
                  const y = i < 5 ? 50 : 110;
                  const r = 8 + node.weight * 8;
                  const isExpanded = expandedNode === node.id;
                  return (
                    <g key={node.id} style={{ cursor: "pointer" }} onClick={() => setExpandedNode(isExpanded ? null : node.id)}>
                      <circle cx={x} cy={y} r={r}
                        fill={`hsla(262,82%,62%,${node.weight * 0.25})`}
                        stroke={isExpanded ? "hsl(262,82%,62%)" : `hsla(262,82%,62%,0.4)`}
                        strokeWidth={isExpanded ? 2 : 1}
                      />
                      <text x={x} y={y + r + 12} textAnchor="middle" fontSize="8" fill="hsl(238,10%,48%)">
                        {node.label.slice(0, 14)}{node.label.length > 14 ? "…" : ""}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Node size = memory weight</span>
              <span>Click node to expand</span>
              <div className="flex items-center gap-3 ml-auto">
                {(["fact", "instruction", "context", "relationship"] as const).map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", nodeTypeDot(t))} />
                    <span className="capitalize">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Node List */}
          <div className="inca-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Memory Nodes</span>
              </div>
              <span className="text-xs text-muted-foreground">{sortedNodes.length} nodes</span>
            </div>
            <div className="divide-y divide-border/30">
              {sortedNodes.map(node => (
                <div key={node.id}>
                  <button
                    onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", nodeTypeDot(node.type))} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground">{node.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Formed {relativeTime(node.formed)} · Accessed {relativeTime(node.lastAccessed)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={cn("px-1.5 py-0.5 rounded border text-xs font-medium capitalize", nodeTypeColor(node.type))}>
                        {node.type}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono w-8 text-right">{(node.weight * 100).toFixed(0)}</div>
                      {expandedNode === node.id
                        ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                  </button>
                  {expandedNode === node.id && (
                    <div className="px-4 pb-3 bg-secondary/20 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3 text-xs mt-1">
                        <div>
                          <div className="text-muted-foreground mb-1">Formed</div>
                          <div className="text-foreground font-mono">{node.formed.replace("T", " ").slice(0, 16)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Last Accessed</div>
                          <div className="text-foreground font-mono">{node.lastAccessed.replace("T", " ").slice(0, 16)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Weight Score</div>
                          <div className="flex items-center gap-2">
                            <div className="h-1 bg-secondary rounded-full flex-1 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${node.weight * 100}%` }} />
                            </div>
                            <span className="text-foreground font-mono">{node.weight.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Connections</div>
                          <div className="text-foreground">{node.connections.length} linked nodes</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/15 transition-colors">
                          <Pin className="w-3 h-3" /> Pin
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/15 transition-colors">
                          <Trash2 className="w-3 h-3" /> Forget
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
