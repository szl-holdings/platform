import { cn } from "../utils";
import { v } from "../tokens/vars.js";

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
  relative?: boolean;
  maxVisible?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

const severityDotColor: Record<TimelineEventSeverity, string> = {
  info:     v.accentBlue,
  warning:  v.accentAmber,
  critical: v.accentRed,
  success:  v.accentGreen,
  neutral:  v.textMuted,
};

const severityLabelColor: Record<TimelineEventSeverity, string> = {
  info:     v.accentBlue,
  warning:  v.accentAmber,
  critical: v.accentRed,
  success:  v.accentGreen,
  neutral:  v.textMuted,
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
      style={maxVisible
        ? { maxHeight: `${maxVisible * 72 + 24}px`, borderColor: v.borderDefault, backgroundColor: v.bgSurface }
        : { borderColor: v.borderDefault, backgroundColor: v.bgSurface }}
      className={cn(
        "rounded-lg border px-4 py-3",
        maxVisible && "overflow-y-auto",
        className
      )}
    >
      <ol className="relative space-y-0">
        {visible.map((event, idx) => {
          const sev = event.severity ?? "neutral";
          const dotColor = severityDotColor[sev];
          const labelColor = severityLabelColor[sev];
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
                  style={{ backgroundColor: dotColor }}
                  className={cn(
                    "relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    "transition-transform duration-150",
                    onEventClick && "group-hover:scale-125"
                  )}
                />
                {!isLast && (
                  <div
                    style={{ borderColor: v.borderSubtle }}
                    className="mt-1 w-px flex-1 border-l"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span style={{ color: v.textPrimary }} className="text-xs font-medium">{event.label}</span>
                  {event.actor && (
                    <span style={{ color: v.textMuted }} className="text-[10px]">by {event.actor}</span>
                  )}
                  <span style={{ color: v.textMuted }} className="ml-auto text-[10px] tabular-nums">
                    {formatTs(event.timestamp, relative)}
                  </span>
                </div>
                {event.description && (
                  <p style={{ color: v.textSecondary }} className="mt-0.5 text-[11px]">{event.description}</p>
                )}
                {event.meta && Object.keys(event.meta).length > 0 && (
                  <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {Object.entries(event.meta).map(([k, val]) => (
                      <div key={k} className="flex gap-1">
                        <dt style={{ color: v.textMuted }} className="text-[10px]">{k}:</dt>
                        <dd style={{ color: labelColor }} className="text-[10px] font-medium">{val}</dd>
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
