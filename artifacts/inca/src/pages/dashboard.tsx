import { Brain, FlaskConical, Cpu, Lightbulb, Activity, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { projects, experiments, models, insights, getResearchHealthScore } from "@/data/seed-data";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, trend, trendValue, color }: {
  label: string; value: string | number; icon: any; trend?: "up" | "down" | "neutral"; trendValue?: string; color: string;
}) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
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
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Recent Experiment Activity</h3>
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
        <h3 className="text-sm font-display font-semibold text-foreground">Pipeline Overview</h3>
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

function TopInsights() {
  const topInsights = insights.filter((i) => i.impact === "high").slice(0, 3);
  const categoryColors: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-400/10",
    warning: "text-amber-400 bg-amber-400/10",
    trend: "text-blue-400 bg-blue-400/10",
    discovery: "text-violet-400 bg-violet-400/10",
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-foreground">Key Insights</h3>
        <Link href="/insights">
          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="space-y-3">
        {topInsights.map((insight) => (
          <div key={insight.id} className="p-3 rounded-lg bg-muted/20 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full", categoryColors[insight.category])}>
                {insight.category}
              </span>
              <span className="text-[10px] text-muted-foreground">{insight.confidence}% confidence</span>
            </div>
            <p className="text-sm text-foreground font-medium">{insight.title}</p>
          </div>
        ))}
      </div>
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
      <div className="mb-2">
        <h1 className="text-2xl font-display font-bold text-foreground">Research Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of AI/ML research operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Projects" value={activeProjects} icon={Brain} trend="up" trendValue="+2" color="bg-primary/15 text-primary" />
        <StatCard label="Running Experiments" value={runningExperiments} icon={FlaskConical} trend="up" trendValue="+3" color="bg-amber-400/15 text-amber-400" />
        <StatCard label="Deployed Models" value={deployedModels} icon={Cpu} trend="neutral" trendValue="stable" color="bg-emerald-400/15 text-emerald-400" />
        <StatCard label="Total Insights" value={totalInsights} icon={Lightbulb} trend="up" trendValue="+5" color="bg-violet-400/15 text-violet-400" />
        <StatCard label="Avg Accuracy" value={`${(projects.reduce((s, p) => s + p.accuracy, 0) / projects.length).toFixed(1)}%`} icon={Activity} trend="up" trendValue="+1.8%" color="bg-cyan-400/15 text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthGauge score={healthScore} />
        <PipelineSummary />
        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <TopInsights />
      </div>
    </div>
  );
}
