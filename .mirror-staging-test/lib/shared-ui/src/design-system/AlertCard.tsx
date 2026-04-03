import * as React from "react";
import { cn } from "../utils";

export type AlertSeverity = "info" | "success" | "warning" | "error" | "critical";

export interface AlertCardProps {
  severity?: AlertSeverity;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  timestamp?: string;
  actions?: { label: string; onClick: () => void; variant?: "primary" | "ghost" }[];
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; border: string; icon: string; text: string }> = {
  info: {
    bg: "bg-sky-500/8",
    border: "border-sky-500/20",
    icon: "text-sky-400",
    text: "text-sky-100",
  },
  success: {
    bg: "bg-[#6b8f71]/8",
    border: "border-[#6b8f71]/20",
    icon: "text-[#6b8f71]",
    text: "text-emerald-100",
  },
  warning: {
    bg: "bg-[#d4a054]/8",
    border: "border-[#d4a054]/20",
    icon: "text-[#d4a054]",
    text: "text-amber-100",
  },
  error: {
    bg: "bg-red-500/8",
    border: "border-red-500/20",
    icon: "text-[#c45a4a]",
    text: "text-red-100",
  },
  critical: {
    bg: "bg-red-500/12",
    border: "border-red-500/40",
    icon: "text-red-300",
    text: "text-red-50",
  },
};

const DEFAULT_ICONS: Record<AlertSeverity, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
  critical: "⚡",
};

export function AlertCard({
  severity = "info",
  title,
  description,
  icon,
  timestamp,
  actions,
  dismissible = false,
  onDismiss,
  className,
  compact = false,
}: AlertCardProps) {
  const styles = SEVERITY_STYLES[severity];

  return (
    <div
      className={cn(
        "rounded-xl border flex gap-3",
        compact ? "p-3" : "p-4",
        styles.bg,
        styles.border,
        className
      )}
      role="alert"
      aria-live={severity === "critical" ? "assertive" : "polite"}
    >
      <div
        className={cn(
          "shrink-0 flex items-center justify-center rounded-lg font-bold",
          compact ? "w-6 h-6 text-xs mt-0.5" : "w-8 h-8 text-sm",
          styles.icon
        )}
      >
        {icon ?? DEFAULT_ICONS[severity]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "font-semibold",
              compact ? "text-xs" : "text-sm",
              styles.text
            )}
          >
            {title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {timestamp && (
              <span className="text-[10px] text-white/30">{timestamp}</span>
            )}
            {dismissible && (
              <button
                onClick={onDismiss}
                className="text-white/30 hover:text-white/60 transition-colors p-0.5"
                aria-label="Dismiss alert"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {description && (
          <p className={cn("mt-1 leading-relaxed text-white/60", compact ? "text-[11px]" : "text-xs")}>
            {description}
          </p>
        )}

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className={cn(
                  "text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors",
                  action.variant === "ghost"
                    ? "text-white/50 hover:text-white hover:bg-white/8"
                    : cn(
                        "text-white hover:opacity-90",
                        severity === "error" || severity === "critical"
                          ? "bg-red-500/30 hover:bg-red-500/40"
                          : severity === "warning"
                          ? "bg-[#d4a054]/30 hover:bg-[#d4a054]/40"
                          : severity === "success"
                          ? "bg-[#6b8f71]/30 hover:bg-[#6b8f71]/40"
                          : "bg-sky-500/30 hover:bg-sky-500/40"
                      )
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
