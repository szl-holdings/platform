import { Clock } from "lucide-react";
import { cn } from "../utils";

export type FreshnessLevel = "fresh" | "aging" | "stale" | "unknown";

export interface FreshnessChipProps {
  /** ISO 8601 timestamp or Date */
  timestamp: string | Date | null | undefined;
  /** Override the computed freshness level */
  level?: FreshnessLevel;
  className?: string;
  /** Show the absolute time in a tooltip */
  showAbsolute?: boolean;
}

function computeLevel(ts: string | Date | null | undefined): FreshnessLevel {
  if (!ts) return "unknown";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return "unknown";
  const ageMs = Date.now() - d.getTime();
  const ageH = ageMs / 3_600_000;
  if (ageH < 1)   return "fresh";
  if (ageH < 24)  return "aging";
  return "stale";
}

function relativeLabel(ts: string | Date | null | undefined): string {
  if (!ts) return "unknown";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return "unknown";
  const ms = Date.now() - d.getTime();
  const s  = Math.round(ms / 1000);
  if (s < 60)    return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60)    return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24)    return `${h}h ago`;
  const day = Math.round(h / 24);
  if (day < 30)  return `${day}d ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}

const levelStyles: Record<FreshnessLevel, string> = {
  fresh:   "border-[#00e878]/30 text-[#00e878] bg-[#00e878]/8",
  aging:   "border-[#ffb700]/30 text-[#ffb700] bg-[#ffb700]/8",
  stale:   "border-[#ff4455]/30 text-[#ff4455] bg-[#ff4455]/8",
  unknown: "border-[#243040] text-[#4a6070] bg-transparent",
};

export function FreshnessChip({ timestamp, level, className, showAbsolute }: FreshnessChipProps) {
  const resolved = level ?? computeLevel(timestamp);
  const label    = relativeLabel(timestamp);
  const absLabel = timestamp ? new Date(timestamp).toLocaleString() : undefined;

  return (
    <span
      title={showAbsolute && absLabel ? absLabel : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        levelStyles[resolved],
        className
      )}
    >
      <Clock className="h-2.5 w-2.5 shrink-0" />
      {label}
    </span>
  );
}
