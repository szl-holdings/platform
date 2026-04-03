import * as React from "react";
import { cn } from "../utils";
import { colors, effects } from "../tokens";

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  legend?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  empty?: boolean;
  accentColor?: string;
  minHeight?: string;
  className?: string;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  controls,
  footer,
  legend,
  loading = false,
  emptyMessage = "No data to display",
  empty = false,
  accentColor,
  minHeight = "200px",
  className,
  children,
}: ChartContainerProps) {
  return (
    <div
      className={cn("flex flex-col rounded-xl border", className)}
      style={{
        background: effects.surface.card.background,
        border: effects.surface.card.border,
      }}
    >
      {(title || subtitle || controls) && (
        <div
          className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b"
          style={{ borderColor: colors.border.subtle }}
        >
          <div className="min-w-0">
            {title && (
              <p
                className="text-[14px] font-semibold tracking-tight truncate"
                style={{ color: colors.text.primary, letterSpacing: "-0.005em" }}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-[12px] mt-0.5 truncate" style={{ color: colors.text.muted }}>
                {subtitle}
              </p>
            )}
          </div>
          {controls && (
            <div className="flex items-center gap-1.5 shrink-0">{controls}</div>
          )}
        </div>
      )}

      <div className="flex-1 relative px-5 py-4" style={{ minHeight }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{
                  borderColor: colors.border.subtle,
                  borderTopColor: accentColor ?? colors.semantic.info,
                }}
              />
              <p className="text-[11px]" style={{ color: colors.text.subtle }}>
                Loading data…
              </p>
            </div>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>

      {legend && (
        <div
          className="px-5 pb-3 pt-0 border-t flex items-center gap-3 flex-wrap"
          style={{ borderColor: colors.border.subtle }}
        >
          {legend}
        </div>
      )}

      {footer && (
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: colors.border.subtle }}
        >
          <div className="text-[11px]" style={{ color: colors.text.subtle }}>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
