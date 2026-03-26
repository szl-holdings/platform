import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Activity, Play, Clock, AlertTriangle, CheckCircle, TrendingDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  running: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeLabels: Record<string, string> = {
  route_risk: "Route Risk Analysis",
  weather_impact: "Weather Impact",
  fuel_optimization: "Fuel Optimization",
  schedule_analysis: "Schedule Analysis",
};

function getRiskColor(score: number) {
  if (score < 30) return "text-emerald-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

function getRiskBg(score: number) {
  if (score < 30) return "bg-emerald-500/10";
  if (score < 50) return "bg-amber-500/10";
  if (score < 70) return "bg-orange-500/10";
  return "bg-red-500/10";
}

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), 100);
    return () => clearTimeout(timer);
  }, [value]);
  return <Progress value={current} className={`${className} transition-all duration-1000`} />;
}

function SimSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimulationsPage() {
  const qc = useQueryClient();
  const { data: simulations = [], isLoading } = useQuery({ queryKey: ["simulations"], queryFn: api.simulations.list });
  const { data: vessels = [] } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const { data: routes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", vesselId: "", routeId: "", simulationType: "route_risk" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.simulations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["simulations"] });
      setOpen(false);
      toast.success("Simulation started");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["simulations"] }), 4000);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    createMut.mutate({
      name: form.name,
      vesselId: form.vesselId ? Number(form.vesselId) : undefined,
      routeId: form.routeId ? Number(form.routeId) : undefined,
      simulationType: form.simulationType,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Simulations</h1>
          <p className="text-sm text-muted-foreground mt-1">Run route risk assessments and impact analyses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Play className="w-4 h-4 mr-2" /> Run Simulation</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">New Simulation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Route Risk Analysis" /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.simulationType} onValueChange={v => setForm(p => ({ ...p, simulationType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="route_risk">Route Risk Analysis</SelectItem>
                    <SelectItem value="weather_impact">Weather Impact</SelectItem>
                    <SelectItem value="fuel_optimization">Fuel Optimization</SelectItem>
                    <SelectItem value="schedule_analysis">Schedule Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vessel (optional)</Label>
                <Select value={form.vesselId} onValueChange={v => setForm(p => ({ ...p, vesselId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vessel" /></SelectTrigger>
                  <SelectContent>{vessels.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Route (optional)</Label>
                <Select value={form.routeId} onValueChange={v => setForm(p => ({ ...p, routeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>{routes.map((r: any) => <SelectItem key={r.id} value={String(r.id)}>{r.originPort} → {r.destinationPort}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMut.isPending} className="w-full">{createMut.isPending ? "Starting..." : "Start Simulation"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SimSkeleton key={i} />)}
        </div>
      ) : simulations.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-2">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No simulations run yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Run your first simulation to analyze route risks</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {simulations.map((sim: any, i: number) => {
            const vessel = vessels.find((v: any) => v.id === sim.vesselId);
            const route = routes.find((r: any) => r.id === sim.routeId);
            const riskScore = sim.riskScore ? Number(sim.riskScore) : null;
            const results = sim.results as any;
            const isRunning = sim.status === "running";

            return (
              <Card key={sim.id} className={`bg-card border-border transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isRunning ? "ring-1 ring-amber-500/20" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 ${isRunning ? "ring-1 ring-amber-500/20" : ""}`}>
                        {isRunning ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : (
                          <Activity className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{sim.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {typeLabels[sim.simulationType] || sim.simulationType}
                          {vessel && ` | ${vessel.name}`}
                          {route && ` | ${route.originPort} → ${route.destinationPort}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${statusColors[sim.status] || ""} ${isRunning ? "animate-pulse" : ""}`}>
                      {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse-dot" />}
                      {sim.status}
                    </Badge>
                  </div>

                  {isRunning && (
                    <div className="mb-4 bg-amber-500/5 rounded-lg p-4 border border-amber-500/10">
                      <div className="flex items-center gap-2 text-sm text-amber-400 mb-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-medium">Running simulation...</span>
                      </div>
                      <AnimatedProgress value={65} className="h-2" />
                      <div className="flex items-center justify-between mt-2 text-xs text-amber-400/60">
                        <span>Analyzing risk factors</span>
                        <span>65%</span>
                      </div>
                    </div>
                  )}

                  {sim.status === "completed" && riskScore !== null && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                      <div className={`${getRiskBg(riskScore)} rounded-lg p-3 text-center border border-transparent hover:border-primary/10 transition-colors`}>
                        <p className="text-xs text-muted-foreground mb-1">Overall Risk</p>
                        <p className={`text-xl font-bold font-display ${getRiskColor(riskScore)}`}>{riskScore.toFixed(1)}</p>
                      </div>
                      {results?.weatherRisk && (
                        <div className={`${getRiskBg(Number(results.weatherRisk))} rounded-lg p-3 text-center border border-transparent hover:border-primary/10 transition-colors`}>
                          <p className="text-xs text-muted-foreground mb-1">Weather Risk</p>
                          <p className={`text-xl font-bold font-display ${getRiskColor(Number(results.weatherRisk))}`}>{Number(results.weatherRisk).toFixed(1)}</p>
                        </div>
                      )}
                      {results?.routeRisk && (
                        <div className={`${getRiskBg(Number(results.routeRisk))} rounded-lg p-3 text-center border border-transparent hover:border-primary/10 transition-colors`}>
                          <p className="text-xs text-muted-foreground mb-1">Route Risk</p>
                          <p className={`text-xl font-bold font-display ${getRiskColor(Number(results.routeRisk))}`}>{Number(results.routeRisk).toFixed(1)}</p>
                        </div>
                      )}
                      {results?.scheduleRisk && (
                        <div className={`${getRiskBg(Number(results.scheduleRisk))} rounded-lg p-3 text-center border border-transparent hover:border-primary/10 transition-colors`}>
                          <p className="text-xs text-muted-foreground mb-1">Schedule Risk</p>
                          <p className={`text-xl font-bold font-display ${getRiskColor(Number(results.scheduleRisk))}`}>{Number(results.scheduleRisk).toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {results?.recommendations && Array.isArray(results.recommendations) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {results.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-xs flex items-start gap-2">
                            <TrendingDown className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {sim.description && (
                    <p className="text-xs text-muted-foreground mt-2">{sim.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
