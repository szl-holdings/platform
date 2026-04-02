import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AlloyAIHealth, AlloyAIModels, AlloyAIAuditResult } from "@/lib/api";
import {
  Brain, Cpu, Shield, Activity, Search, FileText,
  CheckCircle, AlertTriangle, Clock, Zap, Eye,
  ChevronRight, RefreshCw, Crosshair, UserCheck,
  Database, BarChart3, Lock,
} from "lucide-react";
import {
  ConfidenceBand,
  EvidencePanel,
  ApprovalBadge,
  HumanReviewBadge,
  PriorityBadge,
  ActionTypeBadge,
  EnvironmentLabel,
} from "@workspace/shared-ui";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

type TabView = "overview" | "models" | "tools" | "retrieval" | "audit";

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
    </div>
  );
}
