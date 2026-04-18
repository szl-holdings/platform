// @ts-nocheck
import { EvidencePanel, ApprovalBadge, DegradedModeBanner, HumanReviewBadge, PriorityBadge, ActionTypeBadge, EnvironmentLabel } from "@szl-holdings/shared-ui/alloy-decision-card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@lyte/lib/api";
import type { AlloyAIHealth, AlloyAIModels, AlloyAIAuditResult } from "@lyte/lib/api";
import {
  Brain, Cpu, Shield, Activity, Search, FileText, CheckCircle, AlertTriangle, Clock, Zap, Eye, ChevronRight, RefreshCw, Crosshair, UserCheck, Database, BarChart3, Lock, GitBranch, Info, X, } from "lucide-react";
import { ConfidenceBand } from "@szl-holdings/shared-ui/alloy-decision-card";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

type TabView = "overview" | "models" | "tools" | "retrieval" | "audit" | "decisions";

function Panel({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={`rounded-md overflow-hidden ${className}`} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      {accent && <div className="h-px" style={{ background: accent }} />}
      {children}
    </div>
  );
}

function PanelHead({ icon: Icon, title, right, accent }: { icon: React.ElementType; title: string; right?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent ?? TEXT.tertiary }} />
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{title}</span>
      </div>
      {right}
    </div>
  );
}


function ModelSlotCard({ slot }: { slot: { model: string; role: string; provider: string } }) {
  const roleColors: Record<string, string> = {
    primary: "#d4a054",
    secondary: "#c8953c",
    fallback: "#7c85a0",
    vision: "#8b7ac8",
    embed: "#4a90b8",
    rerank: "#6b8f71",
  };
  return (
    <div className="rounded px-3 py-2.5" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-3 h-3" style={{ color: roleColors[slot.role] || TEXT.tertiary }} />
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: roleColors[slot.role] || TEXT.secondary }}>{slot.role}</span>
      </div>
      <div className="text-[10px] font-mono" style={{ color: TEXT.primary }}>{slot.model}</div>
      <div className="text-[8px] font-mono mt-0.5" style={{ color: TEXT.muted }}>{slot.provider}</div>
    </div>
  );
}

export default function AlloyIntelligence() {
  const [tab, setTab] = useState<TabView>("overview");
  const [triageInput, setTriageInput] = useState("");
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [planInput, setPlanInput] = useState("");
  const [planResult, setPlanResult] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<AlloyAIHealth>({
    queryKey: ["alloy-ai-health"],
    queryFn: () => api.ai.health(),
    refetchInterval: 30_000,
  });

  const { data: models } = useQuery<AlloyAIModels>({
    queryKey: ["alloy-ai-models"],
    queryFn: () => api.ai.models(),
    enabled: tab === "models" || tab === "overview",
  });

  const { data: tools } = useQuery({
    queryKey: ["alloy-ai-tools"],
    queryFn: () => api.ai.tools(),
    enabled: tab === "tools",
  });

  const { data: auditData } = useQuery<AlloyAIAuditResult>({
    queryKey: ["alloy-ai-audit"],
    queryFn: () => api.ai.audit(50),
    enabled: tab === "audit",
  });

  const { data: decisionsData, refetch: refetchDecisions } = useQuery<{ total: number; decisions: any[] }>({
    queryKey: ["alloy-ai-decisions"],
    queryFn: () => api.ai.decisions(),
    enabled: tab === "decisions",
    refetchInterval: tab === "decisions" ? 15_000 : false,
  });

  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);

  const handleTriage = async () => {
    if (!triageInput.trim()) return;
    setTriageLoading(true);
    try {
      const result = await api.ai.triage(triageInput);
      setTriageResult(result);
    } catch (err) {
      setTriageResult({ error: err instanceof Error ? err.message : "Failed" });
    }
    setTriageLoading(false);
  };

  const handlePlan = async () => {
    if (!planInput.trim()) return;
    setPlanLoading(true);
    try {
      const result = await api.ai.plan(planInput);
      setPlanResult(result);
    } catch (err) {
      setPlanResult({ error: err instanceof Error ? err.message : "Failed" });
    }
    setPlanLoading(false);
  };

  const TABS: Array<{ id: TabView; label: string; icon: React.ElementType }> = [
    { id: "overview", label: "Intelligence Hub", icon: Brain },
    { id: "decisions", label: "Decision Fabric", icon: GitBranch },
    { id: "models", label: "Model Registry", icon: Cpu },
    { id: "tools", label: "Tool Layer", icon: Zap },
    { id: "retrieval", label: "Retrieval", icon: Database },
    { id: "audit", label: "Audit Trail", icon: FileText },
  ];

  const priorityColors: Record<string, string> = { P0: "#c45a4a", P1: "#c8953c", P2: "#d4a054", P3: "#4a90b8", P4: "#7c85a0" };
  const actionTypeColors: Record<string, string> = { approve: "#6b8f71", escalate: "#c45a4a", defer: "#c8953c", route: "#4a90b8", close: "#7c85a0", investigate: "#8b7ac8" };

  return (
    <div className="p-3 lg:p-4 space-y-3" style={{ maxWidth: 1440 }}>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-semibold tracking-tight" style={{ color: TEXT.primary }}>Alloy Intelligence Fabric</h1>
          <EnvironmentLabel environment="demo" />
          <span className="text-[9px] font-mono px-2 py-px rounded" style={{
            color: health?.status === "configured" ? "#6b8f71" : "#c8953c",
            background: health?.status === "configured" ? "rgba(107,143,113,0.06)" : "rgba(200,149,60,0.06)",
            border: `1px solid ${health?.status === "configured" ? "rgba(107,143,113,0.12)" : "rgba(200,149,60,0.12)"}`,
          }}>
            {health?.status === "configured" ? "LIVE" : "STANDBY"}
          </span>
        </div>
        <button onClick={() => refetchHealth()} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono hover:bg-white/[0.03]" style={{ border: `1px solid ${BORDER.subtle}`, color: TEXT.tertiary }}>
          <RefreshCw className={`w-3 h-3 ${healthLoading ? "animate-spin" : ""}`} />
          Sync
        </button>
      </div>

      <div className="flex gap-1 rounded-md p-0.5" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium transition-all" style={{
            color: tab === t.id ? TEXT.primary : TEXT.tertiary,
            background: tab === t.id ? BG.elevated : "transparent",
          }}>
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <Panel accent="#d4a054">
              <PanelHead icon={Brain} title="AI Engine Status" accent="#d4a054" />
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Models", value: models?.slots?.length || 0, icon: Cpu },
                    { label: "Routes", value: health?.routes?.length || 0, icon: Activity },
                    { label: "Audit Log", value: health?.auditLogSize || 0, icon: FileText },
                    { label: "Indexed", value: health?.retrieval?.totalChunks || 0, icon: Database },
                  ].map(m => (
                    <div key={m.label} className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <m.icon className="w-3 h-3" style={{ color: TEXT.muted }} />
                        <span className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>{m.label}</span>
                      </div>
                      <span className="text-lg font-bold font-mono" style={{ color: TEXT.primary }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-[8px] uppercase tracking-widest mb-1.5" style={{ color: TEXT.muted }}>Execution Mode</div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3" style={{ color: "#c8953c" }} />
                    <span className="text-[10px] font-mono" style={{ color: "#c8953c" }}>{String(health?.config?.executionMode || "propose_only")}</span>
                    <span className="text-[8px]" style={{ color: TEXT.muted }}>AI proposes, humans approve</span>
                  </div>
                </div>
              </div>
            </Panel>

            {models?.slots && (
              <Panel accent="#4a90b8">
                <PanelHead icon={Cpu} title="Active Model Slots" accent="#4a90b8" />
                <div className="p-2 space-y-1.5">
                  {models.slots.slice(0, 4).map((s, i) => (
                    <ModelSlotCard key={i} slot={s} />
                  ))}
                </div>
              </Panel>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-3">
            <Panel accent="#8b7ac8">
              <PanelHead icon={Crosshair} title="Triage Engine" accent="#8b7ac8" right={
                <span className="text-[8px] font-mono" style={{ color: "rgba(139,122,200,0.5)" }}>Structured Output</span>
              } />
              <div className="p-3 space-y-2">
                <textarea
                  value={triageInput}
                  onChange={e => setTriageInput(e.target.value)}
                  placeholder="Describe an incident, signal, or situation for AI triage..."
                  className="w-full h-20 rounded px-2.5 py-2 text-[10px] resize-none outline-none"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}
                />
                <button onClick={handleTriage} disabled={triageLoading || !triageInput.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium disabled:opacity-40 hover:opacity-80 transition-all" style={{ background: "rgba(139,122,200,0.12)", color: "#8b7ac8", border: "1px solid rgba(139,122,200,0.2)" }}>
                  {triageLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                  {triageLoading ? "Analyzing..." : "Run Triage"}
                </button>

                {triageResult?.decision && (
                  <div className="rounded px-2.5 py-2 space-y-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-px rounded" style={{ color: priorityColors[triageResult.decision.priority] || TEXT.primary, background: `${priorityColors[triageResult.decision.priority]}14`, border: `1px solid ${priorityColors[triageResult.decision.priority]}2a` }}>
                        {triageResult.decision.priority}
                      </span>
                      <span className="text-[8px] font-mono uppercase" style={{ color: TEXT.tertiary }}>{triageResult.decision.urgency}</span>
                      <ConfidenceBand value={triageResult.decision.confidence} size="md" />
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: TEXT.primary }}>{triageResult.decision.summary}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px]" style={{ color: TEXT.muted }}>Route to:</span>
                      <span className="text-[9px] font-semibold" style={{ color: "#d4a054" }}>{triageResult.decision.routeTo}</span>
                    </div>
                    {triageResult.decision.requiresHumanReview && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(200,149,60,0.06)", border: "1px solid rgba(200,149,60,0.12)" }}>
                        <UserCheck className="w-3 h-3" style={{ color: "#c8953c" }} />
                        <span className="text-[8px] font-mono" style={{ color: "#c8953c" }}>Human Review Required</span>
                      </div>
                    )}
                    {triageResult.decision.suggestedActions?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>Suggested Actions</div>
                        {triageResult.decision.suggestedActions.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <ChevronRight className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                            <span className="text-[9px]" style={{ color: TEXT.secondary }}>{a.action}</span>
                            <ConfidenceBand value={a.confidence} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                      <Cpu className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                      <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{triageResult.model} · {triageResult.latencyMs}ms</span>
                    </div>
                  </div>
                )}
                {triageResult?.error && (
                  <div className="rounded px-2.5 py-2" style={{ background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.12)" }}>
                    <span className="text-[9px]" style={{ color: "#c45a4a" }}>{triageResult.error}</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-3">
            <Panel accent="#6b8f71">
              <PanelHead icon={Shield} title="Execution Planner" accent="#6b8f71" right={
                <span className="text-[8px] font-mono" style={{ color: "rgba(107,143,113,0.5)" }}>Policy-Gated</span>
              } />
              <div className="p-3 space-y-2">
                <textarea
                  value={planInput}
                  onChange={e => setPlanInput(e.target.value)}
                  placeholder="Describe an objective for Alloy to plan..."
                  className="w-full h-20 rounded px-2.5 py-2 text-[10px] resize-none outline-none"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}
                />
                <button onClick={handlePlan} disabled={planLoading || !planInput.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium disabled:opacity-40 hover:opacity-80 transition-all" style={{ background: "rgba(107,143,113,0.12)", color: "#6b8f71", border: "1px solid rgba(107,143,113,0.2)" }}>
                  {planLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                  {planLoading ? "Planning..." : "Generate Plan"}
                </button>

                {planResult?.plan && (
                  <div className="rounded px-2.5 py-2 space-y-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-px rounded" style={{ color: actionTypeColors[planResult.plan.actionType] || TEXT.primary, background: `${actionTypeColors[planResult.plan.actionType]}14`, border: `1px solid ${actionTypeColors[planResult.plan.actionType]}2a` }}>
                        {planResult.plan.actionType}
                      </span>
                      <ConfidenceBand value={planResult.plan.confidence} size="md" />
                      {planResult.plan.approvalRequired && (
                        <span className="text-[8px] font-mono px-1.5 py-px rounded" style={{ color: "#c8953c", background: "rgba(200,149,60,0.06)", border: "1px solid rgba(200,149,60,0.12)" }}>
                          {planResult.plan.approvalLevel} approval
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: TEXT.primary }}>{planResult.plan.action}</p>
                    <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>{planResult.plan.reasoning}</p>
                    <EvidencePanel evidence={planResult.plan.evidence} collapsible />
                    {planResult.plan.alternatives?.length > 0 && (
                      <div className="space-y-1 pt-1" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                        <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>Alternatives</div>
                        {planResult.plan.alternatives.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <ChevronRight className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                            <span className="text-[9px]" style={{ color: TEXT.secondary }}>{a.action}</span>
                            <ConfidenceBand value={a.confidence} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                      <Cpu className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                      <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{planResult.model} · {planResult.latencyMs}ms</span>
                    </div>
                  </div>
                )}
                {planResult?.error && (
                  <div className="rounded px-2.5 py-2" style={{ background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.12)" }}>
                    <span className="text-[9px]" style={{ color: "#c45a4a" }}>{planResult.error}</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "models" && models && (
        <div className="space-y-3">
          <Panel accent="#4a90b8">
            <PanelHead icon={Cpu} title="Model Slot Registry" accent="#4a90b8" right={
              <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                {models.tokenConfigured ? "HF Token Configured" : "No HF Token"}
              </span>
            } />
            <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
              {models.slots.map((s, i) => (
                <ModelSlotCard key={i} slot={s} />
              ))}
            </div>
          </Panel>
          <Panel accent="#d4a054">
            <PanelHead icon={Activity} title="Route Configuration" accent="#d4a054" />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {Object.entries(models.routes).map(([routeClass, config]) => (
                <div key={routeClass} className="px-3 py-2 flex items-center gap-3">
                  <span className="text-[10px] font-mono w-28 shrink-0" style={{ color: TEXT.primary }}>{routeClass}</span>
                  <span className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>{config.model}</span>
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>max:{config.maxTokens} temp:{config.temperature}</span>
                  {config.structuredOutput && (
                    <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.08)" }}>structured</span>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "tools" && tools && (
        <Panel accent="#c8953c">
          <PanelHead icon={Zap} title="Alloy Tool Layer" accent="#c8953c" right={
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>Mode: {tools.executionMode}</span>
            </div>
          } />
          <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
            {tools.tools.map((tool: any) => (
              <div key={tool.name} className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-semibold" style={{ color: TEXT.primary }}>{tool.name}</span>
                  {tool.policy.requiresApproval && (
                    <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: "#c8953c", background: "rgba(200,149,60,0.08)", border: "1px solid rgba(200,149,60,0.12)" }}>
                      Approval Required
                    </span>
                  )}
                  {!tool.policy.allowed && (
                    <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.08)" }}>
                      Blocked
                    </span>
                  )}
                  {tool.policy.allowed && !tool.policy.requiresApproval && (
                    <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.08)" }}>
                      Allowed
                    </span>
                  )}
                </div>
                <p className="text-[9px]" style={{ color: TEXT.tertiary }}>{tool.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "retrieval" && (
        <div className="space-y-3">
          <Panel accent="#4a90b8">
            <PanelHead icon={Database} title="Retrieval Engine" accent="#4a90b8" />
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded px-2.5 py-2 text-center" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-lg font-bold font-mono" style={{ color: TEXT.primary }}>{health?.retrieval?.totalChunks || 0}</div>
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>Indexed Chunks</div>
                </div>
                <div className="rounded px-2.5 py-2 text-center" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-lg font-bold font-mono" style={{ color: TEXT.primary }}>{health?.retrieval?.withEmbeddings || 0}</div>
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>With Embeddings</div>
                </div>
                <div className="rounded px-2.5 py-2 text-center" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-lg font-bold font-mono" style={{ color: "#6b8f71" }}>Hybrid</div>
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>Method</div>
                </div>
              </div>
              <div className="rounded px-3 py-2.5" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3.5 h-3.5" style={{ color: "#4a90b8" }} />
                  <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>Knowledge Sources</span>
                </div>
                <div className="space-y-1.5">
                  {["Workflow Records", "Audit Records", "Approval Policies", "Connector Metadata", "Account Metadata", "Prior Incidents", "Internal Playbooks"].map(src => (
                    <div key={src} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full" style={{ background: "#4a90b8" }} />
                      <span className="text-[9px]" style={{ color: TEXT.secondary }}>{src}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === "audit" && (
        <Panel accent="#d4a054">
          <PanelHead icon={FileText} title="AI Decision Audit Trail" accent="#d4a054" right={
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{auditData?.total || 0} records</span>
          } />
          <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
            {auditData?.entries?.length ? auditData.entries.map((entry, i) => (
              <div key={i} className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono font-semibold" style={{ color: "#d4a054" }}>{String(entry.endpoint)}</span>
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{String(entry.model)}</span>
                  {entry.latencyMs && <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{String(entry.latencyMs)}ms</span>}
                  <span className="text-[7px] font-mono ml-auto" style={{ color: TEXT.muted }}>{String(entry.timestamp)}</span>
                </div>
                {entry.confidence != null && <ConfidenceBand value={entry.confidence as number} size="md" />}
              </div>
            )) : (
              <div className="px-3 py-4 text-center">
                <span className="text-[10px]" style={{ color: TEXT.tertiary }}>No audit entries yet. Use the triage or planning engines to generate records.</span>
              </div>
            )}
          </div>
        </Panel>
      )}

      {tab === "decisions" && (
        <div className="space-y-3">
          {health?.degraded && <DegradedModeBanner message={health.degradedReason} />}

          <div className="grid grid-cols-12 gap-3">
            <div className={`${selectedDecision ? "col-span-12 lg:col-span-5" : "col-span-12"} space-y-3`}>
              <Panel accent="#8b7ac8">
                <PanelHead
                  icon={GitBranch}
                  title="Decision Fabric"
                  accent="#8b7ac8"
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{decisionsData?.total ?? 0} total</span>
                      <button onClick={() => refetchDecisions()} className="px-1.5 py-0.5 rounded text-[8px] font-mono hover:bg-white/[0.04]" style={{ border: `1px solid ${BORDER.subtle}`, color: TEXT.tertiary }}>
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  }
                />
                {!decisionsData?.decisions?.length ? (
                  <div className="p-6 text-center">
                    <GitBranch className="w-6 h-6 mx-auto mb-2 opacity-20" style={{ color: TEXT.tertiary }} />
                    <p className="text-[10px]" style={{ color: TEXT.tertiary }}>No decisions yet. Submit inputs through the overview engine to generate decision objects.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
                    {decisionsData.decisions.map((d: any) => (
                      <button
                        key={d.decisionId}
                        onClick={() => setSelectedDecision(selectedDecision?.decisionId === d.decisionId ? null : d)}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                        style={{ background: selectedDecision?.decisionId === d.decisionId ? BG.elevated : "transparent" }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
                                color: priorityColors[d.riskLevel] || TEXT.muted,
                                background: `${priorityColors[d.riskLevel] || TEXT.muted}15`,
                                border: `1px solid ${priorityColors[d.riskLevel] || TEXT.muted}30`,
                              }}>{d.riskLevel}</span>
                              <ApprovalBadge level={d.riskLevel === "P0" ? "executive" : d.riskLevel === "P1" ? "manager" : "auto"} required={d.approvalRequired} />
                              <span className="text-[8px] font-mono ml-auto" style={{ color: TEXT.muted }}>
                                {d.status === "approved" ? "✓ approved" : d.status === "rejected" ? "✗ rejected" : d.status === "pending_approval" ? "⏳ pending" : d.status}
                              </span>
                            </div>
                            <p className="text-[10px] truncate" style={{ color: TEXT.primary }}>{d.recommendedAction}</p>
                            <p className="text-[8px] truncate mt-0.5" style={{ color: TEXT.secondary }}>{d.rationaleSummary}</p>
                          </div>
                          <ConfidenceBand value={d.confidence} size="sm" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel accent="#4a90b8">
                <PanelHead icon={Shield} title="Approval Matrix" accent="#4a90b8" />
                <div className="p-3 grid grid-cols-5 gap-1.5">
                  {Object.entries({ P0: { role: "Executive", sla: "15m", color: "#c45a4a" }, P1: { role: "Manager", sla: "1h", color: "#c8953c" }, P2: { role: "Auto", sla: "—", color: "#d4a054" }, P3: { role: "Auto", sla: "—", color: "#4a90b8" }, P4: { role: "Auto", sla: "—", color: "#7c85a0" } }).map(([level, info]) => (
                    <div key={level} className="rounded p-2 text-center" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div className="text-[10px] font-bold font-mono mb-1" style={{ color: info.color }}>{level}</div>
                      <div className="text-[7px] uppercase tracking-wide mb-0.5" style={{ color: TEXT.tertiary }}>{info.role}</div>
                      <div className="text-[8px] font-mono" style={{ color: TEXT.muted }}>SLA: {info.sla}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {selectedDecision && (
              <div className="col-span-12 lg:col-span-7 space-y-3">
                <Panel accent="#8b7ac8">
                  <PanelHead
                    icon={Eye}
                    title="Decision Detail"
                    accent="#8b7ac8"
                    right={
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAuditDrawerOpen(true)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono hover:bg-white/[0.04]" style={{ border: `1px solid ${BORDER.subtle}`, color: TEXT.tertiary }}>
                          <FileText className="w-3 h-3" />
                          Audit
                        </button>
                        <button onClick={() => setSelectedDecision(null)} className="p-0.5 rounded hover:bg-white/[0.04]" style={{ color: TEXT.tertiary }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    }
                  />
                  <div className="p-3 space-y-3">
                    <div className="rounded px-3 py-2.5" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Crosshair className="w-3 h-3" style={{ color: "#8b7ac8" }} />
                        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>Why This Action</span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: TEXT.primary }}>{selectedDecision.recommendedAction}</p>
                      <p className="text-[9px] mt-1.5 leading-relaxed" style={{ color: TEXT.secondary }}>{selectedDecision.rationaleSummary}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <div className="text-[7px] uppercase tracking-widest mb-1" style={{ color: TEXT.muted }}>Confidence</div>
                        <ConfidenceBand value={selectedDecision.confidence} size="md" />
                      </div>
                      <div className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <div className="text-[7px] uppercase tracking-widest mb-1" style={{ color: TEXT.muted }}>Risk Level</div>
                        <span className="text-[11px] font-bold font-mono" style={{ color: priorityColors[selectedDecision.riskLevel] || TEXT.primary }}>{selectedDecision.riskLevel}</span>
                      </div>
                      <div className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <div className="text-[7px] uppercase tracking-widest mb-1" style={{ color: TEXT.muted }}>Model Route</div>
                        <span className="text-[9px] font-mono" style={{ color: "#4a90b8" }}>{selectedDecision.modelRoute || "—"}</span>
                      </div>
                    </div>

                    {selectedDecision.approvalRequired && (
                      <div className="rounded px-3 py-2.5 flex items-center gap-3" style={{ background: "rgba(200,149,60,0.04)", border: "1px solid rgba(200,149,60,0.15)" }}>
                        <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#c8953c" }} />
                        <div>
                          <div className="text-[9px] font-semibold" style={{ color: "#c8953c" }}>Approval Required</div>
                          <div className="text-[8px] mt-0.5" style={{ color: TEXT.secondary }}>
                            {selectedDecision.riskLevel === "P0" ? "Executive sign-off required within 15 minutes" : "Manager approval required within 1 hour"}
                          </div>
                        </div>
                        <ApprovalBadge level={selectedDecision.riskLevel === "P0" ? "executive" : "manager"} required />
                      </div>
                    )}

                    {selectedDecision.fallbackPlan && (
                      <div className="rounded px-3 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3 h-3" style={{ color: "#c8953c" }} />
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>Fallback Plan</span>
                        </div>
                        <p className="text-[9px]" style={{ color: TEXT.secondary }}>{selectedDecision.fallbackPlan}</p>
                      </div>
                    )}

                    {selectedDecision.evidenceRefs?.length > 0 && (
                      <EvidencePanel evidence={selectedDecision.evidenceRefs} collapsible />
                    )}

                    <div className="rounded px-3 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3 h-3" style={{ color: TEXT.muted }} />
                        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>Model Metadata</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          ["Decision ID", selectedDecision.decisionId?.slice(0, 16) + "…"],
                          ["Schema Version", selectedDecision.schemaVersion || "v2.0.0"],
                          ["Model Route", selectedDecision.modelRoute || "—"],
                          ["Owner Suggestion", selectedDecision.ownerSuggestion || "—"],
                          ["Created At", selectedDecision.createdAt ? new Date(selectedDecision.createdAt).toLocaleString() : "—"],
                          ["Status", selectedDecision.status || "—"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[7px] uppercase tracking-widest" style={{ color: TEXT.muted }}>{label}</span>
                            <span className="text-[8px] font-mono truncate" style={{ color: TEXT.tertiary }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>
            )}
          </div>
        </div>
      )}

      {auditDrawerOpen && selectedDecision && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: BG.surface, borderLeft: `1px solid ${BORDER.muted}` }}>
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{ background: BG.surface, borderBottom: `1px solid ${BORDER.subtle}` }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: "#d4a054" }} />
                <span className="text-[12px] font-semibold" style={{ color: TEXT.primary }}>Audit Drawer</span>
              </div>
              <button onClick={() => setAuditDrawerOpen(false)} className="p-1 rounded hover:bg-white/[0.04]" style={{ color: TEXT.tertiary }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Decision Object</div>
                <div className="rounded px-3 py-2.5 overflow-x-auto" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <pre className="text-[8px] font-mono whitespace-pre-wrap" style={{ color: TEXT.secondary }}>
                    {JSON.stringify(selectedDecision, null, 2)}
                  </pre>
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Evidence Chain</div>
                {selectedDecision.evidenceRefs?.length > 0 ? (
                  <EvidencePanel evidence={selectedDecision.evidenceRefs} />
                ) : (
                  <p className="text-[9px]" style={{ color: TEXT.tertiary }}>No evidence references attached to this decision.</p>
                )}
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Immutability</div>
                <div className="rounded px-3 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3 h-3" style={{ color: "#6b8f71" }} />
                    <span className="text-[9px] font-semibold" style={{ color: "#6b8f71" }}>Audit Trail Immutable</span>
                  </div>
                  <p className="text-[8px]" style={{ color: TEXT.secondary }}>
                    Decision objects are append-only. Once created, core fields (decisionId, rationaleSummary, evidenceRefs, confidence, createdAt) cannot be modified. Status transitions are the only allowed mutations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
