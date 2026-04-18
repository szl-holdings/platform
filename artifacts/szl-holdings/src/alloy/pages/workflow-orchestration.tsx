import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { GitBranch, User, Clock, ExternalLink, AlertTriangle, RefreshCw, Play, Pause, XCircle, CheckCircle, ChevronRight, Terminal, Zap, Activity, Filter, Radio } from "lucide-react";
import { useState, useMemo } from "react";
import { AlloyGraphQLPanel } from "../components/graphql-data-panel";

interface Workflow {
  id: number;
  orgId: number;
  name: string;
  description?: string | null;
  status: string;
  product: string;
  kind?: string | null;
  config?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function useWorkflows() {
  return useQuery({
    queryKey: ["alloyWorkflows"],
    queryFn: async () => {
      const resp = await apiFetch<Workflow[] | { data: Workflow[] }>("/alloy/workflows");
      if (resp && typeof resp === "object" && "data" in resp) return resp.data;
      return resp as Workflow[];
    },
    refetchInterval: 15000,
  });
}

function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Workflow>) => {
      return await apiFetch<Workflow>(`/alloy/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ["alloyWorkflows"] });
      const previous = qc.getQueriesData({ queryKey: ["alloyWorkflows"] });
      qc.setQueriesData({ queryKey: ["alloyWorkflows"] }, (old: Workflow[] | undefined) => {
        if (!old) return old;
        return old.map(w => w.id === id ? { ...w, ...data } : w);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyWorkflows"] }),
  });
}

function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workflowId: number) => {
      return await apiFetch<{ id: number }>("/alloy/runs", { method: "POST", body: JSON.stringify({ workflowId }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string; border: string; dotColor: string }> = {
  active: { color: "#10b981", label: "Active", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", dotColor: "#10b981" },
  paused: { color: "#f59e0b", label: "Paused", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dotColor: "#f59e0b" },
  draft: { color: "#6b7280", label: "Draft", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", dotColor: "#6b7280" },
  archived: { color: "#4b5563", label: "Archived", bg: "rgba(75,85,99,0.08)", border: "rgba(75,85,99,0.2)", dotColor: "#4b5563" },
  error: { color: "#ef4444", label: "Error", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", dotColor: "#ef4444" },
};

const KIND_LABELS: Record<string, string> = {
  contract: "Contract",
  approval: "Approval",
  onboarding: "Onboarding",
  compliance: "Compliance",
  finance: "Finance",
  automation: "Automation",
};

function generateDemoWorkflows(): Workflow[] {
  const now = new Date();
  const ago = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  return [
    { id: 1, orgId: 1, name: "Client Onboarding — Enterprise Tier", description: "End-to-end onboarding flow: KYC verification → legal review → account provisioning → welcome sequence.", status: "active", product: "alloy-core", kind: "onboarding", config: { steps: ["KYC Check", "Legal Review", "Account Setup", "Welcome Email", "Assign CSM"] }, metadata: { owner: "Sarah Chen", team: "Client Success", sla_deadline: "48h", value_at_risk: 2400000 }, createdAt: ago(720), updatedAt: ago(2) },
    { id: 2, orgId: 1, name: "Contract Renewal Pipeline", description: "Automated renewal tracking with escalation paths for at-risk accounts.", status: "active", product: "alloy-core", kind: "contract", config: { steps: ["90-Day Notice", "Usage Review", "Pricing Update", "Legal Approval", "Signature"] }, metadata: { owner: "Marcus Rivera", team: "Revenue Ops", sla_deadline: "72h", value_at_risk: 8500000 }, createdAt: ago(1440), updatedAt: ago(6) },
    { id: 3, orgId: 1, name: "SOC 2 Evidence Collection", description: "Continuous compliance evidence gathering across all control families.", status: "active", product: "alloy-compliance", kind: "compliance", config: { steps: ["Access Reviews", "Change Mgmt Logs", "Incident Reports", "Pen Test Results", "Policy Sign-offs"] }, metadata: { owner: "Diana Park", team: "InfoSec", sla_deadline: "Monthly", value_at_risk: 500000 }, createdAt: ago(2160), updatedAt: ago(12) },
    { id: 4, orgId: 1, name: "Invoice Approval Workflow", description: "Multi-tier approval chain for vendor invoices > $10K with automatic escalation.", status: "active", product: "alloy-finance", kind: "finance", config: { steps: ["Receipt Scan", "Budget Check", "Manager Approve", "Director Approve", "AP Process"] }, metadata: { owner: "James Okafor", team: "Finance", sla_deadline: "5 business days" }, createdAt: ago(960), updatedAt: ago(1) },
    { id: 5, orgId: 1, name: "Quarterly Board Report Assembly", description: "Automated data pull from 12 sources, formatting, and review cycle for board materials.", status: "paused", product: "alloy-core", kind: "automation", config: { steps: ["Data Pull", "KPI Calc", "Narrative Draft", "Exec Review", "Final Format"] }, metadata: { owner: "Lisa Thornton", team: "Strategy", sla_deadline: "Q2 2026" }, createdAt: ago(480), updatedAt: ago(48) },
    { id: 6, orgId: 1, name: "Vendor Risk Assessment", description: "Automated vendor security questionnaire distribution, scoring, and tracking.", status: "active", product: "alloy-compliance", kind: "compliance", config: { steps: ["Questionnaire Send", "Response Collection", "Risk Scoring", "Review Meeting", "Decision"] }, metadata: { owner: "Diana Park", team: "InfoSec", sla_deadline: "30 days", value_at_risk: 1200000 }, createdAt: ago(336), updatedAt: ago(4) },
    { id: 7, orgId: 1, name: "Employee Offboarding", description: "Coordinated deprovisioning across IT, HR, and facilities with compliance checks.", status: "active", product: "alloy-hr", kind: "onboarding", config: { steps: ["HR Notify", "IT Deprovision", "Badge Revoke", "Knowledge Transfer", "Exit Interview"] }, metadata: { owner: "Kenji Watanabe", team: "People Ops" }, createdAt: ago(2880), updatedAt: ago(18) },
    { id: 8, orgId: 1, name: "Data Pipeline Health Monitor", description: "Monitors ETL pipeline health and triggers alerts on schema drift or SLA breach.", status: "error", product: "alloy-data", kind: "automation", config: { steps: ["Schema Validate", "Row Count Check", "Latency Monitor", "Alert Dispatch"] }, metadata: { owner: "Raj Patel", team: "Data Engineering", value_at_risk: 350000 }, createdAt: ago(168), updatedAt: ago(0.5) },
    { id: 9, orgId: 1, name: "Marketing Campaign Approval", description: "Creative review, legal compliance check, and budget sign-off for campaign launches.", status: "draft", product: "alloy-marketing", kind: "approval", config: { steps: ["Creative Review", "Brand Check", "Legal Scan", "Budget Approve", "Schedule"] }, metadata: { owner: "Aisha Johnson", team: "Marketing" }, createdAt: ago(72), updatedAt: ago(72) },
    { id: 10, orgId: 1, name: "Incident Post-Mortem Pipeline", description: "Structured post-mortem process with auto-generated timelines and action item tracking.", status: "active", product: "alloy-ops", kind: "automation", config: { steps: ["Timeline Build", "Root Cause", "Action Items", "Review Meeting", "Publish"] }, metadata: { owner: "Tom Bradley", team: "SRE", sla_deadline: "5 business days" }, createdAt: ago(1080), updatedAt: ago(8) },
  ];
}

function WorkflowSteps({ workflow }: { workflow: Workflow }) {
  const config = workflow.config as Record<string, unknown> ?? {};
  const steps = (config.steps as string[]) ?? [];
  if (steps.length === 0) return null;
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {steps.slice(0, 5).map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ color: "rgba(75,139,219,0.5)", background: "rgba(75,139,219,0.05)", border: "1px solid rgba(75,139,219,0.1)" }}>
            {step}
          </span>
          {i < steps.slice(0, 5).length - 1 && <ChevronRight className="w-2 h-2" style={{ color: "rgba(255,255,255,0.15)" }} />}
        </div>
      ))}
      {steps.length > 5 && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>+{steps.length - 5} more</span>}
    </div>
  );
}

function WorkflowDrawer({ workflow, onClose, onUpdate, onRunNow }: { workflow: Workflow; onClose: () => void; onUpdate: (id: number, data: Partial<Workflow>) => void; onRunNow: (id: number) => void }) {
  const s = STATUS_CONFIG[workflow.status] ?? STATUS_CONFIG.active;
  const meta = workflow.metadata as Record<string, unknown> ?? {};
  const config = workflow.config as Record<string, unknown> ?? {};
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div className="w-full max-w-lg bg-[#0c1420] border-l border-white/10 flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-white/5 transition-colors">✕</button>
          </div>
          <h2 className="text-base font-bold text-white">{workflow.name}</h2>
          {workflow.description && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{workflow.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {workflow.kind && <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{workflow.kind}</span>}
            <span className="font-mono">ID: {workflow.id}</span>
            <span>Product: {workflow.product}</span>
          </div>
        </div>

        {!!(meta.owner || meta.team || meta.sla_deadline || meta.value_at_risk) && (
          <div className="p-5 border-b border-white/5 grid grid-cols-2 gap-3">
            {!!meta.owner && (
              <div className="bg-white/3 rounded-lg p-3 border border-white/5">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Owner</div>
                <div className="text-[11px] text-white flex items-center gap-1"><User className="w-3 h-3 text-blue-400/50" />{meta.owner as string}</div>
              </div>
            )}
            {!!meta.team && (
              <div className="bg-white/3 rounded-lg p-3 border border-white/5">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Team</div>
                <div className="text-[11px] text-white">{meta.team as string}</div>
              </div>
            )}
            {!!meta.sla_deadline && (
              <div className="bg-white/3 rounded-lg p-3 border border-white/5">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>SLA Deadline</div>
                <div className="text-[11px] text-white flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400/50" />{meta.sla_deadline as string}</div>
              </div>
            )}
            {(meta.value_at_risk as number) > 0 && (
              <div className="bg-white/3 rounded-lg p-3 border border-amber-500/10">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Value at Risk</div>
                <div className="text-[11px] font-bold text-amber-400">
                  ${(meta.value_at_risk as number) >= 1e6 ? `${((meta.value_at_risk as number) / 1e6).toFixed(1)}M` : `${((meta.value_at_risk as number) / 1000).toFixed(0)}K`}
                </div>
              </div>
            )}
          </div>
        )}

        {Object.keys(config).length > 0 && (
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-2" style={{ color: "rgba(75,139,219,0.7)" }}>
              <Terminal className="w-3 h-3" /> Configuration
            </div>
            <pre className="text-[10px] text-slate-400 overflow-auto bg-white/3 rounded-lg p-3 border border-white/5 max-h-48">{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}

        <div className="p-5 mt-auto">
          <div className="flex flex-wrap gap-2">
            {workflow.status !== "active" && (
              <button onClick={() => { onUpdate(workflow.id, { status: "active" }); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <Play className="w-3 h-3" /> Activate
              </button>
            )}
            {workflow.status === "active" && (
              <button onClick={() => { onUpdate(workflow.id, { status: "paused" }); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <Pause className="w-3 h-3" /> Pause
              </button>
            )}
            <button onClick={() => { onRunNow(workflow.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1" style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.08)", border: "1px solid rgba(75,139,219,0.2)" }}>
              <Zap className="w-3 h-3" /> Run Now
            </button>
            <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1 ml-auto" style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ExternalLink className="w-3 h-3" /> Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonWorkflow() {
  return (
    <div className="rounded-xl border p-5 animate-pulse" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-12 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-4 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div className="h-4 w-56 rounded mb-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-40 rounded" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
        <div className="h-8 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

export default function WorkflowOrchestration() {
  const { data: apiWorkflows, isLoading, isError, refetch } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const startRun = useStartRun();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const isDemo = isError || (!isLoading && (!apiWorkflows || apiWorkflows.length === 0));
  const demoWorkflows = useMemo(() => generateDemoWorkflows(), []);
  const workflows = isDemo ? demoWorkflows : (apiWorkflows ?? []);

  const filtered = workflows.filter(w => statusFilter === "all" || w.status === statusFilter);
  const active = workflows.filter(w => w.status === "active");
  const paused = workflows.filter(w => w.status === "paused");
  const error = workflows.filter(w => w.status === "error");
  const draft = workflows.filter(w => w.status === "draft");

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#4B8BDB" }}>Alloy · Workflow Orchestration</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workflow Orchestration</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Manage execution workflows — step owners, SLA tracking, and reroute capabilities.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium" style={{ background: "rgba(75,139,219,0.04)", border: "1px solid rgba(75,139,219,0.1)", color: "rgba(75,139,219,0.6)" }}>
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Environment — Showing illustrative workflows. Connect the Alloy API for live data.
          <DataStateBadge state="demo" className="ml-auto" />
        </div>
      )}

      {/* Status strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Active", value: active.length, color: "#10b981", pulse: active.length > 0 },
            { label: "Paused", value: paused.length, color: "#f59e0b" },
            { label: "Draft", value: draft.length, color: "#6b7280" },
            { label: "Error", value: error.length, color: "#ef4444", urgent: error.length > 0 },
            { label: "Total", value: workflows.length, color: "rgba(255,255,255,0.5)" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && c.value > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Filter className="w-3 h-3" /> Filter:
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "active", "paused", "draft", "error"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className="text-[10px] px-2.5 py-1 rounded-lg border capitalize transition-all"
              style={{ background: statusFilter === f ? "rgba(75,139,219,0.08)" : "rgba(255,255,255,0.02)", borderColor: statusFilter === f ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)", color: statusFilter === f ? "#4B8BDB" : "rgba(255,255,255,0.35)" }}>
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{filtered.length} workflows</span>
      </div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonWorkflow key={i} />)}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "rgba(75,139,219,0.05)", border: "1px solid rgba(75,139,219,0.12)" }}>
            <GitBranch className="w-5 h-5" style={{ color: "rgba(75,139,219,0.3)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>No workflows found</p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Create a workflow via the API or import from config</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(w => {
          const s = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.active;
          const isError = w.status === "error";
          const isPaused = w.status === "paused";
          const isActive = w.status === "active";
          const meta = w.metadata as Record<string, unknown> ?? {};
          const owner = (meta.owner as string) ?? undefined;
          const team = (meta.team as string) ?? undefined;
          const slaDeadline = (meta.sla_deadline as string) ?? undefined;
          const valueAtRisk = (meta.value_at_risk as number) ?? 0;
          const kindLabel = w.kind ? (KIND_LABELS[w.kind] ?? w.kind) : null;

          return (
            <div
              key={w.id}
              className="rounded-xl border cursor-pointer transition-all group"
              style={{
                borderColor: isError ? "rgba(239,68,68,0.2)" : isPaused ? "rgba(245,158,11,0.12)" : isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.06)",
                background: isError ? "rgba(239,68,68,0.02)" : "rgba(255,255,255,0.01)",
              }}
              onClick={() => setSelectedWorkflow(w)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />}
                        {s.label}
                      </span>
                      {kindLabel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ color: "rgba(75,139,219,0.5)", background: "rgba(75,139,219,0.05)", border: "1px solid rgba(75,139,219,0.1)" }}>{kindLabel}</span>
                      )}
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{w.product}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-0.5">{w.name}</div>
                    {w.description && <div className="text-[10px] mb-2 line-clamp-1" style={{ color: "rgba(255,255,255,0.35)" }}>{w.description}</div>}
                    <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {owner && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{owner}</span>}
                      {team && <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5" />{team}</span>}
                      {slaDeadline && <span className="flex items-center gap-1 text-amber-400/70"><Clock className="w-2.5 h-2.5" />SLA: {slaDeadline}</span>}
                    </div>
                    <WorkflowSteps workflow={w} />
                  </div>
                  <div className="text-right shrink-0">
                    {valueAtRisk > 0 && (
                      <div>
                        <div className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                          ${valueAtRisk >= 1_000_000 ? `${(valueAtRisk / 1_000_000).toFixed(1)}M` : `${(valueAtRisk / 1_000).toFixed(0)}K`}
                        </div>
                        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>value at risk</div>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 mt-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(75,139,219,0.4)" }} />
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 border-t flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
                {isActive && (
                  <button
                    onClick={() => updateWorkflow.mutate({ id: w.id, status: "paused" })}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#f59e0b", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
                  >
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}
                {!isActive && w.status !== "archived" && (
                  <button
                    onClick={() => updateWorkflow.mutate({ id: w.id, status: "active" })}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#10b981", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
                  >
                    <CheckCircle className="w-3 h-3" /> Activate
                  </button>
                )}
                <button
                  onClick={() => startRun.mutate(w.id)}
                  disabled={startRun.isPending}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.06)", border: "1px solid rgba(75,139,219,0.15)" }}
                >
                  <Play className="w-3 h-3" /> Run Now
                </button>
                <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Updated {new Date(w.updatedAt).toLocaleDateString()}
                </span>
                <XCircle className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" aria-label="Archive" style={{ color: "rgba(255,255,255,0.2)" }} onClick={() => updateWorkflow.mutate({ id: w.id, status: "archived" })} />
              </div>
            </div>
          );
        })}
      </div>

      {selectedWorkflow && (
        <WorkflowDrawer
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onUpdate={(id, data) => updateWorkflow.mutate({ id, ...data })}
          onRunNow={(id) => startRun.mutate(id)}
        />
      )}

      <AlloyGraphQLPanel />
    </div>
  );
}
