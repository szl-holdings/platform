import { useState } from "react";
import { GlobeVisualization } from "../components/GlobeVisualization";
import { Ship, AlertTriangle, Eye, Radio, Satellite, Activity, Anchor, Navigation } from "lucide-react";

const LIVE_STATS = [
  { label: "Vessels Tracked", value: "847", icon: Ship, trend: "+12 today" },
  { label: "Active Anomalies", value: "3", icon: AlertTriangle, trend: "2 new", accent: "#f59e0b" },
  { label: "AIS Dark Vessels", value: "2", icon: Eye, trend: "Strait of Hormuz", accent: "#ef4444" },
  { label: "Trade Routes", value: "23", icon: Navigation, trend: "4 congested" },
];

const RECENT_EVENTS = [
  { time: "14:32", vessel: "MV Aurora Star", event: "AIS gap detected — 4.2h dark window, Strait of Hormuz", severity: "critical" },
  { time: "14:18", vessel: "MV Pacific Lion", event: "Route deviation 340nm off declared course", severity: "warning" },
  { time: "13:55", vessel: "MT Solaris VII", event: "Draft anomaly — cargo weight inconsistent with manifest", severity: "warning" },
  { time: "13:41", vessel: "MV Shadow Runner", event: "AIS transponder offline since 06:00 UTC — Gulf of Aden", severity: "critical" },
  { time: "13:22", vessel: "Atlantic Resolve", event: "Unscheduled port call — Bandar Abbas, Iran", severity: "warning" },
  { time: "12:58", vessel: "MV Indian Pearl", event: "Speed anomaly — 3.2 knots in open ocean (expected 14+)", severity: "info" },
];

const SAT_PASSES = [
  { satellite: "SAR-1 (Sentinel)", nextPass: "15:42 UTC", coverage: "Gulf of Aden", status: "scheduled" },
  { satellite: "EO-3 (Planet)", nextPass: "16:18 UTC", coverage: "Strait of Hormuz", status: "queued" },
  { satellite: "RF-2 (HawkEye)", nextPass: "17:05 UTC", coverage: "South China Sea", status: "available" },
];

export default function GlobeCommandPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210, 25%, 5%)", color: "#e5e7eb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid hsla(192, 40%, 30%, 0.15)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee55" }} />
          <span style={{ fontSize: "0.8125rem", fontFamily: "monospace", color: "#22d3ee", fontWeight: 600, letterSpacing: "0.06em" }}>GLOBE COMMAND</span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Maritime Spatial Intelligence</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["all", "anomalies", "dark", "routes"].map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                border: selectedFilter === f ? "1px solid #22d3ee" : "1px solid hsla(0,0%,100%,0.08)",
                background: selectedFilter === f ? "hsla(192, 70%, 55%, 0.12)" : "transparent",
                color: selectedFilter === f ? "#22d3ee" : "#9ca3af",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "0", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {LIVE_STATS.map(s => (
              <div key={s.label} style={{ background: "hsla(210, 25%, 10%, 0.8)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <s.icon size={14} style={{ color: (s as any).accent || "#22d3ee" }} />
                  <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: (s as any).accent || "#f0f0f0", fontFamily: "monospace" }}>{s.value}</div>
                <div style={{ fontSize: "0.6875rem", color: "#4b5563", marginTop: "4px" }}>{s.trend}</div>
              </div>
            ))}
          </div>

          <GlobeVisualization />
        </div>

        <div style={{ borderLeft: "1px solid hsla(0,0%,100%,0.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Activity size={14} style={{ color: "#22d3ee" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e5e7eb" }}>Live Event Stream</span>
            </div>
            <span style={{ fontSize: "0.6875rem", color: "#6b7280" }}>{RECENT_EVENTS.length} events in last 2 hours</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
            {RECENT_EVENTS.map((ev, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid hsla(0,0%,100%,0.04)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "hsla(192, 40%, 20%, 0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: ev.severity === "critical" ? "#ef4444" : ev.severity === "warning" ? "#f59e0b" : "#22d3ee",
                    display: "inline-block",
                  }} />
                  <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#6b7280" }}>{ev.time} UTC</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e5e7eb" }}>{ev.vessel}</span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: 0, paddingLeft: "14px" }}>{ev.event}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Satellite size={14} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e5e7eb" }}>Remote Sensing Schedule</span>
            </div>
            {SAT_PASSES.map((sat, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < SAT_PASSES.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#d1d5db" }}>{sat.satellite}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#6b7280" }}>{sat.coverage}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#a78bfa" }}>{sat.nextPass}</div>
                  <div style={{ fontSize: "0.625rem", color: "#4b5563", textTransform: "uppercase" }}>{sat.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
