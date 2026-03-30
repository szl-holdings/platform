import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/ui/dialog";
import { Input } from "@workspace/shared-ui/ui/input";
import { Label } from "@workspace/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Textarea } from "@workspace/shared-ui/ui/textarea";
import { Target, Plus, Trash2, Shield, Zap, AlertTriangle, Globe, Server, Users, Lock, Link2, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  network: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  application: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  social_engineering: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  physical: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  insider_threat: "bg-red-500/10 text-red-400 border-red-500/20",
  supply_chain: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const severityColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const categoryLabels: Record<string, string> = {
  network: "Network",
  application: "Application",
  social_engineering: "Social Engineering",
  physical: "Physical Security",
  insider_threat: "Insider Threat",
  supply_chain: "Supply Chain",
};

const categoryIcons: Record<string, any> = {
  network: Globe,
  application: Server,
  social_engineering: Users,
  physical: Building,
  insider_threat: Lock,
  supply_chain: Link2,
};

function ScenarioSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-lg" />
          <div className="skeleton h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScenarioLibrary() {
  const qc = useQueryClient();
  const { data: scenarios = [], isLoading } = useQuery({ queryKey: ["scenarios"], queryFn: api.scenarios.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "network", severity: "medium", description: "" });
  const [filter, setFilter] = useState<string>("all");

  const createMut = useMutation({
    mutationFn: (data: any) => api.scenarios.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scenarios"] }); setOpen(false); toast.success("Scenario created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.scenarios.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scenarios"] }); toast.success("Scenario deleted"); },
  });

  const filtered = filter === "all" ? scenarios : scenarios.filter((s: any) => s.category === filter);
  const categories = [...new Set(scenarios.map((s: any) => s.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Scenario Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Curated attack playbooks — ransomware, lateral movement, data exfiltration, and privilege escalation scenarios</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Scenario</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Create Scenario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Phishing Campaign — APT28 TTP" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Scenario description..." rows={3} /></div>
              <Button onClick={() => {
                if (!form.name) { toast.error("Name required"); return; }
                createMut.mutate(form);
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create Scenario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap animate-fade-in-up stagger-1">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All ({scenarios.length})</Button>
        {categories.map((cat: string) => {
          const CatIcon = categoryIcons[cat] || Target;
          return (
            <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)} className="gap-1.5">
              <CatIcon className="w-3.5 h-3.5" />
              {categoryLabels[cat] || cat} ({scenarios.filter((s: any) => s.category === cat).length})
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <ScenarioSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-2">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No scenarios found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{filter !== "all" ? "Try a different filter or create a new scenario" : "Create your first scenario to get started"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((scenario: any, i: number) => {
            const CatIcon = categoryIcons[scenario.category] || Target;
            const isCritical = scenario.severity === "critical";
            const catBgColor = categoryColors[scenario.category]?.split(" ")[0] || "bg-primary/10";
            return (
              <Card key={scenario.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up stagger-${Math.min((i % 6) + 1, 8)} ${isCritical ? "ring-1 ring-red-500/10" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${catBgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <CatIcon className={`w-4.5 h-4.5 ${categoryColors[scenario.category]?.split(" ")[1] || "text-primary"}`} />
                      </div>
                      <CardTitle className="text-sm font-display leading-tight">{scenario.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMut.mutate(scenario.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description || "No description"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={categoryColors[scenario.category] || ""}>
                      {categoryLabels[scenario.category] || scenario.category}
                    </Badge>
                    <Badge variant="outline" className={`${severityColors[scenario.severity] || ""} ${isCritical ? "animate-threat-pulse" : ""}`}>
                      {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse-dot" />}
                      {scenario.severity}
                    </Badge>
                  </div>
                  {scenario.attackVector && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Zap className="w-3 h-3 text-primary" />
                      <span>{scenario.attackVector}</span>
                    </div>
                  )}
                  {scenario.mitreTechnique && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Shield className="w-3 h-3 text-primary" />
                      <span>MITRE: {scenario.mitreTechnique}</span>
                    </div>
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
