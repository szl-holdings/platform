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
      dot: "bg-[#6b8f71]",
      text: "text-[#6b8f71]",
      label: "Live",
      pulse: true,
    },
    reconnecting: {
      dot: "bg-[#d4a054]",
      text: "text-[#d4a054]",
      label: "Reconnecting",
      pulse: true,
    },
    offline: {
      dot: "bg-[#c45a4a]",
      text: "text-[#c45a4a]",
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
        status === "connected" && "text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20",
        status === "reconnecting" && "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20",
        status === "offline" && "text-[#c45a4a] bg-red-500/10 border-red-500/20",
        className,
      )}
      title={`WebSocket: ${c.label}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot, c.pulse && "animate-pulse")} />
      {c.label}
    </span>
  );
}
