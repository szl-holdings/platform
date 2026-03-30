import { Workflow, Play, Pause, Clock, CheckCircle, AlertTriangle, Plus, ArrowRight, Zap, Settings, GitBranch } from "lucide-react";

interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "paused" | "error";
  lastRun: string;
  nextRun: string;
  runs24h: number;
  successRate: number;
  steps: number;
  category: string;
}

const workflows: WorkflowItem[] = [
  { id: "WF-001", name: "Deploy Pipeline", trigger: "Git Push", status: "active", lastRun: "5m ago", nextRun: "On trigger", runs24h: 12, successRate: 98, steps: 6, category: "Deployment" },
  { id: "WF-002", name: "Data Sync — All Apps", trigger: "Schedule (1h)", status: "active", lastRun: "22m ago", nextRun: "38m", runs24h: 24, successRate: 100, steps: 4, category: "Data" },
  { id: "WF-003", name: "Health Check Sweep", trigger: "Schedule (5m)", status: "active", lastRun: "2m ago", nextRun: "3m", runs24h: 288, successRate: 99.6, steps: 3, category: "Monitoring" },
  { id: "WF-004", name: "User Onboarding", trigger: "API Webhook", status: "active", lastRun: "1h ago", nextRun: "On trigger", runs24h: 3, successRate: 100, steps: 8, category: "Users" },
  { id: "WF-005", name: "Log Rotation & Archive", trigger: "Schedule (daily)", status: "paused", lastRun: "1d ago", nextRun: "Paused", runs24h: 0, successRate: 95, steps: 5, category: "Maintenance" },
  { id: "WF-006", name: "Compliance Report Gen", trigger: "Schedule (weekly)", status: "error", lastRun: "2d ago", nextRun: "Failed", runs24h: 0, successRate: 80, steps: 7, category: "Compliance" },
];

const changeLog = [
  { id: "CHG-041", type: "config", description: "Updated API rate limits for production", author: "System", timestamp: "14:23", status: "approved", impact: "low" },
  { id: "CHG-040", type: "deploy", description: "Deployed v2.4.1 to Firestorm", author: "CI/CD", timestamp: "13:45", status: "completed", impact: "medium" },
  { id: "CHG-039", type: "schema", description: "Database migration — added vessels metrics table", author: "System", timestamp: "12:30", status: "completed", impact: "high" },
  { id: "CHG-038", type: "config", description: "Feature flag 'dark-mode-v2' enabled", author: "Admin", timestamp: "11:15", status: "approved", impact: "low" },
  { id: "CHG-037", type: "security", description: "SSL certificate rotated for all services", author: "Automated", timestamp: "09:00", status: "completed", impact: "medium" },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  paused: { bg: "bg-amber-500/10", text: "text-amber-400" },
  error: { bg: "bg-red-500/10", text: "text-red-400" },
};

const impactColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-red-500/10 text-red-400",
};

export default function WorkflowAutomation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Workflow className="w-6 h-6 text-primary" /> Workflow Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Automated workflows, change management, and system orchestration</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Workflows", value: workflows.filter(w => w.status === "active").length, icon: Play, color: "text-emerald-400" },
          { label: "Runs (24h)", value: workflows.reduce((a, w) => a + w.runs24h, 0), icon: Zap, color: "text-blue-400" },
          { label: "Avg Success Rate", value: `${(workflows.reduce((a, w) => a + w.successRate, 0) / workflows.length).toFixed(1)}%`, icon: CheckCircle, color: "text-violet-400" },
          { label: "Changes Today", value: changeLog.length, icon: GitBranch, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" /> Workflow Registry
          </h2>
        </div>
        <div className="divide-y divide-border">
          {workflows.map((wf) => {
            const st = statusStyles[wf.status];
            return (
              <div key={wf.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{wf.id}</span>
                    <span className="text-sm font-semibold">{wf.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${st.bg} ${st.text}`}>{wf.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      {wf.status === "active" ? <Pause className="w-4 h-4 text-muted-foreground" /> : <Play className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-muted-foreground">
                  <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Trigger</span>{wf.trigger}</div>
                  <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Last Run</span>{wf.lastRun}</div>
                  <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Runs (24h)</span>{wf.runs24h}</div>
                  <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Success</span><span className={wf.successRate >= 95 ? "text-emerald-400" : "text-amber-400"}>{wf.successRate}%</span></div>
                  <div><span className="block text-[10px] uppercase tracking-wider mb-0.5">Steps</span>{wf.steps} steps</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" /> Change Management Log
          </h2>
        </div>
        <div className="divide-y divide-border">
          {changeLog.map((change) => (
            <div key={change.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{change.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase">{change.type}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${impactColors[change.impact]}`}>
                    {change.impact} impact
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{change.timestamp}</span>
              </div>
              <p className="text-sm">{change.description}</p>
              <span className="text-xs text-muted-foreground mt-1 block">By {change.author} · {change.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
