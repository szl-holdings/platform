import { AlertTriangle } from "lucide-react";
import { cn } from "../utils";

export interface ConfidenceMeterProps {
  /** 0–100 */
  value: number;
  /** When true, renders a contradiction warning overlay */
  contradiction?: boolean;
  /** Optional label next to the value */
  label?: string;
  className?: string;
  /** compact = just the bar + number, full = with label row */
  variant?: "compact" | "full";
}

function colorForValue(v: number): string {
  if (v >= 75) return "#00e878";
  if (v >= 45) return "#ffb700";
  return "#ff4455";
}

export function ConfidenceMeter({
  value,
  contradiction = false,
  label,
  className,
  variant = "compact",
}: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = colorForValue(clamped);
  const fillColor = contradiction ? "#a855f7" : fill;

  return (
    <div className={cn("inline-flex flex-col gap-1 min-w-0", className)}>
      {variant === "full" && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-[11px] uppercase tracking-wider text-[#4a6070]">{label}</span>
          )}
          <div className="flex items-center gap-1">
            {contradiction && (
              <span title="Contradictory evidence detected" className="text-[#a855f7]">
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: fillColor }}
            >
              {clamped}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? "Confidence"}
          className="relative h-1.5 flex-1 rounded-full bg-[#1a2535] overflow-hidden"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${clamped}%`, backgroundColor: fillColor }}
          />
          {contradiction && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 3px, #a855f7 3px, #a855f7 4px)",
              }}
            />
          )}
        </div>

        {variant === "compact" && (
          <div className="flex items-center gap-1 shrink-0">
            {contradiction && (
              <span title="Contradictory evidence" className="text-[#a855f7]">
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: fillColor }}
            >
              {clamped}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
