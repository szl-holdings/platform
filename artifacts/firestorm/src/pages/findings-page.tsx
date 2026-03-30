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
import { AlertTriangle, Plus, Shield, Bug, CheckCircle, XCircle, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-400 border-red-500/20",
  confirmed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  mitigated: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  false_positive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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

function FindingSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-40" />
          </div>
          <div className="flex gap-2 ml-4">
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-7 w-28 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FindingsPage() {
  const qc = useQueryClient();
  const { data: findings = [], isLoading } = useQuery({ queryKey: ["findings"], queryFn: () => api.findings.list() });
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: api.assessments.list });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", severity: "medium", assessmentId: "", description: "", affectedAsset: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.findings.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["findings"] }); setOpen(false); toast.success("Finding created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.findings.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["findings"] }); toast.success("Finding updated"); },
  });

  const filtered = filter === "all" ? findings : findings.filter((f: any) => f.severity === filter);
  const criticalCount = findings.filter((f: any) => f.severity === "critical").length;
  const highCount = findings.filter((f: any) => f.severity === "high").length;
  const openCount = findings.filter((f: any) => f.status === "open").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Findings</h1>
          <p className="text-sm text-muted-foreground mt-1">Vulnerability findings with CVSS scores, affected assets, proof-of-concept evidence, and remediation status</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Finding</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">New Finding</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. SQL Injection in Login" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assessment</Label>
                  <Select value={form.assessmentId} onValueChange={v => setForm(p => ({ ...p, assessmentId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{assessments.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Affected Asset</Label><Input value={form.affectedAsset} onChange={e => setForm(p => ({ ...p, affectedAsset: e.target.value }))} placeholder="e.g. api.example.com" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the finding..." /></div>
              <Button onClick={() => {
                if (!form.title || !form.assessmentId) { toast.error("Title and assessment required"); return; }
                createMut.mutate({ ...form, assessmentId: Number(form.assessmentId), status: "open" });
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create Finding"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={findings.length} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bug className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-card border-border animate-fade-in-up stagger-2 hover:border-red-500/20 transition-all duration-300 group ${criticalCount > 0 ? "ring-1 ring-red-500/10" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p><p className={`text-2xl font-bold font-display mt-1 text-red-400 ${criticalCount > 0 ? "animate-threat-pulse" : ""}`}><AnimatedCounter value={criticalCount} /></p></div>
            <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${criticalCount > 0 ? "animate-pulse" : ""}`}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-orange-500/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">High</p><p className="text-2xl font-bold font-display mt-1 text-orange-400"><AnimatedCounter value={highCount} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-4 hover:border-chart-3/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Open</p><p className="text-2xl font-bold font-display mt-1 text-chart-3"><AnimatedCounter value={openCount} /></p></div>
            <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5 text-chart-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap animate-fade-in-up stagger-5">
        {["all", "critical", "high", "medium", "low", "info"].map(sev => (
          <Button key={sev} variant={filter === sev ? "default" : "outline"} size="sm" onClick={() => setFilter(sev)}>
            {sev === "all" ? `All (${findings.length})` : `${sev.charAt(0).toUpperCase() + sev.slice(1)} (${findings.filter((f: any) => f.severity === sev).length})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <FindingSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-6">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No findings found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{filter !== "all" ? "Try a different severity filter" : "Findings will appear after assessments are run"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding: any, i: number) => {
            const assessment = assessments.find((a: any) => a.id === finding.assessmentId);
            const isCritical = finding.severity === "critical";
            const isOpen = finding.status === "open";
            return (
              <Card key={finding.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min((i % 6) + 1, 8)} ${isCritical && isOpen ? "ring-1 ring-red-500/10" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{finding.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{finding.description || "No description"}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {assessment && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {assessment.name}</span>}
                        {finding.affectedAsset && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{finding.affectedAsset}</span>}
                        {finding.cvssScore && <span>CVSS: {Number(finding.cvssScore).toFixed(1)}</span>}
                        {finding.cveId && <span className="font-mono">{finding.cveId}</span>}
                      </div>
                      {finding.recommendation && (
                        <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {finding.recommendation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className={`${severityColors[finding.severity] || ""} ${isCritical && isOpen ? "animate-threat-pulse" : ""}`}>
                        {isCritical && isOpen && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse-dot" />}
                        {finding.severity}
                      </Badge>
                      <Select value={finding.status} onValueChange={v => updateMut.mutate({ id: finding.id, data: { status: v } })}>
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="mitigated">Mitigated</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="false_positive">False Positive</SelectItem>
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
