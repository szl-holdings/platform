import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import { CheckCircle2, Clock, User } from 'lucide-react';
import type { EngineState } from '@/hooks/useDecisionEngine';
import { cn } from '@/lib/utils';

export function PolicyStage({ engine }: { engine: EngineState }) {
  const decision = engine.policyDecision;
  const simulation = engine.policySimulation;

  if (!decision) return <p className="text-sm text-muted-foreground">Evaluating policy...</p>;

  const checks = [
    {
      rule: `Subject roles: [${decision.subject.roles.join(', ')}]`,
      result: decision.allowed ? 'pass' : 'fail',
      detail: `Evaluated against ${decision.matchedPolicies.length} matched policy(ies)`,
    },
    {
      rule: `Action: ${decision.action} on ${decision.resource.type}`,
      result: decision.allowed ? 'pass' : 'fail',
      detail: `Domain: ${decision.resource.domain ?? 'global'}`,
    },
    {
      rule: `Policy verdict: ${decision.effect.toUpperCase()}`,
      result: decision.allowed ? 'pass' : 'fail',
      detail: decision.reason ?? 'No reason provided',
    },
    {
      rule: `Evaluation time: ${decision.durationMs}ms`,
      result: 'pass',
      detail: `Request ID: ${decision.requestId}`,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Covenant Policy Engine evaluates the proposed action against organizational rules, role
        requirements, and escalation thresholds.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Policy Evaluation
              <HelpTip
                tipId="szl.decision-theater.covenant-policy"
                platform="szl"
                title="Covenant Policy Engine"
                content="Evaluates the proposed action against organizational covenants — role requirements, escalation thresholds, segregation-of-duties rules — and returns ALLOW or DENY with the matching policy id and an evaluation trace."
                iconSize={12}
              />
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {decision.matchedPolicies[0] ?? 'default-deny'}
            </p>
          </div>
          <span
            className={cn(
              'text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border',
              decision.allowed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400',
            )}
          >
            {decision.effect.toUpperCase()}
          </span>
        </div>
        <div className="space-y-2 mb-4">
          {checks.map((check, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/20 bg-muted/5 px-3 py-2.5"
            >
              <CheckCircle2
                className={cn(
                  'w-4 h-4 flex-shrink-0 mt-0.5',
                  check.result === 'pass' ? 'text-emerald-400' : 'text-red-400',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground">{check.rule}</p>
                <p className="text-[11px] text-muted-foreground">{check.detail}</p>
              </div>
              <span
                className={cn(
                  'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0',
                  check.result === 'pass'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-red-400 bg-red-500/10',
                )}
              >
                {check.result}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-foreground font-semibold">
              {decision.subject.userId ?? 'System'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              Evaluated{' '}
              {new Date(decision.evaluatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
      {simulation && (
        <div className="rounded-xl border border-border/40 bg-card/60 p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Simulation Trace
          </h4>
          <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
            {simulation.explanation.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
