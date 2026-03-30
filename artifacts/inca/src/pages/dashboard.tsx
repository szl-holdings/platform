import { useState, useEffect, useMemo } from "react";
import { Brain, FlaskConical, Cpu, Lightbulb, Activity, TrendingUp, TrendingDown, ArrowRight, Radio, Shield, Zap, ChevronUp, ChevronDown, ArrowUpDown, GitBranch, BarChart3, Layers } from "lucide-react";
import { Link } from "wouter";
import { projects, experiments, models, insights, getResearchHealthScore } from "@/data/seed-data";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="uppercase tracking-wider text-emerald-400 text-[10px] font-semibold">Systems Nominal</span>
      </div>
      <span className="text-border">|</span>
      <span>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5"
            className={color} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-foreground">{score}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Health</span>
        </div>
      </div>
      <p className="text-xs font-medium text-foreground mt-2">Research Health</p>
    </div>
  );
}

function PipelineVisualization() {
  const stages = [
    { label: "Research", count: projects.filter(p => p.status === "research").length, color: "bg-violet-500", textColor: "text-violet-400" },
    { label: "Development", count: projects.filter(p => p.status === "development").length, color: "bg-blue-500", textColor: "text-blue-400" },
    { label: "Testing", count: projects.filter(p => p.status === "testing").length, color: "bg-amber-500", textColor: "text-amber-400" },
    { label: "Deployed", count: projects.filter(p => p.status === "deployed").length, color: "bg-emerald-500", textColor: "text-emerald-400" },
  ];
  const total = projects.length;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
          Pipeline Stages
        </h3>
        <Link href="/projects">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
        </Link>
      </div>
      <div className="flex gap-2 mb-4">
        {stages.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center relative">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white", s.color)}>
              {s.count}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider text-center">{s.label}</p>
            {i < stages.length - 1 && (
              <div className="absolute top-5 left-[60%] w-[80%] h-px bg-border" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        {stages.map(s => (
          <div key={s.label} className={cn(s.color, "transition-all duration-500")} style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
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
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />;
  };

  const statusColor: Record<string, string> = {
    research: "text-violet-400 bg-violet-400/10",
    development: "text-blue-400 bg-blue-400/10",
    testing: "text-amber-400 bg-amber-400/10",
    deployed: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Experiment Runs — Comparison Table
        </h3>
        <Link href="/experiments">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">All Experiments <ArrowRight className="w-3 h-3" /></span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {[
                { key: "name" as SortKey, label: "Project" },
                { key: "domain" as SortKey, label: "Domain" },
                { key: "accuracy" as SortKey, label: "Accuracy" },
                { key: "loss" as SortKey, label: "Loss" },
                { key: "status" as SortKey, label: "Status" },
              ].map(col => (
                <th key={col.key} className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none" onClick={() => handleSort(col.key)}>
                  <span className="flex items-center gap-1">{col.label} <SortIcon col={col.key} /></span>
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Experiments</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Inference</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((p, i) => {
              const projExps = experiments.filter(e => e.projectId === p.id);
              const running = projExps.filter(e => e.status === "running").length;
              const completed = projExps.filter(e => e.status === "completed").length;
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-[10px]">{p.domain}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("font-mono font-bold", p.accuracy >= 90 ? "text-emerald-400" : p.accuracy >= 70 ? "text-amber-400" : "text-red-400")}>
                      {p.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.loss.toFixed(4)}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full", statusColor[p.status])}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="font-mono">{completed}</span>
                    {running > 0 && <span className="text-amber-400 ml-1 font-mono">+{running} running</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.inferenceTime}ms</td>
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
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
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
            latency: h.latency,
          }));
          return (
            <div key={model.id} className="bg-muted/10 rounded-lg border border-border/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{model.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{model.architecture} — v{model.version}</p>
                </div>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full",
                  model.status === "production" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"
                )}>{model.status}</span>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#333', borderRadius: '6px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={false} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px]">
                <span className="text-muted-foreground">Acc: <span className="text-emerald-400 font-mono font-bold">{model.accuracy.toFixed(1)}%</span></span>
                <span className="text-muted-foreground">Params: <span className="text-foreground font-mono">{model.parameters}</span></span>
                <span className="text-muted-foreground">Speed: <span className="text-foreground font-mono">{model.speed}ms</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComputeAndBenchmarks() {
  const gpuMetrics = [
    { name: "A100 80GB Cluster", used: 94 },
    { name: "H100 SXM Pod", used: 78 },
    { name: "TPU v4 Pod", used: 62 },
  ];

  const benchmarks = [
    { name: "MMLU", project: "TITAN LLM", value: 91.8, target: 90, met: true },
    { name: "nuScenes mAP", project: "AEGIS Nav", value: 69.4, target: 68, met: true },
    { name: "CASP15 TM", project: "HELIX Drug", value: 0.83, target: 0.85, met: false },
    { name: "Threat Recall", project: "SENTINEL", value: 97.2, target: 95, met: true },
    { name: "T850 RMSE", project: "GAIA Climate", value: 3.45, target: 3.2, met: false },
    { name: "MMMU", project: "NEXUS VLM", value: 74.3, target: 72, met: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />Compute Utilization
        </h3>
        <div className="space-y-3">
          {gpuMetrics.map(g => (
            <div key={g.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{g.name}</span>
                <span className={cn("font-mono font-bold", g.used > 90 ? "text-red-400" : g.used > 75 ? "text-amber-400" : "text-emerald-400")}>{g.used}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", g.used > 90 ? "bg-red-400/70" : g.used > 75 ? "bg-amber-400/70" : "bg-emerald-400/70")} style={{ width: `${g.used}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />Benchmark Targets
        </h3>
        <div className="space-y-2">
          {benchmarks.map(b => (
            <div key={b.name} className="flex items-center gap-3">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", b.met ? "bg-emerald-400" : "bg-amber-400")} />
              <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">{b.name}</span>
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", b.met ? "bg-emerald-400/60" : "bg-amber-400/60")} style={{ width: `${Math.min((b.value / b.target) * 100, 100)}%` }} />
              </div>
              <span className="text-[10px] font-mono text-foreground w-12 text-right">{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const healthScore = getResearchHealthScore();
  const activeProjects = projects.length;
  const runningExperiments = experiments.filter(e => e.status === "running").length;
  const deployedModels = models.filter(m => m.status === "production").length;
  const totalInsights = insights.length;
  const highImpact = insights.filter(i => i.impact === "high").length;
  const meanAcc = (projects.reduce((s, p) => s + p.accuracy, 0) / projects.length).toFixed(1);

  const recentExperiments = experiments
    .filter(e => e.status === "running" || e.status === "completed")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  const topInsights = insights.filter(i => i.impact === "high").slice(0, 4);
  const categoryColors: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-400/10",
    warning: "text-amber-400 bg-amber-400/10",
    trend: "text-blue-400 bg-blue-400/10",
    discovery: "text-violet-400 bg-violet-400/10",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Research Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">INCA AI Research Operations — Unified Telemetry</p>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Programs", value: activeProjects, icon: Brain, color: "bg-emerald-400/15 text-emerald-400", trend: "+2 Q1" },
          { label: "Running", value: runningExperiments, icon: FlaskConical, color: "bg-amber-400/15 text-amber-400", trend: "+3" },
          { label: "Deployed", value: deployedModels, icon: Cpu, color: "bg-emerald-400/15 text-emerald-400", trend: "+1" },
          { label: "Insights", value: totalInsights, icon: Lightbulb, color: "bg-violet-400/15 text-violet-400", trend: `${highImpact} high` },
          { label: "Accuracy", value: `${meanAcc}%`, icon: Activity, color: "bg-cyan-400/15 text-cyan-400", trend: "+2.1%" },
          { label: "Health", value: healthScore, icon: Shield, color: healthScore >= 80 ? "bg-emerald-400/15 text-emerald-400" : "bg-amber-400/15 text-amber-400", isGauge: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/20 transition-all group">
            {stat.isGauge ? (
              <HealthGauge score={stat.value as number} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />{stat.trend}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <ExperimentComparisonTable />
      <ModelPerformanceCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PipelineVisualization />

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />Live Experiment Feed
          </h3>
          <div className="space-y-2.5">
            {recentExperiments.map(exp => {
              const project = projects.find(p => p.id === exp.projectId);
              return (
                <div key={exp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", exp.status === "running" ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{exp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{project?.name}</p>
                  </div>
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0", exp.status === "running" ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10")}>{exp.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />Priority Insights
            </h3>
            <Link href="/insights">
              <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
          <div className="space-y-2.5">
            {topInsights.map(insight => (
              <div key={insight.id} className="p-2.5 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full", categoryColors[insight.category])}>{insight.category}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{insight.confidence}%</span>
                </div>
                <p className="text-xs text-foreground leading-snug">{insight.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ComputeAndBenchmarks />
    </div>
  );
}
