import { useState } from "react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  DollarSign, TrendingUp, Users, BarChart3, Activity,
  ArrowUpRight, ChevronRight, Zap, Target, Star,
} from "lucide-react";

const ACC = "hsl(191,92%,44%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,38%)";

const ARR_DATA = [
  { month: "Oct 25", arr: 290 },
  { month: "Nov 25", arr: 338 },
  { month: "Dec 25", arr: 381 },
  { month: "Jan 26", arr: 418 },
  { month: "Feb 26", arr: 456 },
  { month: "Mar 26", arr: 488 },
  { month: "Apr 26", arr: 511 },
];

const COHORTS = [
  { cohort: "Q3 2025", size: 42, m1: 100, m3: 98, m6: 94, m9: 92, nrr: "128%" },
  { cohort: "Q4 2025", size: 67, m1: 100, m3: 97, m6: 91, m9: null, nrr: "119%" },
  { cohort: "Q1 2026", size: 89, m1: 100, m3: 98, m6: null, m9: null, nrr: "Est. 122%" },
];

const METRICS = [
  { label: "Combined ARR", value: "$511K", trend: "+21%", trendDir: "up", sub: "Month over month", color: ACC },
  { label: "Platform NRR", value: "124%", trend: "+8pts", trendDir: "up", sub: "vs. 116% six months ago", color: "#4ade80" },
  { label: "Active Users", value: "9,486", trend: "+18%", trendDir: "up", sub: "Across all 6 products", color: "#a78bfa" },
  { label: "Avg Payback Period", value: "8 mo", trend: "-2mo", trendDir: "up", sub: "vs. 10mo six months ago", color: "#fbbf24" },
  { label: "Gross Margin", value: "82%", trend: "+3pts", trendDir: "up", sub: "Shared infra leverage", color: "#34d399" },
  { label: "Infrastructure Cost", value: "$12K/mo", trend: "+4%", trendDir: "neutral", sub: "All 6 products combined", color: TEXT_SEC },
];

const UNIT_ECONOMICS = [
  { label: "Average ACV", value: "$54K", bench: "SaaS benchmark: $45K", green: true },
  { label: "CAC", value: "$8,200", bench: "SaaS benchmark: $12,000", green: true },
  { label: "LTV", value: "$312K", bench: "LTV:CAC ratio: 38x", green: true },
  { label: "LTV:CAC", value: "38x", bench: "Top decile > 20x", green: true },
  { label: "Expansion Revenue %", value: "34%", bench: "Of new ARR comes from existing customers", green: true },
  { label: "Churn (Gross)", value: "2.1%", bench: "Annual. SaaS benchmark: 5–8%", green: true },
];

function MiniChart({ data }: { data: typeof ARR_DATA }) {
  const max = Math.max(...data.map(d => d.arr));
  const min = Math.min(...data.map(d => d.arr));
  const range = max - min;
  const w = 100, h = 60;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.arr - min) / range) * (h - 8) - 4}`).join(" ");
  const areaBottom = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="arr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACC} stopOpacity="0.18" />
          <stop offset="100%" stopColor={ACC} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaBottom} fill="url(#arr-grad)" />
      <polyline points={pts} fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CohortCell({ value, baseline }: { value: number | null; baseline: number }) {
  if (value === null) return <td style={{ padding: "8px 10px", textAlign: "center", color: TEXT_MUT, fontSize: 11 }}>—</td>;
  const pct = (value / baseline) * 100;
  const color = pct >= 95 ? "#4ade80" : pct >= 88 ? ACC : "#f87171";
  return (
    <td style={{ padding: "8px 10px", textAlign: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}%</span>
    </td>
  );
}

export default function RevenueMetrics() {
  const [activeTab, setActiveTab] = useState<"arr" | "cohort" | "unit">("arr");

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)" }}>
      <SiteNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <BarChart3 size={16} style={{ color: ACC }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACC, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Revenue & Growth Metrics
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: TEXT_PRIMARY, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
            Investor Growth Dashboard
          </h1>
          <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0 }}>
            ARR projections, cohort retention, expansion revenue, and unit economics — presented for sophisticated investors.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
          {METRICS.map((metric, i) => (
            <m.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}
            >
              <p style={{ fontSize: 24, fontWeight: 800, color: metric.color, margin: "0 0 2px", letterSpacing: "-0.04em" }}>{metric.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_PRIMARY }}>{metric.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: metric.trendDir === "up" ? "#4ade80" : metric.trendDir === "neutral" ? TEXT_MUT : "#f87171",
                }}>{metric.trend}</span>
              </div>
              <p style={{ fontSize: 10, color: TEXT_MUT, margin: 0 }}>{metric.sub}</p>
            </m.div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
          {(["arr", "cohort", "unit"] as const).map(tab => {
            const label = tab === "arr" ? "ARR Trajectory" : tab === "cohort" ? "Cohort Retention" : "Unit Economics";
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "8px 16px", fontSize: 12, fontWeight: 500, border: "none", background: "none", cursor: "pointer",
                color: activeTab === tab ? ACC : TEXT_MUT,
                borderBottom: `2px solid ${activeTab === tab ? ACC : "transparent"}`,
              }}>{label}</button>
            );
          })}
        </div>

        {activeTab === "arr" && (
          <div>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>Combined ARR — 7 Month Trajectory</p>
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>+76% in 7 months</span>
              </div>
              <div style={{ height: 120 }}>
                <MiniChart data={ARR_DATA} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {ARR_DATA.map(d => (
                  <div key={d.month} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: TEXT_MUT, margin: "0 0 2px" }}>{d.month}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>${d.arr}K</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 12px" }}>ARR by Product</p>
                {[
                  { name: "Terra", arr: 143, color: "#a07848" },
                  { name: "Vessels", arr: 118, color: "#38bdf8" },
                  { name: "PRISM Counsel", arr: 96, color: "#d4a054" },
                  { name: "Aegis", arr: 74, color: "#f87171" },
                  { name: "Lyte", arr: 52, color: "#d4a054" },
                  { name: "Carlota Jo", arr: 28, color: "#c4aa7e" },
                ].map(p => (
                  <div key={p.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: TEXT_SEC }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: p.color }}>${p.arr}K</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.arr / 143) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        style={{ height: "100%", background: p.color, borderRadius: 2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 12px" }}>12-Month ARR Projection</p>
                {[
                  { scenario: "Base Case", arr: "$820K", color: ACC },
                  { scenario: "Upside", arr: "$1.1M", color: "#4ade80" },
                  { scenario: "Conservative", arr: "$660K", color: TEXT_SEC },
                ].map(s => (
                  <div key={s.scenario} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: TEXT_SEC }}>{s.scenario}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: s.color, letterSpacing: "-0.03em" }}>{s.arr}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", background: `${ACC}08`, border: `1px solid ${ACC}18`, borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: TEXT_SEC, margin: 0 }}>Base case assumes current MoM growth rates moderate to 12% avg over next 12 months as TAM penetration deepens in each vertical.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cohort" && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 16px" }}>Revenue Retention by Cohort</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Cohort", "Size", "M1", "M3", "M6", "M9", "NRR"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: TEXT_MUT, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COHORTS.map((c, i) => (
                    <tr key={c.cohort} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                      <td style={{ padding: "8px 10px", fontSize: 12, color: TEXT_PRIMARY, fontWeight: 500 }}>{c.cohort}</td>
                      <td style={{ padding: "8px 10px", fontSize: 12, color: TEXT_SEC }}>{c.size} clients</td>
                      <CohortCell value={c.m1} baseline={100} />
                      <CohortCell value={c.m3} baseline={100} />
                      <CohortCell value={c.m6} baseline={100} />
                      <CohortCell value={c.m9} baseline={100} />
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{c.nrr}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: TEXT_SEC, margin: 0 }}>
                NRR above 100% in all cohorts indicates expansion revenue (upsell, cross-sell) is outpacing any churn. The platform's cross-sell mechanics are the primary driver.
              </p>
            </div>
          </div>
        )}

        {activeTab === "unit" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {UNIT_ECONOMICS.map((u, i) => (
              <m.div
                key={u.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ background: SURFACE, border: `1px solid ${u.green ? "rgba(74,222,128,0.12)" : BORDER}`, borderRadius: 12, padding: "16px 18px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  {u.green && <ArrowUpRight size={12} style={{ color: "#4ade80" }} />}
                  <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUT, letterSpacing: "0.07em", textTransform: "uppercase" }}>{u.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: u.green ? "#4ade80" : TEXT_PRIMARY, margin: "0 0 6px", letterSpacing: "-0.04em" }}>{u.value}</p>
                <p style={{ fontSize: 11, color: TEXT_MUT, margin: 0 }}>{u.bench}</p>
              </m.div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
