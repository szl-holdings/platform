import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FirestormGraphQLPanel } from "@/components/graphql-data-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/ui/dialog";
import { Input } from "@workspace/shared-ui/ui/input";
import { Label } from "@workspace/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Textarea } from "@workspace/shared-ui/ui/textarea";
import { Progress } from "@workspace/shared-ui/ui/progress";
import { Shield, Target, AlertTriangle, CheckCircle, Plus, Clock, Trash2, ShieldAlert } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value, duration]);
  return <>{display}</>;
}

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), 100);
    return () => clearTimeout(timer);
  }, [value]);
  return <Progress value={current} className={`${className} transition-all duration-1000`} />;
}

function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-12" />
          </div>
          <div className="skeleton w-10 h-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-3 w-56 mt-2" />
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-3 w-48" />
      </CardContent>
    </Card>
  );
}

export default function AssessmentDashboard() {
  const qc = useQueryClient();
  const { data: assessments = [], isLoading } = useQuery({ queryKey: ["assessments"], queryFn: api.assessments.list });
  const { data: findings = [] } = useQuery({ queryKey: ["findings"], queryFn: () => api.findings.list() });
  const { data: simulations = [] } = useQuery({ queryKey: ["simulations"], queryFn: api.simulations.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", assessmentType: "penetration_test" as string, scope: "", targetEnvironment: "", description: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.assessments.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); setOpen(false); toast.success("Assessment created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.assessments.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); toast.success("Assessment deleted"); },
  });

  const criticalFindings = findings.filter((f: any) => f.severity === "critical");
  const activeAssessments = assessments.filter((a: any) => a.status === "in_progress");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Assessment Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Active engagements, finding severity, and assessment completion pipeline</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Assessment</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Create Assessment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Q1 Network Assessment" /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.assessmentType} onValueChange={v => setForm(p => ({ ...p, assessmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penetration_test">Penetration Test</SelectItem>
                    <SelectItem value="vulnerability_scan">Vulnerability Scan</SelectItem>
                    <SelectItem value="red_team">Red Team</SelectItem>
                    <SelectItem value="blue_team">Blue Team</SelectItem>
                    <SelectItem value="purple_team">Purple Team</SelectItem>
                    <SelectItem value="tabletop">Tabletop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Scope</Label><Input value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))} placeholder="e.g. Internal network, Web apps" /></div>
              <div><Label>Target Environment</Label><Input value={form.targetEnvironment} onChange={e => setForm(p => ({ ...p, targetEnvironment: e.target.value }))} placeholder="e.g. Corporate Network" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Assessment objectives..." rows={3} /></div>
              <Button onClick={() => {
                if (!form.name) { toast.error("Name required"); return; }
                createMut.mutate({ ...form, status: "draft" });
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create Assessment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Assessments</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={assessments.length} /></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-3/20 transition-all duration-300 group ${activeAssessments.length > 0 ? "ring-1 ring-chart-3/10" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={activeAssessments.length} /></p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform ${activeAssessments.length > 0 ? "animate-pulse" : ""}`}>
                    <Clock className="w-5 h-5 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-4/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Findings</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={findings.length} /></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-card border-border animate-fade-in-up stagger-4 hover:border-chart-2/20 transition-all duration-300 group ${criticalFindings.length > 0 ? "ring-1 ring-chart-2/20" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
                    <p className={`text-2xl font-bold font-display mt-1 ${criticalFindings.length > 0 ? "text-chart-2 animate-threat-pulse" : ""}`}>
                      <AnimatedCounter value={criticalFindings.length} />
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform ${criticalFindings.length > 0 ? "animate-pulse" : ""}`}>
                    <AlertTriangle className="w-5 h-5 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <AssessmentSkeleton key={i} />)}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-5">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No assessments yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create one to get started with security testing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assessments.map((assessment: any, i: number) => {
            const aFindings = findings.filter((f: any) => f.assessmentId === assessment.id);
            const aSims = simulations.filter((s: any) => s.assessmentId === assessment.id);
            const critCount = aFindings.filter((f: any) => f.severity === "critical").length;
            const highCount = aFindings.filter((f: any) => f.severity === "high").length;
            const completionPct = assessment.status === "completed" ? 100 : assessment.status === "in_progress" ? 65 : 0;
            const isInProgress = assessment.status === "in_progress";
            const hasCritical = critCount > 0;

            return (
              <Card key={assessment.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${hasCritical ? "ring-1 ring-red-500/10" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">{assessment.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusColors[assessment.status] || ""} ${isInProgress ? "animate-pulse" : ""}`}>
                        {isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse-dot" />}
                        {assessment.status?.replace("_", " ")}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMut.mutate(assessment.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{assessment.assessmentType?.replace("_", " ")}</Badge>
                    {assessment.scope && <span>{assessment.scope}</span>}
                    {assessment.targetEnvironment && <span>{assessment.targetEnvironment}</span>}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {assessment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{assessment.description}</p>
                  )}
                  {completionPct > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{completionPct}%</span>
                      </div>
                      <AnimatedProgress value={completionPct} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {aFindings.length} findings</span>
                    <span className={`flex items-center gap-1 ${hasCritical ? "text-red-400 animate-threat-pulse" : ""}`}>
                      <AlertTriangle className="w-3 h-3" /> {critCount} critical, {highCount} high
                    </span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {aSims.length} exercises</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FirestormGraphQLPanel />
    </div>
  );
}
