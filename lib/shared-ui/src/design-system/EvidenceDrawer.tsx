import * as React from 'react';
import { colors, effects, zIndex } from '../tokens';
import { cn, toAlpha } from '../utils';

export interface EvidenceSource {
  id?: string;
  title: string;
  sourceType?: string;
  url?: string;
  excerpt?: string;
  timestamp?: string;
  confidence?: number;
  provenance?: string;
}

export interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  sources: EvidenceSource[];
  loading?: boolean;
  accentColor?: string;
  className?: string;
}

export function EvidenceDrawer({
  open,
  onClose,
  title = 'Evidence & Sources',
  subtitle,
  sources,
  loading = false,
  accentColor,
  className,
}: EvidenceDrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ background: colors.background.overlay, zIndex: zIndex.overlay }}
      />
      <aside
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className={cn('fixed top-0 right-0 bottom-0 w-full max-w-[28rem] flex flex-col', className)}
        style={{
          background: effects.surface.overlay.background,
          border: `1px solid ${colors.border.strong}`,
          boxShadow: effects.shadow['2xl'],
          zIndex: zIndex.modal,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
        >
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: colors.text.primary, letterSpacing: '-0.005em' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence drawer"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]"
            style={{ color: colors.text.muted }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {sources.length > 0 && !loading && (
          <div
            className="px-5 py-2 shrink-0"
            style={{
              borderBottom: `1px solid ${colors.border.subtle}`,
              background: colors.surface.glass,
            }}
          >
            <p className="text-[11px]" style={{ color: colors.text.subtle }}>
              {sources.length} source{sources.length !== 1 ? 's' : ''} referenced
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 space-y-2 animate-pulse"
                  style={{
                    background: colors.surface.glass,
                    border: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <div
                    className="h-3.5 rounded w-3/4"
                    style={{ background: colors.surface.baseHover }}
                  />
                  <div
                    className="h-2.5 rounded w-1/3"
                    style={{ background: colors.surface.glass }}
                  />
                  <div className="space-y-1.5">
                    <div
                      className="h-2.5 rounded w-full"
                      style={{ background: colors.surface.glass }}
                    />
                    <div
                      className="h-2.5 rounded w-4/5"
                      style={{ background: colors.surface.glass }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                No evidence sources linked
              </p>
            </div>
          ) : (
            sources.map((source, i) => (
              <div
                key={source.id ?? i}
                className="rounded-xl p-4 space-y-2 border"
                style={{
                  background: colors.surface.glass,
                  borderColor: colors.border.DEFAULT,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium leading-snug hover:underline"
                        style={{ color: accentColor ?? colors.text.link }}
                      >
                        {source.title}
                      </a>
                    ) : (
                      <p
                        className="text-[13px] font-medium leading-snug"
                        style={{ color: colors.text.primary }}
                      >
                        {source.title}
                      </p>
                    )}
                  </div>
                  {source.confidence !== undefined && (
                    <span
                      className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: colors.semantic.successMuted,
                        color: colors.semantic.success,
                        border: `1px solid ${colors.semantic.successBorder}`,
                      }}
                    >
                      {source.confidence}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {source.sourceType && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                      style={{
                        background: accentColor ? toAlpha(accentColor, 0.08) : colors.surface.glass,
                        color: accentColor ?? colors.text.muted,
                      }}
                    >
                      {source.sourceType}
                    </span>
                  )}
                  {source.provenance && (
                    <span className="text-[11px]" style={{ color: colors.text.subtle }}>
                      {source.provenance}
                    </span>
                  )}
                  {source.timestamp && (
                    <span className="text-[10px]" style={{ color: colors.text.subtle }}>
                      {source.timestamp}
                    </span>
                  )}
                </div>

                {source.excerpt && (
                  <blockquote
                    className="text-[12px] leading-relaxed pl-2.5 border-l-2"
                    style={{
                      color: colors.text.muted,
                      borderColor: accentColor ? toAlpha(accentColor, 0.35) : colors.border.DEFAULT,
                    }}
                  >
                    {source.excerpt}
                  </blockquote>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
