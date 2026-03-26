import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, Search, Activity, AlertTriangle, Loader2, Zap, Server, Database, Shield } from "lucide-react";
import { AnomalySparkline, SeverityMeter, TypewriterText } from "@workspace/shared-ui/ai-components";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AIIntelligence() {
  const { data: anomalies = [] } = useQuery({ queryKey: ["admin-anomalies"], queryFn: () => apiFetch<any[]>("/intelligence/anomalies") });
  const { data: ecosystemHealth = [] } = useQuery({ queryKey: ["admin-ecosystem"], queryFn: () => apiFetch<any[]>("/intelligence/ecosystem-health") });
  const { data: aiHealth } = useQuery({ queryKey: ["admin-ai-health"], queryFn: () => apiFetch<any>("/intelligence/ai/health") });

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
            <Brain className="w-5 h-5 text-primary" /> AI System Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Natural language system queries and AI-powered anomaly detection</p>
        </div>
        {aiHealth && (
          <span className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <Zap className="w-3 h-3" /> AI: {aiHealth.activeTier}
          </span>
        )}
      </div>

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
              onClick={() => { setNlQuery(q); }}
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
          <Server className="w-4 h-4 text-emerald-400" /> AI Health Monitor
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
