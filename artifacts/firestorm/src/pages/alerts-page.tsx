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
import { Bell, Plus, AlertTriangle, CheckCircle, Eye, XCircle, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const statusColors: Record<string, string> = {
  new: "bg-red-500/10 text-red-400 border-red-500/20",
  acknowledged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  investigating: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  dismissed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function AnimatedCounter({ value }: { value: number }) {
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
      const progress = Math.min(elapsed / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value]);
  return <>{display}</>;
}

export default function AlertsPage() {
  const qc = useQueryClient();
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: () => api.alerts.list() });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", source: "manual", relatedCve: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.alerts.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); setOpen(false); toast.success("Alert created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.alerts.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); toast.success("Alert updated"); },
  });

  const filtered = filter === "all" ? alerts : alerts.filter((a: any) => a.status === filter);
  const newCount = alerts.filter((a: any) => a.status === "new").length;
  const criticalCount = alerts.filter((a: any) => a.severity === "critical" && a.status !== "resolved" && a.status !== "dismissed").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Alert Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Security alerts and notification management</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Create Alert</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">New Alert</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Critical CVE detected in production" /></div>
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
                <div>
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="threat_intel">Threat Intel</SelectItem>
                      <SelectItem value="risk_threshold">Risk Threshold</SelectItem>
                      <SelectItem value="incident_escalation">Incident Escalation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Related CVE</Label><Input value={form.relatedCve} onChange={e => setForm(p => ({ ...p, relatedCve: e.target.value }))} placeholder="e.g. CVE-2024-12345" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Alert details..." /></div>
              <Button onClick={() => {
                if (!form.title) { toast.error("Title required"); return; }
                createMut.mutate(form);
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={alerts.length} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-card border-border hover:border-red-500/20 transition-all group ${newCount > 0 ? "ring-1 ring-red-500/10" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">New</p><p className={`text-2xl font-bold font-display mt-1 ${newCount > 0 ? "text-red-400 animate-threat-pulse" : ""}`}><AnimatedCounter value={newCount} /></p></div>
            <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${newCount > 0 ? "animate-pulse" : ""}`}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-orange-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p><p className="text-2xl font-bold font-display mt-1 text-orange-400"><AnimatedCounter value={criticalCount} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Resolved</p><p className="text-2xl font-bold font-display mt-1 text-emerald-400"><AnimatedCounter value={alerts.filter((a: any) => a.status === "resolved").length} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap animate-fade-in-up stagger-2">
        {["all", "new", "acknowledged", "investigating", "resolved", "dismissed"].map(status => (
          <Button key={status} variant={filter === status ? "default" : "outline"} size="sm" onClick={() => setFilter(status)}>
            {status === "all" ? `All (${alerts.length})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${alerts.filter((a: any) => a.status === status).length})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="skeleton h-16 w-full" /></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-3">
          <CardContent className="p-16 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No alerts found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{filter !== "all" ? "Try a different filter" : "Create alerts to start monitoring"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-fade-in-up stagger-3">
          {filtered.map((alert: any) => {
            const isCritical = alert.severity === "critical" && alert.status !== "resolved" && alert.status !== "dismissed";
            return (
              <Card key={alert.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 ${isCritical ? "ring-1 ring-red-500/10" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                      </div>
                      {alert.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{alert.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.source && <Badge variant="outline" className="text-xs">{alert.source.replace("_", " ")}</Badge>}
                        {alert.relatedCve && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{alert.relatedCve}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className={`${severityColors[alert.severity] || ""} ${isCritical ? "animate-threat-pulse" : ""}`}>
                        {alert.severity}
                      </Badge>
                      {alert.status === "new" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateMut.mutate({ id: alert.id, data: { status: "acknowledged" } })}>
                          <Eye className="w-3 h-3 mr-1" /> Acknowledge
                        </Button>
                      )}
                      <Select value={alert.status} onValueChange={v => updateMut.mutate({ id: alert.id, data: { status: v } })}>
                        <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
