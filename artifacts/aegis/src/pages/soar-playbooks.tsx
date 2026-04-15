import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Pause, CheckCircle, XCircle, Clock, Zap, Shield, AlertTriangle, Users, Globe, Lock, Mail, Server, ChevronRight, ChevronDown, Activity, BarChart3, Plus, Edit, Copy } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { api } from "@/lib/api";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const PLAYBOOK_TEMPLATES = [
  {
    id: "PB-001",
    name: "Phishing Response",
    category: "Email Security",
    severity: "high",
    icon: Mail,
    color: "#f97316",
    description: "Automated response to confirmed phishing attempts — sandbox analysis, user notification, and domain blocking",
    lastRun: "2h ago",
    executions: 47,
    successRate: 94,
    avgMttr: "4m 23s",
    steps: [
      { id: 1, name: "Quarantine Email", type: "action", status: "completed", auto: true },
      { id: 2, name: "Sandbox Analysis", type: "enrich", status: "completed", auto: true },
      { id: 3, name: "Check IOC Reputation", type: "enrich", status: "completed", auto: true },
      { id: 4, name: "Severity >= High?", type: "condition", status: "completed", auto: true },
      { id: 5, name: "Block Domain/URL", type: "action", status: "completed", auto: true },
      { id: 6, name: "Notify Affected Users", type: "action", status: "completed", auto: true },
      { id: 7, name: "Create Ticket", type: "action", status: "completed", auto: true },
      { id: 8, name: "Analyst Review", type: "review", status: "pending", auto: false },
    ],
  },
  {
    id: "PB-002",
    name: "Malware Containment",
    category: "Endpoint",
    severity: "critical",
    icon: Shield,
    color: "#ef4444",
    description: "Immediate endpoint isolation, memory acquisition, and lateral movement prevention upon malware detection",
    lastRun: "47m ago",
    executions: 23,
    successRate: 100,
    avgMttr: "2m 11s",
    steps: [
      { id: 1, name: "Isolate Endpoint", type: "action", status: "completed", auto: true },
      { id: 2, name: "Memory Dump", type: "forensic", status: "completed", auto: true },
      { id: 3, name: "Hash IOCs", type: "enrich", status: "completed", auto: true },
      { id: 4, name: "VirusTotal Lookup", type: "enrich", status: "completed", auto: true },
      { id: 5, name: "Block Hash on EDR", type: "action", status: "completed", auto: true },
      { id: 6, name: "Scan Adjacent Hosts", type: "action", status: "running", auto: true },
      { id: 7, name: "Escalate to Manager", type: "escalate", status: "pending", auto: false },
    ],
  },
  {
    id: "PB-003",
    name: "Account Compromise",
    category: "Identity",
    severity: "critical",
    icon: Users,
    color: "#8b5cf6",
    description: "Credential compromise response — account lockout, session invalidation, MFA enforcement, and forensic trail",
    lastRun: "3h ago",
    executions: 18,
    successRate: 89,
    avgMttr: "6m 44s",
    steps: [
      { id: 1, name: "Disable Account", type: "action", status: "completed", auto: true },
      { id: 2, name: "Invalidate Sessions", type: "action", status: "completed", auto: true },
      { id: 3, name: "Geo-Check Last Logins", type: "enrich", status: "completed", auto: true },
      { id: 4, name: "Impossible Travel?", type: "condition", status: "completed", auto: true },
      { id: 5, name: "Alert CISO", type: "notify", status: "completed", auto: true },
      { id: 6, name: "Reset Credentials", type: "action", status: "pending", auto: false },
      { id: 7, name: "Re-enable with MFA", type: "action", status: "pending", auto: false },
    ],
  },
  {
    id: "PB-004",
    name: "Ransomware Response",
    category: "Incident Response",
    severity: "critical",
    icon: Lock,
    color: "#ef4444",
    description: "Full ransomware incident response — network segmentation, backup verification, IR team assembly, and executive notification",
    lastRun: "Never",
    executions: 2,
    successRate: 100,
    avgMttr: "18m 02s",
    steps: [
      { id: 1, name: "Segment Network", type: "action", status: "pending", auto: true },
      { id: 2, name: "Stop Backup Jobs", type: "action", status: "pending", auto: true },
      { id: 3, name: "Identify Patient Zero", type: "forensic", status: "pending", auto: true },
      { id: 4, name: "Verify Backup Integrity", type: "action", status: "pending", auto: false },
      { id: 5, name: "Assemble IR Team", type: "escalate", status: "pending", auto: false },
      { id: 6, name: "Notify Executive Team", type: "notify", status: "pending", auto: false },
      { id: 7, name: "Law Enforcement Notification", type: "notify", status: "pending", auto: false },
      { id: 8, name: "Begin Restoration", type: "action", status: "pending", auto: false },
    ],
  },
  {
    id: "PB-005",
    name: "DDoS Mitigation",
    category: "Network",
    severity: "high",
    icon: Globe,
    color: "#06b6d4",
    description: "Automated DDoS detection, upstream scrubbing activation, rate limiting, and CDN failover coordination",
    lastRun: "1d ago",
    executions: 8,
    successRate: 87,
    avgMttr: "3m 15s",
    steps: [
      { id: 1, name: "Detect Attack Pattern", type: "enrich", status: "pending", auto: true },
      { id: 2, name: "Rate Limit Sources", type: "action", status: "pending", auto: true },
      { id: 3, name: "Enable Scrubbing", type: "action", status: "pending", auto: true },
      { id: 4, name: "CDN Failover?", type: "condition", status: "pending", auto: true },
      { id: 5, name: "Notify NOC Team", type: "notify", status: "pending", auto: true },
      { id: 6, name: "Block Source IPs", type: "action", status: "pending", auto: true },
    ],
  },
  {
    id: "PB-006",
    name: "Data Exfiltration Response",
    category: "Data Loss Prevention",
    severity: "critical",
    icon: Server,
    color: "#f97316",
    description: "Detect, block, and investigate unauthorized data transfers — DLP enforcement, forensic preservation, and regulatory notification",
    lastRun: "5d ago",
    executions: 5,
    successRate: 80,
    avgMttr: "12m 38s",
    steps: [
      { id: 1, name: "Block Outbound Session", type: "action", status: "pending", auto: true },
      { id: 2, name: "Capture Packet Trace", type: "forensic", status: "pending", auto: true },
      { id: 3, name: "Identify Data Type", type: "enrich", status: "pending", auto: true },
      { id: 4, name: "PII Involved?", type: "condition", status: "pending", auto: true },
      { id: 5, name: "Legal Hold", type: "action", status: "pending", auto: false },
      { id: 6, name: "GDPR/NIS2 Notification", type: "notify", status: "pending", auto: false },
      { id: 7, name: "Executive Briefing", type: "escalate", status: "pending", auto: false },
    ],
  },
];

const EXECUTION_HISTORY = [
  { id: "EX-1042", playbook: "Malware Containment", trigger: "EDR Alert XDR-002", started: "47m ago", duration: "2m 08s", status: "success", analyst: "Auto", actionsRun: 6 },
  { id: "EX-1041", playbook: "Phishing Response", trigger: "Email Gateway Alert", started: "2h ago", duration: "4m 31s", status: "success", analyst: "J. Chen", actionsRun: 8 },
  { id: "EX-1040", playbook: "Account Compromise", trigger: "ID-001 Impossible Travel", started: "3h ago", duration: "6m 52s", status: "partial", analyst: "Auto", actionsRun: 5 },
  { id: "EX-1039", playbook: "DDoS Mitigation", trigger: "Network Anomaly SEN-0416", started: "1d ago", duration: "3m 12s", status: "success", analyst: "Auto", actionsRun: 6 },
  { id: "EX-1038", playbook: "Phishing Response", trigger: "Email Gateway Alert", started: "1d ago", duration: "5m 03s", status: "success", analyst: "S. Park", actionsRun: 8 },
  { id: "EX-1037", playbook: "Account Compromise", trigger: "ID-003 Priv Escalation", started: "2d ago", duration: "8m 14s", status: "failed", analyst: "M. Rodriguez", actionsRun: 4 },
];

const ANALYTICS = {
  totalExecutions: 103,
  automationRate: 78,
  avgMttr: "5m 12s",
  falsePositiveRate: 4.2,
  successRate: 91,
  playbooksActive: 6,
};

const stepColors: Record<string, string> = {
  action: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  enrich: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  condition: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  forensic: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  escalate: "bg-red-500/10 text-red-400 border-red-500/20",
  notify: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  review: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const stepStatusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  running: <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />,
  pending: <Clock className="w-3.5 h-3.5 text-white/30" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

const execStatusColors: Record<string, string> = {
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  partial: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function SOARPlaybooks() {
  const [selectedPlaybook, setSelectedPlaybook] = useState(PLAYBOOK_TEMPLATES[0]);
  const [activeTab, setActiveTab] = useState<"playbooks" | "history" | "analytics">("playbooks");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const { data: playbookData } = useQuery({
    queryKey: ["soar-playbooks"],
    queryFn: () => api.soar.playbooks(),
    staleTime: 60_000,
    retry: false,
  });

  const executeMutation = useMutation({
    mutationFn: (playbookId: string) => api.soar.execute(playbookId),
    onSuccess: (data) => {
      toast.success(`Playbook execution queued — ID: ${data?.data?.executionId ?? "N/A"}`);
    },
    onError: () => {
      toast.error("Playbook execution failed — authentication required");
    },
  });

  const analyticsFromApi = playbookData?.data?.stats;
  const displayAnalytics = {
    totalExecutions: analyticsFromApi?.totalExecutions ?? ANALYTICS.totalExecutions,
    automationRate: analyticsFromApi?.automationRate ?? ANALYTICS.automationRate,
    avgMttr: analyticsFromApi?.avgMttr ?? ANALYTICS.avgMttr,
    successRate: analyticsFromApi?.successRate ?? ANALYTICS.successRate,
    falsePositiveRate: analyticsFromApi?.falsePositiveRate ?? ANALYTICS.falsePositiveRate,
    playbooksActive: analyticsFromApi?.activePlaybooks ?? ANALYTICS.playbooksActive,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            SOAR Playbook Automation
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Automated incident response workflows — CrowdStrike Falcon Fusion & Palo Alto XSOAR inspired</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Playbook
          </button>
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Executions", value: displayAnalytics.totalExecutions.toString(), color: "#3b82f6", sub: "last 30d" },
          { label: "Automation Rate", value: `${displayAnalytics.automationRate}%`, color: "#10b981", sub: "of actions auto" },
          { label: "Avg MTTR", value: displayAnalytics.avgMttr, color: "#f59e0b", sub: "mean time respond" },
          { label: "Success Rate", value: `${displayAnalytics.successRate}%`, color: "#10b981", sub: "executions" },
          { label: "False Positive", value: `${displayAnalytics.falsePositiveRate}%`, color: "#6b7280", sub: "rate" },
          { label: "Active Playbooks", value: displayAnalytics.playbooksActive.toString(), color: "#8b5cf6", sub: "running" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <div className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">{stat.label}</div>
            <div className="text-[9px] text-white/20 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/6">
        {(["playbooks", "history", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab ? "border-amber-400 text-amber-300" : "border-transparent text-white/40 hover:text-white/70"
            )}
          >
            {tab === "analytics" ? "Analytics" : tab === "history" ? "Execution History" : "Playbook Library"}
          </button>
        ))}
      </div>

      {activeTab === "playbooks" && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* Playbook List */}
          <div className="space-y-2">
            {PLAYBOOK_TEMPLATES.map((pb) => {
              const Icon = pb.icon;
              return (
                <div
                  key={pb.id}
                  onClick={() => setSelectedPlaybook(pb)}
                  className={cn("rounded-xl border p-3.5 cursor-pointer transition-all", selectedPlaybook.id === pb.id ? "border-amber-500/30 bg-amber-500/5" : "border-white/6 bg-white/[0.015] hover:border-white/10")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${pb.color}12`, border: `1px solid ${pb.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: pb.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{pb.name}</span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase", pb.severity === "critical" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400")}>{pb.severity}</span>
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">{pb.category} · {pb.executions} runs · {pb.successRate}% success</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playbook Detail */}
          <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <selectedPlaybook.icon className="w-5 h-5" style={{ color: selectedPlaybook.color }} />
                  <h2 className="text-sm font-bold text-white">{selectedPlaybook.name}</h2>
                  <span className="text-[9px] font-mono text-white/30">{selectedPlaybook.id}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed max-w-[500px]">{selectedPlaybook.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"><Edit className="w-3 h-3" /> Edit</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"><Copy className="w-3 h-3" /> Clone</button>
                <button
                  onClick={() => executeMutation.mutate(selectedPlaybook.id)}
                  disabled={executeMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" /> {executeMutation.isPending ? "Running..." : "Run Now"}
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Executions", value: selectedPlaybook.executions.toString() },
                { label: "Success Rate", value: `${selectedPlaybook.successRate}%` },
                { label: "Avg MTTR", value: selectedPlaybook.avgMttr },
                { label: "Last Run", value: selectedPlaybook.lastRun },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <div className="text-sm font-bold text-white">{m.value}</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Workflow Steps */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">Workflow Steps</div>
              <div className="space-y-1.5">
                {selectedPlaybook.steps.map((step, i) => (
                  <div key={step.id}>
                    <div
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.03] transition-colors"
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    >
                      <div className="flex items-center gap-2 w-5 shrink-0">
                        <span className="text-[9px] font-mono text-white/20 w-3">{step.id}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide", stepColors[step.type])}>{step.type}</span>
                        <span className="text-xs text-white/70">{step.name}</span>
                        {step.auto && <span className="text-[9px] text-white/20 ml-auto">AUTO</span>}
                      </div>
                      {stepStatusIcons[step.status]}
                      {i < selectedPlaybook.steps.length - 1 && (
                        <ChevronDown className="w-3 h-3 text-white/20 shrink-0" />
                      )}
                    </div>
                    {expandedStep === step.id && (
                      <div className="ml-10 mt-1 p-2.5 rounded-lg bg-white/[0.015] border border-white/5 text-[10px] text-white/40 space-y-1">
                        <div>Type: <span className="text-white/60">{step.type}</span></div>
                        <div>Execution: <span className="text-white/60">{step.auto ? "Fully automated" : "Requires analyst approval"}</span></div>
                        <div>Status: <span className={cn(step.status === "completed" ? "text-emerald-400" : step.status === "running" ? "text-blue-400" : "text-white/30")}>{step.status}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Conditional Logic */}
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/60 mb-1.5">Conditional Logic</div>
              <div className="text-[11px] text-white/50 font-mono">
                IF severity &gt;= <span className="text-amber-300">HIGH</span> AND confidence &gt;= <span className="text-amber-300">80%</span><br />
                &nbsp;&nbsp;→ <span className="text-emerald-400">AUTO-CONTAIN</span> (no analyst approval required)<br />
                ELSE<br />
                &nbsp;&nbsp;→ <span className="text-amber-400">QUEUE FOR ANALYST REVIEW</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-white/6 overflow-hidden">
            <div className="grid grid-cols-[80px_160px_1fr_100px_80px_80px_80px] gap-0 px-4 py-2 border-b border-white/6 text-[9px] uppercase tracking-widest text-white/25 font-semibold">
              <span>Exec ID</span>
              <span>Playbook</span>
              <span>Trigger</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Actions</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-white/3">
              {EXECUTION_HISTORY.map((ex) => (
                <div key={ex.id} className="grid grid-cols-[80px_160px_1fr_100px_80px_80px_80px] gap-0 px-4 py-3 hover:bg-white/[0.015] transition-colors items-center">
                  <span className="text-[10px] font-mono text-white/40">{ex.id}</span>
                  <span className="text-[11px] font-medium text-white/70">{ex.playbook}</span>
                  <span className="text-[10px] text-white/40 truncate pr-4">{ex.trigger}</span>
                  <span className="text-[10px] text-white/30">{ex.started}</span>
                  <span className="text-[10px] font-mono text-white/50">{ex.duration}</span>
                  <span className="text-[10px] text-white/40">{ex.actionsRun} steps</span>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase w-fit", execStatusColors[ex.status])}>{ex.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5">
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Playbook Performance</div>
            <div className="space-y-4">
              {PLAYBOOK_TEMPLATES.map((pb) => (
                <div key={pb.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <pb.icon className="w-3.5 h-3.5" style={{ color: pb.color }} />
                      <span className="text-[11px] text-white/70">{pb.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-white/50">{pb.successRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pb.successRate}%`, background: `linear-gradient(90deg, ${pb.color}80, ${pb.color})` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-white/25">
                    <span>{pb.executions} executions</span>
                    <span>MTTR: {pb.avgMttr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-white/[0.015] p-5">
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Response Time Breakdown</div>
            <div className="space-y-3">
              {[
                { phase: "Detection → Triage", time: "45s", pct: 15, color: "#3b82f6" },
                { phase: "Triage → Containment", time: "1m 12s", pct: 25, color: "#f97316" },
                { phase: "Containment → Investigation", time: "2m 30s", pct: 50, color: "#8b5cf6" },
                { phase: "Investigation → Closure", time: "1m 05s", pct: 22, color: "#10b981" },
              ].map((r) => (
                <div key={r.phase}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/60">{r.phase}</span>
                    <span className="text-[11px] font-mono text-white/50">{r.time}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/6 grid grid-cols-2 gap-3">
              {[
                { label: "Automation Rate", value: "78%", desc: "Actions executed without analyst", color: "#10b981" },
                { label: "False Positives", value: "4.2%", desc: "Playbooks triggered incorrectly", color: "#6b7280" },
                { label: "Escalation Rate", value: "22%", desc: "Needed analyst intervention", color: "#f97316" },
                { label: "SLA Compliance", value: "96%", desc: "Responses within SLA window", color: "#3b82f6" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
                  <div className="text-base font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] font-semibold text-white/50 mt-0.5">{stat.label}</div>
                  <div className="text-[9px] text-white/25 mt-0.5">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
