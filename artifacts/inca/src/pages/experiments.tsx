import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { experiments, projects, type Experiment } from "@/data/seed-data";
import { cn } from "@workspace/shared-ui/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ExportButton } from "@workspace/shared-ui/data-export";
import { CommentThread, ActivityFeed } from "@workspace/shared-ui/collaboration";

const statusColors: Record<string, string> = {
  running: "text-amber-400 bg-amber-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  failed: "text-red-400 bg-red-400/10",
  queued: "text-muted-foreground bg-muted",
};

function ExperimentRow({ experiment, isExpanded, onToggle }: {
  experiment: Experiment; isExpanded: boolean; onToggle: () => void;
}) {
  const project = projects.find((p) => p.id === experiment.projectId);
  const lastMetric = experiment.metrics[experiment.metrics.length - 1];

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden transition-all", isExpanded && "border-primary/20")}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
          experiment.status === "running" ? "bg-amber-400 animate-pulse" :
          experiment.status === "completed" ? "bg-emerald-400" :
          experiment.status === "failed" ? "bg-red-400" :
          "bg-muted-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{experiment.name}</p>
          <p className="text-xs text-muted-foreground">{project?.name}</p>
        </div>
        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full", statusColors[experiment.status])}>
          {experiment.status}
        </span>
        {lastMetric && (
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span>Acc: <span className="text-foreground">{lastMetric.accuracy.toFixed(1)}%</span></span>
            <span>Loss: <span className="text-foreground">{lastMetric.loss.toFixed(3)}</span></span>
          </div>
        )}
        <span className="text-xs text-muted-foreground font-mono">{experiment.duration}</span>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4 bg-card/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Hypothesis</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{experiment.hypothesis}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Results</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{experiment.results}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Hyperparameters</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(experiment.hyperparameters).map(([key, val]) => (
                <span key={key} className="text-[10px] font-mono px-2 py-1 rounded bg-muted/40 text-muted-foreground">
                  {key}: <span className="text-foreground">{String(val)}</span>
                </span>
              ))}
            </div>
          </div>

          {experiment.metrics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Training Curves</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={experiment.metrics}>
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
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(265 85% 60%)" strokeWidth={2} dot={false} name="Train Acc" />
                    <Line type="monotone" dataKey="valAccuracy" stroke="hsl(185 70% 48%)" strokeWidth={2} dot={false} name="Val Acc" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="loss" stroke="hsl(340 75% 55%)" strokeWidth={1.5} dot={false} name="Train Loss" />
                    <Line type="monotone" dataKey="valLoss" stroke="hsl(35 90% 55%)" strokeWidth={1.5} dot={false} name="Val Loss" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <CommentThread entityType="experiment" entityId={experiment.id} title="Experiment Discussion" defaultCollapsed={true} />
        </div>
      )}
    </div>
  );
}

function ComparisonTable() {
  const completedExps = experiments.filter((e) => e.status === "completed" && e.metrics.length > 0);
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 overflow-x-auto">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Experiment Comparison</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-muted-foreground font-medium">Experiment</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Project</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Final Acc</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Final Loss</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Val Acc</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Epochs</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {completedExps.slice(0, 10).map((exp) => {
            const project = projects.find((p) => p.id === exp.projectId);
            const last = exp.metrics[exp.metrics.length - 1];
            return (
              <tr key={exp.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="py-2 text-foreground font-medium">{exp.name}</td>
                <td className="py-2 text-muted-foreground">{project?.name}</td>
                <td className="py-2 text-right font-mono text-foreground">{last.accuracy.toFixed(1)}%</td>
                <td className="py-2 text-right font-mono text-foreground">{last.loss.toFixed(3)}</td>
                <td className="py-2 text-right font-mono text-foreground">{last.valAccuracy.toFixed(1)}%</td>
                <td className="py-2 text-right font-mono text-muted-foreground">{exp.metrics.length}</td>
                <td className="py-2 text-right font-mono text-muted-foreground">{exp.duration}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Experiments() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all"
    ? experiments
    : experiments.filter((e) => e.status === statusFilter);

  const counts = {
    all: experiments.length,
    running: experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    queued: experiments.filter((e) => e.status === "queued").length,
    failed: experiments.filter((e) => e.status === "failed").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Experiments</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare training runs, validate hypotheses, and surface the experiments that advance model performance</p>
        </div>
        <ExportButton
          data={experiments.map(e => {
            const last = e.metrics[e.metrics.length - 1];
            const proj = projects.find(p => p.id === e.projectId);
            return {
              Name: e.name,
              Project: proj?.name || "",
              Status: e.status,
              Accuracy: last ? `${last.accuracy.toFixed(1)}%` : "",
              "Val Accuracy": last ? `${last.valAccuracy.toFixed(1)}%` : "",
              Loss: last ? last.loss.toFixed(3) : "",
              Epochs: e.metrics.length,
              Duration: e.duration || "",
            };
          })}
          options={{ filename: "experiments", title: "ML Experiments", accentColor: "#8b5cf6" }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "running", "completed", "queued"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              statusFilter === status
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1.5 text-[10px] opacity-60">{counts[status]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((exp) => (
          <ExperimentRow
            key={exp.id}
            experiment={exp}
            isExpanded={expandedId === exp.id}
            onToggle={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
          />
        ))}
      </div>

      <ComparisonTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed entityType="experiment" title="Research Activity Feed" limit={8} compact />
        <CommentThread entityType="experiment" entityId="general" title="Team Discussion" />
      </div>
    </div>
  );
}
