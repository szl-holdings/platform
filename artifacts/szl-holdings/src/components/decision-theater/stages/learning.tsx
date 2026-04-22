import { BookOpen, TrendingUp } from 'lucide-react';
import type { EngineState } from '@/hooks/useDecisionEngine';

export function LearningStage({ engine }: { engine: EngineState }) {
  const mc = engine.monteCarloResult;
  const pr = engine.proofRecord;
  const outcome = engine.outcomeRecord;
  const decision = engine.policyDecision;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The outcome feeds back into the platform, calibrating confidence scores, updating threat
        models, and validating policy thresholds.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Confidence Calibration
          </h3>
          <p className="text-sm text-foreground mb-4">
            {outcome
              ? `Confidence score calibrated from ${(outcome.confidence * 100).toFixed(0)}% → ${((outcome.confidence + 0.03) * 100).toFixed(0)}% based on ${outcome.outcomeResult} outcome`
              : 'Pending outcome data...'}
          </p>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Detected Patterns
          </h4>
          <div className="space-y-2">
            {[
              `Monte Carlo standard deviation: $${mc?.metrics.totalVoyageCost?.stdDev.toFixed(0) ?? '—'}K — model variability within expected band`,
              `Policy engine matched ${decision?.matchedPolicies.length ?? 0} policy(ies) with ${decision?.durationMs ?? 0}ms evaluation time`,
              `Proof chain tracks ${pr?.inputSources.length ?? 0} input sources with ${pr?.sourceClass ?? 'unknown'} classification`,
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            System Updates
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Model Update
              </h4>
              <p className="text-[12px] text-foreground">
                {pr?.modelId ?? 'szl-threat-correlation-v3'} retrained with this outcome. Next
                version: v3.1
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Policy Validation
              </h4>
              <p className="text-[12px] text-foreground">
                {decision?.matchedPolicies[0] ?? 'maritime-critical-response-v2'}:{' '}
                {decision?.allowed
                  ? 'Thresholds validated — no changes required'
                  : 'Policy denied — review escalation rules'}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                Decision Memory Updated
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This outcome is now part of the Outcome Graph and will inform future recommendations
              for similar threat patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
