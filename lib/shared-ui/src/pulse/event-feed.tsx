import { useState, useEffect } from "react";
import { motion as m, AnimatePresence } from "framer-motion";

export interface PulseEvent {
  id: string; type: string; agent: string; domain: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string; timestamp: number;
}

export function generatePulseEvent(agents: { name: string; domain: string }[], eventTypes: { type: string; messages: string[] }[]): PulseEvent {
  const agent = agents[Math.floor(Math.random() * agents.length)]!;
  const et = eventTypes[Math.floor(Math.random() * eventTypes.length)]!;
  const severities: PulseEvent["severity"][] = ["info", "info", "info", "low", "low", "medium", "high"];
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: et.type, agent: agent.name, domain: agent.domain,
    severity: severities[Math.floor(Math.random() * severities.length)]!,
    message: et.messages[Math.floor(Math.random() * et.messages.length)]!,
    timestamp: Date.now(),
  };
}

function severityColor(s: string) {
  switch (s) { case "critical": return "#ef4444"; case "high": return "#f97316"; case "medium": return "#f59e0b"; case "low": return "#3b82f6"; default: return "rgba(255,255,255,0.3)"; }
}

export function PulseEventFeed({ agents, eventTypes, maxVisible = 8 }: {
  agents: { name: string; domain: string }[];
  eventTypes: { type: string; messages: string[] }[];
  maxVisible?: number;
}) {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  useEffect(() => {
    setEvents(Array.from({ length: maxVisible }, () => generatePulseEvent(agents, eventTypes)));
    const timer = setInterval(() => {
      setEvents(prev => [generatePulseEvent(agents, eventTypes), ...prev].slice(0, maxVisible + 4));
    }, 2200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="space-y-1.5">
      <AnimatePresence mode="popLayout">
        {events.slice(0, maxVisible).map(event => (
          <m.div key={event.id} layout initial={{ opacity: 0, x: -16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 16, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 px-3 py-2 rounded-md"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.035)" }}>
            <div className="mt-1.5 relative flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: severityColor(event.severity) }} />
              {event.severity !== "info" && <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: severityColor(event.severity), opacity: 0.4 }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: severityColor(event.severity) === "rgba(255,255,255,0.3)" ? "rgba(255,255,255,0.5)" : severityColor(event.severity) }}>{event.agent}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}>{event.type.replace(/_/g, " ")}</span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{event.message}</p>
            </div>
            <span className="text-[9px] flex-shrink-0 mt-1 tabular-nums" style={{ color: "rgba(255,255,255,0.12)" }}>
              {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
