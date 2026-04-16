import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { TrendingUp, Server, FlaskConical, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { API_BASE, DOMAIN_COLORS } from "./constants";

import { SectionCard, StatusDot, ConfidenceBadge } from "./components";

export function EvolveLayer() {
  const [proposeAgentId, setProposeAgentId] = useState("");
  const [proposeDescription, setProposeDescription] = useState("");
  const [proposeExpected, setProposeExpected] = useState("");
  const queryClient = useQueryClient();

  const { data: metricsData, isLoading: metricsLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-evolve-metrics"],
    queryFn: () => fetch(`${API_BASE}/control-tower/evolve/metrics`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const proposeMutation = useMutation({
    mutationFn: (body: { agentId: string; description: string; expectedImprovement: string }) =>
      fetch(`${API_BASE}/control-tower/evolve/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      setProposeDescription("");
      setProposeExpected("");
      queryClient.invalidateQueries({ queryKey: ["ct-evolve-metrics"] });
    },
  });

  const agentMetrics = ((metricsData?.data as Record<string, unknown>)?.agentMetrics as unknown[]) ?? [];
  const systemMetrics = (metricsData?.data as Record<string, unknown>)?.systemMetrics as Record<string, unknown> | undefined;
  const providerHealth = ((metricsData?.data as Record<string, unknown>)?.providerHealth as unknown[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Inferences", value: String(systemMetrics?.totalInferences ?? 0), color: "text-fuchsia-400" },
          { label: "Avg Latency", value: `${Math.round(Number(systemMetrics?.avgLatencyMs ?? 0))}ms`, color: "text-sky-400" },
          { label: "Total Decisions", value: String(systemMetrics?.totalDecisions ?? 0), color: "text-violet-400" },
          { label: "Pending Optimizations", value: String(agentMetrics.reduce((s: number, a) => s + ((a as Record<string, unknown>)?.optimizationProposals as unknown[] ?? []).filter((p: unknown) => (p as Record<string, unknown>).status === "pending").length, 0)), color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-lg font-bold font-mono", color)}>{metricsLoading ? "…" : value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Agent Performance" icon={TrendingUp} color="text-fuchsia-400">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {metricsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)
            ) : (
              agentMetrics.map((agent: unknown) => {
                const a = agent as Record<string, unknown>;
                const metrics = a.metrics as Record<string, unknown>;
                const proposals = (a.optimizationProposals as unknown[]) ?? [];
                const pendingProposals = proposals.filter((p: unknown) => (p as Record<string, unknown>).status === "pending");
                return (
                  <div key={String(a.agentId)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-foreground">{String(a.agentName)}</span>
                      <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border", DOMAIN_COLORS[String(a.domain)] ?? "text-muted-foreground")}>
                        {String(a.domain)}
                      </span>
                      {pendingProposals.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-auto">
                          {pendingProposals.length} proposals
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Decisions</p>
                        <p className="text-[10px] font-mono text-foreground">{String(metrics?.totalDecisions ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Confidence</p>
                        <ConfidenceBadge value={metrics?.avgConfidence as number | null} />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Success</p>
                        <p className="text-[10px] font-mono text-foreground">
                          {metrics?.successRate != null ? `${Math.round(Number(metrics.successRate) * 100)}%` : "—"}
                        </p>
                      </div>
                    </div>
                    {proposals.slice(0, 1).map((prop: unknown) => {
                      const p = prop as Record<string, unknown>;
                      return (
                        <div key={String(p.id)} className="mt-2 p-1.5 bg-amber-500/5 border border-amber-500/20 rounded text-[9px]">
                          <span className="text-amber-400 font-medium">Proposal: </span>
                          <span className="text-muted-foreground">{String(p.description).slice(0, 100)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Provider Health" icon={Server} color="text-sky-400">
            <div className="space-y-2">
              {providerHealth.slice(0, 5).map((p: unknown) => {
                const ph = p as Record<string, unknown>;
                const errorRate = Number(ph.errorRate ?? 0);
                return (
                  <div key={String(ph.provider)} className="flex items-center gap-2">
                    <StatusDot status={errorRate > 0.2 ? "degraded" : "healthy"} />
                    <span className="text-[10px] font-mono text-foreground w-24 shrink-0">{String(ph.provider)}</span>
                    <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (1 - errorRate) * 100))}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground w-16 text-right">{Math.round(Number(ph.avgLatencyMs ?? 0))}ms</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Propose Optimization" icon={FlaskConical} color="text-amber-400">
            <div className="space-y-2">
              <select
                className="w-full text-xs bg-muted/30 border border-border rounded px-2 py-1.5 text-foreground"
                value={proposeAgentId}
                onChange={e => setProposeAgentId(e.target.value)}
              >
                <option value="">Select agent…</option>
                {agentMetrics.map((a: unknown) => {
                  const ag = a as Record<string, unknown>;
                  return <option key={String(ag.agentId)} value={String(ag.agentId)}>{String(ag.agentName)}</option>;
                })}
              </select>
              <textarea
                className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                rows={2}
                placeholder="Describe the optimization…"
                value={proposeDescription}
                onChange={e => setProposeDescription(e.target.value)}
              />
              <input
                className="w-full text-xs bg-muted/20 border border-border rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                placeholder="Expected improvement…"
                value={proposeExpected}
                onChange={e => setProposeExpected(e.target.value)}
              />
              <button
                onClick={() => proposeAgentId && proposeDescription && proposeMutation.mutate({
                  agentId: proposeAgentId,
                  description: proposeDescription,
                  expectedImprovement: proposeExpected,
                })}
                disabled={!proposeAgentId || !proposeDescription || proposeMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {proposeMutation.isPending ? "Submitting…" : "Submit Proposal"}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
