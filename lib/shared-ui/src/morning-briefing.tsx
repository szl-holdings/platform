import React, { useState } from "react";
import { typography } from "./tokens";

export interface BriefingSignal {
  domain: "vessels" | "terra" | "aegis" | "szl" | "carlota" | "lyte";
  title: string;
  summary: string;
  metric?: string;
  trend?: "up" | "down" | "flat";
  severity?: "critical" | "high" | "medium" | "low";
  href?: string;
}

export interface DailyBriefing {
  id: string;
  date: string;
  generatedAt: string;
  headline: string;
  narrative: string;
  signals: BriefingSignal[];
  portfolioNav?: number;
  navChange?: number;
  activeAlerts?: number;
  pendingDeadlines?: number;
}

const DOMAIN_META: Record<string, { icon: string; label: string; color: string }> = {
  vessels: { icon: "⚓", label: "Vessels", color: "#0ea5e9" },
  terra: { icon: "⬢", label: "Terra", color: "#22c55e" },
  aegis: { icon: "🛡", label: "Aegis", color: "#ef4444" },
  prism: { icon: "⚖", label: "PRISM", color: "#a855f7" },
  szl: { icon: "◆", label: "Portfolio", color: "#f59e0b" },
  carlota: { icon: "◈", label: "Carlota Jo", color: "#ec4899" },
  lyte: { icon: "⚡", label: "Lyte", color: "#06b6d4" },
};

function generateDemoBriefing(date: Date): DailyBriefing {
  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const d = date.getDate();

  return {
    id: `briefing-${date.toISOString().split("T")[0]}`,
    date: dateStr,
    generatedAt: date.toISOString(),
    headline: "3 critical signals overnight. Portfolio NAV up 1.2%. Settlement deadline in 48h.",
    narrative: `Good morning. CORTEX has aggregated overnight intelligence across all domains. Vessels flagged 3 diversions near monitored corridors. Terra identified 2 distressed properties in your watchlist markets. PRISM has a settlement deadline approaching for case #P-2024-187. Portfolio NAV closed at $284.2M, up 1.2% driven by maritime yield expansion.`,
    portfolioNav: 284.2,
    navChange: 1.2,
    activeAlerts: 47,
    pendingDeadlines: 2,
    signals: [
      {
        domain: "vessels",
        title: "3 Vessels Diverted Near Monitored Corridors",
        summary: "MV Poseidon, MV Argo, and MV Triton changed course within 24h. Poseidon now 12nm from Bandar Abbas.",
        metric: "3 diversions",
        trend: "down",
        severity: "high",
        href: "/vessels/",
      },
      {
        domain: "terra",
        title: "2 Distressed Properties in Watchlist Markets",
        summary: "Miami Beach commercial listing at 34% below market. Austin industrial park showing 60-day DOM.",
        metric: "$4.2M combined",
        trend: "down",
        severity: "medium",
        href: "/terra/",
      },
      {
        domain: "szl",
        title: `Portfolio NAV Up ${(d % 3 === 0 ? 1.2 : d % 3 === 1 ? 0.8 : 1.5).toFixed(1)}%`,
        summary: "Maritime segment leads with 3.1% yield expansion. Real estate holdings stable. Venture positions unchanged.",
        metric: "$284.2M NAV",
        trend: "up",
        severity: "low",
        href: "/",
      },
      {
        domain: "aegis",
        title: "47 Active Alerts — 3 Critical",
        summary: "MITRE T1190 pattern detected on perimeter. 2 identity anomalies in SOC queue. Sacsayhuaman Shield holding.",
        metric: "3 critical",
        trend: "flat",
        severity: "high",
        href: "/firestorm/",
      },
      {
        domain: "lyte",
        title: "API Latency Elevated Across 2 Services",
        summary: "PRISM Counsel API p95 at 340ms (+22%). Terra data pipeline processing delay of 8min vs 3min baseline.",
        metric: "p95: 340ms",
        trend: "down",
        severity: "medium",
        href: "/lyte-command-center/",
      },
    ],
  };
}

export const DEMO_BRIEFING_HISTORY: DailyBriefing[] = [0, 1, 2, 3, 4].map((daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return generateDemoBriefing(d);
});

function TrendArrow({ trend, severity }: { trend?: "up" | "down" | "flat"; severity?: string }) {
  const color =
    severity === "critical" ? "#ef4444" :
    severity === "high" ? "#f97316" :
    severity === "medium" ? "#f59e0b" :
    "#22c55e";

  return (
    <span style={{ color, fontSize: "12px", fontWeight: 700 }}>
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
    </span>
  );
}

interface MorningBriefingCardProps {
  briefing: DailyBriefing;
  compact?: boolean;
  accentColor?: string;
}

export function MorningBriefingCard({ briefing, compact = false, accentColor = "#8b7ac8" }: MorningBriefingCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${accentColor}25`,
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: typography.fontFamily.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: compact ? "14px 18px" : "18px 22px",
          background: `linear-gradient(135deg, ${accentColor}15, transparent)`,
          borderBottom: `1px solid ${accentColor}15`,
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          cursor: compact ? "pointer" : "default",
        }}
        onClick={compact ? () => setExpanded((v) => !v) : undefined}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          ☀
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              CORTEX Morning Briefing
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "4px",
                padding: "1px 6px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {briefing.date}
            </span>
          </div>
          <div style={{ fontSize: compact ? "13px" : "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
            {briefing.headline}
          </div>
        </div>
        {compact && (
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* KPI Strip */}
      {(!compact || expanded) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { label: "Portfolio NAV", value: `$${briefing.portfolioNav}M`, sub: `${briefing.navChange && briefing.navChange > 0 ? "+" : ""}${briefing.navChange}% today`, color: "#22c55e" },
            { label: "Active Alerts", value: String(briefing.activeAlerts ?? 0), sub: "across all domains", color: briefing.activeAlerts && briefing.activeAlerts > 20 ? "#ef4444" : "#f59e0b" },
            { label: "Pending Deadlines", value: String(briefing.pendingDeadlines ?? 0), sub: "require attention", color: briefing.pendingDeadlines && briefing.pendingDeadlines > 0 ? "#f97316" : "#22c55e" },
            { label: "Domains", value: `${briefing.signals.length}`, sub: "signals aggregated", color: accentColor },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                padding: "12px 16px",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Narrative */}
      {(!compact || expanded) && (
        <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
            "{briefing.narrative}"
          </p>
        </div>
      )}

      {/* Signals */}
      {(!compact || expanded) && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {briefing.signals.map((signal, i) => {
            const meta = DOMAIN_META[signal.domain];
            if (!meta) return null;
            const severityColor =
              signal.severity === "critical" ? "#ef4444" :
              signal.severity === "high" ? "#f97316" :
              signal.severity === "medium" ? "#f59e0b" :
              "#22c55e";
            return (
              <a
                key={i}
                href={signal.href ?? "#"}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "13px 22px",
                  borderBottom: i < briefing.signals.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: `${meta.color}15`,
                    border: `1px solid ${meta.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "10px", color: meta.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {meta.label}
                    </span>
                    {signal.severity && signal.severity !== "low" && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: severityColor,
                          background: `${severityColor}15`,
                          border: `1px solid ${severityColor}30`,
                          borderRadius: "4px",
                          padding: "1px 5px",
                          textTransform: "uppercase",
                        }}
                      >
                        {signal.severity}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>
                    {signal.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    {signal.summary}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {signal.metric && (
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
                      {signal.metric}
                    </div>
                  )}
                  <TrendArrow trend={signal.trend} severity={signal.severity} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface BriefingHistoryProps {
  briefings?: DailyBriefing[];
  accentColor?: string;
}

export function BriefingHistory({ briefings = DEMO_BRIEFING_HISTORY, accentColor = "#8b7ac8" }: BriefingHistoryProps) {
  const [selected, setSelected] = useState(0);

  const current = briefings[selected];

  return (
    <div style={{ display: "flex", gap: "20px", fontFamily: typography.fontFamily.body, minHeight: "400px" }}>
      <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", padding: "0 4px" }}>
          Briefing History
        </div>
        {briefings.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setSelected(i)}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: `1px solid ${selected === i ? accentColor + "50" : "rgba(255,255,255,0.07)"}`,
              background: selected === i ? `${accentColor}15` : "rgba(255,255,255,0.03)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              fontFamily: typography.fontFamily.body,
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 600, color: selected === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)" }}>
              {i === 0 ? "Today" : i === 1 ? "Yesterday" : b.date.split(",")[0]}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
              {b.signals.length} signals
            </div>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {current && <MorningBriefingCard briefing={current} accentColor={accentColor} />}
      </div>
    </div>
  );
}
