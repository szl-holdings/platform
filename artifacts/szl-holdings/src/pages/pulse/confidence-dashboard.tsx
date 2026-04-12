import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, Shield, Ship, Activity, Bot, Star, Scale, AlertTriangle } from "lucide-react";
import { AGENT_META, confidenceColor, pulseFetch } from "./pulse-utils";

const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };
const BG = { surface: "hsla(214 12% 10% / 0.75)", card: "hsla(214 14% 6% / 0.95)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)" };
const PULSE_ACCENT = "hsl(191 92% 44%)";

type ConfidenceData = {
  overallAvg: number;
  trendSeries: Array<{ date: string; score: number; riskLevel: string }>;
  domainBreakdown: Array<{ domain: string; avgScore: number; trend: string; dataPoints: number; latestScore: number }>;
  agentBreakdown: Array<{ agentId: string; agentName: string; domain: string; avgConfidence: number; briefCount: number }>;
  rubric: Array<{ dimension: string; weight: number; description: string }>;
  confidenceLevels: Array<{ label: string; min: number; max: number; description: string }>;
  totalBriefs: number;
  totalDissents: number;
};

function TrendIndicator({ trend }: { trend: string }) {
  if (trend === "increasing") return <TrendingUp size={14} style={{ color: "hsl(160 65% 48%)" }} />;
  if (trend === "decreasing") return <TrendingDown size={14} style={{ color: "hsl(2 70% 55%)" }} />;
  return <Minus size={14} style={{ color: "hsl(45 85% 52%)" }} />;
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.125rem 1.25rem" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? TEXT.primary, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TEXT.muted, marginTop: "0.375rem" }}>{sub}</div>}
    </div>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  background: "hsl(214 14% 6%)", border: "1px solid hsla(0 0% 100% / 0.08)",
  borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: 12, color: "hsl(38 8% 95%)",
};

export default function ConfidenceDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pulse-confidence"],
    queryFn: () => pulseFetch<ConfidenceData>("/pulse/confidence"),
  });

  const conf: ConfidenceData | null = data ?? null;

  if (isLoading || !conf) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 180, borderRadius: 10, background: "hsla(214 12% 10% / 0.5)" }} />)}
      </div>
    );
  }

  const trendData = conf.trendSeries.map(s => ({
    date: s.date.slice(5),
    score: s.score,
  }));

  const domainChartData = conf.domainBreakdown.map(d => ({
    name: d.domain.slice(0, 8),
    score: d.avgScore,
    fill: confidenceColor(d.avgScore),
  }));

  const agentChartData = conf.agentBreakdown.map(a => ({
    name: a.agentName.split(" ")[0],
    score: a.avgConfidence,
    briefs: a.briefCount,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 22, color: TEXT.primary, marginBottom: "0.375rem" }}>Confidence Dashboard</h1>
        <p style={{ fontSize: 14, color: TEXT.secondary }}>Tradecraft confidence metrics across {conf.totalBriefs} briefings</p>
      </div>

      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <MetricCard label="Overall Average" value={`${conf.overallAvg}%`} sub={`${conf.totalBriefs} briefings analyzed`} color={confidenceColor(conf.overallAvg)} />
        <MetricCard label="Total Dissents" value={conf.totalDissents} sub="Analytic challenges filed" color={conf.totalDissents > 0 ? "hsl(32 88% 62%)" : "hsl(160 65% 48%)"} />
        <MetricCard label="Domains Tracked" value={conf.domainBreakdown.length} sub="Intelligence domains" />
        <MetricCard label="Agents Active" value={conf.agentBreakdown.length} sub="Nuro Mesh contributors" color={PULSE_ACCENT} />
      </div>

      {/* Confidence trend */}
      <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: "0.25rem" }}>Confidence Trend (14 Days)</div>
        <div style={{ fontSize: 12, color: TEXT.muted, marginBottom: "1.25rem" }}>Overall intelligence confidence score over time</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PULSE_ACCENT} stopOpacity={0.25} />
                <stop offset="95%" stopColor={PULSE_ACCENT} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(0 0% 100% / 0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: TEXT.faint, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: TEXT.faint, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Confidence"]} />
            <Area type="monotone" dataKey="score" stroke={PULSE_ACCENT} strokeWidth={2} fill="url(#confGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Domain breakdown */}
        <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: "0.25rem" }}>By Domain</div>
          <div style={{ fontSize: 12, color: TEXT.muted, marginBottom: "1.25rem" }}>Average confidence per intelligence domain</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={domainChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0 0% 100% / 0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: TEXT.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: TEXT.faint, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Confidence"]} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} fill={PULSE_ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent breakdown */}
        <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: "0.25rem" }}>By Agent</div>
          <div style={{ fontSize: 12, color: TEXT.muted, marginBottom: "1rem" }}>Average confidence per Nuro Mesh agent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {conf.agentBreakdown.slice(0, 6).map(agent => {
              const meta = AGENT_META[agent.agentId];
              const color = meta?.color ?? PULSE_ACCENT;
              const pct = agent.avgConfidence;
              return (
                <div key={agent.agentId} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ width: 60, fontSize: 11, color: TEXT.secondary, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.agentName.split(" ")[0]}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "hsla(214 12% 10% / 0.7)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ width: 32, fontSize: 11, fontWeight: 700, color: confidenceColor(pct), textAlign: "right", flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Domain detail cards */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Domain Detail</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
          {conf.domainBreakdown.map(d => (
            <div key={d.domain} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, textTransform: "capitalize" }}>{d.domain}</span>
                <TrendIndicator trend={d.trend} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: confidenceColor(d.avgScore) }}>{d.avgScore}%</div>
              <div style={{ fontSize: 11, color: TEXT.muted, marginTop: "0.25rem" }}>{d.dataPoints} data points · Latest: {d.latestScore}%</div>
              <div style={{ height: 4, borderRadius: 2, background: "hsla(214 12% 10% / 0.7)", marginTop: "0.625rem", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${d.avgScore}%`, background: confidenceColor(d.avgScore), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tradecraft Rubric */}
      <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: "0.25rem" }}>Tradecraft Confidence Rubric</div>
        <div style={{ fontSize: 12, color: TEXT.muted, marginBottom: "1.125rem" }}>Five dimensions used to calibrate every claim in every briefing — CIA analytic tradecraft standard</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {conf.rubric.map(r => (
            <div key={r.dimension} style={{ display: "grid", gridTemplateColumns: "160px auto 60px", gap: "0.875rem", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>{r.dimension}</span>
              <span style={{ fontSize: 12, color: TEXT.secondary }}>{r.description}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: PULSE_ACCENT, textAlign: "right" }}>{(r.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence levels reference */}
      <div style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.875rem" }}>Confidence Reference Scale</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.625rem" }}>
          {conf.confidenceLevels.map(lvl => {
            const c = confidenceColor(lvl.max);
            return (
              <div key={lvl.label} style={{ padding: "0.875rem", borderRadius: 8, background: "hsla(214 12% 10% / 0.6)", border: `1px solid ${c}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c }}>{lvl.label}</span>
                  <span style={{ fontSize: 11, color: TEXT.muted }}>{lvl.min}–{lvl.max}%</span>
                </div>
                <p style={{ fontSize: 12, color: TEXT.secondary, lineHeight: 1.5, margin: 0 }}>{lvl.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
