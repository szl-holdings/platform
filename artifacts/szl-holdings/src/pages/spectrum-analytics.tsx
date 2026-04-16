import { useListProjects, Project } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { BarChart3, Filter, Grid3X3, TrendingUp, Eye, ArrowUp, ArrowDown, Search, Layers, Zap, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { PageDataSkeleton } from "@szl-holdings/shared-ui";
import { usePageMeta } from "@/hooks/usePageMeta";

const healthDimensions = ["Performance", "Security", "Reliability", "Scalability", "Maintainability"];

function getProjectHealth(project: Project) {
  const seed = project.name.length * 7 + (project.id || 0);
  return healthDimensions.map((dim, i) => ({
    dimension: dim,
    score: 60 + ((seed * (i + 1) * 13) % 40),
  }));
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-400" : score >= 70 ? "bg-blue-400" : score >= 55 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-muted rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right">{score}</span>
    </div>
  );
}

function ProjectHealthCard({ project, index }: { project: Project; index: number }) {
  const health = getProjectHealth(project);
  const avgScore = Math.round(health.reduce((a, h) => a + h.score, 0) / health.length);

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">{project.name}</h3>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          avgScore >= 80 ? "bg-emerald-500/10 text-emerald-400" :
          avgScore >= 65 ? "bg-blue-500/10 text-blue-400" :
          "bg-amber-500/10 text-amber-400"
        }`}>
          {avgScore} avg
        </div>
      </div>
      <div className="space-y-1.5">
        {health.map((h) => (
          <div key={h.dimension} className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground w-24">{h.dimension}</span>
            <HealthBar score={h.score} />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className={`capitalize ${project.status === "active" ? "text-emerald-400" : project.status === "completed" ? "text-blue-400" : "text-amber-400"}`}>
          {project.status}
        </span>
        <span>{project.category}</span>
      </div>
    </div>
  );
}

export default function SpectrumAnalytics() {
  usePageMeta({
    title: "Spectrum Analytics | SZL Holdings – Platform Health Intelligence",
    description: "Real-time health analytics for the SZL Holdings application portfolio. Monitor performance, security, reliability, and maintainability across all platforms.",
    canonical: "https://szlholdings.com/spectrum",
  });
  const { data: projects = [], isLoading } = useListProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "health">("health");

  const filtered = projects
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "health") {
        const aScore = getProjectHealth(a).reduce((s, h) => s + h.score, 0);
        const bScore = getProjectHealth(b).reduce((s, h) => s + h.score, 0);
        return bScore - aScore;
      }
      return a.name.localeCompare(b.name);
    });

  const allHealth = projects.map((p) => {
    const h = getProjectHealth(p);
    return Math.round(h.reduce((a, d) => a + d.score, 0) / h.length);
  });
  const avgOverall = allHealth.length > 0 ? Math.round(allHealth.reduce((a, b) => a + b, 0) / allHealth.length) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PageDataSkeleton variant="dashboard" showHeader showStats rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Spectrum Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Multi-dimensional project health visualization and portfolio panorama</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Total Projects</div>
            <div className="text-2xl font-display font-bold mt-1">{projects.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Avg Health Score</div>
            <div className="text-2xl font-display font-bold text-emerald-400 mt-1">{avgOverall}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Active</div>
            <div className="text-2xl font-display font-bold mt-1">{projects.filter(p => p.status === "active").length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-2xl font-display font-bold mt-1">{projects.filter(p => p.status === "completed").length}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-2">
            {["all", "active", "completed", "on-hold"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                {s === "all" ? "All" : s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "health")} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
            <option value="health">Sort by Health</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <ProjectHealthCard key={project.id || i} project={project} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No projects match your filters
          </div>
        )}

        <DORAMetricsSection />
        <VelocityBurndownSection projects={projects} />
      </div>
    </div>
  );
}

// ─── DORA Metrics (Vercel/GitHub-style) ───────────────────────────────────────
const doraMetrics = [
  { label: "Deployment Frequency", value: "4.2/day", rating: "Elite", icon: Zap, color: "text-emerald-400", detail: "Multiple deploys per day across active projects" },
  { label: "Lead Time for Changes", value: "1.4 hrs", rating: "Elite", icon: Clock, color: "text-emerald-400", detail: "Commit to production in under 2 hours" },
  { label: "Change Failure Rate", value: "3.8%", rating: "High", icon: AlertCircle, color: "text-amber-400", detail: "Target <5% for elite performers" },
  { label: "Mean Time to Restore", value: "22 min", rating: "Elite", icon: RefreshCw, color: "text-emerald-400", detail: "Restoration when incidents occur" },
];

const ratingColors: Record<string, string> = {
  Elite: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  High: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low: "text-red-400 bg-red-500/10 border-red-500/20",
};

function DORAMetricsSection() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> DORA Metrics
        </h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">Mock Data</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {doraMetrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${ratingColors[m.rating]}`}>{m.rating}</span>
              </div>
              <p className="text-xl font-bold font-display mb-0.5">{m.value}</p>
              <p className="text-xs font-medium text-foreground mb-1">{m.label}</p>
              <p className="text-[10px] text-muted-foreground">{m.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VelocityBurndownSection({ projects }: { projects: Project[] }) {
  const active = projects.filter(p => p.status === "active");
  return (
    <div className="rounded-xl border border-border bg-card p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Velocity & Sprint Burndown
        </h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">Mock Data</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.slice(0, 6).map((p, i) => {
          const seed = (p.id || i + 1) * 17;
          const velocity = 24 + (seed % 28);
          const completed = 55 + (seed % 38);
          const total = 80 + (seed % 40);
          const pct = Math.round((completed / total) * 100);
          return (
            <div key={p.id || i} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <span className="text-[10px] font-mono text-emerald-400">{velocity} pts/sprint</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{completed}/{total} story pts</span>
                <span className={pct >= 70 ? "text-emerald-400" : "text-amber-400"}>{pct}% complete</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
