import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  TrendingUp, AlertTriangle, CheckCircle, BarChart3,
  ChevronDown, ChevronUp, Target, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import { ENGAGEMENTS as STATIC_ENGAGEMENTS, MARGIN_HISTORY as STATIC_MARGIN_HISTORY } from "@/data/operationalData";
import type { EngagementPnL } from "@/data/operationalData";

const GOLD = "var(--color-gold)";
const API = import.meta.env.BASE_URL + "api";

const STATUS_META = {
  active:   { label: "Active", color: "#0284C7", bg: "#EFF6FF" },
  complete: { label: "Complete", color: "#059669", bg: "#ECFDF5" },
  "at-risk": { label: "At Risk", color: "#DC2626", bg: "#FEF2F2" },
};

const fmtGBP = (v: number) => v >= 1000 ? `£${(v / 1000).toFixed(0)}K` : `£${v}`;
const calcMargin = (rev: number, cost: number) => rev > 0 ? Math.round(((rev - cost) / rev) * 100) : 0;

export default function ProfitabilityAnalytics() {
  usePageMeta({
    title: "Engagement Profitability Analytics | Carlota Jo",
    description: "Real-time margin tracking per engagement — rate realization analysis, scope creep detection, write-off tracking, and true P&L visibility.",
    canonical: "https://szlholdings.com/carlota-jo/profitability-analytics",
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [engagements, setEngagements] = useState<EngagementPnL[]>(STATIC_ENGAGEMENTS);
  const [marginHistory, setMarginHistory] = useState<{ month: string; margin: number }[]>(STATIC_MARGIN_HISTORY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${API}/carlota/engagements`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data?.engagements) && json.data.engagements.length > 0) {
            setEngagements(json.data.engagements);
          }
          if (Array.isArray(json.data?.marginHistory) && json.data.marginHistory.length > 0) {
            setMarginHistory(json.data.marginHistory);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const totalContracted = engagements.reduce((s, e) => s + e.contractedValue, 0);
  const totalCollected = engagements.reduce((s, e) => s + e.collected, 0);
  const totalCost = engagements.reduce((s, e) => s + e.costToDate, 0);
  const overallMargin = calcMargin(totalCollected, totalCost);
  const totalWriteOffs = engagements.reduce((s, e) => s + e.writeOffs, 0);
  const totalScopeHours = engagements.reduce((s, e) => s + e.scopeCreepHours, 0);

  const WRITE_OFF_DATA = engagements.map(e => ({ name: e.client.split(" ")[0], writeOffs: e.writeOffs, scopeCreep: e.scopeCreepHours * 300 }));

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingTop: 64 }}>
      <div style={{ background: "linear-gradient(135deg, #001A0F 0%, #002E1A 50%, #001408 100%)", padding: "48px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(5,150,105,0.2)", border: "1px solid rgba(5,150,105,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={16} color="#34D399" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "#34D399", textTransform: "uppercase" }}>Engagement Profitability Analytics</span>
              {loading && <Loader2 size={14} color="#34D399" className="animate-spin" />}
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 12 }}>
              True Margins. Zero Surprises.<br /><em style={{ color: "#34D399" }}>P&L Visibility Per Engagement.</em>
            </h1>
            <p style={{ fontSize: 15, color: "#4A7A63", maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
              Real-time margin tracking with rate realization analysis, scope creep detection, and write-off monitoring — so every engagement delivers the margin it should.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, maxWidth: 900 }}>
              {[
                { label: "Portfolio Contracted", value: fmtGBP(totalContracted), sub: `${engagements.length} engagements` },
                { label: "Revenue Collected", value: fmtGBP(totalCollected), sub: "Cash received YTD" },
                { label: "Blended Margin", value: `${overallMargin}%`, sub: "vs 38% target" },
                { label: "Write-offs YTD", value: fmtGBP(totalWriteOffs), sub: `${totalScopeHours}h uncompensated` },
                { label: "Avg Rate Realisation", value: `${Math.round(engagements.reduce((s, e) => s + e.rateRealisationPct, 0) / Math.max(1, engagements.length))}%`, sub: "vs 100% target" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "#4A7A63", marginTop: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: "#2A5040", marginTop: 2 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "32px 0 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color="#059669" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>Portfolio Margin — Monthly Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={marginHistory}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} unit="%" domain={[30, 60]} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Margin"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <ReferenceLine y={38} stroke={GOLD} strokeDasharray="4 2" label={{ value: "Target 38%", fontSize: 10, fill: GOLD }} />
                <Line type="monotone" dataKey="margin" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <AlertTriangle size={16} color="#DC2626" />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>Write-offs & Uncompensated Scope</h2>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={WRITE_OFF_DATA} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                <Tooltip formatter={(v: number) => [`£${v.toLocaleString()}`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="writeOffs" name="Write-offs" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scopeCreep" name="Uncompensated scope" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Target size={16} color={GOLD} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>Engagement P&L — Real-Time</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {engagements.map((eng, i) => {
              const statusMeta = STATUS_META[eng.status];
              const currentMargin = calcMargin(eng.invoiced, eng.costToDate);
              const forecastMargin = calcMargin(eng.contractedValue, eng.forecastedCost);
              const isExpanded = expandedId === eng.id;

              return (
                <motion.div key={eng.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: "#fff", border: `1px solid ${eng.alerts.length > 0 ? "#FCA5A530" : "#E8E2D6"}`, borderRadius: 16, overflow: "hidden" }}>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "20px 24px", cursor: "pointer" }}
                    onClick={() => setExpandedId(isExpanded ? null : eng.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A14" }}>{eng.client}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: statusMeta.bg, color: statusMeta.color }}>{statusMeta.label}</span>
                        <span style={{ fontSize: 10, color: "#A89878" }}>{eng.feeType === "time-and-materials" ? "T&M" : eng.feeType === "fixed" ? "Fixed Fee" : "Retainer"}</span>
                        {eng.alerts.length > 0 && <AlertTriangle size={13} color="#DC2626" />}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B5E47", marginBottom: 8 }}>{eng.engagement} · {eng.phase}</div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#A89878" }}>Revenue progress</span>
                          <span style={{ fontSize: 11, color: "#6B5E47" }}>{fmtGBP(eng.invoiced)} of {fmtGBP(eng.contractedValue)}</span>
                        </div>
                        <div style={{ height: 6, background: "#F0EBE0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((eng.invoiced / eng.contractedValue) * 100, 100)}%`, background: GOLD, borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: currentMargin >= eng.marginTarget ? "#059669" : "#DC2626", fontFamily: "'Cormorant Garamond', serif" }}>{currentMargin}%</div>
                        <div style={{ fontSize: 9, color: "#A89878", textTransform: "uppercase" }}>Current Margin</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: forecastMargin >= eng.marginTarget ? "#059669" : "#DC2626", fontFamily: "'Cormorant Garamond', serif" }}>{forecastMargin}%</div>
                        <div style={{ fontSize: 9, color: "#A89878", textTransform: "uppercase" }}>Forecast Margin</div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} color="#A89878" /> : <ChevronDown size={16} color="#A89878" />}
                  </div>

                  {isExpanded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ borderTop: "1px solid #F0EBE0", padding: "20px 24px", background: "#FAFAF8" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                        {[
                          { label: "Contracted Value", value: fmtGBP(eng.contractedValue) },
                          { label: "Invoiced", value: fmtGBP(eng.invoiced) },
                          { label: "Collected", value: fmtGBP(eng.collected) },
                          { label: "Cost to Date", value: fmtGBP(eng.costToDate) },
                          { label: "Forecasted Cost", value: fmtGBP(eng.forecastedCost), highlight: eng.forecastedCost > eng.contractedValue },
                          { label: "Write-offs YTD", value: fmtGBP(eng.writeOffs), highlight: eng.writeOffs > 0 },
                          { label: "Rate Realisation", value: `${eng.rateRealisationPct}%`, highlight: eng.rateRealisationPct < 90 },
                          { label: "Scope Creep Hours", value: `${eng.scopeCreepHours}h`, highlight: eng.scopeCreepHours > 10 },
                        ].map(metric => (
                          <div key={metric.label} style={{ padding: "12px 14px", background: metric.highlight ? "#FEF2F2" : "#fff", border: `1px solid ${metric.highlight ? "#FCA5A530" : "#E8E2D6"}`, borderRadius: 10 }}>
                            <div style={{ fontSize: 11, color: "#A89878", marginBottom: 4 }}>{metric.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: metric.highlight ? "#DC2626" : "#1A1A14", fontFamily: "'Cormorant Garamond', serif" }}>{metric.value}</div>
                          </div>
                        ))}
                      </div>

                      {eng.alerts.length > 0 && (
                        <div>
                          {eng.alerts.map((alert, j) => (
                            <div key={j} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A530", borderRadius: 8, marginBottom: 8 }}>
                              <AlertTriangle size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                              <p style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.5, margin: 0 }}>{alert}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {eng.alerts.length === 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ECFDF5", borderRadius: 8 }}>
                          <CheckCircle size={13} color="#059669" />
                          <span style={{ fontSize: 12, color: "#065F46" }}>On track — no margin or scope alerts</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
