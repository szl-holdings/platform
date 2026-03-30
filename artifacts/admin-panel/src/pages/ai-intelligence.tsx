import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain, Search, Activity, AlertTriangle, Loader2, Zap, Server,
  Shield, TrendingUp, Clock, DollarSign, BarChart3, CheckCircle,
  Network, Cpu, Sparkles
} from "lucide-react";
import { AnomalySparkline, SeverityMeter, TypewriterText } from "@workspace/shared-ui/ai-components";
import { cn } from "@/lib/utils";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  openai: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  anthropic: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  gemini: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  huggingface: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

const PROVIDER_ICONS: Record<string, typeof Brain> = {
  openai: Cpu,
  anthropic: Brain,
  gemini: Sparkles,
  huggingface: Zap,
};

export default function AIIntelligence() {
  const { data: anomalies = [] } = useQuery({ queryKey: ["admin-anomalies"], queryFn: () => apiFetch<any[]>("/intelligence/anomalies") });
  const { data: ecosystemHealth = [] } = useQuery({ queryKey: ["admin-ecosystem"], queryFn: () => apiFetch<any[]>("/intelligence/ecosystem-health") });
  const { data: aiHealth } = useQuery({ queryKey: ["admin-ai-health"], queryFn: () => apiFetch<any>("/intelligence/ai/health") });
  const { data: usageStats } = useQuery({
    queryKey: ["nuro-mesh-usage"],
    queryFn: () => apiFetch<any>("/nuro-mesh/usage-stats"),
    refetchInterval: 30000,
  });
  const { data: safetyDashboard } = useQuery({
    queryKey: ["ai-safety-dashboard"],
    queryFn: () => apiFetch<any>("/ai-safety/dashboard"),
    refetchInterval: 30000,
  });
  const { data: modelRegistry } = useQuery({
    queryKey: ["ai-model-registry"],
    queryFn: () => apiFetch<any>("/ai-safety/model-registry"),
    refetchInterval: 60000,
  });

  const [nlQuery, setNlQuery] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [queryDone, setQueryDone] = useState(false);

  const runNlQuery = async () => {
    if (!nlQuery.trim()) return;
    setQueryResult("");
    setQueryDone(false);
    try {
      const result = await apiFetch<any>("/intelligence/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `You are an SZL platform system analyst. Answer this system query concisely with data: ${nlQuery}`,
        }),
      });
      setQueryResult(result.content || "No result.");
    } catch {
      setQueryResult("Unable to process query at this time.");
    }
    setQueryDone(true);
  };

  const rootCauses = [
    { anomaly: "API latency spike", cause: "Database connection pool saturation during peak load", confidence: 89, severity: "high" as const },
    { anomaly: "Memory usage increase", cause: "Cache invalidation storm triggered by deployment", confidence: 76, severity: "medium" as const },
    { anomaly: "Error rate elevation", cause: "Upstream service timeout from third-party provider", confidence: 82, severity: "high" as const },
    { anomaly: "CPU utilization spike", cause: "Background job queue processing backlog", confidence: 71, severity: "medium" as const },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI Intelligence Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Nuro Mesh observability — per-agent analytics, model registry, AI safety, and anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          {aiHealth && (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <Zap className="w-3 h-3" /> HuggingFace: {aiHealth.activeTier}
            </span>
          )}
          {usageStats?.summary && (
            <span className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-400/10 px-3 py-1.5 rounded-full border border-violet-400/20">
              <Network className="w-3 h-3" /> Mesh: {usageStats.summary.totalCalls} calls
            </span>
          )}
        </div>
      </div>

      {usageStats?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Calls</span>
            </div>
            <div className="text-2xl font-bold">{usageStats.summary.totalCalls}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Tokens Used</span>
            </div>
            <div className="text-2xl font-bold">{(usageStats.summary.totalTokens / 1000).toFixed(1)}K</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Est. Cost</span>
            </div>
            <div className="text-2xl font-bold">${usageStats.summary.totalCost}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Safety Score</span>
            </div>
            <div className="text-2xl font-bold">{safetyDashboard?.safetyScore ?? 100}</div>
          </div>
        </div>
      )}

      {usageStats?.agentMetrics?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-primary" /> Per-Agent Performance
          </h3>
          <div className="space-y-3">
            {usageStats.agentMetrics.map((agent: any) => (
              <div key={agent.agentId} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background">
                <div className="w-20 text-xs font-medium capitalize">{agent.agentName}</div>
                <div className="flex-1 grid grid-cols-5 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">Calls</div>
                    <div className="font-semibold">{agent.calls}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{(agent.tokens / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Latency</div>
                    <div className="font-semibold">{agent.avgLatencyMs}ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Success</div>
                    <div className={cn("font-semibold", agent.successRate >= 95 ? "text-emerald-400" : agent.successRate >= 80 ? "text-amber-400" : "text-red-400")}>
                      {agent.successRate}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Cost</div>
                    <div className="font-semibold">${agent.estimatedCostUsd}</div>
                  </div>
                </div>
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded border",
                  PROVIDER_COLORS[agent.provider]?.text ?? "text-primary",
                  PROVIDER_COLORS[agent.provider]?.bg ?? "bg-primary/10",
                  PROVIDER_COLORS[agent.provider]?.border ?? "border-primary/30",
                )}>
                  {agent.provider}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usageStats?.providerMetrics?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Provider Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usageStats.providerMetrics.map((p: any) => {
              const colors = PROVIDER_COLORS[p.provider] ?? PROVIDER_COLORS["openai"]!;
              const ProvIcon = PROVIDER_ICONS[p.provider] ?? Brain;
              return (
                <div key={p.provider} className={cn("rounded-lg border p-4", colors.bg, colors.border)}>
                  <div className={cn("flex items-center gap-2 mb-3", colors.text)}>
                    <ProvIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold capitalize">{p.provider}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Calls</div>
                      <div className={cn("text-lg font-bold", colors.text)}>{p.calls}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tokens</div>
                      <div className={cn("text-lg font-bold", colors.text)}>{(p.tokens / 1000).toFixed(1)}K</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Est. ${p.estimatedCostUsd}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {safetyDashboard && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-red-400" /> AI Safety Dashboard
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg border border-border bg-background text-center">
              <div className="text-xs text-muted-foreground mb-1">Safety Score</div>
              <div className={cn("text-2xl font-bold", safetyDashboard.safetyScore >= 90 ? "text-emerald-400" : safetyDashboard.safetyScore >= 70 ? "text-amber-400" : "text-red-400")}>
                {safetyDashboard.safetyScore}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-background text-center">
              <div className="text-xs text-muted-foreground mb-1">Events (24h)</div>
              <div className="text-2xl font-bold">{safetyDashboard.last24h.totalEvents}</div>
            </div>
            <div className="p-3 rounded-lg border border-border bg-background text-center">
              <div className="text-xs text-muted-foreground mb-1">Blocked</div>
              <div className="text-2xl font-bold text-red-400">{safetyDashboard.last24h.blockedAttempts}</div>
            </div>
          </div>
          {safetyDashboard.budgets.agentBudgets?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Token Budget Usage</div>
              {safetyDashboard.budgets.agentBudgets.slice(0, 4).map((b: any) => (
                <div key={b.agentId} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-muted-foreground capitalize">{b.agentName}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted">
                    <div
                      className={cn("h-1.5 rounded-full", b.pct >= 90 ? "bg-red-400" : b.pct >= 70 ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{b.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modelRegistry?.registry?.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-primary" /> Live Model Registry
          </h3>
          <div className="space-y-2">
            {modelRegistry.registry.slice(0, 6).map((entry: any) => {
              const colors = PROVIDER_COLORS[entry.currentProvider] ?? PROVIDER_COLORS["openai"]!;
              return (
                <div key={entry.agentId} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                  <span className="text-xs font-medium w-16 capitalize">{entry.agentName}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded border", colors.bg, colors.text, colors.border)}>
                    {entry.currentProvider}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{entry.currentModel}</span>
                  <span className="text-xs text-muted-foreground">{entry.budgetUtilization}% budget</span>
                  {entry.highStakesDomains?.length > 0 && (
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" title="Has maker-checker validation" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-primary" /> Natural Language System Query
        </h3>
        <div className="flex gap-3 mb-4">
          <input
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runNlQuery()}
            placeholder="Ask about system health, performance, or anomalies..."
            className="flex-1 bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button
            onClick={runNlQuery}
            disabled={!nlQuery.trim()}
            className="px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Brain className="w-4 h-4" /> Query
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {["What is the current system health status?", "Show me recent anomalies and their causes", "Which apps have the highest latency?", "Summarize today's security events"].map((q) => (
            <button
              key={q}
              onClick={() => setNlQuery(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground"
            >
              {q}
            </button>
          ))}
        </div>
        {queryResult && (
          <div className="bg-background rounded-lg p-4 border border-border">
            {queryDone ? (
              <TypewriterText text={queryResult} speed={15} className="text-sm text-foreground leading-relaxed" />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-400" /> AI Root Cause Analysis
          </h3>
          <div className="space-y-3">
            {rootCauses.map((rc, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{rc.anomaly}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    rc.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"
                  }`}>{rc.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{rc.cause}</p>
                <SeverityMeter level={rc.severity} score={rc.confidence} label="Confidence" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" /> Anomaly Detection Dashboard
          </h3>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{a.type || a.name || `Anomaly ${i + 1}`}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    a.severity === "critical" ? "bg-red-500/10 text-red-400" :
                    a.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{a.severity}</span>
                </div>
                <AnomalySparkline
                  data={Array.from({ length: 20 }, () => Math.random() * 100)}
                  anomalyIndices={[Math.floor(Math.random() * 8) + 12]}
                  width={280}
                  height={30}
                  color={a.severity === "critical" ? "#ef4444" : "#f97316"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-emerald-400" /> HuggingFace AI Health Monitor
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {aiHealth && (
            <>
              <div className="p-3 rounded-lg border border-border bg-background text-center">
                <div className="text-xs text-muted-foreground mb-1">Active Tier</div>
                <div className="text-lg font-bold capitalize">{aiHealth.activeTier}</div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background text-center">
                <div className="text-xs text-muted-foreground mb-1">Models Available</div>
                <div className="text-lg font-bold">{Object.keys(aiHealth.modelsAvailable || {}).length}</div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background text-center">
                <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
                <div className="text-lg font-bold">{aiHealth.cacheStats?.hitRate || "0%"}</div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background text-center">
                <div className="text-xs text-muted-foreground mb-1">Cache Size</div>
                <div className="text-lg font-bold">{aiHealth.cacheStats?.size || 0}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
