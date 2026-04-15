import { getDomainColor, getSeverityColor } from "../lib/utils";
import type { TimelineEvent } from "../types";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-surface-border)",
      }}
    >
      <div
        className="p-4"
        style={{
          borderBottom: "1px solid var(--color-surface-border)",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <h2
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--color-fg-muted)" }}
        >
          Cross-Domain Feed
        </h2>
      </div>
      <div className="overflow-y-auto p-4 flex-1 flex flex-col gap-4 max-h-[600px]">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative pl-4 pb-4 last:pb-0"
            style={{ borderLeft: "1px solid var(--color-surface-border)" }}
            data-testid={`timeline-event-${event.id}`}
          >
            <div
              className="absolute w-2 h-2 rounded-full top-1.5"
              style={{
                backgroundColor: getDomainColor(event.domain),
                left: "-4.5px",
              }}
            />
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "var(--color-fg-muted)" }}
              >
                <span>{event.time}</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ color: getDomainColor(event.domain) }}>{event.domain}</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ color: getSeverityColor(event.severity) }}>{event.severity}</span>
              </div>
              <h4
                className="text-sm font-semibold"
                style={{ color: "var(--color-fg-primary)" }}
              >
                {event.title}
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--color-fg-muted)" }}
              >
                {event.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
