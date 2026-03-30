import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Clock, Users, TrendingUp, FlaskConical, Cpu } from "lucide-react";
import { projects, experiments, models, type ProjectStatus } from "@/data/seed-data";
import { cn } from "@workspace/shared-ui/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusColors: Record<ProjectStatus, string> = {
  research: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  development: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  testing: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  deployed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const statusLabels: Record<ProjectStatus, string> = {
  research: "Research",
  development: "Development",
  testing: "Testing",
  deployed: "Deployed",
};

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
        <Link href="/projects"><span className="text-primary text-sm mt-2 cursor-pointer">Back to Projects</span></Link>
      </div>
    );
  }

  const projectExperiments = experiments.filter((e) => e.projectId === project.id);
  const projectModels = models.filter((m) => m.projectId === project.id);

  const latestExp = projectExperiments
    .filter((e) => e.metrics.length > 0)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px]">
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <span className="p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-foreground">{project.name}</h1>
            <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border", statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Accuracy" value={`${project.accuracy}%`} icon={TrendingUp} />
        <MetricCard label="Loss" value={project.loss.toFixed(3)} icon={TrendingUp} />
        <MetricCard label="Inference" value={`${project.inferenceTime}ms`} icon={Clock} />
        <MetricCard label="Progress" value={`${project.progress}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Team
          </h3>
          <div className="space-y-2">
            {project.team.map((m) => (
              <div key={m.avatar} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {m.avatar}
                </div>
                <div>
                  <p className="text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Timeline
          </h3>
          <div className="space-y-3">
            <TimelineItem label="Started" date={project.startDate} />
            <TimelineItem label="Last Updated" date={project.lastUpdated} />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Domain:</span>
              <span className="text-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">{project.domain}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {latestExp && latestExp.metrics.length > 0 && (
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">
            Training Metrics — {latestExp.name}
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latestExp.metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 14%)" />
                <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: "hsl(240 8% 50%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 8% 50%)" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 16% 9%)",
                    border: "1px solid hsl(240 12% 14%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(265 85% 60%)" strokeWidth={2} dot={false} name="Accuracy" />
                <Line type="monotone" dataKey="valAccuracy" stroke="hsl(185 70% 48%)" strokeWidth={2} dot={false} name="Val Accuracy" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="loss" stroke="hsl(340 75% 55%)" strokeWidth={2} dot={false} name="Loss" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Linked Experiments ({projectExperiments.length})
        </h3>
        <div className="space-y-2">
          {projectExperiments.map((exp) => (
            <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className={cn("w-2 h-2 rounded-full",
                exp.status === "running" ? "bg-amber-400 animate-pulse" :
                exp.status === "completed" ? "bg-emerald-400" :
                exp.status === "failed" ? "bg-red-400" :
                "bg-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{exp.name}</p>
                <p className="text-xs text-muted-foreground truncate">{exp.hypothesis}</p>
              </div>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full",
                exp.status === "running" ? "text-amber-400 bg-amber-400/10" :
                exp.status === "completed" ? "text-emerald-400 bg-emerald-400/10" :
                exp.status === "failed" ? "text-red-400 bg-red-400/10" :
                "text-muted-foreground bg-muted"
              )}>
                {exp.status}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{exp.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {projectModels.length > 0 && (
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" /> Models ({projectModels.length})
          </h3>
          <div className="space-y-2">
            {projectModels.map((model) => (
              <div key={model.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">{model.name} <span className="text-muted-foreground font-mono text-xs">v{model.version}</span></p>
                  <p className="text-xs text-muted-foreground">{model.architecture}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{model.parameters} params</span>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full",
                  model.status === "production" ? "text-emerald-400 bg-emerald-400/10" :
                  model.status === "staging" ? "text-amber-400 bg-amber-400/10" :
                  model.status === "training" ? "text-blue-400 bg-blue-400/10" :
                  "text-muted-foreground bg-muted"
                )}>
                  {model.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-display font-bold text-foreground">{value}</p>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground min-w-[90px]">{label}:</span>
      <span className="text-foreground font-mono">{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
    </div>
  );
}
