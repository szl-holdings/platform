import * as React from "react";
import { cn } from "./utils";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  illustration?: React.ReactNode;
  headline: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  accentColor?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  illustration,
  headline,
  description,
  action,
  secondaryAction,
  accentColor = "#6366f1",
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      {illustration ? (
        <div className={cn("mb-4", compact ? "mb-3" : "")}>
          {illustration}
        </div>
      ) : Icon ? (
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center mb-4",
            compact ? "w-12 h-12 rounded-xl mb-3" : "w-16 h-16"
          )}
          style={{ backgroundColor: `${accentColor}12` }}
        >
          <Icon
            className={cn(compact ? "w-6 h-6" : "w-8 h-8")}
            style={{ color: `${accentColor}80` } as React.CSSProperties}
          />
        </div>
      ) : null}

      <h3 className={cn("font-display font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
        {headline}
      </h3>

      {description && (
        <p className={cn("text-muted-foreground max-w-xs leading-relaxed mt-1.5", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-5">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] text-white",
                compact ? "text-xs py-1.5 px-3" : "text-sm py-2 px-4"
              )}
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                "font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors",
                compact ? "text-xs py-1.5 px-3" : "text-sm py-2 px-4"
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
