import React, { useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import type { CausalEvent, Severity } from "./types";

const BG = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.07)";

function severityDot(severity?: Severity): string {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#f59e0b";
    case "low": return "#22c55e";
    default: return "#6b7280";
  }
}

interface CausalTimelineProps {
  events: CausalEvent[];
  title?: string;
  showCausalLinks?: boolean;
  maxVisible?: number;
}

export function CausalTimeline({ events, title = "Causal Timeline", showCausalLinks = true, maxVisible = 8 }: CausalTimelineProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? events : events.slice(0, maxVisible);

  function toggle(id: string) {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", padding: "1.25rem" }}>
      {title && (
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "1.25rem" }}>
          {title}
        </div>
      )}

      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
        <div style={{
          position: "absolute",
          left: "6px",
          top: 0,
          bottom: 0,
          width: "1px",
          background: "hsla(0,0%,100%,0.06)",
        }} />

        {visible.map((event, i) => {
          const isExpanded = expanded.includes(event.id);
          const dotColor = severityDot(event.severity);

          return (
            <div key={event.id} style={{ position: "relative", marginBottom: i < visible.length - 1 ? "1rem" : 0 }}>
              <div style={{
                position: "absolute",
                left: "-1.5rem",
                top: "4px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                backgroundColor: dotColor,
                border: `2px solid hsla(0,0%,0%,0.6)`,
                boxShadow: `0 0 8px ${dotColor}60`,
              }} />

              <div
                style={{ cursor: "pointer" }}
                onClick={() => toggle(event.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
                    {event.timestamp}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${event.domainColor}20`, color: event.domainColor }}>
                    {event.domain}
                  </span>
                  {isExpanded
                    ? <ChevronDown style={{ width: 10, height: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }} />
                    : <ChevronRight style={{ width: 10, height: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }} />
                  }
                </div>
                <div style={{ marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{event.title}</span>
                  {event.delta && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "11px", fontWeight: 600, color: event.delta.startsWith("+") ? "#ef4444" : "#22c55e" }}>
                      {event.delta}
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "0.5rem", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.03)", borderRadius: "0.5rem", border: "1px solid hsla(0,0%,100%,0.05)" }}>
                  {event.description && (
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: event.causeOf?.length || event.causedBy?.length ? "0.5rem" : 0 }}>
                      {event.description}
                    </p>
                  )}
                  {event.owner && (
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Owner: <span style={{ color: "rgba(255,255,255,0.5)" }}>{event.owner}</span></p>
                  )}
                  {showCausalLinks && event.causedBy && event.causedBy.length > 0 && (
                    <div style={{ marginTop: "0.375rem", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      <ArrowRight style={{ width: 9, height: 9, display: "inline", marginRight: "4px" }} />
                      Caused by: {event.causedBy.join(", ")}
                    </div>
                  )}
                  {showCausalLinks && event.causeOf && event.causeOf.length > 0 && (
                    <div style={{ marginTop: "0.25rem", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      <ArrowRight style={{ width: 9, height: 9, display: "inline", marginRight: "4px" }} />
                      Caused: {event.causeOf.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {events.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ marginTop: "1rem", fontSize: "11px", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {showAll ? "Show less" : `+${events.length - maxVisible} more events`}
        </button>
      )}
    </div>
  );
}
