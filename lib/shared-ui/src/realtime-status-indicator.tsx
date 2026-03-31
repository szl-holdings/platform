import { cn } from "./utils";
import type { RealtimeConnectionStatus } from "./use-realtime-channel";

interface RealtimeStatusIndicatorProps {
  status: RealtimeConnectionStatus;
  className?: string;
  compact?: boolean;
}

export function RealtimeStatusIndicator({
  status,
  className,
  compact = false,
}: RealtimeStatusIndicatorProps) {
  const config = {
    connected: {
      dot: "bg-emerald-400",
      text: "text-emerald-400",
      label: "Live",
      pulse: true,
    },
    reconnecting: {
      dot: "bg-amber-400",
      text: "text-amber-400",
      label: "Reconnecting",
      pulse: true,
    },
    offline: {
      dot: "bg-red-400",
      text: "text-red-400",
      label: "Offline",
      pulse: false,
    },
  } satisfies Record<RealtimeConnectionStatus, { dot: string; text: string; label: string; pulse: boolean }>;

  const c = config[status];

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[9px] font-mono font-semibold uppercase tracking-wide",
          c.text,
          className,
        )}
        title={`Connection: ${c.label}`}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot, c.pulse && "animate-pulse")} />
        {c.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded border",
        status === "connected" && "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        status === "reconnecting" && "text-amber-400 bg-amber-500/10 border-amber-500/20",
        status === "offline" && "text-red-400 bg-red-500/10 border-red-500/20",
        className,
      )}
      title={`WebSocket: ${c.label}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot, c.pulse && "animate-pulse")} />
      {c.label}
    </span>
  );
}
