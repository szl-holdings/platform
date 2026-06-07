import { BookOpen, ChevronRight } from 'lucide-react';
import { ConfidenceMeter } from '../proof/ConfidenceMeter.js';
import { FreshnessChip } from '../proof/FreshnessChip.js';
import { type PolicyState, PolicyStateChip } from '../proof/PolicyStateChip.js';
import { color, productAccent } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface RecommendationCardProps {
  recommendationId: string;
  title: string;
  summary: string;
  confidence: number;
  policyState?: PolicyState;
  domain?: string;
  generatedAt?: string | Date;
  evidenceCount?: number;
  modelId?: string;
  onInspect?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
  accentColor?: string;
  variant?: 'compact' | 'full';
}

const DOMAIN_COLORS: Record<string, string> = {
  lyte: productAccent.pulse,
  vessels: productAccent.command,
  terra: productAccent.terra,
  prism: productAccent.aegis,
  aegis: productAccent.aegis,
  carlota: productAccent.carlota,
};

export function RecommendationCard({
  recommendationId,
  title,
  summary,
  confidence,
  policyState,
  domain,
  generatedAt,
  evidenceCount,
  modelId,
  onInspect,
  onApprove,
  onReject,
  className,
  accentColor,
  variant = 'full',
}: RecommendationCardProps) {
  const domainColor = domain
    ? (DOMAIN_COLORS[domain.toLowerCase()] ?? color.accent.violet)
    : (accentColor ?? color.accent.violet);

  return (
    <div
      className={cn('group rounded-lg transition-all', onInspect && 'cursor-pointer', className)}
      style={{
        border: `1px solid ${color.border.subtle}`,
        background: color.bg.surface,
      }}
      onClick={() => onInspect?.(recommendationId)}
      role={onInspect ? 'button' : undefined}
      tabIndex={onInspect ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onInspect?.(recommendationId)}
      onMouseEnter={(e) => {
        if (onInspect) (e.currentTarget as HTMLElement).style.background = color.bg.overlay;
      }}
      onMouseLeave={(e) => {
        if (onInspect) (e.currentTarget as HTMLElement).style.background = color.bg.surface;
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ background: color.bg.overlay, border: `1px solid ${color.border.default}` }}
        >
          <BookOpen className="h-4 w-4" style={{ color: domainColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className="text-sm font-semibold leading-snug"
              style={{ color: color.text.primary }}
            >
              {title}
            </span>
            {domain && (
              <span
                className="shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  color: domainColor,
                  background: color.bg.overlay,
                  border: `1px solid ${color.border.default}`,
                }}
              >
                {domain}
              </span>
            )}
          </div>

          {variant === 'full' && (
            <p className="mt-1 text-xs leading-relaxed" style={{ color: color.text.secondary }}>
              {summary}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <ConfidenceMeter value={confidence} variant="compact" />
            {policyState && <PolicyStateChip state={policyState} />}
            {generatedAt && <FreshnessChip timestamp={generatedAt} />}
            {evidenceCount !== undefined && (
              <span className="text-xs" style={{ color: color.text.muted }}>
                {evidenceCount} evidence source{evidenceCount !== 1 ? 's' : ''}
              </span>
            )}
            {modelId && (
              <span
                className="text-xs font-mono truncate max-w-[120px]"
                style={{ color: color.text.muted }}
              >
                {modelId}
              </span>
            )}
          </div>
        </div>

        {onInspect && (
          <ChevronRight
            className="h-4 w-4 shrink-0 self-center"
            style={{ color: color.text.muted }}
          />
        )}
      </div>

      {(onApprove || onReject) && (
        <div
          className="flex gap-2 px-4 py-3"
          style={{ borderTop: `1px solid ${color.border.subtle}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {onApprove && (
            <button
              onClick={() => onApprove(recommendationId)}
              className="flex-1 rounded py-1.5 text-xs font-semibold transition-colors"
              style={{
                border: `1px solid ${color.border.default}`,
                color: color.accent.green,
                background: color.bg.overlay,
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(recommendationId)}
              className="flex-1 rounded py-1.5 text-xs font-semibold transition-colors"
              style={{
                border: `1px solid ${color.border.default}`,
                color: color.accent.red,
                background: color.bg.overlay,
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
