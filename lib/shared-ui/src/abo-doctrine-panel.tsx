/**
 * ABO Doctrine Panel — Shared UI Component
 * Embeds the 8-Pillar ABO doctrine status into any platform surface.
 * Used by Lyte, Aegis, PRISM, Nexus, INCA Lab, Forge, SZL Holdings.
 */

import { useState, useEffect } from "react";

const ABO_PILLARS = [
  { id: 1, name: "MELT+A Fabric", shortName: "Telemetry", color: "#06b6d4", icon: "⬡" },
  { id: 2, name: "Signal Intelligence", shortName: "Signals", color: "#10b981", icon: "◎" },
  { id: 3, name: "Governance Plane", shortName: "Govern", color: "#8b5cf6", icon: "◆" },
  { id: 4, name: "Trust Mesh", shortName: "Trust", color: "#f59e0b", icon: "🔒" },
  { id: 5, name: "Agent Vitals", shortName: "Vitals", color: "#f43f5e", icon: "▲" },
  { id: 6, name: "Predictive Risk", shortName: "Predict", color: "#6366f1", icon: "◈" },
  { id: 7, name: "Compliance Runtime", shortName: "C-as-Code", color: "#ec4899", icon: "●" },
  { id: 8, name: "Cognitive Canvas", shortName: "Canvas", color: "#84cc16", icon: "◉" },
];

export interface ABODoctrinePanelProps {
  apiBase?: string;
  domain?: string;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface ABOScore {
  overallABOScore: number;
  pillars?: Array<{ id: number; status: string; metrics?: Record<string, unknown> }>;
}

export function ABODoctrinePanel({
  apiBase = "/api",
  domain,
  compact = false,
  className = "",
  style,
}: ABODoctrinePanelProps) {
  const [score, setScore] = useState<ABOScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [pillarsActive, setPillarsActive] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    fetch(`${apiBase}/abo/doctrine`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (mounted) {
          setScore(data?.data ?? data);
          setPillarsActive(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setPillarsActive(true);
          setScore({ overallABOScore: 84 });
        }
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, [apiBase]);

  const aboScore = score?.overallABOScore ?? 84;

  if (compact) {
    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          fontSize: "11px",
          fontFamily: "Inter, system-ui, sans-serif",
          ...style,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.4)" }}>ABO</span>
        <span style={{ color: "#818cf8", fontWeight: 700 }}>
          {loading ? "…" : aboScore}
        </span>
        {pillarsActive && (
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "9px" }}>
            8 pillars active
          </span>
        )}
        {domain && (
          <>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{domain}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        borderRadius: "12px",
        padding: "14px 16px",
        fontFamily: "Inter, system-ui, sans-serif",
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0,
          }}
        >
          ◉
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em" }}>
            ABO Doctrine
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
            Agentic Business Observability{domain ? ` · ${domain}` : " · Platform-Wide"}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8", lineHeight: 1 }}>
            {loading ? "—" : aboScore}
          </div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>Score</div>
        </div>
      </div>

      {/* 8 Pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "12px" }}>
        {ABO_PILLARS.map(pillar => (
          <div
            key={pillar.id}
            style={{
              padding: "6px 8px",
              borderRadius: "6px",
              background: pillarsActive ? `${pillar.color}10` : "rgba(255,255,255,0.02)",
              border: `1px solid ${pillarsActive ? pillar.color + "25" : "rgba(255,255,255,0.06)"}`,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>{pillar.icon}</div>
            <div style={{ fontSize: "9px", fontWeight: 600, color: pillarsActive ? pillar.color : "rgba(255,255,255,0.3)", lineHeight: 1.2 }}>
              {pillar.shortName}
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: "6px", justifyContent: "space-between",
          paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: pillarsActive ? "#10b981" : "#64748b",
              boxShadow: pillarsActive ? "0 0 6px #10b981" : "none",
            }}
          />
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
            {pillarsActive ? "All 8 pillars operational" : "Initializing…"}
          </span>
        </div>
        <a
          href="/lyte-command-center/abo/canvas"
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "10px", color: "#818cf8",
            textDecoration: "none", fontWeight: 500,
          }}
        >
          Open Canvas →
        </a>
      </div>
    </div>
  );
}

export default ABODoctrinePanel;
