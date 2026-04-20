import React from "react";
import { cn } from "../utils.js";
import { color, semanticColors } from "../tokens/index.js";

export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "pending"
  | "active"
  | "approved"
  | "rejected"
  | "escalated";

const VARIANT_CONFIG: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success:   { bg: semanticColors.success.bg,  text: semanticColors.success.text,  dot: semanticColors.success.text },
  warning:   { bg: semanticColors.warning.bg,  text: semanticColors.warning.text,  dot: semanticColors.warning.text },
  error:     { bg: semanticColors.error.bg,    text: semanticColors.error.text,    dot: semanticColors.error.text },
  info:      { bg: semanticColors.info.bg,     text: semanticColors.info.text,     dot: semanticColors.info.text },
  neutral:   { bg: semanticColors.neutral.bg,  text: semanticColors.neutral.text,  dot: semanticColors.neutral.text },
  pending:   { bg: semanticColors.warning.bg,  text: semanticColors.warning.text,  dot: semanticColors.warning.text },
  active:    { bg: semanticColors.success.bg,  text: semanticColors.success.text,  dot: semanticColors.success.text },
  approved:  { bg: semanticColors.success.bg,  text: semanticColors.success.text,  dot: semanticColors.success.text },
  rejected:  { bg: semanticColors.error.bg,    text: semanticColors.error.text,    dot: semanticColors.error.text },
  escalated: { bg: color.border.subtle,        text: color.accent.violet,          dot: color.accent.violet },
};

export interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ variant, label, showDot = true, className }: StatusBadgeProps) {
  const cfg = VARIANT_CONFIG[variant];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2 rounded text-xs font-medium", className)}
      style={{ background: cfg.bg, color: cfg.text, height: "20px" }}
    >
      {showDot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: "5px", height: "5px", background: cfg.dot }}
        />
      )}
      {label}
    </span>
  );
}
