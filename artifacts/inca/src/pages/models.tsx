import { useState } from "react";
import { models, projects } from "@/data/seed-data";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

const statusColors: Record<string, string> = {
  production: "text-emerald-400 bg-emerald-400/10",
  staging: "text-amber-400 bg-amber-400/10",
  training: "text-blue-400 bg-blue-400/10",
  archived: "text-muted-foreground bg-muted",
};

const radarColors = [
  "hsl(265 85% 60%)",
  "hsl(185 70% 48%)",
  "hsl(145 65% 45%)",
  "hsl(35 90% 55%)",
  "hsl(340 75% 55%)",
  "hsl(200 80% 55%)",
  "hsl(280 70% 55%)",
  "hsl(120 60% 50%)",
];

function PerformanceTrends() {
  const productionModels = models.filter((m) => m.performanceHistory.length > 1);
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Accuracy Trends Over Time</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 12% 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(240 8% 50%)" }} allowDuplicatedCategory={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(240 8% 50%)" }} domain={[60, 100]} />
            <Tooltip
              contentStyle={{
                background: "hsl(240 16% 9%)",
                border: "1px solid hsl(240 12% 14%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            {productionModels.map((model, i) => (
              <Line
                key={model.id}
                data={model.performanceHistory}
                type="monotone"
                dataKey="accuracy"
                stroke={radarColors[i % radarColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={model.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RadarComparison({ selectedIds }: { selectedIds: string[] }) {
  const selectedModels = models.filter((m) => selectedIds.includes(m.id));
  const dimensions = ["accuracy", "speed", "cost", "robustness", "interpretability"] as const;

  const radarData = dimensions.map((dim) => {
    const point: any = { dimension: dim.charAt(0).toUpperCase() + dim.slice(1) };
    selectedModels.forEach((m) => {
      point[m.name] = m[dim];
    });
    return point;
  });

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Model Comparison Radar</h3>
      {selectedModels.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
          Select models from the table below to compare
        </div>
      ) : (
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(240 12% 14%)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(240 10% 80%)" }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: "hsl(240 8% 50%)" }} domain={[0, 100]} />
              {selectedModels.map((m, i) => (
                <Radar
                  key={m.id}
                  name={m.name}
                  dataKey={m.name}
                  stroke={radarColors[i % radarColors.length]}
                  fill={radarColors[i % radarColors.length]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ArchitectureTable({ selectedIds, onToggle }: { selectedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 overflow-x-auto">
      <h3 className="text-sm font-display font-semibold text-foreground mb-4">Architecture Comparison</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-muted-foreground font-medium w-8"></th>
            <th className="text-left py-2 text-muted-foreground font-medium">Model</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Architecture</th>
            <th className="text-left py-2 text-muted-foreground font-medium">Project</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Params</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Accuracy</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Speed</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Cost</th>
            <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const project = projects.find((p) => p.id === model.projectId);
            const isSelected = selectedIds.includes(model.id);
            return (
              <tr key={model.id} className={cn("border-b border-border/50 hover:bg-muted/10 cursor-pointer transition-colors", isSelected && "bg-primary/5")} onClick={() => onToggle(model.id)}>
                <td className="py-2.5">
                  <div className={cn("w-4 h-4 rounded border transition-colors", isSelected ? "bg-primary border-primary" : "border-border")}>
                    {isSelected && <svg viewBox="0 0 16 16" className="w-4 h-4 text-primary-foreground"><path fill="currentColor" d="M6.5 11.5L3 8l1-1 2.5 2.5 5-5 1 1z" /></svg>}
                  </div>
                </td>
                <td className="py-2.5">
                  <div>
                    <p className="text-foreground font-medium">{model.name}</p>
                    <p className="text-muted-foreground text-[10px] font-mono">v{model.version}</p>
                  </div>
                </td>
                <td className="py-2.5 text-muted-foreground font-mono">{model.architecture}</td>
                <td className="py-2.5 text-muted-foreground">{project?.name}</td>
                <td className="py-2.5 text-right font-mono text-foreground">{model.parameters}</td>
                <td className="py-2.5 text-right font-mono text-foreground">{model.accuracy}%</td>
                <td className="py-2.5 text-right font-mono text-foreground">{model.speed}/100</td>
                <td className="py-2.5 text-right font-mono text-foreground">{model.cost}/100</td>
                <td className="py-2.5 text-center">
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full", statusColors[model.status])}>
                    {model.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Models() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["mod-001", "mod-004", "mod-007"]);

  const toggleModel = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Models</h1>
        <p className="text-sm text-muted-foreground mt-1">Compare architectures, track performance, and evaluate across dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PerformanceTrends />
        <RadarComparison selectedIds={selectedIds} />
      </div>

      <ArchitectureTable selectedIds={selectedIds} onToggle={toggleModel} />
    </div>
  );
}
