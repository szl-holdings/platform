import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type TokenUsage, type CostTrend, type GovernanceAudit } from "../lib/api";
import { cn, formatNumber } from "../lib/utils";
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, GitBranch, Play, ChevronRight, Clock, Zap, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  if (status === "blocked") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
}

const SWIM_LANES = [
  { agentId: "alloy", label: "Alloy", color: "#7c3aed" },
  { agentId: "helmsman", label: "Helmsman", color: "#3b82f6" },
  { agentId: "sentinel", label: "Sentinel", color: "#f43f5e" },
  { agentId: "beacon", label: "Beacon", color: "#10b981" },
];

interface ExecutionBlock {
  agentId: string;
  startPct: number;
  widthPct: number;
  label: string;
  type: "task" | "wait" | "validation" | "output";
  tokens?: number;
  latencyMs?: number;
  inputSummary?: string;
  outputSummary?: string;
  reasoningTrace?: string;
}

const SAMPLE_RUNS = [
  {
    id: "run-001",
    name: "Maritime Sanctions Investigation",
    duration: "4m 32s",
    status: "complete",
    timestamp: "2026-04-13 14:22:00",
    blocks: [
      { agentId: "alloy", startPct: 0, widthPct: 8, label: "Route & Plan", type: "task" as const, tokens: 1240, latencyMs: 820, inputSummary: "User query: investigate MV Kairos Star", outputSummary: "Crew assembled. Tasks dispatched to Helmsman, Sentinel, Beacon.", reasoningTrace: "1. Parse intent → sanctions investigation. 2. Identify required domain agents: Helmsman (AIS), Sentinel (OFAC), Beacon (anomaly). 3. Assign roles: Helmsman=lead-data, Sentinel=validator, Beacon=analytics. 4. Dispatch parallel tasks with shared context token." },
      { agentId: "helmsman", startPct: 10, widthPct: 30, label: "AIS Analysis", type: "task" as const, tokens: 8420, latencyMs: 4200, inputSummary: "Vessel MMSI: 123456789", outputSummary: "14 dark periods detected. Ownership opacity flagged.", reasoningTrace: "1. Query AIS feed for MMSI 123456789 — 90d window. 2. Identify 14 signal gaps >4h in restricted zones. 3. Cross-reference flag state compliance registry: score 23/100. 4. Resolve ownership chain via vessel DB — Panama shell entity, no UBO. 5. Package risk profile for Sentinel." },
      { agentId: "sentinel", startPct: 12, widthPct: 25, label: "Sanctions Screen", type: "task" as const, tokens: 5200, latencyMs: 3100, inputSummary: "Ownership entities from Helmsman", outputSummary: "OFAC secondary match found. Risk score: 0.87.", reasoningTrace: "1. Extract entity list from Helmsman output. 2. Direct OFAC SDN match: none found. 3. Graph traverse — shipping agent linked to SDN entity added March 2025. 4. Compute composite risk score: 0.87 (threshold 0.75). 5. Classify as CRITICAL." },
      { agentId: "beacon", startPct: 15, widthPct: 20, label: "Anomaly Detection", type: "task" as const, tokens: 3800, latencyMs: 2400, inputSummary: "Port call frequency data", outputSummary: "3σ deviation detected. Correlated with Helmsman.", reasoningTrace: "1. Load 12-month port call baseline for vessel class. 2. Compute deviation in Iranian Sea corridor call frequency. 3. Result: 3.1σ deviation — exceeds alert threshold of 2.5σ. 4. False-positive probability: 23% initially, reduced to 4.2% after Helmsman AIS confirmation." },
      { agentId: "sentinel", startPct: 40, widthPct: 15, label: "Validation", type: "validation" as const, tokens: 2100, latencyMs: 1800, inputSummary: "Aggregated findings", outputSummary: "Maker-checker: APPROVED with critical risk flag.", reasoningTrace: "1. Review Helmsman AIS report. 2. Review own OFAC findings. 3. Review Beacon anomaly data. 4. No exculpatory evidence found. 5. Maker-checker: all signals independently corroborated. 6. APPROVED — escalate to human gate." },
      { agentId: "alloy", startPct: 58, widthPct: 10, label: "Wait: Human Gate", type: "wait" as const, latencyMs: 14000, inputSummary: "Escalated to human approver", reasoningTrace: "Policy §4.2 requires human sign-off for CRITICAL risk classification. Holding all output delivery. Timeout: 30min." },
      { agentId: "alloy", startPct: 72, widthPct: 15, label: "Synthesize Output", type: "output" as const, tokens: 4200, latencyMs: 2100, inputSummary: "All agent outputs", outputSummary: "Investigation report generated. Risk: CRITICAL.", reasoningTrace: "1. Merge Helmsman, Sentinel, Beacon outputs into unified report structure. 2. Apply SZL report template. 3. Compute executive summary. 4. Attach evidence citations. 5. Mark risk classification: CRITICAL. 6. Deliver to Forge client portal." },
    ],
  },
  {
    id: "run-002",
    name: "AI Model Scouting — Q2 Assessment",
    duration: "2m 18s",
    status: "complete",
    timestamp: "2026-04-13 12:45:00",
    blocks: [
      { agentId: "alloy", startPct: 0, widthPct: 6, label: "Route", type: "task" as const, tokens: 820, latencyMs: 540, inputSummary: "Scout new text-generation models", outputSummary: "Routing to INCA." },
      { agentId: "helmsman", startPct: 0, widthPct: 0, label: "", type: "task" as const },
      { agentId: "sentinel", startPct: 0, widthPct: 0, label: "", type: "task" as const },
      { agentId: "beacon", startPct: 8, widthPct: 45, label: "HuggingFace Scout", type: "task" as const, tokens: 12400, latencyMs: 8200, inputSummary: "task=text-generation, limit=20", outputSummary: "38 models evaluated. Top 5 shortlisted." },
    ],
  },
];

function BlockTypeColor(type: ExecutionBlock["type"]): string {
  if (type === "task") return "#7c3aed";
  if (type === "wait") return "#6b7280";
  if (type === "validation") return "#f97316";
  return "#22c55e";
}

export function LLMOpsObservatory() {
  const [costView, setCostView] = useState<"stacked" | "total">("stacked");
  const [auditFilter, setAuditFilter] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"analytics" | "execution-timeline">("analytics");
  const [selectedRun, setSelectedRun] = useState<string>("run-001");
  const [replayStep, setReplayStep] = useState<number>(100);
  const [selectedBlock, setSelectedBlock] = useState<ExecutionBlock | null>(null);

  const currentRun = SAMPLE_RUNS.find(r => r.id === selectedRun) ?? SAMPLE_RUNS[0]!;
  const visibleBlocks = currentRun.blocks.filter(b => b.widthPct > 0 && b.startPct <= replayStep);

  const tokenQuery = useQuery({
    queryKey: ["inca-tokens"],
    queryFn: () => api.getTokenUsage(),
    staleTime: 120000,
  });
  const costQuery = useQuery({
    queryKey: ["inca-costs"],
    queryFn: () => api.getCostTrends(),
    staleTime: 120000,
  });
  const governanceQuery = useQuery({
    queryKey: ["inca-governance"],
    queryFn: () => api.getGovernanceAudit(),
    staleTime: 60000,
  });

  const tokenUsage: TokenUsage[] = tokenQuery.data?.data ?? [];
  const costTrends: CostTrend[] = costQuery.data?.data ?? [];
  const governanceAudit: GovernanceAudit[] = governanceQuery.data?.data ?? [];

  const costByDate = costTrends.map(d => ({
    date: d.date.slice(5),
    openai: d.openai,
    anthropic: d.anthropic,
    gemini: d.gemini,
    huggingface: d.huggingface,
    total: parseFloat((d.openai + d.anthropic + d.gemini + d.huggingface).toFixed(2)),
  }));

  const tokenByProvider = tokenUsage.reduce((acc, t) => {
    acc[t.provider] = (acc[t.provider] || 0) + t.tokens;
    return acc;
  }, {} as Record<string, number>);

  const totalCost30d = costTrends.reduce((s, d) => s + d.openai + d.anthropic + d.gemini + d.huggingface, 0);
  const totalTokens30d = Object.values(tokenByProvider).reduce((s, v) => s + v, 0);

  const filteredAudit = governanceAudit.filter(a => !auditFilter || a.status === auditFilter);

  const loading = tokenQuery.isLoading || costQuery.isLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">LLMOps Observatory</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Token usage analytics, cost trends, governance audit, and multi-agent execution timeline with time-travel debugging.
        </p>
      </div>

      {/* Main tab toggle */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        <button onClick={() => setMainTab("analytics")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mainTab === "analytics" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Shield className="w-3.5 h-3.5" /> Analytics & Governance
        </button>
        <button onClick={() => setMainTab("execution-timeline")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mainTab === "execution-timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <GitBranch className="w-3.5 h-3.5" /> Execution Timeline
        </button>
      </div>

      {mainTab === "execution-timeline" && (
        <div className="space-y-4">
          {/* Run selector */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">Workflow Run:</div>
            <div className="flex gap-2">
              {SAMPLE_RUNS.map(run => (
                <button
                  key={run.id}
                  onClick={() => { setSelectedRun(run.id); setReplayStep(100); setSelectedBlock(null); }}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", selectedRun === run.id ? "border-primary/40 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                >
                  {run.name}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {currentRun.timestamp}
              <span className="badge-running px-1.5 py-0.5 rounded">{currentRun.duration}</span>
            </div>
          </div>

          {/* Replay slider */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-3 mb-3">
              <Play className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="text-sm font-medium text-foreground">Execution Replay</div>
              <div className="ml-auto text-xs text-muted-foreground">Step: {replayStep}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={replayStep}
              onChange={e => { setReplayStep(parseInt(e.target.value)); setSelectedBlock(null); }}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>

          {/* Swim lane timeline */}
          <div className="inca-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Agent Execution Swim Lanes</div>
            </div>
            <div className="p-4 space-y-3">
              {SWIM_LANES.map(lane => {
                const laneBlocks = visibleBlocks.filter(b => b.agentId === lane.agentId);
                return (
                  <div key={lane.agentId} className="flex items-center gap-3">
                    <div className="w-20 flex-shrink-0">
                      <div className="text-xs font-medium text-foreground">{lane.label}</div>
                    </div>
                    <div className="flex-1 h-8 bg-secondary rounded-lg relative overflow-hidden">
                      {/* Replay progress overlay */}
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-150"
                        style={{ width: `${replayStep}%` }}
                      />
                      {laneBlocks.map((block, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedBlock(selectedBlock?.label === block.label && selectedBlock?.agentId === block.agentId ? null : block)}
                          className="absolute inset-y-1 rounded flex items-center justify-center text-xs font-medium transition-all hover:brightness-110"
                          style={{
                            left: `${block.startPct}%`,
                            width: `${block.widthPct}%`,
                            backgroundColor: `${BlockTypeColor(block.type)}28`,
                            border: `1px solid ${BlockTypeColor(block.type)}50`,
                            color: BlockTypeColor(block.type),
                          }}
                        >
                          <span className="truncate px-1">{block.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Time axis */}
              <div className="flex items-center gap-3">
                <div className="w-20 flex-shrink-0" />
                <div className="flex-1 flex justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span>0s</span>
                  <span>{Math.round(parseInt(currentRun.duration.replace(/m.*/, "")) * 60 * 0.25)}s</span>
                  <span>{Math.round(parseInt(currentRun.duration.replace(/m.*/, "")) * 60 * 0.5)}s</span>
                  <span>{Math.round(parseInt(currentRun.duration.replace(/m.*/, "")) * 60 * 0.75)}s</span>
                  <span>{currentRun.duration}</span>
                </div>
              </div>
            </div>

            {/* Block type legend */}
            <div className="px-4 pb-3 flex items-center gap-4">
              {[
                { type: "task" as const, label: "Agent Task" },
                { type: "validation" as const, label: "Validation" },
                { type: "wait" as const, label: "Wait/Gate" },
                { type: "output" as const, label: "Output" },
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${BlockTypeColor(type)}40`, border: `1px solid ${BlockTypeColor(type)}60` }} />
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Block inspector */}
          {selectedBlock && (
            <div className="inca-panel-active p-4 animate-scale-in">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <div className="text-sm font-medium text-foreground">{selectedBlock.label}</div>
                <span className="badge-staged px-1.5 py-0.5 rounded text-xs capitalize ml-1">{selectedBlock.type}</span>
                <div className="ml-auto text-xs text-muted-foreground capitalize">{selectedBlock.agentId}</div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                {selectedBlock.tokens && (
                  <div className="bg-secondary rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-0.5">Tokens</div>
                    <div className="text-sm font-mono text-foreground">{selectedBlock.tokens.toLocaleString()}</div>
                  </div>
                )}
                {selectedBlock.latencyMs && (
                  <div className="bg-secondary rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-0.5">Latency</div>
                    <div className="text-sm font-mono text-foreground">{selectedBlock.latencyMs >= 1000 ? `${(selectedBlock.latencyMs / 1000).toFixed(1)}s` : `${selectedBlock.latencyMs}ms`}</div>
                  </div>
                )}
              </div>
              {selectedBlock.inputSummary && (
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground mb-1">Input</div>
                  <div className="bg-secondary rounded-lg px-3 py-2 text-xs font-mono text-foreground">{selectedBlock.inputSummary}</div>
                </div>
              )}
              {selectedBlock.outputSummary && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Output</div>
                  <div className="bg-secondary rounded-lg px-3 py-2 text-xs font-mono text-foreground">{selectedBlock.outputSummary}</div>
                </div>
              )}
              {selectedBlock.reasoningTrace && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" />
                    Reasoning Trace
                  </div>
                  <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 text-xs font-mono text-foreground leading-relaxed">{selectedBlock.reasoningTrace}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mainTab === "analytics" && (
      <div>
      {loading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Loading observatory data...
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">30-Day Cost</div>
          <div className="text-xl font-display font-bold text-foreground">{totalCost30d > 0 ? `$${totalCost30d.toFixed(2)}` : "—"}</div>
          <div className="text-xs text-muted-foreground">all providers</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
          <div className="text-xl font-display font-bold text-foreground">{totalTokens30d > 0 ? formatNumber(totalTokens30d) : "—"}</div>
          <div className="text-xs text-muted-foreground">30-day window</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Governance Events</div>
          <div className="text-xl font-display font-bold text-foreground">{governanceAudit.length > 0 ? governanceAudit.length : "—"}</div>
          <div className="text-xs text-muted-foreground">{governanceAudit.filter(a => a.sensitiveData).length} with sensitive data</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Policy Blocks</div>
          <div className={cn("text-xl font-display font-bold", governanceAudit.filter(a => a.status === "blocked").length > 0 ? "text-red-400" : "text-foreground")}>
            {governanceAudit.length > 0 ? governanceAudit.filter(a => a.status === "blocked").length : "—"}
          </div>
          <div className="text-xs text-muted-foreground">last 30 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Cost trend chart */}
        <div className="lg:col-span-2 inca-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-foreground">Provider Cost Trends (30d)</div>
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setCostView("stacked")}
                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-all", costView === "stacked" ? "bg-card text-foreground" : "text-muted-foreground")}
              >
                Stacked
              </button>
              <button
                onClick={() => setCostView("total")}
                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-all", costView === "total" ? "bg-card text-foreground" : "text-muted-foreground")}
              >
                Total
              </button>
            </div>
          </div>
          {costQuery.isError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load cost data
            </div>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={costByDate.slice(-14)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,14%,15%,1)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(240 16% 8%)", border: "1px solid hsl(240 14% 10%)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(v: number) => [`$${v.toFixed(3)}`, ""]}
              />
              {costView === "stacked" ? (
                Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                  <Area key={p} type="monotone" dataKey={p} stackId="1" stroke={c} fill={`url(#grad-${p})`} strokeWidth={1.5} />
                ))
              ) : (
                <Area type="monotone" dataKey="total" stroke="#7c3aed" fill="url(#grad-openai)" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token distribution */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-3">Token Usage by Provider</div>
          {tokenQuery.isError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load token data
            </div>
          )}
          <div className="space-y-3">
            {Object.entries(tokenByProvider).map(([provider, tokens]) => (
              <div key={provider}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                    <div className="text-xs text-muted-foreground capitalize">{provider}</div>
                  </div>
                  <div className="text-xs text-foreground font-mono">{formatNumber(tokens)}</div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: totalTokens30d > 0 ? `${(tokens / totalTokens30d) * 100}%` : "0%", backgroundColor: PROVIDER_COLORS[provider] || "#888" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {Object.keys(tokenByProvider).length === 0 && !tokenQuery.isLoading && (
            <div className="text-xs text-muted-foreground text-center py-4">No token data available</div>
          )}
          {costTrends.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Cost per provider</div>
              <div className="space-y-1.5">
                {Object.keys(PROVIDER_COLORS).map((p) => {
                  const total = costTrends.reduce((s, d) => s + (d[p as keyof CostTrend] as number || 0), 0);
                  return (
                    <div key={p} className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground capitalize">{p}</div>
                      <div className="text-xs font-mono text-foreground">${total.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Governance Audit Trail */}
      <div className="inca-panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-sm font-medium text-foreground">Governance Audit Trail</div>
          </div>
          <div className="flex gap-1.5">
            {[null, "approved", "requires_approval", "blocked"].map((f) => (
              <button
                key={f ?? "all"}
                onClick={() => setAuditFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  auditFilter === f
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                {f === null ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        {governanceQuery.isLoading && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Loading audit trail...
          </div>
        )}
        {governanceQuery.isError && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load governance audit data
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Agent</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Action</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-medium">Sensitive</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Flag</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((entry, idx) => (
                <tr key={idx} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{entry.timestamp.replace("T", " ").slice(0, 19)}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground capitalize">{entry.agent}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{entry.model}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{entry.action.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-center">
                    {entry.sensitiveData
                      ? <span className="badge-error px-1.5 py-0.5 rounded">yes</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.flag
                      ? <span className="badge-warning px-1.5 py-0.5 rounded font-mono">{entry.flag}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <StatusIcon status={entry.status} />
                      <span className={cn(
                        "text-xs",
                        entry.status === "approved" ? "text-green-400" : entry.status === "blocked" ? "text-red-400" : "text-amber-400"
                      )}>
                        {entry.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAudit.length === 0 && !governanceQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">No governance events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
