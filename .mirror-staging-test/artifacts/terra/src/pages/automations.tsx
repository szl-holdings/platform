import { motion } from "framer-motion";
import { useState } from "react";
import { Zap, CheckCircle, XCircle, RotateCcw, Clock, Shield, AlertTriangle, Play, Pause, RefreshCw } from "lucide-react";
import { automations, automationRuns, type Automation, type AutomationRun } from "@/data/brokerage";
import { StatusIndicator } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";

const categoryColors: Record<Automation["category"], string> = {
  "stage-change": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  document: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  aging: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  stall: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  closing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  lead: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  compliance: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const priorityConfig = {
  low: "text-terra-text-muted",
  medium: "text-blue-400",
  high: "text-amber-400",
  critical: "text-rose-400",
};

function AutomationCard({ automation }: { automation: Automation }) {
  const [enabled, setEnabled] = useState(automation.enabled);
  return (
    <div className={cn(
      "rounded-xl border bg-terra-surface/50 overflow-hidden transition-all",
      !enabled ? "opacity-60" : "hover:border-terra-border-hover",
      automation.failedCount > 0 ? "border-rose-500/30" : "border-terra-border"
    )}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0", categoryColors[automation.category])}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-terra-text">{automation.name}</p>
              <button
                onClick={() => setEnabled(!enabled)}
                className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors flex-shrink-0",
                  enabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-terra-text-muted/10 text-terra-text-muted border-terra-border"
                )}
              >
                {enabled ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                {enabled ? "Active" : "Paused"}
              </button>
            </div>
            <p className="text-xs text-terra-text-secondary mt-0.5">{automation.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", categoryColors[automation.category])}>
            {automation.category.replace("-", " ")}
          </span>
          <span className={cn("text-[10px] font-semibold uppercase", priorityConfig[automation.priority])}>
            {automation.priority} priority
          </span>
          <span className="text-[10px] text-terra-text-muted font-mono">{automation.trigger}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center rounded-lg bg-terra-bg border border-terra-border p-2">
            <p className="text-[10px] text-terra-text-muted">Runs</p>
            <p className="text-lg font-display font-bold text-terra-text">{automation.runCount}</p>
          </div>
          <div className="text-center rounded-lg bg-terra-bg border border-terra-border p-2">
            <p className="text-[10px] text-terra-text-muted">Success</p>
            <p className={cn("text-lg font-display font-bold", automation.successRate >= 0.95 ? "text-emerald-400" : automation.successRate >= 0.85 ? "text-amber-400" : "text-rose-400")}>
              {Math.round(automation.successRate * 100)}%
            </p>
          </div>
          <div className="text-center rounded-lg bg-terra-bg border border-terra-border p-2">
            <p className="text-[10px] text-terra-text-muted">Failed</p>
            <p className={cn("text-lg font-display font-bold", automation.failedCount > 0 ? "text-rose-400" : "text-terra-text")}>{automation.failedCount}</p>
          </div>
        </div>

        {automation.pendingRetries > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
            <RotateCcw className="w-3.5 h-3.5" />
            {automation.pendingRetries} pending retrie{automation.pendingRetries > 1 ? "s" : ""}
          </div>
        )}

        <div className="border-t border-terra-border pt-3">
          <p className="text-[10px] text-terra-text-muted mb-1.5">Actions:</p>
          <div className="space-y-1">
            {automation.actions.map((action, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-terra-text-secondary">
                <span className="w-1 h-1 rounded-full bg-terra-primary flex-shrink-0" />
                {action}
              </div>
            ))}
          </div>
        </div>

        {automation.lastRun && (
          <p className="text-[10px] text-terra-text-muted mt-2">Last run: {new Date(automation.lastRun).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

function RunRow({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr onClick={() => setExpanded(!expanded)} className={cn("border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors cursor-pointer",
        run.status === "failed" && "bg-rose-500/3"
      )}>
        <td className="py-3 px-4">
          <StatusIndicator status={run.status === "success" ? "success" : run.status === "failed" ? "error" : "warning"} label={run.status} />
        </td>
        <td className="py-3 px-4 text-xs font-medium text-terra-text">{run.automationName}</td>
        <td className="py-3 px-4 text-xs text-terra-text-secondary">{run.affectedEntity}</td>
        <td className="py-3 px-4 text-xs text-terra-text-muted">{new Date(run.startedAt).toLocaleString()}</td>
        <td className="py-3 px-4">
          {run.retriesLeft !== undefined && run.retriesLeft > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              <RotateCcw className="w-3 h-3" />
              {run.retriesLeft} retries left
            </div>
          )}
        </td>
        <td className="py-3 px-4 text-xs text-terra-text-muted">{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 bg-terra-surface/30">
            <div className="space-y-3 pt-3">
              {run.errorMessage && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{run.errorMessage}</span>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider mb-2">Action Results</p>
                <div className="space-y-1.5">
                  {run.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {action.status === "success" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> :
                       action.status === "failed" ? <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" /> :
                       <Clock className="w-3.5 h-3.5 text-terra-text-muted flex-shrink-0" />}
                      <span className={cn(action.status === "failed" ? "text-rose-400" : action.status === "skipped" ? "text-terra-text-muted" : "text-terra-text")}>
                        {action.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {run.status === "failed" && run.retriesLeft && run.retriesLeft > 0 && (
                <button className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 hover:bg-amber-500/20 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Now ({run.retriesLeft} attempts remaining)
                </button>
              )}
              {run.auditNotes && (
                <p className="text-[10px] text-terra-text-muted italic">{run.auditNotes}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "history" | "failures">("catalog");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = automations.filter(a => categoryFilter === "all" || a.category === categoryFilter);
  const failed = automationRuns.filter(r => r.status === "failed");
  const pending = automationRuns.filter(r => r.status === "retrying");

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Zap className="w-6 h-6 text-terra-primary" />
          <h1 className="text-2xl font-display font-bold text-terra-text">Alloy Automation</h1>
        </div>
        <p className="text-sm text-terra-text-secondary">Workflow automation — task templates, alerts, retry queue, override panel, and full audit trail</p>
      </motion.div>

      {/* Status Banner */}
      {failed.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-400 font-semibold">{failed.length} automation failure{failed.length > 1 ? "s" : ""} require attention</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Automations", value: automations.filter(a => a.enabled).length, alert: false, warn: false },
          { label: "Total Runs (all time)", value: automations.reduce((s, a) => s + a.runCount, 0), alert: false, warn: false },
          { label: "Failed Runs", value: failed.length, alert: true, warn: false },
          { label: "Pending Retries", value: automations.reduce((s, a) => s + a.pendingRetries, 0), alert: false, warn: true },
        ].map(m => (
          <div key={m.label} className={cn("rounded-xl border p-4 bg-terra-surface/50",
            m.alert && m.value > 0 ? "border-rose-500/30" :
            m.warn && m.value > 0 ? "border-amber-500/30" : "border-terra-border"
          )}>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1",
              m.alert && m.value > 0 ? "text-rose-400" :
              m.warn && m.value > 0 ? "text-amber-400" : "text-terra-text"
            )}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-terra-border">
        {(["catalog", "history", "failures"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab ? "border-terra-primary text-terra-primary" : "border-transparent text-terra-text-muted hover:text-terra-text"
            )}>
            {tab}
            {tab === "failures" && failed.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded-full">{failed.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "catalog" && (
        <>
          <div className="flex gap-3 flex-wrap">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
              <option value="all">All Categories</option>
              {Object.keys(categoryColors).map(c => (
                <option key={c} value={c} className="capitalize">{c.replace("-", " ")}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(a => <AutomationCard key={a.id} automation={a} />)}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-terra-border">
                  {["Status", "Automation", "Entity", "Started", "Retries", "Duration"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {automationRuns.map(run => <RunRow key={run.id} run={run} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "failures" && (
        <div className="space-y-4">
          {failed.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-400">No failures in current window</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-terra-surface border border-terra-border">
                <Shield className="w-4 h-4 text-violet-400" />
                <p className="text-xs text-terra-text-secondary">Alloy retries failed automations automatically. Override or manually retry below. All overrides are logged to the audit trail.</p>
              </div>
              {failed.map(run => (
                <div key={run.id} className="rounded-xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-terra-text">{run.automationName}</p>
                        <p className="text-xs text-terra-text-muted">{run.affectedEntity} · {new Date(run.startedAt).toLocaleString()}</p>
                        {run.errorMessage && (
                          <p className="text-xs text-rose-400 mt-1.5">{run.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {run.retriesLeft !== undefined && run.retriesLeft > 0 && (
                          <button className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry ({run.retriesLeft} left)
                          </button>
                        )}
                        <button className="text-xs text-terra-text-muted bg-terra-surface border border-terra-border px-3 py-1.5 rounded-lg hover:text-terra-text transition-colors">
                          Override
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
