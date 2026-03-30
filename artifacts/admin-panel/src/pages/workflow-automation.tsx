import { useState } from "react";
import { Activity, Play, Pause, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const MOCK_WORKFLOWS = [
  { id: "wf-001", name: "Daily Data Sync", status: "active", schedule: "0 2 * * *", lastRun: "2h ago", nextRun: "22h", runs: 142, failures: 2 },
  { id: "wf-002", name: "Email Digest", status: "active", schedule: "0 9 * * 1-5", lastRun: "8h ago", nextRun: "16h", runs: 89, failures: 0 },
  { id: "wf-003", name: "Seed Data Refresh", status: "paused", schedule: "0 0 * * 0", lastRun: "3d ago", nextRun: "—", runs: 15, failures: 1 },
  { id: "wf-004", name: "Health Check Reporter", status: "active", schedule: "*/15 * * * *", lastRun: "14m ago", nextRun: "1m", runs: 2840, failures: 12 },
];

export default function WorkflowAutomation() {
  const [workflows] = useState(MOCK_WORKFLOWS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflow Automation</h1>
        <p className="text-sm text-muted-foreground mt-1">Scheduled jobs and automated workflow management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Workflows", value: workflows.filter(w => w.status === "active").length, color: "emerald" },
          { label: "Total Runs", value: workflows.reduce((s, w) => s + w.runs, 0).toLocaleString(), color: null },
          { label: "Total Failures", value: workflows.reduce((s, w) => s + w.failures, 0), color: "red" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color === "emerald" ? "text-emerald-400" : s.color === "red" ? "text-red-400" : ""}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {workflows.map(wf => (
          <div key={wf.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{wf.name}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{wf.schedule}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Last: {wf.lastRun}</div>
              <div className="flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" />Next: {wf.nextRun}</div>
            </div>
            <div className="text-xs text-right">
              <div>{wf.runs.toLocaleString()} runs</div>
              <div className={wf.failures > 0 ? "text-red-400" : "text-emerald-400"}>{wf.failures} failures</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              wf.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
            }`}>
              {wf.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
