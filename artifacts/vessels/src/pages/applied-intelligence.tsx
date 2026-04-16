import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Brain, Sparkles, Wrench, TrendingUp, AlertTriangle, Info, CheckCircle, Target, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

const severityColors: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  Warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const riskColors: Record<string, string> = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function AppliedIntelligencePage() {
  const { data: briefings = [] } = useQuery({ queryKey: ["ai-briefings"], queryFn: () => dataProvider.getAIBriefings() });
  const { data: predictive = [] } = useQuery({ queryKey: ["predictive-maint"], queryFn: () => dataProvider.getPredictiveMaintenanceItems() });
  const { data: forecasts = [] } = useQuery({ queryKey: ["forecasts"], queryFn: () => dataProvider.getForecastModules() });

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> Applied Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Executive briefings, predictive maintenance, and forecasting with confidence intervals</p>
      </div>

      <div className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Executive AI Briefings</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {briefings.map(b => (
            <Card key={b.id} className={`bg-card border-border hover:border-primary/20 transition-all ${b.severity === "Critical" ? "ring-1 ring-red-500/20" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {b.severity === "Critical" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : b.severity === "Warning" ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Info className="w-4 h-4 text-blue-400" />}
                    <CardTitle className="font-display text-sm">{b.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${b.severity ? severityColors[b.severity] : ""}`}>{b.severity}</Badge>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      <Target className="w-3 h-3 mr-1" />{b.confidence}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{b.summary}</p>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">{b.details}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Action Items</p>
                  <ul className="space-y-1">
                    {(b.actionItems ?? []).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                  {(b.affectedVessels ?? []).map((v: string) => (
                    <Badge key={v} variant="outline" className="text-[10px] bg-muted text-muted-foreground">{v}</Badge>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground/50">
                  Generated: {b.generatedAt ? new Date(b.generatedAt).toLocaleString() : "—"} · Category: {b.category}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" /> Predictive Maintenance Summaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictive.sort((a, b) => (b.failureProbability ?? 0) - (a.failureProbability ?? 0)).map(p => (
              <div key={p.id} className={`p-4 rounded-lg border transition-all ${p.riskLevel === "High" ? "border-red-500/20 bg-red-500/5" : "border-border bg-background/50"} hover:border-primary/20`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{p.component}</p>
                      <Badge variant="outline" className={`text-xs ${p.riskLevel ? riskColors[p.riskLevel] : ""}`}>{p.riskLevel} Risk</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.vesselName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${(p.failureProbability ?? 0) >= 60 ? "text-red-400" : (p.failureProbability ?? 0) >= 40 ? "text-amber-400" : "text-emerald-400"}`}>{(p.failureProbability ?? 0)}%</p>
                    <p className="text-[10px] text-muted-foreground">failure prob.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{p.recommendedAction}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Predicted: {p.predictedFailureDate ? new Date(p.predictedFailureDate).toLocaleDateString() : "—"}</span>
                  <span>Est. Cost: ${(p.estimatedCost ?? 0).toLocaleString()}</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    <Target className="w-3 h-3 mr-1" />{p.confidence}% confidence
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Forecast Modules</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {forecasts.map(f => (
            <Card key={f.id} className="bg-card border-border hover:border-primary/20 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-sm">{f.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${f.trend === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                      {f.trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                      {f.trend}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {f.confidence}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold">{typeof f.currentValue === "number" && f.currentValue > 1000 ? f.currentValue.toLocaleString() : f.currentValue} <span className="text-xs text-muted-foreground">{f.metric}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Forecast ({(f.forecastDate ?? '').slice(5)})</p>
                    <p className={`text-lg font-bold ${f.trend === "up" ? "text-emerald-400" : "text-blue-400"}`}>{typeof f.forecastValue === "number" && f.forecastValue > 1000 ? f.forecastValue.toLocaleString() : f.forecastValue} <span className="text-xs text-muted-foreground">{f.metric}</span></p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={f.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickFormatter={v => v.slice(5)} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" name="Actual" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#22c55e", r: 3 }} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
