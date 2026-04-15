import { useState } from "react";
import { FileText, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Zap, Clock, RefreshCw, BarChart3, Server, Download, ChevronRight, Shield, Activity } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const HEALTH_TREND = [
  { day: "Mon", score: 94 },
  { day: "Tue", score: 92 },
  { day: "Wed", score: 88 },
  { day: "Thu", score: 91 },
  { day: "Fri", score: 89 },
  { day: "Sat", score: 95 },
  { day: "Sun", score: 97 },
];

const SERVICES_HEALTH = [
  { name: "API Gateway", uptime: 99.94, incidents: 0, p99: "48ms", trend: "stable" },
  { name: "Payment Service", uptime: 99.12, incidents: 2, p99: "284ms", trend: "degraded" },
  { name: "Auth Service", uptime: 99.98, incidents: 0, p99: "12ms", trend: "stable" },
  { name: "Worker Pool", uptime: 98.84, incidents: 1, p99: "—", trend: "degraded" },
  { name: "ML Engine", uptime: 99.61, incidents: 0, p99: "640ms", trend: "stable" },
];

const HIGHLIGHTS = [
  { type: "achievement", text: "P99 latency improved 34% week-over-week following API Gateway optimization deployment." },
  { type: "achievement", text: "Successful zero-downtime migration of auth service to new infrastructure. Zero customer impact." },
  { type: "issue", text: "Payment service experienced 2 brief degradations (avg 4.2 min each) due to DB connection pool exhaustion. Remediation in progress." },
  { type: "issue", text: "Worker pool memory pressure detected Thursday, triggering auto-scaling. Root cause: memory leak in queue consumer (patch deployed Fri)." },
  { type: "forecast", text: "Projected 99.97% availability next 7 days based on current incident rate and planned maintenance windows." },
  { type: "recommendation", text: "Recommend pre-emptive capacity upgrade to payment service DB pool ahead of Q2 reporting period (projected +40% load)." },
];

const HIGHLIGHT_CONFIG = {
  achievement: { icon: CheckCircle, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
  issue: { icon: AlertTriangle, color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  forecast: { icon: TrendingUp, color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  recommendation: { icon: Zap, color: "#d4a054", bg: "rgba(212,160,84,0.08)", border: "rgba(212,160,84,0.2)" },
};

export default function ExecutiveSummaryPage() {
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1800);
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#080f1c" }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,160,84,0.1)" }}>
              <FileText className="w-4.5 h-4.5" style={{ color: "#d4a054" }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Executive Summary Generator</h1>
              <p className="text-[10px] text-white/30">Business-readable operational health digest for leadership</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded text-[10px] border transition-all"
                style={{
                  borderColor: period === p ? "rgba(212,160,84,0.3)" : "rgba(255,255,255,0.08)",
                  color: period === p ? "#d4a054" : "rgba(255,255,255,0.3)",
                  background: period === p ? "rgba(212,160,84,0.08)" : "transparent",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
              style={{ borderColor: "rgba(212,160,84,0.3)", color: "#d4a054", background: "rgba(212,160,84,0.08)" }}
            >
              {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {generating ? "Generating…" : "Regenerate"}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px]" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        {/* AI-generated summary block */}
        <div className="rounded-2xl border p-6" style={{ borderColor: "rgba(212,160,84,0.15)", background: "rgba(212,160,84,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Platform Operational Summary — Last 7 Days</h2>
            <div className="flex items-center gap-1.5 text-[9px]" style={{ color: "rgba(212,160,84,0.5)" }}>
              <Clock className="w-3 h-3" />
              Generated Apr 3, 2026 at 08:00 UTC
            </div>
          </div>
          <div className="space-y-4 text-[12px] leading-relaxed text-white/60">
            <p>
              Platform availability for the trailing 7-day period was <span className="font-bold text-white">99.41%</span> — slightly below our 99.9% SLO target, driven by two payment service degradations on Wednesday and Thursday. All other services maintained full availability throughout the period.
            </p>
            <p>
              The week's primary operational highlight was the successful zero-downtime API Gateway migration, which improved P99 request latency by <span className="font-bold text-white">34%</span> (from 72ms to 48ms). This is expected to have measurable impact on checkout completion rates in Q2 reporting.
            </p>
            <p>
              Worker pool instability on Thursday was traced to a memory leak in the queue consumer introduced in the v2.14.1 release. A patch was deployed Friday without incident; monitoring shows stable memory utilization since. No data loss occurred.
            </p>
            <p>
              Our current trajectory projects <span className="font-bold text-white">99.97% availability</span> for the upcoming 7-day window assuming no new incidents. One planned maintenance window is scheduled for Tuesday 02:00–03:00 UTC (infrastructure upgrade, zero customer impact expected).
            </p>
          </div>
        </div>

        {/* Health Score */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.05)" }}>
            <p className="text-[9px] text-white/30 mb-1">Overall Health Score</p>
            <p className="text-4xl font-black font-mono text-emerald-400">92</p>
            <p className="text-[9px] text-white/30 mt-1">/100 — Good</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[9px] text-white/30 mb-1">Total Incidents</p>
            <p className="text-4xl font-black font-mono text-white">3</p>
            <p className="text-[9px] text-white/30 mt-1">vs 8 prior period (−62%)</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.05)" }}>
            <p className="text-[9px] text-white/30 mb-1">Avg Resolution Time</p>
            <p className="text-4xl font-black font-mono text-blue-400">4.2m</p>
            <p className="text-[9px] text-white/30 mt-1">vs 18.4m prior period (−77%)</p>
          </div>
        </div>

        {/* Health Trend Chart */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-[11px] font-bold text-white mb-3">Daily Health Score</h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={HEALTH_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
              <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} domain={[80, 100]} />
              <Tooltip contentStyle={{ background: "#0d1929", border: "1px solid rgba(212,160,84,0.2)", borderRadius: 8, fontSize: 11, color: "#fff" }} />
              <Area type="monotone" dataKey="score" stroke="#d4a054" fill="#d4a054" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Health Breakdown */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-[11px] font-bold text-white mb-3 flex items-center gap-2">
            <Server className="w-3.5 h-3.5" style={{ color: "#d4a054" }} /> Service Health Breakdown
          </h3>
          <div className="space-y-2">
            {SERVICES_HEALTH.map(svc => {
              const isGood = svc.uptime >= 99.9 && svc.incidents === 0;
              const color = isGood ? "#34d399" : svc.uptime >= 99 ? "#f97316" : "#ef4444";
              return (
                <div key={svc.name} className="flex items-center gap-4 p-3 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white">{svc.name}</p>
                    <p className="text-[9px] text-white/30">{svc.uptime}% uptime · {svc.incidents === 0 ? "No incidents" : `${svc.incidents} incident${svc.incidents > 1 ? "s" : ""}`}</p>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="font-mono text-white/50">{svc.p99}</p>
                    <p className="text-[8px] text-white/20">P99</p>
                  </div>
                  <div className="text-[9px] px-2 py-0.5 rounded" style={{ color, background: `${color}15` }}>
                    {svc.trend === "stable" ? "Stable" : "Degraded"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Highlights */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-[11px] font-bold text-white mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" style={{ color: "#d4a054" }} /> Key Highlights & Recommendations
          </h3>
          <div className="space-y-2">
            {HIGHLIGHTS.map((h, i) => {
              const cfg = HIGHLIGHT_CONFIG[h.type as keyof typeof HIGHLIGHT_CONFIG];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: cfg.border, background: cfg.bg }}>
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                  <p className="text-[11px] text-white/60 leading-relaxed">{h.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-white/15 pb-4">
          Generated by Lyte AIOps · All metrics derived from live telemetry · For internal distribution only
        </div>
      </div>
    </div>
  );
}
