import { useState, useEffect, useMemo } from "react";
import { Brain, FlaskConical, Cpu, Lightbulb, Activity, TrendingUp, TrendingDown, ArrowRight, Radio, Shield, Zap, ChevronUp, ChevronDown, ArrowUpDown, GitBranch, BarChart3, Layers, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { projects, experiments, models, insights, getResearchHealthScore } from "@/data/seed-data";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="uppercase tracking-wider text-emerald-400 text-[10px] font-semibold">Systems Nominal</span>
      </div>
      <span className="text-border">·</span>
      <span>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Degraded" : "Critical";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Research Health</span>
        <span className={`text-xs font-mono font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-2xl font-display font-bold ${textColor} tabular-nums`}>{score}</span>
      </div>
      <div className="flex gap-2 text-[10px] text-muted-foreground/50 font-mono">
        <span>0</span><span className="flex-1 text-center">50</span><span>100</span>
      </div>
    </div>
  );
}

type SortKey = "name" | "accuracy" | "loss" | "status" | "domain";
type SortDir = "asc" | "desc";

function ExperimentComparisonTable() {
  const [sortKey, setSortKey] = useState<SortKey>("accuracy");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "accuracy") cmp = a.accuracy - b.accuracy;
      else if (sortKey === "loss") cmp = a.loss - b.loss;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "domain") cmp = a.domain.localeCompare(b.domain);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground/30" />;
    return sortDir === "asc" ? <ChevronUp className="w-2.5 h-2.5 text-emerald-400" /> : <ChevronDown className="w-2.5 h-2.5 text-emerald-400" />;
  };

  const statusConfig: Record<string, { text: string; dot: string; label: string }> = {
    research: { text: "text-violet-400", dot: "bg-violet-400", label: "bg-violet-400/10 text-violet-400" },
    development: { text: "text-blue-400", dot: "bg-blue-400", label: "bg-blue-400/10 text-blue-400" },
    testing: { text: "text-amber-400", dot: "bg-amber-400", label: "bg-amber-400/10 text-amber-400" },
    deployed: { text: "text-emerald-400", dot: "bg-emerald-400", label: "bg-emerald-400/10 text-emerald-400" },
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          Experiments — Comparison Table
        </h3>
        <Link href="/experiments">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            All Experiments <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {[
                { key: "name" as SortKey, label: "Project" },
                { key: "domain" as SortKey, label: "Domain" },
                { key: "accuracy" as SortKey, label: "Accuracy" },
                { key: "loss" as SortKey, label: "Loss" },
                { key: "status" as SortKey, label: "Status" },
              ].map(col => (
                <th key={col.key} className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none" onClick={() => handleSort(col.key)}>
                  <span className="flex items-center gap-1.5">{col.label} <SortIcon col={col.key} /></span>
                </th>
              ))}
              <th className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Runs</th>
              <th className="text-left px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Inference</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((p) => {
              const projExps = experiments.filter(e => e.projectId === p.id);
              const running = projExps.filter(e => e.status === "running").length;
              const completed = projExps.filter(e => e.status === "completed").length;
              const s = statusConfig[p.status] || statusConfig.research;
              return (
                <tr key={p.id} className="border-b border-border/40 hover:bg-muted/15 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{p.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono font-bold text-sm", p.accuracy >= 90 ? "text-emerald-400" : p.accuracy >= 70 ? "text-amber-400" : "text-red-400")}>
                        {p.accuracy.toFixed(1)}%
                      </span>
                      <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", p.accuracy >= 90 ? "bg-emerald-400" : p.accuracy >= 70 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${p.accuracy}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{p.loss.toFixed(4)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1 w-fit", s.label)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot, p.status === "testing" && "animate-pulse")} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                    {completed}{running > 0 && <span className="text-amber-400 ml-1">+{running} ▶</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{p.inferenceTime}ms</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelPerformanceCharts() {
  const prodModels = models.filter(m => m.status === "production" || m.status === "staging").slice(0, 4);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          Model Performance Trends
        </h3>
        <Link href="/models">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">All Models <ArrowRight className="w-3 h-3" /></span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prodModels.map(model => {
          const chartData = (model.performanceHistory || []).map(h => ({
            date: new Date(h.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
            accuracy: h.accuracy,
          }));
          return (
            <div key={model.id} className="bg-muted/10 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{model.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{model.architecture} v{model.version}</p>
                </div>
                <div className="text-right">
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full",
                    model.status === "production" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"
                  )}>{model.status}</span>
                  <p className={cn("text-xl font-display font-bold mt-0.5", model.accuracy >= 90 ? "text-emerald-400" : "text-amber-400")}>{model.accuracy.toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#333', borderRadius: '6px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={false} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground font-mono">
                <span>Params: <span className="text-foreground">{model.parameters}</span></span>
                <span>Speed: <span className="text-foreground">{model.speed}ms</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const healthScore = getResearchHealthScore();
  const activeProjects = projects.length;
  const runningExperiments = experiments.filter(e => e.status === "running").length;
  const deployedModels = models.filter(m => m.status === "production").length;
  const highImpactInsights = insights.filter(i => i.impact === "high").length;
  const meanAcc = (projects.reduce((s, p) => s + p.accuracy, 0) / projects.length).toFixed(1);

  const recentExperiments = experiments
    .filter(e => e.status === "running" || e.status === "completed")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 6);

  const topInsights = insights.filter(i => i.impact === "high").slice(0, 4);
  
  const categoryColors: Record<string, string> = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    trend: "text-blue-400",
    discovery: "text-violet-400",
  };

  const pipelineStages = [
    { label: "Research", count: projects.filter(p => p.status === "research").length, color: "bg-violet-500", textColor: "text-violet-400" },
    { label: "Dev", count: projects.filter(p => p.status === "development").length, color: "bg-blue-500", textColor: "text-blue-400" },
    { label: "Testing", count: projects.filter(p => p.status === "testing").length, color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Deployed", count: projects.filter(p => p.status === "deployed").length, color: "bg-emerald-500", textColor: "text-emerald-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Research Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">INCA AI Research Operations — Unified Telemetry</p>
        </div>
        <LiveClock />
      </div>

      {/* Top metrics row — clean 6-across grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Programs", value: activeProjects, icon: Brain, color: "text-emerald-400", bg: "bg-emerald-400/10", trend: "+2 Q1" },
          { label: "Running", value: runningExperiments, icon: FlaskConical, color: "text-amber-400", bg: "bg-amber-400/10", trend: "active now" },
          { label: "Deployed", value: deployedModels, icon: Cpu, color: "text-emerald-400", bg: "bg-emerald-400/10", trend: "+1 this month" },
          { label: "High-Impact", value: highImpactInsights, icon: Lightbulb, color: "text-violet-400", bg: "bg-violet-400/10", trend: "insights" },
          { label: "Avg Accuracy", value: `${meanAcc}%`, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-400/10", trend: "+2.1% vs Q4" },
          { label: "Health", value: healthScore, icon: Shield, color: healthScore >= 80 ? "text-emerald-400" : "text-amber-400", bg: healthScore >= 80 ? "bg-emerald-400/10" : "bg-amber-400/10", trend: "score" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-display font-bold", stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Research health bar — more modern than donut */}
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl px-5 py-4">
        <HealthBar score={healthScore} />
      </div>

      <ExperimentComparisonTable />
      <ModelPerformanceCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-primary" />
              Pipeline
            </h3>
            <Link href="/projects">
              <span className="text-xs text-primary cursor-pointer flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {pipelineStages.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", s.color)}>{s.count}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    <span className={cn("text-[10px] font-mono", s.textColor)}>{Math.round((s.count / projects.length) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className={cn(s.color, "h-full rounded-full")} style={{ width: `${(s.count / projects.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Experiment Feed */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary" />Live Feed
          </h3>
          <div className="space-y-2">
            {recentExperiments.map(exp => {
              const project = projects.find(p => p.id === exp.projectId);
              return (
                <div key={exp.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border/50">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", exp.status === "running" ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{exp.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{project?.name}</p>
                  </div>
                  <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0", exp.status === "running" ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10")}>{exp.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Insights */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />Priority Insights
            </h3>
            <Link href="/insights">
              <span className="text-xs text-primary cursor-pointer flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {topInsights.map(insight => (
              <div key={insight.id} className="p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn("text-[10px] font-mono uppercase", categoryColors[insight.category])}>
                    {insight.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">{insight.confidence}%</span>
                </div>
                <p className="text-xs text-foreground leading-snug">{insight.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compute Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-primary" />Compute Utilization
          </h3>
          <div className="space-y-4">
            {[
              { name: "A100 80GB Cluster", used: 94 },
              { name: "H100 SXM Pod", used: 78 },
              { name: "TPU v4 Pod", used: 62 },
            ].map(g => (
              <div key={g.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-mono text-[11px]">{g.name}</span>
                  <span className={cn("font-mono font-bold", g.used > 90 ? "text-red-400" : g.used > 75 ? "text-amber-400" : "text-emerald-400")}>{g.used}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", g.used > 90 ? "bg-red-400/80" : g.used > 75 ? "bg-amber-400/80" : "bg-emerald-400/80")} style={{ width: `${g.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />Benchmark Targets
          </h3>
          <div className="space-y-2.5">
            {[
              { name: "MMLU", project: "TITAN LLM", value: 91.8, target: 90, met: true },
              { name: "nuScenes mAP", project: "AEGIS Nav", value: 69.4, target: 68, met: true },
              { name: "CASP15 TM", project: "HELIX Drug", value: 0.83, target: 0.85, met: false },
              { name: "Threat Recall", project: "SENTINEL", value: 97.2, target: 95, met: true },
              { name: "T850 RMSE", project: "GAIA Climate", value: 3.45, target: 3.2, met: false },
              { name: "MMMU", project: "NEXUS VLM", value: 74.3, target: 72, met: true },
            ].map(b => (
              <div key={b.name} className="flex items-center gap-3">
                {b.met ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className="text-[10px] font-mono text-muted-foreground w-24 shrink-0">{b.name}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", b.met ? "bg-emerald-400/70" : "bg-amber-400/70")} style={{ width: `${Math.min((b.value / b.target) * 100, 100)}%` }} />
                </div>
                <span className="text-[10px] font-mono text-foreground w-10 text-right">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
