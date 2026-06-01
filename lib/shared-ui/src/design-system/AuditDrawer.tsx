import * as React from 'react';
import { colors, effects, zIndex } from '../tokens';
import { cn, toAlpha } from '../utils';

export interface AuditEntry {
  id?: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  action: string;
  detail?: string;
  meta?: Record<string, string | number>;
}

export interface AuditDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  entries: AuditEntry[];
  loading?: boolean;
  accentColor?: string;
  className?: string;
}

export function AuditDrawer({
  open,
  onClose,
  title = 'Audit Trail',
  subtitle,
  entries,
  loading = false,
  accentColor,
  className,
}: AuditDrawerProps) {
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
        className={cn('fixed top-0 right-0 bottom-0 w-full max-w-[26rem] flex flex-col', className)}
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
            aria-label="Close audit trail"
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

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full animate-pulse shrink-0 mt-0.5"
                    style={{ background: colors.surface.glass }}
                  />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div
                      className="h-3 rounded animate-pulse w-3/4"
                      style={{ background: colors.surface.glass }}
                    />
                    <div
                      className="h-2.5 rounded animate-pulse w-1/2"
                      style={{ background: colors.surface.glass }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                No audit entries found
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute left-2.5 top-2 bottom-2 w-px"
                style={{ background: colors.border.subtle }}
              />
              <div className="space-y-4">
                {entries.map((entry, i) => (
                  <div key={entry.id ?? i} className="relative flex gap-3">
                    <div
                      className="w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 z-10"
                      style={{
                        background: accentColor ? toAlpha(accentColor, 0.08) : colors.surface.glass,
                        borderColor: accentColor
                          ? toAlpha(accentColor, 0.22)
                          : colors.border.DEFAULT,
                      }}
                    >
                      <span
                        className="text-[8px] font-bold"
                        style={{ color: accentColor ?? colors.text.muted }}
                      >
                        {entry.actor.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-medium leading-snug"
                        style={{ color: colors.text.primary }}
                      >
                        {entry.action}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span
                          className="text-[11px]"
                          style={{ color: accentColor ?? colors.semantic.stable }}
                        >
                          {entry.actor}
                        </span>
                        {entry.actorRole && (
                          <span className="text-[10px]" style={{ color: colors.text.subtle }}>
                            · {entry.actorRole}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: colors.text.subtle }}>
                          {entry.timestamp}
                        </span>
                      </div>
                      {entry.detail && (
                        <p
                          className="text-[12px] mt-1 leading-relaxed"
                          style={{ color: colors.text.muted }}
                        >
                          {entry.detail}
                        </p>
                      )}
                      {entry.meta && Object.keys(entry.meta).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {Object.entries(entry.meta).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: colors.surface.glass, color: colors.text.muted }}
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
