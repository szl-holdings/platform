import { type ReactNode, useState } from 'react';
import { type DensityMode, color, densityConfig, motion, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export type InsightConfidenceLevel = 'high' | 'medium' | 'low';
export type InsightBannerVariant = 'info' | 'warning' | 'critical' | 'success' | 'neutral';

export interface InsightBannerProps {
  title: string;
  summary: string;
  confidence?: InsightConfidenceLevel;
  confidenceScore?: number;
  variant?: InsightBannerVariant;
  evidenceLabel?: string;
  evidenceCount?: number;
  onViewEvidence?: () => void;
  generatedAt?: string | Date;
  modelId?: string;
  accentColor?: string;
  onDismiss?: () => void;
  onAct?: () => void;
  actLabel?: string;
  icon?: ReactNode;
  density?: DensityMode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  InsightBannerVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  info: {
    bg: semanticColors.info.bg,
    border: semanticColors.info.border,
    text: semanticColors.info.text,
    icon: 'ℹ',
  },
  warning: {
    bg: semanticColors.warning.bg,
    border: semanticColors.warning.border,
    text: semanticColors.warning.text,
    icon: '⚠',
  },
  critical: {
    bg: semanticColors.error.bg,
    border: semanticColors.error.border,
    text: semanticColors.error.text,
    icon: '!',
  },
  success: {
    bg: semanticColors.success.bg,
    border: semanticColors.success.border,
    text: semanticColors.success.text,
    icon: '✓',
  },
  neutral: {
    bg: semanticColors.neutral.bg,
    border: semanticColors.neutral.border,
    text: semanticColors.neutral.text,
    icon: '◆',
  },
};

const CONFIDENCE_CONFIG: Record<InsightConfidenceLevel, { color: string; label: string; bars: number }> = {
  high:   { color: color.confidence.high,   label: 'High confidence',   bars: 3 },
  medium: { color: color.confidence.medium, label: 'Medium confidence', bars: 2 },
  low:    { color: color.confidence.low,    label: 'Low confidence',    bars: 1 },
};

function FreshnessLabel({ timestamp }: { timestamp: string | Date }) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let label: string;
  let freshness: keyof typeof color.freshness;

  if (diffMins < 5) {
    label = 'Just now';
    freshness = 'fresh';
  } else if (diffMins < 60) {
    label = `${diffMins}m ago`;
    freshness = 'fresh';
  } else if (diffHours < 6) {
    label = `${diffHours}h ago`;
    freshness = 'aging';
  } else if (diffHours < 24) {
    label = `${diffHours}h ago`;
    freshness = 'aging';
  } else {
    label = `${diffDays}d ago`;
    freshness = 'stale';
  }

  return (
    <span
      style={{ color: color.freshness[freshness], fontSize: '10px' }}
      title={date.toISOString()}
      aria-label={`Generated ${label}`}
    >
      {label}
    </span>
  );
}

export function InsightBanner({
  title,
  summary,
  confidence,
  confidenceScore,
  variant = 'info',
  evidenceLabel,
  evidenceCount,
  onViewEvidence,
  generatedAt,
  modelId,
  accentColor,
  onDismiss,
  onAct,
  actLabel = 'Take Action',
  icon,
  density = 'comfortable',
  className,
}: InsightBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = VARIANT_CONFIG[variant];
  const dc = densityConfig[density];
  const confidenceCfg = confidence ? CONFIDENCE_CONFIG[confidence] : null;
  const textAccent = accentColor ?? cfg.text;
  const borderColor = accentColor ?? cfg.border;
  const pad = `${dc.sectionGap} ${dc.cardPadding}`;

  const activeBars =
    confidenceScore !== undefined
      ? Math.round(confidenceScore * 3)
      : confidenceCfg?.bars ?? 0;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn('rounded-lg flex flex-col', className)}
      style={{
        background: cfg.bg,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${textAccent}`,
        transition: `opacity ${motion.duration.fast} ${motion.easing.standard}`,
      }}
    >
      <div className="flex items-start gap-3" style={{ padding: pad }}>
        <div
          className="flex items-center justify-center rounded-full shrink-0 font-bold"
          style={{
            width: dc.iconSize,
            height: dc.iconSize,
            background: `${textAccent}1a`,
            color: textAccent,
            fontSize: density === 'dense' ? '10px' : '12px',
            marginTop: '1px',
          }}
          aria-hidden="true"
        >
          {icon ?? cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className="font-semibold"
              style={{ fontSize: dc.fontSize, color: color.text.primary, lineHeight: 1.3 }}
            >
              {title}
            </span>

            {onDismiss && (
              <button
                type="button"
                aria-label="Dismiss insight"
                onClick={() => { setDismissed(true); onDismiss(); }}
                className="shrink-0 flex items-center justify-center rounded border-none"
                style={{
                  width: '20px',
                  height: '20px',
                  color: color.text.muted,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1,
                  marginTop: '-2px',
                  transition: `color ${motion.duration.instant}`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = color.text.secondary; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = color.text.muted; }}
              >
                ×
              </button>
            )}
          </div>

          <p
            className="mt-1 leading-relaxed"
            style={{ fontSize: density === 'dense' ? '10px' : '11px', color: color.text.secondary }}
          >
            {summary}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {confidenceCfg && (
              <div className="flex items-center gap-1.5" aria-label={`${confidenceCfg.label}${confidenceScore !== undefined ? ` — ${Math.round(confidenceScore * 100)}%` : ''}`}>
                <div className="flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className="rounded-sm"
                      style={{
                        width: '8px',
                        height: '4px',
                        background: bar <= activeBars ? confidenceCfg.color : color.border.default,
                        transition: `background ${motion.duration.fast}`,
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '10px', color: confidenceCfg.color, fontWeight: 500 }}>
                  {confidenceCfg.label}
                  {confidenceScore !== undefined && ` · ${Math.round(confidenceScore * 100)}%`}
                </span>
              </div>
            )}

            {(evidenceCount !== undefined || evidenceLabel) && (
              <button
                type="button"
                onClick={onViewEvidence}
                disabled={!onViewEvidence}
                aria-label={`View evidence: ${evidenceLabel ?? `${evidenceCount} source${evidenceCount !== 1 ? 's' : ''}`}`}
                className="flex items-center gap-1 border-none"
                style={{
                  fontSize: '10px',
                  color: onViewEvidence ? color.text.link : color.text.muted,
                  background: 'transparent',
                  cursor: onViewEvidence ? 'pointer' : 'default',
                  padding: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 4h4M3 6h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {evidenceLabel ?? `${evidenceCount} source${evidenceCount !== 1 ? 's' : ''}`}
              </button>
            )}

            {generatedAt && <FreshnessLabel timestamp={generatedAt} />}

            {modelId && (
              <span
                className="font-mono"
                style={{ fontSize: '9px', color: color.text.muted }}
                aria-label={`Model: ${modelId}`}
              >
                {modelId}
              </span>
            )}
          </div>
        </div>
      </div>

      {onAct && (
        <div className="flex justify-end gap-2 px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onAct}
            className="rounded font-semibold border"
            style={{
              height: density === 'dense' ? '24px' : density === 'compact' ? '28px' : '32px',
              padding: '0 12px',
              fontSize: '11px',
              background: `${textAccent}1a`,
              color: textAccent,
              borderColor: `${textAccent}44`,
              cursor: 'pointer',
              transition: `background ${motion.duration.instant}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${textAccent}2e`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${textAccent}1a`; }}
          >
            {actLabel}
          </button>
        </div>
      )}
    </div>
  );
}
