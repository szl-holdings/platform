import { m } from 'framer-motion';
import { Brain, CheckCircle2, Fingerprint } from 'lucide-react';
import type { EngineState } from '@/hooks/useDecisionEngine';
import type { LiveRecommendation } from '@/hooks/useLiveTheaterData';
import { AnimatedConfidenceBadge, SeverityBadge } from '../helpers';

export function RecommendationStage({ engine }: { engine: EngineState }) {
  const rec = engine.recommendation;
  if (!rec) return <p className="text-sm text-muted-foreground">Generating recommendation...</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The AI Agent Gateway generates a governed recommendation with full source attribution and
        confidence scoring.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] text-muted-foreground">Confidence:</span>
            <AnimatedConfidenceBadge value={rec.confidence} color="#ec4899" />
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {rec.modelId} · {rec.modelProvider}
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Recommended Actions
          </h4>
          <div className="space-y-1.5">
            {rec.actions.map((action, i) => (
              <m.div
                key={i}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.07 }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-foreground">{action}</span>
              </m.div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Source Attribution
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {rec.inputSources.map((src) => (
              <div
                key={src.id}
                className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
              >
                <p className="text-[10px] font-semibold text-foreground">{src.label}</p>
                <p className="text-[9px] text-muted-foreground font-mono">
                  {src.type}:{src.id}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
          <Fingerprint className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Correlation ID:</span>{' '}
            <span className="font-mono text-[10px]">{rec.correlationId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function LiveRecommendationStage({
  recommendations,
}: {
  recommendations: LiveRecommendation[];
}) {
  if (recommendations.length === 0) {
    return <p className="text-sm text-muted-foreground">No active recommendations in platform.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{recommendations.length}</span> active
        AI-generated recommendations pulled from the live Alloy recommendation engine.
      </p>
      <div className="space-y-3">
        {recommendations.slice(0, 5).map((rec, i) => (
          <m.div
            key={rec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
            className="rounded-xl border border-border/40 bg-card/60 p-4"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground leading-tight">
                  {rec.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {rec.domain} · {rec.entity_type} · {rec.timeframe}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <SeverityBadge severity={rec.severity} />
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-pink-400" />
                  <AnimatedConfidenceBadge value={rec.confidence} color="#ec4899" />
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Score</span>
                <span className="text-[10px] font-mono text-foreground">
                  {(rec.score * 100).toFixed(0)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <m.div
                  className="h-full rounded-full bg-pink-400/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${rec.score * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.07 + 0.15, ease: 'easeOut' }}
                />
              </div>
            </div>
            {rec.recommended_action && (
              <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                {rec.recommended_action}
              </p>
            )}
          </m.div>
        ))}
      </div>
    </div>
  );
}
