import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { api, type LifecycleRecord, type CostIntelligence } from "../lib/api";
import {
  Search, ArrowRight, CheckCircle, Clock, AlertTriangle, XCircle,
  Activity, TrendingDown, DollarSign, BarChart3, Play, RefreshCw,
  ChevronRight, Zap, Archive, Shield, RotateCcw, Brain, GitBranch, Loader2
} from "lucide-react";

type LifecycleStage = "discovery" | "evaluation" | "security-scan" | "governance" | "staging" | "ab-testing" | "production" | "monitoring" | "retirement";

const STAGE_ORDER: LifecycleStage[] = [
  "discovery", "evaluation", "security-scan", "governance",
  "staging", "ab-testing", "production", "monitoring", "retirement"
];

const STAGE_CONFIG: Record<LifecycleStage, { label: string; icon: React.ComponentType<{className?: string; style?: React.CSSProperties}>; color: string }> = {
  discovery: { label: "Discovery", icon: Search, color: "#60a5fa" },
  evaluation: { label: "Evaluation", icon: BarChart3, color: "#a78bfa" },
  "security-scan": { label: "Security Scan", icon: Shield, color: "#f43f5e" },
  governance: { label: "Governance", icon: CheckCircle, color: "#f59e0b" },
  staging: { label: "Staging", icon: GitBranch, color: "#22d3ee" },
  "ab-testing": { label: "A/B Testing", icon: Activity, color: "#f97316" },
  production: { label: "Production", icon: Zap, color: "#22c55e" },
  monitoring: { label: "Monitoring", icon: Brain, color: "#7c3aed" },
  retirement: { label: "Retirement", icon: Archive, color: "#6b7280" },
};

const STATUS_CONFIG = {
  "in-progress": { label: "Active", badge: "badge-running" },
  passed: { label: "Passed", badge: "badge-running" },
  failed: { label: "Failed", badge: "badge-error" },
  pending: { label: "Pending", badge: "badge-idle" },
  blocked: { label: "Blocked", badge: "badge-warning" },
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  meta: "#a78bfa",
  alibaba: "#f43f5e",
  microsoft: "#22d3ee",
};

function PipelineStages({ currentStage, status }: { currentStage: string; status: string }) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage as LifecycleStage);
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {STAGE_ORDER.map((stage, idx) => {
        const cfg = STAGE_CONFIG[stage];
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFailed = isCurrent && (status === "failed" || status === "blocked");
        const isActive = isCurrent && !isFailed;

        return (
          <div key={stage} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap border transition-all",
                isPast && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                isActive && "border text-primary",
                isFailed && "bg-red-500/10 border-red-500/20 text-red-400",
                !isPast && !isCurrent && "bg-secondary border-transparent text-muted-foreground opacity-40"
              )}
              style={isActive ? { background: `${cfg.color}15`, borderColor: `${cfg.color}40`, color: cfg.color } : {}}
            >
              {cfg.label}
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ModelLifecycle() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pipeline" | "cost-intelligence" | "rotation">("pipeline");
  const [stageFilter, setStageFilter] = useState<string>("All");

  const lifecycleQuery = useQuery({
    queryKey: ["inca-model-lifecycle"],
    queryFn: () => api.getModelLifecycle(),
    staleTime: 30_000,
  });

  const rotationMutation = useMutation({
    mutationFn: ({ modelId, candidateModelId }: { modelId: string; candidateModelId: string }) =>
      api.initiateRotation(modelId, candidateModelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inca-model-lifecycle"] });
      qc.invalidateQueries({ queryKey: ["inca-model-catalog"] });
    },
  });

  const lifecycleModels: LifecycleRecord[] = lifecycleQuery.data?.data.pipeline ?? [];
  const costIntelligence: CostIntelligence[] = lifecycleQuery.data?.data.costIntelligence ?? [];
  const summary = lifecycleQuery.data?.data.summary ?? { inProduction: 0, blocked: 0, rotationCandidates: 0, totalMonthlyCost: 0, potentialSavings: 0 };

  const filtered = lifecycleModels.filter(m => stageFilter === "All" || m.stage === stageFilter);
  const rotationCandidates = lifecycleModels.filter(m => m.rotation);
  const retirementQueue = lifecycleModels.filter(m => m.stage === "retirement");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Model Lifecycle</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Full lifecycle pipeline from Discovery to Retirement. Automated rotation suggestions, cost intelligence per model/agent/domain, and graceful deprecation with migration paths.
        </p>
      </div>

      {lifecycleQuery.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading lifecycle data…</span>
        </div>
      )}

      {lifecycleQuery.isError && (
        <div className="inca-panel p-4 border-red-500/20 text-sm text-red-400 flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load lifecycle data: {lifecycleQuery.error?.message}
        </div>
      )}

      {!lifecycleQuery.isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">In Production</div>
              <div className="text-xl font-display font-bold text-emerald-400">{summary.inProduction}</div>
              <div className="text-xs text-muted-foreground">active deployments</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Blocked / Failed</div>
              <div className={cn("text-xl font-display font-bold", summary.blocked > 0 ? "text-red-400" : "text-foreground")}>{summary.blocked}</div>
              <div className="text-xs text-muted-foreground">pipeline blockers</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Rotation Candidates</div>
              <div className={cn("text-xl font-display font-bold", summary.rotationCandidates > 0 ? "text-amber-400" : "text-foreground")}>{summary.rotationCandidates}</div>
              <div className="text-xs text-muted-foreground">degradation detected</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Potential Savings</div>
              <div className="text-xl font-display font-bold text-primary">${summary.potentialSavings}/mo</div>
              <div className="text-xs text-muted-foreground">vs tracked ${summary.totalMonthlyCost}/mo</div>
            </div>
          </div>

          <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
            <button onClick={() => setTab("pipeline")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "pipeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Activity className="w-3.5 h-3.5" /> Lifecycle Pipeline
            </button>
            <button onClick={() => setTab("cost-intelligence")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "cost-intelligence" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <DollarSign className="w-3.5 h-3.5" /> Cost Intelligence
            </button>
            <button onClick={() => setTab("rotation")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "rotation" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <RefreshCw className="w-3.5 h-3.5" /> Rotation Suggestions
            </button>
          </div>

          {tab === "pipeline" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button onClick={() => setStageFilter("All")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-all", stageFilter === "All" ? "bg-primary/15 text-primary border-primary/25" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}>All</button>
                {STAGE_ORDER.map(s => {
                  const cfg = STAGE_CONFIG[s];
                  const count = lifecycleModels.filter(m => m.stage === s).length;
                  if (count === 0) return null;
                  return (
                    <button key={s} onClick={() => setStageFilter(s)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-all", stageFilter === s ? "border" : "bg-secondary text-muted-foreground border-transparent hover:text-foreground")}
                      style={stageFilter === s ? { background: `${cfg.color}15`, color: cfg.color, borderColor: `${cfg.color}35` } : {}}>
                      {cfg.label} ({count})
                    </button>
                  );
                })}
              </div>

              {filtered.map((model) => {
                const stageCfg = STAGE_CONFIG[model.stage as LifecycleStage] ?? { label: model.stage, icon: Activity, color: "#888" };
                const StageIcon = stageCfg.icon;
                const statusCfg = STATUS_CONFIG[model.stageStatus];
                const pColor = PROVIDER_COLORS[model.provider] || "#888";
                const isFailed = model.stageStatus === "failed" || model.stageStatus === "blocked";

                return (
                  <div key={model.id} className={cn("inca-panel p-4", isFailed && "border-red-500/15", model.rotation && "border-amber-500/15")}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${pColor}18`, border: `1px solid ${pColor}30` }}>
                        <StageIcon className="w-4 h-4" style={{ color: stageCfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{model.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">{model.provider}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-xs", statusCfg.badge)}>{stageCfg.label} — {statusCfg.label}</span>
                          {model.daysInStage > 14 && model.stage !== "production" && (
                            <span className="text-xs text-amber-400 flex items-center gap-0.5"><Clock className="w-3 h-3" /> {model.daysInStage}d in stage</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {model.securityScore && <span>Security: <span className={model.securityScore >= 85 ? "text-emerald-400" : "text-amber-400"}>{model.securityScore}</span></span>}
                          {model.benchmarkScore && <span>MMLU: {model.benchmarkScore}%</span>}
                          {model.costPer1kTokens && <span>${model.costPer1kTokens}/1K</span>}
                          {model.agentCount && <span>{model.agentCount} agent{model.agentCount > 1 ? "s" : ""}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 overflow-x-auto">
                      <PipelineStages currentStage={model.stage} status={model.stageStatus} />
                    </div>

                    <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                      <span className="text-foreground font-medium">Next: </span>{model.nextAction}
                    </div>

                    {model.rotation && (
                      <div className="mt-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-amber-400">Rotation Suggested</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{model.rotation.reason}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">Candidate: <span className="text-foreground font-mono">{model.rotation.candidateModel}</span></span>
                          <span className="text-xs text-emerald-400">{model.rotation.savingsEstimate}</span>
                          <button
                            onClick={() => rotationMutation.mutate({ modelId: model.modelId, candidateModelId: "" })}
                            disabled={rotationMutation.isPending}
                            className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/15 transition-colors disabled:opacity-50"
                          >
                            {rotationMutation.isPending && rotationMutation.variables?.modelId === model.modelId
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Play className="w-3 h-3" />}
                            Initiate Swap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="inca-panel p-10 text-center text-muted-foreground text-sm">No models in the selected stage.</div>
              )}
            </div>
          )}

          {tab === "cost-intelligence" && (
            <div className="space-y-4">
              <div className="inca-panel p-4">
                <div className="text-sm font-medium text-foreground mb-3">Optimization Opportunities</div>
                <div className="space-y-3">
                  {costIntelligence.map((ci, idx) => (
                    <div key={idx} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-foreground">{ci.agent}</span>
                          <span className="text-xs text-muted-foreground ml-2">{ci.domain}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Current: <span className="text-foreground font-mono">${ci.monthlyCost}/mo</span></div>
                          <div className="text-xs text-muted-foreground">With swap: <span className="text-emerald-400 font-mono">${ci.alternativeCost}/mo</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="bg-secondary rounded-lg p-2">
                          <div className="text-muted-foreground mb-0.5">Current Model</div>
                          <div className="font-mono text-foreground">{ci.model}</div>
                        </div>
                        <div className="bg-secondary rounded-lg p-2">
                          <div className="text-muted-foreground mb-0.5">Alternative</div>
                          <div className="font-mono text-primary">{ci.alternativeModel}</div>
                        </div>
                        <div className="bg-secondary rounded-lg p-2">
                          <div className="text-muted-foreground mb-0.5">Quality Δ</div>
                          <div className={cn("font-mono", ci.qualityDelta >= 0 ? "text-emerald-400" : "text-amber-400")}>{ci.qualityDelta >= 0 ? "+" : ""}{ci.qualityDelta}%</div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                          <div className="text-emerald-400 mb-0.5">Monthly Savings</div>
                          <div className="text-emerald-400 font-mono font-medium">${ci.savings}/mo</div>
                        </div>
                      </div>
                      <button className="mt-2 flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/15 transition-colors">
                        <Play className="w-3 h-3" /> Apply Optimization
                      </button>
                    </div>
                  ))}

                  {costIntelligence.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6">No cost optimization opportunities identified.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "rotation" && (
            <div className="space-y-4">
              {rotationCandidates.map((model) => (
                <div key={model.id} className="inca-panel p-4 border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{model.name}</div>
                      <div className="text-xs text-amber-400">{model.rotation!.reason}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-secondary rounded-lg p-3 border border-red-500/15">
                      <div className="text-xs text-muted-foreground mb-1">Current Model</div>
                      <div className="text-sm font-mono text-foreground">{model.name}</div>
                      <div className="text-xs text-red-400 mt-1">Performance degrading</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="bg-secondary rounded-lg p-3 border border-emerald-500/15">
                      <div className="text-xs text-muted-foreground mb-1">Candidate Model</div>
                      <div className="text-sm font-mono text-primary">{model.rotation!.candidateModel}</div>
                      <div className="text-xs text-emerald-400 mt-1">{model.rotation!.savingsEstimate}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rotationMutation.mutate({ modelId: model.modelId, candidateModelId: "" })}
                      disabled={rotationMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {rotationMutation.isPending && rotationMutation.variables?.modelId === model.modelId
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Play className="w-3.5 h-3.5" />}
                      Start Rotation
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors border border-border">
                      <BarChart3 className="w-3.5 h-3.5" /> Run A/B Test First
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors border border-border">
                      <RotateCcw className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              ))}

              {rotationCandidates.length === 0 && (
                <div className="inca-panel p-10 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">All models performing within acceptable baselines. No rotations suggested.</div>
                </div>
              )}

              <div className="inca-panel p-4">
                <div className="text-sm font-medium text-foreground mb-3">Retirement Queue</div>
                <div className="space-y-2">
                  {retirementQueue.map((model) => (
                    <div key={model.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                      <Archive className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.nextAction}</div>
                      </div>
                      <span className="badge-idle px-1.5 py-0.5 rounded text-xs">Retiring</span>
                    </div>
                  ))}
                  {retirementQueue.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">No models in retirement queue</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
