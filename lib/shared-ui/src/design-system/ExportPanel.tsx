import * as React from "react";
import { cn } from "../utils";
import { toAlpha } from "../utils";
import { colors, effects, zIndex } from "../tokens";

export interface ExportFormat {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  onExport: (formatId: string) => void;
  title?: string;
  subtitle?: string;
  formats?: ExportFormat[];
  exporting?: boolean;
  exportingId?: string;
  accentColor?: string;
  className?: string;
}

const DEFAULT_FORMATS: ExportFormat[] = [
  { id: "csv", label: "CSV", description: "Spreadsheet-compatible flat file" },
  { id: "json", label: "JSON", description: "Structured data for integration" },
  { id: "pdf", label: "PDF", description: "Formatted report for distribution" },
  { id: "xlsx", label: "Excel (.xlsx)", description: "Full-featured spreadsheet" },
];

export function ExportPanel({
  open,
  onClose,
  onExport,
  title = "Export Data",
  subtitle,
  formats = DEFAULT_FORMATS,
  exporting = false,
  exportingId,
  accentColor,
  className,
}: ExportPanelProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      <div
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border flex flex-col",
          className
        )}
        style={{
          background: effects.surface.overlay.background,
          border: `1px solid ${colors.border.strong}`,
          boxShadow: effects.shadow["2xl"],
          zIndex: zIndex.modal,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
        >
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: colors.text.primary, letterSpacing: "-0.005em" }}
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
            aria-label="Close export panel"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]"
            style={{ color: colors.text.muted }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          {formats.map((fmt) => {
            const isExportingThis = exporting && exportingId === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => !exporting && onExport(fmt.id)}
                disabled={exporting}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]",
                  exporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.04] hover:border-white/10"
                )}
                style={{
                  background: colors.surface.glass,
                  border: `1px solid ${colors.border.DEFAULT}`,
                }}
              >
                {fmt.icon && (
                  <span className="shrink-0 w-5 h-5" style={{ color: accentColor ?? colors.text.muted }}>
                    {fmt.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {fmt.label}
                  </p>
                  {fmt.description && (
                    <p className="text-[11px] mt-0.5" style={{ color: colors.text.subtle }}>
                      {fmt.description}
                    </p>
                  )}
                </div>
                {isExportingThis ? (
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
                    style={{
                      borderColor: colors.border.subtle,
                      borderTopColor: accentColor ?? colors.semantic.info,
                    }}
                  />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: colors.text.subtle }}>
                    <path
                      d="M8 3v7m0 0L5 7m3 3l3-3M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
