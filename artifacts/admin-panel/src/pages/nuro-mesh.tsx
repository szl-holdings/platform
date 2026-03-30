import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Network, Brain, Shield, Anchor, FlaskConical, Palette, Activity,
  Server, Compass, Zap, ChevronRight, RefreshCw, Play, AlertTriangle,
  CheckCircle, XCircle, Clock, MessageSquare, Database, Eye, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  alloy: Brain,
  helmsman: Anchor,
  sentinel: Shield,
  inca: FlaskConical,
  muse: Palette,
  beacon: Activity,
  zeus: Server,
  compass: Compass,
};

const AGENT_COLORS: Record<string, string> = {
  alloy: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  helmsman: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  sentinel: "text-red-400 bg-red-500/10 border-red-500/30",
  inca: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  muse: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  beacon: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  zeus: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  compass: "text-green-400 bg-green-500/10 border-green-500/30",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "text-blue-400 border-blue-500/30",
  anthropic: "text-orange-400 border-orange-500/30",
  gemini: "text-emerald-400 border-emerald-500/30",
};

interface AgentResponse {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  domain: string;
}

interface StreamEvent {
  type: string;
  message?: string;
  agents?: { id: string; name: string; domain: string }[];
  agentId?: string;
  agentName?: string;
  response?: string;
  confidence?: number;
  domain?: string;
  content?: string;
  validated?: boolean;
  notes?: string;
  agentCount?: number;
  averageConfidence?: number;
  isHighStakes?: boolean;
  error?: string;
  finding?: {
    id: number;
    title: string;
    content: string;
    severity: string;
    score: number;
    agentName: string;
    analysisType: string;
  };
}

export default function NuroMesh() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [activeTab, setActiveTab] = useState<"orchestrate" | "agents" | "memory" | "advisory" | "tools">("orchestrate");
  const [advisoryType, setAdvisoryType] = useState("security_posture");
  const [isRunningAdvisory, setIsRunningAdvisory] = useState(false);
  const [advisoryResult, setAdvisoryResult] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const synthesisRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["nuro-mesh-agents"],
    queryFn: () => apiFetch<{ agents: any[]; totalAgents: number }>("/nuro-mesh/agents"),
    refetchInterval: 30000,
  });

  const { data: memoryData } = useQuery({
    queryKey: ["nuro-mesh-memory"],
    queryFn: () => apiFetch<{ facts: any[]; total: number }>("/nuro-mesh/memory?limit=10"),
    enabled: activeTab === "memory",
  });

  const { data: advisoryData, refetch: refetchAdvisory } = useQuery({
    queryKey: ["nuro-mesh-advisory"],
    queryFn: () => apiFetch<{ findings: any[]; total: number }>("/nuro-mesh/advisory"),
    enabled: activeTab === "advisory",
  });

  const { data: usageStats } = useQuery({
    queryKey: ["nuro-mesh-usage"],
    queryFn: () => apiFetch<any>("/nuro-mesh/usage-stats"),
    refetchInterval: 60000,
  });

  const { data: toolCalls } = useQuery({
    queryKey: ["nuro-mesh-tools"],
    queryFn: () => apiFetch<{ toolCalls: any[]; total: number }>("/nuro-mesh/tool-calls?limit=20"),
    enabled: activeTab === "tools",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamEvents, synthesis]);

  const orchestrate = useCallback(async () => {
    if (!query.trim() || isOrchestrating) return;

    setIsOrchestrating(true);
    setStreamEvents([]);
    setAgentResponses([]);
    setSynthesis("");
    synthesisRef.current = "";
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/nuro-mesh/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Orchestration failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            if (event.type === "agent_response") {
              setAgentResponses(prev => [...prev, {
                agentId: event.agentId!,
                agentName: event.agentName!,
                response: event.response!,
                confidence: event.confidence!,
                domain: event.domain!,
              }]);
            } else if (event.type === "synthesis_chunk") {
              synthesisRef.current += event.content ?? "";
              setSynthesis(synthesisRef.current);
            } else {
              setStreamEvents(prev => [...prev, event]);
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setStreamEvents(prev => [...prev, { type: "error", error: "Orchestration request failed" }]);
      }
    } finally {
      setIsOrchestrating(false);
    }
  }, [query, isOrchestrating]);

  const runAdvisory = async () => {
    if (isRunningAdvisory) return;
    setIsRunningAdvisory(true);
    setAdvisoryResult(null);

    try {
      const res = await fetch(`${API_BASE}/nuro-mesh/advisory/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisType: advisoryType }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            if (event.type === "finding" && event.finding) {
              setAdvisoryResult(event.finding.content);
              refetchAdvisory();
            }
          } catch {}
        }
      }
    } catch {}
    finally {
      setIsRunningAdvisory(false);
    }
  };

  const SUGGESTED_QUERIES = [
    "What is the current security posture across all platforms?",
    "Analyze maritime fleet risk and active route threats",
    "What AI/ML models are best for our threat detection pipeline?",
    "Give me a cross-domain threat assessment for today",
    "Summarize infrastructure health and readiness maturity",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Nuro Mesh Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-agent AI orchestration — {agentsData?.totalAgents ?? 8} specialized domain agents, maker-checker validation, shared memory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Mesh Active
          </span>
          {usageStats?.summary && (
            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border">
              {usageStats.summary.totalCalls} calls · ${usageStats.summary.totalCost}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["orchestrate", "agents", "memory", "advisory", "tools"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "orchestrate" ? "Orchestrate" :
             tab === "agents" ? "Agent Registry" :
             tab === "memory" ? "Shared Memory" :
             tab === "advisory" ? "Advisory Findings" :
             "Tool Calls"}
          </button>
        ))}
      </div>

      {activeTab === "orchestrate" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex gap-3 mb-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) orchestrate(); }}
                placeholder="Ask the Nuro Mesh anything — Alloy will route to the right domain agents..."
                className="flex-1 bg-background border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none min-h-[72px]"
                rows={2}
              />
              <button
                onClick={orchestrate}
                disabled={!query.trim() || isOrchestrating}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 flex items-center gap-2 self-end"
              >
                {isOrchestrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isOrchestrating ? "Running..." : "Orchestrate"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground"
                >
                  {q.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>

          {streamEvents.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Orchestration Log
              </h3>
              {streamEvents.map((event, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {event.type === "status" && <Clock className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />}
                  {event.type === "routing" && <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />}
                  {event.type === "agent_start" && <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />}
                  {event.type === "validation_start" && <Shield className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                  {event.type === "validation_result" && (event.validated ? <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />)}
                  {event.type === "synthesis_start" && <Brain className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />}
                  {event.type === "error" && <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                  {event.type === "done" && <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />}
                  <span className="text-muted-foreground">
                    {event.type === "routing" && `Routing to: ${event.agents?.map(a => a.name).join(", ")}`}
                    {event.type === "agent_start" && `${event.agentName} analyzing...`}
                    {event.type === "validation_result" && `Sentinel: ${event.validated ? "✓ Validated" : "✗ Rejected"} — ${event.notes?.slice(0, 80)}`}
                    {event.type === "done" && `Complete — ${event.agentCount} agents · Avg confidence: ${event.averageConfidence}%${event.isHighStakes ? " · High-stakes validated" : ""}`}
                    {event.message}
                    {event.error}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {agentResponses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Domain Agent Responses
              </h3>
              {agentResponses.map((r) => {
                const Icon = AGENT_ICONS[r.agentId] ?? Brain;
                const colorClass = AGENT_COLORS[r.agentId] ?? "text-primary bg-primary/10 border-primary/30";
                return (
                  <div key={r.agentId} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", colorClass)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{r.agentName}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">{r.domain}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">Confidence</div>
                        <div className={cn("text-xs font-bold px-2 py-0.5 rounded border", colorClass)}>
                          {r.confidence}%
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">{r.response}</p>
                  </div>
                );
              })}
            </div>
          )}

          {synthesis && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-violet-400">Alloy Synthesis</h3>
              </div>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {synthesis}
                {isOrchestrating && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agentsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-lg border border-border bg-card animate-pulse" />
              ))
            ) : agentsData?.agents.map((agent: any) => {
              const Icon = AGENT_ICONS[agent.id] ?? Brain;
              const colorClass = AGENT_COLORS[agent.id] ?? "text-primary bg-primary/10 border-primary/30";
              return (
                <div key={agent.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{agent.name}</h3>
                        <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 rounded bg-muted">{agent.domain}</span>
                      </div>
                      <div className={cn("text-xs border rounded px-1.5 py-0.5 inline-block mt-0.5", PROVIDER_COLORS[agent.preferredProvider] ?? "text-primary border-primary/30")}>
                        {agent.preferredProvider} · {agent.preferredModel}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded bg-muted/20">
                      <div className="text-xs text-muted-foreground">Calls</div>
                      <div className="text-sm font-bold">{agent.stats.totalCalls}</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/20">
                      <div className="text-xs text-muted-foreground">Latency</div>
                      <div className="text-sm font-bold">{agent.stats.avgLatencyMs}ms</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/20">
                      <div className="text-xs text-muted-foreground">Success</div>
                      <div className="text-sm font-bold">{agent.stats.successRate}%</div>
                    </div>
                  </div>
                  {agent.tools?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((tool: string) => (
                        <span key={tool} className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "memory" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Shared Agent Memory
            </h3>
            <span className="text-xs text-muted-foreground">{memoryData?.total ?? 0} active facts</span>
          </div>
          {memoryData?.facts.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
              No shared memory facts yet. Run orchestrations to build the knowledge base.
            </div>
          ) : memoryData?.facts.map((fact: any) => (
            <div key={fact.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary">{fact.agentId}</span>
                  <span className="text-xs text-muted-foreground capitalize">{fact.factType}</span>
                </div>
                <span className="text-xs text-muted-foreground">Importance: {fact.importance}/10</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{fact.content}</p>
              {fact.tags?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {fact.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "advisory" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Run Advisory Analysis
            </h3>
            <div className="flex gap-3">
              <select
                value={advisoryType}
                onChange={(e) => setAdvisoryType(e.target.value)}
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="security_posture">Daily Security Posture Check (Sentinel)</option>
                <option value="readiness_summary">Weekly Readiness Summary (Compass)</option>
                <option value="maritime_brief">Maritime Intelligence Brief (Helmsman)</option>
                <option value="platform_health">Infrastructure Health Report (Zeus)</option>
              </select>
              <button
                onClick={runAdvisory}
                disabled={isRunningAdvisory}
                className="px-4 py-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isRunningAdvisory ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRunningAdvisory ? "Running..." : "Run Now"}
              </button>
            </div>
            {advisoryResult && (
              <div className="mt-3 p-3 rounded-lg bg-background border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {advisoryResult}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {advisoryData?.findings.map((finding: any) => (
              <div key={finding.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", {
                      "text-red-400 border-red-500/30 bg-red-500/10": finding.severity === "critical",
                      "text-amber-400 border-amber-500/30 bg-amber-500/10": finding.severity === "warning",
                      "text-blue-400 border-blue-500/30 bg-blue-500/10": finding.severity === "info",
                    })}>
                      {finding.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{finding.agentName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{finding.analysisType.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-xs font-bold">{finding.score}/100</span>
                </div>
                <h4 className="text-sm font-medium mb-2">{finding.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{finding.content}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(finding.generatedAt).toLocaleString()}
                </div>
              </div>
            ))}
            {(advisoryData?.findings.length ?? 0) === 0 && (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                No advisory findings yet. Run an analysis above to generate findings.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Agent Tool Call Audit Log
            </h3>
            <span className="text-xs text-muted-foreground">{toolCalls?.total ?? 0} calls logged</span>
          </div>
          {toolCalls?.toolCalls.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
              No tool calls logged yet. Tool calls are recorded when agents access external data sources.
            </div>
          ) : toolCalls?.toolCalls.map((call: any) => (
            <div key={call.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary">{call.toolName}</span>
                  <span className="text-xs text-muted-foreground">by {call.agentId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{call.latencyMs}ms</span>
                  {call.success ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(call.calledAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
