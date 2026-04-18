import { cn } from "../utils";

export type TimelineEventSeverity = "info" | "warning" | "critical" | "success" | "neutral";

export interface TimelineEvent {
  id: string;
  timestamp: string | Date;
  label: string;
  description?: string;
  severity?: TimelineEventSeverity;
  actor?: string;
  meta?: Record<string, string>;
}

export interface TimelineLaneProps {
  events: TimelineEvent[];
  className?: string;
  /** Show relative timestamps instead of absolute */
  relative?: boolean;
  /** Max number of visible events before scrolling */
  maxVisible?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

const severityConfig: Record<
  TimelineEventSeverity,
  { dot: string; line: string; label: string }
> = {
  info:     { dot: "bg-[#00d4ff] shadow-[0_0_6px_rgba(0,212,255,0.6)]", line: "border-[#00d4ff]/20", label: "text-[#00d4ff]" },
  warning:  { dot: "bg-[#ffb700] shadow-[0_0_6px_rgba(255,183,0,0.6)]", line: "border-[#ffb700]/20", label: "text-[#ffb700]" },
  critical: { dot: "bg-[#ff4455] shadow-[0_0_6px_rgba(255,68,85,0.6)]",  line: "border-[#ff4455]/20", label: "text-[#ff4455]" },
  success:  { dot: "bg-[#00e878] shadow-[0_0_6px_rgba(0,232,120,0.6)]", line: "border-[#00e878]/20", label: "text-[#00e878]" },
  neutral:  { dot: "bg-[#4a6070]", line: "border-[#1a2535]", label: "text-[#4a6070]" },
};

function formatTs(ts: string | Date, relative: boolean): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (relative) {
    const ms = Date.now() - d.getTime();
    const s  = Math.round(ms / 1000);
    if (s < 60)    return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60)    return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24)    return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function TimelineLane({
  events,
  className,
  relative = false,
  maxVisible,
  onEventClick,
}: TimelineLaneProps) {
  const visible = maxVisible ? events.slice(0, maxVisible) : events;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#243040] bg-[#0d1520] px-4 py-3",
        maxVisible && "overflow-y-auto",
        className
      )}
      style={maxVisible ? { maxHeight: `${maxVisible * 72 + 24}px` } : undefined}
    >
      <ol className="relative space-y-0">
        {visible.map((event, idx) => {
          const sev = event.severity ?? "neutral";
          const cfg = severityConfig[sev];
          const isLast = idx === visible.length - 1;

          return (
            <li
              key={event.id}
              className={cn(
                "relative flex gap-3 pb-4",
                isLast && "pb-0",
                onEventClick && "cursor-pointer group"
              )}
              onClick={() => onEventClick?.(event)}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    cfg.dot,
                    "transition-transform duration-150",
                    onEventClick && "group-hover:scale-125"
                  )}
                />
                {!isLast && (
                  <div
                    className={cn(
                      "mt-1 w-px flex-1 border-l",
                      cfg.line
                    )}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[#c8d8e8]">{event.label}</span>
                  {event.actor && (
                    <span className="text-[10px] text-[#4a6070]">by {event.actor}</span>
                  )}
                  <span className="ml-auto text-[10px] tabular-nums text-[#4a6070]">
                    {formatTs(event.timestamp, relative)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-[11px] text-[#7a99b8]">{event.description}</p>
                )}
                {event.meta && Object.keys(event.meta).length > 0 && (
                  <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {Object.entries(event.meta).map(([k, v]) => (
                      <div key={k} className="flex gap-1">
                        <dt className="text-[10px] text-[#4a6070]">{k}:</dt>
                        <dd className="text-[10px] font-medium text-[#7a99b8]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
