import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Shield, Target, AlertTriangle, CheckCircle, Plus, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const scopeLabels: Record<string, string> = {
  network: "Network",
  application: "Application",
  infrastructure: "Infrastructure",
  social_engineering: "Social Engineering",
  physical: "Physical Security",
  full: "Full Scope",
};

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Assessment Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Security assessments and simulation overview</p>
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
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Assessments</p>
                <p className="text-2xl font-bold font-display mt-1">{assessments.length}</p>
              </div>
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold font-display mt-1">{activeAssessments.length}</p>
              </div>
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Findings</p>
                <p className="text-2xl font-bold font-display mt-1">{findings.length}</p>
              </div>
              <Target className="w-5 h-5 text-chart-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
                <p className="text-2xl font-bold font-display mt-1 text-chart-2">{criticalFindings.length}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-chart-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No assessments yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assessments.map((assessment: any) => {
            const aFindings = findings.filter((f: any) => f.assessmentId === assessment.id);
            const aSims = simulations.filter((s: any) => s.assessmentId === assessment.id);
            const critCount = aFindings.filter((f: any) => f.severity === "critical").length;
            const highCount = aFindings.filter((f: any) => f.severity === "high").length;
            const completionPct = assessment.status === "completed" ? 100 : assessment.status === "in_progress" ? 65 : 0;

            return (
              <Card key={assessment.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">{assessment.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[assessment.status] || ""}>{assessment.status?.replace("_", " ")}</Badge>
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
                      <Progress value={completionPct} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {aFindings.length} findings</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {critCount} critical, {highCount} high</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {aSims.length} simulations</span>
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
