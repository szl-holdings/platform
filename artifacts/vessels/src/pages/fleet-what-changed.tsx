import { useState } from "react";
import {
  AlertTriangle, Navigation, Anchor, Shield,
  FileText, RefreshCw, ArrowUpRight, Wind, Activity
} from "lucide-react";
import { fleetWhatChanged, type FleetWhatChangedEvent } from "@/data/fleet-twin";

const ACCENT = "hsl(205 70% 50%)";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EVENT_ICONS: Record<FleetWhatChangedEvent["eventType"], React.ElementType> = {
  route_deviation: Navigation,
  weather_alert: Wind,
  port_delay: Anchor,
  sanctions_flag: Shield,
  ais_gap: Activity,
  cert_expiry: FileText,
  approval_action: Shield,
  exception_raised: AlertTriangle,
  readiness_change: Activity,
  voyage_status_change: Navigation,
};

const EVENT_LABELS: Record<FleetWhatChangedEvent["eventType"], string> = {
  route_deviation: "Route Deviation",
  weather_alert: "Weather Alert",
  port_delay: "Port Delay",
  sanctions_flag: "Sanctions",
  ais_gap: "AIS Gap",
  cert_expiry: "Cert Expiry",
  approval_action: "Approval",
  exception_raised: "Exception",
  readiness_change: "Readiness",
  voyage_status_change: "Voyage",
};

const SEV_STYLE = {
  info: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", badge: "rgba(255,255,255,0.06)", badgeText: "rgba(255,255,255,0.4)" },
  warning: { bg: "#c08a2c06", border: "#c08a2c25", badge: "#c08a2c20", badgeText: "#c08a2c" },
  critical: { bg: "#9b1c1c08", border: "#9b1c1c35", badge: "#9b1c1c25", badgeText: "#f87171" },
};

function EventCard({ event }: { event: FleetWhatChangedEvent }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = EVENT_ICONS[event.eventType] ?? Activity;
  const s = SEV_STYLE[event.severity];
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-xl border p-4 cursor-pointer transition-all hover:bg-white/2"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: s.badge }}>
          <Icon size={14} style={{ color: s.badgeText }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: s.badge, color: s.badgeText }}>
              {EVENT_LABELS[event.eventType]}
            </span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{event.entityName}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>· {event.source}</span>
          </div>
          <div className="text-sm font-medium" style={{ color: event.severity === "critical" ? "#f87171" : event.severity === "warning" ? "#c08a2c" : "rgba(255,255,255,0.75)" }}>
            {event.summary}
          </div>
          {expanded && event.detail && (
            <div className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{event.detail}</div>
          )}
          <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            {relTime(event.occurredAt)} {event.actor && `· by ${event.actor}`}
          </div>
        </div>
        <ArrowUpRight size={13} style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function FleetWhatChanged() {
  const [filter, setFilter] = useState("all");

  const filtered = fleetWhatChanged.filter(e =>
    filter === "all" || e.severity === filter || e.eventType === filter
  );

  const counts = {
    critical: fleetWhatChanged.filter(e => e.severity === "critical").length,
    warning: fleetWhatChanged.filter(e => e.severity === "warning").length,
    info: fleetWhatChanged.filter(e => e.severity === "info").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>What Changed</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Real-time feed of significant fleet and voyage events
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total (rolling)</div>
          <div className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{fleetWhatChanged.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#9b1c1c08", borderColor: "#9b1c1c30" }}>
          <div className="text-xs mb-1" style={{ color: "#f87171" }}>Critical</div>
          <div className="text-2xl font-bold" style={{ color: "#f87171" }}>{counts.critical}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#c08a2c08", borderColor: "#c08a2c25" }}>
          <div className="text-xs mb-1" style={{ color: "#c08a2c" }}>Warnings</div>
          <div className="text-2xl font-bold" style={{ color: "#c08a2c" }}>{counts.warning}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {["all", "critical", "warning", "info"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-lg capitalize transition-colors"
            style={{
              background: filter === f ? "hsl(205 70% 38% / 0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f ? ACCENT : "rgba(255,255,255,0.4)",
              border: `1px solid ${filter === f ? "hsl(205 70% 38% / 0.35)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}
