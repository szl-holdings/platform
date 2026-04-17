import * as React from "react";
import { cn } from "../utils";

function WarningIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(239,68,68,0.7)" }}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  onReset?: () => void;
  retryLabel?: string;
  resetLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
  variant?: "dark" | "light";
  accentColor?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  onReset,
  retryLabel = "Try Again",
  resetLabel = "Reload Page",
  icon,
  className,
  compact = false,
  variant = "dark",
  accentColor,
}: ErrorStateProps) {
  const isDark = variant === "dark";
  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-4",
          compact ? "w-12 h-12 rounded-xl mb-3" : "w-16 h-16"
        )}
        style={{
          backgroundColor: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        {icon ?? (
          <WarningIcon size={compact ? 20 : 28} />
        )}
      </div>

      <h3
        className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-base",
          isDark ? "text-white" : "text-neutral-900"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "max-w-xs leading-relaxed mt-1.5",
            compact ? "text-xs" : "text-sm",
            isDark ? "text-white/50" : "text-neutral-500"
          )}
        >
          {description}
        </p>
      )}

      {errorMessage && (
        <p
          className={cn(
            "font-mono rounded-lg px-3 py-2 mt-3 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap",
            compact ? "text-[10px]" : "text-xs",
            isDark ? "bg-white/5 text-white/40" : "bg-neutral-100 text-neutral-500"
          )}
          title={errorMessage}
        >
          {errorMessage}
        </p>
      )}

      {(onRetry || onReset) && (
        <div className="flex items-center gap-2 mt-5">
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                "font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] text-white",
                compact ? "text-xs py-1.5 px-3" : "text-sm py-2 px-4"
              )}
              style={{
                background: accentColor
                  ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                  : "linear-gradient(135deg, #c45a4a, #dc2626)",
              }}
            >
              {retryLabel}
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className={cn(
                "font-medium hover:bg-white/8 rounded-xl transition-colors",
                compact ? "text-xs py-1.5 px-3" : "text-sm py-2 px-4",
                isDark ? "text-white/40 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              {resetLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
