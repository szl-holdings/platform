import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Cpu, Brain, Play, GitBranch, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { API_BASE, DOMAIN_COLORS } from "./constants";

import { SectionCard, StatusDot, ConfidenceBadge, TimeAgo } from "./components";

export function DecideLayer() {
  const [orchestrateQuery, setOrchestrateQuery] = useState("");
  const [orchestrateDepth, setOrchestrateDepth] = useState<"shallow" | "standard" | "deep">("standard");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-agents"],
    queryFn: () => fetch(`${API_BASE}/control-tower/decide/agents`).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: journalData, isLoading: journalLoading, refetch: refetchJournal } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-journal"],
    queryFn: () => fetch(`${API_BASE}/control-tower/decide/journal?limit=20`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const orchestrateMutation = useMutation({
    mutationFn: (body: { query: string; depth: string }) =>
      fetch(`${API_BASE}/control-tower/decide/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ct-journal"] });
    },
  });

  const agents = ((agentsData?.data as Record<string, unknown>)?.agents as unknown[]) ?? [];
  const healthSummary = (agentsData?.data as Record<string, unknown>)?.healthySummary as Record<string, number> | undefined;
  const journalEntries = ((journalData?.data as Record<string, unknown>)?.entries as unknown[]) ?? [];

  void refetchJournal;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Healthy Agents", value: healthSummary?.healthy ?? 0, color: "text-emerald-400" },
          { label: "Degraded", value: healthSummary?.degraded ?? 0, color: "text-amber-400" },
          { label: "Decisions Logged", value: (journalData?.data as Record<string, unknown>)?.total ?? 0, color: "text-violet-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold font-mono", color)}>{String(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Agent Registry" icon={Cpu} color="text-violet-400">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)
            ) : (
              agents.map((agent: unknown) => {
                const a = agent as Record<string, unknown>;
                const health = a.health as Record<string, unknown>;
                const perf = a.performance as Record<string, unknown>;
                return (
                  <div key={String(a.id)} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <StatusDot status={String(health?.status ?? "unknown")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{String(a.name)}</span>
                        <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border", DOMAIN_COLORS[String(a.domain)] ?? "text-muted-foreground")}>
                          {String(a.domain)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{String(a.subtitle)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground">Confidence:</span>
                        <ConfidenceBadge value={perf?.avgConfidence as number | null} />
                        <span className="text-[9px] text-muted-foreground">Decisions:</span>
                        <span className="text-[9px] font-mono text-foreground">{String(perf?.totalDecisions ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Orchestrate Query" icon={Brain} color="text-fuchsia-400">
            <div className="space-y-2">
              <textarea
                className="w-full text-xs bg-muted/20 border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40"
                rows={3}
                placeholder="What cross-domain intelligence do you need?"
                value={orchestrateQuery}
                onChange={e => setOrchestrateQuery(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <select
                  className="text-xs bg-muted/30 border border-border rounded px-2 py-1 text-foreground flex-1"
                  value={orchestrateDepth}
                  onChange={e => setOrchestrateDepth(e.target.value as "shallow" | "standard" | "deep")}
                >
                  <option value="shallow">Shallow</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </select>
                <button
                  onClick={() => orchestrateQuery && orchestrateMutation.mutate({ query: orchestrateQuery, depth: orchestrateDepth })}
                  disabled={!orchestrateQuery || orchestrateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  {orchestrateMutation.isPending ? "Running…" : "Orchestrate"}
                </button>
              </div>
            </div>
            {orchestrateMutation.data && (
              <div className="mt-3 p-2.5 bg-muted/10 border border-border/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-1">Synthesis</p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">
                  {((orchestrateMutation.data as Record<string, unknown>)?.data as Record<string, unknown>)?.result
                    ? String((((orchestrateMutation.data as Record<string, unknown>)?.data as Record<string, unknown>)?.result as Record<string, unknown>)?.synthesis ?? "").slice(0, 400)
                    : "Processing…"}
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Decision Journal" icon={GitBranch} color="text-violet-400">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {journalLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-6">
              <GitBranch className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No decisions journaled yet — run an orchestration to populate</p>
            </div>
          ) : (
            journalEntries.map((entry: unknown) => {
              const e = entry as Record<string, unknown>;
              const id = String(e.id);
              const isExpanded = expandedDecision === id;
              return (
                <div key={id} className="border border-border/40 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => setExpandedDecision(isExpanded ? null : id)}
                  >
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase",
                      e.outcome === "accepted" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                      e.outcome === "rejected" ? "text-red-400 border-red-500/30 bg-red-500/10" :
                      "text-muted-foreground border-border/30 bg-muted/10"
                    )}>
                      {String(e.outcome ?? "pending")}
                    </span>
                    <span className={cn("text-[10px] font-mono shrink-0", DOMAIN_COLORS[String(e.domain)] ?? "text-muted-foreground")}>{String(e.domain)}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{String(e.query ?? "").slice(0, 80)}</span>
                    <ConfidenceBadge value={e.confidence as number | null} />
                    <TimeAgo ts={e.timestamp as string} />
                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Decision</p>
                        <p className="text-[10px] text-foreground leading-relaxed">{String(e.decision ?? "").slice(0, 400)}</p>
                      </div>
                      {(e.reasoningChain as string[])?.length > 0 && (
                        <div>
                          <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Reasoning Chain</p>
                          <div className="space-y-0.5">
                            {(e.reasoningChain as string[]).slice(0, 3).map((r, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <span className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                                <span className="text-[10px] text-muted-foreground">{r.slice(0, 150)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-mono text-foreground">{String(e.durationMs ?? 0)}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}
