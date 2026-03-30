import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/ui/dialog";
import { Input } from "@workspace/shared-ui/ui/input";
import { Label } from "@workspace/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Textarea } from "@workspace/shared-ui/ui/textarea";
import { Plus, AlertTriangle, Shield, Clock, Users, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusOrder = ["detection", "triage", "investigation", "containment", "remediation", "closed"];
const statusColors: Record<string, string> = {
  detection: "bg-red-500/10 text-red-400 border-red-500/20",
  triage: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  investigation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  containment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  remediation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function IncidentsPage() {
  const qc = useQueryClient();
  const { data: incidents = [], isLoading } = useQuery({ queryKey: ["incidents"], queryFn: api.incidents.list });
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", assignedAnalyst: "", attackTechnique: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.incidents.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); setOpen(false); toast.success("Incident created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.incidents.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Incident updated"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.incidents.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Incident deleted"); },
  });

  const advanceStatus = (incident: any) => {
    const idx = statusOrder.indexOf(incident.status);
    if (idx < statusOrder.length - 1) {
      const nextStatus = statusOrder[idx + 1];
      const updates: any = { status: nextStatus };
      if (nextStatus === "closed") updates.resolvedAt = new Date().toISOString();
      updateMut.mutate({ id: incident.id, data: updates });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Incident Response
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage security incidents through their lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>List</Button>
            <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setView("kanban")}>Kanban</Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Incident</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">Create Incident</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Unauthorized Access Detected" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assigned Analyst</Label><Input value={form.assignedAnalyst} onChange={e => setForm(p => ({ ...p, assignedAnalyst: e.target.value }))} placeholder="e.g. Analyst-1" /></div>
                </div>
                <div><Label>ATT&CK Technique</Label><Input value={form.attackTechnique} onChange={e => setForm(p => ({ ...p, attackTechnique: e.target.value }))} placeholder="e.g. T1566.001" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the incident..." /></div>
                <Button onClick={() => {
                  if (!form.title) { toast.error("Title required"); return; }
                  createMut.mutate({ ...form, status: "detection" });
                }} disabled={createMut.isPending} className="w-full">
                  {createMut.isPending ? "Creating..." : "Create Incident"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        {["detection", "investigation", "containment", "closed"].map(status => {
          const count = incidents.filter((i: any) => i.status === status).length;
          return (
            <Card key={status} className="bg-card border-border hover:border-primary/20 transition-all group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider capitalize">{status}</p>
                  <p className="text-2xl font-bold font-display mt-1">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === "detection" ? "bg-red-500/10" : status === "closed" ? "bg-emerald-500/10" : "bg-primary/10"} group-hover:scale-110 transition-transform`}>
                  {status === "detection" ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                   status === "closed" ? <Shield className="w-5 h-5 text-emerald-400" /> :
                   <Clock className="w-5 h-5 text-primary" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-6 gap-3 overflow-x-auto animate-fade-in-up stagger-2">
          {statusOrder.map(status => (
            <div key={status} className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={statusColors[status]}>{status}</Badge>
                <span className="text-xs text-muted-foreground">({incidents.filter((i: any) => i.status === status).length})</span>
              </div>
              <div className="space-y-2">
                {incidents.filter((i: any) => i.status === status).map((incident: any) => (
                  <Card key={incident.id} className={`bg-card border-border hover:border-primary/20 transition-all cursor-pointer ${incident.severity === "critical" ? "ring-1 ring-red-500/10" : ""}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-xs font-semibold line-clamp-2">{incident.title}</h4>
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => deleteMut.mutate(incident.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${severityColors[incident.severity]}`}>{incident.severity}</Badge>
                      {incident.assignedAnalyst && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> {incident.assignedAnalyst}
                        </p>
                      )}
                      {status !== "closed" && (
                        <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px]" onClick={() => advanceStatus(incident)}>
                          Advance <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in-up stagger-2">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="skeleton h-16 w-full" /></CardContent></Card>
            ))
          ) : incidents.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-16 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No incidents recorded</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create an incident to begin tracking</p>
              </CardContent>
            </Card>
          ) : (
            incidents.map((incident: any) => (
              <Card key={incident.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 ${incident.severity === "critical" && incident.status !== "closed" ? "ring-1 ring-red-500/10" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{incident.title}</h3>
                      </div>
                      {incident.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{incident.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {incident.assignedAnalyst && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {incident.assignedAnalyst}</span>}
                        {incident.attackTechnique && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{incident.attackTechnique}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(incident.detectedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className={severityColors[incident.severity] || ""}>{incident.severity}</Badge>
                      <Select value={incident.status} onValueChange={v => {
                        const updates: any = { status: v };
                        if (v === "closed") updates.resolvedAt = new Date().toISOString();
                        updateMut.mutate({ id: incident.id, data: updates });
                      }}>
                        <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOrder.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMut.mutate(incident.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
