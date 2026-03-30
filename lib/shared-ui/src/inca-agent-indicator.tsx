import { useState } from "react";
import { Brain, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "./utils";

export interface IncaAgentConfig {
  agentName: string;
  systemType: "inti" | "mama-quilla";
  status?: "active" | "monitoring" | "standby" | "processing";
  currentTask?: string;
  confidence?: number;
  actionsToday?: number;
}

interface IncaAgentIndicatorProps extends IncaAgentConfig {
  className?: string;
}

const STATUS_CONFIG = {
  active: { label: "Active", dotClass: "bg-emerald-400 animate-pulse", textClass: "text-emerald-400" },
  monitoring: { label: "Monitoring", dotClass: "bg-amber-400", textClass: "text-amber-400" },
  standby: { label: "Standby", dotClass: "bg-slate-500", textClass: "text-slate-400" },
  processing: { label: "Processing", dotClass: "bg-blue-400 animate-pulse", textClass: "text-blue-400" },
};

export function IncaAgentIndicator({
  agentName,
  systemType,
  status = "active",
  currentTask,
  confidence,
  actionsToday,
  className,
}: IncaAgentIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const statusCfg = STATUS_CONFIG[status];
  const isInti = systemType === "inti";

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 select-none", className)}>
      <div className={cn(
        "rounded-xl border bg-card/95 backdrop-blur-md shadow-xl transition-all",
        "border-amber-400/20",
        expanded ? "w-72" : "w-auto"
      )}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2.5 px-3 py-2 w-full hover:bg-amber-400/5 transition-colors rounded-xl"
        >
          <div className="relative w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card", statusCfg.dotClass)} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-bold text-amber-400 truncate leading-none mb-0.5">
              INCA · {agentName}
            </p>
            <p className="text-[9px] text-muted-foreground/60 font-mono truncate">{statusCfg.label}</p>
          </div>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-mono shrink-0",
            isInti ? "bg-yellow-400/10 text-yellow-400" : "bg-indigo-400/10 text-indigo-400"
          )}>
            {isInti ? "☀ Inti" : "◑ Mama Q"}
          </span>
          {expanded
            ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
            : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-3 pb-3 border-t border-amber-400/10 mt-0 pt-2 space-y-2">
            <div className="flex items-center justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                className="text-muted-foreground/30 hover:text-muted-foreground transition-colors p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {currentTask && (
              <div className="bg-muted/10 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground/50 mb-1 font-mono uppercase tracking-wider">Current Task</p>
                <p className="text-[11px] text-foreground leading-relaxed">{currentTask}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {confidence !== undefined && (
                <div className="bg-muted/10 rounded-lg p-2">
                  <p className="text-[9px] text-muted-foreground/50 mb-1 font-mono">CONFIDENCE</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400/70 rounded-full"
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">{Math.round(confidence * 100)}%</span>
                  </div>
                </div>
              )}
              {actionsToday !== undefined && (
                <div className="bg-muted/10 rounded-lg p-2">
                  <p className="text-[9px] text-muted-foreground/50 mb-1 font-mono">ACTIONS TODAY</p>
                  <p className="text-sm font-bold text-foreground">{actionsToday.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40 font-mono">
              <span className="w-1 h-1 rounded-full bg-amber-400/40 inline-block" />
              Quipu Engine · SZL Holdings · INCA Cortex
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
