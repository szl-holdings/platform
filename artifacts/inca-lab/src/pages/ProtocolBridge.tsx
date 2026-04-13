import { useState } from "react";
import { cn } from "../lib/utils";
import { Link2, Database, Globe, FileText, Search, Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap } from "lucide-react";

interface MCPTool {
  id: string;
  name: string;
  category: "database" | "api" | "document" | "search" | "compute";
  description: string;
  protocol: string;
  version: string;
  status: "connected" | "degraded" | "offline";
  latencyMs: number;
  throughputRpm: number;
  agentsUsing: string[];
}

interface A2AAgent {
  id: string;
  name: string;
  system: string;
  endpoint: string;
  protocol: "A2A-v1" | "OpenAI-Assistants" | "LangGraph-Remote" | "Custom";
  status: "reachable" | "degraded" | "unreachable";
  latencyMs: number;
  lastSeen: string;
  capabilities: string[];
}

const MCP_TOOLS: MCPTool[] = [
  { id: "ais-feed", name: "AIS Maritime Feed", category: "api", description: "Real-time vessel tracking via MarineTraffic AIS API", protocol: "MCP-HTTP", version: "1.4.2", status: "connected", latencyMs: 142, throughputRpm: 840, agentsUsing: ["helmsman", "alloy"] },
  { id: "vessel-db", name: "Vessel Registry DB", category: "database", description: "IMO-registered vessel ownership and flag state data", protocol: "MCP-PostgreSQL", version: "2.1.0", status: "connected", latencyMs: 28, throughputRpm: 2400, agentsUsing: ["helmsman"] },
  { id: "sanctions-api", name: "OFAC Sanctions API", category: "api", description: "OFAC SDN list and consolidated screening endpoint", protocol: "MCP-HTTP", version: "3.0.1", status: "connected", latencyMs: 89, throughputRpm: 1200, agentsUsing: ["sentinel", "helmsman"] },
  { id: "cve-db", name: "CVE Vulnerability DB", category: "database", description: "NVD/NIST CVE database with CVSS scoring", protocol: "MCP-REST", version: "1.2.0", status: "connected", latencyMs: 45, throughputRpm: 960, agentsUsing: ["sentinel"] },
  { id: "threat-intel", name: "Threat Intelligence Feed", category: "api", description: "MITRE ATT&CK and commercial threat intel aggregator", protocol: "MCP-HTTP", version: "4.1.0", status: "degraded", latencyMs: 340, throughputRpm: 180, agentsUsing: ["sentinel"] },
  { id: "huggingface-api", name: "HuggingFace Hub API", category: "api", description: "Model metadata, downloads, and deployment endpoints", protocol: "MCP-HTTP", version: "1.0.0", status: "connected", latencyMs: 210, throughputRpm: 600, agentsUsing: ["inca"] },
  { id: "arxiv-api", name: "arXiv Research API", category: "api", description: "Open access academic paper search and metadata", protocol: "MCP-HTTP", version: "1.0.0", status: "connected", latencyMs: 320, throughputRpm: 300, agentsUsing: ["inca"] },
  { id: "property-db", name: "Property Registry DB", category: "database", description: "Commercial and residential property transaction records", protocol: "MCP-PostgreSQL", version: "2.0.5", status: "connected", latencyMs: 35, throughputRpm: 1800, agentsUsing: ["compass"] },
  { id: "market-feed", name: "Real Estate Market Feed", category: "api", description: "Live commercial real estate pricing and cap rate data", protocol: "MCP-HTTP", version: "1.3.0", status: "connected", latencyMs: 178, throughputRpm: 480, agentsUsing: ["compass", "beacon"] },
  { id: "azure-api", name: "Azure Resource Manager", category: "compute", description: "Azure cloud resource provisioning and monitoring", protocol: "MCP-HTTP", version: "2022-09-01", status: "connected", latencyMs: 95, throughputRpm: 720, agentsUsing: ["zeus"] },
  { id: "k8s-api", name: "Kubernetes API Server", category: "compute", description: "Container orchestration cluster management", protocol: "MCP-REST", version: "1.29", status: "connected", latencyMs: 22, throughputRpm: 3600, agentsUsing: ["zeus"] },
  { id: "semantic-scholar", name: "Semantic Scholar API", category: "search", description: "AI-powered academic research graph and citations", protocol: "MCP-HTTP", version: "1.0.0", status: "connected", latencyMs: 280, throughputRpm: 360, agentsUsing: ["inca"] },
  { id: "content-store", name: "Content Asset Store", category: "document", description: "SZL brand asset library and content repository", protocol: "MCP-S3", version: "1.1.0", status: "connected", latencyMs: 65, throughputRpm: 1200, agentsUsing: ["muse"] },
  { id: "telemetry-db", name: "Telemetry Store", category: "database", description: "Platform-wide operational metrics and event stream", protocol: "MCP-TimescaleDB", version: "2.14.0", status: "connected", latencyMs: 18, throughputRpm: 12000, agentsUsing: ["beacon", "alloy"] },
  { id: "web-search", name: "Web Search Engine", category: "search", description: "Tavily-powered web search with safe content filtering", protocol: "MCP-HTTP", version: "1.0.0", status: "degraded", latencyMs: 520, throughputRpm: 120, agentsUsing: ["muse", "inca"] },
];

const A2A_AGENTS: A2AAgent[] = [
  { id: "nexus-orchestrator", name: "Nexus Orchestrator", system: "Nexus Intelligence Canvas", endpoint: "a2a://nexus.szl.internal/orchestrator", protocol: "A2A-v1", status: "reachable", latencyMs: 8, lastSeen: "2 min ago", capabilities: ["cross-domain-fusion", "signal-correlation", "intelligence-synthesis"] },
  { id: "prism-legal", name: "PRISM Legal Agent", system: "PRISM Counsel", endpoint: "a2a://prism.szl.internal/legal", protocol: "A2A-v1", status: "reachable", latencyMs: 12, lastSeen: "5 min ago", capabilities: ["legal-research", "contract-analysis", "compliance-review"] },
  { id: "terra-valuation", name: "Terra Valuation Engine", system: "Terra Real Estate", endpoint: "a2a://terra.szl.internal/valuation", protocol: "A2A-v1", status: "reachable", latencyMs: 18, lastSeen: "1 min ago", capabilities: ["property-valuation", "market-analysis", "risk-assessment"] },
  { id: "vessels-ops", name: "Vessels OpsAgent", system: "Vessels Maritime", endpoint: "a2a://vessels.szl.internal/ops", protocol: "A2A-v1", status: "reachable", latencyMs: 14, lastSeen: "3 min ago", capabilities: ["fleet-management", "route-optimization", "cargo-tracking"] },
  { id: "lyte-analyst", name: "Lyte Financial Analyst", system: "Lyte Command Center", endpoint: "a2a://lyte.szl.internal/analyst", protocol: "A2A-v1", status: "degraded", latencyMs: 340, lastSeen: "12 min ago", capabilities: ["financial-modeling", "portfolio-analysis", "risk-metrics"] },
  { id: "openai-assistants", name: "OpenAI Assistants Bridge", system: "External", endpoint: "https://api.openai.com/v1/threads", protocol: "OpenAI-Assistants", status: "reachable", latencyMs: 220, lastSeen: "Just now", capabilities: ["code-interpreter", "file-search", "function-calling"] },
  { id: "langgraph-remote", name: "LangGraph Remote Graph", system: "External LangSmith", endpoint: "https://api.langchain.com/runs", protocol: "LangGraph-Remote", status: "unreachable", latencyMs: 0, lastSeen: "48 min ago", capabilities: ["stateful-workflows", "checkpointing", "time-travel"] },
];

const CATEGORY_ICONS: Record<MCPTool["category"], React.ComponentType<{className?:string; style?: React.CSSProperties}>> = {
  database: Database,
  api: Globe,
  document: FileText,
  search: Search,
  compute: Activity,
};

const CATEGORY_COLORS: Record<MCPTool["category"], string> = {
  database: "#3b82f6",
  api: "#7c3aed",
  document: "#10b981",
  search: "#f59e0b",
  compute: "#f43f5e",
};

function StatusDot({ status }: { status: "connected" | "degraded" | "offline" | "reachable" | "unreachable" }) {
  if (status === "connected" || status === "reachable") return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />;
  if (status === "degraded") return <div className="w-2 h-2 rounded-full bg-amber-500" />;
  return <div className="w-2 h-2 rounded-full bg-red-500" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "connected" || status === "reachable") return <span className="badge-running px-1.5 py-0.5 rounded text-xs">{status}</span>;
  if (status === "degraded") return <span className="badge-warning px-1.5 py-0.5 rounded text-xs">{status}</span>;
  return <span className="badge-error px-1.5 py-0.5 rounded text-xs">{status}</span>;
}

export function ProtocolBridge() {
  const [mcpCategory, setMcpCategory] = useState<MCPTool["category"] | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [tab, setTab] = useState<"mcp" | "a2a">("mcp");

  const filteredTools = mcpCategory ? MCP_TOOLS.filter(t => t.category === mcpCategory) : MCP_TOOLS;
  const selectedToolDef = MCP_TOOLS.find(t => t.id === selectedTool);

  const mcpConnected = MCP_TOOLS.filter(t => t.status === "connected").length;
  const mcpDegraded = MCP_TOOLS.filter(t => t.status === "degraded").length;
  const a2aReachable = A2A_AGENTS.filter(a => a.status === "reachable").length;
  const totalThroughput = MCP_TOOLS.filter(t => t.status === "connected").reduce((s, t) => s + t.throughputRpm, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Protocol Bridge</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          MCP tool connections and A2A agent interoperability — external tools, protocols, and mesh connectivity status.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">MCP Tools</div>
          <div className="text-xl font-display font-bold text-foreground">{mcpConnected}<span className="text-sm text-muted-foreground">/{MCP_TOOLS.length}</span></div>
          <div className="text-xs text-muted-foreground">connected</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Degraded</div>
          <div className={cn("text-xl font-display font-bold", mcpDegraded > 0 ? "text-amber-400" : "text-foreground")}>{mcpDegraded}</div>
          <div className="text-xs text-muted-foreground">tools impacted</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">A2A Agents</div>
          <div className="text-xl font-display font-bold text-foreground">{a2aReachable}<span className="text-sm text-muted-foreground">/{A2A_AGENTS.length}</span></div>
          <div className="text-xs text-muted-foreground">reachable</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Throughput</div>
          <div className="text-xl font-display font-bold text-foreground">{(totalThroughput / 1000).toFixed(1)}k</div>
          <div className="text-xs text-muted-foreground">req/min</div>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        <button onClick={() => setTab("mcp")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "mcp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          MCP Tool Connections ({MCP_TOOLS.length})
        </button>
        <button onClick={() => setTab("a2a")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "a2a" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          A2A Agent Endpoints ({A2A_AGENTS.length})
        </button>
      </div>

      {tab === "mcp" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Tool list */}
          <div className="lg:col-span-3">
            {/* Category filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                onClick={() => setMcpCategory(null)}
                className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-all border", !mcpCategory ? "bg-primary/15 text-primary border-primary/25" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}
              >
                All ({MCP_TOOLS.length})
              </button>
              {(["database", "api", "document", "search", "compute"] as const).map(cat => {
                const Icon = CATEGORY_ICONS[cat];
                const count = MCP_TOOLS.filter(t => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setMcpCategory(cat === mcpCategory ? null : cat)}
                    className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-all border flex items-center gap-1.5", mcpCategory === cat ? "border" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}
                    style={mcpCategory === cat ? { background: `${CATEGORY_COLORS[cat]}18`, color: CATEGORY_COLORS[cat], borderColor: `${CATEGORY_COLORS[cat]}35` } : {}}
                  >
                    <Icon className="w-3 h-3" />
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="inca-panel overflow-hidden">
              <div className="divide-y divide-border/40">
                {filteredTools.map((tool) => {
                  const Icon = CATEGORY_ICONS[tool.category];
                  const color = CATEGORY_COLORS[tool.category];
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                      className={cn("w-full text-left px-4 py-3 transition-colors hover:bg-secondary/40 flex items-center gap-3", selectedTool === tool.id && "bg-secondary/30")}
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-foreground">{tool.name}</div>
                          <StatusBadge status={tool.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono text-foreground">{tool.latencyMs}ms</div>
                        <div className="text-xs text-muted-foreground">{tool.throughputRpm} rpm</div>
                      </div>
                      <StatusDot status={tool.status} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tool detail */}
          <div className="lg:col-span-1">
            {selectedToolDef ? (
              <div className="inca-panel-active p-4 animate-scale-in sticky top-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Tool Details</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-foreground mb-0.5">{selectedToolDef.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedToolDef.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary rounded-lg p-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Protocol</div>
                      <div className="text-xs font-mono text-foreground">{selectedToolDef.protocol}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Version</div>
                      <div className="text-xs font-mono text-foreground">v{selectedToolDef.version}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Latency</div>
                      <div className="text-xs font-mono text-foreground">{selectedToolDef.latencyMs}ms</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Throughput</div>
                      <div className="text-xs font-mono text-foreground">{selectedToolDef.throughputRpm} rpm</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Agents Using</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedToolDef.agentsUsing.map(a => (
                        <span key={a} className="badge-staged px-1.5 py-0.5 rounded text-xs capitalize">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Health</div>
                    <StatusBadge status={selectedToolDef.status} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="inca-panel p-4 flex flex-col items-center justify-center h-40 text-center">
                <Link2 className="w-6 h-6 text-muted-foreground mb-2" />
                <div className="text-xs text-muted-foreground">Click a tool to<br/>inspect details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "a2a" && (
        <div className="space-y-3">
          {A2A_AGENTS.map((agent) => (
            <div key={agent.id} className="inca-panel p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-sm font-medium text-foreground">{agent.name}</div>
                  <StatusBadge status={agent.status} />
                  <span className="badge-idle px-1.5 py-0.5 rounded text-xs">{agent.protocol}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{agent.system}</div>
                <div className="font-mono text-xs text-muted-foreground mb-2">{agent.endpoint}</div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="badge-idle px-1.5 py-0.5 rounded text-xs">{cap}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono text-foreground mb-0.5">{agent.status !== "unreachable" ? `${agent.latencyMs}ms` : "—"}</div>
                <div className="text-xs text-muted-foreground">Last: {agent.lastSeen}</div>
              </div>
              <div className="flex items-center pt-0.5">
                <StatusDot status={agent.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
