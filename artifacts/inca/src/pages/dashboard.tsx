import { useState, useEffect } from "react";
import { Brain, FlaskConical, Cpu, Lightbulb, Activity, TrendingUp, TrendingDown, ArrowRight, Radio, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import { projects, experiments, models, insights, getResearchHealthScore } from "@/data/seed-data";
import { cn } from "@/lib/utils";

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
      <span className="text-border">|</span>
      <span>{time.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, trendValue, color, sublabel }: {
  label: string; value: string | number; icon: any; trend?: "up" | "down" | "neutral"; trendValue?: string; color: string; sublabel?: string;
}) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110", color)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" ? "text-emerald-400 bg-emerald-400/10" :
            trend === "down" ? "text-red-400 bg-red-400/10" :
            "text-muted-foreground bg-muted"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{sublabel}</p>}
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"
            className={color} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mt-3">Research Health Score</p>
      <p className="text-xs text-muted-foreground mt-1">Composite of accuracy, completion, and deployment</p>
    </div>
  );
}

function RecentActivity() {
  const recentExperiments = experiments
    .filter((e) => e.status === "running" || e.status === "completed")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-primary" />
        Live Experiment Feed
      </h3>
      <div className="space-y-3">
        {recentExperiments.map((exp) => {
          const project = projects.find((p) => p.id === exp.projectId);
          return (
            <div key={exp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={cn("w-2 h-2 rounded-full",
                exp.status === "running" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{exp.name}</p>
                <p className="text-xs text-muted-foreground">{project?.name}</p>
              </div>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full",
                exp.status === "running" ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10"
              )}>
                {exp.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineSummary() {
  const statusCounts = {
    research: projects.filter((p) => p.status === "research").length,
    development: projects.filter((p) => p.status === "development").length,
    testing: projects.filter((p) => p.status === "testing").length,
    deployed: projects.filter((p) => p.status === "deployed").length,
  };
  const total = projects.length;
  const stages = [
    { label: "Research", count: statusCounts.research, color: "bg-violet-500" },
    { label: "Development", count: statusCounts.development, color: "bg-blue-500" },
    { label: "Testing", count: statusCounts.testing, color: "bg-amber-500" },
    { label: "Deployed", count: statusCounts.deployed, color: "bg-emerald-500" },
  ];

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Pipeline Overview
        </h3>
        <Link href="/projects">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-4">
        {stages.map((s) => (
          <div key={s.label} className={cn(s.color, "transition-all duration-500")} style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stages.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-display font-bold text-foreground">{s.count}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkTracker() {
  const benchmarks = [
    { name: "MMLU", project: "TITAN LLM", value: 91.8, target: 90, unit: "", lowerIsBetter: false },
    { name: "nuScenes mAP", project: "AEGIS Nav", value: 69.4, target: 68, unit: "%", lowerIsBetter: false },
    { name: "CASP15 TM", project: "HELIX Drug", value: 0.83, target: 0.85, unit: "", lowerIsBetter: false },
    { name: "Threat Recall", project: "SENTINEL", value: 97.2, target: 95, unit: "%", lowerIsBetter: false },
    { name: "T850 RMSE", project: "GAIA Climate", value: 3.45, target: 3.2, unit: "K", lowerIsBetter: true },
    { name: "MMMU", project: "NEXUS VLM", value: 74.3, target: 72, unit: "", lowerIsBetter: false },
  ];

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-primary" />
        Benchmark Targets
      </h3>
      <div className="space-y-2.5">
        {benchmarks.map((b) => {
          const met = b.lowerIsBetter ? b.value <= b.target : b.value >= b.target;
          const progress = b.lowerIsBetter
            ? Math.min((b.target / b.value) * 100, 100)
            : Math.min((b.value / b.target) * 100, 100);
          return (
            <div key={b.name} className="flex items-center gap-3">
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", met ? "bg-emerald-400" : "bg-amber-400")} />
              <span className="text-xs font-mono text-muted-foreground w-24 flex-shrink-0">{b.name}</span>
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", met ? "bg-emerald-400/70" : "bg-amber-400/70")}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-foreground w-16 text-right">{b.value}{b.unit}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 w-12 text-right">{b.lowerIsBetter ? "<" : ">"}{b.target}{b.unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopInsights() {
  const topInsights = insights.filter((i) => i.impact === "high").slice(0, 4);
  const categoryColors: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-400/10",
    warning: "text-amber-400 bg-amber-400/10",
    trend: "text-blue-400 bg-blue-400/10",
    discovery: "text-violet-400 bg-violet-400/10",
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          Priority Insights
        </h3>
        <Link href="/insights">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topInsights.map((insight) => (
          <div key={insight.id} className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full", categoryColors[insight.category])}>
                {insight.category}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{insight.confidence}%</span>
            </div>
            <p className="text-sm text-foreground font-medium leading-snug">{insight.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComputeUtilization() {
  const gpuMetrics = [
    { name: "A100 80GB Cluster", used: 94, total: 32, unit: "GPUs" },
    { name: "H100 SXM Pod", used: 78, total: 16, unit: "GPUs" },
    { name: "TPU v4 Pod", used: 62, total: 8, unit: "chips" },
  ];

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5 text-primary" />
        Compute Utilization
      </h3>
      <div className="space-y-3">
        {gpuMetrics.map((g) => (
          <div key={g.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{g.name}</span>
              <span className={cn("font-mono", g.used > 90 ? "text-red-400" : g.used > 75 ? "text-amber-400" : "text-emerald-400")}>
                {g.used}%
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700",
                  g.used > 90 ? "bg-red-400/70" : g.used > 75 ? "bg-amber-400/70" : "bg-emerald-400/70"
                )}
                style={{ width: `${g.used}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-3 font-mono">NAIRR supplemental compute application pending</p>
    </div>
  );
}

export default function Dashboard() {
  const healthScore = getResearchHealthScore();
  const activeProjects = projects.length;
  const runningExperiments = experiments.filter((e) => e.status === "running").length;
  const deployedModels = models.filter((m) => m.status === "production").length;
  const totalInsights = insights.length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="mb-0">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Research Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">INCA AI Research Operations — Unified Telemetry</p>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Programs" value={activeProjects} icon={Brain} trend="up" trendValue="+2 Q1" color="bg-primary/15 text-primary" sublabel="LLM · Vision · Bio · Climate · RL" />
        <StatCard label="Running Experiments" value={runningExperiments} icon={FlaskConical} trend="up" trendValue="+3" color="bg-amber-400/15 text-amber-400" sublabel="4 queued for GPU allocation" />
        <StatCard label="Production Models" value={deployedModels} icon={Cpu} trend="up" trendValue="+1" color="bg-emerald-400/15 text-emerald-400" sublabel="TITAN · SENTINEL · FORGE" />
        <StatCard label="Research Insights" value={totalInsights} icon={Lightbulb} trend="up" trendValue="+5" color="bg-violet-400/15 text-violet-400" sublabel={`${insights.filter(i => i.impact === "high").length} high-impact findings`} />
        <StatCard label="Mean Accuracy" value={`${(projects.reduce((s, p) => s + p.accuracy, 0) / projects.length).toFixed(1)}%`} icon={Activity} trend="up" trendValue="+2.1%" color="bg-cyan-400/15 text-cyan-400" sublabel="vs SOTA benchmarks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthGauge score={healthScore} />
        <PipelineSummary />
        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BenchmarkTracker />
        <ComputeUtilization />
      </div>

      <TopInsights />
    </div>
  );
}
