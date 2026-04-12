import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingDown, TrendingUp, Activity, Zap,
  Server, Database, Cloud, ArrowUpRight, ChevronRight, BarChart3,
} from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const GOLD = "#d4a054";

interface ServiceMetric {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  monthlyCost: number;
  costTrend: number;
  p95Latency: number;
  latencyTrend: number;
  errorRate: number;
  throughput: number;
  performanceScore: number;
  costEfficiency: "overpaying" | "optimal" | "underprovisioned";
  recommendation: string;
  projectedSaving?: number;
  weeklySpend: number[];
}

type Tab = "overview" | "recommendations";

const efficiencyConfig = {
  overpaying: { color: "#f87171", label: "Overpaying", bg: "rgba(248,113,113,0.08)" },
  optimal: { color: "#34d399", label: "Optimal", bg: "rgba(52,211,153,0.08)" },
  underprovisioned: { color: GOLD, label: "Under-provisioned", bg: "rgba(212,160,84,0.08)" },
};

const SERVICES: ServiceMetric[] = [
  {
    id: "s1", name: "Terra Search", icon: Activity, color: "#34d399",
    monthlyCost: 4820, costTrend: +18, p95Latency: 450, latencyTrend: +23,
    errorRate: 0.8, throughput: 1050, performanceScore: 42,
    costEfficiency: "overpaying",
    recommendation: "N+1 query pattern inflating both cost and latency. Deploy patch and enable query caching — estimated 60% cost reduction.",
    projectedSaving: 2890,
    weeklySpend: [3800, 3900, 4100, 4820],
  },
  {
    id: "s2", name: "Vessels Worker", icon: Server, color: "#38bdf8",
    monthlyCost: 2340, costTrend: +8, p95Latency: 120, latencyTrend: +2,
    errorRate: 0.3, throughput: 840, performanceScore: 71,
    costEfficiency: "overpaying",
    recommendation: "Memory leak causing excess pod restarts and wasted compute. Fix leak → reduce from 4 pods to 3 pods. Save ~25% monthly.",
    projectedSaving: 585,
    weeklySpend: [2200, 2250, 2300, 2340],
  },
  {
    id: "s3", name: "PostgreSQL Primary", icon: Database, color: "#60a5fa",
    monthlyCost: 1890, costTrend: +31, p95Latency: 340, latencyTrend: +40,
    errorRate: 0.1, throughput: 4200, performanceScore: 38,
    costEfficiency: "overpaying",
    recommendation: "Idle connection accumulation driving RDS compute costs. Connection timeout fix reduces idle sessions by ~70%, saving $1,200/month.",
    projectedSaving: 1200,
    weeklySpend: [1400, 1600, 1750, 1890],
  },
  {
    id: "s4", name: "Aegis API Gateway", icon: Server, color: "#f87171",
    monthlyCost: 980, costTrend: -2, p95Latency: 48, latencyTrend: -3,
    errorRate: 0.02, throughput: 2100, performanceScore: 96,
    costEfficiency: "optimal",
    recommendation: "No immediate action required. Performance and cost are well-balanced. Consider caching layer if throughput exceeds 3,000 RPS.",
    weeklySpend: [990, 985, 975, 980],
  },
  {
    id: "s5", name: "PRISM Counsel API", icon: Cloud, color: "#a78bfa",
    monthlyCost: 740, costTrend: -5, p95Latency: 92, latencyTrend: -8,
    errorRate: 0.04, throughput: 560, performanceScore: 88,
    costEfficiency: "optimal",
    recommendation: "Well optimized. Latency trending down, cost stable. No action needed.",
    weeklySpend: [760, 750, 745, 740],
  },
  {
    id: "s6", name: "Lyte Ingest", icon: Zap, color: GOLD,
    monthlyCost: 1560, costTrend: +42, p95Latency: 88, latencyTrend: +1,
    errorRate: 0.06, throughput: 6800, performanceScore: 83,
    costEfficiency: "underprovisioned",
    recommendation: "High throughput growth (+42% MoM) with static provisioning. Current instance class will saturate by EOQ. Upgrade now to prevent performance cliff.",
    projectedSaving: -320,
    weeklySpend: [1100, 1250, 1420, 1560],
  },
];

const totalMonthly = SERVICES.reduce((acc, s) => acc + s.monthlyCost, 0);
const totalProjectedSaving = SERVICES.reduce((acc, s) => acc + (s.projectedSaving ?? 0), 0);

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28, w = 80;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / range) * h} r="2" fill={color} />
      ))}
    </svg>
  );
}

function ServiceRow({ svc }: { svc: ServiceMetric }) {
  const eff = efficiencyConfig[svc.costEfficiency];
  const Icon = svc.icon;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px 100px 80px 90px 90px 100px 80px 1fr",
      alignItems: "center", gap: 16,
      padding: "12px 16px",
      background: BG.surface, borderRadius: 8,
      border: `1px solid ${BORDER.subtle}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: `${svc.color}12`, border: `1px solid ${svc.color}25`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={12} style={{ color: svc.color }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT.primary }}>{svc.name}</span>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, margin: "0 0 1px" }}>${svc.monthlyCost.toLocaleString()}</p>
        <p style={{ fontSize: 10, color: svc.costTrend > 0 ? "#f87171" : "#34d399", margin: 0 }}>
          {svc.costTrend > 0 ? "+" : ""}{svc.costTrend}% MoM
        </p>
      </div>
      <Sparkline data={svc.weeklySpend} color={svc.costTrend > 10 ? "#f87171" : TEXT.muted} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: svc.latencyTrend > 15 ? "#f87171" : TEXT.primary, margin: "0 0 1px" }}>{svc.p95Latency}ms</p>
        <p style={{ fontSize: 10, color: TEXT.muted, margin: 0 }}>P95</p>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: TEXT.primary, margin: "0 0 1px" }}>{svc.errorRate}%</p>
        <p style={{ fontSize: 10, color: TEXT.muted, margin: 0 }}>Error rate</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${svc.performanceScore}%`,
            background: svc.performanceScore >= 80 ? "#34d399" : svc.performanceScore >= 60 ? GOLD : "#f87171",
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT.secondary, minWidth: 28 }}>{svc.performanceScore}</span>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        color: eff.color, background: eff.bg, padding: "2px 7px", borderRadius: 20,
        border: `1px solid ${eff.color}25`,
      }}>{eff.label}</span>
      {svc.projectedSaving !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: svc.projectedSaving > 0 ? "#34d399" : "#f87171",
        }}>
          {svc.projectedSaving > 0 ? "-$" : "+$"}{Math.abs(svc.projectedSaving).toLocaleString()}/mo
        </span>
      )}
    </div>
  );
}

export default function CostPerformance() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div style={{ padding: "20px 20px 60px", background: BG.page, minHeight: "100%", color: TEXT.primary }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BarChart3 size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Cost-Performance Optimizer
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT.primary, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Spend vs. Performance
          </h1>
          <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>
            Real-time visibility into infrastructure cost efficiency across all platform services.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Monthly Infra Spend", value: `$${totalMonthly.toLocaleString()}`, color: TEXT.primary },
            { label: "Projected Monthly Savings", value: `$${totalProjectedSaving.toLocaleString()}`, color: "#34d399" },
            { label: "Overpaying Services", value: SERVICES.filter(s => s.costEfficiency === "overpaying").length, color: "#f87171" },
            { label: "Optimization Potential", value: `${Math.round((totalProjectedSaving / totalMonthly) * 100)}%`, color: GOLD },
          ].map(stat => (
            <div key={stat.label} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.03em" }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: TEXT.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${BORDER.subtle}`, paddingBottom: 0 }}>
          {(["overview", "recommendations"] as Tab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "8px 16px", fontSize: 12, fontWeight: 500, border: "none", background: "none", cursor: "pointer",
              color: activeTab === t ? GOLD : TEXT.secondary,
              borderBottom: `2px solid ${activeTab === t ? GOLD : "transparent"}`,
              textTransform: "capitalize",
            }}>
              {t === "overview" ? "Service Overview" : "AI Recommendations"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "200px 100px 80px 90px 90px 100px 80px 1fr", gap: 16, padding: "0 16px 8px", marginBottom: 6 }}>
              {["Service", "Cost/mo", "Trend", "P95", "Errors", "Perf Score", "Status", "Saving"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SERVICES.map(svc => <ServiceRow key={svc.id} svc={svc} />)}
            </div>
          </div>
        )}

        {activeTab === "recommendations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SERVICES.filter(s => s.costEfficiency !== "optimal").map((svc, i) => {
              const eff = efficiencyConfig[svc.costEfficiency];
              const Icon = svc.icon;
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: BG.surface, border: `1px solid ${BORDER.subtle}`,
                    borderRadius: 10, padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${svc.color}12`, border: `1px solid ${svc.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} style={{ color: svc.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: TEXT.primary }}>{svc.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: eff.color, background: eff.bg, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>{eff.label}</span>
                        {svc.projectedSaving && svc.projectedSaving > 0 && (
                          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                            Save ${svc.projectedSaving.toLocaleString()}/mo
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0, lineHeight: 1.6 }}>{svc.recommendation}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ padding: "6px 10px", background: BG.elevated, borderRadius: 6, border: `1px solid ${BORDER.subtle}` }}>
                      <span style={{ fontSize: 10, color: TEXT.muted }}>Current cost: </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT.primary }}>${svc.monthlyCost.toLocaleString()}/mo</span>
                    </div>
                    {svc.projectedSaving && (
                      <div style={{ padding: "6px 10px", background: "rgba(52,211,153,0.05)", borderRadius: 6, border: "1px solid rgba(52,211,153,0.15)" }}>
                        <span style={{ fontSize: 10, color: TEXT.muted }}>Post-fix est.: </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399" }}>${(svc.monthlyCost - svc.projectedSaving).toLocaleString()}/mo</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
