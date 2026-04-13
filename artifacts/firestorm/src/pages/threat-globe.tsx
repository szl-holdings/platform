import { useState } from "react";
import { ThreatGlobe } from "../components/ThreatGlobe";
import { Shield, AlertTriangle, Activity, Target, Globe, Radio, Cpu, Eye, Crosshair, Skull } from "lucide-react";

const LIVE_STATS = [
  { label: "Active Campaigns", value: "7", icon: Target, trend: "2 APT-linked", accent: "#ef4444" },
  { label: "Threat Actors Tracked", value: "142", icon: Skull, trend: "+3 this week" },
  { label: "Attack Vectors", value: "23", icon: Crosshair, trend: "5 zero-day" },
  { label: "Defense Nodes", value: "4", icon: Shield, trend: "All operational", accent: "#22c55e" },
];

const ACTIVE_CAMPAIGNS = [
  { actor: "APT-29 (Cozy Bear)", origin: "Russia", campaign: "SolarPhoenix 2.0", vector: "Supply chain / OAuth abuse", targets: "Gov, Defense contractors", severity: "critical", ttps: ["T1195", "T1550", "T1071"], lastSeen: "2 min ago" },
  { actor: "Lazarus Group", origin: "North Korea", campaign: "TraderTraitor III", vector: "Crypto wallet phishing → RAT", targets: "Financial, Crypto exchanges", severity: "critical", ttps: ["T1566", "T1059", "T1486"], lastSeen: "8 min ago" },
  { actor: "APT-41 (Winnti)", origin: "China", campaign: "DragonBridge", vector: "Zero-day in Citrix ADC", targets: "Tech, Manufacturing", severity: "critical", ttps: ["T1190", "T1055", "T1003"], lastSeen: "15 min ago" },
  { actor: "APT-33 (Elfin)", origin: "Iran", campaign: "SandStrike", vector: "Watering hole + Shamoon variant", targets: "Energy, Petrochemical", severity: "high", ttps: ["T1189", "T1561", "T1071"], lastSeen: "1 hr ago" },
  { actor: "FIN7", origin: "Eastern Europe", campaign: "BlackMatter Resurgence", vector: "JSSLoader → Cobalt Strike", targets: "Retail, Hospitality", severity: "high", ttps: ["T1566", "T1059", "T1021"], lastSeen: "3 hr ago" },
];

export default function ThreatGlobePage() {
  const [selectedCampaign, setSelectedCampaign] = useState<number>(0);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(220, 25%, 4%)", color: "#e5e7eb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid hsla(0, 60%, 30%, 0.15)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef444455", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.8125rem", fontFamily: "monospace", color: "#ef4444", fontWeight: 600, letterSpacing: "0.06em" }}>THREAT GLOBE</span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Global Adversary Intelligence</span>
        </div>
        <div style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#4b5563" }}>
          LIVE — {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "0", minHeight: "calc(100vh - 55px)" }}>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {LIVE_STATS.map(s => (
              <div key={s.label} style={{ background: "hsla(220, 25%, 10%, 0.6)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <s.icon size={14} style={{ color: (s as any).accent || "#ef4444" }} />
                  <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: (s as any).accent || "#f0f0f0", fontFamily: "monospace" }}>{s.value}</div>
                <div style={{ fontSize: "0.6875rem", color: "#4b5563", marginTop: "4px" }}>{s.trend}</div>
              </div>
            ))}
          </div>
          <ThreatGlobe />
        </div>

        <div style={{ borderLeft: "1px solid hsla(0,0%,100%,0.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Activity size={14} style={{ color: "#ef4444" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e5e7eb" }}>Active Campaigns</span>
            </div>
            <span style={{ fontSize: "0.6875rem", color: "#6b7280" }}>{ACTIVE_CAMPAIGNS.length} campaigns tracked</span>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {ACTIVE_CAMPAIGNS.map((c, i) => (
              <div
                key={i}
                onClick={() => setSelectedCampaign(i)}
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid hsla(0,0%,100%,0.04)",
                  cursor: "pointer",
                  background: selectedCampaign === i ? "hsla(0, 60%, 20%, 0.08)" : "transparent",
                  borderLeft: selectedCampaign === i ? "2px solid #ef4444" : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: c.severity === "critical" ? "#ef4444" : "#f59e0b",
                    display: "inline-block", boxShadow: c.severity === "critical" ? "0 0 6px #ef444455" : "none",
                  }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>{c.actor}</span>
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 500, color: c.severity === "critical" ? "#ef4444" : "#f59e0b", fontFamily: "monospace", marginBottom: "4px" }}>
                  {c.campaign}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "6px" }}>{c.vector}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {c.ttps.map(t => (
                    <span key={t} style={{
                      fontSize: "0.5625rem", fontFamily: "monospace", padding: "1px 6px", borderRadius: "3px",
                      background: "hsla(0,0%,100%,0.04)", color: "#6b7280", border: "1px solid hsla(0,0%,100%,0.06)",
                    }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: "#4b5563" }}>
                  <span>Targets: {c.targets}</span>
                  <span>{c.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 20px", borderTop: "1px solid hsla(0,0%,100%,0.06)", background: "hsla(0, 60%, 10%, 0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Eye size={14} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#e5e7eb" }}>Adversary Simulation</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "8px" }}>
              847 attack paths tested this cycle — 12 bypassed first layer, 0 reached critical assets.
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "hsla(0,0%,100%,0.06)" }}>
                <div style={{ width: "98.6%", height: "100%", borderRadius: "2px", background: "linear-gradient(90deg, #22c55e, #22d3ee)" }} />
              </div>
              <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#22c55e" }}>98.6%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
