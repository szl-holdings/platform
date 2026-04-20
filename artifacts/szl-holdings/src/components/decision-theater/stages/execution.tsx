import { CheckCircle2 } from 'lucide-react';
import type { EngineState } from '@/hooks/useDecisionEngine';

export function ExecutionStage({ engine }: { engine: EngineState }) {
  const steps = engine.executionSteps;
  const workflowId = `WF-${new Date().toISOString().slice(0, 10).replace(/-/g, '-')}-00847`;
  if (steps.length === 0)
    return <p className="text-sm text-muted-foreground">Awaiting execution steps...</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The Workflow Engine executes the approved response plan. Every step is instrumented with
        timing, executor attribution, and completion status.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-foreground">Execution Log</h3>
          <span className="text-[10px] font-mono text-muted-foreground">{workflowId}</span>
        </div>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {i < steps.length - 1 && (
                <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border/30" />
              )}
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 z-10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-[12px] font-semibold text-foreground">{step.action}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">{step.executor}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{step.duration}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {step.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
