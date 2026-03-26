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
import { Play, Clock, CheckCircle, XCircle, Activity, Target, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  running: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  aborted: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function getScoreColor(score: number) {
  if (score < 30) return "text-emerald-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

export default function SimulationRunner() {
  const qc = useQueryClient();
  const { data: simulations = [], isLoading } = useQuery({ queryKey: ["simulations"], queryFn: api.simulations.list });
  const { data: scenarios = [] } = useQuery({ queryKey: ["scenarios"], queryFn: api.scenarios.list });
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: api.assessments.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", scenarioId: "", assessmentId: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.simulations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["simulations"] });
      setOpen(false);
      toast.success("Simulation started");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["simulations"] }), 5000);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Simulation Runner</h1>
          <p className="text-sm text-muted-foreground mt-1">Execute controlled security simulations and review results</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Play className="w-4 h-4 mr-2" /> Run Simulation</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">New Simulation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Network Pentest Run #1" /></div>
              <div>
                <Label>Scenario</Label>
                <Select value={form.scenarioId} onValueChange={v => setForm(p => ({ ...p, scenarioId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select scenario" /></SelectTrigger>
                  <SelectContent>{scenarios.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assessment</Label>
                <Select value={form.assessmentId} onValueChange={v => setForm(p => ({ ...p, assessmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
                  <SelectContent>{assessments.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                if (!form.name || !form.scenarioId || !form.assessmentId) { toast.error("All fields required"); return; }
                createMut.mutate({ name: form.name, scenarioId: Number(form.scenarioId), assessmentId: Number(form.assessmentId) });
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Starting..." : "Start Simulation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Runs</p>
              <p className="text-2xl font-bold font-display mt-1">{simulations.length}</p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Running</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-3">{simulations.filter((s: any) => s.status === "running").length}</p>
            </div>
            <Clock className="w-5 h-5 text-chart-3" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-4">{simulations.filter((s: any) => s.status === "completed").length}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-chart-4" />
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading simulations...</div>
      ) : simulations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No simulation runs yet</div>
      ) : (
        <div className="space-y-4">
          {simulations.map((sim: any) => {
            const scenario = scenarios.find((s: any) => s.id === sim.scenarioId);
            const assessment = assessments.find((a: any) => a.id === sim.assessmentId);
            const results = sim.results as any;
            const score = results?.overallScore ? Number(results.overallScore) : null;

            return (
              <Card key={sim.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{sim.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {scenario && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {scenario.name}</span>}
                          {assessment && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {assessment.name}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[sim.status] || ""}>{sim.status}</Badge>
                  </div>

                  {sim.status === "running" && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-amber-400 mb-2">
                        <Clock className="w-4 h-4 animate-pulse" /> Simulation in progress...
                      </div>
                      <Progress value={60} className="h-1.5" />
                    </div>
                  )}

                  {sim.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {score !== null && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                          <p className={`text-xl font-bold font-display ${getScoreColor(score)}`}>{score.toFixed(1)}</p>
                        </div>
                      )}
                      {results?.vulnerabilitiesFound !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Vulnerabilities</p>
                          <p className="text-xl font-bold font-display text-chart-2">{results.vulnerabilitiesFound}</p>
                        </div>
                      )}
                      {results?.attackPathsIdentified !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Attack Paths</p>
                          <p className="text-xl font-bold font-display text-primary">{results.attackPathsIdentified}</p>
                        </div>
                      )}
                      {results?.mitigationsApplied !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Mitigations</p>
                          <p className="text-xl font-bold font-display text-chart-4">{results.mitigationsApplied}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {results?.recommendations && Array.isArray(results.recommendations) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {results.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <Shield className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {sim.startedAt && <span>Started: {new Date(sim.startedAt).toLocaleString()}</span>}
                    {sim.completedAt && <span>Completed: {new Date(sim.completedAt).toLocaleString()}</span>}
                    {sim.durationSeconds && <span>Duration: {sim.durationSeconds}s</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
