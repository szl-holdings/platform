import * as React from "react";
import { cn } from "../utils";
import { colors } from "../tokens";

export type ConfidenceBadgeLevel = keyof typeof colors.confidence;

export interface ConfidenceBadgeProps {
  level: ConfidenceBadgeLevel;
  showDot?: boolean;
  showLabel?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function ConfidenceBadge({
  level,
  showDot = true,
  showLabel = true,
  size = "sm",
  className,
}: ConfidenceBadgeProps) {
  const token = colors.confidence[level];

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const dotSizes = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-1.5 h-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        sizeClasses[size],
        className
      )}
      style={{
        background: token.bg,
        color: token.color,
        border: `1px solid ${token.border}`,
      }}
    >
      {showDot && (
        <span
          className={cn("rounded-full shrink-0", dotSizes[size])}
          style={{ background: token.color }}
        />
      )}
      {showLabel && <span>Confidence: {token.label}</span>}
    </span>
  );
}
