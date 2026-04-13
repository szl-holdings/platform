import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AgentDef } from "../lib/api";
import { cn } from "../lib/utils";
import { Brain, Shield, BarChart3, Server, Compass, ArrowRight, Loader2, AlertCircle, Users, Zap, Clock, MessageSquare } from "lucide-react";

const AGENT_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  alloy: Brain,
  helmsman: Anchor,
  sentinel: Shield,
  inca: Telescope,
  muse: Palette,
  beacon: BarChart3,
  zeus: Server,
  compass: Compass,
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
};

const PROVIDER_BG: Record<string, string> = {
  openai: "bg-green-500/10 border-green-500/25 text-green-400",
  anthropic: "bg-orange-500/10 border-orange-500/25 text-orange-400",
  gemini: "bg-blue-400/10 border-blue-400/25 text-blue-400",
  huggingface: "bg-violet-400/10 border-violet-400/25 text-violet-400",
};

const AVAILABLE_MODELS = [
  { model: "gpt-5.2", provider: "openai" },
  { model: "claude-sonnet-4-6", provider: "anthropic" },
  { model: "gemini-3.1-pro-preview", provider: "gemini" },
  { model: "gemini-3-flash-preview", provider: "gemini" },
  { model: "Qwen/Qwen3-8B", provider: "huggingface" },
  { model: "Qwen/Qwen3-0.6B", provider: "huggingface" },
];

type ExecutionState = "idle" | "reasoning" | "debating" | "waiting-approval" | "executing";

const AGENT_EXEC_STATES: Record<string, ExecutionState> = {
  alloy: "reasoning",
  helmsman: "executing",
  sentinel: "waiting-approval",
  inca: "idle",
  muse: "idle",
  beacon: "executing",
  zeus: "idle",
  compass: "reasoning",
};

const ACTIVE_CREWS = [
  { name: "Maritime Sanctions Investigation", agents: ["alloy", "helmsman", "sentinel", "beacon"], status: "active" },
  { name: "Ops Health Watch", agents: ["zeus", "beacon"], status: "active" },
  { name: "Real Estate Due Diligence", agents: ["alloy", "compass", "sentinel"], status: "paused" },
];

const RECENT_MESSAGES = [
  { from: "helmsman", to: "sentinel", text: "AIS dark period confirmed — 14 events in 90d. Sending vessel profile for validation.", time: "2m ago" },
  { from: "sentinel", to: "alloy", text: "Secondary OFAC match found. Risk score: 0.87. Requesting human approval gate.", time: "1m ago" },
  { from: "beacon", to: "alloy", text: "Anomaly detection: 3σ deviation in port call frequency. Correlating with Helmsman data.", time: "45s ago" },
  { from: "alloy", to: "sentinel", text: "Human approval requested. Holding output delivery pending sign-off.", time: "30s ago" },
];

const EXEC_STATE_CONFIG: Record<ExecutionState, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "idle", color: "text-muted-foreground", pulse: false },
  reasoning: { label: "reasoning", color: "text-primary", pulse: true },
  executing: { label: "executing", color: "text-green-400", pulse: true },
  debating: { label: "debating", color: "text-amber-400", pulse: true },
  "waiting-approval": { label: "approval", color: "text-red-400", pulse: true },
};

function Anchor(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  );
}

function Palette(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}

function Telescope(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="6" r="1"/><path d="M20.2 8.5 22 5l-5.3-1.8-1.8 3.5"/><path d="m11.2 5.2 6 16.4"/><path d="m3.4 14.2 6.1-3.1a1 1 0 0 0 .4-1.4L8.1 7.5a1 1 0 0 0-1.4-.4L0 10.2"/><path d="m4 14 3.5 6"/>
    </svg>
  );
}

export function NuroMeshCommand() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState("");
  const [tempProvider, setTempProvider] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"topology" | "crews" | "messages">("topology");

  const agentsQuery = useQuery({
    queryKey: ["inca-agents"],
    queryFn: () => api.getAgentRegistry(),
    staleTime: 60000,
  });

  const agents: AgentDef[] = agentsQuery.data?.data ?? [];
  const selected = agents.find(a => a.id === selectedAgent);

  function startEdit(agentId: string) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    setEditingAgent(agentId);
    setTempModel(agent.preferredModel);
    setTempProvider(agent.preferredProvider);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!editingAgent) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.updateAgentModel(editingAgent, tempModel, tempProvider);
      await queryClient.invalidateQueries({ queryKey: ["inca-agents"] });
      setSaved(editingAgent);
      setEditingAgent(null);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (agentsQuery.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading agent registry...</span>
      </div>
    );
  }

  if (agentsQuery.isError || agents.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-sm text-muted-foreground">Could not load agent registry. The API server may be starting up.</div>
        <button onClick={() => agentsQuery.refetch()} className="mt-3 px-4 py-2 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Nuro Mesh Command</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Live agent topology with crew assignments, execution states, and real-time message flows.
        </p>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        {([
          { id: "topology" as const, label: "Agent Topology", icon: Brain },
          { id: "crews" as const, label: "Active Crews", icon: Users },
          { id: "messages" as const, label: "Message Stream", icon: MessageSquare },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {viewMode === "topology" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Topology map */}
          <div className="lg:col-span-3">
            <div className="inca-panel p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4">Agent Topology — Live State</div>

              {/* Alloy at top */}
              <div className="flex justify-center mb-4">
                <AgentNodeComponent
                  agent={agents[0]!}
                  active={selectedAgent === agents[0]!.id}
                  saved={saved === agents[0]!.id}
                  execState={AGENT_EXEC_STATES[agents[0]!.id] ?? "idle"}
                  onClick={() => setSelectedAgent(agents[0]!.id === selectedAgent ? null : agents[0]!.id)}
                  isOrchestrator
                />
              </div>

              {/* Animated signal flow connections from Alloy to domain agents */}
              <div className="mb-4">
                <div className="flex justify-center gap-2">
                  {agents.slice(1).map((agent, i) => {
                    const execState = AGENT_EXEC_STATES[agent.id] ?? "idle";
                    const isActive = execState !== "idle";
                    const signalColor = execState === "executing" ? "#22c55e"
                      : execState === "reasoning" ? "#7c3aed"
                      : execState === "waiting-approval" ? "#f43f5e"
                      : "#374151";
                    const delayClass = i === 0 ? "animate-signal-flow"
                      : i === 1 ? "animate-signal-flow-delay-1"
                      : i === 2 ? "animate-signal-flow-delay-2"
                      : i === 3 ? "animate-signal-flow-delay-3"
                      : i === 4 ? "animate-signal-flow-delay-4"
                      : i === 5 ? "animate-signal-flow-delay-5"
                      : i === 6 ? "animate-signal-flow-delay-6"
                      : "animate-signal-flow-delay-7";
                    return (
                      <div key={agent.id} className="relative flex flex-col items-center" style={{ width: "3px", height: "32px" }}>
                        <div className="w-px h-full bg-border" style={{ backgroundColor: isActive ? signalColor + "40" : undefined }} />
                        {isActive && (
                          <div
                            className={cn("absolute top-0 w-0.5 h-2 rounded-full overflow-hidden", delayClass)}
                            style={{ backgroundColor: signalColor, left: "1px" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Domain agents */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {agents.slice(1).map((agent) => (
                  <AgentNodeComponent
                    key={agent.id}
                    agent={agent}
                    active={selectedAgent === agent.id}
                    saved={saved === agent.id}
                    execState={AGENT_EXEC_STATES[agent.id] ?? "idle"}
                    onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                  />
                ))}
              </div>
            </div>

            {/* Execution state legend */}
            <div className="inca-panel p-4 mt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Execution State Legend</div>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(EXEC_STATE_CONFIG) as [ExecutionState, typeof EXEC_STATE_CONFIG[ExecutionState]][]).map(([state, config]) => (
                  <div key={state} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", state === "idle" ? "bg-muted-foreground" : state === "reasoning" ? "bg-primary" : state === "executing" ? "bg-green-500" : state === "debating" ? "bg-amber-500" : "bg-red-500", config.pulse && "animate-pulse-dot")} />
                    <div className="text-xs text-muted-foreground capitalize">{config.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Routing Rules */}
            <div className="inca-panel p-4 mt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Domain Routing Rules</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { domain: "maritime", keywords: "vessel, ship, fleet, route, AIS" },
                  { domain: "security", keywords: "threat, CVE, breach, incident" },
                  { domain: "research", keywords: "AI, model, paper, HuggingFace" },
                  { domain: "creative", keywords: "content, campaign, brand, copy" },
                  { domain: "analytics", keywords: "anomaly, KPI, metric, trend" },
                  { domain: "infrastructure", keywords: "Azure, k8s, deployment" },
                ].map(({ domain, keywords }) => (
                  <div key={domain} className="bg-secondary rounded-md p-2">
                    <div className="text-xs font-medium text-foreground capitalize mb-1">{domain}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{keywords}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="inca-panel-active p-5 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
                    {(() => {
                      const Icon = AGENT_ICONS[selected.id] || Brain;
                      return <Icon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <div className="font-display font-semibold text-foreground">{selected.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{selected.domain} domain</div>
                  </div>
                  <div className="ml-auto">
                    {(() => {
                      const execState = AGENT_EXEC_STATES[selected.id] ?? "idle";
                      const cfg = EXEC_STATE_CONFIG[execState];
                      return (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", {
                          "badge-idle": execState === "idle",
                          "badge-staged": execState === "reasoning",
                          "badge-running": execState === "executing",
                          "badge-warning": execState === "debating",
                          "badge-error": execState === "waiting-approval",
                        })}>
                          {cfg.pulse && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse-dot" style={{backgroundColor: "currentColor"}} />}
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Model</div>
                    <div className="font-mono text-sm text-foreground bg-secondary px-3 py-1.5 rounded-md">{selected.preferredModel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Provider</div>
                    <span className={cn("inline-block px-2 py-0.5 rounded border text-xs font-medium", PROVIDER_BG[selected.preferredProvider] || "badge-idle")}>
                      {selected.preferredProvider}
                    </span>
                  </div>

                  {selected.highStakesDomains.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">High-stakes domains</div>
                      <div className="flex flex-wrap gap-1">
                        {selected.highStakesDomains.map(d => (
                          <span key={d} className="badge-warning px-1.5 py-0.5 rounded text-xs">{d.replace("_", " ")}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Tool access</div>
                    <div className="flex flex-wrap gap-1">
                      {selected.tools.map(t => (
                        <span key={t} className="badge-idle px-1.5 py-0.5 rounded text-xs">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Crew memberships */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Active Crews</div>
                    <div className="space-y-1">
                      {ACTIVE_CREWS.filter(c => c.agents.includes(selected.id)).map(crew => (
                        <div key={crew.name} className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", crew.status === "active" ? "bg-green-500" : "bg-amber-500")} />
                          <div className="text-xs text-muted-foreground">{crew.name}</div>
                        </div>
                      ))}
                      {ACTIVE_CREWS.filter(c => c.agents.includes(selected.id)).length === 0 && (
                        <div className="text-xs text-muted-foreground">Not assigned to any crew</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Swap model */}
                {editingAgent === selected.id ? (
                  <div className="border-t border-border/50 pt-4">
                    <div className="text-xs font-medium text-foreground mb-2">Reassign Model</div>
                    <select
                      value={`${tempModel}::${tempProvider}`}
                      onChange={(e) => {
                        const [m, p] = e.target.value.split("::");
                        setTempModel(m!);
                        setTempProvider(p!);
                      }}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 mb-3"
                    >
                      {AVAILABLE_MODELS.map(({ model, provider }) => (
                        <option key={`${model}::${provider}`} value={`${model}::${provider}`}>
                          {model} ({provider})
                        </option>
                      ))}
                    </select>
                    {saveError && <div className="text-xs text-red-400 mb-2">{saveError}</div>}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Apply Assignment
                      </button>
                      <button
                        onClick={() => setEditingAgent(null)}
                        className="px-3 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(selected.id)}
                    className="w-full px-3 py-2 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Reassign Model
                  </button>
                )}
              </div>
            ) : (
              <div className="inca-panel p-5 flex items-center justify-center h-48 text-center">
                <div>
                  <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Select an agent to inspect<br />model assignments and routing</div>
                </div>
              </div>
            )}

            {/* Maker-checker info */}
            <div className="inca-panel p-4 mt-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Maker-Checker Protocol</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="text-xs text-foreground font-medium">Sentinel validates high-stakes outputs</div>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                When Helmsman, Beacon, or Zeus return outputs in high-stakes domains, Sentinel automatically runs a maker-checker validation before delivery. Outputs can be APPROVED, APPROVED_WITH_NOTES, or REJECTED.
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "crews" && (
        <div className="space-y-4">
          {ACTIVE_CREWS.map((crew, idx) => (
            <div key={idx} className={cn("inca-panel p-5", crew.status === "active" && "border-primary/20")}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="text-sm font-medium text-foreground">{crew.name}</div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs border", crew.status === "active" ? "badge-running" : "badge-warning")}>
                      {crew.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">{crew.agents.length} agents assigned</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {crew.agents.map(agentId => {
                  const agent = agents.find(a => a.id === agentId);
                  const Icon = AGENT_ICONS[agentId] || Brain;
                  const execState = AGENT_EXEC_STATES[agentId] ?? "idle";
                  const cfg = EXEC_STATE_CONFIG[execState];
                  return (
                    <div key={agentId} className="flex items-center gap-2.5 bg-secondary rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-foreground capitalize">{agentId}</div>
                        <div className={cn("text-xs", cfg.color)}>{cfg.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "messages" && (
        <div className="space-y-3">
          <div className="inca-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Agent-to-Agent Message Stream</div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                <div className="text-xs text-muted-foreground">Live</div>
              </div>
            </div>
            <div className="divide-y divide-border/30">
              {RECENT_MESSAGES.map((msg, idx) => {
                const FromIcon = AGENT_ICONS[msg.from] || Brain;
                const ToIcon = AGENT_ICONS[msg.to] || Brain;
                return (
                  <div key={idx} className="px-4 py-3 flex items-start gap-3 animate-fade-in">
                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center">
                        <FromIcon className="w-3 h-3 text-primary" />
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center">
                        <ToIcon className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-foreground capitalize">{msg.from}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-medium text-foreground capitalize">{msg.to}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{msg.time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentNodeComponent({
  agent, active, saved, execState, onClick, isOrchestrator = false
}: {
  agent: AgentDef;
  active: boolean;
  saved: boolean;
  execState: ExecutionState;
  onClick: () => void;
  isOrchestrator?: boolean;
}) {
  const Icon = AGENT_ICONS[agent.id] || Brain;
  const cfg = EXEC_STATE_CONFIG[execState];
  return (
    <button
      onClick={onClick}
      className={cn(
        "agent-node p-3 flex flex-col items-center gap-1.5 transition-all text-center relative",
        isOrchestrator ? "px-5 py-3" : "",
        active ? "agent-node-active" : "",
        saved ? "border-green-500/40" : ""
      )}
    >
      {execState !== "idle" && (
        <div className={cn(
          "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
          execState === "reasoning" ? "bg-primary" : execState === "executing" ? "bg-green-500" : execState === "debating" ? "bg-amber-500" : "bg-red-500",
          "animate-pulse-dot"
        )} />
      )}
      <div className={cn(
        "rounded-lg flex items-center justify-center",
        isOrchestrator ? "w-10 h-10" : "w-8 h-8",
        active ? "bg-primary/15 border border-primary/35" : "bg-secondary border border-border"
      )}>
        <Icon className={cn(isOrchestrator ? "w-5 h-5" : "w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className={cn("text-xs font-medium", active ? "text-primary" : "text-foreground")}>{agent.name}</div>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: PROVIDER_COLORS[agent.preferredProvider] || "#888" }}
      />
    </button>
  );
}
