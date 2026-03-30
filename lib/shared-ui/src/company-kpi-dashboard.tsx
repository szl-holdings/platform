import React, { useState } from "react";

export interface CompanyKPI {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  target?: string | number;
  trend: number[];
  status: "on-track" | "at-risk" | "critical" | "exceeded";
  change?: number;
  changeLabel?: string;
  lane: "company" | "platform" | "security" | "maritime" | "advisory";
  description?: string;
}

const STATUS_COLORS: Record<CompanyKPI["status"], { text: string; bg: string; border: string }> = {
  "on-track": {
    text: "hsl(152 50% 55%)",
    bg: "hsla(152 50% 42% / 0.12)",
    border: "hsla(152 50% 42% / 0.28)",
  },
  exceeded: {
    text: "hsl(215 80% 68%)",
    bg: "hsla(215 80% 58% / 0.12)",
    border: "hsla(215 80% 58% / 0.28)",
  },
  "at-risk": {
    text: "hsl(42 80% 63%)",
    bg: "hsla(42 80% 50% / 0.12)",
    border: "hsla(42 80% 50% / 0.28)",
  },
  critical: {
    text: "hsl(0 62% 64%)",
    bg: "hsla(0 62% 52% / 0.12)",
    border: "hsla(0 62% 52% / 0.28)",
  },
};

const LANE_COLORS: Record<string, string> = {
  company: "#94a3b8",
  platform: "#60a5fa",
  security: "#f87171",
  maritime: "#38bdf8",
  advisory: "#f9a8d4",
};

const LANE_LABELS: Record<string, string> = {
  company: "Company-Wide",
  platform: "Core Platform",
  security: "Security",
  maritime: "Maritime",
  advisory: "Advisory",
};

export const DEMO_COMPANY_KPIS: CompanyKPI[] = [
  {
    id: "time-to-insight",
    name: "Time to Insight",
    value: "4.2s",
    target: "<5s",
    trend: [8.1, 7.4, 6.8, 5.9, 5.2, 4.8, 4.2],
    status: "on-track",
    change: -48,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Average time from data ingestion to actionable signal surface",
  },
  {
    id: "time-to-action",
    name: "Time to Action",
    value: "11m",
    target: "<15m",
    trend: [28, 24, 21, 18, 15, 13, 11],
    status: "on-track",
    change: -61,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Average time from insight generation to workflow initiated",
  },
  {
    id: "time-to-resolution",
    name: "Time to Resolution",
    value: "2.8h",
    target: "<3h",
    trend: [6.4, 5.8, 4.9, 4.1, 3.6, 3.2, 2.8],
    status: "on-track",
    change: -56,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Mean time from exception detected to case fully resolved",
  },
  {
    id: "workflow-latency",
    name: "Workflow Latency",
    value: "320ms",
    target: "<500ms",
    trend: [820, 710, 640, 530, 450, 390, 320],
    status: "on-track",
    change: -61,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "P95 end-to-end workflow execution latency across Alloy",
  },
  {
    id: "approval-latency",
    name: "Approval Latency",
    value: "22m",
    target: "<30m",
    trend: [68, 58, 50, 42, 35, 28, 22],
    status: "on-track",
    change: -68,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Average time for human-in-the-loop approval tasks in Lyte",
  },
  {
    id: "exception-rate",
    name: "Exception Rate",
    value: "3.4%",
    target: "<5%",
    trend: [8.2, 7.1, 6.3, 5.4, 4.8, 4.1, 3.4],
    status: "on-track",
    change: -59,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Percentage of workflows requiring escalation or exception handling",
  },
  {
    id: "automation-success",
    name: "Automation Success Rate",
    value: "94.7%",
    target: ">90%",
    trend: [78, 81, 85, 88, 91, 93, 94.7],
    status: "exceeded",
    change: +21.4,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Percentage of automated actions completing without human intervention",
  },
  {
    id: "recommendation-adoption",
    name: "Recommendation Adoption",
    value: "71%",
    target: ">65%",
    trend: [42, 48, 54, 59, 64, 68, 71],
    status: "exceeded",
    change: +69,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Confidence-weighted adoption rate of AI-generated recommendations",
  },
  {
    id: "value-recovered",
    name: "Value Recovered",
    value: "$4.2M",
    target: ">$3M/mo",
    trend: [1.2, 1.8, 2.3, 2.9, 3.4, 3.8, 4.2],
    status: "exceeded",
    change: +250,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Monthly value recovered through automated exception resolution",
  },
  {
    id: "risk-prevented",
    name: "Risk Prevented",
    value: "$18.7M",
    target: ">$12M/mo",
    trend: [8.2, 10.1, 12.4, 14.8, 16.1, 17.5, 18.7],
    status: "exceeded",
    change: +128,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Estimated risk exposure prevented by predictive interventions",
  },
  {
    id: "platform-reliability",
    name: "Platform Reliability",
    value: "99.94%",
    target: ">99.9%",
    trend: [99.71, 99.78, 99.82, 99.87, 99.9, 99.92, 99.94],
    status: "exceeded",
    change: +0.23,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Combined uptime across all platform services (SLO)",
  },
  {
    id: "demo-readiness",
    name: "Demo Readiness Score",
    value: 91,
    target: ">85",
    trend: [62, 68, 74, 79, 84, 88, 91],
    status: "exceeded",
    change: +47,
    changeLabel: "vs 30d ago",
    lane: "company",
    description: "Composite score of data freshness, UI completeness, and scenario coverage",
  },
  {
    id: "fleet-readiness",
    name: "Fleet Readiness",
    value: "81%",
    target: ">80%",
    trend: [68, 71, 74, 77, 79, 80, 81],
    status: "exceeded",
    change: +19,
    changeLabel: "vs 30d ago",
    lane: "maritime",
    description: "Composite fleet operational readiness across all 10 vessels",
  },
  {
    id: "eta-accuracy",
    name: "ETA Prediction Accuracy",
    value: "93.2%",
    target: ">95%",
    trend: [84, 86, 88, 90, 91, 92, 93.2],
    status: "at-risk",
    change: +10.9,
    changeLabel: "vs 30d ago",
    lane: "maritime",
    description: "Accuracy of voyage ETA predictions vs actuals at arrival",
  },
  {
    id: "demurrage-exposure",
    name: "Demurrage Exposure",
    value: "$1.24M",
    target: "<$800K",
    trend: [580, 720, 840, 960, 1100, 1180, 1240],
    status: "critical",
    change: +114,
    changeLabel: "vs 30d ago",
    lane: "maritime",
    description: "Total port delay cost exposure across active voyages",
  },
  {
    id: "security-posture",
    name: "Security Posture Score",
    value: 78,
    target: ">85",
    trend: [58, 62, 66, 70, 73, 76, 78],
    status: "at-risk",
    change: +34.5,
    changeLabel: "vs 30d ago",
    lane: "security",
    description: "Composite security posture index across Firestorm & Rosie",
  },
  {
    id: "threat-d2c",
    name: "Detection-to-Containment",
    value: "8.4m",
    target: "<10m",
    trend: [28, 24, 20, 16, 13, 11, 8.4],
    status: "on-track",
    change: -70,
    changeLabel: "vs 30d ago",
    lane: "security",
    description: "Average time to contain threats from first detection signal",
  },
  {
    id: "ai-model-accuracy",
    name: "AI Model Accuracy",
    value: "91.8%",
    target: ">88%",
    trend: [82, 85, 87, 89, 90, 91, 91.8],
    status: "exceeded",
    change: +12,
    changeLabel: "vs 30d ago",
    lane: "advisory",
    description: "Weighted average accuracy across INCA production AI models",
  },
  {
    id: "client-engagement",
    name: "Client Engagement Score",
    value: 87,
    target: ">80",
    trend: [62, 67, 72, 76, 80, 84, 87],
    status: "exceeded",
    change: +40,
    changeLabel: "vs 30d ago",
    lane: "advisory",
    description: "Advisory platform engagement score from Carlota Jo & Career",
  },
];

function Sparkline({ data, color, width = 64, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="2.5"
        fill={color}
        opacity="1"
      />
    </svg>
  );
}

function KPICard({ kpi }: { kpi: CompanyKPI }) {
  const s = STATUS_COLORS[kpi.status];
  const isPositiveChange = (kpi.change ?? 0) > 0;
  const isGoodChange = kpi.id.includes("success") || kpi.id.includes("accuracy") || kpi.id.includes("adoption") || kpi.id.includes("recovered") || kpi.id.includes("prevented") || kpi.id.includes("reliability") || kpi.id.includes("readiness") || kpi.id.includes("engagement") || kpi.id.includes("readiness");
  const changeGood = isGoodChange ? isPositiveChange : !isPositiveChange;

  return (
    <div
      style={{
        background: "hsla(210 12% 10% / 0.55)",
        border: `1px solid ${s.border}`,
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: s.text,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.3,
          }}
        >
          {kpi.name}
        </div>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: s.text,
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: "4px",
            padding: "2px 5px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {kpi.status.replace("-", " ")}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: s.text,
              fontFamily: "Inter, system-ui, sans-serif",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {kpi.value}
          </div>
          {kpi.target && (
            <div
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "Inter, system-ui, sans-serif",
                marginTop: "2px",
              }}
            >
              target {kpi.target}
            </div>
          )}
        </div>
        <Sparkline data={kpi.trend} color={s.text} />
      </div>

      {kpi.change !== undefined && (
        <div
          style={{
            fontSize: "10px",
            color: changeGood ? "hsl(152 50% 52%)" : "hsl(0 62% 58%)",
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <span>{changeGood ? "▲" : "▼"}</span>
          <span>{Math.abs(kpi.change ?? 0)}% {kpi.changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export interface CompanyKPIDashboardProps {
  kpis?: CompanyKPI[];
  title?: string;
  subtitle?: string;
  showLaneFilter?: boolean;
  compact?: boolean;
}

export function CompanyKPIDashboard({
  kpis = DEMO_COMPANY_KPIS,
  title = "Company KPI Dashboard",
  subtitle = "Doctrine-aligned performance metrics across all platform lanes",
  showLaneFilter = true,
  compact = false,
}: CompanyKPIDashboardProps) {
  const [activeLane, setActiveLane] = useState<string>("company");

  const lanes = ["company", "platform", "security", "maritime", "advisory"];
  const filtered = kpis.filter((k) => activeLane === "all" ? true : k.lane === activeLane);

  const summary = {
    total: kpis.length,
    onTrack: kpis.filter((k) => k.status === "on-track" || k.status === "exceeded").length,
    atRisk: kpis.filter((k) => k.status === "at-risk").length,
    critical: kpis.filter((k) => k.status === "critical").length,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: compact ? "16px" : "20px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.92)",
                letterSpacing: "-0.01em",
                marginBottom: "4px",
              }}
            >
              {title}
            </div>
            {!compact && (
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "On Track / Exceeded", count: summary.onTrack, color: "hsl(152 50% 55%)" },
              { label: "At Risk", count: summary.atRisk, color: "hsl(42 80% 63%)" },
              { label: "Critical", count: summary.critical, color: "hsl(0 62% 64%)" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLaneFilter && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {lanes.map((lane) => {
            const active = activeLane === lane;
            const color = LANE_COLORS[lane];
            const count = kpis.filter((k) => k.lane === lane).length;
            return (
              <button
                key={lane}
                onClick={() => setActiveLane(lane)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  background: active ? `${color}18` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  color: active ? color : "rgba(255,255,255,0.55)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                {LANE_LABELS[lane]}
                <span
                  style={{
                    background: active ? `${color}30` : "rgba(255,255,255,0.08)",
                    borderRadius: "999px",
                    padding: "0 5px",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: active ? color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact
            ? "repeat(auto-fill, minmax(180px, 1fr))"
            : "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {filtered.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}
