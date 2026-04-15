import { useState } from "react";
import { Clock, AlertTriangle, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@lyte/lib/utils";
import {
  workflowLatencies,
  severityColors,
  type WorkflowLatency,
} from "@lyte/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function StageBar({ name, actual, expected, stagnant, owner }: { name: string; actual: number; expected: number; stagnant: number; owner: string }) {
  const ratio = actual / Math.max(expected, 0.1);
  const pct = Math.min((actual / (expected * 6)) * 100, 100);
  const color = ratio > 4 ? "bg-[#c45a4a]" : ratio > 2.5 ? "bg-[#c8953c]" : ratio > 1.5 ? "bg-[#d4a054]" : "bg-[#6b8f71]";
  const textColor = ratio > 4 ? "text-[#c45a4a]" : ratio > 2.5 ? "text-[#c8953c]" : ratio > 1.5 ? "text-[#d4a054]" : "text-[#6b8f71]";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-medium">{name}</span>
        <div className="flex items-center gap-3">
          {stagnant > 0 && (
            <span className="text-[#c45a4a] font-mono">{stagnant} stagnant</span>
          )}
          <span className={cn("font-mono font-semibold", textColor)}>{actual.toFixed(1)}d</span>
          <span className="text-slate-600">/ {expected.toFixed(1)}d target</span>
        </div>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 border-r border-white/20" style={{ left: `${Math.min((expected / (expected * 6)) * 100, 100)}%` }} />
      </div>
      <div className="text-[10px] text-slate-600">Owner: {owner}</div>
    </div>
  );
}

function WorkflowCard({ workflow, expanded, onToggle }: { workflow: WorkflowLatency; expanded: boolean; onToggle: () => void }) {
  const c = severityColors[workflow.severity];
  const latencyRatio = workflow.totalDwellDays / workflow.expectedDays;
  const excessDays = workflow.totalDwellDays - workflow.expectedDays;

  return (
    <div className={cn("rounded-xl border transition-all", c.border, workflow.severity === "critical" ? "bg-[#c45a4a]/[0.03]" : "bg-white/[0.02]")}>
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", c.dot, workflow.severity === "critical" && "animate-pulse")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-display font-semibold text-white">{workflow.name}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("font-mono font-bold text-sm", c.text)}>{workflow.totalDwellDays}d</span>
                <span className="text-slate-600 text-[11px]">avg dwell</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] mb-3">
              <span className="text-slate-500">{workflow.function}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">Target: {workflow.expectedDays}d</span>
              <span className="text-slate-700">·</span>
              <span className={cn("font-semibold", c.text)}>{latencyRatio.toFixed(1)}x over</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-400">{formatCurrency(workflow.valueAtRisk)} at risk</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full", c.dot.replace("bg-", "bg-"))}
                style={{ width: `${Math.min((workflow.totalDwellDays / (workflow.expectedDays * 5)) * 100, 100)}%`, opacity: 0.8 }}
              />
              <div
                className="absolute inset-y-0 border-r border-white/30"
                style={{ left: `${Math.min((workflow.expectedDays / (workflow.expectedDays * 5)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1 text-slate-600">
              <span>0d</span>
              <span className="text-white/40">Target: {workflow.expectedDays}d</span>
              <span>{workflow.totalDwellDays}d actual</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-5 border-t border-white/5 pt-4 space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-3">Stage Breakdown</div>
            <div className="space-y-4">
              {workflow.stages.map((stage, i) => (
                <StageBar
                  key={i}
                  name={stage.name}
                  actual={stage.avgDwellDays}
                  expected={stage.expectedDays}
                  stagnant={stage.stagnatCount}
                  owner={stage.owner}
                />
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#d4a054]/20 bg-[#d4a054]/5">
            <div className="text-[10px] font-mono text-[#d4a054] uppercase tracking-wide mb-1.5">Slowdown Analysis</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This workflow is running <strong className="text-white">{excessDays.toFixed(1)} days</strong> beyond target.
              The biggest bottleneck is <strong className="text-white">{workflow.stages.reduce((max, s) => (s.avgDwellDays - s.expectedDays) > (max.avgDwellDays - max.expectedDays) ? s : max, workflow.stages[0]).name}</strong> with
              {" "}<strong className="text-white">{(workflow.stages.reduce((max, s) => (s.avgDwellDays - s.expectedDays) > (max.avgDwellDays - max.expectedDays) ? s : max, workflow.stages[0]).avgDwellDays - workflow.stages.reduce((max, s) => (s.avgDwellDays - s.expectedDays) > (max.avgDwellDays - max.expectedDays) ? s : max, workflow.stages[0]).expectedDays).toFixed(1)} days excess dwell</strong>.
              Total stagnant items: <strong className="text-white">{workflow.stages.reduce((sum, s) => sum + s.stagnatCount, 0)}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowLatencyPage() {
  const [expandedId, setExpandedId] = useState<string | null>("WF-001");
  const totalStagnant = workflowLatencies.reduce((sum, wf) => sum + wf.stages.reduce((s2, st) => s2 + st.stagnatCount, 0), 0);
  const totalVaR = workflowLatencies.reduce((sum, wf) => sum + wf.valueAtRisk, 0);
  const avgLatencyRatio = workflowLatencies.reduce((sum, wf) => sum + wf.totalDwellDays / wf.expectedDays, 0) / workflowLatencies.length;

  return (
    <div className="max-w-[960px] space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Workflow Latency</h1>
        <p className="text-sm text-slate-400 mt-1">Approval delay, stage dwell time, task aging, and queue congestion</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Workflows Monitored", value: workflowLatencies.length, color: "text-white" },
          { label: "Total Stagnant Items", value: totalStagnant, color: "text-[#c45a4a]" },
          { label: "Avg Latency Ratio", value: `${avgLatencyRatio.toFixed(1)}x`, color: "text-[#c8953c]" },
          { label: "Total Value at Risk", value: formatCurrency(totalVaR), color: "text-[#d4a054]" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn("font-display font-bold text-xl", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {workflowLatencies.map(wf => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            expanded={expandedId === wf.id}
            onToggle={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
          />
        ))}
      </div>
    </div>
  );
}
