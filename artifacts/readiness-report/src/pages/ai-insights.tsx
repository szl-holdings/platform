import { Shell } from "@/components/layout/shell";
import { useState } from "react";
import { Brain, TrendingUp, BarChart3, Target, Lightbulb, ArrowUpRight, ArrowDownRight, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TypewriterText, AnimatedGauge, SeverityMeter } from "@workspace/shared-ui/ai-components";

const demoBenchmarks = [
  { dimension: "Cybersecurity", szlScore: 82, industryAvg: 68, topQuartile: 85 },
  { dimension: "Cloud Infra", szlScore: 78, industryAvg: 65, topQuartile: 82 },
  { dimension: "Data Gov", szlScore: 64, industryAvg: 58, topQuartile: 78 },
  { dimension: "AI/ML", szlScore: 71, industryAvg: 52, topQuartile: 80 },
  { dimension: "Compliance", szlScore: 76, industryAvg: 70, topQuartile: 88 },
  { dimension: "Operations", szlScore: 80, industryAvg: 72, topQuartile: 86 },
];

const demoRiskPrediction = {
  predictions: [
    { factor: "Supply Chain Disruption", current: 0.22, projected30d: 0.25, projected90d: 0.18, trend: "decreasing" },
    { factor: "Regulatory Compliance Gap", current: 0.15, projected30d: 0.12, projected90d: 0.08, trend: "decreasing" },
    { factor: "Talent Shortage Risk", current: 0.35, projected30d: 0.38, projected90d: 0.42, trend: "increasing" },
    { factor: "Cyber Threat Exposure", current: 0.18, projected30d: 0.16, projected90d: 0.14, trend: "decreasing" },
  ],
};

export default function AIInsights() {
  const benchmarks = demoBenchmarks;
  const riskPrediction = demoRiskPrediction;

  const [summaryText, setSummaryText] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);

  const generateSummary = async () => {
    setSummaryText("");
    setSummaryDone(false);
    await new Promise(r => setTimeout(r, 600));
    setSummaryText("Based on current readiness metrics, SZL Holdings demonstrates strong positioning across cybersecurity (82%) and cloud infrastructure (78%) dimensions. Key areas for improvement include AI/ML maturity (+12 potential points) and data governance frameworks. Recommended actions: 1) Accelerate Zero Trust implementation, 2) Expand AI training programs, 3) Implement automated compliance scanning.");
    setSummaryDone(true);
  };

  const radarData = benchmarks.map((b) => ({
    dimension: b.dimension,
    szl: b.szlScore,
    industry: b.industryAvg,
    topQuartile: b.topQuartile,
  }));

  const trendData = [
    { month: "Jan", readiness: 62, projected: null, upper: null, lower: null },
    { month: "Feb", readiness: 65, projected: null, upper: null, lower: null },
    { month: "Mar", readiness: 71, projected: null, upper: null, lower: null },
    { month: "Apr", readiness: 74, projected: null, upper: null, lower: null },
    { month: "May", readiness: 78, projected: null, upper: null, lower: null },
    { month: "Jun", readiness: 78, projected: 78, upper: 80, lower: 76 },
    { month: "Jul", readiness: null, projected: 81, upper: 85, lower: 77 },
    { month: "Aug", readiness: null, projected: 83, upper: 88, lower: 78 },
    { month: "Sep", readiness: null, projected: 85, upper: 91, lower: 79 },
    { month: "Oct", readiness: null, projected: 87, upper: 93, lower: 81 },
    { month: "Nov", readiness: null, projected: 89, upper: 95, lower: 83 },
    { month: "Dec", readiness: null, projected: 91, upper: 97, lower: 85 },
  ];

  const recommendations = [
    { title: "Accelerate Zero Trust implementation", priority: "high", impact: "+8 points", dimension: "Cybersecurity", confidence: 92 },
    { title: "Expand AI/ML training programs for engineering teams", priority: "high", impact: "+12 points", dimension: "AI/ML Maturity", confidence: 87 },
    { title: "Implement automated compliance scanning pipeline", priority: "medium", impact: "+6 points", dimension: "Compliance", confidence: 84 },
    { title: "Deploy edge computing nodes in APAC region", priority: "medium", impact: "+5 points", dimension: "Cloud Infrastructure", confidence: 79 },
    { title: "Establish data lineage tracking across all systems", priority: "low", impact: "+3 points", dimension: "Data Governance", confidence: 75 },
  ];

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              <Brain className="w-10 h-10 text-primary" /> AI-Powered Insights
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Risk predictions, industry benchmarks, and intelligent recommendations.</p>
          </div>
          <button
            onClick={generateSummary}
            className="text-sm px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Generate Executive Summary
          </button>
        </header>

        {summaryText && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" /> AI Executive Summary
            </h3>
            <div className="bg-black/20 rounded-xl p-5 border border-white/5">
              {summaryDone ? (
                <TypewriterText text={summaryText} speed={12} className="text-sm text-slate-300 leading-relaxed" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Generating executive summary...
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {benchmarks.slice(0, 4).map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel rounded-2xl p-4 flex flex-col items-center">
              <AnimatedGauge
                value={b.szlScore}
                color={b.szlScore >= b.topQuartile ? "emerald" : b.szlScore >= b.industryAvg ? "cyan" : "orange"}
                size={90}
                label={b.dimension}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Industry Benchmark Comparison
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <Radar name="Industry Avg" dataKey="industry" stroke="rgba(148, 163, 184, 0.6)" fill="rgba(148, 163, 184, 0.1)" />
                  <Radar name="Top Quartile" dataKey="topQuartile" stroke="rgba(99, 102, 241, 0.6)" fill="rgba(99, 102, 241, 0.1)" />
                  <Radar name="SZL Score" dataKey="szl" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Readiness Trajectory with Confidence Bands
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} domain={[50, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="upper" name="Upper Bound" stroke="rgba(16, 185, 129, 0.3)" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="lower" name="Lower Bound" stroke="rgba(16, 185, 129, 0.3)" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="readiness" name="Actual" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="projected" name="AI Projected" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="8 4" dot={{ fill: 'hsl(var(--success))', r: 3 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5 glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" /> AI Risk Predictions
            </h3>
            <div className="space-y-3">
              {riskPrediction.predictions.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{p.factor}</span>
                    <span className={`text-xs flex items-center gap-1 ${p.trend === "increasing" ? "text-red-400" : p.trend === "decreasing" ? "text-emerald-400" : "text-slate-400"}`}>
                      {p.trend === "increasing" ? <ArrowUpRight className="w-3 h-3" /> : p.trend === "decreasing" ? <ArrowDownRight className="w-3 h-3" /> : null}
                      {p.trend}
                    </span>
                  </div>
                  <SeverityMeter
                    level={p.current > 0.3 ? "critical" : p.current > 0.15 ? "high" : "low"}
                    score={Math.round(p.current * 100)}
                    label="Current"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div><span className="block text-muted-foreground">30-day</span><span className="font-bold text-white">{(p.projected30d * 100).toFixed(0)}%</span></div>
                    <div><span className="block text-muted-foreground">90-day</span><span className="font-bold text-white">{(p.projected90d * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-7 glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" /> AI Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all hover:bg-white/5 cursor-pointer ${rec.priority === "high" ? "border-primary/20 bg-primary/5" : "border-white/5 bg-white/[0.02]"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Dimension: {rec.dimension}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">{rec.impact}</span>
                      <div className="mt-1">
                        <SeverityMeter level={rec.confidence >= 85 ? "low" : "medium"} score={rec.confidence} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${rec.priority === "high" ? "bg-red-500/10 text-red-400" : rec.priority === "medium" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>{rec.priority} priority</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
