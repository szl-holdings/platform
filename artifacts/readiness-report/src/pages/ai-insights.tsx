import { Shell } from "@/components/layout/shell";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Brain, TrendingUp, BarChart3, Target, Lightbulb, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AIInsights() {
  const { data: benchmarks = [], isLoading: bLoading } = useQuery({ queryKey: ["intel-benchmarks"], queryFn: () => apiFetch<any[]>("/intelligence/benchmarks") });
  const { data: riskPrediction, isLoading: rLoading } = useQuery({ queryKey: ["intel-risk-prediction"], queryFn: () => apiFetch<any>("/intelligence/ai/risk-prediction", { method: "POST", body: JSON.stringify({ scenario: "Quarterly readiness assessment for SZL Holdings portfolio" }) }), retry: 1 });

  const isLoading = bLoading || rLoading;

  if (isLoading) {
    return <Shell><div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div></Shell>;
  }

  const radarData = benchmarks.map((b: any) => ({
    dimension: b.dimension,
    szl: b.szlScore,
    industry: b.industryAvg,
    topQuartile: b.topQuartile,
  }));

  const trendData = [
    { month: "Jan", readiness: 62, projected: null },
    { month: "Feb", readiness: 65, projected: null },
    { month: "Mar", readiness: 71, projected: null },
    { month: "Apr", readiness: 74, projected: null },
    { month: "May", readiness: 78, projected: null },
    { month: "Jun", readiness: 78, projected: 78 },
    { month: "Jul", readiness: null, projected: 81 },
    { month: "Aug", readiness: null, projected: 83 },
    { month: "Sep", readiness: null, projected: 85 },
    { month: "Oct", readiness: null, projected: 87 },
    { month: "Nov", readiness: null, projected: 89 },
    { month: "Dec", readiness: null, projected: 91 },
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
        <header>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" /> AI-Powered Insights
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Risk predictions, industry benchmarks, and intelligent recommendations.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Industry Benchmark Comparison
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarks} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="dimension" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="industryAvg" name="Industry Avg" fill="rgba(148, 163, 184, 0.5)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="topQuartile" name="Top Quartile" fill="rgba(99, 102, 241, 0.5)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="szlScore" name="SZL Score" radius={[4, 4, 0, 0]}>
                    {benchmarks.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.szlScore >= entry.topQuartile ? 'hsl(var(--success))' : entry.szlScore >= entry.industryAvg ? 'hsl(var(--primary))' : 'hsl(var(--warning))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Readiness Trajectory (AI Forecast)
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} domain={[50, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
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
            {riskPrediction?.predictions ? (
              <div className="space-y-3">
                {riskPrediction.predictions.map((p: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{p.factor}</span>
                      <span className={`text-xs flex items-center gap-1 ${p.trend === "increasing" ? "text-red-400" : p.trend === "decreasing" ? "text-emerald-400" : "text-slate-400"}`}>
                        {p.trend === "increasing" ? <ArrowUpRight className="w-3 h-3" /> : p.trend === "decreasing" ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {p.trend}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="block text-muted-foreground">Current</span><span className="font-bold text-white">{(p.current * 100).toFixed(0)}%</span></div>
                      <div><span className="block text-muted-foreground">30-day</span><span className="font-bold text-white">{(p.projected30d * 100).toFixed(0)}%</span></div>
                      <div><span className="block text-muted-foreground">90-day</span><span className="font-bold text-white">{(p.projected90d * 100).toFixed(0)}%</span></div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${p.current > 0.3 ? "bg-red-500" : p.current > 0.15 ? "bg-orange-500" : "bg-emerald-500"}`} style={{ width: `${p.current * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            )}
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">Confidence: {rec.confidence}%</p>
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
